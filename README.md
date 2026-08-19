# Will you go out with me, Noelle? 💌

A little Valentine-themed site that asks Noelle out, lets her pick the day and the plan,
and quietly reports her answer back to you.

Plain HTML/CSS/JS. No build step, no `npm install`.

```
noelle-date/
├── index.html            ← the site she sees
├── admin.html            ← the page only you open
├── css/style.css
├── js/
│   ├── app.js            ← the 5-screen flow
│   ├── admin.js          ← your dashboard
│   ├── ideas.js          ← the date ideas (edit these!)
│   ├── store.js          ← saves to Firestore or localStorage
│   ├── firebase-config.js← paste your Firebase keys here
│   └── util.js           ← date formatting + Google Calendar link
└── README.md
```

---

## 1. Run it in VS Code

1. Open the `noelle-date` folder in VS Code (`File → Open Folder…`).
2. Install the **Live Server** extension (by Ritwick Dey) if you don't have it.
3. Right-click `index.html` → **Open with Live Server**.

> ⚠️ Don't just double-click `index.html`. The app uses ES modules, and browsers
> block those on `file://`. Live Server (or any local server) is required.
> No Live Server? In a terminal inside the folder run `python3 -m http.server 5500`
> and open <http://localhost:5500>.

Your dashboard is at `/admin.html`.

---

## 2. Make it work from her phone (Firebase)

Without this step everything works, but her answer is saved only in the browser she
used. With it, she can fill it out anywhere and you see it instantly.

1. <https://console.firebase.google.com> → **Add project** (skip Analytics).
2. On the project home, click the **`</>`** web icon → give it any nickname → **Register app**.
3. Copy the `firebaseConfig` values into `js/firebase-config.js` (replace every `PASTE_…`).
4. Left sidebar → **Build → Firestore Database → Create database → Start in test mode**.
5. Reload `admin.html`. The pill at the top should read **Live · Firestore**.

### Firestore rules

Test mode expires after 30 days and lets anyone read. Paste this in
**Firestore → Rules** instead — she can submit, but nobody can read the answers
from the web:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dateResponses/{doc} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

With that rule, read her answers in the **Firebase console → Firestore → `dateResponses`**.
If you'd rather keep using `admin.html`, leave `allow read: if true;` — the odds of a
stranger finding your project are basically zero, but it *is* technically public.

The API keys in `firebase-config.js` are **not** secrets — Firebase web keys are
designed to ship in the browser. The rules are what protect the data.

---

## 3. Put it online (so you can text her a link)

Easiest option — **Netlify Drop**: go to <https://app.netlify.com/drop> and drag the
`noelle-date` folder onto the page. You get a live URL in about ten seconds.

Also fine: GitHub Pages, Vercel, Cloudflare Pages. It's a static site, anything works.

Send her the plain URL. Keep `/admin.html` to yourself.

---

## 4. How the flow works

| Screen | What happens |
|---|---|
| **Ask** | "Will you go on a date with me?" — the **No** button teleports to a random spot on hover, tap, *or* keyboard focus. Yes grows a little each dodge. The subtitle escalates through nine taunts. |
| **Day** | Month calendar, past days disabled, hearts on the picked day. Plus a time dropdown. |
| **Idea** | Nine Fullerton-area date ideas, or she can type her own. Optional note to you. |
| **Confirm** | A receipt-style summary before anything is saved. |
| **Yay** | "Yay, it's a date!", confetti, her day hearted on a mini calendar, and an **Add to Google Calendar** button. |

Every screen after the first has a **← Back** button, and the phone/browser back
gesture works too — she can change any answer without starting over.
**Change something ↺** on the last screen drops her back at the calendar.

Each confirm writes a **new** record. The admin page sorts newest-first and labels
the top one **★ current plan**, so an accidental submission is fixed by just doing
it again. You can delete stray entries from the dashboard.

---

## 5. Things you'll probably want to change

- **The ideas** → `js/ideas.js`. Each has an emoji, name, description, and a real
  address (the address is what fills in the Google Calendar location).
- **The taunts** on the No button → `NO_TAUNTS` at the bottom of `js/ideas.js`.
- **Your name** → search for `Josh` in `js/app.js` and `js/admin.js`.
- **Colors** → the `:root` block at the top of `css/style.css`.
- **Times offered** → the `<select id="timePick">` in `index.html`.

Good luck. 💘
