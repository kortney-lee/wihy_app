import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from './Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GuideStep {
  id: string;
  icon: string; // Changed from keyof typeof ExpoIonicons.glyphMap to string
  iconColor: string;
  backgroundColor: string;
  title: string;
  description: string;
  tabTarget?: 'Home' | 'Scan' | 'Chat' | 'Health' | 'Profile';
  position: 'top' | 'center' | 'bottom';
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    icon: 'sparkles',
    iconColor: '#ffffff',
    backgroundColor: '#8b5cf6',
    title: 'Welcome to WiHY!',
    description: 'Let me show you around your personal wellness companion.',
    position: 'center',
  },
  {
    id: 'home',
    icon: 'home',
    iconColor: '#ffffff',
    backgroundColor: '#3b82f6',
    title: 'Home',
    description: 'Your nutrition & fitness command center. Track meals, view progress, and get personalized recommendations.',
    tabTarget: 'Home',
    position: 'bottom',
  },
  {
    id: 'scan',
    icon: 'scan',
    iconColor: '#ffffff',
    backgroundColor: '#22c55e',
    title: 'Scan',
    description: 'Point your camera at any food to instantly analyze nutrition. Works with meals, labels, and barcodes.',
    tabTarget: 'Scan',
    position: 'bottom',
  },
  {
    id: 'chat',
    icon: 'chatbubbles',
    iconColor: '#ffffff',
    backgroundColor: '#f97316',
    title: 'Chat',
    description: 'Ask anything! "What should I eat for energy?" or "Create a meal plan for muscle building."',
    tabTarget: 'Chat',
    position: 'bottom',
  },
  {
    id: 'health',
    icon: 'heart',
    iconColor: '#ffffff',
    backgroundColor: '#ef4444',
    title: 'Health',
    description: 'Deep dive into analytics, research insights, fitness tracking, and custom meal planning.',
    tabTarget: 'Health',
    position: 'bottom',
  },
  {
    id: 'create-meal',
    icon: 'restaurant',
    iconColor: '#ffffff',
    backgroundColor: '#f59e0b',
    title: 'Create Meals',
    description: 'Build custom meals from scratch or use AI to generate recipes based on your goals, preferences, and what\'s in your kitchen.',
    position: 'center',
  },
  {
    id: 'create-workout',
    icon: 'barbell',
    iconColor: '#ffffff',
    backgroundColor: '#10b981',
    title: 'Create Workouts',
    description: 'Design personalized workout plans. Set your fitness goals and get AI-powered exercise recommendations tailored to you.',
    position: 'center',
  },
  {
    id: 'profile',
    icon: 'person',
    iconColor: '#ffffff',
    backgroundColor: '#6366f1',
    title: 'Profile',
    description: 'Manage your goals, connect with coaches, and set up family sharing.',
    tabTarget: 'Profile',
    position: 'bottom',
  },
  {
    id: 'ready',
    icon: 'rocket',
    iconColor: '#ffffff',
    backgroundColor: '#8b5cf6',
    title: "You're Ready!",
    description: 'Start by scanning a meal or asking a question. Your health journey begins now!',
    position: 'center',
  },
];

interface QuickStartGuideProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (tab: 'Home' | 'Scan' | 'Chat' | 'Health' | 'Profile') => void;
}

export const QuickStartGuide: React.FC<QuickStartGuideProps> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const step = GUIDE_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for highlighted tab
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [visible, currentStep]);

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      setCurrentStep(0);
    } else {
      animateTransition(() => setCurrentStep(prev => prev + 1));
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      animateTransition(() => setCurrentStep(prev => prev - 1));
    }
  };

  const handleTryIt = () => {
    if (step.tabTarget && onNavigate) {
      onClose();
      setCurrentStep(0);
      onNavigate(step.tabTarget);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setCurrentStep(0);
    });
  };

  // Tab bar icons for highlighting
  const tabIcons: Array<{ name: keyof typeof ExpoIonicons.glyphMap; label: string; target: string }> = [
    { name: 'home-outline', label: 'Home', target: 'Home' },
    { name: 'scan-outline', label: 'Scan', target: 'Scan' },
    { name: 'chatbubble-outline', label: 'Chat', target: 'Chat' },
    { name: 'heart-outline', label: 'Health', target: 'Health' },
    { name: 'person-outline', label: 'Profile', target: 'Profile' },
  ];

  const getTooltipPosition = () => {
    if (step.position === 'bottom') {
      return { bottom: 140 + insets.bottom };
    } else if (step.position === 'top') {
      return { top: 100 + insets.top };
    }
    return { top: SCREEN_HEIGHT * 0.25 };
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Tooltip Card */}
        <Animated.View
          style={[
            styles.tooltipCard,
            getTooltipPosition(),
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* Step indicators */}
          <View style={styles.stepIndicators}>
            {GUIDE_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index === currentStep && styles.stepDotActive,
                  index < currentStep && styles.stepDotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: step.backgroundColor }]}>
            <Ionicons name={step.icon} size={32} color={step.iconColor} />
          </View>

          {/* Content */}
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {/* Try It button */}
          {step.tabTarget && (
            <TouchableOpacity
              style={[styles.tryButton, { backgroundColor: step.backgroundColor }]}
              onPress={handleTryIt}
            >
              <Text style={styles.tryButtonText}>Try it now</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          )}

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, isFirstStep && styles.navButtonDisabled]}
              onPress={handlePrev}
              disabled={isFirstStep}
            >
              <Ionicons name="chevron-back" size={20} color={isFirstStep ? '#cbd5e1' : '#3b82f6'} />
              <Text style={[styles.navText, isFirstStep && styles.navTextDisabled]}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.stepCount}>{currentStep + 1}/{GUIDE_STEPS.length}</Text>

            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={[styles.navText, styles.navTextPrimary]}>
                {isLastStep ? "Let's Go!" : 'Next'}
              </Text>
              <Ionicons name={isLastStep ? 'rocket' : 'chevron-forward'} size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Highlighted Tab Bar */}
        {step.position === 'bottom' && step.tabTarget && (
          <View style={[styles.tabBarHighlight, { paddingBottom: insets.bottom }]}>
            {tabIcons.map((tab, index) => {
              const isHighlighted = tab.target === step.tabTarget;
              return (
                <Animated.View
                  key={tab.target}
                  style={[
                    styles.tabItem,
                    isHighlighted && {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.tabIconWrapper,
                      isHighlighted && [styles.tabIconHighlighted, { backgroundColor: step.backgroundColor }],
                    ]}
                  >
                    <Ionicons
                      name={isHighlighted ? tab.name.replace('-outline', '') as keyof typeof ExpoIonicons.glyphMap : tab.name}
                      size={24}
                      color={isHighlighted ? '#ffffff' : '#9ca3af'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isHighlighted && styles.tabLabelHighlighted]}>
                    {tab.label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
  },
  tooltipCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  stepDotActive: {
    width: 20,
    backgroundColor: '#3b82f6',
  },
  stepDotCompleted: {
    backgroundColor: '#93c5fd',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  tryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  navTextDisabled: {
    color: '#cbd5e1',
  },
  navTextPrimary: {
    color: '#3b82f6',
  },
  stepCount: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  tabBarHighlight: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    // backgroundColor: '#ffffff', // theme.colors.surface
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconHighlighted: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelHighlighted: {
    color: '#1e293b',
    fontWeight: '600',
  },
});

export default QuickStartGuide;
