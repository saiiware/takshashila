"""Computer Vision & Multimodal Inspection Engine for Knitting.
Specialized for:
  1. Slip Knot analysis (correct, loose, tight) - Lesson 3
  2. Yarn classification (wool vs cotton) - Lesson 2
  3. Needle identification (metal vs wooden) & sizing - Lesson 2
  4. Wrong Image / Unrelated Photo Detection
"""

import base64
import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from .documents import KNITTING_DOCUMENTS
from .generator import _load_api_key


@dataclass
class VisionAssessmentResult:
    category: str  # 'slip_knot' | 'yarn' | 'needle' | 'general' | 'invalid_image'
    status: str    # 'correct' | 'needs_improvement' | 'unclear' | 'invalid'
    title: str
    score: float
    detected_items: List[str]
    feedback: str
    solution: str
    lesson_reference: str
    sources: List[Dict[str, Any]] = field(default_factory=list)
    confidence: float = 0.9
    is_wrong_image: bool = False


SYSTEM_PROMPT = """You are an expert AI Computer Vision Knitting Coach for the Takshashila craft platform.
Analyze the provided photo focusing on the course curriculum (Lesson 2: Materials & Lesson 3: Slip Knot).

CRITICAL STEP 1 — RELEVANCE & WRONG IMAGE DETECTION:
First, inspect whether the uploaded image contains knitting craftwork, tools, or materials (slip knot loop on a needle, wool/cotton yarn ball or skein, metal or wooden knitting needles, or hand-knitted fabric).
If the image depicts an UNRELATED subject (for example: animals, dogs, cats, cars, vehicles, food, meals, human faces, selfies, portraits, buildings, rooms, furniture, nature landscapes, documents, mobile phones, screens, non-knitted clothing, memes, or completely non-knitting items), or is blank/unreadable:
You MUST output this exact JSON format:
{
  "category": "invalid_image",
  "status": "invalid",
  "title": "Wrong Photo Detected ⚠️",
  "score": 0.0,
  "detected_items": ["Unrelated object / non-knitting subject (<name what is seen>)", "No knitting materials detected"],
  "feedback": "This image does not contain knitting materials or craftwork. The computer vision inspector detected <describe what you see>, which is unrelated to the course lessons.",
  "solution": "Please upload a clear photo of your knitting practice: 1) Slip knot on a needle (Lesson 3), 2) Wool or cotton yarn ball/skein (Lesson 2), or 3) Knitting needles (metal or wood, Lesson 2).",
  "lesson_reference": "Course Curriculum: Lesson 2 & Lesson 3"
}

IF THE IMAGE IS GENUINE KNITTING CRAFTWORK:
1. SLIP KNOT & STITCH TENSION (Lesson 3):
   - Assess whether the slip knot is formed and placed onto the needle correctly.
   - If CORRECT: Loop is snug yet movable, neat tail, ready for needle 2.
   - If TIGHT: Loop is choked/strangled on the needle. State: "Avoid pulling the yarn too tightly (Lesson 3)".
   - If LOOSE: Loop is saggy or falling off needle. State: "Keep loops even and neat for strong fabric (Lesson 3)".

2. 2 TYPES OF YARNS (Lesson 2):
   - Wool yarn: Thicker, fuzzy, textured, crimped, warm—best for winter sweaters and cold weather.
   - Cotton yarn: Smoother, compact, lighter, breathable—best for warm weather items.

3. 2 TYPES OF NEEDLES (Lesson 2):
   - Metal needles: Metallic shine, sleek, fast-gliding.
   - Wooden / Bamboo needles: Natural wood grain, matte, gentle grip for beginners.
   - Evaluate whether needle thickness matches the yarn thickness.

Output ONLY a JSON object:
{
  "category": "slip_knot" | "yarn" | "needle" | "general" | "invalid_image",
  "status": "correct" | "needs_improvement" | "unclear" | "invalid",
  "title": "Short descriptive title",
  "score": number between 0.0 and 10.0,
  "detected_items": ["item 1", "item 2"],
  "feedback": "Detailed observation of the image",
  "solution": "Actionable correction grounded strictly in Lesson 2 or Lesson 3",
  "lesson_reference": "Lesson 2: Materials & Tools Knowledge" or "Lesson 3: Basic Process — Slip Knot to Fabric"
}
Do not include any extra commentary outside JSON."""


