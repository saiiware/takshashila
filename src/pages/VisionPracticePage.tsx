import React, { useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/common/Card";
import { KnittingVisionGuide } from "@/components/vision/knittingvisionGuide";
import { classifyKnittingImage } from "@/services/visionAnalysis";
import type { VisionAssessment } from "@/types";

interface SamplePreset {
  id: string;
  label: string;
  category: "slip_knot" | "yarn" | "needle" | "invalid_image";
  imagePath: string;
  fileName: string;
  description: string;
  expectedStatus: "correct" | "needs_improvement" | "invalid";
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "correct-knot",
    label: "Slip Knot (Balanced)",
    category: "slip_knot",
    imagePath: "/sample_images/correct slipknot.png",
    fileName: "correct slipknot.png",
    description: "Even loop tension, smooth needle clearance (Lesson 3 benchmark)",
    expectedStatus: "correct",
  },
  {
    id: "tight-knot",
    label: "Slip Knot (Tight Tension)",
    category: "slip_knot",
    imagePath: "/sample_images/tight slipknot.png",
    fileName: "tight slipknot.png",
    description: "Over-tightened loop choking needle shaft (Lesson 3 warning)",
    expectedStatus: "needs_improvement",
  },
  {
    id: "loose-knot",
    label: "Slip Knot (Loose Loop)",
    category: "slip_knot",
    imagePath: "/sample_images/loose slipknot.png",
    fileName: "loose slipknot.png",
    description: "Slack loop prone to slipping off needle (Lesson 3 correction)",
    expectedStatus: "needs_improvement",
  },
  {
    id: "wool-yarn",
    label: "Wool Yarn (Winter/Sweaters)",
    category: "yarn",
    imagePath: "/sample_images/woollen yarn.png",
    fileName: "woollen yarn.png",
    description: "Crimped, warm elastic fiber for winter garments (Lesson 2)",
    expectedStatus: "correct",
  },
  {
    id: "cotton-yarn",
    label: "Cotton Yarn (Light/Breathable)",
    category: "yarn",
    imagePath: "/sample_images/cotton yarn.png",
    fileName: "cotton yarn.png",
    description: "Smooth, compact plant fiber for warm weather items (Lesson 2)",
    expectedStatus: "correct",
  },
  {
    id: "metal-needle",
    label: "Metal Needles (Sleek/Fast)",
    category: "needle",
    imagePath: "/sample_images/metal needle.png",
    fileName: "metal needle.png",
    description: "Smooth metallic finish with tapered glide tips (Lesson 2)",
    expectedStatus: "correct",
  },
  {
    id: "wooden-needle",
    label: "Wooden / Bamboo Needles",
    category: "needle",
    imagePath: "/sample_images/wooden needle.png",
    fileName: "wooden needle.png",
    description: "Tactile grip surface preventing slipped stitches (Lesson 2)",
    expectedStatus: "correct",
  },
  {
    id: "wrong-image-test",
    label: "Wrong Image (Unrelated Car)",
    category: "invalid_image",
    imagePath: "/sample_images/unrelated_car.svg",
    fileName: "car_photo.jpg",
    description: "Non-knitting image to verify Computer Vision rejection & feedback",
    expectedStatus: "invalid",
  },
];

