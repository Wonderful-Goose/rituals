import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }
  
  // On Android, we need to set up a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-ritual', {
      name: 'Daily Ritual Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3B30',
    });
  }
  
  return true;
}

// Schedule morning reminder
export async function scheduleMorningReminder(hour: number, minute: number): Promise<string | null> {
  try {
    // Cancel existing morning reminders
    await cancelNotificationsByTag('morning');
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Time to lock in',
        body: 'Your rituals are waiting. Start strong today.',
        data: { type: 'morning', tag: 'morning' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling morning reminder:', error);
    return null;
  }
}

// Schedule evening reminder
export async function scheduleEveningReminder(hour: number, minute: number): Promise<string | null> {
  try {
    // Cancel existing evening reminders
    await cancelNotificationsByTag('evening');
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Day almost over',
        body: 'Check your progress. Don\'t break the chain.',
        data: { type: 'evening', tag: 'evening' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling evening reminder:', error);
    return null;
  }
}

// Schedule streak alert (afternoon reminder to check streaks)
export async function scheduleStreakAlert(hour: number, minute: number): Promise<string | null> {
  try {
    await cancelNotificationsByTag('streak-alert');
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Check your streaks',
        body: 'Don\'t let them break. You\'ve worked hard.',
        data: { type: 'streak-alert', tag: 'streak-alert' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling streak alert:', error);
    return null;
  }
}

// Schedule incomplete reminder (evening nudge if not done)
export async function scheduleIncompleteReminder(hour: number, minute: number): Promise<string | null> {
  try {
    await cancelNotificationsByTag('incomplete');
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Rituals incomplete',
        body: 'The day isn\'t over yet. Finish what you started.',
        data: { type: 'incomplete', tag: 'incomplete' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling incomplete reminder:', error);
    return null;
  }
}

// Send completion celebration (immediate)
export async function sendCompletionCelebration(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✓ All rituals complete',
        body: 'You did what you said you would. This is who you\'re becoming.',
        data: { type: 'celebration' },
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('Error sending completion celebration:', error);
  }
}

// Cancel notifications by tag
async function cancelNotificationsByTag(tag: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.content.data?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Send an immediate notification (for testing or urgent alerts)
export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null, // null means immediately
  });
}

// Parse time string "HH:mm" to hour and minute
export function parseTimeString(time: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = time.split(':');
  return {
    hour: parseInt(hourStr, 10),
    minute: parseInt(minuteStr, 10),
  };
}

// Setup all notifications based on settings
export async function setupNotifications(
  enabled: boolean,
  morningTime: string,
  eveningTime: string,
  options?: {
    streakAlertEnabled?: boolean;
    streakAlertTime?: string;
    incompleteReminderEnabled?: boolean;
    incompleteReminderTime?: string;
  }
): Promise<void> {
  if (!enabled) {
    await cancelAllNotifications();
    return;
  }
  
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return;
  }
  
  const morning = parseTimeString(morningTime);
  const evening = parseTimeString(eveningTime);
  
  await scheduleMorningReminder(morning.hour, morning.minute);
  await scheduleEveningReminder(evening.hour, evening.minute);
  
  // Additional notifications
  if (options?.streakAlertEnabled && options?.streakAlertTime) {
    const streakTime = parseTimeString(options.streakAlertTime);
    await scheduleStreakAlert(streakTime.hour, streakTime.minute);
  } else {
    await cancelNotificationsByTag('streak-alert');
  }
  
  if (options?.incompleteReminderEnabled && options?.incompleteReminderTime) {
    const incompleteTime = parseTimeString(options.incompleteReminderTime);
    await scheduleIncompleteReminder(incompleteTime.hour, incompleteTime.minute);
  } else {
    await cancelNotificationsByTag('incomplete');
  }
}

// Export cancel function for external use
export async function cancelNotificationByTag(tag: string): Promise<void> {
  await cancelNotificationsByTag(tag);
}

