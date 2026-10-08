"""FastAPI backend server for Takshashila — integrates RAG pipeline and Computer Vision telemetry."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .pipeline import get_knowledge_stats, get_suggested_questions, query_rag


class AskRequest(BaseModel):
    question: str
    videoId: Optional[str] = None
    courseId: Optional[str] = None
    language: Optional[str] = "en"


class TelemetryRequest(BaseModel):
    state: str
    stitchCount: int
    handsDetected: int
    tipDistance: float
    advice: Optional[str] = None


app = FastAPI(
    title="Takshashila RAG & Vision API",
    description="Backend API powering AI questions and Computer Vision practice.",
    version="1.0.0",
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/api/health")
def health_check():
    stats = get_knowledge_stats()
    return {
        "status": "online",
        "service": "Takshashila RAG & Vision API",
        "documentsIndexed": stats["documents_count"],
        "chunksIndexed": stats["chunks_count"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/ai/ask")
def ask_ai(req: AskRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    rag_result = query_rag(
        request={
            "question": req.question,
            "videoId": req.videoId,
            "courseId": req.courseId,
            "language": req.language or "en",
        },
        debug=False,
    )

    return {
        "answer": rag_result.answer,
        "answeredAt": datetime.now(timezone.utc).isoformat(),
        "sources": [
            {
                "videoId": s.video_id,
                "videoTitle": s.video_title,
                "snippet": s.snippet,
                "score": s.score,
            }
            for s in rag_result.sources
        ],
        "relevantQuestions": rag_result.relevant_questions,
        "confidence": rag_result.confidence,
    }


@app.get("/api/starter-questions")
def starter_questions(videoId: Optional[str] = None):
    return {"questions": get_suggested_questions(videoId)}


@app.get("/api/documents")
def documents_list():
    return get_knowledge_stats()


@app.get("/api/vision/status")
def vision_status():
    return {
        "webcamVisionSupported": True,
        "mediaPipeTasks": "@mediapipe/tasks-vision",
        "desktopCoach": "rag_python/vision_coach.py",
        "trackedFeatures": [
            "Hand landmark detection",
            "Index fingertip distance",
            "Stitch loop count cycles",
            "Stitch tension monitoring",
            "Real-time RAG guidance",
        ],
    }


class VisionAssessRequest(BaseModel):
    imageBase64: str
    mimeType: Optional[str] = "image/png"
    prompt: Optional[str] = "Please inspect my knitting item."
    fileName: Optional[str] = None


@app.post("/api/ai/vision-assess")
def vision_assess(req: VisionAssessRequest):
    import base64
    from .vision_inspector import inspect_image

    data_str = req.imageBase64
    if "," in data_str:
        data_str = data_str.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(data_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

    hint = req.prompt or "Inspecting knitting work"
    if req.fileName:
        hint += f" (File: {req.fileName})"

    mime = req.mimeType or "image/png"
    res = inspect_image(raw_bytes, mime, hint)

    return {
        "category": res.category,
        "status": res.status,
        "title": res.title,
        "score": res.score,
        "detected_items": res.detected_items,
        "feedback": res.feedback,
        "solution": res.solution,
        "lesson_reference": res.lesson_reference,
        "sources": res.sources,
        "confidence": res.confidence,
    }


class CompareWorkRequest(BaseModel):
    imageBase64: str
    fileName: Optional[str] = "practice-photo.png"
    videoId: Optional[str] = "course-knitting-craft-video-3"
    userNotes: Optional[str] = ""


@app.post("/api/ai/compare-work")
def compare_work(req: CompareWorkRequest):
    import base64
    import re
    from .vision_inspector import inspect_image

    data_str = req.imageBase64
    if "," in data_str:
        data_str = data_str.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(data_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

    hint = f"{req.fileName or ''} {req.userNotes or ''}"
    res = inspect_image(raw_bytes, "image/png", hint)

    # Determine video order
    order_match = re.search(r"video-(\d+)", req.videoId or "")
    video_order = int(order_match.group(1)) if order_match else 3

    # Benchmark comparison construction
    benchmark = {
        "keyframeTitle": f"Video {video_order} Technique Benchmark",
        "videoRuleQuote": "Keep the loops even and avoid pulling the yarn too tightly, as this makes knitting difficult.",
        "videoTimestamp": "01:45" if video_order == 3 else "01:00",
        "whatVideoTeaches": f"Video {video_order} curriculum standards for loop tension, fiber selection, and needle hold.",
        "whatWasObserved": res.feedback,
    }

    criteria = [
        {
            "id": "crit-1",
            "name": "Technique & Tension Alignment",
            "videoGuideline": "Avoid pulling too tightly; keep loop even and movable",
            "status": "pass" if res.status == "correct" else "fail",
            "detail": res.feedback,
        },
        {
            "id": "crit-2",
            "name": "Tool & Fiber Suitability",
            "videoGuideline": "Match needles with yarn thickness as taught in Video 2",
            "status": "pass",
            "detail": f"Detected items: {', '.join(res.detected_items)}",
        },
    ]

    return {
        "id": f"check-{int(datetime.now(timezone.utc).timestamp())}",
        "videoId": req.videoId or "course-knitting-craft-video-3",
        "videoTitle": f"Lesson {video_order}: Curriculum Benchmark",
        "videoOrder": video_order,
        "userImageUrl": req.imageBase64 if req.imageBase64.startswith("data:") else f"data:image/png;base64,{req.imageBase64}",
        "imageFileName": req.fileName or "practice.png",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overallStatus": res.status,
        "score": res.score,
        "category": res.category,
        "title": res.title,
        "detectedElements": res.detected_items,
        "feedback": res.feedback,
        "benchmarkComparison": benchmark,
        "criteria": criteria,
        "correctionSteps": [
            res.solution,
            f"Review Video {video_order} demonstration to refine movement cadence.",
        ],
        "nextAction": "Adjust technique if required and proceed with the next lesson.",
        "sources": res.sources,
        "confidence": res.confidence,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_python.server:app", host="0.0.0.0", port=8000, reload=True)


