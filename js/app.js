// ============================================================
//  app.js — the whole ask-out flow.
// ============================================================

import { IDEAS, OWN_IDEA_CARD, NO_TAUNTS } from './ideas.js';
import { saveResponse, isFirebaseConfigured } from './store.js';
import { isAvailable, earliestTimeFor, noteFor, AVAILABILITY_NOTE } from './availability.js';
import { fmtLongDate, fmtTime, gcalLink, buildMiniCalendar } from './util.js';

/* ------------------------------------------------------------
   State
   ------------------------------------------------------------ */
const state = {
  date: null,          // 'YYYY-MM-DD'
  time: '17:00',
  ideaId: null,
  ideaName: null,
  ideaLocation: null,
  note: '',
};

const SCREENS = ['screen-ask', 'screen-day', 'screen-idea', 'screen-confirm', 'screen-yay'];
let historyStack = ['screen-ask'];

/* ------------------------------------------------------------
   Navigation
   ------------------------------------------------------------ */
function show(id, { push = true } = {}) {
  SCREENS.forEach(s => {
    document.getElementById(s).classList.toggle('is-active', s === id);
  });
  if (push) {
    historyStack.push(id);
    history.pushState({ screen: id }, '', `#${id.replace('screen-', '')}`);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  if (historyStack.length <= 1) return;
  historyStack.pop();
  const prev = historyStack[historyStack.length - 1];
  show(prev, { push: false });
  history.replaceState({ screen: prev }, '', `#${prev.replace('screen-', '')}`);
}

document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', goBack));

// browser / phone back gesture
window.addEventListener('popstate', () => {
  if (historyStack.length > 1) {
    historyStack.pop();
    show(historyStack[historyStack.length - 1], { push: false });
  }
});
history.replaceState({ screen: 'screen-ask' }, '', '#ask');

/* ============================================================
   STEP 1 — the runaway No button
   ============================================================ */
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const askSubtitle = document.getElementById('askSubtitle');
let dodges = 0;
let yesScale = 1;

function dodge() {
  const pad = 16;
  const w = noBtn.offsetWidth;
  const h = noBtn.offsetHeight;

  if (!noBtn.classList.contains('is-loose')) {
    // freeze it in place first so the jump reads as a jump
    const r = noBtn.getBoundingClientRect();
    noBtn.classList.add('is-loose');
    noBtn.style.left = `${r.left}px`;
    noBtn.style.top = `${r.top}px`;
    // force a reflow so the transition applies to the next move
    void noBtn.offsetWidth;
  }

  const maxX = window.innerWidth - w - pad;
  const maxY = window.innerHeight - h - pad;

  // keep it away from where it currently is, so it visibly moves
  const cur = noBtn.getBoundingClientRect();
  let x, y, tries = 0;
  do {
    x = pad + Math.random() * Math.max(0, maxX - pad);
    y = pad + Math.random() * Math.max(0, maxY - pad);
    tries++;
  } while (tries < 12 && Math.hypot(x - cur.left, y - cur.top) < Math.min(220, window.innerWidth * 0.4));

  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
  noBtn.style.transform = `rotate(${(Math.random() * 30 - 15).toFixed(1)}deg)`;

  dodges++;
  askSubtitle.textContent = NO_TAUNTS[Math.min(dodges - 1, NO_TAUNTS.length - 1)];

  // Yes gets a little more tempting each time
  yesScale = Math.min(1.6, yesScale + 0.07);
  yesBtn.style.transform = `scale(${yesScale})`;

  if (dodges === 5) noBtn.textContent = 'No 🙃';
  if (dodges === 9) noBtn.textContent = 'nope';
}

// She can click it all she likes — it just isn't there anymore afterwards.
// (Only 'click' is wired up, so one tap = exactly one jump. It also covers
// hitting Enter on it with the keyboard.)
noBtn.addEventListener('click', e => {
  e.preventDefault();
  dodge();
});

window.addEventListener('resize', () => {
  if (!noBtn.classList.contains('is-loose')) return;
  const r = noBtn.getBoundingClientRect();
  noBtn.style.left = `${Math.min(r.left, window.innerWidth - r.width - 16)}px`;
  noBtn.style.top = `${Math.min(r.top, window.innerHeight - r.height - 16)}px`;
});

yesBtn.addEventListener('click', () => {
  burst(26);
  noBtn.style.display = 'none';
  show('screen-day');
});

/* ============================================================
   STEP 2 — calendar
   ============================================================ */
const calGrid = document.getElementById('calGrid');
const calMonth = document.getElementById('calMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const pickedLabel = document.getElementById('pickedLabel');
const dayNext = document.getElementById('dayNext');
const timePick = document.getElementById('timePick');

const today = new Date();
today.setHours(0, 0, 0, 0);
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function ymd(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function renderCalendar() {
  calMonth.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  calGrid.innerHTML = '';

  const first = new Date(viewYear, viewMonth, 1).getDay();
  const days = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < first; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal__day is-empty';
    calGrid.appendChild(blank);
  }

  for (let d = 1; d <= days; d++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cal__day';
    btn.textContent = d;

    const cellDate = new Date(viewYear, viewMonth, d);
    const key = ymd(viewYear, viewMonth, d);
    const bookable = cellDate >= today && isAvailable(key);

    if (!bookable) {
      btn.disabled = true;
      if (cellDate >= today) btn.title = "I've got class that day";
    }
    if (cellDate.getTime() === today.getTime()) btn.classList.add('is-today');
    if (state.date === key) btn.classList.add('is-selected');

    btn.addEventListener('click', () => {
      state.date = key;
      renderCalendar();
      applyTimeLimits(key);
      pickedLabel.innerHTML = `${fmtLongDate(key)} 💗`
        + (noteFor(key) ? `<br><span class="picked__why">${noteFor(key)}</span>` : '');
      dayNext.disabled = false;
    });

    calGrid.appendChild(btn);
  }

  prevMonthBtn.disabled =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
}

prevMonthBtn.addEventListener('click', () => {
  if (--viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  if (++viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCalendar();
});

/* Hide any times earlier than she's allowed to book on the chosen day. */
function applyTimeLimits(key) {
  const min = earliestTimeFor(key);
  let firstOk = null;
  [...timePick.options].forEach(o => {
    const ok = o.value >= min;
    o.disabled = !ok;
    o.hidden = !ok;
    if (ok && !firstOk) firstOk = o.value;
  });
  if (timePick.value < min && firstOk) timePick.value = firstOk;
  state.time = timePick.value;
}

timePick.addEventListener('change', () => { state.time = timePick.value; });

dayNext.addEventListener('click', () => {
  if (!state.date) return;
  state.time = timePick.value;
  show('screen-idea');
});

document.getElementById('availNote').textContent = AVAILABILITY_NOTE;
renderCalendar();

/* ============================================================
   STEP 3 — date ideas
   ============================================================ */
const ideaGrid = document.getElementById('ideaGrid');
const ideaNext = document.getElementById('ideaNext');
const customIdea = document.getElementById('customIdea');
const customIdeaWrap = document.getElementById('customIdeaWrap');
const noteInput = document.getElementById('noteInput');

const OWN_ID = '__own__';

function makeCard({ id, emoji, name, desc, extraClass = '' }) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `idea ${extraClass}`.trim();
  el.dataset.id = id;
  el.innerHTML = `
    <span class="idea__emoji">${emoji}</span>
    <div class="idea__name">${name}</div>
    <div class="idea__desc">${desc}</div>`;
  ideaGrid.appendChild(el);
  return el;
}

IDEAS.forEach(idea => {
  makeCard(idea).addEventListener('click', () => {
    state.ideaId = idea.id;
    state.ideaName = `${idea.emoji} ${idea.name}`;
    state.ideaLocation = idea.location;
    customIdea.value = '';
    customIdeaWrap.hidden = true;
    paintIdeas();
    ideaNext.disabled = false;
  });
});

/* "I have an idea" — opens the text box instead of setting a plan. */
makeCard({ ...OWN_IDEA_CARD, id: OWN_ID, extraClass: 'idea--own' })
  .addEventListener('click', () => {
    state.ideaId = OWN_ID;
    state.ideaLocation = 'Fullerton, CA';
    customIdeaWrap.hidden = false;
    paintIdeas();
    syncOwnIdea();
    customIdea.focus();
  });

function paintIdeas() {
  ideaGrid.querySelectorAll('.idea').forEach(el =>
    el.classList.toggle('is-selected', el.dataset.id === state.ideaId)
  );
}

/* Her own idea only counts once she's actually typed something. */
function syncOwnIdea() {
  const v = customIdea.value.trim();
  state.ideaName = v ? `💡 ${v}` : null;
  ideaNext.disabled = !v;
}

customIdea.addEventListener('input', syncOwnIdea);

ideaNext.addEventListener('click', () => {
  if (!state.ideaName) return;
  state.note = noteInput.value.trim();
  fillSummary();
  show('screen-confirm');
});

/* ============================================================
   STEP 4 — confirm
   ============================================================ */
function fillSummary() {
  document.getElementById('sumWhen').textContent = fmtLongDate(state.date);
  document.getElementById('sumTime').textContent = fmtTime(state.time);
  document.getElementById('sumIdea').textContent = state.ideaName;
  const row = document.getElementById('sumNoteRow');
  if (state.note) {
    row.hidden = false;
    document.getElementById('sumNote').textContent = state.note;
  } else {
    row.hidden = true;
  }
}

const confirmBtn = document.getElementById('confirmBtn');
const savingMsg = document.getElementById('savingMsg');

confirmBtn.addEventListener('click', async () => {
  confirmBtn.disabled = true;
  savingMsg.hidden = false;
  savingMsg.textContent = 'saving...';

  let saved = null;
  try {
    saved = await saveResponse({
      name: 'Noelle',
      date: state.date,
      time: state.time,
      idea: state.ideaName,
      ideaId: state.ideaId === OWN_ID ? null : state.ideaId,
      location: state.ideaLocation,
      note: state.note,
      dodges,
    });
  } catch (err) {
    console.error(err);
  }

  savingMsg.hidden = true;
  confirmBtn.disabled = false;
  renderYay(saved);
  show('screen-yay');
  burst(80);
});

/* ============================================================
   STEP 5 — yay
   ============================================================ */
function renderYay(saved) {
  document.getElementById('yaySummary').innerHTML =
    `<strong>${fmtLongDate(state.date)}</strong> at <strong>${fmtTime(state.time)}</strong><br>${state.ideaName}`;

  document.getElementById('miniCal').innerHTML = buildMiniCalendar(state.date);

  document.getElementById('gcalLink').href = gcalLink({
    title: `Date with Josh 💘 — ${state.ideaName}`,
    date: state.date,
    time: state.time,
    location: state.ideaLocation || 'Fullerton, CA',
    details: state.note
      ? `Your note: ${state.note}`
      : "Planned on the little site. Don't be late 💕",
  });

  document.getElementById('savedNote').textContent = saved
    ? (saved.via === 'firestore'
        ? 'Saved 💾 — he can see it now.'
        : 'Saved 💾 on this device.')
    : "Couldn't save that one — try confirming again?";
}

document.getElementById('restartBtn').addEventListener('click', () => {
  historyStack = ['screen-ask'];
  show('screen-day');
});

/* ============================================================
   Confetti
   ============================================================ */
function burst(count) {
  const box = document.getElementById('confetti');
  const glyphs = ['💗', '💕', '🎉', '💖', '🌸', '✨', '💘'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('i');
    c.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    c.style.left = `${Math.random() * 100}%`;
    c.style.fontSize = `${14 + Math.random() * 20}px`;
    c.style.animationDuration = `${2 + Math.random() * 2.5}s`;
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    box.appendChild(c);
    setTimeout(() => c.remove(), 5200);
  }
}
