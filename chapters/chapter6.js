// 챕터 6: 신경망 (3D 손글씨 숫자 인식)
registerChapter(6, {
  name: "신경망",

  concept: "신경망은 여러 층을 거치며\n복잡한 패턴을 인식하는 방법입니다.",

  story: {
    text: "손글씨 숫자 5를 컴퓨터가 인식한다고 합시다.\n" +
      "사람은 한눈에 '5'라고 알지만,\n" +
      "컴퓨터는 픽셀 하나하나만 봅니다.\n\n" +
      "여러 층을 거치며\n" +
      "곡선, 직선, 모양을 조금씩 알아갑니다.\n\n" +
      "마지막에 '이건 5다'라고 결론을 냅니다.\n\n" +
      "이게 신경망입니다.\n\n" +
      "너무 많은 층을 거치면\n" +
      "오히려 헷갈려집니다.",
    image: "image/doro_chain.png"
  },

  experiment: {
    intro: "이 화면은 신경망이 손글씨 숫자를 인식하는 과정을 보여줍니다.\n층의 수를 조절하면 은닉층 노드 개수가 달라지고, 인식 결과도 변합니다.",
    formula: "출력 = 신경망(입력 이미지)",
    formulaLegend: "입력 = 손글씨 이미지 (5)\n은닉층 = 특징을 찾는 층들 (슬라이더로 개수 조절)\n출력 = 인식된 숫자",
    sliderLabel: "층의 수 (깊이)",
    sliderDesc: "신경망이 얼마나 깊을지 정합니다. 슬라이더를 움직이면 은닉층 노드 개수가 바로 바뀝니다.",
    sliderMin: 0.01,
    sliderMax: 1.0,
    sliderStep: 0.01,
    sliderDefault: 0.3,
    sliderTicks: ["0.01", "0.2", "0.4", "0.6", "0.8", "1.0"],
    statusInit: "슬라이더로 층의 수를 정하고 [실행]을 누르세요.",

    setup: function() {
      setupNN3D();
    },

    run: function() {
      runNN3D();
    },

    stop: function() {
      stopNN3D();
    },

    clear: function() {
      clearNN3D();
    }
  },

  summary: "신경망이란?\n\n" +
    "• 여러 층을 거치며 패턴을 인식한다\n" +
    "• 각 층이 특징을 조금씩 찾아낸다\n" +
    "• 너무 깊으면 오히려 헷갈려진다\n" +
    "• 적당한 깊이가 가장 좋다"
});

// ===== 챕터 6 전용 3D 로직 =====
const NN3D = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  inputPlane: null,
  inputCanvas: null,
  inputTexture: null,
  hiddenNodes: [],         // 은닉층 노드들 (동적)
  hiddenLines: [],         // 은닉 관련 연결선 (동적)
  outputNode: null,
  outputLabel: null,
  outputLabelMat: null,
  running: false,
  timeoutIds: [],
  animationId: null,
  flowSphere: null,
  flowT: 0,
  runningFlow: false,
  currentHiddenCount: 3
};

