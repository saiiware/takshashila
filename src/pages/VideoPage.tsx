import { useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { MOCK_COURSE, VIDEO_TIMESTAMPS } from "@/data/mockData";
import { useProgress } from "@/context/ProgressContext";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import AIAssistantPanel from "@/components/ai/AIAssistantPanel";

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { enrollment, markCompleted, setLastAccessed } = useProgress();
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoIndex = MOCK_COURSE.videos.findIndex((v) => v.id === videoId);
  const video = MOCK_COURSE.videos[videoIndex >= 0 ? videoIndex : 0];

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
  const activeTimestamps = VIDEO_TIMESTAMPS[video.id] || [];

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
    <div className="space-y-4 sm:space-y-6">
      {/* Side-by-Side Main Area: Left (Video Player & Timestamps) + Right (AI Learning Assistant) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        {/* Left Column: Video Player, Title, and Chapter / Timestamp Navigation */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* 1. Video Player */}
          {video.videoUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-sm border border-workshop-200">
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
              className="flex aspect-video w-full items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: video.thumbnailColor }}
            >
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs">
                  <svg className="h-7 w-7 translate-x-0.5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="mt-3 text-lg font-medium">
                  {`Part ${video.order}`} of {MOCK_COURSE.totalVideos}
                </p>
              </div>
            </div>
          )}

          {/* 2. Video Title, Meta, and Action Controls */}
          <div className="space-y-3 rounded-2xl border border-workshop-200/90 bg-white p-4 sm:p-5 shadow-2xs">
            {/* Meta Row: Back button, Part badge, Duration, Completed badge, and Prev/Next */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/course"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-workshop-600 hover:text-workshop-700 hover:underline"
                >
                  <span>←</span> Courses
                </Link>
                <span className="text-ink/30">•</span>
                <span className="rounded-full bg-workshop-100 px-2.5 py-0.5 text-xs font-bold text-workshop-800">
                  {`Part ${video.order} of ${MOCK_COURSE.totalVideos}`}
                </span>
                <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink/60 border border-line">
                  ⏱ {video.durationMinutes} min
                </span>
                {isCompleted && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    ✓ Completed
                  </span>
                )}
              </div>

              {/* Action Buttons: Prev, Next, Mark as Completed */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  onClick={() => previousVideo && goToVideo(previousVideo.id)}
                  disabled={!previousVideo}
                  className="text-xs px-2.5 py-1.5"
                  title="Previous lesson"
                >
                  ← Prev
                </Button>
                <Button
                  onClick={() => nextVideo && goToVideo(nextVideo.id)}
                  disabled={!nextVideo}
                  className="text-xs px-3 py-1.5"
                  title="Next lesson"
                >
                  Next →
                </Button>
                <Button
                  variant={isCompleted ? "ghost" : "secondary"}
                  onClick={handleMarkCompleted}
                  disabled={isCompleted}
                  className="shadow-2xs text-xs px-3 py-1.5"
                >
                  {isCompleted ? "✓ Completed" : "Mark as Completed"}
                </Button>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-ink tracking-tight">
                {video.title}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-ink/70 leading-relaxed">
                {video.description}
              </p>
            </div>
          </div>

          {/* 3. Chapter / Timestamp Navigation (Matching wireframe placement) */}
          {activeTimestamps.length > 0 && (
            <div className="rounded-2xl border border-workshop-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-workshop-100 pb-2">
                <h3 className="text-sm sm:text-base font-bold text-ink">
                  Chapter / Timestamp Navigation
                </h3>
                <span className="text-[11px] text-ink/50">Click to jump to time</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeTimestamps.map((ts, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seekVideo(ts.seconds)}
                    className="flex items-center gap-2.5 rounded-xl bg-workshop-50/70 border border-workshop-200 px-3 py-2 text-xs text-left hover:border-workshop-400 hover:bg-workshop-100/70 transition-all shadow-2xs group cursor-pointer"
                  >
                    <span className="font-extrabold text-workshop-700 bg-white border border-workshop-200 px-2 py-0.5 rounded-md text-[11px] shrink-0 group-hover:border-workshop-400">
                      {ts.time}
                    </span>
                    <span className="truncate text-ink/80 group-hover:text-ink font-semibold">
                      {ts.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Learning Assistant Card */}
        <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20">
          <Card className="flex flex-col h-[650px] lg:h-[calc(100vh-6rem)] min-h-[580px] max-h-[880px] shadow-sm border border-workshop-200/90 rounded-2xl p-0 overflow-hidden bg-white">
            <div className="flex flex-col h-full p-4 sm:p-5">
              <AIAssistantPanel videoId={video.id} videoTitle={video.title} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
