/**
 * GoalSelectionMeals Component
 * 
 * 3-Mode Architecture for Meal Planning:
 * - Quick: Single meal generation (one meal, fast)
 * - Plan: Multi-day meal planning (weekly plans)
 * - Diet: Goal-specific programs (weight loss, muscle gain, etc.)
 * 
 * Mirrors the fitness GoalSelectionV2 pattern.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, BrandInput } from '../../components/shared';
import { API_CONFIG } from '../../services/config';
import {
  ModeToggle,
  DietSelector,
  ServingsSelector,
  DurationSelector,
  CookingLevelSelector,
  MealTypeSelector,
  type MealMode,
} from './components';
import type { CookingSkillLevel, MealVariety, TimePerMeal } from '../../services/mealService';

const { width } = Dimensions.get('window');

// ============================================
// QUICK MODE DATA
// ============================================
const QUICK_MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { id: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { id: 'snack', label: 'Snack', icon: 'cafe-outline' },
  { id: 'dessert', label: 'Dessert', icon: 'ice-cream-outline' },
];

// World Cuisines - organized by category
const WORLD_CUISINES = [
  { id: 'american', label: 'American', icon: 'flag-outline', description: 'Traditional American comfort food' },
  { id: 'mexican', label: 'Mexican', icon: 'flame-outline', description: 'Bold spices and flavors' },
  { id: 'italian', label: 'Italian', icon: 'pizza-outline', description: 'Pasta, pizza, Mediterranean' },
  { id: 'chinese', label: 'Chinese', icon: 'restaurant-outline', description: 'Stir-fry, rice, noodles' },
  { id: 'japanese', label: 'Japanese', icon: 'fish-outline', description: 'Sushi, teriyaki, miso' },
  { id: 'korean', label: 'Korean', icon: 'bonfire-outline', description: 'BBQ, kimchi, spicy dishes' },
  { id: 'greek', label: 'Greek', icon: 'boat-outline', description: 'Mediterranean, seafood' },
  { id: 'caribbean', label: 'Caribbean', icon: 'sunny-outline', description: 'Jerk, tropical flavors' },
  { id: 'brazilian', label: 'Brazilian', icon: 'leaf-outline', description: 'Churrasco, feijoada' },
  { id: 'spanish', label: 'Spanish', icon: 'wine-outline', description: 'Tapas, paella' },
  { id: 'french', label: 'French', icon: 'rose-outline', description: 'Classic French cuisine' },
  { id: 'asian', label: 'Asian Fusion', icon: 'globe-outline', description: 'General Asian fusion' },
];

// Vegetarian-friendly cuisines
const VEGETARIAN_CUISINES = [
  { id: 'thai', label: 'Thai', icon: 'leaf-outline', description: 'Curries, coconut, fresh herbs' },
  { id: 'indian', label: 'Indian', icon: 'bonfire-outline', description: 'Curries, lentils, spices' },
  { id: 'vietnamese', label: 'Vietnamese', icon: 'nutrition-outline', description: 'Pho, spring rolls, fresh veggies' },
  { id: 'mediterranean', label: 'Mediterranean', icon: 'boat-outline', description: 'Plant-based focus' },
  { id: 'middle_eastern', label: 'Middle Eastern', icon: 'earth-outline', description: 'Falafel, hummus, tabbouleh' },
  { id: 'moroccan', label: 'Moroccan', icon: 'compass-outline', description: 'Tagines, couscous, chickpeas' },
];

// Combined for backward compatibility
const QUICK_CUISINE_TYPES = [...WORLD_CUISINES.slice(0, 6)]; // Keep first 6 for quick display

const TIME_CONSTRAINTS = [
  { id: 'quick', label: '< 15 min', icon: 'flash-outline' },
  { id: 'moderate', label: '15-30 min', icon: 'time-outline' },
  { id: 'standard', label: '30-60 min', icon: 'hourglass-outline' },
  { id: 'slow', label: '1+ hour', icon: 'timer-outline' },
];

// ============================================
// PLAN MODE DATA
// ============================================
const QUICK_GOALS = [
  { 
    id: 'family_dinners',
    label: 'Family Dinners', 
    icon: 'people-outline', 
    description: 'Easy family dinners for 4',
    config: { mealVariety: 'family_friendly' as MealVariety, servings: 4 }
  },
  { 
    id: 'meal_prep',
    label: 'Meal Prep', 
    icon: 'cube-outline', 
    description: 'Batch cooking for the week',
    config: { mealVariety: 'batch_cooking' as MealVariety, servings: 6 }
  },
  { 
    id: 'high_protein',
    label: 'High Protein', 
    icon: 'fitness-outline', 
    description: 'Protein-focused meals',
    config: { mealVariety: 'high_protein' as MealVariety, servings: 2 }
  },
  { 
    id: 'quick_easy',
    label: 'Quick & Easy', 
    icon: 'flash-outline', 
    description: 'Under 30 min recipes',
    config: { timePerMeal: 'quick' as TimePerMeal, cookingComplexity: 'beginner' as CookingSkillLevel }
  },
  { 
    id: 'budget',
    label: 'Budget Meals', 
    icon: 'wallet-outline', 
    description: 'Affordable ingredients',
    config: { specialFocus: ['budget_friendly'] }
  },
  { 
    id: 'healthy',
    label: 'Healthy', 
    icon: 'heart-outline', 
    description: 'Balanced nutrition',
    config: { mealVariety: 'balanced' as MealVariety, specialFocus: ['whole_foods'] }
  },
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

// ============================================
// DIET PROGRAM MODE DATA
// ============================================
const DIET_PROGRAMS = [
  { id: 'weight_loss', label: 'Weight Loss', icon: 'trending-down-outline', weeks: 4, description: 'Caloric deficit focused' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: 'fitness-outline', weeks: 8, description: 'High protein, surplus' },
  { id: 'maintenance', label: 'Maintenance', icon: 'shield-checkmark-outline', weeks: 4, description: 'Balanced nutrition' },
  { id: 'energy', label: 'Energy Boost', icon: 'flash-outline', weeks: 2, description: 'Complex carbs, iron' },
  { id: 'gut_health', label: 'Gut Health', icon: 'medical-outline', weeks: 4, description: 'Fiber, probiotics' },
  { id: 'anti_inflammatory', label: 'Anti-Inflammatory', icon: 'shield-outline', weeks: 4, description: 'Reduce inflammation' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { id: 'light', label: 'Light', description: '1-3 days/week' },
  { id: 'moderate', label: 'Moderate', description: '3-5 days/week' },
  { id: 'active', label: 'Active', description: '6-7 days/week' },
];

// ============================================
// PROPS INTERFACE
// ============================================

/** Quick template preset from mealService */
interface QuickTemplatePreset {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface GoalSelectionMealsProps {
  isGenerating: boolean;
  onGenerateMeal: (params: GenerateMealParams) => void;
  /** Pre-selected template from Quick Templates on main screen */
  initialTemplate?: QuickTemplatePreset | null;
  /** Callback when template is cleared/used */
  onTemplateCleared?: () => void;
}

export interface GenerateMealParams {
  mode: MealMode;
  
