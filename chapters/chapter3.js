// 챕터 3: 과적합 (3D - 손전등 + 그림자)
registerChapter(3, {
  name: "과적합",

  concept: "과적합은 기출만 달달 외워서\n새 문제는 못 푸는 상태입니다.",

  story: {
    text: "기출문제 100개를 달달 외웠습니다.\n" +
      "기출은 다 맞습니다.\n\n" +
      "그런데 시험에 새로운 문제가 나왔습니다.\n" +
      "손도 못 댔습니다.\n\n" +
      "외운 것만 아는 것.\n" +
      "이게 과적합입니다.\n\n" +
      "기출도 중요하지만,\n" +
      "새 문제도 풀 수 있어야\n" +
      "진짜 실력입니다.",
    image: "image/doro_unknown.png"
  },

  experiment: {
    intro: "이 화면은 과적합을 직접 해보는 곳입니다.\n손전등이 비스듬히 기출 문제(파란 점)를 비춥니다.\n집중 강도가 세지면 빛이 기출에만 쏠리고, 새 문제(마젠타 점)는 빛 밖으로 밀려납니다.",
    formula: "정확도 = 맞힌 문제 / 전체 문제",
    formulaLegend: "파란 점 = 기출 (빛이 닿음)\n마젠타 점 = 새 문제 (빛 밖으로 밀려남)\n노란 빛 = 학습이 집중하는 곳",
    sliderLabel: "집중 강도",
    sliderDesc: "얼마나 기출에만 집중할지 정합니다. 너무 약하면 둘 다 어둡고, 너무 강하면 새 문제가 빛 밖으로 밀려납니다.",
    sliderMin: 0.01,
    sliderMax: 1.0,
    sliderStep: 0.01,
    sliderDefault: 0.3,
    sliderTicks: ["0.01", "0.2", "0.4", "0.6", "0.8", "1.0"],
    statusInit: "슬라이더로 집중 강도를 정하고 [실행]을 누르세요.",

    setup: function() {
      setupOF3D();
    },

    run: function() {
      runOF3D();
    },

    stop: function() {
      stopOF3D();
    },

    clear: function() {
      clearOF3D();
    }
  },

  summary: "과적합이란?\n\n" +
    "• 기출만 달달 외운 상태다\n" +
    "• 기출은 잘 맞히지만 새 문제는 못 푼다\n" +
    "• 너무 세게 외우면 오히려 정확도가 떨어진다\n" +
    "• 적당히 외우는 게 가장 좋다"
});

// ===== 챕터 3 전용 3D 로직 =====
const OF3D = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  flashBody: null,
  flashCone: null,
  spotLight: null,
  mockDots: [],
  newDots: [],
  running: false,
  animationId: null,
  mockData: [],
  newData: []
};

