import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";
import CourseSummaryCard from "@/components/course/CourseSummaryCard";
import Card from "@/components/common/Card";

export default function DashboardPage() {
  const { user } = useAuth();
  const { enrollment, completedCount, progressPercent, isEnrolled } = useProgress();

  const recentVideo = enrollment?.lastAccessedVideoId
    ? MOCK_COURSE.videos.find((v) => v.id === enrollment.lastAccessedVideoId)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ink">Welcome back, {user?.name}! </h1>
        <p className="mt-1 text-lg text-ink/60">Here's where you left off.</p>
      </div>

      <CourseSummaryCard
        course={MOCK_COURSE}
        completedCount={completedCount}
        progressPercent={progressPercent}
        continueVideoId={enrollment?.lastAccessedVideoId ?? MOCK_COURSE.videos[0].id}
        isEnrolled={isEnrolled}
      />

      {isEnrolled && recentVideo && (
        <Card>
          <p className="mb-1 text-base font-medium text-workshop-500">Recently watched</p>
          <h3 className="mb-3 text-xl font-bold text-ink">{recentVideo.title}</h3>
          <p className="mb-4 text-base text-ink/60">{recentVideo.description}</p>
          <Link
            to={`/course/video/${recentVideo.id}`}
            className="text-lg font-semibold text-workshop-500 hover:underline"
          >
            Resume this video →
          </Link>
        </Card>
      )}

      {!isEnrolled && (
        <Card>
          <h3 className="mb-2 text-xl font-bold text-ink">You haven't registered yet</h3>
          <p className="mb-4 text-base text-ink/60">
            Register for the course to start tracking your progress across all 10 videos.
          </p>
          <Link to="/course" className="text-lg font-semibold text-workshop-500 hover:underline">
            Go to course page →
          </Link>
        </Card>
      )}
    </div>
  );
}
