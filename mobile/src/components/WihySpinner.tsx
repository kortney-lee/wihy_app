import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Image } from 'react-native';

interface WihySpinnerProps {
  size?: number;
  style?: ViewStyle;
}

/**
 * WihySpinner - A branded spinning logo component
 * Replaces the whatishealthyspinner.gif with an animated version
 */
export const WihySpinner: React.FC<WihySpinnerProps> = ({ size = 60, style }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.Image
        source={require('../../assets/Favicon.png')}
        style={[
          styles.image,
          { width: size, height: size, transform: [{ rotate: spin }] },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 30,
  },
});

export default WihySpinner;
