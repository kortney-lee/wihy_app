/**
 * ModeToggle - Meal Planning Mode Selector
 * 
 * 4-Mode Architecture:
 * - Quick: Single meal generation
 * - Plan: Multi-day meal planning
 * - Diet: Goal-specific programs (weight loss, muscle gain, etc.)
 * - Saved: Recent meals for quick reordering
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '../../../components/shared';
import { useTheme } from '../../../context/ThemeContext';

export type MealMode = 'quick' | 'plan' | 'diet' | 'saved';

interface ModeToggleProps {
  selectedMode: MealMode;
  onModeChange: (mode: MealMode) => void;
}

const MODES = [
  { id: 'quick' as MealMode, label: 'Quick', icon: 'flash-outline', description: 'Single meal' },
  { id: 'plan' as MealMode, label: 'Plan', icon: 'calendar-outline', description: 'Weekly plan' },
  { id: 'saved' as MealMode, label: 'Saved', icon: 'bookmark-outline', description: 'Reorder' },
  { id: 'diet' as MealMode, label: 'Diet', icon: 'trophy-outline', description: 'Goal program' },
];

export const ModeToggle: React.FC<ModeToggleProps> = ({
  selectedMode,
  onModeChange,
}) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.toggleRow}>
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeButton, !isSelected && { backgroundColor: theme.colors.card }, isSelected && styles.modeButtonSelected]}
              onPress={() => onModeChange(mode.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={mode.icon as any}
                size={20}
                color={isSelected ? '#ffffff' : theme.colors.textSecondary}
              />
              <Text style={[styles.modeLabel, !isSelected && { color: theme.colors.textSecondary }, isSelected && styles.modeLabelSelected]}>
                {mode.label}
              </Text>
              <Text style={[styles.modeDescription, !isSelected && { color: theme.colors.textSecondary }, isSelected && styles.modeDescriptionSelected]}>
                {mode.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  modeButtonSelected: {
    backgroundColor: '#4cbb17',
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  modeLabelSelected: {
    color: '#ffffff',
  },
  modeDescription: {
    fontSize: 10,
    color: '#9ca3af',
  },
  modeDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ModeToggle;
