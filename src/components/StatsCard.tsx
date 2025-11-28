import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  accent?: boolean;
}

export function StatsCard({ label, value, subValue, accent }: StatsCardProps) {
  return (
    <View style={[styles.container, accent ? styles.containerAccent : null]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent ? styles.valueAccent : null]}>
        {value}
      </Text>
      {subValue && (
        <Text style={styles.subValue}>{subValue}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: 100,
    marginHorizontal: spacing.xs,
  },
  containerAccent: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily.mono,
  },
  valueAccent: {
    color: colors.accent,
  },
  subValue: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});

