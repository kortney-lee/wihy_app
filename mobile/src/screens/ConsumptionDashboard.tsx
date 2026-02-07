import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientDashboardHeader, Ionicons, NotificationTile } from '../components/shared';
import { getDashboardTheme } from '../theme/dashboardTheme';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import {
  useDashboardNavigation,
  BaseDashboardProps,
  dashboardColors,
} from '../components/shared';
import { nutritionService, DailySummary } from '../services';
import { mealService, SavedMeal, MealTemplate, PlanMeal, CalendarDay } from '../services/mealService';
import { shoppingService, ShoppingList, ShoppingListItem } from '../services/shoppingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { requireUserId } from '../utils/authGuards';

interface ConsumptionDashboardProps extends BaseDashboardProps {
  period?: 'today' | 'week' | 'month';
  onUploadReceipt?: () => void;
}



interface NutritionGoals {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
  water: { current: number; target: number };
}

interface MealItem {
  id: string;
  name: string;
  calories: number;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  image?: string;
}

// Pending meal from meal plan or shopping
interface PendingMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduledTime?: string;
  source: 'meal_plan' | 'shopping';
  sourceId?: string; // programId or shoppingListId
  servingsAvailable?: number;
  isConfirmed?: boolean;
  isSkipped?: boolean;
}

// Recipe for browsing
interface BrowsableRecipe {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'user_created' | 'scanned' | 'template' | 'meal_plan';
  prepTime?: number;
  isFavorite?: boolean;
  timesLogged?: number;
  imageUrl?: string;
}

// Confirmation modal state
interface ConfirmationModal {
  visible: boolean;
  item: PendingMeal | BrowsableRecipe | null;
  servings: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const ConsumptionDashboard: React.FC<ConsumptionDashboardProps> = ({
  period = 'today',
  onAnalyze,
  onUploadReceipt,
}) => {
  const layout = useDashboardLayout();
  const { navigation, navigateToNutritionFacts } = useDashboardNavigation();
  const { userId } = useAuth();
  const { theme, isDark } = useTheme();
  const dashboardTheme = getDashboardTheme(isDark);
  
  const [selectedTab, setSelectedTab] = useState<'nutrition' | 'meals' | 'recipes' | 'shopping'>('nutrition');
  const [searchQuery, setSearchQuery] = useState('');
  const circularProgress = useRef(new Animated.Value(0)).current;
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
  const HEADER_MAX_HEIGHT = 140;
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
  
  // API State
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Meals Tab State (Pending meals for confirmation)
  const [pendingMeals, setPendingMeals] = useState<PendingMeal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  
  // Recipes Tab State (Browsable recipes)
  const [recipes, setRecipes] = useState<BrowsableRecipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'my_meals' | 'templates' | 'scanned'>('all');
  
  // Shopping Tab State
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmationModal>({
    visible: false,
    item: null,
    servings: 1,
    mealType: 'lunch',
  });

  // Load daily summary on mount
  useEffect(() => {
    loadDailySummary();
  }, []);
  
  // Load data when tab changes
  useEffect(() => {
    if (selectedTab === 'nutrition') {
      // Nutrition data is already loaded on mount, refresh if needed
      if (!dailySummary && !loading) {
        loadDailySummary();
      }
    } else if (selectedTab === 'meals') {
      loadPendingMeals();
    } else if (selectedTab === 'recipes') {
      loadRecipes();
    } else if (selectedTab === 'shopping') {
      loadShoppingLists();
    }
  }, [selectedTab]);

  // Load shopping lists
  const SHOPPING_LIST_STORAGE_KEY = '@wihy_shopping_list';
  
  const loadShoppingLists = useCallback(async () => {
    if (!userId) {
      console.log('[ConsumptionDashboard] No userId, skipping shopping list load');
      return;
    }
    
    setShoppingLoading(true);
    try {
      console.log('[ConsumptionDashboard] Loading shopping lists for userId:', userId);
      
      // Try API first
      const lists = await shoppingService.getUserLists(userId);
      console.log('[ConsumptionDashboard] API response:', lists?.length, lists);
      
      if (Array.isArray(lists) && lists.length > 0) {
        setShoppingLists(lists);
        return;
      }
      
      // Fallback: Check AsyncStorage (same key CreateMeals uses)
      console.log('[ConsumptionDashboard] No API results, checking AsyncStorage...');
      const stored = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert local format to ShoppingList format
        const totalItems = Object.values(parsed).flat().length;
        console.log('[ConsumptionDashboard] Found in AsyncStorage:', totalItems, 'items');
        
        if (totalItems > 0) {
          // Convert to ShoppingList format
          const localList: ShoppingList = {
            list_id: 'local-shopping-list',
            user_id: userId,
            name: 'My Shopping List',
            items: Object.entries(parsed).flatMap(([category, items]: [string, any]) => 
              items.map((item: any) => ({
                name: item.item_name || item.name,
                category: category as any,
                quantity: item.quantity,
                checked: item.checked || false,
              }))
            ),
            total_items: totalItems,
            checked_items: Object.values(parsed).flat().filter((item: any) => item.checked).length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setShoppingLists([localList]);
          return;
        }
      }
      
      // No lists found
      console.log('[ConsumptionDashboard] No shopping lists found in API or storage');
      setShoppingLists([]);
      
    } catch (err) {
      console.error('Error loading shopping lists:', err);
      setShoppingLists([]);
    } finally {
      setShoppingLoading(false);
    }
  }, [userId]);

  const loadDailySummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const resolvedUserId = requireUserId(userId, {
        context: 'ConsumptionDashboard.loadDailySummary',
        onError: (message) => setError(message),
        showAlert: false,
      });
      if (!resolvedUserId) return;
      const data = await nutritionService.getDailySummary(resolvedUserId);
      setDailySummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load nutrition data';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDailySummary();
    setRefreshing(false);
  };

