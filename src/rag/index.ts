import type { Language, RAGSource } from "@/types";
import { KNITTING_DOCUMENTS } from "./documents";
import { buildKnowledgeIndex } from "./chunker";
import { retrieverInstance } from "./retriever";
import { generateRAGAnswer, type RAGAnswerResult } from "./generator";
import { getStarterQuestions } from "./relevantQuestions";

export interface RAGPipelineRequest {
  question: string;
  courseId?: string;
  videoId?: string | null;
  language?: Language;
}

export interface RAGPipelineResult {
  answer: string;
  sources: RAGSource[];
  relevantQuestions: string[];
  confidence: number;
  indexedLessons: number;
}

/**
 * Main entry point for the RAG pipeline.
 *
 * Flow:
 * Question → BM25/vector retrieval → deduplicate/filter → relevant context → local generator → concise grounded answer
 *
 * Debug logging included:
 * - user question
 * - retrieved chunks and their scores
 * - deduplicated chunks actually passed to the generator
 * - final generated answer
 */
export async function queryRAG(
  request: RAGPipelineRequest
): Promise<RAGPipelineResult> {
  const { question, videoId, language = "en" } = request;

  // Step 1: Hybrid Retrieval (BM25 + Dense)
  const retrievalResult = retrieverInstance.retrieve({
    question,
    videoId,
    topK: 3,
    minScoreThreshold: 0.2,
  });

  const { allRetrieved, deduplicatedChunks } = retrievalResult;

  // Debug Logging: User Question
  console.log("\n==================================================");
  console.log("[RAG Pipeline Debug] User Question:", `"${question}"`);

  // Debug Logging: Retrieved chunks and their scores
  console.log(
    "[RAG Pipeline Debug] Retrieved chunks and scores (total retrieved:",
    allRetrieved.length + "):"
  );
  if (allRetrieved.length === 0) {
    console.log("   (No chunks matched above threshold)");
  } else {
    allRetrieved.forEach((r, idx) => {
      console.log(
        `   [${idx + 1}] ID: ${r.chunk.id} | Source: ${r.chunk.sourceFile} | Score: ${r.score} (BM25: ${r.bm25Score}, Dense: ${r.denseScore})`
      );
    });
  }

  // Debug Logging: Deduplicated chunks actually passed to generator
  console.log(
    "[RAG Pipeline Debug] Deduplicated chunks actually passed to generator (" +
      deduplicatedChunks.length +
      "):"
  );
  if (deduplicatedChunks.length === 0) {
    console.log("   (None passed — query has no supporting course material)");
  } else {
    deduplicatedChunks.forEach((d, idx) => {
      console.log(
        `   [${idx + 1}] ID: ${d.chunk.id} (${d.chunk.sourceFile}) - Score: ${d.score}\n       Preview: "${d.chunk.content.slice(0, 90)}..."`
      );
    });
  }

  // Step 2: Generator Layer (concise grounded answer in own words, no verbatim paragraph repetition)
  const ragResult: RAGAnswerResult = await generateRAGAnswer(
    question,
    deduplicatedChunks,
    language,
    videoId
  );

  // Debug Logging: Final generated answer
  console.log("[RAG Pipeline Debug] Final Generated Answer:\n" + ragResult.answer);
  console.log("==================================================\n");

  return {
    answer: ragResult.answer,
    sources: ragResult.sources,
    relevantQuestions: ragResult.relevantQuestions,
    confidence: ragResult.confidence,
    indexedLessons: KNITTING_DOCUMENTS.length,
  };
}

/**
 * Returns suggested starter questions tailored to the active video or general knitting course.
 */
export function getSuggestedQuestions(videoId?: string | null): string[] {
  return getStarterQuestions(videoId);
}

/**
 * Returns statistics about the active RAG index.
 */
export function getKnowledgeStats() {
  const chunks = buildKnowledgeIndex();
  return {
    documentsCount: KNITTING_DOCUMENTS.length,
    chunksCount: chunks.length,
    documents: KNITTING_DOCUMENTS.map((d) => ({
      order: d.videoOrder,
      title: d.title,
      sourceFile: d.sourceFile,
    })),
  };
}

export * from "./documents";
export * from "./chunker";
export * from "./retriever";
export * from "./generator";
export * from "./relevantQuestions";
