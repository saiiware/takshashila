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
              <p className="text-[11px] text-workshop-700">Photo ready for AI Computer Vision check</p>
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
      <div className="flex items-center gap-2">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-workshop-600 shadow-2xs transition-colors hover:border-workshop-400 hover:bg-workshop-50 active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
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
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm sm:text-base
            placeholder:text-ink/40 focus:border-workshop-500 focus:outline-none"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending || (!text.trim() && !selectedImage)}
          aria-label="Send message"
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-turmeric-500 px-4 text-sm font-bold text-workshop-900 shadow-xs
            transition-all hover:bg-turmeric-400 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          <span>Send</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

