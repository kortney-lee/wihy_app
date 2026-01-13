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
import { Ionicons } from '@expo/vector-icons';
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

const QUICK_CUISINE_TYPES = [
  { id: 'american', label: 'American', icon: 'flag-outline' },
  { id: 'italian', label: 'Italian', icon: 'pizza-outline' },
  { id: 'mexican', label: 'Mexican', icon: 'flame-outline' },
  { id: 'asian', label: 'Asian', icon: 'restaurant-outline' },
  { id: 'mediterranean', label: 'Mediterranean', icon: 'boat-outline' },
  { id: 'indian', label: 'Indian', icon: 'bonfire-outline' },
];

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
  mealType?: string;
  cuisineType?: string;
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
  const [quickMealType, setQuickMealType] = useState<string>('dinner');
  const [quickCuisine, setQuickCuisine] = useState<string | null>(null);
  const [quickTime, setQuickTime] = useState<string>('moderate');
  const [quickDiets, setQuickDiets] = useState<string[]>([]);
  
  // Plan mode state
  const [planGoal, setPlanGoal] = useState<string | null>(null);
  const [duration, setDuration] = useState(7);
  const [servings, setServings] = useState(2);
  const [mealsPerDay, setMealsPerDay] = useState<Record<string, boolean>>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false,
  });
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [cookingLevel, setCookingLevel] = useState<CookingSkillLevel>('intermediate');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [planDescription, setPlanDescription] = useState(initialTemplate?.description || '');
  
  // Diet Program mode state
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [calorieTarget, setCalorieTarget] = useState<string>('');
  const [programDiets, setProgramDiets] = useState<string[]>([]);

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
      params.mealType = quickMealType;
      params.cuisineType = quickCuisine || undefined;
      params.timeConstraint = quickTime;
      params.quickDiets = quickDiets;
    } else if (mode === 'plan') {
      params.planGoal = planGoal || undefined;
      params.duration = duration;
      params.servings = servings;
      params.mealsPerDay = mealsPerDay;
      params.dietaryRestrictions = dietaryRestrictions;
      params.cookingLevel = cookingLevel;
      params.preferredStores = selectedStores.length > 0 ? selectedStores : undefined;
      params.description = planDescription || undefined;
    } else if (mode === 'diet') {
      params.program = selectedProgram || undefined;
      params.activityLevel = activityLevel;
      params.calorieTarget = calorieTarget ? parseInt(calorieTarget) : undefined;
      params.dietaryRestrictions = programDiets;
      params.duration = DIET_PROGRAMS.find(p => p.id === selectedProgram)?.weeks ? 
        (DIET_PROGRAMS.find(p => p.id === selectedProgram)!.weeks * 7) : 28;
    }

    onGenerateMeal(params);
  };

  // Check if can generate
  const canGenerate = () => {
    if (mode === 'quick') return !!quickMealType;
    if (mode === 'plan') return Object.values(mealsPerDay).some(Boolean);
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
            const isSelected = quickMealType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setQuickMealType(type.id)}
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
        <View style={styles.chipGrid}>
          {QUICK_CUISINE_TYPES.map((cuisine) => {
            const isSelected = quickCuisine === cuisine.id;
            return (
              <TouchableOpacity
                key={cuisine.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setQuickCuisine(isSelected ? null : cuisine.id)}
              >
                <Ionicons
                  name={cuisine.icon as any}
                  size={18}
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

      {/* Diet Restrictions */}
      <DietSelector
        selectedDiets={quickDiets}
        onDietsChange={setQuickDiets}
        maxSelection={3}
        showSearch={false}
        title="Dietary needs (optional)"
      />
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
});

export default GoalSelectionMeals;