function setupNN3D() {
  const area = document.getElementById('experiment-area');
  area.innerHTML = `
    <div class="bp3d-overlay-top" id="nn3d-overlay-top">
      <div class="bp3d-error-overlay" id="nn3d-acc-overlay">
        정확도: 70%
      </div>
      <div class="bp3d-phase-overlay" id="nn3d-phase-overlay">대기 중</div>
    </div>
    <div class="bp3d-wrap">
      <div id="nn3d-container" class="bp3d-container"></div>
    </div>

    <div class="of3d-legend">
      <div class="of3d-legend-title">이 화면에서 이야기와 매치되는 부분</div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-mock"></span>
        <span class="of3d-legend-text"><b>왼쪽 평면 = 손글씨 이미지</b> · 픽셀 데이터</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-bird"></span>
        <span class="of3d-legend-text"><b>가운데 점들 = 은닉층</b> · 슬라이더로 개수 조절</span>
      </div>
      <div class="of3d-legend-row">
        <span class="of3d-legend-dot dot-new"></span>
        <span class="of3d-legend-text"><b>오른쪽 점 = 출력</b> · 인식된 숫자</span>
      </div>
    </div>

    <div class="bp-stage">
      <div class="bp-phase" id="nn3d-phase">현재 단계: 대기 중</div>
      <div class="bp-desc" id="nn3d-desc">[실행] 버튼을 누르면 4단계로 숫자 인식 과정을 보여줍니다.</div>
    </div>

    <div class="bp-error-big">
      <div class="bp-error-big-label">정확도</div>
      <div class="bp-error-big-value">
        <span id="nn3d-acc-before">70</span>
        <span class="bp-error-arrow">→</span>
        <span id="nn3d-acc-after">70</span>
        <span class="bp-error-total">%</span>
      </div>
      <div class="bp-error-big-sub" id="nn3d-acc-sub">슬라이더를 움직여 보세요</div>
    </div>

    <div class="bp-slider-hint">
      <span class="bp-hint-left">← 얕음</span>
      <span class="bp-hint-center">적당이 좋음</span>
      <span class="bp-hint-right">너무 깊음 →</span>
    </div>

    <div class="bp-steps">
      <div class="bp-step" id="nn3d-step-1">① 숫자 입력</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="nn3d-step-2">② 은닉층 처리</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="nn3d-step-3">③ 특징 추출</div>
      <div class="bp-step-arrow">→</div>
      <div class="bp-step" id="nn3d-step-4">④ 숫자 인식</div>
    </div>
  `;

  const container = document.getElementById('nn3d-container');
  const width = container.clientWidth;
  const height = container.clientHeight || 450;

  NN3D.scene = new THREE.Scene();
  NN3D.scene.background = new THREE.Color(0x050505);

  NN3D.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  NN3D.camera.position.set(-3, 8, 14);
  NN3D.camera.lookAt(-2, 0, 0);

  NN3D.renderer = new THREE.WebGLRenderer({ antialias: true });
  NN3D.renderer.setSize(width, height);
  NN3D.renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(NN3D.renderer.domElement);

  NN3D.controls = new THREE.OrbitControls(NN3D.camera, NN3D.renderer.domElement);
  NN3D.controls.enableDamping = true;
  NN3D.controls.dampingFactor = 0.1;
  NN3D.controls.target.set(-2, 0, 0);
  NN3D.controls.minDistance = 10;
  NN3D.controls.maxDistance = 40;

  NN3D.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 5);
  NN3D.scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0x88ff88, 0.4);
  dir2.position.set(-5, 5, -5);
  NN3D.scene.add(dir2);

  // ===== 입력 이미지 평면 (숫자 5) =====
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#00ccff';
  ctx.font = 'bold 200px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('5', 128, 140);
  NN3D.inputCanvas = canvas;

  const texture = new THREE.CanvasTexture(canvas);
  NN3D.inputTexture = texture;

  const planeGeo = new THREE.PlaneGeometry(4, 4);
  const planeMat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: false
  });
  NN3D.inputPlane = new THREE.Mesh(planeGeo, planeMat);
  NN3D.inputPlane.position.set(-8, 0, 0);
  NN3D.scene.add(NN3D.inputPlane);

  const planeEdgeGeo = new THREE.EdgesGeometry(planeGeo);
  const planeEdgeLine = new THREE.LineSegments(planeEdgeGeo, new THREE.LineBasicMaterial({ color: 0x00ccff }));
  planeEdgeLine.position.copy(NN3D.inputPlane.position);
  NN3D.scene.add(planeEdgeLine);

  // ===== 출력 노드 =====
  const outGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const outMat = new THREE.MeshPhongMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5,
    shininess: 80
  });
  NN3D.outputNode = new THREE.Mesh(outGeo, outMat);
  NN3D.outputNode.position.set(8, 0, 0);
  NN3D.outputNode.visible = false;
  NN3D.scene.add(NN3D.outputNode);

  // ===== 출력 라벨 ("5") =====
  const outCanvas = document.createElement('canvas');
  outCanvas.width = 256;
  outCanvas.height = 256;
  const outCtx = outCanvas.getContext('2d');
  outCtx.fillStyle = '#000000';
  outCtx.fillRect(0, 0, 256, 256);
  outCtx.fillStyle = '#ff00ff';
  outCtx.font = 'bold 200px Arial';
  outCtx.textAlign = 'center';
  outCtx.textBaseline = 'middle';
  outCtx.fillText('5', 128, 140);
  const outTexture = new THREE.CanvasTexture(outCanvas);
  const outLabelGeo = new THREE.PlaneGeometry(3, 3);
  NN3D.outputLabelMat = new THREE.MeshBasicMaterial({
    map: outTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1.0
  });
  NN3D.outputLabel = new THREE.Mesh(outLabelGeo, NN3D.outputLabelMat);
  NN3D.outputLabel.position.set(8, 0, 0.7);
  NN3D.outputLabel.visible = false;
  NN3D.scene.add(NN3D.outputLabel);

  // ===== 바닥 그리드 =====
  const gridHelper = new THREE.GridHelper(24, 24, 0x00ff00, 0x002200);
  gridHelper.position.y = -3;
  NN3D.scene.add(gridHelper);

  // ===== 흐르는 구 =====
  const flowGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const flowMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2.0,
    shininess: 100
  });
  NN3D.flowSphere = new THREE.Mesh(flowGeo, flowMat);
  NN3D.flowSphere.visible = false;
  NN3D.scene.add(NN3D.flowSphere);

  function animate() {
    NN3D.animationId = requestAnimationFrame(animate);
    if (NN3D.runningFlow) {
      updateFlowSphere();
    }
    NN3D.controls.update();
    NN3D.renderer.render(NN3D.scene, NN3D.camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight || 450;
    NN3D.camera.aspect = w / h;
    NN3D.camera.updateProjectionMatrix();
    NN3D.renderer.setSize(w, h);
  });

  const slider = document.getElementById('chapter-slider');
  slider.addEventListener('input', () => {
    const lr = parseFloat(slider.value);
    updateNN3DPreview();
    rebuildHiddenLayer(lr);   // ★ 슬라이더 움직이면 은닉층 재구성
  });

  // 초기 은닉층 생성
  rebuildHiddenLayer(parseFloat(slider.value));
  updateNN3DPreview();
}

