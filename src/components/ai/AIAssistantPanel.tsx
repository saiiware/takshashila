import { useEffect, useRef, useState } from "react";
import type { ChatMessage, RAGSource } from "@/types";
import { askAI, transcribeSpeech } from "@/services/aiService";
import { useAuth } from "@/context/AuthContext";
import { MOCK_COURSE } from "@/data/mockData";
import { getSuggestedQuestions } from "@/rag";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";

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
  relevantQuestions?: string[]
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
    videoContextId,
    sources,
    relevantQuestions,
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Starting a new video resets the conversation context so answers stay
  // relevant to the lesson currently open.
  useEffect(() => {
    setMessages([]);
  }, [videoId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const starterQuestions = getSuggestedQuestions(videoId);

  const sendQuestion = async (text: string) => {
    setMessages((prev) => [...prev, makeMessage("user", text, videoId)]);
    setIsSending(true);
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
    }
  };

  const handleMicPress = async () => {
    setIsRecording(true);
    try {
      const transcript = await transcribeSpeech(videoId);
      await sendQuestion(transcript);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line pb-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-ink">🤖 {heading}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-workshop-100 px-2 py-0.5 text-[11px] font-medium text-workshop-800">
            <span className="h-1.5 w-1.5 rounded-full bg-workshop-500 animate-pulse"></span>
            RAG Active (3 Lessons)
          </span>
        </div>
        <p className="text-sm text-ink/60 mt-0.5">
          {videoTitle ? `Grounded in "${videoTitle}" & course texts` : "Grounded in knitting lessons (video1, video2, video3)"}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-3">
        {messages.length === 0 && (
          <div className="space-y-3 rounded-card bg-workshop-50/70 p-4 border border-workshop-200">
            <p className="text-sm text-ink/80 leading-relaxed">
              👋 <strong>Ask anything about knitting!</strong> The assistant retrieves answers directly from the video lesson transcripts (materials, slip knot, needle sizes, loops, and presentation).
            </p>

            <div className="pt-1">
              <p className="text-xs font-semibold text-workshop-700 uppercase tracking-wider mb-2">
                💡 Suggested questions for {videoTitle ? "this lesson" : "beginners"}:
              </p>
              <div className="flex flex-col gap-1.5">
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendQuestion(q)}
                    disabled={isSending}
                    className="text-left rounded-lg bg-white border border-workshop-200 hover:border-workshop-400 hover:bg-workshop-100/50 px-3 py-2 text-xs font-medium text-ink/80 transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
                  >
                    💬 {q}
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
            onSelectQuestion={(q) => sendQuestion(q)}
          />
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-sm text-ink/60 pl-2 py-2">
            <span className="animate-spin text-base">🧶</span>
            <span>Searching knitting knowledge & formulating answer…</span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <ChatInput
          onSend={sendQuestion}
          onMicPress={handleMicPress}
          isRecording={isRecording}
          isSending={isSending}
        />
      </div>
    </div>
  );
}
