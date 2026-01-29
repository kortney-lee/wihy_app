import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';
import { SweepBorder } from '../components/SweepBorder';
import { useTheme } from '../context/ThemeContext';
import type { PhotoScanResponse } from '../services/types';
import { chatService } from '../services/chatService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'FoodPhotoFacts'>;
type RouteProps = RouteProp<RootStackParamList, 'FoodPhotoFacts'>;

// ========================================
// HELPER FUNCTIONS
// ========================================

function getHealthScoreColor(score: number) {
  if (score >= 80) return { bg: '#d1fae5', border: '#10b981', text: '#065f46' };
  if (score >= 60) return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
  if (score >= 40) return { bg: '#fed7aa', border: '#f97316', text: '#9a3412' };
  return { bg: '#fecaca', border: '#ef4444', text: '#991b1b' };
}

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A': return { bg: '#d1fae5', border: '#10b981', text: '#065f46' };
    case 'B': return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
    case 'C': return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
    case 'D': return { bg: '#fed7aa', border: '#f97316', text: '#9a3412' };
    default: return { bg: '#fecaca', border: '#ef4444', text: '#991b1b' };
  }
}

function getNovaColor(nova: number) {
  switch (nova) {
    case 1: return { bg: '#d1fae5', text: '#065f46', label: 'Unprocessed' };
    case 2: return { bg: '#dbeafe', text: '#1e40af', label: 'Processed Ingredients' };
    case 3: return { bg: '#fef3c7', text: '#92400e', label: 'Processed Foods' };
    case 4: return { bg: '#fecaca', text: '#991b1b', label: 'Ultra-Processed' };
    default: return { bg: '#f3f4f6', text: '#6b7280', label: 'Unknown' };
  }
}

