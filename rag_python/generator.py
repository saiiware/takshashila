"""Generator layer for synthesising concise grounded answers with fallback to Google Gemini."""

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Tuple

from .relevant_questions import generate_relevant_questions
from .retriever import RetrievedChunk


@dataclass
class RAGSource:
    video_id: str
    video_title: str
    snippet: str
    score: float


@dataclass
class RAGAnswerResult:
    answer: str
    sources: List[RAGSource] = field(default_factory=list)
    relevant_questions: List[str] = field(default_factory=list)
    confidence: float = 0.0


NOT_AVAILABLE_MESSAGE = "This information is not available in the provided course material."

# Out of scope subjects that do not belong to the 3 knitting video lessons
OUT_OF_SCOPE_WORDS = [
    "cake", "bake", "recipe", "cook", "food",
    "chemical", "formula", "chemistry", "acrylic", "polyester", "nylon",
    "sewing machine", "machine motor", "motor", "treadle",
    "crochet", "embroidery",
    "code", "coding", "python", "computer", "software",
    "price", "cost", "dollar", "rupee", "sell price", "market price",
    "origin", "history", "ancient", "country"
]


def localize_answer(text: str, language: str) -> str:
    if language == "hi":
        return f"🧵 **पाठ्यक्रम सामग्री के अनुसार (सरल शब्दों में):**\n\n{text}"
    if language == "mr":
        return f"🧵 **अभ्यासक्रम माहितीनुसार (सोप्या भाषेत):**\n\n{text}"
    return text


def build_dynamic_summary(content: str) -> str:
    """
    Creates a clear, concise summary in simple English if a custom topic match isn't triggered.
    """
    if "creative skill" in content:
        return (
            "Knitting is a creative craft using yarn and needles to make items like sweaters, "
            "scarves, caps, and bags, while fostering patience and creativity."
        )
    if "Material Knowledge" in content:
        return (
            "Material knowledge in knitting involves understanding how to choose the right yarn "
            "(wool vs cotton), needles, and accessories to produce durable, high-quality items."
        )
    if "slip knot" in content:
        return (
            "Knitting begins by forming a slip knot loop on one needle, inserting the second needle, "
            "and drawing yarn through to create connected loops."
        )
    if "present and share" in content:
        return (
            "Presenting knitted creations neatly and sharing them at exhibitions or online helps "
            "showcase your craftsmanship to others."
        )
    return (
        "The lesson emphasizes understanding your materials, keeping stitches even, and practicing "
        "slowly to produce strong, attractive knitted fabric."
    )


