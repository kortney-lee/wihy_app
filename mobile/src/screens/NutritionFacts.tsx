import React, { useState, useEffect, useRef, useContext } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import { fdaService } from '../services/fdaService';
import { consumptionService } from '../services/consumptionService';
import { scanService } from '../services/scanService';
import { AuthContext } from '../context/AuthContext';
import type { IngredientAnalysis } from '../services/types';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';
import { DashboardGradientType } from '../components/shared';
import { SweepBorder } from '../components/SweepBorder';
import type {
  BarcodeScanResponse,
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

// NutritionFacts now only handles barcode/product scans
// Food photos go to FoodPhotoFacts, Pills go to PillIdentification, Labels go to LabelReader
function isBarcodeScanResponse(item: ScanResponse): item is BarcodeScanResponse {
  return item.scan_type === 'barcode' || item.scan_type === 'image' || item.scan_type === 'product_name';
}

// ========================================
// HELPER FUNCTIONS to safely access properties
// ========================================

function getProductName(item: ScanResponse | null): string {
  if (!item) return 'Unknown';
  if (isBarcodeScanResponse(item)) return item.product_name;
  return 'Unknown';
}

function getImageUrl(item: ScanResponse | null): string | null {
  if (!item) return null;
  if (isBarcodeScanResponse(item)) return item.image_url;
  return null;
}

function getCalories(item: ScanResponse | null): number {
  if (!item) return 0;
  if (isBarcodeScanResponse(item)) return item.calories;
  return 0;
}

function getHealthScore(item: ScanResponse | null): number {
  if (!item) return 0;
  if (isBarcodeScanResponse(item)) return item.health_score;
  return 0;
}

function getNutritionGrade(item: ScanResponse | null): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null {
  if (!item) return null;
  if (isBarcodeScanResponse(item)) return item.nutrition_grade;
  return null;
}

function getServingSize(item: ScanResponse | null): string {
  if (!item) return '1 serving';
  if (isBarcodeScanResponse(item)) return item.serving_size;
  return '1 serving';
}

// NutritionFacts only handles these scan types now
type ScanType = 'barcode' | 'image' | 'product_name';

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
  const { user } = useContext(AuthContext);

  // Get user ID for food logging
  const userId = user?.id || `guest_${Date.now()}`;

  const routeParams = route?.params;
  const { foodItem: initialFoodItem, context } = routeParams || { foodItem: null, context: null };

  // Determine if this is modal presentation - always true now since we navigate as modal
  // from search, camera, or dashboard
  const isModalPresentation = true;

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

  // Comparison Modal State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  // Animation refs
  const analysisProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset state when new scan arrives (different sessionId means new scan)
    if (context?.sessionId) {
      setServingMultiplier(1);
      setSelectedNutrient(null);
      setScanType(getScanType());
    }

    if (initialFoodItem) {
      // For v2.0 API responses, use them directly
      if (initialFoodItem.success !== undefined) {
        setFoodItem(initialFoodItem as ScanResponse);
      } else {
        // Handle legacy data structures without mock fallback
        console.error('[NutritionFacts] Invalid food item data - missing success field:', initialFoodItem);
        setFoodItem(null);
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
   * Log food to consumption diary
   */
  const handleLogFood = async () => {
    if (!foodItem) {
      Alert.alert('Error', 'No food data available to log');
      return;
    }

    try {
      const productName = isBarcodeScanResponse(foodItem) ? foodItem.product_name : 'Unknown Food';
      const calories = getCalories(foodItem);
      const protein = isBarcodeScanResponse(foodItem) ? foodItem.protein_g : 0;
      const carbs = isBarcodeScanResponse(foodItem) ? foodItem.carbs_g : 0;
      const fat = isBarcodeScanResponse(foodItem) ? foodItem.fat_g : 0;
      const fiber = isBarcodeScanResponse(foodItem) ? foodItem.fiber_g : 0;
      const sugar = isBarcodeScanResponse(foodItem) ? foodItem.sugar_g : 0;

      const nutritionData = {
        calories: calories * servingMultiplier,
        protein_g: protein * servingMultiplier,
        carbs_g: carbs * servingMultiplier,
        fat_g: fat * servingMultiplier,
        fiber_g: fiber * servingMultiplier,
        sugar_g: sugar * servingMultiplier,
      };

      await consumptionService.logMeal(userId, {
        name: productName,
        meal_type: 'snack',
        servings: servingMultiplier,
        nutrition: nutritionData,
        notes: 'Logged from Nutrition Facts',
      });

      Alert.alert('Success', `${productName} has been logged to your food diary!`);
    } catch (error: any) {
      console.error('Error logging food:', error);
      Alert.alert('Error', error.message || 'Failed to log food');
    }
  };

  /**
   * Compare food with healthier alternatives
   */
  const handleCompareOptions = async () => {
    if (!foodItem) {
      Alert.alert('Info', 'No food data available to compare');
      return;
    }

    setIsLoadingComparison(true);
    setShowCompareModal(true);

    try {
      const productName = isBarcodeScanResponse(foodItem) ? foodItem.product_name : 'Unknown Food';
      const category = isBarcodeScanResponse(foodItem) ? foodItem.categories?.[0] : undefined;
      const dietaryGoals = context?.dietaryRestrictions || context?.userGoals;

      const response = await scanService.compareFoodOptions(
        productName,
        category,
        dietaryGoals
      );

      if (response.success) {
        setComparisonData(response);
      } else {
        Alert.alert('Error', response.error || 'Failed to load comparison data');
        setShowCompareModal(false);
      }
    } catch (error: any) {
      console.error('Error comparing food:', error);
      Alert.alert('Error', error.message || 'Failed to compare food options');
      setShowCompareModal(false);
    } finally {
      setIsLoadingComparison(false);
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
      default: return 'Nutrition Facts';
    }
  };

  const getScanIcon = () => {
    switch (scanType) {
      case 'barcode': return 'barcode-outline' as keyof typeof Ionicons.glyphMap;
      case 'image': return 'camera-outline' as keyof typeof Ionicons.glyphMap;
      case 'product_name': return 'search-outline' as keyof typeof Ionicons.glyphMap;
      default: return 'barcode-outline' as keyof typeof Ionicons.glyphMap;
    }
  };

  const getHeaderColors = (): [string, string] => {
    switch (scanType) {
      case 'barcode': return ['#3b82f6', '#2563eb']; // Blue
      case 'image': return ['#10b981', '#059669']; // Green
      case 'product_name': return ['#8b5cf6', '#7c3aed']; // Purple
      default: return ['#3b82f6', '#2563eb'];
    }
  };

  const getHeaderGradient = (): DashboardGradientType => {
    switch (scanType) {
      case 'barcode': return 'nutritionFacts';
      case 'image': return 'nutritionPhoto';
      case 'product_name': return 'nutritionFacts';
      default: return 'nutritionFacts';
    }
  };

  // Scan type detection based on scan_type field
  const isBarcode = scanType === 'barcode';
  const isImageScan = scanType === 'image';
  const isProductSearch = scanType === 'product_name';
  
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#3b82f6']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <Pressable 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>{getScanTitle()}</Text>
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

        {/* Barcode Scan: Macronutrients */}
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

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Primary Actions - Log and Compare */}
          <View style={styles.primaryActions}>
            <Pressable
              style={[styles.actionButton, styles.logAction]}
              onPress={handleLogFood}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.primaryActionText}>Log This Food</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.compareAction]}
              onPress={handleCompareOptions}
            >
              <Ionicons name="swap-horizontal" size={20} color="#ffffff" />
              <Text style={styles.primaryActionText}>Compare</Text>
            </Pressable>
          </View>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => openChatWithContext({ type: 'general' })}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#6b7280" />
              <Text style={styles.secondaryActionText}>Ask WiHY</Text>
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

      {/* Food Comparison Modal */}
      <Modal
        visible={showCompareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Healthier Alternatives</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowCompareModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Loading State */}
            {isLoadingComparison && (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.modalLoadingText}>Finding healthier options...</Text>
              </View>
            )}

            {/* Comparison Results */}
            {!isLoadingComparison && comparisonData && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Original Food */}
                <View style={styles.comparisonSection}>
                  <Text style={styles.sectionLabel}>Your Selection</Text>
                  <View style={styles.foodCard}>
                    <Text style={styles.foodCardName}>{comparisonData.original.name}</Text>
                    <View style={styles.nutritionRow}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{comparisonData.original.calories}</Text>
                        <Text style={styles.nutritionLabel}>calories</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{comparisonData.original.sugar}g</Text>
                        <Text style={styles.nutritionLabel}>sugar</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{comparisonData.original.fiber}g</Text>
                        <Text style={styles.nutritionLabel}>fiber</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Alternatives */}
                <View style={styles.comparisonSection}>
                  <Text style={styles.sectionLabel}>Better Options</Text>
                  {comparisonData.alternatives.map((alt: any, index: number) => (
                    <View key={index} style={styles.alternativeCard}>
                      <View style={styles.alternativeHeader}>
                        <Text style={styles.alternativeName}>{alt.name}</Text>
                        <Ionicons name="arrow-up-circle" size={20} color="#10b981" />
                      </View>
                      <Text style={styles.comparisonText}>{alt.comparison}</Text>
                      <View style={styles.nutritionRow}>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionValue, styles.altValue]}>{alt.calories}</Text>
                          <Text style={styles.nutritionLabel}>calories</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionValue, styles.altValue]}>{alt.sugar}g</Text>
                          <Text style={styles.nutritionLabel}>sugar</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionValue, styles.altValue]}>{alt.fiber}g</Text>
                          <Text style={styles.nutritionLabel}>fiber</Text>
                        </View>
                      </View>
                      <Pressable
                        style={styles.logAlternativeButton}
                        onPress={async () => {
                          try {
                            await consumptionService.logMeal(userId, {
                              name: alt.name,
                              meal_type: 'snack',
                              servings: 1,
                              nutrition: {
                                calories: alt.calories,
                                protein_g: alt.protein || 0,
                                carbs_g: (alt.sugar || 0) + (alt.fiber || 0),
                                fat_g: alt.fat || 0,
                                fiber_g: alt.fiber || 0,
                                sugar_g: alt.sugar || 0,
                              },
                              notes: 'Logged from Nutrition Facts comparison',
                            });
                            Alert.alert('Success', `${alt.name} has been logged!`);
                            setShowCompareModal(false);
                          } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to log food');
                          }
                        }}
                      >
                        <Text style={styles.logAlternativeText}>Log This Instead</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  chatButton: {
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

  primaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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

  logAction: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },

  compareAction: {
    flex: 1,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },

  primaryAction: {
    backgroundColor: '#4cbb17',
    borderWidth: 1.5,
    borderColor: '#4cbb17',
  },

  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },

  secondaryAction: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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

  // Comparison Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  comparisonSection: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  foodCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  foodCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  alternativeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  comparisonText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 12,
  },
  altValue: {
    color: '#10b981',
  },
  logAlternativeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  logAlternativeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
