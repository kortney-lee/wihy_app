import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from './Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/navigation';
import { dashboardTheme } from '../../theme/dashboardTheme';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface DashboardOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToDashboard: (dashboardType: 'overview' | 'progress' | 'nutrition' | 'research' | 'fitness' | 'coach' | 'parent' | 'findCoach' | 'meals' | 'clients' | 'onboard' | null) => void;
  context?: 'personal' | 'coach' | 'family';
  isCoach?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  visible,
  onClose,
  onNavigateToDashboard,
  context = 'personal',
  isCoach = false,
}) => {
  const navigation = useNavigation<NavigationProp>();
  
  // Define all dashboard options with context tags
  const allDashboardOptions: Array<DashboardOption & { contexts: Array<'personal' | 'coach' | 'family'> }> = [
    {
      id: 'health',
      title: context === 'coach' ? 'Coach Hub' : context === 'family' ? 'Family Hub' : 'Health Dashboard',
      subtitle: context === 'coach' ? 'Main coach overview hub' : context === 'family' ? 'Family overview hub' : 'Main health overview hub',
      icon: 'fitness',
      color: '#EF4444',
      onPress: () => onNavigateToDashboard(null),
      contexts: ['personal', 'coach', 'family'],
    },
    {
      id: 'overview',
      title: 'Overview Dashboard',
      subtitle: 'Health summary and insights',
      icon: 'grid',
      color: '#3B82F6',
      onPress: () => onNavigateToDashboard('overview'),
      contexts: ['personal'],
    },
    {
      id: 'progress',
      title: 'My Progress',
      subtitle: 'Track daily metrics',
      icon: 'trending-up',
      color: '#22C55E',
      onPress: () => onNavigateToDashboard('progress'),
      contexts: ['personal'],
    },
    {
      id: 'nutrition',
      title: 'Nutrition Dashboard',
      subtitle: 'Food tracking and consumption',
      icon: 'restaurant',
      color: '#F59E0B',
      onPress: () => onNavigateToDashboard('nutrition'),
      contexts: ['personal'],
    },
    {
      id: 'research',
      title: 'Research Dashboard',
      subtitle: 'Health insights and evidence',
      icon: 'library',
      color: '#8B5CF6',
      onPress: () => onNavigateToDashboard('research'),
      contexts: ['personal'],
    },
    {
      id: 'fitness',
      title: 'Fitness Dashboard',
      subtitle: 'Workout plans and tracking',
      icon: 'barbell',
      color: '#10B981',
      onPress: () => onNavigateToDashboard('fitness'),
      contexts: ['personal'],
    },
    {
      id: 'meals',
      title: 'Create Meals',
      subtitle: 'Custom recipes & meal plans',
      icon: 'restaurant',
      color: '#f97316',
      onPress: () => onNavigateToDashboard('meals'),
      contexts: ['personal', 'coach'],
    },
    {
      id: 'coach',
      title: 'Coach Dashboard',
      subtitle: 'Manage your clients',
      icon: 'people',
      color: '#3b82f6',
      onPress: () => onNavigateToDashboard('coach'),
      contexts: ['coach'],
    },
    {
      id: 'parent',
      title: 'Family Dashboard',
      subtitle: 'Kids health tracking',
      icon: 'heart',
      color: '#ec4899',
      onPress: () => onNavigateToDashboard('parent'),
      contexts: ['family'],
    },
    {
      id: 'coach-selection',
      title: 'Find a Coach',
      subtitle: 'Get professional guidance',
      icon: 'person-add',
      color: '#14b8a6',
      onPress: () => onNavigateToDashboard('findCoach'),
      contexts: ['personal'],
    },
    {
      id: 'clients',
      title: 'Client Management',
      subtitle: 'View client roster',
      icon: 'folder-open',
      color: '#6366f1',
      onPress: () => onNavigateToDashboard('clients'),
      contexts: ['coach'],
    },
    {
      id: 'onboarding',
      title: 'Client Onboarding',
      subtitle: 'Add new clients',
      icon: 'clipboard',
      color: '#84cc16',
      onPress: () => onNavigateToDashboard('onboard'),
      contexts: ['coach'],
    },
  ];

  // Filter options based on current context
  const dashboardOptions = allDashboardOptions.filter(option => {
    // Hide 'Find a Coach' if user is already a coach
    if (option.id === 'coach-selection' && isCoach) {
      return false;
    }
    return option.contexts.includes(context);
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Dashboards</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={dashboardTheme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Dashboard Options */}
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>Available Dashboards</Text>
              {dashboardOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionItem}
                  onPress={() => {
                    option.onPress();
                    onClose();
                  }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={dashboardTheme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: dashboardTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '65%',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: dashboardTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
  },
  closeButton: {
    padding: dashboardTheme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: dashboardTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dashboardTheme.spacing.md,
    paddingHorizontal: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
    marginBottom: dashboardTheme.spacing.xs,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dashboardTheme.spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
  },
});
