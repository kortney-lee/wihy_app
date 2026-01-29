/**
 * DurationSelector - Meal Plan Duration Selector
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

type MealMode = 'quick' | 'plan' | 'diet' | 'saved';

interface DurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  title?: string;
  mode?: MealMode; // Mode determines which day options to show
}

// Quick mode: 1-5 days (fast meal generation)
const QUICK_DURATION_OPTIONS = [
  { value: 1, label: '1 Day', description: 'Tonight only' },
  { value: 3, label: '3 Days', description: 'Weekend' },
  { value: 5, label: '5 Days', description: 'Work week' },
];

// Plan mode: 7-30 days (full meal planning)
const PLAN_DURATION_OPTIONS = [
  { value: 7, label: '1 Week', description: 'Most popular' },
  { value: 14, label: '2 Weeks', description: 'Build habits' },
  { value: 30, label: '30 Days', description: 'Full program' },
];

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationChange,
  title = 'Plan Duration',
  mode = 'plan', // Default to plan mode
}) => {
  const { theme } = useTheme();
  // Saved mode doesn't need duration selector
  if (mode === 'saved') {
    return null;
  }
  
  // Choose options based on mode
  const durationOptions = mode === 'quick' ? QUICK_DURATION_OPTIONS : PLAN_DURATION_OPTIONS;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.optionsGrid}>
        {durationOptions.map((option) => {
          const isSelected = selectedDuration === option.value;
          const isPopular = option.value === 7 && mode === 'plan';
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onDurationChange(option.value)}
              activeOpacity={0.7}
            >
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                {option.description}
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
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    // backgroundColor: '#f9fafb', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  optionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionLabelSelected: {
    color: '#166534',
  },
  optionDescription: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  optionDescriptionSelected: {
    color: '#166534',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#4cbb17',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default DurationSelector;
