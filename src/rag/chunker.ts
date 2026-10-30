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
 * Normalizes text, tokenizes into words while preserving Indic / Devanagari characters.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Light stemmer for English craft terms.
 */
export function stem(word: string): string {
  if (word === "crocheting" || word === "crocheted" || word === "crochet") return "crochet";
  if (word === "stitches" || word === "stitch") return "stitch";
  if (word === "needles" || word === "needle") return "needl";
  if (word === "hooks" || word === "hook") return "hook";
  if (word === "yarns" || word === "yarn") return "yarn";
  if (word === "loops" || word === "loop") return "loop";
  if (word === "chains" || word === "chain") return "chain";
  if (word === "corners" || word === "corner") return "corner";
  if (word === "sides" || word === "side") return "side";
  if (word === "pentagons" || word === "pentagon") return "pentagon";
  if (word === "hexagons" || word === "hexagon") return "hexagon";
  if (word === "hearts" || word === "heart") return "heart";
  if (word === "trebles" || word === "treble") return "treble";
  if (word === "materials" || word === "material") return "materi";

  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  return word;
}

/**
 * Extracts character bigrams for fuzzy / sub-string matching.
 */
export function extractCharBigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
  const bigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.add(normalized.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * Pre-defined, semantically coherent chunks crafted directly from part1.txt, part2.txt, part3.txt, and part4.txt.
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
    // =========================================================================
    // PART 1: BEGINNER CROCHET BASICS (Suchita - part1.txt)
    // =========================================================================
    {
      id: "p1-c1-intro-materials",
      docId: "part-1",
      videoOrder: 1,
      videoTitle: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
      sourceFile: "part1.txt",
      title: "Introduction by Suchita & Beginner Materials (Ganga Olivia Yarn, 4.5mm Hook)",
      content:
        "In Part 1, instructor Suchita (crochet artist and dentist) introduces crochet as a trending, aesthetic craft. For beginners, she specifically recommends using an acrylic yarn ball from Ganga company called 'Ganga Olivia'. Beginners should start with acrylic yarn and use the hook size recommended on the yarn label, which is a 4.5 mm crochet hook. Very fine or thin hooks make learning difficult, so a 4.5mm hook is ideal. You also need a pair of scissors to cut yarn.",
    },
    {
      id: "p1-c2-holding-yarn-loop",
      docId: "part-1",
      videoOrder: 1,
      videoTitle: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
      sourceFile: "part1.txt",
      title: "Holding Yarn in Left Hand and Making the Starter Loop",
      content:
        "To start crocheting, take the yarn end, roll it around your left hand across the three fingers, and drape it over your index finger. Anchor the working loop with your thumb and middle finger. Form a circle with the yarn, pull the tail through to make a starter loop (slip knot), and insert the 4.5mm crochet hook with the hook tip facing towards you.",
    },
    {
      id: "p1-c3-chain-stitch",
      docId: "part-1",
      videoOrder: 1,
      videoTitle: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
      sourceFile: "part1.txt",
      title: "How to Make a Chain Stitch (चेन स्टिच)",
      content:
        "How to make a chain stitch (चेन स्टिच): With the hook facing you, rotate the hook to the left behind the yarn so the yarn wraps around the hook (yarn over). Catch the yarn in the hook's mouth and gently pull it down through the existing loop. Repeat this motion smoothly to create consecutive chains (1, 2, 3, 4, 5, 6, 7, 8). Chain stitches are the fundamental foundation for all crochet projects.",
    },
    {
      id: "p1-c4-single-crochet",
      docId: "part-1",
      videoOrder: 1,
      videoTitle: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
      sourceFile: "part1.txt",
      title: "How to Make a Single Crochet Stitch (सिंगल क्रोशे - SC)",
      content:
        "How to make a single crochet stitch (सिंगल क्रोशे / SC): Hold the hook in your right hand facing you. Insert the hook into the top strand of the chain. Wrap the yarn around the hook and pull it through the chain loop. You now have 2 loops on your hook. Rotate the hook behind the yarn, yarn over, and pull the working yarn through both loops simultaneously. This completes one single crochet stitch.",
    },
    {
      id: "p1-c5-half-double-crochet",
      docId: "part-1",
      videoOrder: 1,
      videoTitle: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
      sourceFile: "part1.txt",
      title: "How to Make a Half Double Crochet Stitch (हाफ डबल क्रोशे - HDC)",
      content:
        "How to make a half double crochet stitch (हाफ डबल क्रोशे / HDC): First, wrap the yarn around the hook (yarn over first). Insert the hook into the stitch. Catch the yarn and pull it through. You now have 3 loops on your hook. Yarn over once more, and pull the yarn through all 3 loops at the exact same time. The 5 steps are: 1 (yarn over), 2 (insert), 3 (pull through to get 3 loops), 4 (yarn over), 5 (pull through all 3 loops).",
    },
    {
      id: "p1-c6-double-crochet",
      docId: "part-1",
      videoOrder: 1,
      videoTitle: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
      sourceFile: "part1.txt",
      title: "How to Make a Double Crochet Stitch (डबल क्रोशे - DC) — 7 Steps",
      content:
        "How to make a double crochet stitch (डबल क्रोशे / DC) using the 7 steps: Step 1: Yarn over. Step 2: Insert hook into stitch. Step 3: Pull yarn through (3 loops on hook). Step 4: Yarn over. Step 5: Pull through the first 2 loops (2 loops remain on hook). Step 6: Yarn over. Step 7: Pull through the remaining 2 loops. Repeating these 7 steps creates clean, tall double crochet rows.",
    },
    {
      id: "p1-c7-practice-tips",
      docId: "part-1",
      videoOrder: 1,
      videoTitle: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
      sourceFile: "part1.txt",
      title: "Crochet Practice Routine & Learning Tips",
      content:
        "Suchita's advice for beginners: Practice making chains for an entire day until your tension is consistent. On the second day, practice single crochets. Slow down the video playback speed and crochet along with the video step by step. Memorizing the numbered step counts (1 to 5 for HDC, 1 to 7 for DC) makes mastering the stitches quick and enjoyable.",
    },

    // =========================================================================
    // PART 2: CUTE LITTLE CROCHET HEART SHAPE (Suchita - part2.txt)
    // =========================================================================
    {
      id: "p2-c1-heart-materials",
      docId: "part-2",
      videoOrder: 2,
      videoTitle: "Part 2: Cute Little Crochet Heart Shape (छोटूसा क्यूट हार्ट)",
      sourceFile: "part2.txt",
      title: "Materials for Crocheting the Heart Shape (Episode 4)",
      content:
        "In Part 2 (Episode 4 of the shapes series), Suchita teaches how to make a cute little crochet heart (छोटूसा क्यूट हार्ट). Required materials: Ganga Olivia acrylic yarn, a 4 mm crochet hook, a tapestry needle (टेपेस्ट्री नीडल) for weaving in yarn tails, and scissors. Earlier episodes in the series covered circles, squares, hexagons, and pentagons.",
    },
    {
      id: "p2-c2-magic-ring",
      docId: "part-2",
      videoOrder: 2,
      videoTitle: "Part 2: Cute Little Crochet Heart Shape (छोटूसा क्यूट हार्ट)",
      sourceFile: "part2.txt",
      title: "How to Make a Magic Ring / Magic Circle (मॅजिक रिंग)",
      content:
        "To make a Magic Ring (मॅजिक रिंग / मॅजिक सर्कल): Hold the yarn tail on the right side and fold the yarn into a circle between your hands. Insert the hook into the circle from underneath, catch the yarn, and draw up a loop. Anchor with your thumb and middle finger. Draw the working yarn through the loop to lock the magic ring. All heart stitches will be worked directly into this adjustable center ring.",
    },
    {
      id: "p2-c3-chain3-treble",
      docId: "part-2",
      videoOrder: 2,
      videoTitle: "Part 2: Cute Little Crochet Heart Shape (छोटूसा क्यूट हार्ट)",
      sourceFile: "part2.txt",
      title: "Chain 3 and 3 Treble Crochets for the Heart Lobe",
      content:
        "Inside the magic ring, first work 3 chains (chain 1, chain 2, chain 3). Next, work 3 Treble Crochets (ट्रिपल क्रोशे / Tr) into the ring: yarn over twice (3 wraps on hook), insert into ring, pull up a loop (4 loops on hook). Yarn over, pull through 2 loops (3 remain). Yarn over, pull through 2 loops (2 remain). Yarn over, pull through last 2 loops. Repeat this to make 3 treble crochets.",
    },
    {
      id: "p2-c4-dc-bottom-point",
      docId: "part-2",
      videoOrder: 2,
      videoTitle: "Part 2: Cute Little Crochet Heart Shape (छोटूसा क्यूट हार्ट)",
      sourceFile: "part2.txt",
      title: "3 Double Crochets and the Bottom Point of the Heart",
      content:
        "After the 3 treble crochets, work 3 Double Crochets (DC 1, DC 2, DC 3) into the magic ring. Then make Chain 1, followed by 1 Treble Crochet (1 Tr) worked into the ring to form the sharp bottom tip of the heart, followed by Chain 1.",
    },
    {
      id: "p2-c5-second-half-finish",
      docId: "part-2",
      videoOrder: 2,
      videoTitle: "Part 2: Cute Little Crochet Heart Shape (छोटूसा क्यूट हार्ट)",
      sourceFile: "part2.txt",
      title: "Second Symmetrical Half and Closing the Magic Ring",
      content:
        "To complete the symmetrical other half of the heart: work 3 Double Crochets into the magic ring, then 3 Treble Crochets (yarn over twice), and finish with Chain 3. Slip stitch into the center of the magic ring. Pull the magic ring's initial yarn tail firmly to completely close the center hole. Chain 1 to lock, snip the yarn, and weave in the loose ends with a tapestry needle on the back side.",
    },

    // =========================================================================
    // PART 3: CROCHET PENTAGON SHAPE (Suchita - part3.txt)
    // =========================================================================
    {
      id: "p3-c1-pentagon-intro",
      docId: "part-3",
      videoOrder: 3,
      videoTitle: "Part 3: Crochet Pentagon Shape — 5 Sides & 5 Corners (पंचकोन)",
      sourceFile: "part3.txt",
      title: "Pentagon Characteristics & Tools (Episode 3)",
      content:
        "In Part 3 (Episode 3 of the shapes series), Suchita teaches how to crochet a 5-sided pentagon (पंचकोन), which has 5 equal sides (५ बाजू) and 5 corners (५ कॉर्नर्स). Materials: Ganga Olivia yarn, 4 mm crochet hook, tapestry needle, and scissors. The pentagon is worked in 3 distinct rounds starting from a magic ring.",
    },
    {
      id: "p3-c2-round1",
      docId: "part-3",
      videoOrder: 3,
      videoTitle: "Part 3: Crochet Pentagon Shape — 5 Sides & 5 Corners (पंचकोन)",
      sourceFile: "part3.txt",
      title: "Round 1 of Pentagon: Magic Ring & 5 Groups of [3 DC, Chain 2]",
      content:
        "Round 1 of the Pentagon: In a magic ring, work Chain 3 (counts as 1st DC), then work 2 DC (total 3 DC group for side 1). Work Chain 2 for corner 1. Work [3 DC, Chain 2] four more times to create 5 sides and 5 corner gaps. Pull the magic ring tail tight to close the center hole, and join with a slip stitch into the 3rd chain of the starting chain-3.",
    },
    {
      id: "p3-c3-round2",
      docId: "part-3",
      videoOrder: 3,
      videoTitle: "Part 3: Crochet Pentagon Shape — 5 Sides & 5 Corners (पंचकोन)",
      sourceFile: "part3.txt",
      title: "Round 2 of Pentagon: Corner Expansion [1 DC, 2 Chain, 1 DC]",
      content:
        "Round 2 of the Pentagon: Chain 3 (1st DC), work 1 DC into each of the next 2 DC. At each corner chain-2 space, work the corner formula: [1 DC, Chain 2, 1 DC] into the same corner space. Along each side, work 1 DC on each of the 3 DC from Round 1. Repeat around all 5 sides and 5 corners. Join with a slip stitch into the 3rd chain of the beginning chain-3.",
    },
    {
      id: "p3-c4-round3-crucial-step",
      docId: "part-3",
      videoOrder: 3,
      videoTitle: "Part 3: Crochet Pentagon Shape — 5 Sides & 5 Corners (पंचकोन)",
      sourceFile: "part3.txt",
      title: "Round 3 of Pentagon & Crucial Rule: Do NOT Skip the Final DC",
      content:
        "Round 3 of the Pentagon: Chain 3, work 1 DC in each DC along the side until the corner. In every corner space, work [1 DC, Chain 2, 1 DC]. CRUCIAL RULE: After completing the 5th corner, there is an increased DC remaining from Round 2 right before the slip stitch. You MUST NOT skip this final DC! If you skip it, the pentagon's symmetry and shape will be ruined. Work 1 DC into it, then join with a slip stitch into the 3rd chain.",
    },
    {
      id: "p3-c5-finishing",
      docId: "part-3",
      videoOrder: 3,
      videoTitle: "Part 3: Crochet Pentagon Shape — 5 Sides & 5 Corners (पंचकोन)",
      sourceFile: "part3.txt",
      title: "Invisible Finishing for Pentagon with Tapestry Needle",
      content:
        "After Round 3, work Chain 1, snip the yarn, and pull the magic ring tail extra tight. Thread the yarn tails onto a tapestry needle and weave them invisibly through 2 to 3 stitches on the wrong (back) side before cutting off the excess. This produces sharp, clean pentagon edges with no visible knots.",
    },

    // =========================================================================
    // PART 4: CROCHET HEXAGON SHAPE (Suchita - part4.txt)
    // =========================================================================
    {
      id: "p4-c1-hexagon-intro",
      docId: "part-4",
      videoOrder: 4,
      videoTitle: "Part 4: Crochet Hexagon Shape — 6 Sides & 6 Corners (षटकोन)",
      sourceFile: "part4.txt",
      title: "Hexagon Characteristics & Tools (Episode 2)",
      content:
        "In Part 4 (Episode 2 of the shapes series), Suchita teaches how to crochet a 6-sided hexagon (षटकोन), which has 6 equal sides and 6 sharp corners. Materials: Ganga Olivia acrylic yarn, 4 mm crochet hook, tapestry needle, and scissors. It is worked across 3 rounds starting from a magic ring.",
    },
    {
      id: "p4-c2-round1",
      docId: "part-4",
      videoOrder: 4,
      videoTitle: "Part 4: Crochet Hexagon Shape — 6 Sides & 6 Corners (षटकोन)",
      sourceFile: "part4.txt",
      title: "Round 1 of Hexagon: Magic Ring & 6 Groups of [3 DC, Chain 2]",
      content:
        "Round 1 of the Hexagon: In a magic ring, work Chain 3 (counts as 1st DC), then work 2 DC (total 3 DC group for side 1). Work Chain 2 for corner 1. Work [3 DC, Chain 2] five more times to create exactly 6 groups of 3 DC separated by 2 chains (6 corners). Pull the magic ring tail tight to close the center hole, and slip stitch into the 3rd chain of the initial chain-3.",
    },
    {
      id: "p4-c3-round2",
      docId: "part-4",
      videoOrder: 4,
      videoTitle: "Part 4: Crochet Hexagon Shape — 6 Sides & 6 Corners (षटकोन)",
      sourceFile: "part4.txt",
      title: "Round 2 of Hexagon: Expanding 6 Corners with [1 DC, 2 Chain, 1 DC]",
      content:
        "Round 2 of the Hexagon: Chain 3, work 1 DC in each of the next 2 DC. At each of the 6 corner spaces, work [1 DC, Chain 2, 1 DC]. Along each side, work 1 DC into each of the 3 DC from Round 1. Repeat around all 6 sides and corners. Join with a slip stitch into the 3rd chain. The hexagon profile with sharp geometric corners becomes clearly visible.",
    },
    {
      id: "p4-c4-round3-crucial-step",
      docId: "part-4",
      videoOrder: 4,
      videoTitle: "Part 4: Crochet Hexagon Shape — 6 Sides & 6 Corners (षटकोन)",
      sourceFile: "part4.txt",
      title: "Round 3 of Hexagon & Crucial Rule: Working the Increased DC",
      content:
        "Round 3 of the Hexagon: Chain 3, work DC across each stitch to the corner, work [1 DC, Chain 2, 1 DC] into each of the 6 corners. CRUCIAL RULE: After the 6th corner, there is an increased DC from Round 2 right before the starting chain-3. You MUST NOT skip this stitch! Skipping it ruins the hexagon's symmetry and angles. Work 1 DC into this stitch, then slip stitch into the 3rd chain to cleanly close the round.",
    },
    {
      id: "p4-c5-finishing",
      docId: "part-4",
      videoOrder: 4,
      videoTitle: "Part 4: Crochet Hexagon Shape — 6 Sides & 6 Corners (षटकोन)",
      sourceFile: "part4.txt",
      title: "Fastening Off and Clean Tapestry Finishing for Hexagon",
      content:
        "After completing Round 3, work Chain 1 and cut the yarn. Pull the center magic ring tight. Thread the yarn tails into a tapestry needle, weave them through stitches on the wrong side to hide them securely, and snip the excess. The hexagon is perfectly finished on both front and back with crisp geometric symmetry.",
    },
  ];

  return definitions.map((def) => {
    const tokens = tokenize(def.content);
    const tokenFrequencies: Record<string, number> = {};
    for (const t of tokens) {
      const s = stem(t);
      tokenFrequencies[s] = (tokenFrequencies[s] || 0) + 1;
    }
    const charBigrams = extractCharBigrams(def.content);
    return {
      ...def,
      tokens,
      tokenFrequencies,
      charBigrams,
      length: tokens.length,
    };
  });
}
