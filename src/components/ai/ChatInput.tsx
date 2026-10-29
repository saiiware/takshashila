import { useEffect, useRef, useState } from "react";
import {
  cleanTranscription,
  startSpeechRecognition,
  stopSpeechRecognition,
  type SpeechLanguage,
} from "@/services/speechService";

export interface ChatImageAttachment {
  dataUrl: string;
  fileName: string;
}

const MARATHI_VOWELS = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "अं", "ऋ"];
const MARATHI_MATRAS = ["ा", "ि", "ी", "ु", "ू", "े", "ै", "ो", "ौ", "ं", "्", "ॅ", "ॉ", "ः"];
const MARATHI_CONSONANTS = [
  "क", "ख", "ग", "घ", "ङ",
  "च", "छ", "ज", "झ", "ञ",
  "ट", "ठ", "ड", "ढ", "ण",
  "त", "थ", "द", "ध", "न",
  "प", "फ", "ब", "भ", "म",
  "य", "र", "ल", "व",
  "श", "ष", "स", "ह", "ळ", "क्ष", "ज्ञ"
];
const MARATHI_NUMBERS = ["१", "२", "३", "४", "५", "६", "७", "८", "९", "०"];
const CRAFT_QUICK_WORDS_MR = [
  "क्रोशे", "टाका", "साखळी", "यान", "सुई", "मॅजिक रिंग", "हार्ट", "पंचकोन", "षटकोन", "डबल क्रोशे", "सिंगल क्रोशे", "कसा बनवायचा?", "रंग"
];
const CRAFT_QUICK_WORDS_EN = [
  "Crochet", "Stitch", "Chain", "Yarn", "Hook", "Magic ring", "Heart", "Pentagon", "Hexagon", "Single crochet", "Double crochet", "Color"
];
const ENGLISH_ROW_1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ENGLISH_ROW_2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ENGLISH_ROW_3 = ["z", "x", "c", "v", "b", "n", "m"];
const ENGLISH_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface ChatInputProps {
  onSend: (text: string, image?: ChatImageAttachment) => void;
  onMicPress?: () => void;
  isRecording?: boolean;
  isSending: boolean;
  preferredLanguage?: "en" | "mr";
}

