import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { MOCK_COURSE } from "@/data/mockData";
import { useProgress } from "@/context/ProgressContext";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import AIAssistantPanel from "@/components/ai/AIAssistantPanel";

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { enrollment, isEnrolled, markCompleted, setLastAccessed } = useProgress();

  const videoIndex = MOCK_COURSE.videos.findIndex((v) => v.id === videoId);
  const video = MOCK_COURSE.videos[videoIndex];

  useEffect(() => {
    if (video) setLastAccessed(video.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  if (!isEnrolled) return <Navigate to="/course" replace />;
  if (!video) return <Navigate to="/course" replace />;

  const isCompleted = Boolean(enrollment?.videoProgress[video.id]?.completed);
  const previousVideo = MOCK_COURSE.videos[videoIndex - 1];
  const nextVideo = MOCK_COURSE.videos[videoIndex + 1];

  const handleMarkCompleted = async () => {
    await markCompleted(video.id);
  };

  const goToVideo = (id: string) => navigate(`/course/video/${id}`);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Link to="/course" className="text-base font-medium text-workshop-500 hover:underline">
          ← Back to course
        </Link>

        {/* Placeholder video player — swap for a real <video>/streaming
            player wired to GET /videos/{id} once the backend exists. */}
        <div
          className="flex aspect-video w-full items-center justify-center rounded-card text-white"
          style={{ backgroundColor: video.thumbnailColor }}
        >
          <div className="text-center">
            <p className="text-5xl">▶️</p>
            <p className="mt-2 text-lg font-medium">
              Video {video.order} of {MOCK_COURSE.totalVideos}
            </p>
          </div>
        </div>

        <Card>
          <h1 className="text-2xl font-bold text-ink">{video.title}</h1>
          <p className="mt-1 text-base text-ink/60">{video.durationMinutes} min</p>
          <p className="mt-3 text-lg text-ink/80">{video.description}</p>

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
              ← Previous
            </Button>
            <Button
              onClick={() => nextVideo && goToVideo(nextVideo.id)}
              disabled={!nextVideo}
            >
              Next →
            </Button>
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <Card className="flex h-full min-h-[420px] flex-col">
          <AIAssistantPanel videoId={video.id} videoTitle={video.title} />
        </Card>
      </div>
    </div>
  );
}
