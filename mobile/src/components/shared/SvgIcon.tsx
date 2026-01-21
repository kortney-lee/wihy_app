import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface SvgIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * SvgIcon component - uses Ionicons which work on both native and web
 * 
 * Ionicons (@expo/vector-icons) has full web support and renders correctly 
 * in both development and production builds.
 * 
 * The previous SVG-based approach had issues with react-native-svg not 
 * bundling properly for web production builds. Ionicons are vector-based
 * and work perfectly across all platforms.
 */
const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 24, color = '#000', style }) => {
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
};

export default SvgIcon;
