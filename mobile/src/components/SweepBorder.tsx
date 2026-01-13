import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

type SweepBorderProps = {
  borderWidth?: number;     // thickness of border
  radius?: number;          // outer radius
  durationMs?: number;      // sweep speed
  colors?: readonly [string, string, ...string[]];
  children: React.ReactNode;
  backgroundColor?: string; // inner fill (white)
};

export function SweepBorder({
  borderWidth = 2,
  radius = 28,
  durationMs = 2500,
  colors: colorsProp = ['#4f46e5', '#22d3ee', '#a855f7', '#ec4899', '#4f46e5'] as const,
  backgroundColor = '#ffffff',
  children,
}: SweepBorderProps) {
  // Animation value for rotation (0 to 1)
  const progress = useSharedValue(0);

  useEffect(() => {
    // Smooth continuous animation
    progress.value = withRepeat(
      withTiming(1, {
        duration: durationMs,
        easing: Easing.linear,
      }),
      -1, // infinite
      false // don't reverse
    );
  }, [durationMs]);

  // Animated style for the gradient position (creates sweep effect)
  const animatedStyle = useAnimatedStyle(() => {
    const angle = interpolate(progress.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${angle}deg` }],
    };
  });

  const innerRadius = Math.max(0, radius - borderWidth);

  return (
    <View style={[styles.container, { borderRadius: radius }]}>
      {/* Rotating conic-like gradient using multiple layers */}
      <Animated.View style={[styles.gradientWrapper, animatedStyle]}>
        {/* Single gradient that creates sweep illusion */}
        <LinearGradient
          colors={[...colorsProp, colorsProp[0]]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Inner content with background */}
      <View
        style={[
          styles.inner,
          {
            margin: borderWidth,
            borderRadius: innerRadius,
            backgroundColor,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  gradientWrapper: {
    ...StyleSheet.absoluteFillObject,
    // Make the gradient larger so rotation doesn't show corners
    margin: -150,
    padding: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    width: 500,
    height: 500,
  },
  inner: {
    zIndex: 1,
  },
});
