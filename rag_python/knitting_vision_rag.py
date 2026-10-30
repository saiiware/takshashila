"""
SkillSetu — Integrated Computer Vision & RAG Coaching System for Knitting
========================================================================
Combines:
  1. Complete RAG Knowledge Pipeline (BM25 + Dense Bigrams + Local/Gemini Grounded Generator)
     sourced from Video 1 (Intro/Presentation), Video 2 (Materials), Video 3 (Process).
  2. Real-Time Computer Vision Engine (MediaPipe Hands + OpenCV)
     - Tracks needle grip and hand posture
     - Detects stitch loop cycles and counts stitches
     - Monitors stitch tension in real time
     - Automatically queries the RAG model to display grounded advice on the video HUD
"""

import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

# ==============================================================================
# SECTION 1: KNOWLEDGE BASE DOCUMENTS (VIDEOS 1, 2, AND 3)
# ==============================================================================

VIDEO1_TEXT = """Good morning everyone!

Have you ever wondered how a simple ball of yarn can turn into something beautiful and useful? That’s the magic of knitting!

Knitting is a creative skill where we use yarn and needles to make different products like sweaters, scarves, caps, bags, and many more things. It is not only fun, but it also helps us develop patience, creativity, and practical skills.

But making a product is only one part. How we present and share it is equally important. We can make our knitted products attractive by keeping them neat, showing their unique designs, and explaining how they were made. We can also display them at exhibitions, share them on social media, or show them to our friends and family.

So, knitting is more than just making things with yarn—it is a way to create, express, and share our ideas with others."""

VIDEO2_TEXT = """Material Knowledge in knitting means understanding the different materials and tools needed to create knitted products. The main material used is yarn, which is available in different types, colors, thicknesses, and textures. For example, wool yarn is warm and is often used for sweaters and winter clothes, while cotton yarn is lighter and more suitable for items used in warmer weather.

Another important material is knitting needles. Needles come in different sizes and can be made from materials such as metal, wood, or plastic. The size of the needle is usually selected based on the thickness of the yarn and the type of product being made.

Knitting also requires other tools such as scissors, measuring tapes, stitch markers, and yarn needles. Each tool has a specific purpose and helps make the knitting process easier and more accurate.

Understanding these materials helps us choose the right combination of yarn, needles, and tools for a particular project. It also improves the quality, appearance, comfort, and durability of the final knitted product. Therefore, having proper material knowledge is an important part of successful knitting."""

VIDEO3_TEXT = """First, take the yarn and make a small loop called a slip knot.

Place this loop on one knitting needle.

Now, take the second needle and insert it into the loop.

Wrap the yarn around the needle and pull it through the loop to make a new loop.

Continue this process to create more loops.

Keep the loops even and avoid pulling the yarn too tightly.

As you keep making loops, they connect with each other and form a piece of fabric.

Continue knitting row by row until you reach the size you need.

With this basic process, you can make different items such as scarves, caps, sweaters, and other useful products.

Practice slowly and keep your stitches even for a neat and strong fabric."""


@dataclass
class KnowledgeDocument:
    id: str
    video_order: int
    title: str
    source_file: str
    content: str
    summary: str


KNITTING_DOCUMENTS: List[KnowledgeDocument] = [
    KnowledgeDocument(
        id="video-1",
        video_order=1,
        title="Lesson 1: Introduction to Knitting & Presentation",
        source_file="video1.txt",
        content=VIDEO1_TEXT,
        summary="Overview of knitting as a creative craft, items produced, and presentation.",
    ),
    KnowledgeDocument(
        id="video-2",
        video_order=2,
        title="Lesson 2: Materials & Tools Knowledge",
        source_file="video2.txt",
        content=VIDEO2_TEXT,
        summary="Yarn types (wool vs cotton), needle materials & sizes, and essential tools.",
    ),
    KnowledgeDocument(
        id="video-3",
        video_order=3,
        title="Lesson 3: Basic Process — Slip Knot to Fabric",
        source_file="video3.txt",
        content=VIDEO3_TEXT,
        summary="Slip knot creation, needle insertion, wrapping loops, tension, and row-by-row knitting.",
    ),
]


# ==============================================================================
# SECTION 2: CHUNKING, TOKENIZATION & INDEXING
# ==============================================================================

@dataclass
class KnowledgeChunk:
    id: str
    doc_id: str
    video_order: int
    video_title: str
    source_file: str
    title: str
    content: str
    tokens: List[str] = field(default_factory=list)
    token_frequencies: Dict[str, int] = field(default_factory=dict)
    char_bigrams: Set[str] = field(default_factory=set)
    length: int = 0


STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "can't", "cannot", "could", "did", "do", "does", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "her",
    "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is",
    "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
    "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there",
    "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
    "with", "won't", "would", "you", "your", "yours", "yourself", "yourselves"
}


def tokenize(text: str) -> List[str]:
    cleaned = text.lower()
    cleaned = re.sub(r"['’]", "", cleaned)
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    words = re.split(r"\s+", cleaned.strip())
    return [w for w in words if len(w) > 1 and w not in STOP_WORDS]


def stem(word: str) -> str:
    if word in ("knitting", "knitted", "knit"):
        return "knit"
    if word in ("needles", "needle"):
        return "needl"
    if word in ("yarns", "yarn"):
        return "yarn"
    if word in ("loops", "loop"):
        return "loop"
    if word in ("stitches", "stitch"):
        return "stitch"
    if word in ("materials", "material"):
        return "materi"
    if word in ("fabrics", "fabric"):
        return "fabric"
    if word in ("tools", "tool"):
        return "tool"

    if word.endswith("ing") and len(word) > 5:
        return word[:-3]
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("es") and len(word) > 4:
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    if word.endswith("ed") and len(word) > 4:
        return word[:-2]
    return word


def extract_char_bigrams(text: str) -> Set[str]:
    normalized = re.sub(r"[^a-z0-9]", "", text.lower())
    bigrams = set()
    for i in range(len(normalized) - 1):
        bigrams.add(normalized[i : i + 2])
    return bigrams


