import type { Language, RAGSource } from "@/types";
import type { RetrievedChunk } from "./retriever";
import { generateRelevantQuestions } from "./relevantQuestions";

export interface RAGAnswerResult {
  answer: string;
  sources: RAGSource[];
  relevantQuestions: string[];
  confidence: number;
}

export function cleanResponse(text: string): string {
  if (!text) return "";
  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1");

  // Fix corrupted/hallucinated foreign script transliterations
  cleaned = cleaned.replace(/γκ레이|그레이/g, "ग्रे");

  // Remove generic platform welcome greetings and masterclass mentions
  cleaned = cleaned
    .replace(/\bwelcome\s+to\s+takshashila[^.!\n]*[.!\n]?/gi, "")
    .replace(/\bwelcome\s+to\s+the\s+takshashila[^.!\n]*[.!\n]?/gi, "")
    .replace(/\bwelcome\s+to\s+crochet[^.!\n]*[.!\n]?/gi, "")
    .replace(/तक्षशिला\s*(मध्ये|वर|प्लॅटफॉर्मवर)?\s*(आपले)?\s*स्वागत\s*(आहे)?[.!,\n]?/gi, "")
    .replace(/आपले\s*स्वागत\s*आहे[!.,]?/gi, "")
    .replace(/^(\s*hello[!,.]?\s*welcome\s+to\s+[a-z0-9\s_-]+[.!,]\s*)/i, "")
    .replace(/^(\s*welcome\s+to\s+[a-z0-9\s_-]+[.!,]\s*)/i, "")
    .replace(/\b(in\s+)?suchita'?s\s+(masterclass|video|tutorial|curriculum|course)\b/gi, "")
    .replace(/\b(in\s+)?this\s+masterclass\b/gi, "")
    .replace(/\b(in\s+)?the\s+masterclass\b/gi, "")
    .replace(/\b(in\s+)?suchita'?s\s+crochet\s+lessons?\b/gi, "")
    .replace(/\bsuchita\s+(recommends|advises|explains|teaches)\b/gi, "It is recommended")
    .replace(/सुचिता\s*(यांनी|यांच्या)?\s*(मास्टरक्लास|व्हिडिओ|कोर्स)?(मध्ये)?/gi, "");

  // If text is primarily Indic / Devanagari, clean stray foreign characters
  if (/[\u0900-\u097F]/.test(cleaned)) {
    cleaned = cleaned.replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u0370-\u03FF\u0400-\u04FF\u4E00-\u9FFF]/g, "");
  }

  cleaned = cleaned
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  return cleaned;
}

export function detectLanguage(question: string, preferred: Language = "mr"): Language {
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

  return preferred === "mr" ? "mr" : "en";
}

/**
 * Verified offline / local answer generator covering Part 1 to Part 4,
 * needlework/stitching techniques, color combinations, and craft fundamentals.
 */
