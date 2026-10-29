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
        "relevantQuestions": [],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_python.server:app", host="0.0.0.0", port=8000, reload=True)

