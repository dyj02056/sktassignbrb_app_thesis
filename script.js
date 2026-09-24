// ===== 챕터 레지스트리 =====
const CHAPTERS = {};

function registerChapter(num, data) {
  CHAPTERS[num] = data;
}

// ===== 화면 전환 =====
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  skipped = false;
  if (id === 'screen-intro') typeIntro();
  if (id === 'screen-chapters') {
    resetChapters();
    typeChapters();
  }
}

function goBack() {
  const current = document.querySelector('.screen.active');
  if (!current) return;
  const order = ['screen-title', 'screen-intro', 'screen-chapters'];
  const idx = order.indexOf(current.id);
  if (idx > 0) {
    goTo(order[idx - 1]);
  } else if (current.id === 'screen-chapter') {
    goTo('screen-chapters');
  }
}

// ===== 챕터 선택 리셋 =====
function resetChapters() {
  chaptersTyped = false;
  [1,2,3,4,5,6].forEach(n => {
    const el = document.getElementById('chap-item-' + n);
    if (el) {
      el.style.display = 'none';
      el.textContent = '';
    }
  });
  const inputLine = document.getElementById('chapter-input-line');
  if (inputLine) inputLine.style.display = 'none';
}

// ===== 챕터 열기 =====
function openChapter(num) {
  const data = CHAPTERS[num];
  if (!data) {
    alert('Chapter ' + num + ' — 아직 준비 중입니다.');
    return;
  }
  renderChapterStep(num, 'concept');
}

function renderChapterStep(num, step) {
  const data = CHAPTERS[num];
  const el = document.getElementById('screen-chapter');

  el.innerHTML = `
    <button class="back-btn" onclick="goBack()">&lt; BACK</button>
    <div class="prompt">C:\\ML_PLAY&gt; chapter_${num}.${step}</div>
    <div class="chapter-content" id="chapter-content-inner"></div>
  `;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  window.scrollTo(0, 0);

  skipped = false;

  if (step === 'concept') renderConcept(data, num);
  else if (step === 'story') renderStory(data, num);
  else if (step === 'experiment') renderExperiment(data, num);
  else if (step === 'summary') renderSummary(data, num);
}

// ===== 각 step 렌더러 =====
function renderConcept(data, num) {
  skipped = false;
  const inner = document.getElementById('chapter-content-inner');
  inner.innerHTML = `
    <div class="chapter-label" id="step-label"></div>
    <div class="chapter-name" id="step-name"></div>
    <div class="divider"></div>
    <div class="chapter-text" id="step-text"></div>
    <button class="next-btn" id="step-next" style="visibility:hidden;" onclick="renderChapterStep(${num}, 'story')">[ 다음 ]</button>
  `;
  (async () => {
    await typeText(document.getElementById('step-label'), "Chapter " + num, 40);
    await typeText(document.getElementById('step-name'), data.name, 40);
    await typeText(document.getElementById('step-text'), data.concept, 35);
    document.getElementById('step-next').style.visibility = 'visible';
  })();
}

function renderStory(data, num) {
  skipped = false;
  const inner = document.getElementById('chapter-content-inner');
  inner.innerHTML = `
    <div class="chapter-label" id="step-label"></div>
    <div class="story-layout">
      <div class="story-text" id="step-text"></div>
      <div class="story-image-wrap" id="step-img-wrap" style="visibility:hidden;">
        <img src="${data.story.image}" alt="${data.name} 이야기" class="story-image">
      </div>
    </div>
    <button class="next-btn" id="step-next" style="visibility:hidden;" onclick="renderChapterStep(${num}, 'experiment')">[ 직접 해보기 ]</button>
  `;
  (async () => {
    await typeText(document.getElementById('step-label'), "Chapter " + num + " · 이야기", 40);
    await typeText(document.getElementById('step-text'), data.story.text, 30);
    await sleep(400);
    document.getElementById('step-img-wrap').style.visibility = 'visible';
    await sleep(400);
    document.getElementById('step-next').style.visibility = 'visible';
  })();
}

