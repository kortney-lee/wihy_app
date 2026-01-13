import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  RoundedRect,
  SweepGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

type SweepBorderSkiaProps = {
  /** Border thickness */
  borderWidth?: number;
  /** Corner radius */
  radius?: number;
  /** Animation duration in ms (one full rotation) */
  durationMs?: number;
  /** Gradient colors for the sweep */
  colors?: string[];
  /** Background color inside the border */
  backgroundColor?: string;
  /** Width of the component */
  width: number;
  /** Height of the component */
  height: number;
  /** Children to render inside */
  children: React.ReactNode;
};

/**
 * High-performance animated sweep border using Skia + Reanimated
 * Renders at 60fps on the GPU/UI thread
 */
export function SweepBorderSkia({
  borderWidth = 2,
  radius = 28,
  durationMs = 2500,
  colors = ['#4f46e5', '#22d3ee', '#a855f7', '#4f46e5'],
  backgroundColor = '#ffffff',
  width,
  height,
  children,
}: SweepBorderSkiaProps) {
  // Animated rotation value using Reanimated (runs on UI thread)
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: durationMs,
        easing: Easing.linear,
      }),
      -1, // infinite
      false // don't reverse
    );
  }, [durationMs]);

  // Derive the start angle for Skia (bridges Reanimated -> Skia)
  const startAngle = useDerivedValue(() => {
    return rotation.value;
  }, [rotation]);

  // Center point for the sweep gradient
  const center = useMemo(() => vec(width / 2, height / 2), [width, height]);

  const innerRadius = Math.max(0, radius - borderWidth);

  return (
    <View style={{ width, height }}>
      {/* Skia Canvas for the animated border */}
      <Canvas style={[StyleSheet.absoluteFill, { width, height }]}>
        {/* Outer rounded rect with sweep gradient */}
        <RoundedRect
          x={0}
          y={0}
          width={width}
          height={height}
          r={radius}
        >
          <SweepGradient c={center} colors={colors} start={startAngle} />
          <BlurMask blur={0.5} style="solid" />
        </RoundedRect>

        {/* Inner rounded rect (punch out the center) */}
        <RoundedRect
          x={borderWidth}
          y={borderWidth}
          width={width - borderWidth * 2}
          height={height - borderWidth * 2}
          r={innerRadius}
          color={backgroundColor}
        />
      </Canvas>

      {/* Children container */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            margin: borderWidth,
            borderRadius: innerRadius,
            overflow: 'hidden',
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default SweepBorderSkia;