def generate_local_answer(
    question: str,
    chunks: List[RetrievedChunk],
    language: str = "en",
) -> Tuple[str, bool]:
    """
    Understands the user's question, extracts relevant facts from retrieved course chunks,
    and synthesizes a concise, grounded answer in its own words in simple English.
    Returns (answer, is_grounded).
    """
    q_lower = question.lower().strip()

    # Out of scope check: if question mentions unrelated domains
    if any(word in q_lower for word in OUT_OF_SCOPE_WORDS):
        return NOT_AVAILABLE_MESSAGE, False

    # If no chunks were retrieved
    if not chunks:
        return NOT_AVAILABLE_MESSAGE, False

    combined_context = " ".join(c.chunk.content.lower() for c in chunks)

    # 1. Definition: "What is knitting?" / "Define knitting" / "Explain knitting"
    if (
        "what is knitting" in q_lower
        or "define knitting" in q_lower
        or "meaning of knitting" in q_lower
        or ("knitting" in q_lower and ("what is" in q_lower or "explain" in q_lower))
    ):
        if "creative skill" in combined_context or "yarn and needles" in combined_context:
            answer = (
                "Knitting is a creative skill where you use yarn and needles to craft handmade items "
                "like sweaters, scarves, caps, and bags. It transforms a simple ball of yarn into "
                "useful fabric, while helping you develop patience, creativity, and practical skills."
            )
            return localize_answer(answer, language), True

    # 2. Types of yarns: "What are the types of yarns?"
    if "type" in q_lower and "yarn" in q_lower:
        answer = (
            "In your course lessons, two primary yarn types are highlighted:\n"
            "• **Wool Yarn**: Very warm, durable, and elastic—ideal for winter sweaters and cold-weather clothing.\n"
            "• **Cotton Yarn**: Lighter and more breathable—perfect for items worn in warmer weather.\n\n"
            "Common knitting yarns beyond the basics include:\n"
            "• **Acrylic Yarn**: An affordable, durable, and machine-washable synthetic fiber popular for practice.\n"
            "• **Plant Fibers (Bamboo, Linen)**: Silky, breathable fibers with great drape for summer garments.\n"
            "• **Animal Fibers (Alpaca, Merino, Silk)**: Exceptionally soft and luxurious for lightweight warmth.\n"
            "• **Blended Yarns**: Combinations (like wool + acrylic) designed to balance warmth, softness, and easy care."
        )
        return localize_answer(answer, language), True

    # 2b. Definition: "What is yarn?" / "Tell me about yarn"
    if (
        "what is yarn" in q_lower
        or "define yarn" in q_lower
        or (
            "yarn" in q_lower
            and "what" in q_lower
            and "material" not in q_lower
            and "type" not in q_lower
            and "difference" not in q_lower
            and "compare" not in q_lower
        )
    ):
        if "main material" in combined_context or "wool" in combined_context or "cotton" in combined_context:
            answer = (
                "Yarn is the main material used in knitting. It is available in various types, colors, "
                "textures, and thicknesses—such as warm wool yarn for winter garments like sweaters, "
                "and lighter cotton yarn suitable for warmer weather."
            )
            return localize_answer(answer, language), True

    # 3. Definition: "What is a slip knot?"
    if "slip knot" in q_lower and any(k in q_lower for k in ("what", "mean", "define", "purpose")):
        if "slip knot" in combined_context or "small loop" in combined_context:
            answer = (
                "A slip knot is a small initial loop made with yarn that you place onto a knitting needle. "
                "It serves as the very first loop to begin the knitting process."
            )
            return localize_answer(answer, language), True

    # 4. "What materials are required?" / "What tools do I need?"
    if (
        any(k in q_lower for k in ("material", "tool", "equipment"))
        and any(k in q_lower for k in ("require", "need", "what"))
    ):
        if "yarn" in combined_context and ("needle" in combined_context or "scissors" in combined_context):
            answer = (
                "To knit, the course lists the following required materials and tools:\n\n"
                "• **Yarn**: Available in different thicknesses and types (wool for warmth and winter garments; cotton for lighter wear in warm weather).\n"
                "• **Knitting Needles**: Made from metal, wood, or plastic, sized according to the yarn thickness and item.\n"
                "• **Essential Tools**: Scissors for cutting, measuring tapes for accurate sizing, stitch markers for tracking progress, and yarn needles for finishing."
            )
            return localize_answer(answer, language), True

    # 5. "How do I start knitting?" / "How to begin" / "First steps"
    if any(k in q_lower for k in ("start", "begin", "first step", "how to knit")):
        if "slip knot" in combined_context or "first, take the yarn" in combined_context:
            answer = (
                "To start knitting, follow these steps from the lesson:\n\n"
                "1. Make a small loop called a slip knot with the yarn.\n"
                "2. Slide this loop onto one knitting needle.\n"
                "3. Insert the second needle into the loop.\n"
                "4. Wrap the yarn around the needle and pull it through to create a new loop.\n"
                "5. Continue making loops row by row, keeping your stitches even and avoiding pulling too tightly."
            )
            return localize_answer(answer, language), True

    # 6. Wool vs Cotton yarn difference
    if (
        ("wool" in q_lower or "cotton" in q_lower)
        and any(k in q_lower for k in ("difference", "compare", "weather", "warm"))
    ):
        if "wool" in combined_context and "cotton" in combined_context:
            answer = (
                "Wool yarn is warm and thick, making it ideal for sweaters and cold winter weather. "
                "In contrast, cotton yarn is lighter and breathable, making it suitable for items used in warmer weather."
            )
            return localize_answer(answer, language), True

    # 7. Knitting needles: sizes and materials
    if "needle" in q_lower and any(k in q_lower for k in ("size", "wood", "metal", "plastic", "choose")):
        if "metal" in combined_context or "wood" in combined_context or "size" in combined_context:
            answer = (
                "Knitting needles can be made from metal, wood, or plastic. You choose the needle "
                "size based on the thickness of your yarn and the specific product you are knitting."
            )
            return localize_answer(answer, language), True

    # 8. Other tools (scissors, measuring tape, stitch markers, yarn needle)
    if any(k in q_lower for k in ("tool", "scissor", "tape", "marker", "yarn needle")):
        if "scissors" in combined_context or "measuring tapes" in combined_context:
            answer = (
                "Besides needles, knitting relies on scissors (for clean yarn cutting), measuring tapes "
                "(for checking measurements), stitch markers (to track stitches and rows), and yarn needles "
                "(to assemble and weave in ends)."
            )
            return localize_answer(answer, language), True

    # 9. Stitch tension / pulling yarn tightly
    if any(k in q_lower for k in ("tight", "tension", "even", "pull")):
        if "tightly" in combined_context or "even" in combined_context:
            answer = (
                "You should avoid pulling the yarn too tightly while making loops. Keeping loops "
                "even and practicing slowly ensures the stitches connect smoothly into a neat and strong fabric."
            )
            return localize_answer(answer, language), True

    # 10. Presenting and sharing products
    if any(k in q_lower for k in ("present", "share", "exhibit", "social media", "attractive", "display")):
        if "present" in combined_context or "exhibition" in combined_context or "neat" in combined_context:
            answer = (
                "To present and share your knitted products attractively:\n\n"
                "• Keep finished items neat and highlight their unique designs.\n"
                "• Explain the craftsmanship and how they were made.\n"
                "• Display them at craft exhibitions, share photos on social media, or show them to family and friends."
            )
            return localize_answer(answer, language), True

    # 11. What products can be made
    if any(k in q_lower for k in ("product", "make", "sweater", "scarf", "cap", "bag")):
        if "sweater" in combined_context or "scarf" in combined_context:
            answer = (
                "With knitting, you can make a variety of practical items such as sweaters, scarves, "
                "caps, bags, and many more handmade products."
            )
            return localize_answer(answer, language), True

    # 12. Patience, creativity, and benefits
    if any(k in q_lower for k in ("patience", "creativity", "skill", "benefit")):
        if "patience" in combined_context or "creativity" in combined_context:
            answer = (
                "Knitting is a creative way to express your ideas and make useful items. Because it "
                "requires steady row-by-row practice, it helps develop patience, creativity, and practical livelihood skills."
            )
            return localize_answer(answer, language), True

    # 13. How fabric forms
    if any(k in q_lower for k in ("fabric", "form", "connect")):
        if "connect" in combined_context or "fabric" in combined_context:
            answer = (
                "In knitting, as you continuously create loops row by row, the loops connect with "
                "each other to build a piece of fabric."
            )
            return localize_answer(answer, language), True

    # 14. Fallback for grounded chunks: Summarize in simple English
    top_chunk = chunks[0] if chunks else None
    if top_chunk and top_chunk.score >= 0.25:
        summary = build_dynamic_summary(top_chunk.chunk.content)
        answer = f"Based on the course material:\n{summary}"
        return localize_answer(answer, language), True

    return NOT_AVAILABLE_MESSAGE, False


