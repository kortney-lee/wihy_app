import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Ionicons } from './Ionicons';

// Design tokens for consistent styling
const BUTTON_SIZE = 40;
const ICON_SIZE = 24;
const BORDER_RADIUS = 20; // Full circle

interface NavigationButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CloseButton - Standard close (X) button with silhouette background
 * Use for modals, overlays, and dismissible content
 * Always positioned on the RIGHT side of headers
 */
export const CloseButton: React.FC<NavigationButtonProps> = ({
  onPress,
  style,
  iconColor = '#374151',
  size = 'md',
}) => {
  const buttonSize = size === 'sm' ? 32 : size === 'lg' ? 48 : BUTTON_SIZE;
  const iconSz = size === 'sm' ? 20 : size === 'lg' ? 28 : ICON_SIZE;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.closeButton,
        { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
        style,
      ]}
      accessibilityLabel="Close"
      accessibilityRole="button"
    >
      <Ionicons name="close" size={iconSz} color={iconColor} />
    </TouchableOpacity>
  );
};

/**
 * BackButton - Standard back arrow button with silhouette background
 * Use for navigation back within screens/modals
 * Can be positioned LEFT (default) or RIGHT based on design needs
 */
export const BackButton: React.FC<NavigationButtonProps> = ({
  onPress,
  style,
  iconColor = '#374151',
  size = 'md',
}) => {
  const buttonSize = size === 'sm' ? 32 : size === 'lg' ? 48 : BUTTON_SIZE;
  const iconSz = size === 'sm' ? 20 : size === 'lg' ? 28 : ICON_SIZE;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.backButton,
        { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
        style,
      ]}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={iconSz} color={iconColor} />
    </TouchableOpacity>
  );
};

/**
 * ModalHeader - Standard modal header with title and close button on right
 * Use this for consistent modal headers across the app
 */
interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showBackButton = false,
  onBack,
}) => {
  const { View, Text } = require('react-native');

  return (
    <View style={styles.modalHeader}>
      {showBackButton && onBack ? (
        <BackButton onPress={onBack} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.modalHeaderTitle}>{title}</Text>
      <CloseButton onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS,
    backgroundColor: '#f3f4f6', // Light gray silhouette background
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      },
    }),
  },
  backButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS,
    backgroundColor: '#f3f4f6', // Light gray silhouette background
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
});

export default { CloseButton, BackButton, ModalHeader };
