// 챕터 4: 선형 회귀 (3D 산점도 + 회귀 직선)
registerChapter(4, {
  name: "선형 회귀",

  concept: "선형 회귀는 점들 사이에\n가장 잘 맞는 직선을 긋는 방법입니다.",

  story: {
    text: "키가 크면 몸무게도 늘어납니다.\n" +
      "주변 사람들의 키와 몸무게를 모아\n" +
      "점으로 찍어봤습니다.\n\n" +
      "점들 사이에 가장 잘 맞는 선을 그으면\n" +
      "'이 정도 키면 이 정도 몸무게'를\n" +
      "예측할 수 있습니다.\n\n" +
      "이게 선형 회귀입니다.\n\n" +
      "점들에 너무 억지로 맞추면\n" +
      "새 데이터는 못 맞힙니다.",
    image: "image/doro_bmi.png"
  },

  experiment: {
    intro: "이 화면은 선형 회귀를 직접 해보는 곳입니다.\n키와 몸무게 데이터(파란 점)가 3D 공간에 흩어져 있습니다.\n맞춤 강도를 조절하면 직선이 데이터에 얼마나 잘 맞는지 볼 수 있습니다.",
    formula: "적합도 = 1 - (오차 / 전체)",
    formulaLegend: "파란 점 = 데이터 (키·몸무게)\n노란 직선 = 예측선\n빨간 선 = 오차 (점과 직선의 거리)",
    sliderLabel: "직선 맞춤 강도",
    sliderDesc: "직선이 데이터에 얼마나 맞춰질지 정합니다. 너무 약하면 안 맞고, 너무 강하면 점들 사이를 구불구불 통과합니다.",
    sliderMin: 0.01,
    sliderMax: 1.0,
    sliderStep: 0.01,
    sliderDefault: 0.3,
    sliderTicks: ["0.01", "0.2", "0.4", "0.6", "0.8", "1.0"],
    statusInit: "슬라이더로 맞춤 강도를 정하고 [실행]을 누르세요.",

    setup: function() {
      setupLR3D();
    },

    run: function() {
      runLR3D();
    },

    stop: function() {
      stopLR3D();
    },

    clear: function() {
      clearLR3D();
    }
  },

  summary: "선형 회귀란?\n\n" +
    "• 점들 사이에 가장 잘 맞는 직선을 긋는다\n" +
    "• 그 직선으로 새 데이터를 예측한다\n" +
    "• 너무 억지로 맞추면 새 데이터는 못 맞힌다\n" +
    "• 적당히 맞추는 게 가장 좋다"
});

// ===== 챕터 4 전용 3D 로직 =====
const LR3D = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  dataDots: [],
  regLine: null,
  errorLines: [],
  running: false,
  timeoutIds: [],
  animationId: null,
  dataPoints: []   // {x, y, z} 데이터
};