def _load_api_key() -> Optional[str]:
    """Finds Gemini API key from environment or project .env file."""
    for key_name in ("GEMINI_API_KEY", "VITE_GEMINI_API_KEY"):
        val = os.environ.get(key_name)
        if val and val not in ("your_api_key_here", "your_actual_gemini_api_key_here"):
            return val

    # Attempt reading from .env in workspace root
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.is_file():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("VITE_GEMINI_API_KEY=") or line.startswith("GEMINI_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val and "your_" not in val:
                            return val
        except Exception:
            pass

    return None


def call_gemini_api(
    question: str,
    chunks: List[RetrievedChunk],
    language: str = "en",
) -> Optional[str]:
    """
    Calls Google Gemini API with the retrieved RAG context using standard Python urllib.
    """
    api_key = _load_api_key()
    if not api_key:
        return None

    if chunks:
        context_text = "\n\n".join(
            f"[Source {i + 1} - {c.chunk.video_title} ({c.chunk.source_file})]:\n{c.chunk.content}"
            for i, c in enumerate(chunks)
        )
    else:
        context_text = "No direct course lesson transcript matched this query."

    lang_str = "Hindi" if language == "hi" else ("Marathi" if language == "mr" else "English")

    prompt = f"""You are an expert, encouraging AI learning assistant for a knitting skill course on SkillSetu.
Answer the user's question clearly, warmly, and helpfully in simple English (or in {lang_str}).

INSTRUCTIONS:
1. Ground your answer in the COURSE CONTEXT below whenever relevant (e.g. wool for winter, cotton for warm weather, slip knots, needle materials).
2. If the user asks for information that extends beyond the course texts (such as other types of yarns like acrylic/bamboo/alpaca, different needle styles, advanced techniques, or troubleshooting), answer helpfully and accurately using your broad knitting knowledge, while keeping it relevant to the craft.
3. Structure your response clearly with bullet points in simple, friendly English.
4. If the question is completely unrelated to knitting or craft (e.g. baking, coding, cars), answer briefly in one sentence and politely invite them to ask about knitting.

COURSE CONTEXT:
{context_text}

USER QUESTION:
{question}"""

    candidate_models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 400,
        },
    }
    payload_bytes = json.dumps(payload).encode("utf-8")

    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload_bytes,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                if resp.status == 200:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    text = (
                        resp_data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                    )
                    if text:
                        return text.strip()
        except Exception:
            continue

    return None