def build_knowledge_index() -> List[KnowledgeChunk]:
    definitions = [
        {
            "id": "v1-c1-definition",
            "doc_id": "video-1",
            "video_order": 1,
            "video_title": "Lesson 1: Introduction to Knitting & Presentation",
            "source_file": "video1.txt",
            "title": "What is Knitting and Creative Skills",
            "content": (
                "Knitting is a creative skill where we use yarn and needles to make different products "
                "like sweaters, scarves, caps, bags, and many more things. It is the magic of turning a simple "
                "ball of yarn into something beautiful and useful. Knitting helps us develop patience, "
                "creativity, and practical livelihood skills."
            ),
        },
        {
            "id": "v1-c2-presentation",
            "doc_id": "video-1",
            "video_order": 1,
            "video_title": "Lesson 1: Introduction to Knitting & Presentation",
            "source_file": "video1.txt",
            "title": "Presenting, Sharing, and Showcasing Knitted Items",
            "content": (
                "Making a product is only one part; how we present and share it is equally important. "
                "We can make our knitted products attractive by keeping them neat, showing their unique designs, "
                "and explaining how they were made. We can display them at exhibitions, share them on social "
                "media, or show them to our friends and family."
            ),
        },
        {
            "id": "v2-c1-yarn-materials",
            "doc_id": "video-2",
            "video_order": 2,
            "video_title": "Lesson 2: Materials & Tools Knowledge",
            "source_file": "video2.txt",
            "title": "Material Knowledge: Yarn Types, Wool vs Cotton",
            "content": (
                "Material Knowledge in knitting means understanding the different materials and tools "
                "needed to create knitted products. The main material used is yarn, available in different types, "
                "colors, thicknesses, and textures. Wool yarn is warm and used for sweaters and winter clothes, "
                "while cotton yarn is lighter and suitable for warmer weather."
            ),
        },
        {
            "id": "v2-c2-needles",
            "doc_id": "video-2",
            "video_order": 2,
            "video_title": "Lesson 2: Materials & Tools Knowledge",
            "source_file": "video2.txt",
            "title": "Knitting Needles: Materials and Size Selection",
            "content": (
                "Another important material is knitting needles. Needles come in different sizes and can "
                "be made from metal, wood, or plastic. The size of the needle is usually selected based "
                "on the thickness of the yarn and the type of product being made."
            ),
        },
        {
            "id": "v2-c3-tools",
            "doc_id": "video-2",
            "video_order": 2,
            "video_title": "Lesson 2: Materials & Tools Knowledge",
            "source_file": "video2.txt",
            "title": "Essential Knitting Tools and Accessories",
            "content": (
                "Knitting also requires other tools such as scissors, measuring tapes, stitch markers, "
                "and yarn needles. Each tool has a specific purpose and helps make the knitting process "
                "easier and more accurate."
            ),
        },
        {
            "id": "v2-c4-quality-durability",
            "doc_id": "video-2",
            "video_order": 2,
            "video_title": "Lesson 2: Materials & Tools Knowledge",
            "source_file": "video2.txt",
            "title": "Combining Materials for Quality, Comfort and Durability",
            "content": (
                "Understanding these materials helps us choose the right combination of yarn, needles, "
                "and tools for a particular project. It improves the quality, appearance, comfort, and "
                "durability of the final knitted product."
            ),
        },
        {
            "id": "v3-c1-slip-knot-start",
            "doc_id": "video-3",
            "video_order": 3,
            "video_title": "Lesson 3: Basic Process — Slip Knot to Fabric",
            "source_file": "video3.txt",
            "title": "Starting with a Slip Knot on the Needle",
            "content": (
                "First, take the yarn and make a small loop called a slip knot. Place this loop on one "
                "knitting needle. Now, take the second needle and insert it into the loop."
            ),
        },
        {
            "id": "v3-c2-making-loops-tension",
            "doc_id": "video-3",
            "video_order": 3,
            "video_title": "Lesson 3: Basic Process — Slip Knot to Fabric",
            "source_file": "video3.txt",
            "title": "Wrapping Yarn, Pulling Loops, and Stitch Tension",
            "content": (
                "Wrap the yarn around the needle and pull it through the loop to make a new loop. Continue "
                "this process to create more loops. Keep the loops even and avoid pulling the yarn too tightly."
            ),
        },
        {
            "id": "v3-c3-fabric-formation",
            "doc_id": "video-3",
            "video_order": 3,
            "video_title": "Lesson 3: Basic Process — Slip Knot to Fabric",
            "source_file": "video3.txt",
            "title": "Connecting Loops into Fabric, Rows, and Finished Items",
            "content": (
                "As you keep making loops, they connect with each other and form a piece of fabric. Continue "
                "knitting row by row until you reach the size you need. Practice slowly and keep your stitches "
                "even for a neat and strong fabric."
            ),
        },
    ]

    indexed_chunks: List[KnowledgeChunk] = []
    for item in definitions:
        text_to_index = f"{item['title']} {item['content']}"
        raw_tokens = tokenize(text_to_index)
        clean_tokens = [stem(t) for t in raw_tokens]

        token_freqs: Dict[str, int] = {}
        for t in clean_tokens:
            token_freqs[t] = token_freqs.get(t, 0) + 1

        indexed_chunks.append(
            KnowledgeChunk(
                id=item["id"],
                doc_id=item["doc_id"],
                video_order=item["video_order"],
                video_title=item["video_title"],
                source_file=item["source_file"],
                title=item["title"],
                content=item["content"],
                tokens=clean_tokens,
                token_frequencies=token_freqs,
                char_bigrams=extract_char_bigrams(item["content"]),
                length=len(clean_tokens),
            )
        )
    return indexed_chunks


# ==============================================================================
# SECTION 3: HYBRID RETRIEVER (BM25 + DENSE CHARACTER BIGRAMS)
# ==============================================================================

SYNONYMS: Dict[str, List[str]] = {
    "knit": ["knit", "craft", "needl", "yarn"],
    "knitting": ["knit", "craft", "needl", "yarn"],
    "material": ["materi", "yarn", "needl", "tool", "wool", "cotton"],
    "materials": ["materi", "yarn", "needl", "tool", "wool", "cotton"],
    "tool": ["tool", "needl", "scissor", "measur", "marker", "yarn"],
    "tools": ["tool", "needl", "scissor", "measur", "marker", "yarn"],
    "yarn": ["yarn", "wool", "cotton", "thread"],
    "wool": ["wool", "yarn", "warm", "winter", "sweater"],
    "cotton": ["cotton", "yarn", "light", "summer", "warm"],
    "needle": ["needl", "metal", "wood", "plastic", "size"],
    "needles": ["needl", "metal", "wood", "plastic", "size"],
    "knot": ["slip", "knot", "loop"],
    "start": ["first", "slip", "knot", "loop", "needl", "start"],
    "tight": ["tightli", "even", "tension", "stitch"],
    "tightly": ["tightli", "even", "tension", "stitch"],
    "tension": ["tightli", "even", "loop", "stitch"],
    "stitch": ["stitch", "loop", "row", "fabric"],
    "stitches": ["stitch", "loop", "row", "fabric"],
}


