import { useState } from "react";
import { QUESTIONS } from "./data/questions";
import { fetchFeedback } from "./api/feedback";
import { useSpeech } from "./hooks/usespeech";
import FeedbackResult from "./components/FeedbackResult";

export default function App() {
  const [questionId, setQuestionId] = useState(QUESTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [apiError, setApiError] = useState("");

  const {
    supported,
    listening,
    transcript,
    setTranscript,
    error,
    start,
    stop,
  } = useSpeech();

  const question = QUESTIONS.find((q) => q.id === questionId);

  function selectQuestion(id) {
    if (listening) stop();
    setQuestionId(id);
    setTranscript("");
    setFeedback(null);
    setApiError("");
  }

  function handleStart() {
    setFeedback(null);
    setApiError("");
    start();
  }

  async function handleSubmit() {
    setLoading(true);
    setApiError("");
    setFeedback(null);

    try {
      const data = await fetchFeedback({
        question: question.text,
        transcript,
      });
      setFeedback(data);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
      <p className="tagline">
        Say it clear. Say it crisp. Say it in one breath.
      </p>

      <div className="chips picker">
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            className={`chip pick ${q.id === questionId ? "active" : ""}`}
            onClick={() => selectQuestion(q.id)}
          >
            {q.topic} · {q.level}
          </button>
        ))}
      </div>

      <h2 className="question">{question.text}</h2>

      <div className="actions">
        <button onClick={listening ? stop : handleStart}>
          {listening ? "Stop" : "Start speaking"}
        </button>
        <span className="status">{listening ? "Listening..." : "Mic off"}</span>
      </div>

      {error && <p className="error">{error}</p>}

      <textarea
        rows={5}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Speak, or type your answer here. You can edit the transcript before sending."
      />

      <button
        className="primary"
        onClick={handleSubmit}
        disabled={listening || loading || !transcript.trim()}
      >
        {loading ? "Thinking..." : "Get feedback"}
      </button>

      {apiError && <p className="error">{apiError}</p>}

      {feedback && (
        <FeedbackResult transcript={transcript} feedback={feedback} />
      )}
    </main>
  );
}
