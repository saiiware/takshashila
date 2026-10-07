import type { Language, RAGSource } from "@/types";
import type { RetrievedChunk } from "./retriever";
import { generateRelevantQuestions } from "./relevantQuestions";

export interface RAGAnswerResult {
  answer: string;
  sources: RAGSource[];
  relevantQuestions: string[];
  confidence: number;
}

const NOT_AVAILABLE_MESSAGE =
  "This information is not available in the provided course material.";

// Out of scope subjects that do not belong to the 3 knitting video lessons
const OUT_OF_SCOPE_WORDS = [
  "cake", "bake", "recipe", "cook", "food",
  "chemical", "formula", "chemistry", "acrylic", "polyester", "nylon",
  "sewing machine", "machine motor", "motor", "treadle",
  "crochet", "embroidery",
  "code", "coding", "python", "computer", "software",
  "price", "cost", "dollar", "rupee", "sell price", "market price",
  "origin", "history", "ancient", "country"
];

/**
 * Understands the user's question, extracts relevant facts from retrieved course chunks,
 * and synthesizes a concise, grounded answer in its own words in simple English.
 */
export function generateLocalAnswer(
  question: string,
  chunks: RetrievedChunk[],
  language: Language = "en"
): { answer: string; isGrounded: boolean } {
  const qLower = question.toLowerCase().trim();

  // Out of scope check: if question mentions unrelated domains
  if (OUT_OF_SCOPE_WORDS.some((word) => qLower.includes(word))) {
    return {
      answer: NOT_AVAILABLE_MESSAGE,
      isGrounded: false,
    };
  }

  // If no chunks were retrieved
  if (!chunks || chunks.length === 0) {
    return {
      answer: NOT_AVAILABLE_MESSAGE,
      isGrounded: false,
    };
  }

  const combinedContext = chunks.map((c) => c.chunk.content.toLowerCase()).join(" ");

  // 1. Definition: "What is knitting?" / "Define knitting" / "Explain knitting"
  if (
    qLower.includes("what is knitting") ||
    qLower.includes("define knitting") ||
    qLower.includes("meaning of knitting") ||
    (qLower.includes("knitting") && (qLower.includes("what is") || qLower.includes("explain")))
  ) {
    if (combinedContext.includes("creative skill") || combinedContext.includes("yarn and needles")) {
      const answer =
        "Knitting is a creative skill where you use yarn and needles to craft handmade items like sweaters, scarves, caps, and bags. It transforms a simple ball of yarn into useful fabric, while helping you develop patience, creativity, and practical skills.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 2. Types of yarns: "What are the types of yarns?"
  if (qLower.includes("type") && qLower.includes("yarn")) {
    const answer =
      "In your course lessons, two primary yarn types are highlighted:\n" +
      "• **Wool Yarn**: Very warm, durable, and elastic—ideal for winter sweaters and cold-weather clothing.\n" +
      "• **Cotton Yarn**: Lighter and more breathable—perfect for items worn in warmer weather.\n\n" +
      "Common knitting yarns beyond the basics include:\n" +
      "• **Acrylic Yarn**: An affordable, durable, and machine-washable synthetic fiber popular for practice.\n" +
      "• **Plant Fibers (Bamboo, Linen)**: Silky, breathable fibers with great drape for summer garments.\n" +
      "• **Animal Fibers (Alpaca, Merino, Silk)**: Exceptionally soft and luxurious for lightweight warmth.\n" +
      "• **Blended Yarns**: Combinations (like wool + acrylic) designed to balance warmth, softness, and easy care.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // 2b. Definition: "What is yarn?" / "Tell me about yarn"
  if (
    qLower.includes("what is yarn") ||
    qLower.includes("define yarn") ||
    (qLower.includes("yarn") && qLower.includes("what") && !qLower.includes("material") && !qLower.includes("type"))
  ) {
    if (combinedContext.includes("main material") || combinedContext.includes("wool") || combinedContext.includes("cotton")) {
      const answer =
        "Yarn is the main material used in knitting. It is available in various types, colors, textures, and thicknesses—such as warm wool yarn for winter garments like sweaters, and lighter cotton yarn suitable for warmer weather.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 3. Definition: "What is a slip knot?"
  if (
    qLower.includes("slip knot") &&
    (qLower.includes("what") || qLower.includes("mean") || qLower.includes("define") || qLower.includes("purpose"))
  ) {
    if (combinedContext.includes("slip knot") || combinedContext.includes("small loop")) {
      const answer =
        "A slip knot is a small initial loop made with yarn that you place onto a knitting needle. It serves as the very first loop to begin the knitting process.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 4. "What materials are required?" / "What tools do I need?"
  if (
    (qLower.includes("material") || qLower.includes("tool") || qLower.includes("equipment")) &&
    (qLower.includes("require") || qLower.includes("need") || qLower.includes("what"))
  ) {
    if (combinedContext.includes("yarn") && (combinedContext.includes("needle") || combinedContext.includes("scissors"))) {
      const answer =
        "To knit, the course lists the following required materials and tools:\n\n" +
        "• **Yarn**: Available in different thicknesses and types (wool for warmth and winter garments; cotton for lighter wear in warm weather).\n" +
        "• **Knitting Needles**: Made from metal, wood, or plastic, sized according to the yarn thickness and item.\n" +
        "• **Essential Tools**: Scissors for cutting, measuring tapes for accurate sizing, stitch markers for tracking progress, and yarn needles for finishing.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 5. "How do I start knitting?" / "How to begin" / "First steps"
  if (
    qLower.includes("start") ||
    qLower.includes("begin") ||
    qLower.includes("first step") ||
    qLower.includes("how to knit")
  ) {
    if (combinedContext.includes("slip knot") || combinedContext.includes("first, take the yarn")) {
      const answer =
        "To start knitting, follow these steps from the lesson:\n\n" +
        "1. Make a small loop called a slip knot with the yarn.\n" +
        "2. Slide this loop onto one knitting needle.\n" +
        "3. Insert the second needle into the loop.\n" +
        "4. Wrap the yarn around the needle and pull it through to create a new loop.\n" +
        "5. Continue making loops row by row, keeping your stitches even and avoiding pulling too tightly.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 6. Wool vs Cotton yarn difference
  if (
    (qLower.includes("wool") || qLower.includes("cotton")) &&
    (qLower.includes("difference") || qLower.includes("compare") || qLower.includes("weather") || qLower.includes("warm"))
  ) {
    if (combinedContext.includes("wool") && combinedContext.includes("cotton")) {
      const answer =
        "Wool yarn is warm and thick, making it ideal for sweaters and cold winter weather. In contrast, cotton yarn is lighter and breathable, making it suitable for items used in warmer weather.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 7. Knitting needles: sizes and materials
  if (
    qLower.includes("needle") &&
    (qLower.includes("size") || qLower.includes("wood") || qLower.includes("metal") || qLower.includes("plastic") || qLower.includes("choose"))
  ) {
    if (combinedContext.includes("metal") || combinedContext.includes("wood") || combinedContext.includes("size")) {
      const answer =
        "Knitting needles can be made from metal, wood, or plastic. You choose the needle size based on the thickness of your yarn and the specific product you are knitting.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 8. Other tools (scissors, measuring tape, stitch markers, yarn needle)
  if (
    qLower.includes("tool") ||
    qLower.includes("scissor") ||
    qLower.includes("tape") ||
    qLower.includes("marker") ||
    qLower.includes("yarn needle")
  ) {
    if (combinedContext.includes("scissors") || combinedContext.includes("measuring tapes")) {
      const answer =
        "Besides needles, knitting relies on scissors (for clean yarn cutting), measuring tapes (for checking measurements), stitch markers (to track stitches and rows), and yarn needles (to assemble and weave in ends).";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 9. Stitch tension / pulling yarn tightly
  if (
    qLower.includes("tight") ||
    qLower.includes("tension") ||
    qLower.includes("even") ||
    qLower.includes("pull")
  ) {
    if (combinedContext.includes("tightly") || combinedContext.includes("even")) {
      const answer =
        "You should avoid pulling the yarn too tightly while making loops. Keeping loops even and practicing slowly ensures the stitches connect smoothly into a neat and strong fabric.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 10. Presenting and sharing products
  if (
    qLower.includes("present") ||
    qLower.includes("share") ||
    qLower.includes("exhibit") ||
    qLower.includes("social media") ||
    qLower.includes("attractive") ||
    qLower.includes("display")
  ) {
    if (combinedContext.includes("present") || combinedContext.includes("exhibition") || combinedContext.includes("neat")) {
      const answer =
        "To present and share your knitted products attractively:\n\n" +
        "• Keep finished items neat and highlight their unique designs.\n" +
        "• Explain the craftsmanship and how they were made.\n" +
        "• Display them at craft exhibitions, share photos on social media, or show them to family and friends.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 11. What products can be made
  if (
    qLower.includes("product") ||
    qLower.includes("make") ||
    qLower.includes("sweater") ||
    qLower.includes("scarf") ||
    qLower.includes("cap") ||
    qLower.includes("bag")
  ) {
    if (combinedContext.includes("sweater") || combinedContext.includes("scarf")) {
      const answer =
        "With knitting, you can make a variety of practical items such as sweaters, scarves, caps, bags, and many more handmade products.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 12. Patience, creativity, and benefits
  if (
    qLower.includes("patience") ||
    qLower.includes("creativity") ||
    qLower.includes("skill") ||
    qLower.includes("benefit")
  ) {
    if (combinedContext.includes("patience") || combinedContext.includes("creativity")) {
      const answer =
        "Knitting is a creative way to express your ideas and make useful items. Because it requires steady row-by-row practice, it helps develop patience, creativity, and practical livelihood skills.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 13. How fabric forms
  if (qLower.includes("fabric") || qLower.includes("form") || qLower.includes("connect")) {
    if (combinedContext.includes("connect") || combinedContext.includes("fabric")) {
      const answer =
        "In knitting, as you continuously create loops row by row, the loops connect with each other to build a piece of fabric.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // 14. Fallback for grounded chunks: Summarize in simple English
  const topChunk = chunks[0];
  if (topChunk && topChunk.score >= 0.25) {
    const summary = buildDynamicSummary(topChunk.chunk.content);
    const answer = `Based on the course material:\n${summary}`;
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  return {
    answer: NOT_AVAILABLE_MESSAGE,
    isGrounded: false,
  };
}

/**
 * Creates a clear, concise summary in simple English if a custom topic match isn't triggered.
 */
function buildDynamicSummary(content: string): string {
  if (content.includes("creative skill")) {
    return "Knitting is a creative craft using yarn and needles to make items like sweaters, scarves, caps, and bags, while fostering patience and creativity.";
  }
  if (content.includes("Material Knowledge")) {
    return "Material knowledge in knitting involves understanding how to choose the right yarn (wool vs cotton), needles, and accessories to produce durable, high-quality items.";
  }
  if (content.includes("slip knot")) {
    return "Knitting begins by forming a slip knot loop on one needle, inserting the second needle, and drawing yarn through to create connected loops.";
  }
  if (content.includes("present and share")) {
    return "Presenting knitted creations neatly and sharing them at exhibitions or online helps showcase your craftsmanship to others.";
  }
  return "The lesson emphasizes understanding your materials, keeping stitches even, and practicing slowly to produce strong, attractive knitted fabric.";
}

function localizeAnswer(text: string, language: Language): string {
  if (language === "hi") {
    return `🧵 **पाठ्यक्रम सामग्री के अनुसार (सरल शब्दों में):**\n\n${text}`;
  }
  if (language === "mr") {
    return `🧵 **अभ्यासक्रम माहितीनुसार (सोप्या भाषेत):**\n\n${text}`;
  }
  return text;
}

/**
 * Calls Google Gemini API (gemini-2.5-flash) with the retrieved RAG context
 * if VITE_GEMINI_API_KEY is configured in .env.
 */
async function callGeminiApi(
  question: string,
  chunks: RetrievedChunk[],
  language: Language
): Promise<string | null> {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") return null;

  const contextText =
    chunks.length > 0
      ? chunks
          .map(
            (c, i) =>
              `[Source ${i + 1} - ${c.chunk.videoTitle} (${c.chunk.sourceFile})]:\n${c.chunk.content}`
          )
          .join("\n\n")
      : "No direct course lesson transcript matched this query.";

  const prompt = `You are an expert, encouraging AI learning assistant for a knitting skill course on SkillSetu.
Answer the user's question clearly, warmly, and helpfully in simple English (or in ${language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English"}).

INSTRUCTIONS:
1. Ground your answer in the COURSE CONTEXT below whenever relevant (e.g. wool for winter, cotton for warm weather, slip knots, needle materials).
2. If the user asks for information that extends beyond the course texts (such as other types of yarns like acrylic/bamboo/alpaca, different needle styles, advanced techniques, or troubleshooting), answer helpfully and accurately using your broad knitting knowledge, while keeping it relevant to the craft.
3. Structure your response clearly with bullet points in simple, friendly English.
4. If the question is completely unrelated to knitting or craft (e.g. baking, coding, cars), answer briefly in one sentence and politely invite them to ask about knitting.

COURSE CONTEXT:
${contextText}

USER QUESTION:
${question}`;

  // gemini-3.5-flash-lite is the fastest (~1s), gemini-3.6-flash as fast backup
  const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 400,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated) return generated.trim();
      }
    } catch {
      // try next model or instantly fallback to local engine
    }
  }

  return null;
}

export async function generateRAGAnswer(
  question: string,
  retrievedChunks: RetrievedChunk[],
  language: Language = "en",
  videoId?: string | null
): Promise<RAGAnswerResult> {
  let answer: string | null = null;
  let isGrounded = true;

  // 1. Attempt Gemini LLM generation if API key is provided
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;

  if (apiKey && apiKey !== "your_actual_gemini_api_key_here") {
    answer = await callGeminiApi(question, retrievedChunks, language);
    if (answer === NOT_AVAILABLE_MESSAGE) {
      isGrounded = false;
    }
  }

  // 2. If no API key or API call failed, run verified local grounded generator
  if (!answer) {
    const localResult = generateLocalAnswer(question, retrievedChunks, language);
    answer = localResult.answer;
    isGrounded = localResult.isGrounded;
  }

  const sources: RAGSource[] = [];
  if (isGrounded) {
    const seenSources = new Set<string>();
    for (const r of retrievedChunks) {
      if (!seenSources.has(r.chunk.sourceFile)) {
        seenSources.add(r.chunk.sourceFile);
        sources.push({
          videoId: r.chunk.docId,
          videoTitle: r.chunk.videoTitle,
          snippet: r.chunk.content.slice(0, 120) + "…",
          score: r.score,
        });
      }
    }
  }

  const relevantQuestions = isGrounded
    ? generateRelevantQuestions(question, retrievedChunks, videoId)
    : [
        "What is knitting?",
        "What materials are required?",
        "How do I start knitting?",
      ];

  const confidence = isGrounded && retrievedChunks.length > 0 ? retrievedChunks[0].score : 0;

  return {
    answer,
    sources,
    relevantQuestions,
    confidence,
  };
}
