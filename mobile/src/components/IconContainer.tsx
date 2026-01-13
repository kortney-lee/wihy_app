import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Standardized Icon Container Component
 * Ensures consistent icon sizing, centering, and styling across the app
 */

export interface IconContainerProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  backgroundColor?: string;
  containerSize?: number;  // Size of the circular background
  style?: any;
}

export const IconContainer: React.FC<IconContainerProps> = ({
  name,
  size = 24,
  color = '#ffffff',
  backgroundColor = 'rgba(0,0,0,0.1)',
  containerSize = 56,
  style,
}) => {
  return (
    <View style={[
      styles.container,
      {
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize / 2,
        backgroundColor,
      },
      style,
    ]}>
      <Ionicons 
        name={name} 
        size={size} 
        color={color}
      />
    </View>
  );
};

/**
 * Small Icon Container
 * For minor icons and badges (32x32)
 */
export const SmallIconContainer: React.FC<Omit<IconContainerProps, 'containerSize'>> = (props) => (
  <IconContainer {...props} containerSize={32} />
);

/**
 * Medium Icon Container
 * For dashboard cards and regular components (56x56)
 */
export const MediumIconContainer: React.FC<Omit<IconContainerProps, 'containerSize'>> = (props) => (
  <IconContainer {...props} containerSize={56} />
);

/**
 * Large Icon Container
 * For featured sections and hero icons (80x80)
 */
export const LargeIconContainer: React.FC<Omit<IconContainerProps, 'containerSize'>> = (props) => (
  <IconContainer {...props} containerSize={80} />
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
