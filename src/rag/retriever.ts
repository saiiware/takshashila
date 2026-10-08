import {
  buildKnowledgeIndex,
  extractCharBigrams,
  stem,
  tokenize,
  type KnowledgeChunk,
} from "./chunker";

export interface RetrievedChunk {
  chunk: KnowledgeChunk;
  score: number;
  bm25Score: number;
  denseScore: number;
  matchedTerms: string[];
}

export interface RetrievalResult {
  allRetrieved: RetrievedChunk[];
  deduplicatedChunks: RetrievedChunk[];
}

export interface RetrievalQuery {
  question: string;
  videoId?: string | null;
  topK?: number;
  minScoreThreshold?: number;
}

// Domain synonym map for knitting craft concepts
const SYNONYMS: Record<string, string[]> = {
  knit: ["knit", "craft", "needl", "yarn"],
  knitting: ["knit", "craft", "needl", "yarn"],
  materi: ["materi", "yarn", "needl", "tool", "wool", "cotton"],
  material: ["materi", "yarn", "needl", "tool", "wool", "cotton"],
  materials: ["materi", "yarn", "needl", "tool", "wool", "cotton"],
  requir: ["requir", "need", "tool", "materi", "yarn"],
  require: ["requir", "need", "tool", "materi", "yarn"],
  required: ["requir", "need", "tool", "materi", "yarn"],
  need: ["need", "requir", "tool", "materi", "yarn"],
  needs: ["need", "requir", "tool", "materi", "yarn"],
  tool: ["tool", "needl", "scissor", "measur", "marker", "yarn"],
  tools: ["tool", "needl", "scissor", "measur", "marker", "yarn"],
  yarn: ["yarn", "wool", "cotton", "thread"],
  wool: ["wool", "yarn", "warm", "winter", "sweater"],
  cotton: ["cotton", "yarn", "light", "summer", "warm"],
  needle: ["needl", "metal", "wood", "plastic", "size"],
  needles: ["needl", "metal", "wood", "plastic", "size"],
  needl: ["needl", "metal", "wood", "plastic", "size"],
  knot: ["slip", "knot", "loop"],
  knots: ["slip", "knot", "loop"],
  start: ["first", "slip", "knot", "loop", "needl", "start"],
  begin: ["first", "slip", "knot", "loop", "needl", "start"],
  tight: ["tightli", "even", "tension", "stitch"],
  tightly: ["tightli", "even", "tension", "stitch"],
  loose: ["tightli", "even", "tension", "stitch"],
  tension: ["tightli", "even", "loop", "stitch"],
  stitch: ["stitch", "loop", "row", "fabric"],
  stitches: ["stitch", "loop", "row", "fabric"],
  present: ["present", "exhibit", "social", "media", "share", "attract"],
  presentation: ["present", "exhibit", "social", "media", "share", "attract"],
  product: ["product", "sweater", "scarf", "cap", "bag", "make"],
  products: ["product", "sweater", "scarf", "cap", "bag", "make"],
};

export class HybridRetriever {
  private chunks: KnowledgeChunk[];
  private idf: Record<string, number> = {};
  private avgDocLength: number = 0;
  private k1: number = 1.2;
  private b: number = 0.75;

  constructor() {
    this.chunks = buildKnowledgeIndex();
    this.computeCorpusStats();
  }

  /**
   * Pre-calculates BM25 Inverse Document Frequency (IDF) with an IDF floor
   * so high-DF domain terms (like 'knit', 'yarn') in a focused craft corpus are not penalized to zero.
   */
  private computeCorpusStats(): void {
    const N = this.chunks.length;
    let totalLength = 0;
    const docFreq: Record<string, number> = {};

    for (const chunk of this.chunks) {
      totalLength += chunk.length;
      const seenTokens = new Set<string>();
      for (const token of chunk.tokens) {
        if (!seenTokens.has(token)) {
          seenTokens.add(token);
          docFreq[token] = (docFreq[token] || 0) + 1;
        }
      }
    }

    this.avgDocLength = N > 0 ? totalLength / N : 1;

    for (const [token, df] of Object.entries(docFreq)) {
      const rawIdf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      // In small corpora, domain-essential terms must not be suppressed
      this.idf[token] = Math.max(1.0, rawIdf);
    }
  }

  /**
   * Expands query terms with domain-specific synonyms checking both raw and stemmed words.
   */
  private expandQuery(stemmedTokens: string[], rawTokens: string[]): string[] {
    const expanded = new Set<string>(stemmedTokens);
    for (const token of [...rawTokens, ...stemmedTokens]) {
      const syns = SYNONYMS[token] || SYNONYMS[stem(token)];
      if (syns) {
        for (const s of syns) {
          expanded.add(stem(s));
        }
      }
    }
    return Array.from(expanded);
  }

