import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '../../../components/shared';
import type { WorkoutMode } from './ModeToggle';

interface DurationSelectorProps {
  mode: WorkoutMode;
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
}

const DURATION_OPTIONS = [15, 30, 45, 60];

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  mode,
  selectedDuration,
  onDurationChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={20} color="#4cbb17" />
        <View style={styles.headerText}>
          <Text style={styles.title}>Duration</Text>
          <Text style={styles.subtitle}>Per session</Text>
        </View>
      </View>
      <View style={styles.optionsRow}>
        {DURATION_OPTIONS.map((mins) => {
          const isSelected = selectedDuration === mins;
          return (
            <TouchableOpacity
              key={mins}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onDurationChange(mins)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {mins} min
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
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
});
