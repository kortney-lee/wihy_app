import { useNavigation } from '@react-navigation/native';
import type { DashboardNavigationProp } from './types';

export const useDashboardNavigation = () => {
  const navigation = useNavigation<DashboardNavigationProp>();

  const navigateToCamera = () => {
    navigation.navigate('Camera');
  };

  const navigateToChat = (chatContext?: { type?: string; source?: string; initialMessage?: string }) => {
    navigation.navigate('FullChat', {
      context: { 
        type: chatContext?.type || 'general', 
        source: chatContext?.source || 'dashboard',
        timestamp: new Date().toISOString()
      },
      initialMessage: chatContext?.initialMessage
    });
  };

  const navigateToNutritionFacts = (foodItem?: any) => {
    const defaultFoodItem = {
      name: 'Sample Food Item',
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 2,
      fiber: 3,
      sugar: 8,
      sodium: 10,
      unit: 'g',
      analyzed: true,
      servingSize: { amount: 1, unit: 'serving' },
      nutrients: [
        { name: 'Vitamin C', amount: 10, unit: 'mg', dailyValue: 11, category: 'vitamin' },
        { name: 'Iron', amount: 1, unit: 'mg', dailyValue: 6, category: 'mineral' },
      ],
    };

    // Use the root navigation to navigate to the Stack screen
    // This ensures goBack() stays within the modal context and returns to the dashboard
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate('NutritionFacts', {
        foodItem: foodItem ? { ...defaultFoodItem, ...foodItem } : defaultFoodItem,
        context: {
          type: 'dashboard-access',
          isModal: true, // Signals this should show close button, not back button
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Fallback to regular navigation if no parent
      navigation.navigate('NutritionFacts', {
        foodItem: foodItem ? { ...defaultFoodItem, ...foodItem } : defaultFoodItem,
        context: {
          type: 'dashboard-access',
          isModal: true,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  const handleAnalyze = (userMessage: string, assistantMessage: string) => {
    navigation.navigate('FullChat', {
      context: { type: 'analysis', source: 'dashboard' },
      initialMessage: userMessage || assistantMessage
    });
    console.log('Analyze triggered:', { userMessage, assistantMessage });
  };

  return {
    navigation,
    navigateToCamera,
    navigateToChat,
    navigateToNutritionFacts,
    handleAnalyze,
  };
};
