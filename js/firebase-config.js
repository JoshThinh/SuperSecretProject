// ============================================================
//  FIREBASE CONFIG  —  fill this in to sync across devices
// ============================================================
//
//  Until you fill this in, the app still works perfectly —
//  it just saves to localStorage (same browser only).
//
//  To turn on cross-device sync:
//   1. Go to https://console.firebase.google.com  → Add project
//   2. In the project, click the </> (Web) icon to register an app
//   3. Copy the firebaseConfig object it gives you and paste the
//      values below (replace every "PASTE_..." string)
//   4. Left sidebar → Build → Firestore Database → Create database
//      → start in **test mode** (fine for this; see README for rules)
//   5. Reload the page. The admin page will say "Live · Firestore".
//
//  These keys are NOT secrets — they're meant to ship in the browser.
//  Security comes from the Firestore rules (see README.md).
// ============================================================

export const firebaseConfig = {
  apiKey:            "AIzaSyAMG6kCh_1Y5Nt2H-I1eKUzGFMlNsGWgEw",
  authDomain:        "hehehenoe.firebaseapp.com",
  projectId:         "hehehenoe",
  storageBucket:     "hehehenoe.firebasestorage.app",
  messagingSenderId: "551977919429",
  appId:             "1:551977919429:web:faf2c35efd7db5545c21ac",
};

// Name of the Firestore collection that holds her answers.
export const COLLECTION = "dateResponses";
