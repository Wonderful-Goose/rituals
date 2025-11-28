## Screens

This document describes the responsibilities and key behaviours of each screen in the app.

Screens live under `src/screens/` and consume data exclusively through `useApp()` and pure utilities.

---

### TodayScreen

**File**: `src/screens/TodayScreen.tsx`  
**Tab**: `Today`

**Purpose**:  
This is the **primary daily cockpit**: check off habits, run timed sessions, see streak warnings, and submit a quick daily review.

**Key responsibilities:**

- Show today’s:
  - Daily + timed habits
  - Weekly targets section for the current week
  - Streaks at risk (daily/timed)
  - Overall completion percentage
- Manage:
  - Adding new habits (inline modal)
  - Launching the motivational intro and timer for timed habits
  - Evening daily review prompt + modal

**Important data from `useApp()`:**

- `getDailyHabits()`, `getTimedHabits()`
- `getWeeklyProgress()`
- `getDayCompletionRate(date)`
- `isCompleted(habitId, date)`, `toggleCompletion(habitId, date, duration?)`
- `getCompletionsForHabit(habitId)`
- `getCompletionDuration(habitId, date)`
- `getTimedProgressForHabit(habitId, date)`
- `getStreaksAtRisk()`
- Timer state + `startTimer(...)`
- Daily review helpers: `addDailyReview(...)`, `hasReviewedToday()`
- `settings` (for power phrases)

**Timer flow:**

1. User taps a **timed habit**:
   - If already completed → toggles completion off with light haptics.
   - If **not completed** and there is existing `TimedProgress` for today → resumes the timer immediately.
   - Otherwise → shows `MotivationalIntro`:
     - Plays words from a power phrase
     - Then shows habit name, duration, and optional “why”
     - “GO” starts the timer via `startTimer`.

2. `TimerScreen` is opened in a full‑screen `Modal` when `showTimer` is true and `timerState.isRunning` is true.

**Daily review flow:**

- In the evening (based on `isEvening()`), if:
  - There is non‑zero completion for today, and
  - The user hasn’t yet submitted a review, and
  - They haven’t dismissed the prompt for this session,
- Show the “How was today?” prompt card.
- Tapping it opens a modal where the user:
  - Selects a 1–5 emoji rating
  - Optionally writes a reflection note
  - On submit, `addDailyReview` is called.

**Add‑habit modal:**

- Triggered by the floating “+” action button.
- Lets the user:
  - Choose **Daily / Timed / Weekly**
  - Input a name
  - For Timed: choose from preset durations and enter an optional “why”
  - For Weekly: pick target per week
- Uses `addHabit` from `useApp()`.

---

### CalendarScreen

**File**: `src/screens/CalendarScreen.tsx`  
**Tab**: `Calendar`

**Purpose**:  
Show a **month‑level heatmap** of daily completion and let the user inspect any past date.

**Key responsibilities:**

- Render:
  - Month navigation header (prev/next)
  - `CalendarHeatmap` for the selected month
  - A detail section for the selected day
- Show, for the selected date:
  - Read‑only list of daily habits
  - A simple completion rate percentage

**Important data from `useApp()`:**

- `getDailyHabits()`
- `getCompletionsForDate(date)` (implicitly via `HabitItem`)
- `getDayCompletionRate(date)`

**Interactions:**

- Tapping a day in `CalendarHeatmap`:
  - Updates `selectedDate` (string `YYYY-MM-DD`)
  - Re‑renders:
    - Formatted display date at the top of the detail card
    - Completion rate for that day
    - List of `HabitItem` rows for daily habits on that date

**Notes:**

- The calendar grid is derived from `getCalendarDays(currentMonth)` in `date.ts`.
- Days outside the current month are still shown (to keep weeks complete) but with reduced opacity.

---

### StatsScreen

**File**: `src/screens/StatsScreen.tsx`  
**Tab**: `Stats`

**Purpose**:  
Provide **performance and consistency insights** over time: today, this week, last 30 days, streaks, and totals.

**Key responsibilities:**

- Show:
  - Weekly review hero card (weekly completion %, perfect days, current streak, weekly targets met)
  - Quick stats row (`StatsCard`s) for:
    - Today’s completion %
    - Number of perfect days this week
    - 30‑day average daily completion
  - Weekly targets summary (met vs total)
  - Streaks (current‑best and all‑time best)
  - All‑time totals (completions and days tracking)
  - A motivational quote / philosophy section

