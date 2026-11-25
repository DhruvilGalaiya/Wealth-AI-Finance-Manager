import "server-only";

// The FastAPI model service (api.py). In Docker this is http://ml-api:8000.
const BASE_URL = (process.env.PYTHON_API_URL || "http://localhost:8000").replace(/\/$/, "");
const TIMEOUT_MS = 4000;

// Returns parsed JSON, or null if the service is down/slow — callers must
// always have a fallback so the dashboard never breaks because of the ML API.
export async function callModel(path, body) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
