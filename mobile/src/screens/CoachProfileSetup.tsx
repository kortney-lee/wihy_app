import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { coachService } from '../services';
import { useAuth } from '../context/AuthContext';

const isWeb = Platform.OS === 'web';

interface CoachProfileData {
  // Step 1: Basic Information
  name: string;
  title: string;
  specialty: string;
  
  // Step 2: Background
  bio: string;
  yearsExperience: string;
  credentials: string;
  avatarUrl: string;
  
  // Step 3: Pricing & Location
  city: string;
  state: string;
  country: string;
  sessionRate: string;
  currency: string;
  availableDays: string[];
  availableHoursStart: string;
  availableHoursEnd: string;
}

const SPECIALTIES = [
  'Nutrition',
  'Fitness',
  'Wellness',
  'Mental Health',
  'Business',
  'Life Coaching',
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

interface CoachProfileSetupProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

export default function CoachProfileSetup({
  isDashboardMode = false,
  onBack,
}: CoachProfileSetupProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 3;
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
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
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const [formData, setFormData] = useState<CoachProfileData>({
    name: '',
    title: '',
    specialty: '',
    bio: '',
    yearsExperience: '',
    credentials: '',
    avatarUrl: '',
    city: '',
    state: '',
    country: 'USA',
    sessionRate: '',
    currency: 'USD',
    availableDays: [],
    availableHoursStart: '09:00',
    availableHoursEnd: '17:00',
  });

  const updateField = (field: keyof CoachProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.name && formData.title && formData.specialty);
      case 2:
        return !!(formData.bio && formData.yearsExperience);
      case 3:
        return !!(formData.city && formData.state && formData.sessionRate && formData.availableDays.length > 0);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (isDashboardMode && onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse certifications from credentials string
      const certifications = formData.credentials
        ? formData.credentials.split(',').map(cert => ({
            name: cert.trim(),
            abbreviation: cert.trim(),
          }))
        : [];

      // Call API to create coach profile
      // POST /api/coaches/profile
      const result = await coachService.createCoachProfile({
        name: formData.name,
        email: user?.email,
        title: formData.title,
        bio: formData.bio,
        specialties: [formData.specialty],
        certifications,
        years_experience: parseInt(formData.yearsExperience, 10) || 0,
        location: {
          city: formData.city,
          state: formData.state,
          country: formData.country,
          timezone: 'America/New_York', // TODO: Detect from device
        },
        pricing: {
          session_rate: parseFloat(formData.sessionRate) || 0,
          currency: formData.currency,
          session_duration_minutes: 60,
        },
        availability: {
          accepting_clients: true,
          available_days: formData.availableDays,
          available_hours: {
            start: formData.availableHoursStart,
            end: formData.availableHoursEnd,
          },
        },
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create profile');
      }

      // Show success and navigate back to Coach Hub
      Alert.alert(
        'Profile Created!',
        'Your coach profile has been created and is pending verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (isDashboardMode && onBack) {
                onBack();
              } else {
                navigation.navigate('CoachDashboardPage');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('CoachProfileSetup: Error creating profile:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create coach profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            step < currentStep && styles.stepDotCompleted,
            step === currentStep && styles.stepDotActive,
          ]}
        >
          {step < currentStep ? (
            <Ionicons name="checkmark" size={16} color="#fff" />
          ) : (
            <Text style={styles.stepNumber}>{step}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>Tell us about yourself</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Coach Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#9ca3af"
          value={formData.name}
          onChangeText={(value) => updateField('name', value)}
        />
        <Text style={styles.helpText}>Public name shown to clients</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Professional Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Registered Dietitian, Fitness Coach"
          placeholderTextColor="#9ca3af"
          value={formData.title}
          onChangeText={(value) => updateField('title', value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Specialty (Primary focus) *</Text>
        <View style={styles.optionsWrap}>
          {SPECIALTIES.map((specialty) => (
            <Pressable
              key={specialty}
              style={[
                styles.optionChip,
                formData.specialty === specialty && styles.optionChipSelected,
              ]}
              onPress={() => updateField('specialty', specialty)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.specialty === specialty && styles.optionTextSelected,
                ]}
              >
                {specialty}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Background</Text>
      <Text style={styles.stepDescription}>Share your experience and credentials</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Bio / About You *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell clients about your experience and approach..."
          placeholderTextColor="#9ca3af"
          value={formData.bio}
          onChangeText={(value) => updateField('bio', value)}
          multiline
          numberOfLines={6}
          maxLength={500}
        />
        <Text style={styles.helpText}>{formData.bio.length}/500 characters</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 10"
          placeholderTextColor="#9ca3af"
          value={formData.yearsExperience}
          onChangeText={(value) => updateField('yearsExperience', value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Credentials / Certifications</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., RD, CDE, PhD (comma-separated)"
          placeholderTextColor="#9ca3af"
          value={formData.credentials}
          onChangeText={(value) => updateField('credentials', value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Avatar / Profile Photo</Text>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="camera" size={32} color="#6b7280" />
          <Text style={styles.avatarText}>Upload Photo</Text>
          <Text style={styles.helpText}>or use Gravatar</Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Availability & Pricing</Text>
      <Text style={styles.stepDescription}>Set your rates and schedule</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location *</Text>
        <View style={styles.locationRow}>
          <TextInput
            style={[styles.input, styles.locationInput]}
            placeholder="City"
            placeholderTextColor="#9ca3af"
            value={formData.city}
            onChangeText={(value) => updateField('city', value)}
          />
          <TextInput
            style={[styles.input, styles.locationInput]}
            placeholder="State"
            placeholderTextColor="#9ca3af"
            value={formData.state}
            onChangeText={(value) => updateField('state', value)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Country"
          placeholderTextColor="#9ca3af"
          value={formData.country}
          onChangeText={(value) => updateField('country', value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Session Rate (per hour) *</Text>
        <View style={styles.priceRow}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="75"
            placeholderTextColor="#9ca3af"
            value={formData.sessionRate}
            onChangeText={(value) => updateField('sessionRate', value)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Available Days *</Text>
        <View style={styles.daysRow}>
          {DAYS_OF_WEEK.map((day) => (
            <Pressable
              key={day.key}
              style={[
                styles.dayChip,
                formData.availableDays.includes(day.key) && styles.dayChipSelected,
              ]}
              onPress={() => toggleDay(day.key)}
            >
              <Text
                style={[
                  styles.dayText,
                  formData.availableDays.includes(day.key) && styles.dayTextSelected,
                ]}
              >
                {day.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Available Hours</Text>
        <View style={styles.hoursRow}>
          <View style={styles.hourPicker}>
            <Text style={styles.hourLabel}>From:</Text>
            <TextInput
              style={styles.hourInput}
              placeholder="09:00"
              placeholderTextColor="#9ca3af"
              value={formData.availableHoursStart}
              onChangeText={(value) => updateField('availableHoursStart', value)}
            />
          </View>
          <View style={styles.hourPicker}>
            <Text style={styles.hourLabel}>To:</Text>
            <TextInput
              style={styles.hourInput}
              placeholder="17:00"
              placeholderTextColor="#9ca3af"
              value={formData.availableHoursEnd}
              onChangeText={(value) => updateField('availableHoursEnd', value)}
            />
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Your profile will be reviewed by our team before appearing in coach search
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Status bar area */}
      <View style={{ height: insets.top, backgroundColor: '#10b981' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <Animated.Text style={[styles.headerTitle, { transform: [{ scale: titleScale }] }]}>
            Complete Your Profile
          </Animated.Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep} of {totalSteps}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
          </View>
        </Animated.View>
      </Animated.View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleBack}
        >
          <Text style={styles.buttonSecondaryText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.button,
            styles.buttonPrimary,
            !validateStep() && styles.buttonDisabled,
          ]}
          onPress={currentStep === totalSteps ? handleSubmit : handleNext}
          disabled={!validateStep()}
        >
          <Text style={styles.buttonPrimaryText}>
            {currentStep === totalSteps ? 'Create Profile' : 'Next'}
          </Text>
          {currentStep < totalSteps && (
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  collapsibleHeader: {
    backgroundColor: '#10b981',
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
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
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
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  stepContent: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: -12,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  avatarPlaceholder: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInput: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  priceInput: {
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 50,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  dayTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 16,
  },
  hourPicker: {
    flex: 1,
  },
  hourLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  hourInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
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
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
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
    color: '#374151',
  },
});
