// Knitting knowledge base documents sourced directly from demo-script.txt, video1.txt, video2.txt, and video3.txt.

export interface KnowledgeDocument {
  id: string; // e.g. "video-0", "video-1"
  videoOrder: number;
  title: string;
  sourceFile: string;
  content: string;
  summary: string;
  keyTopics: string[];
  starterQuestions: string[];
}

const VIDEO0_TEXT = `Demo Lecture: Center Panel Stitching & Crochet Hook Technique (by e-Saheli).

[00:00 - 00:03] Title Card & Intro:
Demo Lecture – KNITTING Center Panel Stitching.

[00:04 - 00:15] Measuring and Cutting Thread:
To stitch the center panel of the knitted piece, use a crochet needle (crochet hook). Measure the pink fluffy yarn across the center gap space, leaving about 1 to 1.5 inches of extra thread beyond the width of the space before cutting it with scissors.
Marathi: सेंटरचा जो पॅनल आहे तो आता स्टिच करायचा आहे. त्यासाठी आपल्याला क्रोशाची निडल युज करायची आहे. इथे जेवढा स्पेस आहे, त्यापेक्षा 1 किंवा 1/2 इंचेस एक्स्ट्रा ठेवायचा आहे आपल्याला थ्रेड.

[00:16 - 00:40] Identifying Front vs. Back:
Attach this thread along the central section on the upper edge. First determine which side you want as the front and which as the back. The side with the braided ridge pattern (lines like a braid) is used as the front side, while the softer smooth side is kept on the inside.
Marathi: हा थ्रेड आपल्याला सेंटरच्या एवढ्याच पार्टमध्ये लावायचा आहे, ते पण फक्त वरच्या साईडनी. त्यासाठी फ्रंट-बॅक बघायचं आहे आधी. जे इथे पॅटर्न रेडी आहे, जिथे लाईन्स आहेत पूर्ण ब्रेडसारख्या, ती साईड मी फ्रंटला युज करणार आहे. आणि जी सॉफ्ट साईड आहे, ती आतमध्ये ठेवणार आहे.

[00:41 - 01:25] Weaving the First Half of the Thread:
Take the inner side where the crochet hook inserts easily. Catch the thread and pull it through. Then at roughly half-inch (1/2 inch) intervals, weave the thread in and out just like a running stitch. Pull the thread inward from the back, and moving slightly forward from the front side, pull it back out.
Marathi: त्यासाठी आतली जी साईड आहे ती घ्यायची आहे. इथनं क्रोशाची निडल इझिली आतमध्ये जाते. त्या साईडनी फक्त थ्रेडला पकडून इकडे ओढून घ्यायचं आहे. त्यानंतर 1/2-1/2 इंचच्या डिस्टन्सवरती थ्रेडला रनिंग स्टिचसारखं आत-बाहेर काढून घ्यायचं आहे.

[01:26 - 02:37] Completing the Running Stitch Along the Edge:
Continue passing the crochet hook back and forth through consecutive loops along the upper middle panel, weaving the yarn through evenly at half-inch intervals to the other side.
Marathi: त्यानंतर परत बॅक साईडनी 1/2 इंचेसवर बाहेर काढायचं आहे.

[02:38 - 02:47] Summary & Next Step Instruction:
Along the top edge of the center panel, we have pulled the thread in and out like a running stitch to secure the top channel. Repeat the exact same process along the bottom edge, only across the center panel.
Marathi: इथे वरच्या साईडला रनिंग स्टिचसारखे आपण थ्रेडला इन-आऊट पूल करून घेतलंय. तसंच सेम खालच्या साईडने पण करायचं आहे, फक्त सेंटर पॅनलला.

[02:48 - 02:53] Outro / Call to Action:
e-Saheli – Enroll Now. Your Skill, Your Identity.`;

const VIDEO1_TEXT = `Good morning everyone!

Have you ever wondered how a simple ball of yarn can turn into something beautiful and useful? That’s the magic of knitting!

Knitting is a creative skill where we use yarn and needles to make different products like sweaters, scarves, caps, bags, and many more things. It is not only fun, but it also helps us develop patience, creativity, and practical skills.

But making a product is only one part. How we present and share it is equally important. We can make our knitted products attractive by keeping them neat, showing their unique designs, and explaining how they were made. We can also display them at exhibitions, share them on social media, or show them to our friends and family.

So, knitting is more than just making things with yarn—it is a way to create, express, and share our ideas with others.`;

