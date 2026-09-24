// 챕터 5: 로지스틱 회귀 (3D S자 곡선)
registerChapter(5, {
  name: "로지스틱 회귀",

  concept: "로지스틱 회귀는 예/아니오를\nS자 곡선으로 나누는 방법입니다.",

  story: {
    text: "시험에 합격한 사람과 불합격한 사람을\n" +
      "공부 시간별로 나눠봤습니다.\n\n" +
      "1시간 공부한 사람은 불합격,\n" +
      "10시간 공부한 사람은 합격.\n\n" +
      "그런데 5시간은? 애매합니다.\n" +
      "확률로 나타내면 S자 곡선이 됩니다.\n\n" +
      "이게 로지스틱 회귀입니다.\n\n" +
      "너무 뾰족하게 나누면\n" +
      "새 데이터는 못 맞힙니다.",
    image: "image/doro_pass.png"
  },

  experiment: {
    intro: "이 화면은 로지스틱 회귀를 직접 해보는 곳입니다.\n합격자(파란 점)와 불합격자(빨간 점)가 3D 공간에 흩어져 있습니다.\n결정 경계 민감도를 조절하면 S자 곡선이 얼마나 뾰족한지 볼 수 있습니다.",
    formula: "합격 확률 = 1 / (1 + e^(-z))",
    formulaLegend: "파란 점 = 합격자 (위쪽)\n빨간 점 = 불합격자 (아래쪽)\n노란 S자 곡선 = 예측 확률",
    sliderLabel: "결정 경계 민감도",
    sliderDesc: "S자 곡선이 얼마나 뾰족할지 정합니다. 너무 약하면 경계가 흐릿하고, 너무 강하면 극단으로 나뉩니다.",
    sliderMin: 0.01,
    sliderMax: 1.0,
    sliderStep: 0.01,
    sliderDefault: 0.3,
    sliderTicks: ["0.01", "0.2", "0.4", "0.6", "0.8", "1.0"],
    statusInit: "슬라이더로 민감도를 정하고 [실행]을 누르세요.",

    setup: function() {
      setupLG3D();
    },

    run: function() {
      runLG3D();
    },

    stop: function() {
      stopLG3D();
    },

    clear: function() {
      clearLG3D();
    }
  },

  summary: "로지스틱 회귀란?\n\n" +
    "• 예/아니오를 S자 곡선으로 나눈다\n" +
    "• 확률로 결과를 예측한다\n" +
    "• 너무 뾰족하게 나누면 새 데이터는 못 맞힌다\n" +
    "• 적당히 나누는 게 가장 좋다"
});

// ===== 챕터 5 전용 3D 로직 =====
const LG3D = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  passDots: [],
  failDots: [],
  sigmoidLine: null,
  running: false,
  timeoutIds: [],
  animationId: null,
  passData: [],
  failData: []
};