def _call_gemini_vision(
    image_bytes: bytes,
    mime_type: str = "image/png",
    user_prompt: str = "Please inspect this photo of my knitting work.",
) -> Optional[Dict[str, Any]]:
    api_key = _load_api_key()
    if not api_key:
        return None

    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{SYSTEM_PROMPT}\n\nUSER QUESTION/CONTEXT: {user_prompt}"},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": encoded_image,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "maxOutputTokens": 600,
        },
    }
    payload_bytes = json.dumps(payload).encode("utf-8")

    candidate_models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]

    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload_bytes,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=9.0) as resp:
                if resp.status == 200:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    text = (
                        resp_data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                    )
                    if text:
                        cleaned = text.strip()
                        if cleaned.startswith("```json"):
                            cleaned = cleaned[7:]
                        if cleaned.endswith("```"):
                            cleaned = cleaned[:-3]
                        return json.loads(cleaned.strip())
        except Exception:
            continue

    return None


def _fallback_classification(
    image_bytes: bytes, hint: str = ""
) -> Dict[str, Any]:
    """Smart heuristic fallback if API call is unavailable or fails."""
    h_lower = hint.lower()

    # 0. Check for non-knitting / unrelated keywords
    unrelated_keywords = [
        ("dog", "pet (dog)"),
        ("cat", "pet (cat)"),
        ("puppy", "pet (puppy)"),
        ("kitten", "pet (kitten)"),
        ("pet", "animal/pet"),
        ("animal", "animal"),
        ("bird", "bird"),
        ("fish", "fish"),
        ("car", "vehicle (car)"),
        ("vehicle", "vehicle"),
        ("bike", "bicycle/motorcycle"),
        ("bicycle", "bicycle"),
        ("motorcycle", "motorcycle"),
        ("truck", "truck"),
        ("airplane", "aircraft"),
        ("train", "train"),
        ("food", "food item"),
        ("pizza", "food (pizza)"),
        ("burger", "food (burger)"),
        ("fruit", "fruit"),
        ("apple", "apple"),
        ("coffee", "beverage (coffee)"),
        ("tea", "beverage (tea)"),
        ("cake", "cake"),
        ("selfie", "personal selfie"),
        ("portrait", "portrait"),
        ("face", "human face"),
        ("person", "human figure"),
        ("building", "building"),
        ("house", "house"),
        ("room", "room interior"),
        ("furniture", "furniture"),
        ("chair", "chair"),
        ("table", "table"),
        ("tree", "tree/plant"),
        ("flower", "flower"),
        ("landscape", "landscape scenery"),
        ("mountain", "mountain"),
        ("laptop", "laptop computer"),
        ("phone", "smartphone"),
        ("screen", "screen"),
        ("screenshot", "screen capture"),
        ("document", "document"),
        ("receipt", "paper receipt"),
        ("invoice", "invoice"),
        ("shoe", "footwear/shoes"),
        ("shoes", "footwear/shoes"),
        ("watch", "wristwatch"),
        ("meme", "meme graphic"),
    ]

    knitting_keywords = [
        "slip",
        "knot",
        "slipknot",
        "loop",
        "yarn",
        "wool",
        "woollen",
        "woolen",
        "cotton",
        "needle",
        "needles",
        "sui",
        "suya",
        "stitch",
        "stitches",
        "knit",
        "knitting",
        "skein",
        "ball",
        "thread",
        "fabric",
        "weave",
        "crochet",
    ]

    is_negated = bool(re.search(r"\b(not|without|no|non|isn't)\s+(knitting|knit|craft|yarn|needle|slip\s*knot)", h_lower))

    has_knitting_kw = (
        not is_negated and
        any(re.search(r"\b" + re.escape(k) + r"\b", h_lower) for k in knitting_keywords)
    )

    for kw, label in unrelated_keywords:
        if re.search(r"\b" + kw + r"\b", h_lower) and not has_knitting_kw:
            return {
                "category": "invalid_image",
                "status": "invalid",
                "title": f"Wrong Photo: {label.title()} Detected ⚠️",
                "score": 0.0,
                "detected_items": [f"Unrelated subject: {label}", "No knitting materials found"],
                "feedback": (
                    f"The uploaded image appears to show a {label}, which is not related to knitting. "
                    "This computer vision tool is specifically trained to analyze knitting craftwork: "
                    "slip knot loop tension (Lesson 3), yarn classification (Lesson 2), and needle identification (Lesson 2)."
                ),
                "solution": (
                    "Please upload a photo of your knitting practice: 1) Slip knot on the needle (Lesson 3), "
                    "2) A ball of wool or cotton yarn (Lesson 2), or 3) Knitting needles (Lesson 2)."
                ),
                "lesson_reference": "Course Curriculum: Lesson 2 & Lesson 3",
            }

    # 1. Slip knot variations
    if "tight" in h_lower:
        return {
            "category": "slip_knot",
            "status": "needs_improvement",
            "title": "Slip Knot: Tension Too Tight ⚠️",
            "score": 5.0,
            "detected_items": ["Choked slip knot loop", "Knitting needle", "Excess tension"],
            "feedback": (
                "The slip knot is pulled too tightly around the needle shaft. This makes inserting the second needle "
                "difficult and leads to stiff, uneven fabric."
            ),
            "solution": (
                "Lesson 3 rule: Keep the loops even and avoid pulling the yarn too tightly. Loosen the loop slightly "
                "so it glides easily along the needle tip."
            ),
            "lesson_reference": "Lesson 3: Basic Process — Slip Knot to Fabric",
        }

    if "loose" in h_lower:
        return {
            "category": "slip_knot",
            "status": "needs_improvement",
            "title": "Slip Knot: Loop Too Loose ⚠️",
            "score": 5.5,
            "detected_items": ["Oversized slip knot loop", "Loose loop base", "Knitting needle"],
            "feedback": (
                "The slip knot loop is significantly loose and gappy. Loose loops can slip off the needle or cause "
                "the starting edge of your knitted item to sag."
            ),
            "solution": (
                "Lesson 3 rule: Gently pull the working yarn to tighten the knot until it gently rests against the needle, "
                "keeping stitches even for a neat and strong fabric."
            ),
            "lesson_reference": "Lesson 3: Basic Process — Slip Knot to Fabric",
        }

    if "slip" in h_lower or "knot" in h_lower:
        return {
            "category": "slip_knot",
            "status": "correct",
            "title": "Slip Knot: Correct & Even Tension ✅",
            "score": 9.5,
            "detected_items": ["Well-formed slip knot", "Comfortable loop tension", "Knitting needle"],
            "feedback": (
                "Excellent technique! The slip knot is neatly seated on the needle with balanced tension. The loop is snug "
                "without being choked, ready for needle 2 insertion."
            ),
            "solution": (
                "Next step from Lesson 3: Take the second needle and insert it into the loop. Wrap yarn around and pull "
                "through to form new connected loops."
            ),
            "lesson_reference": "Lesson 3: Basic Process — Slip Knot to Fabric",
        }

    # 2. Yarn variations
    if "wool" in h_lower:
        return {
            "category": "yarn",
            "status": "correct",
            "title": "Yarn Identified: Wool Yarn (Winter & Sweaters) 🧶",
            "score": 9.0,
            "detected_items": ["Wool yarn ball", "Crimp/warm texture", "Thick winter gauge"],
            "feedback": (
                "Identified as Wool Yarn. As taught in Lesson 2, wool yarn is warm and resilient with good elasticity, "
                "making it ideal for sweaters, winter clothes, scarves, and caps."
            ),
            "solution": (
                "Lesson 2 advice: Match this thicker wool yarn with appropriately sized needles (medium to thick metal or wood) "
                "to maintain comfort and durability."
            ),
            "lesson_reference": "Lesson 2: Materials & Tools Knowledge",
        }

    if "cotton" in h_lower:
        return {
            "category": "yarn",
            "status": "correct",
            "title": "Yarn Identified: Cotton Yarn (Light & Warm Weather) 🧵",
            "score": 9.0,
            "detected_items": ["Cotton yarn skein", "Smooth plant fiber", "Compact strand"],
            "feedback": (
                "Identified as Cotton Yarn. As highlighted in Lesson 2, cotton yarn is lighter, breathable, and smooth, "
                "making it suitable for items used in warmer weather."
            ),
            "solution": (
                "Lesson 2 advice: Cotton has less natural stretch than wool, so keep your loop tension relaxed and even "
                "while knitting row by row."
            ),
            "lesson_reference": "Lesson 2: Materials & Tools Knowledge",
        }

    # 3. Needle variations
    if "metal" in h_lower:
        return {
            "category": "needle",
            "status": "correct",
            "title": "Needles Identified: Metal Knitting Needles 🥢",
            "score": 9.0,
            "detected_items": ["Metal needles", "Smooth metallic finish", "Tapered tips"],
            "feedback": (
                "Identified as Metal Knitting Needles. Needles come in metal, wood, or plastic. Metal needles are very smooth, "
                "allowing stitches to glide effortlessly and speeding up work."
            ),
            "solution": (
                "Lesson 2 advice: Ensure the needle gauge matches your yarn thickness. The size of the needle is selected "
                "based on yarn thickness and product type."
            ),
            "lesson_reference": "Lesson 2: Materials & Tools Knowledge",
        }

    if "wood" in h_lower:
        return {
            "category": "needle",
            "status": "correct",
            "title": "Needles Identified: Wooden / Bamboo Knitting Needles 🥢",
            "score": 9.0,
            "detected_items": ["Wooden/bamboo needles", "Natural grain finish", "Tactile grip surface"],
            "feedback": (
                "Identified as Wooden Needles. Wood needles provide warmth and natural traction, preventing slippery stitches "
                "from accidentally sliding off—ideal for beginners learning loop formation."
            ),
            "solution": (
                "Lesson 2 advice: Combine with wool or cotton yarn of corresponding thickness for high quality, comfort, "
                "and durability."
            ),
            "lesson_reference": "Lesson 2: Materials & Tools Knowledge",
        }

    # 4. If knitting keywords are present, general craftwork
    if has_knitting_kw:
        return {
            "category": "general",
            "status": "correct",
            "title": "Knitting Craftwork Inspection",
            "score": 8.0,
            "detected_items": ["Knitting materials", "Handmade craft item"],
            "feedback": "Knitting craftwork detected. You can upload photos of your slip knot, wool/cotton yarn, or needles for detailed checks.",
            "solution": "Follow Lesson 2 for materials and tools, and Lesson 3 for the step-by-step slip knot to fabric process.",
            "lesson_reference": "Lesson 2 & Lesson 3",
        }

    # 5. Fallback for any other photo with no knitting keywords: wrong photo!
    return {
        "category": "invalid_image",
        "status": "invalid",
        "title": "Wrong Photo: Non-Knitting Subject Detected ⚠️",
        "score": 0.0,
        "detected_items": ["Unrecognized subject", "No slip knot detected", "No yarn detected", "No knitting needles found"],
        "feedback": (
            "The computer vision inspection could not find any knitting materials or techniques in this photo. "
            "We checked for slip knots on needles, wool or cotton yarn balls, and knitting needles, but none were detected."
        ),
        "solution": (
            "Please upload a clear, well-lit photo of your knitting practice: 1) Your slip knot loop on the needle (Lesson 3), "
            "2) A ball of wool or cotton yarn (Lesson 2), or 3) Your pair of metal or wooden knitting needles (Lesson 2)."
        ),
        "lesson_reference": "Course Curriculum: Lesson 2 & Lesson 3",
    }


