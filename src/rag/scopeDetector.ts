import type { Language } from "@/types";

export type ScopeCategory = "IN_SCOPE" | "OUT_OF_SCOPE" | "NEEDS_CLARIFICATION";

export interface ScopeAssessment {
  category: ScopeCategory;
  reason: string;
}

const OUT_OF_SCOPE_REGEX =
  /\b(makeup|lipstick|mascara|eyeliner|blush|foundation|skincare|sunscreen|parlor|haircut|recipe|bake|cake|biryani|cook|cooking|pizza|pasta|burger|python|javascript|typescript|java|c\+\+|coding|code|programming|debug|compiler|html|css|crypto|bitcoin|stocks|cricket|football|soccer|fifa|ipl|actor|movie|cinema|bollywood|election|politics|car|bike|automobile|petrol|diesel|hospital|doctor|medicine|disease|मेकअप|लिपस्टिक|स्वयंपाक|रेसिपी|कोडिंग)\b/i;

const CRAFT_IN_SCOPE_REGEX =
  /\b(knit|knitting|crochet|crocheting|crosha|krosha|stitch|stitching|stitches|sew|sewing|seam|embroidery|yarn|wool|acrylic|thread|fabric|cloth|needle|needles|hook|hooks|chain|loops?|slip\s*knot|magic\s*ring|single\s*crochet|half\s*double|double\s*crochet|treble|heart|pentagon|hexagon|color|colour|shade|palette|gauge|tension|cast\s*on|purl|weaving|tapestry|scissors|टाका|टाके|विणकाम|शिलाई|सुई|सुया|लोकर|यान|धागा|कापड|रंग|चेन|हार्ट|पंचकोन|षटकोन|मॅजिक\s*रिंग)\b/i;

const VAGUE_QUERY_REGEX =
  /^(\s*(how\s+(long|much|many)|which\s+one\s+is\s+better|which\s+is\s+better|what\s+size|is\s+it\s+(hard|easy|good|bad)|can\s+you\s+help|what\s+to\s+do|how\s+to\s+do\s+it|help\s*me|help|why|what|सांगा|मदत\s*करा|कसे\s*करावे)\s*\??\s*)$/i;

/**
 * Deterministic rule-based classifier used as an instant offline/fallback classifier.
 */
export function classifyScopeOffline(question: string): ScopeAssessment {
  const trimmed = question.trim();

  // 1. Check if the question is overly vague or underspecified
  if (VAGUE_QUERY_REGEX.test(trimmed) && !CRAFT_IN_SCOPE_REGEX.test(trimmed)) {
    return {
      category: "NEEDS_CLARIFICATION",
      reason: "Question is underspecified without a specific stitch, tool, or craft subject.",
    };
  }

  // 2. Check clear out-of-scope topics
  if (OUT_OF_SCOPE_REGEX.test(trimmed) && !CRAFT_IN_SCOPE_REGEX.test(trimmed)) {
    return {
      category: "OUT_OF_SCOPE",
      reason: "Topic belongs to an unrelated domain (e.g. makeup, cooking, coding, sports).",
    };
  }

  // 3. Direct craft terms or general styling/color/thread/needle questions
  if (CRAFT_IN_SCOPE_REGEX.test(trimmed)) {
    return {
      category: "IN_SCOPE",
      reason: "Directly relates to knitting, crochet, stitching, materials, or craft styling.",
    };
  }

  // 4. If short and ambiguous (under 3 words and no craft noun)
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && !CRAFT_IN_SCOPE_REGEX.test(trimmed)) {
    return {
      category: "NEEDS_CLARIFICATION",
      reason: "Query is too brief to determine intent.",
    };
  }

  // Default to IN_SCOPE for borderline questions to avoid wrongly rejecting craft inquiries
  return {
    category: "IN_SCOPE",
    reason: "Assumed in-scope craft inquiry.",
  };
}

/**
 * LLM-based Scope Classifier.
 * Uses Gemini to evaluate whether the query is IN_SCOPE, OUT_OF_SCOPE, or NEEDS_CLARIFICATION.
 */
export async function classifyScopeWithLLM(
  question: string,
  language: Language = "en"
): Promise<ScopeAssessment> {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
    return classifyScopeOffline(question);
  }

  const prompt = `You are an expert classifier for a knitting, crochet, and stitching learning platform.
Classify the user's question into EXACTLY ONE of these categories:
1. IN_SCOPE: Related to knitting, stitching, crochet, sewing, embroidery, needlework, yarn, thread, fabric, hooks, needles, tension, patterns, or color matching/coordination for needlework/textiles.
   IMPORTANT: Do NOT reject a question just because it is general or its answer is not in a specific video transcript. For example:
   - "What is knitting?" -> IN_SCOPE
   - "What colour thread goes with blue fabric?" -> IN_SCOPE
   - "How do I fix a dropped stitch?" -> IN_SCOPE
2. OUT_OF_SCOPE: Unrelated topics such as makeup, cosmetics, skincare, cooking recipes, programming, coding, sports, movies, finance, vehicles, or politics.
   For example:
   - "What makeup suits a round face?" -> OUT_OF_SCOPE
   - "How to cook pasta?" -> OUT_OF_SCOPE
   - "How do I reverse a string in Python?" -> OUT_OF_SCOPE
3. NEEDS_CLARIFICATION: Ambiguous or underspecified questions where the subject is missing or unclear (e.g., "How long does it take?", "Which one is better?", "What size?", "Is it hard?").

USER QUESTION: "${question}"

Respond with ONLY valid JSON:
{"category": "IN_SCOPE" | "OUT_OF_SCOPE" | "NEEDS_CLARIFICATION", "reason": "concise explanation"}
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
            parsed.category === "IN_SCOPE" ||
            parsed.category === "OUT_OF_SCOPE" ||
            parsed.category === "NEEDS_CLARIFICATION"
          ) {
            return {
              category: parsed.category,
              reason: parsed.reason || "",
            };
          }
        }
      }
    } catch {
      // try next candidate model
    }
  }

  // Fallback to offline rule-based classifier
  return classifyScopeOffline(question);
}

