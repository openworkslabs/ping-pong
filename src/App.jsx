import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import GameScene from "./GameScene.jsx";
import {
  fetchConfig,
  fetchLeaderboard,
  submitScore,
} from "./services/backendClient.js";

export default function App() {
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [playerName, setPlayerName] = useState("Anonymous");
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);
  const [config, setConfig] = useState(null);
  const playerIdRef = useRef("");

  const ensurePlayerId = useCallback(() => {
    if (playerIdRef.current) {
      return playerIdRef.current;
    }
    const cryptoRef = typeof window !== "undefined" ? window.crypto : undefined;
    const fallback =
      (cryptoRef?.randomUUID?.() ||
        `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`) ??
      `${Date.now()}`;
    playerIdRef.current = fallback;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fp-pp-player-id", fallback);
      }
    } catch {
      // Ignore storage issues; ID will be regenerated next time.
    }
    return fallback;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedName = window.localStorage.getItem("fp-pp-player-name");
      if (storedName) {
        setPlayerName(storedName);
      }
      const storedId = window.localStorage.getItem("fp-pp-player-id");
      if (storedId) {
        playerIdRef.current = storedId;
      } else {
        ensurePlayerId();
      }
    } catch {
      ensurePlayerId();
    }
  }, [ensurePlayerId]);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await fetchConfig();
      setConfig(cfg);
    } catch (err) {
      // Non-blocking; surface minimal info.
      console.warn("Failed to load config", err);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const data = await fetchLeaderboard();
      if (Array.isArray(data)) {
        setLeaderboard(data);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      setLeaderboardError(err.message || "Unable to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadLeaderboard();
  }, [loadConfig, loadLeaderboard]);

  const handleNameChange = (event) => {
    const value = event.target.value.slice(0, 24);
    setPlayerName(value);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fp-pp-player-name", value);
      }
    } catch {
      // ignore storage failures
    }
  };

  const handleGameOver = useCallback(
    async (finalScore) => {
      if (!finalScore || finalScore <= 0) {
        return;
      }
      setSubmittingScore(true);
      setSubmissionStatus("Submitting score...");
      try {
        const playerId = ensurePlayerId();
        const payload = {
          playerId,
          name: playerName.trim() || "Anonymous",
          score: finalScore,
        };
        await submitScore(payload);
        setSubmissionStatus("Score saved! Thanks for playing.");
        await loadLeaderboard();
      } catch (err) {
        setSubmissionStatus(
          err?.message ? `Failed to submit score: ${err.message}` : "Score failed to submit."
        );
      } finally {
        setSubmittingScore(false);
      }
    },
    [ensurePlayerId, playerName, loadLeaderboard]
  );

  const leaderboardEntries = leaderboard.slice(0, 5);

  return (
    <div
      className="app-root"
      onClick={() => setResetSignal((s) => s + 1)}
      role="presentation"
    >
      <div className="overlay">
        <div className="overlay-left">
          <div>
            <div className="title">First-Person Ping Pong</div>
            <div className="hint">
              Move mouse to control paddle. Click anywhere to restart.
            </div>
          </div>
          <div
            className="hud-panel leaderboard-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">Leaderboard</div>
            <label className="form-label" htmlFor="player-name">
              Player name
            </label>
            <input
              id="player-name"
              className="text-input"
              value={playerName}
              onChange={handleNameChange}
              placeholder="Anonymous"
            />
            <div className="leaderboard-actions">
              <button
                type="button"
                onClick={loadLeaderboard}
                disabled={leaderboardLoading}
              >
                {leaderboardLoading ? "Refreshing..." : "Refresh"}
              </button>
              {config ? (
                <span className="config-pill">
                  {config.difficulty} • Gravity {config.gravity}
                </span>
              ) : (
                <span className="config-pill muted">Connecting to API…</span>
              )}
            </div>
            <ol className="leaderboard-list">
              {leaderboardEntries.length === 0 && !leaderboardLoading ? (
                <li className="leaderboard-empty">No scores submitted yet.</li>
              ) : (
                leaderboardEntries.map((entry, index) => (
                  <li key={entry.id ?? `${entry.name}-${index}`}>
                    <span className="rank">{index + 1}</span>
                    <span className="name">{entry.name}</span>
                    <span className="score">{entry.score}</span>
                  </li>
                ))
              )}
            </ol>
            {leaderboardError && (
              <div className="status-line error">{leaderboardError}</div>
            )}
            {submissionStatus && (
              <div className="status-line">{submissionStatus}</div>
            )}
            {submittingScore && (
              <div className="status-line muted">
                We’ll save your next score after this rally.
              </div>
            )}
          </div>
        </div>
        <div className="right score-panel">
          <div>Score: {score}</div>
          <div>Speed: {speed.toFixed(1)}</div>
        </div>
      </div>

      <div className="canvas-container">
        <Canvas
          camera={{ fov: 70, near: 0.1, far: 100, position: [0, 0, 0] }}
        >
          <GameScene
            onScoreChange={setScore}
            onSpeedChange={setSpeed}
            onGameOver={handleGameOver}
            resetSignal={resetSignal}
          />
        </Canvas>
      </div>
    </div>
  );
}
