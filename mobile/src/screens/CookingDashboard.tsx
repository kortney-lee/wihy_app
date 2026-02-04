import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from '../components/shared/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { mealCalendarService, CalendarDay, GeneratedMeal, MealSlot } from '../services/mealCalendarService';
import { mealService } from '../services/mealService';
import { getMealDetails } from '../services/mealPlanService';
import { requireUserId } from '../utils/authGuards';

interface CookingDashboardProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

// Meal type icons and colors
const mealTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  breakfast: { icon: 'sunny-outline', color: '#f59e0b', bgColor: '#fef3c7' },
  lunch: { icon: 'restaurant-outline', color: '#3b82f6', bgColor: '#dbeafe' },
  dinner: { icon: 'moon-outline', color: '#8b5cf6', bgColor: '#ede9fe' },
  snack: { icon: 'cafe-outline', color: '#10b981', bgColor: '#d1fae5' },
  'pre-workout': { icon: 'fitness-outline', color: '#f59e0b', bgColor: '#fef3c7' },
  'post-workout': { icon: 'fitness-outline', color: '#10b981', bgColor: '#d1fae5' },
};

const CookingDashboard: React.FC<CookingDashboardProps> = ({ isDashboardMode = false, onBack }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 180;
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // State
  interface ScheduledMealWithDetails {
    schedule_id: number;
    meal_id: string;
    meal_slot: MealSlot;
    servings: number;
    is_completed: boolean;
    notes?: string;
    meal: {
      name: string;
      mealType: string;
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
      };
      // Extended details from getMealDetails
      ingredients?: { name: string; amount?: number; unit?: string }[];
      instructions?: string[];
      prepTime?: number;
      cookTime?: number;
      totalTime?: number;
      difficulty?: string;
      cuisineType?: string;
      dietaryRestrictions?: string[];
      tags?: string[];
    };
  }

  const [meals, setMeals] = useState<ScheduledMealWithDetails[]>([]);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMealDetails, setLoadingMealDetails] = useState<Record<string, boolean>>({});

  const getRequiredUserId = useCallback(
    (action: string) =>
      requireUserId(userId, {
        context: `CookingDashboard.${action}`,
        onError: (message) => setError(message),
        showAlert: true,
      }),
    [userId]
  );

  // Load today's meals with full details
  const loadTodaysMeals = useCallback(async (isRefresh = false) => {
    const resolvedUserId = getRequiredUserId('loadTodaysMeals');
    if (!resolvedUserId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      console.log('[CookingDashboard] Loading meals for', today);

      // Use getMealsForDate for single day - more efficient
      const dayData = await mealCalendarService.getMealsForDate(resolvedUserId, today);

      if (dayData && dayData.meals && dayData.meals.length > 0) {
        console.log('[CookingDashboard] Loaded', dayData.meals.length, 'scheduled meals');
        
        // Fetch full details for each meal in parallel
        const mealsWithDetails = await Promise.all(
          dayData.meals.map(async (scheduledMeal) => {
            try {
              // Try to get full meal details
              const fullMeal = await getMealDetails(scheduledMeal.meal_id);
              return {
                ...scheduledMeal,
                meal: {
                  ...scheduledMeal.meal,
                  ...fullMeal,
                  // Ensure nutrition is preserved
                  nutrition: fullMeal?.nutrition || scheduledMeal.meal.nutrition,
                  // Map API fields to our expected format
                  ingredients: fullMeal?.ingredients || [],
                  instructions: fullMeal?.instructions || fullMeal?.cooking_instructions || [],
                  prepTime: fullMeal?.prepTime || fullMeal?.prep_time || fullMeal?.preparation_time || 0,
                  cookTime: fullMeal?.cookTime || fullMeal?.cook_time || fullMeal?.cooking_time || 0,
                  difficulty: fullMeal?.difficulty || 'medium',
                },
              };
            } catch (err) {
              console.warn('[CookingDashboard] Could not fetch details for meal:', scheduledMeal.meal_id, err);
              return scheduledMeal;
            }
          })
        );
        
        setMeals(mealsWithDetails);
      } else {
        console.log('[CookingDashboard] No meals found for today');
        setMeals([]);
      }
    } catch (err) {
      console.error('[CookingDashboard] Error loading meals:', err);
      setError('Failed to load meals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getRequiredUserId]);

  useEffect(() => {
    if (userId) {
      loadTodaysMeals();
    }
  }, [userId, loadTodaysMeals]);

  const onRefresh = useCallback(() => {
    loadTodaysMeals(true);
  }, [loadTodaysMeals]);

  const toggleMealExpanded = async (mealId: string) => {
    if (expandedMealId === mealId) {
      setExpandedMealId(null);
      return;
    }
    
    // Set expanded
    setExpandedMealId(mealId);
    
    // If meal doesn't have full details, fetch them
    const meal = meals.find(m => m.meal_id === mealId);
    if (meal && (!meal.meal.instructions || meal.meal.instructions.length === 0)) {
      setLoadingMealDetails(prev => ({ ...prev, [mealId]: true }));
      try {
        const fullMeal = await getMealDetails(mealId);
        if (fullMeal) {
          setMeals(prev => prev.map(m => {
            if (m.meal_id === mealId) {
              return {
                ...m,
                meal: {
                  ...m.meal,
                  ...fullMeal,
                  nutrition: fullMeal?.nutrition || m.meal.nutrition,
                  ingredients: fullMeal?.ingredients || [],
                  instructions: fullMeal?.instructions || fullMeal?.cooking_instructions || [],
                  prepTime: fullMeal?.prepTime || fullMeal?.prep_time || fullMeal?.preparation_time || 0,
                  cookTime: fullMeal?.cookTime || fullMeal?.cook_time || fullMeal?.cooking_time || 0,
                  difficulty: fullMeal?.difficulty || 'medium',
                },
              };
            }
            return m;
          }));
        }
      } catch (err) {
        console.warn('[CookingDashboard] Error fetching meal details on expand:', err);
      } finally {
        setLoadingMealDetails(prev => ({ ...prev, [mealId]: false }));
      }
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderMealCard = (scheduledMeal: ScheduledMealWithDetails, index: number) => {
    const meal = scheduledMeal.meal;
    const mealId = scheduledMeal.meal_id || `meal-${index}`;
    const isExpanded = expandedMealId === mealId;
    const isLoadingDetails = loadingMealDetails[mealId] || false;
    const mealSlot = scheduledMeal.meal_slot || 'lunch';
    const config = mealTypeConfig[mealSlot] || mealTypeConfig.lunch;

    // Use real data from API
    const instructions = meal?.instructions || [];
    const ingredients = meal?.ingredients || [];
    const prepTime = meal?.prepTime || 0;
    const cookTime = meal?.cookTime || 0;
    const totalTime = meal?.totalTime || prepTime + cookTime;
    const servings = scheduledMeal.servings || 2;
    const difficulty = meal?.difficulty || 'medium';
    const mealName = meal?.name || 'Meal';
    const nutrition = meal?.nutrition;

    return (
      <View
        key={mealId}
        style={[styles.mealCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      >
        {/* Meal Header */}
        <TouchableOpacity
          style={styles.mealHeader}
          onPress={() => toggleMealExpanded(mealId)}
          activeOpacity={0.7}
        >
          <View style={[styles.mealIcon, { backgroundColor: config.bgColor }]}>
            <SvgIcon name={config.icon} size={24} color={config.color} />
          </View>
          <View style={styles.mealInfo}>
            <Text style={[styles.mealSlot, { color: config.color }]}>
              {mealSlot.toUpperCase()}
            </Text>
            <Text style={[styles.mealName, { color: theme.colors.text }]}>
              {mealName}
            </Text>
            <View style={styles.mealMeta}>
              {totalTime > 0 && (
                <View style={styles.metaItem}>
                  <SvgIcon name="time-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    {formatTime(totalTime)}
                  </Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <SvgIcon name="flame-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {nutrition?.calories || 0} cal
                </Text>
              </View>
              <View style={styles.metaItem}>
                <SvgIcon name="people-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {servings} servings
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.expandIcon}>
            <SvgIcon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {isLoadingDetails ? (
              <View style={styles.loadingDetailsContainer}>
                <ActivityIndicator size="small" color="#ef4444" />
                <Text style={[styles.loadingDetailsText, { color: theme.colors.textSecondary }]}>
                  Loading cooking instructions...
                </Text>
              </View>
            ) : (
              <>
                {/* Quick Stats - only show if we have timing data */}
                {(prepTime > 0 || cookTime > 0) && (
                  <View style={[styles.statsRow, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Prep</Text>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {prepTime > 0 ? formatTime(prepTime) : '-'}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Cook</Text>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {cookTime > 0 ? formatTime(cookTime) : '-'}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Difficulty</Text>
                      <Text style={[styles.statValue, { color: theme.colors.text, textTransform: 'capitalize' }]}>
                        {difficulty}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Ingredients */}
                {ingredients.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <SvgIcon name="list-outline" size={18} color="#10b981" />
                      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Ingredients ({ingredients.length})
                      </Text>
                    </View>
                    <View style={styles.ingredientsList}>
                      {ingredients.map((ing: any, idx: number) => (
                        <View key={idx} style={styles.ingredientRow}>
                          <View style={[styles.ingredientBullet, { backgroundColor: '#10b981' }]} />
                          <Text style={[styles.ingredientText, { color: theme.colors.text }]}>
                            {ing.amount ? `${ing.amount} ` : ''}{ing.unit ? `${ing.unit} ` : ''}{ing.name || ing}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Cooking Instructions */}
                {instructions.length > 0 ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <SvgIcon name="book-outline" size={18} color="#3b82f6" />
                      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Cooking Instructions
                      </Text>
                    </View>
                    <View style={styles.instructionsList}>
                      {instructions.map((instruction: string, idx: number) => (
                        <View key={idx} style={styles.instructionRow}>
                          <View style={[styles.stepNumber, { backgroundColor: '#3b82f6' }]}>
                            <Text style={styles.stepNumberText}>{idx + 1}</Text>
                          </View>
                          <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                            {instruction}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <View style={styles.noInstructionsContainer}>
                      <SvgIcon name="document-text-outline" size={32} color={theme.colors.textSecondary} />
                      <Text style={[styles.noInstructionsText, { color: theme.colors.textSecondary }]}>
                        No cooking instructions available for this meal
                      </Text>
                    </View>
                  </View>
                )}

                {/* Nutrition Summary */}
                {nutrition && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <SvgIcon name="nutrition-outline" size={18} color="#f59e0b" />
                      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Nutrition per Serving
                      </Text>
                    </View>
                    <View style={styles.nutritionGrid}>
                      <View style={[styles.nutritionItem, { backgroundColor: '#fef3c7' }]}>
                        <Text style={[styles.nutritionValue, { color: '#f59e0b' }]}>
                          {Math.round(nutrition.calories || 0)}
                        </Text>
                        <Text style={styles.nutritionLabel}>Calories</Text>
                      </View>
                      <View style={[styles.nutritionItem, { backgroundColor: '#dbeafe' }]}>
                        <Text style={[styles.nutritionValue, { color: '#3b82f6' }]}>
                          {Math.round(nutrition.protein || 0)}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                      </View>
                      <View style={[styles.nutritionItem, { backgroundColor: '#d1fae5' }]}>
                        <Text style={[styles.nutritionValue, { color: '#10b981' }]}>
                          {Math.round(nutrition.carbs || 0)}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                      </View>
                      <View style={[styles.nutritionItem, { backgroundColor: '#ede9fe' }]}>
                        <Text style={[styles.nutritionValue, { color: '#8b5cf6' }]}>
                          {Math.round(nutrition.fat || 0)}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Fat</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#ef4444' }} />

      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#ef4444' }]}>
        <Animated.View
          style={[
            styles.headerContent,
            { opacity: headerOpacity, transform: [{ scale: titleScale }] },
          ]}
        >
          <Text style={styles.headerTitle}>Cooking Guide</Text>
          <Text style={styles.headerSubtitle}>
            {loading
              ? 'Loading...'
              : meals.length > 0
              ? `${meals.length} meal${meals.length === 1 ? '' : 's'} to cook today`
              : "No meals scheduled for today"}
          </Text>
          <View style={styles.headerBadge}>
            <SvgIcon name="flame" size={14} color="#ef4444" />
            <Text style={styles.headerBadgeText}>Ready to Cook</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ef4444"
            colors={['#ef4444']}
          />
        }
      >
        <View style={styles.contentPadding}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ef4444" />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading your meals...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <SvgIcon name="warning-outline" size={48} color="#ef4444" />
              <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadTodaysMeals()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : meals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SvgIcon name="restaurant-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No Meals Scheduled
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Create a meal plan to see cooking instructions here
              </Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {meals.map((meal, index) => renderMealCard(meal, index))}
            </View>
          )}
        </View>

        {/* Bottom spacing for safe area */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  collapsibleHeader: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  scrollContent: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  mealsList: {
    gap: 16,
  },
  mealCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealSlot: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  mealMeta: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  expandIcon: {
    padding: 4,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredientText: {
    fontSize: 14,
    flex: 1,
  },
  instructionsList: {
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionItem: {
    flex: 1,
    minWidth: 70,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingDetailsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  loadingDetailsText: {
    fontSize: 14,
  },
  noInstructionsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noInstructionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CookingDashboard;
