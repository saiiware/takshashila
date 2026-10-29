import { useEffect, useRef, useState } from "react";
import type { ChatMessage, RAGSource } from "@/types";
import { askAI, assessKnittingPhoto, transcribeSpeech } from "@/services/aiService";
import { useAuth } from "@/context/AuthContext";
import { MOCK_COURSE } from "@/data/mockData";
import { getSuggestedQuestions } from "@/rag";
import ChatBubble from "./ChatBubble";
import ChatInput, { type ChatImageAttachment } from "./ChatInput";

interface AIAssistantPanelProps {
  videoId?: string | null;
  videoTitle?: string;
  heading?: string;
}

function makeMessage(
  role: ChatMessage["role"],
  text: string,
  videoContextId?: string | null,
  sources?: RAGSource[],
  relevantQuestions?: string[],
  imageUrl?: string,
  imageFileName?: string
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
    videoContextId,
    sources,
    relevantQuestions,
    imageUrl,
    imageFileName,
  };
}

export default function AIAssistantPanel({
  videoId = null,
  videoTitle,
  heading = "AI Learning Assistant",
}: AIAssistantPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [videoId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const starterQuestions = getSuggestedQuestions(videoId);

  const handleSendMessage = async (text: string, image?: ChatImageAttachment) => {
    setIsSending(true);

    // Flow 1: Photo uploaded -> Computer Vision Analysis
    if (image) {
      const promptText = text.trim() || `Please inspect this photo of my work (${image.fileName})`;
      const userMsg = makeMessage(
        "user",
        promptText,
        videoId,
        undefined,
        undefined,
        image.dataUrl,
        image.fileName
      );
      setMessages((prev) => [...prev, userMsg]);
      setStatusMessage("Analyzing photo with Computer Vision & Lesson knowledge…");

      try {
        const assessment = await assessKnittingPhoto(image.dataUrl, image.fileName, promptText);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: "assistant",
          text: "", // Bubble renders the full assessment card
          createdAt: new Date().toISOString(),
          videoContextId: videoId,
          visionAssessment: assessment,
          sources: assessment.sources,
          relevantQuestions:
            assessment.category === "heart"
              ? [
                  "How do I make the 3 treble crochets for the heart lobes?",
                  "How do I close the magic ring tightly?",
                  "What hook size is best for the heart shape?",
                ]
              : assessment.category === "pentagon"
              ? [
                  "How do I expand corners in Round 2 of the pentagon?",
                  "Why must I not skip the final double crochet?",
                  "How to weave in the tails with a tapestry needle?",
                ]
              : assessment.category === "hexagon"
              ? [
                  "How do I make the 6 corners in Round 1 of the hexagon?",
                  "How do I work the increased DC after the 6th corner?",
                  "What hook size does Suchita recommend for the hexagon?",
                ]
              : [
                  "How do I do a double crochet using the 7 steps?",
                  "What is the difference between single and half double crochet?",
                  "How do I make a clean foundation chain?",
                ],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Vision inspection error:", err);
        setMessages((prev) => [
          ...prev,
          makeMessage(
            "assistant",
            "Sorry, could not process the photo at this moment. Please check the image and try again.",
            videoId
          ),
        ]);
      } finally {
        setIsSending(false);
        setStatusMessage("");
      }
      return;
    }

    // Flow 2: Text question -> RAG Knowledge Base Retrieval
    setMessages((prev) => [...prev, makeMessage("user", text, videoId)]);
    setStatusMessage("Searching knitting lessons & formulating answer…");
    try {
      const response = await askAI({
        question: text,
        courseId: MOCK_COURSE.id,
        videoId,
        language: user?.preferredLanguage ?? "en",
      });
      setMessages((prev) => [
        ...prev,
        makeMessage(
          "assistant",
          response.answer,
          videoId,
          response.sources,
          response.relevantQuestions
        ),
      ]);
    } finally {
      setIsSending(false);
      setStatusMessage("");
    }
  };

  const handleMicPress = async () => {
    setIsRecording(true);
    try {
      const transcript = await transcribeSpeech(videoId);
      await handleSendMessage(transcript);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line pb-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-ink">{heading}</p>
        </div>
        <p className="text-sm text-ink/60 mt-0.5">
          {videoTitle
            ? `Grounded in "${videoTitle}" & video transcripts`
            : "Grounded in Crochet Lessons (Parts 1 - 4)"}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-3">
        {messages.length === 0 && (
          <div className="space-y-3 rounded-card bg-workshop-50/70 p-4 border border-workshop-200">
            <p className="text-sm text-ink/80 leading-relaxed">
              <strong>Ask questions by typing, speaking (🎙️ English / मराठी), or uploading a photo!</strong> Use the microphone to ask voice questions in English or Marathi, or use camera upload to inspect your <strong>crochet stitches</strong>, <strong>heart</strong>, <strong>pentagon</strong>, or <strong>hexagon</strong>.
            </p>

            <div className="pt-1">
              <p className="text-xs font-semibold text-workshop-700 uppercase tracking-wider mb-2">
                Suggested questions for {videoTitle ? "this lesson" : "beginners"}:
              </p>
              <div className="flex flex-col gap-1.5">
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    disabled={isSending}
                    className="text-left rounded-lg bg-white border border-workshop-200 hover:border-workshop-400 hover:bg-workshop-100/50 px-3 py-2 text-xs font-medium text-ink/80 transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            onSelectQuestion={(q) => handleSendMessage(q)}
          />
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-sm text-ink/60 pl-2 py-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-workshop-600 border-t-transparent" />
            <span>{statusMessage || "Processing…"}</span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <ChatInput
          onSend={handleSendMessage}
          onMicPress={handleMicPress}
          isRecording={isRecording}
          isSending={isSending}
          preferredLanguage={user?.preferredLanguage === "mr" ? "mr" : "en"}
        />
      </div>
    </div>
  );
}

