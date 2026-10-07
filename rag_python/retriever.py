"""Hybrid retriever combining BM25 lexical ranking and dense character bigram similarity."""

import math
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

from .chunker import (
    KnowledgeChunk,
    build_knowledge_index,
    extract_char_bigrams,
    stem,
    tokenize,
)


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


@dataclass
class RetrievalQuery:
    question: string = ""
    video_id: Optional[str] = None
    top_k: int = 3
    min_score_threshold: float = 0.20


# Domain synonym map for knitting craft concepts
SYNONYMS: Dict[str, List[str]] = {
    "knit": ["knit", "craft", "needl", "yarn"],
    "knitting": ["knit", "craft", "needl", "yarn"],
    "materi": ["materi", "yarn", "needl", "tool", "wool", "cotton"],
    "material": ["materi", "yarn", "needl", "tool", "wool", "cotton"],
    "materials": ["materi", "yarn", "needl", "tool", "wool", "cotton"],
    "requir": ["requir", "need", "tool", "materi", "yarn"],
    "require": ["requir", "need", "tool", "materi", "yarn"],
    "required": ["requir", "need", "tool", "materi", "yarn"],
    "need": ["need", "requir", "tool", "materi", "yarn"],
    "needs": ["need", "requir", "tool", "materi", "yarn"],
    "tool": ["tool", "needl", "scissor", "measur", "marker", "yarn"],
    "tools": ["tool", "needl", "scissor", "measur", "marker", "yarn"],
    "yarn": ["yarn", "wool", "cotton", "thread"],
    "wool": ["wool", "yarn", "warm", "winter", "sweater"],
    "cotton": ["cotton", "yarn", "light", "summer", "warm"],
    "needle": ["needl", "metal", "wood", "plastic", "size"],
    "needles": ["needl", "metal", "wood", "plastic", "size"],
    "needl": ["needl", "metal", "wood", "plastic", "size"],
    "knot": ["slip", "knot", "loop"],
    "knots": ["slip", "knot", "loop"],
    "start": ["first", "slip", "knot", "loop", "needl", "start"],
    "begin": ["first", "slip", "knot", "loop", "needl", "start"],
    "tight": ["tightli", "even", "tension", "stitch"],
    "tightly": ["tightli", "even", "tension", "stitch"],
    "loose": ["tightli", "even", "tension", "stitch"],
    "tension": ["tightli", "even", "loop", "stitch"],
    "stitch": ["stitch", "loop", "row", "fabric"],
    "stitches": ["stitch", "loop", "row", "fabric"],
    "present": ["present", "exhibit", "social", "media", "share", "attract"],
    "presentation": ["present", "exhibit", "social", "media", "share", "attract"],
    "product": ["product", "sweater", "scarf", "cap", "bag", "make"],
    "products": ["product", "sweater", "scarf", "cap", "bag", "make"],
}


