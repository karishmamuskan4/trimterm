import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { QUESTIONS, topicSlug } from "../data/questions";
import { fetchFeedback } from "../api/feedback";
import { fetchTranscript } from "../api/transcribe";
import { useRecorder } from "../hooks/useRecorder";
import FeedbackResult from "../components/FeedbackResult";

function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const end = Date.now() + 1200;
  const colors = ["#7aa2ff", "#3ecf8e", "#ffd27a", "#ff6b6b", "#ffffff"];

  const burst = (particleCount, startVelocity, shapes) =>
    confetti({
      origin: { x: 0.4 + Math.random() * 0.2, y: 0.4 + Math.random() * 0.2 },
      spread: 360,
      particleCount,
      startVelocity,
      ticks: 280,
      gravity: 0.5,
      decay: 0.88,
      scalar: 1.1,
      zIndex: 1000,
      colors,
      shapes,
    });

  burst(160, 55, ["square", "circle"]);

  const timer = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(timer);
      return;
    }
    burst(
      50,
      25 + Math.random() * 20,
      Math.random() < 0.3 ? ["star"] : ["square", "circle"],
    );
  }, 350);
}

function PracticeSession({ question }) {
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

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
  const answerRef = useRef(null);

  useEffect(() => {
    const el = answerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [transcript]);
  useEffect(() => {
    if (result?.feedback.score === 10) celebrate();
  }, [result]);

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
    <main className="wide practice-page">
      <Link to={`/?topic=${topicSlug(question.topic)}`} className="back">
        ← All questions
      </Link>

      <div className="practice">
        <section className="panel">
          <span className={`level-badge ${question.level.toLowerCase()}`}>
            {question.topic} · {question.level}
          </span>
          <h1 className="practice-title">{question.text}</h1>

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
            ref={answerRef}
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
        </section>

        <section className="panel">
          <h2 className="panel-title">Feedback</h2>

          {result ? (
            <FeedbackResult
              transcript={result.transcript}
              feedback={result.feedback}
            />
          ) : (
            <div className="placeholder">
              <p className="placeholder-big">
                {loading
                  ? "Analyzing your answer..."
                  : "Your feedback shows up here"}
              </p>
              {!loading && (
                <p>Record or type an answer, then hit Get feedback.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function PracticePage() {
  const { id } = useParams();
  const question = QUESTIONS.find((q) => q.id === id);

  if (!question) {
    return (
      <main>
        <h1>Trimterm</h1>
        <p>That question doesn't exist.</p>
        <Link to="/" className="back">
          ← All questions
        </Link>
      </main>
    );
  }

  return <PracticeSession key={question.id} question={question} />;
}
