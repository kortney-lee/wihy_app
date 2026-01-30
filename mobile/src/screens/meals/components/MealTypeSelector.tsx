/**
 * MealTypeSelector - Select which meals to include per day
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

interface MealTypeSelectorProps {
  selectedMealTypes: Record<string, boolean>;
  onMealTypesChange: (mealTypes: Record<string, boolean>) => void;
  title?: string;
}

const MEAL_TYPE_OPTIONS = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { id: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { id: 'snack', label: 'Snacks', icon: 'cafe-outline' },
];

export const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({
  selectedMealTypes,
  onMealTypesChange,
  title = 'Meals Per Day',
}) => {
  const { theme } = useTheme();
  const toggleMealType = (mealType: string) => {
    onMealTypesChange({
      ...selectedMealTypes,
      [mealType]: !selectedMealTypes[mealType],
    });
  };

  // Count selected meals
  const selectedCount = Object.values(selectedMealTypes).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={styles.countBadge}>{selectedCount} selected</Text>
      </View>
      <View style={styles.optionsRow}>
        {MEAL_TYPE_OPTIONS.map((option) => {
          const isSelected = selectedMealTypes[option.id];
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, !isSelected && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, isSelected && styles.optionSelected]}
              onPress={() => toggleMealType(option.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={isSelected ? '#4cbb17' : theme.colors.textSecondary}
              />
              <Text style={[styles.optionLabel, !isSelected && { color: theme.colors.textSecondary }, isSelected && styles.optionLabelSelected]}>
                {option.label}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  countBadge: {
    fontSize: 12,
    color: '#4cbb17',
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    // backgroundColor: '#f9fafb', // theme.colors.surface
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  optionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  optionLabelSelected: {
    color: '#166534',
    fontWeight: '600',
  },
});

export default MealTypeSelector;