function setupLG3D() {
  const area = document.getElementById('experiment-area');
  area.innerHTML = `
    <div class="bp3d-overlay-top" id="lg3d-overlay-top">
      <div class="bp3d-error-overlay" id="lg3d-acc-overlay">
        정확도: 70%
      </div>
      <div class="bp3d-phase-overlay" id="lg3d-phase-overlay">대기 중</div>
    </div>
    <div class="bp3d-wrap">
      <div id="lg3d-container" class="bp3d-container"></div>
    </div>

    <div class="of3d-legend">
      <div class="of3d-legend-title">이 화면에서 이야기와 매치되는 부분</div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-mock"></span>
        <span class="of3d-legend-text"><b>파란 점 = 합격자</b> · 시험에 붙은 사람</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-new"></span>
        <span class="of3d-legend-text"><b>빨간 점 = 불합격자</b> · 시험에 떨어진 사람</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-bird"></span>
        <span class="of3d-legend-text"><b>노란 S자 곡선 = 예측 확률</b> · 합격/불합격 경계</span>
      </div>
    </div>

    <div class="bp-stage">
      <div class="bp-phase" id="lg3d-phase">현재 단계: 대기 중</div>
      <div class="bp-desc" id="lg3d-desc">[실행] 버튼을 누르면 4단계로 로지스틱 회귀 과정을 보여줍니다.</div>
    </div>

    <div class="bp-error-big">
      <div class="bp-error-big-label">정확도</div>
      <div class="bp-error-big-value">
        <span id="lg3d-acc-before">70</span>
        <span class="bp-error-arrow">→</span>
        <span id="lg3d-acc-after">70</span>
        <span class="bp-error-total">%</span>
      </div>
      <div class="bp-error-big-sub" id="lg3d-acc-sub">슬라이더를 움직여 보세요</div>
    </div>

    <div class="bp-slider-hint">
      <span class="bp-hint-left">← 약함</span>
      <span class="bp-hint-center">적당이 좋음</span>
      <span class="bp-hint-right">너무 강함 →</span>
    </div>

    <div class="bp-steps">
      <div class="bp-step" id="lg3d-step-1">① 데이터 표시</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="lg3d-step-2">② S자 곡선</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="lg3d-step-3">③ 확률 계산</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="lg3d-step-4">④ 정확도</div>
    </div>
  `;

  const container = document.getElementById('lg3d-container');
  const width = container.clientWidth;
  const height = container.clientHeight || 450;

  LG3D.scene = new THREE.Scene();
  LG3D.scene.background = new THREE.Color(0x050505);

  LG3D.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  LG3D.camera.position.set(0, 12, 16);
  LG3D.camera.lookAt(0, 2, 0);

  LG3D.renderer = new THREE.WebGLRenderer({ antialias: true });
  LG3D.renderer.setSize(width, height);
  LG3D.renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(LG3D.renderer.domElement);

  LG3D.controls = new THREE.OrbitControls(LG3D.camera, LG3D.renderer.domElement);
  LG3D.controls.enableDamping = true;
  LG3D.controls.dampingFactor = 0.1;
  LG3D.controls.target.set(0, 2, 0);
  LG3D.controls.minDistance = 10;
  LG3D.controls.maxDistance = 40;

  LG3D.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 5);
  LG3D.scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0x88ff88, 0.4);
  dir2.position.set(-5, 5, -5);
  LG3D.scene.add(dir2);

  // ===== 데이터 생성 (공부 시간 → 합격/불합격) =====
  // x: 공부 시간 (0~10), y: 합격 여부 (0 = 불합격, 1 = 합격) → 3D y: 0 or 6
  LG3D.passData = [
    [5.5, 0], [6, 0], [6.5, 0], [7, 0], [7.5, 0],
    [8, 0], [8.5, 0], [9, 0], [9.5, 0], [10, 0]
  ];
  LG3D.failData = [
    [0.5, 0], [1, 0], [1.5, 0], [2, 0], [2.5, 0],
    [3, 0], [3.5, 0], [4, 0], [4.5, 0], [5, 0]
  ];

  // 합격 점 (파랑)
  LG3D.passData.forEach(([x]) => {
    const geo = new THREE.SphereGeometry(0.3, 12, 12);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x00ccff,
      emissive: 0x00ccff,
      emissiveIntensity: 0.7
    });
    const dot = new THREE.Mesh(geo, mat);
    // x ∈ [0,10] → 3D x ∈ [-7, 7], y = 6 (위)
    const x3 = (x - 5) * 1.4;
    dot.position.set(x3, 6, 0);
    dot.visible = false;
    LG3D.scene.add(dot);
    LG3D.passDots.push(dot);
  });

  // 불합격 점 (빨강)
  LG3D.failData.forEach(([x]) => {
    const geo = new THREE.SphereGeometry(0.3, 12, 12);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      emissive: 0xff4444,
      emissiveIntensity: 0.7
    });
    const dot = new THREE.Mesh(geo, mat);
    const x3 = (x - 5) * 1.4;
    dot.position.set(x3, 0.5, 0);
    dot.visible = false;
    LG3D.scene.add(dot);
    LG3D.failDots.push(dot);
  });

  // 바닥 그리드
  const gridHelper = new THREE.GridHelper(16, 16, 0x00ff00, 0x002200);
  gridHelper.position.y = 0;
  LG3D.scene.add(gridHelper);

  // 가운데 점선 (확률 0.5)
  const midLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-8, 3.2, 0), new THREE.Vector3(8, 3.2, 0)
  ]);
  const midLine = new THREE.Line(midLineGeo, new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.3, transparent: true }));
  LG3D.scene.add(midLine);

  // S자 곡선 (초기)
  updateLG3DLine(0.01);

  function animate() {
    LG3D.animationId = requestAnimationFrame(animate);
    LG3D.controls.update();
    LG3D.renderer.render(LG3D.scene, LG3D.camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight || 450;
    LG3D.camera.aspect = w / h;
    LG3D.camera.updateProjectionMatrix();
    LG3D.renderer.setSize(w, h);
  });

  const slider = document.getElementById('chapter-slider');
  slider.addEventListener('input', () => {
    updateLG3DPreview();
    updateLG3DLine(parseFloat(slider.value));
  });
  updateLG3DPreview();
}