function setupOF3D() {
  const area = document.getElementById('experiment-area');
  area.innerHTML = `
    <div class="bp3d-overlay-top" id="of3d-overlay-top">
      <div class="bp3d-error-overlay" id="of3d-acc-overlay">
        정확도: 70%
      </div>
      <div class="bp3d-phase-overlay" id="of3d-phase-overlay">대기 중</div>
    </div>
    <div class="bp3d-wrap">
      <div id="of3d-container" class="bp3d-container"></div>
    </div>

    <div class="of3d-legend">
      <div class="of3d-legend-title">이 화면에서 이야기와 매치되는 부분</div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-mock"></span>
        <span class="of3d-legend-text"><b>파란 점 = 기출문제</b> · 손전등 빛이 닿는 곳</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-new"></span>
        <span class="of3d-legend-text"><b>마젠타 점 = 새 문제</b> · 빛 밖으로 밀려남</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-bird"></span>
        <span class="of3d-legend-text"><b>노란 손전등 = 학습의 집중</b> · 비스듬히 기출을 비춤</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-shadow"></span>
        <span class="of3d-legend-text"><b>그림자 = 못 배운 영역</b> · 새 문제가 사라짐</span>
      </div>
    </div>

    <div class="bp-stage">
      <div class="bp-phase" id="of3d-phase">현재 단계: 대기 중</div>
      <div class="bp-desc" id="of3d-desc">[실행] 버튼을 누르면 4단계로 과적합 과정을 보여줍니다.</div>
    </div>

    <div class="bp-error-big">
      <div class="bp-error-big-label">정확도</div>
      <div class="bp-error-big-value">
        <span id="of3d-acc-before">70</span>
        <span class="bp-error-arrow">→</span>
        <span id="of3d-acc-after">70</span>
        <span class="bp-error-total">%</span>
      </div>
      <div class="bp-error-big-sub" id="of3d-acc-sub">슬라이더를 움직여 보세요</div>
    </div>

    <div class="bp-slider-hint">
      <span class="bp-hint-left">← 약함</span>
      <span class="bp-hint-center">적당이 좋음</span>
      <span class="bp-hint-right">너무 강함 →</span>
    </div>

    <div class="bp-steps">
      <div class="bp-step" id="of3d-step-1">① 기출 표시</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="of3d-step-2">② 손전등 켜기</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="of3d-step-3">③ 새 문제 투입</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="of3d-step-4">④ 정확도</div>
    </div>
  `;

  const container = document.getElementById('of3d-container');
  const width = container.clientWidth;
  const height = container.clientHeight || 450;

  OF3D.scene = new THREE.Scene();
  OF3D.scene.background = new THREE.Color(0x020202);

  // ★ 카메라: 줌아웃해서 전체 다 보이게
  OF3D.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  OF3D.camera.position.set(2, 16, 22);
  OF3D.camera.lookAt(0, 0, 0);

  OF3D.renderer = new THREE.WebGLRenderer({ antialias: true });
  OF3D.renderer.setSize(width, height);
  OF3D.renderer.setPixelRatio(window.devicePixelRatio);
  OF3D.renderer.shadowMap.enabled = true;
  OF3D.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(OF3D.renderer.domElement);

  OF3D.controls = new THREE.OrbitControls(OF3D.camera, OF3D.renderer.domElement);
  OF3D.controls.enableDamping = true;
  OF3D.controls.dampingFactor = 0.1;
  OF3D.controls.target.set(0, 0, 0);
  OF3D.controls.minDistance = 15;
  OF3D.controls.maxDistance = 45;

  // 매우 약한 기본 조명
  OF3D.scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  // ===== SpotLight (비스듬히 옆에서) =====
  // ★ 손전등 위치: 기출 왼쪽 위 대각선 "안쪽" (화면 안에 들어오게)
  OF3D.spotLight = new THREE.SpotLight(0xffdd00, 3.0, 40, Math.PI / 5, 0.4, 1.5);
  OF3D.spotLight.position.set(-8, 8, -6);
  OF3D.spotLight.target.position.set(-2.5, 0, -2.5);
  OF3D.spotLight.castShadow = true;
  OF3D.spotLight.shadow.mapSize.width = 1024;
  OF3D.spotLight.shadow.mapSize.height = 1024;
  OF3D.spotLight.shadow.camera.near = 0.5;
  OF3D.spotLight.shadow.camera.far = 40;
  OF3D.scene.add(OF3D.spotLight);
  OF3D.scene.add(OF3D.spotLight.target);

  // ===== 손전등 본체 (노란 구) =====
  const bodyGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0xffdd00,
    emissive: 0xffdd00,
    emissiveIntensity: 1.5,
    shininess: 100
  });
  OF3D.flashBody = new THREE.Mesh(bodyGeo, bodyMat);
  OF3D.flashBody.position.set(-8, 8, -6);
  OF3D.scene.add(OF3D.flashBody);

  // ===== 손전등 원뿔 =====
  const coneGeo = new THREE.ConeGeometry(2, 10, 32, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffdd00,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  OF3D.flashCone = new THREE.Mesh(coneGeo, coneMat);
  OF3D.scene.add(OF3D.flashCone);

  // ===== 바닥 (그림자 받음) =====
  const groundGeo = new THREE.PlaneGeometry(40, 40);
  const groundMat = new THREE.MeshPhongMaterial({
    color: 0x001100,
    shininess: 0,
    side: THREE.DoubleSide
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  OF3D.scene.add(ground);

  // ===== 격자 =====
  const gridHelper = new THREE.GridHelper(16, 16, 0x00ff00, 0x002200);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.35;
  gridHelper.position.y = 0.001;
  OF3D.scene.add(gridHelper);

  // ===== 기출 점 데이터 =====
  OF3D.mockData = [
    [-5, -5], [-4, -4], [-3, -5], [-5, -3], [-4, -2],
    [-2, -4], [-3, -3], [-2, -2], [-1, -3], [-3, -1],
    [-1, -1], [0, -2], [-2, 0], [0, 0], [-1, -4],
    [-4, -1], [-5, -4], [-2, -5], [-3, -2], [-4, -3]
  ];

  // ===== 새 문제 점 데이터 =====
  OF3D.newData = [
    [2, 2], [3, 3], [4, 2], [2, 4], [3, 5],
    [5, 3], [4, 4], [5, 5], [6, 4], [4, 6]
  ];

  // 기출 점
  OF3D.mockData.forEach(([x, z]) => {
    const geo = new THREE.SphereGeometry(0.3, 12, 12);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x00ccff,
      emissive: 0x00ccff,
      emissiveIntensity: 0.6
    });
    const dot = new THREE.Mesh(geo, mat);
    dot.position.set(x, 0.3, z);
    dot.visible = false;
    dot.castShadow = true;
    OF3D.scene.add(dot);
    OF3D.mockDots.push(dot);
  });

  // 새 문제 점 (마젠타)
  // ★ 시작 위치: 기출과 새 문제 사이 중간 지점
  OF3D.newData.forEach(([x, z]) => {
    const geo = new THREE.SphereGeometry(0.3, 12, 12);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.9
    });
    const dot = new THREE.Mesh(geo, mat);
    // 중간 지점에서 시작 (기출과 새 문제 사이)
    const midX = x * 0.3;   // 기출 쪽으로 30%만 이동한 위치
    const midZ = z * 0.3;
    dot.position.set(midX, 0.3, midZ);
    dot.visible = false;
    dot.castShadow = true;
    dot.userData = {
      midX: midX, midY: 0.3, midZ: midZ,        // 중간(시작)
      targetX: x, targetY: 0.3, targetZ: z      // 최종 위치
    };
    OF3D.scene.add(dot);
    OF3D.newDots.push(dot);
  });

  function animate() {
    OF3D.animationId = requestAnimationFrame(animate);
    OF3D.controls.update();
    OF3D.renderer.render(OF3D.scene, OF3D.camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight || 450;
    OF3D.camera.aspect = w / h;
    OF3D.camera.updateProjectionMatrix();
    OF3D.renderer.setSize(w, h);
  });

  const slider = document.getElementById('chapter-slider');
  slider.addEventListener('input', () => {
    updateOF3DPreview();
    updateSpotlight(parseFloat(slider.value));
  });
  updateOF3DPreview();
  updateSpotlight(parseFloat(slider.value));
}

