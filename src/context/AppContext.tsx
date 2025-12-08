import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Habit, CompletionRecord, WeeklyProgress, TimerState, HabitType, UserSettings, TimedProgress, DailyReview } from '../types';
import { 
  loadHabits, saveHabits, 
  loadCompletions, saveCompletions, 
  loadSettings, saveSettings,
  loadTimerState, saveTimerState,
  loadTimedProgress, saveTimedProgress,
  loadDailyReviews, saveDailyReviews,
} from '../utils/storage';
import { formatDate, getWeekStart, getWeekEnd, getToday, isStreakAtRisk, getStreak } from '../utils/date';
import { sendCompletionCelebration } from '../utils/notifications';

// Simple ID generator (uuid was causing Android issues)
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const initialTimerState: TimerState = {
  habitId: null,
  habitName: '',
  targetDuration: 0,
  elapsedTime: 0,
  isRunning: false,
  isPaused: false,
  startedAt: null,
  date: null,
};

// Streak at risk info
interface StreakAtRiskInfo {
  habitId: string;
  habitName: string;
  streakLength: number;
  habitType: HabitType;
}

interface AppContextType {
  // Data
  habits: Habit[];
  completions: CompletionRecord[];
  settings: UserSettings;
  timedProgress: TimedProgress[];
  dailyReviews: DailyReview[];
  isLoading: boolean;
  
  // Timer
  timerState: TimerState;
  startTimer: (habit: Habit) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  completeTimer: () => void;
  
  // Habit management
  addHabit: (name: string, type: HabitType, options?: { targetPerWeek?: number; targetDuration?: number; why?: string }) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (habits: Habit[]) => void;
  
  // Completion management
  toggleCompletion: (habitId: string, date: string, duration?: number) => void;
  isCompleted: (habitId: string, date: string) => boolean;
  getCompletionDuration: (habitId: string, date: string) => number | undefined;
  
  // Timed progress
  getTimedProgressForHabit: (habitId: string, date: string) => number;
  
  // Daily reviews
  addDailyReview: (rating: number, note?: string) => void;
  getDailyReview: (date: string) => DailyReview | undefined;
  hasReviewedToday: () => boolean;
  
  // Streaks
  getStreaksAtRisk: () => StreakAtRiskInfo[];
  getHabitStreak: (habitId: string) => number;
  
  // Settings management
  updateSettings: (updates: Partial<UserSettings>) => void;
  
  // Computed data
  getDailyHabits: () => Habit[];
  getTimedHabits: () => Habit[];
  getWeeklyHabits: () => Habit[];
  getCompletionsForDate: (date: string) => string[];
  getCompletionsForHabit: (habitId: string) => string[];
  getWeeklyProgress: (date?: string) => WeeklyProgress[];
  getDayCompletionRate: (date: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialSettings: UserSettings = {
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [timedProgress, setTimedProgress] = useState<TimedProgress[]>([]);
  const [dailyReviews, setDailyReviews] = useState<DailyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const [loadedHabits, loadedCompletions, loadedSettings, loadedTimerState, loadedTimedProgress, loadedDailyReviews] = await Promise.all([
        loadHabits(),
        loadCompletions(),
        loadSettings(),
        loadTimerState(),
        loadTimedProgress(),
        loadDailyReviews(),
      ]);
      
      setHabits(loadedHabits);
      setCompletions(loadedCompletions);
      setSettings({ ...initialSettings, ...loadedSettings });
      setTimedProgress(loadedTimedProgress);
      setDailyReviews(loadedDailyReviews);
      
      // Restore timer state if it exists and is from today
      const today = getToday();
      if (loadedTimerState && loadedTimerState.habitId && loadedTimerState.date === today) {
        setTimerState({
          ...loadedTimerState,
          isRunning: true,
          isPaused: true,
        });
      }
      
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Save habits when changed
  useEffect(() => {
    if (!isLoading) {
      saveHabits(habits);
    }
  }, [habits, isLoading]);

  // Save completions when changed
  useEffect(() => {
    if (!isLoading) {
      saveCompletions(completions);
    }
  }, [completions, isLoading]);

  // Save settings when changed
  useEffect(() => {
    if (!isLoading) {
      saveSettings(settings);
    }
  }, [settings, isLoading]);

  // Save timed progress when changed
  useEffect(() => {
    if (!isLoading) {
      saveTimedProgress(timedProgress);
    }
  }, [timedProgress, isLoading]);

  // Save timer state when changed (for persistence across app restarts)
  useEffect(() => {
    if (!isLoading) {
      saveTimerState(timerState.habitId ? timerState : null);
    }
  }, [timerState, isLoading]);

  // Save daily reviews when changed
  useEffect(() => {
    if (!isLoading) {
      saveDailyReviews(dailyReviews);
    }
  }, [dailyReviews, isLoading]);

  // Settings management
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused]);

