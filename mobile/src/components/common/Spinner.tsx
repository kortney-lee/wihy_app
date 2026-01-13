import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { colors } from '../../theme/design-tokens';

interface SpinnerProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  progress?: number;
  type?: 'circle' | 'dots' | 'pulse';
  overlay?: boolean;
  onRequestClose?: () => void;
}

const { width, height } = Dimensions.get('window');

// Animated Dot Component
const AnimatedDot = ({ delay }: { delay: number }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity,
          transform: [{ scale }],
          backgroundColor: 'white',
        },
      ]}
    />
  );
};

// Animated Pulse Component
const AnimatedPulse = () => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.stagger(800, [
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse1, {
              toValue: 1,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(pulse1, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse2, {
              toValue: 1,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(pulse2, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };
    animate();
  }, [pulse1, pulse2]);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulse,
          {
            opacity: pulse1,
            transform: [
              {
                scale: pulse1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulse,
          {
            opacity: pulse2,
            transform: [
              {
                scale: pulse2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

export default function Spinner({
  visible = false,
  title = 'Loading...',
  subtitle,
  progress,
  type = 'circle',
  overlay = false,
  onRequestClose,
}: SpinnerProps) {
  // Non-overlay inline spinner
  if (!overlay) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    );
  }

  // Overlay modal spinner
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <BlurView style={styles.blurOverlay} blurType="dark" blurAmount={10}>
        <View style={styles.content}>
          {/* Loading Animation */}
          {type === 'circle' && (
            <ActivityIndicator size="large" color="white" />
          )}

          {type === 'dots' && (
            <View style={styles.dotsContainer}>
              <AnimatedDot delay={0} />
              <AnimatedDot delay={300} />
              <AnimatedDot delay={600} />
            </View>
          )}

          {type === 'pulse' && <AnimatedPulse />}

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Subtitle */}
          {subtitle && <Text style={styles.overlaySubtitle}>{subtitle}</Text>}

          {/* Progress bar */}
          {typeof progress === 'number' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, progress))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

// Loading indicator for use in lists or content areas
export function InlineSpinner({
  size = 'small',
  color = colors.primary,
  text,
}: {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}) {
  return (
    <View style={styles.inlineSpinner}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={[styles.inlineText, { color }]}>{text}</Text>
      )}
    </View>
  );
}

// Page loading overlay
export function PageSpinner({
  visible,
  text = 'Loading...',
}: {
  visible: boolean;
  text?: string;
}) {
  if (!visible) {return null;}

  return (
    <View style={styles.pageSpinner}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.pageSpinnerText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Inline spinner styles
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  inlineSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },

  // Overlay spinner styles
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 32,
    margin: 20,
    minWidth: 200,
    maxWidth: width * 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  overlaySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Animation styles
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Progress bar styles
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },

  // Page spinner styles
  pageSpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pageSpinnerText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});
