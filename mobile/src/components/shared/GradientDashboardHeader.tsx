import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SvgIcon from './SvgIcon';

/**
 * Gradient color presets for different dashboard types
 * These match the colors defined in DESIGN_PATTERNS.md
 */
export const DASHBOARD_GRADIENTS = {
  // Primary Dashboards
  fitness: ['#f59e0b', '#d97706'] as [string, string],      // Orange/Amber
  progress: ['#dc2626', '#b91c1c'] as [string, string],     // Red
  overview: ['#059669', '#047857'] as [string, string],     // Emerald Green
  consumption: ['#ea580c', '#c2410c'] as [string, string],  // Deep Orange
  research: ['#8b5cf6', '#7c3aed'] as [string, string],     // Purple
  coach: ['#3b82f6', '#2563eb'] as [string, string],        // Blue
  createMeals: ['#ef4444', '#dc2626'] as [string, string],  // Red
  parent: ['#ec4899', '#db2777'] as [string, string],       // Pink (Family - matches Family tile)
  clientManagement: ['#8b5cf6', '#7c3aed'] as [string, string], // Purple
  
  // Nutrition & Food Screens
  nutritionFacts: ['#3b82f6', '#3b82f6'] as [string, string],   // Blue (solid)
  nutritionPhoto: ['#3b82f6', '#3b82f6'] as [string, string],   // Blue (solid)
  nutritionPill: ['#3b82f6', '#3b82f6'] as [string, string],    // Blue (solid)
  nutritionLabel: ['#3b82f6', '#3b82f6'] as [string, string],   // Blue (solid)
  mealDetails: ['#f59e0b', '#d97706'] as [string, string],      // Orange/Amber
  mealPreferences: ['#ef4444', '#dc2626'] as [string, string],  // Red
  shoppingList: ['#4cbb17', '#3d9914'] as [string, string],     // Green
  cookingMode: ['#1f2937', '#111827'] as [string, string],      // Dark Gray
  
  // User Screens
  profile: ['#3B82F6', '#1d4ed8'] as [string, string],          // Blue
  subscription: ['#4CAF50', '#388e3c'] as [string, string],     // Green
  scanHistory: ['#3b82f6', '#2563eb'] as [string, string],      // Blue
  
  // Coach & Client Screens
  coachSelection: ['#06b6d4', '#0891b2'] as [string, string],   // Cyan
  clientOnboarding: ['#10b981', '#059669'] as [string, string], // Emerald
  coachOverview: ['#3b82f6', '#2563eb'] as [string, string],    // Blue
  
  // Workout Screens
  workoutExecution: ['#4cbb17', '#3b9e12'] as [string, string], // Lime Green
  
  // Chat Screen
  chat: ['#4cbb17', '#4cbb17'] as [string, string],             // WiHY Green (solid)
  
  // Utility Screens
  weather: ['#38bdf8', '#0ea5e9'] as [string, string],          // Sky Blue
  todo: ['#8b5cf6', '#7c3aed'] as [string, string],             // Purple
  
  // Calendar & Planning
  mealCalendar: ['#3b82f6', '#2563eb'] as [string, string],     // Blue
  
  // Family Dashboard
  family: ['#0ea5e9', '#0284c7'] as [string, string],           // Sky Blue
  
  // Health Hub Main Menu
  healthHub: ['#10b981', '#059669'] as [string, string],        // Emerald Green
} as const;

export type DashboardGradientType = keyof typeof DASHBOARD_GRADIENTS;

interface BadgeProps {
  icon?: string;
  text: string;
}

interface StatProps {
  icon: string;
  value: string | number;
  label: string;
}

interface GradientDashboardHeaderProps {
  /** Main title text (e.g., "Today's Workout") */
  title: string;
  /** Subtitle text (e.g., "Chest & Triceps - Week 1 Day 1") */
  subtitle?: string;
  /** Gradient type from presets or custom colors */
  gradient?: DashboardGradientType | [string, string];
  /** Badge to show below subtitle (e.g., "Personalized for you") */
  badge?: BadgeProps;
  /** Stats to display in header */
  stats?: StatProps[];
  /** Whether to show back button (left arrow) - for stack navigation */
  showBackButton?: boolean;
  /** Callback when back button pressed */
  onBackPress?: () => void;
  /** Whether to show close button (X) on right - for modal presentation */
  showCloseButton?: boolean;
  /** Callback when close button pressed */
  onClosePress?: () => void;
  /** Right action button (will be overridden by showCloseButton if both set) */
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  /** Additional styles for the header container */
  style?: ViewStyle;
  /** Children to render below the header content */
  children?: React.ReactNode;
}

/**
 * GradientDashboardHeader - A reusable gradient header component for dashboards
 * 
 * This component provides a consistent header design across all dashboard screens
 * with support for:
 * - Gradient backgrounds (presets or custom)
 * - Title and subtitle
 * - Optional badge with icon
 * - Optional stats display
 * - Back button and right action
 * 
 * Usage:
 * ```tsx
 * <GradientDashboardHeader
 *   title="Today's Workout"
 *   subtitle="Chest & Triceps - Week 1 Day 1"
 *   gradient="fitness"
 *   badge={{ icon: "sparkles-outline", text: "Personalized for you" }}
 * />
 * ```
 */
export const GradientDashboardHeader: React.FC<GradientDashboardHeaderProps> = ({
  title,
  subtitle,
  gradient = 'fitness',
  badge,
  stats,
  showBackButton = false,
  onBackPress,
  showCloseButton = false,
  onClosePress,
  rightAction,
  style,
  children,
}) => {
  // Resolve gradient colors from preset or use custom
  const gradientColors = typeof gradient === 'string' 
    ? DASHBOARD_GRADIENTS[gradient] 
    : gradient;

  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isMobileWeb = isWeb && width < 768;

  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.header, isWeb && styles.headerWeb, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.headerContent, isMobileWeb && styles.headerContentMobileWeb]}>
        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <SvgIcon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          
          {/* Badge */}
          {badge && (
            <View style={styles.headerStats}>
              <View style={styles.statBadge}>
                <View style={styles.headerStatContent}>
                  {badge.icon && (
                    <SvgIcon name={badge.icon} size={16} color="#ffffff" />
                  )}
                  <Text style={styles.headerStatText}>{badge.text}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Stats Row */}
          {stats && stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <SvgIcon name={stat.icon} size={16} color="#ffffff" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Close Button (for modal presentation) */}
        {showCloseButton && (
          <TouchableOpacity style={styles.closeButton} onPress={onClosePress}>
            <SvgIcon name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Right Action (only if no close button) */}
        {!showCloseButton && rightAction && (
          <TouchableOpacity style={styles.rightAction} onPress={rightAction.onPress}>
            <SvgIcon name={rightAction.icon} size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Optional children */}
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerWeb: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerContentMobileWeb: {
    paddingRight: 110, // Space for the floating Health Hub button
  },
  backButton: {
    padding: 4,
    marginRight: 8,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStatText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  rightAction: {
    padding: 4,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
    marginTop: 2,
  },
});

export default GradientDashboardHeader;
