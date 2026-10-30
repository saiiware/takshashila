"""Main pipeline entry point for querying the RAG model."""

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

from .chunker import build_knowledge_index
from .documents import KNITTING_DOCUMENTS
from .generator import RAGAnswerResult, RAGSource, generate_rag_answer, detect_language
from .relevant_questions import get_starter_questions
from .retriever import retriever_instance

OUT_OF_SCOPE_PATTERN = re.compile(
    r"\b(makeup|lipstick|mascara|eyeliner|blush|foundation|skincare|sunscreen|parlor|haircut|"
    r"recipe|bake|cake|biryani|cook|cooking|pizza|pasta|burger|"
    r"python|javascript|typescript|java|c\+\+|coding|code|programming|debug|compiler|html|css|"
    r"crypto|bitcoin|stocks|cricket|football|soccer|fifa|ipl|actor|movie|cinema|bollywood|"
    r"election|politics|car|bike|automobile|petrol|diesel|hospital|doctor|medicine|disease|"
    r"मेकअप|लिपस्टिक|स्वयंपाक|रेसिपी|कोडिंग)\b",
    re.IGNORECASE,
)

CRAFT_IN_SCOPE_PATTERN = re.compile(
    r"\b(knit|knitting|crochet|crocheting|crosha|krosha|stitch|stitching|stitches|sew|sewing|seam|"
    r"embroidery|yarn|wool|acrylic|thread|fabric|cloth|needle|needles|hook|hooks|chain|loops?|"
    r"slip\s*knot|magic\s*ring|single\s*crochet|half\s*double|double\s*crochet|treble|heart|"
    r"pentagon|hexagon|color|colour|shade|palette|gauge|tension|cast\s*on|purl|weaving|tapestry|"
    r"scissors|टाका|टाके|विणकाम|शिलाई|सुई|सुया|लोकर|यान|धागा|कापड|रंग|चेन|हार्ट|पंचकोन|षटकोन|मॅजिक\s*रिंग)\b",
    re.IGNORECASE,
)

VAGUE_QUERY_PATTERN = re.compile(
    r"^(\s*(how\s+(long|much|many)|which\s+one\s+is\s+better|which\s+is\s+better|what\s+size|"
    r"is\s+it\s+(hard|easy|good|bad)|can\s+you\s+help|what\s+to\s+do|how\s+to\s+do\s+it|help\s*me|help|why|what|"
    r"सांगा|मदत\s*करा|कसे\s*करावे)\s*\??\s*)$",
    re.IGNORECASE,
)


def classify_scope(question: str) -> str:
    trimmed = question.strip()
    if VAGUE_QUERY_PATTERN.match(trimmed) and not CRAFT_IN_SCOPE_PATTERN.search(trimmed):
        return "NEEDS_CLARIFICATION"
    if OUT_OF_SCOPE_PATTERN.search(trimmed) and not CRAFT_IN_SCOPE_PATTERN.search(trimmed):
        return "OUT_OF_SCOPE"
    return "IN_SCOPE"


def assess_evidence(question: str, chunks: List[Any]) -> str:
    if not chunks:
        return "NOT_FOUND"
    top_score = chunks[0].score
    if top_score < 0.22:
        return "NOT_FOUND"
    q_lower = question.lower()
    direct_terms = [
        "chain", "चेन", "single crochet", "सिंगल", "half double", "हाफ",
        "double crochet", "डबल", "4.5", "ganga", "olivia", "heart", "हार्ट",
        "magic ring", "मॅजिक", "pentagon", "पंचकोन", "hexagon", "षटकोन"
    ]
    if top_score >= 0.55 and any(t in q_lower for t in direct_terms):
        return "SUFFICIENT"
    if top_score >= 0.25:
        return "PARTIAL"
    return "NOT_FOUND"


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
    scope: str = "IN_SCOPE"
    evidence_level: str = "PARTIAL"


