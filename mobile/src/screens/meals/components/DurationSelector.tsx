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

interface DurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  title?: string;
}

const DURATION_OPTIONS = [
  { value: 3, label: '3 Days', description: 'Try it out' },
  { value: 7, label: '1 Week', description: 'Most popular' },
  { value: 14, label: '2 Weeks', description: 'Build habits' },
  { value: 30, label: '30 Days', description: 'Full program' },
];

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationChange,
  title = 'Plan Duration',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.optionsGrid}>
        {DURATION_OPTIONS.map((option) => {
          const isSelected = selectedDuration === option.value;
          const isPopular = option.value === 7;
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
    backgroundColor: '#f9fafb',
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
