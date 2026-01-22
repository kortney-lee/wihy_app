import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from './Ionicons';
import { dashboardTheme } from '../../theme/dashboardTheme';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  onBackPress?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  rightAction,
  onBackPress,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color={dashboardTheme.colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {rightAction && (
          <TouchableOpacity style={styles.rightAction} onPress={rightAction.onPress}>
            <Ionicons name={rightAction.icon as any} size={24} color={dashboardTheme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: dashboardTheme.spacing.md,
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingBottom: dashboardTheme.spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: dashboardTheme.spacing.xs,
    marginRight: dashboardTheme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 2,
  },
  rightAction: {
    padding: dashboardTheme.spacing.xs,
    marginLeft: dashboardTheme.spacing.sm,
  },
});
