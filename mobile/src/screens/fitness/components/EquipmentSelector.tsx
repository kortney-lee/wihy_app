import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutMode } from './ModeToggle';
import { EQUIPMENT_OPTIONS } from '../constants';

interface EquipmentSelectorProps {
  mode: WorkoutMode;
  selectedEquipment: string[];
  onEquipmentToggle: (equipmentId: string) => void;
  variant?: 'simple' | 'gate';
  onGateSelect?: (gate: 'bodyweight' | 'gym') => void;
  selectedGate?: 'bodyweight' | 'gym' | null;
  selectedGymEquipment?: string[];
  onGymEquipmentChange?: (equipment: string[]) => void;
}

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  cardio: 'Cardio',
  free_weights: 'Free Weights',
  strength_machines: 'Strength Machines',
  functional: 'Functional',
  recovery: 'Recovery',
};

// Gate options for Routine mode
const GATE_OPTIONS = [
  { id: 'bodyweight', label: 'Bodyweight', icon: 'body-outline', description: 'No equipment needed' },
  { id: 'gym', label: 'Gym', icon: 'barbell-outline', description: 'Full equipment access' },
];

// Gym equipment presets
const GYM_PRESETS = [
  { id: 'full_gym', label: 'Full Gym', icon: 'fitness-outline', description: 'All equipment available' },
  { id: 'basic', label: 'Basic', icon: 'barbell-outline', description: 'Dumbbells, barbells, bench' },
  { id: 'custom', label: 'Custom', icon: 'options-outline', description: 'Select specific equipment' },
];

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  mode,
  selectedEquipment,
  onEquipmentToggle,
  variant = 'simple',
  onGateSelect,
  selectedGate,
  selectedGymEquipment = [],
  onGymEquipmentChange,
}) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [gymPreset, setGymPreset] = useState<'full_gym' | 'basic' | 'custom'>('full_gym');

  // Check if any equipment is selected (excluding 'none')
  const hasEquipmentSelected = selectedEquipment.some(id => id !== 'none');
  const isNoEquipment = selectedEquipment.includes('none') || selectedEquipment.length === 0;

  // Handle "No Equipment" selection
  const handleNoEquipment = () => {
    // Clear all equipment and set none
    selectedEquipment.forEach(id => {
      if (id !== 'none') onEquipmentToggle(id);
    });
    if (!selectedEquipment.includes('none')) {
      onEquipmentToggle('none');
    }
    setShowLibrary(false);
  };

  // Handle "Equipment" selection - toggle library visibility
  const handleEquipmentClick = () => {
    // Remove 'none' if present
    if (selectedEquipment.includes('none')) {
      onEquipmentToggle('none');
    }
    setShowLibrary(!showLibrary);
  };

  // Group equipment by category
  const equipmentByCategory = EQUIPMENT_OPTIONS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof EQUIPMENT_OPTIONS>);

  // Gate variant for Routine mode
  if (variant === 'gate' && onGateSelect) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Equipment Access</Text>
        <View style={styles.gateRow}>
          {GATE_OPTIONS.map((option) => {
            const isSelected = selectedGate === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.gateOption, isSelected && styles.gateOptionSelected]}
                onPress={() => onGateSelect(option.id as 'bodyweight' | 'gym')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon as any}
                  size={28}
                  color={isSelected ? '#4cbb17' : '#9ca3af'}
                />
                <Text style={[styles.gateLabel, isSelected && styles.gateLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.gateDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Gym Equipment Selection - shown when Gym is selected */}
        {selectedGate === 'gym' && onGymEquipmentChange && (
          <View style={styles.gymPresetsContainer}>
            <Text style={styles.gymPresetsTitle}>Gym Equipment</Text>
            <View style={styles.gymPresetsRow}>
              {GYM_PRESETS.map((preset) => {
                const isSelected = gymPreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.gymPresetOption, isSelected && styles.gymPresetOptionSelected]}
                    onPress={() => {
                      setGymPreset(preset.id as any);
                      if (preset.id === 'full_gym') {
                        // Full gym - use API preset
                        onGymEquipmentChange(['full_gym']);
                        setShowLibrary(false);
                      } else if (preset.id === 'basic') {
                        // Basic - use specific equipment array
                        onGymEquipmentChange(['dumbbells', 'barbell', 'bench', 'pull_up_bar', 'cable_machine']);
                        setShowLibrary(false);
                      } else {
                        // Custom - show library for manual selection
                        setShowLibrary(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={preset.icon as any}
                      size={20}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[styles.gymPresetLabel, isSelected && styles.gymPresetLabelSelected]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom equipment library */}
            {gymPreset === 'custom' && showLibrary && (
              <View style={styles.libraryContainer}>
                <ScrollView 
                  style={styles.libraryScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  {Object.entries(equipmentByCategory).map(([category, items]) => (
                    <View key={category} style={styles.categorySection}>
                      <Text style={styles.categoryTitle}>
                        {CATEGORY_LABELS[category] || category}
                      </Text>
                      <View style={styles.equipmentGrid}>
                        {items.map((item) => {
                          const isSelected = selectedGymEquipment.includes(item.id);
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[styles.equipmentItem, isSelected && styles.equipmentItemSelected]}
                              onPress={() => {
                                const newEquipment = isSelected
                                  ? selectedGymEquipment.filter(id => id !== item.id)
                                  : [...selectedGymEquipment, item.id];
                                onGymEquipmentChange(newEquipment);
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={item.icon as any}
                                size={16}
                                color={isSelected ? '#4cbb17' : '#6b7280'}
                              />
                              <Text 
                                style={[styles.equipmentLabel, isSelected && styles.equipmentLabelSelected]}
                                numberOfLines={1}
                              >
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // Simple variant with expandable library
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Equipment</Text>
      
      {/* Binary choice: No Equipment / Equipment */}
      <View style={styles.binaryRow}>
        <TouchableOpacity
          style={[styles.binaryOption, isNoEquipment && !showLibrary && styles.binaryOptionSelected]}
          onPress={handleNoEquipment}
          activeOpacity={0.7}
        >
          <Ionicons
            name="body-outline"
            size={24}
            color={isNoEquipment && !showLibrary ? '#4cbb17' : '#6b7280'}
          />
          <Text style={[styles.binaryLabel, isNoEquipment && !showLibrary && styles.binaryLabelSelected]}>
            No Equipment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.binaryOption, 
            (hasEquipmentSelected || showLibrary) && styles.binaryOptionSelected
          ]}
          onPress={handleEquipmentClick}
          activeOpacity={0.7}
        >
          <Ionicons
            name="barbell-outline"
            size={24}
            color={(hasEquipmentSelected || showLibrary) ? '#4cbb17' : '#6b7280'}
          />
          <View style={styles.equipmentLabelRow}>
            <Text style={[
              styles.binaryLabel, 
              (hasEquipmentSelected || showLibrary) && styles.binaryLabelSelected
            ]}>
              Equipment
            </Text>
            {hasEquipmentSelected && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {selectedEquipment.filter(id => id !== 'none').length}
                </Text>
              </View>
            )}
          </View>
          <Ionicons
            name={showLibrary ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={(hasEquipmentSelected || showLibrary) ? '#4cbb17' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      {/* Expandable Equipment Library */}
      {showLibrary && (
        <View style={styles.libraryContainer}>
          <ScrollView 
            style={styles.libraryScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            {Object.entries(equipmentByCategory).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {CATEGORY_LABELS[category] || category}
                </Text>
                <View style={styles.equipmentGrid}>
                  {items.map((item) => {
                    const isSelected = selectedEquipment.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.equipmentItem, isSelected && styles.equipmentItemSelected]}
                        onPress={() => onEquipmentToggle(item.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color={isSelected ? '#4cbb17' : '#6b7280'}
                        />
                        <Text 
                          style={[styles.equipmentLabel, isSelected && styles.equipmentLabelSelected]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
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
  // Gate styles (Routine mode)
  gateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gateOption: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 6,
  },
  gateOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  gateLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  gateLabelSelected: {
    color: '#166534',
  },
  gateDescription: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Binary choice styles
  binaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  binaryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  binaryOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  binaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  binaryLabelSelected: {
    color: '#166534',
  },
  equipmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    backgroundColor: '#4cbb17',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  // Library styles
  libraryContainer: {
    marginTop: 12,
  },
  libraryScroll: {
    paddingVertical: 4,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  equipmentItemSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#4cbb17',
  },
  equipmentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  equipmentLabelSelected: {
    color: '#166534',
  },
  // Gym presets styles
  gymPresetsContainer: {
    marginTop: 16,
  },
  gymPresetsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  gymPresetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gymPresetOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  gymPresetOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  gymPresetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  gymPresetLabelSelected: {
    color: '#166534',
  },
});
