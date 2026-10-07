import { useState } from "react";
import Card from "@/components/common/Card";
import AIAssistantPanel from "@/components/ai/AIAssistantPanel";
import { KNITTING_DOCUMENTS } from "@/rag";

export default function AIAssistantPage() {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const activeDoc = KNITTING_DOCUMENTS.find((d) => d.id === selectedLessonId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">Knitting AI Assistant</h1>
          <p className="mt-1 text-base text-ink/70">
            Powered by a RAG pipeline indexed on your knitting files ({KNITTING_DOCUMENTS.map((d) => d.sourceFile).join(", ")}).
          </p>
        </div>
      </div>

      {/* Lesson context filter selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-ink/60 uppercase tracking-wider">
          Knowledge Scope:
        </span>
        <button
          type="button"
          onClick={() => setSelectedLessonId(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            selectedLessonId === null
              ? "bg-workshop-600 text-white shadow-xs"
              : "bg-white border border-line text-ink/70 hover:border-workshop-400"
          }`}
        >
          🌐 Entire Course (All Lessons)
        </button>
        {KNITTING_DOCUMENTS.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setSelectedLessonId(doc.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              selectedLessonId === doc.id
                ? "bg-workshop-600 text-white shadow-xs"
                : "bg-white border border-line text-ink/70 hover:border-workshop-400"
            }`}
          >
            🧶 Lesson {doc.videoOrder} ({doc.sourceFile})
          </button>
        ))}
      </div>

      <Card className="flex h-[72vh] min-h-[460px] flex-col">
        <AIAssistantPanel
          videoId={selectedLessonId}
          videoTitle={activeDoc?.title}
          heading={activeDoc ? activeDoc.title : "Knitting AI Assistant"}
        />
      </Card>
    </div>
  );
}
