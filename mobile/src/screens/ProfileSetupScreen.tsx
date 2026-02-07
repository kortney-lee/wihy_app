import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import { getDashboardTheme } from '../theme/dashboardTheme';
import { formatDateInput, formatISODateForDisplay } from '../utils/dateFormatter';
import SvgIcon from '../components/shared/SvgIcon';

const { width: screenWidth } = Dimensions.get('window');

// WiHY Light theme - aligned with design patterns
const theme = {
  background: '#e0f2fe', // Standard page background per DESIGN_PATTERNS.md
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  text: '#1f2937',
  textSecondary: '#6b7280',
  accent: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  inputBg: '#f9fafb',
};

// Step definitions
type SetupStep = 'basics' | 'goals' | 'preferences' | 'fitness' | 'complete';

const stepTitles: Record<SetupStep, string> = {
  basics: 'Basic Information',
  goals: 'Your Health Goals',
  preferences: 'Dietary Preferences',
  fitness: 'Fitness Level',
  complete: 'All Set!',
};

const stepDescriptions: Record<SetupStep, string> = {
  basics: 'Let\'s start with some basic information about you.',
  goals: 'What are you hoping to achieve with WiHY?',
  preferences: 'Tell us about any dietary preferences or restrictions.',
  fitness: 'How would you describe your current fitness level?',
  complete: 'Your profile is ready! Let\'s start your health journey.',
};

// Goal options
const healthGoals = [
  { id: 'weight_loss', label: 'Lose Weight', icon: 'trending-down', color: '#ef4444' },
  { id: 'weight_gain', label: 'Gain Weight', icon: 'trending-up', color: '#22c55e' },
  { id: 'maintain', label: 'Maintain Weight', icon: 'swap-horizontal', color: '#3b82f6' },
  { id: 'muscle', label: 'Build Muscle', icon: 'barbell', color: '#8b5cf6' },
  { id: 'energy', label: 'More Energy', icon: 'flash', color: '#f59e0b' },
  { id: 'sleep', label: 'Better Sleep', icon: 'moon', color: '#6366f1' },
  { id: 'nutrition', label: 'Eat Healthier', icon: 'nutrition', color: '#10b981' },
  { id: 'reduce_stress', label: 'Reduce Stress', icon: 'leaf', color: '#14b8a6' },
];