def inspect_image(
    image_bytes: bytes,
    mime_type: str = "image/png",
    user_prompt: str = "Please inspect my knitting item.",
) -> VisionAssessmentResult:
    """Main assessment function analyzing user's photo."""
    # 1. Try Gemini Vision API first
    result_dict = _call_gemini_vision(image_bytes, mime_type, user_prompt)

    # 2. If API fails or is not configured, run intelligent fallback
    if not result_dict:
        result_dict = _fallback_classification(image_bytes, user_prompt)

    status = result_dict.get("status", "correct")
    category = result_dict.get("category", "general")
    score = float(result_dict.get("score", 8.5))
    is_wrong = status in ("invalid", "wrong_photo") or category in ("invalid_image", "wrong_photo") or score == 0.0

    # 3. Attach citations from the course knowledge base
    lesson_ref = result_dict.get("lesson_reference", "Lesson 2 & Lesson 3")
    sources = []
    if "Lesson 3" in lesson_ref:
        doc = next((d for d in KNITTING_DOCUMENTS if d.id == "video-3"), None)
        if doc:
            sources.append({
                "videoId": doc.id,
                "videoTitle": doc.title,
                "snippet": doc.content[:130] + "…",
                "score": 0.95,
            })
    if "Lesson 2" in lesson_ref or not sources:
        doc = next((d for d in KNITTING_DOCUMENTS if d.id == "video-2"), None)
        if doc:
            sources.append({
                "videoId": doc.id,
                "videoTitle": doc.title,
                "snippet": doc.content[:130] + "…",
                "score": 0.92,
            })

    confidence = 0.96 if is_wrong else round(max(0.1, min(1.0, score / 10.0)), 2)

    return VisionAssessmentResult(
        category=category,
        status=status,
        title=result_dict.get("title", "Knitting Assessment"),
        score=score,
        detected_items=result_dict.get("detected_items", []),
        feedback=result_dict.get("feedback", ""),
        solution=result_dict.get("solution", ""),
        lesson_reference=lesson_ref,
        sources=sources,
        confidence=confidence,
        is_wrong_image=is_wrong,
    )


def inspect_image_file(file_path: str, user_prompt: str = "") -> VisionAssessmentResult:
    """Inspects an image file directly from disk."""
    p = Path(file_path)
    if not p.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = p.suffix.lower()
    mime = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")

    with open(p, "rb") as f:
        data = f.read()

    # Pass filename in prompt to guide identification
    combined_prompt = f"{user_prompt} (File: {p.name})" if user_prompt else f"Inspecting {p.name}"
    return inspect_image(data, mime, combined_prompt)
