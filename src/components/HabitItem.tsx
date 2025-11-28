import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useApp } from '../context/AppContext';
import { getStreak, getLongestStreak } from '../utils/date';

interface HabitItemProps {
  habitId: string;
  name: string;
  date: string;
  showStreak?: boolean;
}

export function HabitItem({ habitId, name, date, showStreak = true }: HabitItemProps) {
  const { isCompleted, toggleCompletion, getCompletionsForHabit } = useApp();
  const completed = isCompleted(habitId, date);
  
  const completedDates = getCompletionsForHabit(habitId);
  const currentStreak = getStreak(completedDates);
  const longestStreak = getLongestStreak(completedDates);

  const handlePress = async () => {
    await Haptics.impactAsync(
      completed 
        ? Haptics.ImpactFeedbackStyle.Light 
        : Haptics.ImpactFeedbackStyle.Medium
    );
    toggleCompletion(habitId, date);
  };

  return (
    <TouchableOpacity
      style={[styles.container, completed ? styles.containerCompleted : null]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxContainer}>
        <View style={[styles.checkbox, completed ? styles.checkboxCompleted : null]}>
          {completed ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.name, completed ? styles.nameCompleted : null]}>
          {name}
        </Text>
        
        {showStreak && currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </Text>
            {longestStreak > currentStreak && (
              <Text style={styles.longestStreakText}>
                best: {longestStreak}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {completed && (
        <View style={styles.completedIndicator} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerCompleted: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.background,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  nameCompleted: {
    color: colors.textPrimary,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  streakText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily.mono,
  },
  longestStreakText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.mono,
    marginLeft: spacing.sm,
  },
  completedIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
});

