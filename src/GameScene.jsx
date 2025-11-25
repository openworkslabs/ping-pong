import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const FIELD = {
  width: 8,
  height: 6,
  depth: 20,
};

function Arena() {
  const { width, height, depth } = FIELD;

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.2,
    roughness: 0.7,
    transparent: true,
    opacity: 0.8,
  });

  return (
    <group>
      {/* Floor */}
      <mesh
        position={[0, -height / 2, -depth / 2 - 4]}
        geometry={new THREE.BoxGeometry(width, 0.2, depth)}
        material={wallMaterial}
      />
      {/* Ceiling */}
      <mesh
        position={[0, height / 2, -depth / 2 - 4]}
        geometry={new THREE.BoxGeometry(width, 0.2, depth)}
        material={wallMaterial}
      />
      {/* Left */}
      <mesh
        position={[-width / 2, 0, -depth / 2 - 4]}
        geometry={new THREE.BoxGeometry(0.2, height, depth)}
        material={wallMaterial}
      />
      {/* Right */}
      <mesh
        position={[width / 2, 0, -depth / 2 - 4]}
        geometry={new THREE.BoxGeometry(0.2, height, depth)}
        material={wallMaterial}
      />
      {/* Back wall */}
      <mesh
        position={[0, 0, -depth - 4]}
        geometry={new THREE.BoxGeometry(width, height, 0.2)}
        material={wallMaterial}
      />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight intensity={0.9} position={[3, 5, 5]} />
    </>
  );
}

export default function GameScene({
  onScoreChange,
  onSpeedChange,
  resetSignal,
}) {
  const paddleRef = useRef();
  const ballRef = useRef();
  const ballVelocity = useRef(new THREE.Vector3(0, 0, -8));
  const mouseNDC = useRef({ x: 0, y: 0 });
  const runningRef = useRef(true);
  const scoreRef = useRef(0);

  const resetBall = () => {
    if (!ballRef.current) return;
    scoreRef.current = 0;
    onScoreChange(0);

    ballRef.current.position.set(0, 0, -6);
    const speed = 10;
    const angleX = (Math.random() - 0.5) * 0.8;
    const angleY = (Math.random() - 0.5) * 0.8;
    const dir = new THREE.Vector3(angleX, angleY, 1).normalize();
    ballVelocity.current.copy(dir.multiplyScalar(speed));
    runningRef.current = true;
  };

  // Reset when the signal changes (click anywhere)
  useEffect(() => {
    resetBall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // Track mouse globally in NDC
  useEffect(() => {
    function onMouseMove(event) {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseNDC.current.x = x;
      mouseNDC.current.y = y;
    }
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useFrame((_, delta) => {
    if (!paddleRef.current || !ballRef.current) return;

    const { width, height, depth } = FIELD;

    // Update paddle
    const targetX = mouseNDC.current.x * (width * 0.35);
    const targetY = mouseNDC.current.y * (height * 0.25) - 0.8;
    const lerpFactor = Math.min(1, delta * 10);
    paddleRef.current.position.x +=
      (targetX - paddleRef.current.position.x) * lerpFactor;
    paddleRef.current.position.y +=
      (targetY - paddleRef.current.position.y) * lerpFactor;

    // Ball / physics
    if (!runningRef.current) return;

    const nextPos = ballRef.current.position
      .clone()
      .addScaledVector(ballVelocity.current, delta);

    const halfW = width / 2;
    const halfH = height / 2;

    // Wall collisions
    if (nextPos.x <= -halfW || nextPos.x >= halfW) {
      ballVelocity.current.x *= -1;
    }
    if (nextPos.y <= -halfH || nextPos.y >= halfH) {
      ballVelocity.current.y *= -1;
    }

    // Paddle collision
    const paddle = paddleRef.current;
    const paddleBounds = {
      // Approximate circular head + short handle as a square for collision
      minX: paddle.position.x - 0.9,
      maxX: paddle.position.x + 0.9,
      minY: paddle.position.y - 0.9,
      maxY: paddle.position.y + 0.9,
      minZ: paddle.position.z - 0.4,
      maxZ: paddle.position.z + 0.4,
    };

    const ballRadius = 0.25;
    const ballNextBounds = {
      minX: nextPos.x - ballRadius,
      maxX: nextPos.x + ballRadius,
      minY: nextPos.y - ballRadius,
      maxY: nextPos.y + ballRadius,
      minZ: nextPos.z - ballRadius,
      maxZ: nextPos.z + ballRadius,
    };

    const overlapX =
      ballNextBounds.maxX >= paddleBounds.minX &&
      ballNextBounds.minX <= paddleBounds.maxX;
    const overlapY =
      ballNextBounds.maxY >= paddleBounds.minY &&
      ballNextBounds.minY <= paddleBounds.maxY;
    const overlapZ =
      ballNextBounds.maxZ >= paddleBounds.minZ &&
      ballNextBounds.minZ <= paddleBounds.maxZ;

    if (overlapX && overlapY && overlapZ && ballVelocity.current.z > 0) {
      ballVelocity.current.z *= -1;

      const offsetX = nextPos.x - paddle.position.x;
      const offsetY = nextPos.y - paddle.position.y;
      ballVelocity.current.x += offsetX * 4;
      ballVelocity.current.y += offsetY * 4;

      ballVelocity.current.multiplyScalar(1.03);

      scoreRef.current += 1;
      onScoreChange(scoreRef.current);
    }

    // Game over if ball passes player
    if (nextPos.z > 2) {
      runningRef.current = false;
    }

    // Clamp depth
    if (nextPos.z < -depth - 6) {
      ballVelocity.current.z *= -1;
    }

    ballRef.current.position.addScaledVector(ballVelocity.current, delta);

    // Speed for UI
    onSpeedChange(ballVelocity.current.length());
  });

  return (
    <>
      <Lights />
      <Arena />

      {/* Paddle - stylized ping pong bat */}
      <group
        ref={paddleRef}
        position={[0, -0.3, -3.4]}
        rotation={[-Math.PI / 18, 0, 0]}
      >
        {/* Head (flipped so the face points toward the ball) */}
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.12, 32]} />
          <meshStandardMaterial
            color={0xdc2626}
            metalness={0.2}
            roughness={0.5}
            emissive={0x220000}
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Handle, attached to the bottom of the head */}
        <mesh position={[0, -0.45, 0.1]}>
          <boxGeometry args={[0.35, 1.0, 0.18]} />
          <meshStandardMaterial
            color={0xf59e0b}
            metalness={0.1}
            roughness={0.8}
            emissive={0x1a1206}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Ball */}
      <mesh ref={ballRef} position={[0, 0, -6]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={0xf97316}
          metalness={0.4}
          roughness={0.3}
          emissive={0x1f2937}
          emissiveIntensity={0.6}
        />
      </mesh>
    </>
  );
}


