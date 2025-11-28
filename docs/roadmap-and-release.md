## Roadmap and Release Process

This document connects the codebase to the higher‑level launch plan captured in `ROADMAP.md` and gives a compact view of how to go from “working locally” to “in users’ hands”.

For full detail and checklists, see `ROADMAP.md`. This file is the shorter, dev‑facing version.

---

### Current status

Per `ROADMAP.md`, the MVP is functionally complete:

- Daily, weekly, and timed habit tracking
- Timer with persistence and motivational intro
- Streaks and “streaks at risk”
- Calendar heatmap and stats dashboard
- Daily review journaling
- Local persistence (AsyncStorage)

The remaining work is mostly:

- Polishing edge cases
- Testing across devices
- Packaging for distribution (Android APK + PWA)

---

### Local QA checklist

Before building for release, verify on at least one physical Android device:

- **Habits**
  - Add/edit/delete all three habit types
  - Reopen the app; ensure habits persist

- **Completions**
  - Toggle completions for daily, weekly, and timed habits
  - Verify streak counts and “streaks at risk” behave as expected over multiple days (you can fake days by changing device date).

- **Timer**
  - Start, pause, resume, and stop a timed habit
  - Close and reopen the app mid‑session:
    - Timer should resume as paused with the previous elapsed time
  - Complete a timed habit and confirm duration is recorded in Stats.

- **Calendar & Stats**
  - Confirm calendar heatmap colours change with completion density
  - Confirm Stats screen values match expected behaviour.

- **Notifications (if enabled)**
  - Toggle daily reminders on/off
  - Change morning/evening times
  - Ensure at least one notification fires at the expected time.

---

### Android builds (EAS)

You’ll use **Expo Application Services (EAS)** to produce installable APKs.

High‑level steps (see `ROADMAP.md` for commands and options):

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```
2. **Configure project**
   ```bash
   eas build:configure
   ```
3. **Review `app.json`**
   - Name, slug
   - Icons and splash images
   - Android package name (if you later go to Play Store)

4. **Build preview APK**
   ```bash
   eas build --platform android --profile preview
   ```
5. **Test preview build**
   - Download APK from EAS dashboard
   - Install on physical device
   - Run through the QA checklist above.

6. **Production APK**
   ```bash
   eas build --platform android --profile production
   ```

You can host the final APK anywhere (e.g. GitHub Releases) without going through Play Store if you just want direct installs.

---

### Web / PWA path (optional but recommended)

The roadmap suggests shipping a PWA so iPhone users can also use Daily Ritual without the App Store.

Typical flow:

1. **Install web dependencies** (see `ROADMAP.md` for exact commands).
2. **Run the web dev build**
   ```bash
   npm run web
   ```
3. **Fix layout quirks**
   - Adjust font sizes and spacing for desktop
   - Verify the calendar and timer look correct.

4. **Configure PWA**
   - Add manifest metadata (name, theme colour, icons).
   - Ensure the app is installable and works offline where reasonable.

5. **Export static web build**
   ```bash
   npx expo export:web
   ```
6. **Deploy**
   - Push the exported folder to Vercel / Netlify / any static host.

---

### Release hygiene

As you move towards a release:

- **Code**
  - Remove stray `console.log` calls or wrap them in debug flags.
  - Ensure `ErrorBoundary` messaging is acceptable to end users.

- **Storage migrations**
  - If you change data structures (e.g. shape of `Habit`), write migration logic in `load*` functions to gracefully handle old stored data.

- **Docs**
  - Keep `README.md` (project root) aligned with how to install and run the app.
  - Use `docs/` for deeper implementation details rather than overloading the README.

---

### Keeping roadmap and code in sync

`ROADMAP.md` is intentionally written in product‑language (phases, assets, commands). As you close out items:

- Mark tasks complete in `ROADMAP.md`.
- When architecture or behaviour changes, update:
  - `docs/architecture.md`
  - `docs/state-and-data.md`
  - `docs/screens.md` (if screen responsibilities shift)

Treat the roadmap as the **what** and these docs as the **how**. Keeping both up to date will save time for future iterations and contributors.


