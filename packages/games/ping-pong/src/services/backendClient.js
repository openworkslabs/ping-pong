const DEFAULT_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "");

const base =
  typeof DEFAULT_BASE === "string"
    ? DEFAULT_BASE.replace(/\/$/, "")
    : "";

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!base || base === "" || base === ".") {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}

async function request(path, { method = "GET", body, headers } = {}) {
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const res = await fetch(buildUrl(path), init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

export function fetchConfig() {
  return request("/api/config");
}

export function fetchLeaderboard() {
  return request("/api/leaderboard");
}

export function submitScore(entry) {
  return request("/api/score", { method: "POST", body: entry });
}

export function postEvent(payload) {
  return request("/api/event", { method: "POST", body: payload });
}

