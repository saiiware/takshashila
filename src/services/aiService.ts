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
    relevantQuestions: [],
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
    const timeoutId = setTimeout(() => controller.abort(), 4000);
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
      return data as VisionAssessment;
    }
  } catch {
    // Backend offline or unreachable — use advanced client-side computer vision engine
  }

  // 2. High-Precision Client-Side Computer Vision Engine (features: edge density, warmth, specular, loop tension)
  return classifyKnittingImage(imageBase64, fileName || "", prompt || "");
}

/**
 * Speech transcription helper.
 * Provides voice transcription sample queries matching current lesson context.
 */
export async function transcribeSpeech(
  videoId?: string | null,
  language: Language = "en"
): Promise<string> {
  await delay(500);

  if (language === "mr") {
    if (videoId?.includes("3")) {
      return "सुया वापरून स्लिप नॉट आणि पहिला टाका कसा बनवायचा?";
    }
    if (videoId?.includes("2")) {
      return "लोकर आणि सुती धाग्यात काय फरक आहे?";
    }
    if (videoId?.includes("0")) {
      return "मध्य पॅनेल मोजताना किती अतिरिक्त धागा सोडावा?";
    }
    return "विणकाम सुरू करण्यासाठी कोणती साधने आवश्यक आहेत?";
  }

  if (videoId?.includes("0")) {
    return "How much extra thread should I leave when measuring the center panel?";
  }
  if (videoId?.includes("3")) {
    return "How do I make a slip knot and first loop with the needles?";
  }
  if (videoId?.includes("2")) {
    return "What is the difference between wool yarn and cotton yarn?";
  }
  if (videoId?.includes("1")) {
    return "How do I present my knitted products attractively for exhibitions?";
  }

  return "What tools and materials do I need to start knitting?";
}
