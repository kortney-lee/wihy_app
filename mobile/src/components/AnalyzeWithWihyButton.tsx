import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { SweepBorder } from './SweepBorder';
import { chatService } from '../services';
import { debugLogService } from '../services';

interface AnalyzeWithWihyButtonProps {
  /** Context to send to WiHy for analysis */
  cardContext: string;
  /** User query or question to analyze */
  userQuery?: string;
  /** Optional button text override */
  buttonText?: string;
  /** Use animated sweep border effect */
  animated?: boolean;
  /** Optional callback for parent to handle analyze - when provided, uses centralized chat approach */
  onAnalyze?: (userQuery: string, response: string) => void;
  /** Custom border radius */
  borderRadius?: number;
  /** Disable the button */
  disabled?: boolean;
}

/**
 * Reusable "Analyze with WiHy" button component that:
 * 1. Uses centralized chat (via onAnalyze callback) when available - PREFERRED
 * 2. Falls back to navigating to FullChat when no onAnalyze callback provided
 * 3. Optionally displays animated sweep border effect
 */
const AnalyzeWithWihyButton: React.FC<AnalyzeWithWihyButtonProps> = ({
  cardContext,
  userQuery = 'Analyze this data',
  buttonText = 'Analyze with WiHy',
  animated = true,
  onAnalyze,
  borderRadius = 24,
  disabled = false,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeWithWihy = useCallback(async () => {
    if (isAnalyzing || disabled) return;

    setIsAnalyzing(true);
    debugLogService.userAction('Analyze with WiHy pressed', { userQuery, hasCallback: !!onAnalyze }, 'AnalyzeWithWihyButton');

    try {
      const searchQuery = `${userQuery}. Context: ${cardContext}`;

      if (onAnalyze) {
        // PREFERRED: Use parent's centralized chat system
        debugLogService.info('Using centralized chat approach via onAnalyze callback', undefined, 'AnalyzeWithWihyButton');
        
        try {
          // Call chatService for analysis
          const result = await chatService.ask(searchQuery);
          const formattedResult = result?.response || 'Analysis completed';
          onAnalyze(userQuery, formattedResult);
        } catch (error) {
          debugLogService.error('Chat service failed', { error: (error as Error).message }, 'AnalyzeWithWihyButton');
          // Fallback to just passing context
          onAnalyze(userQuery, cardContext);
        }
      } else {
        // FALLBACK: Navigate to FullChat screen
        debugLogService.info('Navigating to FullChat - no onAnalyze callback', undefined, 'AnalyzeWithWihyButton');
        
        navigation.navigate('FullChat', {
          context: {
            query: searchQuery,
            type: 'analyze',
            timestamp: new Date(),
          },
          initialMessage: searchQuery,
        });
      }
    } catch (error) {
      debugLogService.error('Analyze with WiHy failed', { error: (error as Error).message }, 'AnalyzeWithWihyButton');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, disabled, userQuery, cardContext, onAnalyze, navigation]);

  const buttonContent = (
    <TouchableOpacity
      onPress={handleAnalyzeWithWihy}
      disabled={isAnalyzing || disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        { borderRadius: animated ? borderRadius - 2 : borderRadius },
        (isAnalyzing || disabled) && styles.buttonDisabled,
      ]}
    >
      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#fa5f06" />
          <Text style={styles.buttonText}>Analyzing...</Text>
        </View>
      ) : (
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {buttonText}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (animated && !disabled) {
    return (
      <View style={styles.container}>
        <SweepBorder
          borderWidth={2}
          radius={borderRadius}
          durationMs={2500}
          colors={['#fa5f06', '#f97316', '#fbbf24', '#fa5f06']}
          backgroundColor="#ffffff"
        >
          {buttonContent}
        </SweepBorder>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.staticBorder, { borderRadius }]}>
        {buttonContent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fa5f06',
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staticBorder: {
    borderWidth: 2,
    borderColor: '#fa5f06',
    overflow: 'hidden',
  },
});

export default AnalyzeWithWihyButton;
