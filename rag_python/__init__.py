"""Knitting Course RAG (Retrieval-Augmented Generation) Pipeline in Python."""

from .chunker import (
    KnowledgeChunk,
    build_knowledge_index,
    extract_char_bigrams,
    stem,
    tokenize,
)
from .documents import (
    GENERAL_STARTER_QUESTIONS,
    KNITTING_DOCUMENTS,
    KnowledgeDocument,
)
from .generator import (
    RAGAnswerResult,
    RAGSource,
    call_gemini_api,
    generate_local_answer,
    generate_rag_answer,
)
from .pipeline import (
    RAGPipelineRequest,
    RAGPipelineResult,
    get_knowledge_stats,
    get_suggested_questions,
    query_rag,
)
from .relevant_questions import (
    generate_relevant_questions,
    get_starter_questions,
)
from .retriever import (
    HybridRetriever,
    RetrievalQuery,
    RetrievalResult,
    RetrievedChunk,
    retriever_instance,
)

__all__ = [
    "KnowledgeDocument",
    "KNITTING_DOCUMENTS",
    "GENERAL_STARTER_QUESTIONS",
    "KnowledgeChunk",
    "tokenize",
    "stem",
    "extract_char_bigrams",
    "build_knowledge_index",
    "RetrievedChunk",
    "RetrievalResult",
    "RetrievalQuery",
    "HybridRetriever",
    "retriever_instance",
    "RAGSource",
    "RAGAnswerResult",
    "generate_local_answer",
    "call_gemini_api",
    "generate_rag_answer",
    "generate_relevant_questions",
    "get_starter_questions",
    "RAGPipelineRequest",
    "RAGPipelineResult",
    "query_rag",
    "get_suggested_questions",
    "get_knowledge_stats",
]

