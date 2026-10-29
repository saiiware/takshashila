import { useEffect, useRef, useState } from "react";
import type { ChatMessage, RAGSource } from "@/types";
import { askAI, assessKnittingPhoto, transcribeSpeech } from "@/services/aiService";
import { useAuth } from "@/context/AuthContext";
import { MOCK_COURSE } from "@/data/mockData";
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
        image.dataUrl,
        image.fileName
      );
      setMessages((prev) => [...prev, userMsg]);
      setStatusMessage("Analyzing photo with Computer Vision & Lesson knowledge…");

      try {
        const assessment = await assessKnittingPhoto(image.dataUrl, image.fileName, promptText);
        
        const isWrongImage =
          assessment.status === "invalid" ||
          assessment.category === "invalid_image" ||
          assessment.isWrongImage === true;

        let chatbotResponseText = "";
        const lang = user?.preferredLanguage ?? "en";

        if (isWrongImage) {
          if (lang === "hi") {
            chatbotResponseText =
              "⚠️ **गलत छवि अपलोड की गई (Wrong Image)**: अपलोड की गई तस्वीर में बुनाई की सामग्री या अभ्यास (जैसे स्लिप नॉट, ऊन/सूती धागा, या सलाई) नहीं दिखाई दे रही है।\n\nकृपया अपनी बुनाई तकनीक का मूल्यांकन कराने के लिए पाठ 2 और 3 से संबंधित अपनी स्लिप नॉट (सलाई पर), धागे की गिट्टी, या बुनाई की सलाई की स्पष्ट फोटो अपलोड करें।";
          } else if (lang === "mr") {
            chatbotResponseText =
              "⚠️ **चुकीचा फोटो अपलोड केला (Wrong Image)**: आपण अपलोड केलेल्या फोटोमध्ये विणकामाचे साहित्य किंवा तंत्र (उदा. स्लिप नॉट, लोकर/सुती धागा किंवा विणकामाच्या सुया) दिसत नाही.\n\nकृपया आपले काम तपासण्यासाठी धडा 2 आणि 3 मधील स्लिप नॉट (सुईवर), लोकर किंवा विणकामाच्या सुयांचा स्पष्ट फोटो अपलोड करा!";
          } else {
            chatbotResponseText =
              "⚠️ **Wrong Image Uploaded**: The photo you uploaded does not appear to show knitting materials or techniques. Our Computer Vision engine could not detect any slip knot loops, yarn (wool/cotton), or knitting needles.\n\nPlease upload a clear photo of your slip knot on the needle (Lesson 3), yarn ball/skein (Lesson 2), or knitting needles (Lesson 2) so I can evaluate your work!";
          }
        } else {
          if (lang === "hi") {
            chatbotResponseText = `📸 मैंने कंप्यूटर विज़न से आपकी तस्वीर का विश्लेषण किया है: **${assessment.title}**। विस्तृत मूल्यांकन नीचे देखें:`;
          } else if (lang === "mr") {
            chatbotResponseText = `📸 मी कॉम्प्युटर व्हिजनद्वारे आपल्या फोटोची तपासणी केली आहे: **${assessment.title}**। तपशीलवार मूल्यांकन खाली पहा:`;
          } else {
            chatbotResponseText = `📸 I analyzed your photo with our Computer Vision engine: **${assessment.title}**. Here is your evaluation grounded in Lessons 2 & 3:`;
          }
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: "assistant",
          text: chatbotResponseText,
          createdAt: new Date().toISOString(),
          videoContextId: videoId,
          visionAssessment: assessment,
          sources: assessment.sources,
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
          response.sources
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
            ? `Grounded in "${videoTitle}" & course texts`
            : "Grounded in knitting lessons"}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-3">
        {messages.length === 0 && (
          <div className="space-y-3 rounded-card bg-workshop-50/70 p-4 border border-workshop-200">
            <p className="text-sm text-ink/80 leading-relaxed">
              <strong>Ask questions by typing, speaking (🎙️ English / मराठी), or uploading a photo!</strong> Use the microphone to ask voice questions in English or Marathi, or use camera upload to check your <strong>slip knot</strong>, <strong>yarn</strong>, or <strong>needles</strong>.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
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

