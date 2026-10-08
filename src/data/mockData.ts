import type { Course, LanguageOption, Video } from "@/types";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
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
    title: "Mastering Basic Rows & Stitch Tension",
    description:
      "Building steady rhythm, maintaining even stitch tension, and avoiding tight pulling to produce neat, durable fabric.",
    minutes: 9,
  },
  {
    title: "Knitting Your First Scarf Project",
    description:
      "Applying slip knots and row-by-row loops to complete a cozy scarf from start to finish.",
    minutes: 14,
  },
  {
    title: "Shaping Caps and Small Accessories",
    description:
      "Using different needle sizes and yarn thicknesses to knit practical winter caps and pouches.",
    minutes: 11,
  },
  {
    title: "Working with Colors, Textures & Patterns",
    description:
      "Combining wool and cotton textures, introducing color changes, and creating decorative motifs.",
    minutes: 13,
  },
  {
    title: "Finishing Edges & Using Yarn Needles",
    description:
      "Neat edge finishing, binding off loops, and using yarn needles to assemble pieces seamlessly.",
    minutes: 10,
  },
  {
    title: "Care, Washing & Durability of Knitted Items",
    description:
      "Proper washing, drying, and maintenance techniques for wool and cotton knitted products.",
    minutes: 8,
  },
  {
    title: "Presenting, Showcasing & Selling Your Creations",
    description:
      "Photographing products for social media, setting up exhibition displays, storytelling, and pricing handmade knitted goods.",
    minutes: 15,
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

const videos: Video[] = videoTitles.map((v, index) => ({
  id: `${COURSE_ID}-video-${index + 1}`,
  courseId: COURSE_ID,
  order: index + 1,
  title: v.title,
  description: v.description,
  durationMinutes: v.minutes,
  thumbnailColor: thumbnailColors[index % thumbnailColors.length],
  videoUrl: "",
}));

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
