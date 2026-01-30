/**
 * CookingLevelSelector - Cooking Skill Level Selector
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
import type { CookingSkillLevel } from '../../../services/mealService';

interface CookingLevelSelectorProps {
  selectedLevel: CookingSkillLevel;
  onLevelChange: (level: CookingSkillLevel) => void;
  title?: string;
}

const LEVEL_OPTIONS: Array<{
  id: CookingSkillLevel;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: 'beginner', label: 'Beginner', icon: 'leaf-outline', description: 'Simple recipes, minimal steps' },
  { id: 'intermediate', label: 'Intermediate', icon: 'flame-outline', description: 'Some technique required' },
  { id: 'advanced', label: 'Advanced', icon: 'star-outline', description: 'Complex, chef-level recipes' },
];

export const CookingLevelSelector: React.FC<CookingLevelSelectorProps> = ({
  selectedLevel,
  onLevelChange,
  title = 'Cooking Level',
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.optionsRow}>
        {LEVEL_OPTIONS.map((option) => {
          const isSelected = selectedLevel === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, !isSelected && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, isSelected && styles.optionSelected]}
              onPress={() => onLevelChange(option.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={isSelected ? '#4cbb17' : theme.colors.textSecondary}
              />
              <Text style={[styles.optionLabel, !isSelected && { color: theme.colors.text }, isSelected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              <Text style={[styles.optionDescription, !isSelected && { color: theme.colors.textSecondary }, isSelected && styles.optionDescriptionSelected]}>
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
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    // backgroundColor: '#f9fafb', // theme.colors.surface
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  optionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#166534',
  },
  optionDescription: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
  },
  optionDescriptionSelected: {
    color: '#166534',
  },
});

export default CookingLevelSelector;
