import React from 'react';
import { View, ViewStyle, StyleSheet, useWindowDimensions } from 'react-native';

// Breakpoints
const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  center?: boolean;
  padding?: boolean;
}

/**
 * Container that centers content with max-width on tablets
 * Provides consistent padding and max-width constraints
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth,
  center = true,
  padding = true,
}) => {
  const { width } = useWindowDimensions();
  
  const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
  const isTablet = width >= TABLET_BREAKPOINT;
  
  const defaultMaxWidth = isLargeTablet
    ? Math.min(width - 64, 900)
    : isTablet
    ? Math.min(width - 48, 700)
    : width;
  
  const horizontalPadding = isLargeTablet ? 32 : isTablet ? 24 : 16;
  
  const containerStyle: ViewStyle = {
    width: '100%',
    ...(center && { maxWidth: maxWidth || defaultMaxWidth, alignSelf: 'center' }),
    ...(padding && { paddingHorizontal: horizontalPadding }),
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gap?: number;
  minItemWidth?: number;
}

/**
 * Responsive grid that adapts columns based on screen size
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  style,
  gap,
  minItemWidth = 280,
}) => {
  const { width } = useWindowDimensions();
  
  const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
  const isTablet = width >= TABLET_BREAKPOINT;
  
  const columns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  const gridGap = gap ?? (isLargeTablet ? 20 : isTablet ? 16 : 12);
  
  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gridGap,
    justifyContent: columns > 1 ? 'flex-start' : 'center',
  };

  // Clone children and add width style for grid items
  const childrenWithWidth = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    
    const horizontalPadding = isLargeTablet ? 32 : isTablet ? 24 : 16;
    const availableWidth = width - horizontalPadding * 2;
    const maxContentWidth = isLargeTablet
      ? Math.min(availableWidth, 900)
      : isTablet
      ? Math.min(availableWidth, 700)
      : availableWidth;
    
    const itemWidth = columns > 1
      ? (maxContentWidth - gridGap * (columns - 1)) / columns
      : '100%';
    
    return React.cloneElement(child as React.ReactElement<any>, {
      style: [
        (child.props as any).style,
        { width: itemWidth },
      ],
    });
  });

  return (
    <View style={[gridStyle, style]}>
      {childrenWithWidth}
    </View>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  columns?: number;
}

/**
 * Card component that sizes correctly within a grid
 */
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ResponsiveContainer;