// Dietary preferences
const dietaryPreferences = [
  { id: 'none', label: 'No Restrictions', icon: 'checkmark-circle' },
  { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
  { id: 'vegan', label: 'Vegan', icon: 'flower' },
  { id: 'pescatarian', label: 'Pescatarian', icon: 'fish' },
  { id: 'keto', label: 'Keto', icon: 'flame' },
  { id: 'paleo', label: 'Paleo', icon: 'nutrition' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: 'ban' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: 'close-circle' },
  { id: 'halal', label: 'Halal', icon: 'star' },
  { id: 'kosher', label: 'Kosher', icon: 'star-outline' },
];

// Allergies
const commonAllergies = [
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'tree_nuts', label: 'Tree Nuts' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'soy', label: 'Soy' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'fish', label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
];

// Fitness levels
const fitnessLevels = [
  { 
    id: 'sedentary', 
    label: 'Sedentary', 
    description: 'Little to no exercise, mostly sitting',
    icon: 'bed',
    color: '#9ca3af',
  },
  { 
    id: 'light', 
    label: 'Lightly Active', 
    description: 'Light exercise 1-3 days/week',
    icon: 'walk',
    color: '#60a5fa',
  },
  { 
    id: 'moderate', 
    label: 'Moderately Active', 
    description: 'Moderate exercise 3-5 days/week',
    icon: 'bicycle',
    color: '#34d399',
  },
  { 
    id: 'active', 
    label: 'Very Active', 
    description: 'Hard exercise 6-7 days/week',
    icon: 'fitness',
    color: '#f59e0b',
  },
  { 
    id: 'athlete', 
    label: 'Athlete', 
    description: 'Professional or competitive athlete',
    icon: 'trophy',
    color: '#8b5cf6',
  },
];

// Activity preferences
const activityTypes = [
  { id: 'walking', label: 'Walking', icon: 'walk' },
  { id: 'running', label: 'Running', icon: 'fitness' },
  { id: 'cycling', label: 'Cycling', icon: 'bicycle' },
  { id: 'swimming', label: 'Swimming', icon: 'water' },
  { id: 'weights', label: 'Weight Training', icon: 'barbell' },
  { id: 'yoga', label: 'Yoga', icon: 'body' },
  { id: 'sports', label: 'Team Sports', icon: 'football' },
  { id: 'hiit', label: 'HIIT', icon: 'flash' },
];

interface ProfileSetupScreenProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

export default function ProfileSetupScreen({ isDashboardMode = false, onBack }: ProfileSetupScreenProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, updateUser } = useContext(AuthContext);
  const { theme: themeContext, isDark } = useTheme();
  const dashboardTheme = getDashboardTheme(isDark);
  
  // Determine if this is an onboarding flow
  // Check route params first, then URL query params on web
  const getIsOnboarding = (): boolean => {
    if (isDashboardMode) return false;
    if (route.params?.isOnboarding) return true;
    // On web, check URL query params
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('isOnboarding') === 'true';
    }
    return false;
  };
  const isOnboarding = getIsOnboarding();
  
  const [currentStep, setCurrentStep] = useState<SetupStep>('basics');
  const [saving, setSaving] = useState(false);

  // Basic info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Preferences
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherRestrictions, setOtherRestrictions] = useState('');

  // Fitness
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [preferredActivities, setPreferredActivities] = useState<string[]>([]);
  const [weeklyExerciseGoal, setWeeklyExerciseGoal] = useState('3');

  // Collapsible header animation
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

  // Load existing data
  useEffect(() => {
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user?.email) return;
    try {
      const profile = await userService.getUserByEmail(user.email);
      if (profile) {
        // Load basic info
        if (profile.firstName) setFirstName(profile.firstName);
        if (profile.lastName) setLastName(profile.lastName);
        if ((profile as any).dateOfBirth) {
          setDateOfBirth(formatISODateForDisplay((profile as any).dateOfBirth));
        }
        if ((profile as any).gender) setGender((profile as any).gender);
        if ((profile as any).height) setHeight(String((profile as any).height));
        if ((profile as any).weight) setWeight(String((profile as any).weight));
        if ((profile as any).activityLevel) setFitnessLevel((profile as any).activityLevel);
        
        // Load health goals (top-level healthGoals array)
        if ((profile as any).healthGoals && Array.isArray((profile as any).healthGoals)) {
          setSelectedGoals((profile as any).healthGoals);
        }
        
        // Load dietary preferences (top-level dietaryPreferences array)
        if ((profile as any).dietaryPreferences && Array.isArray((profile as any).dietaryPreferences)) {
          setDietaryPrefs((profile as any).dietaryPreferences);
        }
        
        // Load other saved preferences if available (legacy nested format)
        const prefs = (profile as any).healthPreferences;
        if (prefs) {
          if (prefs.goals && !selectedGoals.length) setSelectedGoals(prefs.goals);
          // Handle both old single value and new array format
          if (prefs.dietaryPrefs && !dietaryPrefs.length) {
            setDietaryPrefs(prefs.dietaryPrefs);
          } else if (prefs.dietaryPref && !dietaryPrefs.length) {
            // Migrate old single value to array
            setDietaryPrefs(prefs.dietaryPref === 'none' ? [] : [prefs.dietaryPref]);
          }
          if (prefs.allergies) setAllergies(prefs.allergies);
          if (prefs.fitnessLevel && !fitnessLevel) setFitnessLevel(prefs.fitnessLevel);
          if (prefs.preferredActivities) setPreferredActivities(prefs.preferredActivities);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const steps: SetupStep[] = ['basics', 'goals', 'preferences', 'fitness', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basics':
        return firstName.trim().length > 0;
      case 'goals':
        return selectedGoals.length > 0;
      case 'preferences':
        return true; // Optional
      case 'fitness':
        return fitnessLevel !== '';
      case 'complete':
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    } else if (isDashboardMode && onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleAllergy = (allergyId: string) => {
    setAllergies(prev => 
      prev.includes(allergyId) 
        ? prev.filter(a => a !== allergyId)
        : [...prev, allergyId]
    );
  };

  const toggleActivity = (activityId: string) => {
    setPreferredActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(a => a !== activityId)
        : [...prev, activityId]
    );
  };

  const handleComplete = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to save your profile');
      return;
    }

    setSaving(true);
    try {
      // Build profile data, omitting empty string values to prevent backend errors
      const profileData: Record<string, any> = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        // Only include optional fields if they have values (not empty strings)
        ...(dateOfBirth && { dateOfBirth }),
        ...(gender && { gender }),
        ...(height && { height: parseFloat(height) }),
        ...(weight && { weight: parseFloat(weight) }),
        healthPreferences: {
          goals: selectedGoals,
          ...(targetWeight && { targetWeight: parseFloat(targetWeight) }),
          ...(targetDate && { targetDate }),
          dietaryPrefs,
          allergies,
          ...(otherRestrictions && { otherRestrictions }),
          ...(fitnessLevel && { fitnessLevel }),
          preferredActivities,
          weeklyExerciseGoal: parseInt(weeklyExerciseGoal) || 3,
        },
        onboardingCompleted: true,
        profileSetupCompleted: true,
      };

      // Update local context
      await updateUser(profileData);

      // Save to backend
      await userService.updateUserProfile(user.id, profileData);

      // Navigate appropriately
      if (isOnboarding) {
        // On web, redirect to dashboard URL for clean navigation
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } else if (isDashboardMode && onBack) {
        onBack();
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderBasicsStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>About You</Text>
        
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={(text) => setDateOfBirth(formatDateInput(text))}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsRow}>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.optionChip,
                  gender === option.toLowerCase() && styles.optionChipSelected,
                ]}
                onPress={() => setGender(option.toLowerCase())}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === option.toLowerCase() && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>Physical Stats (Optional)</Text>
        <Text style={styles.sectionHint}>
          This helps us provide accurate nutrition recommendations
        </Text>
        
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Height (inches)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="68"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="150"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderGoalsStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>Select Your Goals</Text>
        <Text style={styles.sectionHint}>Choose all that apply</Text>
        
        <View style={styles.goalsGrid}>
          {healthGoals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <Pressable
                key={goal.id}
                style={[
                  styles.goalCard,
                  isSelected && { borderColor: goal.color, backgroundColor: `${goal.color}10` },
                ]}
                onPress={() => toggleGoal(goal.id)}
              >
                <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
                  <SvgIcon name={goal.icon} size={24} color={goal.color} />
                </View>
                <Text style={[styles.goalLabel, isSelected && { color: goal.color }]}>
                  {goal.label}
                </Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: goal.color }]}>
                    <SvgIcon name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedGoals.includes('weight_loss') || selectedGoals.includes('weight_gain') ? (
        <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
          <Text style={styles.sectionTitle}>Target Details</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Target Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={targetWeight}
                onChangeText={setTargetWeight}
                placeholder="140"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Target Date</Text>
              <TextInput
                style={styles.input}
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );

  const toggleDietaryPref = (prefId: string) => {
    if (prefId === 'none') {
      // "No Restrictions" clears all other selections
      setDietaryPrefs([]);
    } else {
      setDietaryPrefs(prev => {
        if (prev.includes(prefId)) {
          // Remove if already selected
          return prev.filter(p => p !== prefId);
        } else {
          // Add to selections
          return [...prev, prefId];
        }
      });
    }
  };

  const renderPreferencesStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>Dietary Preference</Text>
        
        <View style={styles.preferencesGrid}>
          {dietaryPreferences.map((pref) => {
            // "No Restrictions" is selected when array is empty
            const isSelected = pref.id === 'none' 
              ? dietaryPrefs.length === 0 
              : dietaryPrefs.includes(pref.id);
            return (
              <Pressable
                key={pref.id}
                style={[
                  styles.preferenceChip,
                  isSelected && styles.preferenceChipSelected,
                ]}
                onPress={() => toggleDietaryPref(pref.id)}
              >
                <SvgIcon 
                  name={pref.icon} 
                  size={18} 
                  color={isSelected ? '#fff' : theme.textSecondary} 
                />
                <Text style={[
                  styles.preferenceText,
                  isSelected && styles.preferenceTextSelected,
                ]}>
                  {pref.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>Food Allergies</Text>
        <Text style={styles.sectionHint}>Select any that apply</Text>
        
        <View style={styles.allergiesGrid}>
          {commonAllergies.map((allergy) => {
            const isSelected = allergies.includes(allergy.id);
            return (
              <Pressable
                key={allergy.id}
                style={[
                  styles.allergyChip,
                  isSelected && styles.allergyChipSelected,
                ]}
                onPress={() => toggleAllergy(allergy.id)}
              >
                <Text style={[
                  styles.allergyText,
                  isSelected && styles.allergyTextSelected,
                ]}>
                  {allergy.label}
                </Text>
                {isSelected && (
                  <SvgIcon name="close" size={14} color="#fff" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>Other Restrictions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={otherRestrictions}
          onChangeText={setOtherRestrictions}
          placeholder="Any other foods to avoid..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderFitnessStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>Current Fitness Level</Text>
        
        <View style={styles.fitnessOptions}>
          {fitnessLevels.map((level) => {
            const isSelected = fitnessLevel === level.id;
            return (
              <Pressable
                key={level.id}
                style={[
                  styles.fitnessCard,
                  isSelected && { borderColor: level.color, backgroundColor: `${level.color}10` },
                ]}
                onPress={() => setFitnessLevel(level.id)}
              >
                <View style={[styles.fitnessIcon, { backgroundColor: `${level.color}20` }]}>
                  <SvgIcon name={level.icon} size={28} color={level.color} />
                </View>
                <View style={styles.fitnessInfo}>
                  <Text style={[styles.fitnessLabel, isSelected && { color: level.color }]}>
                    {level.label}
                  </Text>
                  <Text style={styles.fitnessDesc}>{level.description}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.radioSelected, { borderColor: level.color }]}>
                    <View style={[styles.radioDot, { backgroundColor: level.color }]} />
                  </View>
                )}
                {!isSelected && <View style={styles.radioUnselected} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
        <Text style={styles.sectionTitle}>Preferred Activities</Text>
        <Text style={styles.sectionHint}>Select activities you enjoy</Text>
        
        <View style={styles.activitiesGrid}>
          {activityTypes.map((activity) => {
            const isSelected = preferredActivities.includes(activity.id);
            return (
              <Pressable
                key={activity.id}
                style={[
                  styles.activityChip,
                  isSelected && styles.activityChipSelected,
                ]}
                onPress={() => toggleActivity(activity.id)}
              >
                <SvgIcon 
                  name={activity.icon} 
                  size={18} 
                  color={isSelected ? '#fff' : theme.accent} 
                />
                <Text style={[
                  styles.activityText,
                  isSelected && styles.activityTextSelected,
                ]}>
                  {activity.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Exercise Goal</Text>
        <View style={styles.exerciseGoalRow}>
          {['1', '2', '3', '4', '5', '6', '7'].map((num) => (
            <Pressable
              key={num}
              style={[
                styles.exerciseButton,
                weeklyExerciseGoal === num && styles.exerciseButtonSelected,
              ]}
              onPress={() => setWeeklyExerciseGoal(num)}
            >
              <Text style={[
                styles.exerciseButtonText,
                weeklyExerciseGoal === num && styles.exerciseButtonTextSelected,
              ]}>
                {num}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.exerciseHint}>days per week</Text>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.completeContainer}>
        <View style={styles.successIcon}>
          <SvgIcon name="checkmark-circle" size={80} color={theme.success} />
        </View>
        
        <Text style={styles.completeTitle}>You're All Set! 🎉</Text>
        <Text style={styles.completeDescription}>
          Your personalized health profile is ready. We'll use this information to give you
          tailored nutrition insights and recommendations.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Profile Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Name</Text>
            <Text style={styles.summaryValue}>{firstName} {lastName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Goals</Text>
            <Text style={styles.summaryValue}>
              {selectedGoals.map(g => healthGoals.find(hg => hg.id === g)?.label).join(', ') || 'None set'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Diet</Text>
            <Text style={styles.summaryValue}>
              {dietaryPrefs.length === 0 
                ? 'No restrictions' 
                : dietaryPrefs.map(id => dietaryPreferences.find(p => p.id === id)?.label).filter(Boolean).join(', ')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fitness</Text>
            <Text style={styles.summaryValue}>
              {fitnessLevels.find(l => l.id === fitnessLevel)?.label || 'Not specified'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basics':
        return renderBasicsStep();
      case 'goals':
        return renderGoalsStep();
      case 'preferences':
        return renderPreferencesStep();
      case 'fitness':
        return renderFitnessStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeContext.colors.background }]}>
      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#14b8a6' }} />
        
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
          <Text style={styles.headerSubtitle}>{stepDescriptions[currentStep]}</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>Step {currentStepIndex + 1} of {steps.length}</Text>
          </View>
        </Animated.View>
      </Animated.View>
      
      {/* Scrollable Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
      >
        {/* Step content */}
        {renderCurrentStep()}
      </Animated.ScrollView>
      
      {/* Fixed Footer Navigation - Always Visible */}
      <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Progress indicator */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStepIndex + 1} of {steps.length}</Text>
        </View>
        
        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep !== 'basics' && (
            <Pressable 
              style={styles.backButton} 
              onPress={handleBack}
            >
              <SvgIcon name="arrow-back" size={20} color={theme.text} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
          
          {currentStep !== 'complete' && currentStep !== 'basics' && (
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
          )}
          
          {currentStep === 'complete' ? (
            <Pressable 
              style={[styles.primaryButton, saving && styles.buttonDisabled]} 
              onPress={handleComplete}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Start My Journey</Text>
                  <SvgIcon name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </Pressable>
          ) : (
            <Pressable 
              style={[styles.primaryButton, !canProceed() && styles.buttonDisabled]} 
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.primaryButtonText}>
                {currentStep === 'basics' ? 'Get Started' : 'Continue'}
              </Text>
              <SvgIcon name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  // Collapsible header styles - Teal theme
  collapsibleHeader: {
    backgroundColor: '#14b8a6',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  progressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingTop: dashboardTheme.spacing.lg,
  },
  stepContent: {
    // Content is now padded by scrollContent, so no padding here
  },
  section: {
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.lg,
    marginBottom: dashboardTheme.spacing.md,
    ...dashboardTheme.shadows.sm,
    borderWidth: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    outlineStyle: 'none' as any,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  optionChipSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  optionText: {
    fontSize: 14,
    color: theme.text,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Goals
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    position: 'relative',
  } as any,
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Preferences
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  preferenceChipSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  preferenceText: {
    fontSize: 14,
    color: theme.text,
  },
  preferenceTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  allergiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  allergyChipSelected: {
    backgroundColor: theme.error,
    borderColor: theme.error,
  },
  allergyText: {
    fontSize: 13,
    color: theme.text,
  },
  allergyTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // Fitness
  fitnessOptions: {
    gap: 12,
  },
  fitnessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.cardBorder,
    gap: 16,
  },
  fitnessIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitnessInfo: {
    flex: 1,
  },
  fitnessLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  fitnessDesc: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.cardBorder,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: `${theme.accent}10`,
    borderWidth: 1,
    borderColor: `${theme.accent}30`,
  },
  activityChipSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  activityText: {
    fontSize: 14,
    color: theme.accent,
  },
  activityTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  exerciseGoalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseButtonSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  exerciseButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  exerciseButtonTextSelected: {
    color: '#fff',
  },
  exerciseHint: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  // Complete
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  completeDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
    textAlign: 'right',
  },

  // Buttons
  fixedFooter: {
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
    paddingHorizontal: 16,
    paddingTop: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 8,
      },
    }),
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: theme.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#14b8a6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    minWidth: 70,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.cardBorder,
    backgroundColor: theme.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  skipButton: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.cardBorder,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#14b8a6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
