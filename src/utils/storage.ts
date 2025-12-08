import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, CompletionRecord, UserSettings, TimerState, TimedProgress, DailyReview } from '../types';

const KEYS = {
  HABITS: '@daily_ritual_habits',
  COMPLETIONS: '@daily_ritual_completions',
  SETTINGS: '@daily_ritual_settings',
  TIMER_STATE: '@daily_ritual_timer_state',
  TIMED_PROGRESS: '@daily_ritual_timed_progress',
  DAILY_REVIEWS: '@daily_ritual_daily_reviews',
};

const DEFAULT_SETTINGS: UserSettings = {
  selectedPhraseIndex: null,
  customPhrases: [],
  notificationsEnabled: false,
  morningReminderTime: '08:00',
  eveningReminderTime: '21:00',
  streakAlertEnabled: false,
  streakAlertTime: '15:00',
  incompleteReminderEnabled: false,
  incompleteReminderTime: '21:00',
  completionCelebrationEnabled: true,
  timerEndSound: 'vibration',
};

// Habits
export async function loadHabits(): Promise<Habit[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.HABITS);
    if (!data) return [];
    
    const habits = JSON.parse(data);
    // Normalize boolean values - ensure archived is always a boolean, not a string
    return habits.map((habit: any) => ({
      ...habit,
      archived: habit.archived === true || habit.archived === 'true' ? true : false,
    }));
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
  } catch (error) {
    console.error('Error saving habits:', error);
  }
}

// Completions
export async function loadCompletions(): Promise<CompletionRecord[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.COMPLETIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading completions:', error);
    return [];
  }
}

export async function saveCompletions(completions: CompletionRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.COMPLETIONS, JSON.stringify(completions));
  } catch (error) {
    console.error('Error saving completions:', error);
  }
}

// User Settings
export async function loadSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Timer State (for resuming interrupted sessions)
export async function loadTimerState(): Promise<TimerState | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TIMER_STATE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading timer state:', error);
    return null;
  }
}

export async function saveTimerState(timerState: TimerState | null): Promise<void> {
  try {
    if (timerState && timerState.habitId) {
      await AsyncStorage.setItem(KEYS.TIMER_STATE, JSON.stringify(timerState));
    } else {
      await AsyncStorage.removeItem(KEYS.TIMER_STATE);
    }
  } catch (error) {
    console.error('Error saving timer state:', error);
  }
}

// Timed Progress (accumulated time per habit per day)
export async function loadTimedProgress(): Promise<TimedProgress[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TIMED_PROGRESS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading timed progress:', error);
    return [];
  }
}

export async function saveTimedProgress(progress: TimedProgress[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.TIMED_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving timed progress:', error);
  }
}

// Daily Reviews
export async function loadDailyReviews(): Promise<DailyReview[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_REVIEWS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading daily reviews:', error);
    return [];
  }
}

export async function saveDailyReviews(reviews: DailyReview[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.DAILY_REVIEWS, JSON.stringify(reviews));
  } catch (error) {
    console.error('Error saving daily reviews:', error);
  }
}

// Utility to clear all data (for development/reset)
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.HABITS, 
      KEYS.COMPLETIONS, 
      KEYS.SETTINGS,
      KEYS.TIMER_STATE,
      KEYS.TIMED_PROGRESS,
      KEYS.DAILY_REVIEWS,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// Export data (for backup)
export async function exportData(): Promise<string> {
  const habits = await loadHabits();
  const completions = await loadCompletions();
  return JSON.stringify({ habits, completions, exportedAt: new Date().toISOString() });
}

// Import data (from backup)
export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (data.habits && data.completions) {
      await saveHabits(data.habits);
      await saveCompletions(data.completions);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