export function generateLocalAnswer(
  question: string,
  chunks: RetrievedChunk[],
  language: Language = "mr",
  videoId?: string | null
): { answer: string; isGrounded: boolean } {
  const effectiveLanguage = detectLanguage(question, language);
  const qLower = question.toLowerCase().trim();

  // --- IRRELEVANT / OUT-OF-SCOPE TOPICS CHECK (FALLBACK) ---
  const isCraftQuery =
    qLower.includes("crochet") || qLower.includes("knit") || qLower.includes("stitch") ||
    qLower.includes("sew") || qLower.includes("yarn") || qLower.includes("wool") ||
    qLower.includes("hook") || qLower.includes("needle") || qLower.includes("chain") ||
    qLower.includes("magic ring") || qLower.includes("single") || qLower.includes("double") ||
    qLower.includes("heart") || qLower.includes("pentagon") || qLower.includes("hexagon") ||
    qLower.includes("color") || qLower.includes("colour") || qLower.includes("shade") ||
    qLower.includes("ganga") || qLower.includes("olivia") || qLower.includes("suchita") ||
    qLower.includes("टाका") || qLower.includes("विणकाम") || qLower.includes("शिलाई") ||
    qLower.includes("सुई") || qLower.includes("धागा") || qLower.includes("रंग") ||
    qLower.includes("हार्ट") || qLower.includes("मॅजिक");

  if (!isCraftQuery) {
    const isClearlyIrrelevant =
      /\b(makeup|lipstick|mascara|eyeliner|blush|foundation|skincare|sunscreen|parlor|recipe|bake|cake|biryani|cook|cooking|pizza|pasta|python|javascript|coding|debug|compiler|cricket|football|fifa|ipl|bollywood|movie|cinema|bitcoin|crypto|stocks|election|मेकअप|लिपस्टिक|स्वयंपाक|रेसिपी)\b/i.test(
        qLower
      );
    if (isClearlyIrrelevant) {
      if (effectiveLanguage === "mr") {
        return {
          answer:
            "हा प्रश्न क्रोशे, विणकाम किंवा शिलाई क्राफ्टशी संबंधित नाही. कृपया टाके, यान किंवा विणकामाबद्दल प्रश्न विचारा.",
          isGrounded: false,
        };
      }
      return {
        answer:
          "This question is irrelevant to crochet, knitting, and stitching. Please ask questions related to stitches, yarn, colors, or crafting.",
        isGrounded: false,
      };
    }
  }

  // 1. COLOR COMBINATIONS & PALETTE ADVICE
  const isColorQuery =
    qLower.includes("color") ||
    qLower.includes("colour") ||
    qLower.includes("shade") ||
    qLower.includes("palette") ||
    qLower.includes("contrast") ||
    qLower.includes("रंग") ||
    qLower.includes("कॉम्बिनेशन") ||
    qLower.includes("matching");

  if (isColorQuery) {
    // Specific: Grey / राखाडी / ग्रे
    if (qLower.includes("grey") || qLower.includes("gray") || qLower.includes("राखाडी") || qLower.includes("ग्रे")) {
      if (effectiveLanguage === "mr") {
        return {
          answer:
            "ग्रे (राखाडी) यान किंवा फॅब्रिकसोबत उत्तम दिसणारे रंग कॉम्बिनेशन:\n" +
            "१. मोहरी पिवळा (Mustard Yellow) किंवा पेस्टल ब्लश पिंक (Pink): राखाडी रंगावर हा सर्वात लोकप्रिय आणि आधुनिक कॉन्ट्रास्ट लुक देतो.\n" +
            "२. मिंट हिरवा (Mint Green) किंवा लव्हेंडर: अतिशय शांत, देखणा आणि सुंदर लुक तयार होतो.\n" +
            "३. क्रीम किंवा पांढरा आणि चारकोल: क्लासिक आणि सोबर विणकामासाठी उत्तम पर्याय.\n" +
            "टीप: जर ग्रे डार्क असेल तर हलके रंग वापरा, आणि फिकट ग्रे असेल तर नेव्ही ब्लू किंवा मरून छान उठून दिसतो!",
          isGrounded: true,
        };
      }
      return {
        answer:
          "Great color combinations for grey yarn or fabric in craft projects:\n" +
          "1. Mustard Yellow or Pastel Blush Pink: Creates a stunning, trendy modern contrast against neutral grey.\n" +
          "2. Soft Mint Green or Lavender: Gives a calm, elegant, and sophisticated aesthetic.\n" +
          "3. Cream, Ivory, and Charcoal: Timeless monochrome palette that highlights textured stitches.\n" +
          "Tip: Pair dark charcoal grey with bright pastels, and pair light heather grey with rich jewel tones like navy or burgundy!",
        isGrounded: true,
      };
    }

    // Specific: Pink / गुलाबी
    if (qLower.includes("pink") || qLower.includes("गुलाबी")) {
      if (effectiveLanguage === "mr") {
        return {
          answer:
            "गुलाबी (Pink) यानसोबत छान दिसणारे रंग कॉम्बिनेशन:\n" +
            "१. हलका राखाडी (Soft Grey): आधुनिक आणि संतुलित कॉम्बिनेशन.\n" +
            "२. क्रीम किंवा पांढरा: नाजूक आणि सुंदर लुक, लहान बाळांच्या ब्लॅंकेटसाठी उत्तम.\n" +
            "३. सेज ग्रीन (Sage Green) किंवा हलका हिरवा: फुलांसारखा नैसर्गिक आणि फ्रेश कॉन्ट्रास्ट.\n" +
            "४. नेव्ही ब्लू: गडद पार्श्वभूमीवर गुलाबी टाके खूप उठावदार दिसतात.",
          isGrounded: true,
        };
      }
      return {
        answer:
          "Beautiful color pairings for pink yarn in crochet and stitching:\n" +
          "1. Soft Grey or Charcoal: A chic, balanced pairing that grounds the warmth of pink.\n" +
          "2. Cream, White, or Champagne: Gentle, delicate palette ideal for baby blankets and florals.\n" +
          "3. Sage Green or Mint: Nature-inspired contrast reminiscent of fresh roses.\n" +
          "4. Deep Navy Blue or Plum: Rich, high-contrast backdrop that makes pink stitches pop.",
        isGrounded: true,
      };
    }

    // Specific: Yellow / पिवळा
    if (qLower.includes("yellow") || qLower.includes("mustard") || qLower.includes("पिवळा")) {
      if (effectiveLanguage === "mr") {
        return {
          answer:
            "पिवळ्या (Yellow) यानसोबत उत्कृष्ट रंग कॉम्बिनेशन:\n" +
            "१. चारकोल ग्रे किंवा स्लेट ब्लू: पिवळ्या रंगाचा उबदारपणा संतुलित करण्यासाठी सर्वोत्तम मॉडर्न कॉन्ट्रास्ट.\n" +
            "२. पांढरा किंवा वॉर्म क्रीम: अतिशय प्रसन्न आणि उजळ लुक.\n" +
            "३. टील किंवा डार्क हिरवा: निसर्गापासून प्रेरित सुंदर कॉम्बिनेशन.",
          isGrounded: true,
        };
      }
      return {
        answer:
          "Striking color combinations for yellow yarn:\n" +
          "1. Charcoal Grey or Slate Blue: Modern high contrast that balances yellow's brightness.\n" +
          "2. Crisp White or Warm Cream: Bright, sunny, and cheerful palette.\n" +
          "3. Forest Green, Olive, or Teal: Earthy, warm, nature-inspired harmony.",
        isGrounded: true,
      };
    }

    // Specific: Blue / निळा
    if (qLower.includes("blue") || qLower.includes("navy") || qLower.includes("निळा")) {
      if (effectiveLanguage === "mr") {
        return {
          answer:
            "निळ्या (Blue) यानसोबत उत्तम रंग कॉम्बिनेशन:\n" +
            "१. मोहरी पिवळा (Mustard) किंवा पीच: थंड निळ्या रंगासोबत उबदार रंग खूप सुंदर उठाव देतात.\n" +
            "२. पांढरा आणि राखाडी: क्लासिक आणि फ्रेश लुक.\n" +
            "३. हलका गुलाबी (Dusty Rose) किंवा क्रीम: नाजूक आणि आकर्षक कॉम्बिनेशन.",
          isGrounded: true,
        };
      }
      return {
        answer:
          "Harmonious color combinations for blue yarn:\n" +
          "1. Warm Mustard, Terracotta, or Peach: Warm accents against cool blue create balanced energy.\n" +
          "2. Crisp White and Silver Grey: Clean, classic nautical aesthetic.\n" +
          "3. Pale Mint or Dusty Rose: Soft tonal depth for motifs and blankets.",
        isGrounded: true,
      };
    }

    // General color advice
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "विणकाम आणि शिलाईमध्ये रंगांचे कॉम्बिनेशन निवडताना या टिप्स वापरा:\n" +
          "१. ६०-३०-१० चा नियम: ६०% मुख्य बेस रंग (उदा. क्रीम किंवा ग्रे), ३०% दुय्यम रंग (उदा. पेस्टल शेड), आणि १०% अ‍ॅक्सेंट रंग (काठ किंवा कॉर्नर्ससाठी उठावदार रंग).\n" +
          "२. कॉन्ट्रास्ट वापरा: गडद आणि फिकट रंगांचा कॉन्ट्रास्ट वापरल्यास क्रोशेचे टाके (DC, ट्रिपल्स) स्पष्ट आणि आकर्षक दिसतात.\n" +
          "३. शेडिंग पद्धत: एकाच रंगाच्या फिकट, मध्यम आणि गडद शेड्स वापरल्यास सुंदर ग्रेडियंट इफेक्ट मिळतो.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "Tips for choosing color combinations in crochet and stitching:\n" +
        "1. The 60-30-10 Rule: 60% dominant base yarn (like cream or grey), 30% secondary shade (like pastel blue or blush), and 10% accent color (like mustard or gold for borders/centers).\n" +
        "2. High Contrast for Stitch Definition: Contrasting shades help complex stitches (like double crochet clusters or trebles) stand out clearly.\n" +
        "3. Tonal Harmony: Using 3 shades of the same color family (light, medium, dark) creates smooth ombré gradients.",
      isGrounded: true,
    };
  }

  // 2. KNITTING VS CROCHET
  if (
    (qLower.includes("difference") || qLower.includes("farak") || qLower.includes("फरक")) &&
    (qLower.includes("knit") || qLower.includes("crochet") || qLower.includes("विणकाम"))
  ) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "विणकाम (Knitting) आणि क्रोशे (Crochet) मधील मुख्य फरक:\n" +
          "१. साधने: क्रोशेसाठी फक्त एकच हुक असलेली सुई वापरतात, तर विणकामासाठी (Knitting) दोन लांब टोकदार सुया वापरल्या जातात.\n" +
          "२. टाक्यांची पद्धत: क्रोशेत एका वेळी एकच टाका विणून पूर्ण केला जातो आणि हुकवर एकच लूप असतो. विणकामामध्ये सुईवर एकाच वेळी संपूर्ण ओळीचे सर्व टाके अडकलेले असतात.\n" +
          "३. कापडाचे स्वरूप: क्रोशेचे कापड थोडे जाड आणि स्थिर राहते (हार्ट, कोस्टर, पंचकोन, तोरण यांसाठी उत्तम), तर विणकामाचे कापड मऊ आणि लवचिक असते (स्वेटर, मोजे यांसाठी उत्तम).",
        isGrounded: true,
      };
    }
    return {
      answer:
        "Key differences between knitting and crochet:\n" +
        "1. Tools: Crochet uses a single crochet hook with a curved beak, whereas knitting uses two pointed knitting needles.\n" +
        "2. Stitch Structure: In crochet, you work and complete one stitch at a time, keeping only one live loop on the hook. In knitting, an entire row of live stitches rests on the needle simultaneously.\n" +
        "3. Fabric Texture: Crochet fabric is sturdier and holds structural shapes well (ideal for hearts, pentagons, hexagons, and coasters), while knitted fabric is softer, drapier, and stretchier (ideal for sweaters and socks).",
      isGrounded: true,
    };
  }

  // 3. STITCHING & SEAMING CROCHET MOTIFS
  if (
    qLower.includes("sew") ||
    qLower.includes("sewing") ||
    qLower.includes("seam") ||
    qLower.includes("join") ||
    qLower.includes("शिलाई") ||
    qLower.includes("जोडणे")
  ) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "क्रोशेचे आकार (पंचकोन, षटकोन किंवा हार्ट) एकत्र शिलाई करण्याची पद्धत:\n" +
          "१. टेपेस्ट्री नीडलमध्ये त्याच रंगाचा यान ओवून घ्या.\n" +
          "२. दोन्ही आकार समोरासमोर किंवा शेजारी सरळ ठेवा.\n" +
          "३. कडेच्या टाक्यांच्या मागच्या लूपमधून (Back loops) व्हीप स्टिच (Whip stitch) किंवा मॅट्रेस स्टिचने टाके घाला.\n" +
          "४. धागा फार जास्त खेचू नका जेणेकरून जोड सपाट आणि नीटनेटका बसेल, आणि उरलेला धागा मागच्या बाजूने लपवा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to sew or seam crocheted shapes (like pentagons, hexagons, or hearts) together:\n" +
        "1. Thread a blunt tapestry needle with a matching length of yarn.\n" +
        "2. Align the shapes with right sides facing each other or laid flat side by side.\n" +
        "3. Work a whip stitch or mattress stitch through the inner or back loops of adjacent edge stitches.\n" +
        "4. Pull the yarn gently so the seam lies flat without puckering, then weave the yarn tail securely into the back stitches.",
      isGrounded: true,
    };
  }

  // 4. TENSION ISSUES & CURLING EDGES
  if (qLower.includes("curl") || qLower.includes("tight") || qLower.includes("loose") || qLower.includes("tension") || qLower.includes("वळणे") || qLower.includes("घट्ट") || qLower.includes("सैल")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "विणकाम किंवा क्रोशेची कडा का दुमडते (Curl होते) आणि त्यावर उपाय:\n" +
          "१. धागा जास्त घट्ट ओढणे: जर हाताचा ताण (Tension) खूप घट्ट असेल तर कडा आत वळते. हात सैल ठेवा किंवा अर्ध्या आकाराने मोठा हुक (उदा. ४.५ ऐवजी ५ मिमी) वापरा.\n" +
          "२. टाक्यांची संख्या तपासणे: प्रत्येक बाजूला योग्य टाके विणले आहेत का ते तपासा; टाके कमी पडल्यास आकार आखडला जातो.\n" +
          "३. ब्लॉकिंग (Blocking): काम पूर्ण झाल्यावर हलकी वाफ (Steam) देऊन आकार सपाट आणि सरळ करता येतो.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "Why crochet or knitting curls and how to fix tension:\n" +
        "1. Tension too tight: If you pull the working yarn too firmly, edges curl inward. Relax your hand grip or size up your hook by 0.5mm (e.g., from 4.5mm to 5.0mm).\n" +
        "2. Count stitches: Ensure you haven't accidentally skipped side stitches; missing stitches narrows the work and causes curling.\n" +
        "3. Steam blocking: Lightly steaming the finished piece (keeping the iron an inch away) relaxes the fibers and sets geometric shapes completely flat.",
      isGrounded: true,
    };
  }

  // --- PART 1: DIFFERENCE BETWEEN SINGLE AND DOUBLE CROCHET ---
  if (
    (qLower.includes("difference") || qLower.includes("farak") || qLower.includes("फरक") || qLower.includes("vs")) &&
    (qLower.includes("single") || qLower.includes("सिंगल") || qLower.includes("sc")) &&
    (qLower.includes("double") || qLower.includes("डबल") || qLower.includes("dc"))
  ) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "सिंगल क्रोशे (SC) आणि डबल क्रोशे (DC) मधील मुख्य फरक:\n" +
          "१. सुरुवातीचा यान ओव्हर: सिंगल क्रोशेत हुक थेट साखळीत घातला जातो. डबल क्रोशेत हुक घालण्यापूर्वी आधी हुकवर यान गुंडाळावे लागते (Yarn Over).\n" +
          "२. हुकवरील लूप्स: सिंगल क्रोशेत २ लूप्समधून एकाच वेळी धागा काढतात. डबल क्रोशेत ३ लूप्स तयार होतात आणि दोन-दोन लूप्समधून दोन टप्प्यांत धागा काढतात.\n" +
          "३. उंची आणि कापड: सिंगल क्रोशे लहान आणि घट्ट कापड बनवतो, तर डबल क्रोशे दुप्पट उंच आणि लवचिक कापड बनवतो.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "Key differences between Single Crochet (SC) and Double Crochet (DC):\n" +
        "1. Starting Motion: Single crochet starts by inserting the hook directly into the stitch without an initial wrap. Double crochet requires wrapping yarn over the hook (Yarn Over) first before inserting.\n" +
        "2. Loops and Steps: Single crochet works off 2 loops on your hook in one step. Double crochet works off 3 loops in two stages (two loops at a time).\n" +
        "3. Height and Texture: Single crochet creates a short, dense, and firm fabric. Double crochet is about twice as tall, works up faster, and creates an airy drape.",
      isGrounded: true,
    };
  }

  // --- PART 1: CHAIN STITCH ---
  if (qLower.includes("chain") || qLower.includes("चेन")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "चेन स्टिच (Chain Stitch) बनवण्याची पद्धत:\n" +
          "१. हुकचे टोक स्वतःकडे ठेवा.\n" +
          "२. हुक डाव्या बाजूने फिरवून यानच्या मागे न्या (Yarn Over).\n" +
          "३. हुकच्या टोकाने यान पकडून लूपमधून बाहेर ओढून काढा.\n" +
          "४. हीच क्रिया पुन्हा करून सलग चेन्स तयार करा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to make a Chain Stitch:\n" +
        "1. Hold the hook with its tip facing towards you.\n" +
        "2. Rotate the hook to the left behind the yarn to wrap it (yarn over).\n" +
        "3. Catch the yarn in the hook's mouth and gently draw it down through the loop.\n" +
        "4. Repeat consecutively to form a neat foundation chain.",
      isGrounded: true,
    };
  }

  // --- PART 1: SINGLE CROCHET ---
  if (qLower.includes("single crochet") || qLower.includes("सिंगल क्रोशे")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "सिंगल क्रोशे (Single Crochet / SC) बनवण्याची पद्धत:\n" +
          "१. चेनच्या वरच्या भागात हुक इन्सर्ट करा.\n" +
          "२. यान गुंडाळून धागा बाहेर ओढा (हुकवर २ लूप्स).\n" +
          "३. पुन्हा यान गुंडाळा आणि दोन्ही लूप्समधून धागा बाहेर काढा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to make a Single Crochet (SC):\n" +
        "1. Insert your hook into the top loop of the chain.\n" +
        "2. Yarn over and pull the yarn through, creating 2 loops on your hook.\n" +
        "3. Yarn over again, and pull smoothly through both loops simultaneously.",
      isGrounded: true,
    };
  }

  // --- PART 1: HALF DOUBLE CROCHET ---
  if (qLower.includes("half double") || qLower.includes("hdc") || qLower.includes("हाफ डबल")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "हाफ डबल क्रोशे (Half Double Crochet / HDC):\n" +
          "१. हुकवर यान गुंडाळा (Yarn Over).\n" +
          "२. टाक्यात हुक इन्सर्ट करा.\n" +
          "३. धागा ओढून बाहेर काढा (हुकवर ३ लूप्स).\n" +
          "४. पुन्हा यान गुंडाळा आणि एकाच वेळी तिन्ही लूप्समधून धागा बाहेर काढा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to make a Half Double Crochet (HDC):\n" +
        "1. Yarn over first before inserting.\n" +
        "2. Insert hook into the stitch.\n" +
        "3. Yarn over and pull up a loop (3 loops on hook).\n" +
        "4. Yarn over once more and pull through all 3 loops simultaneously.",
      isGrounded: true,
    };
  }

  // --- PART 1: DOUBLE CROCHET (7 STEPS) ---
  if (qLower.includes("double crochet") || qLower.includes("7 step") || qLower.includes("डबल क्रोशे")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "डबल क्रोशे (Double Crochet / DC):\n" +
          "१. हुकवर यान गुंडाळा आणि टाक्यात हुक घाला.\n" +
          "२. धागा बाहेर काढा (हुकवर ३ लूप्स).\n" +
          "३. यान गुंडाळून पहिल्या २ लूप्समधून धागा काढा (२ लूप्स उरतात).\n" +
          "४. पुन्हा यान गुंडाळून उरलेल्या २ लूप्समधून धागा काढा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to make a Double Crochet (DC):\n" +
        "1. Yarn over, then insert hook into stitch.\n" +
        "2. Pull up a loop (3 loops on hook).\n" +
        "3. Yarn over, pull through first 2 loops (2 loops remain).\n" +
        "4. Yarn over, pull through remaining 2 loops.",
      isGrounded: true,
    };
  }

  // --- PART 2: CUTE CROCHET HEART SHAPE ---
  if (qLower.includes("heart") || qLower.includes("हार्ट")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "हार्ट शेप बनवण्याची पद्धत:\n" +
          "१. मॅजिक रिंग बनवा.\n" +
          "२. ३ चेन आणि ३ ट्रिपल क्रोशे करा.\n" +
          "३. ३ डबल क्रोशे बनवा.\n" +
          "४. खालचा टोक: १ चेन, १ ट्रिपल क्रोशे, १ चेन.\n" +
          "५. दुसरी बाजू: ३ डबल क्रोशे, ३ ट्रिपल क्रोशे, ३ चेन, आणि रिंगमध्ये १ स्लिप स्टिच.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to crochet a heart shape:\n" +
        "1. Start with a Magic Ring.\n" +
        "2. Work 3 chains, then 3 treble crochets into ring.\n" +
        "3. Work 3 double crochets.\n" +
        "4. Bottom Point: Chain 1, 1 treble crochet, chain 1.\n" +
        "5. Opposite Side: 3 double crochets, 3 treble crochets, 3 chains, and slip stitch into magic ring.",
      isGrounded: true,
    };
  }

  // --- PART 3: PENTAGON SHAPE ---
  if (qLower.includes("pentagon") || qLower.includes("पंचकोन") || qLower.includes("5 sides") || qLower.includes("५ बाजू")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "पंचकोन (Pentagon — ५ बाजू आणि ५ कोपरे):\n" +
          "१. राऊंड १: मॅजिक रिंगमध्ये [३ DC, २ चेन] चे ५ ग्रुप्स.\n" +
          "२. राऊंड २ आणि ३: बाजूवर DC आणि प्रत्येक कॉर्नरवर [१ DC, २ चेन, १ DC] विणा.\n" +
          "३. शेवटच्या कॉर्नरनंतर उरलेला १ DC विणूनच स्लिप स्टिच करा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to crochet a 5-sided Pentagon:\n" +
        "1. Round 1: In a magic ring, work 5 groups of [3 DC, 2 chains].\n" +
        "2. Rounds 2 & 3: Work 1 DC in side stitches, and [1 DC, 2 ch, 1 DC] into all 5 corner spaces.\n" +
        "3. Remember to work the final increased DC after the 5th corner before slip stitching.",
      isGrounded: true,
    };
  }

  // --- PART 4: HEXAGON SHAPE ---
  if (qLower.includes("hexagon") || qLower.includes("षटकोन") || qLower.includes("6 sides") || qLower.includes("६ बाजू")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "षटकोन (Hexagon — ६ बाजू आणि ६ कोपरे):\n" +
          "१. राऊंड १: मॅजिक रिंगमध्ये [३ DC, २ चेन] चे ६ ग्रुप्स.\n" +
          "२. राऊंड २ आणि ३: बाजूवर DC आणि प्रत्येक कॉर्नरवर [१ DC, २ चेन, १ DC] विणा.\n" +
          "३. ६ व्या कॉर्नरनंतर उरलेला १ वाढलेला DC विणूनच स्लिप स्टिच करा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to crochet a 6-sided Hexagon:\n" +
        "1. Round 1: In a magic ring, work 6 groups of [3 DC, 2 chains].\n" +
        "2. Rounds 2 & 3: Work 1 DC in side stitches, and [1 DC, 2 ch, 1 DC] into all 6 corner spaces.\n" +
        "3. Work the remaining increased DC after the 6th corner before slip stitching.",
      isGrounded: true,
    };
  }

  // --- MAGIC RING ---
  if (qLower.includes("magic ring") || qLower.includes("magic circle") || qLower.includes("मॅजिक रिंग")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "मॅजिक रिंग (Magic Ring):\n" +
          "१. यानचे टोक धरून बोटांभोवती एक गोल लूप बनवा.\n" +
          "२. गोलाच्या आतून क्रोशे हुक घालून धागा वर ओढा.\n" +
          "३. १ चेन बनवून लॉक करा आणि आत सुरुवातीचे टाके विणा.\n" +
          "४. काम संपल्यावर धागा घट्ट ओढून मधले छिद्र बंद करा.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "How to make a Magic Ring:\n" +
        "1. Form a circular loop with the yarn tail in your fingers.\n" +
        "2. Insert hook into the ring and pull up a loop.\n" +
        "3. Chain 1 to lock the circle, then work stitches directly into the ring.\n" +
        "4. Pull the tail tightly to close the center hole completely.",
      isGrounded: true,
    };
  }

  // --- MATERIALS / YARN / HOOK ---
  if (qLower.includes("yarn") || qLower.includes("hook") || qLower.includes("material") || qLower.includes("साहित्य") || qLower.includes("हुक")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "आवश्यक क्राफ्ट साहित्य:\n" +
          "१. यान: 'गंगा ऑलिव्हिया' (Ganga Olivia) अक्रिलिक यान.\n" +
          "२. क्रोशे हुक: बेसिकसाठी ४.५ मिमी हुक, आणि आकारांसाठी ४ मिमी हुक.\n" +
          "३. साधने: टेपेस्ट्री नीडल आणि कात्री.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "Required crafting materials:\n" +
        "1. Yarn: Ganga Olivia acrylic yarn ball.\n" +
        "2. Hook: 4.5 mm crochet hook for beginner stitches, and 4.0 mm hook for shaped motifs.\n" +
        "3. Finishing tools: Tapestry needle and scissors.",
      isGrounded: true,
    };
  }

  // --- WHO IS SUCHITA / INSTRUCTOR ---
  if (qLower.includes("suchita") || qLower.includes("सुचिता") || qLower.includes("instructor") || qLower.includes("dentist")) {
    if (effectiveLanguage === "mr") {
      return {
        answer:
          "सुचिता या एक व्यावसायिक क्रोशे आर्टिस्ट आणि डेंटिस्ट आहेत, ज्या नवशिक्यांसाठी क्रोशे बेसिक आणि विविध आकारांचे प्रात्यक्षिक शिकवतात.",
        isGrounded: true,
      };
    }
    return {
      answer:
        "Suchita is a professional crochet artist and dentist who teaches beginner foundation stitches and geometric shapes.",
      isGrounded: true,
    };
  }

  // Fallback to top retrieved chunk content or general overview
  if (chunks.length > 0) {
    const topChunk = chunks[0].chunk;
    return {
      answer: topChunk.content.slice(0, 220) + "…",
      isGrounded: true,
    };
  }

  if (effectiveLanguage === "mr") {
    return {
      answer:
        "क्रोशेच्या मुख्य विषयांमध्ये चेन, सिंगल, हाफ डबल आणि डबल क्रोशे, मॅजिक रिंगसह हार्ट शेप, ५ बाजूंचा पंचकोन आणि ६ बाजूंचा षटकोन समाविष्ट आहेत.",
      isGrounded: true,
    };
  }

  return {
    answer:
      "Core crochet topics include: Chain stitch, Single crochet, Half double crochet, Double crochet, Magic ring heart shape, 5-sided Pentagon, and 6-sided Hexagon.",
    isGrounded: true,
  };
}