function setupLR3D() {
  const area = document.getElementById('experiment-area');
  area.innerHTML = `
    <div class="bp3d-overlay-top" id="lr3d-overlay-top">
      <div class="bp3d-error-overlay" id="lr3d-acc-overlay">
        적합도: 70%
      </div>
      <div class="bp3d-phase-overlay" id="lr3d-phase-overlay">대기 중</div>
    </div>
    <div class="bp3d-wrap">
      <div id="lr3d-container" class="bp3d-container"></div>
    </div>

    <div class="of3d-legend">
      <div class="of3d-legend-title">이 화면에서 이야기와 매치되는 부분</div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-mock"></span>
        <span class="of3d-legend-text"><b>파란 점 = 데이터</b> · 키·몸무게 측정값</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-bird"></span>
        <span class="of3d-legend-text"><b>노란 직선 = 예측선</b> · 가장 잘 맞는 직선</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-new"></span>
        <span class="of3d-legend-text"><b>빨간 선 = 오차</b> · 점과 직선의 거리</span>
      </div>
    </div>

    <div class="bp-stage">
      <div class="bp-phase" id="lr3d-phase">현재 단계: 대기 중</div>
      <div class="bp-desc" id="lr3d-desc">[실행] 버튼을 누르면 4단계로 선형 회귀 과정을 보여줍니다.</div>
    </div>

    <div class="bp-error-big">
      <div class="bp-error-big-label">적합도</div>
      <div class="bp-error-big-value">
        <span id="lr3d-acc-before">70</span>
        <span class="bp-error-arrow">→</span>
        <span id="lr3d-acc-after">70</span>
        <span class="bp-error-total">%</span>
      </div>
      <div class="bp-error-big-sub" id="lr3d-acc-sub">슬라이더를 움직여 보세요</div>
    </div>

    <div class="bp-slider-hint">
      <span class="bp-hint-left">← 약함</span>
      <span class="bp-hint-center">적당이 좋음</span>
      <span class="bp-hint-right">너무 강함 →</span>
    </div>

    <div class="bp-steps">
      <div class="bp-step" id="lr3d-step-1">① 데이터 표시</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="lr3d-step-2">② 직선 그리기</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="lr3d-step-3">③ 오차 계산</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="lr3d-step-4">④ 적합도</div>
    </div>
  `;

  const container = document.getElementById('lr3d-container');
  const width = container.clientWidth;
  const height = container.clientHeight || 450;

  LR3D.scene = new THREE.Scene();
  LR3D.scene.background = new THREE.Color(0x050505);

  LR3D.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  LR3D.camera.position.set(0, 12, 16);
  LR3D.camera.lookAt(0, 2, 0);

  LR3D.renderer = new THREE.WebGLRenderer({ antialias: true });
  LR3D.renderer.setSize(width, height);
  LR3D.renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(LR3D.renderer.domElement);

  LR3D.controls = new THREE.OrbitControls(LR3D.camera, LR3D.renderer.domElement);
  LR3D.controls.enableDamping = true;
  LR3D.controls.dampingFactor = 0.1;
  LR3D.controls.target.set(0, 2, 0);
  LR3D.controls.minDistance = 10;
  LR3D.controls.maxDistance = 40;

  LR3D.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 5);
  LR3D.scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0x88ff88, 0.4);
  dir2.position.set(-5, 5, -5);
  LR3D.scene.add(dir2);

  // ===== 데이터 점 생성 (키·몸무게, 노이즈 포함) =====
  // x: 키 (0~10), z: 0 (평면), y: 몸무게 (0~8)
  // 대략 y = 0.7x + 1 (양의 상관)
  LR3D.dataPoints = [];
  const dataSeeds = [
    [1, 1.5], [1.5, 2.2], [2, 1.8], [2.5, 3.0], [3, 3.2],
    [3.5, 3.5], [4, 4.0], [4.5, 3.8], [5, 4.5], [5.5, 4.8],
    [6, 5.2], [6.5, 5.0], [7, 5.8], [7.5, 6.0], [8, 6.5]
  ];

  dataSeeds.forEach(([x, y]) => {
    const geo = new THREE.SphereGeometry(0.25, 12, 12);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x00ccff,
      emissive: 0x00ccff,
      emissiveIntensity: 0.7
    });
    const dot = new THREE.Mesh(geo, mat);
    // 좌표 변환: x ∈ [1,8] → 3D x ∈ [-6, 6], y ∈ [1.5, 6.5] → 3D y ∈ [0, 6]
    const x3 = (x - 4.5) * 1.7;
    const y3 = (y - 4) * 1.0 + 3;
    dot.position.set(x3, y3, 0);
    dot.visible = false;
    LR3D.scene.add(dot);
    LR3D.dataDots.push(dot);
    LR3D.dataPoints.push({ x: x3, y: y3, z: 0 });
  });

  // 바닥 그리드
  const gridHelper = new THREE.GridHelper(16, 16, 0x00ff00, 0x002200);
  gridHelper.position.y = 0;
  LR3D.scene.add(gridHelper);

  // 축 라벨 (텍스트 대신 색상으로)
  const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)
  ]);
  const xAxisLine = new THREE.Line(xAxisGeo, new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.4, transparent: true }));
  LR3D.scene.add(xAxisLine);

  // 회귀 직선 (초기)
  updateLR3DLine(0.01);

  function animate() {
    LR3D.animationId = requestAnimationFrame(animate);
    LR3D.controls.update();
    LR3D.renderer.render(LR3D.scene, LR3D.camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight || 450;
    LR3D.camera.aspect = w / h;
    LR3D.camera.updateProjectionMatrix();
    LR3D.renderer.setSize(w, h);
  });

  const slider = document.getElementById('chapter-slider');
  slider.addEventListener('input', () => {
    updateLR3DPreview();
    updateLR3DLine(parseFloat(slider.value));
  });
  updateLR3DPreview();
}