const VIDEO2_TEXT = `Material Knowledge in knitting means understanding the different materials and tools needed to create knitted products. The main material used is yarn, which is available in different types, colors, thicknesses, and textures. For example, wool yarn is warm and is often used for sweaters and winter clothes, while cotton yarn is lighter and more suitable for items used in warmer weather.

Another important material is knitting needles. Needles come in different sizes and can be made from materials such as metal, wood, or plastic. The size of the needle is usually selected based on the thickness of the yarn and the type of product being made.

Knitting also requires other tools such as scissors, measuring tapes, stitch markers, and yarn needles. Each tool has a specific purpose and helps make the knitting process easier and more accurate.

Understanding these materials helps us choose the right combination of yarn, needles, and tools for a particular project. It also improves the quality, appearance, comfort, and durability of the final knitted product. Therefore, having proper material knowledge is an important part of successful knitting.`;

const VIDEO3_TEXT = `First, take the yarn and make a small loop called a slip knot.

Place this loop on one knitting needle.

Now, take the second needle and insert it into the loop.

Wrap the yarn around the needle and pull it through the loop to make a new loop.

Continue this process to create more loops.

Keep the loops even and avoid pulling the yarn too tightly.

As you keep making loops, they connect with each other and form a piece of fabric.

Continue knitting row by row until you reach the size you need.

With this basic process, you can make different items such as scarves, caps, sweaters, and other useful products.

Practice slowly and keep your stitches even for a neat and strong fabric.`;

export const VIDEO4_TEXT = `Topic: Knit Stitch

What is a Knit Stitch?
A knit stitch is one of the two basic stitches used in knitting. It is created by inserting the right knitting needle into an existing stitch, wrapping the working yarn around the needle, pulling the yarn through the stitch, and then transferring the completed stitch onto the right needle. The knit stitch creates a smooth, slightly V-shaped appearance on the front side of the knitted fabric.

What needle should be used?
A pair of knitting needles should be used. The appropriate needle size depends on the thickness of the yarn. Medium-weight yarn can generally be used with medium-sized knitting needles, while thicker yarn requires larger needles and thinner yarn requires smaller needles. Beginners should follow the needle-size recommendation given on the yarn label whenever available.

What type of yarn should be used?
A beginner can practice the knit stitch using smooth, medium-weight yarn because individual stitches are easier to see and handle. Very fluffy, slippery, or extremely thin yarn can make the stitch more difficult to learn.

Where is the Knit Stitch used?
The knit stitch is used to create many basic knitted fabrics and beginner projects. It can be used for scarves, blankets, caps, sweaters, baby items, and other knitted accessories. When repeated across rows, it can create a simple textured fabric.

How to make a Knit Stitch:
1. Hold the needle containing the stitches in the left hand and the empty needle in the right hand.
2. Insert the right needle into the first stitch.
3. Wrap the working yarn around the right needle.
4. Pull the wrapped yarn through the existing stitch.
5. Slide the original stitch off the left needle.
6. The new loop on the right needle is the completed knit stitch.
7. Repeat the process for the remaining stitches.`;

export const VIDEO5_TEXT = `Topic: Purl Stitch

What is a Purl Stitch?
A purl stitch is one of the two fundamental stitches in knitting. It is similar to the knit stitch but is worked with the yarn positioned in front of the needles and with the needle entering the stitch in the opposite direction. The purl stitch produces a different texture and is commonly combined with knit stitches to create patterns.

What needle should be used?
A pair of knitting needles should be used. The needle size should match the yarn thickness. Larger needles are generally suitable for thicker yarn, while smaller needles are generally suitable for thinner yarn. For beginners, a medium-sized needle with smooth, medium-weight yarn is easier to handle.

What type of yarn should be used?
Smooth, medium-weight yarn is recommended for learning the purl stitch because the individual loops can be clearly seen. Beginners should avoid very fuzzy or slippery yarn until they are comfortable controlling the stitches.

Where is the Purl Stitch used?
Purl stitches are commonly used together with knit stitches to create different textures and patterns. They are used in scarves, sweaters, blankets, caps, borders, cuffs, and decorative knitted designs. Alternating knit and purl stitches can create patterns such as ribbing and other textured fabrics.

How to make a Purl Stitch:
1. Hold the needle containing the stitches in the left hand and the empty needle in the right hand.
2. Bring the working yarn to the front of the needles.
3. Insert the right needle into the stitch from the appropriate direction for a purl stitch.
4. Wrap the working yarn around the right needle.
5. Pull the wrapped yarn through the existing stitch.
6. Slide the original stitch off the left needle.
7. The new loop is the completed purl stitch.
8. Repeat the process for the remaining stitches.`;

