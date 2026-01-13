import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardTheme } from '../../theme/dashboardTheme';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showScrollIndicator?: boolean;
  contentPadding?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showScrollIndicator = false,
  contentPadding = true,
}) => {
  const layout = useDashboardLayout();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: contentPadding ? layout.horizontalPadding : 0,
            paddingBottom: layout.bottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={showScrollIndicator}
        bounces={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

interface SectionProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

export const DashboardSection: React.FC<SectionProps> = ({
  children,
  spacing = 'md',
}) => {
  const getSpacing = () => {
    switch (spacing) {
      case 'sm': return dashboardTheme.spacing.sm;
      case 'lg': return dashboardTheme.spacing.lg;
      default: return dashboardTheme.spacing.md;
    }
  };

  return (
    <View style={[styles.section, { marginBottom: getSpacing() }]}>
      {children}
    </View>
  );
};

interface GridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  spacing?: number;
}

export const DashboardGrid: React.FC<GridProps> = ({
  children,
  columns = 2,
  spacing = dashboardTheme.spacing.sm,
}) => {
  return (
    <View style={[styles.grid, { gap: spacing }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: dashboardTheme.spacing.sm,
  },
  section: {
    marginBottom: dashboardTheme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
