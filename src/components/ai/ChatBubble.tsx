import type { ChatMessage } from "@/types";

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const assessment = message.visionAssessment;

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[92%] sm:max-w-[85%] rounded-card px-4 py-3 text-base leading-relaxed ${
          isUser
            ? "bg-workshop-500 text-white"
            : "bg-white text-ink border border-workshop-200 shadow-2xs"
        }`}
      >
        {/* User Attached Image */}
        {message.imageUrl && (
          <div className="mb-2.5 overflow-hidden rounded-lg border border-white/20 bg-black/10">
            <img
              src={message.imageUrl}
              alt={message.imageFileName || "Uploaded knitting work"}
              className="max-h-64 w-auto rounded-lg object-contain"
            />
            {message.imageFileName && (
              <p className={`px-2 py-1 text-xs font-medium ${isUser ? "text-white/80" : "text-ink/60"}`}>
                Photo: {message.imageFileName}
              </p>
            )}
          </div>
        )}

        {/* Message body text */}
        {message.text && (
          <div className="whitespace-pre-line space-y-1">{message.text}</div>
        )}

        {/* AI Computer Vision Assessment Card */}
        {assessment && (() => {
          const isWrong =
            assessment.status === "invalid" ||
            assessment.category === "invalid_image" ||
            assessment.isWrongImage === true;

          return (
            <div
              className={`mt-3 rounded-lg border p-3.5 space-y-2.5 text-ink ${
                isWrong
                  ? "border-rose-300 bg-rose-50/70"
                  : "border-workshop-200 bg-workshop-50/70"
              }`}
            >
              {/* Header: Title + Status + Score */}
              <div
                className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${
                  isWrong ? "border-rose-200/80" : "border-workshop-200/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isWrong
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : assessment.status === "correct"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isWrong
                      ? "Wrong Image ❌"
                      : assessment.status === "correct"
                      ? "Correct Technique ✅"
                      : "Correction Needed ⚠️"}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      isWrong
                        ? "text-rose-700 bg-white border-rose-200"
                        : "text-workshop-700 bg-white border-workshop-200"
                    }`}
                  >
                    Score: {assessment.score} / 10
                  </span>
                </div>
                <span className="text-xs font-medium text-ink/60">
                  Confidence: {Math.round((assessment.confidence || 0.9) * 100)}%
                </span>
              </div>

              {/* Assessment Title */}
              <h4
                className={`text-base font-bold ${
                  isWrong ? "text-rose-950" : "text-ink"
                }`}
              >
                {assessment.title}
              </h4>

              {/* Detected Elements Tags */}
              {assessment.detected_items && assessment.detected_items.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-ink/60">Detected:</span>
                  {assessment.detected_items.map((item, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        isWrong
                          ? "bg-white border border-rose-200 text-rose-900"
                          : "bg-white border border-workshop-200 text-workshop-800"
                      }`}
                    >
                      {isWrong ? "⚠️" : "•"} {item}
                    </span>
                  ))}
                </div>
              )}

              {/* Detailed Observation / Feedback */}
              <div
                className={`rounded-md p-2.5 border text-sm leading-relaxed ${
                  isWrong
                    ? "bg-white border-rose-200 text-rose-950"
                    : "bg-white border-workshop-200 text-ink"
                }`}
              >
                <p
                  className={`font-semibold text-xs uppercase tracking-wider mb-1 ${
                    isWrong ? "text-rose-700" : "text-ink/70"
                  }`}
                >
                  {isWrong ? "Why this image was flagged:" : "AI Vision Feedback:"}
                </p>
                <p className={isWrong ? "text-rose-950/90" : "text-ink/90"}>
                  {assessment.feedback}
                </p>
              </div>

              {/* Actionable Solution Grounded in Video Lessons */}
              <div
                className={`rounded-md p-2.5 border text-sm leading-relaxed ${
                  isWrong
                    ? "bg-rose-100/70 border-rose-300 text-rose-950"
                    : assessment.status === "correct"
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                    : "bg-amber-50/90 border-amber-300 text-amber-950"
                }`}
              >
                <p className="font-bold text-xs uppercase tracking-wider mb-1">
                  {isWrong
                    ? "What to photograph & upload instead:"
                    : "Recommended Solution & Next Step:"}
                </p>
                <p>{assessment.solution}</p>
              </div>

              {/* Lesson Reference */}
              <div
                className={`flex items-center justify-between text-xs pt-1 ${
                  isWrong ? "text-rose-800" : "text-workshop-700"
                }`}
              >
                <span className="font-semibold">
                  Grounded in: {assessment.lesson_reference}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Source citations for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 border-t border-line/60 pt-2">
            <p className="text-xs font-semibold text-ink/60 mb-1">
              Sources retrieved from knowledge base:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src, i) => (
                <span
                  key={i}
                  title={src.snippet}
                  className="inline-flex items-center gap-1 rounded bg-workshop-100/80 px-2 py-0.5 text-xs font-medium text-workshop-800"
                >
                  {src.videoTitle.replace("Lesson ", "L")}
                  <span className="text-[10px] text-workshop-500">
                    ({Math.round(src.score * 100)}% match)
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