export const VIDEO6_TEXT = `Topic: Casting On — Creating the Foundation Row

What is Casting On?
Casting on is the process of creating the initial stitches on a knitting needle before beginning the main knitting pattern. These stitches form the foundation of the knitted project. A slip knot is commonly used as the starting point for casting on.

What needle should be used?
A pair of knitting needles of an appropriate size for the selected yarn should be used. The recommended needle size can usually be found on the yarn label. For beginners, a medium-sized needle is easier to handle when learning the basic casting-on technique.

What type of yarn should be used?
Smooth, medium-weight yarn is suitable for learning casting on because the loops are easy to see and manipulate. Yarn that is extremely thin, fuzzy, or slippery can make it harder for beginners to form consistent stitches.

Where is Casting On used?
Casting on is used at the beginning of almost every basic knitting project. It creates the first row of stitches from which the rest of the fabric is knitted. It can be used when starting scarves, sweaters, blankets, caps, socks, baby clothes, and other knitted products.

How to Cast On After a Slip Knot:
1. Place the slip knot onto the knitting needle.
2. Hold the needle with the slip knot in the appropriate hand.
3. Create the next loop using the working yarn and needle.
4. Pull the yarn through to form another stitch on the needle.
5. Continue creating loops until the required number of stitches is reached.
6. Keep the tension consistent so that the foundation row is neither excessively tight nor excessively loose.
7. Once the required stitches have been created, the foundation row is ready for the first knitting row.`;

