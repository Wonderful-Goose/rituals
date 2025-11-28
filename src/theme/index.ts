import { StyleSheet } from 'react-native';

export const colors = {
  // Core
  background: '#0A0A0B',
  surface: '#141416',
  surfaceElevated: '#1C1C1F',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8A8E',
  textMuted: '#5A5A5E',
  
  // Accents
  accent: '#FF3B30', // Red - for hardcore feel
  accentMuted: '#FF3B3040',
  success: '#34C759',
  successMuted: '#34C75940',
  
  // UI
  border: '#2C2C2E',
  divider: '#1C1C1E',
  
  // Calendar heat map
  heat0: '#1C1C1F',    // No completion
  heat25: '#3D2020',   // 25%
  heat50: '#5C2525',   // 50%
  heat75: '#8B3030',   // 75%
  heat100: '#FF3B30',  // 100%
};

export const typography = {
  // Using system fonts with specific weights
  // Mono for numbers, sans for text
  fontFamily: {
    regular: 'System',
    mono: 'monospace',
  },
  
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 22,
    xxl: 28,
    hero: 48,
  },
  
  weights: {
    regular: 'normal' as const,
    medium: 'normal' as const,
    semibold: 'bold' as const,
    bold: 'bold' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    paddingHorizontal: spacing.md,
  },
});

