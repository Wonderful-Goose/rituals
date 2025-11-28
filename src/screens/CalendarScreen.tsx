import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths, subMonths } from 'date-fns';
import { colors, typography, spacing, borderRadius, globalStyles } from '../theme';
import { useApp } from '../context/AppContext';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { HabitItem } from '../components/HabitItem';
import { formatMonthYear, formatDisplayDate, getToday } from '../utils/date';

export function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const { getDailyHabits, getCompletionsForDate, getDayCompletionRate } = useApp();
  
  const dailyHabits = getDailyHabits();
  const completionsForDate = getCompletionsForDate(selectedDate);
  const completionRate = getDayCompletionRate(selectedDate);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false as const}
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentMonth)}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <CalendarHeatmap
          currentMonth={currentMonth}
          onDayPress={handleDayPress}
          selectedDate={selectedDate}
        />

        {/* Selected Day Details */}
        <View style={styles.dayDetails}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{formatDisplayDate(selectedDate)}</Text>
            {dailyHabits.length > 0 && (
              <Text style={styles.dayRate}>
                {Math.round(completionRate * 100)}%
              </Text>
            )}
          </View>

          {dailyHabits.length === 0 ? (
            <Text style={styles.noHabitsText}>
              No daily rituals configured
            </Text>
          ) : (
            <View style={styles.habitsList}>
              {dailyHabits.map(habit => (
                <HabitItem
                  key={habit.id}
                  habitId={habit.id}
                  name={habit.name}
                  date={selectedDate}
                  showStreak={false}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  navButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
  },
  monthText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  dayDetails: {
    marginTop: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  dayRate: {
    color: colors.accent,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily.mono,
  },
  noHabitsText: {
    color: colors.textMuted,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  habitsList: {
    marginTop: spacing.sm,
  },
});

