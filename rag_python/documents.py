"""Knitting knowledge base documents sourced directly from video1.txt, video2.txt, and video3.txt."""

from dataclasses import dataclass, field
from typing import List


@dataclass
class KnowledgeDocument:
    id: str  # e.g. "video-1"
    video_order: int
    title: str
    source_file: str
    content: str
    summary: str
    key_topics: List[str] = field(default_factory=list)
    starter_questions: List[str] = field(default_factory=list)


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


KNITTING_DOCUMENTS: List[KnowledgeDocument] = [
    KnowledgeDocument(
        id="video-1",
        video_order=1,
        title="Lesson 1: Introduction to Knitting & Presentation",
        source_file="video1.txt",
        content=VIDEO1_TEXT,
        summary=(
            "Overview of knitting as a creative craft using yarn and needles, products that can be "
            "made, patience and skill building, and how to present and showcase knitted products attractively."
        ),
        key_topics=[
            "magic of knitting",
            "yarn and needles",
            "knitted products",
            "sweaters",
            "scarves",
            "caps",
            "bags",
            "patience and creativity",
            "presentation",
            "exhibitions",
            "social media",
            "sharing with family and friends",
        ],
        starter_questions=[
            "What products can I make using knitting?",
            "How does knitting help develop patience and creativity?",
            "How can I present and share my knitted products attractively?",
            "Where can I showcase my finished knitted items?",
        ],
    ),
    KnowledgeDocument(
        id="video-2",
        video_order=2,
        title="Lesson 2: Materials & Tools Knowledge",
        source_file="video2.txt",
        content=VIDEO2_TEXT,
        summary=(
            "Understanding different yarn types (wool vs cotton), needle sizes and materials "
            "(metal, wood, plastic), and essential knitting tools like scissors, measuring tapes, "
            "stitch markers, and yarn needles."
        ),
        key_topics=[
            "material knowledge",
            "yarn types",
            "wool yarn",
            "cotton yarn",
            "warm weather vs winter clothes",
            "knitting needles",
            "needle sizes",
            "metal wood plastic needles",
            "scissors",
            "measuring tapes",
            "stitch markers",
            "yarn needles",
            "durability and comfort",
        ],
        starter_questions=[
            "What is the difference between wool yarn and cotton yarn?",
            "How do I choose the right needle size and needle material?",
            "What tools do I need for knitting besides yarn and needles?",
            "Why is material knowledge important for successful knitting?",
        ],
    ),
    KnowledgeDocument(
        id="video-3",
        video_order=3,
        title="Lesson 3: Basic Process — Slip Knot to Fabric",
        source_file="video3.txt",
        content=VIDEO3_TEXT,
        summary=(
            "Step-by-step instructions for creating a slip knot, placing loops onto needles, "
            "wrapping yarn to form new loops, maintaining stitch tension, and working row by row into fabric."
        ),
        key_topics=[
            "slip knot",
            "first loop",
            "placing loop on needle",
            "second needle insertion",
            "wrapping yarn",
            "pulling loop through",
            "creating more loops",
            "stitch tension",
            "avoid pulling too tightly",
            "forming fabric",
            "row by row knitting",
            "neat and strong fabric",
        ],
        starter_questions=[
            "How do I make a slip knot to start knitting?",
            "How do I create new loops with the second needle?",
            "Why should I avoid pulling the yarn too tightly?",
            "How do loops connect to form a piece of fabric?",
        ],
    ),
]

GENERAL_STARTER_QUESTIONS: List[str] = [
    "How do I start knitting as a beginner?",
    "What is the difference between wool yarn and cotton yarn?",
    "What tools do I need to begin knitting?",
    "How do I create a slip knot and first row of stitches?",
    "How can I present and sell my knitted creations?",
]

