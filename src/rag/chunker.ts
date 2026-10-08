import { KNITTING_DOCUMENTS, type KnowledgeDocument } from "./documents";

export interface KnowledgeChunk {
  id: string;
  docId: string;
  videoOrder: number;
  videoTitle: string;
  sourceFile: string;
  title: string;
  content: string;
  tokens: string[];
  tokenFrequencies: Record<string, number>;
  charBigrams: Set<string>;
  length: number;
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can", "can't", "cannot", "could", "did", "do", "does", "doing", "don't", "down",
  "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "her",
  "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is",
  "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
  "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there",
  "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
  "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "with", "won't", "would", "you", "your", "yours", "yourself", "yourselves"
]);

/**
 * Normalizes text, tokenizes into lower-case words and stems common suffixes.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Light stemmer for English terms (e.g. knitting -> knit, needles -> needle, stitches -> stitch)
 */
export function stem(word: string): string {
  if (word === "knitting" || word === "knitted" || word === "knit") return "knit";
  if (word === "needles" || word === "needle") return "needl";
  if (word === "yarns" || word === "yarn") return "yarn";
  if (word === "loops" || word === "loop") return "loop";
  if (word === "stitches" || word === "stitch") return "stitch";
  if (word === "materials" || word === "material") return "materi";
  if (word === "fabrics" || word === "fabric") return "fabric";
  if (word === "tools" || word === "tool") return "tool";

  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  return word;
}

/**
 * Extracts character bigrams for dense fuzzy/sub-string matching.
 */
