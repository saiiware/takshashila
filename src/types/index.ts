// Central type definitions. Keeping these in one place makes it easy to see
// the exact shape the future FastAPI backend needs to return.

export type Language = "en" | "hi" | "mr";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export interface User {
  id: string;
  name: string;
  contact: string; // email or mobile number
  preferredLanguage: Language;
}

export interface Video {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  thumbnailColor: string; // placeholder in place of a real thumbnail image
  videoUrl: string; // placeholder source, wired up when backend is ready
}

export interface Course {
  id: string;
  title: string;
  description: string;
  organization: string;
  language: Language;
  totalVideos: number;
  videos: Video[];
}

export interface VideoProgress {
  videoId: string;
  completed: boolean;
  lastPositionSeconds: number;
}

export interface CourseEnrollment {
  courseId: string;
  enrolledOn: string;
  videoProgress: Record<string, VideoProgress>;
  lastAccessedVideoId: string | null;
}

export interface RAGSource {
  videoId: string;
  videoTitle: string;
  snippet: string;
  score: number;
}

export interface VisionMetrics {
  edgeDensity?: number;
  warmthScore?: number;
  specularRatio?: number;
  tensionEstimate?: "optimal" | "tight" | "loose" | "unknown";
  needleAngle?: number;
}

export interface VisionAssessment {
  category: "slip_knot" | "yarn" | "needle" | "general" | "heart" | "pentagon" | "hexagon" | "materials" | "invalid_image" | "unrelated" | "wrong_photo";
  status: "correct" | "needs_improvement" | "unclear" | "invalid" | "wrong_photo";
  title: string;
  score: number;
  detected_items: string[];
  feedback: string;
  solution: string;
  lesson_reference: string;
  confidence: number;
  sources?: RAGSource[];
  metrics?: VisionMetrics;
  isWrongImage?: boolean;
  rejectionReason?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  videoContextId?: string | null;
  sources?: RAGSource[];
  relevantQuestions?: string[];
  confidence?: number;
  imageUrl?: string;
  imageFileName?: string;
  visionAssessment?: VisionAssessment;
}

// Shapes below describe what each future FastAPI endpoint will accept /
// return. They are not called yet — see src/services for the stubs.

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AskAIRequest {
  question: string;
  courseId: string;
  videoId?: string | null;
  language: Language;
}

export interface AskAIResponse {
  answer: string;
  answeredAt: string;
  sources?: RAGSource[];
  relevantQuestions?: string[];
  confidence?: number;
}
