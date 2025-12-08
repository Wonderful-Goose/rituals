import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { TimerEndSound } from '../types';

let bellSound: Audio.Sound | null = null;

// Load the bell sound (call this once when app starts or when needed)
export async function loadBellSound(): Promise<void> {
  try {
    if (bellSound) {
      await bellSound.unloadAsync();
    }
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/bell.mp3'),
      { shouldPlay: false }
    );
    bellSound = sound;
  } catch (error) {
    console.warn('Could not load bell sound:', error);
  }
}

// Play the bell sound
export async function playBellSound(): Promise<void> {
  try {
    if (!bellSound) {
      await loadBellSound();
    }
    if (bellSound) {
      await bellSound.setPositionAsync(0);
      await bellSound.playAsync();
    }
  } catch (error) {
    console.warn('Could not play bell sound:', error);
  }
}

// Play timer end feedback based on user setting
export async function playTimerEndFeedback(setting: TimerEndSound): Promise<void> {
  switch (setting) {
    case 'vibration':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'bell':
      await playBellSound();
      break;
    case 'both':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await playBellSound();
      break;
  }
}

// Cleanup sound resources
export async function unloadBellSound(): Promise<void> {
  if (bellSound) {
    await bellSound.unloadAsync();
    bellSound = null;
  }
}