  // Get accumulated progress for a habit on a specific date
  const getTimedProgressForHabit = useCallback((habitId: string, date: string): number => {
    const progress = timedProgress.find(p => p.habitId === habitId && p.date === date);
    return progress?.accumulatedSeconds || 0;
  }, [timedProgress]);

  // Update timed progress (internal helper)
  const updateTimedProgressInternal = useCallback((habitId: string, date: string, seconds: number) => {
    setTimedProgress(prev => {
      const existing = prev.find(p => p.habitId === habitId && p.date === date);
      if (existing) {
        return prev.map(p => 
          p.habitId === habitId && p.date === date 
            ? { ...p, accumulatedSeconds: seconds }
            : p
        );
      } else {
        return [...prev, { habitId, date, accumulatedSeconds: seconds }];
      }
    });
  }, []);

  // Timer functions
  const startTimer = useCallback((habit: Habit) => {
    if (!habit.targetDuration) return;
    
    const today = getToday();
    
    // Check if there's existing progress for today
    const existingProgress = timedProgress.find(
      p => p.habitId === habit.id && p.date === today
    );
    const startingTime = existingProgress?.accumulatedSeconds || 0;
    
    setTimerState({
      habitId: habit.id,
      habitName: habit.name,
      targetDuration: habit.targetDuration,
      elapsedTime: startingTime,  // Resume from where we left off
      isRunning: true,
      isPaused: false,
      startedAt: new Date().toISOString(),
      date: today,
    });
  }, [timedProgress]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // Stop timer - saves progress but doesn't mark complete
  const stopTimer = useCallback(() => {
    if (timerState.habitId && timerState.date && timerState.elapsedTime > 0) {
      // Save the accumulated progress immediately
      const existing = timedProgress.find(
        p => p.habitId === timerState.habitId && p.date === timerState.date
      );
      
      let newProgress: TimedProgress[];
      if (existing) {
        newProgress = timedProgress.map(p => 
          p.habitId === timerState.habitId && p.date === timerState.date 
            ? { ...p, accumulatedSeconds: timerState.elapsedTime }
            : p
        );
      } else {
        newProgress = [...timedProgress, { 
          habitId: timerState.habitId, 
          date: timerState.date, 
          accumulatedSeconds: timerState.elapsedTime 
        }];
      }
      
      setTimedProgress(newProgress);
      saveTimedProgress(newProgress);
    }
    setTimerState(initialTimerState);
    saveTimerState(null);
  }, [timerState.habitId, timerState.date, timerState.elapsedTime, timedProgress]);

  // Complete timer - marks habit as done for the day
  const completeTimer = useCallback(() => {
    if (timerState.habitId && timerState.date) {
      // Create completion record with the total duration
      const newCompletion: CompletionRecord = {
        habitId: timerState.habitId,
        date: timerState.date,
        completedAt: new Date().toISOString(),
        duration: timerState.elapsedTime,
      };
      const newCompletions = [...completions, newCompletion];
      setCompletions(newCompletions);
      saveCompletions(newCompletions);
      
      // Clear the timed progress since it's now complete
      const newProgress = timedProgress.filter(
        p => !(p.habitId === timerState.habitId && p.date === timerState.date)
      );
      setTimedProgress(newProgress);
      saveTimedProgress(newProgress);
    }
    setTimerState(initialTimerState);
    saveTimerState(null);
  }, [timerState.habitId, timerState.date, timerState.elapsedTime, completions, timedProgress]);

  // Habit management - all save immediately
  const addHabit = useCallback((
    name: string, 
    type: HabitType, 
    options?: { targetPerWeek?: number; targetDuration?: number; why?: string }
  ) => {
    const newHabit: Habit = {
      id: generateId(),
      name,
      type,
      targetPerWeek: type === 'weekly' ? (options?.targetPerWeek || 1) : undefined,
      targetDuration: type === 'timed' ? (options?.targetDuration || 1800) : undefined,
      why: type === 'timed' ? options?.why : undefined,
      createdAt: new Date().toISOString(),
      order: habits.length,
    };
    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    saveHabits(newHabits);
  }, [habits]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    const newHabits = habits.map(h => h.id === id ? { ...h, ...updates } : h);
    setHabits(newHabits);
    saveHabits(newHabits);
  }, [habits]);

