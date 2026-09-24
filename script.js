// 화면 순서 (뒤로 가기용)
const SCREEN_ORDER = ['screen-title', 'screen-intro', 'screen-chapters'];

// 화면 전환
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  if (id === 'screen-intro') typeIntro();
}

// 뒤로 가기
function goBack() {
  const current = document.querySelector('.screen.active');
  if (!current) return;
  const idx = SCREEN_ORDER.indexOf(current.id);
  if (idx > 0) {
    goTo(SCREEN_ORDER[idx - 1]);
  }
}

// ===== 타이틀 화면 타이핑 =====
const TITLE_ASCII = `███╗   ███╗██╗     ██████╗ ██╗      █████╗ ██╗   ██╗
████╗ ████║██║     ██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝
██╔████╔██║██║     ██████╔╝██║     ███████║ ╚████╔╝
██║╚██╔╝██║██║     ██╔═══╝ ██║     ██╔══██║  ╚██╔╝
██║ ╚═╝ ██║███████╗██║     ███████╗██║  ██║   ██║
╚═╝     ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝`;

const TITLE_SUBTITLE = "> 외우지 말고, 이해하세요";

function typeTitle() {
  const asciiEl = document.getElementById('title-ascii');
  const subEl = document.getElementById('title-subtitle');
  const startWrap = document.getElementById('start-wrap');

  let i = 0;
  function stepAscii() {
    if (i < TITLE_ASCII.length) {
      asciiEl.textContent += TITLE_ASCII[i++];
      setTimeout(stepAscii, 3);
    } else {
      setTimeout(stepSubtitle, 300);
    }
  }

  let j = 0;
  function stepSubtitle() {
    if (j < TITLE_SUBTITLE.length) {
      subEl.textContent += TITLE_SUBTITLE[j++];
      setTimeout(stepSubtitle, 40);
    } else {
      startWrap.style.visibility = 'visible';
    }
  }

  stepAscii();
}

// ===== 안내 화면 타이핑 =====
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

  // 1) 논문 제목
  await typeText(titleEl, "LLM은 새로운 개념을 어떻게 학습하는가", 40);
  await sleep(300);

  // 2) 논문 부제
  await typeText(subEl, ": 공식 중심 설명과 스토리 중심 설명의 효과 비교", 30);
  await sleep(500);

  // 3) 나쁜 답변 박스
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

  // 4) 좋은 답변 박스
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

  // 5) 다음 버튼
  nextBtn.style.visibility = 'visible';
}

// 유틸: 텍스트 타이핑
function typeText(el, text, speed) {
  return new Promise(resolve => {
    let i = 0;
    function step() {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(step, speed);
      } else {
        resolve();
      }
    }
    step();
  });
}

// 유틸: 리스트 타이핑
function typeList(ul, items, speed) {
  return new Promise(async resolve => {
    for (const item of items) {
      const li = document.createElement('li');
      ul.appendChild(li);
      await typeText(li, item, speed);
      await sleep(150);
    }
    resolve();
  });
}

// 유틸: 대기
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== 시작 =====
window.addEventListener('DOMContentLoaded', () => {
  typeTitle();
});

// 챕터 번호 입력 (임시)
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('screen-chapters').classList.contains('active')) return;
  if (e.key >= '1' && e.key <= '6') {
    alert('Chapter ' + e.key + ' — 다음 단계에서 구현 예정');
  }
});