const API_URL = import.meta.env.VITE_API_URL;

export async function fetchTranscript({ question, audio }) {
  let res;

  try {
    res = await fetch(`${API_URL}/api/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, audio }),
    });
  } catch {
    throw new Error("Can't reach the server. Is it running?");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data.transcript;
}
