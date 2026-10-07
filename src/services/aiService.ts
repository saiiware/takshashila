import type { AskAIRequest, AskAIResponse } from "@/types";
import { queryRAG } from "@/rag";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes the RAG pipeline over the indexed knitting knowledge base (video1.txt, video2.txt, video3.txt).
 * If a future FastAPI backend is configured, this can call API_ENDPOINTS.askAI, but defaults
 * to the self-contained RAG engine with hybrid BM25 + dense retrieval and relevant question suggestions.
 */
export async function askAI(request: AskAIRequest): Promise<AskAIResponse> {
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
 * Speech transcription helper.
 * Provides voice transcription sample queries matching current lesson context.
 */
export async function transcribeSpeech(videoId?: string | null): Promise<string> {
  await delay(500);

  // Provide realistic voice question based on video context
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
