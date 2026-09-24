// 챕터 2: 역전파 (3D 막대 그래프 - 시험 성적표)
registerChapter(2, {
  name: "역전파",

  concept: "역전파는 결과의 문제를 거꾸로 짚어\n원인을 고치는 방법입니다.",

  story: {
    text: "시험 성적표를 받았습니다.\n" +
      "점수가 생각보다 낮습니다.\n\n" +
      "나는 마지막 문제부터 거꾸로 짚어봅니다.\n" +
      "'마지막 단원에서 틀렸나?'\n" +
      "'중간 단원부터 헷갈렸나?'\n" +
      "'처음 개념부터 잘못 잡았나?'\n\n" +
      "끝에서부터 하나씩 원인을 찾아\n" +
      "다음 시험엔 조금씩 고쳐 나갑니다.\n\n" +
      "이걸 반복하면\n" +
      "다음엔 더 잘하게 됩니다.",
    image: "image/doro_test.jpg"
  },

  experiment: {
    intro: "이 화면은 역전파를 시험 성적표로 비유한 것입니다.\n문제별 점수가 3D 막대로 표시되고, 낮은 문제부터 거꾸로 원인을 찾습니다.\n복습 강도를 조절하면 점수가 얼마나 오를지 예상할 수 있습니다.",
    formula: "점수 ← 점수 + ω · (틀린 원인)",
    formulaLegend: "점수 = 각 문제의 실력 (막대 높이)\nω = 복습 강도 ← 슬라이더로 조절\n(틀린 원인) = 3번 개념 부족",
    sliderLabel: "복습 강도",
    sliderDesc: "얼마나 세게 복습할지 정합니다. 너무 약하면 조금만 오르고, 너무 세면 다른 문제를 까먹습니다.",
    sliderMin: 0.01,
    sliderMax: 1.0,
    sliderStep: 0.01,
    sliderDefault: 0.3,
    sliderTicks: ["0.01", "0.2", "0.4", "0.6", "0.8", "1.0"],
    statusInit: "슬라이더로 복습 강도를 정하고 [실행]을 누르세요.",

    setup: function() {
      setupBP3D();
    },

    run: function() {
      runBP3D();
    },

    stop: function() {
      stopBP3D();
    },

    clear: function() {
      clearBP3D();
    }
  },

  summary: "역전파란?\n\n" +
    "• 결과(점수)의 문제를 뒤로 전파한다\n" +
    "• 각 단계의 책임(원인)을 계산한다\n" +
    "• 원인을 조금씩 고친다\n" +
    "• 이 과정을 반복한다"
});

// ===== 챕터 2 전용 3D 로직 =====
const BP3D = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  bars: [],
  barPositions: [],
  running: false,
  intervalId: null,
  timeoutIds: [],
  animationId: null,
  scoresBefore: [8, 7, 2, 3, 3, 2]
};

function setupBP3D() {
  const area = document.getElementById('experiment-area');
  area.innerHTML = `
    <div class="bp3d-overlay-top" id="bp3d-overlay-top">
      <div class="bp3d-error-overlay" id="bp3d-error-overlay">
        점수: 25 / 60
      </div>
      <div class="bp3d-phase-overlay" id="bp3d-phase-overlay">대기 중</div>
    </div>
    <div class="bp3d-wrap">
      <div id="bp3d-container" class="bp3d-container"></div>
    </div>

    <div class="bp-stage">
      <div class="bp-phase" id="bp-phase">현재 단계: 대기 중</div>
      <div class="bp-desc" id="bp-desc">[실행] 버튼을 누르면 4단계로 복습 과정을 보여줍니다.</div>
    </div>

    <div class="bp-error-big">
      <div class="bp-error-big-label">점수</div>
      <div class="bp-error-big-value">
        <span id="bp-score-before">25</span>
        <span class="bp-error-arrow">→</span>
        <span id="bp-score-after">25</span>
        <span class="bp-error-total">/ 60</span>
      </div>
      <div class="bp-error-big-sub" id="bp-score-sub">슬라이더를 움직여 보세요</div>
    </div>

    <div class="bp-slider-hint">
      <span class="bp-hint-left">← 약함</span>
      <span class="bp-hint-center">적당이 좋음</span>
      <span class="bp-hint-right">너무 강함 →</span>
    </div>

    <div class="bp-steps">
      <div class="bp-step" id="bp-step-1">① 6번 확인</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="bp-step-2">② 5번 확인</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="bp-step-3">③ 4번 확인</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="bp-step-4">④ 3번이 원인</div>
    </div>
  `;

  const container = document.getElementById('bp3d-container');
  const width = container.clientWidth;
  const height = container.clientHeight || 400;

  BP3D.scene = new THREE.Scene();
  BP3D.scene.background = new THREE.Color(0x050505);

  BP3D.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  BP3D.camera.position.set(0, 6, 12);
  BP3D.camera.lookAt(0, 2, 0);

  BP3D.renderer = new THREE.WebGLRenderer({ antialias: true });
  BP3D.renderer.setSize(width, height);
  BP3D.renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(BP3D.renderer.domElement);

  BP3D.controls = new THREE.OrbitControls(BP3D.camera, BP3D.renderer.domElement);
  BP3D.controls.enableDamping = true;
  BP3D.controls.dampingFactor = 0.1;
  BP3D.controls.target.set(0, 2, 0);

  BP3D.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 5);
  BP3D.scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0x88ff88, 0.4);
  dir2.position.set(-5, 5, -5);
  BP3D.scene.add(dir2);

  const xPositions = [-5, -3, -1, 1, 3, 5];
  const maxHeight = 8;

  xPositions.forEach((x, i) => {
    const score = BP3D.scoresBefore[i];
    const height = (score / 10) * maxHeight;
    const color = score <= 3 ? 0xff4444 : (score <= 6 ? 0xffb000 : 0x00ff00);

    const geo = new THREE.BoxGeometry(1.2, height, 1.2);
    const mat = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      shininess: 60
    });
    const bar = new THREE.Mesh(geo, mat);
    bar.position.set(x, height / 2, 0);
    BP3D.scene.add(bar);
    BP3D.bars.push(bar);
    BP3D.barPositions.push({ x: x, baseHeight: height, score: score });
  });

  const gridHelper = new THREE.GridHelper(14, 14, 0x00ff00, 0x003300);
  gridHelper.position.y = 0;
  BP3D.scene.add(gridHelper);

  function animate() {
    BP3D.animationId = requestAnimationFrame(animate);
    BP3D.controls.update();
    BP3D.renderer.render(BP3D.scene, BP3D.camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight || 400;
    BP3D.camera.aspect = w / h;
    BP3D.camera.updateProjectionMatrix();
    BP3D.renderer.setSize(w, h);
  });

  const slider = document.getElementById('chapter-slider');
  slider.addEventListener('input', () => {
    updateBP3DPreview();
  });
  updateBP3DPreview();
}

