import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
  subDays,
  addDays,
  differenceInDays,
  getDay,
} from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, DATE_FORMAT);
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  return format(d, 'EEE, MMM d');
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM yyyy');
}

export function formatShortDay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd');
}

export function formatWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEEEE'); // Mo, Tu, We, etc.
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getTodayDate(): Date {
  return new Date();
}

// Week starts on Monday
export function getWeekStart(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(d, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfWeek(d, { weekStartsOn: 1 });
}

export function getWeekDays(date: Date | string): Date[] {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date: Date | string): Date[] {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const start = startOfMonth(d);
  const end = endOfMonth(d);
  return eachDayOfInterval({ start, end });
}

export function getCalendarDays(date: Date | string): Date[] {
  // Returns 6 weeks of days for calendar view, starting from Monday
  const d = typeof date === 'string' ? parseISO(date) : date;
  const monthStart = startOfMonth(d);
  const monthEnd = endOfMonth(d);
  
  // Get the Monday of the first week
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Get the Sunday of the last week
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function isTodayDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}

export function isSameDayAs(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(d1, d2);
}

export function isInCurrentMonth(date: Date | string, referenceDate: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const ref = typeof referenceDate === 'string' ? parseISO(referenceDate) : referenceDate;
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function getDaysBetween(startDate: Date | string, endDate: Date | string): string[] {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return eachDayOfInterval({ start, end }).map(formatDate);
}

export function getStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  
  const sortedDates = [...completedDates].sort().reverse();
  const today = getToday();
  const yesterday = formatDate(subDays(new Date(), 1));
  
  // Check if streak is active (completed today or yesterday)
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }
  
  let streak = 1;
  let currentDate = parseISO(sortedDates[0]);
  
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPrevious = formatDate(subDays(currentDate, 1));
    if (sortedDates[i] === expectedPrevious) {
      streak++;
      currentDate = parseISO(sortedDates[i]);
    } else {
      break;
    }
  }
  
  return streak;
}

export function getLongestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  
  const sortedDates = [...completedDates].sort();
  let longest = 1;
  let current = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseISO(sortedDates[i - 1]);
    const currDate = parseISO(sortedDates[i]);
    
    if (differenceInDays(currDate, prevDate) === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (differenceInDays(currDate, prevDate) > 1) {
      current = 1;
    }
    // If same day, skip
  }
  
  return longest;
}

// Check if a streak is at risk (completed yesterday, not today, streak >= minStreak)
export function isStreakAtRisk(completedDates: string[], minStreak: number = 3): { atRisk: boolean; streakLength: number } {
  if (completedDates.length === 0) return { atRisk: false, streakLength: 0 };
  
  const sortedDates = [...completedDates].sort().reverse();
  const today = getToday();
  const yesterday = formatDate(subDays(new Date(), 1));
  
  // If completed today, not at risk
  if (sortedDates[0] === today) {
    return { atRisk: false, streakLength: getStreak(completedDates) };
  }
  
  // If last completion was yesterday, streak is at risk
  if (sortedDates[0] === yesterday) {
    const streak = getStreak(completedDates);
    return { atRisk: streak >= minStreak, streakLength: streak };
  }
  
  // Streak already broken
  return { atRisk: false, streakLength: 0 };
}

// Get hours remaining until midnight
export function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
}

// Check if it's evening (after 6pm)
export function isEvening(): boolean {
  return new Date().getHours() >= 18;
}

