import { useCallback, useEffect, useRef, useState } from "react";

const TARGET_RATE = 16000;
const MAX_SECONDS = 45;
const MIN_SECONDS = 1;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;

const MIC_ERRORS = {
  NotAllowedError:
    "Mic permission denied. Allow it in your browser's site settings.",
  NotFoundError: "No microphone found.",
  NotReadableError: "Your microphone is being used by another app.",
};

function downsample(samples, fromRate, toRate) {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const length = Math.floor(samples.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function encodeWav(samples, rate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useRecorder({ onFinish }) {
  const supported = Boolean(
    navigator.mediaDevices?.getUserMedia && AudioContextClass,
  );
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const sessionRef = useRef(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const cleanup = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    clearInterval(session.timer);
    session.processor.onaudioprocess = null;
    session.processor.disconnect();
    session.source.disconnect();
    session.stream.getTracks().forEach((track) => track.stop());
    session.context.close();
    sessionRef.current = null;
  }, []);

  const finish = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    const { chunks, context } = session;
    const rate = context.sampleRate;
    cleanup();
    setRecording(false);
    setSeconds(0);

    const total = chunks.reduce((n, chunk) => n + chunk.length, 0);
    if (total / rate < MIN_SECONDS) {
      setError("Too short. Record a little longer and speak up.");
      return;
    }

    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const wav = encodeWav(downsample(merged, rate, TARGET_RATE), TARGET_RATE);
    onFinishRef.current?.(await blobToBase64(wav));
  }, [cleanup]);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    setError("");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (err) {
      setError(MIC_ERRORS[err.name] || "Couldn't access the microphone.");
      return;
    }

    const context = new AudioContextClass();
    if (context.state === "suspended") await context.resume();

    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const chunks = [];

    processor.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };

    source.connect(processor);
    processor.connect(context.destination);

    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) finish();
    }, 250);

    sessionRef.current = { stream, context, source, processor, chunks, timer };
    setRecording(true);
  }, [finish]);

  useEffect(() => cleanup, [cleanup]);

  return { supported, recording, seconds, error, start, stop: finish };
}
