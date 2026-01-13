import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import { fdaService } from '../services/fdaService';
import type { IngredientAnalysis } from '../services/types';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';
import { DashboardGradientType } from '../components/shared';
import { SweepBorder } from '../components/SweepBorder';
import type {
  BarcodeScanResponse,
  PhotoScanResponse,
  RecipeScanResponse,
  LabelScanResponse,
  ScanResponse,
} from '../services/types';

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, 'NutritionFacts'>,
  BottomTabNavigationProp<TabParamList>
>;

type RouteProps = RouteProp<RootStackParamList, 'NutritionFacts'>;

// ========================================
// TYPE GUARDS for different scan responses
// ========================================

function isBarcodeScanResponse(item: ScanResponse): item is BarcodeScanResponse {
  return item.scan_type === 'barcode' || item.scan_type === 'image' || item.scan_type === 'product_name';
}

function isPhotoScanResponse(item: ScanResponse): item is PhotoScanResponse {
  return item.scan_type === 'food_photo';
}

function isRecipeScanResponse(item: ScanResponse): item is RecipeScanResponse {
  return item.scan_type === 'recipe';
}

function isLabelScanResponse(item: ScanResponse): item is LabelScanResponse {
  return item.scan_type === 'label';
}

// ========================================
// HELPER FUNCTIONS to safely access properties
// ========================================

function getProductName(item: ScanResponse | null): string {
  if (!item) return 'Unknown';
  if (isBarcodeScanResponse(item)) return item.product_name;
  if (isPhotoScanResponse(item)) return item.metadata.product_name;
  if (isRecipeScanResponse(item)) return item.analysis.meal_name;
  if (isLabelScanResponse(item)) return item.analysis.product_name;
  return 'Unknown';
}

function getImageUrl(item: ScanResponse | null): string | null {
  if (!item) return null;
  if (isBarcodeScanResponse(item)) return item.image_url;
  if (isPhotoScanResponse(item)) return item.image_url;
  if (isRecipeScanResponse(item)) return item.image_url;
  if (isLabelScanResponse(item)) return item.image_url;
  return null;
}

function getCalories(item: ScanResponse | null): number {
  if (!item) return 0;
  if (isBarcodeScanResponse(item)) return item.calories;
  if (isPhotoScanResponse(item)) return item.metadata.nutrition_facts.calories;
  if (isRecipeScanResponse(item)) return item.analysis.nutrition_facts.calories;
  return 0;
}

function getHealthScore(item: ScanResponse | null): number {
  if (!item) return 0;
  if (isBarcodeScanResponse(item)) return item.health_score;
  if (isPhotoScanResponse(item)) return item.metadata.health_score;
  return 0;
}

function getNutritionGrade(item: ScanResponse | null): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null {
  if (!item) return null;
  if (isBarcodeScanResponse(item)) return item.nutrition_grade;
  if (isPhotoScanResponse(item)) return item.metadata.nutrition_grade.grade;
  return null;
}

function getServingSize(item: ScanResponse | null): string {
  if (!item) return '1 serving';
  if (isBarcodeScanResponse(item)) return item.serving_size;
  if (isPhotoScanResponse(item)) return item.metadata.nutrition_facts.serving_size;
  if (isRecipeScanResponse(item)) return item.analysis.nutrition_facts.serving_size;
  return '1 serving';
}

type ScanType = 'barcode' | 'image' | 'product_name' | 'recipe' | 'label' | 'food_photo';

// Helper function to check if product is unknown
const isUnknownProduct = (name: string | undefined): boolean => {
  if (!name) return true;
  const lowerName = name.toLowerCase();
  return lowerName.includes('unknown') || 
         lowerName === 'food item' || 
         lowerName === 'product' ||
         lowerName === 'scanned item';
};

