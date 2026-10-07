import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

interface Props {
  videoUrl?: string;
}

export const KnittingVisionGuide: React.FC<Props> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [feedback, setFeedback] = useState<string>("Initializing camera and AI tracker...");
  const [stitchCount, setStitchCount] = useState<number>(0);
  const cycleState = useRef<"together" | "apart">("apart");

  // 1. Initialize MediaPipe
  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });
        setLandmarker(handLandmarker);
      } catch (err) {
        setFeedback("Failed to load MediaPipe model. Check internet connection.");
      }
    }
    initMediaPipe();
  }, []);

  // 2. Start Camera
  useEffect(() => {
    async function startCamera() {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        videoRef.current.srcObject = stream;
      } catch (err) {
        setFeedback("Please allow camera access to start practice.");
      }
    }
    startCamera();
  }, []);

  // 3. Process Video Frames
  useEffect(() => {
    let animationFrameId: number;

    const processFrame = () => {
      if (
        landmarker &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const results = landmarker.detectForVideo(video, performance.now());

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks.length === 0) {
            setFeedback("Please show both hands and needles to the camera.");
          } else if (results.landmarks.length === 1) {
            setFeedback("Both hands needed: hold one needle in each hand (Lesson 3).");
          } else if (results.landmarks.length >= 2) {
            const hand1 = results.landmarks[0];
            const hand2 = results.landmarks[1];

            // Draw landmark circles
            results.landmarks.forEach((landmarks) => {
              landmarks.forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fillStyle = "#10b981";
                ctx.fill();
              });
            });

            // Distance between index fingertips
            const dx = (hand1[8].x - hand2[8].x) * canvas.width;
            const dy = (hand1[8].y - hand2[8].y) * canvas.height;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 70 && cycleState.current === "apart") {
              cycleState.current = "together";
              setFeedback("Needles inserted! Wrap yarn around the needle.");
            } else if (dist > 160 && cycleState.current === "together") {
              cycleState.current = "apart";
              setStitchCount((prev) => prev + 1);
              setFeedback("Stitch completed! Keep your loops even and avoid pulling too tightly.");
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarker]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto">
      {/* 1. Video Lesson / Tutorial */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-lg font-bold mb-3 text-slate-800">
          Lesson 3: Basic Process — Slip Knot to Fabric
        </h3>
        {videoUrl ? (
          <video src={videoUrl} controls className="w-full rounded-xl aspect-video bg-black" />
        ) : (
          <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 text-sm">
            Instructional Video Player
          </div>
        )}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
          <strong>Step 4:</strong> Wrap the yarn around the needle and pull it through the loop to make a new loop.
        </div>
      </div>

      {/* 2. AI Computer Vision Live Feedback */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-slate-800">Live AI Practice</h3>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-semibold">
            Stitches: {stitchCount}
          </span>
        </div>

        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex-1">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
          />
        </div>

        {/* Real-time Feedback Banner */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-medium text-center text-sm">
          {feedback}
        </div>
      </div>
    </div>
  );
};