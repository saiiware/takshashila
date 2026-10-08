"""Chunking, tokenization, stemming, and knowledge indexing for the knitting RAG pipeline."""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Set

from .documents import KNITTING_DOCUMENTS, KnowledgeDocument


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
    """
    Normalizes text, tokenizes into lower-case words and filters punctuation & stopwords.
    """
    cleaned = text.lower()
    cleaned = re.sub(r"['’]", "", cleaned)
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    words = re.split(r"\s+", cleaned.strip())
    return [w for w in words if len(w) > 1 and w not in STOP_WORDS]


def stem(word: str) -> str:
    """
    Light stemmer for English terms (e.g. knitting -> knit, needles -> needle, stitches -> stitch).
    """
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
    """
    Extracts character bigrams for dense fuzzy/sub-string matching.
    """
    normalized = re.sub(r"[^a-z0-9]", "", text.lower())
    bigrams = set()
    for i in range(len(normalized) - 1):
        bigrams.add(normalized[i : i + 2])
    return bigrams


def build_knowledge_index() -> List[KnowledgeChunk]:
    """
    Pre-defined, semantically coherent chunks crafted directly from video1.txt, video2.txt, video3.txt.
    Guarantees every core concept has an intact, high-quality chunk with clear topical anchors.
    """
    definitions = [
        # --- VIDEO 1: INTRODUCTION, DEFINITION & PRESENTATION ---
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
                "ball of yarn into something beautiful and useful. Knitting is not only fun, but it also helps "
                "us develop patience, creativity, and practical livelihood skills."
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
                "media, or show them to our friends and family. Knitting is a way to create, express, and "
                "share our ideas with others."
            ),
        },
        # --- VIDEO 2: MATERIALS, NEEDLES, TOOLS & QUALITY ---
        {
            "id": "v2-c1-yarn-materials",
            "doc_id": "video-2",
            "video_order": 2,
            "video_title": "Lesson 2: Materials & Tools Knowledge",
            "source_file": "video2.txt",
            "title": "Material Knowledge: Yarn Types, Wool vs Cotton",
            "content": (
                "Material Knowledge in knitting means understanding the different materials and tools "
                "needed to create knitted products. The main material used is yarn, which is available in "
                "different types, colors, thicknesses, and textures. Wool yarn is warm and is often used "
                "for sweaters and winter clothes, while cotton yarn is lighter and more suitable for items "
                "used in warmer weather."
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
                "be made from materials such as metal, wood, or plastic. The size of the needle is usually "
                "selected based on the thickness of the yarn and the type of product being made."
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
                "and tools for a particular project. It also improves the quality, appearance, comfort, "
                "and durability of the final knitted product. Therefore, having proper material knowledge "
                "is an important part of successful knitting."
            ),
        },
        # --- VIDEO 3: STEP-BY-STEP KNITTING PROCESS ---
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
                "knitting row by row until you reach the size you need. With this basic process, you can make "
                "different items such as scarves, caps, sweaters, and other useful products. Practice slowly "
                "and keep your stitches even for a neat and strong fabric."
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

