import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subDays, parseISO, differenceInDays, getDay } from 'date-fns';
import { colors, typography, spacing, borderRadius, globalStyles } from '../theme';
import { useApp } from '../context/AppContext';
import { StatsCard } from '../components/StatsCard';
import { getToday, getWeekStart, getWeekEnd, formatDate, getLongestStreak, getStreak } from '../utils/date';

export function StatsScreen() {
  const { 
    getDailyHabits, 
    getTimedHabits,
    getWeeklyHabits,
    getWeeklyProgress, 
    getDayCompletionRate, 
    completions,
    habits,
    isCompleted,
  } = useApp();

  const today = getToday();
  const dailyHabits = getDailyHabits();
  const timedHabits = getTimedHabits();
  const allDailyHabits = [...dailyHabits, ...timedHabits];
  const weeklyHabits = getWeeklyHabits();
  const weeklyProgress = getWeeklyProgress();

  // Calculate stats
  const stats = useMemo(() => {
    if (allDailyHabits.length === 0 && weeklyHabits.length === 0) {
      return null;
    }

    // Today's completion rate
    const todayRate = getDayCompletionRate(today);

    // This week's daily completion rate
    const weekStart = formatDate(getWeekStart(today));
    const weekDays: string[] = [];
    let currentDay = parseISO(weekStart);
    const todayDate = parseISO(today);
    while (currentDay <= todayDate) {
      weekDays.push(formatDate(currentDay));
      currentDay = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000);
    }

    let weekTotalPossible = 0;
    let weekTotalCompleted = 0;
    weekDays.forEach(day => {
      weekTotalPossible += allDailyHabits.length;
      allDailyHabits.forEach(habit => {
        if (isCompleted(habit.id, day)) {
          weekTotalCompleted++;
        }
      });
    });
    const weekRate = weekTotalPossible > 0 ? weekTotalCompleted / weekTotalPossible : 0;

    // Weekly targets met
    const weeklyTargetsMet = weeklyProgress.filter(p => p.completed >= p.target).length;

    // Perfect days this week
    const perfectDays = weekDays.filter(day => {
      const rate = getDayCompletionRate(day);
      return rate === 1 && allDailyHabits.length > 0;
    }).length;

    // Last 30 days rate
    const thirtyDaysAgo = formatDate(subDays(new Date(), 30));
    const last30Days: string[] = [];
    for (let i = 30; i >= 0; i--) {
      last30Days.push(formatDate(subDays(new Date(), i)));
    }

    let total30DaysPossible = 0;
    let total30DaysCompleted = 0;
    last30Days.forEach(day => {
      total30DaysPossible += allDailyHabits.length;
      allDailyHabits.forEach(habit => {
        if (isCompleted(habit.id, day)) {
          total30DaysCompleted++;
        }
      });
    });
    const thirtyDayRate = total30DaysPossible > 0 ? total30DaysCompleted / total30DaysPossible : 0;

    // Total completions ever
    const totalCompletions = completions.length;

    // Best streak across all daily habits
    let bestStreak = 0;
    let currentBestStreak = 0;
    allDailyHabits.forEach(habit => {
      const habitCompletions = completions
        .filter(c => c.habitId === habit.id)
        .map(c => c.date);
      const longest = getLongestStreak(habitCompletions);
      const current = getStreak(habitCompletions);
      if (longest > bestStreak) bestStreak = longest;
      if (current > currentBestStreak) currentBestStreak = current;
    });

    // Days since first completion
    const allDates = completions.map(c => c.date).sort();
    const daysSinceStart = allDates.length > 0 
      ? differenceInDays(new Date(), parseISO(allDates[0])) 
      : 0;

    return {
      todayRate,
      weekRate,
      thirtyDayRate,
      weeklyTargetsMet,
      weeklyTargetsTotal: weeklyHabits.length,
      perfectDays,
      perfectDaysTotal: weekDays.length,
      totalCompletions,
      bestStreak,
      currentBestStreak,
      daysSinceStart,
      totalDailyHabits: allDailyHabits.length,
      totalWeeklyHabits: weeklyHabits.length,
    };
  }, [allDailyHabits, weeklyHabits, completions, today, weeklyProgress, getDayCompletionRate, isCompleted]);

  if (!stats || (stats.totalDailyHabits === 0 && stats.totalWeeklyHabits === 0)) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>
            Add some rituals in Settings and start tracking to see your stats.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false as const}
      >
        <Text style={styles.title}>Performance</Text>
        <Text style={styles.subtitle}>The truth about your commitments.</Text>

        {/* Weekly Review Card - Shows insights */}
        <View style={styles.weeklyReviewCard}>
          <View style={styles.weeklyReviewHeader}>
            <Text style={styles.weeklyReviewTitle}>📊 Weekly Review</Text>
            <Text style={styles.weeklyReviewLabel}>THIS WEEK</Text>
          </View>
          
          <View style={styles.weeklyReviewHero}>
            <Text style={[
              styles.weeklyReviewScore,
              stats.weekRate >= 0.9 ? styles.heroValueSuccess : null,
              stats.weekRate < 0.5 ? styles.heroValueDanger : null,
            ]}>
              {Math.round(stats.weekRate * 100)}%
            </Text>
            <Text style={styles.weeklyReviewScoreLabel}>completion</Text>
          </View>

          <View style={styles.weeklyReviewStats}>
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>{stats.perfectDays}</Text>
              <Text style={styles.weeklyReviewStatLabel}>Perfect Days</Text>
            </View>
            <View style={styles.weeklyReviewDivider} />
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>{stats.currentBestStreak}</Text>
              <Text style={styles.weeklyReviewStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.weeklyReviewDivider} />
            <View style={styles.weeklyReviewStat}>
              <Text style={styles.weeklyReviewStatValue}>
                {stats.totalWeeklyHabits > 0 ? `${stats.weeklyTargetsMet}/${stats.weeklyTargetsTotal}` : '-'}
              </Text>
              <Text style={styles.weeklyReviewStatLabel}>Targets Met</Text>
            </View>
          </View>

          <View style={styles.weeklyInsight}>
            <Text style={styles.weeklyInsightText}>
              {stats.weekRate >= 0.9 
                ? "🔥 Outstanding week. You're building unstoppable momentum." 
                : stats.weekRate >= 0.7 
                  ? "💪 Solid week. Keep pushing, you're on the right track."
                  : stats.weekRate >= 0.5 
                    ? "⚡ Decent progress. Time to step it up next week."
                    : "🎯 Room for improvement. What's one thing you can change?"}
            </Text>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <StatsCard
            label="Today"
            value={`${Math.round(stats.todayRate * 100)}%`}
            accent={stats.todayRate === 1}
          />
          <StatsCard
            label="Perfect Days"
            value={stats.perfectDays}
            subValue={`of ${stats.perfectDaysTotal} this week`}
          />
          <StatsCard
            label="30 Day Avg"
            value={`${Math.round(stats.thirtyDayRate * 100)}%`}
          />
        </View>

        {/* Weekly Targets */}
        {stats.totalWeeklyHabits > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WEEKLY TARGETS</Text>
            <View style={styles.targetCard}>
              <View style={styles.targetHeader}>
                <Text style={styles.targetValue}>
                  {stats.weeklyTargetsMet}/{stats.weeklyTargetsTotal}
                </Text>
                <Text style={styles.targetLabel}>targets met</Text>
              </View>
              <View style={styles.targetBar}>
                <View 
                  style={[
                    styles.targetBarFill,
                    { 
                      width: `${(stats.weeklyTargetsMet / stats.weeklyTargetsTotal) * 100}%`,
                    },
                    stats.weeklyTargetsMet === stats.weeklyTargetsTotal ? styles.targetBarFillComplete : null,
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Streaks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STREAKS</Text>
          <View style={styles.statsRow}>
            <StatsCard
              label="Current Best"
              value={stats.currentBestStreak}
              subValue="days"
              accent={stats.currentBestStreak >= 7}
            />
            <StatsCard
              label="All-Time Best"
              value={stats.bestStreak}
              subValue="days"
            />
          </View>
        </View>

        {/* All Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALL TIME</Text>
          <View style={styles.statsRow}>
            <StatsCard
              label="Total Completions"
              value={stats.totalCompletions}
            />
            <StatsCard
              label="Days Tracking"
              value={stats.daysSinceStart}
            />
          </View>
        </View>

        {/* Philosophy */}
        <View style={styles.philosophySection}>
          <Text style={styles.philosophyText}>
            "Every action you take is a vote for the type of person you wish to become."
          </Text>
          <Text style={styles.philosophyAuthor}>— James Clear</Text>
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
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    marginBottom: spacing.lg,
  },
  heroSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  heroValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily.mono,
  },
  heroValueSuccess: {
    color: colors.success,
  },
  heroValueDanger: {
    color: colors.accent,
  },
  heroSubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    marginHorizontal: -spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  targetCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  targetValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily.mono,
    marginRight: spacing.sm,
  },
  targetLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
  },
  targetBar: {
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  targetBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  targetBarFillComplete: {
    backgroundColor: colors.success,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  philosophySection: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  philosophyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  philosophyAuthor: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'right',
  },
  // Weekly Review Card
  weeklyReviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weeklyReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  weeklyReviewTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  weeklyReviewLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  weeklyReviewHero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  weeklyReviewScore: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily.mono,
  },
  weeklyReviewScoreLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    marginTop: -spacing.xs,
  },
  weeklyReviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  weeklyReviewStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyReviewStatValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily.mono,
  },
  weeklyReviewStatLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  weeklyReviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  weeklyInsight: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  weeklyInsightText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});

