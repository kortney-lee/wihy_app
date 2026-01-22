import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { mealService, MealPlanningPreferences, PlanningFocus, CookingSkillLevel } from '../services/mealService';
import { RootStackParamList } from '../types/navigation';
import { GradientDashboardHeader } from '../components/shared';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'MealPreferences'>;

// Planning focus options
const PLANNING_FOCUS_OPTIONS: { id: PlanningFocus; label: string; icon: string; description: string; emoji: string }[] = [
  {
    id: 'family',
    label: 'Family Meals',
    icon: 'people-outline',
    description: 'Easy recipes everyone loves, kid-friendly options, batch cooking & leftovers',
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    id: 'quick_easy',
    label: 'Quick & Easy',
    icon: 'time-outline',
    description: 'Under 30 minutes, simple ingredients, minimal cleanup',
    emoji: '⏱️',
  },
  {
    id: 'budget',
    label: 'Budget-Friendly',
    icon: 'wallet-outline',
    description: 'Affordable ingredients, store brand options, meal prep to save money',
    emoji: '💰',
  },
  {
    id: 'health_fitness',
    label: 'Health & Fitness',
    icon: 'fitness-outline',
    description: 'High protein, balanced macros, weight management focus, calorie tracking',
    emoji: '💪',
  },
];

// Dietary needs options
const DIETARY_NEEDS_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten-Free' },
  { id: 'dairy_free', label: 'Dairy-Free' },
  { id: 'nut_allergy', label: 'Nut Allergy' },
  { id: 'kid_friendly', label: 'Kid-Friendly' },
  { id: 'low_carb', label: 'Low Carb' },
  { id: 'diabetic_friendly', label: 'Diabetic-Friendly' },
];

// Cooking skill levels
const COOKING_SKILL_OPTIONS: { id: CookingSkillLevel; label: string; description: string }[] = [
  { id: 'beginner', label: 'Beginner', description: 'Simple recipes with basic techniques' },
  { id: 'intermediate', label: 'Intermediate', description: 'Some cooking experience' },
  { id: 'advanced', label: 'Advanced', description: 'Complex cooking techniques' },
];

// Popular stores
const STORE_OPTIONS = [
  { id: 'costco', label: 'Costco' },
  { id: 'trader_joes', label: "Trader Joe's" },
  { id: 'whole_foods', label: 'Whole Foods' },
  { id: 'walmart', label: 'Walmart' },
  { id: 'kroger', label: 'Kroger' },
  { id: 'aldi', label: 'Aldi' },
  { id: 'target', label: 'Target' },
  { id: 'safeway', label: 'Safeway' },
];