// ===== 은닉층 노드 개수 결정 =====
function getHiddenCount(lr) {
  if (lr < 0.2) return 1;
  if (lr < 0.5) return 3;
  if (lr < 0.8) return 5;
  return 7;
}

// ===== 은닉층 재구성 (슬라이더 반영) =====
function rebuildHiddenLayer(lr) {
  // 기존 노드 제거
  NN3D.hiddenNodes.forEach(node => {
    NN3D.scene.remove(node);
    node.geometry.dispose();
    node.material.dispose();
  });
  NN3D.hiddenNodes = [];

  // 기존 연결선 제거
  NN3D.hiddenLines.forEach(line => {
    NN3D.scene.remove(line);
    line.geometry.dispose();
    line.material.dispose();
  });
  NN3D.hiddenLines = [];

  // 새 노드 개수
  const count = getHiddenCount(lr);
  NN3D.currentHiddenCount = count;

  // Y 위치 분배 (count 개를 -3 ~ 3 사이에 균등 배치)
  const hiddenX = 0;
  const yRange = 3;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const y = count === 1
      ? 0
      : -yRange + (2 * yRange * i) / (count - 1);
    positions.push(y);
  }

  // 노드 생성
  positions.forEach(y => {
    const geo = new THREE.SphereGeometry(0.5, 16, 16);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xffdd00,
      emissive: 0xffdd00,
      emissiveIntensity: 0.5,
      shininess: 80
    });
    const node = new THREE.Mesh(geo, mat);
    node.position.set(hiddenX, y, 0);
    node.visible = false;   // 실행 시 표시
    NN3D.scene.add(node);
    NN3D.hiddenNodes.push(node);
  });

  // 연결선: 입력 → 은닉
  NN3D.hiddenNodes.forEach(node => {
    const points = [
      new THREE.Vector3(-6, 0, 0),
      node.position.clone()
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.15 });
    const line = new THREE.Line(geo, mat);
    line.userData = { layerIdx: 0 };
    NN3D.scene.add(line);
    NN3D.hiddenLines.push(line);
  });

  // 연결선: 은닉 → 출력
  NN3D.hiddenNodes.forEach(node => {
    const points = [
      node.position.clone(),
      new THREE.Vector3(7.4, 0, 0)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.15 });
    const line = new THREE.Line(geo, mat);
    line.userData = { layerIdx: 1 };
    NN3D.scene.add(line);
    NN3D.hiddenLines.push(line);
  });
}

// 흐르는 구 업데이트
function updateFlowSphere() {
  NN3D.flowT += 0.008;
  if (NN3D.flowT > 1) NN3D.flowT = 0;

  let x;
  if (NN3D.flowT < 0.5) {
    x = -8 + (8 * NN3D.flowT) / 0.5;
  } else {
    x = 0 + (8 * (NN3D.flowT - 0.5)) / 0.5;
  }
  NN3D.flowSphere.position.set(x, 0, 0);
}