function renderExperiment(data, num) {
  skipped = false;
  const inner = document.getElementById('chapter-content-inner');
  inner.innerHTML = `
    <div class="chapter-label" id="step-label"></div>
    <div class="experiment-intro" id="exp-intro"></div>
    <div class="formula-box">
      <div class="formula-title">공식</div>
      <div class="formula" id="exp-formula"></div>
      <div class="formula-legend" id="exp-legend"></div>
    </div>
    <div class="experiment-area" id="experiment-area"></div>
    <div class="slider-area">
      <label id="exp-slider-label"></label>
      <div class="slider-desc" id="exp-slider-desc"></div>
      <input type="range" id="chapter-slider"
        min="${data.experiment.sliderMin}"
        max="${data.experiment.sliderMax}"
        step="${data.experiment.sliderStep}"
        value="${data.experiment.sliderDefault}">
      <div class="slider-ticks" id="slider-ticks"></div>
      <div class="slider-current">현재: <span id="slider-value">${data.experiment.sliderDefault}</span></div>
    </div>
    <div class="experiment-status" id="experiment-status">${data.experiment.statusInit}</div>
    <div class="experiment-buttons">
      <button class="next-btn" id="experiment-run">[ 실행 ]</button>
      <button class="next-btn" id="experiment-stop">[ 정지 ]</button>
      <button class="next-btn" id="experiment-clear">[ 초기화 ]</button>
      <button class="next-btn" id="step-next" style="visibility:hidden;" onclick="renderChapterStep(${num}, 'summary')">[ 다음 ]</button>
    </div>
  `;

  // 슬라이더 이벤트
  const slider = document.getElementById('chapter-slider');
  const valEl = document.getElementById('slider-value');
  slider.addEventListener('input', () => {
    valEl.textContent = parseFloat(slider.value).toFixed(2);
  });

  // 눈금
  if (data.experiment.sliderTicks) {
    const ticks = document.getElementById('slider-ticks');
    ticks.innerHTML = data.experiment.sliderTicks
      .map(t => `<span>${t}</span>`).join('');
  }

  // 버튼 이벤트
  document.getElementById('experiment-run').onclick = () => {
    data.experiment.run();
  };
  document.getElementById('experiment-stop').onclick = () => {
    if (data.experiment.stop) data.experiment.stop();
  };
  document.getElementById('experiment-clear').onclick = () => {
    if (data.experiment.clear) data.experiment.clear();
  };

  // 순차 타이핑 + setup
  (async () => {
    await typeText(document.getElementById('step-label'), "Chapter " + num + " · 직접 해보기", 40);
    await typeText(document.getElementById('exp-intro'), data.experiment.intro, 30);
    await typeText(document.getElementById('exp-formula'), data.experiment.formula, 40);
    await typeText(document.getElementById('exp-legend'), data.experiment.formulaLegend, 25);
    await typeText(document.getElementById('exp-slider-label'), data.experiment.sliderLabel, 40);
    await typeText(document.getElementById('exp-slider-desc'), data.experiment.sliderDesc, 25);

    // 타이핑 끝난 후 3D/2D 초기화
    if (data.experiment.setup) data.experiment.setup();
  })();
}

function renderSummary(data, num) {
  skipped = false;
  const inner = document.getElementById('chapter-content-inner');
  inner.innerHTML = `
    <div class="chapter-label" id="step-label"></div>
    <div class="chapter-text" id="step-text"></div>
    <button class="next-btn" onclick="goTo('screen-chapters')">[ 다른 챕터 보기 ]</button>
  `;
  (async () => {
    await typeText(document.getElementById('step-label'), "Chapter " + num + " · 핵심 요약", 40);
    await typeText(document.getElementById('step-text'), data.summary, 25);
  })();
}

// ===== 유틸: 타이핑 (클릭 시 스킵) =====
let currentTyping = null;
let skipped = false;

function typeText(el, text, speed) {
  return new Promise(resolve => {
    if (!el) { resolve(); return; }
    let i = 0;
    currentTyping = { el, text, resolve };

    function step() {
      if (skipped) {
        el.textContent = text;
        currentTyping = null;
        resolve();
        return;
      }
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(step, speed);
      } else {
        currentTyping = null;
        resolve();
      }
    }
    step();
  });
}

function typeList(ul, items, speed) {
  return new Promise(async resolve => {
    for (let k = 0; k < items.length; k++) {
      const li = document.createElement('li');
      ul.appendChild(li);
      await typeText(li, items[k], speed);

      if (skipped && k < items.length - 1) {
        for (let r = k + 1; r < items.length; r++) {
          const li2 = document.createElement('li');
          li2.textContent = items[r];
          ul.appendChild(li2);
        }
        resolve();
        return;
      }
      await sleep(150);
    }
    resolve();
  });
}

function sleep(ms) {
  return new Promise(resolve => {
    const start = Date.now();
    function check() {
      if (skipped || Date.now() - start >= ms) {
        resolve();
        return;
      }
      setTimeout(check, 20);
    }
    check();
  });
}

// ★ 클릭 리스너 — 버튼/챕터항목/입력 등은 스킵 대상 아님
document.addEventListener('click', (e) => {
  let target = e.target;
  if (target.nodeType === 3) target = target.parentElement;

  if (target && target.closest) {
    if (target.closest('button')) return;
    if (target.closest('.chapter-item')) return;
    if (target.closest('.back-btn')) return;
    if (target.closest('.start-btn')) return;
    if (target.closest('.next-btn')) return;
    if (target.closest('input')) return;
  }

  skipped = true;
  if (currentTyping) {
    currentTyping.el.textContent = currentTyping.text;
    const resolve = currentTyping.resolve;
    currentTyping = null;
    resolve();
  }
});

// ===== 타이틀 =====
const TITLE_ASCII = `███╗   ███╗██╗     ██████╗ ██╗      █████╗ ██╗   ██╗
████╗ ████║██║     ██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝
██╔████╔██║██║     ██████╔╝██║     ███████║ ╚████╔╝
██║╚██╔╝██║██║     ██╔═══╝ ██║     ██╔══██║  ╚██╔╝
██║ ╚═╝ ██║███████╗██║     ███████╗██║  ██║   ██║
╚═╝     ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝`;

