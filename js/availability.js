// ============================================================
//  availability.js — when Josh is actually free.
//
//  Days that aren't available are greyed out on the calendar and
//  can't be clicked, so she can only pick something that works.
//
//  THIS IS THE ONLY FILE YOU NEED TO EDIT WHEN YOUR SCHEDULE CHANGES.
// ============================================================

// Days of the week you're normally free. 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
// Right now: Monday, Saturday, Sunday. (Tue/Wed/Thu are class days,
// and Friday is off the list once this week is over.)
export const WEEKLY_FREE = [0, 1, 6];

// One-off days that don't follow the weekly rule — used for this week,
// where the schedule is different. Key is YYYY-MM-DD.
//   earliest: optional 'HH:MM'; times before it are hidden from the dropdown.
//   why:      optional line shown under the calendar when she picks that day.
export const EXCEPTIONS = {
  '2026-08-20': { earliest: '15:00', why: "I'm out of class at 2 that day, so anything after works." }, // Thu
  '2026-08-21': {}, // Fri
  '2026-08-23': {}, // Sun
  '2026-08-24': {}, // Mon
};

// Through this date (inclusive), ONLY the days listed in EXCEPTIONS are
// available. After it, WEEKLY_FREE takes over. Set to the last day of the
// irregular stretch above.
export const EXCEPTIONS_THROUGH = '2026-08-24';

// Shown under the calendar so the greyed-out days aren't a mystery.
export const AVAILABILITY_NOTE =
  'Greyed-out days are when I have class. This week Thursday (after 2), Friday, Sunday and Monday work — after that it’s Mondays and weekends.';

/** Can she book this 'YYYY-MM-DD'? */
export function isAvailable(ymd) {
  if (EXCEPTIONS[ymd]) return true;
  if (ymd <= EXCEPTIONS_THROUGH) return false;
  const [y, m, d] = ymd.split('-').map(Number);
  return WEEKLY_FREE.includes(new Date(y, m - 1, d).getDay());
}

/** Earliest bookable time on that day, as 'HH:MM'. */
export function earliestTimeFor(ymd) {
  return EXCEPTIONS[ymd]?.earliest || '00:00';
}

/** Optional explanation for that day, or ''. */
export function noteFor(ymd) {
  return EXCEPTIONS[ymd]?.why || '';
}
