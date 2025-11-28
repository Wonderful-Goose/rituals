## Architecture

This document describes the main architectural pieces of **Daily Ritual** and how they fit together.

The app is intentionally small and opinionated:
- **One global state container** – `AppProvider` / `useApp` in `src/context/AppContext.tsx`
- **Typed data model** – `src/types/index.ts`
- **Single navigation surface** – bottom tabs in `App.tsx`
- **Pure utility modules** – `src/utils/*`
- **Themed UI** – `src/theme/index.ts` + simple presentational components

---

### Runtime stack

- **Framework**: Expo + React Native (`App.tsx`, `index.ts`, `app.json`)
- **Language**: TypeScript
- **Navigation**: `@react-navigation/bottom-tabs` + `@react-navigation/native`
- **Persistence**: `@react-native-async-storage/async-storage`
- **Dates / time**: `date-fns`
- **Notifications**: `expo-notifications`
- **Haptics**: `expo-haptics`

The entrypoint is `index.ts` which registers `App` with Expo. `App.tsx` wires:

- `SafeAreaProvider` → handles device safe areas
- `ErrorBoundary` → catches render errors and shows a fallback
- `AppProvider` → exposes `useApp()` for global state
- `NavigationContainer` + bottom tab navigator → main screen layout

---

### High‑level module layout

- `src/context/AppContext.tsx`  
  **Single source of truth** for:
  - Habits
  - Completion records
  - Timer state and timed progress
  - User settings (including notification preferences and power phrases)
  - Daily reviews
  - Derived/computed selectors (streaks, per‑day completion rate, weekly progress, etc.)

- `src/types/index.ts`  
  Defines the **data contracts** used across the app:
  - `Habit`, `HabitType`
  - `CompletionRecord`
  - `TimerState`
  - `TimedProgress`
  - `WeeklyProgress`
  - `UserSettings`
  - `DailyReview`

- `src/utils/date.ts`  
  Date/time helpers used to:
  - Normalise dates into `YYYY-MM-DD` format
  - Build week/month calendars
  - Compute streaks and “streaks at risk”
  - Provide display‑friendly strings for the UI

- `src/utils/storage.ts`  
  Thin wrapper around **AsyncStorage**, keyed for each logical type:
  - `load*` / `save*` functions per data slice (habits, completions, settings, timer state, timed progress, daily reviews)
  - Reset helpers and simple import/export

- `src/utils/notifications.ts`  
  Encapsulates **notification wiring**:
  - Permission requests
  - Creating/cancelling scheduled morning/evening reminders
  - Convenience for setting notifications based on user settings

- `src/theme/index.ts`  
  Central design tokens:
  - `colors`, `typography`, `spacing`, `borderRadius`
  - `globalStyles.container` and `globalStyles.screenPadding`

- Screens (`src/screens/*`):
  - `TodayScreen` – main daily view and add‑habit flow
  - `CalendarScreen` – calendar heatmap + per‑day breakdown
  - `StatsScreen` – performance & streaks dashboard
  - `SettingsScreen` – manage habits, phrases, notifications
  - `TimerScreen` – full‑screen timer for timed habits

- Components (`src/components/*`):
  - `CalendarHeatmap` – monthly heatmap grid
  - `HabitItem` – reusable daily habit row
  - `WeeklyProgressItem` – weekly target row (used in stats/today)
  - `StatsCard` – small metric card
  - `MotivationalIntro` – pre‑timer phrase animation + “why” card

---

### Data flow overview

At a high level, all user actions follow this pattern:

1. **UI event**  
   e.g. tapping a habit in `TodayScreen` or `HabitItem`.

2. **Context method**  
   e.g. `toggleCompletion`, `addHabit`, `startTimer`, `addDailyReview` from `useApp()`.

3. **State update + persistence**  
   - State is updated using `useState` hooks in `AppProvider`
   - Most mutations **immediately call the corresponding `save*` function** in `storage.ts`

4. **Derived selectors**  
   - Screens/components query derived data through helper functions from `useApp()` such as:
     - `getDailyHabits`, `getWeeklyHabits`, `getTimedHabits`
     - `getCompletionsForDate`, `getCompletionsForHabit`
     - `getWeeklyProgress`, `getDayCompletionRate`
     - `getStreaksAtRisk`, `getHabitStreak`

5. **UI render**  
   - Screens render based on the derived values; no component reads AsyncStorage directly.

This keeps business logic centralised in `AppContext` and the utils, so screens/components stay relatively “thin”.

---

### Navigation and screens

The bottom tab navigator in `App.tsx` defines four main routes:

- `Today` → `TodayScreen`
- `Calendar` → `CalendarScreen`
- `Stats` → `StatsScreen`
- `Settings` → `SettingsScreen`

`TimerScreen` is **not** a tab; it is presented as a full‑screen modal from `TodayScreen` using React Native’s `Modal`. This keeps the tab bar focused while still allowing an immersive timer experience.

Each screen:
- Consumes data via `useApp()`
- Never touches AsyncStorage or notifications directly
- Delegates any multi‑day or multi‑habit logic to the context or utils

---

### Error handling strategy

- `ErrorBoundary` in `App.tsx` wraps the whole app and shows a simple fallback UI if a render error occurs.
- Storage functions in `storage.ts` **log errors and fall back to safe defaults** (empty arrays / default settings).
- Notification helper functions catch and log errors so the rest of the app continues to work if notifications fail.

As the app grows, you can:
- Add per‑screen error boundaries for more granular reporting
- Centralise error logging (e.g. to Sentry) from within `ErrorBoundary` and the storage/notification catch blocks

---

### Extending the architecture

When adding new features, try to follow these patterns:

- **New app‑level concepts** (e.g. tags, templates, sync status):
  - Add types in `src/types/index.ts`
  - Add storage helpers in `src/utils/storage.ts`
  - Extend `AppContext` state + methods

- **New screens**:
  - Create them under `src/screens/`
  - Wire them into the navigator in `App.tsx` (either as new tabs or stacked modals)

- **New visual elements**:
  - Prefer new components under `src/components/`
  - Use theme tokens from `src/theme/index.ts` instead of hard‑coding colours/sizes

Document new architectural decisions here or in a new file (for example `sync-architecture.md`) so the mental model stays up to date.