// ===== 손전등 업데이트 =====
function updateSpotlight(lr) {
  if (!OF3D.spotLight) return;

  const mockCX = -2.5, mockCZ = -2.5;
  const midCX = 0.5, midCZ = 0.5;

  const tx = midCX + (mockCX - midCX) * lr;
  const tz = midCZ + (mockCZ - midCZ) * lr;

  // ★ 손전등 위치: 기출 왼쪽 위 대각선 안쪽 (화면에 들어오게)
  // lr ↑ → 기출 쪽으로 조금 이동, lr ↓ → 중간 위쪽
  const fx = tx - 6 - lr * 2;
  const fy = 8 + lr * 2;
  const fz = tz - 4 - lr * 2;

  OF3D.spotLight.position.set(fx, fy, fz);
  OF3D.spotLight.target.position.set(tx, 0, tz);
  OF3D.spotLight.target.updateMatrixWorld();

  const angle = Math.PI / 3.5 - lr * (Math.PI / 3.5 - Math.PI / 10);
  OF3D.spotLight.angle = angle;
  OF3D.spotLight.intensity = 2.5 + lr * 2.0;

  if (OF3D.flashBody) OF3D.flashBody.position.set(fx, fy, fz);

  if (OF3D.flashCone) {
    const midX = (fx + tx) / 2;
    const midY = (fy + 0) / 2;
    const midZ = (fz + tz) / 2;
    OF3D.flashCone.position.set(midX, midY, midZ);

    const dir = new THREE.Vector3(tx - fx, 0 - fy, tz - fz);
    const length = dir.length();
    dir.normalize();

    const up = new THREE.Vector3(0, -1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    OF3D.flashCone.quaternion.copy(quat);

    const radius = Math.tan(angle) * length;
    OF3D.flashCone.geometry.dispose();
    OF3D.flashCone.geometry = new THREE.ConeGeometry(radius, length, 32, 1, true);
    OF3D.flashCone.material.opacity = 0.08 + lr * 0.1;
  }
}

function calcOF3DAccuracy(lr) {
  let mockAcc, newAcc;
  if (lr < 0.2) {
    mockAcc = 55 + lr * 100;
    newAcc = 70 + lr * 50;
  } else if (lr < 0.5) {
    mockAcc = 75 + (lr - 0.2) * 66;
    newAcc = 80 + (lr - 0.2) * 16;
  } else if (lr < 0.8) {
    mockAcc = 95 + (lr - 0.5) * 16;
    newAcc = 85 - (lr - 0.5) * 100;
  } else {
    mockAcc = 100;
    newAcc = 55 - (lr - 0.8) * 200;
  }
  mockAcc = Math.max(0, Math.min(100, Math.round(mockAcc)));
  newAcc = Math.max(0, Math.min(100, Math.round(newAcc)));
  const total = Math.round((mockAcc + newAcc) / 2);
  return { mockAcc, newAcc, total };
}

function updateOF3DPreview() {
  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { mockAcc, newAcc, total } = calcOF3DAccuracy(lr);

  const beforeEl = document.getElementById('of3d-acc-before');
  const afterEl = document.getElementById('of3d-acc-after');
  const subEl = document.getElementById('of3d-acc-sub');
  const overlayEl = document.getElementById('of3d-acc-overlay');

  if (beforeEl) beforeEl.textContent = '70';
  if (afterEl) afterEl.textContent = total;
  if (subEl) subEl.textContent = '집중 강도 ' + lr.toFixed(2) + ' · 기출 ' + mockAcc + '% + 새 문제 ' + newAcc + '%';
  if (overlayEl) overlayEl.textContent = '정확도: 70% → ' + total + '%';

  return { mockAcc, newAcc, total };
}

function setOF3DStep(stepNum) {
  [1,2,3,4].forEach(n => {
    const el = document.getElementById('of3d-step-' + n);
    if (el) el.classList.toggle('active', n === stepNum);
  });
}

function setOF3DPhase(phase, desc, overlay) {
  const phaseEl = document.getElementById('of3d-phase');
  const descEl = document.getElementById('of3d-desc');
  const overlayEl = document.getElementById('of3d-phase-overlay');
  if (phaseEl) phaseEl.textContent = '현재 단계: ' + phase;
  if (descEl) descEl.textContent = desc;
  if (overlayEl) overlayEl.textContent = overlay;
}

function resetOF3D() {
  OF3D.mockDots.forEach(d => {
    d.visible = false;
    d.material.emissiveIntensity = 0.6;
  });
  OF3D.newDots.forEach(d => {
    d.visible = false;
    // ★ 시작 위치: 중간 지점
    d.position.set(d.userData.midX, d.userData.midY, d.userData.midZ);
    d.material.emissiveIntensity = 0.9;
    d.material.opacity = 1;
    d.material.transparent = false;
  });
  updateSpotlight(parseFloat(document.getElementById('chapter-slider').value));
}

// ===== 새 문제 점: 중간 지점에서 페이드 인 → 빛 밖으로 밀려남 =====
function pushNewDot(dot, duration, onDone) {
  const startPos = dot.position.clone();
  const target = new THREE.Vector3(
    dot.userData.targetX,
    dot.userData.targetY,
    dot.userData.targetZ
  );
  const startTime = Date.now();

  dot.visible = true;

  function step() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    // ease-in-out (서서히 시작, 서서히 끝)
    const ease = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;

    dot.position.x = startPos.x + (target.x - startPos.x) * ease;
    dot.position.y = startPos.y + (target.y - startPos.y) * ease;
    dot.position.z = startPos.z + (target.z - startPos.z) * ease;

    if (t < 1) {
      requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  }
  step();
}

// ===== 새 문제 점: 페이드 인 =====
function fadeInDot(dot, duration, onDone) {
  dot.visible = true;
  dot.material.transparent = true;
  dot.material.opacity = 0;

  const startTime = Date.now();

  function step() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    dot.material.opacity = t;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      dot.material.opacity = 1;
      dot.material.transparent = false;
      if (onDone) onDone();
    }
  }
  step();
}