**Important data from `useApp()`:**

- `getDailyHabits()`, `getTimedHabits()`, `getWeeklyHabits()`
- `getWeeklyProgress()`
- `getDayCompletionRate(date)`
- `isCompleted(habitId, date)`
- Raw `completions` and `habits`

**Derived stats (in `StatsScreen`):**

- `todayRate` – via `getDayCompletionRate(today)`
- `weekRate` – average completion across days and daily/timed habits within the current week
- `weeklyTargetsMet` / `weeklyTargetsTotal` – from `weeklyProgress`
- `perfectDays` – days this week where completion rate is exactly 100%
- `thirtyDayRate` – average daily completion over the last 30 days
- `totalCompletions` – length of `completions`
- `bestStreak` / `currentBestStreak` – via streak helpers in `date.ts`
- `daysSinceStart` – days since the first completion record

If there are no daily or weekly habits defined yet, the screen shows a friendly “No Data Yet” empty state encouraging the user to add rituals first.

---

### SettingsScreen

**File**: `src/screens/SettingsScreen.tsx`  
**Tab**: `Settings`

**Purpose**:  
Central place to **define and manage rituals**, configure power phrases, and control notifications.

**Key responsibilities:**

- CRUD for habits, grouped by type:
  - Daily check‑off
  - Timed sessions
  - Weekly targets
- Manage:
  - Power phrases (create, remove)
  - Notification settings (enable/disable, morning/evening times)

**Important data from `useApp()`:**

- `habits`, `addHabit`, `updateHabit`, `deleteHabit`
- `settings`, `updateSettings`

**Habit management UX:**

- Three sections:
  - Daily Check‑off
  - Timed Sessions
  - Weekly Targets
- Each section has:
  - “+ Add” button → opens the add/edit modal preconfigured with the habit type
  - List of existing habits of that type (non‑archived) with:
    - Name
    - Either `x per week` or formatted duration (for timed)
    - Delete “×” button with destructive confirmation
  - Tapping an item opens the same modal in **edit** mode (prefilled fields).

**Power phrases:**

- Stored as `string[][]` in `UserSettings.customPhrases`.
- `SettingsScreen` lets the user:
  - Add a new phrase as a single uppercase string (e.g. `"LOCK IN"`), which is split into words internally.
  - Remove phrases individually.
- These phrases are later consumed by `MotivationalIntro`.

**Notifications:**

- Toggle: “Daily Reminders”
  - When turned on:
    - Requests OS notification permission
    - Calls `setupNotifications(true, morningTime, eveningTime)`
  - When turned off:
    - Calls `setupNotifications(false, ...)`, which cancels all scheduled notifications
- Time pickers:
  - Morning and evening times edited via `Alert.prompt` (24h `HH:MM` format)
  - On change, calls `updateSettings(...)` and refreshes scheduled notifications.

---

### TimerScreen

**File**: `src/screens/TimerScreen.tsx`  
**Presented as**: full‑screen `Modal` from `TodayScreen`

**Purpose**:  
Focused full‑screen UI for **timed habits**, showing a circular progress indicator, time stats, and controls.

**Key responsibilities:**

- Display:
  - Habit name
  - Circular progress ring (`ProgressRing` internal component)
  - Remaining time / overtime, with different colours for:
    - Normal
    - Completed
    - Overtime
  - Elapsed vs target time
  - Contextual motivational footer text
- Controls:
  - Pause / Resume (or Continue when complete)
  - “Save & Exit” (stop without marking complete)
  - “Done ✓” (mark complete and exit)

**Important data from `useApp()`:**

- `timerState`
- `pauseTimer`, `resumeTimer`, `stopTimer`, `completeTimer`

**Behaviour notes:**

- Uses a local helper `formatTime(seconds)` to render `mm:ss`.
- `ProgressRing` is a pure visual component that draws a circular track and animated arc using borders and rotation; it does not manage time.
- When the timer first hits the target duration, `TimerScreen` triggers a haptic success notification.

---

### Future screens

If you add new screens (for example, a **History** screen or a **Templates** manager), follow these conventions:

- Place them in `src/screens/`.
- Keep **business logic in `AppContext` and utils**, not inside the JSX.
- Make their responsibilities clear and narrow – document them here under a new heading.


