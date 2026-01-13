import { useMemo } from 'react';
import { useWindowDimensions, ViewStyle } from 'react-native';

// Breakpoints
const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;

export interface DashboardLayout {
  type: 'mobile' | 'tablet' | 'desktop';
  columns: number;
  cardSpacing: number;
  horizontalPadding: number;
  bottomPadding: number;
  showSidebar: boolean;
  // New tablet-optimized properties
  maxContentWidth: number;
  cardWidth: number;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  // Responsive helpers
  rs: (phone: number, tablet?: number, desktop?: number) => number;
  rfs: (baseSize: number) => number;
  rsp: (baseSpacing: number) => number;
  // Style helpers
  contentContainerStyle: ViewStyle;
  gridContainerStyle: ViewStyle;
}

// Custom hook for responsive dashboard layouts
export const useDashboardLayout = (): DashboardLayout => {
  const { width, height } = useWindowDimensions();

  const layout = useMemo(() => {
    // Determine layout type
    const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
    const isTablet = width >= TABLET_BREAKPOINT;
    
    let type: 'mobile' | 'tablet' | 'desktop';
    let columns: number;
    let cardSpacing: number;
    let horizontalPadding: number;
    let showSidebar: boolean;
    let maxContentWidth: number;
    
    if (isLargeTablet) {
      type = 'desktop';
      columns = 3;
      cardSpacing = 20;
      horizontalPadding = 32;
      showSidebar = true;
      maxContentWidth = Math.min(width - 64, 1200);
    } else if (isTablet) {
      type = 'tablet';
      columns = 2;
      cardSpacing = 16;
      horizontalPadding = 24;
      showSidebar = false;
      maxContentWidth = Math.min(width - 48, 800);
    } else {
      type = 'mobile';
      columns = 1;
      cardSpacing = 12;
      horizontalPadding = 16;
      showSidebar = false;
      maxContentWidth = width - 32;
    }
    
    // Calculate card width based on available space
    const availableWidth = maxContentWidth - horizontalPadding * 2;
    const cardWidth = columns > 1 
      ? (availableWidth - cardSpacing * (columns - 1)) / columns
      : availableWidth;

    // Responsive size function
    const rs = (phone: number, tablet?: number, desktop?: number): number => {
      if (type === 'desktop' && desktop !== undefined) return desktop;
      if (type !== 'mobile' && tablet !== undefined) return tablet;
      return phone;
    };

    // Responsive font size - modest scaling for tablets
    const rfs = (baseSize: number): number => {
      if (type === 'desktop') return Math.round(baseSize * 1.15);
      if (type === 'tablet') return Math.round(baseSize * 1.08);
      return baseSize;
    };

    // Responsive spacing
    const rsp = (baseSpacing: number): number => {
      if (type === 'desktop') return Math.round(baseSpacing * 1.4);
      if (type === 'tablet') return Math.round(baseSpacing * 1.2);
      return baseSpacing;
    };

    // Content container style - centers content on tablets
    const contentContainerStyle: ViewStyle = {
      width: '100%',
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: horizontalPadding,
    };

    // Grid container style
    const gridContainerStyle: ViewStyle = {
      flexDirection: columns > 1 ? 'row' : 'column',
      flexWrap: 'wrap',
      gap: cardSpacing,
      justifyContent: columns > 1 ? 'flex-start' : 'center',
    };

    return {
      type,
      columns,
      cardSpacing,
      horizontalPadding,
      bottomPadding: 100, // Space for bottom tab navigation
      showSidebar,
      maxContentWidth,
      cardWidth,
      isTablet: type !== 'mobile',
      screenWidth: width,
      screenHeight: height,
      rs,
      rfs,
      rsp,
      contentContainerStyle,
      gridContainerStyle,
    };
  }, [width, height]);

  return layout;
};
