"""
SkillSetu — Computer Vision Coach with Grounded RAG Integration
==============================================================
Location: rag_python/vision_coach.py

Features:
  - MediaPipe Hands tracking (tracks needle grip and hand presence)
  - Automatic stitch counter (detects loop cycles: insert -> wrap -> pull)
  - Real-time tension monitor (alerts when stitches are pulled too tightly)
  - Grounded RAG advice directly on the webcam HUD
"""

import math
import cv2
import mediapipe as mp
from dataclasses import dataclass
from typing import Optional, Tuple

# Import directly from your existing RAG pipeline
from .pipeline import query_rag, RAGPipelineResult


@dataclass
class VisionTelemetry:
    state: str
    stitch_count: int
    hands_detected: int
    tip_distance: float
    coach_advice: str


class KnittingVisionCoach:
    def __init__(self):
        self.stitch_count = 0
        self.phase = "apart"  # Cycle state: 'together' -> 'apart'
        self.tight_tension_frames = 0
        self.latest_advice = "Hold one needle in each hand to begin."

        self.mp_hands = mp.solutions.hands
        self.hands_detector = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.5,
        )

    def process_frame(self, frame_bgr) -> Tuple[VisionTelemetry, any]:
        h, w, _ = frame_bgr.shape
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.hands_detector.process(rgb)

        # 1. No hands detected
        if not results.multi_hand_landmarks:
            self.latest_advice = "Please show both hands and needles to the camera."
            return VisionTelemetry("SEARCHING", self.stitch_count, 0, 0.0, self.latest_advice), frame_bgr

        num_hands = len(results.multi_hand_landmarks)

        # 2. Only one hand detected (Lesson 3 requires both needles/hands)
        if num_hands < 2:
            self.latest_advice = "Both hands needed: hold one needle in each hand (Lesson 3)."
            return VisionTelemetry("ONE_HAND", self.stitch_count, 1, 0.0, self.latest_advice), frame_bgr

        # 3. Two hands detected: extract index fingertips (Landmark 8)
        h1 = results.multi_hand_landmarks[0].landmark
        h2 = results.multi_hand_landmarks[1].landmark

        p1 = (int(h1[8].x * w), int(h1[8].y * h))
        p2 = (int(h2[8].x * w), int(h2[8].y * h))
        dist = math.dist(p1, p2)

        # Draw green visual keypoints on fingertips
        cv2.circle(frame_bgr, p1, 7, (0, 255, 0), -1)
        cv2.circle(frame_bgr, p2, 7, (0, 255, 0), -1)
        cv2.line(frame_bgr, p1, p2, (255, 200, 0), 2)

        # 4. Tension Warning: If needles remain clenched tightly together
        if dist < 40:
            self.tight_tension_frames += 1
            if self.tight_tension_frames > 25:  # ~1 second
                rag_res = query_rag("Why should I avoid pulling yarn too tightly?")
                self.latest_advice = f"[TENSION ALERT] {rag_res.answer}"
        else:
            self.tight_tension_frames = max(0, self.tight_tension_frames - 1)

        # 5. Stitch Loop Counter: needle inserted (< 60px) -> pulled apart (> 140px)
        state_label = "TRACKING"
        if dist < 60 and self.phase == "apart":
            self.phase = "together"
            state_label = "INSERTING_NEEDLE"
            self.latest_advice = "Needles engaged. Wrap the yarn around."
        elif dist > 140 and self.phase == "together":
            self.phase = "apart"
            self.stitch_count += 1
            state_label = "STITCH_COMPLETED"
            self.latest_advice = f"Stitch {self.stitch_count} created! Keep stitches even."

        telemetry = VisionTelemetry(
            state=state_label,
            stitch_count=self.stitch_count,
            hands_detected=2,
            tip_distance=dist,
            coach_advice=self.latest_advice,
        )
        return telemetry, frame_bgr


def run_live_coach():
    """Starts live OpenCV webcam window with real-time HUD and RAG advice."""
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[!] Could not access webcam.")
        return

    coach = KnittingVisionCoach()
    print("[SkillSetu] Webcam started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)  # Mirror view
        telemetry, annotated = coach.process_frame(frame)

        # Render HUD Banner
        h, w, _ = annotated.shape
        cv2.rectangle(annotated, (0, 0), (w, 80), (20, 20, 20), -1)
        cv2.putText(
            annotated,
            f"SkillSetu Coach | Stitches: {telemetry.stitch_count} | State: {telemetry.state}",
            (15, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (0, 255, 200),
            2,
        )
        cv2.putText(
            annotated,
            telemetry.coach_advice[:90],
            (15, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
        )

        cv2.imshow("SkillSetu Knitting AI Coach", annotated)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    run_live_coach()