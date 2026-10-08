"""Evaluation script for testing the Python RAG Pipeline across diverse user queries."""

import sys
from pathlib import Path

# Add project root to sys.path so rag_python can be imported directly
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from rag_python.pipeline import get_knowledge_stats, query_rag


def run_evaluation():
    print("=== Comprehensive RAG Evaluation Suite (Python) ===")
    stats = get_knowledge_stats()
    print(f"Documents indexed: {stats['documents_count']}")
    print(f"Total Chunks indexed: {stats['chunks_count']}")
    for d in stats["documents"]:
        print(f" - {d['title']} ({d['source_file']})")
    print("===================================================\n")

    test_queries = [
        {
            "name": "Basic Question 1: What is knitting?",
            "question": "what is knitting?",
        },
        {
            "name": "Basic Question 2: What is yarn?",
            "question": "what is yarn?",
        },
        {
            "name": "Basic Question 3: What is a slip knot?",
            "question": "what is a slip knot?",
        },
        {
            "name": "Materials Question: What materials are required?",
            "question": "What materials are required?",
        },
        {
            "name": "Process Question: How do I start knitting?",
            "question": "How do I start knitting?",
        },
        {
            "name": "Comparison Question: Difference between wool and cotton yarn",
            "question": "What is the difference between wool yarn and cotton yarn?",
        },
        {
            "name": "Technique Question: Why should I not pull yarn too tightly?",
            "question": "Why should I avoid pulling the yarn too tightly?",
        },
        {
            "name": "Presentation Question: How to present products?",
            "question": "How can I present and share my knitted products attractively?",
        },
        {
            "name": "Out of Scope Question 1: Chemistry / Acrylic",
            "question": "What is the chemical composition of acrylic yarn?",
        },
        {
            "name": "Out of Scope Question 2: Baking cake",
            "question": "How do I bake a chocolate cake?",
        },
    ]

    for t in test_queries:
        print(f"\n------------------------------------------------------------")
        print(f"TEST: {t['name']}")
        print(f"QUERY: \"{t['question']}\"")

        result = query_rag(
            request={
                "question": t["question"],
                "language": "en",
            },
            debug=False,
        )

        sources_repr = (
            ", ".join(f"{s.video_title} ({s.score})" for s in result.sources)
            if result.sources
            else "None (out of scope)"
        )

        print("\nRESULT SUMMARY:")
        print(f"Confidence: {result.confidence}")
        print(f"Sources: {sources_repr}")
        print(f"Answer:\n{result.answer}")
        print(f"Suggested Questions: {result.relevant_questions}")

    print("\n============================================================")
    print("Evaluation run finished successfully!")


if __name__ == "__main__":
    run_evaluation()

