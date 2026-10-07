"""Main pipeline entry point for querying the RAG model."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

from .chunker import build_knowledge_index
from .documents import KNITTING_DOCUMENTS
from .generator import RAGAnswerResult, RAGSource, generate_rag_answer
from .relevant_questions import get_starter_questions
from .retriever import retriever_instance


@dataclass
class RAGPipelineRequest:
    question: str
    course_id: Optional[str] = None
    video_id: Optional[str] = None
    language: str = "en"


@dataclass
class RAGPipelineResult:
    answer: str
    sources: List[RAGSource] = field(default_factory=list)
    relevant_questions: List[str] = field(default_factory=list)
    confidence: float = 0.0
    indexed_lessons: int = 0


def query_rag(
    request: Union[RAGPipelineRequest, Dict[str, Any], str],
    debug: bool = True,
) -> RAGPipelineResult:
    """
    Main entry point for the RAG pipeline.

    Flow:
    User Question → BM25 + Dense Retrieval → Deduplicate & Filter → Relevant Context → Generator → Grounded Answer
    """
    if isinstance(request, str):
        req = RAGPipelineRequest(question=request)
    elif isinstance(request, dict):
        req = RAGPipelineRequest(
            question=request.get("question", ""),
            course_id=request.get("course_id") or request.get("courseId"),
            video_id=request.get("video_id") or request.get("videoId"),
            language=request.get("language", "en"),
        )
    else:
        req = request

    question = req.question
    video_id = req.video_id
    language = req.language

    # Step 1: Hybrid Retrieval (BM25 + Dense)
    retrieval_result = retriever_instance.retrieve(
        question=question,
        video_id=video_id,
        top_k=3,
        min_score_threshold=0.20,
    )

    all_retrieved = retrieval_result.all_retrieved
    deduplicated_chunks = retrieval_result.deduplicated_chunks

    if debug:
        print("\n==================================================")
        print(f"[RAG Pipeline Debug] User Question: \"{question}\"")
        print(
            f"[RAG Pipeline Debug] Retrieved chunks and scores (total retrieved: {len(all_retrieved)}):"
        )
        if not all_retrieved:
            print("   (No chunks matched above threshold)")
        else:
            for idx, r in enumerate(all_retrieved, 1):
                print(
                    f"   [{idx}] ID: {r.chunk.id} | Source: {r.chunk.source_file} | "
                    f"Score: {r.score} (BM25: {r.bm25_score}, Dense: {r.dense_score})"
                )

        print(
            f"[RAG Pipeline Debug] Deduplicated chunks actually passed to generator ({len(deduplicated_chunks)}):"
        )
        if not deduplicated_chunks:
            print("   (None passed — query has no supporting course material)")
        else:
            for idx, d in enumerate(deduplicated_chunks, 1):
                preview = d.chunk.content[:90].replace("\n", " ")
                print(
                    f"   [{idx}] ID: {d.chunk.id} ({d.chunk.source_file}) - Score: {d.score}\n"
                    f"       Preview: \"{preview}...\""
                )

    # Step 2: Generator Layer (concise grounded answer in own words)
    rag_result: RAGAnswerResult = generate_rag_answer(
        question=question,
        retrieved_chunks=deduplicated_chunks,
        language=language,
        video_id=video_id,
    )

    if debug:
        print(f"[RAG Pipeline Debug] Final Generated Answer:\n{rag_result.answer}")
        print("==================================================\n")

    return RAGPipelineResult(
        answer=rag_result.answer,
        sources=rag_result.sources,
        relevant_questions=rag_result.relevant_questions,
        confidence=rag_result.confidence,
        indexed_lessons=len(KNITTING_DOCUMENTS),
    )


def get_suggested_questions(video_id: Optional[str] = None) -> List[str]:
    """Returns suggested starter questions tailored to the active video or general knitting course."""
    return get_starter_questions(video_id)


def get_knowledge_stats() -> Dict[str, Any]:
    """Returns statistics about the active RAG index."""
    chunks = build_knowledge_index()
    return {
        "documents_count": len(KNITTING_DOCUMENTS),
        "chunks_count": len(chunks),
        "documents": [
            {
                "order": d.video_order,
                "title": d.title,
                "source_file": d.source_file,
            }
            for d in KNITTING_DOCUMENTS
        ],
    }

