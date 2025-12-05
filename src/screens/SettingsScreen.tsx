import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { Habit, HabitType } from '../types';
import { setupNotifications, requestNotificationPermissions } from '../utils/notifications';

interface HabitFormData {
  name: string;
  type: HabitType;
  targetPerWeek: number;
  targetDuration: number; // in minutes for UI
  why: string; // Personal motivation for this habit
}

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240];

export function SettingsScreen() {
  const { habits, addHabit, updateHabit, deleteHabit, settings, updateSettings } = useApp();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPhraseModalVisible, setIsPhraseModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newPhrase, setNewPhrase] = useState('');
  const [formData, setFormData] = useState<HabitFormData>({
    name: '',
    type: 'daily',
    targetPerWeek: 1,
    targetDuration: 30,
    why: '',
  });

  const dailyHabits = habits.filter(h => h.type === 'daily' && !h.archived);
  const timedHabits = habits.filter(h => h.type === 'timed' && !h.archived);
  const weeklyHabits = habits.filter(h => h.type === 'weekly' && !h.archived);

  const resetForm = () => {
    setFormData({ name: '', type: 'daily', targetPerWeek: 1, targetDuration: 30, why: '' });
    setEditingHabit(null);
  };

  const openAddModal = (type: HabitType) => {
    resetForm();
    setFormData(prev => ({ ...prev, type }));
    setIsModalVisible(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      type: habit.type,
      targetPerWeek: habit.targetPerWeek || 1,
      targetDuration: habit.targetDuration ? Math.floor(habit.targetDuration / 60) : 30,
      why: habit.why || '',
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingHabit) {
      updateHabit(editingHabit.id, {
        name: formData.name.trim(),
        targetPerWeek: formData.type === 'weekly' ? formData.targetPerWeek : undefined,
        targetDuration: formData.type === 'timed' ? formData.targetDuration * 60 : undefined,
        why: formData.type === 'timed' ? formData.why.trim() : undefined,
      });
    } else {
      addHabit(formData.name.trim(), formData.type, {
        targetPerWeek: formData.targetPerWeek,
        targetDuration: formData.targetDuration * 60,
        why: formData.why.trim(),
      });
    }

    setIsModalVisible(false);
    resetForm();
  };

  const handleDelete = (habit: Habit) => {
    Alert.alert(
      'Delete Ritual',
      `Are you sure you want to delete "${habit.name}"? This will also delete all completion history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteHabit(habit.id);
          },
        },
      ]
    );
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const renderHabitItem = (habit: Habit) => (
    <View key={habit.id} style={styles.habitItem}>
      <TouchableOpacity
        style={styles.habitContent}
        onPress={() => openEditModal(habit)}
        activeOpacity={0.7}
      >
        <Text style={styles.habitName}>{habit.name}</Text>
        {habit.type === 'weekly' && habit.targetPerWeek && (
          <Text style={styles.habitMeta}>{habit.targetPerWeek}x per week</Text>
        )}
        {habit.type === 'timed' && habit.targetDuration && (
          <Text style={styles.habitMeta}>{formatDuration(habit.targetDuration / 60)}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(habit)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const getModalTitle = () => {
    if (editingHabit) return 'Edit Ritual';
    switch (formData.type) {
      case 'daily': return 'Add Daily Ritual';
      case 'timed': return 'Add Timed Ritual';
      case 'weekly': return 'Add Weekly Target';
      default: return 'Add Ritual';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Manage Rituals</Text>
        <Text style={styles.subtitle}>
          Define what you commit to. No excuses.
        </Text>

        {/* Daily Rituals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>DAILY CHECK-OFF</Text>
              <Text style={styles.sectionDesc}>Simple yes/no habits</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openAddModal('daily')}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {dailyHabits.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No daily rituals yet</Text>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {dailyHabits.map(renderHabitItem)}
            </View>
          )}
        </View>

        {/* Timed Rituals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>TIMED SESSIONS</Text>
              <Text style={styles.sectionDesc}>Track duration with a timer</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openAddModal('timed')}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {timedHabits.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No timed rituals yet</Text>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {timedHabits.map(renderHabitItem)}
            </View>
          )}
        </View>

        {/* Weekly Targets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>WEEKLY TARGETS</Text>
              <Text style={styles.sectionDesc}>Hit a target each week</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openAddModal('weekly')}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {weeklyHabits.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No weekly targets yet</Text>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {weeklyHabits.map(renderHabitItem)}
            </View>
          )}
        </View>

        {/* Power Phrases Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>POWER PHRASES</Text>
              <Text style={styles.sectionDesc}>Shown before timed sessions</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsPhraseModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.phrasesCard}>
            {settings.customPhrases.length === 0 ? (
              <Text style={styles.phrasesPlaceholder}>
                Using 15 default phrases. Add your own for a personal touch.
              </Text>
            ) : (
              <View style={styles.phrasesList}>
                {settings.customPhrases.map((phrase, index) => (
                  <View key={index} style={styles.phraseItem}>
                    <Text style={styles.phraseText}>{phrase.join(' ')}</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        const newPhrases = settings.customPhrases.filter((_, i) => i !== index);
                        updateSettings({ customPhrases: newPhrases });
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.phraseDelete}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
              <Text style={styles.sectionDesc}>Stay on track with reminders</Text>
            </View>
          </View>

          <View style={styles.notificationsCard}>
            {/* Enable Toggle */}
            <View style={styles.notificationRow}>
              <View style={styles.notificationRowContent}>
                <Text style={styles.notificationRowTitle}>Daily Reminders</Text>
                <Text style={styles.notificationRowDesc}>
                  Get reminded morning and evening
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={async (value) => {
                  if (value) {
                    const granted = await requestNotificationPermissions();
                    if (!granted) {
                      Alert.alert(
                        'Permission Required',
                        'Please enable notifications in your device settings to receive reminders.'
                      );
                      return;
                    }
                  }
                  updateSettings({ notificationsEnabled: value });
                  await setupNotifications(
                    value,
                    settings.morningReminderTime,
                    settings.eveningReminderTime
                  );
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: '#2C2C2E', true: 'rgba(255, 59, 48, 0.4)' }}
                thumbColor={settings.notificationsEnabled ? '#FF3B30' : '#5A5A5E'}
              />
            </View>

            {settings.notificationsEnabled && (
              <>
                {/* Morning Time */}
                <View style={styles.notificationRow}>
                  <View style={styles.notificationRowContent}>
                    <Text style={styles.notificationRowTitle}>🌅 Morning</Text>
                    <Text style={styles.notificationRowDesc}>
                      "Time to lock in"
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      Alert.prompt(
                        'Morning Reminder',
                        'Enter time (HH:MM in 24h format)',
                        async (text) => {
                          if (text && /^\d{1,2}:\d{2}$/.test(text)) {
                            updateSettings({ morningReminderTime: text });
                            await setupNotifications(true, text, settings.eveningReminderTime);
                          }
                        },
                        'plain-text',
                        settings.morningReminderTime
                      );
                    }}
                  >
                    <Text style={styles.timeButtonText}>{settings.morningReminderTime}</Text>
                  </TouchableOpacity>
                </View>

                {/* Evening Time */}
                <View style={styles.notificationRow}>
                  <View style={styles.notificationRowContent}>
                    <Text style={styles.notificationRowTitle}>🌙 Evening</Text>
                    <Text style={styles.notificationRowDesc}>
                      "Don't break the chain"
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      Alert.prompt(
                        'Evening Reminder',
                        'Enter time (HH:MM in 24h format)',
                        async (text) => {
                          if (text && /^\d{1,2}:\d{2}$/.test(text)) {
                            updateSettings({ eveningReminderTime: text });
                            await setupNotifications(true, settings.morningReminderTime, text);
                          }
                        },
                        'plain-text',
                        settings.eveningReminderTime
                      );
                    }}
                  >
                    <Text style={styles.timeButtonText}>{settings.eveningReminderTime}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Phrase Modal */}
      <Modal
        visible={isPhraseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhraseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Power Phrase</Text>
            <Text style={styles.whyDescription}>
              Enter a short motivational phrase. Each word will appear one at a time before timed sessions.
            </Text>
            <TextInput
              style={styles.input}
              value={newPhrase}
              onChangeText={setNewPhrase}
              placeholder="e.g., LOCK IN"
              placeholderTextColor="#5A5A5E"
              autoCapitalize="characters"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNewPhrase('');
                  setIsPhraseModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  if (newPhrase.trim()) {
                    const words = newPhrase.trim().toUpperCase().split(/\s+/);
                    updateSettings({ 
                      customPhrases: [...settings.customPhrases, words] 
                    });
                    setNewPhrase('');
                    setIsPhraseModalVisible(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>

            <Text style={styles.inputLabel}>NAME</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder={
                formData.type === 'timed' 
                  ? "e.g., Study Russian" 
                  : formData.type === 'weekly'
                    ? "e.g., Train BJJ"
                    : "e.g., Meditate"
              }
              placeholderTextColor="#5A5A5E"
              autoFocus={true}
              autoCapitalize="sentences"
            />

            {formData.type === 'timed' && (
              <>
                <Text style={styles.inputLabel}>TARGET DURATION</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.durationScroll}
                >
                  <View style={styles.durationSelector}>
                    {DURATION_OPTIONS.map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          styles.durationButton,
                          formData.targetDuration === mins ? styles.durationButtonActive : null,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, targetDuration: mins }))}
                      >
                        <Text
                          style={[
                            styles.durationButtonText,
                            formData.targetDuration === mins ? styles.durationButtonTextActive : null,
                          ]}
                        >
                          {formatDuration(mins)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.inputLabel}>YOUR WHY (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, styles.whyInput]}
                  value={formData.why}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, why: text }))}
                  placeholder="Why is this important to you?"
                  placeholderTextColor="#5A5A5E"
                  multiline={true}
                />
              </>
            )}

            {formData.type === 'weekly' && (
              <>
                <Text style={styles.inputLabel}>TIMES PER WEEK</Text>
                <View style={styles.targetSelector}>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.targetButton,
                        formData.targetPerWeek === num ? styles.targetButtonActive : null,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, targetPerWeek: num }))}
                    >
                      <Text
                        style={[
                          styles.targetButtonText,
                          formData.targetPerWeek === num ? styles.targetButtonTextActive : null,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editingHabit ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#5A5A5E',
    fontSize: 16,
    marginBottom: 32,
  },
  // Section
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  sectionDesc: {
    color: '#5A5A5E',
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Habits List
  habitsList: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  habitContent: {
    flex: 1,
  },
  habitName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  habitMeta: {
    color: '#5A5A5E',
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#5A5A5E',
    fontSize: 28,
  },
  // Empty
  emptySection: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderStyle: 'dashed',
    padding: 24,
  },
  emptyText: {
    color: '#5A5A5E',
    fontSize: 15,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#141416',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  whyDescription: {
    color: '#B0B0B5',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#5A5A5E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
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
    marginBottom: 24,
  },
  // Duration selector
  durationScroll: {
    marginBottom: 24,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  durationSelector: {
    flexDirection: 'row',
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1C1C1F',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginRight: 8,
  },
  durationButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#FF3B30',
  },
  durationButtonText: {
    color: '#8A8A8E',
    fontSize: 15,
    fontWeight: 'bold',
  },
  durationButtonTextActive: {
    color: '#FF3B30',
  },
  // Target selector (weekly)
  targetSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  targetButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1C1C1F',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  targetButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#FF3B30',
  },
  targetButtonText: {
    color: '#8A8A8E',
    fontSize: 17,
    fontWeight: 'bold',
  },
  targetButtonTextActive: {
    color: '#FF3B30',
  },
  // Modal buttons
  modalButtons: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#1C1C1F',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#8A8A8E',
    fontSize: 17,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Phrases
  phrasesCard: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 16,
  },
  phrasesPlaceholder: {
    color: '#8A8A8E',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 8,
  },
  phrasesList: {
    gap: 8,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  phraseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  phraseDelete: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: 'bold',
    paddingLeft: 12,
  },
  // Why input in habit modal
  whyInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  // Notifications
  notificationsCard: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  notificationRowContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationRowTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationRowDesc: {
    color: '#5A5A5E',
    fontSize: 13,
    marginTop: 2,
  },
  timeButton: {
    backgroundColor: '#1C1C1F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  timeButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
