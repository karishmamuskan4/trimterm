import { useSpeech } from "./hooks/usespeech";

export default function App() {
  const {
    supported,
    listening,
    transcript,
    setTranscript,
    error,
    start,
    stop,
  } = useSpeech();

  if (!supported) {
    return (
      <main>
        <h1>trimterm</h1>
        <p>
          This browser doesn't support speech recognition. Open it in Chrome or
          Edge.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>trimterm</h1>
      <button onClick={listening ? stop : start}>
        {listening ? "Stop" : "Start speaking"}
      </button>
      <p>{listening ? "Listening..." : "Mic off"}</p>
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      <textarea
        rows={6}
        style={{ width: "100%" }}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Your transcript shows up here. You can edit it."
      />
    </main>
  );
}