function updateBarHeight(index, newHeight) {
  const bar = BP3D.bars[index];
  if (!bar) return;
  bar.geometry.dispose();
  const geo = new THREE.BoxGeometry(1.2, newHeight, 1.2);
  bar.geometry = geo;
  bar.position.y = newHeight / 2;
}

function updateBP3DPreview() {
  const lr = parseFloat(document.getElementById('chapter-slider').value);

  let factor;
  if (lr < 0.1) factor = lr * 3;
  else if (lr < 0.5) factor = 1.2 * lr;
  else if (lr < 0.8) factor = 0.5;
  else factor = 0.4;

  const newScores = [...BP3D.scoresBefore];
  newScores[2] = Math.min(10, 2 + factor * 8);
  newScores[3] = Math.min(10, 3 + factor * 7);
  newScores[4] = Math.min(10, 3 + factor * 7);
  newScores[5] = Math.min(10, 2 + factor * 8);

  const totalBefore = BP3D.scoresBefore.reduce((a, b) => a + b, 0);
  const totalAfter = Math.round(newScores.reduce((a, b) => a + b, 0));

  const scoreBeforeEl = document.getElementById('bp-score-before');
  const scoreAfterEl = document.getElementById('bp-score-after');
  const scoreSubEl = document.getElementById('bp-score-sub');
  const errOverlayEl = document.getElementById('bp3d-error-overlay');

  if (scoreBeforeEl) scoreBeforeEl.textContent = totalBefore;
  if (scoreAfterEl) scoreAfterEl.textContent = totalAfter;
  if (scoreSubEl) scoreSubEl.textContent = '복습 강도 ' + lr.toFixed(2) + ' 일 때 예상';
  if (errOverlayEl) errOverlayEl.textContent = '점수: ' + totalBefore + ' → ' + totalAfter + ' / 60';

  return newScores.map(s => Math.round(s));
}

function setBP3DStep(stepNum) {
  [1,2,3,4].forEach(n => {
    const el = document.getElementById('bp-step-' + n);
    if (el) el.classList.toggle('active', n === stepNum);
  });
}

function setBP3DPhase(phase, desc, overlay) {
  const phaseEl = document.getElementById('bp-phase');
  const descEl = document.getElementById('bp-desc');
  const overlayEl = document.getElementById('bp3d-phase-overlay');
  if (phaseEl) phaseEl.textContent = '현재 단계: ' + phase;
  if (descEl) descEl.textContent = desc;
  if (overlayEl) overlayEl.textContent = overlay;
}

function resetBP3D() {
  BP3D.bars.forEach((bar, i) => {
    const score = BP3D.scoresBefore[i];
    const height = (score / 10) * 8;
    updateBarHeight(i, height);
    const color = score <= 3 ? 0xff4444 : (score <= 6 ? 0xffb000 : 0x00ff00);
    bar.material.color.setHex(color);
    bar.material.emissive.setHex(color);
    bar.material.emissiveIntensity = 0.3;
  });
}

