// ============================================================
//  store.js — one small storage layer for the whole app.
//
//  If js/firebase-config.js has real values  → Firestore (syncs
//  across devices, live updates on the admin page).
//  If it still has the PASTE_ placeholders   → localStorage
//  (works instantly, same browser only).
//
//  Nothing else in the app needs to know which one is running.
// ============================================================

import { firebaseConfig, COLLECTION } from './firebase-config.js';

const LS_KEY = 'noelle_date_responses';
const FIREBASE_VERSION = '10.12.2';

export const isFirebaseConfigured = Object.values(firebaseConfig)
  .every(v => typeof v === 'string' && v.length > 0 && !v.startsWith('PASTE_'));

let fb = null;      // { db, addDoc, collection, ... } once loaded
let fbPromise = null;

async function getFirebase() {
  if (fb) return fb;
  if (!fbPromise) {
    fbPromise = (async () => {
      const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
      const [{ initializeApp }, fs] = await Promise.all([
        import(`${base}/firebase-app.js`),
        import(`${base}/firebase-firestore.js`),
      ]);
      const app = initializeApp(firebaseConfig);
      const db = fs.getFirestore(app);
      fb = { db, fs };
      return fb;
    })();
  }
  return fbPromise;
}

export const backendName = () => (isFirebaseConfigured ? 'Firestore' : 'this browser');

/* ------------------------------------------------------------
   Save one response. Returns the saved record (with id).
   ------------------------------------------------------------ */
export async function saveResponse(data) {
  const record = {
    ...data,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured) {
    try {
      const { db, fs } = await getFirebase();
      const ref = await fs.addDoc(fs.collection(db, COLLECTION), {
        ...record,
        createdAt: fs.serverTimestamp(),
        createdAtISO: record.createdAt,
      });
      return { id: ref.id, ...record };
    } catch (err) {
      console.error('[store] Firestore write failed, falling back to localStorage:', err);
    }
  }

  const all = readLocal();
  const saved = { id: `local_${Date.now()}`, ...record };
  all.push(saved);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  return saved;
}

/* ------------------------------------------------------------
   Read every response, newest first.
   ------------------------------------------------------------ */
export async function loadResponses() {
  if (isFirebaseConfigured) {
    try {
      const { db, fs } = await getFirebase();
      const q = fs.query(fs.collection(db, COLLECTION), fs.orderBy('createdAtISO', 'desc'));
      const snap = await fs.getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('[store] Firestore read failed, falling back to localStorage:', err);
    }
  }
  return readLocal().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/* ------------------------------------------------------------
   Live subscription (Firestore only). Returns an unsubscribe fn.
   With localStorage it just polls the same tab / storage events.
   ------------------------------------------------------------ */
export function subscribeResponses(callback) {
  if (isFirebaseConfigured) {
    let unsub = () => {};
    let cancelled = false;
    getFirebase().then(({ db, fs }) => {
      if (cancelled) return;
      const q = fs.query(fs.collection(db, COLLECTION), fs.orderBy('createdAtISO', 'desc'));
      unsub = fs.onSnapshot(
        q,
        snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => {
          console.error('[store] snapshot error:', err);
          loadResponses().then(callback);
        }
      );
    });
    return () => { cancelled = true; unsub(); };
  }

  const push = () => loadResponses().then(callback);
  push();
  const onStorage = e => { if (e.key === LS_KEY) push(); };
  window.addEventListener('storage', onStorage);
  const timer = setInterval(push, 2000);
  return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
}

/* ------------------------------------------------------------
   Delete one response (used by the admin page).
   ------------------------------------------------------------ */
export async function deleteResponse(id) {
  if (isFirebaseConfigured && !String(id).startsWith('local_')) {
    try {
      const { db, fs } = await getFirebase();
      await fs.deleteDoc(fs.doc(db, COLLECTION, id));
      return true;
    } catch (err) {
      console.error('[store] delete failed:', err);
      return false;
    }
  }
  const all = readLocal().filter(r => r.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  return true;
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}
