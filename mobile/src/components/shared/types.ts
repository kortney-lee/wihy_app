// Common navigation types
export type { CompositeNavigationProp } from '@react-navigation/native';
export type { StackNavigationProp } from '@react-navigation/stack';
export type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
export type { TabParamList, RootStackParamList } from '../../types/navigation';

// Common navigation type for dashboards
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../../types/navigation';

export type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

// Common interfaces for dashboard components
export interface BaseQuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export interface BaseMetric {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'alert';
}

export interface BaseDashboardProps {
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

// Common dashboard colors
export const dashboardColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  accent: '#8B5CF6',
  success: '#22C55E',
  purple: '#9333EA',
  orange: '#F97316',
  pink: '#EC4899',
  teal: '#14B8A6',
};