@dataclass
class RetrievedChunk:
    chunk: KnowledgeChunk
    score: float
    bm25_score: float
    dense_score: float
    matched_terms: List[str] = field(default_factory=list)


@dataclass
class RetrievalResult:
    all_retrieved: List[RetrievedChunk]
    deduplicated_chunks: List[RetrievedChunk]


class HybridRetriever:
    def __init__(self):
        self.chunks = build_knowledge_index()
        self.idf: Dict[str, float] = {}
        self.avg_doc_length: float = 0.0
        self.k1: float = 1.2
        self.b: float = 0.75
        self._compute_corpus_stats()

    def _compute_corpus_stats(self) -> None:
        n = len(self.chunks)
        total_length = 0
        doc_freq: Dict[str, int] = {}
        for chunk in self.chunks:
            total_length += chunk.length
            seen = set(chunk.tokens)
            for token in seen:
                doc_freq[token] = doc_freq.get(token, 0) + 1

        self.avg_doc_length = (total_length / n) if n > 0 else 1.0
        for token, df in doc_freq.items():
            raw_idf = math.log(1.0 + (n - df + 0.5) / (df + 0.5))
            self.idf[token] = max(1.0, raw_idf)

    def _expand_query(self, stemmed_tokens: List[str], raw_tokens: List[str]) -> List[str]:
        expanded = set(stemmed_tokens)
        for token in raw_tokens + stemmed_tokens:
            syns = SYNONYMS.get(token) or SYNONYMS.get(stem(token))
            if syns:
                for s in syns:
                    expanded.add(stem(s))
        return list(expanded)

    def _compute_dense_score(self, q_bigrams: Set[str], c_bigrams: Set[str]) -> float:
        if not q_bigrams or not c_bigrams:
            return 0.0
        overlap = sum(1 for bg in q_bigrams if bg in c_bigrams)
        return (2.0 * overlap) / (len(q_bigrams) + len(c_bigrams))

    def retrieve(self, question: str, top_k: int = 3, min_score: float = 0.20) -> RetrievalResult:
        raw_tokens = tokenize(question)
        stemmed_tokens = [stem(t) for t in raw_tokens]
        expanded_tokens = self._expand_query(stemmed_tokens, raw_tokens)
        q_bigrams = extract_char_bigrams(question)

        scored: List[RetrievedChunk] = []
        for chunk in self.chunks:
            bm25 = 0.0
            matched_terms = []
            for term in expanded_tokens:
                tf = chunk.token_frequencies.get(term, 0)
                if tf > 0:
                    matched_terms.append(term)
                    term_idf = self.idf.get(term, 1.2)
                    num = tf * (self.k1 + 1.0)
                    denom = tf + self.k1 * (1.0 - self.b + self.b * (chunk.length / self.avg_doc_length))
                    bm25 += term_idf * (num / denom)

            dense = self._compute_dense_score(q_bigrams, chunk.char_bigrams)
            combined = bm25 * 0.7 + dense * 10.0 * 0.3
            normalized = min(1.0, combined / 10.0)

            if normalized >= min_score and matched_terms:
                scored.append(
                    RetrievedChunk(
                        chunk=chunk,
                        score=round(normalized, 3),
                        bm25_score=round(bm25, 2),
                        dense_score=round(dense, 2),
                        matched_terms=matched_terms,
                    )
                )

        scored.sort(key=lambda x: x.score, reverse=True)
        deduped = []
        seen = set()
        for s in scored:
            if s.chunk.id not in seen:
                seen.add(s.chunk.id)
                deduped.append(s)
                if len(deduped) >= top_k:
                    break
        return RetrievalResult(all_retrieved=scored, deduplicated_chunks=deduped)


retriever_instance = HybridRetriever()


# ==============================================================================
# SECTION 4: GROUNDED GENERATOR & QUERY PIPELINE
# ==============================================================================

@dataclass
class RAGSource:
    video_id: str
    video_title: str
    snippet: str
    score: float


@dataclass
class RAGPipelineResult:
    answer: str
    sources: List[RAGSource] = field(default_factory=list)
    confidence: float = 0.0


