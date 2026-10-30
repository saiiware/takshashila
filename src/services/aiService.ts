import type { AskAIRequest, AskAIResponse, Language, VisionAssessment } from "@/types";
import { queryRAG } from "@/rag";
import { classifyKnittingImage } from "./visionAnalysis";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes the RAG pipeline over the indexed knitting knowledge base (video1.txt, video2.txt, video3.txt).
 * If a future FastAPI backend is configured, this can call API_ENDPOINTS.askAI, but defaults
 * to the self-contained RAG engine with hybrid BM25 + dense retrieval and relevant question suggestions.
 */
export async function askAI(request: AskAIRequest): Promise<AskAIResponse> {
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

  // 1. Try FastAPI Python backend if running
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${apiBase}/api/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data as AskAIResponse;
    }
  } catch {
    // Backend offline or unreachable — seamlessly fallback to client-side RAG engine
  }

  // 2. Fallback to client-side RAG engine
  const ragOutput = await queryRAG({
    question: request.question,
    courseId: request.courseId,
    videoId: request.videoId,
    language: request.language,
  });

  return {
    answer: ragOutput.answer,
    answeredAt: new Date().toISOString(),
    sources: ragOutput.sources,
    relevantQuestions: ragOutput.relevantQuestions,
    confidence: ragOutput.confidence,
  };
}

/**
 * Computer Vision Inspection service for knitting photos.
 * Analyzes user photos for:
 *   1. Slip Knot tension & form (Correct, Loose, Tight) - Lesson 3
 *   2. Yarn identification (Wool vs Cotton) - Lesson 2
 *   3. Needles identification & sizing (Metal vs Wood) - Lesson 2
 */
export async function assessKnittingPhoto(
  imageBase64: string,
  fileName?: string,
  prompt?: string
): Promise<VisionAssessment> {
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

  // 1. Try FastAPI Python server with Gemini Vision & full curriculum inspector
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${apiBase}/api/ai/vision-assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        fileName,
        prompt: prompt || "Please inspect this photo of my knitting work.",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const isWrong =
        data.status === "invalid" ||
        data.status === "wrong_photo" ||
        data.category === "invalid_image" ||
        data.category === "wrong_photo" ||
        data.isWrongImage === true;
      return {
        ...data,
        isWrongImage: isWrong,
      } as VisionAssessment;
    }
  } catch (err) {
    console.warn("Backend vision API unreachable, using client-side diagnostic fallback:", err);
  }

  // 2. Intelligent Client-Side Diagnostic Fallback (ensures 100% uptime even if python backend isn't started)
  return classifyKnittingImage(imageBase64, fileName, prompt);
}

/**
 * Speech transcription helper.
 * Provides voice transcription sample queries matching current lesson context.
 */
export async function transcribeSpeech(
  videoId?: string | null,
  language: Language = "mr"
): Promise<string> {
  await delay(500);

  if (language === "mr") {
    if (videoId?.includes("2")) {
      return "हार्ट शेप बनवण्यासाठी मॅजिक रिंग आणि ट्रिपल क्रोशे कसा करावा?";
    }
    if (videoId?.includes("3")) {
      return "पंचकोन बनवताना शेवटचा डबल क्रोशे का स्किप करायचा नाही?";
    }
    if (videoId?.includes("4")) {
      return "षटकोनाचे ६ कॉर्नर्स राउंड २ मध्ये कसे वाढवायचे?";
    }
    return "चेन स्टिच, सिंगल क्रोशे आणि डबल क्रोशे कसा बनवायचा?";
  }

  if (videoId?.includes("2")) {
    return "How do I make the treble crochets for the cute heart shape?";
  }
  if (videoId?.includes("3")) {
    return "Why must I not skip the final double crochet in the pentagon?";
  }
  if (videoId?.includes("4")) {
    return "How do I make the 6 corners in Round 1 of the hexagon?";
  }

  return "What are the 7 steps to make a double crochet stitch?";
}
