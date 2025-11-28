## Development Guide

This document explains how to run, debug, and extend the Daily Ritual app.

It’s written assuming you’re comfortable with basic JavaScript/TypeScript and React Native, but it tries to keep conventions explicit so you don’t need to dig through code to understand how things are supposed to work.

---

### Prerequisites

- **Node.js + npm** installed
- **Expo CLI tooling** (Expo Go app on your device or an emulator)

From the project root:

```bash
npm install
```

Common scripts (from `package.json`):

```bash
npm start        # Start Expo dev server (interactive)
npm run android  # Start Android on emulator/USB device
npm run ios      # Start iOS simulator (macOS only)
npm run web      # Start web build (for PWA testing)
```

Expo will show a QR code / dev tools UI where you can open the app on a device or simulator.

---

### Project layout (quick reference)

- `App.tsx` – app shell, bottom tab navigation, error boundary
- `index.ts` – Expo entrypoint
- `app.json` – Expo configuration (name, icons, splash, platform config)

- `src/context/AppContext.tsx` – **global state & business logic**
- `src/types/index.ts` – shared data types
- `src/utils/date.ts` – date helpers & streak logic
- `src/utils/storage.ts` – AsyncStorage helpers
- `src/utils/notifications.ts` – notification wiring

- `src/theme/index.ts` – colour/spacing/typography tokens
- `src/screens/*.tsx` – screens (Today, Calendar, Stats, Settings, Timer)
- `src/components/*.tsx` – reusable UI components

Docs are in `docs/` and are intended to be updated as you add features.

---

### Running the app in development

From the project root:

```bash
npm start
```

Then in the Expo CLI:

- Press `a` – open on Android emulator / connected device
- Press `i` – open on iOS simulator (macOS only)
- Press `w` – open the web build in a browser

You can also start directly:

```bash
npm run android
npm run ios
npm run web
```

---

### Debugging and logging

- Use `console.log` during development where needed; the Expo dev tools console will show logs.
- A global `ErrorBoundary` in `App.tsx` logs errors to the console and shows a simple fallback UI instead of crashing the app.
- Storage helpers in `src/utils/storage.ts` catch and log errors but return safe defaults so the UI doesn’t explode if storage is corrupted.

When preparing for a production build, it’s worth:

- Removing/cleaning noisy `console.log` statements
- Making sure errors in storage/notification functions are either handled or surfaced meaningfully

---

### Adding a new habit‑related feature

Because all app‑level state runs through `AppContext` and `storage.ts`, the general pattern for new behaviour is:

1. **Update the data model**  
   - Modify or add types in `src/types/index.ts`.

2. **Wire up persistence**  
   - Add corresponding `load*` / `save*` functions in `src/utils/storage.ts`.
   - Decide on sensible defaults and failure behaviour.

3. **Extend AppContext**  
   - Add new `useState` slices if necessary.
   - Update `loadData()` to load the new data.
   - Add effects to save changes back to storage.
   - Expose selectors and mutation methods in `AppContextType` and the `value` object.

4. **Use it in screens/components**  
   - Consume selectors and methods from `useApp()` in screens.
   - Keep heavy data shaping inside `AppContext` or utils, not in JSX.

This preserves a single source of truth for business rules and keeps UIs focused on presentation and small interactions.

---

### Styling and theming

All shared styling tokens live in `src/theme/index.ts`:

- `colors` – background, surfaces, text, accent, success, heatmap colours
- `typography` – font families, sizes, and weights
- `spacing` – small/medium/large spacing values
- `borderRadius` – common border radii
- `globalStyles` – basic container/screen padding styles

When building new UI:

- **Prefer** using `colors`, `spacing`, `typography`, `borderRadius` instead of inline hard‑coded values.
- If you find yourself repeating a pattern across screens, consider:
  - Extracting a new component in `src/components/`
  - Or adding a new entry to `globalStyles`

---

### Working with dates and streaks

All date operations should go through `src/utils/date.ts`:

- Formatting:
  - `formatDate(date)` → `YYYY-MM-DD` (canonical storage format)
  - `formatDisplayDate(date)` → human‑friendly (“Today” / `Mon, Jan 1`)
  - `formatMonthYear(date)` → `January 2025` style
  - `formatShortDay(date)` → day of month only (for calendars)

- Ranges:
  - `getWeekStart(date)` / `getWeekEnd(date)`
  - `getCalendarDays(date)` – 6 weeks of dates for a month view

- Streaks:
  - `getStreak(completedDates)` – current streak
  - `getLongestStreak(completedDates)` – all‑time best streak
  - `isStreakAtRisk(completedDates, minStreak)` – is a streak likely to break today?

When you need date logic for a new feature, prefer extending this module instead of scattering `date-fns` imports across screens.

---

### Notifications

All notification logic is centralised in `src/utils/notifications.ts`.

Key entrypoints:

- `requestNotificationPermissions()`
- `scheduleMorningReminder(hour, minute)`
- `scheduleEveningReminder(hour, minute)`
- `setupNotifications(enabled, morningTime, eveningTime)`

`SettingsScreen` is the only place that calls `setupNotifications` directly. If you add new types of notifications (e.g. one‑off reminders or streak alerts), keep them encapsulated here and expose small, explicit helpers rather than calling Expo APIs from screens.

---

### Data reset and backup (dev utilities)

For development and manual user backup flows, `src/utils/storage.ts` provides:

- `clearAllData()` – removes all app keys from AsyncStorage
- `exportData()` – returns a JSON string with:
  - `habits`
  - `completions`
  - `exportedAt` timestamp
- `importData(json)` – basic import that overwrites habits and completions if data is valid

If you build a UI for these actions (e.g. in Settings), **treat them as power‑user / advanced** options: they can be destructive.

---

### Working on the PWA / web build

The app is built primarily for mobile, but Expo’s web support can be used to ship a PWA:

```bash
npm run web  # expo start --web
```

See `ROADMAP.md` for the planned steps:

- Install Expo web dependencies
- Configure PWA manifest and icons
- Export static web build via `npx expo export:web`
- Deploy to a static host (Vercel/Netlify/etc.)

When working on web:

- Expect some styling differences (fonts, dimensions).
- Avoid platform‑specific APIs unless guarded by `Platform.OS` checks.

---

### Adding documentation as you go

The `docs/` folder is intended to stay close to reality:

- If you make a non‑trivial architectural change, update `architecture.md`.
- If you add new global state or persistence, update `state-and-data.md`.
- If you add a screen or repurpose an existing one, adjust `screens.md`.
- New cross‑cutting features (e.g. sync, backups, multi‑device) can get their own files (`sync.md`, `backup.md`, etc.).

This keeps the app understandable for future contributors (and future you) without needing to reverse‑engineer everything from scratch.


