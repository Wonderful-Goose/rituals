## State and Data Model

This document explains how the app models habits, completions, timer state, user settings, and reviews – and how that data is persisted.

All app‑level state lives in **`AppProvider`** (`src/context/AppContext.tsx`) and is shaped by the interfaces in **`src/types/index.ts`**.

---

### Core domain types

Defined in `src/types/index.ts`:

- **`Habit`**
  - `id: string` – unique identifier (generated in `AppContext` with `generateId`)
  - `name: string` – label shown in the UI
  - `type: HabitType` – `'daily' | 'weekly' | 'timed'`
  - `targetPerWeek?: number` – for weekly habits (how many times per week)
  - `targetDuration?: number` – for timed habits (seconds)
  - `why?: string` – optional user‑written motivation (timed habits)
  - `createdAt: string` – ISO timestamp
  - `order: number` – sort index in lists
  - `archived?: boolean` – soft delete flag (not shown in most UIs)

- **`CompletionRecord`**
  - `habitId: string`
  - `date: string` – **`YYYY-MM-DD`** format
  - `completedAt: string` – ISO timestamp
  - `duration?: number` – actual duration in seconds (timed habits)

- **`TimerState`**
  - Describes the **current** running or paused timer, including:
    - `habitId`, `habitName`
    - `targetDuration`, `elapsedTime`
    - `isRunning`, `isPaused`
    - `startedAt` – ISO timestamp when the current session started
    - `date` – `YYYY-MM-DD` for which day the session counts

- **`TimedProgress`**
  - Aggregated partial time for timed habits per day:
    - `habitId`
    - `date`
    - `accumulatedSeconds`
  - Lets the user leave the timer and come back later **without losing progress**, before they finally “complete” the habit.

- **`WeeklyProgress`**
  - Pre‑computed view model for weekly habits:
    - `habitId`, `habitName`
    - `target`, `completed`
    - `dates: string[]` – all completion dates in the current week

- **`UserSettings`**
  - `selectedPhraseIndex: number | null` – choose a specific power phrase, or `null` to randomise
  - `customPhrases: string[][]` – user‑defined sequences of words shown before timed sessions
  - `notificationsEnabled: boolean`
  - `morningReminderTime: string` – e.g. `"08:00"`
  - `eveningReminderTime: string` – e.g. `"21:00"`

- **`DailyReview`**
  - Simple reflection log:
    - `date: string`
    - `rating: number` – 1–5
    - `note?: string`
    - `completedAt: string`

---

### AppContext state shape

`AppProvider` owns the following `useState` slices:

- `habits: Habit[]`
- `completions: CompletionRecord[]`
- `settings: UserSettings`
- `timedProgress: TimedProgress[]`
- `dailyReviews: DailyReview[]`
- `isLoading: boolean` – gates initial load and prevents saving too early
- `timerState: TimerState`

On mount it runs an async `loadData()` that calls:

- `loadHabits()`
- `loadCompletions()`
- `loadSettings()`
- `loadTimerState()`
- `loadTimedProgress()`
- `loadDailyReviews()`

Once loaded, it:
- Merges settings with defaults
- Optionally restores the timer state **only if it belongs to today**
- Sets `isLoading` to `false`

---

### Persistence layer (AsyncStorage)

All persistence goes through `src/utils/storage.ts`. Keys:

- `@daily_ritual_habits`
- `@daily_ritual_completions`
- `@daily_ritual_settings`
- `@daily_ritual_timer_state`
- `@daily_ritual_timed_progress`
- `@daily_ritual_daily_reviews`

**Design choices:**

- **Defensive loading** – every `load*` function:
  - Wraps `AsyncStorage` calls in `try/catch`
  - Logs errors and returns a sensible default
  - Normalises data when needed (e.g. converts `archived: "true"` → `true`)

- **Eager saving** – most mutations **immediately call the corresponding `save*` helper** (not just relying on change effects). This reduces the chance of data loss if the app is backgrounded or killed.

- **Timer state persistence** – `saveTimerState` only stores the timer if there is an active `habitId`. When the timer is cleared, the key is removed, which keeps storage clean and avoids resuming stale timers.

- **Helpers for dev/backup**:
  - `clearAllData()` – wipes all the above keys
  - `exportData()` / `importData()` – simple JSON dump/restore for habits and completions

---

### Core behaviours in AppContext

#### Habit lifecycle

- **Add** – `addHabit(name, type, options?)`
  - Generates a new `Habit` with:
    - A unique id
    - Proper `targetPerWeek` / `targetDuration` / `why` based on `type`
    - `order` set to `habits.length` (append at end)
  - Saves the updated array via `saveHabits`.

- **Update** – `updateHabit(id, updates)`
  - Merges `updates` into the target habit
  - Saves immediately

- **Delete** – `deleteHabit(id)`
  - Removes the habit
  - Also removes linked `completions` and `timedProgress`
  - Saves all three arrays

- **Reorder** – `reorderHabits(reorderedHabits)`
  - Rewrites `order` indices based on new array order and saves

#### Completion tracking

