import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { classifyKnittingImage } from "@/services/visionAnalysis";
import type { VisionAssessment } from "@/types";

interface Props {
  videoUrl?: string;
  onSnapshotAssessment?: (assessment: VisionAssessment, imageUrl: string) => void;
}

// 21 standard MediaPipe Hand landmark connections
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
];

type TrackingState =
  | "INITIALIZING"
  | "SEARCHING"
  | "ONE_HAND"
  | "READY"
  | "INSERTING"
  | "TENSION_ALERT"
  | "STITCH_COMPLETED";

export const KnittingVisionGuide: React.FC<Props> = ({ videoUrl, onSnapshotAssessment }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [mirrorView, setMirrorView] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const [stitchCount, setStitchCount] = useState<number>(0);
  const [trackingState, setTrackingState] = useState<TrackingState>("SEARCHING");
  const [feedback, setFeedback] = useState<string>(
    "Allow webcam access or try Interactive Demo Mode to start Computer Vision coaching."
  );
  const [tipDistance, setTipDistance] = useState<number>(0);
  const [needleAngle, setNeedleAngle] = useState<number>(0);
  const [tensionLevel, setTensionLevel] = useState<"loose" | "optimal" | "tight">("loose");
  const [recentSnapshotAssessment, setRecentSnapshotAssessment] = useState<VisionAssessment | null>(null);
  const [isAnalyzingSnapshot, setIsAnalyzingSnapshot] = useState<boolean>(false);

  const cyclePhase = useRef<"apart" | "together">("apart");
  const tightTensionFrameCounter = useRef<number>(0);
  const demoCycleStep = useRef<number>(0);

  // Play audio tones using native Web Audio API
  const playTone = (freq: number, type: OscillatorType = "sine", durationMs = 120) => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio autoplay may be prevented until user interaction
    }
  };

  // 1. Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isCancelled = false;
    async function initMediaPipe() {
      setModelLoading(true);
      setModelError(null);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        if (isCancelled) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });

        if (isCancelled) return;
        setLandmarker(handLandmarker);
        setModelLoading(false);
      } catch (err: any) {
        console.warn("MediaPipe model load error, enabling simulated demo tracking:", err);
        if (!isCancelled) {
          setModelError("Computer Vision model running in lightweight mode.");
          setModelLoading(false);
        }
      }
    }
    initMediaPipe();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Start Camera
  useEffect(() => {
    if (isDemoMode) return;
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API not available in this browser. You can use Interactive Demo Mode.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          setFeedback("Camera active. Position both hands so your knitting needles are visible.");
        }
      } catch (err: any) {
        setCameraActive(false);
        setCameraError("Camera permission blocked or unavailable. Switch to Interactive Demo Mode anytime!");
        setFeedback("Camera access blocked. Click 'Interactive Demo Mode' to practice without a camera.");
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    };
  }, [isDemoMode]);

  // 3. Main Computer Vision Loop: Process Frames & Skeletons
  useEffect(() => {
    let animationFrameId: number;

    const renderFrame = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle Interactive Demo Simulation Mode
      if (isDemoMode) {
        canvas.width = 640;
        canvas.height = 480;
        demoCycleStep.current += 0.04;
        const t = demoCycleStep.current;

        // Simulated hand fingertip cycle (distance expands and contracts smoothly)
        const centerDistance = 110 + Math.sin(t) * 75; // ranges from 35px to 185px
        const leftX = 320 - centerDistance / 2;
        const rightX = 320 + centerDistance / 2;
        const yPos = 240 + Math.cos(t * 0.5) * 15;

        // Draw animated simulated knitting scene
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        // Draw simulated needle shafts
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(leftX - 90, yPos + 60);
        ctx.lineTo(leftX + 20, yPos - 15);
        ctx.stroke();

        ctx.strokeStyle = "#a855f7";
        ctx.beginPath();
        ctx.moveTo(rightX + 90, yPos + 60);
        ctx.lineTo(rightX - 20, yPos - 15);
        ctx.stroke();

        // Fingertip keypoints
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(leftX, yPos, 8, 0, 2 * Math.PI);
        ctx.arc(rightX, yPos, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Tension distance line
        ctx.strokeStyle =
          centerDistance < 50
            ? "rgba(239, 68, 68, 0.9)"
            : centerDistance < 80
            ? "rgba(245, 158, 11, 0.9)"
            : "rgba(16, 185, 129, 0.8)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftX, yPos);
        ctx.lineTo(rightX, yPos);
        ctx.stroke();
        ctx.setLineDash([]);

        setTipDistance(Math.round(centerDistance));
        setNeedleAngle(36);

        // Simulation State Machine
        if (centerDistance < 50) {
          setTensionLevel("tight");
          setTrackingState("TENSION_ALERT");
          setFeedback("[Tension Warning] Stitches held too tightly! Avoid pulling yarn too tightly (Lesson 3).");
        } else if (centerDistance < 80) {
          setTensionLevel("optimal");
          setTrackingState("INSERTING");
          setFeedback("Needles inserted! Wrap yarn around the second needle to form a new loop.");
          cyclePhase.current = "together";
        } else if (centerDistance > 150 && cyclePhase.current === "together") {
          cyclePhase.current = "apart";
          setStitchCount((c) => c + 1);
          setTrackingState("STITCH_COMPLETED");
          setFeedback("Stitch completed! Keep loops even for a neat and strong fabric.");
          playTone(660, "sine", 140);
        } else {
          setTensionLevel("loose");
          setTrackingState("READY");
        }

        animationFrameId = requestAnimationFrame(renderFrame);
        return;
      }

      // Live Webcam Tracking with MediaPipe HandLandmarker
      if (video && video.readyState >= 2 && landmarker) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const w = canvas.width;
        const h = canvas.height;

        const results = landmarker.detectForVideo(video, performance.now());
        ctx.clearRect(0, 0, w, h);

        if (!results.landmarks || results.landmarks.length === 0) {
          setTrackingState("SEARCHING");
          setFeedback("Show both hands and knitting needles to the camera to begin.");
          setTipDistance(0);
          setTensionLevel("loose");
        } else if (results.landmarks.length === 1) {
          setTrackingState("ONE_HAND");
          setFeedback("Both hands needed: hold one needle in each hand (Lesson 3).");
          setTipDistance(0);

          // Draw single hand skeleton
          drawHandSkeleton(ctx, results.landmarks[0], w, h, "#38bdf8");
        } else {
          // Two hands detected!
          const hand1 = results.landmarks[0];
          const hand2 = results.landmarks[1];

          // Draw skeletons for both hands
          drawHandSkeleton(ctx, hand1, w, h, "#38bdf8");
          drawHandSkeleton(ctx, hand2, w, h, "#a855f7");

          // Index fingertips (Landmark 8)
          const p1 = { x: hand1[8].x * w, y: hand1[8].y * h };
          const p2 = { x: hand2[8].x * w, y: hand2[8].y * h };

          // Thumb tips (Landmark 4) for needle orientation vector
          const t1 = { x: hand1[4].x * w, y: hand1[4].y * h };
          const t2 = { x: hand2[4].x * w, y: hand2[4].y * h };

          // Projected virtual needle shafts
          drawVirtualNeedle(ctx, t1, p1, "#06b6d4");
          drawVirtualNeedle(ctx, t2, p2, "#c084fc");

          // Calculate distance between index fingertips
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          setTipDistance(Math.round(dist));

          // Estimate needle angle
          const angleDeg = Math.round(Math.abs(Math.atan2(dy, dx) * (180 / Math.PI)));
          setNeedleAngle(angleDeg);

          // Draw dynamic connection line
          const isTight = dist < 45;
          const isEngaged = dist < 70;
          ctx.strokeStyle = isTight
            ? "#ef4444"
            : isEngaged
            ? "#f59e0b"
            : "#10b981";
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // State Machine & Tension Monitor
          if (dist < 45) {
            tightTensionFrameCounter.current += 1;
            setTensionLevel("tight");
            if (tightTensionFrameCounter.current > 25) {
              setTrackingState("TENSION_ALERT");
              setFeedback(
                "[Tension Alert] Needles clenched too tightly! Avoid pulling yarn too tightly (Lesson 3) so stitches remain movable."
              );
              playTone(280, "sawtooth", 80);
            }
          } else {
            tightTensionFrameCounter.current = Math.max(0, tightTensionFrameCounter.current - 1);
            if (dist < 75) {
              setTensionLevel("optimal");
              if (cyclePhase.current === "apart") {
                cyclePhase.current = "together";
                setTrackingState("INSERTING");
                setFeedback("Needles inserted! Wrap yarn around the second needle to form a new loop.");
              }
            } else if (dist > 155) {
              setTensionLevel("loose");
              if (cyclePhase.current === "together") {
                cyclePhase.current = "apart";
                setStitchCount((prev) => prev + 1);
                setTrackingState("STITCH_COMPLETED");
                setFeedback(
                  "Stitch loop completed! Keep stitches even and row-by-row for a neat fabric."
                );
                playTone(587, "sine", 130);
              } else {
                setTrackingState("READY");
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarker, isDemoMode, audioEnabled]);

  // Helper to draw neon hand skeleton
  const drawHandSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number }>,
    w: number,
    h: number,
    boneColor: string
  ) => {
    // Draw bones
    ctx.strokeStyle = boneColor;
    ctx.lineWidth = 2.5;
    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    });

    // Draw joint nodes
    landmarks.forEach((pt, idx) => {
      const px = pt.x * w;
      const py = pt.y * h;
      ctx.beginPath();
      ctx.arc(px, py, idx === 8 ? 6 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 8 ? "#22c55e" : "#ffffff";
      ctx.fill();
      ctx.strokeStyle = boneColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  };

  // Helper to project a virtual knitting needle extending through the grip
  const drawVirtualNeedle = (
    ctx: CanvasRenderingContext2D,
    thumb: { x: number; y: number },
    index: { x: number; y: number },
    color: string
  ) => {
    const vx = index.x - thumb.x;
    const vy = index.y - thumb.y;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    const nx = vx / len;
    const ny = vy / len;

    // Extend needle 65px forward and 40px back
    const tipX = index.x + nx * 65;
    const tipY = index.y + ny * 65;
    const backX = thumb.x - nx * 40;
    const backY = thumb.y - ny * 40;

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(backX, backY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Sharp metallic needle tip
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, 2 * Math.PI);
    ctx.fill();
  };

  // Frame Snapshot Inspection
  const handleCaptureSnapshot = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsAnalyzingSnapshot(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const assessment = await classifyKnittingImage(
        dataUrl,
        "webcam_snapshot.png",
        "Inspecting live camera posture and knitting stitch loop"
      );
      setRecentSnapshotAssessment(assessment);
      onSnapshotAssessment?.(assessment, dataUrl);
    } catch (e) {
      console.error("Snapshot analysis error:", e);
    } finally {
      setIsAnalyzingSnapshot(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-line shadow-2xs">
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              cameraActive || isDemoMode ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className="text-sm font-bold text-ink">
            {isDemoMode
              ? "Interactive Demo Mode Active"
              : cameraActive
              ? "Live Webcam Vision Active"
              : "Camera Idle"}
          </span>
          {modelLoading && (
            <span className="text-xs text-ink/60 italic">(Loading MediaPipe vision…)</span>
          )}
          {modelError && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {modelError}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              audioEnabled
                ? "bg-workshop-100 border-workshop-300 text-workshop-800"
                : "bg-paper border-line text-ink/60 hover:text-ink"
            }`}
            title="Play sound on stitch completion or tension alert"
          >
            {audioEnabled ? "🔔 Audio Cues: ON" : "🔕 Audio: Muted"}
          </button>

          {/* Mirror Flip Toggle */}
          {!isDemoMode && (
            <button
              type="button"
              onClick={() => setMirrorView(!mirrorView)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-paper border border-line text-ink/70 hover:text-ink hover:bg-workshop-50 transition-all cursor-pointer"
            >
              {mirrorView ? "🪞 Mirror: ON" : "Standard View"}
            </button>
          )}

          {/* Interactive Demo Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border shadow-2xs transition-all cursor-pointer ${
              isDemoMode
                ? "bg-workshop-600 text-white border-workshop-700"
                : "bg-white border-workshop-300 text-workshop-700 hover:bg-workshop-50"
            }`}
          >
            {isDemoMode ? "← Switch to Webcam" : "Try Interactive Demo Mode"}
          </button>

          {/* Reset Stitches */}
          <button
            type="button"
            onClick={() => setStitchCount(0)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-ink/60 hover:text-clay-600 hover:bg-clay-50 transition-all cursor-pointer"
          >
            Reset Count
          </button>
        </div>
      </div>

      {/* Main Vision Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lesson Reference Video & Curriculum Step */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">
                Curriculum Benchmark (Lesson 3)
              </h3>
              <span className="text-xs font-semibold bg-workshop-100 text-workshop-800 px-2 py-0.5 rounded-full">
                Video 3
              </span>
            </div>

            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full rounded-xl aspect-video bg-black object-contain"
              />
            ) : (
              <div className="w-full aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <span className="text-3xl mb-2">🥢</span>
                <p className="text-xs font-medium text-slate-300">
                  Lesson 3: Basic Process — Slip Knot to Fabric
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  "Wrap yarn around the needle and gently pull through to form connected loops row by row."
                </p>
              </div>
            )}

            {/* Curriculum Step Checklist */}
            <div className="space-y-2 pt-1 text-xs text-ink/80">
              <div className="flex items-start gap-2 bg-workshop-50/70 p-2.5 rounded-lg border border-workshop-200">
                <span className="font-bold text-workshop-700 shrink-0">Step 1:</span>
                <span>Make a neat slip knot and place it onto needle 1.</span>
              </div>
              <div className="flex items-start gap-2 bg-workshop-50/70 p-2.5 rounded-lg border border-workshop-200">
                <span className="font-bold text-workshop-700 shrink-0">Step 2:</span>
                <span>Insert needle 2 into loop at an angle (~30°-45°).</span>
              </div>
              <div className="flex items-start gap-2 bg-workshop-50/70 p-2.5 rounded-lg border border-workshop-200">
                <span className="font-bold text-workshop-700 shrink-0">Step 3:</span>
                <span>Wrap yarn and pull apart to complete the loop without overtightening.</span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Dashboard Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-line p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Real-Time Vision Telemetry
            </h4>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-paper p-2.5 rounded-xl border border-line">
                <p className="text-[11px] text-ink/60 font-medium">Stitches Completed</p>
                <p className="text-2xl font-black text-emerald-600">{stitchCount}</p>
              </div>
              <div className="bg-paper p-2.5 rounded-xl border border-line">
                <p className="text-[11px] text-ink/60 font-medium">Needle Distance</p>
                <p className="text-2xl font-black text-workshop-600">{tipDistance} px</p>
              </div>
            </div>

            {/* Tension Indicator Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-ink/70">Loop Tension:</span>
                <span
                  className={
                    tensionLevel === "tight"
                      ? "text-red-600 font-bold"
                      : tensionLevel === "optimal"
                      ? "text-emerald-700 font-bold"
                      : "text-amber-600 font-bold"
                  }
                >
                  {tensionLevel === "tight"
                    ? "Too Tight ⚠️"
                    : tensionLevel === "optimal"
                    ? "Optimal / Balanced ✅"
                    : "Apart / Relaxed"}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-line">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: "35%" }}
                  title="Relaxed"
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: "45%" }}
                  title="Optimal Working Zone"
                />
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: "20%" }}
                  title="Tension Warning"
                />
              </div>
              <div className="flex justify-between text-[10px] text-ink/50 pt-0.5">
                <span>Relaxed (&gt;150px)</span>
                <span>Working (65-140px)</span>
                <span>Choked (&lt;45px)</span>
              </div>
            </div>

            {needleAngle > 0 && (
              <div className="flex items-center justify-between text-xs text-ink/70 pt-1 border-t border-line">
                <span>Needle Engagement Angle:</span>
                <span className="font-bold text-workshop-700">{needleAngle}°</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Camera / HUD Canvas */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-line p-4 flex flex-col flex-1">
            {/* Viewport Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">
                  {isDemoMode ? "Computer Vision Demonstration" : "Live Camera HUD"}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    trackingState === "TENSION_ALERT"
                      ? "bg-red-100 text-red-800 animate-pulse"
                      : trackingState === "STITCH_COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : trackingState === "INSERTING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {trackingState.replace("_", " ")}
                </span>
              </div>

              {/* Action Button: Capture & Inspect Frame */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={isAnalyzingSnapshot || (!cameraActive && !isDemoMode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-workshop-600 hover:bg-workshop-700 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                {isAnalyzingSnapshot ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <span>📸</span>
                    <span>Analyze Current Frame</span>
                  </>
                )}
              </button>
            </div>

            {/* Video + Overlay Viewport */}
            <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden flex-1 shadow-inner">
              {/* Native Video Element */}
              {!isDemoMode && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${mirrorView ? "-scale-x-100" : ""}`}
                />
              )}

              {/* Overlay Canvas for Hand Landmarks, Skeletons & Needles */}
              <canvas
                ref={canvasRef}
                className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none ${
                  mirrorView && !isDemoMode ? "-scale-x-100" : ""
                }`}
              />

              {/* Fallback prompt when camera is not running and not in demo mode */}
              {!cameraActive && !isDemoMode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white">
                  <span className="text-4xl mb-3">📹</span>
                  <p className="text-sm font-semibold mb-1">
                    {cameraError || "Webcam access is required for real-time tracking."}
                  </p>
                  <p className="text-xs text-slate-300 max-w-sm mb-4">
                    Position your hands clearly in front of the lens. Or try our Interactive Demo Mode to see the CV pipeline in action!
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDemoMode(true)}
                    className="px-4 py-2 rounded-lg bg-workshop-600 hover:bg-workshop-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Launch Interactive Demo Mode
                  </button>
                </div>
              )}
            </div>

            {/* Real-Time Live Coaching Feedback Banner */}
            <div
              className={`mt-3 p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-start gap-2.5 ${
                trackingState === "TENSION_ALERT"
                  ? "bg-red-50 border-red-300 text-red-950"
                  : trackingState === "STITCH_COMPLETED"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : trackingState === "INSERTING"
                  ? "bg-amber-50 border-amber-300 text-amber-950"
                  : "bg-workshop-50 border-workshop-200 text-workshop-950"
              }`}
            >
              <span className="text-base leading-none shrink-0">
                {trackingState === "TENSION_ALERT"
                  ? "⚠️"
                  : trackingState === "STITCH_COMPLETED"
                  ? "🎉"
                  : trackingState === "INSERTING"
                  ? "🥢"
                  : "💡"}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold block text-xs uppercase tracking-wider mb-0.5">
                  AI Vision Coach Feedback:
                </span>
                <p className="leading-snug">{feedback}</p>
              </div>
            </div>
          </div>

          {/* Snapshot Assessment Diagnostic Card (if user clicked 'Analyze Current Frame') */}
          {recentSnapshotAssessment && (
            <div className="bg-white rounded-2xl shadow-xs border border-workshop-300 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-workshop-700">
                    Snapshot Analysis Result
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      recentSnapshotAssessment.status === "correct"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {recentSnapshotAssessment.status === "correct" ? "Pass" : "Adjust Technique"}
                  </span>
                </div>
                <span className="text-xs font-bold text-ink">
                  Score: {recentSnapshotAssessment.score}/10
                </span>
              </div>

              <h4 className="font-bold text-sm text-ink">{recentSnapshotAssessment.title}</h4>
              <p className="text-xs text-ink/80 leading-relaxed">
                {recentSnapshotAssessment.feedback}
              </p>

              <div className="bg-workshop-50 p-2.5 rounded-lg border border-workshop-200 text-xs text-workshop-950">
                <strong>Recommended Next Step:</strong> {recentSnapshotAssessment.solution}
              </div>

              {recentSnapshotAssessment.metrics && (
                <div className="flex flex-wrap gap-2 text-[11px] text-ink/60 pt-1 border-t border-line">
                  <span>Roughness: {recentSnapshotAssessment.metrics.edgeDensity}</span>
                  <span>•</span>
                  <span>Warmth: {recentSnapshotAssessment.metrics.warmthScore}</span>
                  <span>•</span>
                  <span>Specular: {recentSnapshotAssessment.metrics.specularRatio}</span>
                  <span>•</span>
                  <span>Tension: {recentSnapshotAssessment.metrics.tensionEstimate}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