// ===== S자 곡선 업데이트 =====
function updateLG3DLine(lr) {
  if (LG3D.sigmoidLine) {
    LG3D.scene.remove(LG3D.sigmoidLine);
    LG3D.sigmoidLine.geometry.dispose();
    LG3D.sigmoidLine.material.dispose();
  }

  // 시그모이드: y = 1 / (1 + e^(-k * (x - x0)))
  // x0 = 5 (공부 시간 5시간이 경계)
  // k: 급격함. lr ↑ → k ↑
  const k = 0.3 + lr * 3;   // 0.3 ~ 3.3
  const x0 = 5;

  const points = [];
  const N = 100;

  for (let i = 0; i <= N; i++) {
    const x = 0 + (10 * i) / N;   // 공부 시간 0~10
    const y = 1 / (1 + Math.exp(-k * (x - x0)));   // 0~1 확률
    const x3 = (x - 5) * 1.4;
    const y3 = y * 6;   // 3D y: 0~6
    points.push(new THREE.Vector3(x3, y3, 0));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0xffdd00,
    linewidth: 3
  });
  LG3D.sigmoidLine = new THREE.Line(geo, mat);
  LG3D.scene.add(LG3D.sigmoidLine);
}

// ===== 정확도 계산 =====
function calcLG3DAcc(lr) {
  // lr ↑ → 정확도 ↑, 너무 강하면 다시 ↓ (과적합)
  let acc;
  if (lr < 0.2) {
    acc = 55 + lr * 100;         // 0.01 → 56, 0.2 → 75
  } else if (lr < 0.5) {
    acc = 75 + (lr - 0.2) * 80;   // 0.2 → 75, 0.5 → 99
  } else if (lr < 0.8) {
    acc = 99 - (lr - 0.5) * 20;   // 0.5 → 99, 0.8 → 93
  } else {
    acc = 93 - (lr - 0.8) * 165;  // 0.8 → 93, 1.0 → 60
  }
  acc = Math.max(0, Math.min(100, Math.round(acc)));
  return { acc };
}

function updateLG3DPreview() {
  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { acc } = calcLG3DAcc(lr);

  const beforeEl = document.getElementById('lg3d-acc-before');
  const afterEl = document.getElementById('lg3d-acc-after');
  const subEl = document.getElementById('lg3d-acc-sub');
  const overlayEl = document.getElementById('lg3d-acc-overlay');

  if (beforeEl) beforeEl.textContent = '70';
  if (afterEl) afterEl.textContent = acc;
  if (subEl) subEl.textContent = '민감도 ' + lr.toFixed(2) + ' · 정확도 ' + acc + '%';
  if (overlayEl) overlayEl.textContent = '정확도: 70% → ' + acc + '%';

  return { acc };
}

function setLG3DStep(stepNum) {
  [1,2,3,4].forEach(n => {
    const el = document.getElementById('lg3d-step-' + n);
    if (el) el.classList.toggle('active', n === stepNum);
  });
}

function setLG3DPhase(phase, desc, overlay) {
  const phaseEl = document.getElementById('lg3d-phase');
  const descEl = document.getElementById('lg3d-desc');
  const overlayEl = document.getElementById('lg3d-phase-overlay');
  if (phaseEl) phaseEl.textContent = '현재 단계: ' + phase;
  if (descEl) descEl.textContent = desc;
  if (overlayEl) overlayEl.textContent = overlay;
}

function resetLG3D() {
  LG3D.passDots.forEach(d => d.visible = false);
  LG3D.failDots.forEach(d => d.visible = false);
  updateLG3DLine(parseFloat(document.getElementById('chapter-slider').value));
}