  const handleLogWater = async () => {
    try {
      const resolvedUserId = requireUserId(userId, {
        context: 'ConsumptionDashboard.handleLogWater',
        showAlert: true,
      });
      if (!resolvedUserId) return;
      await nutritionService.logWater({ userId: resolvedUserId, amountMl: 250 }); // 1 glass = 250ml
      await loadDailySummary();
    } catch (err) {
      Alert.alert('Error', 'Could not log water');
    }
  };

  // Load pending meals from meal plans and shopping
  const loadPendingMeals = useCallback(async () => {
    if (!userId) return;
    
    setMealsLoading(true);
    try {
      const pending: PendingMeal[] = [];
      
      // 1. Get user's active meal plans
      const mealPlans = await mealService.getUserMealPlans(userId);
      const activePlan = mealPlans.find(p => p.is_active);
      
      if (activePlan) {
        // Get today's meals from the active plan
        const today = new Date();
        const dayNumber = Math.ceil(
          (today.getTime() - new Date(activePlan.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        
        if (dayNumber <= activePlan.duration_days) {
          try {
            const dayPlan = await mealService.getMealPlanDay(activePlan.program_id, dayNumber);
            
            dayPlan.meals.forEach((meal: PlanMeal) => {
              pending.push({
                id: `plan-${meal.meal_id}`,
                name: meal.meal_name,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                mealType: meal.meal_type as any,
                scheduledTime: getMealTypeTime(meal.meal_type),
                source: 'meal_plan',
                sourceId: activePlan.program_id,
                isConfirmed: false,
                isSkipped: false,
              });
            });
          } catch (e) {
            console.log('Could not fetch day plan:', e);
          }
        }
      }
      
      // 2. Get shopping list items with nutrition (as available food)
      // TODO: Implement shopping list integration when user has shopping list ID
      // const lists = await shoppingService.getUserLists(userId);
      
      setPendingMeals(pending);
    } catch (err) {
      console.error('Error loading pending meals:', err);
      // Show empty state - no mock data
      setPendingMeals([]);
    } finally {
      setMealsLoading(false);
    }
  }, [userId]);

  // Load recipes for browsing
  const loadRecipes = useCallback(async () => {
    if (!userId) return;
    
    setRecipesLoading(true);
    try {
      const browsable: BrowsableRecipe[] = [];
      
      // 1. Get user's saved meals
      const userMealsResult = await mealService.getUserMeals(userId, { limit: 50 });
      userMealsResult.meals.forEach((meal: SavedMeal) => {
        browsable.push({
          id: meal.meal_id,
          name: meal.name,
          calories: meal.nutrition.calories,
          protein: meal.nutrition.protein,
          carbs: meal.nutrition.carbs,
          fat: meal.nutrition.fat,
          source: 'user_created',
          prepTime: meal.preparation_time,
          isFavorite: meal.is_favorite,
          timesLogged: meal.times_logged,
          imageUrl: meal.image_url,
        });
      });
      
      // 2. Get meal templates
      const templates = await mealService.getTemplates();
      templates.forEach((template: MealTemplate) => {
        browsable.push({
          id: template.template_id,
          name: template.name,
          calories: template.nutrition.calories,
          protein: template.nutrition.protein,
          carbs: template.nutrition.carbs,
          fat: template.nutrition.fat,
          source: 'template',
          prepTime: template.preparation_time,
          isFavorite: false,
          imageUrl: template.image_url,
        });
      });
      
      setRecipes(browsable);
    } catch (err) {
      console.error('Error loading recipes:', err);
      // Show empty state - no mock data
      setRecipes([]);
    } finally {
      setRecipesLoading(false);
    }
  }, [userId]);

  // Get scheduled time based on meal type
  const getMealTypeTime = (mealType: string): string => {
    switch (mealType) {
      case 'breakfast': return '8:00 AM';
      case 'lunch': return '12:30 PM';
      case 'dinner': return '7:00 PM';
      case 'snack': return '3:30 PM';
      default: return '12:00 PM';
    }
  };

  // Open confirmation modal
  const openConfirmModal = (item: PendingMeal | BrowsableRecipe, mealType?: string) => {
    setConfirmModal({
      visible: true,
      item,
      servings: 1,
      mealType: (mealType || (item as PendingMeal).mealType || 'lunch') as any,
    });
  };

  // Confirm and log meal
  const handleConfirmMeal = async () => {
    if (!confirmModal.item || !userId) return;
    
    try {
      // Log to nutrition service
      await nutritionService.logMeal({
        userId,
        mealType: confirmModal.mealType,
        foodName: confirmModal.item.name,
        calories: Math.round(confirmModal.item.calories * confirmModal.servings),
        protein_g: Math.round(confirmModal.item.protein * confirmModal.servings),
        carbs_g: Math.round(confirmModal.item.carbs * confirmModal.servings),
        fat_g: Math.round(confirmModal.item.fat * confirmModal.servings),
        servings: confirmModal.servings,
      });
      
      // Update pending meals if from meal plan
      if ('source' in confirmModal.item && confirmModal.item.source === 'meal_plan') {
        setPendingMeals(prev => 
          prev.map(m => 
            m.id === confirmModal.item?.id 
              ? { ...m, isConfirmed: true } 
              : m
          )
        );
      }
      
      // Refresh daily summary
      await loadDailySummary();
      
      setConfirmModal({ visible: false, item: null, servings: 1, mealType: 'lunch' });
      Alert.alert('Success', `${confirmModal.item.name} logged!`);
    } catch (err) {
      Alert.alert('Error', 'Could not log meal');
    }
  };

  // Skip a pending meal
  const handleSkipMeal = (mealId: string) => {
    setPendingMeals(prev => 
      prev.map(m => m.id === mealId ? { ...m, isSkipped: true } : m)
    );
  };

  // Filter recipes based on selected filter
  const filteredRecipes = useMemo(() => {
    if (recipeFilter === 'all') return recipes;
    const sourceMap: Record<string, string> = {
      'my_meals': 'user_created',
      'templates': 'template',
      'scanned': 'scanned',
    };
    return recipes.filter(r => r.source === sourceMap[recipeFilter]);
  }, [recipes, recipeFilter]);

  // Filter recipes by search query
  const searchFilteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return filteredRecipes;
    return filteredRecipes.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredRecipes, searchQuery]);

  // Use API data if available, fallback to defaults
  const nutritionGoals: NutritionGoals = dailySummary ? {
    calories: { current: dailySummary.totals.calories, target: dailySummary.goals.calories },
    protein: { current: dailySummary.totals.protein_g, target: dailySummary.goals.protein_g },
    carbs: { current: dailySummary.totals.carbs_g, target: dailySummary.goals.carbs_g },
    fat: { current: dailySummary.totals.fat_g, target: dailySummary.goals.fat_g },
    water: { current: Math.floor(dailySummary.water_ml / 250), target: Math.floor(dailySummary.water_goal_ml / 250) },
  } : {
    calories: { current: 1847, target: 2200 },
    protein: { current: 98, target: 120 },
    carbs: { current: 156, target: 200 },
    fat: { current: 67, target: 85 },
    water: { current: 6, target: 8 },
  };

  // Use API data if available, fallback to defaults
  const todaysMeals: MealItem[] = dailySummary?.meals.map((meal, index) => ({
    id: (meal as any).id || `meal-${index}`,
    name: meal.food_name,
    calories: meal.calories,
    time: new Date(meal.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    type: meal.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    macros: {
      protein: (meal as any).protein_g || 0,
      carbs: (meal as any).carbs_g || 0,
      fat: (meal as any).fat_g || 0,
    },
  })) || [
    {
      id: '1',
      name: 'Greek Yogurt with Berries',
      calories: 245,
      time: '8:00 AM',
      type: 'breakfast',
      macros: { protein: 18, carbs: 28, fat: 6 },
    },
    {
      id: '2',
      name: 'Grilled Chicken Salad',
      calories: 387,
      time: '1:00 PM',
      type: 'lunch',
      macros: { protein: 35, carbs: 15, fat: 18 },
    },
    {
      id: '3',
      name: 'Protein Smoothie',
      calories: 195,
      time: '3:30 PM',
      type: 'snack',
      macros: { protein: 25, carbs: 12, fat: 4 },
    },
    {
      id: '4',
      name: 'Salmon with Quinoa',
      calories: 456,
      time: '7:00 PM',
      type: 'dinner',
      macros: { protein: 32, carbs: 48, fat: 18 },
    },
  ];

  const getMacroColor = (macro: string) => {
    switch (macro) {
      case 'protein':
        return dashboardTheme.colors.error;
      case 'carbs':
        return dashboardTheme.colors.warning;
      case 'fat':
        return dashboardTheme.colors.secondary;
      default:
        return dashboardTheme.colors.textSecondary;
    }
  };

  const getMealTypeColor = (type: MealItem['type']) => {
    switch (type) {
      case 'breakfast':
        return dashboardTheme.colors.warning;
      case 'lunch':
        return dashboardTheme.colors.primary;
      case 'dinner':
        return dashboardTheme.colors.secondary;
      case 'snack':
        return dashboardTheme.colors.accent;
      default:
        return dashboardTheme.colors.textSecondary;
    }
  };

  const getMealTypeIcon = (type: MealItem['type']) => {
    switch (type) {
      case 'breakfast':
        return 'sunny';
      case 'lunch':
        return 'partly-sunny';
      case 'dinner':
        return 'moon';
      case 'snack':
        return 'cafe';
      default:
        return 'restaurant';
    }
  };

  const renderCircularProgress = (current: number, target: number, size: number = 120) => {
    const percentage = Math.min((current / target) * 100, 100);
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
        <View style={styles.circularProgress}>
          <View style={[styles.circularProgressTrack, {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          }]} />
          <View style={[styles.circularProgressFill, {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            transform: [{ rotate: '-90deg' }],
            borderColor: 'transparent',
            borderTopColor: dashboardTheme.colors.primary,
            borderRightColor: percentage > 25 ? dashboardTheme.colors.primary : 'transparent',
            borderBottomColor: percentage > 50 ? dashboardTheme.colors.primary : 'transparent',
            borderLeftColor: percentage > 75 ? dashboardTheme.colors.primary : 'transparent',
          }]} />
        </View>
        <View style={styles.circularProgressText}>
          <Text style={[styles.caloriesValue, { color: theme.colors.text }]}>{current}</Text>
          <Text style={[styles.caloriesTarget, { color: theme.colors.textSecondary }]}>/ {target}</Text>
          <Text style={[styles.caloriesLabel, { color: theme.colors.textSecondary }]}>calories</Text>
        </View>
      </View>
    );
  };

  const renderMacroBar = (macro: keyof typeof nutritionGoals, label: string) => {
    const data = nutritionGoals[macro as keyof NutritionGoals];
    const percentage = Math.min((data.current / data.target) * 100, 100);

    return (
      <View style={styles.macroBar} key={macro}>
        <View style={styles.macroHeader}>
          <Text style={[styles.macroLabel, { color: theme.colors.text }]}>{label}</Text>
          <Text style={[styles.macroValue, { color: theme.colors.textSecondary }]}>{data.current}g / {data.target}g</Text>
        </View>
        <View style={styles.macroProgressBackground}>
          <View
            style={[
              styles.macroProgressFill,
              {
                width: `${percentage}%`,
                backgroundColor: getMacroColor(macro),
              },
            ]}
          />
        </View>
        <Text style={[styles.macroPercentage, { color: theme.colors.textSecondary }]}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  const renderMealItem = ({ item }: { item: MealItem }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => navigateToNutritionFacts({
        name: item.name,
        calories: item.calories,
        protein: item.macros.protein,
        carbs: item.macros.carbs,
        fat: item.macros.fat,
        fiber: 2,
        sugar: 8,
        sodium: 5,
        unit: 'g',
        analyzed: true,
      })}
    >
      <View style={styles.mealLeft}>
        <View style={[
          styles.mealIcon,
          { backgroundColor: getMealTypeColor(item.type) + '20' },
        ]}>
          <Ionicons
            name={getMealTypeIcon(item.type) as any}
            size={20}
            color={getMealTypeColor(item.type)}
          />
        </View>
        <View style={styles.mealContent}>
          <Text style={[styles.mealName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.mealTime, { color: theme.colors.textSecondary }]}>{item.time}</Text>
          <View style={styles.macroTags}>
            <Text style={styles.macroTag}>P: {item.macros.protein}g</Text>
            <Text style={styles.macroTag}>C: {item.macros.carbs}g</Text>
            <Text style={styles.macroTag}>F: {item.macros.fat}g</Text>
          </View>
        </View>
      </View>
      <View style={styles.mealRight}>
        <Text style={[styles.mealCalories, { color: theme.colors.text }]}>{item.calories}</Text>
        <Text style={[styles.mealCaloriesLabel, { color: theme.colors.textSecondary }]}>cal</Text>
      </View>
    </TouchableOpacity>
  );



  // Render a pending meal item with confirmation buttons
  const renderPendingMealItem = (meal: PendingMeal) => {
    if (meal.isConfirmed || meal.isSkipped) return null;
    
    return (
      <View key={meal.id} style={[styles.pendingMealCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.pendingMealHeader}>
          <View style={[
            styles.mealTypeIndicator,
            { backgroundColor: getMealTypeColor(meal.mealType) + '20' }
          ]}>
            <Ionicons
              name={getMealTypeIcon(meal.mealType) as any}
              size={16}
              color={getMealTypeColor(meal.mealType)}
            />
            <Text style={[styles.mealTypeLabel, { color: getMealTypeColor(meal.mealType) }]}>
              {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
            </Text>
          </View>
          {meal.scheduledTime && (
            <Text style={[styles.scheduledTime, { color: theme.colors.textSecondary }]}>{meal.scheduledTime}</Text>
          )}
        </View>
        
        <Text style={[styles.pendingMealName, { color: theme.colors.text }]}>{meal.name}</Text>
        
        <View style={styles.pendingMealNutrition}>
          <Text style={styles.pendingMealCalories}>{meal.calories} cal</Text>
          <View style={styles.pendingMealMacros}>
            <Text style={[styles.macroText, { color: theme.colors.textSecondary }]}>P: {meal.protein}g</Text>
            <Text style={[styles.macroText, { color: theme.colors.textSecondary }]}>C: {meal.carbs}g</Text>
            <Text style={[styles.macroText, { color: theme.colors.textSecondary }]}>F: {meal.fat}g</Text>
          </View>
        </View>
        
        <View style={styles.pendingMealSource}>
          <Ionicons 
            name={meal.source === 'meal_plan' ? 'calendar' : 'cart'} 
            size={12} 
            color={theme.colors.textSecondary} 
          />
          <Text style={[styles.sourceText, { color: theme.colors.textSecondary }]}>
            From: {meal.source === 'meal_plan' ? "Today's Meal Plan" : 'Shopping List'}
          </Text>
        </View>
        
        <View style={styles.confirmationButtons}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => openConfirmModal(meal)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.confirmButtonText}>I Ate This</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleSkipMeal(meal.id)}
          >
            <Ionicons name="close-circle-outline" size={18} color={dashboardTheme.colors.textSecondary} />
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modifyButton}
            onPress={() => openConfirmModal(meal)}
          >
            <Ionicons name="create-outline" size={18} color={dashboardTheme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render a recipe card for browsing
  const renderRecipeCard = (recipe: BrowsableRecipe) => (
    <TouchableOpacity
      key={recipe.id}
      style={[styles.recipeCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => openConfirmModal(recipe)}
    >
      <View style={styles.recipeCardHeader}>
        {recipe.isFavorite && (
          <Ionicons name="heart" size={16} color={dashboardTheme.colors.error} />
        )}
        <View style={[
          styles.sourceTag,
          { backgroundColor: getSourceColor(recipe.source) + '20' }
        ]}>
          <Text style={[styles.sourceTagText, { color: getSourceColor(recipe.source) }]}>
            {getSourceLabel(recipe.source)}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.recipeName, { color: theme.colors.text }]} numberOfLines={2}>{recipe.name}</Text>
      
      <View style={styles.recipeNutrition}>
        <Text style={styles.recipeCalories}>{recipe.calories} cal</Text>
        <View style={styles.recipeMacros}>
          <Text style={[styles.macroSmall, { color: theme.colors.textSecondary }]}>P: {recipe.protein}g</Text>
          <Text style={[styles.macroSmall, { color: theme.colors.textSecondary }]}>C: {recipe.carbs}g</Text>
          <Text style={[styles.macroSmall, { color: theme.colors.textSecondary }]}>F: {recipe.fat}g</Text>
        </View>
      </View>
      
      {recipe.prepTime && (
        <View style={styles.recipeTime}>
          <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
          <Text style={[styles.recipeTimeText, { color: theme.colors.textSecondary }]}>{recipe.prepTime} min</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.logRecipeButton}
        onPress={() => openConfirmModal(recipe)}
      >
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={styles.logRecipeButtonText}>Log</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Get source color
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'user_created': return dashboardTheme.colors.primary;
      case 'template': return dashboardTheme.colors.secondary;
      case 'scanned': return dashboardTheme.colors.warning;
      case 'meal_plan': return dashboardTheme.colors.accent;
      default: return dashboardTheme.colors.textSecondary;
    }
  };

  // Get source label
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'user_created': return 'My Meal';
      case 'template': return 'Template';
      case 'scanned': return 'Scanned';
      case 'meal_plan': return 'Plan';
      default: return source;
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'nutrition':
        return (
          <View>
            {/* Calorie Summary */}
            <View style={[styles.nutritionSummary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              {renderCircularProgress(nutritionGoals.calories.current, nutritionGoals.calories.target)}
              <View style={styles.macroBreakdown}>
                {renderMacroBar('protein', 'Protein')}
                {renderMacroBar('carbs', 'Carbs')}
                {renderMacroBar('fat', 'Fat')}
              </View>
            </View>

            {/* Hydration */}
            <View style={[styles.hydrationSection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.hydrationHeader}>
                <Text style={[styles.hydrationTitle, { color: theme.colors.text }]}>Hydration</Text>
                <TouchableOpacity
                  style={styles.addWaterButton}
                  onPress={handleLogWater}
                >
                  <Ionicons name="add-circle" size={24} color={dashboardTheme.colors.primary} />
                  <Text style={styles.addWaterText}>Add Water</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.hydrationProgress}>
                <View style={styles.waterGlasses}>
                  {Array.from({ length: 8 }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waterGlass,
                        i < nutritionGoals.water.current && styles.waterGlassFilled,
                      ]}
                    >
                      <Ionicons
                        name="water"
                        size={16}
                        color={i < nutritionGoals.water.current ? dashboardTheme.colors.primary : dashboardTheme.colors.border}
                      />
                    </View>
                  ))}
                </View>
                <Text style={[styles.hydrationText, { color: theme.colors.textSecondary }]}>
                  {nutritionGoals.water.current} / {nutritionGoals.water.target} glasses
                </Text>
              </View>
            </View>
          </View>
        );
      
      case 'meals':
        // Pending meals confirmation flow
        const activePendingMeals = pendingMeals.filter(m => !m.isConfirmed && !m.isSkipped);
        
        return (
          <View>
            <View style={styles.mealsHeader}>
              <Text style={[styles.mealsTitle, { color: theme.colors.text }]}>Today's Meals</Text>
              <Text style={styles.mealsPending}>
                {activePendingMeals.length} pending
              </Text>
            </View>
            
            {mealsLoading ? (
              <ActivityIndicator size="small" color={dashboardTheme.colors.primary} />
            ) : activePendingMeals.length === 0 ? (
              <View style={styles.emptyMeals}>
                <Ionicons name="checkmark-done-circle" size={48} color={dashboardTheme.colors.primary} />
                <Text style={[styles.emptyMealsTitle, { color: theme.colors.text }]}>All caught up!</Text>
                <Text style={[styles.emptyMealsText, { color: theme.colors.textSecondary }]}>
                  No pending meals to confirm. Check Recipes tab to log something new.
                </Text>
              </View>
            ) : (
              <View style={styles.pendingMealsList}>
                {pendingMeals.map(renderPendingMealItem)}
              </View>
            )}
            
            {/* Already logged section */}
            {todaysMeals.length > 0 && (
              <View style={styles.loggedSection}>
                <Text style={[styles.loggedTitle, { color: theme.colors.textSecondary }]}>Already Logged Today</Text>
                <View style={styles.mealsList}>
                  {todaysMeals.map((item) => (
                    <View key={item.id}>
                      {renderMealItem({ item })}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      
      case 'recipes':
        // Recipes browsing with filtering
        return (
          <View>
            {/* Filter tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {[
                { key: 'all', label: 'All' },
                { key: 'my_meals', label: 'My Meals' },
                { key: 'templates', label: 'Templates' },
                { key: 'scanned', label: 'Scanned' },
              ].map(filter => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    recipeFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => setRecipeFilter(filter.key as any)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: theme.colors.textSecondary },
                    recipeFilter === filter.key && styles.filterChipTextActive,
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {recipesLoading ? (
              <ActivityIndicator size="small" color={dashboardTheme.colors.primary} />
            ) : searchFilteredRecipes.length === 0 ? (
              <View style={styles.emptyRecipes}>
                <Ionicons name="restaurant-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyRecipesTitle, { color: theme.colors.textSecondary }]}>No recipes found</Text>
                <Text style={[styles.emptyRecipesText, { color: theme.colors.textSecondary }]}>
                  Try a different search or filter, or create a new meal.
                </Text>
              </View>
            ) : (
              <View style={styles.recipesGrid}>
                {searchFilteredRecipes.map(renderRecipeCard)}
              </View>
            )}
          </View>
        );
      
      case 'shopping':
        return (
          <View>
            <View style={styles.mealsHeader}>
              <Text style={[styles.mealsTitle, { color: theme.colors.text }]}>Shopping Lists</Text>
              <Text style={styles.mealsPending}>
                {shoppingLists.length} lists
              </Text>
            </View>
            
            {shoppingLoading ? (
              <ActivityIndicator size="small" color={dashboardTheme.colors.primary} />
            ) : shoppingLists.length === 0 ? (
              <View style={styles.emptyMeals}>
                <Ionicons name="cart-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyMealsTitle, { color: theme.colors.text }]}>No shopping lists</Text>
                <Text style={[styles.emptyMealsText, { color: theme.colors.textSecondary }]}>
                  Create a meal plan to generate a shopping list.
                </Text>
              </View>
            ) : (
              <View style={styles.pendingMealsList}>
                {shoppingLists.map((list) => (
                  <TouchableOpacity
                    key={list.list_id || list.id || list.name}
                    style={[styles.shoppingListCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                    onPress={() => {
                      // Navigate to shopping list details
                      console.log('Open shopping list:', list.list_id || list.id);
                    }}
                  >
                    <View style={styles.shoppingListIcon}>
                      <Ionicons name="cart" size={24} color={dashboardTheme.colors.primary} />
                    </View>
                    <View style={styles.shoppingListContent}>
                      <Text style={[styles.shoppingListName, { color: theme.colors.text }]}>{list.name}</Text>
                      <Text style={[styles.shoppingListMeta, { color: theme.colors.textSecondary }]}>
                        {list.checked_items || 0} / {list.total_items || list.items?.length || 0} items checked
                      </Text>
                      <View style={styles.shoppingListProgress}>
                        <View 
                          style={[
                            styles.shoppingListProgressFill,
                            { 
                              width: `${(list.total_items || list.items?.length) ? ((list.checked_items || 0) / (list.total_items || list.items?.length || 1) * 100) : 0}%` 
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={dashboardTheme.colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      
      default:
        return (
          <View style={styles.comingSoonContainer}>
            <Ionicons name="construct" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.comingSoonTitle, { color: theme.colors.textSecondary }]}>Coming Soon</Text>
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              {selectedTab} features are being developed.
            </Text>
          </View>
        );
    }
  };
  
  // Confirmation Modal Component
  const renderConfirmationModal = () => (
    <Modal
      visible={confirmModal.visible}
      transparent
      animationType="slide"
      onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Log This Meal</Text>
            <TouchableOpacity
              onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
            >
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {confirmModal.item && (
            <>
              <Text style={[styles.modalMealName, { color: theme.colors.text }]}>{confirmModal.item.name}</Text>
              
              {/* Meal Type Selector */}
              <Text style={[styles.modalLabel, { color: theme.colors.textSecondary }]}>Meal Type</Text>
              <View style={styles.mealTypeSelector}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealTypeOption,
                      confirmModal.mealType === type && styles.mealTypeOptionActive,
                    ]}
                    onPress={() => setConfirmModal({ ...confirmModal, mealType: type })}
                  >
                    <Ionicons
                      name={getMealTypeIcon(type) as any}
                      size={16}
                      color={confirmModal.mealType === type ? '#fff' : theme.colors.textSecondary}
                    />
                    <Text style={[
                      styles.mealTypeOptionText,
                      { color: theme.colors.textSecondary },
                      confirmModal.mealType === type && styles.mealTypeOptionTextActive,
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Servings Selector */}
              <Text style={[styles.modalLabel, { color: theme.colors.textSecondary }]}>Servings</Text>
              <View style={styles.servingsSelector}>
                <TouchableOpacity
                  style={styles.servingsButton}
                  onPress={() => setConfirmModal({
                    ...confirmModal,
                    servings: Math.max(0.5, confirmModal.servings - 0.5)
                  })}
                >
                  <Ionicons name="remove" size={20} color={dashboardTheme.colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.servingsValue, { color: theme.colors.text }]}>{confirmModal.servings}</Text>
                <TouchableOpacity
                  style={styles.servingsButton}
                  onPress={() => setConfirmModal({
                    ...confirmModal,
                    servings: confirmModal.servings + 0.5
                  })}
                >
                  <Ionicons name="add" size={20} color={dashboardTheme.colors.primary} />
                </TouchableOpacity>
              </View>
              
              {/* Calculated Nutrition */}
              <View style={styles.modalNutrition}>
                <View style={styles.modalNutritionRow}>
                  <Text style={[styles.modalNutritionLabel, { color: theme.colors.textSecondary }]}>Calories</Text>
                  <Text style={[styles.modalNutritionValue, { color: theme.colors.text }]}>
                    {Math.round(confirmModal.item.calories * confirmModal.servings)}
                  </Text>
                </View>
                <View style={styles.modalNutritionRow}>
                  <Text style={[styles.modalNutritionLabel, { color: theme.colors.textSecondary }]}>Protein</Text>
                  <Text style={[styles.modalNutritionValue, { color: theme.colors.text }]}>
                    {Math.round(confirmModal.item.protein * confirmModal.servings)}g
                  </Text>
                </View>
                <View style={styles.modalNutritionRow}>
                  <Text style={[styles.modalNutritionLabel, { color: theme.colors.textSecondary }]}>Carbs</Text>
                  <Text style={[styles.modalNutritionValue, { color: theme.colors.text }]}>
                    {Math.round(confirmModal.item.carbs * confirmModal.servings)}g
                  </Text>
                </View>
                <View style={styles.modalNutritionRow}>
                  <Text style={[styles.modalNutritionLabel, { color: theme.colors.textSecondary }]}>Fat</Text>
                  <Text style={[styles.modalNutritionValue, { color: theme.colors.text }]}>
                    {Math.round(confirmModal.item.fat * confirmModal.servings)}g
                  </Text>
                </View>
              </View>
              
              {/* Confirm Button */}
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmMeal}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.modalConfirmButtonText}>Confirm & Log</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Show loading state
  if (loading && !dailySummary) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={dashboardTheme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status bar area - Always deep orange */}
      <View style={{ height: insets.top, backgroundColor: '#ea580c' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#ea580c' }]}>
        <Animated.View 
          style={[
            styles.headerContent,
            { 
              opacity: headerOpacity,
              transform: [{ scale: titleScale }]
            }
          ]}
        >
          <Text style={styles.collapsibleHeaderTitle}>Nutrition Analysis</Text>
          <Text style={styles.collapsibleHeaderSubtitle}>Track your daily nutrition intake</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{Math.round((nutritionGoals.calories.current / nutritionGoals.calories.target) * 100)}% daily goal achieved</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Tab Selector - Fixed below header */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {['nutrition', 'meals', 'recipes', 'shopping'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab as any)}
            >
              <Text style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                selectedTab === tab && styles.tabTextActive,
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Notifications Tile */}
        <View style={styles.notificationSection}>
          <NotificationTile
            userId={userId || undefined}
            onPress={() => navigation.navigate('Notifications' as never)}
            onViewMessages={() => navigation.navigate('Messages' as never)}
            onViewReminders={() => navigation.navigate('Reminders' as never)}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={dashboardTheme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search food, meals, recipes..."
              placeholderTextColor={dashboardTheme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Dynamic Content Area */}
        <View style={[styles.contentArea, { paddingHorizontal: layout.horizontalPadding }]}>
          {renderTabContent()}
        </View>

        {/* Bottom spacing for tab navigation */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      
      {/* Confirmation Modal */}
      {renderConfirmationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  collapsibleHeader: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  collapsibleHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  collapsibleHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  progressBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  progressBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: dashboardTheme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '500',
  },
  topBox: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
  },
  topBoxContent: {
    height: 0,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  notificationSection: {
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingTop: dashboardTheme.spacing.md,
    paddingBottom: dashboardTheme.spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingVertical: dashboardTheme.spacing.md,
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: dashboardTheme.spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(64,60,67,0.35)',
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 3px 6px rgba(64,60,67,0.35)',
      },
    }),
  },

  searchInput: {
    flex: 1,
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.text,
    outlineStyle: 'none' as any,
  },

  quickActions: {
    paddingTop: dashboardTheme.spacing.md,
  },

  sectionTitle: {
    ...dashboardTheme.typography.title,
    marginBottom: dashboardTheme.spacing.md,
  },



  tabContainer: {
    backgroundColor: dashboardTheme.colors.surface,
    paddingVertical: dashboardTheme.spacing.sm,
    marginTop: dashboardTheme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },

  tabScrollContent: {
    paddingHorizontal: dashboardTheme.spacing.md,
  },

  tabButton: {
    backgroundColor: dashboardTheme.colors.background,
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.lg,
    marginRight: dashboardTheme.spacing.sm,
  },

  tabButtonActive: {
    backgroundColor: dashboardTheme.colors.secondary,
  },

  tabText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '500',
  },

  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  contentArea: {
    paddingTop: dashboardTheme.spacing.lg,
  },

  nutritionSummary: {
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.lg,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.lg,
  },

  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardTheme.spacing.lg,
  },

  circularProgress: {
    position: 'relative',
  },

  circularProgressTrack: {
    borderColor: dashboardTheme.colors.border,
  },

  circularProgressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  circularProgressText: {
    position: 'absolute',
    alignItems: 'center',
  },

  caloriesValue: {
    ...dashboardTheme.typography.header,
    color: dashboardTheme.colors.text,
    fontWeight: '700',
  },

  caloriesTarget: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
  },

  caloriesLabel: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
  },

  macroBreakdown: {
    width: '100%',
    gap: dashboardTheme.spacing.md,
  },

  macroBar: {
    gap: dashboardTheme.spacing.xs,
  },

  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  macroLabel: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
  },

