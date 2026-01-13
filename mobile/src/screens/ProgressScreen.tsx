import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import MyProgressDashboard from './MyProgressDashboard';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleToggleAction = (actionId: string) => {
    console.log('Action toggled:', actionId);
  };

  return (
    <MyProgressDashboard
      onToggleAction={handleToggleAction}
      onStartWorkout={() => navigation.navigate('FullChat', {
        context: { type: 'workout', source: 'progress-dashboard' },
        initialMessage: 'Help me start a workout'
      })}
      onAddHydration={() => navigation.navigate('FullChat', {
        context: { type: 'hydration', source: 'progress-dashboard' },
        initialMessage: 'Help me track my hydration'
      })}
      onLogMeal={() => navigation.navigate('Camera')}
      onEducationClick={() => navigation.navigate('FullChat', {
        context: { type: 'education', source: 'progress-dashboard' },
        initialMessage: 'Tell me about nutrition education'
      })}
    />
  );
};

export default ProgressScreen;
