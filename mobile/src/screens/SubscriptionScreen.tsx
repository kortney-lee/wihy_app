import React from 'react';
import { Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type SubscriptionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Subscription'
>;

interface Props {
  navigation: SubscriptionScreenNavigationProp;
}

// Platform-specific subscription screen
// Web uses Stripe, Native uses IAP
export const SubscriptionScreen: React.FC<Props> = (props) => {
  if (Platform.OS === 'web') {
    // Dynamically import web component to avoid bundling issues
    const { SubscriptionScreen: WebSubscriptionScreen } = require('./WebSubscriptionScreen');
    return <WebSubscriptionScreen {...props} />;
  }
  
  // Native component with IAP
  const { NativeSubscriptionScreen } = require('./NativeSubscriptionScreen');
  return <NativeSubscriptionScreen {...props} />;
};
