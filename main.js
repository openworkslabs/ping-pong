// Basic first-person ping pong prototype using Three.js

let scene, camera, renderer;
let paddle, ball;
let walls = [];

const state = {
    running: true,
    score: 0,
    ballVelocity: new THREE.Vector3(0, 0, -8),
    // Playfield dimensions in world space
    field: {
        width: 8,
        height: 6,
        depth: 20,
    },
    // Mouse position in normalized device coordinates
    mouseNDC: { x: 0, y: 0 },
};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060a);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
    camera.position.set(0, 0, 0);
    camera.lookAt(new THREE.Vector3(0, 0, -10));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    setupLights();
    setupArena();
    setupPaddle();
    setupBall();

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", resetBall);

    animate();
}

function setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 5, 5);
    scene.add(dir);
}

function setupArena() {
    const { width, height, depth } = state.field;

    // Visual floor/ceiling/walls (thin boxes)
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.2,
        roughness: 0.7,
        transparent: true,
        opacity: 0.8,
    });

    const wallGeoH = new THREE.BoxGeometry(width, 0.2, depth);
    const wallGeoV = new THREE.BoxGeometry(0.2, height, depth);

    const floor = new THREE.Mesh(wallGeoH, wallMaterial);
    floor.position.set(0, -height / 2, -depth / 2 - 4);
    scene.add(floor);
    walls.push({ type: "floor", y: -height / 2 });

    const ceiling = new THREE.Mesh(wallGeoH, wallMaterial);
    ceiling.position.set(0, height / 2, -depth / 2 - 4);
    scene.add(ceiling);
    walls.push({ type: "ceiling", y: height / 2 });

    const left = new THREE.Mesh(wallGeoV, wallMaterial);
    left.position.set(-width / 2, 0, -depth / 2 - 4);
    scene.add(left);
    walls.push({ type: "left", x: -width / 2 });

    const right = new THREE.Mesh(wallGeoV, wallMaterial);
    right.position.set(width / 2, 0, -depth / 2 - 4);
    scene.add(right);
    walls.push({ type: "right", x: width / 2 });

    // Back wall (opponent side) just as visual
    const backGeo = new THREE.BoxGeometry(width, height, 0.2);
    const back = new THREE.Mesh(backGeo, wallMaterial);
    back.position.set(0, 0, -depth - 4);
    scene.add(back);
}

function setupPaddle() {
    const paddleGeo = new THREE.BoxGeometry(2, 1, 0.3);
    const paddleMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.3,
        roughness: 0.4,
        emissive: 0x0f172a,
        emissiveIntensity: 0.5,
    });

    paddle = new THREE.Mesh(paddleGeo, paddleMat);
    paddle.position.set(0, 0, -3);
    scene.add(paddle);
}

function setupBall() {
    const ballGeo = new THREE.SphereGeometry(0.25, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        metalness: 0.4,
        roughness: 0.3,
        emissive: 0x1f2937,
        emissiveIntensity: 0.6,
    });

    ball = new THREE.Mesh(ballGeo, ballMat);
    resetBall();
    scene.add(ball);
}

function resetBall() {
    state.score = 0;
    updateUI();

    ball.position.set(0, 0, -6);
    // Random horizontal and vertical components, mostly towards the player (positive z)
    const speed = 10;
    const angleX = (Math.random() - 0.5) * 0.8;
    const angleY = (Math.random() - 0.5) * 0.8;
    const dir = new THREE.Vector3(angleX, angleY, 1).normalize();
    state.ballVelocity.copy(dir.multiplyScalar(speed));
    state.running = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    state.mouseNDC.x = x;
    state.mouseNDC.y = y;
}

function updatePaddle(delta) {
    const { width, height } = state.field;

    // Map mouse NDC [-1, 1] onto playfield, with a bit of margin
    const targetX = state.mouseNDC.x * (width * 0.4);
    const targetY = state.mouseNDC.y * (height * 0.4);

    // Smooth follow for feel
    const lerpFactor = Math.min(1, delta * 10);
    paddle.position.x += (targetX - paddle.position.x) * lerpFactor;
    paddle.position.y += (targetY - paddle.position.y) * lerpFactor;
}

function updateBall(delta) {
    if (!state.running) return;

    const nextPos = ball.position.clone().addScaledVector(state.ballVelocity, delta);

    // Wall collisions
    const { width, height, depth } = state.field;
    const halfW = width / 2;
    const halfH = height / 2;

    if (nextPos.x <= -halfW || nextPos.x >= halfW) {
        state.ballVelocity.x *= -1;
    }
    if (nextPos.y <= -halfH || nextPos.y >= halfH) {
        state.ballVelocity.y *= -1;
    }

    // Paddle collision: treat both as AABBs
    const paddleBounds = {
        minX: paddle.position.x - 1,
        maxX: paddle.position.x + 1,
        minY: paddle.position.y - 0.5,
        maxY: paddle.position.y + 0.5,
        // Slight thickness for z
        minZ: paddle.position.z - 0.5,
        maxZ: paddle.position.z + 0.5,
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

    if (overlapX && overlapY && overlapZ && state.ballVelocity.z > 0) {
        // Reflect along z
        state.ballVelocity.z *= -1;

        // Add spin / angle based on impact offset from paddle center
        const offsetX = nextPos.x - paddle.position.x;
        const offsetY = nextPos.y - paddle.position.y;
        state.ballVelocity.x += offsetX * 4;
        state.ballVelocity.y += offsetY * 4;

        // Slightly increase speed each hit
        state.ballVelocity.multiplyScalar(1.03);

        state.score += 1;
        updateUI();
    }

    // Check if ball passes the player (game over)
    if (nextPos.z > 2) {
        state.running = false;
    }

    // Clamp ball within field depth
    if (nextPos.z < -depth - 6) {
        state.ballVelocity.z *= -1;
    }

    ball.position.addScaledVector(state.ballVelocity, delta);
}

function updateUI() {
    const scoreEl = document.getElementById("score");
    const speedEl = document.getElementById("speed");
    if (scoreEl) scoreEl.textContent = String(state.score);
    const speed = state.ballVelocity.length().toFixed(1);
    if (speedEl) speedEl.textContent = speed;
}

let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    updatePaddle(delta);
    updateBall(delta);

    renderer.render(scene, camera);
}

init();


