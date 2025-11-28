## Components

This document describes the shared UI components in `src/components/` and how they fit into the screens.

These components are intentionally **dumb**: they take props and render UI, relying on `useApp()` only where necessary for interactions.

---

### CalendarHeatmap

**File**: `src/components/CalendarHeatmap.tsx`  
**Used by**: `CalendarScreen`

**Purpose**:  
Render a **6‑week calendar grid** for a given month, with each day coloured based on that day’s completion rate.

**Key props:**

- `currentMonth: Date` – the month being shown (first/last calendar days are computed internally)
- `onDayPress?: (date: string) => void` – called with `YYYY-MM-DD` when the user taps a day
- `selectedDate?: string` – optional, highlights the currently selected day

**Implementation notes:**

- Uses `getCalendarDays(currentMonth)` from `date.ts` to generate a flat list of dates, then chunks them into weeks.
- Uses `getDayCompletionRate(date)` from `useApp()` to compute a 0–1 completion rate per date.
- Maps completion rate to colours from `theme.colors`:
  - `heat0`, `heat25`, `heat50`, `heat75`, `heat100`
- Distinguishes:
  - Today (border highlight)
  - Selected day (accent border)
  - Days outside the current month (reduced opacity)

---

### HabitItem

**File**: `src/components/HabitItem.tsx`  
**Used by**: `CalendarScreen` (and can be reused elsewhere)

**Purpose**:  
Reusable **single‑day habit row** with a checkbox, name, and optional streak indicator.

**Key props:**

- `habitId: string`
- `name: string`
- `date: string` – `YYYY-MM-DD`
- `showStreak?: boolean` – defaults to `true`

**Behaviour:**

- Reads from `useApp()`:
  - `isCompleted(habitId, date)`
  - `toggleCompletion(habitId, date)`
  - `getCompletionsForHabit(habitId)` – to compute streaks
- Uses `getStreak` and `getLongestStreak` from `date.ts` for:
  - Current streak length
  - All‑time best streak
- Applies:
  - Different background and border colours when completed
  - A completion indicator bar on the right edge
  - Optional streak text (“X days – best: Y” style)
- Triggers haptic feedback on toggle.

---

### WeeklyProgressItem

**File**: `src/components/WeeklyProgressItem.tsx`  
**Used by**: Weekly sections (e.g. in `StatsScreen` / potential future reuse)

**Purpose**:  
Display a **summary row for a single weekly target** (how many times done vs target).

**Key props:**

- `progress: WeeklyProgress`
  - Includes `habitId`, `habitName`, `target`, `completed`, `dates`

**Behaviour:**

- Uses `useApp()` to:
  - Check whether the habit is completed today (`isCompleted`)
  - Toggle today’s completion when pressed (`toggleCompletion`)
- Renders:
  - Habit name
  - `completed/target` count
  - A progress bar whose width is proportional to completion %
  - A status label:
    - `✓ Target met` when completed ≥ target
    - `X more to go` otherwise
  - A “Done today” badge if today is already checked off.

---

### StatsCard

**File**: `src/components/StatsCard.tsx`  
**Used by**: `StatsScreen`

**Purpose**:  
Small, flexible **metric card** for use in horizontal rows.

**Key props:**

- `label: string`
- `value: string | number`
- `subValue?: string`
- `accent?: boolean` – visually emphasise (e.g. for perfect days or 100% today)

**Behaviour:**

- Purely presentational – no hooks.
- When `accent` is true:
  - Uses accent background and border
  - Colours `value` in accent colour

---

### MotivationalIntro

**File**: `src/components/MotivationalIntro.tsx`  
**Used by**: `TodayScreen` (before starting a timed habit)

**Purpose**:  
Show a **pre‑timer motivational sequence**:
- Animated power phrase (one word at a time)
- Then a summary of the upcoming session (habit name, duration, optional “why”)

**Key props:**

- `habitName: string`
- `duration: number` – in seconds
- `onComplete: () => void` – called when the user taps “GO”
- `onCancel: () => void` – called when the user dismisses the intro
- `customPhrases?: string[][]` – user‑supplied phrases from settings
- `selectedPhraseIndex?: number | null`
- `why?: string` – optional motivation text

**Behaviour:**

- Chooses a phrase:
  - If `customPhrases` is non‑empty:
    - Uses `selectedPhraseIndex` if it’s not `null` and in range
    - Else picks a random custom phrase
  - Otherwise falls back to `DEFAULT_PHRASES`.
- Plays the phrase word‑by‑word with:
  - Scale + opacity animation per word
  - Heavy haptic feedback on each word
- After the last word:
  - Fades in a card with:
    - Habit name
    - Formatted duration
    - Optional “YOUR WHY” block
    - Large circular “GO” button
  - Tapping “GO” triggers `onComplete`.
- The ✕ button calls `onCancel`.

---

### Internal components in TimerScreen

Although not exported from `src/components/`, `TimerScreen` defines an internal `ProgressRing` component:

- Draws a circular progress indicator using:
  - Two half‑circles (for 0–50% and 50–100% of progress) built from border arcs
  - Rotation based on `progress` (0–1)
- Stateless: receives `progress`, `size`, and `strokeWidth` as props.

If you need circular progress elsewhere, consider extracting `ProgressRing` into `src/components/` and documenting it here.

---

### Adding new components

When you introduce a new component:

- Place it under `src/components/`.
- Keep it **as dumb as possible**:
  - Accept props instead of reaching into `useApp()` directly unless it’s truly a shared interaction component.
  - Avoid performing heavy data manipulation inside the component; prefer selectors in `AppContext` or utilities.
- Use tokens from `src/theme/index.ts` for styling, not raw hex values.
- Add a short entry here describing:
  - What the component does
  - Its key props
  - Where it is used


