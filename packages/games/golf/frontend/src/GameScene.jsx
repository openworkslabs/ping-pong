import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, Plane, Sphere } from '@react-three/drei'
import { useState, useRef } from 'react'
import * as THREE from 'three'

function GolfCourse({ onHit }) {
  const [ballPosition, setBallPosition] = useState([0, 0.5, 0])
  const [power, setPower] = useState(0)
  const [angle, setAngle] = useState(0)
  const [isCharging, setIsCharging] = useState(false)

  const handleClick = () => {
    if (isCharging) {
      onHit(power, angle)
      setPower(0)
      setIsCharging(false)
    } else {
      setIsCharging(true)
    }
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="green" />
      </Plane>

      <Box args={[2, 0.1, 2]} position={[20, 0.05, 0]}>
        <meshStandardMaterial color="darkgreen" />
      </Box>

      <Sphere args={[0.2]} position={ballPosition}>
        <meshStandardMaterial color="white" />
      </Sphere>

      {isCharging && (
        <mesh position={[ballPosition[0], 0.1, ballPosition[2]]}>
          <ringGeometry args={[1, 1.2, 32]} />
          <meshBasicMaterial color="yellow" opacity={power / 100} transparent />
        </mesh>
      )}
    </>
  )
}

function GameScene({ config, onGameOver, currentHole, setCurrentHole, score, setScore }) {
  const handleHit = (power, angle) => {
    setScore(score + 1)

    if (currentHole >= 18) {
      onGameOver(score + 1)
    } else {
      setCurrentHole(currentHole + 1)
    }
  }

  return (
    <Canvas camera={{ position: [0, 10, 20], fov: 60 }}>
      <GolfCourse onHit={handleHit} />
      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={10}
        maxDistance={50}
      />
    </Canvas>
  )
}

export default GameScene