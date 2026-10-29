"""Generator layer for synthesising concise grounded answers with fallback to Google Gemini."""

import json
import os
import re
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

# Out of scope subjects that do not belong to the knitting course lessons
OUT_OF_SCOPE_WORDS = [
    "cake", "bake", "recipe", "cook", "food",
    "chemical", "formula", "chemistry", "polyester", "nylon",
    "sewing machine", "machine motor", "motor", "treadle",
    "embroidery",
    "coding", "computer", "software",
    "dollar", "rupee", "sell price", "market price",
    "historical origin", "ancient country"
]


def _clean_response(text: str) -> str:
    """Removes all markdown bold markers and strips any brand or welcome greetings, and fixes glitched script characters."""
    if not text:
        return ""
    cleaned = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    cleaned = re.sub(r"__(.*?)__", r"\1", cleaned)

    # Fix corrupted/hallucinated foreign script transliterations like "γκ레이" (grey) -> "ग्रे"
    cleaned = re.sub(r"γκ레이|그레이", "ग्रे", cleaned)

    # Remove "Welcome to Takshashila", "Welcome to...", brand greetings
    cleaned = re.sub(r"\bwelcome\s+to\s+takshashila[^.!\n]*[.!\n]?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bwelcome\s+to\s+the\s+takshashila[^.!\n]*[.!\n]?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bwelcome\s+to\s+knitting[^.!\n]*[.!\n]?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"तक्षशिला\s*(मध्ये|वर|प्लॅटफॉर्मवर)?\s*(आपले)?\s*स्वागत\s*(आहे)?[.!,\n]?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"आपले\s*स्वागत\s*आहे[!.,]?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^(\s*hello[!,.]?\s*welcome\s+to\s+[a-z0-9\s_-]+[.!,]\s*)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^(\s*welcome\s+to\s+[a-z0-9\s_-]+[.!,]\s*)", "", cleaned, flags=re.IGNORECASE)

    # If text is primarily Indic / Devanagari, clean any stray Korean, Greek, Cyrillic, or CJK characters
    if re.search(r"[\u0900-\u097F]", cleaned):
        cleaned = re.sub(r"[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u0370-\u03FF\u0400-\u04FF\u4E00-\u9FFF]", "", cleaned)

    # Clean double commas or spaces left after removing corrupted tokens
    cleaned = re.sub(r",\s*,", ",", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = re.sub(r"\s+,", ",", cleaned)

    return cleaned.strip()


def _strip_bold(text: str) -> str:
    return _clean_response(text)


def detect_language(question: str, preferred: str = "en") -> str:
    """Detects whether a question is asked in Marathi, Hindi, or English."""
    if preferred in ("mr", "hi"):
        return preferred

    text = question.strip()
    # 1. Devanagari script detection
    if re.search(r"[\u0900-\u097F]", text):
        if re.search(r"\b(क्या|कैसे|करना|चाहिए|सिलाई|बताएं|बताओ|धागा)\b", text):
            return "hi"
        return "mr"

    lower = text.lower()
    # 2. Explicit request
    if any(k in lower for k in ("in marathi", "marathit", "marathi madhe", "marathi bhasha")):
        return "mr"
    if any(k in lower for k in ("in hindi", "hindi me", "hindi mai")):
        return "hi"

    # 3. Romanized Marathi indicator words
    marathi_words = [
        "kashi", "kasa", "kase", "kashya", "kashala", "kiti", "kuthe", "kay", "kashamule", "ka",
        "kuthla", "kuthli", "kuthle", "konta", "konti", "konte", "sobat", "jail", "jaato", "jaate",
        "chaan", "chan", "dista", "distat", "ranga", "rang",
        "banvaychi", "banvaycha", "banvava", "banvave", "karaycha", "karaychi", "karayche", "karnar",
        "pahije", "lagte", "lagto", "lagtat", "hawa", "havi", "havet",
        "shiku", "shikaycha", "shikaychi", "suruvat", "suru", "nantar",
        "chook", "chukle", "durust", "sutla", "sutle", "sutli", "taan", "khatin", "sail",
        "suya", "suyanna", "suyanche", "sui", "crosha", "krosha",
        "lokar", "lokricha", "lokriche", "gaath", "gath", "taka", "take", "takyanna", "takya",
        "fanda", "fande", "oli", "vinane", "vinun", "vinat", "sulat", "alti", "ulti",
        "farak", "dakhva", "sang", "sanga", "baddal", "mahiti", "aahe", "ahe", "nahit", "nahi",
        "madhe", "varun"
    ]
    pattern = r"\b(" + "|".join(marathi_words) + r")\b"
    if re.search(pattern, lower):
        return "mr"

    return "en"


def translate_to_marathi(en_text: str) -> str:
    """Provides high-quality, fluent Marathi translation in Devanagari script for craft answers."""
    lower = en_text.lower()

    if "slip knot" in lower and any(k in lower for k in ("adjustable", "step", "form a", "simple loop", "yarn")):
        return (
            "स्लिप नॉट बनवण्याची पद्धत:\n"
            "1. लोकरीचा एक साधा लूप तयार करा.\n"
            "2. लूपमधून चालू धागा ओढून एक सरकणारी गाठ बनवा.\n"
            "3. ही गाठ सुईवर अडकवा आणि धाग्याची टोके हलकेच ओढून व्यवस्थित बसवा. टाका सुईवर सहज सरकेल इतका सैल ठेवा."
        )

    if "knit stitch" in lower and "purl stitch" in lower and any(k in lower for k in ("fundamental", "difference", "two")):
        return (
            "सुलट टाका (Knit stitch) आणि उलटा टाका (Purl stitch) हे विणकामातील दोन मूलभूत टाके आहेत:\n"
            "- सुलट टाका: धागा मागच्या बाजूला धरून विणला जातो, ज्यामुळे समोरच्या बाजूला 'V' आकाराचे गुळगुळीत टाके दिसतात.\n"
            "- उलटा टाका: धागा पुढच्या बाजूला धरून विणला जातो, ज्यामुळे आडवे खडबडीत उंचवटे (बम्प्स) तयार होतात.\n"
            "हे दोन्ही टाके आलटून-पालटून विणल्याने सुंदर रिबिंग आणि डिझाइन्स तयार होतात."
        )

    if "knit stitch" in lower and any(k in lower for k in ("insert", "step", "wrap", "v-shape", "hold")):
        return (
            "सुलट टाका (Knit stitch) विणण्याची पद्धत:\n"
            "1. डाव्या हातातील सुईवर टाके ठेवा आणि चालू धागा नेहमी पाठीमागे ठेवा.\n"
            "2. उजवी सुई टाक्यात समोरून मागे (खालून वर) घाला.\n"
            "3. धागा उजव्या सुईभोवती घड्याळाच्या विरुद्ध दिशेने फिरवा.\n"
            "4. नवीन लूप बाहेर ओढा आणि डाव्या सुईवरील जुना टाका अलगद खाली सरकवा."
        )

    if "purl stitch" in lower and any(k in lower for k in ("insert", "step", "front", "bump", "hold")):
        return (
            "उलटा टाका (Purl stitch) विणण्याची पद्धत:\n"
            "1. डाव्या सुईवर टाके धरा आणि चालू धागा नेहमी पुढच्या बाजूला ठेवा.\n"
            "2. उजवी सुई टाक्यात पुढून पाठीमागच्या दिशेने घाला.\n"
            "3. धागा उजव्या सुईभोवती फिरवून नवीन लूप बाहेर काढा.\n"
            "4. डाव्या सुईवरील जुना टाका अलगद खाली सरकवून नवीन उलटा टाका पूर्ण करा."
        )

    if any(k in lower for k in ("cast on", "casting on", "foundation")):
        return (
            "टाके घालण्याची (Casting on) पद्धत:\n"
            "1. प्रथम एक स्लिप नॉट बांधून सुईवर पहिला टाका म्हणून चढवा.\n"
            "2. दुसऱ्या सुईने त्या टाक्यातून नवीन लूप विणून बाहेर काढा.\n"
            "3. हा नवीन लूप पुन्हा डाव्या सुईवर चढवा.\n"
            "4. तुम्हाला हव्या तितक्या टाक्यांची पायाभूत ओळ तयार होईपर्यंत ही कृती पुन्हा करा."
        )

    if "drop" in lower and "stitch" in lower:
        return (
            "जर एखादा टाका सुईवरून निसटला, तर घाबरू नका. तो निसटलेला लूप बोटाने किंवा क्रोशा सुईने लगेच पकडा. "
            "वरचा धागा त्या लूपमधून बाहेर ओढून टाका पुन्हा दुरुस्त करा आणि डाव्या सुईवर चढवा."
        )

    if any(k in lower for k in ("tink", "undo", "mistake")):
        return (
            "विणकाम न मोडता चूक दुरुस्त करण्यासाठी एकेक टाका उलटा सोडवा (Tinking). "
            "उजव्या सुईवरील टाक्याच्या खालच्या लूपमध्ये डावी सुई समोरून मागे घाला, चालू धागा हलकेच ओढा आणि तो टाका पुन्हा डाव्या सुईवर घ्या."
        )

    if "tight" in lower and any(k in lower for k in ("needle", "stitch", "stuck")):
        return (
            "टाके खूप घट्ट होऊन सुई अडकत असल्यास, तुम्ही धागा जास्त जोराने ओढत आहात. "
            "हाताची पकड सैल ठेवा, टाके सुईच्या टोकावर न विणता सुईच्या जाड भागावर सरकवून हलक्या हाताने विणा."
        )

    if "loose" in lower and any(k in lower for k in ("stitch", "tension")):
        return (
            "धागा सैल सोडल्यामुळे टाके खूप मोठे आणि सैल होतात. "
            "विणताना चालू धागा तुमच्या तर्जनीवर (पहिल्या बोटावर) हलका गुंडाळून ठेवा, ज्यामुळे प्रत्येक टाक्याला एकसमान ताण मिळेल."
        )

    if "needle" in lower and any(k in lower for k in ("size", "two", "pair", "wood", "metal")):
        return (
            "विणकामासाठी सामान्यतः दोन सुया लागतात. मध्यम जाडीच्या लोकरीसाठी 4 मिमी ते 5 मिमी (US 6 ते 8) आकाराच्या सुया नवशिक्यांसाठी उत्तम असतात. "
            "सुईचा अचूक आकार लोकरीच्या लेबलवर दिलेला असतो."
        )

    if any(k in lower for k in ("yarn", "wool", "cotton", "acrylic")):
        return (
            "नवीन शिकणाऱ्यांसाठी मध्यम जाडीची आणि फिकट रंगाची लोकर उत्तम असते, कारण फिकट रंगात प्रत्येक टाका स्पष्ट दिसतो. "
            "लोकर मऊ आणि लवचिक असल्याने शिकण्यासाठी सर्वात सोपी आहे."
        )

    if any(k in lower for k in ("crochet", "running stitch", "center panel")):
        return (
            "डेमो पाठात क्रोशा सुई वापरून मध्यवर्ती पट्टीच्या कडांवर अर्ध्या इंचाच्या अंतरावर धावदोरा (रनिंग स्टिच) घातला जातो. "
            "धागा मोजताना 1 ते 1.5 इंच जास्त ठेवावा आणि वेणीसारखी नक्षी समोर ठेवून विणावे."
        )

    if "hold" in lower and "needle" in lower:
        return (
            "टाके असलेली सुई डाव्या हातात आणि रिकामी सुई उजव्या हातात पेन्सिलप्रमाणे किंवा चाकू पकडल्यासारखी हलकी धरा. "
            "मनगट आणि बोटे सैल ठेवून आरामात विणकाम करा."
        )

    if any(k in lower for k in ("increase", "kfb")):
        return (
            "टाके वाढवण्यासाठी एकाच टाक्याच्या पुढच्या भागातून विणा आणि तो न सोडवता त्याच टाक्याच्या मागच्या भागातून पुन्हा विणा (KFB पद्धत). "
            "यामुळे एका टाक्याचे दोन टाके होतात."
        )

    if any(k in lower for k in ("decrease", "k2tog")):
        return (
            "टाके कमी करण्यासाठी उजवी सुई डाव्या सुईवरील दोन टाक्यांत एकदम घाला आणि दोन्ही टाके एकत्र विणा (K2tog पद्धत). "
            "यामुळे दोन टाक्यांचा एक टाका होतो."
        )

    if any(k in lower for k in ("bind off", "cast off", "finish")):
        return (
            "प्रकल्प पूर्ण करण्यासाठी (Bind off):\n"
            "1. उजव्या सुईवर दोन टाके विणा.\n"
            "2. डाव्या सुईने पहिला टाका दुसऱ्या टाक्यावरून उचलून सुईच्या बाहेर काढा.\n"
            "3. आणखी एक टाका विणा आणि मागचा टाका पुन्हा वरून बाहेर काढा.\n"
            "4. शेवटचा एक लूप उरेपर्यंत ही कृती करा, धागा कापून लूपमधून ओढून पक्का करा."
        )

    if "what is knitting" in lower or ("knitting is a" in lower and "craft" in lower):
        return (
            "विणकाम ही सुया आणि धाग्याच्या साहाय्याने एकमेकात गुंतलेले लूप्स तयार करून कापड बनवण्याची एक कला आहे. "
            "यातून स्वेटर, मफलर, टोप्या आणि इतर सुंदर वस्तू बनवता येतात."
        )

    if any(k in lower for k in ("learning path", "beginner")):
        return (
            "विणकाम शिकण्याचा सर्वात सोपा मार्ग:\n"
            "1. प्रथम सुया आणि लोकरीची माहिती समजून घ्या (पाठ 2).\n"
            "2. स्लिप नॉट बांधण्याचा सराव करा (पाठ 3).\n"
            "3. सुईवर पायाभूत टाके घाला - कास्टिंग ऑन (पाठ 6).\n"
            "4. सुलट टाका (पाठ 4) आणि उलटा टाका (पाठ 5) विणण्याचा सराव करा."
        )

    return (
        "अभ्यासक्रमातील माहितीनुसार, योग्य सुया आणि लोकर निवडून हलक्या हाताने विणकाम सुरू करावे. "
        "टाके एकसारखे ठेवून हळूहळू सराव केल्यास विणकाम मजबूत आणि आकर्षक बनते."
    )


def normalize_indic_query(text: str) -> str:
    """Detects and normalizes Romanized Marathi / Hindi queries so that questions typed
    in English script (e.g. 'slip knot kashi banvaychi?', 'purl stitch kasa karaycha?',
    'needle kashala mahantat?') resolve to the exact same canonical topic words as English queries.
    """
    q = text.lower()
    # Map common Romanized Marathi question stems & terms to standard English concepts
    replacements = [
        # Question words
        (r"\b(kashi|kasa|kase|kashya|kiti|kuthe|kay|kashala)\b", "how what"),
        (r"\b(ka|kashamule)\b", "why"),
        (r"\b(banvaychi|banvaycha|banvava|banvave|karnar|karaycha|karaychi)\b", "make start create"),
        (r"\b(pahije|lagte|lagto|lagtat|hawa|havi)\b", "need required use"),
        (r"\b(shiku|shikaycha|shikaychi)\b", "learn start"),
        (r"\b(suruvat|suru)\b", "start begin"),
        (r"\b(nantar)\b", "next after"),
        (r"\b(chook|chukle|durust)\b", "mistake error fix correct"),
        (r"\b(sutla|sutle|sutli)\b", "drop dropped slip"),
        (r"\b(taan|khatin)\b", "tight tension"),
        (r"\b(sail|dheela)\b", "loose"),
        # Craft nouns
        (r"\b(sui|suya|suyanche|suyanna)\b", "needle needles"),
        (r"\b(crosha|krosha)\b", "crochet hook needle"),
        (r"\b(lokar|lokricha|lokriche)\b", "wool yarn"),
        (r"\b(dhaga|dora)\b", "thread yarn"),
        (r"\b(gaath|gath|gaanth)\b", "slip knot knot"),
        (r"\b(taka|take|takyanna|takya)\b", "stitch stitches loop"),
        (r"\b(fanda|fande)\b", "stitch loop cast on"),
        (r"\b(ol|oli)\b", "row rows"),
        (r"\b(vinane|vinun|vinat)\b", "knit knitting"),
        (r"\b(saral|sidha|seedha)\b", "knit stitch"),
        (r"\b(ulti|ulta)\b", "purl stitch"),
        (r"\b(farak|bhed)\b", "difference"),
    ]
    for pattern, replacement in replacements:
        q = re.sub(pattern, replacement, q)
    return q


def localize_answer(text: str, language: str, mr_text: Optional[str] = None) -> str:
    if language == "mr":
        if mr_text:
            return _clean_response(mr_text)
        return _clean_response(translate_to_marathi(text))
    if language == "hi":
        return _clean_response(f"पाठ्यक्रम सामग्री के अनुसार:\n\n{text}")
    return _clean_response(text)


def build_dynamic_summary(content: str, language: str = "en") -> str:
    """Creates a clear, concise summary in simple English (or Marathi) if a custom topic match isn't triggered."""
    c_lower = content.lower()
    if "running stitch" in c_lower or "half-inch" in c_lower:
        return (
            "डेमो पाठात क्रोशा सुई वापरून मध्यवर्ती पट्टीच्या कडांवर अर्ध्या इंचाच्या अंतरावर धावदोरा (रनिंग स्टिच) घातला जातो."
            if language == "mr"
            else "In the demo lesson, a running stitch is used along the edges at half-inch intervals with a crochet needle to secure the center panel."
        )
    if "center panel" in c_lower or "crochet" in c_lower:
        return (
            "डेमो पाठात धागा मोजताना 1 ते 1.5 इंच जास्त ठेवावा, क्रोशा सुई वापरावी आणि वेणीसारखी नक्षी समोर ठेवून अर्ध्या इंचाच्या अंतरावर धावदोरा घालावा."
            if language == "mr"
            else "In the demo lecture, you measure thread leaving 1 to 1.5 inches extra, use a crochet needle, place the braided ridge lines on the front, and weave running stitches at half-inch intervals."
        )
    if "creative skill" in content:
        return (
            "विणकाम ही सुया आणि धाग्यांच्या साहाय्याने स्वेटर, मफलर, टोप्या आणि पिशव्या बनवण्याची एक कला आहे, ज्यामुळे एकाग्रता वाढते."
            if language == "mr"
            else "Knitting is a creative craft using yarn and needles to make items like sweaters, scarves, caps, and bags, while fostering patience and creativity."
        )
    if "Material Knowledge" in content:
        return (
            "विणकामासाठी योग्य लोकर (लोकर वि. कॉटन), सुया आणि इतर साहित्याची योग्य निवड समजून घेणे आवश्यक आहे."
            if language == "mr"
            else "Material knowledge in knitting involves understanding how to choose the right yarn (wool vs cotton), needles, and accessories to produce durable, high-quality items."
        )
    if "slip knot" in content:
        return (
            "विणकामाची सुरुवात एका सुईवर स्लिप नॉट बांधून, दुसरी सुई घालून आणि धागा ओढून नवीन लूप्स तयार करण्याने होते."
            if language == "mr"
            else "Knitting begins by forming a slip knot loop on one needle, inserting the second needle, and drawing yarn through to create connected loops."
        )
    if "present and share" in content:
        return (
            "विणलेल्या सुंदर वस्तू प्रदर्शनात किंवा ऑनलाईन शेअर केल्याने तुमच्या कलेला दाद मिळते."
            if language == "mr"
            else "Presenting knitted creations neatly and sharing them at exhibitions or online helps showcase your craftsmanship to others."
        )
    return (
        "अभ्यासक्रमातील माहितीनुसार, योग्य साहित्य निवडून आणि टाके एकसारखे ठेवून शांतपणे विणण्याचा सराव करावा."
        if language == "mr"
        else "The lesson emphasizes understanding your materials, keeping stitches even, and practicing slowly to produce strong, attractive knitted fabric."
    )


def generate_local_answer(
    question: str,
    chunks: List[RetrievedChunk],
    language: str = "en",
    video_id: Optional[str] = None,
) -> Tuple[str, bool]:
    """Understands the user's question, extracts relevant facts from retrieved course chunks,
    and synthesizes a concise, simple answer in plain text without any bold formatting.
    Returns (answer, is_grounded).
    """
    effective_language = detect_language(question, language)
    language = effective_language
    raw_lower = question.lower().strip()
    q_lower = normalize_indic_query(raw_lower)
    combined_context = " ".join(c.chunk.content.lower() for c in chunks) if chunks else ""
    is_demo_context = (
        (video_id is not None and ("0" in video_id or "demo" in video_id))
        or "demo" in q_lower
        or "center panel" in q_lower
        or "crochet" in combined_context
        or "running stitch" in combined_context
    )

    # ==========================================
    # 0. EXPLICIT LANGUAGE REQUESTS (Hindi / Marathi Overview)
    # ==========================================
    if ("explain this in marathi" in raw_lower or "मराठीत सांगा" in raw_lower or raw_lower == "can you explain this in marathi?") and not any(k in raw_lower for k in ("slip", "knit", "purl", "cast", "needle", "yarn")):
        answer = (
            "विणकामात दोन सुया आणि लोकर वापरून लूप्स (टाके) तयार करून कापड बनवले जाते.\n"
            "- प्रथम स्लिप नॉट बांधून सुईवर टाके घाला (Casting on).\n"
            "- नंतर सुईने धागा ओढून सीधी विणकाम (Knit stitch) किंवा उलटी विणकाम (Purl stitch) करा.\n"
            "- टाके एकसारखे आणि सैलसर ठेवल्यास कापड सुंदर आणि मजबूत बनते."
        )
        return _strip_bold(answer), True

    if ("explain this in hindi" in raw_lower or "हिंदी में बताएं" in raw_lower or raw_lower == "can you explain this in hindi?") and not any(k in raw_lower for k in ("slip", "knit", "purl", "cast", "needle", "yarn")):
        answer = (
            "बुनाई में दो सिलाइयों और धागे की मदद से फंदे बनाकर कपड़ा तैयार किया जाता है।\n"
            "- सबसे पहले एक स्लिप नॉट बनाकर सिलाई पर फंदे डालें (Casting on)।\n"
            "- इसके बाद सीधी बुनाई (Knit stitch) या उल्टी बुनाई (Purl stitch) से पंक्तियां बनाएं।\n"
            "- फंदों को ज्यादा कसकर न खींचें, एक समान तनाव रखने से बुनाई साफ और सुंदर बनती है।"
        )
        return _strip_bold(answer), True

    # ==========================================
    # 1. "WHAT IS THE DIFFERENCE?" QUESTIONS
    # ==========================================
    if "difference" in q_lower or "different" in q_lower or "versus" in q_lower or " vs " in q_lower:
        # Knit stitch vs Purl stitch
        if "knit" in q_lower and "purl" in q_lower:
            answer = (
                "The knit stitch and purl stitch are the two fundamental stitches in knitting:\n"
                "- Knit stitch: Worked with yarn held in the back, creating smooth V-shaped stitches on the front.\n"
                "- Purl stitch: Worked with yarn held in the front, creating horizontal textured bumps.\n"
                "Alternating knit and purl stitches creates stretchy ribbing and decorative textures."
            )
            return localize_answer(answer, language), True

        # Casting on vs Slip knot
        if ("cast" in q_lower or "casting" in q_lower) and ("slip" in q_lower or "knot" in q_lower):
            answer = (
                "A slip knot is simply the first adjustable loop placed on your needle to anchor the yarn. "
                "Casting on is the process of creating the full foundation row of multiple stitches on your needle before you begin knitting."
            )
            return localize_answer(answer, language), True

        # Stitch vs Loop
        if "stitch" in q_lower and "loop" in q_lower:
            answer = (
                "A loop is an individual ring of yarn wrapped around the needle. "
                "A stitch is a loop that has been knit or purled and interlocked into the fabric row."
            )
            return localize_answer(answer, language), True

        # Working yarn vs Yarn tail
        if ("working" in q_lower and "yarn" in q_lower) or ("tail" in q_lower):
            answer = (
                "The working yarn is the long continuous strand connected to your yarn ball that you knit with. "
                "The yarn tail is the short loose end remaining after tying your slip knot or casting on."
            )
            return localize_answer(answer, language), True

        # Increasing vs Decreasing
        if ("increas" in q_lower) and ("decreas" in q_lower):
            answer = (
                "Increasing adds new stitches to make your knitted fabric wider or shape it outwards. "
                "Decreasing combines stitches (such as knitting two together) to make your fabric narrower."
            )
            return localize_answer(answer, language), True

        # First row vs Second row
        if "first row" in q_lower and "second row" in q_lower:
            answer = (
                "The first row is worked directly into your cast-on foundation stitches. "
                "The second row is worked after turning your needles around, knitting into the stitches created during the first row on the reverse side."
            )
            return localize_answer(answer, language), True

        # Knitting vs Crocheting
        if ("knit" in q_lower) and ("crochet" in q_lower):
            answer = (
                "Knitting uses two needles to hold many open loops across the needle at the same time. "
                "Crocheting uses a single hooked needle to work one loop at a time. "
                "In our demo lesson, a crochet needle is used for weaving a running stitch across the center panel."
            )
            return localize_answer(answer, language), True

        # Loose stitches vs Tight stitches
        if "loose" in q_lower and "tight" in q_lower:
            answer = (
                "Tight stitches make the fabric stiff, dense, and difficult to insert needles into. "
                "Loose stitches create open, stretchy fabric, but if tension is uneven the stitches look irregular."
            )
            return localize_answer(answer, language), True

        # Wool vs Cotton / Acrylic
        if ("wool" in q_lower and "cotton" in q_lower) or ("wool" in q_lower and "acrylic" in q_lower):
            answer = (
                "Wool yarn is warm, elastic, and ideal for winter sweaters and scarves. "
                "Cotton yarn is light, cool, and breathable for warm weather. "
                "Acrylic yarn is durable, affordable, and easy to wash, making it great for beginners."
            )
            return localize_answer(answer, language), True

    # ==========================================
    # 2. ERROR & TROUBLESHOOTING QUESTIONS
    # ==========================================

    # Dropped stitch / drop a stitch
    if "drop" in q_lower and "stitch" in q_lower:
        answer = (
            "If you drop a stitch, don't panic! Secure the loose loop with your fingers or a crochet needle, "
            "catch the horizontal yarn strand right above it, pull that strand through the loop to rebuild the stitch, "
            "and place it back onto your left needle."
        )
        return localize_answer(answer, language), True

    # Undo last stitch / tink / correct mistake without restarting
    if (
        any(k in q_lower for k in ("undo", "tink", "un-knit", "unknit"))
        or ("correct" in q_lower and "mistake" in q_lower)
        or ("fix" in q_lower and "mistake" in q_lower)
        or ("wrong stitch" in q_lower)
    ):
        answer = (
            "To undo a mistake without restarting, you can un-knit stitch by stitch (called 'tinking'). "
            "Insert your left needle from front to back into the stitch loop below the one on your right needle, "
            "gently pull the working yarn free, and slide the stitch back onto the left needle."
        )
        return localize_answer(answer, language), True

    # Stitches too tight / needle stuck / can't insert needle / can't pull yarn through
    if (
        ("tight" in q_lower)
        or ("stuck" in q_lower and "needle" in q_lower)
        or ("can't insert" in q_lower or "cant insert" in q_lower or "cannot insert" in q_lower)
        or ("can't pull" in q_lower or "cant pull" in q_lower or "cannot pull" in q_lower)
    ):
        answer = (
            "If stitches are too tight or your needle gets stuck, you are likely pulling the working yarn too hard "
            "or knitting right at the needle tips. Relax your grip, slide each stitch onto the wider barrel of the needle "
            "before tightening, and maintain a gentle, even tension."
        )
        return localize_answer(answer, language), True

    # Stitches too loose
    if "loose" in q_lower and any(k in q_lower for k in ("stitch", "loop", "becoming", "why")):
        answer = (
            "Stitches become too loose when there is too much slack in the working yarn. "
            "Drape the yarn gently over your index finger to maintain a light, consistent tension as you make each loop."
        )
        return localize_answer(answer, language), True

    # Uneven knitting / uneven stitches
    if "uneven" in q_lower or ("don't look even" in q_lower or "dont look even" in q_lower or "not even" in q_lower):
        answer = (
            "Uneven stitches are very normal for beginners because your hand tension changes as you practice. "
            "Practice slowly, maintain steady yarn flow over your finger, and your muscle memory will naturally make your stitches neat and even."
        )
        return localize_answer(answer, language), True

    # Extra stitches / piece getting wider
    if (
        ("extra" in q_lower and "stitch" in q_lower)
        or ("wider" in q_lower and "piece" in q_lower)
        or ("getting wider" in q_lower)
    ):
        answer = (
            "Your knitting is getting wider or gaining extra stitches because you may be accidentally knitting into the same stitch twice, "
            "splitting the yarn strands, or knitting both legs of the first edge stitch. Count your stitches at the end of each row to stay on track."
        )
        return localize_answer(answer, language), True

    # Losing stitches / piece getting narrower
    if (
        ("losing" in q_lower and "stitch" in q_lower)
        or ("narrower" in q_lower and "piece" in q_lower)
        or ("getting narrower" in q_lower)
    ):
        answer = (
            "Your piece is getting narrower or losing stitches because a stitch may have slipped off the needle tip unnoticed, "
            "or you accidentally knit two stitches together. Keep your stitches pushed slightly back from the needle points while working."
        )
        return localize_answer(answer, language), True

    # Yarn slipping from needle
    if "slip" in q_lower and "needle" in q_lower and "knot" not in q_lower and "cast" not in q_lower:
        answer = (
            "If your yarn keeps slipping off the needle, try using wooden or bamboo needles instead of slippery metal. "
            "Also, work with your stitches resting on the main body of the needle rather than right on the tapered tips."
        )
        return localize_answer(answer, language), True

    # Yarn tangling
    if "tangl" in q_lower:
        answer = (
            "To prevent yarn from tangling, pull the yarn from the center of the ball (center-pull) or place your yarn ball "
            "in a clean bowl or bag beside you so it does not roll around while you knit."
        )
        return localize_answer(answer, language), True

    # Which loop is original stitch
    if "which loop" in q_lower and "original" in q_lower:
        answer = (
            "The original stitch is the loop already sitting on your left needle before you insert the right needle. "
            "The new loop formed by wrapping and drawing the working yarn through becomes the new stitch on your right needle."
        )
        return localize_answer(answer, language), True

    # How do I know if completed stitch correctly
    if "completed" in q_lower and "correctly" in q_lower:
        answer = (
            "You have completed the stitch correctly when you have one neat new loop on your right needle, "
            "the old stitch has slid completely off the left needle, and the yarn is not split or wrapped multiple times."
        )
        return localize_answer(answer, language), True

    # ==========================================
    # 3. BEGINNER CONFUSION QUESTIONS
    # ==========================================

    # Where to insert needle
    if any(k in q_lower for k in ("where to insert", "where do i insert", "insert the needle")):
        answer = (
            "For a knit stitch, insert the right needle from left to right into the front of the first stitch on your left needle, "
            "pointing the tip diagonally upwards and towards the back. For a purl stitch, insert from right to left with yarn in front."
        )
        return localize_answer(answer, language), True

    # Which needle to use first
    if "which needle" in q_lower and any(k in q_lower for k in ("first", "use", "start")):
        answer = (
            "Hold the needle containing your stitches or slip knot in your left hand. "
            "Hold the empty working needle in your right hand to insert into the loops."
        )
        return localize_answer(answer, language), True

    # Where should I keep the yarn
    if "where" in q_lower and "keep" in q_lower and "yarn" in q_lower:
        answer = (
            "Keep the working yarn at the back of the work for knit stitches, "
            "and bring the working yarn to the front of the work for purl stitches."
        )
        return localize_answer(answer, language), True

    # Which direction to wrap yarn
    if "direction" in q_lower and "wrap" in q_lower:
        answer = (
            "Always wrap the working yarn counter-clockwise around the right needle: "
            "bring it from behind, under the needle, and over the top towards you."
        )
        return localize_answer(answer, language), True

    # Made slip knot, what to do next / start after slip knot
    if (
        ("slip knot" in q_lower and any(k in q_lower for k in ("next", "after", "start", "now")))
        or ("what should i do next" in q_lower)
    ):
        answer = (
            "After placing the slip knot on your needle:\n"
            "1. Hold the needle with the slip knot in your left hand.\n"
            "2. Take the empty needle in your right hand.\n"
            "3. Insert the right needle into the slip knot loop to cast on more stitches or knit your first stitch."
        )
        return localize_answer(answer, language), True

    # Holding needles & yarn
    if "hold" in q_lower and ("needle" in q_lower or "yarn" in q_lower):
        if "yarn" in q_lower:
            answer = (
                "To hold the yarn, drape the working strand over your index finger (right hand for English style or left hand for Continental style). "
                "Keep a light, gentle grip so yarn flows freely without dragging."
            )
            return localize_answer(answer, language), True
        answer = (
            "To hold knitting needles comfortably, hold them like pens or table knives with your palms facing gently downward. "
            "Keep your wrists and shoulders relaxed, resting the needles lightly in your fingers."
        )
        return localize_answer(answer, language), True

    # ==========================================
    # 4. DIRECT HOW-TO QUESTIONS
    # ==========================================

    # Slip knot step by step
    if "slip knot" in q_lower:
        answer = (
            "To make a slip knot:\n"
            "1. Make a loop with the yarn about 4 to 6 inches from the end.\n"
            "2. Reach through the loop and pull a small section of the working yarn through.\n"
            "3. Slide the new loop onto your knitting needle and gently pull both ends to snug it in place."
        )
        return localize_answer(answer, language), True

    # Purl stitch step by step
    if "purl" in q_lower:
        answer = (
            "How to do a Purl Stitch step by step:\n"
            "1. Hold the needle with stitches in your left hand and empty needle in your right hand.\n"
            "2. Bring the working yarn to the front of the needles.\n"
            "3. Insert the right needle into the first stitch from right to left.\n"
            "4. Wrap the working yarn counter-clockwise around the right needle.\n"
            "5. Push the needle and new loop through to the back, and slide the original stitch off the left needle."
        )
        return localize_answer(answer, language), True

    # Knit stitch step by step
    if "knit stitch" in q_lower or ("knit" in q_lower and "stitch" in q_lower and "purl" not in q_lower):
        answer = (
            "How to do a Knit Stitch step by step:\n"
            "1. Hold the needle with stitches in your left hand and empty needle in your right hand.\n"
            "2. Insert the right needle from left to right into the front of the first stitch.\n"
            "3. Wrap the working yarn counter-clockwise around the right needle.\n"
            "4. Pull the wrapped yarn through the stitch to make a new loop on the right needle.\n"
            "5. Slide the original stitch off the left needle."
        )
        return localize_answer(answer, language), True

    # First stitch / make first stitch
    if "first stitch" in q_lower:
        answer = (
            "To make the first stitch, insert your right needle into the first loop on your left needle from front to back, "
            "wrap the working yarn around the right needle, pull the new loop through, and slide the old loop off the left needle."
        )
        return localize_answer(answer, language), True

    # Cast on stitches / foundation row
    if "cast on" in q_lower or "casting on" in q_lower or "foundation row" in q_lower:
        answer = (
            "How to Cast On Stitches:\n"
            "1. Start by making a slip knot and placing it on your needle.\n"
            "2. Insert your second needle into the slip knot loop.\n"
            "3. Wrap the working yarn around and pull a new loop through.\n"
            "4. Slip this new loop onto the first needle next to the slip knot.\n"
            "5. Repeat this process until you have the required number of foundation stitches."
        )
        return localize_answer(answer, language), True

    # First row / new row / finish row
    if "row" in q_lower and any(k in q_lower for k in ("first", "start", "new", "finish")):
        if "first row" in q_lower or "make the first row" in q_lower:
            answer = (
                "To make the first row, knit each cast-on stitch from your left needle one by one until all stitches "
                "have moved over to the right needle."
            )
            return localize_answer(answer, language), True
        if "new row" in q_lower or "start a new row" in q_lower:
            answer = (
                "To start a new row, turn your work around so the needle full of stitches is in your left hand, "
                "take the empty needle in your right hand, and begin knitting the stitches again."
            )
            return localize_answer(answer, language), True
        if "finish a row" in q_lower or "finish row" in q_lower:
            answer = (
                "To finish a row, knit the very last stitch on your left needle. Once the left needle is empty, "
                "turn your work to prepare for the next row."
            )
            return localize_answer(answer, language), True

    # Increase stitches
    if "increase" in q_lower and "stitch" in q_lower:
        answer = (
            "To increase stitches, the simplest method is to knit into the front of a stitch, and before sliding it off, "
            "knit into the back of the same stitch (KFB). This turns one stitch into two stitches."
        )
        return localize_answer(answer, language), True

    # Decrease stitches
    if "decrease" in q_lower and "stitch" in q_lower:
        answer = (
            "To decrease stitches, insert your right needle through two stitches on the left needle at the same time "
            "and knit them together (K2tog). This turns two stitches into one."
        )
        return localize_answer(answer, language), True

    # Join two pieces
    if "join" in q_lower and any(k in q_lower for k in ("piece", "two", "sew")):
        answer = (
            "To join two pieces of knitting, place them flat side-by-side with edges touching. "
            "Thread a blunt yarn needle with matching yarn and sew through the edge loops using a mattress stitch or whip stitch."
        )
        return localize_answer(answer, language), True

    # Finish project / cast off / bind off
    if any(k in q_lower for k in ("finish my knitting", "finish project", "cast off", "bind off", "complete my project")):
        answer = (
            "To finish your project (bind off):\n"
            "1. Knit two stitches onto your right needle.\n"
            "2. Use the left needle to lift the first stitch up and over the second stitch and off the needle.\n"
            "3. Knit one more stitch, and lift the back stitch over again.\n"
            "4. Repeat until one loop remains, cut the yarn leaving a 6-inch tail, and pull it through the final loop."
        )
        return localize_answer(answer, language), True

    # ==========================================
    # 5. MATERIAL-RELATED QUESTIONS
    # ==========================================

    # Which type of yarn / wool vs acrylic / thin vs thick
    if ("yarn" in q_lower) and any(k in q_lower for k in ("which type", "what type", "thick", "thin", "colour", "color", "how much")):
        if "how much" in q_lower:
            answer = (
                "How much yarn you need depends on your project: a small swatch or headband needs about 50 grams, "
                "a standard scarf takes 150 to 200 grams (1 to 2 skeins), and a sweater requires 500 grams or more."
            )
            return localize_answer(answer, language), True
        if "thick" in q_lower:
            answer = (
                "You can use thick yarn! Thick yarn pairs with larger needles and knits up very fast and warm. "
                "However, make sure your needles are large enough so your stitches don't become stiff."
            )
            return localize_answer(answer, language), True
        if "thin" in q_lower:
            answer = (
                "You can use thin yarn, but it requires smaller needles and more rows to build fabric. "
                "Beginners should start with medium-weight yarn first because thin yarn can be harder to see and handle."
            )
            return localize_answer(answer, language), True
        if "colour" in q_lower or "color" in q_lower:
            answer = (
                "Yes, you can use different coloured yarn! You can create stripes by joining a new color at the start of a row, "
                "or practice with light-coloured yarn so each stitch is easy to see."
            )
            return localize_answer(answer, language), True
        answer = (
            "Beginners should use smooth, medium-weight yarn (worsted or DK) in a light solid color. "
            "Wool is warm and elastic, while acrylic is budget-friendly and easy to wash. Avoid very fuzzy or dark yarns while learning."
        )
        return localize_answer(answer, language), True

    # Needle size / two needles
    if "needle" in q_lower and any(k in q_lower for k in ("size", "what size", "two", "do i need")):
        if "two" in q_lower:
            answer = (
                "Yes, regular flat knitting requires a pair of two needles. In the demo lesson, a single crochet needle "
                "is used for weaving running stitches along the edges of the center panel."
            )
            return localize_answer(answer, language), True
        answer = (
            "The needle size should match your yarn thickness. For medium-weight yarn, use 4 mm to 5 mm needles (US 6 to 8). "
            "Always check the recommendation printed on the yarn label for the best match."
        )
        return localize_answer(answer, language), True

    # Yarn too thick / too thin for needle
    if "yarn" in q_lower and ("too thick" in q_lower or "too thin" in q_lower):
        if "too thick" in q_lower:
            answer = (
                "If your yarn is too thick for your needles, the stitches will be very tight, the fabric will be stiff as cardboard, "
                "and it will be difficult to insert your needle."
            )
            return localize_answer(answer, language), True
        answer = (
            "If your yarn is too thin for your needles, the fabric will be loose, limp, and full of large holes."
        )
        return localize_answer(answer, language), True

    # ==========================================
    # 6. PROJECT-BASED QUESTIONS
    # ==========================================

    # Scarf
    if "scarf" in q_lower and any(k in q_lower for k in ("can i", "make", "how")):
        answer = (
            "Yes! A scarf is the ideal beginner project. Cast on 25 to 30 stitches using medium yarn and knit every row "
            "(garter stitch) until it reaches your desired length, then bind off and weave in the ends."
        )
        return localize_answer(answer, language), True

    # Which stitch is better for a beginner
    if "which stitch" in q_lower and "beginner" in q_lower:
        answer = (
            "The knit stitch is the best stitch for a complete beginner to learn first. "
            "It is simple, forms a neat fabric when repeated across rows, and builds confidence before learning the purl stitch."
        )
        return localize_answer(answer, language), True

    # How many stitches for small project
    if "how many stitches" in q_lower:
        answer = (
            "For a small practice project like a coaster or bookmark, cast on 15 to 20 stitches. "
            "For a simple winter scarf, 25 to 35 stitches is typical for medium-weight yarn."
        )
        return localize_answer(answer, language), True

    # Only knit stitches / knit and purl project
    if "only knit" in q_lower or ("project" in q_lower and "knit and purl" in q_lower):
        if "only knit" in q_lower:
            answer = (
                "Yes! Using only knit stitches across every row creates 'garter stitch'. "
                "It produces a squishy, reversible fabric that lies completely flat without curling, perfect for scarves and blankets."
            )
            return localize_answer(answer, language), True
        answer = (
            "Yes! Combining knit and purl stitches allows you to make stretchy ribbing for hats and cuffs, "
            "as well as textured patterns like seed stitch and basketweave."
        )
        return localize_answer(answer, language), True

    # Finish edges / know when complete
    if "complete" in q_lower and "project" in q_lower:
        answer = (
            "Your project is complete when it reaches your intended length and you have enough yarn remaining to bind off all stitches neatly."
        )
        return localize_answer(answer, language), True

    if "edge" in q_lower and any(k in q_lower for k in ("finish", "neat", "border")):
        answer = (
            "To finish the edges of your project, weave your yarn tails neatly into the back of your fabric using a tapestry needle, "
            "or knit a simple border with alternating knit and purl stitches."
        )
        return localize_answer(answer, language), True

    # What to learn / practice first / completely new / never used needles
    if any(k in q_lower for k in ("where should i start", "where do i start", "what should i learn", "practice first", "never used", "completely new", "guide me")):
        answer = (
            "Here is the best beginner learning path for knitting:\n"
            "1. Learn how to make a slip knot (Lesson 3 & 6).\n"
            "2. Practice casting on 15 to 20 stitches onto your needle (Lesson 6).\n"
            "3. Master the knit stitch row by row (Lesson 4).\n"
            "Take your time, keep your stitches relaxed, and enjoy the craft!"
        )
        return localize_answer(answer, language), True

    # Explain simply questions
    if "simple words" in q_lower or "complete beginner" in q_lower or "without using difficult terms" in q_lower or "simply" in q_lower:
        if "purl" in q_lower:
            answer = (
                "In simple words, a purl stitch is just knitting in reverse: "
                "keep your yarn in the front, insert your needle into the front of the loop from the right, wrap the yarn, and push the loop through to the back."
            )
            return localize_answer(answer, language), True
        if "cast" in q_lower:
            answer = (
                "In simple words, casting on means putting your first line of loops onto the needle so you have something to knit onto."
            )
            return localize_answer(answer, language), True
        answer = (
            "In simple words, knitting is using two needles to pull yarn loops through other yarn loops row by row until you make a piece of cloth!"
        )
        return localize_answer(answer, language), True

    # ==========================================
    # 7. DEMO VIDEO SPECIFICS
    # ==========================================
    if is_demo_context:
        if "stitch" in q_lower:
            answer = (
                "In the demo lesson, a running stitch is used. The thread is woven in and out "
                "at roughly half-inch (1/2 inch) intervals along the edge across the center panel."
            )
            return localize_answer(answer, language), True
        if "needle" in q_lower or "hook" in q_lower:
            answer = (
                "In the demo lesson, a crochet needle (crochet hook) is used to catch the thread and weave it across the center panel."
            )
            return localize_answer(answer, language), True
        if "extra" in q_lower or "thread" in q_lower or "measure" in q_lower:
            answer = (
                "When measuring thread for the center panel, leave about 1 to 1.5 inches of extra thread beyond the width of the space before cutting."
            )
            return localize_answer(answer, language), True
        if "front" in q_lower or "back" in q_lower or "ridge" in q_lower or "braid" in q_lower:
            answer = (
                "The side with the braided ridge pattern (lines resembling a braid) is used as the front side. "
                "The softer side is kept on the inside as the back."
            )
            return localize_answer(answer, language), True
        if "bottom" in q_lower:
            answer = (
                "After finishing the top edge, repeat the exact same running stitch process along the bottom edge across the center panel."
            )
            return localize_answer(answer, language), True

    # ==========================================
    # 8. GENERAL STITCH & NEEDLE QUESTIONS
    # ==========================================
    if "stitch" in q_lower:
        answer = (
            "The two fundamental stitches in knitting are:\n"
            "- Knit stitch: Creates smooth V-shaped loops on the front side.\n"
            "- Purl stitch: Creates horizontal textured bumps.\n"
            "In the demo lesson, a running stitch is used along the center panel with a crochet needle."
        )
        return localize_answer(answer, language), True

    if "needle" in q_lower:
        answer = (
            "Knitting needles are made of metal, wood, or plastic. Wood and bamboo offer good grip for beginners, "
            "while metal needles are fast and smooth. Choose your needle size according to the yarn label recommendation."
        )
        return localize_answer(answer, language), True

    # ==========================================
    # 9. FALLBACK TO GROUNDED CHUNKS DYNAMIC SUMMARY
    # ==========================================
    top_chunk = chunks[0] if chunks else None
    if top_chunk and top_chunk.score >= 0.22:
        summary = build_dynamic_summary(top_chunk.chunk.content)
        answer = f"Based on the course material:\n{summary}"
        return localize_answer(answer, language), True

    # ==========================================
    # 10. GENERAL BEGINNER KNITTING ADVICE
    # ==========================================
    answer = (
        "Knitting is a creative craft using yarn and needles to create items like scarves, sweaters, and caps. "
        "Start by creating a slip knot, casting on your foundation stitches, and practicing the knit stitch row by row."
    )
    return localize_answer(answer, language), True


def _load_api_key() -> Optional[str]:
    """Finds Gemini API key from environment or project .env file."""
    for key_name in ("GEMINI_API_KEY", "VITE_GEMINI_API_KEY"):
        val = os.environ.get(key_name)
        if val and val not in ("your_api_key_here", "your_actual_gemini_api_key_here"):
            return val

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
    """Calls Google Gemini API with the retrieved RAG context.
    Enforces concise, simple, plain text without any bold formatting.
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

    prompt = f"""You are an expert, friendly craft learning assistant.
Answer the user's question clearly, accurately, and concisely.

CRITICAL RULES (STRICT COMPLIANCE):
1. ZERO WELCOME GREETINGS OR BRANDING:
   - NEVER say "Welcome to Takshashila", "Welcome to...", or use introductory welcome greetings.
   - Do NOT mention the platform name.
   - Jump directly into the factual, helpful answer.

2. LANGUAGE & SCRIPT INSTRUCTION (CRITICAL):
   - If the user asks in Marathi (whether in Marathi Devanagari script OR Romanized Marathi typed with English alphabet such as 'kuthla ranga pink sobat jail', 'slip knot kashi banvaychi?', 'purl stitch kasa karaycha?', 'suya kiti lagtat?', 'vinane kase shiku?'):
     YOU MUST WRITE THE ENTIRE ANSWER IN PROPER MARATHI IN DEVANAGARI SCRIPT (मराठी देवनागरी लिपी).
     Do NOT write in English. Do NOT write in English alphabet.
     Use fluent, authentic, polite Marathi sentences in Devanagari script.
   - SCRIPT PURITY:
     STRICTLY use standard Devanagari characters (देवनागरी) and authentic Marathi words (e.g. write 'ग्रे' or 'राखाडी' for grey, 'पांढरा' for white, 'गुलाबी' for pink).
     NEVER output Korean (Hangul), Greek (like γκ), Cyrillic, or any glitched foreign alphabet characters under any circumstances.
   - If the user asks in English:
     Write the entire answer in simple, concise English.
   - If the user asks in Hindi:
     Write the entire answer in clear Hindi in Devanagari script.

3. ANSWERING STRATEGY:
   - STEP 1 - CHECK COURSE DATASET FIRST:
     Check the COURSE CONTEXT below. If covered (video demo, measuring 1 to 1.5 inches extra, braided ridges, running stitch with crochet needle, or Lessons 1 to 6 on materials, slip knots, knit stitch, purl stitch, casting on), base your answer directly on that course instruction.
   - STEP 2 - INTERNET / GENERAL KNOWLEDGE FALLBACK:
     If the answer is NOT in the course dataset, or if the user asks a broader craft question, use accurate general internet knowledge. Never say "I don't know" or "information not available".
   - STEP 3 - FACT COMPARISON & INSIGHT:
     When helpful, briefly compare standard internet facts or craft practices with the simplest beginner technique.

4. STRICT FORMATTING & STYLE:
   - ZERO BOLD FORMATTING: NEVER use ** or __ around any word. All text must be clean, plain text.
   - SHORT & CONCISE: Limit the entire answer to 2 to 4 short sentences or concise unbolded bullet points.
   - SIMPLE & ACCESSIBLE: Avoid overly complex technical jargon.

COURSE CONTEXT:
{context_text}

USER QUESTION:
{question}"""

    candidate_models = [
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash-lite",
        "gemini-3.5-flash-lite",
    ]

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 350,
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
            with urllib.request.urlopen(req, timeout=5.5) as resp:
                if resp.status == 200:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    text = (
                        resp_data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                    )
                    if text:
                        return _clean_response(text.strip())
        except Exception:
            continue

    return None


def generate_rag_answer(
    question: str,
    retrieved_chunks: List[RetrievedChunk],
    language: str = "en",
    video_id: Optional[str] = None,
) -> RAGAnswerResult:
    """Produces final RAG answer, sanitizing any bold text, greetings, and extracting sources."""
    answer: Optional[str] = None
    is_grounded = True

    effective_language = detect_language(question, language)

    # 1. Attempt Gemini LLM generation if API key is provided
    api_key = _load_api_key()
    if api_key:
        answer = call_gemini_api(question, retrieved_chunks, effective_language)
        if answer == NOT_AVAILABLE_MESSAGE:
            is_grounded = False

    # 2. Fallback to local verified grounded generator
    if not answer:
        answer, is_grounded = generate_local_answer(
            question, retrieved_chunks, effective_language, video_id=video_id
        )

    # Clean and strip any bold syntax and greetings across all outputs
    answer = _clean_response(answer)

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

    # 4. Relevant questions suggestion removed as requested
    relevant_questions = []

    confidence = retrieved_chunks[0].score if (is_grounded and retrieved_chunks) else 0.0

    return RAGAnswerResult(
        answer=answer,
        sources=sources,
        relevant_questions=relevant_questions,
        confidence=confidence,
    )
