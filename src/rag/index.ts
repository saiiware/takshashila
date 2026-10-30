import type { Language, RAGSource } from "@/types";
import { KNITTING_DOCUMENTS } from "./documents";
import { buildKnowledgeIndex } from "./chunker";
import { retrieverInstance } from "./retriever";
import { generateRAGAnswer, type RAGAnswerResult } from "./generator";
import { getStarterQuestions } from "./relevantQuestions";
import { classifyScopeWithLLM, type ScopeAssessment, type ScopeCategory } from "./scopeDetector";
import { assessEvidenceWithLLM, type EvidenceAssessmentResult, type EvidenceLevel } from "./evidenceAssessor";

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
  scope?: ScopeCategory;
  evidenceLevel?: EvidenceLevel;
}

/**
 * Main entry point for the RAG pipeline with:
 * 1. LLM-based Scope Detection (IN_SCOPE, OUT_OF_SCOPE, NEEDS_CLARIFICATION)
 * 2. Preserved Hybrid Retrieval (BM25 + Dense)
 * 3. Evidence Assessment (SUFFICIENT, PARTIAL, NOT_FOUND)
 * 4. Grounded & Practical Guidance Answer Generation
 */
export async function queryRAG(
  request: RAGPipelineRequest
): Promise<RAGPipelineResult> {
  const { question, videoId, language = "en" } = request;

  // Step 1: LLM-based Scope Detection
  const scopeResult: ScopeAssessment = await classifyScopeWithLLM(question, language);

  console.log("\n==================================================");
  console.log("[RAG Pipeline Debug] User Question:", `"${question}"`);
  console.log(
    `[RAG Pipeline Debug] Scope Assessment: ${scopeResult.category} (${scopeResult.reason})`
  );

  // If OUT_OF_SCOPE: Refuse politely without fake grounding
  if (scopeResult.category === "OUT_OF_SCOPE") {
    const isMr = language === "mr" || /[\u0900-\u097F]/.test(question);
    const refusalText = isMr
      ? "हा प्रश्न क्रोशे, विणकाम किंवा शिलाई क्राफ्टच्या कक्षेबाहेरचा आहे. कृपया टाके, यान, सुया किंवा विणकामाशी संबंधित प्रश्न विचारा."
      : "This question is outside the scope of knitting, crochet, and stitching. Please ask questions related to stitches, yarn, needles, patterns, or crafting techniques.";

    console.log("[RAG Pipeline Debug] Result: OUT_OF_SCOPE refusal returned.");
    console.log("==================================================\n");

    return {
      answer: refusalText,
      sources: [],
      relevantQuestions: getSuggestedQuestions(videoId),
      confidence: 0,
      indexedLessons: KNITTING_DOCUMENTS.length,
      scope: "OUT_OF_SCOPE",
    };
  }

  // If NEEDS_CLARIFICATION: Request clarification politely
  if (scopeResult.category === "NEEDS_CLARIFICATION") {
    const isMr = language === "mr" || /[\u0900-\u097F]/.test(question);
    const clarificationText = isMr
      ? "कृपया आपला प्रश्न अधिक स्पष्ट कराल का? उदाहरणार्थ, आपण एखाद्या विशिष्ट टाक्याबद्दल (चेन, सिंगल, डबल क्रोशे), आकाराबद्दल (हार्ट, पंचकोन, षटकोन) किंवा यान/सुईबद्दल विचारत आहात का?"
      : "Could you please clarify your question? For example, are you asking about a specific stitch (chain, single, double), a project shape (heart, pentagon, hexagon), or yarn and needles?";

    console.log("[RAG Pipeline Debug] Result: NEEDS_CLARIFICATION returned.");
    console.log("==================================================\n");

    return {
      answer: clarificationText,
      sources: [],
      relevantQuestions: getSuggestedQuestions(videoId),
      confidence: 0.5,
      indexedLessons: KNITTING_DOCUMENTS.length,
      scope: "NEEDS_CLARIFICATION",
    };
  }

  // Step 2: Preserved Hybrid Retrieval (BM25 + Dense)
  const retrievalResult = retrieverInstance.retrieve({
    question,
    videoId,
    topK: 3,
    minScoreThreshold: 0.2,
  });

  const { allRetrieved, deduplicatedChunks } = retrievalResult;

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

  // Step 3: Evidence Assessment (SUFFICIENT, PARTIAL, NOT_FOUND)
  const evidenceAssessment: EvidenceAssessmentResult = await assessEvidenceWithLLM(
    question,
    deduplicatedChunks,
    language
  );

  console.log(
    `[RAG Pipeline Debug] Evidence Assessment: ${evidenceAssessment.level} (${evidenceAssessment.reason})`
  );

  // Step 4: Generator Layer with Evidence Level
  const ragResult: RAGAnswerResult = await generateRAGAnswer(
    question,
    deduplicatedChunks,
    evidenceAssessment.level,
    language,
    videoId
  );

  // If evidence is NOT_FOUND, do not cite mismatched transcript snippets
  const sources = evidenceAssessment.level === "NOT_FOUND" ? [] : ragResult.sources;
  const confidence =
    evidenceAssessment.level === "SUFFICIENT"
      ? 0.95
      : evidenceAssessment.level === "PARTIAL"
      ? 0.8
      : 0.85;

  // Debug Logging: Final generated answer
  console.log("[RAG Pipeline Debug] Final Generated Answer:\n" + ragResult.answer);
  console.log("==================================================\n");

  return {
    answer: ragResult.answer,
    sources,
    relevantQuestions: ragResult.relevantQuestions,
    confidence,
    indexedLessons: KNITTING_DOCUMENTS.length,
    scope: "IN_SCOPE",
    evidenceLevel: evidenceAssessment.level,
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
export * from "./scopeDetector";
export * from "./evidenceAssessor";
