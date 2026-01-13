import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Intensity</Text>
      <View style={styles.optionsRow}>
        {INTENSITY_OPTIONS.map((option) => {
          const isSelected = selectedIntensity === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onIntensityChange(option.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon as any}
                size={22}
                color={isSelected ? '#4cbb17' : '#9ca3af'}
              />
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
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
    color: '#374151',
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
    backgroundColor: '#f9fafb',
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
    color: '#6b7280',
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
