export type SpeechLanguage = "en" | "mr";

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onInterim?: (text: string) => void;
  onResult: (text: string) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
  onStatusChange?: (statusText: string) => void;
}

let activeRecognition: any = null;
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let audioChunks: Blob[] = [];

/**
 * Checks whether native Web Speech API (SpeechRecognition / webkitSpeechRecognition) is supported.
 */
export function isWebSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Checks whether MediaDevices audio capture is supported in this browser.
 */
export function isAudioCaptureSupported(): boolean {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
  return Boolean(
    typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined"
  );
}

function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "audio/webm";
}

/**
 * Converts a Blob to a base64 string without data prefix.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sanitizes transcription output:
 * - Removes hallucinated timestamps (e.g. 0.02, 0:02, [00:02], 00:00 - 00:02).
 * - Removes speaker / audio labels.
 * - Discards random stray numbers or silence artifacts.
 */
export function cleanTranscription(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Remove timestamps: [00:02], 0.02, 0:02, (0.02), 00:00 - 00:02
    .replace(/\[?\b\d{1,2}[:.]\d{2}(?::\d{2})?\b\]?/g, "")
    .replace(/\b\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}\b/g, "")
    // Remove isolated decimal numbers like 0.02, 0.00, 0.05
    .replace(/\b0\.\d{1,3}\b/g, "")
    // Remove speaker / system prefixes
    .replace(/^(speaker\s*\d*|user|audio|transcript|transcription|output|text)\s*:\s*/i, "")
    // Remove markdown asterisks and bold markers
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/[_*~`]/g, "")
    // Remove wrapping quotes
    .replace(/^["'“‘]+|["'”’]+$/g, "")
    // Normalize spaces
    .replace(/\s{2,}/g, " ")
    .trim();

  // If text is only numbers, colons, or punctuation (like "0.02" or "."), discard it
  if (!cleaned || /^[\d.:\s\-—_()[\]{}]+$/.test(cleaned)) {
    return "";
  }

  return cleaned;
}

/**
 * Transcribes recorded audio using Google Gemini Flash Multimodal API.
 * Provides high-accuracy transcription for both Marathi (Devanagari script) and English.
 */
export async function transcribeAudioWithGemini(
  audioBlob: Blob,
  lang: SpeechLanguage
): Promise<string> {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
    throw new Error("Gemini API key is not configured.");
  }

  const base64Audio = await blobToBase64(audioBlob);
  // Gemini expects raw mime type like audio/webm, audio/ogg, audio/mp4 without codecs parameter
  const mimeType = (audioBlob.type || "audio/webm").split(";")[0];

  const prompt =
    lang === "mr"
      ? "You are an expert speech recognition system for Marathi. Listen to the audio and transcribe ONLY the human words spoken in standard Marathi using Devanagari script (मराठी). STRICT RULES: Do NOT output timestamps (e.g. 0.02, 0:02), duration numbers, or speaker tags. Do NOT translate into English. Do NOT answer or summarize. If no speech is heard, output nothing. Output ONLY the verbatim spoken words."
      : "You are an expert speech recognition system. Listen to the audio and transcribe ONLY the human words spoken in English. STRICT RULES: Do NOT output timestamps (e.g. 0.02, 0:02), duration numbers, or speaker tags. Do NOT answer or summarize. If no speech is heard, output nothing. Output ONLY the verbatim spoken words.";

  const candidateModels = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ];

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Audio,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.0,
              maxOutputTokens: 250,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          const cleaned = cleanTranscription(text);
          if (cleaned) return cleaned;
        }
      }
    } catch {
      // try next model
    }
  }

  throw new Error(
    lang === "mr"
      ? "आवाज ओळखता आला नाही. कृपया प्रश्न टाईप करून विचारा."
      : "Could not transcribe audio. Please try typing your question."
  );
}

/**
 * Starts resilient speech recognition for English or Marathi.
 *
 * Runs MediaRecorder in a single continuous stream while trying Web Speech API.
 * If Web Speech API fails with 'network' error (Brave/privacy blocks), it seamlessly
 * transcribes using Gemini Flash without losing audio or showing network errors.
 */
export async function startSpeechRecognition(
  lang: SpeechLanguage,
  handlers: SpeechRecognitionHandlers
): Promise<() => Promise<void>> {
  stopSpeechRecognition();

  // 0. Pre-flight check: Verify browser Secure Context (W3C standard for microphone access)
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname);
    const currentHost = window.location.host;
    const port = window.location.port || "5173";

    if (isIp) {
      handlers.onError?.(
        lang === "mr"
          ? `ब्राउझरने मायक्रोफोन ब्लॉक केला आहे (Site Not Secure). तुम्ही IP ॲड्रेसवरून (${currentHost}) उघडले आहे. कृपया सुरक्षित URL http://localhost:${port} वर उघडा.`
          : `Microphone autoblocked: Your browser marked http://${currentHost} as "Not Secure" because it is an IP address. Browsers only grant microphone access on secure contexts. Please open http://localhost:${port} instead!`
      );
    } else {
      handlers.onError?.(
        lang === "mr"
          ? `ब्राउझरने मायक्रोफोन ब्लॉक केला आहे कारण वेबसाइट सुरक्षित (Not Secure) नाही. कृपया http://localhost:${port} वापरा.`
          : `Microphone autoblocked because the connection is marked "Not Secure". Please access the app via http://localhost:${port}.`
      );
    }
    handlers.onEnd?.();
    return async () => {};
  }

  let capturedAudioBlob: Blob | null = null;
  let webSpeechFinalResult = "";
  let webSpeechFailed = false;

  // 1. Start local MediaRecorder continuous stream
  if (isAudioCaptureSupported()) {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioChunks = [];

      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
      mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      // Start continuous recording without timeslice to prevent WebM header corruption
      recorder.start();
    } catch (err: any) {
      console.warn("getUserMedia failed:", err);
      const isPermissionDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        /permission/i.test(err?.message || "");

      if (isPermissionDenied) {
        handlers.onError?.(
          lang === "mr"
            ? "मायक्रोफोन परवानगी ब्लॉक केली आहे. कृपया ॲड्रेस बारमधील 🔒 आयकॉनवर क्लिक करून Microphone 'Allow' करा."
            : "Microphone permission is blocked. Click the lock/settings icon (🔒) in your browser address bar and set Microphone to 'Allow'."
        );
        handlers.onEnd?.();
        return async () => {};
      }

      if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        handlers.onError?.(
          lang === "mr"
            ? "मायक्रोफोन आढळला नाही. कृपया मायक्रोफोन कनेक्ट करा."
            : "No microphone detected. Please plug in or enable a microphone."
        );
        handlers.onEnd?.();
        return async () => {};
      }
    }
  }

  // 2. Concurrently attempt Web Speech API for real-time live preview
  if (isWebSpeechSupported()) {
    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false; // single utterance mode for precise sentence recognition
      recognition.interimResults = true;
      recognition.lang = lang === "mr" ? "mr-IN" : "en-IN";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        handlers.onStart?.();
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          if (item.isFinal) {
            final = transcript;
          } else {
            interim = transcript;
          }
        }

        if (interim && handlers.onInterim) {
          handlers.onInterim(interim);
        }

        if (final) {
          webSpeechFinalResult = final.trim();
          const clean = cleanTranscription(webSpeechFinalResult);
          if (clean) {
            handlers.onResult(clean);
          }
        }
      };

      recognition.onerror = (event: any) => {
        // Silently handle "network" or "service-not-allowed" errors by switching to Gemini Audio
        if (
          event.error === "network" ||
          event.error === "service-not-allowed" ||
          event.error === "audio-capture"
        ) {
          console.warn("Web Speech API network issue encountered. Seamlessly utilizing Gemini AI voice transcription.");
          webSpeechFailed = true;
          try {
            recognition.stop();
          } catch {}
          activeRecognition = null;
          handlers.onStatusChange?.(
            lang === "mr"
              ? "ऑडिओ रेकॉर्ड होत आहे… बोलणे झाल्यावर 'पूर्ण झाले' दाबा."
              : "Recording voice… Click 'Done' when finished."
          );
          return;
        }

        if (event.error === "no-speech") return;

        if (event.error === "not-allowed") {
          handlers.onError?.(
            lang === "mr"
              ? "मायक्रोफोन परवानगी ब्लॉक केली आहे. कृपया ॲड्रेस बारमधील 🔒 आयकॉनवर क्लिक करून Microphone 'Allow' करा."
              : "Microphone permission is blocked. Click the lock/settings icon (🔒) in your browser address bar and set Microphone to 'Allow'."
          );
          handlers.onEnd?.();
          return;
        }

        if (!mediaRecorder) {
          handlers.onError?.(
            lang === "mr"
              ? "मायक्रोफोन वापरता आला नाही. कृपया परवानगी तपासा."
              : `Microphone error: ${event.error}. Please check your browser microphone settings.`
          );
        }
      };

      recognition.onend = () => {
        activeRecognition = null;
      };

      recognition.start();
      activeRecognition = recognition;
    } catch {
      webSpeechFailed = true;
    }
  } else {
    webSpeechFailed = true;
  }

  handlers.onStart?.();

  // Stop function called when user finishes speaking or clicks "Done"
  const stopFn = async () => {
    // Stop Web Speech API
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch {}
      activeRecognition = null;
    }

    // Stop MediaRecorder and finalize audio
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      const recorder = mediaRecorder;

      const finishPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
            mediaStream = null;
          }

          if (audioChunks.length > 0) {
            capturedAudioBlob = new Blob(audioChunks, {
              type: recorder.mimeType || "audio/webm",
            });
            audioChunks = [];
          }
          resolve();
        };
      });

      try {
        recorder.stop();
      } catch {}
      mediaRecorder = null;

      await finishPromise;
    }

    // If Web Speech API produced a clean sentence without failing, use it!
    const cleanWebSpeech = cleanTranscription(webSpeechFinalResult);
    if (cleanWebSpeech && !webSpeechFailed) {
      handlers.onResult(cleanWebSpeech);
      handlers.onEnd?.();
      return;
    }

    // Otherwise, transcribe captured audio using Gemini Flash
    if (capturedAudioBlob && capturedAudioBlob.size > 2000) {
      handlers.onStatusChange?.(
        lang === "mr"
          ? "Gemini AI द्वारे आवाज रूपांतरित होत आहे…"
          : "Transcribing with Gemini AI…"
      );
      try {
        const geminiTranscript = await transcribeAudioWithGemini(capturedAudioBlob, lang);
        const cleanGemini = cleanTranscription(geminiTranscript);
        if (cleanGemini) {
          handlers.onResult(cleanGemini);
        }
      } catch (err: any) {
        handlers.onError?.(err?.message || "Transcription failed");
      }
    }

    handlers.onEnd?.();
  };

  return stopFn;
}

/**
 * Stops any active speech recognition or media recorder immediately.
 */
export function stopSpeechRecognition(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {}
    activeRecognition = null;
  }

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    try {
      mediaRecorder.stop();
    } catch {}
    mediaRecorder = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
}
