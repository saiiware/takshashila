"""Generates contextual suggested and starter follow-up questions for the learner."""

import re
from dataclasses import dataclass, field
from typing import List, Optional, Set

from .chunker import stem, tokenize
from .documents import GENERAL_STARTER_QUESTIONS, KNITTING_DOCUMENTS
from .retriever import RetrievedChunk


@dataclass
class QuestionRule:
    trigger_terms: List[str]
    suggested_questions: List[str]


QUESTION_RULES: List[QuestionRule] = [
    QuestionRule(
        trigger_terms=["panel", "crochet", "hook", "center", "running", "braid", "front", "back", "extra", "esahli"],
        suggested_questions=[
            "How much extra thread should I leave when measuring the center panel?",
            "Which side of the knitted piece is used as the front side?",
            "What interval should I keep between running stitches?",
            "What tool is used to stitch the center panel in the demo lecture?",
        ],
    ),
    QuestionRule(
        trigger_terms=["slip", "knot", "first", "start", "begin", "loop"],
        suggested_questions=[
            "How do I insert the second needle into the slip knot loop?",
            "How do I wrap the yarn and pull it through to make new loops?",
            "Why is it important to avoid pulling the yarn too tightly?",
            "How do loops connect row by row to form a piece of fabric?",
        ],
    ),
    QuestionRule(
        trigger_terms=["yarn", "wool", "cotton", "thread", "thickness", "texture"],
        suggested_questions=[
            "When should I choose wool yarn instead of cotton yarn?",
            "How does yarn thickness determine what needle size to use?",
            "What yarn is most suitable for warm weather garments?",
            "How does yarn texture affect the comfort and durability of the product?",
        ],
    ),
    QuestionRule(
        trigger_terms=["needle", "needles", "metal", "wood", "plastic", "size"],
        suggested_questions=[
            "What are the advantages of metal, wood, and plastic knitting needles?",
            "How do I choose the correct needle size for my yarn?",
            "Why does needle size affect the final product's appearance?",
            "What is a yarn needle and how is it used?",
        ],
    ),
    QuestionRule(
        trigger_terms=["tool", "tools", "scissor", "scissors", "tape", "measur", "marker", "stitch"],
        suggested_questions=[
            "What are stitch markers and measuring tapes used for in knitting?",
            "Which essential tools make the knitting process easier and more accurate?",
            "How do the right tools improve the quality of knitted items?",
            "What items are needed in a beginner's knitting kit?",
        ],
    ),
    QuestionRule(
        trigger_terms=["tight", "tightli", "tension", "even", "stitch", "neat", "strong", "fabric"],
        suggested_questions=[
            "Why should you avoid pulling the yarn too tightly while making loops?",
            "How can practicing slowly help keep your stitches even?",
            "How do connected loops form a neat and strong fabric?",
            "What basic items like scarves or caps can I make once loops are even?",
        ],
    ),
    QuestionRule(
        trigger_terms=["product", "products", "sweater", "scarf", "cap", "bag", "make", "create"],
        suggested_questions=[
            "What are the best beginner items to make (e.g. scarves, caps, bags)?",
            "How do I choose yarn and needles for a sweater versus a scarf?",
            "How can I present and share my knitted products attractively?",
            "How does knitting develop patience, creativity, and practical skills?",
        ],
    ),
    QuestionRule(
        trigger_terms=["present", "show", "share", "exhibit", "social", "media", "market", "family"],
        suggested_questions=[
            "How can I display knitted products at exhibitions or on social media?",
            "Why is explaining how a product was made important for presentation?",
            "How does keeping products neat improve their appeal to friends and customers?",
            "What unique design touches make hand-knitted items attractive?",
        ],
    ),
]


def generate_relevant_questions(
    user_query: str,
    retrieved_chunks: List[RetrievedChunk],
    video_id: Optional[str] = None,
) -> List[str]:
    """
    Extracts and suggests 3-4 highly relevant questions based on the user's
    query, the retrieved RAG chunks, and the lesson context.
    """
    query_tokens: Set[str] = set(stem(t) for t in tokenize(user_query))
    suggested_list: List[str] = []
    seen: Set[str] = set()

    def add_question(q: str):
        q_norm = q.lower().strip()
        if q_norm != user_query.lower().strip() and q_norm not in seen:
            seen.add(q_norm)
            suggested_list.append(q)

    # 1. Check matching rules against query tokens
    for rule in QUESTION_RULES:
        if any(term in query_tokens for term in rule.trigger_terms):
            for q in rule.suggested_questions:
                add_question(q)

    # 2. Check top retrieved chunk topics
    if retrieved_chunks:
        top_chunk = retrieved_chunks[0].chunk
        parent_doc = next((d for d in KNITTING_DOCUMENTS if d.id == top_chunk.doc_id), None)
        if parent_doc:
            for q in parent_doc.starter_questions:
                add_question(q)

    # 3. If we still need questions, look at video context
    if len(suggested_list) < 3 and video_id:
        match = re.search(r"video-?(\d+)", video_id, re.IGNORECASE)
        order = int(match.group(1)) if match else 1
        doc = next((d for d in KNITTING_DOCUMENTS if d.video_order == order), None)
        if doc:
            for q in doc.starter_questions:
                add_question(q)

    # 4. Fallback to general knitting questions
    for q in GENERAL_STARTER_QUESTIONS:
        if len(suggested_list) >= 4:
            break
        add_question(q)

    return suggested_list[:4]


def get_starter_questions(video_id: Optional[str] = None) -> List[str]:
    """
    Returns starter questions when the user opens a specific video lesson or the main chat.
    """
    if video_id:
        match = re.search(r"video-?(\d+)", video_id, re.IGNORECASE)
        order = int(match.group(1)) if match else 1
        doc = next((d for d in KNITTING_DOCUMENTS if d.video_order == order), None)
        if doc:
            return doc.starter_questions

    return GENERAL_STARTER_QUESTIONS

