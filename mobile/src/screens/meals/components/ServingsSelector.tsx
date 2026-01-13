/**
 * ServingsSelector - Family Size / Servings Selector
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ServingsSelectorProps {
  selectedServings: number;
  onServingsChange: (servings: number) => void;
  title?: string;
}

const SERVING_OPTIONS = [
  { value: 1, label: '1', description: 'Solo' },
  { value: 2, label: '2', description: 'Couple' },
  { value: 4, label: '4', description: 'Family' },
  { value: 6, label: '6', description: 'Large' },
];

export const ServingsSelector: React.FC<ServingsSelectorProps> = ({
  selectedServings,
  onServingsChange,
  title = 'Servings',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.optionsRow}>
        {SERVING_OPTIONS.map((option) => {
          const isSelected = selectedServings === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onServingsChange(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionValue, isSelected && styles.optionValueSelected]}>
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
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  optionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  optionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  optionValueSelected: {
    color: '#166534',
  },
  optionDescription: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  optionDescriptionSelected: {
    color: '#166534',
  },
});

export default ServingsSelector;
