import { useCallback, useEffect, useRef, useState } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const ERROR_MESSAGES = {
  "not-allowed":
    "Mic permission denied. Allow it in your browser's site settings.",
  "service-not-allowed": "Speech service blocked by the browser.",
  "no-speech": "Didn't hear anything. Try again.",
  "audio-capture": "No microphone found.",
  network: "Speech service unreachable. Check your internet.",
};

const FATAL_ERRORS = ["not-allowed", "service-not-allowed", "audio-capture"];

export function useSpeech() {
  const recognitionRef = useRef(null);
  const wantedRef = useRef(false);
  const baseRef = useRef("");
  const latestRef = useRef("");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const supported = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!supported) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let session = "";
      for (let i = 0; i < event.results.length; i++) {
        session += event.results[i][0].transcript;
      }
      const full = `${baseRef.current} ${session}`.trim();
      latestRef.current = full;
      setTranscript(full);
    };

    recognition.onerror = (event) => {
      if (FATAL_ERRORS.includes(event.error)) wantedRef.current = false;
      if (event.error !== "no-speech") {
        setError(ERROR_MESSAGES[event.error] || `Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (wantedRef.current) {
        // Chrome ended the session on its own: keep the text and restart
        baseRef.current = latestRef.current;
        try {
          recognition.start();
        } catch {
          wantedRef.current = false;
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      wantedRef.current = false;
      recognition.abort();
    };
  }, [supported]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError("");
    setTranscript("");
    baseRef.current = "";
    latestRef.current = "";
    wantedRef.current = true;
    try {
      recognitionRef.current.start();
    } catch {
      // already running; safe to ignore
    }
  }, []);

  const stop = useCallback(() => {
    wantedRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  return {
    supported,
    listening,
    transcript,
    setTranscript,
    error,
    start,
    stop,
  };
}
