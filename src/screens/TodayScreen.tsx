import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { TimerScreen } from './TimerScreen';
import { MotivationalIntro } from '../components/MotivationalIntro';
import { formatDisplayDate, getToday, getStreak, getHoursUntilMidnight, isEvening } from '../utils/date';
import { Habit, HabitType } from '../types';

// Duration options for timed habits in minutes
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90];

// Format seconds to readable duration (e.g., "20m" or "1h 5m")
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export function TodayScreen() {
  const { 
    getDailyHabits, 
    getTimedHabits,
    getWeeklyProgress, 
    getDayCompletionRate, 
    isLoading,
    isCompleted,
    toggleCompletion,
    getCompletionsForHabit,
    getCompletionDuration,
    startTimer,
    timerState,
    settings,
    addHabit,
    getTimedProgressForHabit,
    getStreaksAtRisk,
    addDailyReview,
    hasReviewedToday,
  } = useApp();
  
  const [showTimer, setShowTimer] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [pendingHabit, setPendingHabit] = useState<Habit | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<HabitType>('daily');
  const [newHabitDuration, setNewHabitDuration] = useState(30);
  const [newHabitTarget, setNewHabitTarget] = useState(3);
  const [newHabitWhy, setNewHabitWhy] = useState('');
  
  // Daily review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewPromptDismissed, setReviewPromptDismissed] = useState(false);

  // Show timer if there's an active (paused) session from previous app state
  React.useEffect(() => {
    if (timerState.isRunning && timerState.habitId) {
      setShowTimer(true);
    }
  }, [timerState.isRunning, timerState.habitId]);
  
  // Check if we should show daily review prompt (evening, not reviewed, not dismissed)
  const shouldShowReviewPrompt = isEvening() && !hasReviewedToday() && !reviewPromptDismissed;
  
  const today = getToday();
  const dailyHabits = getDailyHabits();
  const timedHabits = getTimedHabits();
  const weeklyProgress = getWeeklyProgress();
  const completionRate = getDayCompletionRate(today);
  const streaksAtRisk = getStreaksAtRisk();
  const hoursLeft = getHoursUntilMidnight();
  
  const allDailyItems = [...dailyHabits, ...timedHabits];
  const completedCount = allDailyItems.filter(h => isCompleted(h.id, today)).length;
  const totalCount = allDailyItems.length;

  const handleHabitPress = async (habit: Habit) => {
    if (habit.type === 'timed') {
      if (!isCompleted(habit.id, today)) {
        // Check if there's existing progress to resume
        const existingProgress = getTimedProgressForHabit(habit.id, today);
        
        if (existingProgress > 0) {
          // Resume directly without intro
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          startTimer(habit);
          setShowTimer(true);
        } else {
          // Show motivational intro first
          setPendingHabit(habit);
          setShowIntro(true);
        }
      } else {
        // Already completed - allow unchecking
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleCompletion(habit.id, today);
      }
    } else {
      await Haptics.impactAsync(
        isCompleted(habit.id, today)
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium
      );
      toggleCompletion(habit.id, today);
    }
  };

  const handleIntroComplete = () => {
    if (pendingHabit) {
      startTimer(pendingHabit);
      setShowIntro(false);
      setShowTimer(true);
      setPendingHabit(null);
    }
  };

  const resetAddForm = () => {
    setNewHabitName('');
    setNewHabitType('daily');
    setNewHabitDuration(30);
    setNewHabitTarget(3);
    setNewHabitWhy('');
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addHabit(newHabitName.trim(), newHabitType, {
      targetPerWeek: newHabitTarget,
      targetDuration: newHabitDuration * 60,
      why: newHabitWhy.trim(),
    });

    setShowAddModal(false);
    resetAddForm();
  };

  const handleWeeklyPress = async (habitId: string) => {
    await Haptics.impactAsync(
      isCompleted(habitId, today)
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
    toggleCompletion(habitId, today);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating for today');
      return;
    }
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addDailyReview(reviewRating, reviewNote.trim() || undefined);
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewNote('');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = allDailyItems.length === 0 && weeklyProgress.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.date}>{formatDisplayDate(today)}</Text>
          {totalCount > 0 && (
            <View style={styles.scoreContainer}>
              <Text style={[
                styles.score,
                completionRate === 1 ? styles.scoreComplete : null,
                completionRate < 0.5 && completionRate > 0 ? styles.scoreLow : null,
              ]}>
                {Math.round(completionRate * 100)}
              </Text>
              <Text style={[
                styles.scorePercent,
                completionRate === 1 ? styles.scoreComplete : null,
                completionRate < 0.5 && completionRate > 0 ? styles.scoreLow : null,
              ]}>
                %
              </Text>
              <Text style={styles.scoreLabel}>
                {completedCount}/{totalCount} complete
              </Text>
            </View>
          )}
        </View>

        {/* Streaks at Risk Warning */}
        {streaksAtRisk.length > 0 && (
          <View style={styles.warningSection}>
            <View style={styles.warningHeader}>
              <Text style={styles.warningIcon}>🔥</Text>
              <Text style={styles.warningTitle}>
                {streaksAtRisk.length === 1 ? 'Streak at Risk!' : `${streaksAtRisk.length} Streaks at Risk!`}
              </Text>
            </View>
            {streaksAtRisk.map(streak => (
              <TouchableOpacity
                key={streak.habitId}
                style={styles.warningItem}
                onPress={() => {
                  const habit = [...dailyHabits, ...timedHabits].find(h => h.id === streak.habitId);
                  if (habit) handleHabitPress(habit);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.warningItemContent}>
                  <Text style={styles.warningItemName}>{streak.habitName}</Text>
                  <Text style={styles.warningItemStreak}>{streak.streakLength} day streak</Text>
                </View>
                <Text style={styles.warningItemTime}>
                  {hoursLeft}h left
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Daily Review Prompt */}
        {shouldShowReviewPrompt && completionRate > 0 && (
          <TouchableOpacity 
            style={styles.reviewPrompt}
            onPress={() => setShowReviewModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.reviewPromptContent}>
              <Text style={styles.reviewPromptIcon}>📝</Text>
              <View style={styles.reviewPromptText}>
                <Text style={styles.reviewPromptTitle}>How was today?</Text>
                <Text style={styles.reviewPromptSubtitle}>Take a moment to reflect on your progress</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setReviewPromptDismissed(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.reviewPromptDismiss}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyTitle}>No rituals defined</Text>
            <Text style={styles.emptySubtitle}>
              Go to Settings to add the habits you commit to.
            </Text>
          </View>
        ) : (
          <>
            {/* Daily Rituals */}
            {allDailyItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DAILY RITUALS</Text>
                {allDailyItems.map(habit => {
                  const completed = isCompleted(habit.id, today);
                  const completedDates = getCompletionsForHabit(habit.id);
                  const streak = getStreak(completedDates);
                  const completedDuration = habit.type === 'timed' ? getCompletionDuration(habit.id, today) : undefined;
                  
                  // Get partial progress for timed habits
                  const partialProgress = habit.type === 'timed' && !completed 
                    ? getTimedProgressForHabit(habit.id, today) 
                    : 0;
                  const hasPartialProgress = partialProgress > 0;
                  const targetDuration = habit.targetDuration || 0;
                  const progressPercent = targetDuration > 0 ? (partialProgress / targetDuration) * 100 : 0;
                  
                  return (
                    <TouchableOpacity
                    key={habit.id}
                      style={[
                        styles.habitItem, 
                        completed ? styles.habitItemComplete : null,
                        hasPartialProgress ? styles.habitItemInProgress : null,
                      ]}
                      onPress={() => handleHabitPress(habit)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox, 
                        completed ? styles.checkboxComplete : null,
                        hasPartialProgress ? styles.checkboxInProgress : null,
                      ]}>
                        {completed ? (
                          <Text style={styles.checkmark}>✓</Text>
                        ) : hasPartialProgress ? (
                          <Text style={styles.checkmarkPartial}>▶</Text>
                        ) : null}
                      </View>
                      <View style={styles.habitContent}>
                        <View style={styles.habitHeader}>
                          <Text style={[styles.habitName, completed ? styles.habitNameComplete : null]}>
                            {habit.name}
                          </Text>
                          {habit.type === 'timed' && habit.targetDuration && (
                            <View style={[
                              styles.timerBadge,
                              hasPartialProgress ? styles.timerBadgeInProgress : null,
                            ]}>
                              <Text style={[
                                styles.timerBadgeText,
                                hasPartialProgress ? styles.timerBadgeTextInProgress : null,
                              ]}>
                                {completed && completedDuration 
                                  ? formatDuration(completedDuration)
                                  : hasPartialProgress 
                                    ? `${formatDuration(partialProgress)} / ${formatDuration(targetDuration)}`
                                    : formatDuration(targetDuration)
                                }
                              </Text>
                            </View>
                          )}
                        </View>
                        {hasPartialProgress && (
                          <View style={styles.miniProgressBar}>
                            <View style={[styles.miniProgressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
                          </View>
                        )}
                        {!hasPartialProgress && streak > 0 && (
                          <Text style={styles.streak}>{streak} day streak</Text>
                        )}
                        {hasPartialProgress && (
                          <Text style={styles.resumeHint}>Tap to resume</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Weekly Targets */}
            {weeklyProgress.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>WEEKLY TARGETS</Text>
                {weeklyProgress.map(progress => {
                  const isMet = progress.completed >= progress.target;
                  const isCompletedToday = isCompleted(progress.habitId, today);
                  const progressPercent = Math.min((progress.completed / progress.target) * 100, 100);
                  
                  return (
                    <TouchableOpacity
                    key={progress.habitId}
                      style={[styles.weeklyItem, isMet ? styles.weeklyItemMet : null]}
                      onPress={() => handleWeeklyPress(progress.habitId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.weeklyHeader}>
                        <Text style={styles.weeklyName}>{progress.habitName}</Text>
                        <Text style={[styles.weeklyCount, isMet ? styles.weeklyCountMet : null]}>
                          {progress.completed}/{progress.target}
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${progressPercent}%` },
                            isMet ? styles.progressFillMet : null,
                          ]} 
                        />
                      </View>
                      <View style={styles.weeklyFooter}>
                        <Text style={styles.weeklyStatus}>
                          {isMet ? '✓ Target met' : `${progress.target - progress.completed} more to go`}
                        </Text>
                        {isCompletedToday && (
                          <Text style={styles.todayBadge}>Done today</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Motivational Intro Modal */}
      <Modal
        visible={showIntro && pendingHabit !== null}
        animationType="fade"
        presentationStyle="fullScreen"
      >
        {pendingHabit && (
          <MotivationalIntro
            habitName={pendingHabit.name}
            duration={pendingHabit.targetDuration || 0}
            onComplete={handleIntroComplete}
            onCancel={() => {
              setShowIntro(false);
              setPendingHabit(null);
            }}
            customPhrases={settings.customPhrases}
            selectedPhraseIndex={settings.selectedPhraseIndex}
            why={pendingHabit.why || ''}
          />
        )}
      </Modal>

      {/* Timer Modal */}
      <Modal
        visible={showTimer && timerState.isRunning}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <TimerScreen onClose={() => setShowTimer(false)} />
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Habit Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Ritual</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetAddForm(); }}>
                <Ionicons name="close" size={24} color="#8A8A8E" />
              </TouchableOpacity>
            </View>

            {/* Type Selector */}
            <View style={styles.typeSelector}>
              {(['daily', 'timed', 'weekly'] as HabitType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, newHabitType === type ? styles.typeButtonActive : null]}
                  onPress={() => setNewHabitType(type)}
                >
                  <Ionicons 
                    name={type === 'daily' ? 'checkbox-outline' : type === 'timed' ? 'timer-outline' : 'calendar-outline'} 
                    size={20} 
                    color={newHabitType === type ? '#FF3B30' : '#8A8A8E'} 
                  />
                  <Text style={[styles.typeButtonText, newHabitType === type ? styles.typeButtonTextActive : null]}>
                    {type === 'daily' ? 'Daily' : type === 'timed' ? 'Timed' : 'Weekly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name Input */}
            <Text style={styles.inputLabel}>NAME</Text>
            <TextInput
              style={styles.input}
              value={newHabitName}
              onChangeText={setNewHabitName}
              placeholder={newHabitType === 'timed' ? 'e.g., Study Russian' : newHabitType === 'weekly' ? 'e.g., Train BJJ' : 'e.g., Meditate'}
              placeholderTextColor="#5A5A5E"
              autoFocus={true}
              autoCapitalize="sentences"
            />

            {/* Timed Duration */}
            {newHabitType === 'timed' && (
              <>
                <Text style={styles.inputLabel}>DURATION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                  <View style={styles.optionRow}>
                    {DURATION_OPTIONS.map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        style={[styles.optionButton, newHabitDuration === mins ? styles.optionButtonActive : null]}
                        onPress={() => setNewHabitDuration(mins)}
                      >
                        <Text style={[styles.optionButtonText, newHabitDuration === mins ? styles.optionButtonTextActive : null]}>
                          {mins}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.inputLabel}>YOUR WHY (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, styles.whyInput]}
                  value={newHabitWhy}
                  onChangeText={setNewHabitWhy}
                  placeholder="Why is this important to you?"
                  placeholderTextColor="#5A5A5E"
                  multiline={true}
                />
              </>
            )}

            {/* Weekly Target */}
            {newHabitType === 'weekly' && (
              <>
                <Text style={styles.inputLabel}>TIMES PER WEEK</Text>
                <View style={styles.optionRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.optionButton, newHabitTarget === num ? styles.optionButtonActive : null]}
                      onPress={() => setNewHabitTarget(num)}
                    >
                      <Text style={[styles.optionButtonText, newHabitTarget === num ? styles.optionButtonTextActive : null]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddHabit}
            >
              <Text style={styles.saveButtonText}>Add Ritual</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Daily Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How was today?</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#8A8A8E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reviewSubtitle}>
              {completedCount}/{totalCount} rituals completed ({Math.round(completionRate * 100)}%)
            </Text>

            {/* Rating */}
            <Text style={styles.inputLabel}>YOUR RATING</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    reviewRating === rating ? styles.ratingButtonActive : null,
                  ]}
                  onPress={() => {
                    setReviewRating(rating);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.ratingEmoji,
                    reviewRating === rating ? styles.ratingEmojiActive : null,
                  ]}>
                    {rating === 1 ? '😞' : rating === 2 ? '😐' : rating === 3 ? '🙂' : rating === 4 ? '😊' : '🔥'}
                  </Text>
                  <Text style={[
                    styles.ratingLabel,
                    reviewRating === rating ? styles.ratingLabelActive : null,
                  ]}>
                    {rating === 1 ? 'Rough' : rating === 2 ? 'Meh' : rating === 3 ? 'Okay' : rating === 4 ? 'Good' : 'Great'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note */}
            <Text style={styles.inputLabel}>REFLECTION (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.reviewNoteInput]}
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="What went well? What could improve?"
              placeholderTextColor="#5A5A5E"
              multiline={true}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.saveButton, reviewRating === 0 ? styles.saveButtonDisabled : null]}
              onPress={handleSubmitReview}
            >
              <Text style={styles.saveButtonText}>Save Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#5A5A5E',
    fontSize: 16,
  },
  // Hero
  hero: {
    marginBottom: 32,
  },
  date: {
    color: '#8A8A8E',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  score: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  scorePercent: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  scoreComplete: {
    color: '#34C759',
  },
  scoreLow: {
    color: '#FF3B30',
  },
  scoreLabel: {
    color: '#5A5A5E',
    fontSize: 16,
    marginLeft: 12,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#2C2C2E',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#5A5A5E',
    fontSize: 16,
    textAlign: 'center',
  },
  // Section
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#5A5A5E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  // Habit Item
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  habitItemComplete: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: '#34C759',
  },
  habitItemInProgress: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderColor: '#FF9500',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#5A5A5E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  checkboxComplete: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkboxInProgress: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  checkmark: {
    color: '#0A0A0B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkmarkPartial: {
    color: '#0A0A0B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  habitContent: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },
  habitNameComplete: {
    color: '#FFFFFF',
  },
  timerBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  timerBadgeInProgress: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  timerBadgeText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerBadgeTextInProgress: {
    color: '#FF9500',
  },
  streak: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 149, 0, 0.3)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 2,
  },
  resumeHint: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  // Weekly Item
  weeklyItem: {
    backgroundColor: '#141416',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  weeklyItemMet: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: '#34C759',
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },
  weeklyCount: {
    color: '#FF3B30',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  weeklyCountMet: {
    color: '#34C759',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 3,
  },
  progressFillMet: {
    backgroundColor: '#34C759',
  },
  weeklyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyStatus: {
    color: '#5A5A5E',
    fontSize: 14,
  },
  todayBadge: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  // Add Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#1C1C1F',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  typeButtonText: {
    color: '#8A8A8E',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FF3B30',
  },
  inputLabel: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1F',
    borderRadius: 10,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 20,
  },
  whyInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  optionScroll: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1C1C1F',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  optionButtonText: {
    color: '#8A8A8E',
    fontSize: 15,
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#3A3A3E',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Warning Section (Streaks at Risk)
  warningSection: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF9500',
    padding: 16,
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningTitle: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  warningItemContent: {
    flex: 1,
  },
  warningItemName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  warningItemStreak: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  warningItemTime: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  // Review Prompt
  reviewPrompt: {
    backgroundColor: 'rgba(88, 86, 214, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5856D6',
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewPromptIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reviewPromptText: {
    flex: 1,
  },
  reviewPromptTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewPromptSubtitle: {
    color: '#5856D6',
    fontSize: 13,
    marginTop: 2,
  },
  reviewPromptDismiss: {
    color: '#5A5A5E',
    fontSize: 20,
    paddingLeft: 12,
  },
  // Review Modal
  reviewModalContent: {
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  reviewSubtitle: {
    color: '#8A8A8E',
    fontSize: 15,
    marginBottom: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1C1C1F',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    flex: 1,
    marginHorizontal: 3,
  },
  ratingButtonActive: {
    backgroundColor: 'rgba(88, 86, 214, 0.2)',
    borderColor: '#5856D6',
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  ratingEmojiActive: {
    transform: [{ scale: 1.1 }],
  },
  ratingLabel: {
    color: '#5A5A5E',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingLabelActive: {
    color: '#5856D6',
  },
  reviewNoteInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
});