  const deleteHabit = useCallback((id: string) => {
    const newHabits = habits.filter(h => h.id !== id);
    const newCompletions = completions.filter(c => c.habitId !== id);
    const newProgress = timedProgress.filter(p => p.habitId !== id);
    
    setHabits(newHabits);
    setCompletions(newCompletions);
    setTimedProgress(newProgress);
    
    // Save all immediately
    saveHabits(newHabits);
    saveCompletions(newCompletions);
    saveTimedProgress(newProgress);
  }, [habits, completions, timedProgress]);

  const reorderHabits = useCallback((reorderedHabits: Habit[]) => {
    const newHabits = reorderedHabits.map((h, i) => ({ ...h, order: i }));
    setHabits(newHabits);
    saveHabits(newHabits);
  }, []);

  // Completion management - saves immediately to prevent data loss
  const toggleCompletion = useCallback((habitId: string, date: string, duration?: number) => {
    const existing = completions.find(c => c.habitId === habitId && c.date === date);
    
    let newCompletions: CompletionRecord[];
    let isAddingCompletion = false;
    
    if (existing) {
      newCompletions = completions.filter(c => !(c.habitId === habitId && c.date === date));
    } else {
      isAddingCompletion = true;
      const newCompletion: CompletionRecord = {
        habitId,
        date,
        completedAt: new Date().toISOString(),
        duration,
      };
      newCompletions = [...completions, newCompletion];
    }
    
    setCompletions(newCompletions);
    // Immediately save to prevent data loss on app close
    saveCompletions(newCompletions);

    // Check if all daily rituals are now complete (for celebration notification)
    if (isAddingCompletion && settings.completionCelebrationEnabled && settings.notificationsEnabled) {
      const dailyHabits = habits.filter(h => (h.type === 'daily' || h.type === 'timed') && !h.archived);
      const allComplete = dailyHabits.every(h => 
        newCompletions.some(c => c.habitId === h.id && c.date === date)
      );
      if (allComplete && dailyHabits.length > 0) {
        sendCompletionCelebration();
      }
    }
  }, [completions, habits, settings.completionCelebrationEnabled, settings.notificationsEnabled]);

  const isCompleted = useCallback((habitId: string, date: string) => {
    return completions.some(c => c.habitId === habitId && c.date === date);
  }, [completions]);

  const getCompletionDuration = useCallback((habitId: string, date: string) => {
    const completion = completions.find(c => c.habitId === habitId && c.date === date);
    return completion?.duration;
  }, [completions]);

  // Computed data
  const getDailyHabits = useCallback(() => {
    return habits
      .filter(h => h.type === 'daily' && !h.archived)
      .sort((a, b) => a.order - b.order);
  }, [habits]);

  const getTimedHabits = useCallback(() => {
    return habits
      .filter(h => h.type === 'timed' && !h.archived)
      .sort((a, b) => a.order - b.order);
  }, [habits]);

  const getWeeklyHabits = useCallback(() => {
    return habits
      .filter(h => h.type === 'weekly' && !h.archived)
      .sort((a, b) => a.order - b.order);
  }, [habits]);

  const getCompletionsForDate = useCallback((date: string) => {
    return completions
      .filter(c => c.date === date)
      .map(c => c.habitId);
  }, [completions]);