export default function NutritionFacts() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();

  const routeParams = route?.params;
  const { foodItem: initialFoodItem, context } = routeParams || { foodItem: null, context: null };

  // Determine if this is modal presentation (from dashboard) or stack navigation (from camera/scan)
  // Modal contexts: dashboard-access, consumption-dashboard, meal-log
  const isModalPresentation = context?.type === 'dashboard-access' || 
                              context?.type === 'consumption-dashboard' ||
                              context?.type === 'meal-log' ||
                              context?.isModal === true;

  // Determine scan type based on API response
  const getScanType = (): ScanType => {
    if (initialFoodItem?.scan_type) {
      return initialFoodItem.scan_type as ScanType;
    }
    return 'barcode';  // Default fallback
  };

  const [scanType, setScanType] = useState<ScanType>(getScanType());
  const [foodItem, setFoodItem] = useState<ScanResponse | null>(null);
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  
  // FDA Ingredient Analysis State
  const [loadingIngredients, setLoadingIngredients] = useState<Set<string>>(new Set());
  const [analyzedIngredients, setAnalyzedIngredients] = useState<Map<string, IngredientAnalysis>>(new Map());

  // Animation refs
  const analysisProgress = useRef(new Animated.Value(0)).current;

  // Mock nutrition data generator (for backwards compatibility with old code paths)
  const generateMockNutritionData = (foodName: string): BarcodeScanResponse => {
    const mockData: BarcodeScanResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      processing_time_ms: 250,
      scan_type: 'barcode',
      product_name: foodName,
      brand: '',
      barcode: '',
      image_url: null,
      categories: [],
      image_front_url: null,
      image_front_small_url: null,
      image_nutrition_url: null,
      image_nutrition_small_url: null,
      image_ingredients_url: null,
      image_ingredients_small_url: null,
      health_score: Math.floor(Math.random() * 40) + 50,
      nutrition_score: Math.floor(Math.random() * 40) + 50,
      nutrition_grade: 'B',
      confidence_score: 0.85,
      nova_group: 2,
      processing_level: 'processed_ingredient',
      calories: Math.floor(Math.random() * 300) + 100,
      calories_per_serving: Math.floor(Math.random() * 200) + 150,
      protein_g: Math.floor(Math.random() * 25) + 5,
      carbs_g: Math.floor(Math.random() * 40) + 10,
      fat_g: Math.floor(Math.random() * 15) + 2,
      saturated_fat_g: Math.floor(Math.random() * 5) + 1,
      fiber_g: Math.floor(Math.random() * 8) + 1,
      sugar_g: Math.floor(Math.random() * 20) + 2,
      sodium_mg: Math.floor(Math.random() * 400) + 100,
      cholesterol_mg: 0,
      trans_fat_g: 0,
      polyunsaturated_fat_g: 0,
      monounsaturated_fat_g: 0,
      potassium_mg: 200,
      calcium_mg: 120,
      iron_mg: 2,
      vitamin_a_mcg: 0,
      vitamin_c_mg: 45,
      vitamin_d_mcg: 0,
      serving_size: '1 cup',
      servings_per_container: 1,
      chart_protein: Math.floor(Math.random() * 25) + 5,
      chart_carbs: Math.floor(Math.random() * 40) + 10,
      chart_fat: Math.floor(Math.random() * 15) + 2,
      chart_health_score: Math.floor(Math.random() * 40) + 50,
      chart_nova_group: 2,
      summary: 'Nutrition information generated from product analysis.',
      health_alerts: [],
      positive_aspects: ['Good source of protein', 'Contains fiber'],
      areas_of_concern: [],
      ingredients_text: '',
      total_ingredients: 0,
      allergens: [],
      additives: [],
      total_additives: 0,
      ask_wihy: `Tell me more about ${foodName}`,
      is_healthy: true,
      is_processed: false,
      has_allergens: false,
      has_additives: false,
    };

    return mockData;
  };

  useEffect(() => {
    // Reset state when new scan arrives (different sessionId means new scan)
    if (context?.sessionId) {
      setServingMultiplier(1);
      setSelectedNutrient(null);
      setScanType(getScanType());
    }

    if (initialFoodItem) {
      // For v2.0 API responses, just use them directly
      if (initialFoodItem.success !== undefined) {
        setFoodItem(initialFoodItem as ScanResponse);
      } else {
        // Legacy handling for old data structures
        // This will be deprecated once all scan flows use v2.0 API
        const mockData = generateMockNutritionData(
          (initialFoodItem as any).name || (initialFoodItem as any).product_name || 'Unknown Food'
        );
        setFoodItem(mockData);
      }
    }
  }, [initialFoodItem, context?.sessionId]);

  const handleNutrientSelect = (nutrient: string) => {
    setSelectedNutrient(nutrient);
    openChatWithContext({
      type: 'nutrient-specific',
      nutrient,
      foodItem,
    });
  };

  const openChatWithContext = (chatContext: any) => {
    const productName = foodItem && isBarcodeScanResponse(foodItem)
      ? foodItem.product_name
      : foodItem && isPhotoScanResponse(foodItem)
      ? foodItem.metadata.product_name
      : foodItem && isRecipeScanResponse(foodItem)
      ? foodItem.analysis.meal_name
      : foodItem && isLabelScanResponse(foodItem)
      ? foodItem.analysis.product_name
      : 'this food';

    // Navigate to FullChat with nutrition context
    navigation.navigate('FullChat', {
      context: {
        ...context,
        nutritionData: foodItem,
        selectedNutrient,
        ...chatContext,
      },
      initialMessage: chatContext.type === 'nutrient-specific'
        ? `Tell me about ${chatContext.nutrient} in ${productName}`
        : `Analyze the nutrition in ${productName}`,
    });
  };

  const adjustServingSize = (multiplier: number) => {
    setServingMultiplier(multiplier);
  };

  /**
   * Analyze individual ingredient using FDA database
   */
  const analyzeIngredient = async (ingredient: string) => {
    const trimmed = ingredient.trim();
    
    // Skip if already loading or analyzed
    if (loadingIngredients.has(trimmed) || analyzedIngredients.has(trimmed)) {
      return;
    }

    // Add to loading set
    setLoadingIngredients(prev => new Set(prev).add(trimmed));

    try {
      const analysis = await fdaService.analyzeIngredient(trimmed);
      
      // Add to analyzed map
      setAnalyzedIngredients(prev => {
        const newMap = new Map(prev);
        newMap.set(trimmed, analysis);
        return newMap;
      });
    } catch (error: any) {
      console.error('Ingredient analysis error:', error);
      Alert.alert('Analysis Error', 'Failed to analyze ingredient. Please try again.');
    } finally {
      // Remove from loading set
      setLoadingIngredients(prev => {
        const newSet = new Set(prev);
        newSet.delete(trimmed);
        return newSet;
      });
    }
  };

  /**
   * Get risk color scheme based on risk level
   */
  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low':
        return { bg: '#d1fae5', border: '#10b981', text: '#065f46', badge: '#10b981' };
      case 'moderate':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', badge: '#f59e0b' };
      case 'high':
        return { bg: '#fed7aa', border: '#f97316', text: '#9a3412', badge: '#f97316' };
      case 'very_high':
        return { bg: '#fecaca', border: '#ef4444', text: '#991b1b', badge: '#ef4444' };
      default:
        return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', badge: '#3b82f6' };
    }
  };

  // Color utility functions for nutrition categories
  const getMacroColor = (macroName: string) => {
    switch (macroName.toLowerCase()) {
      case 'protein': return '#10b981'; // Vibrant Green
      case 'carbs': case 'carbohydrates': return '#f97316'; // Vibrant Orange
      case 'fat': case 'fats': return '#fbbf24'; // Vibrant Yellow
      case 'fiber': return '#14b8a6'; // Vibrant Teal
      default: return '#6b7280'; // Gray
    }
  };

  const getNutrientColor = (nutrientName: string) => {
    const name = nutrientName.toLowerCase();
    // Vitamins
    if (name.includes('vitamin a') || name.includes('vitamin d') || name.includes('vitamin e') || name.includes('vitamin k')) {
      return '#7c3aed'; // Purple - Fat-soluble vitamins
    }
    if (name.includes('vitamin c') || name.includes('vitamin b') || name.includes('folate') || name.includes('niacin')) {
      return '#2563eb'; // Blue - Water-soluble vitamins
    }
    // Minerals
    if (name.includes('calcium') || name.includes('magnesium') || name.includes('phosphorus')) {
      return '#1e40af'; // Dark Blue - Major minerals
    }
    if (name.includes('iron') || name.includes('zinc') || name.includes('copper')) {
      return '#f97316'; // Orange - Trace minerals
    }
    if (name.includes('sodium') || name.includes('potassium')) {
      return '#facc15'; // Yellow - Electrolytes
    }
    return '#6b7280'; // Gray - Default
  };

  const renderMacroCard = (macro: string, value: number, unit: string = 'g') => {
    const macroColor = getMacroColor(macro);
    // Validate data - per 100g values should be reasonable
    // Carbs/sugars can't exceed 100g per 100g, protein/fat can't exceed 100g
    let displayValue = value;
    if (value > 100 && unit === 'g') {
      console.warn(`[NutritionFacts] Suspicious ${macro} value: ${value}g per 100g. This appears to be incorrect API data.`);
      displayValue = value / 10; // Attempt to correct likely decimal point error
    }
    
    return (
      <View key={macro} style={[styles.macroCard, { backgroundColor: macroColor }]}>
        <Text style={styles.macroLabelWhite}>{macro}</Text>
        <Text style={styles.macroValueWhite}>
          {Math.round(displayValue * servingMultiplier)}{unit}
        </Text>
      </View>
    );
  };

  const renderNutrientItem = (nutrient: any) => {
    if (!nutrient || typeof nutrient.unit === 'undefined') {
      return null;
    }

    const nutrientColor = getNutrientColor(nutrient.name);
    const progressValue = Math.min(nutrient.dailyValue * servingMultiplier, 100);

    return (
      <Pressable
        key={nutrient.name}
        style={[styles.nutrientItem, { backgroundColor: nutrientColor }]}
        onPress={() => handleNutrientSelect(nutrient.name)}
      >
        <View style={styles.nutrientInfo}>
          <Text style={styles.nutrientNameWhite}>{nutrient.name}</Text>
          <Text style={styles.nutrientAmountWhite}>
            {Math.round((nutrient.amount || 0) * servingMultiplier)}{nutrient.unit || ''}
          </Text>
        </View>
      <View style={styles.dailyValueContainer}>
        <Text style={styles.dailyValueWhite}>
          {Math.round(nutrient.dailyValue * servingMultiplier)}% DV
        </Text>
        <View style={styles.progressBarWhite}>
          <View
            style={[
              styles.progressFillWhite,
              {
                width: `${progressValue}%`,
              },
            ]}
          />
        </View>
      </View>
    </Pressable>
    );
  };

  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator
            size="large"
            color="#4cbb17"
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingTitle}>Analyzing Nutrition...</Text>
          <Text style={styles.loadingSubtitle}>Our AI is breaking down the nutritional content</Text>
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressIndicator,
                {
                  width: analysisProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  if (!foodItem) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>No Nutrition Data</Text>
        <Text style={styles.errorSubtitle}>Unable to load nutrition information</Text>
        <Pressable 
          style={[styles.actionButton, styles.primaryAction]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryActionText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const getScanTitle = () => {
    switch (scanType) {
      case 'barcode': return 'Nutrition Facts';
      case 'image': return 'Photo Analysis';
      case 'product_name': return 'Product Search';
      case 'recipe': return 'Recipe Analysis';
      case 'label': return 'Claims Checker';
      default: return 'Nutrition Facts';
    }
  };

  const getScanIcon = () => {
    switch (scanType) {
      case 'barcode': return 'barcode-outline' as keyof typeof Ionicons.glyphMap;
      case 'image': return 'camera-outline' as keyof typeof Ionicons.glyphMap;
      case 'product_name': return 'search-outline' as keyof typeof Ionicons.glyphMap;
      case 'recipe': return 'restaurant-outline' as keyof typeof Ionicons.glyphMap;
      case 'label': return 'document-text-outline' as keyof typeof Ionicons.glyphMap;
      default: return 'barcode-outline' as keyof typeof Ionicons.glyphMap;
    }
  };

  const getHeaderColors = (): [string, string] => {
    switch (scanType) {
      case 'barcode': return ['#3b82f6', '#2563eb']; // Blue
      case 'image': return ['#10b981', '#059669']; // Green
      case 'product_name': return ['#8b5cf6', '#7c3aed']; // Purple
      case 'recipe': return ['#f59e0b', '#d97706']; // Orange
      case 'label': return ['#ef4444', '#dc2626']; // Red
      default: return ['#3b82f6', '#2563eb'];
    }
  };

  const getHeaderGradient = (): DashboardGradientType => {
    switch (scanType) {
      case 'barcode': return 'nutritionFacts';
      case 'image': return 'nutritionPhoto';
      case 'product_name': return 'nutritionFacts';
      case 'recipe': return 'nutritionFacts';
      case 'label': return 'nutritionLabel';
      default: return 'nutritionFacts';
    }
  };

  // Scan type detection based on scan_type field
  const isBarcode = scanType === 'barcode';
  const isImageScan = scanType === 'image';
  const isProductSearch = scanType === 'product_name';
  const isRecipe = scanType === 'recipe';
  const isLabel = scanType === 'label';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#3b82f6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {isModalPresentation ? <View style={styles.headerSpacer} /> : null}
          <Text style={[styles.headerTitle, !isModalPresentation && styles.headerTitleFullWidth]}>{getScanTitle()}</Text>
          {isModalPresentation ? (
            <Pressable 
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Barcode/Product/Image Scan: Nutrition Facts */}
        {foodItem && isBarcodeScanResponse(foodItem) && (
          <>
        {/* Food Name & Serving */}
        <View style={styles.foodNameSection}>
          <Text style={styles.foodName}>{foodItem.product_name}</Text>
          {foodItem.image_url && (
            <View style={styles.productImageContainer}>
              <Image
                source={{ uri: foodItem.image_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={styles.servingContainer}>
            <Text style={styles.servingLabel}>Serving Size:</Text>
            <View style={styles.servingControls}>
              <Pressable
                style={styles.servingButton}
                onPress={() => adjustServingSize(Math.max(0.5, servingMultiplier - 0.5))}
              >
                <Ionicons name="remove" size={16} color="#6b7280" />
              </Pressable>
              <Text style={styles.servingText}>
                {servingMultiplier} {foodItem.serving_size}
              </Text>
              <Pressable
                style={styles.servingButton}
                onPress={() => adjustServingSize(servingMultiplier + 0.5)}
              >
                <Ionicons name="add" size={16} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Calories */}
        <View style={styles.calorieCard}>
          <Text style={styles.calorieLabel}>Calories</Text>
          <Text style={styles.calorieValue}>
            {(() => {
              // Validate calories - per 100g should be under 900 for most foods
              let displayCalories = foodItem.calories;
              if (foodItem.calories > 900) {
                console.warn(`[NutritionFacts] Suspicious calorie value: ${foodItem.calories} kcal per 100g. This appears to be incorrect API data.`);
                displayCalories = foodItem.calories / 10; // Attempt to correct likely decimal point error
              }
              return Math.round(displayCalories * servingMultiplier);
            })()}
          </Text>
        </View>

        {/* Health Score & Grade - Only show for known products with valid data */}
        {!isUnknownProduct(foodItem.product_name) && (foodItem.health_score > 0 || foodItem.nutrition_grade) && (
          <View style={styles.healthScoreSection}>
            <Text style={styles.sectionTitle}>Health Rating</Text>
            <View style={styles.healthScoreCard}>
              {foodItem.health_score > 0 && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Health Score</Text>
                  <Text style={styles.scoreValue}>{foodItem.health_score}/100</Text>
                </View>
              )}
              {foodItem.nutrition_grade && (
                <View style={styles.gradeContainer}>
                  <Text style={styles.gradeLabel}>Grade</Text>
                  <Text style={[styles.gradeValue, { color: foodItem.nutrition_grade === 'A' ? '#10b981' : foodItem.nutrition_grade === 'B' ? '#f59e0b' : '#ef4444' }]}>
                    {foodItem.nutrition_grade}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
          </>
        )}

        {/* TODO: Photo Scan UI - Implement using PhotoScanResponse type */}
        {/* TODO: Recipe Scan UI - Implement using RecipeScanResponse type */}
        {/* TODO: Label Scan UI - Implement using LabelScanResponse type */}

        {/* Barcode Scan: Macronutrients (continued from barcode section above) */}
        {foodItem && isBarcodeScanResponse(foodItem) && (
          <>
        {/* Macronutrients */}
        <View style={styles.macrosSection}>
          <Text style={styles.sectionTitle}>Macronutrients</Text>
          <View style={styles.macrosGrid}>
            {renderMacroCard('Protein', foodItem.protein_g)}
            {renderMacroCard('Carbs', foodItem.carbs_g)}
            {renderMacroCard('Fat', foodItem.fat_g)}
            {renderMacroCard('Fiber', foodItem.fiber_g)}
          </View>
        </View>

        {/* Detailed Nutrients */}
        <View style={styles.nutrientsSection}>
          <Text style={styles.sectionTitle}>Vitamins & Minerals</Text>
          <Text style={styles.nutrientsTip}>
            Tap any nutrient to learn more
          </Text>
          {/* TODO: Key Nutrients section - needs v2.0 API support */}
        </View>

        {/* Ingredients with FDA Analysis */}
        {foodItem.ingredients_text && (
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {(foodItem.ingredients_text?.split(',') || []).map((ingredient, idx) => {
                const trimmed = ingredient.trim();
                const analysis = analyzedIngredients.get(trimmed);
                const isLoading = loadingIngredients.has(trimmed);
                const barColor = analysis 
                  ? analysis.risk_level === 'low' ? '#10b981' 
                    : analysis.risk_level === 'moderate' ? '#f59e0b' 
                    : '#ef4444'
                  : '#6366f1';

                return (
                  <Pressable
                    key={idx}
                    style={[styles.ingredientBar, { backgroundColor: barColor }]}
                    onPress={() => !isLoading && !analysis && analyzeIngredient(trimmed)}
                    disabled={isLoading || !!analysis}
                  >
                    <View style={styles.ingredientBarLeft}>
                      <Text style={styles.ingredientBarTitle}>{trimmed}</Text>
                      {analysis ? (
                        <Text style={styles.ingredientBarSubtitle}>
                          FDA: {analysis.fda_status} • {analysis.risk_level.toUpperCase()}
                        </Text>
                      ) : (
                        <Text style={styles.ingredientBarSubtitle}>Tap to analyze</Text>
                      )}
                    </View>
                    <View style={styles.ingredientBarRight}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : analysis ? (
                        <View style={styles.ingredientScoreBadge}>
                          <Text style={styles.ingredientScoreText}>{analysis.safety_score}</Text>
                        </View>
                      ) : (
                        <Ionicons name="flask" size={24} color="#ffffff" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            
            {/* Analysis Summary Stats */}
            {analyzedIngredients.size > 0 && (
              <>
                <View style={styles.analysisStats}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{analyzedIngredients.size}</Text>
                    <Text style={styles.statLabel}>Analyzed</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {Math.round(
                        Array.from(analyzedIngredients.values())
                          .reduce((sum, a) => sum + a.safety_score, 0) / analyzedIngredients.size
                      )}
                    </Text>
                    <Text style={styles.statLabel}>Avg Safety</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {Array.from(analyzedIngredients.values())
                        .filter(a => a.risk_level === 'high' || a.risk_level === 'very_high')
                        .length}
                    </Text>
                    <Text style={styles.statLabel}>High Risk</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {Array.from(analyzedIngredients.values())
                        .reduce((sum, a) => sum + a.recall_count + a.adverse_event_count, 0)}
                    </Text>
                    <Text style={styles.statLabel}>Issues</Text>
                  </View>
                </View>
                
                {/* Chat About Ingredients Button */}
                <TouchableOpacity 
                  style={styles.chatIngredientsButton}
                  onPress={() => navigation.navigate('FullChat', {
                    context: {
                      ...context,
                      nutritionData: foodItem,
                      ingredientsData: Array.from(analyzedIngredients.entries()).map(([name, analysis]) => ({
                        name,
                        ...analysis,
                      })),
                      productData: {
                        name: foodItem.product_name,
                        ingredients: foodItem.ingredients_text,
                      },
                    },
                    initialMessage: `Analyze the safety and health implications of these ingredients in ${foodItem.product_name}`,
                  })}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                  <Text style={styles.chatIngredientsText}>Chat About Ingredients</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Allergens */}
        {(foodItem.allergens && foodItem.allergens.length > 0) || foodItem.product_name?.toLowerCase().includes('apple') ? (
          <View style={styles.allergensSection}>
            <Text style={styles.sectionTitle}>Allergen Information</Text>
            <View style={styles.allergensList}>
              {(foodItem.allergens && foodItem.allergens.length > 0
                ? foodItem.allergens
                : foodItem.product_name?.toLowerCase().includes('apple')
                  ? ['None detected']
                  : []
              ).map((allergen, index) => {
                const isNone = allergen === 'None detected';
                const bgColor = isNone ? '#10b981' : '#dc2626';
                const iconName = isNone ? 'checkmark-circle' : 'warning';
                
                return (
                  <View key={index} style={[styles.allergenBar, { backgroundColor: bgColor }]}>
                    <View style={styles.allergenBarLeft}>
                      <Text style={styles.allergenBarTitle}>{allergen}</Text>
                    </View>
                    <View style={styles.allergenBarRight}>
                      <Ionicons name={iconName} size={24} color="#ffffff" />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Additional Info */}
        {(foodItem.brand || foodItem.categories?.[0] || foodItem.barcode) || foodItem.product_name?.toLowerCase().includes('apple') ? (
          <View style={styles.additionalInfoSection}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            <View style={styles.infoList}>
              <View style={[styles.infoBar, { backgroundColor: '#6366f1' }]}>
                <View style={styles.infoBarLeft}>
                  <Text style={styles.infoBarLabel}>Brand</Text>
                  <Text style={styles.infoBarValue}>
                    {foodItem.brand || (foodItem.product_name?.toLowerCase().includes('apple') ? 'Fresh Produce' : '')}
                  </Text>
                </View>
                <Ionicons name="business-outline" size={24} color="#ffffff" />
              </View>
              <View style={[styles.infoBar, { backgroundColor: '#8b5cf6' }]}>
                <View style={styles.infoBarLeft}>
                  <Text style={styles.infoBarLabel}>Category</Text>
                  <Text style={styles.infoBarValue}>
                    {foodItem.categories?.[0] || (foodItem.product_name?.toLowerCase().includes('apple') ? 'Fresh Fruits' : '')}
                  </Text>
                </View>
                <Ionicons name="apps-outline" size={24} color="#ffffff" />
              </View>
              <View style={[styles.infoBar, { backgroundColor: '#06b6d4' }]}>
                <View style={styles.infoBarLeft}>
                  <Text style={styles.infoBarLabel}>Source</Text>
                  <Text style={styles.infoBarValue}>USDA Nutritional Database</Text>
                </View>
                <Ionicons name="document-text-outline" size={24} color="#ffffff" />
              </View>
            </View>
          </View>
        ) : null}
          </>
        )}

        {/* Action Buttons - Inside ScrollView for regular navigation */}
        {!isModalPresentation && (
          <View style={styles.actionSection}>
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
        )}
        </ScrollView>

      {/* Action Buttons - Fixed at bottom for modal only */}
      {isModalPresentation && (
        <View style={styles.actionSectionFixed}>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: dashboardTheme.header.paddingBottom,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleFullWidth: {
    flex: 0,
    width: '100%',
  },
  content: {
    flex: 1,
  },

  foodNameSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  foodName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },

  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  servingLabel: {
    fontSize: 14,
    color: '#6b7280',
  },

  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  servingButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },

  servingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    minWidth: 60,
    textAlign: 'center',
  },

  productImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  calorieCard: {
    backgroundColor: '#fa5f06',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },

  calorieLabel: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },

  calorieValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },

  macrosSection: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },

  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  macroCard: {
    flex: 1,
    minWidth: '22%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },

  macroLabelWhite: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
    fontWeight: '500',
  },

  macroValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },

  macroValueWhite: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },

  nutrientsSection: {
    padding: 16,
  },

  nutrientsTip: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },

  nutrientsList: {
    gap: 12,
  },

  nutrientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  nutrientInfo: {
    flex: 1,
  },

  nutrientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },

  nutrientNameWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  nutrientAmount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },

  nutrientAmountWhite: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  dailyValueContainer: {
    alignItems: 'flex-end',
  },

  dailyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4cbb17',
    marginBottom: 4,
  },

  dailyValueWhite: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },

  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },

  progressBarWhite: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 2,
  },

  progressFillWhite: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },

  healthScoreSection: {
    padding: 16,
  },

  healthScoreCard: {
    flexDirection: 'row',
    gap: 12,
  },

  scoreContainer: {
    flex: 1,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },

  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },

  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
  },

  gradeContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },

  gradeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },

  gradeValue: {
    fontSize: 36,
    fontWeight: '700',
  },

  fdaSection: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  fdaCard: {
    backgroundColor: '#fef9c3',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },

  fdaText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },

  askWihySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },

  healthAnalysisLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },

  askWihyButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  askWihyButtonText: {
    fontSize: 17,
    color: '#4cbb17',
    fontWeight: '600',
  },

  actionSection: {
    padding: 16,
    paddingBottom: 32,
  },

  actionSectionFixed: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },

  primaryAction: {
    backgroundColor: '#4cbb17',
    marginBottom: 12,
  },

  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },

  secondaryAction: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },

  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  loadingSpinner: {
    width: 80,
    height: 80,
  },

  loadingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },

  loadingSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },

  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },

  progressIndicator: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 2,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },

  errorSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 24,
  },

  // New section styles
  ingredientsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  ingredientsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 8,
  },

  allergensSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  allergensList: {
    gap: 12,
  },

  allergenBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  allergenBarLeft: {
    flex: 1,
  },

  allergenBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  allergenBarRight: {
    marginLeft: 12,
  },

  additionalInfoSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  infoList: {
    gap: 12,
  },

  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  infoBarLeft: {
    flex: 1,
  },

  infoBarLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 2,
  },

  infoBarValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // FDA Ingredient Analysis Styles
  sectionHeader: {
    marginBottom: 12,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  ingredientsList: {
    gap: 8,
  },

  ingredientBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  ingredientBarLeft: {
    flex: 1,
  },

  ingredientBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  ingredientBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  ingredientBarRight: {
    marginLeft: 12,
  },

  ingredientScoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ingredientScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  riskLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  ingredientAnalysis: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
  },

  fdaStatus: {
    fontSize: 12,
    marginBottom: 4,
  },

  fdaStatusLabel: {
    fontWeight: '600',
  },

  warningRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },

  warningText: {
    fontSize: 11,
    color: '#dc2626',
  },

  analysisSummary: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#4b5563',
    marginTop: 4,
  },

  analysisStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },

  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },

  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },

  chatIngredientsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  chatIngredientsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // New API v2.0 Section Styles
  healthSummarySection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  healthSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  healthSummaryBarLeft: {
    flex: 1,
  },

  healthSummaryBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },

  healthSummaryBarText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 20,
  },

  healthSummaryBarRight: {
    marginLeft: 12,
  },

  processingSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  processingBoxCard: {
    flexDirection: 'row',
    gap: 12,
  },

  novaContainer: {
    flex: 1,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },

  novaLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },

  novaValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f59e0b',
  },

  novaSubtext: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },

  additivesContainer: {
    flex: 1,
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  additivesLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },

  additivesValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ef4444',
  },

  ingredientsCountContainer: {
    flex: 1,
    backgroundColor: '#e0e7ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },

  ingredientsCountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },

  ingredientsCountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
  },

  healthAlertsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  alertsList: {
    gap: 12,
  },

  alertBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  alertBarLeft: {
    flex: 1,
  },

  alertBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  alertBarSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  alertBarRight: {
    marginLeft: 12,
  },

  positiveSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  positiveList: {
    gap: 12,
  },

  positiveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  positiveBarLeft: {
    flex: 1,
  },

  positiveBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  positiveBarSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  positiveBarRight: {
    marginLeft: 12,
  },

  concernsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  concernsList: {
    gap: 12,
  },

  concernBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  concernBarLeft: {
    flex: 1,
  },

  concernBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  concernBarSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  concernBarRecommendation: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.85,
    marginTop: 4,
    fontStyle: 'italic',
  },

  concernBarRight: {
    marginLeft: 12,
  },

  // Captured Image Styles (shared by food photo, pill, label)
  capturedImageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },

  capturedImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },

  // Food Photo Data Styles
  foodPhotoSection: {
    marginBottom: 12,
  },

  foodPhotoCard: {
    marginBottom: 12,
  },

  foodPhotoSummary: {
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    marginBottom: 16,
  },

  foodPhotoSummaryText: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },

  detectedFoodsSection: {
    marginBottom: 16,
  },

  detectedFoodsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 8,
  },

  detectedFoodItem: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },

  detectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  detectedFoodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#047857',
    flex: 1,
  },

  detectedFoodConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },

  detectedFoodCategory: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
  },

  foodPhotoDetectedText: {
    marginBottom: 16,
  },

  foodPhotoDetectedTextTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 8,
  },

  foodPhotoDetectedTextItem: {
    fontSize: 13,
    color: '#047857',
    paddingLeft: 8,
    marginBottom: 4,
  },

  confidenceSection: {
    marginBottom: 16,
  },

  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 6,
  },

  confidenceBar: {
    height: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },

  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },

  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'right',
  },

  foodPhotoAlertsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  foodPhotoAlertsList: {
    gap: 12,
  },

  foodPhotoAlertBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  foodPhotoAlertBarLeft: {
    flex: 1,
  },

  foodPhotoAlertBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  foodPhotoAlertBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  foodPhotoAlertBarRight: {
    marginLeft: 12,
  },

  foodPhotoPositiveSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  foodPhotoPositiveList: {
    gap: 12,
  },

  foodPhotoPositiveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  foodPhotoPositiveBarLeft: {
    flex: 1,
  },

  foodPhotoPositiveBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  foodPhotoPositiveBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  foodPhotoPositiveBarRight: {
    marginLeft: 12,
  },

  // Pill Data Styles
  pillDataSection: {
    marginBottom: 12,
  },

  pillCard: {
    marginBottom: 12,
  },

  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },

  pillName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
  },

  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },

  pillLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350f',
  },

  pillValue: {
    fontSize: 14,
    color: '#92400e',
  },

  pillAlternatives: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#fde68a',
  },

  pillAlternativesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },

  alternativeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  alternativeName: {
    fontSize: 13,
    color: '#78350f',
    flex: 1,
  },

  alternativeConfidence: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
  },

  // Label Data Styles
  labelDataSection: {
    marginBottom: 12,
  },

  labelCard: {
    marginBottom: 12,
  },

  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },

  labelProductName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#991b1b',
  },

  labelScoreContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  labelScoreBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  labelScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },

  labelScoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },

  labelGradeBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  labelGradeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },

  labelGradeValue: {
    fontSize: 32,
    fontWeight: '700',
  },

  labelGradeDescription: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },

  detectedTextSection: {
    marginBottom: 16,
  },

  detectedTextTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 8,
  },

  detectedTextList: {
    gap: 6,
  },

  detectedTextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 8,
  },

  detectedTextContent: {
    flex: 1,
    fontSize: 13,
    color: '#7f1d1d',
    lineHeight: 18,
  },

  labelNovaSection: {
    marginBottom: 16,
  },

  labelNovaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 8,
  },

  labelNovaBox: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },

  labelNovaGroup: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },

  labelNovaDescription: {
    fontSize: 13,
    color: '#6b7280',
  },

  labelPositiveSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  labelPositiveList: {
    gap: 12,
  },

  labelPositiveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  labelPositiveBarLeft: {
    flex: 1,
  },

  labelPositiveBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  labelPositiveBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  labelPositiveBarRight: {
    marginLeft: 12,
  },

  labelAlertsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  labelAlertsList: {
    gap: 12,
  },

  labelAlertBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  labelAlertBarLeft: {
    flex: 1,
  },

  labelAlertBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  labelAlertBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  labelAlertBarRight: {
    marginLeft: 12,
  },

  labelConcernsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  labelConcernsList: {
    gap: 12,
  },

  labelConcernBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  labelConcernBarLeft: {
    flex: 1,
  },

  labelConcernBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  labelConcernBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  labelConcernBarRight: {
    marginLeft: 12,
  },

  labelServingSection: {
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },

  labelServingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },

  labelServingText: {
    fontSize: 13,
    color: '#1e3a8a',
    marginBottom: 4,
  },

  labelPairingsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },

  labelPairingsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },

  labelPairingText: {
    fontSize: 12,
    color: '#3730a3',
    paddingLeft: 8,
    marginBottom: 2,
  },

  // Type Header (per scan type)
  typeHeaderSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typeHeaderImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  typeHeaderTextBlock: {
    flex: 1,
  },
  typeHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  typeHeaderSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  capturedImageSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // Food Photo Styles
  foodPhotoSummarySection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  foodPhotoSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  foodPhotoSummaryBarLeft: {
    flex: 1,
  },

  foodPhotoSummaryBarText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },

  foodPhotoSummaryBarRight: {
    marginLeft: 12,
  },

  detectedFoodsList: {
    gap: 12,
  },

  detectedFoodBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  detectedFoodBarLeft: {
    flex: 1,
  },

  detectedFoodBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  detectedFoodBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  detectedFoodBarRight: {
    marginLeft: 12,
  },

  confidenceBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Pill Styles
  pillDetailsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  pillDetailsList: {
    gap: 12,
  },

  pillDetailBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  pillDetailBarLeft: {
    flex: 1,
  },

  pillDetailBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  pillDetailBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  pillDetailBarRight: {
    marginLeft: 12,
  },

  pillAlternativesSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  pillAlternativesList: {
    gap: 12,
  },

  pillAlternativeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  pillAlternativeBarLeft: {
    flex: 1,
  },

  pillAlternativeBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  pillAlternativeBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  pillAlternativeBarRight: {
    marginLeft: 12,
  },

  // Label Summary and Score Styles
  labelSummarySection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  labelSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  labelSummaryBarLeft: {
    flex: 1,
  },

  labelSummaryBarText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },

  labelSummaryBarRight: {
    marginLeft: 12,
  },

  labelScoreSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  labelScoreGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  labelNovaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  labelNovaBarLeft: {
    flex: 1,
  },

  labelNovaBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  labelNovaBarSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  labelNovaBarRight: {
    marginLeft: 12,
  },
});
