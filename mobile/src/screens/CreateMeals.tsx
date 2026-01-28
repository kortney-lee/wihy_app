import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  useWindowDimensions,
  Animated,
  Image,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { dashboardColors, InstacartLinkButton, BackToHubButton } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
import { SweepBorder } from '../components/SweepBorder';
import SvgIcon from '../components/shared/SvgIcon';
import { AuthContext } from '../context/AuthContext';
import { mealService, MealTemplate, QUICK_TEMPLATE_PRESETS, MealType, CookingSkillLevel, MealVariety, TimePerMeal, CreateMealPlanRequest, MealPlanResponse, CalendarDay, SavedMeal, DietOption } from '../services/mealService';
import { mealCalendarService } from '../services/mealCalendarService';
import { createMealPlan, generateShoppingList } from '../services/mealPlanService';
import { createShoppingList, createInstacartLinkFromMealPlan, ShoppingListItem } from '../services/instacartService';
import { getMealDiaryService, type Meal, type DietaryPreferences } from '../services/mealDiary';
import { nutritionService } from '../services';
import { authService } from '../services/authService';
import { API_CONFIG } from '../services/config';
import { clientDataService } from '../services/clientDataService';
import { RootStackParamList } from '../types/navigation';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { useFeatureAccess } from '../hooks/usePaywall';

// New GoalSelection component for 3-mode meal planning
import { GoalSelectionMeals, GenerateMealParams } from './meals/GoalSelectionMeals';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');

// Note: Mock data removed to expose real API issues

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Base screen width for reference - actual width calculated dynamically
const SCREEN_WIDTH = Dimensions.get('window').width;

// View modes for the screen
type ViewMode = 'dashboard' | 'create' | 'calendar' | 'library';

// Meal type icons and colors
const mealTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  breakfast: { icon: 'sunny-outline', color: '#f59e0b', bgColor: '#fef3c7' },
  lunch: { icon: 'restaurant-outline', color: '#3b82f6', bgColor: '#dbeafe' },
  dinner: { icon: 'moon-outline', color: '#8b5cf6', bgColor: '#ede9fe' },
  snack: { icon: 'cafe-outline', color: '#10b981', bgColor: '#d1fae5' },
  dessert: { icon: 'ice-cream-outline', color: '#ec4899', bgColor: '#fce7f3' },
};

// Quick presets for AI meal plan generation
const QUICK_GOALS = [
  { 
    label: 'Family Dinners', 
    icon: 'people-outline', 
    description: 'Easy family dinners for 4',
    config: { mealVariety: 'family_friendly' as MealVariety, servings: 4, mealsPerDay: { dinner: true } }
  },
  { 
    label: 'Meal Prep', 
    icon: 'cube-outline', 
    description: 'Batch cooking for the week',
    config: { mealVariety: 'batch_cooking' as MealVariety, servings: 6, mealsPerDay: { lunch: true, dinner: true } }
  },
  { 
    label: 'High Protein', 
    icon: 'fitness-outline', 
    description: 'Protein-focused meals',
    config: { mealVariety: 'high_protein' as MealVariety, servings: 2, mealsPerDay: { breakfast: true, lunch: true, dinner: true } }
  },
  { 
    label: 'Quick & Easy', 
    icon: 'flash-outline', 
    description: 'Under 30 min recipes',
    config: { timePerMeal: 'quick' as TimePerMeal, cookingComplexity: 'beginner' as CookingSkillLevel }
  },
  { 
    label: 'Budget Meals', 
    icon: 'wallet-outline', 
    description: 'Affordable ingredients',
    config: { specialFocus: ['budget_friendly'], preferredStores: ['walmart', 'aldi'] }
  },
  { 
    label: 'Healthy', 
    icon: 'heart-outline', 
    description: 'Balanced nutrition',
    config: { mealVariety: 'balanced' as MealVariety, specialFocus: ['low_sodium', 'whole_foods'] }
  },
];

