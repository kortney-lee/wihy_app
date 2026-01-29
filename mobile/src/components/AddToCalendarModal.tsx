import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import SvgIcon from './shared/SvgIcon';
import { useTheme } from '../context/ThemeContext';

interface AddToCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (date: string, mealType: string) => void;
  mealName: string;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', icon: '☀️' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'snack', label: 'Snack', icon: '🍎' },
];

export function AddToCalendarModal({
  visible,
  onClose,
  onSchedule,
  mealName,
}: AddToCalendarModalProps) {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMealType, setSelectedMealType] = useState<string>('dinner');

  const handleSchedule = () => {
    onSchedule(selectedDate, selectedMealType);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add to Calendar</Text>
            <TouchableOpacity onPress={onClose}>
              <SvgIcon name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text style={styles.mealName}>{mealName}</Text>

          {/* Simple Date Picker */}
          <View style={styles.datePickerContainer}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.dateOptionsContainer}>
              {[0, 1, 2, 3, 4, 5, 6].map((daysAhead) => {
                const date = new Date();
                date.setDate(date.getDate() + daysAhead);
                const dateStr = date.toISOString().split('T')[0];
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNumber = date.getDate();
                const isSelected = selectedDate === dateStr;
                
                return (
                  <TouchableOpacity
                    key={daysAhead}
                    style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                    onPress={() => setSelectedDate(dateStr)}
                  >
                    <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                      {dayName}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                      {dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Meal Type Selection */}
          <Text style={styles.sectionTitle}>Meal Type</Text>
          <View style={styles.mealTypes}>
            {MEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.mealTypeButton,
                  selectedMealType === type.id && styles.mealTypeActive,
                ]}
                onPress={() => setSelectedMealType(type.id)}
              >
                <Text style={styles.mealTypeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.mealTypeLabel,
                    selectedMealType === type.id && styles.mealTypeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleSchedule}>
            <SvgIcon name="calendar" size={20} color="white" />
            <Text style={styles.confirmText}>Add to {selectedDate}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  mealName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
  },
  mealTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    // // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
  },
  mealTypeActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  mealTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  mealTypeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealTypeLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  dateOptionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    // // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    borderRadius: 12,
  },
  dateOptionSelected: {
    backgroundColor: '#3b82f6',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#ffffff',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dayNumberSelected: {
    color: '#ffffff',
  },
});
