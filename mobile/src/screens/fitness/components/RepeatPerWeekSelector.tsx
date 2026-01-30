import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '../../../components/shared';
import { useTheme } from '../../../context/ThemeContext';
import type { WorkoutMode } from './ModeToggle';

interface RepeatPerWeekSelectorProps {
  mode: WorkoutMode;
  selectedDays: number;
  onDaysChange: (days: number) => void;
}

const REPEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export const RepeatPerWeekSelector: React.FC<RepeatPerWeekSelectorProps> = ({
  mode,
  selectedDays,
  onDaysChange,
}) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Repeat Per Week</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Adjusts intensity & volume</Text>
        </View>
      </View>
      <View style={styles.optionsRow}>
        {REPEAT_OPTIONS.map((days) => {
          const isSelected = selectedDays === days;
          return (
            <TouchableOpacity
              key={days}
              style={[styles.option, !isSelected && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, isSelected && styles.optionSelected]}
              onPress={() => onDaysChange(days)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, !isSelected && { color: theme.colors.textSecondary }, isSelected && styles.optionTextSelected]}>
                {days}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
        {selectedDays <= 2 ? 'Light schedule' : selectedDays <= 4 ? 'Balanced routine' : 'Intensive training'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  subtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    // backgroundColor: '#ffffff', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#4cbb17',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#166534',
  },
  hint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
