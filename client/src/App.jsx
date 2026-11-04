import { useState } from "react";
import { QUESTIONS } from "./data/questions.js";
import { fetchFeedback } from "./api/feedback";
import { fetchTranscript } from "./api/transcribe";
import { useRecorder } from "./hooks/useRecorder";
import FeedbackResult from "./components/FeedbackResult";

export default function App() {
  const [questionId, setQuestionId] = useState(QUESTIONS[0].id);
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

  const question = QUESTIONS.find((q) => q.id === questionId);

  const { supported, recording, seconds, error, start, stop } = useRecorder({
    onFinish: async (audio) => {
      setTranscribing(true);
      try {
        const text = await fetchTranscript({ question: question.text, audio });
        setTranscript(text);
      } catch (err) {
        setApiError(`${err.message} You can type your answer instead.`);
      } finally {
        setTranscribing(false);
      }
    },
  });

  const busy = recording || transcribing || loading;

  function selectQuestion(id) {
    setQuestionId(id);
    setTranscript("");
    setResult(null);
    setApiError("");
  }

  function handleStart() {
    setResult(null);
    setApiError("");
    start();
  }

  async function handleSubmit() {
    setLoading(true);
    setApiError("");
    setResult(null);

    try {
      const feedback = await fetchFeedback({
        question: question.text,
        transcript,
      });
      setResult({ feedback, transcript });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>trimterm</h1>
      <p className="tagline">
        Say it clear. Say it crisp. Say it in one breath.
      </p>

      <div className="chips picker">
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            className={`chip pick ${q.id === questionId ? "active" : ""}`}
            onClick={() => selectQuestion(q.id)}
            disabled={busy}
          >
            {q.topic} · {q.level}
          </button>
        ))}
      </div>

      <h2 className="question">{question.text}</h2>

      {supported ? (
        <div className="actions">
          <button
            onClick={recording ? stop : handleStart}
            disabled={transcribing || loading}
          >
            {recording ? "Stop" : "Start recording"}
          </button>
          {recording && (
            <span className="rec">
              <span className="rec-dot" /> Recording... {seconds}s
            </span>
          )}
          {transcribing && <span className="status">Transcribing...</span>}
        </div>
      ) : (
        <p className="status">
          Mic recording isn't available here (it needs a current browser on
          HTTPS or localhost). You can type your answer below.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <textarea
        rows={5}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        disabled={transcribing}
        placeholder="Record your answer, or type it here. You can edit the transcript before sending."
      />

      <button
        className="primary"
        onClick={handleSubmit}
        disabled={busy || !transcript.trim()}
      >
        {loading ? "Thinking..." : "Get feedback"}
      </button>

      {apiError && <p className="error">{apiError}</p>}

      {result && (
        <FeedbackResult
          transcript={result.transcript}
          feedback={result.feedback}
        />
      )}
    </main>
  );
}