  macroValue: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
  },

  macroProgressBackground: {
    height: 6,
    backgroundColor: dashboardTheme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },

  macroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  macroPercentage: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },

  hydrationSection: {
    padding: dashboardTheme.spacing.lg,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    marginBottom: dashboardTheme.spacing.lg,
    borderWidth: 2,
  },

  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.md,
  },

  hydrationTitle: {
    ...dashboardTheme.typography.title,
  },

  addWaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  addWaterText: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.primary,
    fontWeight: '600',
  },

  hydrationProgress: {
    alignItems: 'center',
    gap: dashboardTheme.spacing.md,
  },

  waterGlasses: {
    flexDirection: 'row',
    gap: dashboardTheme.spacing.sm,
  },

  waterGlass: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  waterGlassFilled: {
    backgroundColor: dashboardTheme.colors.primary + '20',
    borderColor: dashboardTheme.colors.primary,
  },

  hydrationText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
  },

  mealsList: {
    gap: dashboardTheme.spacing.md,
  },

  mealItem: {
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
  },

  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: dashboardTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dashboardTheme.spacing.md,
  },

  mealContent: {
    flex: 1,
  },

  mealName: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.xs,
  },

  mealTime: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    marginBottom: dashboardTheme.spacing.xs,
  },

  macroTags: {
    flexDirection: 'row',
    gap: dashboardTheme.spacing.sm,
  },

  macroTag: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.primary,
    fontWeight: '500',
    fontSize: 11,
  },

  mealRight: {
    alignItems: 'flex-end',
  },

  mealCalories: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.text,
    fontWeight: '700',
  },

  mealCaloriesLabel: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
  },

  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: dashboardTheme.spacing.xl,
  },

  comingSoonTitle: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.md,
    marginBottom: dashboardTheme.spacing.sm,
  },

  comingSoonText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
  },

  // ============= MEALS TAB STYLES =============
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.md,
  },

  mealsTitle: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.text,
  },

  mealsPending: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.primary,
    fontWeight: '600',
    backgroundColor: dashboardTheme.colors.primary + '20',
    paddingHorizontal: dashboardTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  pendingMealsList: {
    gap: dashboardTheme.spacing.md,
  },

  pendingMealCard: {
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    marginBottom: dashboardTheme.spacing.sm,
    borderWidth: 2,
  },

  pendingMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.sm,
  },

  mealTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  mealTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  scheduledTime: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
  },

  pendingMealName: {
    ...dashboardTheme.typography.body,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.sm,
    fontSize: 16,
  },

  pendingMealNutrition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.sm,
  },

  pendingMealCalories: {
    ...dashboardTheme.typography.body,
    fontWeight: '700',
    color: dashboardTheme.colors.primary,
    marginRight: dashboardTheme.spacing.md,
  },

  pendingMealMacros: {
    flexDirection: 'row',
    gap: dashboardTheme.spacing.sm,
  },

  macroText: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
  },

  pendingMealSource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: dashboardTheme.spacing.md,
  },

  sourceText: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
  },

  confirmationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dashboardTheme.spacing.sm,
  },

  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.colors.primary,
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
    flex: 1,
    justifyContent: 'center',
  },

  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },

  skipButtonText: {
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },

  modifyButton: {
    padding: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.primary,
  },

  emptyMeals: {
    alignItems: 'center',
    paddingVertical: dashboardTheme.spacing.xl,
  },

  emptyMealsTitle: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.primary,
    marginTop: dashboardTheme.spacing.md,
  },

  emptyMealsText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: dashboardTheme.spacing.sm,
  },

  // ============= SHOPPING LIST STYLES =============
  shoppingListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    marginBottom: dashboardTheme.spacing.sm,
    ...dashboardTheme.shadows.sm,
    borderWidth: 2,
  },

  shoppingListIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: dashboardTheme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dashboardTheme.spacing.md,
  },

  shoppingListContent: {
    flex: 1,
  },

  shoppingListName: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: 4,
  },

  shoppingListMeta: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    marginBottom: dashboardTheme.spacing.sm,
  },

  shoppingListProgress: {
    height: 4,
    backgroundColor: dashboardTheme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },

  shoppingListProgressFill: {
    height: '100%',
    backgroundColor: dashboardTheme.colors.primary,
    borderRadius: 2,
  },

  loggedSection: {
    marginTop: dashboardTheme.spacing.xl,
  },

  loggedTitle: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.textSecondary,
    marginBottom: dashboardTheme.spacing.md,
  },

  // ============= RECIPES TAB STYLES =============
  filterContainer: {
    marginBottom: dashboardTheme.spacing.md,
  },

  filterContent: {
    paddingHorizontal: dashboardTheme.spacing.xs,
  },

  filterChip: {
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: 20,
    marginRight: dashboardTheme.spacing.sm,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.border,
  },

  filterChipActive: {
    backgroundColor: dashboardTheme.colors.primary,
    borderColor: dashboardTheme.colors.primary,
  },

  filterChipText: {
    ...dashboardTheme.typography.caption,
    fontWeight: '600',
    color: dashboardTheme.colors.textSecondary,
  },

  filterChipTextActive: {
    color: '#fff',
  },

  // ============= RECIPES GRID - 2x2 Pattern =============
  // Follows the documented 2x2 Card Grid Layout pattern from DESIGN_PATTERNS.md
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    // NO columnGap or gap - the 3% leftover creates horizontal spacing
  },

  recipeCard: {
    width: '48.5%',            // Percentage-based for 2x2 grid
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    borderWidth: 2,
    // NO minWidth, flex, or marginHorizontal
  },

  recipeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.sm,
  },

  sourceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  sourceTagText: {
    fontSize: 10,
    fontWeight: '600',
  },

  recipeName: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.sm,
    minHeight: 40,
  },

  recipeNutrition: {
    marginBottom: dashboardTheme.spacing.sm,
  },

  recipeCalories: {
    ...dashboardTheme.typography.body,
    fontWeight: '700',
    color: dashboardTheme.colors.primary,
    marginBottom: 4,
  },

  recipeMacros: {
    flexDirection: 'row',
    gap: dashboardTheme.spacing.sm,
  },

  macroSmall: {
    fontSize: 10,
    color: dashboardTheme.colors.textSecondary,
  },

  recipeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: dashboardTheme.spacing.sm,
  },

  recipeTimeText: {
    fontSize: 11,
    color: dashboardTheme.colors.textSecondary,
  },

  logRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.colors.primary,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
  },

  logRecipeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  emptyRecipes: {
    alignItems: 'center',
    paddingVertical: dashboardTheme.spacing.xl,
  },

  emptyRecipesTitle: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.md,
  },

  emptyRecipesText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: dashboardTheme.spacing.sm,
  },

  // ============= CONFIRMATION MODAL STYLES =============
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: dashboardTheme.spacing.lg,
    paddingBottom: 40,
    borderWidth: 2,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.lg,
  },

  modalTitle: {
    ...dashboardTheme.typography.header,
    color: dashboardTheme.colors.text,
  },

  modalMealName: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.lg,
  },

  modalLabel: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: dashboardTheme.spacing.sm,
    textTransform: 'uppercase',
  },

  mealTypeSelector: {
    flexDirection: 'row',
    gap: dashboardTheme.spacing.sm,
    marginBottom: dashboardTheme.spacing.lg,
  },

  mealTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
    backgroundColor: dashboardTheme.colors.background,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },

  mealTypeOptionActive: {
    backgroundColor: dashboardTheme.colors.primary,
    borderColor: dashboardTheme.colors.primary,
  },

  mealTypeOptionText: {
    ...dashboardTheme.typography.caption,
    fontWeight: '600',
    color: dashboardTheme.colors.textSecondary,
  },

  mealTypeOptionTextActive: {
    color: '#fff',
  },

  servingsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dashboardTheme.spacing.lg,
    marginBottom: dashboardTheme.spacing.lg,
  },

  servingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  servingsValue: {
    ...dashboardTheme.typography.header,
    color: dashboardTheme.colors.text,
    minWidth: 60,
    textAlign: 'center',
  },

  modalNutrition: {
    backgroundColor: dashboardTheme.colors.background,
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.md,
    marginBottom: dashboardTheme.spacing.lg,
  },

  modalNutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  modalNutritionLabel: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
  },

  modalNutritionValue: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
  },

  modalConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dashboardTheme.spacing.sm,
    backgroundColor: dashboardTheme.colors.primary,
    paddingVertical: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
  },

  modalConfirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ConsumptionDashboard;