function runLG3D() {
  if (LG3D.running) return;
  LG3D.running = true;

  resetLG3D();
  LG3D.timeoutIds.forEach(id => clearTimeout(id));
  LG3D.timeoutIds = [];

  const status = document.getElementById('experiment-status');
  const nextBtn = document.getElementById('step-next');
  nextBtn.style.visibility = 'hidden';

  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { acc } = updateLG3DPreview();

  // ===== ① 데이터 표시 =====
  setLG3DStep(1);
  setLG3DPhase('① 데이터 표시', '합격자(파란 점)와 불합격자(빨간 점)가 나타납니다.', '① 데이터');
  status.textContent = '① 데이터 표시 중...';

  // 합격 점 먼저
  let i = 0;
  const showPass = setInterval(() => {
    if (i < LG3D.passDots.length) {
      LG3D.passDots[i].visible = true;
      i++;
    } else {
      clearInterval(showPass);

      // 불합격 점
      let j = 0;
      const showFail = setInterval(() => {
        if (j < LG3D.failDots.length) {
          LG3D.failDots[j].visible = true;
          j++;
        } else {
          clearInterval(showFail);

          // ===== ② S자 곡선 =====
          LG3D.timeoutIds.push(setTimeout(() => {
            setLG3DStep(2);
            setLG3DPhase('② S자 곡선', '민감도 ' + lr.toFixed(2) + '로 S자 곡선을 그립니다.', '② S자 곡선');
            status.textContent = '② S자 곡선 그리는 중...';

            updateLG3DLine(lr);

            // ===== ③ 확률 계산 =====
            LG3D.timeoutIds.push(setTimeout(() => {
              setLG3DStep(3);
              setLG3DPhase('③ 확률 계산', '각 점의 합격 확률을 S자 곡선으로 계산합니다.', '③ 확률');
              status.textContent = '③ 확률 계산 중...';

              // ===== ④ 정확도 =====
              LG3D.timeoutIds.push(setTimeout(() => {
                setLG3DStep(4);

                let desc4 = '';
                let overlay4 = '④ 정확도';
                if (lr < 0.2) {
                  desc4 = '민감도가 약해서 정확도 ' + acc + '%. 경계가 흐릿합니다.';
                  overlay4 = '④ 부족';
                } else if (lr < 0.5) {
                  desc4 = '적당! 정확도 ' + acc + '%. 합격/불합격을 잘 나눕니다.';
                  overlay4 = '④ 적당!';
                } else if (lr < 0.8) {
                  desc4 = '정확도 ' + acc + '%. S자 곡선이 뾰족해집니다.';
                  overlay4 = '④ 흔들림';
                } else {
                  desc4 = '과적합! 정확도 ' + acc + '%. S자 곡선이 거의 계단이 됩니다. 새 데이터는 못 맞힙니다.';
                  overlay4 = '④ 과적합!';
                }

                setLG3DPhase('④ 정확도', desc4, overlay4);

                let msg = '';
                if (lr < 0.2) {
                  msg = '⏱️ 민감도가 약해서 정확도 ' + acc + '%. 조금 더 세게 해보세요.';
                } else if (lr < 0.5) {
                  msg = '✅ 적당한 민감도! 정확도 ' + acc + '%. 이 정도가 좋습니다.';
                } else if (lr < 0.8) {
                  msg = '⚠️ 너무 뾰족해집니다. 정확도 ' + acc + '%.';
                } else {
                  msg = '💥 과적합! S자 곡선이 계단이 됩니다. 정확도 ' + acc + '%. 조금 줄여보세요.';
                }

                status.textContent = msg;
                LG3D.running = false;
                nextBtn.style.visibility = 'visible';
              }, 1000));
            }, 1000));
          }, 800));
        }
      }, 60);
    }
  }, 60);
}

function stopLG3D() {
  LG3D.timeoutIds.forEach(id => clearTimeout(id));
  LG3D.timeoutIds = [];
  LG3D.running = false;

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '⏸️ 정지했습니다.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
  setLG3DPhase('정지', '정지했습니다. 다시 실행하거나 초기화하세요.', '정지');
}

function clearLG3D() {
  if (LG3D.running) stopLG3D();

  resetLG3D();
  setLG3DStep(0);
  setLG3DPhase('대기 중', '[실행] 버튼을 누르면 4단계로 로지스틱 회귀 과정을 보여줍니다.', '대기 중');

  updateLG3DPreview();

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '초기화했습니다. 다시 실행해 보세요.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
}