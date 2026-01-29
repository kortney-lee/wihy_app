import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from './shared';

interface LockedFeatureButtonProps {
  message: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary';
}

/**
 * Locked Feature Button
 * Shows an upgrade prompt for locked features (AI, Instacart, etc.)
 */
export const LockedFeatureButton: React.FC<LockedFeatureButtonProps> = ({
  message,
  onPress,
  icon = 'lock-closed',
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPrimary ? styles.containerPrimary : styles.containerSecondary,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            isPrimary ? styles.iconContainerPrimary : styles.iconContainerSecondary,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={isPrimary ? '#3b82f6' : '#6b7280'}
          />
        </View>
        <Text
          style={[
            styles.message,
            isPrimary ? styles.messagePrimary : styles.messageSecondary,
          ]}
        >
          {message}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={isPrimary ? '#3b82f6' : '#9ca3af'}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  containerPrimary: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  containerSecondary: {
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderColor: '#e5e7eb',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerPrimary: {
    backgroundColor: '#dbeafe',
  },
  iconContainerSecondary: {
    // // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  messagePrimary: {
    color: '#1e40af',
  },
  messageSecondary: {
    color: '#4b5563',
  },
});
