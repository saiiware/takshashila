import { Navigate } from "react-router-dom";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";

/**
 * The "Learning" nav item is a shortcut, not a page of its own: it drops
 * the learner straight into their current video, or onto the course page
 * to register first if they have not enrolled yet.
 */
export default function LearningRedirectPage() {
  const { isLoading, isEnrolled, enrollment } = useProgress();

  if (isLoading) return null;
  if (!isEnrolled) return <Navigate to="/course" replace />;

  const targetVideoId = enrollment?.lastAccessedVideoId ?? MOCK_COURSE.videos[0].id;
  return <Navigate to={`/course/video/${targetVideoId}`} replace />;
}
