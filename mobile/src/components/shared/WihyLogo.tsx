import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WihyLogoProps {
  size?: number;
  style?: ViewStyle;
  variant?: 'default' | 'gradient';
}

/**
 * WIHY.aI Logo Component
 * Renders the waveform/heartbeat style logo with blue and orange gradient
 * Supports both native (React Native SVG) and web (SVG)
 */
export const WihyLogo: React.FC<WihyLogoProps> = ({ 
  size = 64, 
  style,
  variant = 'default'
}) => {
  return (
    <View style={style}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 120 64"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="wihyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
            <Stop offset="50%" stopColor="#2563eb" stopOpacity="1" />
            <Stop offset="100%" stopColor="#f97316" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Waveform/Heartbeat line */}
        <Path
          d="M 5 32 L 15 32 L 18 24 L 22 40 L 26 20 L 30 44 L 34 28 L 38 36 L 42 28 L 46 40 L 50 24 L 54 44 L 58 20 L 62 40 L 66 32 L 75 32"
          stroke={variant === 'gradient' ? 'url(#wihyGradient)' : '#3b82f6'}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Optional accent dots at endpoints */}
        <circle cx="5" cy="32" r="1.5" fill="#3b82f6" />
        <circle cx="75" cy="32" r="1.5" fill="#f97316" />
      </Svg>
    </View>
  );
};

/**
 * Web-only SVG version for HTML rendering
 */
export const WihyLogoSvg: React.FC<{
  size?: number;
  className?: string;
  variant?: 'default' | 'gradient';
}> = ({ size = 64, className, variant = 'default' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 64"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="wihyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="50%" stopColor="#2563eb" stopOpacity="1" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Waveform/Heartbeat line */}
      <path
        d="M 5 32 L 15 32 L 18 24 L 22 40 L 26 20 L 30 44 L 34 28 L 38 36 L 42 28 L 46 40 L 50 24 L 54 44 L 58 20 L 62 40 L 66 32 L 75 32"
        stroke={variant === 'gradient' ? 'url(#wihyGradient)' : '#3b82f6'}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Optional accent dots at endpoints */}
      <circle cx="5" cy="32" r="1.5" fill="#3b82f6" />
      <circle cx="75" cy="32" r="1.5" fill="#f97316" />
    </svg>
  );
};

export default WihyLogo;
