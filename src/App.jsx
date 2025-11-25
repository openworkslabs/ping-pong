import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import GameScene from "./GameScene.jsx";

export default function App() {
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [resetSignal, setResetSignal] = useState(0);

    return (
        <div
            className="app-root"
            onClick={() => setResetSignal((s) => s + 1)}
            role="presentation"
        >
            <div className="overlay">
                <div>
                    <div className="title">First-Person Ping Pong</div>
                    <div className="hint">
                        Move mouse to control paddle. Click anywhere to restart.
                    </div>
                </div>
                <div className="right">
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
                        resetSignal={resetSignal}
                    />
                </Canvas>
            </div>
        </div>
    );
}


