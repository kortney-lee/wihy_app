import React from 'react';
import { TouchableOpacity, Text, Image, Platform, ImageSourcePropType } from 'react-native';
import SvgIcon from './SvgIcon';

interface BackToHubButtonProps {
  /** The hub name to display (e.g., "Health Hub", "Coach Hub", "Family Hub") */
  hubName: string;
  /** Theme color for text and arrow icon */
  color: string;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether viewing on mobile web (screen width < 768px) */
  isMobileWeb: boolean;
  /** The spinner GIF image source - pass from parent to ensure bundler resolves it */
  spinnerGif: ImageSourcePropType;
}

/**
 * Reusable "Back to Hub" button component used across Health Hub, Coach Hub, and Family Hub.
 * Displays consistently with an arrow, hub name, and animated spinner GIF.
 * Only renders on web platform.
 */
export const BackToHubButton: React.FC<BackToHubButtonProps> = ({
  hubName,
  color,
  onPress,
  isMobileWeb,
  spinnerGif,
}) => {
  const isWeb = Platform.OS === 'web';
  
  if (!isWeb) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'absolute',
        top: isMobileWeb ? 12 : 40,
        right: isMobileWeb ? 12 : 24,
        zIndex: 99,
        flexDirection: 'row',
        alignItems: 'center',
        gap: isMobileWeb ? 6 : 10,
        paddingVertical: isMobileWeb ? 4 : 6,
        paddingLeft: isMobileWeb ? 8 : 12,
        paddingRight: isMobileWeb ? 4 : 6,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      } as any}
    >
      <SvgIcon name="arrow-back" size={isMobileWeb ? 14 : 16} color={color} />
      <Text style={{ fontSize: isMobileWeb ? 11 : 13, fontWeight: '600', color }}>{hubName}</Text>
      <Image 
        source={spinnerGif}
        resizeMode="cover"
        style={{
          width: isMobileWeb ? 28 : 36,
          height: isMobileWeb ? 28 : 36,
          borderRadius: isMobileWeb ? 14 : 18,
        }}
      />
    </TouchableOpacity>
  );
};

export default BackToHubButton;
