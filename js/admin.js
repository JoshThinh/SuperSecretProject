// ============================================================
//  admin.js — your private view of what she picked.
//  Newest submission is always first and marked as THE PLAN.
// ============================================================

import { subscribeResponses, loadResponses, deleteResponse, isFirebaseConfigured } from './store.js';
import { fmtLongDate, fmtTime, timeAgo, gcalLink, esc } from './util.js';

/* floating hearts (same as the main page, calmer) */
(function initHearts() {
  const box = document.getElementById('hearts');
  const glyphs = ['💗', '💕', '💖', '🌸'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    s.style.left = `${Math.random() * 100}%`;
    s.style.fontSize = `${14 + Math.random() * 16}px`;
    s.style.animationDuration = `${16 + Math.random() * 14}s`;
    s.style.animationDelay = `${-Math.random() * 24}s`;
    box.appendChild(s);
  }
})();

const list = document.getElementById('list');
const pill = document.getElementById('statusPill');
const setupNote = document.getElementById('setupNote');

if (isFirebaseConfigured) {
  pill.textContent = 'Live · Firestore';
  pill.classList.add('is-live');
} else {
  pill.textContent = 'Local only · this browser';
  setupNote.hidden = false;
}

let cache = [];

function stamp(r) {
  // Firestore serverTimestamp comes back as an object; we also store an ISO copy
  return r.createdAtISO || r.createdAt?.toDate?.()?.toISOString?.() || r.createdAt || '';
}

function render(rows) {
  cache = [...rows].sort((a, b) => (stamp(a) < stamp(b) ? 1 : -1));

  if (!cache.length) {
    list.innerHTML = `
      <div class="empty">
        <span class="empty__emoji">💌</span>
        Nothing yet. Send her the link and refresh this page.
      </div>`;
    return;
  }

  list.innerHTML = cache.map((r, i) => {
    const isCurrent = i === 0;
    const gcal = gcalLink({
      title: `Date with Noelle 💘 — ${r.idea || ''}`,
      date: r.date,
      time: r.time || '17:00',
      location: r.location || 'Fullerton, CA',
      details: r.note ? `Her note: ${r.note}` : '',
    });

    return `
      <article class="entry ${isCurrent ? 'entry--current' : ''}">
        <span class="entry__badge ${isCurrent ? '' : 'entry__badge--old'}">
          ${isCurrent ? '★ current plan' : `earlier pick #${cache.length - i}`}
        </span>
        <div class="entry__when">${esc(fmtLongDate(r.date))} · ${esc(fmtTime(r.time))}</div>
        <div class="entry__idea">${esc(r.idea || '—')}</div>
        ${r.location ? `<div class="entry__meta">📍 ${esc(r.location)}</div>` : ''}
        ${r.note ? `<div class="entry__note">“${esc(r.note)}”</div>` : ''}
        <div class="entry__meta">
          submitted ${esc(timeAgo(stamp(r)))}
          ${typeof r.dodges === 'number' ? ` · dodged “No” ${r.dodges}×` : ''}
        </div>
        <div class="entry__actions">
          <a class="btn btn--cal" href="${gcal}" target="_blank" rel="noopener">＋ Google Calendar</a>
          <button class="btn btn--ghost" data-del="${esc(r.id)}" type="button">Delete</button>
        </div>
      </article>`;
  }).join('');

  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.del;
      btn.disabled = true;
      btn.textContent = 'deleting…';
      await deleteResponse(id);
      if (!isFirebaseConfigured) render(await loadResponses());
    });
  });
}

subscribeResponses(render);

document.getElementById('refreshBtn').addEventListener('click', async () => {
  render(await loadResponses());
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(cache, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'noelle-answers.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
