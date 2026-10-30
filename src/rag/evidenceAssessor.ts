import type { RetrievedChunk } from "./retriever";
import type { Language } from "@/types";

export type EvidenceLevel = "SUFFICIENT" | "PARTIAL" | "NOT_FOUND";

export interface EvidenceAssessmentResult {
  level: EvidenceLevel;
  reason: string;
}

/**
 * Deterministic offline evidence evaluation based on chunk scores, keyword overlaps,
 * and specific video lesson concepts.
 */
export function assessEvidenceOffline(
  question: string,
  chunks: RetrievedChunk[]
): EvidenceAssessmentResult {
  if (!chunks || chunks.length === 0) {
    return {
      level: "NOT_FOUND",
      reason: "No relevant transcript chunks retrieved from the knowledge base.",
    };
  }

  const topChunk = chunks[0];
  const qLower = question.toLowerCase();

  // If top score is very weak, the transcripts do not cover this specific question
  if (topChunk.score < 0.22) {
    return {
      level: "NOT_FOUND",
      reason: "Retrieved chunks have low relevance scores to the query.",
    };
  }

  // Check for direct high-confidence topics present in transcripts:
  // Part 1: Starter loop, chain, single crochet, half double crochet (5 steps), double crochet (7 steps), ganga olivia yarn, 4.5mm hook
  // Part 2: Heart shape, magic ring, 3 treble, 3 dc, corner point, tapestry needle finish
  // Part 3: Pentagon 5 sides/corners, round 1-3, [1 dc, 2 ch, 1 dc] formula, crucial rule not skipping final dc
  // Part 4: Hexagon 6 sides/corners, round 1-3, [1 dc, 2 ch, 1 dc] formula, crucial rule not skipping final dc
  const directPart1Terms = ["chain", "चेन", "single crochet", "सिंगल", "half double", "हाफ", "double crochet", "डबल", "4.5", "ganga", "olivia", "starter loop", "लूप"];
  const directPart2Terms = ["heart", "हार्ट", "magic ring", "मॅजिक", "treble", "ट्रिपल", "lobe", "cute heart"];
  const directPart3Terms = ["pentagon", "पंचकोन", "5 sides", "5 corners", "५ बाजू", "५ कोपरे"];
  const directPart4Terms = ["hexagon", "षटकोन", "6 sides", "6 corners", "६ बाजू", "६ कोपरे"];

  const hasDirectMatch =
    directPart1Terms.some((t) => qLower.includes(t)) ||
    directPart2Terms.some((t) => qLower.includes(t)) ||
    directPart3Terms.some((t) => qLower.includes(t)) ||
    directPart4Terms.some((t) => qLower.includes(t));

  if (topChunk.score >= 0.55 && hasDirectMatch) {
    return {
      level: "SUFFICIENT",
      reason: "Top transcript chunk directly and completely covers the question's instructions.",
    };
  }

  if (topChunk.score >= 0.25) {
    return {
      level: "PARTIAL",
      reason: "Transcript touches upon related techniques or tools but does not give a complete answer.",
    };
  }

  return {
    level: "NOT_FOUND",
    reason: "Transcript does not contain explicit steps for this specific craft inquiry.",
  };
}

/**
 * LLM-based Evidence Evaluator.
 * Evaluates whether the retrieved transcript excerpts provide SUFFICIENT, PARTIAL, or NOT_FOUND information.
 */
export async function assessEvidenceWithLLM(
  question: string,
  chunks: RetrievedChunk[],
  language: Language = "en"
): Promise<EvidenceAssessmentResult> {
  if (!chunks || chunks.length === 0) {
    return {
      level: "NOT_FOUND",
      reason: "No chunks retrieved.",
    };
  }

  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
    return assessEvidenceOffline(question, chunks);
  }

  const contextSnippet = chunks
    .slice(0, 3)
    .map((c, i) => `[Source ${i + 1}: ${c.chunk.videoTitle}]\n${c.chunk.content}`)
    .join("\n\n");

  const prompt = `You are an evidence evaluator for a video course on crochet, knitting, and stitching.
Compare the user question with the retrieved video transcript excerpts.

TRANSCRIPT EXCERPTS:
${contextSnippet}

USER QUESTION: "${question}"

DETERMINE THE EVIDENCE LEVEL:
- SUFFICIENT: The excerpts directly provide the facts, steps, or instructions needed to answer the question completely.
- PARTIAL: The excerpts mention related concepts (such as yarn, stitches, or shapes), but do not fully or directly answer the question.
- NOT_FOUND: The excerpts do not contain the information needed to answer this question.

Respond with ONLY valid JSON:
{"level": "SUFFICIENT" | "PARTIAL" | "NOT_FOUND", "reason": "concise explanation"}
`;

  const candidateModels = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.0,
              maxOutputTokens: 150,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (
            parsed.level === "SUFFICIENT" ||
            parsed.level === "PARTIAL" ||
            parsed.level === "NOT_FOUND"
          ) {
            return {
              level: parsed.level,
              reason: parsed.reason || "",
            };
          }
        }
      }
    } catch {
      // try next candidate model
    }
  }

  return assessEvidenceOffline(question, chunks);
}

