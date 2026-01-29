import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { getMealDetails } from '../services/mealPlanService';
import { mealService, ShoppingList } from '../services/mealService';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GradientDashboardHeader, Ionicons } from '../components/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'MealDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'MealDetails'>;

interface MealDetail {
  meal_id: string;
  name: string;
  description?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
  };
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
    category?: string;
  }>;
  instructions?: Array<{
    step: number;
    title?: string;
    text: string;
    duration?: string;
    timer?: boolean;
    temperature?: string;
  }>;
  tags: string[];
  notes?: string;
  preparation_time?: number;
  cooking_time?: number;
  servings: number;
  is_favorite: boolean;
  cost_per_serving?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  meal_type?: string;
  image_url?: string;
  variations?: Array<{
    name: string;
    changes: string;
  }>;
  tips?: string[];
  storage?: string;
  reheating?: string;
}

export default function MealDetailsScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();

  const routeParams = route?.params;
  const { mealId } = routeParams || { mealId: null };

  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  
  // Servings adjuster
  const [servings, setServings] = useState(1);
  const originalServings = meal?.servings || 1;
  
  // Cooking mode
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Shopping list
  const [creatingList, setCreatingList] = useState(false);

  useEffect(() => {
    loadMealDetails();
  }, [mealId]);

  useEffect(() => {
    if (meal) {
      setServings(meal.servings);
    }
  }, [meal]);

  const loadMealDetails = async () => {
    setLoading(true);
    try {
      const mealData = await getMealDetails(mealId);
      setMeal(mealData);
    } catch (error) {
      console.error('Error loading meal details:', error);
      Alert.alert('Error', 'Failed to load meal details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Calculate adjusted ingredient amounts based on servings
  const getAdjustedAmount = (originalAmount: number): number => {
    if (!meal) return originalAmount;
    const ratio = servings / originalServings;
    const adjusted = originalAmount * ratio;
    // Round to reasonable decimal places
    return Math.round(adjusted * 100) / 100;
  };

  // Format nutrition value based on servings
  const getAdjustedNutrition = (value: number): number => {
    if (!meal) return value;
    const ratio = servings / originalServings;
    return Math.round(value * ratio);
  };

  // Generate shopping list from ingredients
  const handleGenerateShoppingList = async () => {
    if (!user?.id || !meal) {
      Alert.alert('Error', 'Please log in to create a shopping list');
      return;
    }

    setCreatingList(true);
    try {
      const shoppingListItems = meal.ingredients.map(ing => ({
        name: ing.name,
        quantity: getAdjustedAmount(ing.amount),
        unit: ing.unit,
        category: ing.category,
        checked: false,
      }));

      const list = await mealService.createShoppingList({
        userId: user.id,
        name: `Shopping List - ${meal.name}`,
        items: shoppingListItems,
      });

      Alert.alert(
        'Shopping List Created! 🛒',
        `${list.total_items} ingredients added to your shopping list`,
        [
          {
            text: 'View List',
            onPress: () => navigation.navigate('ShoppingList', {
              mealPlanId: 0,
              shoppingListData: {
                totalItems: list.total_items,
                itemsByCategory: list.items_by_category || {},
              },
            }),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error creating shopping list:', error);
      Alert.alert('Error', 'Failed to create shopping list');
    } finally {
      setCreatingList(false);
    }
  };

  // Handle cooking mode navigation
  const handleNextStep = () => {
    if (!meal?.instructions) return;
    if (currentStep < meal.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Completed
      Alert.alert(
        '🎉 Recipe Complete!',
        'You\'ve finished cooking! Enjoy your meal!',
        [{ text: 'Done', onPress: () => setCookingMode(false) }]
      );
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Start timer for cooking step
  const handleStartTimer = (duration: string) => {
    // Extract minutes from duration string like "5 min" or "15 minutes"
    const minutes = parseInt(duration.match(/\d+/)?.[0] || '0');
    Alert.alert(
      `⏱️ Timer Set`,
      `${minutes} minute timer started.\n\nNote: Full timer feature coming soon!`,
      [{ text: 'OK' }]
    );
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading meal details...</Text>
      </View>
    );
  }

  if (!meal) {
    return null;
  }

  // Render Cooking Mode
  if (cookingMode && meal.instructions && meal.instructions.length > 0) {
    const currentInstruction = meal.instructions[currentStep];
    return (
      <SafeAreaView style={styles.cookingModeContainer}>
        <LinearGradient
          colors={['#1f2937', '#111827']}
          style={styles.cookingModeGradient}
        >
          {/* Header */}
          <View style={styles.cookingModeHeader}>
            <TouchableOpacity onPress={() => setCookingMode(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cookingModeTitle}>Cooking Mode</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Progress */}
          <View style={styles.cookingProgress}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentStep + 1) / meal.instructions.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {meal.instructions.length}
            </Text>
          </View>

          {/* Current Step */}
          <ScrollView
            contentContainerStyle={styles.cookingStepContainer}
            showsVerticalScrollIndicator={false}
          >
            {currentInstruction.title && (
              <Text style={styles.cookingStepTitle}>{currentInstruction.title}</Text>
            )}
            
            <Text style={styles.cookingStepText}>{currentInstruction.text}</Text>

            {/* Timer Button */}
            {currentInstruction.duration && (
              <TouchableOpacity
                style={styles.timerButton}
                onPress={() => handleStartTimer(currentInstruction.duration!)}
              >
                <Ionicons name="timer-outline" size={24} color="#fff" />
                <Text style={styles.timerButtonText}>
                  Start {currentInstruction.duration} Timer
                </Text>
              </TouchableOpacity>
            )}

            {/* Temperature Indicator */}
            {currentInstruction.temperature && (
              <View style={styles.temperatureIndicator}>
                <Ionicons name="thermometer-outline" size={20} color="#f59e0b" />
                <Text style={styles.temperatureText}>
                  Target: {currentInstruction.temperature}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.cookingNavigation}>
            <TouchableOpacity
              style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
              onPress={handlePrevStep}
              disabled={currentStep === 0}
            >
              <Ionicons name="arrow-back" size={24} color={currentStep === 0 ? '#4b5563' : '#fff'} />
              <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary]}
              onPress={handleNextStep}
            >
              <Text style={styles.navButtonTextPrimary}>
                {currentStep === meal.instructions.length - 1 ? 'Complete!' : 'Next'}
              </Text>
              <Ionicons
                name={currentStep === meal.instructions.length - 1 ? 'checkmark' : 'arrow-forward'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      
      {/* White Status Bar Area */}
      <SafeAreaView style={styles.statusBarBox} edges={['top']} />
      
      {/* Main Content */}
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        
        {/* Scrollable Content */}
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Inside ScrollView so it scrolls */}
          <GradientDashboardHeader
            title={meal.name}
            subtitle={meal.description}
            gradient="mealDetails"
            showBackButton
            onBackPress={() => navigation.goBack()}
            rightAction={{
              icon: meal.is_favorite ? 'heart' : 'heart-outline',
              onPress: () => {},
            }}
            style={styles.header}
          >
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Ionicons name="flame" size={16} color="#fff" />
                <Text style={styles.headerStatText}>
                  {getAdjustedNutrition(meal.nutrition.calories)} cal
                </Text>
              </View>
              {(meal.preparation_time || meal.cooking_time) && (
                <View style={styles.headerStat}>
                  <Ionicons name="time" size={16} color="#fff" />
                  <Text style={styles.headerStatText}>
                    {(meal.preparation_time || 0) + (meal.cooking_time || 0)} min
                  </Text>
                </View>
              )}
              {meal.difficulty && (
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(meal.difficulty) }]}>
                  <Text style={styles.difficultyText}>{meal.difficulty}</Text>
                </View>
              )}
            </View>
          </GradientDashboardHeader>

        {/* Servings Adjuster */}
        <View style={styles.servingsCard}>
            <Text style={styles.servingsLabel}>Adjust Servings</Text>
            <View style={styles.servingsControls}>
              <TouchableOpacity
                style={[styles.servingsButton, servings <= 1 && styles.servingsButtonDisabled]}
                onPress={() => setServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
              >
                <Ionicons name="remove" size={24} color={servings <= 1 ? '#d1d5db' : '#1f2937'} />
              </TouchableOpacity>
              
              <View style={styles.servingsValueContainer}>
                <Text style={styles.servingsValue}>{servings}</Text>
                <Text style={styles.servingsUnit}>servings</Text>
              </View>
              
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => setServings(servings + 1)}
              >
                <Ionicons name="add" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            {servings !== originalServings && (
              <Text style={styles.servingsNote}>
                Original recipe: {originalServings} servings
              </Text>
            )}
          </View>

          {/* Nutrition Card */}
          <View style={styles.nutritionCard}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <Text style={styles.nutritionSubtitle}>Per {servings} serving{servings > 1 ? 's' : ''}</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {getAdjustedNutrition(meal.nutrition.calories)}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {getAdjustedNutrition(meal.nutrition.protein)}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {getAdjustedNutrition(meal.nutrition.carbs)}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {getAdjustedNutrition(meal.nutrition.fat)}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
            
            {/* Macro Progress Bars */}
            <View style={styles.macroProgressContainer}>
              <View style={styles.macroProgressItem}>
                <View style={styles.macroProgressHeader}>
                  <Text style={styles.macroProgressLabel}>Protein</Text>
                  <Text style={styles.macroProgressPercent}>
                    {Math.round((meal.nutrition.protein * 4 / meal.nutrition.calories) * 100)}%
                  </Text>
                </View>
                <View style={styles.macroProgressBar}>
                  <View style={[styles.macroProgressFill, styles.proteinFill, { width: `${Math.min((meal.nutrition.protein * 4 / meal.nutrition.calories) * 100, 100)}%` }]} />
                </View>
              </View>
              <View style={styles.macroProgressItem}>
                <View style={styles.macroProgressHeader}>
                  <Text style={styles.macroProgressLabel}>Carbs</Text>
                  <Text style={styles.macroProgressPercent}>
                    {Math.round((meal.nutrition.carbs * 4 / meal.nutrition.calories) * 100)}%
                  </Text>
                </View>
                <View style={styles.macroProgressBar}>
                  <View style={[styles.macroProgressFill, styles.carbsFill, { width: `${Math.min((meal.nutrition.carbs * 4 / meal.nutrition.calories) * 100, 100)}%` }]} />
                </View>
              </View>
              <View style={styles.macroProgressItem}>
                <View style={styles.macroProgressHeader}>
                  <Text style={styles.macroProgressLabel}>Fat</Text>
                  <Text style={styles.macroProgressPercent}>
                    {Math.round((meal.nutrition.fat * 9 / meal.nutrition.calories) * 100)}%
                  </Text>
                </View>
                <View style={styles.macroProgressBar}>
                  <View style={[styles.macroProgressFill, styles.fatFill, { width: `${Math.min((meal.nutrition.fat * 9 / meal.nutrition.calories) * 100, 100)}%` }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Tags */}
          {meal.tags.length > 0 && (
            <View style={styles.tagsCard}>
              <View style={styles.tags}>
                {meal.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Time Info */}
          {(meal.preparation_time || meal.cooking_time) && (
            <View style={styles.timeCard}>
              {meal.preparation_time && (
                <View style={styles.timeItem}>
                  <Ionicons name="restaurant" size={20} color="#8b5cf6" />
                  <Text style={styles.timeLabel}>Prep Time</Text>
                  <Text style={styles.timeValue}>{meal.preparation_time} min</Text>
                </View>
              )}
              {meal.cooking_time && (
                <View style={styles.timeItem}>
                  <Ionicons name="flame" size={20} color="#f59e0b" />
                  <Text style={styles.timeLabel}>Cook Time</Text>
                  <Text style={styles.timeValue}>{meal.cooking_time} min</Text>
                </View>
              )}
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
              onPress={() => setActiveTab('ingredients')}
            >
              <Text
                style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}
              >
                Ingredients ({meal.ingredients.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'instructions' && styles.tabActive]}
              onPress={() => setActiveTab('instructions')}
            >
              <Text
                style={[styles.tabText, activeTab === 'instructions' && styles.tabTextActive]}
              >
                Instructions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ingredients Tab */}
          {activeTab === 'ingredients' && (
            <View style={styles.contentCard}>
              <View style={styles.contentHeader}>
                <Text style={styles.contentTitle}>Ingredients</Text>
                {servings !== originalServings && (
                  <View style={styles.adjustedBadge}>
                    <Text style={styles.adjustedBadgeText}>Adjusted</Text>
                  </View>
                )}
              </View>
              {meal.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientText}>
                    <Text style={styles.ingredientAmount}>
                      {getAdjustedAmount(ingredient.amount)} {ingredient.unit}
                    </Text>
                    {' '}{ingredient.name}
                    {ingredient.notes && (
                      <Text style={styles.ingredientNotes}> ({ingredient.notes})</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Instructions Tab */}
          {activeTab === 'instructions' && (
            <View style={styles.contentCard}>
              <View style={styles.contentHeader}>
                <Text style={styles.contentTitle}>Cooking Instructions</Text>
                {meal.instructions && meal.instructions.length > 0 && (
                  <TouchableOpacity
                    style={styles.cookingModeButton}
                    onPress={() => {
                      setCurrentStep(0);
                      setCookingMode(true);
                    }}
                  >
                    <Ionicons name="expand-outline" size={18} color="#8b5cf6" />
                    <Text style={styles.cookingModeButtonText}>Cooking Mode</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {meal.instructions && meal.instructions.length > 0 ? (
                meal.instructions.map((instruction) => (
                  <View key={instruction.step} style={styles.instructionRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{instruction.step}</Text>
                    </View>
                    <View style={styles.instructionContent}>
                      {instruction.title && (
                        <Text style={styles.instructionTitle}>{instruction.title}</Text>
                      )}
                      <Text style={styles.instructionText}>{instruction.text}</Text>
                      {instruction.duration && (
                        <View style={styles.instructionMeta}>
                          <Ionicons name="time-outline" size={14} color="#6b7280" />
                          <Text style={styles.instructionMetaText}>{instruction.duration}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : meal.notes ? (
                <Text style={styles.notesText}>{meal.notes}</Text>
              ) : (
                <View style={styles.noInstructions}>
                  <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                  <Text style={styles.noInstructionsText}>
                    No cooking instructions available
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tips Section */}
          {meal.tips && meal.tips.length > 0 && (
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Tips</Text>
              {meal.tips.map((tip, index) => (
                <Text key={index} style={styles.tipText}>• {tip}</Text>
              ))}
            </View>
          )}

          {/* Variations */}
          {meal.variations && meal.variations.length > 0 && (
            <View style={styles.variationsCard}>
              <Text style={styles.variationsTitle}>🔄 Variations</Text>
              {meal.variations.map((variation, index) => (
                <View key={index} style={styles.variationItem}>
                  <Text style={styles.variationName}>{variation.name}</Text>
                  <Text style={styles.variationChanges}>{variation.changes}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Storage Info */}
          {(meal.storage || meal.reheating) && (
            <View style={styles.storageCard}>
              <Text style={styles.storageTitle}>💾 Storage & Reheating</Text>
              {meal.storage && (
                <View style={styles.storageItem}>
                  <Ionicons name="cube-outline" size={18} color="#6b7280" />
                  <Text style={styles.storageText}>{meal.storage}</Text>
                </View>
              )}
              {meal.reheating && (
                <View style={styles.storageItem}>
                  <Ionicons name="flame-outline" size={18} color="#6b7280" />
                  <Text style={styles.storageText}>{meal.reheating}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert('Coming Soon', 'Add to meal plan feature coming soon!');
              }}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add to Meal Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleGenerateShoppingList}
              disabled={creatingList}
            >
              {creatingList ? (
                <ActivityIndicator color="#8b5cf6" size="small" />
              ) : (
                <>
                  <Ionicons name="cart" size={20} color="#8b5cf6" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                    Shopping List
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
      </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // White box for status bar area
  statusBarBox: {
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
  },
  // Main container
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background // Light blue background per design patterns
  },
  scrollView: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#fef3c7',
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerStatText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  
  // Servings Adjuster
  servingsCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  servingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  servingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonDisabled: {
    opacity: 0.5,
  },
  servingsValueContainer: {
    alignItems: 'center',
  },
  servingsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  servingsUnit: {
    fontSize: 12,
    color: '#9ca3af',
  },
  servingsNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  
  // Nutrition Card
  nutritionCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  nutritionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  macroProgressContainer: {
    gap: 12,
  },
  macroProgressItem: {},
  macroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroProgressLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  macroProgressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  macroProgressBar: {
    height: 8,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  proteinFill: {
    backgroundColor: '#ef4444',
  },
  carbsFill: {
    backgroundColor: '#3b82f6',
  },
  fatFill: {
    backgroundColor: '#f59e0b',
  },
  
  // Tags
  tagsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  
  // Time Card
  timeCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  timeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  tabActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  
  // Content Card
  contentCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  adjustedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adjustedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
  },
  cookingModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ede9fe',
    borderRadius: 8,
  },
  cookingModeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  
  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 8,
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  ingredientAmount: {
    fontWeight: '700',
  },
  ingredientNotes: {
    fontStyle: 'italic',
    color: '#6b7280',
  },
  
  // Instructions
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  instructionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  instructionMetaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  notesText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  noInstructions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noInstructionsText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  
  // Tips & Variations
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 22,
    marginBottom: 6,
  },
  variationsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  variationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5b21b6',
    marginBottom: 12,
  },
  variationItem: {
    marginBottom: 10,
  },
  variationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6d28d9',
    marginBottom: 2,
  },
  variationChanges: {
    fontSize: 14,
    color: '#7c3aed',
    lineHeight: 20,
  },
  
  // Storage
  storageCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    borderRadius: 12,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  storageText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  
  // Actions
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: '#8b5cf6',
  },
  bottomPadding: {
    height: 40,
  },
  
  // Cooking Mode
  cookingModeContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  cookingModeGradient: {
    flex: 1,
  },
  cookingModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cookingModeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cookingProgress: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  cookingStepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookingStepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 16,
    textAlign: 'center',
  },
  cookingStepText: {
    fontSize: 24,
    lineHeight: 36,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  temperatureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  temperatureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  cookingNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#f59e0b',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  navButtonTextDisabled: {
    color: '#4b5563',
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
