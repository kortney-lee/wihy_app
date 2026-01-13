import { Dimensions, PixelRatio, ScaledSize } from 'react-native';

// Get initial dimensions
let { width, height } = Dimensions.get('window');

// Listen for dimension changes (rotation, etc.)
Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
  width = window.width;
  height = window.height;
});

// Base dimensions (iPhone 12/13/14 as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Tablet breakpoint
const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;

// Device type detection
export type DeviceType = 'phone' | 'tablet' | 'largeTablet';

/**
 * Get current device type
 */
export const getDeviceType = (): DeviceType => {
  const screenWidth = Dimensions.get('window').width;
  if (screenWidth >= LARGE_TABLET_BREAKPOINT) return 'largeTablet';
  if (screenWidth >= TABLET_BREAKPOINT) return 'tablet';
  return 'phone';
};

/**
 * Get responsive size based on screen width
 * @param size - Base size for standard screen
 * @param minSize - Minimum size (optional)
 * @param maxSize - Maximum size (optional)
 */
export const getResponsiveSize = (
  size: number,
  minSize?: number,
  maxSize?: number
): number => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const scale = Math.min(screenWidth / BASE_WIDTH, screenHeight / BASE_HEIGHT);
  let responsiveSize = size * scale;

  if (minSize && responsiveSize < minSize) {
    responsiveSize = minSize;
  }

  if (maxSize && responsiveSize > maxSize) {
    responsiveSize = maxSize;
  }

  return Math.round(responsiveSize);
};

/**
 * Get responsive icon size
 * @param baseSize - Base icon size
 */
export const getResponsiveIconSize = (baseSize: number): number => {
  return getResponsiveSize(baseSize, baseSize * 0.8, baseSize * 1.2);
};

/**
 * Get responsive padding/margin
 * @param baseSpacing - Base spacing value
 */
export const getResponsiveSpacing = (baseSpacing: number): number => {
  return getResponsiveSize(baseSpacing, baseSpacing * 0.75, baseSpacing * 1.25);
};

/**
 * Get responsive font size
 * @param baseFontSize - Base font size
 */
export const getResponsiveFontSize = (baseFontSize: number): number => {
  return getResponsiveSize(baseFontSize, baseFontSize * 0.85, baseFontSize * 1.15);
};

/**
 * Get responsive button size
 * @param baseWidth - Base button width
 * @param baseHeight - Base button height
 */
export const getResponsiveButtonSize = (baseWidth: number, baseHeight: number) => {
  return {
    width: getResponsiveSize(baseWidth, baseWidth * 0.8, baseWidth * 1.2),
    height: getResponsiveSize(baseHeight, baseHeight * 0.9, baseHeight * 1.1),
  };
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
  return Dimensions.get('window').width >= TABLET_BREAKPOINT;
};

/**
 * Check if device is small (phone with width < 375)
 */
export const isSmallDevice = (): boolean => {
  return Dimensions.get('window').width < 375;
};

/**
 * Check if device is large (width > 414)
 */
export const isLargeDevice = (): boolean => {
  return Dimensions.get('window').width > 414;
};

// ==========================================
// TABLET-OPTIMIZED RESPONSIVE UTILITIES
// ==========================================

/**
 * Scale value for tablets - provides better proportions on larger screens
 * Uses a dampened scale to prevent elements from becoming too large
 */
export const getTabletScale = (): number => {
  const screenWidth = Dimensions.get('window').width;
  if (screenWidth >= LARGE_TABLET_BREAKPOINT) {
    return 1.3; // Large tablets get 30% boost max
  }
  if (screenWidth >= TABLET_BREAKPOINT) {
    return 1.15; // Regular tablets get 15% boost
  }
  return 1;
};

/**
 * Get responsive value with tablet optimization
 * Prevents values from scaling too much on tablets
 */
export const rs = (
  phoneValue: number,
  tabletValue?: number,
  largeTabletValue?: number
): number => {
  const deviceType = getDeviceType();
  if (deviceType === 'largeTablet' && largeTabletValue !== undefined) {
    return largeTabletValue;
  }
  if (deviceType !== 'phone' && tabletValue !== undefined) {
    return tabletValue;
  }
  return phoneValue;
};

/**
 * Get responsive font size with tablet optimization
 * Fonts shouldn't scale as aggressively on tablets
 */
export const rfs = (baseSize: number): number => {
  const deviceType = getDeviceType();
  if (deviceType === 'largeTablet') {
    return Math.round(baseSize * 1.2);
  }
  if (deviceType === 'tablet') {
    return Math.round(baseSize * 1.1);
  }
  return baseSize;
};

/**
 * Get responsive spacing with tablet optimization
 */
export const rsp = (baseSpacing: number): number => {
  const deviceType = getDeviceType();
  if (deviceType === 'largeTablet') {
    return Math.round(baseSpacing * 1.5);
  }
  if (deviceType === 'tablet') {
    return Math.round(baseSpacing * 1.25);
  }
  return baseSpacing;
};

/**
 * Get max content width for tablets
 * Prevents content from stretching edge to edge
 */
export const getMaxContentWidth = (): number => {
  const screenWidth = Dimensions.get('window').width;
  const deviceType = getDeviceType();
  
  if (deviceType === 'largeTablet') {
    return Math.min(screenWidth - 64, 900); // Max 900px on large tablets
  }
  if (deviceType === 'tablet') {
    return Math.min(screenWidth - 48, 700); // Max 700px on tablets
  }
  return screenWidth - 32; // Full width minus padding on phones
};

/**
 * Get number of columns for grid layouts
 */
export const getGridColumns = (): number => {
  const deviceType = getDeviceType();
  if (deviceType === 'largeTablet') return 3;
  if (deviceType === 'tablet') return 2;
  return 1;
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
 * Get responsive horizontal padding
 */
export const getHorizontalPadding = (): number => {
  const deviceType = getDeviceType();
  if (deviceType === 'largeTablet') return 32;
  if (deviceType === 'tablet') return 24;
  return 16;
};

/**
 * Get centered container style for tablets
 * Centers content with max-width on larger screens
 */
export const getCenteredContainerStyle = () => {
  const deviceType = getDeviceType();
  const maxWidth = getMaxContentWidth();
  
  if (deviceType === 'phone') {
    return {
      width: '100%' as const,
      paddingHorizontal: 16,
    };
  }
  
  return {
    width: '100%' as const,
    maxWidth,
    alignSelf: 'center' as const,
    paddingHorizontal: getHorizontalPadding(),
  };
};
