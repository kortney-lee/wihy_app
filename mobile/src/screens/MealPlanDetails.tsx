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

type RouteProps = RouteProp<RootStackParamList, 'MealPlanDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function MealPlanDetails() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { planId, planName } = route.params || {};

  // In a real implementation, this would fetch meal plan details from API
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <GradientDashboardHeader
        title={planName || 'Meal Plan'}
        gradient="createMeals"
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
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading meal plan...</Text>
          </View>
        ) : (
          <>
            {/* Plan Header */}
            <View style={styles.planHeader}>
              <View style={styles.planIcon}>
                <Ionicons name="restaurant" size={32} color="#10b981" />
              </View>
              <Text style={styles.planTitle}>{planName || 'Your Meal Plan'}</Text>
              <Text style={styles.planSubtitle}>Plan ID: {planId}</Text>
            </View>

            {/* Placeholder Content */}
            <View style={styles.placeholderCard}>
              <Ionicons name="construct-outline" size={48} color="#9ca3af" />
              <Text style={styles.placeholderTitle}>Meal Plan Details Coming Soon</Text>
              <Text style={styles.placeholderText}>
                This screen will display your personalized meal plan with:
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Daily meal schedule</Text>
                <Text style={styles.featureItem}>• Recipe details & instructions</Text>
                <Text style={styles.featureItem}>• Nutritional information</Text>
                <Text style={styles.featureItem}>• Shopping list integration</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('CreateMeals', { showShoppingList: true })}
              >
                <Ionicons name="cart" size={20} color="#10b981" />
                <Text style={styles.secondaryButtonText}>View Shopping List</Text>
              </Pressable>

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
  planHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  planSubtitle: {
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
    backgroundColor: '#10b981',
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
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
});
