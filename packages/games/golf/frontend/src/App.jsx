import { useState, useEffect } from 'react'
import GameScene from './GameScene'
import { backendClient } from './services/backendClient'

function App() {
  const [gameState, setGameState] = useState('menu')
  const [config, setConfig] = useState(null)
  const [score, setScore] = useState(0)
  const [currentHole, setCurrentHole] = useState(1)

  useEffect(() => {
    backendClient.getConfig().then(setConfig)
  }, [])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setCurrentHole(1)
  }

  const endGame = (finalScore) => {
    setScore(finalScore)
    setGameState('gameover')
    backendClient.submitScore({
      name: 'Player',
      score: finalScore,
      holes: 18,
      par: 72
    })
  }

  if (!config) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="game-container">
      {gameState === 'menu' && (
        <div className="menu">
          <h1>Golf Game</h1>
          <button onClick={startGame} className="play-button">
            Play
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div className="game-ui">
            <div className="score">Hole: {currentHole}/18</div>
            <div className="score">Score: {score}</div>
          </div>
          <GameScene
            config={config}
            onGameOver={endGame}
            currentHole={currentHole}
            setCurrentHole={setCurrentHole}
            score={score}
            setScore={setScore}
          />
        </>
      )}

      {gameState === 'gameover' && (
        <div className="gameover">
          <h1>Game Over!</h1>
          <p>Final Score: {score}</p>
          <button onClick={startGame} className="play-button">
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default App