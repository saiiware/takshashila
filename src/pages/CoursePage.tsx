import { useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import ProgressBar from "@/components/common/ProgressBar";
import VideoListItem from "@/components/course/VideoListItem";

export default function CoursePage() {
  const { enrollment, isEnrolled, completedCount, progressPercent, enroll } = useProgress();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleRegister = async () => {
    setIsEnrolling(true);
    try {
      await enroll();
    } finally {
      setIsEnrolling(false);
    }
  };

  const firstIncompleteIndex = MOCK_COURSE.videos.findIndex(
    (v) => !enrollment?.videoProgress[v.id]?.completed
  );

  const getStatus = (index: number) => {
    if (!isEnrolled) return "locked" as const;
    if (enrollment?.videoProgress[MOCK_COURSE.videos[index].id]?.completed) return "completed" as const;
    if (index === firstIncompleteIndex) return "current" as const;
    if (index < firstIncompleteIndex || firstIncompleteIndex === -1) return "upcoming" as const;
    return "locked" as const;
  };

  return (
    <div className="space-y-6">
      <Card>
        <p className="mb-1 text-base font-medium text-workshop-500">{MOCK_COURSE.organization}</p>
        <h1 className="mb-3 text-3xl font-extrabold text-ink">{MOCK_COURSE.title}</h1>
        <p className="mb-4 text-lg text-ink/70">{MOCK_COURSE.description}</p>
        <p className="mb-5 text-base text-ink/60">{MOCK_COURSE.totalVideos} videos</p>

        {isEnrolled ? (
          <>
            <ProgressBar percent={progressPercent} label="Your progress" />
            <p className="mt-3 mb-5 text-base text-ink/70">
              Videos completed: {completedCount} / {MOCK_COURSE.totalVideos}
            </p>
            <Link to={`/course/video/${enrollment?.lastAccessedVideoId ?? MOCK_COURSE.videos[0].id}`}>
              <Button>Continue course</Button>
            </Link>
          </>
        ) : (
          <Button onClick={handleRegister} disabled={isEnrolling}>
            {isEnrolling ? "Registering…" : "Register for this course"}
          </Button>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-xl font-bold text-ink">All videos</h2>
        <div className="space-y-2">
          {MOCK_COURSE.videos.map((video, index) => (
            <VideoListItem key={video.id} video={video} status={getStatus(index)} />
          ))}
        </div>
      </div>
    </div>
  );
}