- **Toggle** – `toggleCompletion(habitId, date, duration?)`
  - If a record exists for that `habitId` + `date`, it is removed
  - Otherwise, a new `CompletionRecord` is created (optionally with `duration`)
  - Saves immediately via `saveCompletions`

- **Queries**:
  - `isCompleted(habitId, date)` – boolean
  - `getCompletionDuration(habitId, date)` – optional duration
  - `getCompletionsForDate(date)` – list of `habitId` strings
  - `getCompletionsForHabit(habitId)` – sorted list of all completion dates

#### Timer and timed progress

Timed habits are intentionally **two‑step**:

1. **Time logging phase** via the timer:
   - `startTimer(habit)`:
     - Looks up existing `TimedProgress` for today and pre‑fills `elapsedTime`
     - Sets `timerState` to running, unpaused
   - Tick effect:
     - While `timerState.isRunning && !timerState.isPaused`, a `setInterval` adds `+1` to `elapsedTime` every second
   - `pauseTimer()` / `resumeTimer()` toggle `isPaused`

2. **Decision phase**:
   - `stopTimer()` – **save partial progress**, but do not mark the habit complete:
     - Writes `elapsedTime` into `timedProgress` for the current habit/date and persists it
     - Resets `timerState` and removes the timer key from storage
   - `completeTimer()` – **finalise the habit**:
     - Appends a `CompletionRecord` with `duration = elapsedTime`
     - Clears any matching `TimedProgress` records
     - Resets and clears `timerState`

Supporting selectors:

- `getTimedProgressForHabit(habitId, date)` – returns accumulated seconds (or `0`)

UI usage:

- `TodayScreen`:
  - If a timed habit is not yet complete but has non‑zero `TimedProgress` for today:
    - Shows a “▶” partial‑progress badge and mini progress bar
    - Tapping resumes the timer directly
  - Otherwise, the motivational intro (`MotivationalIntro`) is shown first.

#### Settings and notifications

- Settings are updated through `updateSettings(partial)` which shallow‑merges the new values.
- `SettingsScreen` manages:
  - Notification toggle and times
  - Power phrases (adds/removes `customPhrases`)

Notification scheduling is centralised in `src/utils/notifications.ts`:

- `requestNotificationPermissions()` – asks OS for permission and configures an Android channel
- `scheduleMorningReminder(...)` / `scheduleEveningReminder(...)` – create repeating notifications; they:
  - Cancel existing reminders with the same logical tag before scheduling new ones
- `setupNotifications(enabled, morningTime, eveningTime)` – main entrypoint:
  - When disabling: cancels all scheduled notifications
  - When enabling: ensures permissions, parses HH:mm strings, and schedules both morning and evening reminders

#### Daily reviews

- `addDailyReview(rating, note?)`:
  - Upserts a review for **today** with rating + optional note
  - Saves immediately
- `getDailyReview(date)` – returns an entry for that date, if any
- `hasReviewedToday()` – boolean used by `TodayScreen` to decide whether to show the evening review prompt

#### Streaks and streaks at risk

Streak logic is built on top of date helpers in `src/utils/date.ts`:

- `getStreak(completedDates: string[])` – counts the current streak, assuming:
  - Streaks must be continuous
  - A streak is still considered “active” if the last completion date is today or yesterday

- `getLongestStreak(completedDates: string[])` – scans all historical dates and finds the longest continuous run.

- `isStreakAtRisk(completedDates, minStreak)`:
  - If the last completion was yesterday and the streak length ≥ `minStreak`, returns `{ atRisk: true, streakLength }`

`AppContext` exposes:

- `getHabitStreak(habitId)` – delegates to `getStreak`
- `getStreaksAtRisk()` – filters daily and timed habits whose streak would break **tonight** if the user does nothing

`TodayScreen` uses `getStreaksAtRisk()` to render a warning section with “X streak at risk” cards.

---

### Derived/computed views

To keep screens simple, most “view model” logic lives in `AppContext`:

- `getDailyHabits()` – unarchived, type `'daily'`, sorted by `order`
- `getTimedHabits()` – unarchived, type `'timed'`, sorted
- `getWeeklyHabits()` – unarchived, type `'weekly'`, sorted
- `getWeeklyProgress(date?)` – builds `WeeklyProgress[]` for the week containing `date` (default: today)
- `getDayCompletionRate(date)` – fraction of daily+timed habits completed on a given day

`StatsScreen` builds additional stats (`todayRate`, weekly average, 30‑day average, best streaks, etc.) on top of these helpers plus raw `completions`.

---

### When you add new state

If you introduce a new concept (e.g. tags, categories, or templates), try to follow this pattern:

1. **Define types** in `src/types/index.ts`.
2. **Add storage helpers** in `src/utils/storage.ts` (and new keys if necessary).
3. **Extend `AppContext`**:
   - Add a `useState` slice
   - Add load/save logic in the initial `loadData()` and the relevant effects
   - Expose methods and selectors through the `AppContextType` interface.
4. **Use selectors in screens/components**, not raw storage or scattered state.

This keeps the mental model simple: **“If it’s global app data, I’ll find it in `AppContext` and `storage.ts`.”**