export default function MealPreferencesScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  // Form state
  const [planningFocus, setPlanningFocus] = useState<PlanningFocus | null>(null);
  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([]);
  const [preferredStores, setPreferredStores] = useState<string[]>([]);
  const [customBrands, setCustomBrands] = useState('');
  const [cookingSkill, setCookingSkill] = useState<CookingSkillLevel>('beginner');

  // UI state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasExistingPreferences, setHasExistingPreferences] = useState(false);

  // Load existing preferences
  useEffect(() => {
    loadExistingPreferences();
  }, []);

  const loadExistingPreferences = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const preferences = await mealService.getMealPreferences(user.id);
      if (preferences) {
        setHasExistingPreferences(true);
        setPlanningFocus(preferences.planningFocus);
        setDietaryNeeds(preferences.dietaryNeeds || []);
        setPreferredStores(preferences.preferredStores || []);
        setCookingSkill(preferences.cookingSkillLevel || 'beginner');
        setCustomBrands(preferences.preferredBrands?.join(', ') || '');
      }
    } catch (error) {
      console.log('No existing preferences found');
    } finally {
      setLoading(false);
    }
  };

  const toggleDietaryNeed = (id: string) => {
    setDietaryNeeds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleStore = (id: string) => {
    setPreferredStores(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSavePreferences = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to save preferences');
      return;
    }

    if (!planningFocus) {
      Alert.alert('Missing Selection', 'Please select what you\'re planning meals for');
      return;
    }

    setSaving(true);
    try {
      const preferences: MealPlanningPreferences = {
        userId: user.id,
        planningFocus,
        dietaryNeeds,
        preferredStores,
        preferredBrands: customBrands.split(',').map(b => b.trim()).filter(Boolean),
        cookingSkillLevel: cookingSkill,
      };

      await mealService.saveMealPreferences(preferences);

      Alert.alert(
        'Preferences Saved! ✨',
        'Your meal planning preferences have been updated. We\'ll personalize your meal suggestions.',
        [
          {
            text: 'Continue to Meal Planning',
            onPress: () => {
              if (route.params?.returnTo) {
                navigation.navigate(route.params.returnTo as any);
              } else {
                navigation.navigate('CreateMeals');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (route.params?.returnTo) {
      navigation.navigate(route.params.returnTo as any);
    } else {
      navigation.navigate('CreateMeals');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#ef4444" translucent={false} />
      {/* Fixed Header - Using GradientDashboardHeader */}
      <GradientDashboardHeader
        title="🍽️ Let's Personalize Your Meals"
        subtitle="Tell us what matters most to you"
        gradient="mealPreferences"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Scrollable Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
            {/* Planning Focus Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>I'm Planning Meals For...</Text>
              <Text style={styles.sectionSubtitle}>Select your primary focus</Text>

              {PLANNING_FOCUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.focusCard,
                    planningFocus === option.id && styles.focusCardSelected,
                  ]}
                  onPress={() => setPlanningFocus(option.id)}
                >
                  <View style={styles.focusCardHeader}>
                    <Text style={styles.focusEmoji}>{option.emoji}</Text>
                    <View style={styles.focusCardInfo}>
                      <Text style={[
                        styles.focusCardTitle,
                        planningFocus === option.id && styles.focusCardTitleSelected,
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.focusCardDescription}>
                        {option.description}
                      </Text>
                    </View>
                    {planningFocus === option.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#ef4444" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dietary Needs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dietary Needs</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply</Text>

              <View style={styles.optionsGrid}>
                {DIETARY_NEEDS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionChip,
                      dietaryNeeds.includes(option.id) && styles.optionChipSelected,
                    ]}
                    onPress={() => toggleDietaryNeed(option.id)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      dietaryNeeds.includes(option.id) && styles.optionChipTextSelected,
                    ]}>
                      {dietaryNeeds.includes(option.id) ? '✓ ' : ''}{option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preferred Stores */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferred Stores</Text>
              <Text style={styles.sectionSubtitle}>Where do you usually shop?</Text>

              <View style={styles.optionsGrid}>
                {STORE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionChip,
                      preferredStores.includes(option.id) && styles.optionChipSelected,
                    ]}
                    onPress={() => toggleStore(option.id)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      preferredStores.includes(option.id) && styles.optionChipTextSelected,
                    ]}>
                      {preferredStores.includes(option.id) ? '✓ ' : ''}{option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Brands */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferred Brands (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                e.g., Organic brands, Store brands, Kirkland Signature
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="Enter preferred brands, separated by commas..."
                value={customBrands}
                onChangeText={setCustomBrands}
                placeholderTextColor="#9ca3af"
                multiline
              />
            </View>

            {/* Cooking Skill Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cooking Skill Level</Text>

              {COOKING_SKILL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.skillOption,
                    cookingSkill === option.id && styles.skillOptionSelected,
                  ]}
                  onPress={() => setCookingSkill(option.id)}
                >
                  <View style={[
                    styles.radioCircle,
                    cookingSkill === option.id && styles.radioCircleSelected,
                  ]}>
                    {cookingSkill === option.id && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.skillInfo}>
                    <Text style={[
                      styles.skillLabel,
                      cookingSkill === option.id && styles.skillLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.skillDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSavePreferences}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      {hasExistingPreferences ? 'Update & Continue' : 'Save & Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>
                  Skip for Now - You can set preferences later
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ef4444',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fecaca',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  focusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  focusCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  focusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  focusCardInfo: {
    flex: 1,
  },
  focusCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  focusCardTitleSelected: {
    color: '#dc2626',
  },
  focusCardDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  optionChipSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionChipTextSelected: {
    color: '#dc2626',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  skillOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  skillOptionSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioCircleSelected: {
    borderColor: '#ef4444',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  skillInfo: {
    flex: 1,
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  skillLabelSelected: {
    color: '#dc2626',
  },
  skillDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionsSection: {
    padding: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});
