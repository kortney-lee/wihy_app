/**
 * DietSelector - Multi-select Diet Chips
 * 
 * Displays available diets loaded from getDiets() API
 * with fallback to built-in diet options.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mealService, DietOption } from '../../../services/mealService';

interface DietSelectorProps {
  selectedDiets: string[];
  onDietsChange: (diets: string[]) => void;
  maxSelection?: number;
  showSearch?: boolean;
  title?: string;
}

export const DietSelector: React.FC<DietSelectorProps> = ({
  selectedDiets,
  onDietsChange,
  maxSelection,
  showSearch = true,
  title = 'Dietary Preferences',
}) => {
  const [diets, setDiets] = useState<DietOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDiets();
  }, []);

  const loadDiets = async () => {
    try {
      setLoading(true);
      const dietOptions = await mealService.getDiets();
      setDiets(dietOptions);
    } catch (error) {
      console.error('Error loading diets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiet = (dietId: string) => {
    if (selectedDiets.includes(dietId)) {
      onDietsChange(selectedDiets.filter(id => id !== dietId));
    } else {
      // Check max selection
      if (maxSelection && selectedDiets.length >= maxSelection) {
        return;
      }
      onDietsChange([...selectedDiets, dietId]);
    }
  };

  // Filter diets by search
  const filteredDiets = searchQuery.trim()
    ? diets.filter(diet =>
        diet.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diet.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : diets;

  // Group diets by type
  const groupedDiets = filteredDiets.reduce((acc, diet) => {
    const group = acc.find(g => g.type === diet.type);
    if (group) {
      group.diets.push(diet);
    } else {
      acc.push({ type: diet.type, diets: [diet] });
    }
    return acc;
  }, [] as Array<{ type: string; diets: DietOption[] }>);

  const getGroupLabel = (type: string): string => {
    const labels: Record<string, string> = {
      restriction: 'Plant/Animal Based',
      macronutrient: 'Macros Focused',
      ancestral: 'Ancestral',
      regional: 'Regional',
      elimination: 'Elimination',
      medical: 'Medical/Allergies',
      therapeutic: 'Therapeutic',
      timing: 'Timing Based',
      spiritual: 'Spiritual',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4cbb17" />
        <Text style={styles.loadingText}>Loading diets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search diets..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {maxSelection && (
        <Text style={styles.selectionHint}>
          Select up to {maxSelection} ({selectedDiets.length}/{maxSelection})
        </Text>
      )}

      {groupedDiets.map((group) => (
        <View key={group.type} style={styles.groupContainer}>
          <Text style={styles.groupLabel}>{getGroupLabel(group.type)}</Text>
          <View style={styles.chipGrid}>
            {group.diets.map((diet) => {
              const isSelected = selectedDiets.includes(diet.id);
              const isDisabled = maxSelection && !isSelected && selectedDiets.length >= maxSelection;
              
              return (
                <TouchableOpacity
                  key={diet.id}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    isDisabled && styles.chipDisabled,
                  ]}
                  onPress={() => toggleDiet(diet.id)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={diet.icon as any}
                    size={16}
                    color={isSelected ? '#4cbb17' : isDisabled ? '#d1d5db' : '#6b7280'}
                  />
                  <Text style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                    isDisabled && styles.chipTextDisabled,
                  ]}>
                    {diet.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {filteredDiets.length === 0 && (
        <Text style={styles.noResults}>No diets match your search</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 0,
  },
  selectionHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  groupContainer: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  chipDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    opacity: 0.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  chipTextDisabled: {
    color: '#d1d5db',
  },
  noResults: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default DietSelector;