// Dietary restriction options - organized by type
const DIETARY_OPTIONS = [
  // Restrictions (plant-based/animal-based)
  { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf-outline', type: 'restriction', description: 'Plant-based, excludes meat but includes dairy/eggs' },
  { id: 'vegan', label: 'Vegan', icon: 'flower-outline', type: 'restriction', description: 'Strictly plant-based, no animal products' },
  { id: 'pescatarian', label: 'Pescatarian', icon: 'fish-outline', type: 'restriction', description: 'Vegetarian + fish/seafood' },
  
  // Macronutrient-focused
  { id: 'keto', label: 'Ketogenic', icon: 'flame-outline', type: 'macronutrient', description: 'Very low-carb, high-fat (5-10% carbs, 70-80% fats)' },
  { id: 'low_carb', label: 'Low Carb', icon: 'trending-down-outline', type: 'macronutrient', description: 'Reduced carbs (10-25%) without strict ketosis' },
  { id: 'high_protein', label: 'High Protein', icon: 'barbell-outline', type: 'macronutrient', description: '30-40% protein for muscle building' },
  
  // Ancestral/Regional
  { id: 'paleo', label: 'Paleo', icon: 'bonfire-outline', type: 'ancestral', description: 'No grains, legumes, dairy, processed foods' },
  { id: 'mediterranean', label: 'Mediterranean', icon: 'boat-outline', type: 'regional', description: 'Olive oil, fish, vegetables, whole grains' },
  
  // Elimination diets
  { id: 'whole30', label: 'Whole30', icon: 'calendar-outline', type: 'elimination', description: '30-day elimination of sugar, alcohol, grains, legumes, dairy' },
  { id: 'carnivore', label: 'Carnivore', icon: 'restaurant-outline', type: 'elimination', description: 'Animal products only, no plants' },
  
  // Medical/Therapeutic
  { id: 'gluten_free', label: 'Gluten-Free', icon: 'ban-outline', type: 'medical', description: 'Eliminates wheat, barley, rye' },
  { id: 'low_sodium', label: 'Low Sodium', icon: 'water-outline', type: 'medical', description: 'Restricts sodium (1500-2300mg daily)' },
  { id: 'diabetic_friendly', label: 'Diabetic Friendly', icon: 'pulse-outline', type: 'medical', description: 'Blood sugar management, low glycemic' },
  { id: 'fodmap_low', label: 'Low FODMAP', icon: 'medical-outline', type: 'medical', description: 'Reduces fermentable carbs for IBS' },
  { id: 'anti_inflammatory', label: 'Anti-Inflammatory', icon: 'shield-checkmark-outline', type: 'therapeutic', description: 'Reduces chronic inflammation' },
  
  // Timing-based
  { id: 'intermittent_fasting', label: 'Intermittent Fasting', icon: 'time-outline', type: 'timing', description: 'Eating windows (16:8, 18:6, OMAD)' },
  
  // Spiritual
  { id: 'daniel_fast', label: 'Daniel Fast', icon: 'book-outline', type: 'spiritual', description: 'Biblical fast - vegetables, fruits, water only' },
];

// Store options
const STORE_OPTIONS = [
  { id: 'costco', label: 'Costco', icon: 'storefront-outline' },
  { id: 'trader_joes', label: "Trader Joe's", icon: 'basket-outline' },
  { id: 'whole_foods', label: 'Whole Foods', icon: 'nutrition-outline' },
  { id: 'walmart', label: 'Walmart', icon: 'cart-outline' },
  { id: 'kroger', label: 'Kroger', icon: 'bag-outline' },
  { id: 'aldi', label: 'Aldi', icon: 'pricetag-outline' },
];

// Local interface for backward compatibility
interface LocalMealTemplate {
  template_id: string;
  name: string;
  description: string;
  category: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  tags: string[];
  preparation_time: number;
  cooking_time: number;
  servings: number;
}

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface CreateMealsProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

export default function CreateMeals({ isDashboardMode = false, onBack }: CreateMealsProps) {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const layout = useDashboardLayout();
  
  // Paywall check
  const hasMealAccess = useFeatureAccess('meals');
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
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
  
  // View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  
  // Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  // Active Meal Plan State
  const [activeMealPlan, setActiveMealPlan] = useState<MealPlanResponse | null>(null);
  const [todaysMeals, setTodaysMeals] = useState<any[]>([]);
  
  // AI Plan Generator State
  const [showPlanGenerator, setShowPlanGenerator] = useState(false);
  const [useGoalSelectionUI, setUseGoalSelectionUI] = useState(true); // Use new 3-mode UI
  const [planModalStep, setPlanModalStep] = useState<'goals' | 'preview' | 'meals'>('goals');
  const [selectedTemplatePreset, setSelectedTemplatePreset] = useState<typeof QUICK_TEMPLATE_PRESETS[0] | null>(null);
  const [planDescription, setPlanDescription] = useState('');
  const [planDuration, setPlanDuration] = useState(7);
  const [planServings, setPlanServings] = useState(2);
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [dietarySearchQuery, setDietarySearchQuery] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<Record<string, boolean>>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false,
  });
  const [cookingLevel, setCookingLevel] = useState<CookingSkillLevel>('intermediate');
  const [timePerMeal, setTimePerMeal] = useState<TimePerMeal>('moderate');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlanResponse | null>(null);
  
  // Available diets loaded from API
  const [availableDiets, setAvailableDiets] = useState<DietOption[]>([]);
  const [loadingDiets, setLoadingDiets] = useState(false);
  
  // Form State (for manual meal creation)
  const [mealName, setMealName] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<LocalMealTemplate[]>([]);
  const [mealPlanId, setMealPlanId] = useState<number | null>(null);
  const [generatingList, setGeneratingList] = useState(false);
  
  // User's saved meals
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  
  // Library view state
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryFilterTag, setLibraryFilterTag] = useState<string | null>(null);
  const [allMeals, setAllMeals] = useState<SavedMeal[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Meal details modal state
  type MealWithInstructions = SavedMeal & { instructions?: string[] };
  const [showMealDetails, setShowMealDetails] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealWithInstructions | null>(null);
  const [mealServings, setMealServings] = useState(1);
  const [activeDetailTab, setActiveDetailTab] = useState<'ingredients' | 'instructions'>('ingredients');

  // Library modal state
  const [showLibrary, setShowLibrary] = useState(false);

  // Meal Plan Success Modal state
  const [showMealPlanSuccess, setShowMealPlanSuccess] = useState(false);
  const [loggingToDiary, setLoggingToDiary] = useState(false);
  const [savedToDiary, setSavedToDiary] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [acceptedPlan, setAcceptedPlan] = useState<MealPlanResponse | null>(null);
  const [savingMealPlan, setSavingMealPlan] = useState(false);
  const [mealPlanSaved, setMealPlanSaved] = useState(false);
  const [savedMealIds, setSavedMealIds] = useState<string[]>([]); // Track saved meal IDs for Instacart deep links
  const [savingMealsToDb, setSavingMealsToDb] = useState(false); // Loading state for saving meals
  const [mealsAutoSaved, setMealsAutoSaved] = useState(false); // Track if meals were auto-saved by API (plan/diet mode)

  // Shopping List Modal state (bottom sheet style)
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [shoppingListItems, setShoppingListItems] = useState<ReturnType<typeof extractShoppingListFromPlan> | null>(null);
  const [shoppingListLoading, setShoppingListLoading] = useState(false);
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<Set<string>>(new Set());
  
  // ============================================================================
  // INSTACART INTEGRATION STATE
  // ============================================================================
  // IMPLEMENTED: Session data storage via Client Data API (Jan 26, 2026)
  // Primary: Backend session API stores Instacart URLs per user/plan
  // Fallback: AsyncStorage for offline access
  // See: docs/WIHY_CLIENT_DATA_API.md for API documentation
  // ============================================================================
  const [instacartUrl, setInstacartUrl] = useState<string | null>(null);
  const INSTACART_URL_STORAGE_KEY = '@wihy_instacart_url'; // AsyncStorage fallback key
  const [showInstacartSuccessModal, setShowInstacartSuccessModal] = useState(false);
  const [instacartItemCount, setInstacartItemCount] = useState(0);

  // Toggle shopping item checked state
  const toggleShoppingItem = (category: string, index: number) => {
    const itemKey = `${category}-${index}`;
    setCheckedShoppingItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  // Storage key for shopping list persistence (fallback cache)
  const SHOPPING_LIST_STORAGE_KEY = '@wihy_shopping_list';

  // Save Instacart URL to session storage (backend + local fallback)
  const saveInstacartUrlToStorage = useCallback(async (url: string, planId?: string | number) => {
    try {
      // Primary: Save to backend session via Client Data API
      await clientDataService.saveInstacartUrl(url, planId?.toString());
      console.log('[Instacart] URL saved to session (Client Data API)');
      
      // Fallback: Also save to AsyncStorage for offline access
      const key = planId ? `${INSTACART_URL_STORAGE_KEY}_${planId}` : INSTACART_URL_STORAGE_KEY;
      await AsyncStorage.setItem(key, url);
      await AsyncStorage.setItem(INSTACART_URL_STORAGE_KEY, url);
    } catch (error) {
      console.error('[Instacart] Error saving URL to session:', error);
      // Fallback to AsyncStorage only
      try {
        const key = planId ? `${INSTACART_URL_STORAGE_KEY}_${planId}` : INSTACART_URL_STORAGE_KEY;
        await AsyncStorage.setItem(key, url);
        await AsyncStorage.setItem(INSTACART_URL_STORAGE_KEY, url);
        console.log('[Instacart] URL saved to AsyncStorage (fallback)');
      } catch (storageError) {
        console.error('[Instacart] AsyncStorage fallback also failed:', storageError);
      }
    }
  }, []);

  // Load Instacart URL from session storage (backend + local fallback)
  const loadInstacartUrlFromStorage = useCallback(async (planId?: string | number) => {
    try {
      // Primary: Try to get from backend session via Client Data API
      const sessionUrl = await clientDataService.getInstacartUrl(planId?.toString());
      if (sessionUrl) {
        console.log('[Instacart] Loaded URL from session (Client Data API)');
        return sessionUrl;
      }
    } catch (error) {
      console.warn('[Instacart] Could not load from session, trying AsyncStorage:', error);
    }
    
    // Fallback: Try AsyncStorage
    try {
      // Try plan-specific URL first
      if (planId) {
        const planUrl = await AsyncStorage.getItem(`${INSTACART_URL_STORAGE_KEY}_${planId}`);
        if (planUrl) {
          console.log('[Instacart] Loaded plan-specific URL from AsyncStorage');
          return planUrl;
        }
      }
      // Fall back to most recent URL
      const recentUrl = await AsyncStorage.getItem(INSTACART_URL_STORAGE_KEY);
      if (recentUrl) {
        console.log('[Instacart] Loaded recent URL from AsyncStorage');
        return recentUrl;
      }
      console.log('[Instacart] No saved URL found');
    } catch (error) {
      console.error('[Instacart] Error loading URL from AsyncStorage:', error);
    }
    return null;
  }, []);

  // Convert API ShoppingList to our local format
  const convertApiShoppingListToLocal = useCallback((apiList: any): ReturnType<typeof extractShoppingListFromPlan> => {
    const result = {
      proteins: [] as any[],
      produce: [] as any[],
      dairy: [] as any[],
      grains: [] as any[],
      pantry: [] as any[],
      other: [] as any[],
    };

    // If items_by_category exists, use it
    if (apiList.items_by_category) {
      Object.entries(apiList.items_by_category).forEach(([category, items]: [string, any]) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower.includes('protein') || categoryLower.includes('meat') || categoryLower.includes('seafood')) {
          result.proteins.push(...items);
        } else if (categoryLower.includes('produce') || categoryLower.includes('vegetable') || categoryLower.includes('fruit')) {
          result.produce.push(...items);
        } else if (categoryLower.includes('dairy') || categoryLower.includes('milk') || categoryLower.includes('cheese')) {
          result.dairy.push(...items);
        } else if (categoryLower.includes('grain') || categoryLower.includes('bread') || categoryLower.includes('pasta')) {
          result.grains.push(...items);
        } else if (categoryLower.includes('pantry') || categoryLower.includes('spice') || categoryLower.includes('oil')) {
          result.pantry.push(...items);
        } else {
          result.other.push(...items);
        }
      });
    } else if (apiList.items) {
      // Fallback: categorize items manually
      apiList.items.forEach((item: any) => {
        const categoryLower = (item.category || '').toLowerCase();
        if (categoryLower.includes('protein') || categoryLower.includes('meat')) {
          result.proteins.push(item);
        } else if (categoryLower.includes('produce') || categoryLower.includes('vegetable')) {
          result.produce.push(item);
        } else if (categoryLower.includes('dairy')) {
          result.dairy.push(item);
        } else if (categoryLower.includes('grain')) {
          result.grains.push(item);
        } else if (categoryLower.includes('pantry') || categoryLower.includes('spice')) {
          result.pantry.push(item);
        } else {
          result.other.push(item);
        }
      });
    }

    return result;
  }, []);

  // Load shopping list from storage
  const loadShoppingListFromStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const totalItems = Object.values(parsed).flat().length;
        console.log('[ShoppingList] Loaded from storage:', totalItems, 'items');
        if (totalItems > 0) {
          setShoppingListItems(parsed);
          return parsed;
        }
      }
      console.log('[ShoppingList] No items found in storage');
    } catch (error) {
      console.error('[ShoppingList] Error loading from storage:', error);
    }
    return null;
  }, []);

  // Load shopping list (storage only for now - API endpoint not yet available)
  const loadShoppingList = useCallback(async () => {
    // Note: Backend shopping list endpoint not available yet
    // Using local storage + meal plan extraction
    return loadShoppingListFromStorage();
  }, [loadShoppingListFromStorage]);

  // Save shopping list to storage
  const saveShoppingListToStorage = useCallback(async (items: ReturnType<typeof extractShoppingListFromPlan>) => {
    try {
      await AsyncStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(items));
      console.log('[ShoppingList] Saved to storage:', Object.values(items).flat().length, 'items');
    } catch (error) {
      console.error('[ShoppingList] Error saving to storage:', error);
    }
  }, []);

  // Calendar loading state
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const tags = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'High Protein',
    'Low Carb',
    'Vegan',
    'Gluten-Free',
    'Quick',
    'Meal Prep',
  ];

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
    loadAvailableDiets();
    loadShoppingList(); // Load shopping list from API or storage
  }, [loadShoppingList]);

  // Load calendar data when viewing calendar or month changes
  useEffect(() => {
    if (viewMode === 'calendar' && userId) {
      loadCalendarData();
    }
  }, [viewMode, calendarMonth, userId]);

  // Load saved Instacart URL when success modal opens or plan changes
  useEffect(() => {
    const loadSavedInstacartUrl = async () => {
      if (showMealPlanSuccess && acceptedPlan && !instacartUrl) {
        const planIdentifier = mealPlanId || acceptedPlan?.program_id;
        const savedUrl = await loadInstacartUrlFromStorage(planIdentifier);
        if (savedUrl) {
          setInstacartUrl(savedUrl);
          console.log('[Instacart] Restored saved URL for plan');
        }
      }
    };
    loadSavedInstacartUrl();
  }, [showMealPlanSuccess, acceptedPlan, mealPlanId, instacartUrl, loadInstacartUrlFromStorage]);

  // Load available diets from API
  const loadAvailableDiets = async () => {
    try {
      setLoadingDiets(true);
      const diets = await mealService.getDiets();
      setAvailableDiets(diets);
      console.log('[CreateMeals] Loaded diets:', diets.length);
    } catch (error) {
      console.error('[CreateMeals] Error loading diets:', error);
    } finally {
      setLoadingDiets(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoadingMeals(true);
      
      // Load user's saved meals from Meal Diary API
      let userMeals: SavedMeal[] = [];
      const token = await authService.getAccessToken();
      
      if (userId && token) {
        try {
          console.log('[CreateMeals] Loading user meals from Meal Diary API...');
          const mealDiaryService = getMealDiaryService(token);
          const response = await mealDiaryService.getMealDiary(userId, {
            limit: 50,
            offset: 0,
          });
          
          // Convert API response to SavedMeal format
          if (response.recent_meals && response.recent_meals.length > 0) {
            userMeals = response.recent_meals.map((meal: Meal) => ({
              meal_id: meal.meal_id,
              user_id: meal.user_id || userId,
              name: meal.name,
              nutrition: meal.nutrition,
              ingredients: Array.isArray(meal.ingredients) 
                ? meal.ingredients.filter((ing): ing is { name: string; amount: number; unit: string } => typeof ing === 'object' && 'amount' in ing)
                : [],
              tags: meal.tags || [],
              notes: '',
              is_favorite: meal.is_favorite || false,
              times_logged: meal.times_logged || 0,
              created_at: meal.created_at || new Date().toISOString(),
              updated_at: meal.updated_at || new Date().toISOString(),
              serving_size: meal.serving_size || 1,
              preparation_time: meal.preparation_time,
              cooking_time: meal.cooking_time,
              instructions: meal.instructions || [],
            })) as SavedMeal[];
            console.log('[CreateMeals] Loaded', userMeals.length, 'meals from Meal Diary API');
          }
        } catch (apiError) {
          console.log('[CreateMeals] API failed to load user meals:', apiError);
        }
      } else {
        console.log('[CreateMeals] User or token not available for API call');
      }
      
      // Set saved meals (may be empty if API failed)
      setSavedMeals(userMeals);
      
      if (userMeals.length === 0) {
        console.log('[CreateMeals] No meals available - API returned empty or failed');
      }
      
      // Try to load active meal plan from API
      if (userId && token) {
        try {
          console.log('[CreateMeals] Loading active meal plan from API...');
          const activePlanResponse = await mealService.getActiveMealPlan(userId);
          if (activePlanResponse && activePlanResponse.has_active_plan && activePlanResponse.plan) {
            const plan = activePlanResponse.plan;
            setActiveMealPlan(plan);
            console.log('[CreateMeals] Loaded active meal plan:', plan.name);
            
            // Set today's meals from active plan
            const today = new Date().toISOString().split('T')[0];
            const todayDay = plan.days?.find(d => d.date === today);
            if (todayDay && todayDay.meals) {
              setTodaysMeals(todayDay.meals);
            } else if (plan.days && plan.days.length > 0) {
              // Use first day if today not found
              const firstDay = plan.days[0];
              if (firstDay.meals) {
                setTodaysMeals(firstDay.meals);
              }
            }
            
            // Set calendar days from active plan
            if (plan.days) {
              const convertedDays = plan.days.map(day => {
                const meals = day.meals || [];
                return {
                  date: day.date,
                  day_number: day.day_number,
                  day_name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
                  meals: meals.map((m: any) => ({
                    meal_id: m.meal_id,
                    meal_type: m.meal_type as MealType,
                    meal_name: m.meal_name,
                    calories: m.nutrition?.calories || 0,
                    protein: m.nutrition?.protein || 0,
                    carbs: m.nutrition?.carbs || 0,
                    fat: m.nutrition?.fat || 0,
                    servings: 1,
                  })),
                  total_calories: meals.reduce((sum: number, m: any) => sum + (m.nutrition?.calories || 0), 0),
                  total_protein: meals.reduce((sum: number, m: any) => sum + (m.nutrition?.protein || 0), 0),
                  total_carbs: meals.reduce((sum: number, m: any) => sum + (m.nutrition?.carbs || 0), 0),
                  total_fat: meals.reduce((sum: number, m: any) => sum + (m.nutrition?.fat || 0), 0),
                  has_breakfast: meals.some((m: any) => m.meal_type === 'breakfast'),
                  has_lunch: meals.some((m: any) => m.meal_type === 'lunch'),
                  has_dinner: meals.some((m: any) => m.meal_type === 'dinner'),
                  has_snacks: meals.some((m: any) => m.meal_type === 'snack'),
                };
              }) as CalendarDay[];
              setCalendarDays(convertedDays);
            }
          } else {
            console.log('[CreateMeals] No active meal plan found');
          }
        } catch (planError) {
          console.log('[CreateMeals] Failed to load active meal plan:', planError);
        }
      }
      
    } catch (error) {
      console.log('Error loading dashboard data:', error);
    } finally {
      setLoadingMeals(false);
    }
  };

  // Load calendar data from mealCalendarService
  const loadCalendarData = async () => {
    if (!userId) {
      console.log('[CreateMeals] No userId for calendar data');
      return;
    }

    try {
      setCalendarLoading(true);
      setCalendarError(null);

      // Get the month range to load
      const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      console.log('[CreateMeals] Loading calendar data from', startDate, 'to', endDate);

      // Load calendar days from services.wihy.ai
      const days = await mealCalendarService.getCalendar(userId, startDate, endDate);
      
      if (days && days.length > 0) {
        console.log('[CreateMeals] Loaded', days.length, 'calendar days');
        
        // Convert to local CalendarDay format
        const convertedDays = days.map(day => ({
          date: day.date,
          day_number: new Date(day.date).getDate(),
          day_name: day.dayName || new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
          meals: day.meals.map(m => ({
            meal_id: m.meal_id,
            meal_type: m.meal_slot as MealType,
            meal_name: m.meal.name,
            calories: m.meal.nutrition.calories,
            protein: m.meal.nutrition.protein,
            carbs: m.meal.nutrition.carbs,
            fat: m.meal.nutrition.fat,
            servings: m.servings,
          })),
          total_calories: day.totals.calories,
          total_protein: day.totals.protein,
          total_carbs: day.totals.carbs,
          total_fat: day.totals.fat,
          has_breakfast: day.meals.some(m => m.meal_slot === 'breakfast'),
          has_lunch: day.meals.some(m => m.meal_slot === 'lunch'),
          has_dinner: day.meals.some(m => m.meal_slot === 'dinner'),
          has_snacks: day.meals.some(m => m.meal_slot === 'snack'),
        })) as CalendarDay[];

        setCalendarDays(convertedDays);

        // Set today's meals if viewing current month
        const today = new Date().toISOString().split('T')[0];
        const todayData = days.find(d => d.date === today);
        if (todayData) {
          setTodaysMeals(todayData.meals.map(m => ({
            meal_id: m.meal_id,
            meal_type: m.meal_slot,
            meal_name: m.meal.name,
            calories: m.meal.nutrition.calories,
            protein: m.meal.nutrition.protein,
            carbs: m.meal.nutrition.carbs,
            fat: m.meal.nutrition.fat,
            servings: m.servings,
          })));
        }
      } else {
        console.log('[CreateMeals] No calendar data found for month');
        setCalendarDays([]);
      }
    } catch (error) {
      console.error('[CreateMeals] Error loading calendar data:', error);
      setCalendarError('Failed to load calendar');
    } finally {
      setCalendarLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (viewMode === 'calendar') {
      await loadCalendarData();
    }
    setRefreshing(false);
  };

  // Calendar Helper Functions
  const getCalendarDays = () => {
    const days: (Date | null)[] = [];
    const today = new Date();
    // Show 14 days (2 weeks)
    for (let i = -3; i < 11; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasMealPlanned = (date: Date | null) => {
    if (!date) return false;
    // Check if there's a meal planned for this date in the calendar data
    const dateStr = date.toISOString().split('T')[0];
    const dayData = calendarDays.find(d => d.date === dateStr);
    return dayData ? (dayData.meals?.length > 0 || dayData.has_breakfast || dayData.has_lunch || dayData.has_dinner) : false;
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCalendarMonth(newMonth);
  };

  // AI Meal Plan Generation
  const handleGenerateAIMealPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const request: CreateMealPlanRequest = {
        userId: userId,
        description: planDescription || 'Create a balanced meal plan',
        duration: planDuration,
        mealsPerDay: {
          breakfast: selectedMealTypes.breakfast || false,
          lunch: selectedMealTypes.lunch || false,
          dinner: selectedMealTypes.dinner || false,
        },
        mealVariety: 'balanced',
        servings: planServings,
        dietaryRestrictions: selectedDietaryOptions,
        preferredStores: selectedStores.length > 0 ? selectedStores : undefined,
        cookingComplexity: cookingLevel,
        timePerMeal: timePerMeal,
        // Required by backend API
        dailyCalorieTarget: 2000,
        macrosTarget: {
          protein: 25,  // 25% of calories from protein
          carbs: 50,    // 50% of calories from carbs
          fat: 25,      // 25% of calories from fat
        },
      };

      console.log('[CreateMeals] Generating meal plan with request:', JSON.stringify(request, null, 2));
      const apiResult = await mealService.createMealPlanFromDescription(request);
      console.log('[CreateMeals] API Response received:', JSON.stringify(apiResult, null, 2));
      
      // Cast to any for flexible field access during normalization
      const result = apiResult as any;
      
      // ⭐ IMPORTANT: Extract plan data from nested structure
      // API returns: { success, mode, plan: { days, recipes, summary }, _meta }
      const planDataFirst = result.plan || result;
      console.log('[CreateMeals] Plan data keys:', Object.keys(planDataFirst));
      
      // Debug: Log available ID fields
      console.log('[CreateMeals] ID fields:', {
        program_id: planDataFirst.program_id || planDataFirst.mealPlanId,
        plan_id: result.plan_id,
        id: result.id,
        meal_id: result.meal?.id,
      });
      
      // Handle different API response structures - now using planDataFirst
      let daysArrayFirst = planDataFirst.days || planDataFirst.meal_days || result.days || result.meal_days || [];
      
      // Handle API format where meals are separate properties (breakfast, lunch, dinner) instead of meals array
      if (daysArrayFirst.length > 0 && !daysArrayFirst[0].meals && (daysArrayFirst[0].breakfast || daysArrayFirst[0].lunch || daysArrayFirst[0].dinner)) {
        console.log('[CreateMeals] Converting breakfast/lunch/dinner format to meals array');
        daysArrayFirst = daysArrayFirst.map((day: any, idx: number) => {
          const meals: any[] = [];
          
          // Add breakfast if present
          if (day.breakfast) {
            const breakfast = day.breakfast;
            meals.push({
              meal_id: breakfast.meal_id || breakfast.id,
              meal_type: 'breakfast',
              meal_name: breakfast.name || breakfast.meal_name || 'Breakfast',
              description: breakfast.description || '',
              calories: breakfast.nutrition?.calories || breakfast.calories || 0,
              protein: breakfast.nutrition?.protein_g || breakfast.protein || breakfast.protein_g || 0,
              carbs: breakfast.nutrition?.carbs_g || breakfast.carbs || breakfast.carbs_g || 0,
              fat: breakfast.nutrition?.fat_g || breakfast.fat || breakfast.fat_g || 0,
              servings: breakfast.servings || planServings,
              prep_time_min: breakfast.prep_time_min || breakfast.prep_time || breakfast.prepTime || 0,
              cook_time_min: breakfast.cook_time_min || breakfast.cook_time || breakfast.cookTime || 0,
              ingredients: breakfast.ingredients || [],
              instructions: breakfast.instructions || [],
              image_url: breakfast.image_url || breakfast.imageUrl,
            });
          }
          
          // Add lunch if present
          if (day.lunch) {
            const lunch = day.lunch;
            meals.push({
              meal_id: lunch.meal_id || lunch.id,
              meal_type: 'lunch',
              meal_name: lunch.name || lunch.meal_name || 'Lunch',
              description: lunch.description || '',
              calories: lunch.nutrition?.calories || lunch.calories || 0,
              protein: lunch.nutrition?.protein_g || lunch.protein || lunch.protein_g || 0,
              carbs: lunch.nutrition?.carbs_g || lunch.carbs || lunch.carbs_g || 0,
              fat: lunch.nutrition?.fat_g || lunch.fat || lunch.fat_g || 0,
              servings: lunch.servings || planServings,
              prep_time_min: lunch.prep_time_min || lunch.prep_time || lunch.prepTime || 0,
              cook_time_min: lunch.cook_time_min || lunch.cook_time || lunch.cookTime || 0,
              ingredients: lunch.ingredients || [],
              instructions: lunch.instructions || [],
              image_url: lunch.image_url || lunch.imageUrl,
            });
          }
          
          // Add dinner if present
          if (day.dinner) {
            const dinner = day.dinner;
            meals.push({
              meal_id: dinner.meal_id || dinner.id,
              meal_type: 'dinner',
              meal_name: dinner.name || dinner.meal_name || 'Dinner',
              description: dinner.description || '',
              calories: dinner.nutrition?.calories || dinner.calories || 0,
              protein: dinner.nutrition?.protein_g || dinner.protein || dinner.protein_g || 0,
              carbs: dinner.nutrition?.carbs_g || dinner.carbs || dinner.carbs_g || 0,
              fat: dinner.nutrition?.fat_g || dinner.fat || dinner.fat_g || 0,
              servings: dinner.servings || planServings,
              prep_time_min: dinner.prep_time_min || dinner.prep_time || dinner.prepTime || 0,
              cook_time_min: dinner.cook_time_min || dinner.cook_time || dinner.cookTime || 0,
              ingredients: dinner.ingredients || [],
              instructions: dinner.instructions || [],
              image_url: dinner.image_url || dinner.imageUrl,
            });
          }
          
          // Calculate totals
          const total_calories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
          const total_protein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
          const total_carbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
          const total_fat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);
          
          return {
            date: day.date || new Date(Date.now() + idx * 86400000).toISOString().split('T')[0],
            day_number: day.day_number || day.dayNumber || idx + 1,
            day_name: day.day_name || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(new Date().getDay() + idx) % 7],
            meals,
            total_calories,
            total_protein,
            total_carbs,
            total_fat,
            has_breakfast: !!day.breakfast,
            has_lunch: !!day.lunch,
            has_dinner: !!day.dinner,
            has_snacks: false,
          };
        });
        console.log(`[CreateMeals] Converted ${daysArrayFirst.length} days with ${daysArrayFirst.reduce((sum: number, d: any) => sum + d.meals.length, 0)} total meals`);
      }
      
      // Handle recipes array structure (planDataFirst.recipes from /api/meals/create-from-text)
      if (daysArrayFirst.length === 0 && planDataFirst.recipes && planDataFirst.recipes.length > 0) {
        console.log('[CreateMeals] Converting planDataFirst.recipes to days structure');
        const recipes = planDataFirst.recipes;
        
        // Group recipes by day
        const daysMap: { [key: number]: any } = {};
        for (const recipe of recipes) {
          const dayNum = recipe.day || 1;
          if (!daysMap[dayNum]) {
            daysMap[dayNum] = {
              date: new Date(Date.now() + (dayNum - 1) * 86400000).toISOString().split('T')[0],
              day_number: dayNum,
              day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(new Date().getDay() + dayNum - 1) % 7],
              meals: [],
              total_calories: 0,
              total_protein: 0,
              total_carbs: 0,
              total_fat: 0,
            };
          }
          
          const nutrition = recipe.nutritionInfo || recipe.nutrition || {};
          const mealData = {
            meal_id: recipe.id,
            meal_type: recipe.mealType || 'dinner',
            meal_name: recipe.name || 'Meal',
            description: recipe.description || '',
            calories: nutrition.calories || nutrition.caloriesPerServing || 0,
            protein: nutrition.protein || 0,
            carbs: nutrition.carbs || 0,
            fat: nutrition.fat || 0,
            fiber: nutrition.fiber || 0,
            servings: recipe.servings || planServings,
            prep_time_min: recipe.prepTime || recipe.prep_time || 0,
            cook_time_min: recipe.cookTime || recipe.cook_time || 0,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            image_url: recipe.image_url || recipe.imageUrl,
            chef_tips: recipe.chefTips || [],
            seasoning_library: recipe.seasoningLibrary || [],
          };
          
          daysMap[dayNum].meals.push(mealData);
          daysMap[dayNum].total_calories += mealData.calories;
          daysMap[dayNum].total_protein += mealData.protein;
          daysMap[dayNum].total_carbs += mealData.carbs;
          daysMap[dayNum].total_fat += mealData.fat;
        }
        
        // Convert map to sorted array
        daysArrayFirst = Object.values(daysMap).sort((a: any, b: any) => a.day_number - b.day_number);
        
        // Set has_breakfast/lunch/dinner flags
        for (const day of daysArrayFirst) {
          day.has_breakfast = day.meals.some((m: any) => m.meal_type === 'breakfast');
          day.has_lunch = day.meals.some((m: any) => m.meal_type === 'lunch');
          day.has_dinner = day.meals.some((m: any) => m.meal_type === 'dinner');
          day.has_snacks = day.meals.some((m: any) => m.meal_type === 'snack');
        }
        
        console.log(`[CreateMeals] Converted ${recipes.length} recipes into ${daysArrayFirst.length} days`);
      }
      
      // Handle quick mode single meal response - convert to days structure
      if (result.meal && daysArrayFirst.length === 0) {
        const meal = result.meal;
        console.log('[CreateMeals] handleGenerateAIMealPlan: converting single meal to days structure');
        daysArrayFirst = [{
          date: new Date().toISOString().split('T')[0],
          day_number: 1,
          meals: [{
            meal_id: meal.id,
            meal_type: meal.mealType || meal.meal_type || 'dinner',
            meal_name: meal.name || 'Meal',
            calories: meal.nutrition?.caloriesPerServing || meal.calories || 0,
            protein: meal.nutrition?.protein?.amount || meal.protein || 0,
            carbs: meal.nutrition?.carbs?.amount || meal.carbs || 0,
            fat: meal.nutrition?.fat?.amount || meal.fat || 0,
            servings: meal.servings || planServings,
            prep_time_min: meal.prepTime || meal.prep_time || 0,
            cook_time_min: meal.cookTime || meal.cook_time || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || [],
          }],
          total_calories: meal.nutrition?.caloriesPerServing || meal.calories || 0,
        }];
      }
      
      // Normalize the response to handle different API formats
      const normalizedPlan: MealPlanResponse = {
        success: result.success ?? true,
        program_id: planDataFirst.program_id || planDataFirst.mealPlanId || result.plan_id || result.id || result.meal?.id,
        name: planDataFirst.name || result.name || result.meal?.name || `${planDuration}-Day Meal Plan`,
        description: planDataFirst.description || result.description || planDescription || 'Custom meal plan',
        duration_days: planDataFirst.duration || result.duration_days || result.duration || planDuration,
        servings: planDataFirst.parsedRequest?.servings || result.servings || result.meal?.servings || planServings,
        created_at: planDataFirst.generated_at || result.created_at || result.timestamp || new Date().toISOString(),
        days: daysArrayFirst.map((day: any, idx: number) => ({
          date: day.date || new Date(Date.now() + idx * 86400000).toISOString().split('T')[0],
          day_number: day.day_number || day.dayNumber || idx + 1,
          day_name: day.day_name || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(new Date().getDay() + idx) % 7],
          meals: (day.meals || []).map((meal: any) => ({
            meal_id: meal.meal_id || meal.id,
            meal_type: meal.meal_type || meal.type || 'dinner',
            meal_name: meal.meal_name || meal.name || 'Meal',
            description: meal.description || '',
            calories: meal.calories || 0,
            protein: meal.protein || meal.protein_g || 0,
            carbs: meal.carbs || meal.carbs_g || 0,
            fat: meal.fat || meal.fat_g || 0,
            servings: meal.servings || planServings,
            prep_time_min: meal.prep_time_min || meal.prep_time || 0,
            cook_time_min: meal.cook_time_min || meal.cook_time || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || [],
            image_url: meal.image_url || meal.imageUrl,
          })),
          total_calories: day.total_calories || day.totalCalories || 0,
          total_protein: day.total_protein || day.totalProtein || 0,
          total_carbs: day.total_carbs || day.totalCarbs || 0,
          total_fat: day.total_fat || day.totalFat || 0,
          has_breakfast: day.has_breakfast ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'breakfast') || false),
          has_lunch: day.has_lunch ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'lunch') || false),
          has_dinner: day.has_dinner ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'dinner') || false),
          has_snacks: day.has_snacks ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'snack') || false),
        })),
        summary: {
          total_meals: planDataFirst.summary?.total_meals || result.summary?.total_meals || result.total_meals || 
            daysArrayFirst.reduce((sum: number, day: any) => sum + (day.meals?.length || 0), 0),
          avg_calories_per_day: planDataFirst.summary?.avg_calories_per_day || result.summary?.avg_calories_per_day || result.avg_calories_per_day || 
            (result.meal?.nutrition?.caloriesPerServing || 0),
          avg_protein_per_day: planDataFirst.summary?.avg_protein_per_day || result.summary?.avg_protein_per_day || result.avg_protein_per_day || 
            (result.meal?.nutrition?.protein?.amount || 0),
          shopping_list_available: planDataFirst.summary?.shopping_list_available ?? result.summary?.shopping_list_available ?? true,
        },
        preferences_used: result.preferences_used || {
          stores: selectedStores,
          dietary_restrictions: selectedDietaryOptions,
          cooking_skill: cookingLevel,
          meal_variety: 'balanced',
        },
      };
      
      console.log('[CreateMeals] Normalized plan:', JSON.stringify(normalizedPlan, null, 2));
      setGeneratedPlan(normalizedPlan);
      setPlanModalStep('preview');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Failed to generate meal plan. Please try again.'
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSelectQuickGoal = (goal: typeof QUICK_GOALS[0]) => {
    // Generate a proper meal PLAN (not quick meal) with context from the template
    // Uses POST /api/meals/create endpoint for comprehensive meal plan generation
    handleGoalSelectionGenerate({
      mode: 'plan', // Use 'plan' mode to create full meal plans with context
      description: goal.description,
      duration: 7, // Default to 7-day plan for templates
      servings: goal.config.servings || 2,
      mealsPerDay: goal.config.mealsPerDay || { breakfast: true, lunch: true, dinner: true, snack: false },
      cookingLevel: goal.config.cookingComplexity,
      timeConstraint: goal.config.timePerMeal === 'quick' ? 'quick' : goal.config.timePerMeal === 'no_preference' ? 'slow' : 'medium',
      preferredStores: goal.config.preferredStores,
      dietaryRestrictions: [], // Templates can add specific dietary restrictions
    });
  };

  /**
   * Handle generation from GoalSelectionMeals component (3-mode architecture)
   */
  const handleGoalSelectionGenerate = async (params: GenerateMealParams) => {
    console.log('[CreateMeals] GoalSelection params:', JSON.stringify(params, null, 2));
    setIsGeneratingPlan(true);

    try {
      // Build mealsPerDay with proper typing
      const defaultMealsPerDay = {
        breakfast: params.mealType === 'breakfast',
        lunch: params.mealType === 'lunch',
        dinner: params.mealType === 'dinner' || params.mode !== 'quick',
        snack: false,
      };
      
      // Build request based on mode - using /api/meals/create-from-text
      const request: CreateMealPlanRequest = {
        mode: (params.mode === 'saved' ? 'plan' : params.mode) as 'quick' | 'plan' | 'diet', // CRITICAL: Pass mode for proper endpoint routing
        userId: userId,
        description: params.description || `Generate ${params.mode} meal`,
        duration: params.duration || (params.mode === 'quick' ? 1 : 7),
        mealsPerDay: params.mealsPerDay ? {
          breakfast: Boolean(params.mealsPerDay.breakfast),
          lunch: Boolean(params.mealsPerDay.lunch),
          dinner: Boolean(params.mealsPerDay.dinner),
          snack: Boolean(params.mealsPerDay.snack),
        } : defaultMealsPerDay,
        mealVariety: 'balanced',
        servings: params.servings || 2,
        dietaryRestrictions: params.dietaryRestrictions || params.quickDiets || [],
        preferredStores: params.preferredStores,
        cookingComplexity: params.cookingLevel || 'intermediate',
        timePerMeal: params.timeConstraint === 'quick' ? 'quick' : 
                     params.timeConstraint === 'slow' ? 'no_preference' : 'moderate',
        dailyCalorieTarget: params.calorieTarget || 2000,
        macrosTarget: {
          protein: 25,
          carbs: 50,
          fat: 25,
        },
      };

      // Get auth token for saved mode
      const token = await authService.getAccessToken();
      
      // Add mode-specific parameters per MEAL_COMBINATIONS_GUIDE
      if (params.mode === 'saved') {
        // ⭐ Saved mode: Reorder previously created meals
        if (!params.savedMealIds || params.savedMealIds.length === 0) {
          throw new Error('Please select at least one meal plan to reorder');
        }
        
        console.log('[CreateMeals] Reordering saved meals:', params.savedMealIds);
        
        try {
          // Call reorder API endpoint
          const reorderResponse = await fetch(
            `${API_CONFIG.servicesUrl}/api/meals/reorder`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userId,
                savedMealIds: params.savedMealIds,
                servings: params.servings,
              }),
            }
          );
          
          if (!reorderResponse.ok) {
            const errorData = await reorderResponse.json();
            throw new Error(errorData.error || 'Failed to reorder meals');
          }
          
          const reorderData = await reorderResponse.json();
          console.log('[CreateMeals] Reorder successful:', reorderData);
          
          // Show success message
          Alert.alert(
            'Shopping List Created!',
            `${reorderData.totalIngredients} ingredients added to your shopping list.`,
            [
              { text: 'OK', style: 'default' },
              ...(reorderData.instacartUrl ? [
                {
                  text: 'Open Instacart',
                  onPress: () => {
                    // Open Instacart URL
                    if (reorderData.instacartUrl) {
                      Linking.openURL(reorderData.instacartUrl);
                    }
                  },
                },
              ] : []),
            ]
          );
          
          // Navigate back to dashboard
          setShowPlanGenerator(false);
        } catch (error: any) {
          console.error('[CreateMeals] Reorder error:', error);
          throw error; // Will be caught by outer catch
        }
        return;
      } else if (params.mode === 'quick') {
        // ⭐ Multi-select support: Send arrays for meal types and cuisines
        if (params.mealTypes && params.mealTypes.length > 0) {
          request.mealTypes = params.mealTypes as ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert')[];
          // Backward compatibility: also set single value
          request.mealType = params.mealTypes[0] as any;
        } else if (params.mealType) {
          request.mealType = params.mealType as any;
        }
        
        if (params.cuisineTypes && params.cuisineTypes.length > 0) {
          request.cuisineTypes = params.cuisineTypes;
          // Backward compatibility: also set single value
          request.cuisineType = params.cuisineTypes[0];
        } else if (params.cuisineType) {
          request.cuisineType = params.cuisineType;
        }
        
        request.timeConstraint = params.timeConstraint as any;
        
        // Build comprehensive description including all user selections
        const dietaryPart = (params.quickDiets && params.quickDiets.length > 0) 
          ? ` that is ${params.quickDiets.join(', ')}` 
          : '';
        
        // Build description for multi-select
        const mealTypesStr = params.mealTypes && params.mealTypes.length > 0
          ? params.mealTypes.join(', ')
          : (params.mealType || 'dinner');
        const cuisinesStr = params.cuisineTypes && params.cuisineTypes.length > 0
          ? params.cuisineTypes.join(', ')
          : (params.cuisineType || '');
        
        const duration = params.duration || 1;
        const durationText = duration === 1 ? '' : ` for ${duration} days`;
        
        request.description = `Generate ${params.mealTypes && params.mealTypes.length > 1 ? 'meals' : 'a single meal'}: ${mealTypesStr}${
          cuisinesStr ? ` (${cuisinesStr} cuisine)` : ''
        }${durationText}${dietaryPart}${params.timeConstraint ? `, ${params.timeConstraint} prep time` : ''}`;
        request.duration = duration; // Use selected duration (1, 3, or 5 days)
      } else if (params.mode === 'plan') {
        // ⭐ Multi-select support for Plan mode cuisines
        if (params.cuisineTypes && params.cuisineTypes.length > 0) {
          request.cuisineTypes = params.cuisineTypes;
          // Backward compatibility: also set single value
          request.cuisineType = params.cuisineTypes[0];
        } else if (params.cuisineType) {
          request.cuisineType = params.cuisineType;
        }
        
        // Build description with cuisine preferences
        const cuisinesStr = params.cuisineTypes && params.cuisineTypes.length > 0
          ? params.cuisineTypes.join(', ')
          : (params.cuisineType || '');
        
        const baseDescription = params.description || `Create a ${params.duration || 7}-day meal plan`;
        request.description = cuisinesStr 
          ? `${baseDescription} featuring ${cuisinesStr} cuisine${params.cuisineTypes && params.cuisineTypes.length > 1 ? 's' : ''}`
          : baseDescription;
      } else if (params.mode === 'diet') {
        request.description = `Create a ${params.program || 'weight_loss'} program`;
        request.fitnessGoal = params.program === 'muscle_gain' ? 'muscle_gain' : 
                              params.program === 'weight_loss' ? 'weight_loss' : 
                              params.program === 'energy' ? 'energy' :
                              params.program === 'gut_health' ? 'gut_health' :
                              params.program === 'anti_inflammatory' ? 'anti_inflammatory' : 'maintenance';
        request.activityLevel = params.activityLevel as any || 'moderate';
      }

      console.log('[CreateMeals] Sending request to /api/meals/create-from-text:', JSON.stringify(request, null, 2));
      const apiResult = await mealService.createMealPlanFromDescription(request);
      console.log('[CreateMeals] API Response:', JSON.stringify(apiResult, null, 2));

      // Normalize response (same logic as handleGenerateAIMealPlan)
      const result = apiResult as any;
      
      // ⭐ IMPORTANT: Extract plan data from nested structure
      // API returns: { success, mode, plan: { days, recipes, summary }, _meta }
      // We need to extract the plan data first
      const planData = result.plan || result;
      console.log('[CreateMeals] Plan data extracted, keys:', Object.keys(planData));
      
      // ⭐ NEW: Check if meals were auto-saved by the API (plan/diet mode)
      // Plan and Diet mode meals are now automatically saved to the database by the backend
      // Quick mode meals still need manual saving before Instacart
      const isAutoSaved = result._meta?.meals_auto_saved === true || 
                          result.mode === 'plan' || 
                          result.mode === 'diet';
      
      if (isAutoSaved) {
        console.log('[CreateMeals] ✅ Meals were auto-saved by the API (plan/diet mode)');
        setMealsAutoSaved(true);
        
        // Extract meal IDs from the response
        const autoSavedMealIds: string[] = [];
        const extractMealIds = (obj: any) => {
          if (obj?.meal_id && typeof obj.meal_id === 'string') {
            autoSavedMealIds.push(obj.meal_id);
          } else if (obj?.id && typeof obj.id === 'string') {
            autoSavedMealIds.push(obj.id);
          }
        };
        
        // Extract from planData.days (correct path)
        (planData.days || []).forEach((day: any) => {
          ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
            if (day[mealType]) extractMealIds(day[mealType]);
          });
          (day.meals || []).forEach(extractMealIds);
        });
        
        // Also extract from planData.recipes if available
        (planData.recipes || []).forEach(extractMealIds);
        
        if (autoSavedMealIds.length > 0) {
          console.log('[CreateMeals] Found', autoSavedMealIds.length, 'meal IDs:', autoSavedMealIds.slice(0, 5), '...');
          setSavedMealIds(autoSavedMealIds);
        }
      } else {
        console.log('[CreateMeals] Quick mode - meals need manual save before Instacart');
        setMealsAutoSaved(false);
      }
      
      // Handle different API response structures - now using planData
      let daysArray = planData.days || planData.meal_days || result.days || result.meal_days || [];
      
      // Handle API format where meals are separate properties (breakfast, lunch, dinner) instead of meals array
      if (daysArray.length > 0 && !daysArray[0].meals && (daysArray[0].breakfast || daysArray[0].lunch || daysArray[0].dinner)) {
        console.log('[CreateMeals] Converting breakfast/lunch/dinner format to meals array');
        daysArray = daysArray.map((day: any, idx: number) => {
          const meals: any[] = [];
          
          // Add breakfast if present
          if (day.breakfast) {
            const breakfast = day.breakfast;
            meals.push({
              meal_id: breakfast.meal_id || breakfast.id,
              meal_type: 'breakfast',
              meal_name: breakfast.name || breakfast.meal_name || 'Breakfast',
              description: breakfast.description || '',
              calories: breakfast.nutrition?.calories || breakfast.calories || 0,
              protein: breakfast.nutrition?.protein_g || breakfast.protein || breakfast.protein_g || 0,
              carbs: breakfast.nutrition?.carbs_g || breakfast.carbs || breakfast.carbs_g || 0,
              fat: breakfast.nutrition?.fat_g || breakfast.fat || breakfast.fat_g || 0,
              servings: breakfast.servings || request.servings,
              prep_time_min: breakfast.prep_time_min || breakfast.prep_time || breakfast.prepTime || 0,
              cook_time_min: breakfast.cook_time_min || breakfast.cook_time || breakfast.cookTime || 0,
              ingredients: breakfast.ingredients || [],
              instructions: breakfast.instructions || [],
              image_url: breakfast.image_url || breakfast.imageUrl,
            });
          }
          
          // Add lunch if present
          if (day.lunch) {
            const lunch = day.lunch;
            meals.push({
              meal_id: lunch.meal_id || lunch.id,
              meal_type: 'lunch',
              meal_name: lunch.name || lunch.meal_name || 'Lunch',
              description: lunch.description || '',
              calories: lunch.nutrition?.calories || lunch.calories || 0,
              protein: lunch.nutrition?.protein_g || lunch.protein || lunch.protein_g || 0,
              carbs: lunch.nutrition?.carbs_g || lunch.carbs || lunch.carbs_g || 0,
              fat: lunch.nutrition?.fat_g || lunch.fat || lunch.fat_g || 0,
              servings: lunch.servings || request.servings,
              prep_time_min: lunch.prep_time_min || lunch.prep_time || lunch.prepTime || 0,
              cook_time_min: lunch.cook_time_min || lunch.cook_time || lunch.cookTime || 0,
              ingredients: lunch.ingredients || [],
              instructions: lunch.instructions || [],
              image_url: lunch.image_url || lunch.imageUrl,
            });
          }
          
          // Add dinner if present
          if (day.dinner) {
            const dinner = day.dinner;
            meals.push({
              meal_id: dinner.meal_id || dinner.id,
              meal_type: 'dinner',
              meal_name: dinner.name || dinner.meal_name || 'Dinner',
              description: dinner.description || '',
              calories: dinner.nutrition?.calories || dinner.calories || 0,
              protein: dinner.nutrition?.protein_g || dinner.protein || dinner.protein_g || 0,
              carbs: dinner.nutrition?.carbs_g || dinner.carbs || dinner.carbs_g || 0,
              fat: dinner.nutrition?.fat_g || dinner.fat || dinner.fat_g || 0,
              servings: dinner.servings || request.servings,
              prep_time_min: dinner.prep_time_min || dinner.prep_time || dinner.prepTime || 0,
              cook_time_min: dinner.cook_time_min || dinner.cook_time || dinner.cookTime || 0,
              ingredients: dinner.ingredients || [],
              instructions: dinner.instructions || [],
              image_url: dinner.image_url || dinner.imageUrl,
            });
          }
          
          // Calculate totals
          const total_calories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
          const total_protein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
          const total_carbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
          const total_fat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);
          
          return {
            date: day.date || new Date(Date.now() + idx * 86400000).toISOString().split('T')[0],
            day_number: day.day_number || day.dayNumber || idx + 1,
            day_name: day.day_name || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(new Date().getDay() + idx) % 7],
            meals,
            total_calories,
            total_protein,
            total_carbs,
            total_fat,
            has_breakfast: !!day.breakfast,
            has_lunch: !!day.lunch,
            has_dinner: !!day.dinner,
            has_snacks: false,
          };
        });
        console.log(`[CreateMeals] Converted ${daysArray.length} days with ${daysArray.reduce((sum: number, d: any) => sum + d.meals.length, 0)} total meals`);
      }
      
      // Handle recipes array structure (planData.recipes from /api/meals/create-from-text)
      if (daysArray.length === 0 && planData.recipes && planData.recipes.length > 0) {
        console.log('[CreateMeals] Converting planData.recipes to days structure');
        const recipes = planData.recipes;
        
        // Group recipes by day
        const daysMap: { [key: number]: any } = {};
        for (const recipe of recipes) {
          const dayNum = recipe.day || 1;
          if (!daysMap[dayNum]) {
            daysMap[dayNum] = {
              date: new Date(Date.now() + (dayNum - 1) * 86400000).toISOString().split('T')[0],
              day_number: dayNum,
              day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(new Date().getDay() + dayNum - 1) % 7],
              meals: [],
              total_calories: 0,
              total_protein: 0,
              total_carbs: 0,
              total_fat: 0,
            };
          }
          
          const nutrition = recipe.nutritionInfo || recipe.nutrition || {};
          const mealData = {
            meal_id: recipe.id,
            meal_type: recipe.mealType || 'dinner',
            meal_name: recipe.name || 'Meal',
            description: recipe.description || '',
            calories: nutrition.calories || nutrition.caloriesPerServing || 0,
            protein: nutrition.protein || 0,
            carbs: nutrition.carbs || 0,
            fat: nutrition.fat || 0,
            fiber: nutrition.fiber || 0,
            servings: recipe.servings || request.servings,
            prep_time_min: recipe.prepTime || recipe.prep_time || 0,
            cook_time_min: recipe.cookTime || recipe.cook_time || 0,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            image_url: recipe.image_url || recipe.imageUrl,
            chef_tips: recipe.chefTips || [],
            seasoning_library: recipe.seasoningLibrary || [],
          };
          
          daysMap[dayNum].meals.push(mealData);
          daysMap[dayNum].total_calories += mealData.calories;
          daysMap[dayNum].total_protein += mealData.protein;
          daysMap[dayNum].total_carbs += mealData.carbs;
          daysMap[dayNum].total_fat += mealData.fat;
        }
        
        // Convert map to sorted array
        daysArray = Object.values(daysMap).sort((a: any, b: any) => a.day_number - b.day_number);
        
        // Set has_breakfast/lunch/dinner flags
        for (const day of daysArray) {
          day.has_breakfast = day.meals.some((m: any) => m.meal_type === 'breakfast');
          day.has_lunch = day.meals.some((m: any) => m.meal_type === 'lunch');
          day.has_dinner = day.meals.some((m: any) => m.meal_type === 'dinner');
          day.has_snacks = day.meals.some((m: any) => m.meal_type === 'snack');
        }
        
        console.log(`[CreateMeals] Converted ${recipes.length} recipes into ${daysArray.length} days`);
      }
      
      // If we got a single meal (quick mode), convert it to a day with one meal
      if (result.meal && daysArray.length === 0) {
        const meal = result.meal;
        console.log('[CreateMeals] Quick mode: converting single meal to days structure');
        daysArray = [{
          date: new Date().toISOString().split('T')[0],
          day_number: 1,
          day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
          meals: [{
            meal_id: meal.id,
            meal_type: meal.mealType || meal.meal_type || 'dinner',
            meal_name: meal.name || 'Quick Meal',
            description: meal.description || '',
            calories: meal.nutrition?.caloriesPerServing || meal.calories || 0,
            protein: meal.nutrition?.protein?.amount || meal.protein || 0,
            carbs: meal.nutrition?.carbs?.amount || meal.carbs || 0,
            fat: meal.nutrition?.fat?.amount || meal.fat || 0,
            servings: meal.servings || request.servings,
            prep_time_min: meal.prepTime || meal.prep_time || 0,
            cook_time_min: meal.cookTime || meal.cook_time || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || [],
            image_url: meal.image_url || meal.imageUrl,
          }],
          total_calories: meal.nutrition?.caloriesPerServing || meal.calories || 0,
          total_protein: meal.nutrition?.protein?.amount || meal.protein || 0,
          total_carbs: meal.nutrition?.carbs?.amount || meal.carbs || 0,
          total_fat: meal.nutrition?.fat?.amount || meal.fat || 0,
          has_breakfast: (meal.mealType || meal.meal_type) === 'breakfast',
          has_lunch: (meal.mealType || meal.meal_type) === 'lunch',
          has_dinner: (meal.mealType || meal.meal_type) === 'dinner',
          has_snacks: (meal.mealType || meal.meal_type) === 'snack',
        }];
      }
      
      const normalizedPlan: MealPlanResponse = {
        success: result.success ?? true,
        program_id: planData.program_id || planData.mealPlanId || result.plan_id || result.id || result.meal?.id,
        name: planData.name || result.name || result.meal?.name || `${request.duration}-Day Meal Plan`,
        description: planData.description || result.description || request.description,
        duration_days: planData.duration || result.duration_days || result.duration || request.duration,
        servings: planData.parsedRequest?.servings || result.servings || result.meal?.servings || request.servings,
        created_at: planData.generated_at || result.created_at || result.timestamp || new Date().toISOString(),
        days: daysArray.map((day: any, idx: number) => ({
          date: day.date || new Date(Date.now() + idx * 86400000).toISOString().split('T')[0],
          day_number: day.day_number || day.dayNumber || idx + 1,
          day_name: day.day_name || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(new Date().getDay() + idx) % 7],
          meals: (day.meals || []).map((meal: any) => ({
            meal_id: meal.meal_id || meal.id,
            meal_type: meal.meal_type || meal.type || 'dinner',
            meal_name: meal.meal_name || meal.name || 'Meal',
            description: meal.description || '',
            calories: meal.calories || 0,
            protein: meal.protein || meal.protein_g || 0,
            carbs: meal.carbs || meal.carbs_g || 0,
            fat: meal.fat || meal.fat_g || 0,
            servings: meal.servings || request.servings,
            prep_time_min: meal.prep_time_min || meal.prep_time || 0,
            cook_time_min: meal.cook_time_min || meal.cook_time || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || [],
            image_url: meal.image_url || meal.imageUrl,
          })),
          total_calories: day.total_calories || day.totalCalories || 0,
          total_protein: day.total_protein || day.totalProtein || 0,
          total_carbs: day.total_carbs || day.totalCarbs || 0,
          total_fat: day.total_fat || day.totalFat || 0,
          has_breakfast: day.has_breakfast ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'breakfast') || false),
          has_lunch: day.has_lunch ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'lunch') || false),
          has_dinner: day.has_dinner ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'dinner') || false),
          has_snacks: day.has_snacks ?? (day.meals?.some((m: any) => (m.meal_type || m.type) === 'snack') || false),
        })),
        summary: {
          total_meals: planData.summary?.total_meals || result.summary?.total_meals || result.total_meals || 
            daysArray.reduce((sum: number, day: any) => sum + (day.meals?.length || 0), 0),
          avg_calories_per_day: planData.summary?.avg_calories_per_day || result.summary?.avg_calories_per_day || result.avg_calories_per_day || 
            (result.meal?.nutrition?.caloriesPerServing || 0),
          avg_protein_per_day: planData.summary?.avg_protein_per_day || result.summary?.avg_protein_per_day || result.avg_protein_per_day || 
            (result.meal?.nutrition?.protein?.amount || 0),
          shopping_list_available: planData.summary?.shopping_list_available ?? result.summary?.shopping_list_available ?? true,
        },
        preferences_used: result.preferences_used || {
          stores: params.preferredStores || [],
          dietary_restrictions: params.dietaryRestrictions || [],
          cooking_skill: params.cookingLevel || 'intermediate',
          meal_variety: 'balanced',
        },
      };

      console.log('[CreateMeals] Normalized plan:', JSON.stringify(normalizedPlan, null, 2));
      setGeneratedPlan(normalizedPlan);
      setPlanModalStep('preview');
    } catch (error) {
      console.error('[CreateMeals] Error generating from GoalSelection:', error);
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Failed to generate meal. Please try again.'
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleAcceptGeneratedPlan = async () => {
    if (!generatedPlan) return;
    
    console.log('[CreateMeals] Accepting plan:', {
      program_id: generatedPlan.program_id,
      duration_days: generatedPlan.duration_days,
      days_count: generatedPlan.days?.length,
      total_meals: generatedPlan.days?.reduce((sum, d) => sum + (d.meals?.length || 0), 0),
      first_day_meals: generatedPlan.days?.[0]?.meals?.length,
      summary: generatedPlan.summary,
    });
    
    setActiveMealPlan(generatedPlan);
    setAcceptedPlan(generatedPlan);
    setShowPlanGenerator(false);
    setPlanModalStep('goals');
    
    // Extract and save shopping list from the plan
    const items = extractShoppingListFromPlan(generatedPlan);
    const totalItems = Object.values(items).flat().length;
    if (totalItems > 0) {
      setShoppingListItems(items);
      saveShoppingListToStorage(items);
      console.log('[CreateMeals] Shopping list saved with', totalItems, 'items');
    }
    
    // Show success modal instead of Alert
    setShowMealPlanSuccess(true);
  };

  const handleLogToDiary = async () => {
    if (!acceptedPlan || !userId) {
      Alert.alert('Error', 'No meal plan available or user not logged in');
      return;
    }

    try {
      setLoggingToDiary(true);
      
      // Log meals using nutritionService (used by ConsumptionDashboard)
      const token = await authService.getAccessToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        setLoggingToDiary(false);
        return;
      }
      
      let loggedCount = 0;
      for (const [dayIndex, day] of (acceptedPlan.days || []).entries()) {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() + dayIndex);
        
        for (const meal of day.meals || []) {
          await nutritionService.logMeal({
            userId,
            foodName: meal.meal_name || 'Meal',
            calories: meal.calories || 0,
            protein_g: meal.protein || 0,
            carbs_g: meal.carbs || 0,
            fat_g: meal.fat || 0,
            mealType: (meal.meal_type === 'dessert' ? 'snack' : meal.meal_type || 'lunch') as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            servings: meal.servings || 1,
          });
          loggedCount++;
        }
      }
      
      setSavedToDiary(true);
      Alert.alert(
        'Logged to Diary! 📅',
        `${loggedCount} meals have been added to your meal diary. View them in Consumption Dashboard.`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('[CreateMeals] Error logging to diary:', err);
      Alert.alert('Error', err.message || 'Failed to log meals to diary');
    } finally {
      setLoggingToDiary(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!acceptedPlan || !userId) {
      Alert.alert('Error', 'No meal plan available or user not logged in');
      return;
    }

    try {
      setSavingToLibrary(true);
      
      // Convert all unique meals to library recipes
      const seenMealNames = new Set<string>();
      let savedCount = 0;

      for (const day of acceptedPlan.days || []) {
        for (const meal of day.meals || []) {
          const mealName = meal.meal_name || 'Meal';
          if (seenMealNames.has(mealName)) continue;
          seenMealNames.add(mealName);

          await mealService.createMeal(userId, {
            name: mealName,
            meal_type: (meal.meal_type === 'dessert' ? 'snack' : meal.meal_type || 'dinner') as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            ingredients: (meal.ingredients || []).map((ing: any) => ({
              name: ing.name || ing.ingredient || '',
              amount: parseFloat(ing.amount || ing.quantity) || 0,
              unit: ing.unit || '',
            })),
            nutrition: {
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fat: meal.fat || 0,
            },
            serving_size: meal.servings || 1,
            tags: [meal.meal_type || 'dinner'],
          });
          savedCount++;
        }
      }
      
      setSavedToLibrary(true);
      Alert.alert(
        'Saved to Library! 📚',
        `${savedCount} unique recipes have been added to your meal library. Access them from \"My Meals\".`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('[CreateMeals] Error saving to library:', err);
      Alert.alert('Error', err.message || 'Failed to save recipes to library');
    } finally {
      setSavingToLibrary(false);
    }
  };

  const handleSubmitToInstacart = async () => {
    if (!acceptedPlan) {
      Alert.alert('Error', 'No meal plan available. Please create a meal plan first.');
      return;
    }
    
    // Keep success modal open while generating
    setGeneratingList(true);
    
    try {
      let productsLinkUrl: string | null = null;
      let itemCount = 0;
      
      // Strategy 1: If meal plan is saved, use the more efficient /meal-plan/recipe endpoint
      if (mealPlanId) {
        console.log('[Instacart] Using saved meal plan endpoint with ID:', mealPlanId);
        try {
          const response = await createInstacartLinkFromMealPlan(mealPlanId);
          if (response?.productsLinkUrl) {
            productsLinkUrl = response.productsLinkUrl;
            itemCount = response.ingredientCount || 0;
            console.log('[Instacart] Saved meal plan link created successfully');
          }
        } catch (savedPlanError) {
          console.warn('[Instacart] Saved meal plan endpoint failed, falling back to create-list:', savedPlanError);
          // Fall through to Strategy 2
        }
      }
      
      // Strategy 2: Extract items and use /create-list endpoint
      if (!productsLinkUrl) {
        console.log('[Instacart] Using create-list endpoint with extracted items');
        
        // Extract shopping items from the accepted plan
        const extractedItems = extractShoppingListFromPlan(acceptedPlan);
        
        // Flatten all categories into a single array for Instacart
        const allItems: ShoppingListItem[] = [];
        Object.values(extractedItems).forEach(categoryItems => {
          categoryItems.forEach(item => {
            if (item.name) {
              allItems.push({
                name: item.name,
                quantity: item.amount || 1,
                unit: item.unit || 'item',
              });
            }
          });
        });
        
        if (allItems.length === 0) {
          Alert.alert('No Items', 'No ingredients found in this meal plan.');
          setGeneratingList(false);
          return;
        }
        
        itemCount = allItems.length;
        console.log('[Instacart] Creating shopping list with', itemCount, 'items');
        
        const instacartResponse = await createShoppingList(allItems, 'WIHY Meal Plan');
        
        if (instacartResponse?.success && instacartResponse?.data?.productsLinkUrl) {
          productsLinkUrl = instacartResponse.data.productsLinkUrl;
        }
      }
      
      // Handle successful response
      if (productsLinkUrl) {
        // Save the Instacart URL to state and storage
        setInstacartUrl(productsLinkUrl);
        
        // Persist to AsyncStorage for later access
        const planIdentifier = mealPlanId || acceptedPlan?.program_id;
        await saveInstacartUrlToStorage(productsLinkUrl, planIdentifier);
        
        console.log('[Instacart] Shopping link created:', productsLinkUrl);
        
        // Auto-open the Instacart link (deep link) and show shopping list
        try {
          await Linking.openURL(productsLinkUrl);
          console.log('[Instacart] Deep link opened successfully');
        } catch (linkError) {
          console.warn('[Instacart] Failed to open deep link:', linkError);
        }
        
        // Show shopping list modal so user can review/edit when they return
        if (acceptedPlan) {
          const shoppingItems = extractShoppingListFromPlan(acceptedPlan);
          setShoppingListItems(shoppingItems);
          setShowMealPlanSuccess(false);
          setTimeout(() => {
            setShowShoppingListModal(true);
          }, 300);
        }
      } else {
        throw new Error('No Instacart link returned');
      }
    } catch (error: any) {
      console.error('[Instacart] Error:', error);
      // Fallback - save locally
      if (acceptedPlan) {
        const items = extractShoppingListFromPlan(acceptedPlan);
        await saveShoppingListToStorage(items);
      }
      // Show error fallback - open shopping list modal
      if (acceptedPlan) {
        const shoppingItems = extractShoppingListFromPlan(acceptedPlan);
        setShoppingListItems(shoppingItems);
        setShowMealPlanSuccess(false);
        setTimeout(() => {
          setShowShoppingListModal(true);
        }, 300);
      }
    } finally {
      setGeneratingList(false);
    }
  };

  /**
   * Save the meal plan to user's library for future use
   */
  const handleSaveMealPlan = async () => {
    if (!acceptedPlan) {
      Alert.alert('Error', 'No meal plan to save');
      return;
    }

    setSavingMealPlan(true);
    try {
      console.log('[SaveMealPlan] Saving plan:', acceptedPlan.program_id);
      
      // Build the meal program data to save
      const programToSave = {
        user_id: userId,
        program_id: acceptedPlan.program_id,
        name: acceptedPlan.name || `${acceptedPlan.duration_days}-Day Meal Plan`,
        description: acceptedPlan.description || planDescription,
        duration_days: acceptedPlan.duration_days || planDuration,
        servings: acceptedPlan.servings || planServings,
        days: acceptedPlan.days || [],
        summary: acceptedPlan.summary,
        dietary_restrictions: selectedDietaryOptions,
        created_at: acceptedPlan.created_at || new Date().toISOString(),
        status: 'active',
      };

      // Save to backend
      await mealService.createProgram(programToSave as any);
      
      console.log('[SaveMealPlan] Plan saved successfully!');
      setMealPlanSaved(true);
      
      Alert.alert(
        'Saved!',
        'Your meal plan has been saved to your library. Access it anytime from the Consumption Dashboard.',
        [{ text: 'Great!' }]
      );
    } catch (error: any) {
      console.error('[SaveMealPlan] Error saving:', error);
      
      // Fallback: Save to AsyncStorage locally
      try {
        const savedPlans = await AsyncStorage.getItem('saved_meal_plans');
        const plans = savedPlans ? JSON.parse(savedPlans) : [];
        plans.unshift({
          ...acceptedPlan,
          instacart_url: instacartUrl, // Include Instacart URL with saved plan
          saved_at: new Date().toISOString(),
        });
        await AsyncStorage.setItem('saved_meal_plans', JSON.stringify(plans.slice(0, 20))); // Keep last 20
        
        setMealPlanSaved(true);
        Alert.alert(
          'Saved Locally',
          'Your meal plan has been saved to this device.',
          [{ text: 'OK' }]
        );
      } catch (storageError) {
        console.error('[SaveMealPlan] Storage error:', storageError);
        Alert.alert('Error', 'Failed to save meal plan. Please try again.');
      }
    } finally {
      setSavingMealPlan(false);
    }
  };

  const resetPlanGenerator = () => {
    setPlanDescription('');
    setPlanDuration(7);
    setPlanServings(2);
    setSelectedDietaryOptions([]);
    setSelectedStores([]);
    setSelectedMealTypes({ breakfast: true, lunch: true, dinner: true, snack: false });
    setCookingLevel('intermediate');
    setTimePerMeal('moderate');
    setGeneratedPlan(null);
    setPlanModalStep('goals');
    // Reset Instacart state for new plan
    setInstacartUrl(null);
    setMealPlanId(null);
    setMealPlanSaved(false);
    setSavedMealIds([]); // Reset saved meal IDs for new plan
    setMealsAutoSaved(false); // Reset auto-saved flag for new plan
  };

  const toggleDietaryOption = (id: string) => {
    setSelectedDietaryOptions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleStore = (id: string) => {
    setSelectedStores(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleMealType = (type: string) => {
    setSelectedMealTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      unit: 'cups',
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  const handleSaveMeal = async () => {
    if (!mealName.trim()) {
      Alert.alert('Missing Information', 'Please enter a meal name');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setSaving(true);

    try {
      const mealIngredients = ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ({
          name: ing.name,
          amount: parseFloat(ing.amount) || 0,
          unit: ing.unit,
        }));

      // Build nutrition object only if values provided (backend can calculate from ingredients)
      const nutrition = (calories || protein || carbs || fat) ? {
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      } : undefined;

      const mealData = {
        name: mealName.trim(),
        meal_type: mealType,
        ingredients: mealIngredients,
        nutrition,
        tags: selectedTags,
        notes: notes.trim() || undefined,
        serving_size: parseFloat(servingSize) || 1,
      };

      await mealService.createMeal(userId, mealData);

      Alert.alert(
        'Meal Saved! 🎉',
        `${mealName} has been added to your meal library!`,
        [
          { text: 'Create Another', onPress: () => resetForm() },
          { text: 'Done' },
        ]
      );
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save meal. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setMealName('');
    setServingSize('1');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealType('lunch');
    setSelectedTags([]);
    setNotes('');
    setIngredients([]);
  };

  // Library Functions
  const loadLibraryMeals = async (searchQuery?: string, filterTag?: string | null) => {
    setLoadingLibrary(true);
    try {
      if (!userId) {
        console.log('[CreateMeals] User not available for library load');
        setAllMeals([]);
        return;
      }

      // Use mealService to fetch user meals
      const response = await mealService.getUserMeals(userId, {
        limit: 100,
      });

      // Filter by search and meal type locally
      let apiMeals = ((response as any)?.meals || response || []).map((recipe: any) => ({
        meal_id: recipe.recipe_id,
        user_id: recipe.user_id || userId,
        name: recipe.name,
        nutrition: recipe.nutrition,
        ingredients: Array.isArray(recipe.ingredients) 
          ? recipe.ingredients.filter((ing: any) => typeof ing === 'object' && 'amount' in ing)
          : [],
        tags: recipe.tags || [],
        notes: recipe.notes || '',
        is_favorite: recipe.is_favorite || false,
        times_logged: recipe.times_used || 0,
        created_at: recipe.created_at || new Date().toISOString(),
        updated_at: recipe.updated_at || new Date().toISOString(),
        serving_size: recipe.serving_size || 1,
        preparation_time: recipe.preparation_time,
        cooking_time: recipe.cooking_time,
        instructions: recipe.instructions || [],
      })) as SavedMeal[];

      // Apply client-side filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        apiMeals = apiMeals.filter(meal => 
          meal.name.toLowerCase().includes(query) ||
          meal.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (filterTag) {
        const tag = filterTag.toLowerCase();
        apiMeals = apiMeals.filter(meal =>
          meal.tags.some(t => t.toLowerCase() === tag)
        );
      }

      setAllMeals(apiMeals);
      console.log('[CreateMeals] Loaded', apiMeals.length, 'recipes from Meal Library');
    } catch (error) {
      console.log('[CreateMeals] Error loading library meals:', error);
      // Set empty array - let UI show empty state
      setAllMeals([]);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleLibrarySearch = (query: string) => {
    setLibrarySearchQuery(query);
    loadLibraryMeals(query, libraryFilterTag);
  };

  const handleLibraryFilterByTag = (tag: string) => {
    const newTag = libraryFilterTag === tag ? null : tag;
    setLibraryFilterTag(newTag);
    loadLibraryMeals(librarySearchQuery, newTag);
  };

  const getMealIcon = (mealTags: string[]) => {
    if (mealTags.includes('Breakfast')) return '🍳';
    if (mealTags.includes('Lunch')) return '🥗';
    if (mealTags.includes('Dinner')) return '🍽️';
    if (mealTags.includes('Snack')) return '🍎';
    return '🍴';
  };

  // Delete meal handler
  const handleDeleteMeal = async (mealId: string, mealName: string) => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await authService.getAccessToken();
              if (!token) {
                Alert.alert('Error', 'Authentication token not available');
                return;
              }

              const mealDiaryService = getMealDiaryService(token);
              await mealDiaryService.deleteMeal(userId, mealId);
              
              // Update local state - remove from savedMeals
              setSavedMeals(prev => prev.filter(m => m.meal_id !== mealId));
              
              // Update allMeals if library is open
              setAllMeals(prev => prev.filter(m => m.meal_id !== mealId));
              
              // Close meal details if it's open
              if (selectedMeal?.meal_id === mealId) {
                setShowMealDetails(false);
                setSelectedMeal(null);
              }
              
              console.log('[CreateMeals] Meal deleted:', mealId);
              Alert.alert('Success', 'Meal deleted successfully');
            } catch (error) {
              console.error('[CreateMeals] Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Helper function to extract and categorize ingredients from generated meal plan
  const extractShoppingListFromPlan = (plan: MealPlanResponse | null) => {
    if (!plan?.days) {
      return { produce: [], proteins: [], pantry: [], dairy: [], grains: [], other: [] };
    }

    // Category keywords for classification
    const categoryKeywords = {
      proteins: ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'egg', 'tofu', 'tempeh', 'lamb', 'steak', 'bacon', 'sausage'],
      produce: ['spinach', 'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'broccoli', 'carrot', 'celery', 'cucumber', 'mushroom', 'zucchini', 'asparagus', 'kale', 'cabbage', 'potato', 'sweet potato', 'avocado', 'lemon', 'lime', 'apple', 'banana', 'berry', 'orange'],
      dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese', 'parmesan', 'mozzarella', 'feta'],
      grains: ['rice', 'pasta', 'bread', 'tortilla', 'quinoa', 'oat', 'flour', 'noodle', 'couscous', 'barley'],
      pantry: ['oil', 'olive oil', 'vinegar', 'soy sauce', 'salt', 'pepper', 'spice', 'herb', 'rosemary', 'thyme', 'basil', 'oregano', 'cumin', 'paprika', 'cinnamon', 'honey', 'maple syrup', 'sugar', 'stock', 'broth'],
    };

    const categorizedItems: Record<string, Array<{ name: string; amount: number; unit: string }>> = {
      produce: [],
      proteins: [],
      dairy: [],
      grains: [],
      pantry: [],
      other: [],
    };

    // Extract all ingredients from all meals
    plan.days.forEach(day => {
      day.meals?.forEach(meal => {
        meal.ingredients?.forEach(ingredient => {
          // Skip if ingredient or name is undefined
          if (!ingredient?.name) return;
          
          const name = ingredient.name.toLowerCase();
          let assigned = false;

          // Categorize based on keywords
          for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => name.includes(keyword))) {
              categorizedItems[category].push({
                name: ingredient.name,
                amount: ingredient.amount || 0,
                unit: ingredient.unit || '',
              });
              assigned = true;
              break;
            }
          }

          // If not matched, put in "other"
          if (!assigned) {
            categorizedItems.other.push({
              name: ingredient.name,
              amount: ingredient.amount || 0,
              unit: ingredient.unit || '',
            });
          }
        });
      });
    });

    // Merge duplicates and format for display
    const mergeIngredients = (items: Array<{ name: string; amount: number; unit: string }>) => {
      const merged: Record<string, { name: string; amount: number; unit: string }> = {};
      items.forEach(item => {
        if (!item?.name) return;
        const key = `${item.name.toLowerCase()}-${item.unit || ''}`;
        if (merged[key]) {
          merged[key].amount += item.amount || 0;
        } else {
          merged[key] = { ...item };
        }
      });
      return Object.values(merged);
    };

    return {
      produce: mergeIngredients(categorizedItems.produce),
      proteins: mergeIngredients(categorizedItems.proteins),
      dairy: mergeIngredients(categorizedItems.dairy),
      grains: mergeIngredients(categorizedItems.grains),
      pantry: mergeIngredients(categorizedItems.pantry),
      other: mergeIngredients(categorizedItems.other),
    };
  };

  // Format ingredient for display
  const formatIngredient = (item: { name: string; amount: number; unit: string }) => {
    const amount = item.amount > 0 ? `${item.amount} ${item.unit}` : '';
    return amount ? `${amount} ${item.name}` : item.name;
  };

  const handleScanRecipe = () => {
    // Navigate to Camera screen with label reader mode for scanning recipes
    navigation.navigate('Camera', { mode: 'label' });
  };

  const handleShowTemplates = async () => {
    try {
      setShowTemplates(true);
      const allTemplates = await mealService.getTemplates();
      setTemplates(allTemplates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates. Templates endpoint may not be available yet.');
      setShowTemplates(false);
    }
  };

  const handleUseTemplate = async (template: LocalMealTemplate) => {
    setMealName(template.name);
    setCalories(template.nutrition?.calories?.toString() || '');
    setProtein(template.nutrition?.protein?.toString() || '');
    setCarbs(template.nutrition?.carbs?.toString() || '');
    setFat(template.nutrition?.fat?.toString() || '');
    setServingSize(template.servings?.toString() || '1');
    setSelectedTags(template.tags || []);
    
    // Set meal type based on category if available
    const category = template.category?.toLowerCase();
    if (category === 'breakfast' || category === 'lunch' || category === 'dinner' || category === 'snack') {
      setMealType(category);
    }
    
    const templateIngredients: Ingredient[] = (template.ingredients || []).map((ing, index) => ({
      id: Date.now().toString() + index,
      name: ing.name || '',
      amount: ing.amount?.toString() || '',
      unit: ing.unit || '',
    }));
    setIngredients(templateIngredients);

    setNotes(template.description ? `Template: ${template.description}` : '');
    setShowTemplates(false);
    setViewMode('create');

    Alert.alert(
      'Template Loaded! ✨',
      `${template.name} has been loaded. Edit as needed and save to your library.`,
      [{ text: 'OK' }]
    );
  };

  const handleCreateMealPlan = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!mealName.trim()) {
      Alert.alert('Missing Information', 'Please enter a meal name first');
      return;
    }

    setSaving(true);
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);

      const requestData = {
        clientId: userId,
        name: `${mealName} - Weekly Plan`,
        description: notes.trim() || `7-day meal plan based on ${mealName}`,
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dailyCalorieTarget: parseInt(calories) || 2000,
        macrosTarget: {
          protein: parseFloat(protein) || 30,
          carbs: parseFloat(carbs) || 40,
          fat: parseFloat(fat) || 30,
        },
        dietaryRestrictions: selectedTags.filter(tag => 
          ['Vegan', 'Gluten-Free', 'Low Carb'].includes(tag)
        ).map(tag => tag.toLowerCase().replace(' ', '-')),
      };

      console.log('Creating meal plan with data:', requestData);
      const mealPlan = await createMealPlan(requestData);
      console.log('Meal plan created successfully:', mealPlan);

      setMealPlanId(mealPlan.id);
      Alert.alert(
        'Meal Plan Created',
        `7-day plan created. Generate a shopping list to get started.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating meal plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Failed to Create Meal Plan',
        `Unable to create meal plan. Please try again.\n\nError: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlanId) {
      Alert.alert('No Meal Plan', 'Please create a meal plan first');
      return;
    }

    setGeneratingList(true);
    try {
      console.log('Generating shopping list for meal plan:', mealPlanId);
      const shoppingList = await generateShoppingList(mealPlanId);
      console.log('Shopping list generated:', shoppingList);
      
      Alert.alert(
        'Shopping List Ready',
        `${shoppingList.totalItems} items organized by category`,
        [
          {
            text: 'View List',
            onPress: () => {
              navigation.navigate('ShoppingList', {
                mealPlanId,
                shoppingListData: shoppingList,
              });
            },
          },
          { text: 'Later', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error generating shopping list:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Failed to Generate Shopping List',
        `Unable to generate shopping list. Please try again.\n\nError: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingList(false);
    }
  };

  // Render Horizontal Day Picker
  const renderDayPicker = () => {
    const days = getCalendarDays().filter(d => d !== null) as Date[];
    const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <View style={styles.dayPickerContainer}>
        {/* Month Header */}
        <View style={styles.dayPickerHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.dayPickerNavButton}>
            <SvgIcon name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.dayPickerMonthText}>{monthName}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.dayPickerNavButton}>
            <SvgIcon name="chevron-forward" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrolling Days */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPickerScroll}
        >
          {days.map((date, index) => {
            const isTodayDate = isToday(date);
            const isPast = isPastDate(date);
            const hasMeal = hasMealPlanned(date);
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Color coding
            const mealColors = [
              { bg: '#fef3c7', border: '#f59e0b', text: '#f59e0b' }, // Breakfast yellow
              { bg: '#dbeafe', border: '#3b82f6', text: '#3b82f6' }, // Blue
              { bg: '#d1fae5', border: '#10b981', text: '#10b981' }, // Green
              { bg: '#ede9fe', border: '#8b5cf6', text: '#8b5cf6' }, // Purple
            ];
            const colorIndex = date.getDate() % mealColors.length;
            const mealColor = mealColors[colorIndex];

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayPickerItem,
                  hasMeal && !isPast && !isTodayDate && {
                    backgroundColor: mealColor.bg,
                    borderWidth: 2,
                    borderColor: mealColor.border,
                  },
                  isPast && hasMeal && styles.dayPickerItemCompleted,
                  isPast && !hasMeal && styles.dayPickerItemPast,
                  isTodayDate && styles.dayPickerItemToday,
                  isSelected && !isTodayDate && styles.dayPickerItemSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayPickerDayName,
                  hasMeal && !isPast && !isTodayDate && { color: mealColor.text },
                  isPast && styles.dayPickerTextPast,
                  isTodayDate && styles.dayPickerTextToday,
                ]}>
                  {dayName}
                </Text>
                <Text style={[
                  styles.dayPickerDayNumber,
                  hasMeal && !isPast && !isTodayDate && { color: mealColor.text, fontWeight: '700' },
                  isPast && styles.dayPickerTextPast,
                  isTodayDate && styles.dayPickerTextToday,
                ]}>
                  {date.getDate()}
                </Text>
                {hasMeal && !isPast && (
                  <View style={[styles.dayPickerMealDot, { backgroundColor: mealColor.border }]} />
                )}
                {isPast && hasMeal && (
                  <SvgIcon name="checkmark-circle" size={14} color="#10b981" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render Dashboard View
  const renderDashboard = () => (
    <View style={{ flex: 1, backgroundColor: '#e0f2fe' }}>
      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#ef4444' }} />
      
      {/* Back button for web */}
      {Platform.OS === 'web' && (
        isDashboardMode && onBack ? (
          // Coach Hub mode - use BackToHubButton
          <BackToHubButton
            hubName="Coach Hub"
            color="#ef4444"
            onPress={onBack}
            isMobileWeb={layout.screenWidth < 768}
            spinnerGif={spinnerGif}
          />
        ) : !isDashboardMode ? (
          // Health Hub mode - use Health Hub button
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: 'absolute',
              top: layout.screenWidth < 768 ? 12 : 40,
              right: layout.screenWidth < 768 ? 12 : 24,
              zIndex: 99,
              flexDirection: 'row',
              alignItems: 'center',
              gap: layout.screenWidth < 768 ? 6 : 10,
              paddingVertical: layout.screenWidth < 768 ? 4 : 6,
              paddingLeft: layout.screenWidth < 768 ? 8 : 12,
              paddingRight: layout.screenWidth < 768 ? 4 : 6,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
            } as any}
          >
            <SvgIcon name="arrow-back" size={layout.screenWidth < 768 ? 14 : 16} color="#16a34a" />
            <Text style={{ fontSize: layout.screenWidth < 768 ? 11 : 13, fontWeight: '600', color: '#16a34a' }}>Health Hub</Text>
            <Image 
              source={spinnerGif}
              resizeMode="cover"
              style={{
                width: layout.screenWidth < 768 ? 28 : 36,
                height: layout.screenWidth < 768 ? 28 : 36,
                borderRadius: layout.screenWidth < 768 ? 14 : 18,
              }}
            />
          </TouchableOpacity>
        ) : null
      )}
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View style={[styles.dashboardHeaderContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
          <Text style={styles.dashboardHeaderTitle}>Meal Planning</Text>
          <Text style={styles.dashboardHeaderSubtitle}>Plan your nutrition journey</Text>
        </Animated.View>
      </Animated.View>
      
      {/* Create AI Meal Plan Button - Outside Header */}
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={styles.createPlanButtonInHeader}
          onPress={() => {
            if (!hasMealAccess) {
              setShowUpgrade(true);
              return;
            }
            setShowPlanGenerator(true);
          }}
        >
          <LinearGradient
            colors={['#4cbb17', '#22c55e']}
            style={styles.createPlanGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <SvgIcon name="add-circle" size={28} color="#ffffff" />
            <View style={styles.createPlanTextContainer}>
              <Text style={styles.createPlanTitle}>Create Wihy Meal Plan</Text>
              <Text style={styles.createPlanSubtitle}>Generate personalized meals & shopping list</Text>
            </View>
            <SvgIcon name="chevron-forward" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />
        }
      >

      {/* Day Picker - Now below the create button */}
      {renderDayPicker()}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setViewMode('create')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
              <SvgIcon name="add-circle" size={28} color="#3b82f6" />
            </View>
            <Text style={styles.quickActionTitle}>Create Meal</Text>
            <Text style={styles.quickActionSubtitle}>Add manually</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={handleScanRecipe}
            disabled={scanning}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#d1fae5' }]}>
              {scanning ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <SvgIcon name="camera" size={28} color="#10b981" />
              )}
            </View>
            <Text style={styles.quickActionTitle}>Scan Recipe</Text>
            <Text style={styles.quickActionSubtitle}>From photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => {
              loadLibraryMeals();
              setShowLibrary(true);
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
              <SvgIcon name="book" size={28} color="#8b5cf6" />
            </View>
            <Text style={styles.quickActionTitle}>My Meals</Text>
            <Text style={styles.quickActionSubtitle}>Saved recipes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setViewMode('calendar')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
              <SvgIcon name="calendar" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.quickActionTitle}>Calendar</Text>
            <Text style={styles.quickActionSubtitle}>View meal plan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={async () => {
              setShoppingListLoading(true);
              try {
                // First check if we have items in memory
                if (shoppingListItems && Object.values(shoppingListItems).flat().length > 0) {
                  setShowShoppingListModal(true);
                  return;
                }
                
                // Try to load from API first, then storage
                const loadedItems = await loadShoppingList();
                if (loadedItems && Object.values(loadedItems).flat().length > 0) {
                  setShowShoppingListModal(true);
                  return;
                }
                
                // Try to extract from accepted plan
                if (acceptedPlan) {
                  const items = extractShoppingListFromPlan(acceptedPlan);
                  if (Object.values(items).flat().length > 0) {
                    setShoppingListItems(items);
                    saveShoppingListToStorage(items);
                    setShowShoppingListModal(true);
                    return;
                  }
                }
                
                // No items found - show empty state modal
                setShowShoppingListModal(true);
              } finally {
                setShoppingListLoading(false);
              }
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
              {shoppingListLoading ? (
                <ActivityIndicator color="#22c55e" />
              ) : (
                <SvgIcon name="cart" size={28} color="#22c55e" />
              )}
            </View>
            <Text style={styles.quickActionTitle}>Shopping List</Text>
            <Text style={styles.quickActionSubtitle}>View items</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Meals (if plan exists) */}
      {activeMealPlan && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <TouchableOpacity onPress={() => setViewMode('calendar')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.todaysMealsCard}>
            {Object.entries(mealTypeConfig).map(([type, config]) => {
              // Find meal for this type from today's meals or active plan
              const todayDate = new Date().toISOString().split('T')[0];
              const todayPlanDay = activeMealPlan?.days?.find(d => d.date === todayDate) 
                || activeMealPlan?.days?.[0]; // Fallback to first day
              const mealForType = todayPlanDay?.meals?.find(
                (m: any) => m.meal_type?.toLowerCase() === type.toLowerCase()
              );
              
              return (
                <TouchableOpacity 
                  key={type} 
                  style={styles.mealTypeRow}
                  onPress={() => {
                    if (mealForType) {
                      // Show meal details if meal exists - cast to any for flexibility
                      const meal = mealForType as any;
                      const mealData = {
                        meal_id: meal.meal_id,
                        name: meal.meal_name || meal.name || 'Meal',
                        nutrition: meal.nutrition || {
                          calories: meal.calories || 0,
                          protein: meal.protein || 0,
                          carbs: meal.carbs || 0,
                          fat: meal.fat || 0,
                        },
                        tags: [type],
                        ingredients: meal.ingredients || [],
                        instructions: meal.instructions || [],
                        preparation_time: meal.prep_time || meal.preparation_time || 10,
                        cooking_time: meal.cook_time || meal.cooking_time || 15,
                        serving_size: meal.servings || meal.serving_size || 1,
                      };
                      setSelectedMeal(mealData as any);
                      setShowMealDetails(true);
                    } else {
                      // Navigate to create meal for this type
                      setViewMode('create');
                    }
                  }}
                >
                  <View style={[styles.mealTypeIcon, { backgroundColor: config.bgColor }]}>
                    <SvgIcon name={config.icon as any} size={20} color={config.color} />
                  </View>
                  <View style={styles.mealTypeInfo}>
                    <Text style={styles.mealTypeLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                    <Text style={styles.mealTypeName} numberOfLines={1}>
                      {mealForType 
                        ? ((mealForType as any).meal_name || (mealForType as any).name || 'Meal planned')
                        : 'Tap to add meal'}
                    </Text>
                  </View>
                  {mealForType ? (
                    <SvgIcon name="checkmark-circle" size={24} color="#22c55e" />
                  ) : (
                    <SvgIcon name="add-circle-outline" size={24} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Quick Templates */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Templates</Text>
          <TouchableOpacity onPress={handleShowTemplates}>
            <Text style={styles.sectionLink}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {QUICK_TEMPLATE_PRESETS.slice(0, 4).map((preset, index) => (
            <TouchableOpacity 
              key={preset.id}
              style={styles.templatePreviewCard}
              onPress={() => {
                // Pass the template to GoalSelectionMeals for pre-filled Plan mode
                setSelectedTemplatePreset(preset);
                setShowPlanGenerator(true);
              }}
            >
              <View style={[
                styles.templatePreviewIcon,
                { backgroundColor: index % 2 === 0 ? '#fef3c7' : '#dbeafe' }
              ]}>
                <Text style={{ fontSize: 24 }}>{preset.icon}</Text>
              </View>
              <Text style={styles.templatePreviewName} numberOfLines={1}>
                {preset.label}
              </Text>
              <Text style={styles.templatePreviewMacros}>
                {preset.description.slice(0, 20)}...
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recent Meals */}
      {savedMeals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Meals</Text>
            <TouchableOpacity onPress={() => {
              loadLibraryMeals();
              setShowLibrary(true);
            }}>
              <Text style={styles.sectionLink}>View Library</Text>
            </TouchableOpacity>
          </View>
          
          {savedMeals.slice(0, 3).map((meal, index) => (
            <TouchableOpacity 
              key={meal.meal_id || index} 
              style={styles.recentMealCard}
              onPress={() => {
                setSelectedMeal(meal);
                setMealServings(meal.serving_size || 1);
                setShowMealDetails(true);
              }}
            >
              <View style={styles.recentMealInfo}>
                <Text style={styles.recentMealName}>{meal.name}</Text>
                <Text style={styles.recentMealMacros}>
                  {meal.nutrition.calories} cal • {meal.nutrition.protein}g protein
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  style={styles.recentMealAction}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteMeal(meal.meal_id, meal.name);
                  }}
                >
                  <SvgIcon name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Ask WiHY Button */}
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
        <SweepBorder
          borderWidth={2}
          radius={28}
          durationMs={2500}
          colors={['#4cbb17', '#32cd32', '#228b22', '#4cbb17']}
        >
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              gap: 10,
              backgroundColor: '#ffffff',
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => navigation.navigate('FullChat', {
              context: {
                type: 'meal-planning',
                source: 'create-meals',
              },
              initialMessage: 'Help me plan healthy meals for the week',
            })}
          >
            <SvgIcon name="chatbubble-ellipses" size={22} color="#4cbb17" />
            <Text style={{ fontSize: 17, color: '#4cbb17', fontWeight: '600' }}>Ask WiHY</Text>
          </TouchableOpacity>
        </SweepBorder>
      </View>

      <View style={{ height: 120 }} />
    </Animated.ScrollView>
    </View>
  );

  // Render Library View
  const renderLibraryModal = () => {
    const libraryTags = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'High Protein', 'Low Carb', 'Vegan', 'Favorites'];
    
    return (
      <Modal
        visible={showLibrary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLibrary(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#8b5cf6' }} edges={['top']}>
          <View style={{ flex: 1, backgroundColor: '#e0f2fe' }}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              refreshControl={
                <RefreshControl 
                  refreshing={loadingLibrary} 
                  onRefresh={() => loadLibraryMeals(librarySearchQuery, libraryFilterTag)} 
                  tintColor="#8b5cf6" 
                />
              }
            >
              {/* Header */}
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.libraryModalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.libraryModalHeaderRow}>
                  <View style={{ width: 40 }} />
                  <TouchableOpacity
                    style={styles.libraryModalCloseButton}
                    onPress={() => setShowLibrary(false)}
                  >
                    <SvgIcon name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.libraryModalTitle}>Meal Library</Text>
                <Text style={styles.libraryModalSubtitle}>{allMeals.length} meals saved</Text>
              </LinearGradient>

          {/* Search Bar */}
          <View style={styles.librarySearchContainer}>
            <SvgIcon name="search" size={20} color="#9ca3af" style={styles.librarySearchIcon} />
            <TextInput
              style={styles.librarySearchInput}
              placeholder="Search meals..."
              value={librarySearchQuery}
              onChangeText={handleLibrarySearch}
              placeholderTextColor="#9ca3af"
            />
            {librarySearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleLibrarySearch('')}>
                <SvgIcon name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.libraryTagsScroll}
            contentContainerStyle={styles.libraryTagsContainer}
          >
            {libraryTags.map((tag) => (
              <TouchableOpacity
              key={tag}
              style={[
                styles.libraryFilterTag,
                libraryFilterTag === tag && styles.libraryFilterTagActive,
              ]}
              onPress={() => handleLibraryFilterByTag(tag)}
            >
              <Text
                style={[
                  styles.libraryFilterTagText,
                  libraryFilterTag === tag && styles.libraryFilterTagTextActive,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meals Count */}
        <View style={styles.libraryHeader}>
          <Text style={styles.libraryCount}>
            {allMeals.length} {allMeals.length === 1 ? 'meal' : 'meals'}
          </Text>
          <TouchableOpacity 
            style={styles.addMealButton}
            onPress={() => setViewMode('create')}
          >
            <SvgIcon name="add" size={18} color="#fff" />
            <Text style={styles.addMealButtonText}>Add Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loadingLibrary && allMeals.length === 0 && (
          <View style={styles.libraryLoadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.libraryLoadingText}>Loading your meals...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loadingLibrary && allMeals.length === 0 && (
          <View style={styles.libraryEmptyState}>
            <SvgIcon name="restaurant-outline" size={64} color="#d1d5db" />
            <Text style={styles.libraryEmptyTitle}>No meals yet</Text>
            <Text style={styles.libraryEmptySubtitle}>
              {librarySearchQuery || libraryFilterTag
                ? 'Try adjusting your search or filters'
                : 'Create your first meal to get started'}
            </Text>
            {!librarySearchQuery && !libraryFilterTag && (
              <TouchableOpacity
                style={styles.libraryCreateButton}
                onPress={() => setViewMode('create')}
              >
                <SvgIcon name="add-circle" size={20} color="#fff" />
                <Text style={styles.libraryCreateButtonText}>Create Meal</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Meals List */}
        {allMeals.map((meal) => (
          <TouchableOpacity
            key={meal.meal_id}
            style={styles.libraryMealCard}
            onPress={() => {
              setSelectedMeal(meal);
              setMealServings(meal.serving_size || 1);
              setShowMealDetails(true);
            }}
          >
            <View style={styles.libraryMealHeader}>
              <View style={styles.libraryMealIcon}>
                <Text style={styles.libraryMealIconText}>{getMealIcon(meal.tags || [])}</Text>
              </View>
              <View style={styles.libraryMealInfo}>
                <Text style={styles.libraryMealName}>{meal.name}</Text>
                <Text style={styles.libraryMealStats}>
                  {meal.nutrition.calories} cal • {meal.nutrition.protein}g protein
                </Text>
              </View>
              {meal.is_favorite && (
                <SvgIcon name="heart" size={20} color="#ef4444" />
              )}
            </View>

            <View style={styles.libraryMealMacros}>
              <View style={styles.libraryMacroItem}>
                <Text style={styles.libraryMacroValue}>{meal.nutrition.protein}g</Text>
                <Text style={styles.libraryMacroLabel}>Protein</Text>
              </View>
              <View style={styles.libraryMacroItem}>
                <Text style={styles.libraryMacroValue}>{meal.nutrition.carbs}g</Text>
                <Text style={styles.libraryMacroLabel}>Carbs</Text>
              </View>
              <View style={styles.libraryMacroItem}>
                <Text style={styles.libraryMacroValue}>{meal.nutrition.fat}g</Text>
                <Text style={styles.libraryMacroLabel}>Fat</Text>
              </View>
            </View>

            {meal.tags && meal.tags.length > 0 && (
              <View style={styles.libraryMealTags}>
                {meal.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.libraryMealTag}>
                    <Text style={styles.libraryMealTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.libraryMealFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteMeal(meal.meal_id, meal.name);
                  }}
                  style={{ padding: 4 }}
                >
                  <SvgIcon name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
                <Text style={styles.libraryMealTimesLogged}>
                  Logged {meal.times_logged || 0} {meal.times_logged === 1 ? 'time' : 'times'}
                </Text>
              </View>
              <SvgIcon name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Render Create Meal Form
  const renderCreateMealForm = () => (
    <View style={styles.formContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Inside ScrollView like FitnessDashboard */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.formHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity 
            style={styles.headerBackButtonWhite}
            onPress={() => setViewMode('dashboard')}
          >
            <SvgIcon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.formHeaderTitleWhite}>Create Meal</Text>
          <Text style={styles.formHeaderSubtitle}>Add a new meal to your library</Text>
        </LinearGradient>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>Meal Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Grilled Chicken Salad"
              value={mealName}
              onChangeText={setMealName}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Serving Size</Text>
            <View style={styles.servingContainer}>
              <TextInput
                style={[styles.input, styles.servingInput]}
                placeholder="1"
                value={servingSize}
                onChangeText={setServingSize}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.servingUnit}>serving(s)</Text>
            </View>

            <Text style={styles.label}>Meal Type *</Text>
            <View style={styles.mealTypeContainer}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    mealType === type && styles.mealTypeButtonSelected,
                  ]}
                  onPress={() => setMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      mealType === type && styles.mealTypeTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Nutrition Facts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Facts (per serving) - Optional</Text>
          
          <View style={styles.card}>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {calories && protein && carbs && fat && (
              <View style={styles.nutritionSummary}>
                <SvgIcon name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.summaryText}>
                  Total Macros: {protein}g protein • {carbs}g carbs • {fat}g fat
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Pressable onPress={addIngredient} style={styles.addButton}>
              <SvgIcon name="add-circle" size={20} color="#3b82f6" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            {ingredients.length === 0 ? (
              <View style={styles.emptyState}>
                <SvgIcon name="list" size={32} color="#d1d5db" />
                <Text style={styles.emptyText}>No ingredients added</Text>
              </View>
            ) : (
              ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientRow}>
                  <TextInput
                    style={[styles.input, styles.ingredientName]}
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
                    placeholderTextColor="#9ca3af"
                  />
                  <TextInput
                    style={[styles.input, styles.ingredientAmount]}
                    placeholder="0"
                    value={ingredient.amount}
                    onChangeText={(value) => updateIngredient(ingredient.id, 'amount', value)}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                  <TextInput
                    style={[styles.input, styles.ingredientUnit]}
                    placeholder="cups"
                    value={ingredient.unit}
                    onChangeText={(value) => updateIngredient(ingredient.id, 'unit', value)}
                    placeholderTextColor="#9ca3af"
                  />
                  <Pressable onPress={() => removeIngredient(ingredient.id)}>
                    <SvgIcon name="close-circle" size={24} color="#ef4444" />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          
          <View style={styles.card}>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes & Instructions</Text>
          
          <View style={styles.card}>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add preparation instructions, tips, or special notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Save Button */}
        <Pressable 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveMeal}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <SvgIcon name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Meal</Text>
            </>
          )}
        </Pressable>

        {/* Meal Plan & Shopping List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Planning & Shopping</Text>
          <View style={styles.card}>
            <Pressable
              style={[styles.planButton, mealPlanId && styles.planButtonSuccess]}
              onPress={handleCreateMealPlan}
              disabled={saving || !mealName.trim()}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <SvgIcon 
                    name={mealPlanId ? "checkmark-circle" : "calendar"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.planButtonText}>
                    {mealPlanId ? 'Meal Plan Created' : 'Create Meal Plan'}
                  </Text>
                </>
              )}
            </Pressable>

            {mealPlanId && (
              <Pressable
                style={styles.shoppingListButton}
                onPress={handleGenerateShoppingList}
                disabled={generatingList}
              >
                {generatingList ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <SvgIcon name="cart" size={20} color="#fff" />
                    <Text style={styles.shoppingListButtonText}>
                      Generate Shopping List
                    </Text>
                  </>
                )}
              </Pressable>
            )}

            <Text style={styles.planHintText}>
              {!mealPlanId 
                ? 'Create a meal plan, then generate your Instacart shopping list'
                : 'Tap above to generate your shopping list and shop via Instacart'}
            </Text>
          </View>
        </View>

        {/* Templates Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.templatesContainer}>
            <Pressable 
              style={styles.templateCard}
              onPress={handleShowTemplates}
            >
              <SvgIcon name="fast-food" size={24} color="#3b82f6" />
              <Text style={styles.templateTitle}>Use Template</Text>
              <Text style={styles.templateSubtitle}>Start from preset</Text>
            </Pressable>
            <Pressable 
              style={styles.templateCard}
              onPress={handleScanRecipe}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <SvgIcon name="camera" size={24} color="#10b981" />
              )}
              <Text style={styles.templateTitle}>Scan Recipe</Text>
              <Text style={styles.templateSubtitle}>From image</Text>
            </Pressable>
            <Pressable 
              style={styles.templateCard}
              onPress={() => {
                loadLibraryMeals();
                setShowLibrary(true);
              }}
            >
              <SvgIcon name="book" size={24} color="#8b5cf6" />
              <Text style={styles.templateTitle}>My Meals</Text>
              <Text style={styles.templateSubtitle}>Saved recipes</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );

  // Render AI Plan Generator Modal
  const renderPlanGeneratorModal = () => (
    <Modal
      visible={showPlanGenerator}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowPlanGenerator(false);
        setSelectedTemplatePreset(null);
        resetPlanGenerator();
      }}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
        <View style={styles.modalHeader}>
          {planModalStep !== 'goals' && (
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                // Skip customize step - go directly between goals/preview/meals
                if (planModalStep === 'preview') setPlanModalStep('goals');
                else if (planModalStep === 'meals') setPlanModalStep('preview');
              }}
            >
              <SvgIcon name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          )}
          
          <View style={styles.modalTitleContainer}>
<SvgIcon 
              name={
                planModalStep === 'goals' ? 'sparkles' : 
                planModalStep === 'preview' ? 'calendar-outline' :
                'cart-outline'
              } 
              size={24} 
              color="#ef4444" 
            />
            <Text style={styles.modalTitle}>
              {planModalStep === 'goals' ? 'Create Meal Plan' : 
               planModalStep === 'preview' ? 'Your Program' :
               'Shopping List'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowPlanGenerator(false);
              resetPlanGenerator();
            }}
          >
            <SvgIcon name="close" size={28} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Show new GoalSelectionMeals UI when in goals step and useGoalSelectionUI is true */}
        {useGoalSelectionUI && planModalStep === 'goals' ? (
          <GoalSelectionMeals
            isGenerating={isGeneratingPlan}
            onGenerateMeal={handleGoalSelectionGenerate}
            initialTemplate={selectedTemplatePreset}
            onTemplateCleared={() => setSelectedTemplatePreset(null)}
          />
        ) : (
          <>
            {/* Step Indicator - 3 steps: goals -> preview -> shopping */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, planModalStep === 'goals' ? styles.stepDotActive : styles.stepDotCompleted]} />
              <View style={[styles.stepLine, planModalStep !== 'goals' && styles.stepLineActive]} />
              <View style={[styles.stepDot, planModalStep === 'preview' ? styles.stepDotActive : (planModalStep === 'meals' ? styles.stepDotCompleted : null)]} />
              <View style={[styles.stepLine, planModalStep === 'meals' && styles.stepLineActive]} />
              <View style={[styles.stepDot, planModalStep === 'meals' && styles.stepDotActive]} />
            </View>

            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {planModalStep === 'goals' && (
                <>
                  {/* Quick Goals */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Quick Start</Text>
                    <View style={styles.quickGoalsGrid}>
                      {QUICK_GOALS.map((goal) => (
                        <TouchableOpacity
                          key={goal.label}
                          style={styles.quickGoalButton}
                          onPress={() => handleSelectQuickGoal(goal)}
                        >
                          <View style={styles.quickGoalIcon}>
                            <SvgIcon name={goal.icon as any} size={24} color="#ef4444" />
                          </View>
                          <Text style={styles.quickGoalLabel}>{goal.label}</Text>
                          <Text style={styles.quickGoalDesc}>{goal.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Or describe */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Or Describe Your Ideal Plan</Text>
                    <TextInput
                      style={styles.planDescriptionInput}
                      placeholder="e.g., Easy family dinners for 4 using Costco ingredients, kid-friendly, under 30 minutes"
                      placeholderTextColor="#9ca3af"
                      value={planDescription}
                      onChangeText={setPlanDescription}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity
                      style={[styles.continueButton, !planDescription.trim() && styles.continueButtonDisabled]}
                      onPress={() => {
                        // Generate plan directly with description
                        handleGoalSelectionGenerate({
                          mode: 'plan',
                          description: planDescription,
                          duration: planDuration,
                          servings: planServings,
                          mealsPerDay: selectedMealTypes,
                          dietaryRestrictions: selectedDietaryOptions,
                          preferredStores: selectedStores,
                        });
                      }}
                      disabled={!planDescription.trim()}
                    >
                      <Text style={styles.continueButtonText}>Generate Plan</Text>
                      <SvgIcon name="sparkles" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

          {planModalStep === 'preview' && generatedPlan && (
            <>
              <View style={styles.modalSection}>
                {/* Plan Summary Stats */}
                <View style={styles.planSummaryStats}>
                  <View style={styles.planSummaryStat}>
                    <SvgIcon name="calendar-outline" size={24} color="#3b82f6" />
                    <Text style={styles.planSummaryStatValue}>{generatedPlan.duration_days || 0}</Text>
                    <Text style={styles.planSummaryStatLabel}>Days</Text>
                  </View>
                  <View style={styles.planSummaryStat}>
                    <SvgIcon name="restaurant-outline" size={24} color="#ef4444" />
                    <Text style={styles.planSummaryStatValue}>
                      {generatedPlan.summary?.total_meals || generatedPlan.days?.reduce((sum, d) => sum + (d.meals?.length || 0), 0) || 0}
                    </Text>
                    <Text style={styles.planSummaryStatLabel}>Meals</Text>
                  </View>
                  <View style={styles.planSummaryStat}>
                    <SvgIcon name="flame-outline" size={24} color="#f59e0b" />
                    <Text style={styles.planSummaryStatValue}>
                      {generatedPlan.summary?.avg_calories_per_day || Math.round((generatedPlan.days?.reduce((sum, d) => sum + (d.meals?.reduce((s, m) => s + (m.calories || 0), 0) || 0), 0) || 0) / (generatedPlan.duration_days || 1))}
                    </Text>
                    <Text style={styles.planSummaryStatLabel}>Avg Cal/Day</Text>
                  </View>
                </View>

                {/* All days with all meals */}
                {generatedPlan.days && generatedPlan.days.length > 0 ? (
                  generatedPlan.days.map((day, index) => (
                    <View key={index} style={styles.previewDayCard}>
                      <View style={styles.previewDayHeader}>
                        <Text style={styles.previewDayTitle}>Day {day.day_number || index + 1}</Text>
                        <Text style={styles.previewDayCalories}>
                          {day.meals?.reduce((s, m) => s + (m.calories || 0), 0) || 0} cal
                        </Text>
                      </View>
                      {day.meals && day.meals.length > 0 ? (
                        day.meals.map((meal, mealIndex) => (
                          <View key={mealIndex} style={styles.previewMealItem}>
                            <View style={[
                              styles.previewMealIcon,
                              { backgroundColor: mealTypeConfig[meal.meal_type]?.bgColor || '#f3f4f6' }
                            ]}>
<SvgIcon 
                                name={mealTypeConfig[meal.meal_type]?.icon as any || 'restaurant-outline'} 
                                size={16} 
                                color={mealTypeConfig[meal.meal_type]?.color || '#6b7280'} 
                              />
                            </View>
                            <View style={styles.previewMealInfo}>
                              <Text style={styles.previewMealName}>{meal.meal_name || 'Meal'}</Text>
                              <Text style={styles.previewMealMacros}>
                                {meal.calories || 0} cal • {meal.protein || 0}g protein
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.previewNoMealsText}>No meals planned for this day</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.previewEmptyState}>
                    <SvgIcon name="restaurant-outline" size={48} color="#d1d5db" />
                    <Text style={styles.previewEmptyText}>
                      Meal plan is being generated...{'\n'}Please wait or try again.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.viewAllMealsButton, (!generatedPlan.days || generatedPlan.days.length === 0) && styles.viewAllMealsButtonDisabled]}
                onPress={() => setPlanModalStep('meals')}
                disabled={!generatedPlan.days || generatedPlan.days.length === 0}
              >
                <SvgIcon name="cart-outline" size={24} color="#ef4444" />
                <Text style={styles.viewAllMealsButtonText}>View Shopping List</Text>
                <SvgIcon name="arrow-forward" size={20} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}

          {planModalStep === 'meals' && generatedPlan && (
            <>
              <View style={styles.modalSection}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Shopping List</Text>
                  <Text style={styles.previewSubtitle}>
                    Ingredients for {generatedPlan.duration_days || 0} days • {generatedPlan.summary?.total_meals || 0} meals
                  </Text>
                </View>

                {/* Shopping List Categories - Dynamically generated from meal plan */}
                <View style={styles.shoppingListContainer}>
                  {(() => {
                    const shoppingItems = extractShoppingListFromPlan(generatedPlan);
                    const totalItems = Object.values(shoppingItems).flat().length;
                    
                    if (totalItems === 0) {
                      return (
                        <View style={styles.shoppingCategoryCard}>
                          <Text style={styles.shoppingItem}>No ingredients found in meal plan</Text>
                        </View>
                      );
                    }

                    return (
                      <>
                        {/* Proteins */}
                        {shoppingItems.proteins.length > 0 && (
                          <View style={styles.shoppingCategoryCard}>
                            <View style={styles.shoppingCategoryHeader}>
                              <SvgIcon name="nutrition-outline" size={20} color="#f59e0b" />
                              <Text style={styles.shoppingCategoryTitle}>Proteins</Text>
                              <Text style={styles.shoppingCategoryCount}>{shoppingItems.proteins.length} items</Text>
                            </View>
                            <View style={styles.shoppingItemsList}>
                              {shoppingItems.proteins.slice(0, 5).map((item, idx) => (
                                <Text key={`protein-${idx}`} style={styles.shoppingItem}>• {formatIngredient(item)}</Text>
                              ))}
                              {shoppingItems.proteins.length > 5 && (
                                <Text style={[styles.shoppingItem, { color: '#6b7280', fontStyle: 'italic' }]}>+ {shoppingItems.proteins.length - 5} more...</Text>
                              )}
                            </View>
                          </View>
                        )}

                        {/* Produce */}
                        {shoppingItems.produce.length > 0 && (
                          <View style={styles.shoppingCategoryCard}>
                            <View style={styles.shoppingCategoryHeader}>
                              <SvgIcon name="leaf-outline" size={20} color="#10b981" />
                              <Text style={styles.shoppingCategoryTitle}>Produce</Text>
                              <Text style={styles.shoppingCategoryCount}>{shoppingItems.produce.length} items</Text>
                            </View>
                            <View style={styles.shoppingItemsList}>
                              {shoppingItems.produce.slice(0, 5).map((item, idx) => (
                                <Text key={`produce-${idx}`} style={styles.shoppingItem}>• {formatIngredient(item)}</Text>
                              ))}
                              {shoppingItems.produce.length > 5 && (
                                <Text style={[styles.shoppingItem, { color: '#6b7280', fontStyle: 'italic' }]}>+ {shoppingItems.produce.length - 5} more...</Text>
                              )}
                            </View>
                          </View>
                        )}

                        {/* Dairy */}
                        {shoppingItems.dairy.length > 0 && (
                          <View style={styles.shoppingCategoryCard}>
                            <View style={styles.shoppingCategoryHeader}>
                              <SvgIcon name="water-outline" size={20} color="#3b82f6" />
                              <Text style={styles.shoppingCategoryTitle}>Dairy</Text>
                              <Text style={styles.shoppingCategoryCount}>{shoppingItems.dairy.length} items</Text>
                            </View>
                            <View style={styles.shoppingItemsList}>
                              {shoppingItems.dairy.slice(0, 5).map((item, idx) => (
                                <Text key={`dairy-${idx}`} style={styles.shoppingItem}>• {formatIngredient(item)}</Text>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Grains */}
                        {shoppingItems.grains.length > 0 && (
                          <View style={styles.shoppingCategoryCard}>
                            <View style={styles.shoppingCategoryHeader}>
                              <SvgIcon name="grid-outline" size={20} color="#d97706" />
                              <Text style={styles.shoppingCategoryTitle}>Grains</Text>
                              <Text style={styles.shoppingCategoryCount}>{shoppingItems.grains.length} items</Text>
                            </View>
                            <View style={styles.shoppingItemsList}>
                              {shoppingItems.grains.slice(0, 5).map((item, idx) => (
                                <Text key={`grain-${idx}`} style={styles.shoppingItem}>• {formatIngredient(item)}</Text>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Pantry */}
                        {shoppingItems.pantry.length > 0 && (
                          <View style={styles.shoppingCategoryCard}>
                            <View style={styles.shoppingCategoryHeader}>
                              <SvgIcon name="wine-outline" size={20} color="#ef4444" />
                              <Text style={styles.shoppingCategoryTitle}>Pantry</Text>
                              <Text style={styles.shoppingCategoryCount}>{shoppingItems.pantry.length} items</Text>
                            </View>
                            <View style={styles.shoppingItemsList}>
                              {shoppingItems.pantry.slice(0, 5).map((item, idx) => (
                                <Text key={`pantry-${idx}`} style={styles.shoppingItem}>• {formatIngredient(item)}</Text>
                              ))}
                              {shoppingItems.pantry.length > 5 && (
                                <Text style={[styles.shoppingItem, { color: '#6b7280', fontStyle: 'italic' }]}>+ {shoppingItems.pantry.length - 5} more...</Text>
                              )}
                            </View>
                          </View>
                        )}

                        {/* Other Items */}
                        {shoppingItems.other.length > 0 && (
                          <View style={styles.shoppingCategoryCard}>
                            <View style={styles.shoppingCategoryHeader}>
                              <SvgIcon name="basket-outline" size={20} color="#8b5cf6" />
                              <Text style={styles.shoppingCategoryTitle}>Other</Text>
                              <Text style={styles.shoppingCategoryCount}>{shoppingItems.other.length} items</Text>
                            </View>
                            <View style={styles.shoppingItemsList}>
                              {shoppingItems.other.slice(0, 5).map((item, idx) => (
                                <Text key={`other-${idx}`} style={styles.shoppingItem}>• {formatIngredient(item)}</Text>
                              ))}
                            </View>
                          </View>
                        )}
                      </>
                    );
                  })()}

                  <View style={styles.shoppingListNote}>
                    <SvgIcon name="information-circle-outline" size={20} color="#6b7280" />
                    <Text style={styles.shoppingListNoteText}>
                      Shopping list generated based on your {generatedPlan.duration_days}-day meal plan
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.acceptPlanButton, (!generatedPlan.days || generatedPlan.days.length === 0) && styles.acceptPlanButtonDisabled]}
                onPress={handleAcceptGeneratedPlan}
                disabled={!generatedPlan.days || generatedPlan.days.length === 0}
              >
                <SvgIcon name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.acceptPlanButtonText}>Accept Plan</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );

  // Meal Plan Success Modal - Slides up from bottom like FitnessDashboard
  const renderMealPlanSuccessModal = () => (
    <Modal
      visible={showMealPlanSuccess}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => setShowMealPlanSuccess(false)}
    >
      <View style={styles.successModalOverlay}>
        <View style={styles.successModalContainer}>
          <ScrollView 
            style={styles.successModalScrollView}
            contentContainerStyle={styles.successModalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Header with celebration */}
            <View style={styles.successModalHeader}>
              <View style={styles.successCelebrationIcon}>
                <SvgIcon name="checkmark-circle" size={64} color="#4cbb17" />
              </View>
              <Text style={styles.successModalTitle}>Meal Plan Created!</Text>
              <Text style={styles.successModalSubtitle}>Your personalized meal plan is ready</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.successStatsGrid}>
              <View style={styles.successStatCard}>
                <SvgIcon name="calendar-outline" size={28} color="#3b82f6" />
                <Text style={styles.successStatValue}>{acceptedPlan?.duration_days || planDuration}</Text>
                <Text style={styles.successStatLabel}>Days</Text>
              </View>
              <View style={styles.successStatCard}>
                <SvgIcon name="restaurant-outline" size={28} color="#4cbb17" />
                <Text style={styles.successStatValue}>
                  {acceptedPlan?.summary?.total_meals || acceptedPlan?.days?.reduce((sum, d) => sum + (d.meals?.length || 0), 0) || 0}
                </Text>
                <Text style={styles.successStatLabel}>Total Meals</Text>
              </View>
              <View style={styles.successStatCard}>
                <SvgIcon name="flame-outline" size={28} color="#f59e0b" />
                <Text style={styles.successStatValue}>
                  {Math.round(acceptedPlan?.summary?.avg_calories_per_day || 0)}
                </Text>
                <Text style={styles.successStatLabel}>Avg Cal/Day</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.successActionsContainer}>
              {/* View Shopping List - Primary Action */}
              <TouchableOpacity 
                style={[styles.instacartButton, savingMealsToDb && styles.instacartButtonDisabled]}
                activeOpacity={0.7}
                onPress={async (e) => {
                  e.stopPropagation();
                  console.log('[ViewShoppingList] Button pressed');
                  
                  // Check if we have a plan with days/meals (program_id not required for shopping list)
                  if (!acceptedPlan || !acceptedPlan.days || acceptedPlan.days.length === 0) {
                    Alert.alert('Error', 'No meal plan available');
                    return;
                  }
                  
                  console.log('[ViewShoppingList] Plan has', acceptedPlan.days.length, 'days');
                  
                  // ⭐ UPDATED: Check if meals are already auto-saved (plan/diet mode)
                  // Plan and Diet mode meals are now automatically saved by the backend
                  // Only save manually for Quick mode or if no saved IDs exist
                  if (savedMealIds.length === 0 && !mealsAutoSaved && acceptedPlan) {
                    try {
                      setSavingMealsToDb(true);
                      console.log('[ViewShoppingList] Quick mode - saving meals to database for deep link support...');
                      const mealIds = await mealService.saveMealsFromPlan(userId, acceptedPlan);
                      setSavedMealIds(mealIds);
                      console.log('[ViewShoppingList] Saved', mealIds.length, 'meals to database');
                    } catch (saveError) {
                      console.warn('[ViewShoppingList] Failed to save meals to DB (deep links may not work):', saveError);
                      // Continue anyway - meals in local state can still be used
                    } finally {
                      setSavingMealsToDb(false);
                    }
                  } else if (mealsAutoSaved) {
                    console.log('[ViewShoppingList] ✅ Meals already auto-saved by API, skipping manual save');
                  }
                  
                  // Extract shopping list from the accepted plan
                  const shoppingItems = extractShoppingListFromPlan(acceptedPlan);
                  const totalItems = Object.values(shoppingItems).flat().length;
                  
                  console.log('[ViewShoppingList] Extracted items:', totalItems, shoppingItems);
                  
                  if (totalItems > 0) {
                    // Store shopping items first
                    setShoppingListItems(shoppingItems);
                    // Close success modal
                    setShowMealPlanSuccess(false);
                    // Open shopping list modal after a brief delay to allow animation
                    console.log('[ViewShoppingList] Opening shopping list modal in 300ms...');
                    setTimeout(() => {
                      console.log('[ViewShoppingList] Setting showShoppingListModal to true');
                      setShowShoppingListModal(true);
                    }, 300);
                  } else {
                    Alert.alert('No Items', 'No ingredients found in this meal plan.');
                  }
                }}
                disabled={!acceptedPlan || generatingList || savingMealsToDb}
              >
                <LinearGradient
                  colors={['#43B02A', '#2E8B1F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.instacartButtonGradient}
                >
                  {savingMealsToDb ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <SvgIcon name="list-outline" size={24} color="#fff" />
                  )}
                  <Text style={styles.instacartButtonText}>
                    View Shopping List
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Open Instacart Shopping List - Creates link and deep links */}
              <TouchableOpacity 
                style={[
                  styles.instacartButton,
                  (!user?.capabilities?.instacart || generatingList) && styles.instacartButtonDisabled
                ]}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  if (user?.capabilities?.instacart) {
                    // User has Instacart enabled - proceed with submission
                    handleSubmitToInstacart();
                  } else {
                    // User doesn't have Instacart - show upgrade prompt
                    setShowMealPlanSuccess(false);
                    navigation.navigate('PlansScreen' as any, {
                      highlightFeature: 'instacart',
                      source: 'meal_plan_success',
                    });
                  }
                }}
                disabled={generatingList}
              >
                {user?.capabilities?.instacart ? (
                  <LinearGradient
                    colors={['#43B02A', '#2E8B1F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.instacartButtonGradient}
                  >
                    {generatingList ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <SvgIcon name="cart-outline" size={24} color="#fff" />
                    )}
                    <Text style={styles.instacartButtonText}>
                      {generatingList ? 'Creating Shopping List...' : 'Open Instacart Shopping List'}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.instacartButtonGradientDisabled}>
                    <SvgIcon name="cart-outline" size={24} color="#9ca3af" />
                    <Text style={styles.instacartButtonTextDisabled}>Open Instacart Shopping List</Text>
                    <View style={styles.premiumBadge}>
                      <SvgIcon name="star" size={12} color="#f59e0b" />
                      <Text style={styles.premiumBadgeText}>PRO</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* View Calendar Button */}
              <TouchableOpacity 
                style={styles.viewCalendarButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowMealPlanSuccess(false);
                  setViewMode('calendar');
                }}
              >
                <SvgIcon name="calendar" size={20} color="#3b82f6" />
                <Text style={styles.viewCalendarButtonText}>View in Calendar</Text>
              </TouchableOpacity>

              {/* Save Meal Plan Button */}
              <TouchableOpacity 
                style={[
                  styles.saveMealPlanButton,
                  mealPlanSaved && styles.saveMealPlanButtonSaved
                ]}
                activeOpacity={0.7}
                onPress={handleSaveMealPlan}
                disabled={savingMealPlan || mealPlanSaved}
              >
                {savingMealPlan ? (
                  <ActivityIndicator color="#4cbb17" size="small" />
                ) : (
                  <SvgIcon 
                    name={mealPlanSaved ? "checkmark-circle" : "bookmark-outline"} 
                    size={20} 
                    color={mealPlanSaved ? "#4cbb17" : "#4cbb17"} 
                  />
                )}
                <Text style={[
                  styles.saveMealPlanButtonText,
                  mealPlanSaved && styles.saveMealPlanButtonTextSaved
                ]}>
                  {mealPlanSaved ? 'Saved to Library!' : 'Save Meal Plan'}
                </Text>
              </TouchableOpacity>

              {/* Log to Diary Button */}
              <TouchableOpacity 
                style={[
                  styles.saveMealPlanButton,
                  savedToDiary && styles.saveMealPlanButtonSaved
                ]}
                activeOpacity={0.7}
                onPress={handleLogToDiary}
                disabled={loggingToDiary || savedToDiary}
              >
                {loggingToDiary ? (
                  <ActivityIndicator color="#3b82f6" size="small" />
                ) : (
                  <SvgIcon 
                    name={savedToDiary ? "checkmark-circle" : "calendar-outline"} 
                    size={20} 
                    color={savedToDiary ? "#4cbb17" : "#3b82f6"} 
                  />
                )}
                <Text style={[
                  styles.saveMealPlanButtonText,
                  savedToDiary && styles.saveMealPlanButtonTextSaved
                ]}>
                  {savedToDiary ? 'Logged to Diary!' : 'Log to Meal Diary'}
                </Text>
              </TouchableOpacity>

              {/* Save to Recipe Library Button */}
              <TouchableOpacity 
                style={[
                  styles.saveMealPlanButton,
                  savedToLibrary && styles.saveMealPlanButtonSaved
                ]}
                activeOpacity={0.7}
                onPress={handleSaveToLibrary}
                disabled={savingToLibrary || savedToLibrary}
              >
                {savingToLibrary ? (
                  <ActivityIndicator color="#8b5cf6" size="small" />
                ) : (
                  <SvgIcon 
                    name={savedToLibrary ? "checkmark-circle" : "book-outline"} 
                    size={20} 
                    color={savedToLibrary ? "#4cbb17" : "#8b5cf6"} 
                  />
                )}
                <Text style={[
                  styles.saveMealPlanButtonText,
                  savedToLibrary && styles.saveMealPlanButtonTextSaved
                ]}>
                  {savedToLibrary ? 'Saved to Recipe Library!' : 'Save Recipes to Library'}
                </Text>
              </TouchableOpacity>

              {/* Done Button */}
              <TouchableOpacity 
                style={styles.successDoneButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowMealPlanSuccess(false);
                  setMealPlanSaved(false); // Reset for next plan
                }}
              >
                <Text style={styles.successDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Templates Modal
  const renderTemplatesModal = () => (
    <Modal
      visible={showTemplates}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowTemplates(false)}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Meal Templates</Text>
          <Pressable onPress={() => setShowTemplates(false)}>
            <SvgIcon name="close" size={28} color="#111827" />
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalScrollContent}>
          {(!templates || templates.length === 0) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading templates...</Text>
            </View>
          ) : (
            templates.map((template) => (
              <Pressable
                key={template.template_id}
                style={styles.templateItem}
                onPress={() => handleUseTemplate(template)}
              >
                <View style={styles.templateIcon}>
<SvgIcon 
                    name={
                      template.category === 'breakfast' ? 'sunny' :
                      template.category === 'lunch' ? 'restaurant' :
                      template.category === 'dinner' ? 'moon' : 'cafe'
                    } 
                    size={24} 
                    color="#3b82f6" 
                  />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateItemTitle}>{template.name}</Text>
                  <Text style={styles.templateDescription}>{template.description || ''}</Text>
                  <View style={styles.templateMacros}>
                    <Text style={styles.macroText}>{template.nutrition?.calories || 0} cal</Text>
                    <Text style={styles.macroText}>•</Text>
                    <Text style={styles.macroText}>{template.nutrition?.protein || 0}g protein</Text>
                    <Text style={styles.macroText}>•</Text>
                    <Text style={styles.macroText}>{(template.preparation_time || 0) + (template.cooking_time || 0)} min</Text>
                  </View>
                  {(template.tags?.length ?? 0) > 0 && (
                    <View style={styles.templateTags}>
                      {template.tags.slice(0, 3).map((tag) => (
                        <View key={tag} style={styles.miniTag}>
                          <Text style={styles.miniTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <SvgIcon name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Calendar View - Shows meal plan calendar with actual data
  const renderCalendarView = () => {
    // Generate calendar days for the current month
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days: Array<{ date: Date | null; day: number; isCurrentMonth: boolean; meals: any[] }> = [];
      
      // Add empty days for padding
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push({ date: null, day: 0, isCurrentMonth: false, meals: [] });
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Find meals for this day from calendarDays (loaded via mealCalendarService)
        const dayData = calendarDays.find(d => d.date === dateStr);
        const dayMeals = dayData?.meals || [];
        
        days.push({ date: currentDate, day, isCurrentMonth: true, meals: dayMeals });
      }
      
      return days;
    };
    
    const calendarGridDays = getDaysInMonth(calendarMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const isToday = (date: Date | null) => {
      if (!date) return false;
      const today = new Date();
      return date.getDate() === today.getDate() && 
             date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear();
    };
    
    const isSelected = (date: Date | null) => {
      if (!date) return false;
      return date.getDate() === selectedDate.getDate() && 
             date.getMonth() === selectedDate.getMonth() && 
             date.getFullYear() === selectedDate.getFullYear();
    };
    
    const handleDayPress = (date: Date | null) => {
      if (date) {
        setSelectedDate(date);
      }
    };
    
    const handleNavigateMonth = (delta: number) => {
      const newMonth = new Date(calendarMonth);
      newMonth.setMonth(newMonth.getMonth() + delta);
      setCalendarMonth(newMonth);
    };
    
    // Get meals for selected date from calendarDays (loaded via mealCalendarService)
    const dateStr = selectedDate.toISOString().split('T')[0];
    const selectedDayData = calendarDays.find(d => d.date === dateStr);
    const selectedDayMeals = selectedDayData?.meals || [];
    
    return (
      <View style={styles.calendarContainer}>
        {/* Status bar area - solid color */}
        <View style={{ height: insets.top, backgroundColor: '#f59e0b' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#f59e0b' }]}>
          <Animated.View style={[styles.dashboardHeaderContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Pressable style={styles.calendarBackButton} onPress={() => setViewMode('dashboard')}>
              <SvgIcon name="arrow-back" size={24} color="#ffffff" />
            </Pressable>
            <Text style={styles.dashboardHeaderTitle}>Meal Calendar</Text>
            <Text style={styles.dashboardHeaderSubtitle}>
              {calendarLoading ? 'Loading...' : calendarDays.length > 0 ? `${calendarDays.length} days scheduled` : 'No meals scheduled'}
            </Text>
            <Pressable style={styles.calendarAddButton} onPress={() => setShowPlanGenerator(true)}>
              <SvgIcon name="add" size={24} color="#ffffff" />
            </Pressable>
          </Animated.View>
        </Animated.View>
        
        <ScrollView style={styles.calendarContent} showsVerticalScrollIndicator={false}>
          {calendarLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ marginTop: 16, color: '#6b7280', fontSize: 14 }}>Loading calendar...</Text>
            </View>
          ) : calendarError ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <SvgIcon name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={{ marginTop: 16, color: '#ef4444', fontSize: 14 }}>{calendarError}</Text>
              <TouchableOpacity 
                style={{ marginTop: 16, padding: 12, backgroundColor: '#3b82f6', borderRadius: 8 }}
                onPress={() => loadCalendarData()}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Month Navigation */}
              <View style={styles.calendarMonthNav}>
            <TouchableOpacity onPress={() => handleNavigateMonth(-1)} style={styles.calendarNavButton}>
              <SvgIcon name="chevron-back" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>
              {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => handleNavigateMonth(1)} style={styles.calendarNavButton}>
              <SvgIcon name="chevron-forward" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          
          {/* Day Names Header */}
          <View style={styles.calendarDayNames}>
            {dayNames.map((name) => (
              <Text key={name} style={styles.calendarDayName}>{name}</Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarGridDays.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDayCell,
                  !item.isCurrentMonth && styles.calendarDayCellEmpty,
                  isToday(item.date) && styles.calendarDayCellToday,
                  isSelected(item.date) && styles.calendarDayCellSelected,
                ]}
                onPress={() => handleDayPress(item.date)}
                disabled={!item.isCurrentMonth}
              >
                {item.isCurrentMonth && (
                  <>
                    <Text style={[
                      styles.calendarDayText,
                      isToday(item.date) && styles.calendarDayTextToday,
                      isSelected(item.date) && styles.calendarDayTextSelected,
                    ]}>
                      {item.day}
                    </Text>
                    {item.meals.length > 0 && (
                      <View style={styles.calendarMealDots}>
                        {item.meals.slice(0, 3).map((meal, mealIdx) => (
                          <View 
                            key={mealIdx} 
                            style={[
                              styles.calendarMealDot,
                              { backgroundColor: mealTypeConfig[meal.meal_type]?.color || '#9ca3af' }
                            ]} 
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Selected Day Meals */}
          <View style={styles.calendarSelectedDay}>
            <Text style={styles.calendarSelectedDayTitle}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            
            {selectedDayMeals.length > 0 ? (
              <View style={styles.calendarMealsList}>
                {selectedDayMeals.map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.calendarMealCard}
                    onPress={() => {
                      // Create a minimal SavedMeal-compatible object for display
                      const mealForDetails = {
                        meal_id: meal.meal_id,
                        name: meal.meal_name,
                        description: '',
                        nutrition: {
                          calories: meal.calories,
                          protein: meal.protein,
                          carbs: meal.carbs,
                          fat: meal.fat,
                        },
                        ingredients: [],
                        tags: [],
                        servings: meal.servings,
                        serving_size: meal.servings,
                        is_favorite: false,
                        times_logged: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      } as MealWithInstructions;
                      setSelectedMeal(mealForDetails);
                      setShowMealDetails(true);
                    }}
                  >
                    <View style={[
                      styles.calendarMealIcon,
                      { backgroundColor: mealTypeConfig[meal.meal_type]?.bgColor || '#f3f4f6' }
                    ]}>
<SvgIcon 
                        name={mealTypeConfig[meal.meal_type]?.icon as any || 'restaurant-outline'} 
                        size={20} 
                        color={mealTypeConfig[meal.meal_type]?.color || '#6b7280'} 
                      />
                    </View>
                    <View style={styles.calendarMealInfo}>
                      <Text style={styles.calendarMealType}>
                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      </Text>
                      <Text style={styles.calendarMealName}>{meal.meal_name}</Text>
                      <Text style={styles.calendarMealMacros}>
                        {meal.calories || 0} cal • {meal.protein || 0}g protein • {meal.carbs || 0}g carbs • {meal.fat || 0}g fat
                      </Text>
                    </View>
                    <SvgIcon name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.calendarNoMeals}>
                <SvgIcon name="restaurant-outline" size={48} color="#d1d5db" />
                <Text style={styles.calendarNoMealsText}>No meals planned for this day</Text>
                <TouchableOpacity 
                  style={styles.calendarAddMealButton}
                  onPress={() => setShowPlanGenerator(true)}
                >
                  <SvgIcon name="add-circle-outline" size={20} color="#3b82f6" />
                  <Text style={styles.calendarAddMealText}>Create a Meal Plan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          </>
          )}
          
          {/* Plan Summary */}
          {activeMealPlan && (
            <View style={styles.calendarSummary}>
              <Text style={styles.calendarSummaryTitle}>Plan Summary</Text>
              <View style={styles.calendarSummaryStats}>
                <View style={styles.calendarSummaryStat}>
                  <Text style={styles.calendarSummaryValue}>{activeMealPlan.duration_days || activeMealPlan.days?.length || 0}</Text>
                  <Text style={styles.calendarSummaryLabel}>Days</Text>
                </View>
                <View style={styles.calendarSummaryStat}>
                  <Text style={styles.calendarSummaryValue}>
                    {activeMealPlan.summary?.total_meals || 
                      activeMealPlan.days?.reduce((sum, day) => sum + (day.meals?.length || 0), 0) || 0}
                  </Text>
                  <Text style={styles.calendarSummaryLabel}>Meals</Text>
                </View>
                <View style={styles.calendarSummaryStat}>
                  <Text style={styles.calendarSummaryValue}>
                    {activeMealPlan.summary?.avg_calories_per_day || 
                      Math.round((activeMealPlan.days?.reduce((sum, day) => {
                        const dayCalories = day.meals?.reduce((mealSum, meal: any) => {
                          return mealSum + (meal.nutrition?.calories || meal.calories || 0);
                        }, 0) || 0;
                        return sum + dayCalories;
                      }, 0) || 0) / (activeMealPlan.days?.length || 1)) || 0}
                  </Text>
                  <Text style={styles.calendarSummaryLabel}>Avg Cal/Day</Text>
                </View>
              </View>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  };

  // Meal Details Modal - matches the screenshot design
  const renderMealDetailsModal = () => {
    if (!selectedMeal) return null;
    
    const nutrition = selectedMeal.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const proteinVal = nutrition.protein || 0;
    const carbsVal = nutrition.carbs || 0;
    const fatVal = nutrition.fat || 0;
    const caloriesVal = nutrition.calories || 0;
    
    const totalMacros = proteinVal + carbsVal + fatVal;
    const proteinPercent = totalMacros > 0 ? Math.round((proteinVal / totalMacros) * 100) : 0;
    const carbsPercent = totalMacros > 0 ? Math.round((carbsVal / totalMacros) * 100) : 0;
    const fatPercent = totalMacros > 0 ? Math.round((fatVal / totalMacros) * 100) : 0;
    
    // Adjust nutrition based on servings
    const baseServings = selectedMeal.serving_size || 1;
    const ratio = mealServings / baseServings;
    const adjustedCalories = Math.round(caloriesVal * ratio);
    const adjustedProtein = Math.round(proteinVal * ratio);
    const adjustedCarbs = Math.round(carbsVal * ratio);
    const adjustedFat = Math.round(fatVal * ratio);
    
    return (
      <Modal
        visible={showMealDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowMealDetails(false);
          setSelectedMeal(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f59e0b' }} edges={['top']}>
          <View style={{ flex: 1, backgroundColor: '#e0f2fe' }}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              bounces={true}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.mealDetailHero}
              >
                <View style={styles.mealDetailHeroRow}>
                  <View style={{ width: 40 }} />
                  <TouchableOpacity
                    style={styles.mealDetailCloseButton}
                    onPress={() => {
                      setShowMealDetails(false);
                      setSelectedMeal(null);
                    }}
                  >
                    <SvgIcon name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.mealDetailHeroTitle}>{selectedMeal.name}</Text>
                
                {selectedMeal.description && (
                  <Text style={styles.mealDetailHeroDescription}>{selectedMeal.description}</Text>
                )}
                
                <View style={styles.mealDetailStats}>
                  <View style={styles.mealDetailStat}>
                    <SvgIcon name="flame" size={16} color="#fff" />
                    <Text style={styles.mealDetailStatText}>{adjustedCalories} cal</Text>
                  </View>
                  <View style={styles.mealDetailStat}>
                    <SvgIcon name="time" size={16} color="#fff" />
                    <Text style={styles.mealDetailStatText}>
                      {(selectedMeal.preparation_time || 0) + (selectedMeal.cooking_time || 0)} min
                    </Text>
                  </View>
                  <View style={styles.mealDetailDifficultyBadge}>
                    <Text style={styles.mealDetailDifficultyText}>Easy</Text>
                  </View>
                </View>
              </LinearGradient>

            {/* Adjust Servings Card */}
            <View style={styles.mealDetailServingsCard}>
              <Text style={styles.mealDetailServingsTitle}>Adjust Servings</Text>
              <View style={styles.mealDetailServingsControls}>
                <TouchableOpacity
                  style={styles.mealDetailServingsButton}
                  onPress={() => setMealServings(Math.max(1, mealServings - 1))}
                >
                  <SvgIcon name="remove" size={24} color="#374151" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.mealDetailServingsValue}>{mealServings}</Text>
                  <Text style={styles.mealDetailServingsLabel}>servings</Text>
                </View>
                <TouchableOpacity
                  style={styles.mealDetailServingsButton}
                  onPress={() => setMealServings(mealServings + 1)}
                >
                  <SvgIcon name="add" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nutrition Facts */}
            <View style={styles.mealDetailSection}>
              <View style={styles.mealDetailSectionHeader}>
                <Text style={styles.mealDetailSectionTitle}>Nutrition Facts</Text>
                <Text style={styles.mealDetailPerServing}>Per {mealServings} servings</Text>
              </View>
              
              <View style={styles.mealDetailNutritionCard}>
                {/* Top row with values */}
                <View style={styles.mealDetailNutritionRow}>
                  <View style={styles.mealDetailNutritionItem}>
                    <Text style={styles.mealDetailNutritionValue}>{adjustedCalories}</Text>
                    <Text style={styles.mealDetailNutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.mealDetailNutritionItem}>
                    <Text style={styles.mealDetailNutritionValue}>{adjustedProtein}g</Text>
                    <Text style={styles.mealDetailNutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.mealDetailNutritionItem}>
                    <Text style={styles.mealDetailNutritionValue}>{adjustedCarbs}g</Text>
                    <Text style={styles.mealDetailNutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.mealDetailNutritionItem}>
                    <Text style={styles.mealDetailNutritionValue}>{adjustedFat}g</Text>
                    <Text style={styles.mealDetailNutritionLabel}>Fat</Text>
                  </View>
                </View>

                {/* Macro progress bars */}
                <View style={styles.mealDetailMacroBar}>
                  <View style={styles.mealDetailMacroBarHeader}>
                    <Text style={styles.mealDetailMacroBarLabel}>Protein</Text>
                    <Text style={styles.mealDetailMacroBarPercent}>{proteinPercent}%</Text>
                  </View>
                  <View style={styles.mealDetailMacroBarTrack}>
                    <View style={[styles.mealDetailMacroBarFill, { width: `${proteinPercent}%`, backgroundColor: '#ef4444' }]} />
                  </View>
                </View>
                
                <View style={styles.mealDetailMacroBar}>
                  <View style={styles.mealDetailMacroBarHeader}>
                    <Text style={styles.mealDetailMacroBarLabel}>Carbs</Text>
                    <Text style={styles.mealDetailMacroBarPercent}>{carbsPercent}%</Text>
                  </View>
                  <View style={styles.mealDetailMacroBarTrack}>
                    <View style={[styles.mealDetailMacroBarFill, { width: `${carbsPercent}%`, backgroundColor: '#3b82f6' }]} />
                  </View>
                </View>
                
                <View style={styles.mealDetailMacroBar}>
                  <View style={styles.mealDetailMacroBarHeader}>
                    <Text style={styles.mealDetailMacroBarLabel}>Fat</Text>
                    <Text style={styles.mealDetailMacroBarPercent}>{fatPercent}%</Text>
                  </View>
                  <View style={styles.mealDetailMacroBarTrack}>
                    <View style={[styles.mealDetailMacroBarFill, { width: `${fatPercent}%`, backgroundColor: '#f59e0b' }]} />
                  </View>
                </View>

                {/* Tags */}
                {selectedMeal.tags && selectedMeal.tags.length > 0 && (
                  <View style={styles.mealDetailTagsRow}>
                    {selectedMeal.tags.map((tag, index) => (
                      <View key={index} style={styles.mealDetailTag}>
                        <Text style={styles.mealDetailTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Prep & Cook Time */}
            <View style={styles.mealDetailTimeRow}>
              <View style={styles.mealDetailTimeCard}>
                <SvgIcon name="cut-outline" size={24} color="#8b5cf6" />
                <View>
                  <Text style={styles.mealDetailTimeLabel}>Prep Time</Text>
                  <Text style={styles.mealDetailTimeValue}>{selectedMeal.preparation_time || 10} min</Text>
                </View>
              </View>
              <View style={styles.mealDetailTimeCard}>
                <SvgIcon name="flame-outline" size={24} color="#f59e0b" />
                <View>
                  <Text style={styles.mealDetailTimeLabel}>Cook Time</Text>
                  <Text style={styles.mealDetailTimeValue}>{selectedMeal.cooking_time || 15} min</Text>
                </View>
              </View>
            </View>

            {/* Tabs for Ingredients and Instructions */}
            <View style={styles.mealDetailTabsContainer}>
              <TouchableOpacity
                style={[styles.mealDetailTab, activeDetailTab === 'ingredients' && styles.mealDetailTabActive]}
                onPress={() => setActiveDetailTab('ingredients')}
              >
                <Text style={[styles.mealDetailTabText, activeDetailTab === 'ingredients' && styles.mealDetailTabTextActive]}>
                  Ingredients ({selectedMeal.ingredients?.length || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mealDetailTab, activeDetailTab === 'instructions' && styles.mealDetailTabActive]}
                onPress={() => setActiveDetailTab('instructions')}
              >
                <Text style={[styles.mealDetailTabText, activeDetailTab === 'instructions' && styles.mealDetailTabTextActive]}>
                  Instructions
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ingredients Tab */}
            {activeDetailTab === 'ingredients' && selectedMeal.ingredients && (
              <View style={styles.mealDetailContentCard}>
                {selectedMeal.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.mealDetailIngredientRow}>
                    <View style={styles.mealDetailIngredientDot} />
                    <Text style={styles.mealDetailIngredientText}>
                      <Text style={styles.mealDetailIngredientAmount}>
                        {Math.round(ingredient.amount * (mealServings / (selectedMeal.serving_size || 1)))} {ingredient.unit}
                      </Text>
                      {' '}{ingredient.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Instructions Tab */}
            {activeDetailTab === 'instructions' && (
              <View style={styles.mealDetailContentCard}>
                {selectedMeal.instructions && selectedMeal.instructions.length > 0 ? (
                  selectedMeal.instructions.map((instruction, index) => (
                    <View key={index} style={styles.mealDetailInstructionRow}>
                      <View style={styles.mealDetailStepNumber}>
                        <Text style={styles.mealDetailStepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.mealDetailInstructionText}>{instruction}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.mealDetailNoInstructions}>
                    <SvgIcon name="document-text-outline" size={48} color="#d1d5db" />
                    <Text style={styles.mealDetailNoInstructionsText}>No cooking instructions available</Text>
                  </View>
                )}
              </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.mealDetailActionsContainer}>
              <TouchableOpacity
                style={styles.mealDetailDeleteButton}
                onPress={() => handleDeleteMeal(selectedMeal.meal_id, selectedMeal.name)}
              >
                <SvgIcon name="trash-outline" size={20} color="#fff" />
                <Text style={styles.mealDetailDeleteButtonText}>Delete Meal</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Shopping List Modal - Slides up from bottom
  // Instacart Success Modal (similar to workout complete modal)
  const renderInstacartSuccessModal = () => (
    <Modal
      visible={showInstacartSuccessModal}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => setShowInstacartSuccessModal(false)}
    >
      <View style={styles.workoutCompleteOverlay}>
        <View style={styles.workoutCompleteContainer}>
          <SafeAreaView style={styles.workoutCompleteSafeArea}>
            {/* Header with celebration */}
            <View style={styles.workoutCompleteHeader}>
              <View style={styles.celebrationIcon}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
              </View>
              <Text style={styles.workoutCompleteTitle}>Shopping List Created!</Text>
              <Text style={styles.workoutCompleteSubtitle}>Your ingredients are ready in Instacart</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.workoutStatsGrid}>
              <View style={styles.workoutStatCard}>
                <SvgIcon name="cart-outline" size={28} color="#4cbb17" />
                <Text style={styles.workoutCompleteStatValue}>{instacartItemCount}</Text>
                <Text style={styles.workoutCompleteStatLabel}>Items</Text>
              </View>
              <View style={styles.workoutStatCard}>
                <SvgIcon name="checkmark-circle-outline" size={28} color="#3b82f6" />
                <Text style={styles.workoutCompleteStatValue}>Ready</Text>
                <Text style={styles.workoutCompleteStatLabel}>To Order</Text>
              </View>
              <View style={styles.workoutStatCard}>
                <SvgIcon name="time-outline" size={28} color="#f59e0b" />
                <Text style={styles.workoutCompleteStatValue}>Fast</Text>
                <Text style={styles.workoutCompleteStatLabel}>Delivery</Text>
              </View>
            </View>

            {/* Done Button */}
            <TouchableOpacity 
              style={styles.workoutCompleteDoneButton}
              onPress={async () => {
                setShowInstacartSuccessModal(false);
                // Open Instacart if URL is available
                if (instacartUrl) {
                  try {
                    await Linking.openURL(instacartUrl);
                  } catch (err) {
                    console.warn('Failed to open Instacart:', err);
                  }
                }
              }}
            >
              <Text style={styles.workoutCompleteDoneText}>Open Instacart</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );

  const renderShoppingListModal = () => {
    const items = shoppingListItems;
    const totalItems = items ? Object.values(items).flat().length : 0;
    const categoryCount = items ? Object.entries(items).filter(([_, arr]) => arr.length > 0).length : 0;
    
    console.log('[ShoppingListModal] Render called - visible:', showShoppingListModal, 'hasItems:', !!items, 'totalItems:', totalItems);

    return (
      <Modal
        visible={showShoppingListModal}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setShowShoppingListModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' }}>
            <SafeAreaView style={{ flex: 1, width: '100%' }}>
              {/* Header */}
              <View style={styles.shoppingModalHeader}>
                <TouchableOpacity 
                  style={styles.shoppingModalCloseButton}
                  onPress={() => setShowShoppingListModal(false)}
                >
                  <SvgIcon name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.shoppingModalHeaderCenter}>
                  <SvgIcon name="cart-outline" size={24} color="#4cbb17" />
                  <Text style={styles.shoppingModalTitle}>Shopping List</Text>
                </View>
                <TouchableOpacity 
                  style={styles.shoppingModalCloseButton}
                  onPress={() => setShowShoppingListModal(false)}
                >
                  <SvgIcon name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* Stats Bar */}
              <View style={styles.shoppingStatsBar}>
                <View style={styles.shoppingStatItem}>
                  <Text style={styles.shoppingStatValue}>{categoryCount}</Text>
                  <Text style={styles.shoppingStatLabel}>Categories</Text>
                </View>
                <View style={styles.shoppingStatItem}>
                  <Text style={styles.shoppingStatValue}>{checkedShoppingItems.size}/{totalItems}</Text>
                  <Text style={styles.shoppingStatLabel}>Checked</Text>
                </View>
                <View style={styles.shoppingStatItem}>
                  <Text style={styles.shoppingStatValue}>{acceptedPlan?.duration_days || 7}</Text>
                  <Text style={styles.shoppingStatLabel}>Days</Text>
                </View>
              </View>

              {/* Shopping List Items */}
              <ScrollView style={styles.shoppingListScrollView} showsVerticalScrollIndicator={false}>
                {/* Proteins */}
                {items?.proteins && items.proteins.length > 0 && (
                  <View style={styles.shoppingCategorySection}>
                    <View style={styles.shoppingCategorySectionHeader}>
                      <SvgIcon name="nutrition-outline" size={20} color="#f59e0b" />
                      <Text style={styles.shoppingCategorySectionTitle}>Proteins</Text>
                      <Text style={styles.shoppingCategorySectionCount}>{items.proteins.length}</Text>
                    </View>
                    {items.proteins.map((item, idx) => {
                      const isChecked = checkedShoppingItems.has(`proteins-${idx}`);
                      return (
                        <TouchableOpacity 
                          key={`protein-${idx}`} 
                          style={styles.shoppingListItemRow}
                          onPress={() => toggleShoppingItem('proteins', idx)}
                          activeOpacity={0.6}
                        >
<SvgIcon 
                            name={isChecked ? "checkbox" : "square-outline"} 
                            size={22} 
                            color={isChecked ? "#4cbb17" : "#d1d5db"} 
                          />
                          <Text style={[
                            styles.shoppingListItemText,
                            isChecked && { textDecorationLine: 'line-through', color: '#9ca3af' }
                          ]}>
                            {formatIngredient(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Produce */}
                {items?.produce && items.produce.length > 0 && (
                  <View style={styles.shoppingCategorySection}>
                    <View style={styles.shoppingCategorySectionHeader}>
                      <SvgIcon name="leaf-outline" size={20} color="#10b981" />
                      <Text style={styles.shoppingCategorySectionTitle}>Produce</Text>
                      <Text style={styles.shoppingCategorySectionCount}>{items.produce.length}</Text>
                    </View>
                    {items.produce.map((item, idx) => {
                      const isChecked = checkedShoppingItems.has(`produce-${idx}`);
                      return (
                        <TouchableOpacity 
                          key={`produce-${idx}`} 
                          style={styles.shoppingListItemRow}
                          onPress={() => toggleShoppingItem('produce', idx)}
                          activeOpacity={0.6}
                        >
<SvgIcon 
                            name={isChecked ? "checkbox" : "square-outline"} 
                            size={22} 
                            color={isChecked ? "#4cbb17" : "#d1d5db"} 
                          />
                          <Text style={[
                            styles.shoppingListItemText,
                            isChecked && { textDecorationLine: 'line-through', color: '#9ca3af' }
                          ]}>
                            {formatIngredient(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Dairy */}
                {items?.dairy && items.dairy.length > 0 && (
                  <View style={styles.shoppingCategorySection}>
                    <View style={styles.shoppingCategorySectionHeader}>
                      <SvgIcon name="water-outline" size={20} color="#3b82f6" />
                      <Text style={styles.shoppingCategorySectionTitle}>Dairy</Text>
                      <Text style={styles.shoppingCategorySectionCount}>{items.dairy.length}</Text>
                    </View>
                    {items.dairy.map((item, idx) => {
                      const isChecked = checkedShoppingItems.has(`dairy-${idx}`);
                      return (
                        <TouchableOpacity 
                          key={`dairy-${idx}`} 
                          style={styles.shoppingListItemRow}
                          onPress={() => toggleShoppingItem('dairy', idx)}
                          activeOpacity={0.6}
                        >
<SvgIcon 
                            name={isChecked ? "checkbox" : "square-outline"} 
                            size={22} 
                            color={isChecked ? "#4cbb17" : "#d1d5db"} 
                          />
                          <Text style={[
                            styles.shoppingListItemText,
                            isChecked && { textDecorationLine: 'line-through', color: '#9ca3af' }
                          ]}>
                            {formatIngredient(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Grains */}
                {items?.grains && items.grains.length > 0 && (
                  <View style={styles.shoppingCategorySection}>
                    <View style={styles.shoppingCategorySectionHeader}>
                      <SvgIcon name="grid-outline" size={20} color="#d97706" />
                      <Text style={styles.shoppingCategorySectionTitle}>Grains</Text>
                      <Text style={styles.shoppingCategorySectionCount}>{items.grains.length}</Text>
                    </View>
                    {items.grains.map((item, idx) => {
                      const isChecked = checkedShoppingItems.has(`grains-${idx}`);
                      return (
                        <TouchableOpacity 
                          key={`grain-${idx}`} 
                          style={styles.shoppingListItemRow}
                          onPress={() => toggleShoppingItem('grains', idx)}
                          activeOpacity={0.6}
                        >
<SvgIcon 
                            name={isChecked ? "checkbox" : "square-outline"} 
                            size={22} 
                            color={isChecked ? "#4cbb17" : "#d1d5db"} 
                          />
                          <Text style={[
                            styles.shoppingListItemText,
                            isChecked && { textDecorationLine: 'line-through', color: '#9ca3af' }
                          ]}>
                            {formatIngredient(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Pantry */}
                {items?.pantry && items.pantry.length > 0 && (
                  <View style={styles.shoppingCategorySection}>
                    <View style={styles.shoppingCategorySectionHeader}>
                      <SvgIcon name="wine-outline" size={20} color="#ef4444" />
                      <Text style={styles.shoppingCategorySectionTitle}>Pantry</Text>
                      <Text style={styles.shoppingCategorySectionCount}>{items.pantry.length}</Text>
                    </View>
                    {items.pantry.map((item, idx) => {
                      const isChecked = checkedShoppingItems.has(`pantry-${idx}`);
                      return (
                        <TouchableOpacity 
                          key={`pantry-${idx}`} 
                          style={styles.shoppingListItemRow}
                          onPress={() => toggleShoppingItem('pantry', idx)}
                          activeOpacity={0.6}
                        >
<SvgIcon 
                            name={isChecked ? "checkbox" : "square-outline"} 
                            size={22} 
                            color={isChecked ? "#4cbb17" : "#d1d5db"} 
                          />
                          <Text style={[
                            styles.shoppingListItemText,
                            isChecked && { textDecorationLine: 'line-through', color: '#9ca3af' }
                          ]}>
                            {formatIngredient(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Other */}
                {items?.other && items.other.length > 0 && (
                  <View style={styles.shoppingCategorySection}>
                    <View style={styles.shoppingCategorySectionHeader}>
                      <SvgIcon name="basket-outline" size={20} color="#8b5cf6" />
                      <Text style={styles.shoppingCategorySectionTitle}>Other</Text>
                      <Text style={styles.shoppingCategorySectionCount}>{items.other.length}</Text>
                    </View>
                    {items.other.map((item, idx) => {
                      const isChecked = checkedShoppingItems.has(`other-${idx}`);
                      return (
                        <TouchableOpacity 
                          key={`other-${idx}`} 
                          style={styles.shoppingListItemRow}
                          onPress={() => toggleShoppingItem('other', idx)}
                          activeOpacity={0.6}
                        >
<SvgIcon 
                            name={isChecked ? "checkbox" : "square-outline"} 
                            size={22} 
                            color={isChecked ? "#4cbb17" : "#d1d5db"} 
                          />
                          <Text style={[
                            styles.shoppingListItemText,
                            isChecked && { textDecorationLine: 'line-through', color: '#9ca3af' }
                          ]}>
                            {formatIngredient(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Empty state if no items */}
                {totalItems === 0 && (
                  <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <SvgIcon name="cart-outline" size={48} color="#9ca3af" />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>No Shopping List</Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 }}>
                      Create a personalized meal plan to automatically generate your shopping list with all the ingredients you need.
                    </Text>
                    <TouchableOpacity 
                      style={{ 
                        marginTop: 24,
                        backgroundColor: '#4cbb17',
                        paddingVertical: 14,
                        paddingHorizontal: 32,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onPress={() => {
                        setShowShoppingListModal(false);
                        setTimeout(() => setShowPlanGenerator(true), 300);
                      }}
                    >
                      <SvgIcon name="add-circle" size={20} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Meal Plan</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Bottom Action */}
              <View style={styles.shoppingModalBottomAction}>
                {totalItems > 0 ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Order with Instacart - only unchecked items */}
                    <TouchableOpacity 
                      style={[styles.shoppingDoneButton, { 
                        flex: 1, 
                        backgroundColor: totalItems - checkedShoppingItems.size > 0 ? '#1a8917' : '#9ca3af',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }]}
                      disabled={totalItems - checkedShoppingItems.size === 0}
                      onPress={async () => {
                        const uncheckedCount = totalItems - checkedShoppingItems.size;
                        if (uncheckedCount === 0) {
                          Alert.alert('All items checked!', 'All items have been marked as purchased.');
                          return;
                        }
                        setShowShoppingListModal(false);
                        // If we have an accepted plan, use Instacart flow
                        if (acceptedPlan) {
                          handleSubmitToInstacart();
                        } else {
                          // Manual list - show coming soon
                          Alert.alert(
                            'Instacart',
                            `Order ${uncheckedCount} unchecked items with Instacart. This feature is coming soon!`,
                            [{ text: 'OK' }]
                          );
                        }
                      }}
                    >
                      <SvgIcon name="cart" size={20} color="#fff" />
                      <Text style={styles.shoppingDoneButtonText}>
                        {totalItems - checkedShoppingItems.size > 0 
                          ? `Order ${totalItems - checkedShoppingItems.size} items` 
                          : 'All checked!'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Done button */}
                    <TouchableOpacity 
                      style={[styles.shoppingDoneButton, { 
                        paddingHorizontal: 24,
                        backgroundColor: '#f3f4f6',
                      }]}
                      onPress={() => setShowShoppingListModal(false)}
                    >
                      <Text style={[styles.shoppingDoneButtonText, { color: '#374151' }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.shoppingDoneButton, { backgroundColor: '#f3f4f6' }]}
                    onPress={() => setShowShoppingListModal(false)}
                  >
                    <Text style={[styles.shoppingDoneButtonText, { color: '#6b7280' }]}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    );
  };

  // Main Return
  return (
    <>
      {/* Paywall Check */}
      {!hasMealAccess && (
        <UpgradePrompt
          visible={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => navigation.navigate('Subscription')}
          feature="Meal Planning"
          description="Create AI-powered meal plans, track nutrition, and generate shopping lists with Premium."
          requiredPlan="Premium"
        />
      )}

      {/* Content based on view mode */}
      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'create' && renderCreateMealForm()}
      {viewMode === 'calendar' && renderCalendarView()}

      {/* Modals */}
      {renderPlanGeneratorModal()}
      {renderMealPlanSuccessModal()}
      {renderShoppingListModal()}
      {renderTemplatesModal()}
      {renderMealDetailsModal()}
      {renderLibraryModal()}
    </>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    backgroundColor: '#ef4444',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  dashboardHeaderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dashboardHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  dashboardHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  calendarBackButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -12,
    padding: 4,
  },
  calendarAddButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
    padding: 4,
  },
  header: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: dashboardTheme.header.paddingBottom,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    ...dashboardTheme.typography.headerLarge,
    color: '#ffffff',
    marginBottom: dashboardTheme.spacing.xs,
  },
  headerSubtitle: {
    ...dashboardTheme.typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: dashboardTheme.spacing.md,
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
  section: {
    paddingHorizontal: 16,
    paddingTop: dashboardTheme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servingInput: {
    flex: 1,
  },
  servingUnit: {
    fontSize: 16,
    color: '#6b7280',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealTypeButtonSelected: {
    backgroundColor: '#3b5bdb',
    borderColor: '#3b5bdb',
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  mealTypeTextSelected: {
    color: '#ffffff',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
  },
  nutritionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#1e40af',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientAmount: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  tagText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tagTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 100,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  templatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  templateCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  templateSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  templateCardDisabled: {
    opacity: 0.5,
  },
  
  // Meal Plan Success Modal Styles (following FitnessDashboard pattern)
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  successModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  successModalScrollView: {
    flexGrow: 1,
  },
  successModalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  successModalHeader: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  successCelebrationIcon: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successModalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  successStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 16,
  },
  successStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  successStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  successStatLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  successActionsContainer: {
    gap: 12,
    paddingTop: 8,
  },
  instacartButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#43B02A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  instacartButtonDisabled: {
    shadowColor: '#9ca3af',
    shadowOpacity: 0.15,
    elevation: 2,
  },
  instacartButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  instacartButtonGradientDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
  },
  instacartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  instacartButtonTextDisabled: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '700',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  premiumBadgeText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '700',
  },
  viewCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  viewCalendarButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  saveMealPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4cbb17',
  },
  saveMealPlanButtonSaved: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  saveMealPlanButtonText: {
    color: '#4cbb17',
    fontSize: 16,
    fontWeight: '600',
  },
  saveMealPlanButtonTextSaved: {
    color: '#16a34a',
  },
  successDoneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  successDoneText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  
  modalContainer: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  templateMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  macroText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  templateTags: {
    flexDirection: 'row',
    gap: 6,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  miniTagText: {
    fontSize: 11,
    color: '#6b7280',
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  planButtonSuccess: {
    backgroundColor: '#10b981',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  shoppingListButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  planHintText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // View Mode Tabs
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewModeTabActive: {
    backgroundColor: '#ffffff',
  },
  viewModeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  viewModeTabTextActive: {
    color: '#ef4444',
  },

  // Day Picker Styles (Horizontal Scroll) - Matching FitnessDashboard
  dayPickerContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 8,
    marginTop: 16,
  },
  dayPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dayPickerNavButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  dayPickerMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  dayPickerScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayPickerItem: {
    width: 52,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
  },
  dayPickerItemToday: {
    backgroundColor: '#ef4444',
    borderWidth: 0,
  },
  dayPickerItemSelected: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  dayPickerItemCompleted: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  dayPickerItemPast: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  dayPickerDayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayPickerDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  dayPickerTextToday: {
    color: '#ffffff',
  },
  dayPickerTextPast: {
    color: '#9ca3af',
  },
  dayPickerMealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // Section Link
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Today's Meals Card
  todaysMealsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mealTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealTypeInfo: {
    flex: 1,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  mealTypeName: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Template Preview Cards
  templatePreviewCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  templatePreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templatePreviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  templatePreviewMacros: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },

  // Recent Meals
  recentMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  recentMealInfo: {
    flex: 1,
  },
  recentMealName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  recentMealMacros: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  recentMealAction: {
    padding: 4,
  },

  // Planning Card
  planningCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  planningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  planningButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  planningFeatures: {
    gap: 10,
  },
  planningFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planningFeatureText: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Form Header with Back Button
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  // Form Container (for create/library views)
  formContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  formHeaderGradient: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: 24,
  },
  headerBackButtonWhite: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  formHeaderTitleWhite: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  formHeaderSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Back Button (legacy)
  backToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backToText: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Calendar View Styles
  calendarContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  calendarHeader: {
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: dashboardTheme.header.paddingBottom,
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
  },
  calendarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Removed duplicate calendarModalBackButton and calendarModalAddButton
  calendarHeaderText: {
    flex: 1,
  },
  calendarHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  calendarHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // Removed duplicate - see calendarModalBackButton and calendarModalAddButton above
  calendarContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  calendarMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  calendarDayNames: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  calendarDayCell: {
    width: '14.28%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderRadius: 8,
  },
  calendarDayCellEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDayCellToday: {
    backgroundColor: '#eff6ff',
  },
  calendarDayCellSelected: {
    backgroundColor: '#3b82f6',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  calendarDayTextToday: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  calendarMealDots: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  calendarMealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calendarSelectedDay: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarSelectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  calendarMealsList: {
    gap: 12,
  },
  calendarMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  calendarMealIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  calendarMealInfo: {
    flex: 1,
  },
  calendarMealType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  calendarMealName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  calendarMealMacros: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  calendarNoMeals: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  calendarNoMealsText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  calendarAddMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  calendarAddMealText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  calendarSummary: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  calendarSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarSummaryStat: {
    alignItems: 'center',
  },
  calendarSummaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  calendarSummaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  
  // Calendar Placeholder (fallback)
  calendarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  calendarPlaceholderText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  backToDashboardButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  backToDashboardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal Styles
  modalScrollContent: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#ef4444',
  },
  stepDotCompleted: {
    backgroundColor: '#22c55e',
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#22c55e',
  },

  // Plan Generator Modal
  modalSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickGoalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickGoalButton: {
    width: '48%',
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickGoalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickGoalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  quickGoalDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  planDescriptionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Duration Options
  durationOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  durationOptionSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  durationOptionTextSelected: {
    color: '#ef4444',
    fontWeight: '600',
  },

  // Meal Types Grid
  mealTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealTypeOptionSelected: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  mealTypeOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  // Dietary Search
  dietarySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  dietarySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    padding: 0,
  },
  selectedDietaryCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedDietaryCountText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  clearAllText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
  dietaryScrollContainer: {
    maxHeight: 280,
  },
  dietaryCategorySection: {
    marginBottom: 16,
  },
  dietaryCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dietaryCategoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  // Dietary Grid
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dietaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dietaryOptionSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  dietaryOptionLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  dietaryOptionLabelSelected: {
    color: '#ef4444',
    fontWeight: '600',
  },

  // Stores Grid
  storesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storeOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  storeOptionLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  storeOptionLabelSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Generate Button
  generatePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
  },
  generatePlanButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generatePlanButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },

  // Preview Styles
  previewHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  previewDayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  previewDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  previewMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  previewMealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewMealInfo: {
    flex: 1,
  },
  previewMealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  previewMealMacros: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  previewNoMealsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  previewEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  previewEmptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  acceptPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  acceptPlanButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  acceptPlanButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },

  // Plan Summary Stats for preview step
  planSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  planSummaryStat: {
    alignItems: 'center',
    gap: 4,
  },
  planSummaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  planSummaryStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  previewSampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewDayCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  viewAllMealsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  viewAllMealsButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ef4444',
  },
  viewAllMealsButtonDisabled: {
    borderColor: '#9ca3af',
    opacity: 0.7,
  },

  // Shopping List Styles
  shoppingListContainer: {
    gap: 16,
  },
  shoppingCategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  shoppingCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  shoppingCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  shoppingCategoryCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shoppingItemsList: {
    gap: 8,
  },
  shoppingItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  shoppingListNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  shoppingListNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },

  // Library View Styles
  librarySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  librarySearchIcon: {
    marginRight: 8,
  },
  librarySearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  libraryTagsScroll: {
    marginTop: 16,
  },
  libraryTagsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  libraryFilterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  libraryFilterTagActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  libraryFilterTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  libraryFilterTagTextActive: {
    color: '#fff',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  libraryCount: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addMealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  libraryLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  libraryLoadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  libraryEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  libraryEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  libraryEmptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  libraryCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  libraryCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  libraryMealCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  libraryMealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  libraryMealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  libraryMealIconText: {
    fontSize: 24,
  },
  libraryMealInfo: {
    flex: 1,
  },
  libraryMealName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  libraryMealStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  libraryMealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 12,
  },
  libraryMacroItem: {
    alignItems: 'center',
  },
  libraryMacroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  libraryMacroLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  libraryMealTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  libraryMealTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  libraryMealTagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  libraryMealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  libraryMealTimesLogged: {
    fontSize: 14,
    color: '#9ca3af',
  },

  // Create Plan Section (like Fitness Dashboard's Create Workout)
  createPlanSection: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
  },
  createPlanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    marginTop: -10,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  createPlanButtonInHeader: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createPlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  createPlanTextContainer: {
    flex: 1,
  },
  createPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  createPlanSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Meal Details Modal Styles
  mealDetailHero: {
    padding: 24,
    borderRadius: 0,
  },
  mealDetailHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mealDetailCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealDetailBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealDetailFavoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealDetailHeroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  mealDetailHeroDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  mealDetailStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  mealDetailStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealDetailStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  mealDetailDifficultyBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealDetailDifficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  mealDetailContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mealDetailServingsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealDetailServingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  mealDetailServingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  mealDetailServingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealDetailServingsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  mealDetailServingsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  mealDetailSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  mealDetailSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealDetailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  mealDetailPerServing: {
    fontSize: 13,
    color: '#9ca3af',
  },
  mealDetailNutritionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
  },
  mealDetailNutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mealDetailNutritionItem: {
    alignItems: 'center',
  },
  mealDetailNutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
  },
  mealDetailNutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  mealDetailMacroBar: {
    marginBottom: 12,
  },
  mealDetailMacroBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealDetailMacroBarLabel: {
    fontSize: 14,
    color: '#374151',
  },
  mealDetailMacroBarPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  mealDetailMacroBarTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mealDetailMacroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealDetailTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  mealDetailTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mealDetailTagText: {
    fontSize: 13,
    color: '#6b7280',
  },
  mealDetailTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  mealDetailTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  mealDetailTimeLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  mealDetailTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  // Meal Detail Tabs
  mealDetailTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  mealDetailTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  mealDetailTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealDetailTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  mealDetailTabTextActive: {
    color: '#111827',
    fontWeight: '600',
  },

  // Meal Detail Content Card
  mealDetailContentCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  mealDetailIngredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mealDetailIngredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginTop: 6,
    marginRight: 12,
  },
  mealDetailIngredientText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  mealDetailIngredientAmount: {
    fontWeight: '600',
    color: '#111827',
  },
  mealDetailInstructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mealDetailStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealDetailStepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  mealDetailInstructionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  mealDetailNoInstructions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  mealDetailNoInstructionsText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  mealDetailActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  mealDetailDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  mealDetailDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Library Modal Styles
  libraryModalHeader: {
    padding: 24,
    paddingTop: 16,
  },
  libraryModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  libraryModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryModalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  libraryModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Shopping List Modal Styles
  shoppingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  shoppingModalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingModalHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shoppingModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  shoppingStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  shoppingStatItem: {
    alignItems: 'center',
  },
  shoppingStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  shoppingStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  shoppingListScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  shoppingCategorySection: {
    marginTop: 20,
  },
  shoppingCategorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  shoppingCategorySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  shoppingCategorySectionCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shoppingListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shoppingListItemText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  shoppingModalBottomAction: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  shoppingDoneButton: {
    backgroundColor: '#4cbb17',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shoppingDoneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Workout Complete Modal Styles (used for Instacart success)
  workoutCompleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  workoutCompleteContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  workoutCompleteSafeArea: {
    padding: 24,
  },
  workoutCompleteHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  celebrationEmoji: {
    fontSize: 40,
  },
  workoutCompleteTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  workoutCompleteSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  workoutStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  workoutStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
  },
  workoutCompleteStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  workoutCompleteStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  workoutCompleteDoneButton: {
    backgroundColor: '#4cbb17',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  workoutCompleteDoneText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});

