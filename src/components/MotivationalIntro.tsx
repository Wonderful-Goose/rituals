import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get('window');

interface MotivationalIntroProps {
  habitName: string;
  duration: number; // in seconds
  onComplete: () => void;
  onCancel: () => void;
  customPhrases?: string[][];
  selectedPhraseIndex?: number | null;
  why?: string;
}

export const DEFAULT_PHRASES: string[][] = [
  ['LOCK', 'IN'],
  ['NO', 'EXCUSES'],
  ['DO', 'THE', 'WORK'],
  ['BECOME', 'WHO', 'YOU', 'WANT', 'TO', 'BE'],
  ['TIME', 'TO', 'FOCUS'],
  ['DISCIPLINE', 'EQUALS', 'FREEDOM'],
  ['ONE', 'REP', 'AT', 'A', 'TIME'],
  ['THE', 'WORK', 'IS', 'THE', 'WAY'],
  ['EMBRACE', 'THE', 'GRIND'],
  ['EARN', 'IT'],
  ['STAY', 'HARD'],
  ['YOU', 'VS', 'YOU'],
  ['MAKE', 'IT', 'HAPPEN'],
  ['NO', 'ZERO', 'DAYS'],
  ['TRUST', 'THE', 'PROCESS'],
];

export function MotivationalIntro({ 
  habitName, 
  duration, 
  onComplete, 
  onCancel,
  customPhrases = [],
  selectedPhraseIndex = null,
  why = '',
}: MotivationalIntroProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showHabitInfo, setShowHabitInfo] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const habitOpacity = useRef(new Animated.Value(0)).current;

  // Ensure navigation bar stays dark on this screen
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#0A0A0B');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);
  
  // Use custom phrases if any exist, otherwise use defaults
  const phrasesToUse = customPhrases.length > 0 ? customPhrases : DEFAULT_PHRASES;
  
  // Pick phrase based on selection or random
  const [phrase] = useState(() => {
    if (selectedPhraseIndex !== null && selectedPhraseIndex < phrasesToUse.length) {
      return phrasesToUse[selectedPhraseIndex];
    }
    return phrasesToUse[Math.floor(Math.random() * phrasesToUse.length)];
  });
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} MIN`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}H ${remainingMins}M` : `${hours} HOUR${hours > 1 ? 'S' : ''}`;
  };

  useEffect(() => {
    if (introDone) return;
    
    if (currentWordIndex < phrase.length) {
      // Show current word
      opacity.setValue(0);
      scale.setValue(0.8);
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Move to next word - longer delay for better readability
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setCurrentWordIndex(prev => prev + 1);
        });
      }, 600); // Increased from 400 to 600ms
      
      return () => clearTimeout(timer);
    } else if (!showHabitInfo) {
      // Show habit info after phrase
      setShowHabitInfo(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.timing(habitOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentWordIndex, showHabitInfo, introDone, phrase, opacity, scale, habitOpacity]);

  const handleGo = () => {
    if (!introDone) {
      setIntroDone(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onComplete();
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <View style={styles.container}>
      {/* Cancel button */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>✕</Text>
      </TouchableOpacity>

      {!showHabitInfo ? (
        <Animated.Text 
          style={[
            styles.word,
            {
              opacity,
              transform: [{ scale }],
            }
          ]}
        >
          {phrase[currentWordIndex]}
        </Animated.Text>
      ) : (
        <Animated.View style={[styles.habitInfo, { opacity: habitOpacity }]}>
          <Text style={styles.habitName}>{habitName.toUpperCase()}</Text>
          <Text style={styles.habitDuration}>{formatDuration(duration)}</Text>
          
          {why ? (
            <View style={styles.whyContainer}>
              <Text style={styles.whyLabel}>YOUR WHY</Text>
              <Text style={styles.whyText}>"{why}"</Text>
            </View>
          ) : null}
          
          <TouchableOpacity style={styles.goContainer} onPress={handleGo} activeOpacity={0.8}>
            <Text style={styles.goText}>GO</Text>
          </TouchableOpacity>
          <Text style={styles.tapHint}>Tap to start</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cancelButtonText: {
    color: '#5A5A5E',
    fontSize: 24,
  },
  word: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
  },
  habitInfo: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  habitName: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  habitDuration: {
    color: '#5A5A5E',
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  whyContainer: {
    backgroundColor: '#141416',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    width: '100%',
  },
  whyLabel: {
    color: '#5A5A5E',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  whyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  goContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tapHint: {
    color: '#5A5A5E',
    fontSize: 14,
    marginTop: 20,
  },
});
