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
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';

// Import SVG paths from SvgIcon
import SvgIcon from './SvgIcon';

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
  return <ExpoIonicons name={name as any} size={size} color={color} style={style} />;
};

// Attach glyphMap for type compatibility with existing code that uses `Ionicons.glyphMap`
// This allows code like `keyof typeof Ionicons.glyphMap` to work correctly
type IoniconsType = React.FC<IconProps> & {
  glyphMap: typeof ExpoIonicons.glyphMap;
};

export const Ionicons = IoniconsComponent as IoniconsType;
Ionicons.glyphMap = ExpoIonicons.glyphMap;

export default Ionicons;
