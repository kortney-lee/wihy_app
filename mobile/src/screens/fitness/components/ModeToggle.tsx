import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '../../../components/shared';
import { useTheme } from '../../../context/ThemeContext';

export type WorkoutMode = 'quick' | 'routine' | 'train';

interface ModeToggleProps {
  selectedMode: WorkoutMode;
  onModeChange: (mode: WorkoutMode) => void;
}

const modes: { id: WorkoutMode; label: string; icon: string }[] = [
  { id: 'quick', label: 'Quick', icon: 'flash-outline' },
  { id: 'routine', label: 'Routine', icon: 'repeat-outline' },
  { id: 'train', label: 'Train / Sports', icon: 'trophy-outline' },
];

export const ModeToggle: React.FC<ModeToggleProps> = ({ selectedMode, onModeChange }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {modes.map((mode) => {
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
              size={18}
              color={isSelected ? '#ffffff' : theme.colors.textSecondary}
            />
            <Text style={[styles.modeText, !isSelected && { color: theme.colors.textSecondary }, isSelected && styles.modeTextSelected]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // backgroundColor: '#f3f4f6', // theme.colors.surface // theme.colors.surface // Use theme.colors.background
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonSelected: {
    backgroundColor: '#4cbb17',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeTextSelected: {
    color: '#ffffff',
  },
});
