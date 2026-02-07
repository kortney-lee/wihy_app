import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from './Ionicons';
import { getDashboardTheme } from '../../theme/dashboardTheme';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();
  const dashboardTheme = getDashboardTheme(isDark);

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color={dashboardTheme.colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: dashboardTheme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: dashboardTheme.colors.textSecondary }]}>{subtitle}</Text>}
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightAction: {
    padding: 4,
    marginLeft: 8,
  },
});
