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
    : MOCK_COURSE.videos[0];

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            Welcome back, {user?.name || "Learner"}!
          </h1>
          <p className="mt-1 text-base text-ink/60">
            Continue mastering your knitting craft step by step.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-workshop-100 px-3 py-1 text-xs font-bold text-workshop-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Coach Active
          </span>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-card border border-line bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Lessons Finished</p>
          <p className="text-2xl font-extrabold text-workshop-700 mt-1">
            {completedCount} <span className="text-base font-semibold text-ink/40">/ {MOCK_COURSE.totalVideos}</span>
          </p>
        </div>

        <div className="rounded-card border border-line bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Overall Mastery</p>
          <p className="text-2xl font-extrabold text-workshop-700 mt-1">
            {progressPercent}%
          </p>
        </div>

        <div className="rounded-card border border-line bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Active Skill Track</p>
          <p className="text-base font-bold text-ink mt-1 truncate">
            Hand Knitting & Fibers
          </p>
        </div>
      </div>

      {/* Primary Course Summary Card */}
      <CourseSummaryCard
        course={MOCK_COURSE}
        completedCount={completedCount}
        progressPercent={progressPercent}
        continueVideoId={enrollment?.lastAccessedVideoId ?? MOCK_COURSE.videos[0].id}
        isEnrolled={isEnrolled}
      />

      {/* Photo Work Checker vs Video Benchmark Feature Card */}
      <Card className="border-workshop-200 bg-gradient-to-r from-workshop-50/90 via-white to-amber-50/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-workshop-600 text-white text-sm font-bold shadow-2xs">
                📸
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-ink">
                Check Your Practice Work Against Videos
              </h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5">
                New Feature
              </span>
            </div>
            <p className="text-sm text-ink/75 max-w-xl leading-relaxed">
              Upload photos of your slip knot, loops, or yarn choice. Our AI evaluates your work against the official curriculum rules taught in Videos 1, 2, and 3 for instant feedback.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/check-work"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-workshop-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-workshop-700 transition-colors"
            >
              <span>Upload & Check Work</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </Card>

      {/* Recently Watched / Continue Card */}
      {isEnrolled && recentVideo && (
        <Card>
          <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-workshop-600">
              Current Video Lesson
            </p>
            <span className="text-xs text-ink/50 font-medium">{recentVideo.durationMinutes} min</span>
          </div>
          <h3 className="text-xl font-bold text-ink">{recentVideo.title}</h3>
          <p className="mt-1 text-sm text-ink/70 leading-relaxed mb-4">{recentVideo.description}</p>
          <Link
            to={`/course/video/${recentVideo.id}`}
            className="inline-flex items-center gap-2 text-base font-bold text-workshop-600 hover:text-workshop-700 hover:underline"
          >
            <span>Resume this video lesson</span>
            <span>→</span>
          </Link>
        </Card>
      )}

      {!isEnrolled && (
        <Card>
          <h3 className="text-xl font-bold text-ink">Ready to start your first lesson?</h3>
          <p className="mt-1 text-sm text-ink/60 mb-4">
            Enroll for free to access all 10 video lessons and unlock AI-powered craft coaching.
          </p>
          <Link
            to="/course"
            className="inline-flex items-center gap-2 rounded-card bg-workshop-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-workshop-700 transition-colors"
          >
            <span>View Full Curriculum & Enroll</span>
            <span>→</span>
          </Link>
        </Card>
      )}
    </div>
  );
}