async function callGeminiApi(
  question: string,
  retrievedChunks: RetrievedChunk[],
  language: Language
): Promise<string | null> {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
    return null;
  }

  const contextText =
    retrievedChunks && retrievedChunks.length > 0
      ? retrievedChunks
          .map(
            (c, i) =>
              `[Source ${i + 1}: ${c.chunk.videoTitle} - ${c.chunk.title}]\n${c.chunk.content}`
          )
          .join("\n\n")
      : "General Crochet Craft context from Part 1 to Part 4.";

  const isMarathi = language === "mr";

  const prompt = `You are an expert AI Craft Assistant for crochet, knitting, and stitching.
LESSON CRAFT CONTEXT:
${contextText}

USER QUESTION:
${question}

CRITICAL INSTRUCTIONS:
1. DO NOT MENTION INSTRUCTOR OR MASTERCLASS: Never mention "Suchita", "masterclass", "in this video", or "in the course". Present all facts and instructions directly as authoritative craft advice.
2. SHORT, PRECISE & DIRECT: Jump directly into answering the question without any filler, greetings, or introductory preamble. Keep the entire response short and concise (1 to 3 direct sentences or 2-3 brief bullet points).
3. COMPLETE SENTENCES: Always finish every sentence completely.
4. IRRELEVANT QUESTIONS: If the user asks a question that is irrelevant or unrelated to crochet, knitting, stitching, needlework, yarn, or craft colors (such as makeup, cars, cooking recipes, coding, sports, movies, politics), state directly in one short sentence: "This question is irrelevant to crochet, knitting, and stitching. Please ask questions related to stitches, yarn, colors, or crafting."
5. ZERO BOLD FORMATTING: NEVER use ** or __ around any word. Output clean, unbolded plain text only.
6. LANGUAGE: If the user asks in Marathi (Devanagari script or Romanized Marathi), reply in natural, fluent Marathi (मराठी). If in English, reply in English. If in Hindi, reply in Hindi.
`;

  const candidateModels = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
              maxOutputTokens: 2048,
              thinkingConfig: {
                thinkingBudget: 0,
              },
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
      // try next model
    }
  }

  return null;
}

export async function generateRAGAnswer(
  question: string,
  retrievedChunks: RetrievedChunk[],
  language: Language = "mr",
  videoId?: string | null
): Promise<RAGAnswerResult> {
  const effectiveLanguage = detectLanguage(question, language);
  let answer: string | null = null;

  // 1. Attempt Gemini LLM generation with broad knowledge + RAG context
  answer = await callGeminiApi(question, retrievedChunks, effectiveLanguage);

  // 2. Fallback to local verified generator if offline or network error
  if (!answer) {
    const localResult = generateLocalAnswer(question, retrievedChunks, effectiveLanguage, videoId);
    answer = localResult.answer;
  }

  answer = cleanResponse(answer);

  const sources: RAGSource[] = [];
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

  const relevantQuestions = generateRelevantQuestions(question, retrievedChunks, videoId);
  const confidence = retrievedChunks.length > 0 ? retrievedChunks[0].score : 0.85;

  return {
    answer,
    sources,
    relevantQuestions,
    confidence,
  };
}
