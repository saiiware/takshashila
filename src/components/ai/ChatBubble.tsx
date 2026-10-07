import type { ChatMessage } from "@/types";

interface ChatBubbleProps {
  message: ChatMessage;
  onSelectQuestion?: (question: string) => void;
}

export default function ChatBubble({ message, onSelectQuestion }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[90%] rounded-card px-4 py-3 text-base leading-relaxed ${
          isUser ? "bg-workshop-500 text-white" : "bg-workshop-50 text-ink border border-workshop-200"
        }`}
      >
        {/* Message body with basic line break formatting */}
        <div className="whitespace-pre-line space-y-1">{message.text}</div>

        {/* Source citations for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 border-t border-line/60 pt-2">
            <p className="text-xs font-semibold text-ink/60 mb-1 flex items-center gap-1">
              <span>📚</span> Sources retrieved from knowledge base:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src, i) => (
                <span
                  key={i}
                  title={src.snippet}
                  className="inline-flex items-center gap-1 rounded bg-workshop-100/80 px-2 py-0.5 text-xs font-medium text-workshop-800"
                >
                  <span className="text-[10px]">📄</span>
                  {src.videoTitle.replace("Lesson ", "L")}
                  <span className="text-[10px] text-workshop-500">({src.score * 100}% match)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested relevant questions */}
        {!isUser && message.relevantQuestions && message.relevantQuestions.length > 0 && (
          <div className="mt-3 border-t border-line/60 pt-2.5">
            <p className="text-xs font-semibold text-workshop-700 mb-1.5 flex items-center gap-1">
              <span>💡</span> Relevant questions you can ask next:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.relevantQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectQuestion?.(q)}
                  className="rounded-full bg-white border border-workshop-300 text-workshop-700 hover:bg-workshop-200/50 hover:border-workshop-500 px-3 py-1 text-xs text-left font-medium transition-colors shadow-2xs cursor-pointer active:scale-95"
                >
                  {q} <span className="text-workshop-500">→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
