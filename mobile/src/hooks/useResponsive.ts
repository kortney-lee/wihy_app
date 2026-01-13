import { useMemo } from 'react';
import { useWindowDimensions, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Breakpoints
const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;

export type DeviceType = 'phone' | 'tablet' | 'largeTablet';

export interface ResponsiveConfig {
  deviceType: DeviceType;
  isTablet: boolean;
  isLargeTablet: boolean;
  isPhone: boolean;
  width: number;
  height: number;
  columns: number;
  horizontalPadding: number;
  maxContentWidth: number;
  cardGap: number;
  // Scaling functions
  rs: (phone: number, tablet?: number, largeTablet?: number) => number;
  rfs: (baseSize: number) => number;
  rsp: (baseSpacing: number) => number;
  // Helper styles
  containerStyle: ViewStyle;
  centeredContentStyle: ViewStyle;
}

/**
 * Hook for responsive layouts - automatically updates on dimension changes
 */
export const useResponsive = (): ResponsiveConfig => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    // Determine device type
    let deviceType: DeviceType = 'phone';
    if (width >= LARGE_TABLET_BREAKPOINT) {
      deviceType = 'largeTablet';
    } else if (width >= TABLET_BREAKPOINT) {
      deviceType = 'tablet';
    }

    const isTablet = deviceType !== 'phone';
    const isLargeTablet = deviceType === 'largeTablet';
    const isPhone = deviceType === 'phone';

    // Calculate columns for grids
    const columns = isLargeTablet ? 3 : isTablet ? 2 : 1;

    // Calculate padding
    const horizontalPadding = isLargeTablet ? 32 : isTablet ? 24 : 16;

    // Calculate max content width
    const maxContentWidth = isLargeTablet
      ? Math.min(width - 64, 900)
      : isTablet
      ? Math.min(width - 48, 700)
      : width - 32;

    // Card gap
    const cardGap = isLargeTablet ? 20 : isTablet ? 16 : 12;

    // Responsive size function
    const rs = (phone: number, tablet?: number, largeTablet?: number): number => {
      if (isLargeTablet && largeTablet !== undefined) return largeTablet;
      if (isTablet && tablet !== undefined) return tablet;
      return phone;
    };

    // Responsive font size
    const rfs = (baseSize: number): number => {
      if (isLargeTablet) return Math.round(baseSize * 1.2);
      if (isTablet) return Math.round(baseSize * 1.1);
      return baseSize;
    };

    // Responsive spacing
    const rsp = (baseSpacing: number): number => {
      if (isLargeTablet) return Math.round(baseSpacing * 1.5);
      if (isTablet) return Math.round(baseSpacing * 1.25);
      return baseSpacing;
    };

    // Container style - full width
    const containerStyle: ViewStyle = {
      flex: 1,
      paddingHorizontal: horizontalPadding,
    };

    // Centered content style - max width centered
    const centeredContentStyle: ViewStyle = {
      width: '100%',
      maxWidth: maxContentWidth,
      alignSelf: 'center',
    };

    return {
      deviceType,
      isTablet,
      isLargeTablet,
      isPhone,
      width,
      height,
      columns,
      horizontalPadding,
      maxContentWidth,
      cardGap,
      rs,
      rfs,
      rsp,
      containerStyle,
      centeredContentStyle,
    };
  }, [width, height]);
};

/**
 * Get card width for grid layouts
 */
export const getCardWidth = (
  containerWidth: number,
  columns: number,
  gap: number = 16
): number => {
  return (containerWidth - gap * (columns - 1)) / columns;
};

/**
 * Create responsive styles based on device type
 */
export const createResponsiveStyles = <T extends StyleSheet.NamedStyles<T>>(
  stylesCreator: (config: ResponsiveConfig) => T
) => {
  return stylesCreator;
};

export default useResponsive;
