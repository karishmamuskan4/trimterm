import { useState } from "react";
import { QUESTIONS } from "./data/questions";
import { fetchFeedback } from "./api/feedback";

export default function App() {
  const [result, setResult] = useState("");

  async function runTest() {
    setResult("thinking...");
    try {
      const data = await fetchFeedback({
        question: QUESTIONS[2].text,
        transcript:
          "json web token which is used for authentication and cookies that is different for each and every browser",
      });
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Error: ${err.message}`);
    }
  }

  return (
    <main>
      <h1>trimterm</h1>
      <button onClick={runTest}>Test feedback</button>
      <pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
    </main>
  );
}
