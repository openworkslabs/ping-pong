import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const FIELD = {
  width: 8,
  height: 6,
  depth: 20,
};

const GRAVITY = -18; // downward acceleration for the ball (units per second^2)

function Arena() {
  const { width, depth } = FIELD;

  const tableColor = 0x1d4ed8; // bright-ish blue table
  const wallColor = 0x0f172a; // dark walls for contrast

  return (
    <group>
      {/* Table top */}
      <mesh position={[0, -1.2, -depth / 2 - 2]}>
        <boxGeometry args={[width * 0.9, 0.2, depth * 0.6]} />
        <meshStandardMaterial color={tableColor} metalness={0.2} roughness={0.4} />
      </mesh>

      {/* Table edge lines */}
      <mesh position={[0, -1.09, -depth / 2 - 2]}>
        <boxGeometry args={[width * 0.9 * 0.98, 0.01, depth * 0.6 * 0.98]} />
        <meshStandardMaterial color={0xe5e7eb} roughness={0.9} />
      </mesh>

      {/* Net with white borders */}
      <group position={[0, -0.9, -depth / 2 - 2]}>
        {/* Net body */}
        <mesh>
          <boxGeometry args={[width * 0.9, 0.4, 0.05]} />
          <meshStandardMaterial
            color={0x38bdf8}
            emissive={0x0ea5e9}
            emissiveIntensity={0.7}
            roughness={0.3}
          />
        </mesh>
        {/* Top white border */}
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[width * 0.9, 0.04, 0.06]} />
          <meshStandardMaterial color={0xf9fafb} roughness={0.5} />
        </mesh>
        {/* Bottom white border */}
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[width * 0.9, 0.03, 0.06]} />
          <meshStandardMaterial color={0xe5e7eb} roughness={0.6} />
        </mesh>
        {/* Side posts */}
        <mesh position={[-(width * 0.9) / 2, 0, 0]}>
          <boxGeometry args={[0.04, 0.5, 0.07]} />
          <meshStandardMaterial color={0xf9fafb} roughness={0.4} />
        </mesh>
        <mesh position={[(width * 0.9) / 2, 0, 0]}>
          <boxGeometry args={[0.04, 0.5, 0.07]} />
          <meshStandardMaterial color={0xf9fafb} roughness={0.4} />
        </mesh>
      </group>

      {/* Simple bright room walls */}
      <mesh position={[0, -2, -depth / 2 - 2]}>
        <boxGeometry args={[width * 1.6, 0.4, depth * 0.9]} />
        <meshStandardMaterial color={0x111827} roughness={0.9} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 0.2, -depth - 5]}>
        <boxGeometry args={[width * 1.6, 5, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-width * 0.9, 0.2, -depth / 2 - 4]}>
        <boxGeometry args={[0.2, 5, depth * 0.9]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[width * 0.9, 0.2, -depth / 2 - 4]}>
        <boxGeometry args={[0.2, 5, depth * 0.9]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Lights() {
  return (
    <>
      {/* Brighter ambient fill */}
      <ambientLight intensity={0.55} />
      {/* Overhead light simulating indoor hall */}
      <directionalLight intensity={1.1} position={[0, 6, -4]} />
      {/* Soft colored fill from table */}
      <hemisphereLight skyColor={0x38bdf8} groundColor={0x0f172a} intensity={0.4} />
    </>
  );
}

export default function GameScene({ onScoreChange, onSpeedChange, onGameOver, resetSignal }) {
  const { camera } = useThree();
  const paddleRef = useRef();
  const ballRef = useRef();
  const ballVelocity = useRef(new THREE.Vector3(0, 0, -8));
  const mouseNDC = useRef({ x: 0, y: 0 });
  const runningRef = useRef(true);
  const scoreRef = useRef(0);

  // Set a slightly higher, angled camera POV looking down the table
  useEffect(() => {
    camera.position.set(0, 1.5, 1.2);
    camera.lookAt(0, -0.5, -6);
  }, [camera]);

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
    paddleRef.current.position.x += (targetX - paddleRef.current.position.x) * lerpFactor;
    paddleRef.current.position.y += (targetY - paddleRef.current.position.y) * lerpFactor;

    // Ball / physics
    if (!runningRef.current) return;

    // Apply gravity to the ball
    ballVelocity.current.y += GRAVITY * delta;

    const nextPos = ballRef.current.position.clone().addScaledVector(ballVelocity.current, delta);

    const halfW = width / 2;

    // Side wall collisions (left/right)
    if (nextPos.x <= -halfW || nextPos.x >= halfW) {
      ballVelocity.current.x *= -1;
    }

    // Table collision (bounce off top surface, no ceiling)
    const ballRadius = 0.25;
    const tableTopY = -1.1;
    const tableCenterZ = -depth / 2 - 2;
    const tableHalfZ = (depth * 0.6) / 2;
    const tableHalfX = (width * 0.9) / 2;

    const overTableX = nextPos.x >= -tableHalfX && nextPos.x <= tableHalfX;
    const overTableZ =
      nextPos.z >= tableCenterZ - tableHalfZ && nextPos.z <= tableCenterZ + tableHalfZ;

    if (
      ballVelocity.current.y < 0 && // moving downward
      ballRef.current.position.y - ballRadius >= tableTopY && // above table this frame
      nextPos.y - ballRadius <= tableTopY && // will cross table plane
      overTableX &&
      overTableZ
    ) {
      // Reflect with slight damping for a realistic bounce
      ballVelocity.current.y *= -0.85;
      // Nudge ball just above the surface to avoid sticking
      ballRef.current.position.y = tableTopY + ballRadius + 0.001;
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

    const ballNextBounds = {
      minX: nextPos.x - ballRadius,
      maxX: nextPos.x + ballRadius,
      minY: nextPos.y - ballRadius,
      maxY: nextPos.y + ballRadius,
      minZ: nextPos.z - ballRadius,
      maxZ: nextPos.z + ballRadius,
    };

    const overlapX =
      ballNextBounds.maxX >= paddleBounds.minX && ballNextBounds.minX <= paddleBounds.maxX;
    const overlapY =
      ballNextBounds.maxY >= paddleBounds.minY && ballNextBounds.minY <= paddleBounds.maxY;
    const overlapZ =
      ballNextBounds.maxZ >= paddleBounds.minZ && ballNextBounds.minZ <= paddleBounds.maxZ;

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
      if (runningRef.current && typeof onGameOver === "function") {
        onGameOver(scoreRef.current);
      }
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
      <group ref={paddleRef} position={[0, -0.6, -3.4]} rotation={[-Math.PI / 18, 0, 0]}>
        {/* Head (flipped so the face points toward the ball) */}
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.9, 1.15, 1]}>
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
        <mesh position={[0, -0.58, 0.1]}>
          <boxGeometry args={[0.35, 1.1, 0.18]} />
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
