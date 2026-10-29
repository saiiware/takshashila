import type { Course, LanguageOption, Video } from "@/types";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
];

const videoTitles: Array<{ title: string; description: string; minutes: number }> = [
  {
    title: "Introduction to Knitting",
    description:
      "Discover the magic of knitting: turning a simple ball of yarn into sweaters, scarves, caps, and bags. Learn how patience and creativity help you craft and present your creations attractively.",
    minutes: 7,
  },
  {
    title: "Understanding Materials: Yarn, Needles & Tools",
    description:
      "Comprehensive material knowledge: wool vs cotton yarn, choosing needle sizes and materials (metal, wood, plastic), and using essential tools like stitch markers and measuring tapes.",
    minutes: 10,
  },
  {
    title: "Basic Knitting Process: Slip Knots & Creating Loops",
    description:
      "Step-by-step practical guide: making a slip knot, inserting the second needle, wrapping yarn, pulling through to make new loops, and forming a strong, even piece of fabric.",
    minutes: 12,
  },
  {
    title: "Lesson 4: The Knit Stitch — Technique & Foundation",
    description:
      "Master the fundamental knit stitch: inserting the right needle, wrapping working yarn, pulling through to form smooth V-shaped stitches, and creating foundation fabrics for scarves, blankets, and sweaters.",
    minutes: 9,
  },
  {
    title: "Lesson 5: The Purl Stitch — Texture, Ribbing & Technique",
    description:
      "Learn the purl stitch with yarn in front: opposite needle entry, wave bump textures, and combining knit and purl stitches for ribbed cuffs, borders, and decorative designs.",
    minutes: 10,
  },
  {
    title: "Lesson 6: Casting On — Creating the Foundation Row",
    description:
      "Step-by-step casting on after making a slip knot: building initial loops onto the needle, maintaining consistent tension, and preparing the foundation row for your project.",
    minutes: 11,
  },
];

const thumbnailColors = [
  "#1F4B4A",
  "#B5602F",
  "#4C7A5B",
  "#E3A324",
  "#173937",
  "#B87F14",
  "#3A5F46",
  "#2E6664",
  "#C97A4A",
  "#5C8F6A",
];

export const COURSE_ID = "course-knitting-craft";

const demoVideo: Video = {
  id: `${COURSE_ID}-video-0`,
  courseId: COURSE_ID,
  order: 0,
  title: "Demo Lesson: Center Panel Stitching & Crochet Hook Technique",
  description:
    "Live demonstration by e-Saheli: measuring thread with 1 to 1.5 inches extra, identifying braided ridge front vs soft inside, and weaving running stitches at half-inch intervals with a crochet needle.",
  durationMinutes: 3,
  thumbnailColor: "#1F4B4A",
  videoUrl: "/videos/demo.mp4",
};

const standardVideos: Video[] = videoTitles.map((v, index) => ({
  id: `${COURSE_ID}-video-${index + 1}`,
  courseId: COURSE_ID,
  order: index + 1,
  title: v.title,
  description: v.description,
  durationMinutes: v.minutes,
  thumbnailColor: thumbnailColors[index % thumbnailColors.length],
  videoUrl: "",
}));

const videos: Video[] = [demoVideo, ...standardVideos];

export const MOCK_COURSE: Course = {
  id: COURSE_ID,
  title: "Knitting Craft & Handloom Essentials",
  description:
    "A practical, step-by-step course that takes you from holding yarn and needles for the first time to finishing and presenting your own handmade knitted garments — designed for learners building a home-based livelihood.",
  organization: "EMFV Knitting Course",
  language: "en",
  totalVideos: videos.length,
  videos,
};
