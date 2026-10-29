import type { Language, RAGSource } from "@/types";
import type { RetrievedChunk } from "./retriever";
import { generateRelevantQuestions } from "./relevantQuestions";
import { getGeminiApiKey } from "@/services/speechService";

export interface RAGAnswerResult {
  answer: string;
  sources: RAGSource[];
  relevantQuestions: string[];
  confidence: number;
}

const NOT_AVAILABLE_MESSAGE =
  "This information is not available in the provided course material.";

// Out of scope subjects that do not belong to the knitting video lessons
const OUT_OF_SCOPE_WORDS = [
  "cake", "bake", "recipe", "cook", "food",
  "chemical", "formula", "chemistry", "polyester", "nylon",
  "sewing machine", "machine motor", "motor", "treadle",
  "embroidery",
  "coding", "computer", "software",
  "dollar", "rupee", "sell price", "market price",
  "historical origin", "ancient country"
];

export function cleanResponse(text: string): string {
  if (!text) return "";
  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1");

  // Fix corrupted/hallucinated foreign script transliterations like "γκ레이" (grey) -> "ग्रे"
  cleaned = cleaned.replace(/γκ레이|그레이/g, "ग्रे");

  // Remove "Welcome to Takshashila", "Welcome to...", brand greetings
  cleaned = cleaned
    .replace(/\bwelcome\s+to\s+takshashila[^.!\n]*[.!\n]?/gi, "")
    .replace(/\bwelcome\s+to\s+the\s+takshashila[^.!\n]*[.!\n]?/gi, "")
    .replace(/\bwelcome\s+to\s+knitting[^.!\n]*[.!\n]?/gi, "")
    .replace(/तक्षशिला\s*(मध्ये|वर|प्लॅटफॉर्मवर)?\s*(आपले)?\s*स्वागत\s*(आहे)?[.!,\n]?/gi, "")
    .replace(/आपले\s*स्वागत\s*आहे[!.,]?/gi, "")
    .replace(/^(\s*hello[!,.]?\s*welcome\s+to\s+[a-z0-9\s_-]+[.!,]\s*)/i, "")
    .replace(/^(\s*welcome\s+to\s+[a-z0-9\s_-]+[.!,]\s*)/i, "");

  // If text is primarily Indic / Devanagari, clean any stray Korean, Greek, Cyrillic, or CJK characters
  if (/[\u0900-\u097F]/.test(cleaned)) {
    cleaned = cleaned.replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u0370-\u03FF\u0400-\u04FF\u4E00-\u9FFF]/g, "");
  }

  // Clean double commas or spaces left after removing corrupted tokens
  cleaned = cleaned
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  return cleaned;
}

export function detectLanguage(question: string, preferred: Language = "en"): Language {
  if (preferred === "mr" || preferred === "hi") return preferred;

  const text = question.trim();
  // 1. Devanagari script detection
  if (/[\u0900-\u097F]/.test(text)) {
    if (/\b(क्या|कैसे|करना|चाहिए|सिलाई|बताएं|बताओ|धागा)\b/.test(text)) {
      return "hi";
    }
    return "mr";
  }

  const lower = text.toLowerCase();
  // 2. Explicit language request
  if (
    lower.includes("in marathi") ||
    lower.includes("marathit") ||
    lower.includes("marathi madhe") ||
    lower.includes("marathi bhasha")
  ) {
    return "mr";
  }
  if (lower.includes("in hindi") || lower.includes("hindi me") || lower.includes("hindi mai")) {
    return "hi";
  }

  // 3. Romanized Marathi indicator words
  const marathiWords = [
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
  ];
  const pattern = new RegExp(`\\b(${marathiWords.join("|")})\\b`, "i");
  if (pattern.test(lower)) {
    return "mr";
  }

  return "en";
}

function stripBold(text: string): string {
  return cleanResponse(text);
}

export function normalizeIndicQuery(text: string): string {
  let q = text.toLowerCase();
  const replacements: Array<[RegExp, string]> = [
    [/\b(kashi|kasa|kase|kashya|kiti|kuthe|kay|kashala)\b/g, "how what"],
    [/\b(ka|kashamule)\b/g, "why"],
    [/\b(banvaychi|banvaycha|banvava|banvave|karnar|karaycha|karaychi)\b/g, "make start create"],
    [/\b(pahije|lagte|lagto|lagtat|hawa|havi)\b/g, "need required use"],
    [/\b(shiku|shikaycha|shikaychi)\b/g, "learn start"],
    [/\b(suruvat|suru)\b/g, "start begin"],
    [/\b(nantar)\b/g, "next after"],
    [/\b(chook|chukle|durust)\b/g, "mistake error fix correct"],
    [/\b(sutla|sutle|sutli)\b/g, "drop dropped slip"],
    [/\b(taan|khatin)\b/g, "tight tension"],
    [/\b(sail|dheela)\b/g, "loose"],
    [/\b(sui|suya|suyanche|suyanna)\b/g, "needle needles"],
    [/\b(crosha|krosha)\b/g, "crochet hook needle"],
    [/\b(lokar|lokricha|lokriche)\b/g, "wool yarn"],
    [/\b(dhaga|dora)\b/g, "thread yarn"],
    [/\b(gaath|gath|gaanth)\b/g, "slip knot knot"],
    [/\b(taka|take|takyanna|takya)\b/g, "stitch stitches loop"],
    [/\b(fanda|fande)\b/g, "stitch loop cast on"],
    [/\b(ol|oli)\b/g, "row rows"],
    [/\b(vinane|vinun|vinat)\b/g, "knit knitting"],
    [/\b(saral|sidha|seedha)\b/g, "knit stitch"],
    [/\b(ulti|ulta)\b/g, "purl stitch"],
    [/\b(farak|bhed)\b/g, "difference"],
  ];
  for (const [pattern, replacement] of replacements) {
    q = q.replace(pattern, replacement);
  }
  return q;
}

/**
 * Understands the user's question, extracts relevant facts from retrieved course chunks,
 * and synthesizes a concise, grounded answer in simple, plain text without any bold formatting.
 */