  /**
   * Calculates dense Dice bigram similarity.
   */
  private computeDenseScore(queryBigrams: Set<string>, chunkBigrams: Set<string>): number {
    if (queryBigrams.size === 0 || chunkBigrams.size === 0) return 0;
    let overlap = 0;
    for (const bg of queryBigrams) {
      if (chunkBigrams.has(bg)) overlap++;
    }
    return (2 * overlap) / (queryBigrams.size + chunkBigrams.size);
  }

  /**
   * Detects definitional intent (e.g. "what is knitting", "define yarn", "what is a slip knot").
   */
  private getDefinitionalBoost(question: string, chunk: KnowledgeChunk): number {
    const qLower = question.toLowerCase();
    const isDefinitional =
      qLower.includes("what is") ||
      qLower.includes("what are") ||
      qLower.includes("define") ||
      qLower.includes("meaning of") ||
      qLower.includes("explain");

    if (!isDefinitional) return 1.0;

    // What is knitting? -> Boost chunk 1 of video 1
    if (qLower.includes("knitting") && chunk.id === "v1-c1-definition") {
      return 2.5;
    }
    // What is yarn? / What is material knowledge? -> Boost chunk 1 of video 2
    if ((qLower.includes("yarn") || qLower.includes("material")) && chunk.id === "v2-c1-yarn-materials") {
      return 2.2;
    }
    // What is a slip knot? -> Boost chunk 1 of video 3
    if (qLower.includes("slip knot") && chunk.id === "v3-c1-slip-knot-start") {
      return 2.2;
    }
    // What are needles? -> Boost chunk 2 of video 2
    if (qLower.includes("needle") && chunk.id === "v2-c2-needles") {
      return 2.2;
    }

    return 1.0;
  }

  /**
   * Retrieves matching chunks using BM25 + dense scoring, removes duplicates,
   * and limits to the 2–3 most relevant unique chunks.
   */
  public retrieve(params: RetrievalQuery): RetrievalResult {
    const { question, videoId, topK = 3, minScoreThreshold = 0.20 } = params;
    const rawTokens = tokenize(question);
    const queryTokens = rawTokens.map(stem);
    const expandedTokens = this.expandQuery(queryTokens, rawTokens);
    const queryBigrams = extractCharBigrams(question);

    let targetVideoOrder: number | null = null;
    if (videoId) {
      const match = videoId.match(/video-?(\d+)/i);
      if (match) {
        targetVideoOrder = parseInt(match[1], 10);
      }
    }

    const scored: RetrievedChunk[] = [];

    for (const chunk of this.chunks) {
      let bm25 = 0;
      const matchedTerms: string[] = [];

      for (const term of expandedTokens) {
        const tf = chunk.tokenFrequencies[term] || 0;
        if (tf > 0) {
          matchedTerms.push(term);
          const termIdf = this.idf[term] ?? 1.2;
          const numerator = tf * (this.k1 + 1);
          const denominator =
            tf + this.k1 * (1 - this.b + this.b * (chunk.length / this.avgDocLength));
          bm25 += termIdf * (numerator / denominator);
        }
      }

      const dense = this.computeDenseScore(queryBigrams, chunk.charBigrams);

      // Context boost if user is inside a specific video
      let contextMultiplier = 1.0;
      if (targetVideoOrder !== null && chunk.videoOrder === targetVideoOrder) {
        contextMultiplier = 1.25;
      }

      // Definitional intent boost
      const defBoost = this.getDefinitionalBoost(question, chunk);

      const combinedScore = (bm25 * 0.7 + dense * 10 * 0.3) * contextMultiplier * defBoost;
      const normalizedScore = Math.min(1.0, combinedScore / 10);

      // Must have matched terms and score above threshold
      if (normalizedScore >= minScoreThreshold && matchedTerms.length > 0) {
        scored.push({
          chunk,
          score: Math.round(normalizedScore * 1000) / 1000,
          bm25Score: Math.round(bm25 * 100) / 100,
          denseScore: Math.round(dense * 100) / 100,
          matchedTerms,
        });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Deduplication step
    const deduplicatedChunks: RetrievedChunk[] = [];
    const seenChunkIds = new Set<string>();

    for (const item of scored) {
      if (seenChunkIds.has(item.chunk.id)) continue;
      seenChunkIds.add(item.chunk.id);
      deduplicatedChunks.push(item);
      if (deduplicatedChunks.length >= topK) break;
    }

    return {
      allRetrieved: scored,
      deduplicatedChunks,
    };
  }
}

export const retrieverInstance = new HybridRetriever();