export function extractCharBigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const bigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.add(normalized.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * Pre-defined, semantically coherent chunks crafted directly from video1.txt, video2.txt, video3.txt.
 * This guarantees every core concept (definitions, materials, needles, tools, slip knot, loop formation, presentation)
 * has an intact, high-quality chunk with clear topical anchors.
 */
export function buildKnowledgeIndex(): KnowledgeChunk[] {
  const definitions: Array<{
    id: string;
    docId: string;
    videoOrder: number;
    videoTitle: string;
    sourceFile: string;
    title: string;
    content: string;
  }> = [
    // --- VIDEO 1: INTRODUCTION, DEFINITION & PRESENTATION ---
    {
      id: "v1-c1-definition",
      docId: "video-1",
      videoOrder: 1,
      videoTitle: "Lesson 1: Introduction to Knitting & Presentation",
      sourceFile: "video1.txt",
      title: "What is Knitting and Creative Skills",
      content:
        "Knitting is a creative skill where we use yarn and needles to make different products like sweaters, scarves, caps, bags, and many more things. It is the magic of turning a simple ball of yarn into something beautiful and useful. Knitting is not only fun, but it also helps us develop patience, creativity, and practical livelihood skills.",
    },
    {
      id: "v1-c2-presentation",
      docId: "video-1",
      videoOrder: 1,
      videoTitle: "Lesson 1: Introduction to Knitting & Presentation",
      sourceFile: "video1.txt",
      title: "Presenting, Sharing, and Showcasing Knitted Items",
      content:
        "Making a product is only one part; how we present and share it is equally important. We can make our knitted products attractive by keeping them neat, showing their unique designs, and explaining how they were made. We can display them at exhibitions, share them on social media, or show them to our friends and family. Knitting is a way to create, express, and share our ideas with others.",
    },

    // --- VIDEO 2: MATERIALS, NEEDLES, TOOLS & QUALITY ---
    {
      id: "v2-c1-yarn-materials",
      docId: "video-2",
      videoOrder: 2,
      videoTitle: "Lesson 2: Materials & Tools Knowledge",
      sourceFile: "video2.txt",
      title: "Material Knowledge: Yarn Types, Wool vs Cotton",
      content:
        "Material Knowledge in knitting means understanding the different materials and tools needed to create knitted products. The main material used is yarn, which is available in different types, colors, thicknesses, and textures. Wool yarn is warm and is often used for sweaters and winter clothes, while cotton yarn is lighter and more suitable for items used in warmer weather.",
    },
    {
      id: "v2-c2-needles",
      docId: "video-2",
      videoOrder: 2,
      videoTitle: "Lesson 2: Materials & Tools Knowledge",
      sourceFile: "video2.txt",
      title: "Knitting Needles: Materials and Size Selection",
      content:
        "Another important material is knitting needles. Needles come in different sizes and can be made from materials such as metal, wood, or plastic. The size of the needle is usually selected based on the thickness of the yarn and the type of product being made.",
    },
    {
      id: "v2-c3-tools",
      docId: "video-2",
      videoOrder: 2,
      videoTitle: "Lesson 2: Materials & Tools Knowledge",
      sourceFile: "video2.txt",
      title: "Essential Knitting Tools and Accessories",
      content:
        "Knitting also requires other tools such as scissors, measuring tapes, stitch markers, and yarn needles. Each tool has a specific purpose and helps make the knitting process easier and more accurate.",
    },
    {
      id: "v2-c4-quality-durability",
      docId: "video-2",
      videoOrder: 2,
      videoTitle: "Lesson 2: Materials & Tools Knowledge",
      sourceFile: "video2.txt",
      title: "Combining Materials for Quality, Comfort and Durability",
      content:
        "Understanding these materials helps us choose the right combination of yarn, needles, and tools for a particular project. It also improves the quality, appearance, comfort, and durability of the final knitted product. Therefore, having proper material knowledge is an important part of successful knitting.",
    },

    // --- VIDEO 3: STEP-BY-STEP KNITTING PROCESS ---
    {
      id: "v3-c1-slip-knot-start",
      docId: "video-3",
      videoOrder: 3,
      videoTitle: "Lesson 3: Basic Process — Slip Knot to Fabric",
      sourceFile: "video3.txt",
      title: "Starting with a Slip Knot on the Needle",
      content:
        "First, take the yarn and make a small loop called a slip knot. Place this loop on one knitting needle. Now, take the second needle and insert it into the loop.",
    },
    {
      id: "v3-c2-making-loops-tension",
      docId: "video-3",
      videoOrder: 3,
      videoTitle: "Lesson 3: Basic Process — Slip Knot to Fabric",
      sourceFile: "video3.txt",
      title: "Wrapping Yarn, Pulling Loops, and Stitch Tension",
      content:
        "Wrap the yarn around the needle and pull it through the loop to make a new loop. Continue this process to create more loops. Keep the loops even and avoid pulling the yarn too tightly.",
    },
    {
      id: "v3-c3-fabric-formation",
      docId: "video-3",
      videoOrder: 3,
      videoTitle: "Lesson 3: Basic Process — Slip Knot to Fabric",
      sourceFile: "video3.txt",
      title: "Connecting Loops into Fabric, Rows, and Finished Items",
      content:
        "As you keep making loops, they connect with each other and form a piece of fabric. Continue knitting row by row until you reach the size you need. With this basic process, you can make different items such as scarves, caps, sweaters, and other useful products. Practice slowly and keep your stitches even for a neat and strong fabric.",
    },
  ];

  return definitions.map((item) => {
    // Index both title and content tokens
    const textToIndex = `${item.title} ${item.content}`;
    const cleanTokens = tokenize(textToIndex).map(stem);
    const tokenFreqs: Record<string, number> = {};
    for (const t of cleanTokens) {
      tokenFreqs[t] = (tokenFreqs[t] || 0) + 1;
    }

    return {
      id: item.id,
      docId: item.docId,
      videoOrder: item.videoOrder,
      videoTitle: item.videoTitle,
      sourceFile: item.sourceFile,
      title: item.title,
      content: item.content,
      tokens: cleanTokens,
      tokenFrequencies: tokenFreqs,
      charBigrams: extractCharBigrams(item.content),
      length: cleanTokens.length,
    };
  });
}