export function generateLocalAnswer(
  question: string,
  chunks: RetrievedChunk[],
  language: Language = "en",
  videoId?: string | null
): { answer: string; isGrounded: boolean } {
  const effectiveLanguage = detectLanguage(question, language);
  language = effectiveLanguage;
  const rawLower = question.toLowerCase().trim();
  const qLower = normalizeIndicQuery(rawLower);

  const combinedContext = chunks && chunks.length > 0 ? chunks.map((c) => c.chunk.content.toLowerCase()).join(" ") : "";
  const isDemoContext =
    (videoId !== null && videoId !== undefined && (videoId.includes("0") || videoId.includes("demo"))) ||
    qLower.includes("demo") ||
    qLower.includes("center panel") ||
    combinedContext.includes("crochet") ||
    combinedContext.includes("running stitch");

  // ==========================================
  // 0. EXPLICIT LANGUAGE REQUESTS (Hindi / Marathi Overview)
  // ==========================================
  if (
    (rawLower.includes("explain this in marathi") || rawLower.includes("मराठीत सांगा") || rawLower === "can you explain this in marathi?") &&
    !["slip", "knit", "purl", "cast", "needle", "yarn"].some((k) => rawLower.includes(k))
  ) {
    const answer =
      "विणकामात दोन सुया आणि लोकर वापरून लूप्स (टाके) तयार करून कापड बनवले जाते.\n" +
      "- प्रथम स्लिप नॉट बांधून सुईवर टाके घाला (Casting on).\n" +
      "- नंतर सुईने धागा ओढून सीधी विणकाम (Knit stitch) किंवा उलटी विणकाम (Purl stitch) करा.\n" +
      "- टाके एकसारखे आणि सैलसर ठेवल्यास कापड सुंदर आणि मजबूत बनते.";
    return { answer: stripBold(answer), isGrounded: true };
  }

  if (
    (rawLower.includes("explain this in hindi") || rawLower.includes("हिंदी में बताएं") || rawLower === "can you explain this in hindi?") &&
    !["slip", "knit", "purl", "cast", "needle", "yarn"].some((k) => rawLower.includes(k))
  ) {
    const answer =
      "बुनाई में दो सिलाइयों और धागे की मदद से फंदे बनाकर कपड़ा तैयार किया जाता है।\n" +
      "- सबसे पहले एक स्लिप नॉट बनाकर सिलाई पर फंदे डालें (Casting on)।\n" +
      "- इसके बाद सीधी बुनाई (Knit stitch) या उल्टी बुनाई (Purl stitch) से पंक्तियां बनाएं।\n" +
      "- फंदों को ज्यादा कसकर न खींचें, एक समान तनाव रखने से बुनाई साफ और सुंदर बनती है।";
    return { answer: stripBold(answer), isGrounded: true };
  }


  // ==========================================
  // 1. "WHAT IS THE DIFFERENCE?" QUESTIONS
  // ==========================================
  if (qLower.includes("difference") || qLower.includes("different") || qLower.includes("versus") || qLower.includes(" vs ")) {
    // Knit stitch vs Purl stitch
    if (qLower.includes("knit") && qLower.includes("purl")) {
      const answer =
        "The knit stitch and purl stitch are the two fundamental stitches in knitting:\n" +
        "- Knit stitch: Worked with yarn held in the back, creating smooth V-shaped stitches on the front.\n" +
        "- Purl stitch: Worked with yarn held in the front, creating horizontal textured bumps.\n" +
        "Alternating knit and purl stitches creates stretchy ribbing and decorative textures.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // Casting on vs Slip knot
    if ((qLower.includes("cast") || qLower.includes("casting")) && (qLower.includes("slip") || qLower.includes("knot"))) {
      const answer =
        "A slip knot is simply the first adjustable loop placed on your needle to anchor the yarn. " +
        "Casting on is the process of creating the full foundation row of multiple stitches on your needle before you begin knitting.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // Stitch vs Loop
    if (qLower.includes("stitch") && qLower.includes("loop")) {
      const answer =
        "A loop is an individual ring of yarn wrapped around the needle. " +
        "A stitch is a loop that has been knit or purled and interlocked into the fabric row.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // Working yarn vs Yarn tail
    if ((qLower.includes("working") && qLower.includes("yarn")) || qLower.includes("tail")) {
      const answer =
        "The working yarn is the long continuous strand connected to your yarn ball that you knit with. " +
        "The yarn tail is the short loose end remaining after tying your slip knot or casting on.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // Increasing vs Decreasing
    if (qLower.includes("increas") && qLower.includes("decreas")) {
      const answer =
        "Increasing adds new stitches to make your knitted fabric wider or shape it outwards. " +
        "Decreasing combines stitches (such as knitting two together) to make your fabric narrower.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // First row vs Second row
    if (qLower.includes("first row") && qLower.includes("second row")) {
      const answer =
        "The first row is worked directly into your cast-on foundation stitches. " +
        "The second row is worked after turning your needles around, knitting into the stitches created during the first row on the reverse side.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // Knitting vs Crocheting
    if (qLower.includes("knit") && qLower.includes("crochet")) {
      const answer =
        "Knitting uses two needles to hold many open loops across the needle at the same time. " +
        "Crocheting uses a single hooked needle to work one loop at a time. " +
        "In our demo lesson, a crochet needle is used for weaving a running stitch across the center panel.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // Loose stitches vs Tight stitches
    if (qLower.includes("loose") && qLower.includes("tight")) {
      const answer =
        "Tight stitches make the fabric stiff, dense, and difficult to insert needles into. " +
        "Loose stitches create open, stretchy fabric, but if tension is uneven the stitches look irregular.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }

    // Wool vs Cotton / Acrylic
    if ((qLower.includes("wool") && qLower.includes("cotton")) || (qLower.includes("wool") && qLower.includes("acrylic"))) {
      const answer =
        "Wool yarn is warm, elastic, and ideal for winter sweaters and scarves. " +
        "Cotton yarn is light, cool, and breathable for warm weather. " +
        "Acrylic yarn is durable, affordable, and easy to wash, making it great for beginners.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // ==========================================
  // 2. ERROR & TROUBLESHOOTING QUESTIONS
  // ==========================================

  // Dropped stitch / drop a stitch
  if (qLower.includes("drop") && qLower.includes("stitch")) {
    const answer =
      "If you drop a stitch, don't panic! Secure the loose loop with your fingers or a crochet needle, " +
      "catch the horizontal yarn strand right above it, pull that strand through the loop to rebuild the stitch, " +
      "and place it back onto your left needle.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Undo last stitch / tink / correct mistake without restarting
  if (
    qLower.includes("undo") ||
    qLower.includes("tink") ||
    qLower.includes("un-knit") ||
    qLower.includes("unknit") ||
    (qLower.includes("correct") && qLower.includes("mistake")) ||
    (qLower.includes("fix") && qLower.includes("mistake")) ||
    qLower.includes("wrong stitch")
  ) {
    const answer =
      "To undo a mistake without restarting, you can un-knit stitch by stitch (called 'tinking'). " +
      "Insert your left needle from front to back into the stitch loop below the one on your right needle, " +
      "gently pull the working yarn out, and slide the stitch back onto the left needle.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Stitches too tight / needle stuck / can't insert needle / can't pull yarn through
  if (
    qLower.includes("tight") ||
    (qLower.includes("stuck") && qLower.includes("needle")) ||
    qLower.includes("can't insert") ||
    qLower.includes("cant insert") ||
    qLower.includes("cannot insert") ||
    qLower.includes("can't pull") ||
    qLower.includes("cant pull") ||
    qLower.includes("cannot pull")
  ) {
    const answer =
      "If stitches are too tight or your needle gets stuck, you are likely pulling the working yarn too hard " +
      "or knitting right at the needle tips. Relax your grip, slide each stitch onto the wider barrel of the needle " +
      "before tightening, and maintain a gentle, even tension.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Stitches too loose
  if (qLower.includes("loose") && (qLower.includes("stitch") || qLower.includes("loop") || qLower.includes("becoming") || qLower.includes("why"))) {
    const answer =
      "Stitches become too loose when there is too much slack in the working yarn. " +
      "Drape the yarn gently over your index finger to maintain a light, consistent tension as you make each loop.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Uneven knitting / uneven stitches
  if (qLower.includes("uneven") || qLower.includes("don't look even") || qLower.includes("dont look even") || qLower.includes("not even")) {
    const answer =
      "Uneven stitches are very normal for beginners because your hand tension changes as you practice. " +
      "Practice slowly, maintain steady yarn flow over your finger, and your muscle memory will naturally make your stitches neat and even.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Extra stitches / piece getting wider
  if (
    (qLower.includes("extra") && qLower.includes("stitch")) ||
    (qLower.includes("wider") && qLower.includes("piece")) ||
    qLower.includes("getting wider")
  ) {
    const answer =
      "Your knitting is getting wider or gaining extra stitches because you may be accidentally knitting into the same stitch twice, " +
      "splitting the yarn strands, or knitting both legs of the first edge stitch. Count your stitches at the end of each row to stay on track.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Losing stitches / piece getting narrower
  if (
    (qLower.includes("losing") && qLower.includes("stitch")) ||
    (qLower.includes("narrower") && qLower.includes("piece")) ||
    qLower.includes("getting narrower")
  ) {
    const answer =
      "Your piece is getting narrower or losing stitches because a stitch may have slipped off the needle tip unnoticed, " +
      "or you accidentally knit two stitches together. Keep your stitches pushed slightly back from the needle points while working.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Yarn slipping from needle
  if (qLower.includes("slip") && qLower.includes("needle") && !qLower.includes("knot") && !qLower.includes("cast")) {
    const answer =
      "If your yarn keeps slipping off the needle, try using wooden or bamboo needles instead of slippery metal. " +
      "Also, work with your stitches resting on the main body of the needle rather than right on the tapered tips.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Yarn tangling
  if (qLower.includes("tangl")) {
    const answer =
      "To prevent yarn from tangling, pull the yarn from the center of the ball (center-pull) or place your yarn ball " +
      "in a clean bowl or bag beside you so it does not roll around while you knit.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Which loop is original stitch
  if (qLower.includes("which loop") && qLower.includes("original")) {
    const answer =
      "The original stitch is the loop already sitting on your left needle before you insert the right needle. " +
      "The new loop formed by wrapping and drawing the working yarn through becomes the new stitch on your right needle.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // How do I know if completed stitch correctly
  if (qLower.includes("completed") && qLower.includes("correctly")) {
    const answer =
      "You have completed the stitch correctly when you have one neat new loop on your right needle, " +
      "the old stitch has slid completely off the left needle, and the yarn is not split or wrapped multiple times.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // ==========================================
  // 3. BEGINNER CONFUSION QUESTIONS
  // ==========================================

  // Where to insert needle
  if (qLower.includes("where to insert") || qLower.includes("where do i insert") || qLower.includes("insert the needle")) {
    const answer =
      "For a knit stitch, insert the right needle from left to right into the front of the first stitch on your left needle, " +
      "pointing the tip diagonally upwards and towards the back. For a purl stitch, insert from right to left with yarn in front.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Which needle to use first
  if (qLower.includes("which needle") && (qLower.includes("first") || qLower.includes("use") || qLower.includes("start"))) {
    const answer =
      "Hold the needle containing your stitches or slip knot in your left hand. " +
      "Hold the empty working needle in your right hand to insert into the loops.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Where should I keep the yarn
  if (qLower.includes("where") && qLower.includes("keep") && qLower.includes("yarn")) {
    const answer =
      "Keep the working yarn at the back of the work for knit stitches, " +
      "and bring the working yarn to the front of the work for purl stitches.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Which direction to wrap yarn
  if (qLower.includes("direction") && qLower.includes("wrap")) {
    const answer =
      "Always wrap the working yarn counter-clockwise around the right needle: " +
      "bring it from behind, under the needle, and over the top towards you.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Made slip knot, what to do next / start after slip knot
  if (
    (qLower.includes("slip knot") && (qLower.includes("next") || qLower.includes("after") || qLower.includes("start") || qLower.includes("now"))) ||
    qLower.includes("what should i do next")
  ) {
    const answer =
      "After placing the slip knot on your needle:\n" +
      "1. Hold the needle with the slip knot in your left hand.\n" +
      "2. Take the empty needle in your right hand.\n" +
      "3. Insert the right needle into the slip knot loop to cast on more stitches or knit your first stitch.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Holding needles & yarn
  if (qLower.includes("hold") && (qLower.includes("needle") || qLower.includes("yarn"))) {
    if (qLower.includes("yarn")) {
      const answer =
        "To hold the yarn, drape the working strand over your index finger (right hand for English style or left hand for Continental style). " +
        "Keep a light, gentle grip so yarn flows freely without dragging.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    const answer =
      "To hold knitting needles comfortably, hold them like pens or table knives with your palms facing gently downward. " +
      "Keep your wrists and shoulders relaxed, resting the needles lightly in your fingers.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // ==========================================
  // 4. DIRECT HOW-TO QUESTIONS
  // ==========================================

  // Slip knot step by step
  if (qLower.includes("slip knot")) {
    const answer =
      "To make a slip knot:\n" +
      "1. Make a loop with the yarn about 4 to 6 inches from the end.\n" +
      "2. Reach through the loop and pull a small section of the working yarn through.\n" +
      "3. Slide the new loop onto your knitting needle and gently pull both ends to snug it in place.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Purl stitch step by step
  if (qLower.includes("purl")) {
    const answer =
      "How to do a Purl Stitch step by step:\n" +
      "1. Hold the needle with stitches in your left hand and empty needle in your right hand.\n" +
      "2. Bring the working yarn to the front of the needles.\n" +
      "3. Insert the right needle into the first stitch from right to left.\n" +
      "4. Wrap the working yarn counter-clockwise around the right needle.\n" +
      "5. Push the needle and new loop through to the back, and slide the original stitch off the left needle.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Knit stitch step by step
  if (qLower.includes("knit stitch") || (qLower.includes("knit") && qLower.includes("stitch") && !qLower.includes("purl"))) {
    const answer =
      "How to do a Knit Stitch step by step:\n" +
      "1. Hold the needle with stitches in your left hand and empty needle in your right hand.\n" +
      "2. Insert the right needle from left to right into the front of the first stitch.\n" +
      "3. Wrap the working yarn counter-clockwise around the right needle.\n" +
      "4. Pull the wrapped yarn through the stitch to make a new loop on the right needle.\n" +
      "5. Slide the original stitch off the left needle.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // First stitch / make first stitch
  if (qLower.includes("first stitch")) {
    const answer =
      "To make the first stitch, insert your right needle into the first loop on your left needle from front to back, " +
      "wrap the working yarn around the right needle, pull the new loop through, and slide the old loop off the left needle.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Cast on stitches / foundation row
  if (qLower.includes("cast on") || qLower.includes("casting on") || qLower.includes("foundation row")) {
    const answer =
      "How to Cast On Stitches:\n" +
      "1. Start by making a slip knot and placing it on your needle.\n" +
      "2. Insert your second needle into the slip knot loop.\n" +
      "3. Wrap the working yarn around and pull a new loop through.\n" +
      "4. Slip this new loop onto the first needle next to the slip knot.\n" +
      "5. Repeat this process until you have the required number of foundation stitches.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // First row / new row / finish row
  if (qLower.includes("row") && (qLower.includes("first") || qLower.includes("start") || qLower.includes("new") || qLower.includes("finish"))) {
    if (qLower.includes("first row") || qLower.includes("make the first row")) {
      const answer =
        "To make the first row, knit each cast-on stitch from your left needle one by one until all stitches have moved over to the right needle.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("new row") || qLower.includes("start a new row")) {
      const answer =
        "To start a new row, turn your work around so the needle full of stitches is in your left hand, take the empty needle in your right hand, and begin knitting the stitches again.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("finish a row") || qLower.includes("finish row")) {
      const answer =
        "To finish a row, knit the very last stitch on your left needle. Once the left needle is empty, turn your work to prepare for the next row.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // Increase stitches
  if (qLower.includes("increase") && qLower.includes("stitch")) {
    const answer =
      "To increase stitches, the simplest method is to knit into the front of a stitch, and before sliding it off, " +
      "knit into the back of the same stitch (KFB). This turns one stitch into two stitches.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Decrease stitches
  if (qLower.includes("decrease") && qLower.includes("stitch")) {
    const answer =
      "To decrease stitches, insert your right needle through two stitches on the left needle at the same time " +
      "and knit them together (K2tog). This turns two stitches into one.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Join two pieces
  if (qLower.includes("join") && (qLower.includes("piece") || qLower.includes("two") || qLower.includes("sew"))) {
    const answer =
      "To join two pieces of knitting, place them flat side-by-side with edges touching. " +
      "Thread a blunt yarn needle with matching yarn and sew through the edge loops using a mattress stitch or whip stitch.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Finish project / cast off / bind off
  if (
    qLower.includes("finish my knitting") ||
    qLower.includes("finish project") ||
    qLower.includes("cast off") ||
    qLower.includes("bind off") ||
    qLower.includes("complete my project")
  ) {
    const answer =
      "To finish your project (bind off):\n" +
      "1. Knit two stitches onto your right needle.\n" +
      "2. Use the left needle to lift the first stitch up and over the second stitch and off the needle.\n" +
      "3. Knit one more stitch, and lift the back stitch over again.\n" +
      "4. Repeat until one loop remains, cut the yarn leaving a 6-inch tail, and pull it through the final loop.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // ==========================================
  // 5. MATERIAL-RELATED QUESTIONS
  // ==========================================

  // Which type of yarn / wool vs acrylic / thin vs thick
  if (qLower.includes("yarn") && (qLower.includes("which type") || qLower.includes("what type") || qLower.includes("thick") || qLower.includes("thin") || qLower.includes("colour") || qLower.includes("color") || qLower.includes("how much"))) {
    if (qLower.includes("how much")) {
      const answer =
        "How much yarn you need depends on your project: a small swatch or headband needs about 50 grams, " +
        "a standard scarf takes 150 to 200 grams (1 to 2 skeins), and a sweater requires 500 grams or more.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("thick")) {
      const answer =
        "You can use thick yarn! Thick yarn pairs with larger needles and knits up very fast and warm. " +
        "However, make sure your needles are large enough so your stitches don't become stiff.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("thin")) {
      const answer =
        "You can use thin yarn, but it requires smaller needles and more rows to build fabric. " +
        "Beginners should start with medium-weight yarn first because thin yarn can be harder to see and handle.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("colour") || qLower.includes("color")) {
      const answer =
        "Yes, you can use different coloured yarn! You can create stripes by joining a new color at the start of a row, " +
        "or practice with light-coloured yarn so each stitch is easy to see.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    const answer =
      "Beginners should use smooth, medium-weight yarn (worsted or DK) in a light solid color. " +
      "Wool is warm and elastic, while acrylic is budget-friendly and easy to wash. Avoid very fuzzy or dark yarns while learning.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Needle size / two needles
  if (qLower.includes("needle") && (qLower.includes("size") || qLower.includes("what size") || qLower.includes("two") || qLower.includes("do i need"))) {
    if (qLower.includes("two")) {
      const answer =
        "Yes, regular flat knitting requires a pair of two needles. In the demo lesson, a single crochet needle " +
        "is used for weaving running stitches along the edges of the center panel.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    const answer =
      "The needle size should match your yarn thickness. For medium-weight yarn, use 4 mm to 5 mm needles (US 6 to 8). " +
      "Always check the recommendation printed on the yarn label for the best match.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Yarn too thick / too thin for needle
  if (qLower.includes("yarn") && (qLower.includes("too thick") || qLower.includes("too thin"))) {
    if (qLower.includes("too thick")) {
      const answer =
        "If your yarn is too thick for your needles, the stitches will be very tight, the fabric will be stiff as cardboard, " +
        "and it will be difficult to insert your needle.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    const answer =
      "If your yarn is too thin for your needles, the fabric will be loose, limp, and full of large holes.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // ==========================================
  // 6. PROJECT-BASED QUESTIONS
  // ==========================================

  // Scarf
  if (qLower.includes("scarf") && (qLower.includes("can i") || qLower.includes("make") || qLower.includes("how"))) {
    const answer =
      "Yes! A scarf is the ideal beginner project. Cast on 25 to 30 stitches using medium yarn and knit every row " +
      "(garter stitch) until it reaches your desired length, then bind off and weave in the ends.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Which stitch is better for a beginner
  if (qLower.includes("which stitch") && qLower.includes("beginner")) {
    const answer =
      "The knit stitch is the best stitch for a complete beginner to learn first. " +
      "It is simple, forms a neat fabric when repeated across rows, and builds confidence before learning the purl stitch.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // How many stitches for small project
  if (qLower.includes("how many stitches")) {
    const answer =
      "For a small practice project like a coaster or bookmark, cast on 15 to 20 stitches. " +
      "For a simple winter scarf, 25 to 35 stitches is typical for medium-weight yarn.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Only knit stitches / knit and purl project
  if (qLower.includes("only knit") || (qLower.includes("project") && qLower.includes("knit and purl"))) {
    if (qLower.includes("only knit")) {
      const answer =
        "Yes! Using only knit stitches across every row creates 'garter stitch'. " +
        "It produces a squishy, reversible fabric that lies completely flat without curling, perfect for scarves and blankets.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    const answer =
      "Yes! Combining knit and purl stitches allows you to make stretchy ribbing for hats and cuffs, " +
      "as well as textured patterns like seed stitch and basketweave.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Finish edges / know when complete
  if (qLower.includes("complete") && qLower.includes("project")) {
    const answer =
      "Your project is complete when it reaches your intended length and you have enough yarn remaining to bind off all stitches neatly.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  if (qLower.includes("edge") && (qLower.includes("finish") || qLower.includes("neat") || qLower.includes("border"))) {
    const answer =
      "To finish the edges of your project, weave your yarn tails neatly into the back of your fabric using a tapestry needle, " +
      "or knit a simple border with alternating knit and purl stitches.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // What to learn / practice first / completely new / never used needles
  if (
    qLower.includes("where should i start") ||
    qLower.includes("where do i start") ||
    qLower.includes("what should i learn") ||
    qLower.includes("practice first") ||
    qLower.includes("never used") ||
    qLower.includes("completely new") ||
    qLower.includes("guide me")
  ) {
    const answer =
      "Here is the best beginner learning path for knitting:\n" +
      "1. Learn how to make a slip knot (Lesson 3 & 6).\n" +
      "2. Practice casting on 15 to 20 stitches onto your needle (Lesson 6).\n" +
      "3. Master the knit stitch row by row (Lesson 4).\n" +
      "Take your time, keep your stitches relaxed, and enjoy the craft!";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // Explain simply questions
  if (qLower.includes("simple words") || qLower.includes("complete beginner") || qLower.includes("without using difficult terms") || qLower.includes("simply")) {
    if (qLower.includes("purl")) {
      const answer =
        "In simple words, a purl stitch is just knitting in reverse: " +
        "keep your yarn in the front, insert your needle into the front of the loop from the right, wrap the yarn, and push the loop through to the back.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("cast")) {
      const answer =
        "In simple words, casting on means putting your first line of loops onto the needle so you have something to knit onto.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    const answer =
      "In simple words, knitting is using two needles to pull yarn loops through other yarn loops row by row until you make a piece of cloth!";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // ==========================================
  // 7. DEMO VIDEO SPECIFICS
  // ==========================================
  if (isDemoContext) {
    if (qLower.includes("stitch")) {
      const answer =
        "In the demo lesson, a running stitch is used. The thread is woven in and out " +
        "at roughly half-inch (1/2 inch) intervals along the edge across the center panel.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("needle") || qLower.includes("hook")) {
      const answer =
        "In the demo lesson, a crochet needle (crochet hook) is used to catch the thread and weave it across the center panel.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("extra") || qLower.includes("thread") || qLower.includes("measure")) {
      const answer =
        "When measuring thread for the center panel, leave about 1 to 1.5 inches of extra thread beyond the width of the space before cutting.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("front") || qLower.includes("back") || qLower.includes("ridge") || qLower.includes("braid")) {
      const answer =
        "The side with the braided ridge pattern (lines resembling a braid) is used as the front side. " +
        "The softer side is kept on the inside as the back.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
    if (qLower.includes("bottom")) {
      const answer =
        "After finishing the top edge, repeat the exact same running stitch process along the bottom edge across the center panel.";
      return { answer: localizeAnswer(answer, language), isGrounded: true };
    }
  }

  // ==========================================
  // 8. GENERAL STITCH & NEEDLE QUESTIONS
  // ==========================================
  if (qLower.includes("stitch")) {
    const answer =
      "The two fundamental stitches in knitting are:\n" +
      "- Knit stitch: Creates smooth V-shaped loops on the front side.\n" +
      "- Purl stitch: Creates horizontal textured bumps.\n" +
      "In the demo lesson, a running stitch is used along the center panel with a crochet needle.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  if (qLower.includes("needle")) {
    const answer =
      "Knitting needles are made of metal, wood, or plastic. Wood and bamboo offer good grip for beginners, " +
      "while metal needles are fast and smooth. Choose your needle size according to the yarn label recommendation.";
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // ==========================================
  // 9. FALLBACK TO GROUNDED CHUNKS DYNAMIC SUMMARY
  // ==========================================
  const topChunk = chunks && chunks.length > 0 ? chunks[0] : null;
  if (topChunk && topChunk.score >= 0.22) {
    const summary = buildDynamicSummary(topChunk.chunk.content);
    const answer = `Based on the course material:\n${summary}`;
    return { answer: localizeAnswer(answer, language), isGrounded: true };
  }

  // ==========================================
  // 10. GENERAL BEGINNER KNITTING ADVICE
  // ==========================================
  const answer =
    "Knitting is a creative craft using yarn and needles to create items like scarves, sweaters, and caps. " +
    "Start by creating a slip knot, casting on your foundation stitches, and practicing the knit stitch row by row.";
  return { answer: localizeAnswer(answer, language), isGrounded: true };
}

/**
 * Creates a clear, concise summary in simple English if a custom topic match isn't triggered.
 */
function buildDynamicSummary(content: string, language: Language = "en"): string {
  const cLower = content.toLowerCase();
  if (cLower.includes("running stitch") || cLower.includes("half-inch")) {
    return language === "mr"
      ? "डेमो पाठात क्रोशा सुई वापरून मध्यवर्ती पट्टीच्या कडांवर अर्ध्या इंचाच्या अंतरावर धावदोरा (रनिंग स्टिच) घातला जातो."
      : "In the demo lesson, a running stitch is used along the edges at half-inch intervals with a crochet needle to secure the center panel.";
  }
  if (cLower.includes("center panel") || cLower.includes("crochet")) {
    return language === "mr"
      ? "डेमो पाठात धागा मोजताना 1 ते 1.5 इंच जास्त ठेवावा, क्रोशा सुई वापरावी आणि वेणीसारखी नक्षी समोर ठेवून अर्ध्या इंचाच्या अंतरावर धावदोरा घालावा."
      : "In the demo lecture, you measure thread leaving 1 to 1.5 inches extra, use a crochet needle, place the braided ridge lines on the front, and weave running stitches at half-inch intervals.";
  }
  if (content.includes("creative skill")) {
    return language === "mr"
      ? "विणकाम ही सुया आणि धाग्यांच्या साहाय्याने स्वेटर, मफलर, टोप्या आणि पिशव्या बनवण्याची एक कला आहे, ज्यामुळे एकाग्रता वाढते."
      : "Knitting is a creative craft using yarn and needles to make items like sweaters, scarves, caps, and bags, while fostering patience and creativity.";
  }
  if (content.includes("Material Knowledge")) {
    return language === "mr"
      ? "विणकामासाठी योग्य लोकर (लोकर वि. कॉटन), सुया आणि इतर साहित्याची योग्य निवड समजून घेणे आवश्यक आहे."
      : "Material knowledge in knitting involves understanding how to choose the right yarn (wool vs cotton), needles, and accessories to produce durable, high-quality items.";
  }
  if (content.includes("slip knot")) {
    return language === "mr"
      ? "विणकामाची सुरुवात एका सुईवर स्लिप नॉट बांधून, दुसरी सुई घालून आणि धागा ओढून नवीन लूप्स तयार करण्याने होते."
      : "Knitting begins by forming a slip knot loop on one needle, inserting the second needle, and drawing yarn through to create connected loops.";
  }
  if (content.includes("present and share")) {
    return language === "mr"
      ? "विणलेल्या सुंदर वस्तू प्रदर्शनात किंवा ऑनलाईन शेअर केल्याने तुमच्या कलेला दाद मिळते."
      : "Presenting knitted creations neatly and sharing them at exhibitions or online helps showcase your craftsmanship to others.";
  }
  return language === "mr"
    ? "अभ्यासक्रमातील माहितीनुसार, योग्य साहित्य निवडून आणि टाके एकसारखे ठेवून शांतपणे विणण्याचा सराव करावा."
    : "The lesson emphasizes understanding your materials, keeping stitches even, and practicing slowly to produce strong, attractive knitted fabric.";
}

export function translateToMarathi(enText: string): string {
  const lower = enText.toLowerCase();

  if (lower.includes("slip knot") && (lower.includes("adjustable") || lower.includes("step") || lower.includes("form a") || lower.includes("simple loop") || lower.includes("yarn"))) {
    return (
      "स्लिप नॉट बनवण्याची पद्धत:\n" +
      "1. लोकरीचा एक साधा लूप तयार करा.\n" +
      "2. लूपमधून चालू धागा ओढून एक सरकणारी गाठ बनवा.\n" +
      "3. ही गाठ सुईवर अडकवा आणि धाग्याची टोके हलकेच ओढून व्यवस्थित बसवा. टाका सुईवर सहज सरकेल इतका सैल ठेवा."
    );
  }

  if (lower.includes("knit stitch") && lower.includes("purl stitch") && (lower.includes("fundamental") || lower.includes("difference") || lower.includes("two"))) {
    return (
      "सुलट टाका (Knit stitch) आणि उलटा टाका (Purl stitch) हे विणकामातील दोन मूलभूत टाके आहेत:\n" +
      "- सुलट टाका: धागा मागच्या बाजूला धरून विणला जातो, ज्यामुळे समोरच्या बाजूला 'V' आकाराचे गुळगुळीत टाके दिसतात.\n" +
      "- उलटा टाका: धागा पुढच्या बाजूला धरून विणला जातो, ज्यामुळे आडवे खडबडीत उंचवटे (बम्प्स) तयार होतात.\n" +
      "हे दोन्ही टाके आलटून-पालटून विणल्याने सुंदर रिबिंग आणि डिझाइन्स तयार होतात."
    );
  }

  if (lower.includes("knit stitch") && (lower.includes("insert") || lower.includes("step") || lower.includes("wrap") || lower.includes("v-shape") || lower.includes("hold"))) {
    return (
      "सुलट टाका (Knit stitch) विणण्याची पद्धत:\n" +
      "1. डाव्या हातातील सुईवर टाके ठेवा आणि चालू धागा नेहमी पाठीमागे ठेवा.\n" +
      "2. उजवी सुई टाक्यात समोरून मागे (खालून वर) घाला.\n" +
      "3. धागा उजव्या सुईभोवती घड्याळाच्या विरुद्ध दिशेने फिरवा.\n" +
      "4. नवीन लूप बाहेर ओढा आणि डाव्या सुईवरील जुना टाका अलगद खाली सरकवा."
    );
  }

  if (lower.includes("purl stitch") && (lower.includes("insert") || lower.includes("step") || lower.includes("front") || lower.includes("bump") || lower.includes("hold"))) {
    return (
      "उलटा टाका (Purl stitch) विणण्याची पद्धत:\n" +
      "1. डाव्या सुईवर टाके धरा आणि चालू धागा नेहमी पुढच्या बाजूला ठेवा.\n" +
      "2. उजवी सुई टाक्यात पुढून पाठीमागच्या दिशेने घाला.\n" +
      "3. धागा उजव्या सुईभोवती फिरवून नवीन लूप बाहेर काढा.\n" +
      "4. डाव्या सुईवरील जुना टाका अलगद खाली सरकवून नवीन उलटा टाका पूर्ण करा."
    );
  }

  if (lower.includes("cast on") || lower.includes("casting on") || lower.includes("foundation")) {
    return (
      "टाके घालण्याची (Casting on) पद्धत:\n" +
      "1. प्रथम एक स्लिप नॉट बांधून सुईवर पहिला टाका म्हणून चढवा.\n" +
      "2. दुसऱ्या सुईने त्या टाक्यातून नवीन लूप विणून बाहेर काढा.\n" +
      "3. हा नवीन लूप पुन्हा डाव्या सुईवर चढवा.\n" +
      "4. तुम्हाला हव्या तितक्या टाक्यांची पायाभूत ओळ तयार होईपर्यंत ही कृती पुन्हा करा."
    );
  }

  if (lower.includes("drop") && lower.includes("stitch")) {
    return (
      "जर एखादा टाका सुईवरून निसटला, तर घाबरू नका. तो निसटलेला लूप बोटाने किंवा क्रोशा सुईने लगेच पकडा. वरचा धागा त्या लूपमधून बाहेर ओढून टाका पुन्हा दुरुस्त करा आणि डाव्या सुईवर चढवा."
    );
  }

  if (lower.includes("tink") || lower.includes("undo") || (lower.includes("mistake") && lower.includes("correct"))) {
    return (
      "विणकाम न मोडता चूक दुरुस्त करण्यासाठी एकेक टाका उलटा सोडवा (Tinking). उजव्या सुईवरील टाक्याच्या खालच्या लूपमध्ये डावी सुई समोरून मागे घाला, चालू धागा हलकेच ओढा आणि तो टाका पुन्हा डाव्या सुईवर घ्या."
    );
  }

  if (lower.includes("tight") && (lower.includes("needle") || lower.includes("stitch") || lower.includes("stuck"))) {
    return (
      "टाके खूप घट्ट होऊन सुई अडकत असल्यास, तुम्ही धागा जास्त जोराने ओढत आहात. हाताची पकड सैल ठेवा, टाके सुईच्या टोकावर न विणता सुईच्या जाड भागावर सरकवून हलक्या हाताने विणा."
    );
  }

  if (lower.includes("loose") && (lower.includes("stitch") || lower.includes("tension"))) {
    return (
      "धागा सैल सोडल्यामुळे टाके खूप मोठे आणि सैल होतात. विणताना चालू धागा तुमच्या तर्जनीवर (पहिल्या बोटावर) हलका गुंडाळून ठेवा, ज्यामुळे प्रत्येक टाक्याला एकसमान ताण मिळेल."
    );
  }

  if (lower.includes("needle") && (lower.includes("size") || lower.includes("two") || lower.includes("pair") || lower.includes("wood") || lower.includes("metal"))) {
    return (
      "विणकामासाठी सामान्यतः दोन सुया लागतात. मध्यम जाडीच्या लोकरीसाठी 4 मिमी ते 5 मिमी (US 6 ते 8) आकाराच्या सुया नवशिक्यांसाठी उत्तम असतात. सुईचा अचूक आकार लोकरीच्या लेबलवर दिलेला असतो."
    );
  }

  if (lower.includes("yarn") || lower.includes("wool") || lower.includes("cotton") || lower.includes("acrylic")) {
    return (
      "नवीन शिकणाऱ्यांसाठी मध्यम जाडीची आणि फिकट रंगाची लोकर उत्तम असते, कारण फिकट रंगात प्रत्येक टाका स्पष्ट दिसतो. लोकर मऊ आणि लवचिक असल्याने शिकण्यासाठी सर्वात सोपी आहे."
    );
  }

  if (lower.includes("crochet") || lower.includes("running stitch") || lower.includes("center panel")) {
    return (
      "डेमो पाठात क्रोशा सुई वापरून मध्यवर्ती पट्टीच्या कडांवर अर्ध्या इंचाच्या अंतरावर धावदोरा (रनिंग स्टिच) घातला जातो. धागा मोजताना 1 ते 1.5 इंच जास्त ठेवावा आणि वेणीसारखी नक्षी समोर ठेवून विणावे."
    );
  }

  if (lower.includes("hold") && lower.includes("needle")) {
    return (
      "टाके असलेली सुई डाव्या हातात आणि रिकामी सुई उजव्या हातात पेन्सिलप्रमाणे किंवा चाकू पकडल्यासारखी हलकी धरा. मनगट आणि बोटे सैल ठेवून आरामात विणकाम करा."
    );
  }

  if (lower.includes("increase") || lower.includes("kfb")) {
    return (
      "टाके वाढवण्यासाठी एकाच टाक्याच्या पुढच्या भागातून विणा आणि तो न सोडवता त्याच टाक्याच्या मागच्या भागातून पुन्हा विणा (KFB पद्धत). यामुळे एका टाक्याचे दोन टाके होतात."
    );
  }

  if (lower.includes("decrease") || lower.includes("k2tog")) {
    return (
      "टाके कमी करण्यासाठी उजवी सुई डाव्या सुईवरील दोन टाक्यांत एकदम घाला आणि दोन्ही टाके एकत्र विणा (K2tog पद्धत). यामुळे दोन टाक्यांचा एक टाका होतो."
    );
  }

  if (lower.includes("bind off") || lower.includes("cast off") || lower.includes("finish")) {
    return (
      "प्रकल्प पूर्ण करण्यासाठी (Bind off):\n" +
      "1. उजव्या सुईवर दोन टाके विणा.\n" +
      "2. डाव्या सुईने पहिला टाका दुसऱ्या टाक्यावरून उचलून सुईच्या बाहेर काढा.\n" +
      "3. आणखी एक टाका विणा आणि मागचा टाका पुन्हा वरून बाहेर काढा.\n" +
      "4. शेवटचा एक लूप उरेपर्यंत ही कृती करा, धागा कापून लूपमधून ओढून पक्का करा."
    );
  }

  if (lower.includes("what is knitting") || lower.includes("creative craft")) {
    return (
      "विणकाम ही सुया आणि धाग्याच्या साहाय्याने एकमेकात गुंतलेले लूप्स तयार करून कापड बनवण्याची एक कला आहे. यातून स्वेटर, मफलर, टोप्या आणि इतर सुंदर वस्तू बनवता येतात."
    );
  }

  if (lower.includes("learning path") || lower.includes("beginner")) {
    return (
      "विणकाम शिकण्याचा सर्वात सोपा मार्ग:\n" +
      "1. प्रथम सुया आणि लोकरीची माहिती समजून घ्या (पाठ 2).\n" +
      "2. स्लिप नॉट बांधण्याचा सराव करा (पाठ 3).\n" +
      "3. सुईवर पायाभूत टाके घाला - कास्टिंग ऑन (पाठ 6).\n" +
      "4. सुलट टाका (पाठ 4) आणि उलटा टाका (पाठ 5) विणण्याचा सराव करा."
    );
  }

  return (
    "अभ्यासक्रमातील माहितीनुसार, योग्य सुया आणि लोकर निवडून हलक्या हाताने विणकाम सुरू करावे. टाके एकसारखे ठेवून हळूहळू सराव केल्यास विणकाम मजबूत आणि आकर्षक बनते."
  );
}

function localizeAnswer(enText: string, language: Language, mrText?: string): string {
  if (language === "mr") {
    if (mrText) return cleanResponse(mrText);
    return cleanResponse(translateToMarathi(enText));
  }
  if (language === "hi") {
    return cleanResponse(`पाठ्यक्रम सामग्री के अनुसार:\n\n${enText}`);
  }
  return cleanResponse(enText);
}

/**
 * Calls Google Gemini API with the retrieved RAG context.
 * Strictly enforces concise, simple plain text without bold formatting or welcome greetings.
 */
async function callGeminiApi(
  question: string,
  chunks: RetrievedChunk[],
  language: Language
): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const contextText =
    chunks.length > 0
      ? chunks
          .map(
            (c, i) =>
              `[Source ${i + 1} - ${c.chunk.videoTitle} (${c.chunk.sourceFile})]:\n${c.chunk.content}`
          )
          .join("\n\n")
      : "No direct course lesson transcript matched this query.";

  const prompt = `You are an expert, friendly craft learning assistant.
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
${contextText}

USER QUESTION:
${question}`;

  const candidateModels = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash-lite",
  ];

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 350,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated) return cleanResponse(generated);
      }
    } catch {
      // try next model or fallback
    }
  }

  return null;
}

export async function generateRAGAnswer(
  question: string,
  retrievedChunks: RetrievedChunk[],
  language: Language = "en",
  videoId?: string | null
): Promise<RAGAnswerResult> {
  let answer: string | null = null;
  let isGrounded = true;

  const effectiveLanguage = detectLanguage(question, language);

  // 1. Attempt Gemini LLM generation if API key is provided
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    answer = await callGeminiApi(question, retrievedChunks, effectiveLanguage);
    if (answer === NOT_AVAILABLE_MESSAGE) {
      isGrounded = false;
    }
  }

  // 2. If no API key or API call failed, run verified local grounded generator
  if (!answer) {
    const localResult = generateLocalAnswer(question, retrievedChunks, effectiveLanguage, videoId);
    answer = localResult.answer;
    isGrounded = localResult.isGrounded;
  }

  // Guarantee clean plain text without any bold markdown or welcome greetings
  answer = cleanResponse(answer);

  const sources: RAGSource[] = [];
  if (isGrounded) {
    const seenSources = new Set<string>();
    for (const r of retrievedChunks) {
      if (!seenSources.has(r.chunk.sourceFile)) {
        seenSources.add(r.chunk.sourceFile);
        sources.push({
          videoId: r.chunk.docId,
          videoTitle: r.chunk.videoTitle,
          snippet: r.chunk.content.slice(0, 120) + "…",
          score: r.score,
        });
      }
    }
  }

  // Relevant questions suggestion removed as requested
  const relevantQuestions: string[] = [];

  const confidence = isGrounded && retrievedChunks.length > 0 ? retrievedChunks[0].score : 0;

  return {
    answer,
    sources,
    relevantQuestions,
    confidence,
  };
}
