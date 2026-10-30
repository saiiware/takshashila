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

// Domain synonym map for crochet craft concepts (covering English, Romanized Marathi, and Devanagari)
const SYNONYMS: Record<string, string[]> = {
  crochet: ["crochet", "hook", "stitch", "loop", "yarn", "krosha", "crosha", "विणकाम", "क्रोशे"],
  crocheting: ["crochet", "hook", "stitch", "loop", "yarn"],
  crosha: ["crochet", "hook", "needle", "krosha", "क्रोशे"],
  krosha: ["crochet", "hook", "needle", "क्रोशे"],
  suchita: ["suchita", "artist", "dentist", "सुचिता"],
  dentist: ["suchita", "artist", "dentist"],
  artist: ["suchita", "artist", "crochet"],

  // Materials & Tools
  materi: ["materi", "yarn", "hook", "scissor", "needle", "tapestri", "sahitya"],
  material: ["materi", "yarn", "hook", "scissor", "needle", "tapestri", "sahitya"],
  materials: ["materi", "yarn", "hook", "scissor", "needle", "tapestri", "sahitya"],
  sahitya: ["materi", "yarn", "hook", "scissor", "needle", "tapestri"],
  yarn: ["yarn", "acrylic", "ganga", "olivia", "ball", "thread", "lokar", "dhaga", "यान"],
  acrylic: ["acrylic", "yarn", "ganga", "olivia", "beginner", "अक्रिलिक"],
  ganga: ["ganga", "olivia", "yarn", "company", "गंगा"],
  olivia: ["ganga", "olivia", "yarn", "allivia", "ऑलिव्हिया"],
  hook: ["hook", "crochet", "needle", "size", "4.5mm", "4mm", "sui", "हुक"],
  hooks: ["hook", "crochet", "needle", "size"],
  needle: ["hook", "crochet", "needle", "tapestri", "sui"],
  tapestry: ["tapestri", "needle", "finish", "hide", "thread", "tail", "टेपेस्ट्री"],
  scissor: ["scissor", "scissors", "cut", "snip", "kaitri"],
  scissors: ["scissor", "scissors", "cut", "snip", "kaitri"],

  // Stitches
  chain: ["chain", "ch", "loop", "starter", "foundation", "चेन"],
  chains: ["chain", "ch", "loop"],
  single: ["single", "sc", "stitch", "loop", "सिंगल"],
  half: ["half", "hdc", "double", "three", "loops", "हाफ"],
  double: ["double", "dc", "stitch", "7", "steps", "डबल"],
  treble: ["treble", "triple", "tr", "twice", "wrap", "ट्रिपल"],
  triple: ["treble", "triple", "tr", "twice", "wrap"],
  stitch: ["stitch", "loop", "chain", "single", "double", "half", "treble", "taka", "take"],
  stitches: ["stitch", "loop", "chain", "single", "double"],
  slip: ["slip", "knot", "stitch", "loop", "sl", "st", "स्लिप"],
  knot: ["slip", "knot", "loop", "start", "gath"],
  loop: ["loop", "stitch", "chain", "hook", "लूप"],
  loops: ["loop", "stitch", "chain", "hook"],

  // Shapes & Concepts
  heart: ["heart", "cute", "magic", "ring", "episode", "4", "lobe", "point", "हार्ट"],
  pentagon: ["pentagon", "five", "sides", "corners", "magic", "ring", "round", "episode", "3", "पंचकोन", "पाच"],
  hexagon: ["hexagon", "six", "sides", "corners", "magic", "ring", "round", "episode", "2", "षटकोन", "सहा"],
  shape: ["shape", "heart", "pentagon", "hexagon", "circle", "square", "आकार"],
  shapes: ["shape", "heart", "pentagon", "hexagon", "circle", "square"],
  magic: ["magic", "ring", "circle", "start", "center", "hole", "मॅजिक", "रिंग"],
  ring: ["magic", "ring", "circle", "start", "center"],
  corner: ["corner", "corners", "gap", "space", "chain", "expansion", "कोपरा", "कॉर्नर"],
  corners: ["corner", "corners", "gap", "space", "chain"],
  side: ["side", "sides", "pentagon", "hexagon", "बाजू"],
  sides: ["side", "sides", "pentagon", "hexagon"],
  round: ["round", "rounds", "first", "second", "third", "राऊंड"],
  rounds: ["round", "rounds", "first", "second", "third"],
  finish: ["finish", "finishing", "tapestri", "hide", "weave", "cut", "फिनिशिंग"],

  // Stitching, Sewing & Craft Concepts
  sew: ["sew", "stitch", "needle", "tapestri", "finish", "join", "शिलाई"],
  sewing: ["sew", "stitch", "needle", "tapestri", "finish", "join", "शिलाई"],
  knit: ["knit", "crochet", "yarn", "needle", "stitch", "विणकाम"],
  knitting: ["knit", "crochet", "yarn", "needle", "stitch", "विणकाम"],
  vinane: ["knit", "crochet", "yarn", "विणकाम"],

  // Colors & Palette Styling
  color: ["color", "colour", "shade", "palette", "yarn", "contrast", "rang", "रंग"],
  colour: ["color", "colour", "shade", "palette", "yarn", "contrast", "rang", "रंग"],
  shade: ["color", "colour", "shade", "palette", "yarn"],
  palette: ["color", "colour", "shade", "palette", "yarn"],
  contrast: ["color", "colour", "contrast", "palette"],
  combination: ["combination", "match", "pair", "palette", "sobat"],
  rang: ["color", "colour", "shade", "रंग"],
  grey: ["grey", "gray", "silver", "charcoal", "neutral", "राखाडी", "ग्रे"],
  gray: ["grey", "gray", "silver", "charcoal", "neutral", "राखाडी", "ग्रे"],
  pink: ["pink", "rose", "blush", "pastel", "गुलाबी"],
  yellow: ["yellow", "mustard", "gold", "पिवळा"],
  blue: ["blue", "navy", "sky", "teal", "निळा"],
  white: ["white", "cream", "ivory", "पांढरा"],
  black: ["black", "charcoal", "dark", "काळा"],

  // Indic query terms
  kashi: ["how", "step"],
  kasa: ["how", "step"],
  kase: ["how", "step"],
  banvaychi: ["make", "start", "create"],
  banvaycha: ["make", "start", "create"],
  karnar: ["do", "make", "create"],
  pahije: ["need", "requir", "want"],
  lagte: ["need", "requir", "tool"],
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

    this.avgDocLength = N > 0 ? totalLength / N : 1.0;

    for (const [token, df] of Object.entries(docFreq)) {
      const rawIdf = Math.log(1.0 + (N - df + 0.5) / (df + 0.5));
      this.idf[token] = Math.max(1.0, rawIdf);
    }
  }

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

  private computeDenseScore(queryBigrams: Set<string>, chunkBigrams: Set<string>): number {
    if (queryBigrams.size === 0 || chunkBigrams.size === 0) return 0;
    let overlap = 0;
    for (const bg of queryBigrams) {
      if (chunkBigrams.has(bg)) overlap++;
    }
    return (2 * overlap) / (queryBigrams.size + chunkBigrams.size);
  }

  private getDefinitionalBoost(
    question: string,
    chunk: KnowledgeChunk,
    targetVideoOrder: number | null = null
  ): number {
    const qLower = question.toLowerCase();

    // Part 1 Stitch queries
    if (qLower.includes("chain") || qLower.includes("चेन")) {
      if (chunk.id === "p1-c3-chain-stitch") return 3.5;
    }
    if (qLower.includes("single crochet") || qLower.includes("सिंगल क्रोशे")) {
      if (chunk.id === "p1-c4-single-crochet") return 3.5;
    }
    if (qLower.includes("half double") || qLower.includes("hdc") || qLower.includes("हाफ डबल")) {
      if (chunk.id === "p1-c5-half-double-crochet") return 3.5;
    }
    if (qLower.includes("double crochet") || qLower.includes("7 steps") || qLower.includes("डबल क्रोशे")) {
      if (chunk.id === "p1-c6-double-crochet") return 3.5;
    }

    // Part 2 Heart queries
    if (qLower.includes("heart") || qLower.includes("हार्ट") || qLower.includes("cute heart")) {
      if (chunk.docId === "part-2") return 3.5;
      if (chunk.id === "p2-c3-chain3-treble" || chunk.id === "p2-c4-dc-bottom-point") return 4.0;
    }

    // Part 3 Pentagon queries
    if (qLower.includes("pentagon") || qLower.includes("पंचकोन") || qLower.includes("5 sides") || qLower.includes("५ बाजू")) {
      if (chunk.docId === "part-3") return 3.5;
      if (chunk.id === "p3-c4-round3-crucial-step") return 4.0;
    }

    // Part 4 Hexagon queries
    if (qLower.includes("hexagon") || qLower.includes("षटकोन") || qLower.includes("6 sides") || qLower.includes("६ बाजू")) {
      if (chunk.docId === "part-4") return 3.5;
      if (chunk.id === "p4-c4-round3-crucial-step") return 4.0;
    }

    // Magic Ring queries
    if (qLower.includes("magic ring") || qLower.includes("magic circle") || qLower.includes("मॅजिक रिंग")) {
      if (chunk.id === "p2-c2-magic-ring" || chunk.id === "p3-c2-round1" || chunk.id === "p4-c2-round1") return 3.2;
    }

    // Materials / Yarn / Hook queries
    if (qLower.includes("yarn") || qLower.includes("hook") || qLower.includes("ganga") || qLower.includes("olivia") || qLower.includes("साहित्य")) {
      if (targetVideoOrder === 1 && chunk.id === "p1-c1-intro-materials") return 3.0;
      if (targetVideoOrder === 2 && chunk.id === "p2-c1-heart-materials") return 3.0;
      if (targetVideoOrder === 3 && chunk.id === "p3-c1-pentagon-intro") return 3.0;
      if (targetVideoOrder === 4 && chunk.id === "p4-c1-hexagon-intro") return 3.0;
    }

    return 1.0;
  }

  public retrieve(params: RetrievalQuery): RetrievalResult {
    const { question, videoId, topK = 3, minScoreThreshold = 0.15 } = params;
    const rawTokens = tokenize(question);
    const queryTokens = rawTokens.map(stem);
    const expandedTokens = this.expandQuery(queryTokens, rawTokens);
    const queryBigrams = extractCharBigrams(question);

    let targetVideoOrder: number | null = null;
    if (videoId) {
      const match = videoId.match(/video-?(\d+)/i) || videoId.match(/part-?(\d+)/i);
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

      // Context boost when user is watching a specific part
      let contextMultiplier = 1.0;
      if (targetVideoOrder !== null && chunk.videoOrder === targetVideoOrder) {
        contextMultiplier = 1.6;
      }

      // Definitional & shape intent boost
      const defBoost = this.getDefinitionalBoost(question, chunk, targetVideoOrder);

      const combinedScore = (bm25 * 0.7 + dense * 10 * 0.3) * contextMultiplier * defBoost;
      const normalizedScore = Math.min(1.0, combinedScore / 10);

      if (normalizedScore >= minScoreThreshold && (matchedTerms.length > 0 || dense > 0.05)) {
        scored.push({
          chunk,
          score: Math.round(normalizedScore * 1000) / 1000,
          bm25Score: Math.round(bm25 * 100) / 100,
          denseScore: Math.round(dense * 100) / 100,
          matchedTerms,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

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
