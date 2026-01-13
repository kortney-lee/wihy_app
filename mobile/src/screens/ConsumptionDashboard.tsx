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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientDashboardHeader } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
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
  const { navigateToNutritionFacts } = useDashboardNavigation();
  const { userId } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState<'nutrition' | 'meals' | 'recipes' | 'shopping'>('nutrition');
  const [searchQuery, setSearchQuery] = useState('');
  const circularProgress = useRef(new Animated.Value(0)).current;
  
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
      const data = await nutritionService.getDailySummary(userId);
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
      await nutritionService.logWater({ userId, amountMl: 250 }); // 1 glass = 250ml
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
      // Note: We'd need user's shopping list ID - using mock for now
      // In real implementation: const lists = await shoppingService.getUserLists(userId);
      
      setPendingMeals(pending);
    } catch (err) {
      console.error('Error loading pending meals:', err);
      // Set mock data as fallback
      setPendingMeals([
        {
          id: 'mock-1',
          name: 'Greek Yogurt with Berries',
          calories: 245,
          protein: 18,
          carbs: 28,
          fat: 6,
          mealType: 'breakfast',
          scheduledTime: '8:00 AM',
          source: 'meal_plan',
          isConfirmed: false,
          isSkipped: false,
        },
        {
          id: 'mock-2',
          name: 'Grilled Chicken Salad',
          calories: 387,
          protein: 35,
          carbs: 15,
          fat: 18,
          mealType: 'lunch',
          scheduledTime: '12:30 PM',
          source: 'meal_plan',
          isConfirmed: false,
          isSkipped: false,
        },
        {
          id: 'mock-3',
          name: 'Salmon with Quinoa',
          calories: 456,
          protein: 32,
          carbs: 48,
          fat: 18,
          mealType: 'dinner',
          scheduledTime: '7:00 PM',
          source: 'meal_plan',
          isConfirmed: false,
          isSkipped: false,
        },
      ]);
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
      // Set mock data as fallback
      setRecipes([
        {
          id: 'recipe-1',
          name: 'Chicken Stir Fry',
          calories: 380,
          protein: 32,
          carbs: 24,
          fat: 16,
          source: 'user_created',
          prepTime: 25,
          isFavorite: true,
          timesLogged: 12,
        },
        {
          id: 'recipe-2',
          name: 'Protein Smoothie Bowl',
          calories: 295,
          protein: 28,
          carbs: 35,
          fat: 6,
          source: 'template',
          prepTime: 10,
          isFavorite: false,
          timesLogged: 5,
        },
        {
          id: 'recipe-3',
          name: 'Overnight Oats',
          calories: 350,
          protein: 15,
          carbs: 52,
          fat: 10,
          source: 'scanned',
          prepTime: 5,
          isFavorite: true,
          timesLogged: 8,
        },
      ]);
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
          <Text style={styles.caloriesValue}>{current}</Text>
          <Text style={styles.caloriesTarget}>/ {target}</Text>
          <Text style={styles.caloriesLabel}>calories</Text>
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
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>{data.current}g / {data.target}g</Text>
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
        <Text style={styles.macroPercentage}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  const renderMealItem = ({ item }: { item: MealItem }) => (
    <TouchableOpacity
      style={styles.mealItem}
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
          <Text style={styles.mealName}>{item.name}</Text>
          <Text style={styles.mealTime}>{item.time}</Text>
          <View style={styles.macroTags}>
            <Text style={styles.macroTag}>P: {item.macros.protein}g</Text>
            <Text style={styles.macroTag}>C: {item.macros.carbs}g</Text>
            <Text style={styles.macroTag}>F: {item.macros.fat}g</Text>
          </View>
        </View>
      </View>
      <View style={styles.mealRight}>
        <Text style={styles.mealCalories}>{item.calories}</Text>
        <Text style={styles.mealCaloriesLabel}>cal</Text>
      </View>
    </TouchableOpacity>
  );



  // Render a pending meal item with confirmation buttons
  const renderPendingMealItem = (meal: PendingMeal) => {
    if (meal.isConfirmed || meal.isSkipped) return null;
    
    return (
      <View key={meal.id} style={styles.pendingMealCard}>
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
            <Text style={styles.scheduledTime}>{meal.scheduledTime}</Text>
          )}
        </View>
        
        <Text style={styles.pendingMealName}>{meal.name}</Text>
        
        <View style={styles.pendingMealNutrition}>
          <Text style={styles.pendingMealCalories}>{meal.calories} cal</Text>
          <View style={styles.pendingMealMacros}>
            <Text style={styles.macroText}>P: {meal.protein}g</Text>
            <Text style={styles.macroText}>C: {meal.carbs}g</Text>
            <Text style={styles.macroText}>F: {meal.fat}g</Text>
          </View>
        </View>
        
        <View style={styles.pendingMealSource}>
          <Ionicons 
            name={meal.source === 'meal_plan' ? 'calendar' : 'cart'} 
            size={12} 
            color={dashboardTheme.colors.textSecondary} 
          />
          <Text style={styles.sourceText}>
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
      style={styles.recipeCard}
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
      
      <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
      
      <View style={styles.recipeNutrition}>
        <Text style={styles.recipeCalories}>{recipe.calories} cal</Text>
        <View style={styles.recipeMacros}>
          <Text style={styles.macroSmall}>P: {recipe.protein}g</Text>
          <Text style={styles.macroSmall}>C: {recipe.carbs}g</Text>
          <Text style={styles.macroSmall}>F: {recipe.fat}g</Text>
        </View>
      </View>
      
      {recipe.prepTime && (
        <View style={styles.recipeTime}>
          <Ionicons name="time-outline" size={12} color={dashboardTheme.colors.textSecondary} />
          <Text style={styles.recipeTimeText}>{recipe.prepTime} min</Text>
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
            <View style={styles.nutritionSummary}>
              {renderCircularProgress(nutritionGoals.calories.current, nutritionGoals.calories.target)}
              <View style={styles.macroBreakdown}>
                {renderMacroBar('protein', 'Protein')}
                {renderMacroBar('carbs', 'Carbs')}
                {renderMacroBar('fat', 'Fat')}
              </View>
            </View>

            {/* Hydration */}
            <View style={styles.hydrationSection}>
              <View style={styles.hydrationHeader}>
                <Text style={styles.hydrationTitle}>Hydration</Text>
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
                <Text style={styles.hydrationText}>
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
              <Text style={styles.mealsTitle}>Today's Meals</Text>
              <Text style={styles.mealsPending}>
                {activePendingMeals.length} pending
              </Text>
            </View>
            
            {mealsLoading ? (
              <ActivityIndicator size="small" color={dashboardTheme.colors.primary} />
            ) : activePendingMeals.length === 0 ? (
              <View style={styles.emptyMeals}>
                <Ionicons name="checkmark-done-circle" size={48} color={dashboardTheme.colors.primary} />
                <Text style={styles.emptyMealsTitle}>All caught up!</Text>
                <Text style={styles.emptyMealsText}>
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
                <Text style={styles.loggedTitle}>Already Logged Today</Text>
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
                    recipeFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => setRecipeFilter(filter.key as any)}
                >
                  <Text style={[
                    styles.filterChipText,
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
                <Ionicons name="restaurant-outline" size={48} color={dashboardTheme.colors.textSecondary} />
                <Text style={styles.emptyRecipesTitle}>No recipes found</Text>
                <Text style={styles.emptyRecipesText}>
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
              <Text style={styles.mealsTitle}>Shopping Lists</Text>
              <Text style={styles.mealsPending}>
                {shoppingLists.length} lists
              </Text>
            </View>
            
            {shoppingLoading ? (
              <ActivityIndicator size="small" color={dashboardTheme.colors.primary} />
            ) : shoppingLists.length === 0 ? (
              <View style={styles.emptyMeals}>
                <Ionicons name="cart-outline" size={48} color={dashboardTheme.colors.textSecondary} />
                <Text style={styles.emptyMealsTitle}>No shopping lists</Text>
                <Text style={styles.emptyMealsText}>
                  Create a meal plan to generate a shopping list.
                </Text>
              </View>
            ) : (
              <View style={styles.pendingMealsList}>
                {shoppingLists.map((list) => (
                  <TouchableOpacity
                    key={list.list_id || list.id || list.name}
                    style={styles.shoppingListCard}
                    onPress={() => {
                      // Navigate to shopping list details
                      console.log('Open shopping list:', list.list_id || list.id);
                    }}
                  >
                    <View style={styles.shoppingListIcon}>
                      <Ionicons name="cart" size={24} color={dashboardTheme.colors.primary} />
                    </View>
                    <View style={styles.shoppingListContent}>
                      <Text style={styles.shoppingListName}>{list.name}</Text>
                      <Text style={styles.shoppingListMeta}>
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
            <Ionicons name="construct" size={48} color={dashboardTheme.colors.textSecondary} />
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log This Meal</Text>
            <TouchableOpacity
              onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
            >
              <Ionicons name="close" size={24} color={dashboardTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {confirmModal.item && (
            <>
              <Text style={styles.modalMealName}>{confirmModal.item.name}</Text>
              
              {/* Meal Type Selector */}
              <Text style={styles.modalLabel}>Meal Type</Text>
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
                      color={confirmModal.mealType === type ? '#fff' : dashboardTheme.colors.textSecondary}
                    />
                    <Text style={[
                      styles.mealTypeOptionText,
                      confirmModal.mealType === type && styles.mealTypeOptionTextActive,
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Servings Selector */}
              <Text style={styles.modalLabel}>Servings</Text>
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
                <Text style={styles.servingsValue}>{confirmModal.servings}</Text>
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
                  <Text style={styles.modalNutritionLabel}>Calories</Text>
                  <Text style={styles.modalNutritionValue}>
                    {Math.round(confirmModal.item.calories * confirmModal.servings)}
                  </Text>
                </View>
                <View style={styles.modalNutritionRow}>
                  <Text style={styles.modalNutritionLabel}>Protein</Text>
                  <Text style={styles.modalNutritionValue}>
                    {Math.round(confirmModal.item.protein * confirmModal.servings)}g
                  </Text>
                </View>
                <View style={styles.modalNutritionRow}>
                  <Text style={styles.modalNutritionLabel}>Carbs</Text>
                  <Text style={styles.modalNutritionValue}>
                    {Math.round(confirmModal.item.carbs * confirmModal.servings)}g
                  </Text>
                </View>
                <View style={styles.modalNutritionRow}>
                  <Text style={styles.modalNutritionLabel}>Fat</Text>
                  <Text style={styles.modalNutritionValue}>
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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={dashboardTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Fixed at top, does not scroll */}
      <GradientDashboardHeader
        title="Nutrition Analysis"
        subtitle="Track your daily nutrition intake"
        gradient="consumption"
        badge={{
          text: `${Math.round((nutritionGoals.calories.current / nutritionGoals.calories.target) * 100)}% daily goal achieved`
        }}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
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



        {/* Tab Selector */}
        <View style={styles.tabContainer}>
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
                  selectedTab === tab && styles.tabTextActive,
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Content Area */}
        <View style={[styles.contentArea, { paddingHorizontal: layout.horizontalPadding }]}>
          {renderTabContent()}
        </View>

        {/* Bottom spacing for tab navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Confirmation Modal */}
      {renderConfirmationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: '#ffffff',
  },
  topBoxContent: {
    height: 0,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },

  header: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: dashboardTheme.header.paddingBottom,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  headerContent: {
    alignItems: 'flex-start',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  headerStats: {
    alignSelf: 'stretch',
  },

  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  headerStatText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },

  searchContainer: {
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingVertical: dashboardTheme.spacing.md,
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.borderRadius.lg,
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    gap: dashboardTheme.spacing.sm,
    ...dashboardTheme.shadows.sm,
  },

  searchInput: {
    flex: 1,
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.text,
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
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.lg,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    marginBottom: dashboardTheme.spacing.lg,
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
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    marginBottom: dashboardTheme.spacing.sm,
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
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    marginBottom: dashboardTheme.spacing.sm,
    ...dashboardTheme.shadows.sm,
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
    backgroundColor: dashboardTheme.colors.surface,
    marginRight: dashboardTheme.spacing.sm,
    borderWidth: 1,
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
    backgroundColor: dashboardTheme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
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
    backgroundColor: dashboardTheme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: dashboardTheme.spacing.lg,
    paddingBottom: 40,
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