const TITLE_SUBTITLE = "> 외우지 말고, 이해하세요";

function typeTitle() {
  skipped = false;
  const asciiEl = document.getElementById('title-ascii');
  const subEl = document.getElementById('title-subtitle');
  const startWrap = document.getElementById('start-wrap');

  let i = 0;
  function stepAscii() {
    if (skipped) {
      asciiEl.textContent = TITLE_ASCII;
      stepSubtitle();
      return;
    }
    if (i < TITLE_ASCII.length) {
      asciiEl.textContent += TITLE_ASCII[i++];
      setTimeout(stepAscii, 3);
    } else setTimeout(stepSubtitle, 300);
  }

  let j = 0;
  function stepSubtitle() {
    if (skipped) {
      subEl.textContent = TITLE_SUBTITLE;
      startWrap.style.visibility = 'visible';
      return;
    }
    if (j < TITLE_SUBTITLE.length) {
      subEl.textContent += TITLE_SUBTITLE[j++];
      setTimeout(stepSubtitle, 40);
    } else startWrap.style.visibility = 'visible';
  }

  stepAscii();
}

// ===== 안내 =====
let introTyped = false;
async function typeIntro() {
  if (introTyped) return;
  introTyped = true;

  const titleEl = document.getElementById('intro-paper-title');
  const subEl = document.getElementById('intro-paper-sub');
  const badBox = document.getElementById('intro-bad-box');
  const badTitle = document.getElementById('intro-bad-title');
  const badBubble = document.getElementById('intro-bad-bubble');
  const badImg = document.getElementById('intro-bad-img');
  const badList = document.getElementById('intro-bad-list');
  const goodBox = document.getElementById('intro-good-box');
  const goodTitle = document.getElementById('intro-good-title');
  const goodBubble = document.getElementById('intro-good-bubble');
  const goodImg = document.getElementById('intro-good-img');
  const goodList = document.getElementById('intro-good-list');
  const nextBtn = document.getElementById('intro-next-btn');

  await typeText(titleEl, "LLM은 새로운 개념을 어떻게 학습하는가", 40);
  await sleep(300);
  await typeText(subEl, ": 공식 중심 설명과 스토리 중심 설명의 효과 비교", 30);
  await sleep(500);

  badBox.style.visibility = 'visible';
  await typeText(badTitle, "나쁜 답변", 50);
  await sleep(200);
  await typeText(badBubble, "공식 설명", 50);
  await sleep(200);
  badImg.style.visibility = 'visible';
  await sleep(400);
  await typeList(badList, [
    "시간이 오래 걸림",
    "지적허영심을 뽐내는 것 같음",
    "지루하고 현학적임",
    "논쟁 발생 가능성 100%",
    "논쟁에서 밀리면 내 세상이 무너짐"
  ], 25);
  await sleep(500);

  goodBox.style.visibility = 'visible';
  await typeText(goodTitle, "좋은 답변", 50);
  await sleep(200);
  await typeText(goodBubble, "스토리 + 체험", 50);
  await sleep(200);
  goodImg.style.visibility = 'visible';
  await sleep(400);
  await typeList(goodList, [
    "금방 끝남",
    "오래 기억에 남음",
    "팩트임",
    "간단하고 사전 지식이 필요 없음",
    "논쟁에서 밀릴 확률 0%에 수렴함"
  ], 25);
  await sleep(500);

  nextBtn.style.visibility = 'visible';
}

// ===== 챕터 선택 (한 글자씩) =====
let chaptersTyped = false;
async function typeChapters() {
  if (chaptersTyped) return;
  chaptersTyped = true;

  const items = [
    { id: 'chap-item-1', text: '[1] 경사하강법' },
    { id: 'chap-item-2', text: '[2] 역전파' },
    { id: 'chap-item-3', text: '[3] 과적합' },
    { id: 'chap-item-4', text: '[4] 선형 회귀' },
    { id: 'chap-item-5', text: '[5] 로지스틱 회귀' },
    { id: 'chap-item-6', text: '[6] 신경망' }
  ];

  for (let k = 0; k < items.length; k++) {
    const el = document.getElementById(items[k].id);
    if (!el) continue;
    el.style.display = 'block';
    el.textContent = '';

    await typeText(el, items[k].text, 40);

    if (skipped && k < items.length - 1) {
      for (let r = k + 1; r < items.length; r++) {
        const el2 = document.getElementById(items[r].id);
        if (el2) {
          el2.style.display = 'block';
          el2.textContent = items[r].text;
        }
      }
      break;
    }
    await sleep(100);
  }

  const inputLine = document.getElementById('chapter-input-line');
  if (inputLine) inputLine.style.display = 'block';
}

// ===== 시작 =====
window.addEventListener('DOMContentLoaded', () => {
  typeTitle();
});

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('screen-chapters').classList.contains('active')) return;
  if (e.key >= '1' && e.key <= '6') {
    openChapter(parseInt(e.key));
  }
});