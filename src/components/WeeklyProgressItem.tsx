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
import { getToday } from '../utils/date';
import { WeeklyProgress } from '../types';

interface WeeklyProgressItemProps {
  progress: WeeklyProgress;
}

export function WeeklyProgressItem({ progress }: WeeklyProgressItemProps) {
  const { toggleCompletion, isCompleted } = useApp();
  const { habitId, habitName, target, completed } = progress;
  
  const today = getToday();
  const isCompletedToday = isCompleted(habitId, today);
  const isMet = completed >= target;
  
  const handlePress = async () => {
    await Haptics.impactAsync(
      isCompletedToday 
        ? Haptics.ImpactFeedbackStyle.Light 
        : Haptics.ImpactFeedbackStyle.Medium
    );
    toggleCompletion(habitId, today);
  };

  const progressPercentage = Math.min((completed / target) * 100, 100);

  return (
    <TouchableOpacity
      style={[styles.container, isMet ? styles.containerMet : null]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.name, isMet ? styles.nameMet : null]}>
          {habitName}
        </Text>
        <Text style={[styles.count, isMet ? styles.countMet : null]}>
          {completed}/{target}
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progressPercentage}%` },
            isMet ? styles.progressBarMet : null
          ]} 
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.statusText}>
          {isMet 
            ? '✓ Target met' 
            : `${target - completed} more to go`
          }
        </Text>
        {isCompletedToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Done today</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerMet: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  nameMet: {
    color: colors.textPrimary,
  },
  count: {
    color: colors.accent,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily.mono,
  },
  countMet: {
    color: colors.success,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  progressBarMet: {
    backgroundColor: colors.success,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  todayBadge: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  todayBadgeText: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});

