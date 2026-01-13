import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import ProductHighlight from './ProductHighlight';
import type { DetectedObject } from '../services/types';

interface ScanningModalProps {
  visible: boolean;
  imageUri: string | null;
  progress: number;
  message?: string;
  detectedObjects?: DetectedObject[];
  highlightColor?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ScanningModal Component
 * 
 * Displays the scanning progress with product highlighting
 * Similar to Appediet's analysis screen
 * 
 * Shows:
 * - Captured image with bounding box highlights
 * - Progress percentage and circular indicator
 * - Analysis status message
 */
export default function ScanningModal({
  visible,
  imageUri,
  progress,
  message = 'Analyzing...',
  detectedObjects,
  highlightColor = '#00ff00',
}: ScanningModalProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate progress
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Pulse animation for corner highlights
  useEffect(() => {
    if (visible && detectedObjects && detectedObjects.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, detectedObjects]);

  if (!visible || !imageUri) {
    return null;
  }

  const imageHeight = SCREEN_HEIGHT * 0.6;
  const imageWidth = SCREEN_WIDTH * 0.9;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Darkened background */}
        <View style={styles.backdrop} />
        
        {/* Main content */}
        <View style={styles.container}>
          {/* Product Image with Highlights */}
          <Animated.View 
            style={[
              styles.imageContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <ProductHighlight
              imageUri={imageUri}
              detectedObjects={detectedObjects}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              highlightColor={highlightColor}
              showCorners={true}
            />
          </Animated.View>

          {/* Progress Display */}
          <View style={styles.progressContainer}>
            {/* Circular Progress */}
            <View style={styles.circularProgress}>
              <ActivityIndicator size="large" color={highlightColor} />
            </View>

            {/* Percentage */}
            <Text style={styles.percentage}>{Math.round(progress)}%</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: highlightColor,
                  },
                ]}
              />
            </View>

            {/* Status Message */}
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  progressContainer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  circularProgress: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  percentage: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressBarContainer: {
    width: SCREEN_WIDTH * 0.7,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
  },
});