export const KNITTING_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "video-0",
    videoOrder: 0,
    title: "Demo Lesson: Center Panel Stitching & Crochet Hook Technique",
    sourceFile: "demo-script.txt",
    content: VIDEO0_TEXT,
    summary:
      "Hands-on demonstration of measuring thread with 1 to 1.5 inches extra, identifying the braided ridge front side vs soft inner side, and weaving running stitches at half-inch intervals with a crochet needle across the center panel.",
    keyTopics: [
      "center panel",
      "crochet needle",
      "crochet hook",
      "measuring thread",
      "1 to 1.5 inches extra",
      "front vs back",
      "braided ridge lines",
      "soft side inside",
      "running stitch",
      "half-inch intervals",
      "1/2 inch distance",
      "mirroring bottom edge",
      "e-saheli demo",
    ],
    starterQuestions: [
      "How much extra thread should I leave when measuring the center panel?",
      "Which side of the knitted piece is used as the front side?",
      "What tool is used to stitch the center panel in the demo?",
      "What interval should be kept between running stitches?",
      "How do I stitch the bottom edge after completing the top?",
    ],
  },
  {
    id: "video-1",
    videoOrder: 1,
    title: "Lesson 1: Introduction to Knitting & Presentation",
    sourceFile: "video1.txt",
    content: VIDEO1_TEXT,
    summary:
      "Overview of knitting as a creative craft using yarn and needles, products that can be made, patience and skill building, and how to present and showcase knitted products attractively.",
    keyTopics: [
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
    starterQuestions: [
      "What products can I make using knitting?",
      "How does knitting help develop patience and creativity?",
      "How can I present and share my knitted products attractively?",
      "Where can I showcase my finished knitted items?",
    ],
  },
  {
    id: "video-2",
    videoOrder: 2,
    title: "Lesson 2: Materials & Tools Knowledge",
    sourceFile: "video2.txt",
    content: VIDEO2_TEXT,
    summary:
      "Understanding different yarn types (wool vs cotton), needle sizes and materials (metal, wood, plastic), and essential knitting tools like scissors, measuring tapes, stitch markers, and yarn needles.",
    keyTopics: [
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
    starterQuestions: [
      "What is the difference between wool yarn and cotton yarn?",
      "How do I choose the right needle size and needle material?",
      "What tools do I need for knitting besides yarn and needles?",
      "Why is material knowledge important for successful knitting?",
    ],
  },
  {
    id: "video-3",
    videoOrder: 3,
    title: "Lesson 3: Basic Process — Slip Knot to Fabric",
    sourceFile: "video3.txt",
    content: VIDEO3_TEXT,
    summary:
      "Step-by-step instructions for creating a slip knot, placing loops onto needles, wrapping yarn to form new loops, maintaining stitch tension, and working row by row into fabric.",
    keyTopics: [
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
    starterQuestions: [
      "How do I make a slip knot to start knitting?",
      "How do I create new loops with the second needle?",
      "Why should I avoid pulling the yarn too tightly?",
      "How do loops connect to form a piece of fabric?",
    ],
  },
  {
    id: "video-4",
    videoOrder: 4,
    title: "Lesson 4: The Knit Stitch — Technique & Step-by-Step",
    sourceFile: "video4.txt",
    content: VIDEO4_TEXT,
    summary:
      "Mastering the fundamental knit stitch: inserting the right needle, wrapping working yarn, pulling through to form smooth V-shaped stitches, and creating foundation fabrics for scarves, blankets, and sweaters.",
    keyTopics: [
      "knit stitch",
      "v-shaped appearance",
      "smooth front side",
      "insert right needle into stitch",
      "wrap working yarn",
      "pull yarn through",
      "slide stitch off left needle",
      "pair of knitting needles",
      "medium-weight yarn",
      "needle size from yarn label",
      "scarves blankets caps sweaters",
      "step by step knit stitch",
    ],
    starterQuestions: [
      "How do I make a knit stitch step by step?",
      "What does a knit stitch look like on the front of the fabric?",
      "What needle size and yarn should I use for learning the knit stitch?",
      "What projects can I make using only knit stitches?",
    ],
  },
  {
    id: "video-5",
    videoOrder: 5,
    title: "Lesson 5: The Purl Stitch — Texture, Ribbing & Technique",
    sourceFile: "video5.txt",
    content: VIDEO5_TEXT,
    summary:
      "Learning the purl stitch with yarn in front: opposite needle entry, wave bump textures, and combining knit and purl stitches for ribbed borders, cuffs, and decorative designs.",
    keyTopics: [
      "purl stitch",
      "yarn in front of needles",
      "opposite direction entry",
      "bumpy texture",
      "ribbing and patterns",
      "cuffs and borders",
      "smooth medium-weight yarn",
      "avoid fuzzy slippery yarn",
      "alternating knit and purl",
      "step by step purl stitch",
    ],
    starterQuestions: [
      "How do I make a purl stitch step by step?",
      "Where should the working yarn be positioned when purling?",
      "How do knit and purl stitches combine to make ribbing?",
      "What is the difference between knit stitch and purl stitch?",
    ],
  },
  {
    id: "video-6",
    videoOrder: 6,
    title: "Lesson 6: Casting On — Creating the Foundation Row",
    sourceFile: "video6.txt",
    content: VIDEO6_TEXT,
    summary:
      "Step-by-step casting on after making a slip knot: building initial foundation loops onto the needle, maintaining consistent tension, and preparing the foundation row for your project.",
    keyTopics: [
      "casting on",
      "foundation row",
      "initial stitches on needle",
      "slip knot starting point",
      "loop creation with working yarn",
      "consistent tension",
      "neither too tight nor too loose",
      "ready for first row",
      "yarn label needle size",
      "starting scarves sweaters blankets caps",
    ],
    starterQuestions: [
      "How do I cast on stitches after making a slip knot?",
      "What is the purpose of casting on in knitting?",
      "How do I keep my foundation row tension consistent?",
      "How do I know when my foundation row is ready to knit?",
    ],
  },
];

export const GENERAL_STARTER_QUESTIONS: string[] = [
  "How do I make a slip knot to start?",
  "How do I do a knit stitch step by step?",
  "How do I do a purl stitch with yarn in front?",
  "What is the difference between a knit stitch and a purl stitch?",
  "How do I cast on stitches for a new project?",
];
