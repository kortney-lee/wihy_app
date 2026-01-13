import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import ConsumptionDashboard from './ConsumptionDashboard';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

const NutritionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleAnalyze = (userMessage: string, assistantMessage: string) => {
    navigation.navigate('FullChat', {
      context: { type: 'nutrition-analysis', source: 'nutrition-dashboard' },
      initialMessage: userMessage || 'Analyze my nutrition'
    });
    console.log('Analyze triggered:', { userMessage, assistantMessage });
  };

  const handleUploadReceipt = () => {
    navigation.navigate('Camera');
  };

  return (
    <ConsumptionDashboard
      onAnalyze={handleAnalyze}
      onUploadReceipt={handleUploadReceipt}
    />
  );
};

export default NutritionScreen;
