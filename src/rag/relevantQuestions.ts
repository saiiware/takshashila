import { KNITTING_DOCUMENTS, GENERAL_STARTER_QUESTIONS } from "./documents";
import type { RetrievedChunk } from "./retriever";
import { stem, tokenize } from "./chunker";

interface QuestionRule {
  triggerTerms: string[];
  suggestedQuestions: string[];
}

const QUESTION_RULES: QuestionRule[] = [
  // Part 1: Stitches & Beginner Basics
  {
    triggerTerms: ["chain", "ch", "starter", "loop", "चेन"],
    suggestedQuestions: [
      "How do I make a chain stitch step by step?",
      "Why is chain stitch the foundation for all crochet?",
      "How many chains should I practice initially?",
      "How do I hold the yarn in my left hand while chaining?",
    ],
  },
  {
    triggerTerms: ["single", "sc", "सिंगल"],
    suggestedQuestions: [
      "How do I make a single crochet stitch?",
      "How many loops should be on the hook for single crochet?",
      "What is the difference between a chain stitch and single crochet?",
      "How do I insert the hook into the chain for single crochet?",
    ],
  },
  {
    triggerTerms: ["half", "hdc", "हाफ"],
    suggestedQuestions: [
      "How do I make a half double crochet (HDC) in 5 steps?",
      "Why do I pull through all 3 loops at once in half double crochet?",
      "What is the difference between single crochet and half double crochet?",
      "How do I yarn over before inserting for HDC?",
    ],
  },
  {
    triggerTerms: ["double", "dc", "डबल"],
    suggestedQuestions: [
      "What are the 7 steps to create a double crochet stitch?",
      "How do I pull through 2 loops twice in double crochet?",
      "Where is double crochet used in pentagons and hexagons?",
      "How does double crochet differ from half double crochet?",
    ],
  },
  {
    triggerTerms: ["yarn", "hook", "ganga", "olivia", "acrylic", "मटेरि", "साहित्य"],
    suggestedQuestions: [
      "Why is Ganga Olivia acrylic yarn recommended for beginners?",
      "What hook size is recommended for Part 1 (4.5mm) vs Parts 2-4 (4mm)?",
      "Why should beginners avoid very thin crochet hooks?",
      "What tools are needed besides yarn and a crochet hook?",
    ],
  },

  // Part 2: Heart Shape
  {
    triggerTerms: ["heart", "cute", "हार्ट"],
    suggestedQuestions: [
      "What is the exact stitch sequence to crochet the cute heart shape?",
      "How do I make treble crochets for the heart's upper lobes?",
      "How do I form the sharp bottom corner of the heart?",
      "How do I pull the magic ring tight to close the center hole completely?",
    ],
  },
  {
    triggerTerms: ["magic", "ring", "circle", "मॅजिक"],
    suggestedQuestions: [
      "How do I make an adjustable magic ring step by step?",
      "Why is a magic ring used instead of chains for circular shapes?",
      "How do I hold the yarn to start a magic circle?",
      "How do I tighten the center hole of a magic ring?",
    ],
  },
  {
    triggerTerms: ["treble", "triple", "tr", "ट्रिपल"],
    suggestedQuestions: [
      "How do I yarn over twice to make a treble crochet?",
      "How many times do I pull through 2 loops in a treble crochet?",
      "Why are treble crochets used for the curves of the heart?",
      "What is the difference between double crochet and treble crochet?",
    ],
  },

  // Part 3: Pentagon
  {
    triggerTerms: ["pentagon", "five", "sides", "corners", "पंचकोन"],
    suggestedQuestions: [
      "How do I start Round 1 of the pentagon with 5 corners?",
      "What is the corner formula [1 DC, 2 ch, 1 DC] for Round 2?",
      "Why must I not skip the final double crochet in Round 3 of the pentagon?",
      "How do I achieve crisp, sharp geometric corners on a pentagon?",
    ],
  },

  // Part 4: Hexagon
  {
    triggerTerms: ["hexagon", "six", "षटकोन"],
    suggestedQuestions: [
      "How do I create the 6 groups of [3 DC, 2 Ch] in Round 1 of the hexagon?",
      "How do the corner spaces expand across Round 2 and Round 3?",
      "Why is the increased double crochet after the 6th corner critical?",
      "How do I weave in the yarn ends cleanly using a tapestry needle?",
    ],
  },

  // Colors, Palette Styling & Combinations
  {
    triggerTerms: ["color", "colour", "shade", "palette", "grey", "gray", "pink", "yellow", "blue", "rang", "रंग"],
    suggestedQuestions: [
      "What colors pair beautifully with grey yarn in crochet?",
      "What are the best high-contrast color combinations for motifs?",
      "How do I choose colors for a crochet hexagon or pentagon?",
      "How do I smoothly join a new yarn color during a round?",
    ],
  },

  // Stitching, Sewing & Seaming
  {
    triggerTerms: ["sew", "sewing", "knit", "knitting", "stitch", "seam", "join", "शिलाई", "विणकाम"],
    suggestedQuestions: [
      "How do I sew crocheted shapes together using a tapestry needle?",
      "What is the difference between knitting with needles and crocheting?",
      "How do I do a running stitch or whip stitch to join panels?",
      "How do I fix tension if my crochet or knitted edge is curling?",
    ],
  },
];