// ===== 회귀 직선 업데이트 =====
function updateLR3DLine(lr) {
  if (LR3D.regLine) {
    LR3D.scene.remove(LR3D.regLine);
    LR3D.regLine.geometry.dispose();
    LR3D.regLine.material.dispose();
  }

  // 직선: y = a * x + b
  // lr ↑ → 기울기 a ↑ (데이터에 잘 맞음)
  // lr 너무 크면 구불구불 (sin 파형 추가)
  const a = 0.3 + lr * 0.9;   // 0.3 ~ 1.2
  const b = 2 + lr * 1.0;

  const points = [];
  const N = 100;

  for (let i = 0; i <= N; i++) {
    const x = -8 + (16 * i) / N;
    let y = a * x * 0.3 + b;

    // lr > 0.8이면 구불구불 (과적합)
    if (lr > 0.8) {
      const wiggle = (lr - 0.8) * 5;
      y += Math.sin(x * 3) * wiggle;
    }

    points.push(new THREE.Vector3(x, y, 0));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0xffdd00,
    linewidth: 3
  });
  LR3D.regLine = new THREE.Line(geo, mat);
  LR3D.scene.add(LR3D.regLine);
}

// ===== 적합도 계산 =====
function calcLR3DFit(lr) {
  // lr ↑ → 적합도 ↑, lr 너무 크면 다시 ↓ (과적합)
  let fit;
  if (lr < 0.2) {
    fit = 50 + lr * 100;         // 0.01 → 51, 0.2 → 70
  } else if (lr < 0.5) {
    fit = 70 + (lr - 0.2) * 100;  // 0.2 → 70, 0.5 → 100
  } else if (lr < 0.8) {
    fit = 100 - (lr - 0.5) * 20;  // 0.5 → 100, 0.8 → 94
  } else {
    fit = 94 - (lr - 0.8) * 200;  // 0.8 → 94, 1.0 → 54
  }
  fit = Math.max(0, Math.min(100, Math.round(fit)));
  return { fit };
}

function updateLR3DPreview() {
  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { fit } = calcLR3DFit(lr);

  const beforeEl = document.getElementById('lr3d-acc-before');
  const afterEl = document.getElementById('lr3d-acc-after');
  const subEl = document.getElementById('lr3d-acc-sub');
  const overlayEl = document.getElementById('lr3d-acc-overlay');

  if (beforeEl) beforeEl.textContent = '70';
  if (afterEl) afterEl.textContent = fit;
  if (subEl) subEl.textContent = '맞춤 강도 ' + lr.toFixed(2) + ' · 적합도 ' + fit + '%';
  if (overlayEl) overlayEl.textContent = '적합도: 70% → ' + fit + '%';

  return { fit };
}

function setLR3DStep(stepNum) {
  [1,2,3,4].forEach(n => {
    const el = document.getElementById('lr3d-step-' + n);
    if (el) el.classList.toggle('active', n === stepNum);
  });
}

function setLR3DPhase(phase, desc, overlay) {
  const phaseEl = document.getElementById('lr3d-phase');
  const descEl = document.getElementById('lr3d-desc');
  const overlayEl = document.getElementById('lr3d-phase-overlay');
  if (phaseEl) phaseEl.textContent = '현재 단계: ' + phase;
  if (descEl) descEl.textContent = desc;
  if (overlayEl) overlayEl.textContent = overlay;
}

function resetLR3D() {
  LR3D.dataDots.forEach(d => d.visible = false);
  // 오차 선 제거
  LR3D.errorLines.forEach(line => {
    LR3D.scene.remove(line);
    line.geometry.dispose();
    line.material.dispose();
  });
  LR3D.errorLines = [];
  updateLR3DLine(parseFloat(document.getElementById('chapter-slider').value));
}

// ===== 오차 선 그리기 =====
function drawErrorLines() {
  LR3D.errorLines.forEach(line => {
    LR3D.scene.remove(line);
    line.geometry.dispose();
    line.material.dispose();
  });
  LR3D.errorLines = [];

  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const a = 0.3 + lr * 0.9;
  const b = 2 + lr * 1.0;

  LR3D.dataPoints.forEach(p => {
    // 직선 위의 y 값
    let lineY = a * p.x * 0.3 + b;
    if (lr > 0.8) {
      lineY += Math.sin(p.x * 3) * (lr - 0.8) * 5;
    }

    const points = [
      new THREE.Vector3(p.x, p.y, 0),
      new THREE.Vector3(p.x, lineY, 0)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.7 });
    const line = new THREE.Line(geo, mat);
    LR3D.scene.add(line);
    LR3D.errorLines.push(line);
  });
}

