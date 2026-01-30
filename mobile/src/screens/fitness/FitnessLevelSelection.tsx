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
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="fitness-outline" size={48} color="#4cbb17" />
        <Text style={[styles.title, { color: theme.colors.text }]}>What's Your Fitness Level?</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select your current fitness level to get appropriate exercises and reps
        </Text>
      </View>

      {FITNESS_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.levelCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
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
          <Text style={[styles.levelCardDescription, { color: theme.colors.textSecondary }]}>{level.description}</Text>
          <View style={styles.levelFeatures}>
            {level.features.map((feature, index) => (
              <View key={index} style={styles.levelFeatureRow}>
                <Ionicons name="checkmark-outline" size={16} color="#6B7280" />
                <Text style={[styles.levelFeatureText, { color: theme.colors.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}

      <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
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
    // color: theme.colors.text
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  levelCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
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
    // color: theme.colors.textSecondary
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
    // color: theme.colors.text
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
