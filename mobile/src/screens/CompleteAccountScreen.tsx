/**
 * CompleteAccountScreen
 * 
 * Comprehensive account creation page shown after payment
 * Combines authentication setup AND profile information in one flow
 * 
 * Sections:
 * 1. Authentication Method (Email/Password or OAuth)
 * 2. Basic Profile Info (Name, Phone, Date of Birth)
 * 3. Health Profile (Height, Weight, Goals, Dietary Preferences)
 * 
 * Flow:
 * 1. User completes payment → redirected here
 * 2. Choose auth method (email/password or OAuth)
 * 3. Fill in profile information
 * 4. Submit → account created with full profile
 * 5. Redirect to dashboard (skip ProfileSetup)
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { appleAuthService } from '../services/appleAuthService';
import { API_CONFIG } from '../services/config';
import { fetchWithLogging } from '../utils/apiLogger';
import SvgIcon from '../components/shared/SvgIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CompleteAccountParams {
  email: string;
  name?: string;
  plan: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

type Step = 'auth' | 'profile';

export default function CompleteAccountScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { refreshUserContext } = useContext(AuthContext);
  const { theme } = useTheme();

  const params: CompleteAccountParams = route.params || {};
  const { email: prefilledEmail, name: prefilledName, plan, stripeCustomerId, stripeSubscriptionId } = params;

  // Current step
  const [step, setStep] = useState<Step>('auth');

  // Auth state
  const [authMethod, setAuthMethod] = useState<'email' | 'oauth' | null>(null);
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState(prefilledName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(prefilledName?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  
  // Health profile
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'>('moderate');
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleAuthContinue = () => {
    setError('');

    if (authMethod === 'email') {
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
      if (!validatePassword()) {
        return;
      }
    }

    // Move to profile step
    setStep('profile');
  };

  const handleOAuthSignup = async (provider: 'google' | 'apple' | 'facebook' | 'microsoft') => {
    setError('');
    setLoading(true);
    setAuthMethod('oauth');

    try {
      const paymentInfo = {
        stripeCustomerId,
        stripeSubscriptionId,
        plan,
        email: prefilledEmail,
        name: prefilledName,
      };
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        sessionStorage.setItem('wihy_oauth_payment_info', JSON.stringify(paymentInfo));
        const { url } = await authService.getWebOAuthUrl(provider);
        window.location.href = url;
        return;
      }
      
      await AsyncStorage.setItem('@wihy_pending_payment_info', JSON.stringify(paymentInfo));
      
      let oauthResult;
      if (provider === 'apple') {
        oauthResult = await appleAuthService.signInWithApple();
      } else {
        oauthResult = await enhancedAuthService.authenticateWithOAuth(provider);
      }
      
      if (!oauthResult.success || !oauthResult.user) {
        throw new Error(oauthResult.error || 'OAuth failed');
      }

      // Set profile data from OAuth
      setEmail(oauthResult.user.email);
      setFirstName(oauthResult.user.name?.split(' ')[0] || '');
      setLastName(oauthResult.user.name?.split(' ').slice(1).join(' ') || '');
      
      // Move to profile step
      setStep('profile');
    } catch (err: any) {
      setError(err.message || 'OAuth failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    setLoading(true);

    try {
      // Calculate height in cm if provided
      let heightCm: number | undefined;
      if (heightFt && heightIn) {
        const totalInches = parseInt(heightFt) * 12 + parseInt(heightIn);
        heightCm = Math.round(totalInches * 2.54);
      }

      // Convert weight to kg if needed
      let weightKg: number | undefined;
      if (weight) {
        weightKg = weightUnit === 'lbs' 
          ? Math.round(parseFloat(weight) * 0.453592) 
          : parseFloat(weight);
      }

      // Create account with full profile
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/auth/register-with-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            // Auth
            email: email.trim(),
            password: authMethod === 'email' ? password : undefined,
            provider: authMethod === 'email' ? 'local' : authMethod,
            
            // Basic profile
            name: `${firstName} ${lastName}`.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || undefined,
            dateOfBirth: dateOfBirth || undefined,
            gender: gender || undefined,
            
            // Health profile
            heightCm,
            weightKg,
            activityLevel,
            healthGoals: healthGoals.length > 0 ? healthGoals : undefined,
            dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
            allergies: allergies.length > 0 ? allergies : undefined,
            
            // Payment
            stripeCustomerId,
            stripeSubscriptionId,
            plan,
            
            // Mark onboarding as complete
            onboardingCompleted: true,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Store tokens
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.setItem('authToken', data.data.sessionToken);
          localStorage.setItem('accessToken', data.data.sessionToken);
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
        } else {
          await authService.storeSessionToken(data.data.sessionToken);
        }

        // Refresh user context
        await refreshUserContext();

        // Redirect to dashboard (skip ProfileSetup)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        }
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const toggleHealthGoal = (goal: string) => {
    setHealthGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleDietaryPref = (pref: string) => {
    setDietaryPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const renderAuthStep = () => (
    <>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Choose Authentication Method
      </Text>

      {/* OAuth Buttons */}
      <View style={styles.oauthButtons}>
        <Pressable
          style={styles.oauthButton}
          onPress={() => handleOAuthSignup('google')}
          disabled={loading}
        >
          <SvgIcon name="logo-google" size={24} color="#4285F4" />
          <Text style={styles.oauthButtonText}>Continue with Google</Text>
        </Pressable>

        {Platform.OS === 'ios' && (
          <Pressable
            style={styles.oauthButton}
            onPress={() => handleOAuthSignup('apple')}
            disabled={loading}
          >
            <SvgIcon name="logo-apple" size={24} color="#000000" />
            <Text style={styles.oauthButtonText}>Continue with Apple</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.oauthButton}
          onPress={() => handleOAuthSignup('facebook')}
          disabled={loading}
        >
          <SvgIcon name="logo-facebook" size={24} color="#1877F2" />
          <Text style={styles.oauthButtonText}>Continue with Facebook</Text>
        </Pressable>

        <Pressable
          style={styles.oauthButton}
          onPress={() => handleOAuthSignup('microsoft')}
          disabled={loading}
        >
          <SvgIcon name="logo-microsoft" size={24} color="#00A4EF" />
          <Text style={styles.oauthButtonText}>Continue with Microsoft</Text>
        </Pressable>
      </View>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* Email/Password Form */}
      <Pressable
        style={[styles.authMethodButton, authMethod === 'email' && styles.authMethodButtonActive]}
        onPress={() => setAuthMethod('email')}
      >
        <SvgIcon name="mail" size={24} color={authMethod === 'email' ? '#3b82f6' : '#6b7280'} />
        <Text style={[styles.authMethodText, authMethod === 'email' && styles.authMethodTextActive]}>
          Continue with Email
        </Text>
      </Pressable>

      {authMethod === 'email' && (
        <View style={styles.emailForm}>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!prefilledEmail}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, flex: 1 }]}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={styles.showPasswordButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <SvgIcon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
            </Pressable>
          </View>

          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Confirm Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          <Pressable
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleAuthContinue}
            disabled={loading}
          >
            <Text style={styles.continueButtonText}>Continue to Profile</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  const renderProfileStep = () => (
    <>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Complete Your Profile
      </Text>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Basic Information</Text>
        
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="First Name *"
          placeholderTextColor={theme.colors.textSecondary}
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Last Name"
          placeholderTextColor={theme.colors.textSecondary}
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Phone (optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Date of Birth (MM/DD/YYYY)"
          placeholderTextColor={theme.colors.textSecondary}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />

        <View style={styles.genderButtons}>
          {(['male', 'female', 'other'] as const).map(g => (
            <Pressable
              key={g}
              style={[styles.genderButton, gender === g && styles.genderButtonActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderButtonText, gender === g && styles.genderButtonTextActive]}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Health Profile */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Health Profile (Optional)</Text>
        
        <View style={styles.heightRow}>
          <TextInput
            style={[styles.heightInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Ft"
            placeholderTextColor={theme.colors.textSecondary}
            value={heightFt}
            onChangeText={setHeightFt}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.heightInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="In"
            placeholderTextColor={theme.colors.textSecondary}
            value={heightIn}
            onChangeText={setHeightIn}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.weightRow}>
          <TextInput
            style={[styles.weightInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Weight"
            placeholderTextColor={theme.colors.textSecondary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <View style={styles.weightUnitButtons}>
            <Pressable
              style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
              onPress={() => setWeightUnit('lbs')}
            >
              <Text style={[styles.unitButtonText, weightUnit === 'lbs' && styles.unitButtonTextActive]}>lbs</Text>
            </Pressable>
            <Pressable
              style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
              onPress={() => setWeightUnit('kg')}
            >
              <Text style={[styles.unitButtonText, weightUnit === 'kg' && styles.unitButtonTextActive]}>kg</Text>
            </Pressable>
          </View>
        </View>

        {/* Health Goals */}
        <Text style={[styles.subLabel, { color: theme.colors.text }]}>Health Goals</Text>
        <View style={styles.chipContainer}>
          {['Weight Loss', 'Muscle Gain', 'General Health', 'Energy', 'Better Sleep'].map(goal => (
            <Pressable
              key={goal}
              style={[styles.chip, healthGoals.includes(goal) && styles.chipActive]}
              onPress={() => toggleHealthGoal(goal)}
            >
              <Text style={[styles.chipText, healthGoals.includes(goal) && styles.chipTextActive]}>{goal}</Text>
            </Pressable>
          ))}
        </View>

        {/* Dietary Preferences */}
        <Text style={[styles.subLabel, { color: theme.colors.text }]}>Dietary Preferences</Text>
        <View style={styles.chipContainer}>
          {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo'].map(pref => (
            <Pressable
              key={pref}
              style={[styles.chip, dietaryPreferences.includes(pref) && styles.chipActive]}
              onPress={() => toggleDietaryPref(pref)}
            >
              <Text style={[styles.chipText, dietaryPreferences.includes(pref) && styles.chipTextActive]}>{pref}</Text>
            </Pressable>
          ))}
        </View>

        {/* Allergies */}
        <Text style={[styles.subLabel, { color: theme.colors.text }]}>Allergies</Text>
        <View style={styles.chipContainer}>
          {['Nuts', 'Dairy', 'Eggs', 'Soy', 'Shellfish', 'Wheat'].map(allergy => (
            <Pressable
              key={allergy}
              style={[styles.chip, allergies.includes(allergy) && styles.chipActive]}
              onPress={() => toggleAllergy(allergy)}
            >
              <Text style={[styles.chipText, allergies.includes(allergy) && styles.chipTextActive]}>{allergy}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Account & Get Started</Text>
        )}
      </Pressable>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.successBadge}>
              <SvgIcon name="checkmark-circle" size={48} color="#22c55e" />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Payment Successful! 🎉
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {step === 'auth' ? 'Set up your authentication' : 'Complete your profile to get started'}
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <SvgIcon name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, step === 'auth' && styles.progressStepActive]}>
              <Text style={[styles.progressStepText, step === 'auth' && styles.progressStepTextActive]}>1</Text>
            </View>
            <View style={[styles.progressLine, step === 'profile' && styles.progressLineActive]} />
            <View style={[styles.progressStep, step === 'profile' && styles.progressStepActive]}>
              <Text style={[styles.progressStepText, step === 'profile' && styles.progressStepTextActive]}>2</Text>
            </View>
          </View>

          {/* Content */}
          {step === 'auth' ? renderAuthStep() : renderProfileStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successBadge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#3b82f6',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressStepTextActive: {
    color: '#ffffff',
  },
  progressLine: {
    width: 80,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#3b82f6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  oauthButtons: {
    gap: 12,
    marginBottom: 20,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  authMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
    marginBottom: 16,
  },
  authMethodButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  authMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  authMethodTextActive: {
    color: '#3b82f6',
  },
  emailForm: {
    gap: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 14,
    padding: 8,
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  genderButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  genderButtonTextActive: {
    color: '#3b82f6',
  },
  heightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heightInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  weightRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  weightUnitButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  unitButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    minWidth: 60,
    alignItems: 'center',
  },
  unitButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  unitButtonTextActive: {
    color: '#3b82f6',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  chipActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
