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
    // --- VIDEO 0: DEMO LECTURE - CENTER PANEL STITCHING & CROCHET TECHNIQUE ---
    {
      id: "v0-c1-measuring-cutting",
      docId: "video-0",
      videoOrder: 0,
      videoTitle: "Demo Lesson: Center Panel Stitching & Crochet Hook Technique",
      sourceFile: "demo-script.txt",
      title: "Measuring Thread and Crochet Needle for Center Panel",
      content:
        "In the demo lecture, you stitch the center panel using a crochet needle (crochet hook). Measure the pink fluffy yarn across the center space and leave about 1 to 1.5 inches of extra thread beyond the width of the space before cutting it with scissors.",
    },
    {
      id: "v0-c2-front-back",
      docId: "video-0",
      videoOrder: 0,
      videoTitle: "Demo Lesson: Center Panel Stitching & Crochet Hook Technique",
      sourceFile: "demo-script.txt",
      title: "Identifying Front vs Back Sides (Braided Ridge Lines)",
      content:
        "Attach the thread along the central section on the upper edge. Determine the front and back sides: the side with the braided ridge pattern (lines resembling a braid) is used as the front side, while the softer smooth side is kept on the inside as the back.",
    },
    {
      id: "v0-c3-running-stitch",
      docId: "video-0",
      videoOrder: 0,
      videoTitle: "Demo Lesson: Center Panel Stitching & Crochet Hook Technique",
      sourceFile: "demo-script.txt",
      title: "Running Stitch at Half-Inch Intervals & Bottom Edge",
      content:
        "Take the inner side where the crochet needle inserts easily. Catch the thread and weave it in and out like a running stitch at roughly half-inch (1/2 inch) intervals along the edge. After securing the top channel, repeat the exact same process along the bottom edge across the center panel.",
    },

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

    // --- VIDEO 4: THE KNIT STITCH ---
    {
      id: "v4-c1-knit-stitch-definition",
      docId: "video-4",
      videoOrder: 4,
      videoTitle: "Lesson 4: The Knit Stitch — Technique & Step-by-Step",
      sourceFile: "video4.txt",
      title: "What is a Knit Stitch and Its V-Shaped Appearance",
      content:
        "A knit stitch is one of the two basic stitches used in knitting. It is created by inserting the right knitting needle into an existing stitch, wrapping the working yarn around the needle, pulling the yarn through the stitch, and then transferring the completed stitch onto the right needle. The knit stitch creates a smooth, slightly V-shaped appearance on the front side of the knitted fabric.",
    },
    {
      id: "v4-c2-knit-materials",
      docId: "video-4",
      videoOrder: 4,
      videoTitle: "Lesson 4: The Knit Stitch — Technique & Step-by-Step",
      sourceFile: "video4.txt",
      title: "Needles and Yarn for the Knit Stitch",
      content:
        "A pair of knitting needles should be used for the knit stitch. The appropriate needle size depends on yarn thickness. Medium-weight yarn works with medium-sized needles; thicker yarn requires larger needles and thinner yarn requires smaller needles. Beginners should follow the needle-size recommendation on the yarn label and practice using smooth, medium-weight yarn because individual stitches are easier to see and handle. Avoid very fluffy, slippery, or extremely thin yarn.",
    },
    {
      id: "v4-c3-knit-stitch-steps",
      docId: "video-4",
      videoOrder: 4,
      videoTitle: "Lesson 4: The Knit Stitch — Technique & Step-by-Step",
      sourceFile: "video4.txt",
      title: "How to Make a Knit Stitch Step by Step",
      content:
        "How to make a Knit Stitch step by step:\n1. Hold the needle containing the stitches in the left hand and the empty needle in the right hand.\n2. Insert the right needle into the first stitch.\n3. Wrap the working yarn around the right needle.\n4. Pull the wrapped yarn through the existing stitch.\n5. Slide the original stitch off the left needle.\n6. The new loop on the right needle is the completed knit stitch.\n7. Repeat the process for the remaining stitches.",
    },
    {
      id: "v4-c4-knit-applications",
      docId: "video-4",
      videoOrder: 4,
      videoTitle: "Lesson 4: The Knit Stitch — Technique & Step-by-Step",
      sourceFile: "video4.txt",
      title: "Where the Knit Stitch is Used (Projects & Fabrics)",
      content:
        "The knit stitch is used to create many basic knitted fabrics and beginner projects such as scarves, blankets, caps, sweaters, baby items, and other knitted accessories. When repeated across rows, it creates a simple textured fabric.",
    },

    // --- VIDEO 5: THE PURL STITCH ---
    {
      id: "v5-c1-purl-stitch-definition",
      docId: "video-5",
      videoOrder: 5,
      videoTitle: "Lesson 5: The Purl Stitch — Texture, Ribbing & Technique",
      sourceFile: "video5.txt",
      title: "What is a Purl Stitch and How It Differs from Knit Stitch",
      content:
        "A purl stitch is one of the two fundamental stitches in knitting. It is similar to the knit stitch but is worked with the working yarn positioned in front of the needles and with the needle entering the stitch in the opposite direction. The purl stitch produces a bumpy textured appearance and is commonly combined with knit stitches to create patterns like ribbing.",
    },
    {
      id: "v5-c2-purl-materials",
      docId: "video-5",
      videoOrder: 5,
      videoTitle: "Lesson 5: The Purl Stitch — Texture, Ribbing & Technique",
      sourceFile: "video5.txt",
      title: "Needles and Yarn for the Purl Stitch",
      content:
        "A pair of knitting needles matching yarn thickness should be used. Smooth, medium-weight yarn with medium needles is recommended for learning the purl stitch because individual loops can be clearly seen. Beginners should avoid very fuzzy or slippery yarn until they are comfortable controlling the stitches.",
    },
    {
      id: "v5-c3-purl-stitch-steps",
      docId: "video-5",
      videoOrder: 5,
      videoTitle: "Lesson 5: The Purl Stitch — Texture, Ribbing & Technique",
      sourceFile: "video5.txt",
      title: "How to Make a Purl Stitch Step by Step",
      content:
        "How to make a Purl Stitch step by step:\n1. Hold the needle containing the stitches in the left hand and the empty needle in the right hand.\n2. Bring the working yarn to the front of the needles.\n3. Insert the right needle into the stitch from the front/opposite direction for a purl stitch.\n4. Wrap the working yarn around the right needle.\n5. Pull the wrapped yarn through the existing stitch.\n6. Slide the original stitch off the left needle.\n7. The new loop on the right needle is the completed purl stitch.\n8. Repeat the process for the remaining stitches.",
    },
    {
      id: "v5-c4-purl-applications",
      docId: "video-5",
      videoOrder: 5,
      videoTitle: "Lesson 5: The Purl Stitch — Texture, Ribbing & Technique",
      sourceFile: "video5.txt",
      title: "Where Purl Stitches are Used (Ribbing, Cuffs, Borders)",
      content:
        "Purl stitches are commonly used together with knit stitches in scarves, sweaters, blankets, caps, borders, cuffs, and decorative designs. Alternating knit and purl stitches creates elastic ribbing and textured fabrics.",
    },

    // --- VIDEO 6: CASTING ON ---
    {
      id: "v6-c1-cast-on-definition",
      docId: "video-6",
      videoOrder: 6,
      videoTitle: "Lesson 6: Casting On — Creating the Foundation Row",
      sourceFile: "video6.txt",
      title: "What is Casting On and Foundation Row",
      content:
        "Casting on is the process of creating the initial stitches on a knitting needle before beginning the main knitting pattern. These stitches form the foundation row of the knitted project. A slip knot is commonly used as the starting point for casting on.",
    },
    {
      id: "v6-c2-cast-on-materials",
      docId: "video-6",
      videoOrder: 6,
      videoTitle: "Lesson 6: Casting On — Creating the Foundation Row",
      sourceFile: "video6.txt",
      title: "Needles and Yarn for Casting On",
      content:
        "Use a pair of knitting needles matching the yarn label recommendation. Smooth, medium-weight yarn is suitable for learning casting on because loops are easy to see and manipulate. Avoid extremely thin, fuzzy, or slippery yarn.",
    },
    {
      id: "v6-c3-cast-on-steps",
      docId: "video-6",
      videoOrder: 6,
      videoTitle: "Lesson 6: Casting On — Creating the Foundation Row",
      sourceFile: "video6.txt",
      title: "How to Cast On After a Slip Knot Step by Step",
      content:
        "How to Cast On After a Slip Knot:\n1. Place the slip knot onto the knitting needle.\n2. Hold the needle with the slip knot in the appropriate hand.\n3. Create the next loop using the working yarn and needle.\n4. Pull the yarn through to form another stitch on the needle.\n5. Continue creating loops until the required number of stitches is reached.",
    },
    {
      id: "v6-c4-cast-on-tension",
      docId: "video-6",
      videoOrder: 6,
      videoTitle: "Lesson 6: Casting On — Creating the Foundation Row",
      sourceFile: "video6.txt",
      title: "Foundation Row Tension and Project Preparation",
      content:
        "Keep the tension consistent so that the foundation row is neither excessively tight nor excessively loose. Once the required stitches are created, the foundation row is ready for the first knitting row. Casting on is used at the beginning of scarves, sweaters, blankets, caps, socks, and baby clothes.",
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
