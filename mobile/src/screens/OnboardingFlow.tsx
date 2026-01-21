import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { colors, sizes } from '../theme/design-tokens';

type NavigationProp = StackNavigationProp<any, 'OnboardingFlow'>;

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  tips?: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Tell us about your health goals, dietary preferences, and fitness level so we can personalize your experience.',
    icon: 'person-add',
    action: 'Profile Setup',
    tips: [
      'Set realistic health goals',
      'List any dietary restrictions',
      'Share your current fitness level'
    ]
  },
  {
    id: 'firstScan',
    title: 'Take Your First Scan',
    description: 'Point your camera at a food barcode or package. Our AI instantly recognizes it and breaks down nutrition.',
    icon: 'scan',
    action: 'Scan Food',
    tips: [
      'Good lighting helps accuracy',
      'Scan barcodes on packaged items',
      'Take photos for unpackaged foods'
    ]
  },
  {
    id: 'logMeal',
    title: 'Log Your First Meal',
    description: 'Track a complete meal and see how it fits into your daily nutrition goals. Build awareness of what you\'re eating.',
    icon: 'restaurant',
    action: 'Create Meal',
    tips: [
      'Include snacks and drinks',
      'Track meals you actually eat',
      'See instant nutritional breakdown'
    ]
  },
  {
    id: 'setGoals',
    title: 'Set Your First Goal',
    description: 'Choose a health or fitness goal. Whether it\'s weight loss, muscle gain, or better eating habits—we\'ll guide you.',
    icon: 'target',
    action: 'Create Goal',
    tips: [
      'Start with 1-2 main goals',
      'Make them specific and measurable',
      'Revisit every 4 weeks'
    ]
  },
  {
    id: 'connectCoach',
    title: 'Connect with a Coach',
    description: 'Get personalized guidance from certified coaches. Share your progress and receive actionable feedback.',
    icon: 'people',
    action: 'Find Coach',
    tips: [
      'Browse coach profiles',
      'Check their specialties',
      'Start with a free consultation'
    ]
  },
];

const OnboardingFlow: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateUser } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleCompleteOnboarding = async () => {
    // Mark onboarding as completed in user context
    if (user) {
      try {
        await updateUser({ 
          onboardingCompleted: true,
          isFirstTimeUser: false 
        });
      } catch (error) {
        console.error('Failed to update user:', error);
      }
    }
    // Navigate to home
    navigation.navigate('Main');
  };

  const handleStepComplete = (stepId: string, nextScreen?: string) => {
    const newCompleted = [...completedSteps, stepId];
    setCompletedSteps(newCompleted);

    if (nextScreen) {
      navigation.navigate(nextScreen);
    }

    // Move to next step after delay
    setTimeout(() => {
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All steps completed
        handleCompleteOnboarding();
      }
    }, 300);
  };

  const handleSkipToApp = () => {
    handleCompleteOnboarding();
  };

  const handleContinueStep = (stepId: string) => {
    const step = onboardingSteps.find(s => s.id === stepId);
    
    // Navigate to appropriate screen based on step
    const screenMap: { [key: string]: string } = {
      'profile': 'ProfileSetup',
      'firstScan': 'Scan',
      'logMeal': 'CreateMeals',
      'setGoals': 'Home', // Goals typically accessed from dashboard
      'connectCoach': 'CoachSelection',
    };

    const nextScreen = screenMap[stepId];
    if (nextScreen) {
      handleStepComplete(stepId, nextScreen);
    }
  };

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkipToApp}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Getting Started</Text>
        <Text style={styles.stepCounter}>{currentStep + 1}/{onboardingSteps.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={step.icon as any}
              size={56}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Step Title */}
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>

        {/* Tips */}
        {step.tips && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Pro Tips:</Text>
            {step.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Motivational Message */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            {currentStep === 0 && '🚀 Let\'s set up your account to get personalized recommendations!'}
            {currentStep === 1 && '📸 Scanning makes tracking effortless. You\'ll see patterns in days!'}
            {currentStep === 2 && '🍽️ One meal logged = one step closer to your goals.'}
            {currentStep === 3 && '🎯 Goals give you direction. Pick what matters most to you.'}
            {currentStep === 4 && '👥 Coaches provide accountability. Many users hit goals with support!'}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSkipToApp}
        >
          <Text style={styles.secondaryButtonText}>
            {currentStep === onboardingSteps.length - 1 ? 'Finish' : 'Skip This'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleContinueStep(step.id)}
        >
          <Text style={styles.primaryButtonText}>{step.action}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  skipButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  stepCounter: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  tipsContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#15803d',
    flex: 1,
    lineHeight: 20,
  },
  motivationContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  motivationText: {
    fontSize: 15,
    color: '#0c4a6e',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default OnboardingFlow;
