// ============================================================
//  util.js — date formatting, Google Calendar link, mini calendar
// ============================================================

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/** 'YYYY-MM-DD' -> a real local Date (no timezone drift) */
export function parseYMD(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 'YYYY-MM-DD' -> 'Saturday, September 12, 2026' */
export function fmtLongDate(ymd) {
  if (!ymd) return '—';
  const d = parseYMD(ymd);
  return `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** 'YYYY-MM-DD' -> 'Sat, Sep 12' */
export function fmtShortDate(ymd) {
  if (!ymd) return '—';
  const d = parseYMD(ymd);
  return `${DOW[d.getDay()].slice(0,3)}, ${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`;
}

/** '17:00' -> '5:00 PM' */
export function fmtTime(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** ISO timestamp -> '2 hours ago' style */
export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
}

/** Build a Google Calendar "add event" URL (2 hour block, LA time). */
export function gcalLink({ title, date, time, location, details }) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);

  const pad = n => String(n).padStart(2, '0');
  const start = `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`;
  const endH = (h + 2) % 24;
  const end = `${y}${pad(m)}${pad(d)}T${pad(endH)}${pad(min)}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: details || '',
    location: location || '',
    ctz: 'America/Los_Angeles',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** A tiny read-only month grid with the chosen day hearted. */
export function buildMiniCalendar(ymd) {
  const sel = parseYMD(ymd);
  const y = sel.getFullYear();
  const mo = sel.getMonth();
  const first = new Date(y, mo, 1).getDay();
  const days = new Date(y, mo + 1, 0).getDate();

  let cells = '';
  for (let i = 0; i < first; i++) cells += '<div class="cal__day is-empty"></div>';
  for (let d = 1; d <= days; d++) {
    const isSel = d === sel.getDate();
    cells += `<div class="cal__day${isSel ? ' is-selected' : ''}">${d}</div>`;
  }

  return `
    <div class="mini-cal__month">${MONTHS[mo]} ${y}</div>
    <div class="cal__dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
    <div class="cal__grid">${cells}</div>`;
}

/** Escape user text before dropping it into innerHTML. */
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