  const getCompletionsForHabit = useCallback((habitId: string) => {
    return completions
      .filter(c => c.habitId === habitId)
      .map(c => c.date)
      .sort();
  }, [completions]);

  const getWeeklyProgress = useCallback((date?: string) => {
    const targetDate = date || getToday();
    const weekStart = formatDate(getWeekStart(targetDate));
    const weekEnd = formatDate(getWeekEnd(targetDate));
    
    const weeklyHabits = getWeeklyHabits();
    
    return weeklyHabits.map(habit => {
      const completedDates = completions
        .filter(c => 
          c.habitId === habit.id && 
          c.date >= weekStart && 
          c.date <= weekEnd
        )
        .map(c => c.date);
      
      return {
        habitId: habit.id,
        habitName: habit.name,
        target: habit.targetPerWeek || 1,
        completed: completedDates.length,
        dates: completedDates,
      };
    });
  }, [completions, getWeeklyHabits]);

  const getDayCompletionRate = useCallback((date: string) => {
    const dailyHabits = getDailyHabits();
    const timedHabits = getTimedHabits();
    const allDailyHabits = [...dailyHabits, ...timedHabits];
    
    if (allDailyHabits.length === 0) return 0;
    
    const completedCount = allDailyHabits.filter(h => isCompleted(h.id, date)).length;
    return completedCount / allDailyHabits.length;
  }, [getDailyHabits, getTimedHabits, isCompleted]);

  // Daily Review functions - saves immediately
  const addDailyReview = useCallback((rating: number, note?: string) => {
    const today = getToday();
    const existing = dailyReviews.find(r => r.date === today);
    
    let newReviews: DailyReview[];
    
    if (existing) {
      newReviews = dailyReviews.map(r => 
        r.date === today 
          ? { ...r, rating, note, completedAt: new Date().toISOString() }
          : r
      );
    } else {
      const newReview: DailyReview = {
        date: today,
        rating,
        note,
        completedAt: new Date().toISOString(),
      };
      newReviews = [...dailyReviews, newReview];
    }
    
    setDailyReviews(newReviews);
    saveDailyReviews(newReviews);
  }, [dailyReviews]);

  const getDailyReview = useCallback((date: string) => {
    return dailyReviews.find(r => r.date === date);
  }, [dailyReviews]);

  const hasReviewedToday = useCallback(() => {
    const today = getToday();
    return dailyReviews.some(r => r.date === today);
  }, [dailyReviews]);

  // Streak functions
  const getHabitStreak = useCallback((habitId: string) => {
    const completedDates = completions
      .filter(c => c.habitId === habitId)
      .map(c => c.date);
    return getStreak(completedDates);
  }, [completions]);

  const getStreaksAtRisk = useCallback((): StreakAtRiskInfo[] => {
    const today = getToday();
    const dailyHabits = getDailyHabits();
    const timedHabits = getTimedHabits();
    const allDailyHabits = [...dailyHabits, ...timedHabits];
    
    return allDailyHabits
      .map(habit => {
        const completedDates = completions
          .filter(c => c.habitId === habit.id)
          .map(c => c.date);
        
        const { atRisk, streakLength } = isStreakAtRisk(completedDates, 3);
        
        if (atRisk) {
          return {
            habitId: habit.id,
            habitName: habit.name,
            streakLength,
            habitType: habit.type,
          };
        }
        return null;
      })
      .filter((item): item is StreakAtRiskInfo => item !== null)
      .sort((a, b) => b.streakLength - a.streakLength); // Longest streaks first
  }, [completions, getDailyHabits, getTimedHabits]);

  const value: AppContextType = {
    habits,
    completions,
    settings,
    timedProgress,
    dailyReviews,
    isLoading,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeTimer,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    toggleCompletion,
    isCompleted,
    getCompletionDuration,
    getTimedProgressForHabit,
    addDailyReview,
    getDailyReview,
    hasReviewedToday,
    getStreaksAtRisk,
    getHabitStreak,
    updateSettings,
    getDailyHabits,
    getTimedHabits,
    getWeeklyHabits,
    getCompletionsForDate,
    getCompletionsForHabit,
    getWeeklyProgress,
    getDayCompletionRate,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