export default function FoodPhotoFacts() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const { photoData: initialData, context, capturedImage } = route?.params || { 
    photoData: null, 
    context: null,
    capturedImage: null 
  };
  
  const [photoData, setPhotoData] = useState<PhotoScanResponse | null>(initialData as PhotoScanResponse || null);
  const [expandedNutrients, setExpandedNutrients] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'Scan' });
    }
  };

  const openChatWithContext = (chatContext: any) => {
    navigation.navigate('FullChat', {
      context: {
        ...context,
        photoData: photoData,
        productType: 'food_photo',
        ...chatContext,
      },
      initialMessage: chatContext.query || `Tell me about ${photoData?.metadata?.product_name || 'this food'}`,
    });
  };

  if (!photoData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading food analysis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { analysis, metadata } = photoData;
  const nutrition = metadata?.nutrition_facts;
  const nutritionAnalysis = metadata?.nutrition_analysis;
  const healthScore = metadata?.health_score || 0;
  const nutritionGrade = metadata?.nutrition_grade?.grade || 'C';
  const novaGroup = metadata?.nova_group || 3;
  const healthScoreColors = getHealthScoreColor(healthScore);
  const gradeColors = getGradeColor(nutritionGrade);
  const novaColors = getNovaColor(novaGroup);

  // Calculate macros based on serving multiplier
  const getAdjustedValue = (value: number) => Math.round(value * servingMultiplier);
  
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Food Photo Analysis</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Captured Image */}
        {(capturedImage || photoData.image_url) && (
          <View style={styles.imageSection}>
            <Image
              source={{ uri: capturedImage || photoData.image_url || '' }}
              style={styles.capturedImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <View style={styles.confidenceBadge}>
                <Ionicons name="eye" size={14} color="#ffffff" />
                <Text style={styles.confidenceText}>
                  {Math.round((analysis?.confidence_score || 0) * 100)}% confidence
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Detected Foods */}
        <View style={styles.detectedSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="restaurant" size={18} color="#f97316" /> Detected Foods
          </Text>
          <View style={styles.detectedFoodsContainer}>
            {(analysis?.detected_foods || metadata?.detected_foods || []).map((food, index) => (
              <View key={index} style={styles.detectedFoodChip}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.detectedFoodText}>{food}</Text>
              </View>
            ))}
          </View>
          {analysis?.meal_type && (
            <Text style={styles.mealType}>
              <Ionicons name="time" size={14} color="#6b7280" /> {analysis.meal_type}
            </Text>
          )}
          {analysis?.summary && (
            <Text style={styles.analysisSummary}>{analysis.summary}</Text>
          )}
        </View>

        {/* Health Score Card */}
        <View style={styles.scoreCardsContainer}>
          <SweepBorder
            colors={['#f97316', '#ea580c', '#f97316'] as const}
            backgroundColor={healthScoreColors.bg}
            radius={16}
            durationMs={4000}
          >
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Health Score</Text>
              <Text style={[styles.scoreValue, { color: healthScoreColors.text }]}>
                {healthScore}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </SweepBorder>

          <SweepBorder
            colors={[gradeColors.border, gradeColors.text, gradeColors.border] as const}
            backgroundColor={gradeColors.bg}
            radius={16}
            durationMs={4000}
          >
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Grade</Text>
              <Text style={[styles.gradeValue, { color: gradeColors.text }]}>
                {nutritionGrade}
              </Text>
            </View>
          </SweepBorder>

          <SweepBorder
            colors={novaColors.bg === '#d1fae5' ? ['#10b981', '#059669', '#10b981'] as const : novaColors.bg === '#fecaca' ? ['#ef4444', '#dc2626', '#ef4444'] as const : ['#f59e0b', '#d97706', '#f59e0b'] as const}
            backgroundColor={novaColors.bg}
            radius={16}
            durationMs={4000}
          >
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>NOVA</Text>
              <Text style={[styles.novaValue, { color: novaColors.text }]}>
                {novaGroup}
              </Text>
              <Text style={[styles.novaLabel, { color: novaColors.text }]}>
                {novaColors.label}
              </Text>
            </View>
          </SweepBorder>
        </View>

        {/* Nutrition Facts */}
        {nutrition && (
          <View style={styles.nutritionSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="nutrition" size={18} color="#f97316" /> Nutrition Facts
              </Text>
              <View style={styles.servingControls}>
                <Pressable
                  style={styles.servingButton}
                  onPress={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                >
                  <Ionicons name="remove" size={16} color="#6b7280" />
                </Pressable>
                <Text style={styles.servingText}>
                  {servingMultiplier}x {nutrition.serving_size || '100g'}
                </Text>
                <Pressable
                  style={styles.servingButton}
                  onPress={() => setServingMultiplier(servingMultiplier + 0.5)}
                >
                  <Ionicons name="add" size={16} color="#6b7280" />
                </Pressable>
              </View>
            </View>

            {/* Calories */}
            <View style={styles.calorieCard}>
              <Text style={styles.calorieLabel}>Calories</Text>
              <Text style={styles.calorieValue}>
                {getAdjustedValue(nutrition.calories || nutrition.calories_serving || 0)}
              </Text>
            </View>

            {/* Macros */}
            <View style={styles.macrosGrid}>
              <View style={[styles.macroCard, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="barbell" size={20} color="#3b82f6" />
                <Text style={styles.macroValue}>{getAdjustedValue(nutrition.protein || 0)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={[styles.macroCard, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="cube" size={20} color="#f59e0b" />
                <Text style={styles.macroValue}>{getAdjustedValue(nutrition.carbohydrates || 0)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={[styles.macroCard, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="water" size={20} color="#ec4899" />
                <Text style={styles.macroValue}>{getAdjustedValue(nutrition.fat || 0)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>

            {/* Expanded Nutrients */}
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setExpandedNutrients(!expandedNutrients)}
            >
              <Text style={styles.expandButtonText}>
                {expandedNutrients ? 'Hide Details' : 'Show All Nutrients'}
              </Text>
              <Ionicons
                name={expandedNutrients ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#f97316"
              />
            </TouchableOpacity>

            {expandedNutrients && (
              <View style={styles.expandedNutrients}>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Saturated Fat</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.saturated_fat || 0)}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Trans Fat</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.trans_fat || 0)}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Fiber</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.fiber || 0)}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Sugars</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.sugars || 0)}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Sodium</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.sodium || 0)}mg</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Cholesterol</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.cholesterol || 0)}mg</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Potassium</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.potassium || 0)}mg</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Calcium</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.calcium || 0)}mg</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>Iron</Text>
                  <Text style={styles.nutrientValue}>{getAdjustedValue(nutrition.iron || 0)}mg</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Health Analysis */}
        {nutritionAnalysis && (
          <View style={styles.healthAnalysisSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="medical" size={18} color="#f97316" /> Health Analysis
            </Text>

            {/* Health Alerts */}
            {nutritionAnalysis.health_alerts && nutritionAnalysis.health_alerts.length > 0 && (
              <View style={styles.alertsSection}>
                <Text style={styles.alertsTitle}>⚠️ Alerts</Text>
                {nutritionAnalysis.health_alerts.map((alert, index) => (
                  <View key={index} style={styles.alertItem}>
                    <Ionicons name="warning" size={16} color="#ef4444" />
                    <Text style={styles.alertText}>{alert}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Positive Aspects */}
            {nutritionAnalysis.positive_aspects && nutritionAnalysis.positive_aspects.length > 0 && (
              <View style={styles.positiveSection}>
                <Text style={styles.positiveTitle}>✓ Positive Aspects</Text>
                {nutritionAnalysis.positive_aspects.map((positive, index) => (
                  <View key={index} style={styles.positiveItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.positiveText}>{positive}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Areas of Concern */}
            {nutritionAnalysis.areas_of_concern && nutritionAnalysis.areas_of_concern.length > 0 && (
              <View style={styles.concernsSection}>
                <Text style={styles.concernsTitle}>Areas of Concern</Text>
                {nutritionAnalysis.areas_of_concern.map((concern, index) => (
                  <View key={index} style={styles.concernItem}>
                    <Ionicons name="alert-circle" size={16} color="#f59e0b" />
                    <Text style={styles.concernText}>{concern}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Pressable
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => openChatWithContext({ type: 'general' })}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" />
            <Text style={styles.primaryActionText}>Ask WiHY</Text>
          </Pressable>
          <View style={styles.secondaryActions}>
            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => openChatWithContext({ type: 'alternatives' })}
            >
              <Ionicons name="swap-horizontal" size={18} color="#6b7280" />
              <Text style={styles.secondaryActionText}>Compare alternatives</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => Alert.alert('Feature Coming Soon', 'Meal planning feature will be available soon!')}
            >
              <Ionicons name="calendar" size={18} color="#6b7280" />
              <Text style={styles.secondaryActionText}>Add to meal plan</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginRight: 56,
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Image Section
  imageSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  capturedImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Detected Foods
  detectedSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  detectedFoodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detectedFoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  detectedFoodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#065f46',
  },
  mealType: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  analysisSummary: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Score Cards
  scoreCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 12,
    color: '#9ca3af',
  },
  gradeValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  novaValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  novaLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // Nutrition Section
  nutritionSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servingButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    // // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  calorieCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieLabel: {
    fontSize: 14,
    color: '#9a3412',
    fontWeight: '600',
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ea580c',
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  expandedNutrients: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  nutrientName: {
    fontSize: 14,
    color: '#374151',
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },

  // Health Analysis
  healthAnalysisSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertsSection: {
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
  },
  positiveSection: {
    marginBottom: 16,
  },
  positiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  positiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  positiveText: {
    flex: 1,
    fontSize: 13,
    color: '#065f46',
  },
  concernsSection: {
    marginBottom: 8,
  },
  concernsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 8,
  },
  concernItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  concernText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },

  // Action Section
  actionSection: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#4cbb17',
    borderWidth: 1.5,
    borderColor: '#4cbb17',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});