/**
 * Extracts and suggests 3-4 highly relevant questions based on the user's
 * query, the retrieved RAG chunks, and the active video lesson.
 */
export function generateRelevantQuestions(
  userQuery: string,
  retrievedChunks: RetrievedChunk[],
  videoId?: string | null
): string[] {
  const queryTokens = new Set(tokenize(userQuery).map(stem));
  const suggestedSet = new Set<string>();

  // Check matching rules against query tokens
  for (const rule of QUESTION_RULES) {
    const hasMatch = rule.triggerTerms.some((term) => queryTokens.has(term));
    if (hasMatch) {
      for (const q of rule.suggestedQuestions) {
        if (!suggestedSet.has(q) && q.toLowerCase() !== userQuery.toLowerCase().trim()) {
          suggestedSet.add(q);
        }
      }
    }
  }

  // Add questions from top retrieved chunks
  for (const item of retrievedChunks) {
    const doc = KNITTING_DOCUMENTS.find((d) => d.id === item.chunk.docId);
    if (doc) {
      for (const q of doc.starterQuestions) {
        if (!suggestedSet.has(q) && q.toLowerCase() !== userQuery.toLowerCase().trim()) {
          suggestedSet.add(q);
        }
      }
    }
  }

  // Fallback to active video starter questions if too few
  if (suggestedSet.size < 3 && videoId) {
    const starterQs = getStarterQuestions(videoId);
    for (const q of starterQs) {
      if (!suggestedSet.has(q) && q.toLowerCase() !== userQuery.toLowerCase().trim()) {
        suggestedSet.add(q);
      }
    }
  }

  // Final fallback to general questions
  if (suggestedSet.size < 3) {
    for (const q of GENERAL_STARTER_QUESTIONS) {
      if (!suggestedSet.has(q) && q.toLowerCase() !== userQuery.toLowerCase().trim()) {
        suggestedSet.add(q);
      }
    }
  }

  return Array.from(suggestedSet).slice(0, 3);
}

/**
 * Returns contextual starter questions for a specific video lesson.
 */
export function getStarterQuestions(videoId?: string | null): string[] {
  if (!videoId) return GENERAL_STARTER_QUESTIONS.slice(0, 4);

  const cleanId = videoId.toLowerCase();

  // Part 1
  if (cleanId.includes("video-1") || cleanId.includes("part-1")) {
    return [
      "What yarn and hook size does Suchita recommend for beginners?",
      "How do I make a chain stitch step by step?",
      "What is the difference between single crochet and half double crochet?",
      "What are the 7 steps to make a double crochet?",
    ];
  }

  // Part 2
  if (cleanId.includes("video-2") || cleanId.includes("part-2")) {
    return [
      "What is the exact stitch sequence for making the crochet heart?",
      "How do I make the treble crochets for the heart lobes?",
      "How do I create the pointed bottom tip of the heart?",
      "How do I pull the magic ring tight to close the center hole?",
    ];
  }

  // Part 3
  if (cleanId.includes("video-3") || cleanId.includes("part-3")) {
    return [
      "How do I start Round 1 of the pentagon with 5 corners?",
      "What is the corner formula [1 DC, 2 ch, 1 DC] for Round 2?",
      "Why must I not skip the final double crochet in Round 3?",
      "How do I weave in yarn ends invisibly with a tapestry needle?",
    ];
  }

  // Part 4
  if (cleanId.includes("video-4") || cleanId.includes("part-4")) {
    return [
      "How do I make the 6 corners in Round 1 of the hexagon?",
      "What is the corner pattern for Round 2 of the hexagon?",
      "Why is the increased double crochet after the 6th corner critical?",
      "How do I achieve clean, sharp geometric edges on the hexagon?",
    ];
  }

  return GENERAL_STARTER_QUESTIONS.slice(0, 4);
}