// 정확도 계산
function calcNN3DPerf(lr) {
  let perf;
  if (lr < 0.2) {
    perf = 50 + lr * 100;         // 0.01 → 51, 0.2 → 70
  } else if (lr < 0.5) {
    perf = 70 + (lr - 0.2) * 100;  // 0.2 → 70, 0.5 → 100
  } else if (lr < 0.8) {
    perf = 100 - (lr - 0.5) * 30;  // 0.5 → 100, 0.8 → 91
  } else {
    perf = 91 - (lr - 0.8) * 175;  // 0.8 → 91, 1.0 → 56
  }
  perf = Math.max(0, Math.min(100, Math.round(perf)));
  return { perf };
}

function updateNN3DPreview() {
  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { perf } = calcNN3DPerf(lr);

  const beforeEl = document.getElementById('nn3d-acc-before');
  const afterEl = document.getElementById('nn3d-acc-after');
  const subEl = document.getElementById('nn3d-acc-sub');
  const overlayEl = document.getElementById('nn3d-acc-overlay');

  if (beforeEl) beforeEl.textContent = '70';
  if (afterEl) afterEl.textContent = perf;
  if (subEl) subEl.textContent = '깊이 ' + lr.toFixed(2) + ' · 은닉 노드 ' + NN3D.currentHiddenCount + '개 · 정확도 ' + perf + '%';
  if (overlayEl) overlayEl.textContent = '정확도: 70% → ' + perf + '%';

  // ★ 출력 라벨 opacity (적합도에 따라)
  if (NN3D.outputLabelMat) {
    if (lr < 0.2) {
      NN3D.outputLabelMat.opacity = 0.35;   // 얕음 → 흐릿
    } else if (lr < 0.5) {
      NN3D.outputLabelMat.opacity = 1.0;    // 적당 → 선명
    } else if (lr < 0.8) {
      NN3D.outputLabelMat.opacity = 0.8;    // 깊음 → 약간 흐림
    } else {
      NN3D.outputLabelMat.opacity = 0.5;    // 너무 깊음 → 흐릿
    }
  }

  return { perf };
}

function setNN3DStep(stepNum) {
  [1,2,3,4].forEach(n => {
    const el = document.getElementById('nn3d-step-' + n);
    if (el) el.classList.toggle('active', n === stepNum);
  });
}

function setNN3DPhase(phase, desc, overlay) {
  const phaseEl = document.getElementById('nn3d-phase');
  const descEl = document.getElementById('nn3d-desc');
  const overlayEl = document.getElementById('nn3d-phase-overlay');
  if (phaseEl) phaseEl.textContent = '현재 단계: ' + phase;
  if (descEl) descEl.textContent = desc;
  if (overlayEl) overlayEl.textContent = overlay;
}

function resetNN3D() {
  NN3D.hiddenNodes.forEach(n => {
    n.visible = false;
    n.material.emissiveIntensity = 0.5;
  });
  if (NN3D.outputNode) {
    NN3D.outputNode.visible = false;
    NN3D.outputNode.material.emissiveIntensity = 0.5;
  }
  if (NN3D.outputLabel) NN3D.outputLabel.visible = false;
  NN3D.hiddenLines.forEach(l => l.material.opacity = 0.15);
  NN3D.flowSphere.visible = false;
  NN3D.flowT = 0;
  NN3D.runningFlow = false;
}