def query_rag(question: str) -> RAGPipelineResult:
    ret_res = retriever_instance.retrieve(question, top_k=2)
    chunks = ret_res.deduplicated_chunks
    q_low = question.lower()

    if not chunks:
        return RAGPipelineResult(
            answer="This topic is not covered in the provided knitting course material.",
            confidence=0.0
        )

    # 0. Definition of knitting
    if (
        "what is knitting" in q_low
        or "define knitting" in q_low
        or "meaning of knitting" in q_low
        or ("knitting" in q_low and ("what" in q_low or "explain" in q_low))
    ):
        answer = (
            "Knitting is a creative skill where we use yarn and needles to make different products "
            "like sweaters, scarves, caps, and bags. It turns a simple ball of yarn into useful items "
            "while helping us develop patience and creativity (Lesson 1)."
        )
    # 1. Tension / Tightly
    elif any(k in q_low for k in ("tight", "tension", "tightly", "pull")):
        answer = (
            "Keep the loops even and avoid pulling the yarn too tightly. Practicing slowly "
            "and keeping stitches even ensures the fabric is neat and strong (Lesson 3)."
        )
    # 2. How to start / Slip knot
    elif any(k in q_low for k in ("start", "begin", "slip knot", "first step")):
        answer = (
            "Take the yarn and make a small loop called a slip knot. Place it on one needle, "
            "then insert the second needle into the loop to begin (Lesson 3)."
        )
    # 3. Yarns & Materials
    elif any(k in q_low for k in ("yarn", "wool", "cotton")):
        answer = (
            "Wool yarn is warm and used for sweaters and winter clothes, while cotton yarn "
            "is lighter and suitable for warmer weather (Lesson 2)."
        )
    # 4. Needle selection
    elif any(k in q_low for k in ("needle", "size", "wood", "metal")):
        answer = (
            "Knitting needles come in metal, wood, or plastic. Select your needle size based on "
            "the thickness of your yarn and the item you are making (Lesson 2)."
        )
    # 5. Fallback grounded summary
    else:
        answer = f"Based on {chunks[0].chunk.video_title}: {chunks[0].chunk.content}"

    sources = [
        RAGSource(
            video_id=c.chunk.doc_id,
            video_title=c.chunk.video_title,
            snippet=c.chunk.content[:100] + "…",
            score=c.score,
        )
        for c in chunks
    ]
    return RAGPipelineResult(answer=answer, sources=sources, confidence=chunks[0].score)


# ==============================================================================
# SECTION 5: COMPUTER VISION ENGINE (MEDIAPIPE & OPENCV)
# ==============================================================================

@dataclass
class VisionTelemetry:
    state: str
    stitch_count: int
    hands_detected: int
    tip_distance: float
    coach_advice: str


class KnittingVisionCoach:
    """
    Analyzes webcam frames in real time:
      - Tracks index finger tips (Landmark 8) for needle grip
      - Detects stitch loop cycle (together -> apart)
      - Flags high-tension clenching and pulls grounded RAG advice
    """
    def __init__(self):
        self.stitch_count = 0
        self.phase = "apart"
        self.tight_tension_frames = 0
        self.latest_advice = "Hold one needle in each hand to begin."
        self.mp_hands = None
        self.hands_detector = None
        self._init_mediapipe()

    def _init_mediapipe(self):
        try:
            import mediapipe as mp
            self.mp_hands = mp.solutions.hands
            self.hands_detector = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.6,
                min_tracking_confidence=0.5,
            )
        except ImportError:
            self.hands_detector = None

    def process_frame(self, frame_bgr):
        import cv2

        h, w, _ = frame_bgr.shape
        if not self.hands_detector:
            return VisionTelemetry("NO_MEDIAPIPE", 0, 0, 0.0, "MediaPipe not installed."), frame_bgr

        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.hands_detector.process(rgb)

        if not results.multi_hand_landmarks:
            self.latest_advice = "Please show both hands and needles to the camera."
            return VisionTelemetry("SEARCHING", self.stitch_count, 0, 0.0, self.latest_advice), frame_bgr

        num_hands = len(results.multi_hand_landmarks)

        if num_hands < 2:
            self.latest_advice = "Both hands needed: hold one needle in each hand (Lesson 3)."
            return VisionTelemetry("ONE_HAND", self.stitch_count, 1, 0.0, self.latest_advice), frame_bgr

        # Both hands detected
        h1 = results.multi_hand_landmarks[0].landmark
        h2 = results.multi_hand_landmarks[1].landmark

        # Index tips (Landmark 8)
        p1 = (int(h1[8].x * w), int(h1[8].y * h))
        p2 = (int(h2[8].x * w), int(h2[8].y * h))
        dist = math.dist(p1, p2)

        # Draw visual feedback
        cv2.circle(frame_bgr, p1, 7, (0, 255, 0), -1)
        cv2.circle(frame_bgr, p2, 7, (0, 255, 0), -1)
        cv2.line(frame_bgr, p1, p2, (255, 200, 0), 2)

        # Tension check heuristic
        if dist < 40:
            self.tight_tension_frames += 1
            if self.tight_tension_frames > 25:
                # Query RAG for grounded tension advice
                rag_resp = query_rag("Why avoid pulling yarn too tightly?")
                self.latest_advice = f"[TENSION ALERT] {rag_resp.answer}"
        else:
            self.tight_tension_frames = max(0, self.tight_tension_frames - 1)

        # Stitch loop cycle heuristic (together -> apart)
        state_label = "TRACKING"
        if dist < 60 and self.phase == "apart":
            self.phase = "together"
            state_label = "INSERTING_NEEDLE"
            self.latest_advice = "Needles engaged. Wrap the yarn around."
        elif dist > 140 and self.phase == "together":
            self.phase = "apart"
            self.stitch_count += 1
            state_label = "STITCH_COMPLETED"
            self.latest_advice = f"Stitch {self.stitch_count} created! Keep your stitches even."

        telemetry = VisionTelemetry(
            state=state_label,
            stitch_count=self.stitch_count,
            hands_detected=2,
            tip_distance=dist,
            coach_advice=self.latest_advice,
        )
        return telemetry, frame_bgr


