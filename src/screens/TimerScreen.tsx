import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as NavigationBar from 'expo-navigation-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;
const STROKE_WIDTH = 10;

interface TimerScreenProps {
  onClose: () => void;
}

// Progress Ring Component
function ProgressRing({ progress, size, strokeWidth }: { progress: number; size: number; strokeWidth: number }) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // For the progress arc, we use two half circles
  // First half: 0-50% (right side, rotating from top)
  // Second half: 50-100% (left side)
  
  const firstHalfProgress = Math.min(clampedProgress * 2, 1); // 0 to 1 for first 50%
  const secondHalfProgress = Math.max((clampedProgress - 0.5) * 2, 0); // 0 to 1 for second 50%
  
  const firstHalfRotation = firstHalfProgress * 180; // 0 to 180 degrees
  const secondHalfRotation = secondHalfProgress * 180; // 0 to 180 degrees
  
  return (
    <View style={{ width: size, height: size }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderRadius: (size - strokeWidth) / 2,
          borderWidth: strokeWidth,
          borderColor: '#1C1C1F',
          left: strokeWidth / 2,
          top: strokeWidth / 2,
        }}
      />
      
      {/* First half (right side) - rotates from 0 to 180 */}
      <View
        style={{
          position: 'absolute',
          width: size / 2,
          height: size,
          left: size / 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#FF3B30',
            borderLeftColor: 'transparent',
            borderBottomColor: 'transparent',
            position: 'absolute',
            right: 0,
            transform: [
              { rotate: `${-135 + firstHalfRotation}deg` }
            ],
          }}
        />
      </View>
      
      {/* Second half (left side) - only shows after 50% */}
      {clampedProgress > 0.5 && (
        <View
          style={{
            position: 'absolute',
            width: size / 2,
            height: size,
            left: 0,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: '#FF3B30',
              borderRightColor: 'transparent',
              borderTopColor: 'transparent',
              position: 'absolute',
              left: 0,
              transform: [
                { rotate: `${-135 + secondHalfRotation}deg` }
              ],
            }}
          />
        </View>
      )}
    </View>
  );
}

export function TimerScreen({ onClose }: TimerScreenProps) {
  const { 
    timerState, 
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    completeTimer 
  } = useApp();

  const { habitName, targetDuration, elapsedTime, isRunning, isPaused } = timerState;

  // Keep screen awake while timer is active
  useKeepAwake();

  // Focus mode: track when user leaves and returns
  const [awayTime, setAwayTime] = useState(0);
  const [showAwayWarning, setShowAwayWarning] = useState(false);
  const leftAtRef = useRef<number | null>(null);
  const totalAwayRef = useRef(0);

  // Track app state for focus mode
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // User left the app - record the time
        leftAtRef.current = Date.now();
      } else if (nextState === 'active' && leftAtRef.current && !isPaused) {
        // User returned while timer was running
        const awayDuration = Math.floor((Date.now() - leftAtRef.current) / 1000);
        if (awayDuration >= 3) { // Only count if away for 3+ seconds
          totalAwayRef.current += awayDuration;
          setAwayTime(totalAwayRef.current);
          setShowAwayWarning(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          // Hide warning after 3 seconds
          setTimeout(() => setShowAwayWarning(false), 3000);
        }
        leftAtRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isPaused]);

  // Ensure navigation bar stays dark on this screen
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#0A0A0B');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);
  
  const remainingTime = Math.max(0, targetDuration - elapsedTime);
  const progress = targetDuration > 0 ? Math.min(elapsedTime / targetDuration, 1) : 0;
  const isComplete = elapsedTime >= targetDuration;
  const isOvertime = elapsedTime > targetDuration;

  // Haptic feedback when timer completes
  useEffect(() => {
    if (isComplete && elapsedTime === targetDuration) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isComplete, elapsedTime, targetDuration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopTimer();
    onClose();
  };

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeTimer();
    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleStop} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.habitName}>{habitName}</Text>
        
        {/* Progress Ring */}
        <View style={styles.timerContainer}>
          <ProgressRing 
            progress={progress} 
            size={CIRCLE_SIZE} 
            strokeWidth={STROKE_WIDTH} 
          />
          
          {/* Center content */}
          <View style={styles.timerContent}>
            <Text style={[
              styles.timerText,
              isComplete ? styles.timerTextComplete : null,
              isOvertime ? styles.timerTextOvertime : null,
            ]}>
              {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsedTime - targetDuration : remainingTime)}
            </Text>
            <Text style={styles.timerLabel}>
              {isOvertime ? 'OVERTIME' : isComplete ? 'COMPLETE' : isPaused ? 'PAUSED' : 'REMAINING'}
            </Text>
          </View>
        </View>

        {/* Focus break warning */}
        {showAwayWarning && (
          <View style={styles.awayWarning}>
            <Text style={styles.awayWarningText}>Focus broken. Stay present.</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.statLabel}>Elapsed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(targetDuration)}</Text>
            <Text style={styles.statLabel}>Target</Text>
          </View>
          {awayTime > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValueWarning}>{formatTime(awayTime)}</Text>
                <Text style={styles.statLabel}>Distracted</Text>
              </View>
            </>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isComplete ? (
            <>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handleStop}
              >
                <Text style={styles.secondaryButtonText}>Save & Exit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.primaryButton, isPaused ? styles.primaryButtonResume : null]} 
                onPress={handlePauseResume}
              >
                <Text style={styles.primaryButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handlePauseResume}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPaused ? 'Continue' : 'Pause'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.completeButton} 
                onPress={handleComplete}
              >
                <Text style={styles.completeButtonText}>Done ✓</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Motivational text */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isComplete 
            ? "Target reached! Keep going or mark complete."
            : isPaused 
              ? "Progress saved. Resume when you're ready."
              : "Stay focused. You're building who you want to be."
          }
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#5A5A5E',
    fontSize: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  habitName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerTextComplete: {
    color: '#34C759',
  },
  timerTextOvertime: {
    color: '#FF9500',
  },
  timerLabel: {
    color: '#5A5A5E',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statValue: {
    color: '#8A8A8E',
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#5A5A5E',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2C2C2E',
  },
  statValueWarning: {
    color: '#FF9500',
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  awayWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  awayWarningText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  primaryButtonResume: {
    backgroundColor: '#34C759',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1C1C1F',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginRight: 10,
  },
  secondaryButtonText: {
    color: '#8A8A8E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  footerText: {
    color: '#5A5A5E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