export default function VisionPracticePage() {
  const [activeTab, setActiveTab] = useState<"webcam" | "photo_lab">("webcam");

  // Photo Lab State
  const [selectedPreset, setSelectedPreset] = useState<SamplePreset | null>(SAMPLE_PRESETS[0]);
  const [customImage, setCustomImage] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<VisionAssessment | null>(null);

  // Run assessment on preset or custom image
  const handleInspect = async (imageSrc: string, fileName: string) => {
    setIsInspecting(true);
    try {
      const result = await classifyKnittingImage(imageSrc, fileName, `Inspect ${fileName}`);
      setAssessment(result);
    } catch (e) {
      console.error("Inspection failed:", e);
    } finally {
      setIsInspecting(false);
    }
  };

  // Inspect default preset on first select
  const selectPreset = (preset: SamplePreset) => {
    setSelectedPreset(preset);
    setCustomImage(null);
    handleInspect(preset.imagePath, preset.fileName);
  };

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const item = { dataUrl: reader.result, fileName: file.name };
        setCustomImage(item);
        setSelectedPreset(null);
        handleInspect(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-ink">Computer Vision Practice Hub</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
              CV Engine 2.0
            </span>
          </div>
          <p className="mt-1 text-base text-ink/70">
            Real-time hand tracking, stitch loop counting, tension coaching & multimodal knitting inspection.
          </p>
        </div>
        <Link
          to="/course"
          className="inline-flex items-center text-sm font-semibold text-workshop-600 hover:underline"
        >
          ← Back to Course
        </Link>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("webcam")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "webcam"
              ? "border-workshop-600 text-workshop-700"
              : "border-transparent text-ink/60 hover:text-ink"
          }`}
        >
          <span>📹</span>
          <span>Live Webcam Knitting Coach</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("photo_lab");
            if (!assessment && selectedPreset) {
              handleInspect(selectedPreset.imagePath, selectedPreset.fileName);
            }
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "photo_lab"
              ? "border-workshop-600 text-workshop-700"
              : "border-transparent text-ink/60 hover:text-ink"
          }`}
        >
          <span>🔬</span>
          <span>Computer Vision Photo Inspection Lab</span>
        </button>
      </div>

      {/* TAB 1: Live Webcam Coach */}
      {activeTab === "webcam" && (
        <div className="space-y-6">
          {/* Quick How-It-Works Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-line rounded-card p-3 shadow-2xs">
              <p className="text-xs font-bold text-workshop-600 uppercase tracking-wider mb-1">
                Step 1 • Skeleton Hand Tracking
              </p>
              <p className="text-sm text-ink/80">
                21 landmark joint detection with neon hand skeletons and virtual needle projections.
              </p>
            </div>
            <div className="bg-white border border-line rounded-card p-3 shadow-2xs">
              <p className="text-xs font-bold text-workshop-600 uppercase tracking-wider mb-1">
                Step 2 • Loop Cycles & Stitches
              </p>
              <p className="text-sm text-ink/80">
                Bring needles together (&lt;65px) to insert, wrap yarn, and pull apart (&gt;150px) to form a stitch.
              </p>
            </div>
            <div className="bg-white border border-line rounded-card p-3 shadow-2xs">
              <p className="text-xs font-bold text-workshop-600 uppercase tracking-wider mb-1">
                Step 3 • Real-Time Tension Alert
              </p>
              <p className="text-sm text-ink/80">
                Live tension gauge triggers visual alerts if stitches are held too tightly (Lesson 3).
              </p>
            </div>
          </div>

          <Card className="p-2 sm:p-4 overflow-hidden">
            <KnittingVisionGuide />
          </Card>
        </div>
      )}

      {/* TAB 2: Computer Vision Photo Inspection Lab */}
      {activeTab === "photo_lab" && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-ink">
                Multimodal Photo Inspection & Curriculum Evaluation
              </h2>
              <p className="text-sm text-ink/70 mt-1">
                Test the computer vision classifier on curated curriculum samples or upload your own work to evaluate slip knot tension (Lesson 3), yarn fibers (wool vs cotton), or needle materials (metal vs wood).
              </p>
            </div>

            {/* Preset Selector Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-workshop-700">
                  Select a Curated Curriculum Test Sample:
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-workshop-50 border border-workshop-300 text-workshop-800 hover:bg-workshop-100 transition-colors cursor-pointer">
                  <span>📁 Upload Custom Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {SAMPLE_PRESETS.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id && !customImage;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-workshop-600 bg-workshop-50/80 shadow-xs ring-2 ring-workshop-500/20"
                          : "border-line bg-white hover:border-workshop-300 hover:bg-paper"
                      }`}
                    >
                      <img
                        src={preset.imagePath}
                        alt={preset.label}
                        className="h-16 w-16 object-contain rounded-lg bg-slate-50 border border-slate-100 mb-1.5"
                      />
                      <span className="text-xs font-bold text-ink leading-tight">
                        {preset.label}
                      </span>
                      <span
                        className={`text-[10px] mt-1 font-semibold px-1.5 py-0.2 rounded-full ${
                          preset.expectedStatus === "correct"
                            ? "bg-emerald-100 text-emerald-800"
                            : preset.expectedStatus === "invalid"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {preset.expectedStatus === "correct"
                          ? "Pass"
                          : preset.expectedStatus === "invalid"
                          ? "Wrong"
                          : "Correction"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inspection Results Section: Side-by-Side Image + Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-line">
              {/* Left Column: Image Viewer */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">
                    {customImage
                      ? `Custom Upload: ${customImage.fileName}`
                      : selectedPreset?.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const src = customImage ? customImage.dataUrl : selectedPreset?.imagePath || "";
                      const name = customImage ? customImage.fileName : selectedPreset?.fileName || "";
                      if (src) handleInspect(src, name);
                    }}
                    disabled={isInspecting}
                    className="text-xs font-bold text-workshop-600 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {isInspecting ? "Inspecting…" : "Re-Analyze"}
                  </button>
                </div>

                <div className="relative aspect-square sm:aspect-4/3 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-line">
                  <img
                    src={customImage ? customImage.dataUrl : selectedPreset?.imagePath}
                    alt="Knitting subject"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                  {isInspecting && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-workshop-400 border-t-transparent mb-2" />
                      <p className="text-xs font-bold">Computing Pixel Gradients & Metrics…</p>
                    </div>
                  )}
                </div>

                {selectedPreset && !customImage && (
                  <p className="text-xs text-ink/70 bg-paper p-2.5 rounded-lg border border-line">
                    <strong>Target Curriculum Note:</strong> {selectedPreset.description}
                  </p>
                )}
              </div>

              {/* Right Column: Detailed Diagnostic Card */}
              <div className="lg:col-span-7 space-y-4">
                {assessment ? (
                  <div className="space-y-4">
                    {/* Header: Title + Status + Score */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            assessment.status === "correct"
                              ? "bg-emerald-100 text-emerald-800"
                              : assessment.status === "invalid" || assessment.category === "invalid_image"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {assessment.status === "correct"
                            ? "Technique Verified ✅"
                            : assessment.status === "invalid" || assessment.category === "invalid_image"
                            ? "Wrong Image ❌"
                            : "Adjustment Needed ⚠️"}
                        </span>
                        <h3 className="text-lg font-bold text-ink mt-1.5">{assessment.title}</h3>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-workshop-700">
                          {assessment.score} <span className="text-xs text-ink/50 font-normal">/ 10</span>
                        </div>
                        <p className="text-[11px] text-ink/60 font-medium">
                          Confidence: {Math.round(assessment.confidence * 100)}%
                        </p>
                      </div>
                    </div>

                    {/* Detected Items Tag Pills */}
                    {assessment.detected_items && assessment.detected_items.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-ink/60 block mb-1.5">
                          Detected Computer Vision Features:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {assessment.detected_items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-workshop-50 border border-workshop-200 text-workshop-900"
                            >
                              ✓ {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed AI Feedback */}
                    <div className="bg-paper p-3.5 rounded-xl border border-line space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/60">
                        Detailed Vision Analysis:
                      </p>
                      <p className="text-sm text-ink/90 leading-relaxed">{assessment.feedback}</p>
                    </div>

                    {/* Actionable Solution Grounded in Course */}
                    <div
                      className={`p-3.5 rounded-xl border space-y-1 ${
                        assessment.status === "correct"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                          : assessment.status === "invalid" || assessment.category === "invalid_image"
                          ? "bg-rose-50 border-rose-300 text-rose-950"
                          : "bg-amber-50 border-amber-300 text-amber-950"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {assessment.status === "invalid" || assessment.category === "invalid_image"
                          ? "What to Photograph & Upload Instead:"
                          : "Actionable Solution & Lesson Guidance:"}
                      </p>
                      <p className="text-sm leading-relaxed">{assessment.solution}</p>
                    </div>

                    {/* Extracted Computer Vision Metrics Grid */}
                    {assessment.metrics && (
                      <div className="bg-white p-3 rounded-xl border border-line space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/60 block">
                          Computer Vision Feature Measurements:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-ink/60 block">Surface Roughness</span>
                            <span className="font-bold text-ink">
                              {assessment.metrics.edgeDensity ?? "N/A"}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-ink/60 block">Color Warmth</span>
                            <span className="font-bold text-ink">
                              {assessment.metrics.warmthScore ?? "N/A"}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-ink/60 block">Specular Sheen</span>
                            <span className="font-bold text-ink">
                              {assessment.metrics.specularRatio ?? "N/A"}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-ink/60 block">Tension Est.</span>
                            <span className="font-bold text-ink capitalize">
                              {assessment.metrics.tensionEstimate ?? "Optimal"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grounding Reference */}
                    <div className="flex items-center justify-between text-xs text-workshop-700 pt-1">
                      <span className="font-bold">
                        Grounded Curriculum: {assessment.lesson_reference}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-paper rounded-xl border border-line text-ink/60">
                    <span className="text-3xl mb-2">🔍</span>
                    <p className="text-sm font-semibold">Select a sample or upload a photo</p>
                    <p className="text-xs mt-1">
                      The Computer Vision engine will analyze texture, loop tension, and needle geometry.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
