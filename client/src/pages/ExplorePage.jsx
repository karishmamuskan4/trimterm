import { Link, useSearchParams } from "react-router-dom";
import { LEVELS, QUESTIONS, topicSlug } from "../data/questions";

const TOPICS = [...new Set(QUESTIONS.map((q) => q.topic))];

const LEVEL_BLURBS = {
  Basic: "Core definitions. Nail these in one sentence.",
  Medium: "Where interviewers start probing.",
  Hard: "Depth and trade-offs.",
};

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const topic =
    TOPICS.find((t) => topicSlug(t) === params.get("topic")) ?? TOPICS[0];
  const inTopic = QUESTIONS.filter((q) => q.topic === topic);

  return (
    <main className="wide">
      <header className="hero">
        <h1>Trimterm</h1>
        <p className="tagline">Know it. Say it sharp.</p>
      </header>

      <section className="topic-section">
        <p className="step-label">Step 1 · Choose a topic</p>
        <nav className="topic-bar" aria-label="Topics">
          {TOPICS.map((t) => (
            <button
              key={t}
              className={`topic-pill ${t === topic ? "active" : ""}`}
              onClick={() =>
                setParams({ topic: topicSlug(t) }, { replace: true })
              }
            >
              <span>{t}</span>
              <span className="topic-count">
                {QUESTIONS.filter((q) => q.topic === t).length}
              </span>
            </button>
          ))}
        </nav>
      </section>

      <section className="questions-section">
        <p className="step-label">Step 2 · Pick a question to practice</p>
        <h2 className="topic-title">
          {topic}
          <span>{inTopic.length} questions</span>
        </h2>

        <div className="levels">
          {LEVELS.map((level) => {
            const items = inTopic.filter((q) => q.level === level);

            return (
              <section key={level} className={`level ${level.toLowerCase()}`}>
                <div className="level-head">
                  <h3>{level}</h3>
                  <span className="count">
                    {items.length}{" "}
                    {items.length === 1 ? "question" : "questions"}
                  </span>
                </div>
                <p className="level-blurb">{LEVEL_BLURBS[level]}</p>

                {items.length === 0 ? (
                  <p className="empty">Coming soon</p>
                ) : (
                  <div className="q-grid">
                    {items.map((q, i) => (
                      <Link
                        key={q.id}
                        to={`/practice/${q.id}`}
                        className="q-card"
                      >
                        <span className="q-num">{i + 1}</span>
                        <span className="q-text">{q.text}</span>
                        <span className="q-go">Practice →</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
