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
│   ├── availability.js   ← when you're free (edit this!)
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

1. <https://console.firebase.google.com> → **Create a project**. Name it anything. Turn
   **Google Analytics off** — you don't need it and it adds two more screens.
2. On the project overview page, click the **`</>`** (web) icon under "Get started by adding
   Firebase to your app". Nickname it anything. **Do not** check "Firebase Hosting".
   → **Register app**.
3. It shows you a `firebaseConfig` object. Copy those six values into `js/firebase-config.js`,
   replacing every `PASTE_…`. Keep the quotes. (Lost the screen? Gear icon → **Project settings**
   → scroll to **Your apps**.)
4. Left sidebar → **Databases & Storage → Firestore** → **Create database**. Pick a location
   (`nam5` or `us-west1` is fine — it can't be changed later) → **Start in test mode** → **Create**.
5. Go to the **Rules** tab and paste the rules from the next section, then **Publish**. Test mode
   stops working after 30 days, so don't skip this.
6. Reload `admin.html`. The pill at the top should read **Live · Firestore**.

### Firestore rules

Test mode expires after 30 days and lets anyone write anything. Replace it with this —
it locks the database down to exactly what this app does, with no expiry date:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dateResponses/{doc} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if false;
    }
  }
}
```

`create` + `read` are what `admin.html` needs to work. `update`/`delete` are off, so nobody
can tamper with or wipe an answer that's already in — including the Delete button on your
dashboard, which will silently fail. If you want that button working, flip `delete` to `true`.

Note that `read: if true` means the answers are technically readable by anyone who knows your
project ID. For a date invite that's fine. If it bugs you, set `read: if false` and view them in
**Firebase console → Firestore → `dateResponses`** instead — the console reads as you, the owner,
so it works regardless of the rules.

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
| **Ask** | "Will you go on a date with me?" — she *can* click **No**, it just teleports to a random spot the instant she does. Yes grows a little each dodge. The subtitle escalates through eight taunts. |
| **Day** | Month calendar. Past days and days you're in class are greyed out and unclickable; hearts on the picked day. Time dropdown narrows if that day has a "not before" limit. |
| **Idea** | Six Fullerton-area date ideas, or she can type her own. Optional note to you. |
| **Confirm** | A receipt-style summary before anything is saved. |
| **Yay** | "Yay, it's a date!", confetti, her day hearted on a mini calendar, and an **Add to Google Calendar** button. |

Every screen after the first has a **← Back** button, and the phone/browser back
gesture works too — she can change any answer without starting over.
**Change something ↺** on the last screen drops her back at the calendar.

Each confirm writes a **new** record. The admin page sorts newest-first and labels
the top one **★ current plan**, so an accidental submission is fixed by just doing
it again. You can delete stray entries from the dashboard.

---

## 5. Your availability

`js/availability.js` is the only file to touch when your schedule changes. Days you're not
free are greyed out on the calendar and can't be clicked, so she can only land on something
that works.

```js
export const WEEKLY_FREE = [0, 1, 6];   // 0=Sun 1=Mon … 6=Sat  → Mon/Sat/Sun

export const EXCEPTIONS = {             // one-off days that break the weekly rule
  '2026-08-20': { earliest: '15:00', why: "I'm out of class at 2 that day…" },
  '2026-08-21': {},
  '2026-08-23': {},
  '2026-08-24': {},
};

export const EXCEPTIONS_THROUGH = '2026-08-24';
```

Up to and including `EXCEPTIONS_THROUGH`, **only** the days listed in `EXCEPTIONS` are
bookable. After that date, `WEEKLY_FREE` takes over. `earliest` hides any time slots before
it from the dropdown; `why` shows a short line under the calendar when she picks that day.

Once this week is past you can delete the whole `EXCEPTIONS` block and set
`EXCEPTIONS_THROUGH` to a date in the past — the weekly rule handles everything from there.
`AVAILABILITY_NOTE` at the bottom of the file is the grey box above the calendar; update it
if you change the rules.

## 6. Things you'll probably want to change

- **The ideas** → `js/ideas.js`. Each has an emoji, name, description, and a real
  address (the address is what fills in the Google Calendar location).
- **The taunts** on the No button → `NO_TAUNTS` at the bottom of `js/ideas.js`.
- **Your name** → search for `Josh` in `js/app.js` and `js/admin.js`.
- **Colors** → the `:root` block at the top of `css/style.css`.
- **Times offered** → the `<select id="timePick">` in `index.html`.

Good luck. 💘
