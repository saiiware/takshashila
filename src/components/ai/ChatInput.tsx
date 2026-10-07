import { useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onMicPress: () => void;
  isRecording: boolean;
  isSending: boolean;
}

export default function ChatInput({
  onSend,
  onMicPress,
  isRecording,
  isSending,
}: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="flex items-end gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        placeholder="Type your question..."
        aria-label="Type your question for the AI assistant"
        className="flex-1 rounded-card border border-line bg-white px-4 py-3 text-lg
          placeholder:text-ink/40 focus:border-workshop-500"
      />
      <button
        type="button"
        onClick={onMicPress}
        aria-label="Ask by voice"
        aria-pressed={isRecording}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-xl transition-colors ${
          isRecording
            ? "border-clay-500 bg-clay-100 text-clay-500"
            : "border-line bg-white text-workshop-500 hover:border-workshop-400"
        }`}
      >
        🎤
      </button>
      <button
        type="button"
        onClick={handleSend}
        disabled={isSending || !text.trim()}
        className="h-12 shrink-0 rounded-card bg-turmeric-500 px-5 text-lg font-semibold text-workshop-700
          transition-colors hover:bg-turmeric-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
