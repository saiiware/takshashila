import type { Course, LanguageOption, Video } from "@/types";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "en", label: "English", nativeLabel: "English" },
];

export const COURSE_ID = "course-knitting-craft";

export const VIDEO_TIMESTAMPS: Record<string, Array<{ time: string; seconds: number; label: string }>> = {
  [`${COURSE_ID}-video-1`]: [
    { time: "00:00", seconds: 0, label: "Intro & Materials (Ganga Olivia Acrylic Yarn, 4.5mm Hook)" },
    { time: "00:58", seconds: 58, label: "Holding Yarn in Left Hand & Starter Loop" },
    { time: "01:48", seconds: 108, label: "Chain Stitch (चेन स्टिच) Technique" },
    { time: "02:55", seconds: 175, label: "Single Crochet Stitch (सिंगल क्रोशे - 2 Loops)" },
    { time: "04:14", seconds: 254, label: "Half Double Crochet (हाफ डबल क्रोशे - 3 Loops)" },
    { time: "05:24", seconds: 324, label: "Double Crochet 7-Step Sequence (डबल क्रोशे)" },
    { time: "06:45", seconds: 405, label: "Practice Advice: Day 1 Chain, Day 2 Single" },
  ],
  [`${COURSE_ID}-video-2`]: [
    { time: "00:00", seconds: 0, label: "Intro & Materials (4mm Hook, Ganga Olivia Yarn)" },
    { time: "00:29", seconds: 29, label: "Making the Magic Ring (मॅजिक रिंग)" },
    { time: "01:14", seconds: 74, label: "Chain 3 & 3 Treble Crochets (३ ट्रिपल क्रोशे)" },
    { time: "02:29", seconds: 149, label: "3 Double Crochets & Bottom Point (1 Tr, 1 Ch)" },
    { time: "03:16", seconds: 196, label: "Second Symmetrical Half (3 DC, 3 Treble, 3 Ch)" },
    { time: "03:49", seconds: 229, label: "Slip Stitch, Closing Magic Ring & Finishing" },
  ],
  [`${COURSE_ID}-video-3`]: [
    { time: "00:01", seconds: 1, label: "Pentagon Structure: 5 Sides & 5 Corners (५ बाजू, ५ कोपरे)" },
    { time: "00:27", seconds: 27, label: "Round 1: Magic Ring & 5 Groups of [3 DC, 2 Ch]" },
    { time: "02:44", seconds: 164, label: "Round 1 Slip Stitch & Shape Formation" },
    { time: "03:01", seconds: 181, label: "Round 2: Corner Expansion [1 DC, 2 Ch, 1 DC]" },
    { time: "05:29", seconds: 329, label: "Round 3: Expanding Sides & Corners" },
    { time: "06:40", seconds: 400, label: "Crucial Rule: Do NOT Skip Final Increased DC" },
    { time: "07:32", seconds: 452, label: "Weaving In Tails Invisibly on Wrong Side" },
  ],
  [`${COURSE_ID}-video-4`]: [
    { time: "00:00", seconds: 0, label: "Hexagon Structure: 6 Sides & 6 Sharp Corners (६ बाजू, ६ कोपरे)" },
    { time: "00:35", seconds: 35, label: "Round 1: Magic Ring & 6 Groups of [3 DC, 2 Ch]" },
    { time: "03:14", seconds: 194, label: "Round 1 Close & Hexagon Outline" },
    { time: "03:33", seconds: 213, label: "Round 2: [1 DC, 2 Ch, 1 DC] Across 6 Corners" },
    { time: "06:14", seconds: 374, label: "Round 3: Final Round Expansion" },
    { time: "07:28", seconds: 448, label: "Crucial Rule: Working the Increased DC" },
    { time: "08:15", seconds: 495, label: "Fastening Off & Tapestry Needle Finishing" },
  ],
};

const videos: Video[] = [
  {
    id: `${COURSE_ID}-video-1`,
    courseId: COURSE_ID,
    order: 1,
    title: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
    description:
      "Taught by Suchita: holding Ganga Olivia acrylic yarn in the left hand, using a 4.5mm hook, creating the starter loop, and mastering the Chain Stitch, Single Crochet, Half Double Crochet, and Double Crochet 7-step sequence.",
    durationMinutes: 7,
    thumbnailColor: "#1F4B4A",
    videoUrl: "/videos/demo.mp4",
  },
  {
    id: `${COURSE_ID}-video-2`,
    courseId: COURSE_ID,
    order: 2,
    title: "Part 2: Cute Little Crochet Heart Shape (छोटूसा क्यूट हार्ट)",
    description:
      "Episode 4 of shapes series: crocheting a cute heart using Ganga Olivia yarn and a 4mm hook with magic ring, 3 chains, 3 treble crochets, 3 double crochets, bottom point, symmetry, and closing the magic circle.",
    durationMinutes: 5,
    thumbnailColor: "#B5602F",
    videoUrl: "/videos/demo.mp4",
  },
  {
    id: `${COURSE_ID}-video-3`,
    courseId: COURSE_ID,
    order: 3,
    title: "Part 3: Crochet Pentagon Shape — 5 Sides & 5 Corners (पंचकोन)",
    description:
      "Episode 3 of shapes series: constructing a 5-sided pentagon over 3 rounds with magic ring, [1 DC, 2 ch, 1 DC] corner expansion, and learning why not to skip the final DC before slip stitching.",
    durationMinutes: 9,
    thumbnailColor: "#4C7A5B",
    videoUrl: "/videos/demo.mp4",
  },
  {
    id: `${COURSE_ID}-video-4`,
    courseId: COURSE_ID,
    order: 4,
    title: "Part 4: Crochet Hexagon Shape — 6 Sides & 6 Corners (षटकोन)",
    description:
      "Episode 2 of shapes series: creating a 6-sided hexagon with 6 sharp corners using 4mm hook, working 3 rounds, and maintaining symmetry by keeping the increased DC.",
    durationMinutes: 9,
    thumbnailColor: "#E3A324",
    videoUrl: "/videos/demo.mp4",
  },
];

export const MOCK_COURSE: Course = {
  id: COURSE_ID,
  title: "Crochet Craft Masterclass (क्रॉशेट क्राफ्ट)",
  description:
    "Learn the art of crochet step-by-step from beginner foundation stitches (Chain, Single, Half Double, Double Crochet) to crafting beautiful shapes like Hearts, Pentagons, and Hexagons — taught in Marathi by Suchita.",
  organization: "Suchita's Crochet Craft Studio",
  language: "mr",
  totalVideos: videos.length,
  videos,
};
