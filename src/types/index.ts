export type HabitType = 'daily' | 'weekly' | 'timed';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  targetPerWeek?: number; // For weekly habits: minimum times per week
  targetDuration?: number; // For timed habits: target duration in seconds
  why?: string; // Personal motivation for this specific habit
  createdAt: string;
  order: number;
  archived?: boolean;
}

export interface CompletionRecord {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completedAt: string; // ISO timestamp
  duration?: number; // For timed habits: actual duration in seconds
}

export interface TimerState {
  habitId: string | null;
  habitName: string;
  targetDuration: number; // in seconds
  elapsedTime: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  startedAt: string | null;
  date: string | null; // YYYY-MM-DD - the day this timer session belongs to
}

// Tracks accumulated time for timed habits per day (separate from completions)
export interface TimedProgress {
  habitId: string;
  date: string; // YYYY-MM-DD
  accumulatedSeconds: number; // Total seconds logged today (may be across multiple sessions)
}

export interface DayCompletions {
  [habitId: string]: boolean;
}

export interface WeeklyProgress {
  habitId: string;
  habitName: string;
  target: number;
  completed: number;
  dates: string[];
}

export interface DayStats {
  date: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
}

export interface WeekStats {
  weekStart: string;
  weekEnd: string;
  dailyCompletionRate: number;
  weeklyTargetsMet: number;
  weeklyTargetsTotal: number;
  dailyHabitsCompleted: number;
  dailyHabitsTotal: number;
}

export interface UserSettings {
  selectedPhraseIndex: number | null; // null = random phrase
  customPhrases: string[][]; // User's custom phrases
  notificationsEnabled: boolean;
  morningReminderTime: string; // HH:mm format
  eveningReminderTime: string; // HH:mm format
  // Additional notification options
  streakAlertEnabled: boolean;
  streakAlertTime: string; // HH:mm format - afternoon alert for streaks
  incompleteReminderEnabled: boolean;
  incompleteReminderTime: string; // HH:mm format - evening reminder if not done
  completionCelebrationEnabled: boolean; // Celebrate when all done
}

// Daily review/reflection entry
export interface DailyReview {
  date: string; // YYYY-MM-DD
  rating: number; // 1-5
  note?: string;
  completedAt: string; // ISO timestamp
}
