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
// Web uses Stripe checkout with full marketing page
// Native uses PlansModal for in-app upgrade flow
export const SubscriptionScreen: React.FC<Props> = (props) => {
  if (Platform.OS === 'web') {
    // Web: Full subscription page with Stripe checkout
    const { SubscriptionScreen: WebSubscriptionScreen } = require('./WebSubscriptionScreen');
    return <WebSubscriptionScreen {...props} />;
  }
  
  // Native (iOS/Android): Use the simpler native subscription screen
  // Note: Most native upgrade flows use PlansModal instead
  const { NativeSubscriptionScreen } = require('./NativeSubscriptionScreen');
  return <NativeSubscriptionScreen {...props} />;
};
