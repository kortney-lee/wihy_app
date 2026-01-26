import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Clipboard,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import SvgIcon from './SvgIcon';

interface Props {
  url: string;
  title?: string;
  style?: any;
}

export const InstacartLinkButton: React.FC<Props> = ({
  url,
  title = 'Open in Instacart',
  style,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback - offer to copy link
        Alert.alert(
          'Could not open link',
          'Would you like to copy the link instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Copy Link',
              onPress: () => {
                Clipboard.setString(url);
                Alert.alert('Link Copied', 'Paste in your browser to open Instacart');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to open Instacart link:', error);
      Alert.alert(
        'Could not open link',
        'Would you like to copy the link instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy Link',
            onPress: () => {
              Clipboard.setString(url);
              Alert.alert('Link Copied', 'Paste in your browser to open Instacart');
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = () => {
    Clipboard.setString(url);
    Alert.alert('Link Copied', 'Instacart shopping list link copied to clipboard');
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <SvgIcon name="cart" size={20} color="#fff" />
            <Text style={styles.text}>{title}</Text>
            <SvgIcon name="open" size={16} color="#fff" />
          </>
        )}
      </View>
      <Text style={styles.hint}>Long press to copy link</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#43B02A', // Instacart green
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  hint: {
    color: '#E8F5E4',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
