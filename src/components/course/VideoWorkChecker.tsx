import { useState } from "react";
import { Link } from "react-router-dom";
import { MOCK_COURSE } from "@/data/mockData";
import {
  compareWorkWithVideo,
  SAMPLE_WORK_PHOTOS,
} from "@/services/aiService";
import type { SampleWorkPhoto, VideoWorkCheckResult } from "@/types";
import { useProgress } from "@/context/ProgressContext";
import Button from "@/components/common/Button";

interface VideoWorkCheckerProps {
  initialVideoId?: string;
  compact?: boolean;
  onVerifiedCompleted?: (videoId: string) => void;
}

export default function VideoWorkChecker({
  initialVideoId = "course-knitting-craft-video-3",
  compact = false,
  onVerifiedCompleted,
}: VideoWorkCheckerProps) {
  const { markCompleted, enrollment } = useProgress();

  const [selectedVideoId, setSelectedVideoId] = useState<string>(initialVideoId);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoWorkCheckResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const selectedVideo =
    MOCK_COURSE.videos.find((v) => v.id === selectedVideoId) ||
    MOCK_COURSE.videos[2]; // Default to Video 3 (Slip Knots)

  const isCompletedInContext = Boolean(
    enrollment?.videoProgress[selectedVideo.id]?.completed
  );

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      setSelectedFileName(file.name);
      setResult(null);
      setVerifiedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SampleWorkPhoto) => {
    setSelectedImage(sample.imageUrl);
    setSelectedFileName(sample.fileName);
    setSelectedVideoId(sample.targetVideoId);
    setResult(null);
    setVerifiedSuccess(false);
  };

  const handleRunCheck = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const checkResult = await compareWorkWithVideo({
        imageBase64: selectedImage,
        fileName: selectedFileName,
        videoId: selectedVideoId,
        userNotes,
      });
      setResult(checkResult);
    } catch (err) {
      console.error("Error evaluating work against video:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarkAsMastered = async () => {
    if (!result) return;
    await markCompleted(result.videoId);
    setVerifiedSuccess(true);
    if (onVerifiedCompleted) {
      onVerifiedCompleted(result.videoId);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFileName("");
    setResult(null);
    setVerifiedSuccess(false);
    setUserNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Target Video Selector & Guidance Banner */}
      <div className="rounded-card border border-workshop-200 bg-gradient-to-r from-workshop-50/80 via-white to-workshop-50/50 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-workshop-600 text-white text-xs font-bold shadow-2xs">
                📸
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-ink">
                Compare Your Work Against Video Lessons
              </h3>
            </div>
            <p className="text-sm text-ink/70 max-w-2xl">
              Upload a clear photo of your practice work. Our AI analyzes your loop tension, needle hold, and yarn choice compared directly with the curriculum benchmarks taught in each video.
            </p>
          </div>

          {/* Video Selector */}
          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <label htmlFor="target-video-select" className="text-xs font-bold text-ink/60 uppercase tracking-wider">
              Comparing Against Video:
            </label>
            <select
              id="target-video-select"
              value={selectedVideoId}
              onChange={(e) => {
                setSelectedVideoId(e.target.value);
                setResult(null);
                setVerifiedSuccess(false);
              }}
              className="rounded-lg border border-workshop-300 bg-white px-3 py-2 text-sm font-semibold text-workshop-900 shadow-2xs focus:border-workshop-600 focus:outline-none"
            >
              {MOCK_COURSE.videos.map((v) => (
                <option key={v.id} value={v.id}>
                  Lesson {v.order}: {v.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Video Lesson Key Objective Highlight */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-workshop-200/80 pt-3 text-xs text-workshop-800">
          <span className="font-bold">🎯 Video {selectedVideo.order} Benchmark Focus:</span>
          {selectedVideo.order === 3 && (
            <span className="bg-white px-2.5 py-1 rounded-md border border-workshop-200 font-medium">
              Slip knot tension (even, movable, avoid pulling too tight) & needle 2 insertion
            </span>
          )}
          {selectedVideo.order === 2 && (
            <span className="bg-white px-2.5 py-1 rounded-md border border-workshop-200 font-medium">
              Wool vs Cotton yarn fibers & Metal vs Wooden needle selection
            </span>
          )}
          {selectedVideo.order === 1 && (
            <span className="bg-white px-2.5 py-1 rounded-md border border-workshop-200 font-medium">
              Neat edge presentation & attractive showcase of finished pieces
            </span>
          )}
          {selectedVideo.order > 3 && (
            <span className="bg-white px-2.5 py-1 rounded-md border border-workshop-200 font-medium">
              Even stitch cycles, consistent row height & neat fabric formation
            </span>
          )}
        </div>
      </div>

      {/* Main Upload & Inspection Area */}
      {!result ? (
        <div className="space-y-4">
          {/* Drag & Drop Upload Container */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center transition-all ${
              isDragOver
                ? "border-workshop-600 bg-workshop-50 scale-[1.01]"
                : selectedImage
                ? "border-workshop-400 bg-white shadow-2xs"
                : "border-line bg-paper/60 hover:border-workshop-400 hover:bg-white"
            }`}
          >
            {selectedImage ? (
              <div className="space-y-4 w-full max-w-md">
                <div className="relative mx-auto max-h-72 w-full overflow-hidden rounded-xl border border-workshop-200 bg-black/5 shadow-inner">
                  <img
                    src={selectedImage}
                    alt={selectedFileName || "Selected practice work"}
                    className="h-full w-full object-contain max-h-72"
                  />
                  <div className="absolute bottom-2 left-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-xs flex items-center justify-between">
                    <span className="truncate">📷 {selectedFileName || "Practice Photo"}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="text-white/80 hover:text-white hover:underline text-[11px]"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Optional Learner Notes */}
                <div className="text-left space-y-1">
                  <label htmlFor="user-notes-input" className="text-xs font-semibold text-ink/70">
                    Add context or question (optional):
                  </label>
                  <input
                    id="user-notes-input"
                    type="text"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="e.g. Trying slip knot with wool yarn on bamboo needles..."
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-workshop-600 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={handleRunCheck}
                    disabled={isAnalyzing}
                    className="px-6 py-2.5 text-base font-bold shadow-md"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Checking against Video {selectedVideo.order}…</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>🔍 Compare & Verify Against Video</span>
                      </span>
                    )}
                  </Button>
                  <Button variant="ghost" onClick={handleReset} disabled={isAnalyzing}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-workshop-100 text-workshop-700 shadow-2xs">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.75"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-bold text-ink">
                    Upload a photo of your practice work
                  </p>
                  <p className="text-xs sm:text-sm text-ink/60">
                    Drag and drop your image here, or browse from your device
                  </p>
                </div>

                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-workshop-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-workshop-700 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Test Sample Photos Bar */}
          <div className="rounded-xl border border-line bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-workshop-700 flex items-center gap-1.5">
                <span>⚡</span> Or test instantly with curriculum sample photos:
              </span>
              <span className="text-[11px] text-ink/50">Click any photo below to test</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {SAMPLE_WORK_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`group relative flex flex-col items-center rounded-lg border p-2 text-center transition-all ${
                    selectedFileName === sample.fileName
                      ? "border-workshop-600 bg-workshop-50 ring-2 ring-workshop-500 shadow-2xs"
                      : "border-line/70 bg-paper/40 hover:border-workshop-400 hover:bg-white"
                  }`}
                >
                  <div className="h-16 w-full overflow-hidden rounded-md bg-black/5 mb-1.5">
                    <img
                      src={sample.imageUrl}
                      alt={sample.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <span className="text-xs font-bold text-ink truncate w-full group-hover:text-workshop-700">
                    {sample.title}
                  </span>
                  <span
                    className={`text-[10px] font-semibold mt-0.5 px-1.5 py-0.2 rounded-full ${
                      sample.expectedStatus === "correct"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    V{sample.targetVideoOrder} {sample.expectedStatus === "correct" ? "✓ Valid" : "⚠ Error"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Video Comparison Results Studio */
        <div className="space-y-6 animate-fadeIn">
          {/* Status Header Banner */}
          <div
            className={`rounded-2xl border p-5 shadow-sm transition-all ${
              result.overallStatus === "correct"
                ? "border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 text-emerald-950"
                : "border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 text-amber-950"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                      result.overallStatus === "correct"
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 text-white"
                    }`}
                  >
                    {result.overallStatus === "correct"
                      ? "✓ Video Benchmark Passed"
                      : "⚠ Technique Correction Needed"}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-current">
                    Score: {result.score} / 10
                  </span>
                  <span className="text-xs text-ink/60">
                    ({Math.round(result.confidence * 100)}% match confidence)
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-ink pt-1">
                  {result.title}
                </h3>
                <p className="text-sm text-ink/70">
                  Compared against <strong>Lesson {result.videoOrder}: {result.videoTitle}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {result.overallStatus === "correct" && !verifiedSuccess && !isCompletedInContext && (
                  <Button
                    onClick={handleMarkAsMastered}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md"
                  >
                    <span>✓ Mark Lesson as Mastered</span>
                  </Button>
                )}
                {verifiedSuccess && (
                  <span className="rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
                    <span>🎉</span> Lesson Progress Saved!
                  </span>
                )}
                <Button variant="secondary" onClick={handleReset} className="text-sm">
                  Check Another Photo
                </Button>
              </div>
            </div>
          </div>

          {/* Side-by-Side Visual Comparison: User Work vs Video Benchmark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Card: Learner's Uploaded Work */}
            <div className="rounded-2xl border border-workshop-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-workshop-600" />
                  <h4 className="font-extrabold text-base text-ink">
                    1. Your Practice Work Photo
                  </h4>
                </div>
                <span className="text-xs font-medium text-ink/60">
                  {result.imageFileName}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-line bg-black/5 aspect-4/3 flex items-center justify-center">
                <img
                  src={result.userImageUrl}
                  alt={result.imageFileName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Detected Items Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-ink/60 uppercase tracking-wider">
                  Visual Features Identified:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.detectedElements.map((elem, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-workshop-50 border border-workshop-200 px-2.5 py-1 text-xs font-semibold text-workshop-900"
                    >
                      • {elem}
                    </span>
                  ))}
                </div>
              </div>

              {/* Observed Findings */}
              <div className="rounded-lg bg-paper/60 p-3 text-xs sm:text-sm text-ink/80 border border-line/70">
                <p className="font-bold text-ink mb-1">Observation in Your Work:</p>
                <p>{result.benchmarkComparison.whatWasObserved}</p>
              </div>
            </div>

            {/* Right Card: Video Lesson Benchmark & Rules */}
            <div className="rounded-2xl border border-workshop-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <h4 className="font-extrabold text-base text-ink">
                    2. Video Lesson Benchmark & Standard
                  </h4>
                </div>
                <span className="text-xs font-bold text-workshop-700 bg-workshop-100 px-2 py-0.5 rounded-full">
                  Video {result.videoOrder} Standard
                </span>
              </div>

              {/* Video Reference Banner */}
              <div className="rounded-xl border border-workshop-200 bg-gradient-to-br from-workshop-50 to-white p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-workshop-700 uppercase tracking-wide">
                    {result.benchmarkComparison.keyframeTitle}
                  </span>
                  {result.benchmarkComparison.videoTimestamp && (
                    <span className="text-xs font-bold text-workshop-600 bg-white border border-workshop-300 px-2 py-0.5 rounded-full">
                      Timestamp: {result.benchmarkComparison.videoTimestamp}
                    </span>
                  )}
                </div>

                <blockquote className="border-l-4 border-workshop-600 pl-3 italic text-xs sm:text-sm text-workshop-900 font-medium">
                  {result.benchmarkComparison.videoRuleQuote}
                </blockquote>

                <p className="text-xs text-ink/70">
                  {result.benchmarkComparison.whatVideoTeaches}
                </p>
              </div>

              {/* Evaluated Criteria Table */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-ink/60 uppercase tracking-wider">
                  Checklist Compared to Video Rules:
                </span>
                <div className="space-y-2">
                  {result.criteria.map((crit) => (
                    <div
                      key={crit.id}
                      className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                        crit.status === "pass"
                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                          : crit.status === "fail"
                          ? "border-amber-200 bg-amber-50/60 text-amber-950"
                          : "border-workshop-200 bg-workshop-50/50 text-workshop-950"
                      }`}
                    >
                      <span className="text-sm mt-0.5">
                        {crit.status === "pass" ? "✅" : crit.status === "fail" ? "❌" : "⚠️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-xs">{crit.name}</p>
                          <span className="font-semibold text-[10px] uppercase">
                            {crit.status === "pass"
                              ? "Pass"
                              : crit.status === "fail"
                              ? "Action Needed"
                              : "Review"}
                          </span>
                        </div>
                        <p className="text-ink/70 mt-0.5">{crit.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Feedback & Next Steps Card */}
          <div className="rounded-2xl border border-workshop-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-workshop-600 text-white text-xs font-bold">
                💡
              </span>
              <h4 className="text-lg font-bold text-ink">
                AI Coach Guidance & Next Practice Steps
              </h4>
            </div>

            <p className="text-sm sm:text-base text-ink/80 leading-relaxed">
              {result.feedback}
            </p>

            {/* Step-by-Step Correction Instructions */}
            <div className="rounded-xl border border-line bg-paper/50 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-workshop-700">
                Action Steps Recommended by the Instructor:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-ink/90">
                {result.correctionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-workshop-600 text-white text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line">
              <div className="flex items-center gap-2 text-xs text-ink/60">
                <span>📖 Citation:</span>
                <span className="font-semibold text-workshop-700">{result.videoTitle}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  to={`/course/video/${result.videoId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-workshop-300 bg-white px-3 py-1.5 text-xs font-bold text-workshop-700 hover:bg-workshop-50"
                >
                  <span>📺 Rewatch Video {result.videoOrder}</span>
                </Link>

                <Link
                  to="/ai-assistant"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-workshop-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-workshop-700"
                >
                  <span>💬 Ask AI Tutor Further</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