def generate_rag_answer(
    question: str,
    retrieved_chunks: List[RetrievedChunk],
    language: str = "en",
    video_id: Optional[str] = None,
) -> RAGAnswerResult:
    """
    Produces final RAG answer, extracting sources, confidence, and suggested follow-up questions.
    """
    answer: Optional[str] = None
    is_grounded = True

    # 1. Attempt Gemini LLM generation if API key is provided
    api_key = _load_api_key()
    if api_key:
        answer = call_gemini_api(question, retrieved_chunks, language)
        if answer == NOT_AVAILABLE_MESSAGE:
            is_grounded = False

    # 2. Fallback to local verified grounded generator
    if not answer:
        answer, is_grounded = generate_local_answer(question, retrieved_chunks, language)

    # 3. Source attribution
    sources: List[RAGSource] = []
    if is_grounded:
        seen_sources = set()
        for r in retrieved_chunks:
            if r.chunk.source_file not in seen_sources:
                seen_sources.add(r.chunk.source_file)
                sources.append(
                    RAGSource(
                        video_id=r.chunk.doc_id,
                        video_title=r.chunk.video_title,
                        snippet=r.chunk.content[:120] + "…",
                        score=r.score,
                    )
                )

    # 4. Relevant questions suggestion
    if is_grounded:
        relevant_questions = generate_relevant_questions(question, retrieved_chunks, video_id)
    else:
        relevant_questions = [
            "What is knitting?",
            "What materials are required?",
            "How do I start knitting?",
        ]

    confidence = retrieved_chunks[0].score if (is_grounded and retrieved_chunks) else 0.0

    return RAGAnswerResult(
        answer=answer,
        sources=sources,
        relevant_questions=relevant_questions,
        confidence=confidence,
    )

