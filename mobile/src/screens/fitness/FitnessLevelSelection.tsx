/**
 * FitnessLevelSelection Component
 * 
 * Step 1 of workout creation - allows user to select their fitness level
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '../../components/shared';
import { FitnessLevel } from './types';
import { FITNESS_LEVELS } from './constants';

interface FitnessLevelSelectionProps {
  selectedLevel: string;
  onSelectLevel: (levelId: string) => void;
}

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export const FitnessLevelSelection: React.FC<FitnessLevelSelectionProps> = ({
  selectedLevel,
  onSelectLevel,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="fitness-outline" size={48} color="#4cbb17" />
        <Text style={styles.title}>What's Your Fitness Level?</Text>
        <Text style={styles.subtitle}>
          Select your current fitness level to get appropriate exercises and reps
        </Text>
      </View>

      {FITNESS_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.levelCard,
            selectedLevel === level.id && styles.levelCardSelected,
            selectedLevel === level.id && { borderColor: level.color },
            { borderLeftColor: level.color, borderLeftWidth: 4 }
          ]}
          onPress={() => onSelectLevel(level.id)}
        >
          <View style={styles.levelCardHeader}>
            <Ionicons name={level.icon as any} size={28} color={level.color} />
            <Text style={[styles.levelCardTitle, { color: level.color }]}>
              {level.title.toUpperCase()}
            </Text>
            {selectedLevel === level.id && (
              <Ionicons name="checkmark-circle" size={24} color={level.color} />
            )}
          </View>
          <Text style={styles.levelCardDescription}>{level.description}</Text>
          <View style={styles.levelFeatures}>
            {level.features.map((feature, index) => (
              <View key={index} style={styles.levelFeatureRow}>
                <Ionicons name="checkmark-outline" size={16} color="#6B7280" />
                <Text style={styles.levelFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}

      <Text style={styles.note}>
        <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
        {' '}You can change this later in settings
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelCardSelected: {
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  levelCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 1,
  },
  levelCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  levelFeatures: {
    gap: 8,
  },
  levelFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelFeatureText: {
    fontSize: 13,
    color: '#4B5563',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    fontStyle: 'italic',
  },
});

export default FitnessLevelSelection;
