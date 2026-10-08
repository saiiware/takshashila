import { useRef, useState } from "react";

export interface ChatImageAttachment {
  dataUrl: string;
  fileName: string;
}

interface ChatInputProps {
  onSend: (text: string, image?: ChatImageAttachment) => void;
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
  const [selectedImage, setSelectedImage] = useState<ChatImageAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage({
          dataUrl: reader.result,
          fileName: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so selecting the same file again works
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !selectedImage) return;

    const messageText = trimmed || (selectedImage ? `Please inspect my knitting photo (${selectedImage.fileName})` : "");
    onSend(messageText, selectedImage ?? undefined);
    setText("");
    setSelectedImage(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected Image Preview Bar */}
      {selectedImage && (
        <div className="flex items-center justify-between rounded-card border border-workshop-300 bg-workshop-50 p-2 text-sm shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src={selectedImage.dataUrl}
              alt="Work preview"
              className="h-12 w-12 rounded-md object-cover border border-workshop-200"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink text-xs">{selectedImage.fileName}</p>
              <p className="text-[11px] text-workshop-700">📷 Photo ready for AI Computer Vision check</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            aria-label="Remove image"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink/60 border border-workshop-200 hover:text-clay-600 hover:bg-clay-50 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Controls */}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="photo-upload-input"
        />

        {/* Camera / Photo Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload photo of your knitting (Slip knot, yarn, or needles)"
          aria-label="Upload photo of your knitting"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-white text-xl text-workshop-600 shadow-2xs transition-colors hover:border-workshop-400 hover:bg-workshop-50 active:scale-95"
        >
          📷
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={selectedImage ? "Add an optional question..." : "Type question or upload photo..."}
          aria-label="Type your question for the AI assistant"
          className="flex-1 rounded-card border border-line bg-white px-4 py-3 text-base sm:text-lg
            placeholder:text-ink/40 focus:border-workshop-500"
        />

        {/* Voice Input Button */}
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

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending || (!text.trim() && !selectedImage)}
          className="h-12 shrink-0 rounded-card bg-turmeric-500 px-5 text-base sm:text-lg font-semibold text-workshop-700
            transition-colors hover:bg-turmeric-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
        >
          Send
        </button>
      </div>
    </div>
  );
}

