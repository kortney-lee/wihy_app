import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export interface PaywallCheckResult {
  canAccess: boolean;
  showUpgradePrompt: () => void;
}

export function usePaywall(requiredCapability: string): PaywallCheckResult {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [showPrompt, setShowPrompt] = useState(false);

  const canAccess = useCallback(() => {
    if (!user) return false;

    // Check if user has the required capability
    switch (requiredCapability) {
      case 'meals':
        return user.plan !== 'free' && user.capabilities?.meals === true;
      case 'workouts':
        return user.plan !== 'free' && user.capabilities?.workouts === true;
      case 'ai':
        return user.addOns?.includes('ai') || user.capabilities?.wihyAI === true;
      case 'family':
        return user.capabilities?.family === true;
      case 'coach':
        return user.capabilities?.coachPlatform === true;
      default:
        return true;
    }
  }, [user, requiredCapability]);

  const showUpgradePrompt = useCallback(() => {
    // Navigate to subscription screen
    navigation.navigate('Subscription');
  }, [navigation]);

  return {
    canAccess: canAccess(),
    showUpgradePrompt,
  };
}

// Helper hook for simpler paywall checks
export function useFeatureAccess(feature: 'meals' | 'workouts' | 'ai' | 'family' | 'coach') {
  const { user } = useAuth();

  if (!user) return false;

  switch (feature) {
    case 'meals':
      return user.plan !== 'free' && user.capabilities?.meals === true;
    case 'workouts':
      return user.plan !== 'free' && user.capabilities?.workouts === true;
    case 'ai':
      return user.addOns?.includes('ai') || user.capabilities?.wihyAI === true;
    case 'family':
      return user.capabilities?.family === true;
    case 'coach':
      return user.capabilities?.coachPlatform === true;
    default:
      return true;
  }
}
