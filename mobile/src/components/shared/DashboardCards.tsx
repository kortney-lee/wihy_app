import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from './Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../../theme/dashboardTheme';
import { useTheme } from '../../context/ThemeContext';

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
  style?: ViewStyle;
  iconSize?: number;
  gradient?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  style,
  iconSize = 28,
  gradient = false,
}) => {
  const { theme } = useTheme();
  const iconContainerSize = iconSize + 20; // Add padding to icon container

  const cardContent = (
    <>
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: gradient ? 'transparent' : color + '20',
          width: iconContainerSize,
          height: iconContainerSize,
        },
      ]}>
        <Ionicons name={icon as any} size={iconSize} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </>
  );

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {gradient ? (
        <LinearGradient
          colors={[color + '20', color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {cardContent}
        </LinearGradient>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {cardContent}
        </View>
      )}
    </TouchableOpacity>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'alert';
  onPress?: () => void;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  color,
  trend,
  status = 'good',
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const getStatusColor = () => {
    switch (status) {
      case 'warning': return dashboardTheme.colors.warning;
      case 'alert': return dashboardTheme.colors.error;
      default: return dashboardTheme.colors.success;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {trend && (
          <View style={[styles.trendIndicator, { backgroundColor: getStatusColor() + '20' }]}>
            <Ionicons name={getTrendIcon() as any} size={12} color={getStatusColor()} />
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>
        {value}{unit && <Text style={styles.metricUnit}>{unit}</Text>}
      </Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: dashboardTheme.spacing.xs,
  },
  card: {
    borderRadius: dashboardTheme.borderRadius.md,
    padding: dashboardTheme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.border,
  },
  iconContainer: {
    borderRadius: dashboardTheme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardTheme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: dashboardTheme.colors.textSecondary,
  },
  metricCard: {
    borderRadius: dashboardTheme.borderRadius.md,
    padding: dashboardTheme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.border,
    minHeight: 120,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.sm,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: dashboardTheme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    marginBottom: 4,
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: dashboardTheme.colors.textSecondary,
  },
  metricTitle: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
  },
});
