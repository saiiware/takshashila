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
  const { enrollment, isEnrolled, markCompleted, setLastAccessed } = useProgress();
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Link to="/course" className="inline-flex items-center gap-1.5 text-base font-semibold text-workshop-600 hover:text-workshop-700 hover:underline">
          <span>←</span> Back to Course Curriculum
        </Link>

        {/* Video Player */}
        {video.videoUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-card bg-black shadow-md">
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
            className="flex aspect-video w-full items-center justify-center rounded-card text-white shadow-md"
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

        {/* Clickable Interactive Timestamps for Demo Video */}
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

        {/* Lesson Details Card */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-workshop-600">
              {video.order === 0 ? "Featured Demo Lecture" : `Lesson ${video.order}`}
            </span>
            <span className="text-xs text-ink/50 font-medium">{video.durationMinutes} min</span>
          </div>

          <h1 className="text-2xl font-bold text-ink">{video.title}</h1>
          <p className="mt-2 text-base text-ink/70 leading-relaxed">{video.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant={isCompleted ? "ghost" : "secondary"}
              onClick={handleMarkCompleted}
              disabled={isCompleted}
            >
              {isCompleted ? "✓ Completed" : "Mark as completed"}
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <Button
              variant="ghost"
              onClick={() => previousVideo && goToVideo(previousVideo.id)}
              disabled={!previousVideo}
            >
              ← Previous Lesson
            </Button>
            <Button
              onClick={() => nextVideo && goToVideo(nextVideo.id)}
              disabled={!nextVideo}
            >
              Next Lesson →
            </Button>
          </div>
        </Card>
      </div>

      {/* AI Assistant Chatbot Grounded in this Video */}
      <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <Card className="flex h-full min-h-[460px] flex-col">
          <AIAssistantPanel videoId={video.id} videoTitle={video.title} />
        </Card>
      </div>
    </div>
  );
}