class HybridRetriever:
    def __init__(self):
        self.chunks: List[KnowledgeChunk] = build_knowledge_index()
        self.idf: Dict[str, float] = {}
        self.avg_doc_length: float = 0.0
        self.k1: float = 1.2
        self.b: float = 0.75
        self._compute_corpus_stats()

    def _compute_corpus_stats(self) -> None:
        """
        Pre-calculates BM25 Inverse Document Frequency (IDF) with an IDF floor
        so high-DF domain terms (like 'knit', 'yarn') in a focused craft corpus are not penalized to zero.
        """
        n = len(self.chunks)
        total_length = 0
        doc_freq: Dict[str, int] = {}

        for chunk in self.chunks:
            total_length += chunk.length
            seen_tokens: Set[str] = set()
            for token in chunk.tokens:
                if token not in seen_tokens:
                    seen_tokens.add(token)
                    doc_freq[token] = doc_freq.get(token, 0) + 1

        self.avg_doc_length = (total_length / n) if n > 0 else 1.0

        for token, df in doc_freq.items():
            raw_idf = math.log(1.0 + (n - df + 0.5) / (df + 0.5))
            # In small corpora, domain-essential terms must not be suppressed
            self.idf[token] = max(1.0, raw_idf)

    def _expand_query(self, stemmed_tokens: List[str], raw_tokens: List[str]) -> List[str]:
        """
        Expands query terms with domain-specific synonyms checking both raw and stemmed words.
        """
        expanded: Set[str] = set(stemmed_tokens)
        for token in raw_tokens + stemmed_tokens:
            syns = SYNONYMS.get(token) or SYNONYMS.get(stem(token))
            if syns:
                for s in syns:
                    expanded.add(stem(s))
        return list(expanded)

    def _compute_dense_score(self, query_bigrams: Set[str], chunk_bigrams: Set[str]) -> float:
        """
        Calculates dense Dice bigram similarity.
        """
        if not query_bigrams or not chunk_bigrams:
            return 0.0
        overlap = sum(1 for bg in query_bigrams if bg in chunk_bigrams)
        return (2.0 * overlap) / (len(query_bigrams) + len(chunk_bigrams))

    def _get_definitional_boost(self, question: str, chunk: KnowledgeChunk) -> float:
        """
        Detects definitional intent (e.g. "what is knitting", "define yarn", "what is a slip knot").
        """
        q_lower = question.lower()
        is_definitional = any(
            phrase in q_lower
            for phrase in ("what is", "what are", "define", "meaning of", "explain")
        )

        if not is_definitional:
            return 1.0

        # What is knitting? -> Boost chunk 1 of video 1
        if "knitting" in q_lower and chunk.id == "v1-c1-definition":
            return 2.5
        # What is yarn? / What is material knowledge? -> Boost chunk 1 of video 2
        if ("yarn" in q_lower or "material" in q_lower) and chunk.id == "v2-c1-yarn-materials":
            return 2.2
        # What is a slip knot? -> Boost chunk 1 of video 3
        if "slip knot" in q_lower and chunk.id == "v3-c1-slip-knot-start":
            return 2.2
        # What are needles? -> Boost chunk 2 of video 2
        if "needle" in q_lower and chunk.id == "v2-c2-needles":
            return 2.2

        return 1.0

    def retrieve(
        self,
        question: str,
        video_id: Optional[str] = None,
        top_k: int = 3,
        min_score_threshold: float = 0.20,
    ) -> RetrievalResult:
        """
        Retrieves matching chunks using BM25 + dense scoring, removes duplicates,
        and limits to the 2–3 most relevant unique chunks.
        """
        raw_tokens = tokenize(question)
        query_tokens = [stem(t) for t in raw_tokens]
        expanded_tokens = self._expand_query(query_tokens, raw_tokens)
        query_bigrams = extract_char_bigrams(question)

        target_video_order: Optional[int] = None
        if video_id:
            match = re.search(r"video-?(\d+)", video_id, re.IGNORECASE)
            if match:
                target_video_order = int(match.group(1))

        scored: List[RetrievedChunk] = []

        for chunk in self.chunks:
            bm25 = 0.0
            matched_terms: List[str] = []

            for term in expanded_tokens:
                tf = chunk.token_frequencies.get(term, 0)
                if tf > 0:
                    matched_terms.append(term)
                    term_idf = self.idf.get(term, 1.2)
                    numerator = tf * (self.k1 + 1.0)
                    denominator = tf + self.k1 * (
                        1.0 - self.b + self.b * (chunk.length / self.avg_doc_length)
                    )
                    bm25 += term_idf * (numerator / denominator)

            dense = self._compute_dense_score(query_bigrams, chunk.char_bigrams)

            # Context boost if user is inside a specific video
            context_multiplier = 1.0
            if target_video_order is not None and chunk.video_order == target_video_order:
                context_multiplier = 1.25

            # Definitional intent boost
            def_boost = self._get_definitional_boost(question, chunk)

            combined_score = (bm25 * 0.7 + dense * 10.0 * 0.3) * context_multiplier * def_boost
            normalized_score = min(1.0, combined_score / 10.0)

            # Must have matched terms and score above threshold
            if normalized_score >= min_score_threshold and len(matched_terms) > 0:
                scored.append(
                    RetrievedChunk(
                        chunk=chunk,
                        score=round(normalized_score, 3),
                        bm25_score=round(bm25, 2),
                        dense_score=round(dense, 2),
                        matched_terms=matched_terms,
                    )
                )

        # Sort descending by score
        scored.sort(key=lambda x: x.score, reverse=True)

        # Deduplication step
        deduplicated_chunks: List[RetrievedChunk] = []
        seen_chunk_ids: Set[str] = set()

        for item in scored:
            if item.chunk.id in seen_chunk_ids:
                continue
            seen_chunk_ids.add(item.chunk.id)
            deduplicated_chunks.append(item)
            if len(deduplicated_chunks) >= top_k:
                break

        return RetrievalResult(
            all_retrieved=scored,
            deduplicated_chunks=deduplicated_chunks,
        )


retriever_instance = HybridRetriever()