function runNN3D() {
  if (NN3D.running) return;
  NN3D.running = true;

  resetNN3D();
  NN3D.timeoutIds.forEach(id => clearTimeout(id));
  NN3D.timeoutIds = [];

  const status = document.getElementById('experiment-status');
  const nextBtn = document.getElementById('step-next');
  nextBtn.style.visibility = 'hidden';

  const lr = parseFloat(document.getElementById('chapter-slider').value);
  const { perf } = updateNN3DPreview();

  // ===== ① 숫자 입력 =====
  setNN3DStep(1);
  setNN3DPhase('① 숫자 입력', '손글씨 숫자 5가 입력 이미지로 들어옵니다.', '① 숫자 입력');
  status.textContent = '① 손글씨 5 입력...';

  NN3D.timeoutIds.push(setTimeout(() => {
    // ===== ② 은닉층 처리 =====
    setNN3DStep(2);
    setNN3DPhase('② 은닉층 처리', '이미지가 은닉층 ' + NN3D.hiddenNodes.length + '개 노드로 변환됩니다.', '② 은닉층');
    status.textContent = '② 은닉층으로 전달 중... (' + NN3D.hiddenNodes.length + '개)';

    NN3D.hiddenNodes.forEach((node, i) => {
      NN3D.timeoutIds.push(setTimeout(() => {
        node.visible = true;
        node.material.emissiveIntensity = 1.0;
      }, i * 200));
    });

    // 입력 → 은닉 연결선 활성화
    NN3D.hiddenLines.forEach(l => {
      if (l.userData.layerIdx === 0) l.material.opacity = 0.7;
    });

    NN3D.timeoutIds.push(setTimeout(() => {
      // ===== ③ 특징 추출 =====
      setNN3DStep(3);
      setNN3DPhase('③ 특징 추출', '각 은닉 노드가 곡선·직선 등의 특징을 찾습니다.', '③ 특징 추출');
      status.textContent = '③ 특징 추출 중...';

      NN3D.flowSphere.visible = true;
      NN3D.runningFlow = true;

      NN3D.timeoutIds.push(setTimeout(() => {
        // ===== ④ 숫자 인식 =====
        setNN3DStep(4);
        setNN3DPhase('④ 숫자 인식', '마지막에 "이건 5다"라고 결론을 냅니다.', '④ 숫자 인식');
        status.textContent = '④ 최종 인식...';

        NN3D.outputNode.visible = true;
        NN3D.outputNode.material.emissiveIntensity = 2.0;
        NN3D.outputLabel.visible = true;

        NN3D.hiddenLines.forEach(l => {
          if (l.userData.layerIdx === 1) l.material.opacity = 0.7;
        });

        NN3D.timeoutIds.push(setTimeout(() => {
          let desc4 = '';
          let overlay4 = '④ 인식';
          if (lr < 0.2) {
            desc4 = '층이 얕아서(은닉 ' + NN3D.hiddenNodes.length + '개) 정확도 ' + perf + '%. 단순한 특징만 찾습니다.';
            overlay4 = '④ 부족';
          } else if (lr < 0.5) {
            desc4 = '적당! (은닉 ' + NN3D.hiddenNodes.length + '개) 정확도 ' + perf + '%. "5"를 잘 인식했습니다.';
            overlay4 = '④ 인식!';
          } else if (lr < 0.8) {
            desc4 = '층이 많아짐 (은닉 ' + NN3D.hiddenNodes.length + '개) 정확도 ' + perf + '%. 살짝 흔들립니다.';
            overlay4 = '④ 흔들림';
          } else {
            desc4 = '과적합! (은닉 ' + NN3D.hiddenNodes.length + '개) 정확도 ' + perf + '%. 층이 너무 많아 헷갈립니다.';
            overlay4 = '④ 과적합!';
          }

          setNN3DPhase('④ 숫자 인식', desc4, overlay4);

          let msg = '';
          if (lr < 0.2) {
            msg = '⏱️ 층이 얕아서(은닉 ' + NN3D.hiddenNodes.length + '개) 정확도 ' + perf + '%. 조금 더 쌓아보세요.';
          } else if (lr < 0.5) {
            msg = '✅ 적당한 깊이! (은닉 ' + NN3D.hiddenNodes.length + '개) 정확도 ' + perf + '%. "5"를 잘 인식했습니다.';
          } else if (lr < 0.8) {
            msg = '⚠️ 층이 많아집니다 (은닉 ' + NN3D.hiddenNodes.length + '개). 정확도 ' + perf + '%.';
          } else {
            msg = '💥 과적합! 은닉 ' + NN3D.hiddenNodes.length + '개는 너무 많습니다. 정확도 ' + perf + '%. 조금 줄여보세요.';
          }

          status.textContent = msg;
          NN3D.running = false;
          nextBtn.style.visibility = 'visible';
        }, 1000));
      }, 2000));
    }, NN3D.hiddenNodes.length * 200 + 400));
  }, 800));
}

function stopNN3D() {
  NN3D.timeoutIds.forEach(id => clearTimeout(id));
  NN3D.timeoutIds = [];
  NN3D.running = false;
  NN3D.runningFlow = false;

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '⏸️ 정지했습니다.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
  setNN3DPhase('정지', '정지했습니다. 다시 실행하거나 초기화하세요.', '정지');
}

function clearNN3D() {
  if (NN3D.running) stopNN3D();

  resetNN3D();
  setNN3DStep(0);
  setNN3DPhase('대기 중', '[실행] 버튼을 누르면 4단계로 숫자 인식 과정을 보여줍니다.', '대기 중');

  updateNN3DPreview();

  const status = document.getElementById('experiment-status');
  if (status) status.textContent = '초기화했습니다. 다시 실행해 보세요.';
  const nextBtn = document.getElementById('step-next');
  if (nextBtn) nextBtn.style.visibility = 'visible';
}