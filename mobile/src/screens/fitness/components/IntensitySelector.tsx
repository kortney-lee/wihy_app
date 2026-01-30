import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '../../../components/shared';
import { useTheme } from '../../../context/ThemeContext';
import type { WorkoutMode } from './ModeToggle';

interface IntensitySelectorProps {
  mode: WorkoutMode;
  selectedIntensity: 'light' | 'moderate' | 'intense';
  onIntensityChange: (intensity: 'light' | 'moderate' | 'intense') => void;
}

const INTENSITY_OPTIONS: { id: 'light' | 'moderate' | 'intense'; label: string; icon: string; description: string }[] = [
  { id: 'light', label: 'Light', icon: 'leaf-outline', description: 'Easy pace' },
  { id: 'moderate', label: 'Moderate', icon: 'flame-outline', description: 'Steady effort' },
  { id: 'intense', label: 'Intense', icon: 'flash-outline', description: 'Push limits' },
];

export const IntensitySelector: React.FC<IntensitySelectorProps> = ({
  mode,
  selectedIntensity,
  onIntensityChange,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Intensity</Text>
      <View style={styles.optionsRow}>
        {INTENSITY_OPTIONS.map((option) => {
          const isSelected = selectedIntensity === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, !isSelected && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, isSelected && styles.optionSelected]}
              onPress={() => onIntensityChange(option.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon as any}
                size={22}
                color={isSelected ? '#4cbb17' : theme.colors.textSecondary}
              />
              <Text style={[styles.optionLabel, !isSelected && { color: theme.colors.textSecondary }, isSelected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.text
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 4,
  },
  optionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  optionLabelSelected: {
    color: '#166534',
  },
  optionDescription: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