function runBP3D() {
  if (BP3D.running) return;
  BP3D.running = true;

  resetBP3D();
  BP3D.timeoutIds.forEach(id => clearTimeout(id));
  BP3D.timeoutIds = [];

  const status = document.getElementById('experiment-status');
  const nextBtn = document.getElementById('step-next');
  nextBtn.style.visibility = 'hidden';

  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const speed = Math.max(300, 600 - lr * 300);

  const newScores = updateBP3DPreview();
  const totalBefore = BP3D.scoresBefore.reduce((a, b) => a + b, 0);
  const totalAfter = newScores.reduce((a, b) => a + b, 0);

  setBP3DStep(1);
  setBP3DPhase('① 6번 확인', '마지막 문제부터 거꾸로 짚어봅니다. 6번이 틀렸습니다.', '① 6번');
  status.textContent = '① 6번 확인 중...';

  BP3D.bars[5].material.color.setHex(0xff0000);
  BP3D.bars[5].material.emissiveIntensity = 1.0;

  BP3D.timeoutIds.push(setTimeout(() => {
    setBP3DStep(2);
    setBP3DPhase('② 5번 확인', '5번도 틀렸습니다. 원인을 더 거슬러 올라갑니다.', '② 5번');
    status.textContent = '② 5번 확인 중...';

    BP3D.bars[5].material.emissiveIntensity = 0.3;
    BP3D.bars[4].material.color.setHex(0xff0000);
    BP3D.bars[4].material.emissiveIntensity = 1.0;

    BP3D.timeoutIds.push(setTimeout(() => {
      setBP3DStep(3);
      setBP3DPhase('③ 4번 확인', '4번도 틀렸습니다. 점점 원인에 가까워집니다.', '③ 4번');
      status.textContent = '③ 4번 확인 중...';

      BP3D.bars[4].material.emissiveIntensity = 0.3;
      BP3D.bars[3].material.color.setHex(0xff0000);
      BP3D.bars[3].material.emissiveIntensity = 1.0;

      BP3D.timeoutIds.push(setTimeout(() => {
        setBP3DStep(4);
        setBP3DPhase('④ 3번이 원인!', '3번 개념이 부족해서 4·5·6번이 다 틀렸습니다. 3번을 복습하면 점수가 오릅니다.', '④ 3번 원인');
        status.textContent = '④ 3번이 진짜 원인! 복습 중... (복습 강도 ' + lr.toFixed(2) + ')';

        BP3D.bars[3].material.emissiveIntensity = 0.3;
        BP3D.bars[2].material.color.setHex(0xffb000);
        BP3D.bars[2].material.emissiveIntensity = 1.0;

        const duration = 1000;
        const startTime = Date.now();
        const startHeights = [2, 3, 3, 2].map(s => (s / 10) * 8);
        const endHeights = [newScores[2], newScores[3], newScores[4], newScores[5]]
          .map(s => (s / 10) * 8);

        function animateBars() {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / duration);
          [2, 3, 4, 5].forEach((idx, k) => {
            const h = startHeights[k] + (endHeights[k] - startHeights[k]) * t;
            updateBarHeight(idx, h);
            const bar = BP3D.bars[idx];
            const green = Math.floor(255 * t);
            const red = 255 - green;
            bar.material.color.setRGB(red / 255, 1, 0);
            bar.material.emissive.setRGB(red / 255, 1, 0);
          });
          if (t < 1) {
            requestAnimationFrame(animateBars);
          } else {
            BP3D.running = false;
            setBP3DPhase('완료',
              '점수가 ' + totalBefore + '점 → ' + totalAfter + '점으로 올랐습니다!',
              '완료');

            let msg = '';
            if (lr < 0.1) {
              msg = '⏱️ 복습이 약해서 ' + totalBefore + ' → ' + totalAfter + '점. 더 세게 복습해보세요!';
            } else if (lr < 0.5) {
              msg = '✅ 적당한 복습! ' + totalBefore + ' → ' + totalAfter + '점. 이 정도가 좋습니다.';
            } else if (lr < 0.8) {
              msg = '💪 세게 복습! ' + totalBefore + ' → ' + totalAfter + '점. 잘하고 있어요.';
            } else {
              msg = '💥 너무 세게 복습! ' + totalBefore + ' → ' + totalAfter + '점. 1·2번을 까먹을 수 있으니 조금 줄여보세요.';
            }

            status.textContent = msg;
            nextBtn.style.visibility = 'visible';
          }
        }
        animateBars();
      }, speed));
    }, speed));
  }, speed));
}

function stopBP3D() {
  if (BP3D.intervalId) {
    clearInterval(BP3D.intervalId);
    BP3D.intervalId = null;
  }
  BP3D.timeoutIds.forEach(id => clearTimeout(id));
  BP3D.timeoutIds = [];
  BP3D.running = false;

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '⏸️ 정지했습니다.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
  setBP3DPhase('정지', '정지했습니다. 다시 실행하거나 초기화하세요.', '정지');
}

function clearBP3D() {
  if (BP3D.running) stopBP3D();

  resetBP3D();
  setBP3DStep(0);
  setBP3DPhase('대기 중', '[실행] 버튼을 누르면 4단계로 복습 과정을 보여줍니다.', '대기 중');

  updateBP3DPreview();

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '초기화했습니다. 다시 실행해 보세요.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
}