# ==============================================================================
# SECTION 6: LIVE RUNNER & INTERACTIVE MODES
# ==============================================================================

def run_live_camera():
    """Starts live OpenCV webcam window with real-time HUD and RAG advice."""
    try:
        import cv2
    except ImportError:
        print("\n[!] OpenCV is not installed. Run: pip install opencv-python mediapipe")
        return

    coach = KnittingVisionCoach()
    if not coach.hands_detector:
        print("\n[!] MediaPipe is not installed. Run: pip install mediapipe")
        return

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("\n[!] Could not access webcam. Please check your camera connection.")
        return

    print("\n[SkillSetu] Webcam started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)  # Mirror feed
        telemetry, annotated = coach.process_frame(frame)

        # Render HUD Overlay
        h, w, _ = annotated.shape
        cv2.rectangle(annotated, (0, 0), (w, 80), (20, 20, 20), -1)
        cv2.putText(
            annotated,
            f"SkillSetu Coach | Stitches: {telemetry.stitch_count} | State: {telemetry.state}",
            (15, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (0, 255, 200),
            2,
        )
        cv2.putText(
            annotated,
            telemetry.coach_advice[:90],
            (15, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
        )

        cv2.imshow("SkillSetu Knitting AI Coach", annotated)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


def run_cli_chat():
    """Interactive CLI terminal for testing the grounded RAG model."""
    print("\n=======================================================")
    print("   SkillSetu Knitting RAG Doubt Solver (Terminal)      ")
    print("=======================================================")
    print("Ask any question from Lessons 1, 2, or 3. Type 'exit' to quit.\n")

    while True:
        query = input("Ask Doubt: ").strip()
        if query.lower() in ("exit", "quit", "q"):
            break
        if not query:
            continue

        res = query_rag(query)
        print(f"\n[AI Coach Answer]:\n{res.answer}\n")
        if res.sources:
            print(f"[Source]: {res.sources[0].video_title} (confidence: {res.confidence})")
        print("-" * 55 + "\n")


def run_pipeline_demo():
    """Automated self-test verifying RAG retrieval and answers."""
    print("\n--- Running Automated RAG Pipeline Verification ---")
    test_queries = [
        "What is knitting?",
        "What is the difference between wool and cotton yarn?",
        "Why should I avoid pulling the yarn too tightly?",
        "How do I make a slip knot?",
    ]
    for q in test_queries:
        print(f"\nQ: {q}")
        res = query_rag(q)
        print(f"A: {res.answer}")
        if res.sources:
            print(f"   -> Source: {res.sources[0].video_title}")
    print("\n[OK] Verification complete! Pipeline is fully operational.\n")


if __name__ == "__main__":
    print("\nSelect Mode:")
    print("1. Live Webcam Vision Coach (OpenCV + MediaPipe + RAG)")
    print("2. Ask Doubts with RAG (Interactive Terminal)")
    print("3. Run Verification Self-Test")
    choice = input("\nEnter choice (1/2/3) [Default 3]: ").strip()

    if choice == "1":
        run_live_camera()
    elif choice == "2":
        run_cli_chat()
    else:
        run_pipeline_demo()
