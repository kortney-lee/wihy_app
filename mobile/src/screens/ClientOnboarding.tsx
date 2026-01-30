import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { dashboardColors, Ionicons, BackToHubButton } from '../components/shared';
import SvgIcon from '../components/shared/SvgIcon';
import { dashboardTheme } from '../theme/dashboardTheme';
import { userService } from '../services/userService';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateInput } from '../utils/dateFormatter';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
const isWeb = Platform.OS === 'web';
const { width: screenWidth } = Dimensions.get('window');

interface ClientOnboardingProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

interface OnboardingData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;

  // Health Profile
  height: string;
  weight: string;
  activityLevel: string;
  medicalConditions: string[];
  allergies: string[];
  medications: string[];

  // Goals
  primaryGoal: string;
  targetWeight: string;
  timeframe: string;
  motivation: string;

  // Preferences
  dietaryPreferences: string[];
  cuisinePreferences: string[];
  mealFrequency: string;

  // Consent
  termsAccepted: boolean;
  privacyAccepted: boolean;
  communicationConsent: boolean;
}

export default function ClientOnboarding({
  isDashboardMode = false,
  onBack,
}: ClientOnboardingProps) {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useContext(AuthContext);
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 5;
  
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
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    medicalConditions: [],
    allergies: [],
    medications: [],
    primaryGoal: '',
    targetWeight: '',
    timeframe: '',
    motivation: '',
    dietaryPreferences: [],
    cuisinePreferences: [],
    mealFrequency: '',
    termsAccepted: false,
    privacyAccepted: false,
    communicationConsent: false,
  });

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    const currentArray = formData[field] as string[];
    if (currentArray.includes(item)) {
      updateField(
        field,
        currentArray.filter((i) => i !== item)
      );
    } else {
      updateField(field, [...currentArray, item]);
    }
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone
        );
      case 2:
        return !!(formData.height && formData.weight && formData.activityLevel);
      case 3:
        return !!(formData.primaryGoal && formData.timeframe);
      case 4:
        return formData.dietaryPreferences.length > 0;
      case 5:
        return formData.termsAccepted && formData.privacyAccepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      Alert.alert('Missing Information', 'Please complete all required fields');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    } else {
      Alert.alert('Go Back', 'Use the hamburger menu to navigate to another screen.');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Validate required consents
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      Alert.alert('Required', 'Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    
    // Get user ID from context
    const userId = user?.id;
    if (!userId) {
      Alert.alert('Error', 'User session not found. Please log in again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Build profile payload per API spec:
      // PATCH https://user.wihy.ai/api/profile (userId from JWT token)
      const profilePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        activityLevel: formData.activityLevel || undefined,
        // API expects goals as top-level array
        goals: formData.primaryGoal ? [formData.primaryGoal] : [],
        dietaryPreferences: formData.dietaryPreferences || [],
        allergies: formData.allergies || [],
        onboardingCompleted: true,
      };
      
      console.log('=== CLIENT ONBOARDING SUBMIT ===');
      console.log('User ID:', userId);
      console.log('Payload:', JSON.stringify(profilePayload, null, 2));
      
      // Call userService to update profile via PUT /api/profile/:userId
      const response = await userService.updateUserProfile(userId, profilePayload);
      
      if (response.success) {
        console.log('=== ONBOARDING SUCCESS ===');
        
        // Update user context with new profile data
        if (updateUser && response.data) {
          updateUser({
            ...user,
            name: `${formData.firstName} ${formData.lastName}`,
            onboardingCompleted: true,
          });
        }
        
        Alert.alert(
          'Onboarding Complete!',
          `Welcome ${formData.firstName}! Your profile has been created successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onBack) {
                  onBack();
                }
              },
            },
          ]
        );
      } else {
        console.error('=== ONBOARDING FAILED ===', response.error);
        Alert.alert(
          'Error',
          response.error || 'Failed to save profile. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('=== ONBOARDING ERROR ===', error);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index + 1 === currentStep && styles.stepDotActive,
            index + 1 < currentStep && styles.stepDotCompleted,
          ]}
        >
          {index + 1 < currentStep && (
            <Ionicons name="checkmark" size={12} color="#fff" />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Let's start with some basic information about you
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          value={formData.firstName}
          onChangeText={(value) => updateField('firstName', value)}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your last name"
          value={formData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChangeText={(value) => updateField('phone', value)}
          keyboardType="phone-pad"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          placeholder="MM/DD/YYYY"
          value={formData.dateOfBirth}
          onChangeText={(value) => updateField('dateOfBirth', formatDateInput(value))}
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.optionsRow}>
          {['Male', 'Female', 'Other', 'Prefer not to say'].map((gender) => (
            <Pressable
              key={gender}
              style={[
                styles.optionChip,
                formData.gender === gender && styles.optionChipSelected,
              ]}
              onPress={() => updateField('gender', gender)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.gender === gender && styles.optionTextSelected,
                ]}
              >
                {gender}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Health Profile</Text>
      <Text style={styles.stepDescription}>
        Tell us about your current health status
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Height (inches) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 68"
          value={formData.height}
          onChangeText={(value) => updateField('height', value)}
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Weight (lbs) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 150"
          value={formData.weight}
          onChangeText={(value) => updateField('weight', value)}
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Activity Level *</Text>
        <View style={styles.optionsColumn}>
          {[
            { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
            { value: 'light', label: 'Light (exercise 1-3 days/week)' },
            { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
            { value: 'active', label: 'Active (exercise 6-7 days/week)' },
            { value: 'very-active', label: 'Very Active (intense exercise daily)' },
          ].map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.radioOption,
                formData.activityLevel === option.value && styles.radioOptionSelected,
              ]}
              onPress={() => updateField('activityLevel', option.value)}
            >
              <View style={styles.radioCircle}>
                {formData.activityLevel === option.value && (
                  <View style={styles.radioCircleInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Medical Conditions</Text>
        <View style={styles.optionsWrap}>
          {['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'None'].map(
            (condition) => (
              <Pressable
                key={condition}
                style={[
                  styles.optionChip,
                  formData.medicalConditions.includes(condition) &&
                    styles.optionChipSelected,
                ]}
                onPress={() => toggleArrayItem('medicalConditions', condition)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.medicalConditions.includes(condition) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {condition}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Food Allergies</Text>
        <View style={styles.optionsWrap}>
          {['Dairy', 'Eggs', 'Nuts', 'Shellfish', 'Soy', 'Gluten', 'None'].map(
            (allergy) => (
              <Pressable
                key={allergy}
                style={[
                  styles.optionChip,
                  formData.allergies.includes(allergy) && styles.optionChipSelected,
                ]}
                onPress={() => toggleArrayItem('allergies', allergy)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.allergies.includes(allergy) && styles.optionTextSelected,
                  ]}
                >
                  {allergy}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Goals & Motivation</Text>
      <Text style={styles.stepDescription}>
        What would you like to achieve?
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Primary Goal *</Text>
        <View style={styles.optionsWrap}>
          {['Lose Weight', 'Gain Weight', 'Build Muscle', 'Improve Health', 'Maintain Weight'].map(
            (goal) => (
              <Pressable
                key={goal}
                style={[
                  styles.optionChip,
                  formData.primaryGoal === goal && styles.optionChipSelected,
                ]}
                onPress={() => updateField('primaryGoal', goal)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.primaryGoal === goal && styles.optionTextSelected,
                  ]}
                >
                  {goal}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      {formData.primaryGoal && formData.primaryGoal !== 'Maintain Weight' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 140"
            value={formData.targetWeight}
            onChangeText={(value) => updateField('targetWeight', value)}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Timeframe *</Text>
        <View style={styles.optionsWrap}>
          {['1 month', '3 months', '6 months', '1 year', 'No rush'].map(
            (timeframe) => (
              <Pressable
                key={timeframe}
                style={[
                  styles.optionChip,
                  formData.timeframe === timeframe && styles.optionChipSelected,
                ]}
                onPress={() => updateField('timeframe', timeframe)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.timeframe === timeframe && styles.optionTextSelected,
                  ]}
                >
                  {timeframe}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>What motivates you?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Share what drives you to achieve your goals..."
          value={formData.motivation}
          onChangeText={(value) => updateField('motivation', value)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#9ca3af"
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Dietary Preferences</Text>
      <Text style={styles.stepDescription}>
        Help us personalize your meal recommendations
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Dietary Preferences *</Text>
        <View style={styles.optionsWrap}>
          {['No Restrictions', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Halal', 'Kosher'].map(
            (pref) => (
              <Pressable
                key={pref}
                style={[
                  styles.optionChip,
                  formData.dietaryPreferences.includes(pref) &&
                    styles.optionChipSelected,
                ]}
                onPress={() => toggleArrayItem('dietaryPreferences', pref)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.dietaryPreferences.includes(pref) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {pref}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Favorite Cuisines</Text>
        <View style={styles.optionsWrap}>
          {['American', 'Asian', 'Italian', 'Mexican', 'Indian', 'Mediterranean'].map(
            (cuisine) => (
              <Pressable
                key={cuisine}
                style={[
                  styles.optionChip,
                  formData.cuisinePreferences.includes(cuisine) &&
                    styles.optionChipSelected,
                ]}
                onPress={() => toggleArrayItem('cuisinePreferences', cuisine)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.cuisinePreferences.includes(cuisine) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Preferred Meal Frequency</Text>
        <View style={styles.optionsWrap}>
          {['3 meals/day', '4-5 small meals', '2 meals + snacks', 'Intermittent fasting'].map(
            (freq) => (
              <Pressable
                key={freq}
                style={[
                  styles.optionChip,
                  formData.mealFrequency === freq && styles.optionChipSelected,
                ]}
                onPress={() => updateField('mealFrequency', freq)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.mealFrequency === freq && styles.optionTextSelected,
                  ]}
                >
                  {freq}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Terms & Consent</Text>
      <Text style={styles.stepDescription}>
        Please review and accept our terms
      </Text>

      <View style={styles.consentCard}>
        <View style={styles.consentItem}>
          <Switch
            value={formData.termsAccepted}
            onValueChange={(value) => updateField('termsAccepted', value)}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#fff"
          />
          <Text style={styles.consentText}>
            I accept the <Text style={styles.link}>Terms of Service</Text> *
          </Text>
        </View>

        <View style={styles.consentItem}>
          <Switch
            value={formData.privacyAccepted}
            onValueChange={(value) => updateField('privacyAccepted', value)}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#fff"
          />
          <Text style={styles.consentText}>
            I accept the <Text style={styles.link}>Privacy Policy</Text> *
          </Text>
        </View>

        <View style={styles.consentItem}>
          <Switch
            value={formData.communicationConsent}
            onValueChange={(value) => updateField('communicationConsent', value)}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#fff"
          />
          <Text style={styles.consentText}>
            I agree to receive email and SMS communications
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Profile Summary</Text>
        <View style={styles.summaryRow}>
          <Ionicons name="person" size={20} color="#6b7280" />
          <Text style={styles.summaryText}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="mail" size={20} color="#6b7280" />
          <Text style={styles.summaryText}>{formData.email}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="fitness" size={20} color="#6b7280" />
          <Text style={styles.summaryText}>
            {formData.height}" • {formData.weight} lbs
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="flag" size={20} color="#6b7280" />
          <Text style={styles.summaryText}>{formData.primaryGoal}</Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Back to Coach Hub button - positioned in top right */}
      {isDashboardMode && onBack && (
        <BackToHubButton
          hubName="Coach Hub"
          color="#10b981"
          onPress={onBack}
          isMobileWeb={isWeb && screenWidth < 768}
          spinnerGif={spinnerGif}
        />
      )}
      
      {/* Web-only close button when not in dashboard mode */}
      {isWeb && !isDashboardMode && (
        <TouchableOpacity
          style={styles.webCloseButton}
          onPress={() => navigation.goBack()}
        >
          <SvgIcon name="close" size={24} color="#10b981" />
        </TouchableOpacity>
      )}

      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#10b981' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.headerTitle}>Client Onboarding</Text>
            <Text style={styles.headerSubtitle}>Welcome to your health journey</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Step</Text>
              <Text style={styles.statsValue}>{currentStep} / {totalSteps}</Text>
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {renderStepIndicator()}

          <View style={styles.content}>
            {renderCurrentStep()}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleBack}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonSecondaryText}>Back</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button, 
                styles.buttonPrimary, 
                (!validateStep() || isSubmitting) && styles.buttonDisabled
              ]}
              onPress={handleNext}
              disabled={!validateStep() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonPrimaryText}>
                  {currentStep === totalSteps ? 'Complete' : 'Next'}
                </Text>
              )}
            </Pressable>
          </View>
          
          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  webCloseButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collapsibleHeader: {
    backgroundColor: '#10b981',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  stepCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: '#fff',
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
    backgroundColor: '#3b82f6',
  },
  stepDotCompleted: {
    backgroundColor: '#10b981',
  },
  content: {
    padding: 16,
  },
  contentContainer: {
    padding: 16,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  stepDescription: {
    fontSize: 16,
    // color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.text,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  textArea: {
    minHeight: 100,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsColumn: {
    gap: 12,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionChipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    // color: theme.colors.textSecondary,
  },
  optionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  radioOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  radioLabel: {
    fontSize: 14,
    // color: theme.colors.text,
    flex: 1,
  },
  consentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consentText: {
    fontSize: 14,
    // color: theme.colors.text,
    flex: 1,
  },
  link: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontSize: 14,
    // color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    // color: theme.colors.text,
  },
});
