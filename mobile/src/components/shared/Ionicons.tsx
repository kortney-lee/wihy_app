/**
 * Ionicons Wrapper - Cross-platform icon component
 * 
 * This is a drop-in replacement for @expo/vector-icons Ionicons.
 * It automatically uses SVG on web and native Ionicons on mobile.
 * 
 * Usage:
 *   // Replace this:
 *   import { Ionicons } from '@expo/vector-icons';
 *   
 *   // With this:
 *   import { Ionicons } from '../components/shared/Ionicons';
 *   // or
 *   import { Ionicons } from '../components/shared';
 */

import React from 'react';
import { Platform } from 'react-native';

// Import SVG paths from SvgIcon
import SvgIcon from './SvgIcon';

// Only import Ionicons on native platforms to prevent font preloading on web
let ExpoIonicons: any = null;
if (Platform.OS !== 'web') {
  ExpoIonicons = require('@expo/vector-icons').Ionicons;
}

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * Cross-platform Ionicons component
 * - On web: Uses inline SVG for reliable production rendering
 * - On mobile: Uses native Ionicons from @expo/vector-icons
 */
const IoniconsComponent: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  // On web, use SvgIcon (inline SVG) for reliable rendering
  if (Platform.OS === 'web') {
    return <SvgIcon name={name} size={size} color={color} style={style} />;
  }

  // On mobile, use native Ionicons
  if (ExpoIonicons) {
    return <ExpoIonicons name={name as any} size={size} color={color} style={style} />;
  }
  
  // Fallback - should never reach here on mobile
  return <SvgIcon name={name} size={size} color={color} style={style} />;
};

// Create a type that includes glyphMap for type compatibility
type IoniconsType = React.FC<IconProps> & {
  glyphMap: Record<string, number>;
};

// Create the component with glyphMap attached
export const Ionicons = IoniconsComponent as IoniconsType;

// Only attach glyphMap if available (native platforms)
if (ExpoIonicons?.glyphMap) {
  Ionicons.glyphMap = ExpoIonicons.glyphMap;
} else {
  // Provide empty glyphMap for web
  Ionicons.glyphMap = {};
}

export default Ionicons;
