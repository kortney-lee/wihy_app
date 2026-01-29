/**
 * EnhancementStatus Component
 * 
 * Displays the current enhancement level of a meal plan and
 * provides actions to upgrade to the next level.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { EnhancementLevel } from '../../services/mealService';

interface EnhancementStatusProps {
  level: EnhancementLevel | null;
  shoppingReady: boolean;
  canEnhance: boolean;
  postalCode?: string | null;
  storeName?: string | null;
  onEnhance?: () => void;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  basic: {
    icon: '📋',
    title: 'Basic Plan',
    description: 'Generic meal plan without shopping integration',
    color: '#8E8E93',
    bgColor: '#F2F2F7',
    nextAction: 'Add zipcode for local stores',
  },
  zipcode: {
    icon: '📍',
    title: 'Regional Plan',
    description: 'Regional pricing and store options available',
    color: '#FF9500',
    bgColor: '#FFF7E6',
    nextAction: 'Select a store for Instacart',
  },
  full: {
    icon: '✨',
    title: 'Full Enhanced',
    description: 'Real products and one-click Instacart ordering',
    color: '#34C759',
    bgColor: '#E8F8EB',
    nextAction: null,
  },
};

export const EnhancementStatus: React.FC<EnhancementStatusProps> = ({
  level,
  shoppingReady,
  canEnhance,
  postalCode,
  storeName,
  onEnhance,
  compact = false,
}) => {
  if (!level) {
    return null;
  }

  const config = LEVEL_CONFIG[level];

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: config.bgColor }]}>
        <Text style={styles.compactIcon}>{config.icon}</Text>
        <Text style={[styles.compactTitle, { color: config.color }]}>
          {config.title}
        </Text>
        {shoppingReady && (
          <View style={styles.shoppingReadyBadge}>
            <Text style={styles.shoppingReadyText}>🛒 Ready</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: config.color }]}>
            {config.title}
          </Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: level === 'basic' ? '33%' : level === 'zipcode' ? '66%' : '100%',
                backgroundColor: config.color,
              }
            ]} 
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, level === 'basic' && styles.progressLabelActive]}>
            Basic
          </Text>
          <Text style={[styles.progressLabel, level === 'zipcode' && styles.progressLabelActive]}>
            Zipcode
          </Text>
          <Text style={[styles.progressLabel, level === 'full' && styles.progressLabelActive]}>
            Full
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        {postalCode && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>Zipcode: {postalCode}</Text>
          </View>
        )}
        {storeName && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🏪</Text>
            <Text style={styles.detailText}>Store: {storeName}</Text>
          </View>
        )}
        {shoppingReady && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>✅</Text>
            <Text style={styles.detailText}>Shopping cart ready</Text>
          </View>
        )}
      </View>

      {/* Enhance button */}
      {canEnhance && config.nextAction && onEnhance && (
        <TouchableOpacity
          style={[styles.enhanceButton, { borderColor: config.color }]}
          onPress={onEnhance}
          activeOpacity={0.7}
        >
          <Text style={[styles.enhanceButtonText, { color: config.color }]}>
            {config.nextAction}
          </Text>
          <Text style={styles.enhanceButtonArrow}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  progressLabelActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  details: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  enhanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#FFFFFF', // Now using theme.colors.surface dynamically
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  enhanceButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  enhanceButtonArrow: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  compactIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  shoppingReadyBadge: {
    marginLeft: 8,
    backgroundColor: '#34C759',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  shoppingReadyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EnhancementStatus;