function runOF3D() {
  if (OF3D.running) return;
  OF3D.running = true;

  resetOF3D();

  const status = document.getElementById('experiment-status');
  const nextBtn = document.getElementById('step-next');
  nextBtn.style.visibility = 'hidden';

  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { mockAcc, newAcc, total } = updateOF3DPreview();

  // ===== ① 기출 표시 =====
  setOF3DStep(1);
  setOF3DPhase('① 기출 표시', '외운 기출 문제(파란 점)가 하나씩 나타납니다.', '① 기출');
  status.textContent = '① 기출 문제 표시 중...';

  let i = 0;
  const showMock = setInterval(() => {
    if (i < OF3D.mockDots.length) {
      OF3D.mockDots[i].visible = true;
      i++;
    } else {
      clearInterval(showMock);

      // ===== ② 손전등 켜기 =====
      setTimeout(() => {
        setOF3DStep(2);
        setOF3DPhase('② 손전등 켜기', '손전등이 비스듬히 기출 쪽을 비춥니다. 집중 강도 ' + lr.toFixed(2) + '.', '② 손전등');
        status.textContent = '② 손전등 켜는 중... (집중 강도 ' + lr.toFixed(2) + ')';

        updateSpotlight(lr);

        // 3초 후 ③
        setTimeout(() => {
          // ===== ③ 새 문제 투입 =====
          setOF3DStep(3);
          setOF3DPhase(
            '③ 새 문제 투입',
            '시험에 처음 보는 문제(마젠타 점)가 나타납니다. 빛이 닿지 않아 빛 밖으로 밀려납니다.',
            '③ 새 문제'
          );
          status.textContent = '③ 새 문제가 나타납니다...';

          // 각 점: 페이드 인 → 밀려남
          let j = 0;
          const processNext = () => {
            if (j < OF3D.newDots.length) {
              const dot = OF3D.newDots[j];
              // 1) 중간 지점에서 페이드 인
              fadeInDot(dot, 500, () => {
                // 2) 빛 밖으로 밀려남
                setTimeout(() => {
                  pushNewDot(dot, 900, () => {
                    j++;
                    setTimeout(processNext, 60);
                  });
                }, 100);
              });
            } else {
              // 모두 완료 → ④
              setTimeout(() => {
                setOF3DStep(4);
                setOF3DPhase('④ 정확도', '결과를 확인합니다.', '④ 정확도');

                let desc4 = '';
                let overlay4 = '④ 정확도';
                if (lr < 0.2) {
                  desc4 = '손전등이 넓게 비춰서 기출 ' + mockAcc + '%, 새 문제 ' + newAcc + '%. 둘 다 조금 어둡습니다.';
                  overlay4 = '④ 부족';
                } else if (lr < 0.5) {
                  desc4 = '적당! 기출 ' + mockAcc + '%, 새 문제 ' + newAcc + '%. 손전등이 고르게 비춥니다.';
                  overlay4 = '④ 적당!';
                } else if (lr < 0.8) {
                  desc4 = '기출 ' + mockAcc + '%, 새 문제 ' + newAcc + '%. 손전등이 기출 쪽으로 쏠립니다.';
                  overlay4 = '④ 흔들림';
                } else {
                  desc4 = '과적합! 기출 ' + mockAcc + '%, 새 문제 ' + newAcc + '%. 손전등이 기출만 비추고 새 문제는 빛 밖으로 밀려났습니다.';
                  overlay4 = '④ 과적합!';
                }

                setOF3DPhase('④ 정확도', desc4, overlay4);

                let msg = '';
                if (lr < 0.2) {
                  msg = '⏱️ 집중이 약해서 정확도 ' + total + '%. 조금 더 집중해보세요.';
                } else if (lr < 0.5) {
                  msg = '✅ 적당한 집중! 정확도 ' + total + '%. 기출과 새 문제 둘 다 잘합니다.';
                } else if (lr < 0.8) {
                  msg = '⚠️ 너무 집중했더니 새 문제가 빛 밖으로 밀려납니다. 정확도 ' + total + '%.';
                } else {
                  msg = '💥 과적합! 기출만 완벽하고 새 문제는 못 풉니다. 정확도 ' + total + '%. 조금 줄여보세요.';
                }

                status.textContent = msg;
                OF3D.running = false;
                nextBtn.style.visibility = 'visible';
              }, 800);
            }
          };
          processNext();
        }, 3000);
      }, 600);
    }
  }, 80);
}

function stopOF3D() {
  OF3D.running = false;

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '⏸️ 정지했습니다.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
  setOF3DPhase('정지', '정지했습니다. 다시 실행하거나 초기화하세요.', '정지');
}

function clearOF3D() {
  if (OF3D.running) stopOF3D();

  resetOF3D();
  setOF3DStep(0);
  setOF3DPhase('대기 중', '[실행] 버튼을 누르면 4단계로 과적합 과정을 보여줍니다.', '대기 중');

  updateOF3DPreview();

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '초기화했습니다. 다시 실행해 보세요.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
}