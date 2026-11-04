const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

function Highlighted({ text, hit, missed }) {
  const terms = [
    ...hit.map((t) => ({ t, cls: "hit" })),
    ...missed.map((t) => ({ t, cls: "missed" })),
  ].sort((a, b) => b.t.length - a.t.length);

  if (terms.length === 0) return text;

  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(${terms.map((x) => escape(x.t)).join("|")})`,
    "gi",
  );

  return text.split(pattern).map((part, i) => {
    const match = terms.find((x) => x.t.toLowerCase() === part.toLowerCase());
    return match ? (
      <mark key={i} className={`mark ${match.cls}`}>
        {part}
      </mark>
    ) : (
      part
    );
  });
}

export default function FeedbackResult({ transcript, feedback }) {
  const { tightAnswer, termsHit, termsMissed, factualIssues, score } = feedback;

  return (
    <section className="result">
      <div className="score">Score: {score}/10</div>

      <div className="compare">
        <div className="box">
          <h3>Your answer</h3>
          <p>{transcript}</p>
          <small>{countWords(transcript)} words</small>
        </div>
        <div className="box tight">
          <h3>Tight answer</h3>
          <p>
            <Highlighted
              text={tightAnswer}
              hit={termsHit}
              missed={termsMissed}
            />
          </p>
          <small>{countWords(tightAnswer)} words</small>
        </div>
      </div>

      {termsHit.length > 0 && (
        <div className="group">
          <h3>Terms you hit</h3>
          <div className="chips">
            {termsHit.map((term) => (
              <span key={term} className="chip hit">
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {termsMissed.length > 0 && (
        <div className="group">
          <h3>Terms to use next time</h3>
          <div className="chips">
            {termsMissed.map((term) => (
              <span key={term} className="chip missed">
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {factualIssues.length > 0 && (
        <div className="group">
          <h3>Check this</h3>
          <ul className="issues">
            {factualIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
