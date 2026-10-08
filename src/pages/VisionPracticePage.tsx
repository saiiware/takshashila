import React from "react";
import { Link } from "react-router-dom";
import Card from "@/components/common/Card";
import { KnittingVisionGuide } from "@/components/vision/knittingvisionGuide";

export default function VisionPracticePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-ink">AI Vision Practice Coach</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
              Live CV Active
            </span>
          </div>
          <p className="mt-1 text-base text-ink/70">
            Real-time hand tracking, stitch loop counting, and tension coaching using Computer Vision.
          </p>
        </div>
        <Link
          to="/course"
          className="inline-flex items-center text-sm font-semibold text-workshop-600 hover:underline"
        >
          ← Back to Course
        </Link>
      </div>

      {/* Quick How-It-Works Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-line rounded-card p-3 shadow-2xs">
          <p className="text-xs font-bold text-workshop-600 uppercase tracking-wider mb-1">Step 1 • Camera Setup</p>
          <p className="text-sm text-ink/80">Allow webcam access and position your hands so both needles are visible.</p>
        </div>
        <div className="bg-white border border-line rounded-card p-3 shadow-2xs">
          <p className="text-xs font-bold text-workshop-600 uppercase tracking-wider mb-1">Step 2 • Loop Cycles</p>
          <p className="text-sm text-ink/80">Bring needles together to insert, wrap the yarn, and pull apart to complete a stitch.</p>
        </div>
        <div className="bg-white border border-line rounded-card p-3 shadow-2xs">
          <p className="text-xs font-bold text-workshop-600 uppercase tracking-wider mb-1">Step 3 • Live Feedback</p>
          <p className="text-sm text-ink/80">The AI tracks fingertip distance, counts stitches, and monitors loop tension.</p>
        </div>
      </div>

      {/* Main Interactive Computer Vision Guide */}
      <Card className="p-2 sm:p-4 overflow-hidden">
        <KnittingVisionGuide />
      </Card>
    </div>
  );
}