  // Quick mode
  mealType?: string; // Deprecated - use mealTypes
  mealTypes?: string[]; // New: support multiple meal types
  cuisineType?: string; // Deprecated - use cuisineTypes
  cuisineTypes?: string[]; // New: support multiple cuisines
  timeConstraint?: string;
  quickDiets?: string[];
  
  // Plan mode
  planGoal?: string;
  duration?: number;
  servings?: number;
  mealsPerDay?: Record<string, boolean>;
  dietaryRestrictions?: string[];
  cookingLevel?: CookingSkillLevel;
  preferredStores?: string[];
  description?: string;
  
  // Diet Program mode
  program?: string;
  activityLevel?: string;
  calorieTarget?: number;
  
  // Saved mode
  savedMealIds?: string[]; // Selected saved meal IDs to reorder
  
  // Brand preferences (all modes)
  preferredBrands?: string[];
}

// ============================================
// MAIN COMPONENT
// ============================================
export const GoalSelectionMeals: React.FC<GoalSelectionMealsProps> = ({
  isGenerating,
  onGenerateMeal,
  initialTemplate,
  onTemplateCleared,
}) => {
  // Mode state - default to 'plan' if template provided
  const [mode, setMode] = useState<MealMode>(initialTemplate ? 'plan' : 'quick');
  
  // Quick mode state
  const [quickMealTypes, setQuickMealTypes] = useState<string[]>(['dinner']);
  const [quickCuisines, setQuickCuisines] = useState<string[]>([]);
  const [quickTime, setQuickTime] = useState<string>('moderate');
  const [quickDiets, setQuickDiets] = useState<string[]>([]);
  const [cuisineTab, setCuisineTab] = useState<'world' | 'vegetarian'>('world'); // Cuisine category tab
  
  // Plan mode state
  const [planGoal, setPlanGoal] = useState<string | null>(null);
  const [duration, setDuration] = useState(mode === 'quick' ? 1 : 7); // Quick: 1 day, Plan: 7 days
  const [servings, setServings] = useState(2);
  const [mealsPerDay, setMealsPerDay] = useState<Record<string, boolean>>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false,
  });
  const [planCuisines, setPlanCuisines] = useState<string[]>([]); // Multi-select cuisines
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [cookingLevel, setCookingLevel] = useState<CookingSkillLevel>('intermediate');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [planDescription, setPlanDescription] = useState(initialTemplate?.description || '');
  
  // Diet Program mode state
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [calorieTarget, setCalorieTarget] = useState<string>('');
  const [programDiets, setProgramDiets] = useState<string[]>([]);
  
  // Saved mode state
  const [selectedSavedMealIds, setSelectedSavedMealIds] = useState<string[]>([]);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [loadingSavedMeals, setLoadingSavedMeals] = useState(false);
  const [savedMealsError, setSavedMealsError] = useState<string | null>(null);
  
  // Brand preferences (shared across all modes)
  const [preferredBrands, setPreferredBrands] = useState<string[]>([]);

  // Update duration when mode changes
  useEffect(() => {
    if (mode === 'quick' && duration > 5) {
      setDuration(1); // Reset to 1 day for Quick mode
    } else if (mode === 'plan' && duration < 7) {
      setDuration(7); // Reset to 7 days for Plan mode
    }
  }, [mode, duration]);

  // Initialize from template when it changes
  useEffect(() => {
    if (initialTemplate) {
      setMode('plan');
      setPlanDescription(initialTemplate.description);
      
      // Set specific configurations based on template id
      switch (initialTemplate.id) {
        case 'easy_weeknight':
          setDuration(5);
          setCookingLevel('beginner');
          setMealsPerDay({ breakfast: false, lunch: false, dinner: true, snack: false });
          break;
        case 'budget_meals':
          setDuration(7);
          setServings(4);
          setSelectedStores(['walmart', 'aldi']);
          break;
        case 'kid_lunches':
          setDuration(5);
          setServings(1);
          setMealsPerDay({ breakfast: false, lunch: true, dinner: false, snack: true });
          break;
        case 'breakfast_prep':
          setDuration(5);
          setMealsPerDay({ breakfast: true, lunch: false, dinner: false, snack: false });
          break;
        case 'high_protein':
          setDuration(7);
          setDietaryRestrictions(['high_protein']);
          setMealsPerDay({ breakfast: true, lunch: true, dinner: true, snack: true });
          break;
        case 'vegetarian_week':
          setDuration(7);
          setDietaryRestrictions(['vegetarian']);
          setMealsPerDay({ breakfast: true, lunch: true, dinner: true, snack: false });
          break;
      }
    }
  }, [initialTemplate]);

  // Toggle store selection
  const toggleStore = (id: string) => {
    setSelectedStores(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Handle generate
  const handleGenerate = () => {
    const params: GenerateMealParams = { mode };

    if (mode === 'quick') {
      params.mealTypes = quickMealTypes;
      params.cuisineTypes = quickCuisines.length > 0 ? quickCuisines : undefined;
      params.timeConstraint = quickTime;
      params.quickDiets = quickDiets;
      params.servings = servings; // Include servings for single meal
    } else if (mode === 'plan') {
      params.planGoal = planGoal || undefined;
      params.duration = duration;
      params.servings = servings;
      params.mealsPerDay = mealsPerDay;
      params.cuisineTypes = planCuisines.length > 0 ? planCuisines : undefined; // Multi-select cuisines
      params.dietaryRestrictions = dietaryRestrictions;
      params.cookingLevel = cookingLevel;
      params.preferredStores = selectedStores.length > 0 ? selectedStores : undefined;
      params.description = planDescription || undefined;
    } else if (mode === 'saved') {
      params.savedMealIds = selectedSavedMealIds;
      params.servings = servings; // Allow adjusting servings for reorder
    } else if (mode === 'diet') {
      params.program = selectedProgram || undefined;
      params.activityLevel = activityLevel;
      params.calorieTarget = calorieTarget ? parseInt(calorieTarget) : undefined;
      params.dietaryRestrictions = programDiets;
      params.servings = servings; // Include servings for diet programs
      params.duration = DIET_PROGRAMS.find(p => p.id === selectedProgram)?.weeks ? 
        (DIET_PROGRAMS.find(p => p.id === selectedProgram)!.weeks * 7) : 28;
    }

    // Include brand preferences for all modes
    if (preferredBrands.length > 0) {
      params.preferredBrands = preferredBrands;
    }

    onGenerateMeal(params);
  };

  // Check if can generate
  const canGenerate = () => {
    if (mode === 'quick') return quickMealTypes.length > 0;
    if (mode === 'plan') return Object.values(mealsPerDay).some(Boolean);
    if (mode === 'saved') return selectedSavedMealIds.length > 0;
    if (mode === 'diet') return !!selectedProgram;
    return false;
  };

  // ============================================
  // QUICK MODE RENDER
  // ============================================
  const renderQuickMode = () => (
    <>
      {/* Meal Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What meal?</Text>
        <View style={styles.chipGrid}>
          {QUICK_MEAL_TYPES.map((type) => {
            const isSelected = quickMealTypes.includes(type.id);
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => {
                  setQuickMealTypes(prev => 
                    prev.includes(type.id) 
                      ? prev.filter(id => id !== type.id)
                      : [...prev, type.id]
                  );
                }}
              >
                <Ionicons
                  name={type.icon as any}
                  size={18}
                  color={isSelected ? '#4cbb17' : '#6b7280'}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Cuisine Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuisine (optional)</Text>
        
        {/* Cuisine Category Tabs */}
        <View style={styles.cuisineTabsContainer}>
          <TouchableOpacity
            style={[styles.cuisineTab, cuisineTab === 'world' && styles.cuisineTabActive]}
            onPress={() => setCuisineTab('world')}
          >
            <Ionicons name="globe-outline" size={16} color={cuisineTab === 'world' ? '#4cbb17' : '#6b7280'} />
            <Text style={[styles.cuisineTabText, cuisineTab === 'world' && styles.cuisineTabTextActive]}>World</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cuisineTab, cuisineTab === 'vegetarian' && styles.cuisineTabActive]}
            onPress={() => setCuisineTab('vegetarian')}
          >
            <Ionicons name="leaf-outline" size={16} color={cuisineTab === 'vegetarian' ? '#4cbb17' : '#6b7280'} />
            <Text style={[styles.cuisineTabText, cuisineTab === 'vegetarian' && styles.cuisineTabTextActive]}>Veg-Friendly</Text>
          </TouchableOpacity>
        </View>
        
        {/* Cuisine Options based on selected tab */}
        <View style={styles.chipGrid}>
          {(cuisineTab === 'world' ? WORLD_CUISINES : VEGETARIAN_CUISINES).map((cuisine) => {
            const isSelected = quickCuisines.includes(cuisine.id);
            return (
              <TouchableOpacity
                key={cuisine.id}
                style={[styles.cuisineChip, isSelected && styles.cuisineChipSelected]}
                onPress={() => {
                  setQuickCuisines(prev => 
                    prev.includes(cuisine.id)
                      ? prev.filter(id => id !== cuisine.id)
                      : [...prev, cuisine.id]
                  );
                }}
              >
                <View style={styles.cuisineChipHeader}>
                  <Ionicons
                    name={cuisine.icon as any}
                    size={18}
                    color={isSelected ? '#4cbb17' : '#6b7280'}
                  />
                  <Text style={[styles.cuisineChipLabel, isSelected && styles.cuisineChipLabelSelected]}>
                    {cuisine.label}
                  </Text>
                </View>
                <Text style={[styles.cuisineChipDescription, isSelected && styles.cuisineChipDescriptionSelected]} numberOfLines={1}>
                  {cuisine.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Selected cuisines summary */}
        {quickCuisines.length > 0 && (
          <View style={styles.selectedCuisinesSummary}>
            <Text style={styles.selectedCuisinesLabel}>Selected: </Text>
            <Text style={styles.selectedCuisinesText}>
              {quickCuisines.map(id => {
                const cuisine = [...WORLD_CUISINES, ...VEGETARIAN_CUISINES].find(c => c.id === id);
                return cuisine?.label || id;
              }).join(', ')}
            </Text>
            <TouchableOpacity onPress={() => setQuickCuisines([])} style={styles.clearCuisinesButton}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Time Constraint */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time available</Text>
        <View style={styles.chipGrid}>
          {TIME_CONSTRAINTS.map((time) => {
            const isSelected = quickTime === time.id;
            return (
              <TouchableOpacity
                key={time.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setQuickTime(time.id)}
              >
                <Ionicons
                  name={time.icon as any}
                  size={18}
                  color={isSelected ? '#4cbb17' : '#6b7280'}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {time.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Duration (Quick mode) */}
      <DurationSelector
        selectedDuration={duration}
        onDurationChange={setDuration}
        title="Meals for"
        mode="quick"
      />

      {/* Servings */}
      <ServingsSelector
        selectedServings={servings}
        onServingsChange={setServings}
      />

      {/* Diet Restrictions */}
      <DietSelector
        selectedDiets={quickDiets}
        onDietsChange={setQuickDiets}
        showSearch={false}
        title="Dietary needs (optional)"
      />

      {/* Brand Preferences */}
      <View style={styles.section}>
        <BrandInput
          value={preferredBrands}
          onChange={setPreferredBrands}
          placeholder="e.g., Prego, Classico"
        />
      </View>
    </>
  );

  // ============================================
  // PLAN MODE RENDER
  // ============================================
  const renderPlanMode = () => (
    <>
      {/* Quick Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick start (optional)</Text>
        <View style={styles.quickGoalGrid}>
          {QUICK_GOALS.map((goal) => {
            const isSelected = planGoal === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.quickGoalCard, isSelected && styles.quickGoalCardSelected]}
                onPress={() => {
                  setPlanGoal(isSelected ? null : goal.id);
                  if (!isSelected && goal.config.servings) {
                    setServings(goal.config.servings);
                  }
                }}
              >
                <Ionicons
                  name={goal.icon as any}
                  size={24}
                  color={isSelected ? '#4cbb17' : '#6b7280'}
                />
                <Text style={[styles.quickGoalLabel, isSelected && styles.quickGoalLabelSelected]}>
                  {goal.label}
                </Text>
                <Text style={styles.quickGoalDescription}>{goal.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Description (optional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleLight}>Describe your plan (optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Easy family dinners using Costco ingredients"
          placeholderTextColor="#9ca3af"
          value={planDescription}
          onChangeText={setPlanDescription}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Duration */}
      <DurationSelector
        selectedDuration={duration}
        onDurationChange={setDuration}
        mode="plan"
      />

      {/* Servings */}
      <ServingsSelector
        selectedServings={servings}
        onServingsChange={setServings}
      />

      {/* Meals Per Day */}
      <MealTypeSelector
        selectedMealTypes={mealsPerDay}
        onMealTypesChange={setMealsPerDay}
      />

      {/* Cuisines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleLight}>Cuisines (optional)</Text>
        <View style={styles.chipGrid}>
          {QUICK_CUISINE_TYPES.map((cuisine) => {
            const isSelected = planCuisines.includes(cuisine.id);
            return (
              <TouchableOpacity
                key={cuisine.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => {
                  setPlanCuisines(prev => 
                    prev.includes(cuisine.id)
                      ? prev.filter(id => id !== cuisine.id)
                      : [...prev, cuisine.id]
                  );
                }}
              >
                <Ionicons
                  name={cuisine.icon as any}
                  size={16}
                  color={isSelected ? '#4cbb17' : '#6b7280'}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cuisine.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Cooking Level */}
      <CookingLevelSelector
        selectedLevel={cookingLevel}
        onLevelChange={setCookingLevel}
      />

      {/* Dietary Restrictions */}
      <DietSelector
        selectedDiets={dietaryRestrictions}
        onDietsChange={setDietaryRestrictions}
        showSearch={true}
        title="Dietary restrictions"
      />

      {/* Preferred Stores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleLight}>Preferred stores (optional)</Text>
        <View style={styles.chipGrid}>
          {STORE_OPTIONS.map((store) => {
            const isSelected = selectedStores.includes(store.id);
            return (
              <TouchableOpacity
                key={store.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleStore(store.id)}
              >
                <Ionicons
                  name={store.icon as any}
                  size={16}
                  color={isSelected ? '#4cbb17' : '#6b7280'}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {store.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Brand Preferences */}
      <View style={styles.section}>
        <BrandInput
          value={preferredBrands}
          onChange={setPreferredBrands}
          placeholder="e.g., Prego, Classico"
        />
      </View>
    </>
  );

  // ============================================
  // SAVED MODE RENDER
  // ============================================
  const renderSavedMode = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        <Text style={styles.sectionTitleLight}>
          Select previously created meals to reorder to Instacart
        </Text>
      </View>

      {/* Loading state */}
      {loadingSavedMeals && (
        <View style={styles.section}>
          <ActivityIndicator size="large" color="#4cbb17" />
          <Text style={styles.loadingText}>Loading saved meals...</Text>
        </View>
      )}

      {/* Error state */}
      {savedMealsError && (
        <View style={styles.section}>
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{savedMealsError}</Text>
          </View>
        </View>
      )}

      {/* Empty state */}
      {!loadingSavedMeals && !savedMealsError && savedMeals.length === 0 && (
        <View style={styles.section}>
          <View style={styles.placeholderBox}>
            <Ionicons name="bookmark-outline" size={48} color="#9ca3af" />
            <Text style={styles.placeholderText}>No saved meals yet</Text>
            <Text style={styles.placeholderSubtext}>
              Generate meals in Quick or Plan mode first
            </Text>
          </View>
        </View>
      )}

      {/* Saved meals list */}
      {!loadingSavedMeals && !savedMealsError && savedMeals.length > 0 && (
        <View style={styles.section}>
          {savedMeals.map((mealPlan) => {
            const isSelected = selectedSavedMealIds.includes(mealPlan.id);
            return (
              <TouchableOpacity
                key={mealPlan.id}
                style={[styles.savedMealCard, isSelected && styles.savedMealCardSelected]}
                onPress={() => {
                  setSelectedSavedMealIds(prev => 
                    prev.includes(mealPlan.id)
                      ? prev.filter(id => id !== mealPlan.id)
                      : [...prev, mealPlan.id]
                  );
                }}
              >
                <View style={styles.savedMealHeader}>
                  <View style={styles.savedMealInfo}>
                    <Text style={styles.savedMealTitle}>{mealPlan.name}</Text>
                    <Text style={styles.savedMealSubtitle}>{mealPlan.displayTitle}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </View>
                
                <View style={styles.savedMealMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="restaurant-outline" size={14} color="#6b7280" />
                    <Text style={styles.metaText}>{mealPlan.totalMeals} meals</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                    <Text style={styles.metaText}>{mealPlan.duration} days</Text>
                  </View>
                  {mealPlan.orderCount > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="repeat-outline" size={14} color="#6b7280" />
                      <Text style={styles.metaText}>Ordered {mealPlan.orderCount}x</Text>
                    </View>
                  )}
                </View>
                
                {mealPlan.description && (
                  <Text style={styles.savedMealDescription} numberOfLines={2}>
                    {mealPlan.description}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Servings adjustment */}
      {savedMeals.length > 0 && (
        <ServingsSelector
          selectedServings={servings}
          onServingsChange={setServings}
        />
      )}
    </>
  );

  // ============================================
  // DIET PROGRAM MODE RENDER
  // ============================================
  const renderDietMode = () => (
    <>
      {/* Program Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Program</Text>
        <View style={styles.programGrid}>
          {DIET_PROGRAMS.map((program) => {
            const isSelected = selectedProgram === program.id;
            return (
              <TouchableOpacity
                key={program.id}
                style={[styles.programCard, isSelected && styles.programCardSelected]}
                onPress={() => setSelectedProgram(program.id)}
              >
                <Ionicons
                  name={program.icon as any}
                  size={24}
                  color={isSelected ? '#4cbb17' : '#6b7280'}
                />
                <Text style={[styles.programLabel, isSelected && styles.programLabelSelected]}>
                  {program.label}
                </Text>
                <Text style={styles.programDescription}>{program.description}</Text>
                <Text style={styles.programWeeks}>{program.weeks} weeks</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedProgram && (
        <>
          {/* Activity Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Level</Text>
            <View style={styles.levelRow}>
              {ACTIVITY_LEVELS.map((level) => {
                const isSelected = activityLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[styles.levelOption, isSelected && styles.levelOptionSelected]}
                    onPress={() => setActivityLevel(level.id)}
                  >
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {level.label}
                    </Text>
                    <Text style={styles.levelDescription}>{level.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Calorie Target (optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleLight}>Daily calorie target (optional)</Text>
            <TextInput
              style={styles.calorieInput}
              placeholder="Auto-calculated"
              placeholderTextColor="#9ca3af"
              value={calorieTarget}
              onChangeText={setCalorieTarget}
              keyboardType="numeric"
            />
          </View>

          {/* Diet Restrictions */}
          <DietSelector
            selectedDiets={programDiets}
            onDietsChange={setProgramDiets}
            showSearch={false}
            title="Additional dietary needs"
          />

          {/* Brand Preferences */}
          <View style={styles.section}>
            <BrandInput
              value={preferredBrands}
              onChange={setPreferredBrands}
              placeholder="e.g., Prego, Classico"
            />
          </View>
        </>
      )}
    </>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Mode Toggle */}
      <ModeToggle selectedMode={mode} onModeChange={setMode} />

      {/* Mode-specific content */}
      {mode === 'quick' && renderQuickMode()}
      {mode === 'plan' && renderPlanMode()}
      {mode === 'saved' && renderSavedMode()}
      {mode === 'diet' && renderDietMode()}

      {/* Primary CTA */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          (!canGenerate() || isGenerating) && styles.generateButtonDisabled,
        ]}
        onPress={handleGenerate}
        disabled={!canGenerate() || isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="flash" size={22} color="#ffffff" />
            <Text style={styles.generateButtonText}>
              {mode === 'quick' ? 'Generate Meal' : 
               mode === 'plan' ? 'Create Meal Plan' :
               mode === 'saved' ? 'Reorder to Instacart' :
               'Start Program'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  sectionTitleLight: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  // Chip styles
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  // Quick Goal styles
  quickGoalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickGoalCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 4,
  },
  quickGoalCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  quickGoalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  quickGoalLabelSelected: {
    color: '#166534',
  },
  quickGoalDescription: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Program styles
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  programCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 4,
  },
  programCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  programLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  programLabelSelected: {
    color: '#166534',
  },
  programDescription: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  programWeeks: {
    fontSize: 10,
    color: '#4cbb17',
    fontWeight: '600',
    marginTop: 2,
  },
  // Level selection
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelOption: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  levelOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  levelLabelSelected: {
    color: '#166534',
  },
  levelDescription: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  // Input styles
  textInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 60,
    textAlignVertical: 'top',
    outlineStyle: 'none' as any,
  },
  calorieInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    outlineStyle: 'none' as any,
  },
  // Generate button
  generateButton: {
    backgroundColor: '#4cbb17',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Placeholder styles
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'center',
  },
  savedMealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  savedMealCardSelected: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  savedMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  savedMealInfo: {
    flex: 1,
    marginRight: 12,
  },
  savedMealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  savedMealSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  savedMealMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  savedMealDescription: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  // Cuisine Tab Styles
  cuisineTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cuisineTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  cuisineTabActive: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  cuisineTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  cuisineTabTextActive: {
    color: '#166534',
    fontWeight: '600',
  },
  cuisineChip: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  cuisineChipSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  cuisineChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cuisineChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  cuisineChipLabelSelected: {
    color: '#166534',
  },
  cuisineChipDescription: {
    fontSize: 11,
    color: '#9ca3af',
    lineHeight: 14,
  },
  cuisineChipDescriptionSelected: {
    color: '#4ade80',
  },
  selectedCuisinesSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  selectedCuisinesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedCuisinesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    flex: 1,
  },
  clearCuisinesButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});

export default GoalSelectionMeals;