function runLR3D() {
  if (LR3D.running) return;
  LR3D.running = true;

  resetLR3D();
  LR3D.timeoutIds.forEach(id => clearTimeout(id));
  LR3D.timeoutIds = [];

  const status = document.getElementById('experiment-status');
  const nextBtn = document.getElementById('step-next');
  nextBtn.style.visibility = 'hidden';

  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { fit } = updateLR3DPreview();

  // ===== ① 데이터 표시 =====
  setLR3DStep(1);
  setLR3DPhase('① 데이터 표시', '키와 몸무게 데이터(파란 점)가 하나씩 나타납니다.', '① 데이터');
  status.textContent = '① 데이터 표시 중...';

  let i = 0;
  const showDots = setInterval(() => {
    if (i < LR3D.dataDots.length) {
      LR3D.dataDots[i].visible = true;
      i++;
    } else {
      clearInterval(showDots);

      // ===== ② 직선 그리기 =====
      LR3D.timeoutIds.push(setTimeout(() => {
        setLR3DStep(2);
        setLR3DPhase('② 직선 그리기', '맞춤 강도 ' + lr.toFixed(2) + '로 예측선(노란 직선)을 그립니다.', '② 직선');
        status.textContent = '② 직선 그리는 중...';

        updateLR3DLine(lr);

        // ===== ③ 오차 계산 =====
        LR3D.timeoutIds.push(setTimeout(() => {
          setLR3DStep(3);
          setLR3DPhase('③ 오차 계산', '각 점과 직선 사이의 거리(빨간 선)를 계산합니다.', '③ 오차');
          status.textContent = '③ 오차 계산 중...';

          drawErrorLines();

          // ===== ④ 적합도 =====
          LR3D.timeoutIds.push(setTimeout(() => {
            setLR3DStep(4);

            let desc4 = '';
            let overlay4 = '④ 적합도';
            if (lr < 0.2) {
              desc4 = '맞춤이 약해서 적합도 ' + fit + '%. 직선이 데이터에 안 맞습니다.';
              overlay4 = '④ 부족';
            } else if (lr < 0.5) {
              desc4 = '적당! 적합도 ' + fit + '%. 직선이 데이터에 잘 맞습니다.';
              overlay4 = '④ 적당!';
            } else if (lr < 0.8) {
              desc4 = '적합도 ' + fit + '%. 직선이 데이터를 잘 통과하지만 살짝 흔들립니다.';
              overlay4 = '④ 흔들림';
            } else {
              desc4 = '과적합! 적합도 ' + fit + '%. 직선이 점들 사이를 구불구불 통과합니다. 새 데이터는 못 맞힙니다.';
              overlay4 = '④ 과적합!';
            }

            setLR3DPhase('④ 적합도', desc4, overlay4);

            let msg = '';
            if (lr < 0.2) {
              msg = '⏱️ 맞춤이 약해서 적합도 ' + fit + '%. 조금 더 맞춰보세요.';
            } else if (lr < 0.5) {
              msg = '✅ 적당한 맞춤! 적합도 ' + fit + '%. 이 정도가 좋습니다.';
            } else if (lr < 0.8) {
              msg = '⚠️ 세게 맞췄더니 직선이 흔들립니다. 적합도 ' + fit + '%.';
            } else {
              msg = '💥 과적합! 점들 사이를 구불구불 통과합니다. 적합도 ' + fit + '%. 조금 줄여보세요.';
            }

            status.textContent = msg;
            LR3D.running = false;
            nextBtn.style.visibility = 'visible';
          }, 1000));
        }, 1200));
      }, 800));
    }
  }, 80);
}

function stopLR3D() {
  LR3D.timeoutIds.forEach(id => clearTimeout(id));
  LR3D.timeoutIds = [];
  LR3D.running = false;

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '⏸️ 정지했습니다.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
  setLR3DPhase('정지', '정지했습니다. 다시 실행하거나 초기화하세요.', '정지');
}

function clearLR3D() {
  if (LR3D.running) stopLR3D();

  resetLR3D();
  setLR3DStep(0);
  setLR3DPhase('대기 중', '[실행] 버튼을 누르면 4단계로 선형 회귀 과정을 보여줍니다.', '대기 중');

  updateLR3DPreview();

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '초기화했습니다. 다시 실행해 보세요.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
}