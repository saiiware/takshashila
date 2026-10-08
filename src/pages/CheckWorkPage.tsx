import { Link } from "react-router-dom";
import VideoWorkChecker from "@/components/course/VideoWorkChecker";
import Card from "@/components/common/Card";

export default function CheckWorkPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              Check My Work Against Videos
            </h1>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 uppercase tracking-wide">
              Photo AI Inspection
            </span>
          </div>
          <p className="mt-1 text-base text-ink/70">
            Upload photos of your craftwork to automatically compare your technique against the official video lessons.
          </p>
        </div>

        <Link
          to="/course"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-workshop-600 hover:text-workshop-700 hover:underline"
        >
          <span>←</span> Back to Course
        </Link>
      </div>

      {/* 3 Step Instruction Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-card border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-workshop-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-workshop-100 text-workshop-800 text-[11px]">
              1
            </span>
            <span>Take or Upload Photo</span>
          </div>
          <p className="text-sm text-ink/80">
            Snap a clear picture of your slip knot, yarn ball, needles, or knitted rows.
          </p>
        </div>

        <div className="rounded-card border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-workshop-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-workshop-100 text-workshop-800 text-[11px]">
              2
            </span>
            <span>AI Video Comparison</span>
          </div>
          <p className="text-sm text-ink/80">
            The system benchmarks your work against the curriculum rules taught in the video.
          </p>
        </div>

        <div className="rounded-card border border-line bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-workshop-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-workshop-100 text-workshop-800 text-[11px]">
              3
            </span>
            <span>Instant Feedback & Mastery</span>
          </div>
          <p className="text-sm text-ink/80">
            Receive side-by-side analysis, score, correction steps, and mark the lesson completed!
          </p>
        </div>
      </div>

      {/* Main Video Work Checker */}
      <Card className="p-4 sm:p-6 shadow-sm">
        <VideoWorkChecker />
      </Card>

      {/* Best Practice Tips for Accurate Checking */}
      <div className="rounded-2xl border border-workshop-200 bg-gradient-to-r from-workshop-50/70 via-white to-workshop-50/70 p-5 space-y-3">
        <div className="flex items-center gap-2 text-workshop-800 font-bold text-sm">
          <span>💡</span>
          <span>Tips for the Best Photo Checking Results:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm text-ink/80">
          <div className="space-y-1">
            <strong className="text-ink">1. Good Lighting:</strong>
            <p>Photograph in natural light or a bright lamp so yarn texture and stitches are distinct.</p>
          </div>
          <div className="space-y-1">
            <strong className="text-ink">2. Neutral Background:</strong>
            <p>Place your work on a plain table or white cloth so the camera focuses sharply on your knot and loops.</p>
          </div>
          <div className="space-y-1">
            <strong className="text-ink">3. Close-up on the Needle:</strong>
            <p>For Lesson 3 slip knots, capture the loop resting on the needle shaft to accurately evaluate tension.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
