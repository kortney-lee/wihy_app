import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import { useTheme } from '../context/ThemeContext';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { GradientDashboardHeader } from '../components/shared';

type RouteProps = RouteProp<RootStackParamList, 'FitnessProgramDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function FitnessProgramDetails() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { programId, programName } = route.params || {};

  // In a real implementation, this would fetch program details from API
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <GradientDashboardHeader
        title={programName || 'Fitness Program'}
        gradient="fitness"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
      </GradientDashboardHeader>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading program...</Text>
          </View>
        ) : (
          <>
            {/* Program Header */}
            <View style={styles.programHeader}>
              <View style={styles.programIcon}>
                <Ionicons name="fitness" size={32} color="#3b82f6" />
              </View>
              <Text style={styles.programTitle}>{programName || 'Your Fitness Program'}</Text>
              <Text style={styles.programSubtitle}>Program ID: {programId}</Text>
            </View>

            {/* Placeholder Content */}
            <View style={styles.placeholderCard}>
              <Ionicons name="construct-outline" size={48} color="#9ca3af" />
              <Text style={styles.placeholderTitle}>Program Details Coming Soon</Text>
              <Text style={styles.placeholderText}>
                This screen will display your personalized fitness program with:
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Weekly workout schedule</Text>
                <Text style={styles.featureItem}>• Exercise demonstrations</Text>
                <Text style={styles.featureItem}>• Progress tracking</Text>
                <Text style={styles.featureItem}>• Workout history</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Back to Chat</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  programHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  programIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  programTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  programSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  placeholderCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureList: {
    alignSelf: 'flex-start',
  },
  featureItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
