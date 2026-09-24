// 챕터 1: 경사하강법 (3D)
registerChapter(1, {
  name: "경사하강법",

  concept: "경사하강법은 가장 낮은 곳을 찾아\n조금씩 내려가는 방법입니다.",

  story: {
    text: "안개가 자욱한 산에 한 등산객이 있습니다.\n" +
      "그는 산 정상에서 내려와야 합니다.\n" +
      "하지만 앞이 보이지 않습니다.\n\n" +
      "등산객은 발밑의 기울기만 느끼며\n" +
      "가장 낮은 방향으로 한 걸음씩 내려갑니다.\n\n" +
      "너무 크게 걸으면 절벽으로 떨어지고,\n" +
      "너무 작게 걸으면 해가 지고 맙니다.",
    image: "image/doro_down.jpg"
  },

  experiment: {
    intro: "이 화면은 경사하강법을 직접 해보는 곳입니다.\n공이 3D 그릇 모양 표면을 따라 가장 낮은 곳으로 내려갑니다.\n마우스로 드래그하면 시점을 돌릴 수 있습니다.",
    formula: "θ ← θ - ω · ∇L(θ)",
    formulaLegend: "θ = 공의 위치 (x, y)\nω = 학습률 (보폭) ← 슬라이더로 조절\n∇L = 기울기 (내려가는 방향)",
    sliderLabel: "학습률 ω (보폭)",
    sliderDesc: "공식의 ω를 바꿉니다. 클수록 크게 걷고, 작을수록 조금 걷습니다.",
    sliderMin: 0.01,
    sliderMax: 0.5,
    sliderStep: 0.01,
    sliderDefault: 0.1,
    sliderTicks: ["0.01", "0.1", "0.2", "0.3", "0.4", "0.5"],
    statusInit: "슬라이더로 학습률을 정하고 [실행]을 누르세요. 마우스 드래그로 시점 회전.",

    setup: function() {
      setupGD3D();
    },

    run: function() {
      runGD3D();
    },

    stop: function() {
      stopGD3D();
    },

    clear: function() {
      clearGD3D();
    }
  },

  summary: "경사하강법이란?\n\n" +
    "• 기울기를 따라 가장 낮은 곳을 찾는다\n" +
    "• 한 번에 조금씩 움직인다\n" +
    "• 보폭(학습률)이 너무 크면 튕겨나간다\n" +
    "• 보폭이 너무 작으면 오래 걸린다"
});

// ===== 챕터 1 전용 3D 로직 =====
const GD3D = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  ball: null,
  trailLine: null,
  trailPoints: [],
  ballX: 0.1,
  ballY: 0.1,
  running: false,
  intervalId: null,
  animationId: null,
  loss: (x, y) => Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2),
  gradX: (x) => 2 * (x - 0.5),
  gradY: (y) => 2 * (y - 0.5),
  toX: (x) => (x - 0.5) * 10,
  toZ: (y) => (y - 0.5) * 10,
  // ★ 수정: loss 작을수록 낮은 위치 (골짜기)
  toHeight: (loss) => loss * 8 - 2
};

function setupGD3D() {
  const area = document.getElementById('experiment-area');
  area.innerHTML = '<div id="gd3d-container" style="width:100%;height:400px;background:#000;"></div>';

  const container = document.getElementById('gd3d-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene
  GD3D.scene = new THREE.Scene();
  GD3D.scene.background = new THREE.Color(0x050505);

  // Camera
  GD3D.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  GD3D.camera.position.set(8, 8, 8);
  GD3D.camera.lookAt(0, 0, 0);

  // Renderer
  GD3D.renderer = new THREE.WebGLRenderer({ antialias: true });
  GD3D.renderer.setSize(width, height);
  GD3D.renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(GD3D.renderer.domElement);

  // Controls
  GD3D.controls = new THREE.OrbitControls(GD3D.camera, GD3D.renderer.domElement);
  GD3D.controls.enableDamping = true;
  GD3D.controls.dampingFactor = 0.1;

  // ===== 조명 (흰색) =====
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  GD3D.scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 5);
  GD3D.scene.add(dir);

  const dir2 = new THREE.DirectionalLight(0x88ff88, 0.4);
  dir2.position.set(-5, 5, -5);
  GD3D.scene.add(dir2);

  // ===== 손실 표면 (와이어프레임만) =====
  const size = 10;
  const segments = 40;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) / size + 0.5;
    const y = positions.getY(i) / size + 0.5;
    const loss = GD3D.loss(x, y);
    positions.setZ(i, GD3D.toHeight(loss));
  }
  geometry.computeVertexNormals();

  // 와이어프레임: 공(초록)과 대비되는 시안
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x00ccff,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  const wireSurface = new THREE.Mesh(geometry, wireMat);
  wireSurface.rotation.x = -Math.PI / 2;
  GD3D.scene.add(wireSurface);

  // ===== 공 (밝은 초록 + 발광) =====
  const ballGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const ballMat = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 2.0,
    shininess: 100
  });
  GD3D.ball = new THREE.Mesh(ballGeo, ballMat);
  GD3D.scene.add(GD3D.ball);

  // ===== 경로 (주황) =====
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3000), 3));
  trailGeo.setDrawRange(0, 0);
  const trailMat = new THREE.LineBasicMaterial({
    color: 0xffb000,
    linewidth: 2,
    transparent: true,
    opacity: 0.9
  });
  GD3D.trailLine = new THREE.Line(trailGeo, trailMat);
  GD3D.scene.add(GD3D.trailLine);
  GD3D.trailPoints = [];

  updateGD3DBall();

  function animate() {
    GD3D.animationId = requestAnimationFrame(animate);
    GD3D.controls.update();
    GD3D.renderer.render(GD3D.scene, GD3D.camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    GD3D.camera.aspect = w / h;
    GD3D.camera.updateProjectionMatrix();
    GD3D.renderer.setSize(w, h);
  });
}

