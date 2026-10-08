import { Link } from "react-router-dom";
import type { Course } from "@/types";
import Card from "@/components/common/Card";
import ProgressBar from "@/components/common/ProgressBar";
import Button from "@/components/common/Button";

interface CourseSummaryCardProps {
  course: Course;
  completedCount: number;
  progressPercent: number;
  continueVideoId: string | null;
  isEnrolled: boolean;
}

export default function CourseSummaryCard({
  course,
  completedCount,
  progressPercent,
  continueVideoId,
  isEnrolled,
}: CourseSummaryCardProps) {
  return (
    <Card>
      <p className="mb-1 text-base font-medium text-workshop-500">Your course</p>
      <h2 className="mb-3 text-2xl font-bold text-ink">{course.title}</h2>

      {isEnrolled ? (
        <>
          <ProgressBar percent={progressPercent} />
          <p className="mt-3 text-base text-ink/70">
            Videos completed: {completedCount} / {course.totalVideos}
          </p>
          <div className="mt-5">
            <Link to={continueVideoId ? `/course/video/${continueVideoId}` : "/course"}>
              <Button>Continue learning</Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mb-5 text-base text-ink/70">{course.description}</p>
          <Link to="/course">
            <Button>View course</Button>
          </Link>
        </>
      )}
    </Card>
  );
}