export default function ChatInput({
  onSend,
  isSending,
  preferredLanguage = "en",
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<ChatImageAttachment | null>(null);
  const [speechLang, setSpeechLang] = useState<SpeechLanguage>(preferredLanguage);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusHint, setStatusHint] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Virtual on-screen keyboard state
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardLang, setKeyboardLang] = useState<"mr" | "en">(preferredLanguage === "mr" ? "mr" : "en");
  const [keyboardTab, setKeyboardTab] = useState<"consonants" | "vowels" | "words">("consonants");
  const [isShift, setIsShift] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const stopSpeechRef = useRef<(() => Promise<void>) | null>(null);

  // Sync keyboard and speech language if preferredLanguage prop changes
  useEffect(() => {
    if (preferredLanguage) {
      setSpeechLang(preferredLanguage);
      setKeyboardLang(preferredLanguage);
    }
  }, [preferredLanguage]);

  const handleInsertChar = (char: string) => {
    const input = textInputRef.current;
    if (!input) {
      setText((prev) => prev + char);
      return;
    }
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const newText = text.substring(0, start) + char + text.substring(end);
    setText(newText);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  const handleInsertWord = (word: string) => {
    handleInsertChar(word.endsWith(" ") ? word : word + " ");
  };

  const handleBackspace = () => {
    const input = textInputRef.current;
    if (!input) {
      setText((prev) => prev.slice(0, -1));
      return;
    }
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    if (start === end && start > 0) {
      const newText = text.substring(0, start - 1) + text.substring(end);
      setText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start - 1, start - 1);
      }, 0);
    } else if (start !== end) {
      const newText = text.substring(0, start) + text.substring(end);
      setText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start);
      }, 0);
    }
  };

  // Clean up any ongoing microphone sessions on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
    };
  }, []);

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
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSend = () => {
    if (isListening || isTranscribing) {
      handleToggleSpeech();
    }

    const trimmed = text.trim();
    if (!trimmed && !selectedImage) return;

    const messageText =
      trimmed ||
      (selectedImage ? `Please inspect my knitting photo (${selectedImage.fileName})` : "");
    onSend(messageText, selectedImage ?? undefined);
    setText("");
    setSelectedImage(null);
    setInterimText("");
    setStatusHint("");
  };

  const handleToggleSpeech = async () => {
    setSpeechError(null);

    // If currently recording/listening, stop and finalize
    if (isListening || isTranscribing) {
      setIsTranscribing(true);
      setStatusHint(
        speechLang === "mr"
          ? "Gemini AI द्वारे आवाज रूपांतरित होत आहे…"
          : "Transcribing audio with Gemini AI…"
      );

      try {
        if (stopSpeechRef.current) {
          const fn = stopSpeechRef.current;
          stopSpeechRef.current = null;
          await fn();
        } else {
          stopSpeechRecognition();
        }
      } catch (err: any) {
        setSpeechError(err?.message || "Transcription failed");
      } finally {
        setIsListening(false);
        setIsTranscribing(false);
        setInterimText("");
        setStatusHint("");
        textInputRef.current?.focus();
      }
      return;
    }

    // Starting a NEW voice recording attempt:
    // Reset previous interim text and status
    setInterimText("");
    setStatusHint(
      speechLang === "mr"
        ? "मराठीत बोला (ऐकत आहे…)"
        : "Listening in English (Speak now)…"
    );

    try {
      const stopFn = await startSpeechRecognition(speechLang, {
        onStart: () => {
          setIsListening(true);
          setIsTranscribing(false);
          setSpeechError(null);
        },
        onStatusChange: (status) => {
          setStatusHint(status);
        },
        onInterim: (interim) => {
          const cleanInterim = cleanTranscription(interim);
          if (cleanInterim) {
            setInterimText(cleanInterim);
          }
        },
        onResult: (finalTranscript) => {
          const clean = cleanTranscription(finalTranscript);
          if (clean) {
            setInterimText("");
            // Requirement 1: REPLACES the previously detected sentence completely!
            setText(clean);
            textInputRef.current?.focus();
          }
        },
        onError: (err) => {
          setSpeechError(err);
          setIsListening(false);
          setIsTranscribing(false);
          setInterimText("");
          setStatusHint("");
        },
        onEnd: () => {
          setIsListening(false);
          setIsTranscribing(false);
          setInterimText("");
          setStatusHint("");
          stopSpeechRef.current = null;
          textInputRef.current?.focus();
        },
      });

      stopSpeechRef.current = stopFn;
    } catch (err: any) {
      setSpeechError(err.message || "Failed to start speech recognition.");
      setIsListening(false);
      setIsTranscribing(false);
    }
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
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink/60 border border-workshop-200 hover:text-clay-600 hover:bg-clay-50 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Listening / Audio Processing Live Status Banner */}
      {(isListening || isTranscribing) && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/95 px-3 py-2 text-xs text-red-900 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {isTranscribing ? (
              <span className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            ) : (
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            )}
            <div className="min-w-0 flex-1 truncate">
              <span className="font-bold">
                {statusHint ||
                  (speechLang === "mr"
                    ? "मराठीत ऐकत आहे… (Speak in Marathi)"
                    : "Listening in English… (Speak now)")}
              </span>
              {interimText && (
                <span className="ml-2 font-medium italic text-ink/80 truncate">
                  "{interimText}"
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              disabled={isTranscribing}
              className="rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition-colors cursor-pointer active:scale-95"
            >
              {isTranscribing
                ? speechLang === "mr"
                  ? "रूपांतरित होत आहे…"
                  : "Processing…"
                : speechLang === "mr"
                ? "पूर्ण झाले (Done)"
                : "Done"}
            </button>
          </div>
        </div>
      )}

      {/* Speech Error Banner */}
      {speechError && (
        <div className="flex items-start justify-between rounded-xl border border-amber-300 bg-amber-50/95 p-3 text-xs text-amber-950 shadow-xs animate-fade-in">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <span className="text-base leading-none shrink-0">🔒</span>
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="font-semibold text-amber-900 leading-snug">{speechError}</p>

              {/* If on Network IP, offer quick 1-click switch to localhost */}
              {typeof window !== "undefined" &&
                window.location.hostname !== "localhost" &&
                window.location.hostname !== "127.0.0.1" && (
                  <div className="pt-1">
                    <a
                      href={`http://localhost:${window.location.port || "5173"}${window.location.pathname}${window.location.search}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-workshop-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-workshop-700 transition-colors"
                    >
                      <span>Switch to http://localhost:{window.location.port || "5173"}</span>
                      <span>→</span>
                    </a>
                  </div>
                )}

              <p className="text-[11px] text-amber-800/90 leading-normal">
                <strong>Why this happened:</strong> Browsers require a <strong>Secure Context</strong> for microphone access. Any plain HTTP IP address (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">{typeof window !== "undefined" ? window.location.host : "192.168.x.x"}</code>) is labeled <em>"Not secure"</em> and the microphone is autoblocked.
                Opening <strong>http://localhost:5173</strong> is natively recognized as a secure context, allowing the microphone immediately!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            aria-label="Dismiss error"
            className="ml-2 shrink-0 rounded p-1 text-amber-700 hover:text-amber-950 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Virtual On-Screen Marathi / English Keyboard */}
      {showKeyboard && (
        <div className="rounded-2xl border border-workshop-300 bg-white/98 p-2.5 sm:p-3 shadow-lg backdrop-blur-md animate-fade-in flex flex-col gap-2">
          {/* Top Bar: Title, Language Switcher, Category Tabs, Close */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-workshop-200/80 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⌨️</span>
              <span className="text-xs font-bold text-ink">
                {keyboardLang === "mr" ? "मराठी कीबोर्ड" : "English Keyboard"}
              </span>

              {/* Language Switch Toggle (मराठी / EN) inside virtual keyboard */}
              <div className="ml-1 inline-flex rounded-lg border border-workshop-200 bg-workshop-50 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setKeyboardLang("mr")}
                  className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                    keyboardLang === "mr"
                      ? "bg-workshop-600 text-white font-bold shadow-2xs"
                      : "text-ink/60 hover:text-ink hover:bg-white"
                  }`}
                >
                  मराठी
                </button>
                <button
                  type="button"
                  onClick={() => setKeyboardLang("en")}
                  className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                    keyboardLang === "en"
                      ? "bg-workshop-600 text-white font-bold shadow-2xs"
                      : "text-ink/60 hover:text-ink hover:bg-white"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Category Sub-tabs for Marathi */}
              {keyboardLang === "mr" && (
                <div className="flex rounded-lg border border-workshop-200 bg-workshop-50 p-0.5 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setKeyboardTab("consonants")}
                    className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                      keyboardTab === "consonants"
                        ? "bg-white text-ink font-bold shadow-2xs"
                        : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    व्यंजन
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeyboardTab("vowels")}
                    className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                      keyboardTab === "vowels"
                        ? "bg-white text-ink font-bold shadow-2xs"
                        : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    स्वर / मात्रा
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeyboardTab("words")}
                    className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                      keyboardTab === "words"
                        ? "bg-white text-ink font-bold shadow-2xs"
                        : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    शॉर्टकट
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowKeyboard(false)}
                title="कीबोर्ड बंद करा / Close keyboard"
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink/50 hover:bg-workshop-100 hover:text-ink transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Craft Words Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] font-bold text-workshop-600 uppercase shrink-0">
              {keyboardLang === "mr" ? "शब्द:" : "Words:"}
            </span>
            {(keyboardLang === "mr" ? CRAFT_QUICK_WORDS_MR : CRAFT_QUICK_WORDS_EN).map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => handleInsertWord(word)}
                className="shrink-0 rounded-lg border border-workshop-200 bg-workshop-50/80 hover:bg-workshop-100 hover:border-workshop-300 px-2 py-1 text-[11px] font-medium text-ink transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                {word}
              </button>
            ))}
          </div>

          {/* MARATHI KEYBOARD CONTENT */}
          {keyboardLang === "mr" && (
            <div className="flex flex-col gap-2">
              {/* Frequently used Matras row: Show in Consonants tab for fast composition (क + ा = का) */}
              {keyboardTab === "consonants" && (
                <div className="flex flex-wrap items-center gap-1 rounded-xl bg-workshop-100/70 p-1.5 border border-workshop-200/80">
                  <span className="text-[10px] font-bold text-workshop-700 px-1 shrink-0">मात्रा:</span>
                  {MARATHI_MATRAS.map((matra, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertChar(matra)}
                      className="flex h-7 min-w-7 px-1 items-center justify-center rounded-md border border-workshop-300 bg-white text-xs font-bold text-workshop-900 shadow-2xs hover:bg-workshop-200 active:scale-95 cursor-pointer"
                    >
                      {matra === "्" ? "् (हलंत)" : `क${matra}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 1: Consonants (व्यंजन) */}
              {keyboardTab === "consonants" && (
                <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 gap-1">
                  {MARATHI_CONSONANTS.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleInsertChar(char)}
                      className="flex h-8 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-semibold text-ink shadow-2xs hover:bg-workshop-100 hover:border-workshop-300 active:scale-95 cursor-pointer"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 2: Vowels, Matras, and Numbers */}
              {keyboardTab === "vowels" && (
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-bold text-workshop-600 mb-1">स्वर (Vowels):</p>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                      {MARATHI_VOWELS.map((char) => (
                        <button
                          key={char}
                          type="button"
                          onClick={() => handleInsertChar(char)}
                          className="flex h-8 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-semibold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-workshop-600 mb-1">मात्रा व चिन्हे (Signs):</p>
                    <div className="grid grid-cols-7 sm:grid-cols-9 gap-1">
                      {MARATHI_MATRAS.map((char, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleInsertChar(char)}
                          className="flex h-8 items-center justify-center rounded-lg border border-workshop-200 bg-workshop-50 text-sm font-bold text-workshop-900 shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-workshop-600 mb-1">अंक (Marathi Numbers):</p>
                    <div className="grid grid-cols-10 gap-1">
                      {MARATHI_NUMBERS.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleInsertChar(num)}
                          className="flex h-8 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-semibold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Shortcut Craft Terms */}
              {keyboardTab === "words" && (
                <div className="flex flex-wrap gap-1.5 p-1">
                  {CRAFT_QUICK_WORDS_MR.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleInsertWord(w)}
                      className="rounded-lg border border-workshop-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-workshop-900 shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ENGLISH KEYBOARD CONTENT */}
          {keyboardLang === "en" && (
            <div className="flex flex-col gap-1.5">
              {/* English Numbers */}
              <div className="grid grid-cols-10 gap-1">
                {ENGLISH_NUMBERS.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleInsertChar(num)}
                    className="flex h-7 items-center justify-center rounded-md border border-workshop-200 bg-white text-xs font-semibold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-10 gap-1">
                {ENGLISH_ROW_1.map((letter) => {
                  const display = isShift ? letter.toUpperCase() : letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleInsertChar(display)}
                      className="flex h-8 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-semibold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                    >
                      {display}
                    </button>
                  );
                })}
              </div>

              {/* Row 2 */}
              <div className="flex justify-center gap-1 px-3">
                {ENGLISH_ROW_2.map((letter) => {
                  const display = isShift ? letter.toUpperCase() : letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleInsertChar(display)}
                      className="flex h-8 flex-1 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-semibold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                    >
                      {display}
                    </button>
                  );
                })}
              </div>

              {/* Row 3 with Shift */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsShift((prev) => !prev)}
                  className={`flex h-8 w-14 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    isShift
                      ? "border-workshop-600 bg-workshop-600 text-white shadow-2xs"
                      : "border-workshop-200 bg-workshop-100 text-ink/70 hover:bg-workshop-200"
                  }`}
                >
                  ⇧ Shift
                </button>

                <div className="flex flex-1 gap-1">
                  {ENGLISH_ROW_3.map((letter) => {
                    const display = isShift ? letter.toUpperCase() : letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleInsertChar(display)}
                        className="flex h-8 flex-1 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-semibold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
                      >
                        {display}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Common Bottom Controls Bar: Space, Backspace, Clear, Punctuation */}
          <div className="flex items-center gap-1 border-t border-workshop-100 pt-1.5">
            <button
              type="button"
              onClick={() => handleInsertChar("?")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-bold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
            >
              ?
            </button>
            <button
              type="button"
              onClick={() => handleInsertChar(",")}
              className="flex h-8 w-7 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-bold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
            >
              ,
            </button>
            <button
              type="button"
              onClick={() => handleInsertChar(".")}
              className="flex h-8 w-7 items-center justify-center rounded-lg border border-workshop-200 bg-white text-sm font-bold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => handleInsertChar(" ")}
              className="flex h-8 flex-1 items-center justify-center rounded-lg border border-workshop-200 bg-white text-xs font-semibold text-ink shadow-2xs hover:bg-workshop-100 active:scale-95 cursor-pointer"
            >
              {keyboardLang === "mr" ? "अंतर (Space)" : "Space"}
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="flex h-8 items-center justify-center gap-1 rounded-lg border border-workshop-200 bg-workshop-100 hover:bg-workshop-200 px-2 text-xs font-semibold text-ink transition-colors active:scale-95 cursor-pointer"
            >
              <span>⌫</span>
              <span className="hidden sm:inline">{keyboardLang === "mr" ? "मागे" : "Del"}</span>
            </button>
            <button
              type="button"
              onClick={() => setText("")}
              className="flex h-8 items-center justify-center rounded-lg border border-workshop-200 bg-workshop-50 hover:bg-workshop-200 px-2 text-xs font-semibold text-red-600 transition-colors active:scale-95 cursor-pointer"
            >
              {keyboardLang === "mr" ? "हटवा" : "Clear"}
            </button>
          </div>
        </div>
      )}

      {/* Main Input Controls Row */}
      <div className="flex items-center gap-1.5 sm:gap-2">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-workshop-600 shadow-2xs transition-colors hover:border-workshop-400 hover:bg-workshop-50 active:scale-95 cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Microphone / Speech-to-Text Button */}
        <button
          type="button"
          onClick={handleToggleSpeech}
          disabled={isSending}
          title={
            isListening || isTranscribing
              ? "Recording in progress... Click to finish"
              : speechLang === "mr"
              ? "मराठीत बोलण्यासाठी क्लिक करा (Speech to Text in Marathi)"
              : "Click to speak your question in English (Speech to Text)"
          }
          aria-label={isListening ? "Stop voice recording" : "Start voice recording"}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
            isListening || isTranscribing
              ? "border-red-500 bg-red-600 text-white shadow-md animate-pulse ring-2 ring-red-400"
              : "border-line bg-white text-workshop-600 shadow-2xs hover:border-workshop-400 hover:bg-workshop-50"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        {/* Speech Language Switcher Toggle (EN / मराठी) */}
        <div
          className="flex h-11 shrink-0 items-center rounded-xl border border-line bg-white p-0.5 shadow-2xs"
          title="Switch speech language between English and Marathi"
        >
          <button
            type="button"
            onClick={() => setSpeechLang("en")}
            disabled={isListening || isTranscribing}
            className={`h-full rounded-lg px-2 text-xs font-bold transition-all cursor-pointer ${
              speechLang === "en"
                ? "bg-workshop-600 text-white shadow-2xs"
                : "text-ink/60 hover:text-ink hover:bg-workshop-50"
            } ${isListening || isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setSpeechLang("mr")}
            disabled={isListening || isTranscribing}
            className={`h-full rounded-lg px-2 text-xs font-bold transition-all cursor-pointer ${
              speechLang === "mr"
                ? "bg-workshop-600 text-white shadow-2xs"
                : "text-ink/60 hover:text-ink hover:bg-workshop-50"
            } ${isListening || isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            मराठी
          </button>
        </div>

        {/* Virtual On-Screen Keyboard Toggle Button (⌨️) */}
        <button
          type="button"
          onClick={() => {
            setShowKeyboard((prev) => !prev);
          }}
          title={
            showKeyboard
              ? "Close on-screen keyboard (कीबोर्ड बंद करा)"
              : "Open on-screen keyboard for Marathi or English (ऑन-स्क्रीन कीबोर्ड उघडा)"
          }
          aria-label={showKeyboard ? "Close on-screen keyboard" : "Open on-screen keyboard"}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
            showKeyboard
              ? "border-workshop-600 bg-workshop-100 text-workshop-900 shadow-sm ring-2 ring-workshop-400"
              : "border-line bg-white text-workshop-600 shadow-2xs hover:border-workshop-400 hover:bg-workshop-50"
          }`}
        >
          <span className="text-lg leading-none" role="img" aria-hidden="true">⌨️</span>
        </button>

        {/* Text Input Field */}
        <input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={
            selectedImage
              ? "Add an optional question..."
              : speechLang === "mr"
              ? "प्रश्न टाईप करा किंवा माइकने बोला…"
              : "Type question or use mic to speak…"
          }
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
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-turmeric-500 px-3.5 sm:px-4 text-sm font-bold text-workshop-900 shadow-xs
            transition-all hover:bg-turmeric-400 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 cursor-pointer"
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
