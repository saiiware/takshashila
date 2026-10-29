import { useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { MOCK_COURSE } from "@/data/mockData";
import { useProgress } from "@/context/ProgressContext";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import AIAssistantPanel from "@/components/ai/AIAssistantPanel";

const DEMO_TIMESTAMPS = [
  { time: "00:00", seconds: 0, label: "Title Card & Introduction" },
  { time: "00:04", seconds: 4, label: "Measuring & Cutting Thread (1-1.5 inches extra)" },
  { time: "00:16", seconds: 16, label: "Front vs. Back Identification (Braided ridges)" },
  { time: "00:41", seconds: 41, label: "Weaving First Half with Crochet Needle" },
  { time: "01:26", seconds: 86, label: "Running Stitch at Half-Inch Intervals" },
  { time: "02:38", seconds: 158, label: "Summary & Bottom Edge Mirroring" },
];

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { enrollment, markCompleted, setLastAccessed } = useProgress();
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoIndex = MOCK_COURSE.videos.findIndex((v) => v.id === videoId);
  const video = MOCK_COURSE.videos[videoIndex];

  useEffect(() => {
    if (video) setLastAccessed(video.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  // Ensure video starts with max volume and unmuted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }
  }, [video?.id]);

  if (!video) return <Navigate to="/course" replace />;

  const isCompleted = Boolean(enrollment?.videoProgress[video.id]?.completed);
  const previousVideo = MOCK_COURSE.videos[videoIndex - 1];
  const nextVideo = MOCK_COURSE.videos[videoIndex + 1];
  const isDemo = video.id.includes("video-0");

  const handleMarkCompleted = async () => {
    await markCompleted(video.id);
  };

  const goToVideo = (id: string) => navigate(`/course/video/${id}`);

  const seekVideo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Lesson Introduction Shifted to Top (Above Video and AI Chatbot) */}
      <Card className="border-workshop-200 bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Meta Tags & Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/course"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-workshop-600 hover:text-workshop-700 hover:underline"
              >
                <span>←</span> Back to Course
              </Link>
              <span className="text-ink/30">•</span>
              <span className="rounded-full bg-workshop-100 px-2.5 py-0.5 text-xs font-bold text-workshop-800">
                {video.order === 0 ? "Featured Demo Lecture" : `Lesson ${video.order} of ${MOCK_COURSE.totalVideos - 1}`}
              </span>
              <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink/60 border border-line flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {video.durationMinutes} min
              </span>
              {isCompleted && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  ✓ Completed
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
              {video.title}
            </h1>
            <p className="text-sm md:text-base text-ink/70 leading-relaxed max-w-4xl">
              {video.description}
            </p>
          </div>

          {/* Action Controls: Mark Completed & Lesson Navigation */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <Button
              variant={isCompleted ? "ghost" : "secondary"}
              onClick={handleMarkCompleted}
              disabled={isCompleted}
              className="shadow-2xs text-xs sm:text-sm"
            >
              {isCompleted ? "✓ Completed" : "Mark as Completed"}
            </Button>

            <div className="flex items-center gap-1.5 border-l border-line pl-2.5">
              <Button
                variant="ghost"
                onClick={() => previousVideo && goToVideo(previousVideo.id)}
                disabled={!previousVideo}
                className="text-xs sm:text-sm px-2.5"
                title="Go to previous lesson"
              >
                ← Prev
              </Button>
              <Button
                onClick={() => nextVideo && goToVideo(nextVideo.id)}
                disabled={!nextVideo}
                className="text-xs sm:text-sm px-3"
                title="Go to next lesson"
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Side-by-Side Main Area: Large Video Player (Left) + Large AI Chatbot Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Enlarged Video Player & Timestamps */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {video.videoUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-md">
              <video
                ref={videoRef}
                controls
                playsInline
                preload="auto"
                src={video.videoUrl}
                className="h-full w-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handleLoadedMetadata}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div
              className="flex aspect-video w-full items-center justify-center rounded-2xl text-white shadow-md"
              style={{ backgroundColor: video.thumbnailColor }}
            >
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs">
                  <svg className="h-7 w-7 translate-x-0.5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="mt-3 text-lg font-medium">
                  {video.order === 0 ? "Demo Lesson" : `Lesson ${video.order}`} of {MOCK_COURSE.totalVideos - 1}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Timestamps for Quick Seeking */}
          {isDemo && (
            <div className="rounded-card border border-workshop-200 bg-workshop-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-workshop-800 flex items-center gap-1.5">
                  Interactive Video Timestamps:
                </span>
                <span className="text-[11px] text-ink/60">Click any timestamp to seek</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_TIMESTAMPS.map((ts, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seekVideo(ts.seconds)}
                    className="flex items-center gap-2 rounded-lg bg-white border border-workshop-200 px-3 py-2 text-xs text-left hover:border-workshop-400 hover:bg-workshop-100/60 transition-all shadow-2xs group cursor-pointer"
                  >
                    <span className="font-extrabold text-workshop-700 bg-workshop-100 px-2 py-0.5 rounded text-[11px]">
                      {ts.time}
                    </span>
                    <span className="truncate text-ink/80 group-hover:text-ink font-medium">
                      {ts.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Enlarged AI Chatbot Card Side-by-Side with Video */}
        <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20">
          <Card className="flex flex-col h-[580px] lg:h-[calc(100vh-10rem)] min-h-[520px] max-h-[760px] shadow-sm border-workshop-200 p-0 overflow-hidden">
            <div className="flex flex-col h-full p-4 sm:p-5">
              <AIAssistantPanel videoId={video.id} videoTitle={video.title} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
