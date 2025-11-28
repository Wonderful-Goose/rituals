import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useApp } from '../context/AppContext';
import {
  getCalendarDays,
  formatDate,
  formatShortDay,
  isTodayDate,
  isInCurrentMonth,
} from '../utils/date';

interface CalendarHeatmapProps {
  currentMonth: Date;
  onDayPress?: (date: string) => void;
  selectedDate?: string;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarHeatmap({ currentMonth, onDayPress, selectedDate }: CalendarHeatmapProps) {
  const { getDayCompletionRate, getDailyHabits } = useApp();
  
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const hasDailyHabits = getDailyHabits().length > 0;

  const getHeatColor = (rate: number): string => {
    if (!hasDailyHabits) return colors.heat0;
    if (rate === 0) return colors.heat0;
    if (rate < 0.25) return colors.heat25;
    if (rate < 0.5) return colors.heat50;
    if (rate < 0.75) return colors.heat75;
    return colors.heat100;
  };

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <View style={styles.container}>
      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            const dateString = formatDate(day);
            const isToday = isTodayDate(day);
            const isCurrentMonth = isInCurrentMonth(day, currentMonth);
            const isSelected = selectedDate === dateString;
            const completionRate = getDayCompletionRate(dateString);
            const heatColor = getHeatColor(completionRate);
            
            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayCell,
                  { backgroundColor: heatColor },
                  isToday ? styles.dayCellToday : null,
                  isSelected ? styles.dayCellSelected : null,
                  !isCurrentMonth ? styles.dayCellOutside : null,
                ]}
                onPress={() => onDayPress?.(dateString)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday ? styles.dayTextToday : null,
                    !isCurrentMonth ? styles.dayTextOutside : null,
                  ]}
                >
                  {formatShortDay(day)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        <View style={[styles.legendBox, { backgroundColor: colors.heat0 }]} />
        <View style={[styles.legendBox, { backgroundColor: colors.heat25 }]} />
        <View style={[styles.legendBox, { backgroundColor: colors.heat50 }]} />
        <View style={[styles.legendBox, { backgroundColor: colors.heat75 }]} />
        <View style={[styles.legendBox, { backgroundColor: colors.heat100 }]} />
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekdayText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    marginHorizontal: 2,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayCellOutside: {
    opacity: 0.3,
  },
  dayText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  dayTextToday: {
    fontWeight: typography.weights.bold,
  },
  dayTextOutside: {
    color: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginHorizontal: spacing.xs,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});

