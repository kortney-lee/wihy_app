import React, { useState, useContext, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { userService } from '../services/userService';
import { WebNavHeader } from '../components/web/WebNavHeader';
import { GradientDashboardHeader } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
import SvgIcon from '../components/shared/SvgIcon';

const isWeb = Platform.OS === 'web';
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

export default function ProfileSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, updateUser } = useContext(AuthContext);
  const isOnboarding = route.params?.isOnboarding ?? false;
  
  const [currentStep, setCurrentStep] = useState<SetupStep>('basics');
  const [saving, setSaving] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
  const [dietaryPref, setDietaryPref] = useState('none');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherRestrictions, setOtherRestrictions] = useState('');

  // Fitness
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [preferredActivities, setPreferredActivities] = useState<string[]>([]);
  const [weeklyExerciseGoal, setWeeklyExerciseGoal] = useState('3');

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
        if (profile.firstName) setFirstName(profile.firstName);
        if (profile.lastName) setLastName(profile.lastName);
        // Load other saved preferences if available
        const prefs = (profile as any).healthPreferences;
        if (prefs) {
          if (prefs.goals) setSelectedGoals(prefs.goals);
          if (prefs.dietaryPref) setDietaryPref(prefs.dietaryPref);
          if (prefs.allergies) setAllergies(prefs.allergies);
          if (prefs.fitnessLevel) setFitnessLevel(prefs.fitnessLevel);
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
      const profileData = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        dateOfBirth,
        gender,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        healthPreferences: {
          goals: selectedGoals,
          targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
          targetDate,
          dietaryPref,
          allergies,
          otherRestrictions,
          fitnessLevel,
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
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
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
      <View style={styles.section}>
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
            onChangeText={setDateOfBirth}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={theme.textSecondary}
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

      <View style={styles.section}>
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
      <View style={styles.section}>
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
        <View style={styles.section}>
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

  const renderPreferencesStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Preference</Text>
        
        <View style={styles.preferencesGrid}>
          {dietaryPreferences.map((pref) => {
            const isSelected = dietaryPref === pref.id;
            return (
              <Pressable
                key={pref.id}
                style={[
                  styles.preferenceChip,
                  isSelected && styles.preferenceChipSelected,
                ]}
                onPress={() => setDietaryPref(pref.id)}
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

      <View style={styles.section}>
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

      <View style={styles.section}>
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
      <View style={styles.section}>
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

      <View style={styles.section}>
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
              {dietaryPreferences.find(p => p.id === dietaryPref)?.label || 'No restrictions'}
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

  const content = (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with back button for web */}
      {isWeb && (
        <View style={styles.webHeader}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <SvgIcon name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.webPageTitle}>{stepTitles[currentStep]}</Text>
        </View>
      )}

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStepIndex + 1} of {steps.length}</Text>
      </View>

      {/* Step header */}
      {!isWeb && (
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{stepTitles[currentStep]}</Text>
          <Text style={styles.stepDescription}>{stepDescriptions[currentStep]}</Text>
        </View>
      )}
      
      {isWeb && (
        <Text style={styles.webStepDescription}>{stepDescriptions[currentStep]}</Text>
      )}

      {/* Step content */}
      {renderCurrentStep()}

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
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
            <Text style={styles.primaryButtonText}>Continue</Text>
            <SvgIcon name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
    </ScrollView>
  );

  // Mobile header
  const mobileHeader = (
    <View style={styles.mobileHeader}>
      <Pressable style={styles.backButton} onPress={handleBack}>
        <SvgIcon name="arrow-back" size={24} color={theme.text} />
      </Pressable>
      <Text style={styles.mobileHeaderTitle}>{stepTitles[currentStep]}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (isWeb) {
    return (
      <View style={[styles.container, { minHeight: '100vh' } as any]}>
        <WebNavHeader 
          activePage="profile" 
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
        />
        <View style={[styles.webContent, { height: 'calc(100vh - 70px)', overflow: 'auto' } as any]}>
          {content}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* White top box for status bar - Pattern B */}
      <SafeAreaView edges={['top']} style={styles.topBox}>
        <View style={styles.topBoxContent} />
      </SafeAreaView>
      
      {/* Main content area */}
      <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Gradient Header */}
            <LinearGradient
              colors={['#14b8a6', '#0d9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientHeader}
            >
              <View style={styles.headerRow}>
                <Pressable style={styles.backButtonWhite} onPress={handleBack}>
                  <SvgIcon name="arrow-back" size={24} color="#ffffff" />
                </Pressable>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
                  <Text style={styles.headerSubtitle}>{stepDescriptions[currentStep]}</Text>
                </View>
              </View>
              
              {/* Progress bar in header */}
              <View style={styles.headerProgressContainer}>
                <View style={styles.headerProgressBar}>
                  <View style={[styles.headerProgressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.headerProgressText}>Step {currentStepIndex + 1} of {steps.length}</Text>
              </View>
            </LinearGradient>

            {/* Step content */}
            {renderCurrentStep()}

            {/* Navigation buttons */}
            <View style={styles.buttonContainer}>
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
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <SvgIcon name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              )}
            </View>
            
            {/* Bottom spacing for tab bar */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as any,
  // Pattern B - Dual SafeAreaView styles
  topBox: {
    backgroundColor: '#ffffff',
  },
  topBoxContent: {
    height: 0,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  // Gradient header styles
  gradientHeader: {
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingTop: dashboardTheme.spacing.xl,
    paddingBottom: dashboardTheme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButtonWhite: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  headerProgressContainer: {
    marginTop: 16,
  },
  headerProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  headerProgressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  webContent: {
    flex: 1,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  } as any,
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  webPageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  stepHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  webStepDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  stepContent: {
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
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
    width: isWeb ? 'calc(25% - 12px)' : '47%',
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  skipButton: {
    flex: 1,
    height: 52,
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
    flex: 2,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.accent,
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