function updateGD3DBall() {
  if (!GD3D.ball) return;
  const x3 = GD3D.toX(GD3D.ballX);
  const z3 = GD3D.toZ(GD3D.ballY);
  const y3 = GD3D.toHeight(GD3D.loss(GD3D.ballX, GD3D.ballY));
  GD3D.ball.position.set(x3, y3 + 0.3, z3);
}

function addGD3DTrailPoint() {
  if (!GD3D.trailLine) return;
  const x3 = GD3D.toX(GD3D.ballX);
  const z3 = GD3D.toZ(GD3D.ballY);
  const y3 = GD3D.toHeight(GD3D.loss(GD3D.ballX, GD3D.ballY)) + 0.3;
  GD3D.trailPoints.push(x3, y3, z3);

  const positions = GD3D.trailLine.geometry.attributes.position;
  for (let i = 0; i < GD3D.trailPoints.length; i++) {
    positions.array[i] = GD3D.trailPoints[i];
  }
  positions.needsUpdate = true;
  GD3D.trailLine.geometry.setDrawRange(0, GD3D.trailPoints.length / 3);
  GD3D.trailLine.geometry.computeBoundingSphere();
}

function runGD3D() {
  if (GD3D.running) return;
  if (GD3D.intervalId) clearInterval(GD3D.intervalId);

  GD3D.running = true;
  GD3D.ballX = 0.1;
  GD3D.ballY = 0.1;
  updateGD3DBall();

  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const status = document.getElementById('experiment-status');
  const nextBtn = document.getElementById('step-next');
  nextBtn.style.visibility = 'hidden';

  let step = 0;
  const maxSteps = 200;
  const targetX = 0.5;
  const targetY = 0.5;
  const tolerance = 0.02;

  GD3D.intervalId = setInterval(() => {
    const gx = GD3D.gradX(GD3D.ballX);
    const gy = GD3D.gradY(GD3D.ballY);
    GD3D.ballX = GD3D.ballX - lr * gx;
    GD3D.ballY = GD3D.ballY - lr * gy;

    if (GD3D.ballX < -1 || GD3D.ballX > 2 || GD3D.ballY < -1 || GD3D.ballY > 2) {
      status.textContent = '💥 발산! 학습률이 너무 큽니다. 공이 튕겨나갔습니다.';
      clearInterval(GD3D.intervalId);
      GD3D.intervalId = null;
      GD3D.running = false;
      nextBtn.style.visibility = 'visible';
      return;
    }

    if (GD3D.ballX < 0) GD3D.ballX = 0;
    if (GD3D.ballX > 1) GD3D.ballX = 1;
    if (GD3D.ballY < 0) GD3D.ballY = 0;
    if (GD3D.ballY > 1) GD3D.ballY = 1;

    updateGD3DBall();
    addGD3DTrailPoint();
    step++;

    const dist = Math.sqrt(Math.pow(GD3D.ballX - targetX, 2) + Math.pow(GD3D.ballY - targetY, 2));
    if (dist < tolerance) {
      status.textContent = '✅ 도착! ' + step + '걸음 만에 최솟값에 도달했습니다.';
      clearInterval(GD3D.intervalId);
      GD3D.intervalId = null;
      GD3D.running = false;
      nextBtn.style.visibility = 'visible';
      return;
    }

    if (step >= maxSteps) {
      status.textContent = '⏱️ ' + maxSteps + '걸음 후에도 도착 못 함. 학습률이 너무 작습니다.';
      clearInterval(GD3D.intervalId);
      GD3D.intervalId = null;
      GD3D.running = false;
      nextBtn.style.visibility = 'visible';
      return;
    }

    status.textContent = step + '걸음째 · 거리 = ' + dist.toFixed(3);
  }, 50);
}

function stopGD3D() {
  if (GD3D.intervalId) {
    clearInterval(GD3D.intervalId);
    GD3D.intervalId = null;
  }
  GD3D.running = false;

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '⏸️ 정지했습니다.';

  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
}

function clearGD3D() {
  if (GD3D.running) stopGD3D();

  GD3D.trailPoints = [];
  if (GD3D.trailLine) {
    GD3D.trailLine.geometry.setDrawRange(0, 0);
  }

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '경로를 지웠습니다. 다시 실행해 보세요.';

  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
}