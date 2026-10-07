import { KNITTING_DOCUMENTS, GENERAL_STARTER_QUESTIONS } from "./documents";
import type { RetrievedChunk } from "./retriever";
import { stem, tokenize } from "./chunker";

interface QuestionRule {
  triggerTerms: string[];
  suggestedQuestions: string[];
}

const QUESTION_RULES: QuestionRule[] = [
  {
    triggerTerms: ["slip", "knot", "first", "start", "begin", "loop"],
    suggestedQuestions: [
      "How do I insert the second needle into the slip knot loop?",
      "How do I wrap the yarn and pull it through to make new loops?",
      "Why is it important to avoid pulling the yarn too tightly?",
      "How do loops connect row by row to form a piece of fabric?",
    ],
  },
  {
    triggerTerms: ["yarn", "wool", "cotton", "thread", "thickness", "texture"],
    suggestedQuestions: [
      "When should I choose wool yarn instead of cotton yarn?",
      "How does yarn thickness determine what needle size to use?",
      "What yarn is most suitable for warm weather garments?",
      "How does yarn texture affect the comfort and durability of the product?",
    ],
  },
  {
    triggerTerms: ["needle", "needles", "metal", "wood", "plastic", "size"],
    suggestedQuestions: [
      "What are the advantages of metal, wood, and plastic knitting needles?",
      "How do I choose the correct needle size for my yarn?",
      "Why does needle size affect the final product's appearance?",
      "What is a yarn needle and how is it used?",
    ],
  },
  {
    triggerTerms: ["tool", "tools", "scissor", "scissors", "tape", "measur", "marker", "stitch"],
    suggestedQuestions: [
      "What are stitch markers and measuring tapes used for in knitting?",
      "Which essential tools make the knitting process easier and more accurate?",
      "How do the right tools improve the quality of knitted items?",
      "What items are needed in a beginner's knitting kit?",
    ],
  },
  {
    triggerTerms: ["tight", "tightli", "tension", "even", "stitch", "neat", "strong", "fabric"],
    suggestedQuestions: [
      "Why should you avoid pulling the yarn too tightly while making loops?",
      "How can practicing slowly help keep your stitches even?",
      "How do connected loops form a neat and strong fabric?",
      "What basic items like scarves or caps can I make once loops are even?",
    ],
  },
  {
    triggerTerms: ["product", "products", "sweater", "scarf", "cap", "bag", "make", "create"],
    suggestedQuestions: [
      "What are the best beginner items to make (e.g. scarves, caps, bags)?",
      "How do I choose yarn and needles for a sweater versus a scarf?",
      "How can I present and share my knitted products attractively?",
      "How does knitting develop patience, creativity, and practical skills?",
    ],
  },
  {
    triggerTerms: ["present", "show", "share", "exhibit", "social", "media", "market", "family"],
    suggestedQuestions: [
      "How can I display knitted products at exhibitions or on social media?",
      "Why is explaining how a product was made important for presentation?",
      "How does keeping products neat improve their appeal to friends and customers?",
      "What unique design touches make hand-knitted items attractive?",
    ],
  },
];

/**
 * Extracts and suggests 3-4 highly relevant questions based on the user's
 * query, the retrieved RAG chunks, and the lesson context.
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
        // Don't suggest the exact same question the user just asked
        if (q.toLowerCase().trim() !== userQuery.toLowerCase().trim()) {
          suggestedSet.add(q);
        }
      }
    }
  }

  // Also check top retrieved chunk topics
  if (retrievedChunks.length > 0) {
    const topChunk = retrievedChunks[0].chunk;
    const parentDoc = KNITTING_DOCUMENTS.find((d) => d.id === topChunk.docId);
    if (parentDoc) {
      for (const q of parentDoc.starterQuestions) {
        if (q.toLowerCase().trim() !== userQuery.toLowerCase().trim()) {
          suggestedSet.add(q);
        }
      }
    }
  }

  // If we still need questions, look at video context
  if (suggestedSet.size < 3 && videoId) {
    const match = videoId.match(/video-?(\d+)/i);
    const order = match ? parseInt(match[1], 10) : 1;
    const doc = KNITTING_DOCUMENTS.find((d) => d.videoOrder === order);
    if (doc) {
      for (const q of doc.starterQuestions) {
        suggestedSet.add(q);
      }
    }
  }

  // Fallback to general knitting questions
  for (const q of GENERAL_STARTER_QUESTIONS) {
    if (suggestedSet.size >= 4) break;
    suggestedSet.add(q);
  }

  // Return top 3-4 unique relevant questions
  return Array.from(suggestedSet).slice(0, 4);
}

/**
 * Returns starter questions when the user opens a specific video lesson or the main chat.
 */
export function getStarterQuestions(videoId?: string | null): string[] {
  if (videoId) {
    const match = videoId.match(/video-?(\d+)/i);
    const order = match ? parseInt(match[1], 10) : 1;
    const doc = KNITTING_DOCUMENTS.find((d) => d.videoOrder === order);
    if (doc) {
      return doc.starterQuestions;
    }
  }
  return GENERAL_STARTER_QUESTIONS;
}