def query_rag(
    request: Union[RAGPipelineRequest, Dict[str, Any], str],
    debug: bool = True,
) -> RAGPipelineResult:
    """
    Main entry point for the RAG pipeline with:
    1. Scope classification (IN_SCOPE, OUT_OF_SCOPE, NEEDS_CLARIFICATION)
    2. Preserved Hybrid Retrieval (BM25 + Dense)
    3. Evidence assessment (SUFFICIENT, PARTIAL, NOT_FOUND)
    4. Evidence-aware generator
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
    effective_language = detect_language(question, language)

    # Step 1: Scope Detection
    scope = classify_scope(question)
    if debug:
        print("\n==================================================")
        print(f"[RAG Pipeline Debug] User Question: \"{question}\"")
        print(f"[RAG Pipeline Debug] Scope: {scope}")

    if scope == "OUT_OF_SCOPE":
        refusal = (
            "हा प्रश्न क्रोशे, विणकाम किंवा शिलाई क्राफ्टच्या कक्षेबाहेरचा आहे. कृपया टाके, यान, सुया किंवा विणकामाशी संबंधित प्रश्न विचारा."
            if effective_language == "mr"
            else "This question is outside the scope of knitting, crochet, and stitching. Please ask questions related to stitches, yarn, needles, patterns, or crafting techniques."
        )
        return RAGPipelineResult(
            answer=refusal,
            sources=[],
            relevant_questions=get_starter_questions(video_id),
            confidence=0.0,
            indexed_lessons=len(KNITTING_DOCUMENTS),
            scope="OUT_OF_SCOPE",
            evidence_level="NOT_FOUND",
        )

    if scope == "NEEDS_CLARIFICATION":
        clarification = (
            "कृपया आपला प्रश्न अधिक स्पष्ट कराल का? उदाहरणार्थ, आपण एखाद्या विशिष्ट टाक्याबद्दल (चेन, सिंगल, डबल क्रोशे), आकाराबद्दल (हार्ट, पंचकोन, षटकोन) किंवा यान/सुईबद्दल विचारत आहात का?"
            if effective_language == "mr"
            else "Could you please clarify your question? For example, are you asking about a specific stitch (chain, single, double), a project shape (heart, pentagon, hexagon), or yarn and needles?"
        )
        return RAGPipelineResult(
            answer=clarification,
            sources=[],
            relevant_questions=get_starter_questions(video_id),
            confidence=0.5,
            indexed_lessons=len(KNITTING_DOCUMENTS),
            scope="NEEDS_CLARIFICATION",
            evidence_level="NOT_FOUND",
        )

    # Step 2: Preserved Hybrid Retrieval (BM25 + Dense)
    retrieval_result = retriever_instance.retrieve(
        question=question,
        video_id=video_id,
        top_k=3,
        min_score_threshold=0.20,
    )

    all_retrieved = retrieval_result.all_retrieved
    deduplicated_chunks = retrieval_result.deduplicated_chunks

    if debug:
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

    # Step 3: Evidence Assessment
    evidence_level = assess_evidence(question, deduplicated_chunks)
    if debug:
        print(f"[RAG Pipeline Debug] Evidence Level: {evidence_level}")

    # Step 4: Generator Layer
    rag_result: RAGAnswerResult = generate_rag_answer(
        question=question,
        retrieved_chunks=deduplicated_chunks,
        language=language,
        video_id=video_id,
        evidence_level=evidence_level,
    )

    if debug:
        print(f"[RAG Pipeline Debug] Final Generated Answer:\n{rag_result.answer}")
        print("==================================================\n")

    sources = [] if evidence_level == "NOT_FOUND" else rag_result.sources
    confidence = (
        0.95 if evidence_level == "SUFFICIENT" else (0.80 if evidence_level == "PARTIAL" else 0.85)
    )

    return RAGPipelineResult(
        answer=rag_result.answer,
        sources=sources,
        relevant_questions=rag_result.relevant_questions,
        confidence=confidence,
        indexed_lessons=len(KNITTING_DOCUMENTS),
        scope="IN_SCOPE",
        evidence_level=evidence_level,
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

