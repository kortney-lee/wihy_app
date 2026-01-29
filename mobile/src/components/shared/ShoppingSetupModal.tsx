/**
 * ShoppingSetupModal Component
 * 
 * Full-screen modal for progressive enhancement flow.
 * Guides user through: Zipcode → Store Selection → Confirmation
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { ZipcodeInput } from './ZipcodeInput';
import { StoreSelector } from './StoreSelector';
import { EnhancementStatus } from './EnhancementStatus';
import { useTheme } from '../../context/ThemeContext';
import type { AvailableStore, EnhancementLevel } from '../../services/mealService';

// ============================================
// TYPES
// ============================================

type SetupStep = 'zipcode' | 'stores' | 'confirm';

interface ShoppingSetupModalProps {
  visible: boolean;
  onClose: () => void;
  /** Current enhancement level (if enhancing existing plan) */
  currentLevel?: EnhancementLevel;
  /** Initial zipcode (if known) */
  initialZipcode?: string | null;
  /** Initial store (if known) */
  initialStore?: string | null;
  /** Available stores (if already fetched) */
  initialStores?: AvailableStore[];
  /** Called when zipcode is entered */
  onZipcodeSubmit: (zipcode: string) => Promise<AvailableStore[]>;
  /** Called when store is selected */
  onStoreSelect: (store: AvailableStore) => Promise<void>;
  /** Whether to skip directly to store selection if zipcode known */
  skipToStoreIfZipcodeKnown?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

// ============================================
// COMPONENT
// ============================================

export const ShoppingSetupModal: React.FC<ShoppingSetupModalProps> = ({
  visible,
  onClose,
  currentLevel,
  initialZipcode,
  initialStore,
  initialStores = [],
  onZipcodeSubmit,
  onStoreSelect,
  skipToStoreIfZipcodeKnown = true,
  loading = false,
  error,
}) => {
  const { theme } = useTheme();
  // State
  const [step, setStep] = useState<SetupStep>('zipcode');
  const [zipcode, setZipcode] = useState<string>(initialZipcode || '');
  const [stores, setStores] = useState<AvailableStore[]>(initialStores);
  const [selectedStore, setSelectedStore] = useState<AvailableStore | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Animation
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      // Determine starting step
      if (skipToStoreIfZipcodeKnown && initialZipcode && initialStores.length > 0) {
        setStep('stores');
        setZipcode(initialZipcode);
        setStores(initialStores);
      } else {
        setStep('zipcode');
      }
      setSelectedStore(null);
      setLocalError(null);

      // Animate in
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 9,
      }).start();
    }
  }, [visible, initialZipcode, initialStores, skipToStoreIfZipcodeKnown]);

  // Handlers
  const handleZipcodeSubmit = useCallback(async (zip: string) => {
    setLocalLoading(true);
    setLocalError(null);

    try {
      const availableStores = await onZipcodeSubmit(zip);
      setZipcode(zip);
      setStores(availableStores);
      setStep('stores');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to find stores');
    } finally {
      setLocalLoading(false);
    }
  }, [onZipcodeSubmit]);

  const handleStoreSelect = useCallback(async (store: AvailableStore) => {
    setSelectedStore(store);
    setLocalLoading(true);
    setLocalError(null);

    try {
      await onStoreSelect(store);
      setStep('confirm');
      // Auto-close after brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to select store');
      setSelectedStore(null);
    } finally {
      setLocalLoading(false);
    }
  }, [onStoreSelect, onClose]);

  const handleBack = useCallback(() => {
    if (step === 'stores') {
      setStep('zipcode');
      setStores([]);
    } else if (step === 'confirm') {
      setStep('stores');
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  // Computed
  const isLoading = loading || localLoading;
  const displayError = error || localError;
  const canGoBack = step !== 'zipcode';

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 'zipcode':
        return (
          <ZipcodeInput
            value={zipcode}
            onSubmit={handleZipcodeSubmit}
            loading={isLoading}
            error={displayError}
            onCancel={handleSkip}
          />
        );

      case 'stores':
        return (
          <View style={styles.storesContainer}>
            <View style={styles.storesHeader}>
              <Text style={styles.storesZipcode}>📍 {zipcode}</Text>
              <TouchableOpacity onPress={handleBack}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
            
            {displayError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            <StoreSelector
              stores={stores}
              selectedStoreId={selectedStore?.id}
              onSelectStore={handleStoreSelect}
              loading={isLoading}
              showEstimatedCost={true}
              showDistance={true}
            />

            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      case 'confirm':
        return (
          <View style={styles.confirmContainer}>
            <View style={styles.confirmIcon}>
              <Text style={styles.confirmIconText}>✅</Text>
            </View>
            <Text style={styles.confirmTitle}>Shopping Setup Complete!</Text>
            <Text style={styles.confirmDescription}>
              Your meal plan is now enhanced with real products from {selectedStore?.name}.
            </Text>
            
            <EnhancementStatus
              level="full"
              shoppingReady={true}
              canEnhance={false}
              postalCode={zipcode}
              storeName={selectedStore?.name}
            />

            <Text style={styles.confirmNote}>
              You can now order ingredients with one tap using Instacart.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {canGoBack ? (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton} />
          )}
          
          <Text style={styles.headerTitle}>
            {step === 'zipcode' ? 'Set Up Shopping' : 
             step === 'stores' ? 'Select Store' : 'Complete'}
          </Text>
          
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step !== 'zipcode' && styles.progressDotComplete]}>
            <Text style={styles.progressDotText}>📍</Text>
          </View>
          <View style={[styles.progressLine, step !== 'zipcode' && styles.progressLineComplete]} />
          <View style={[styles.progressDot, step === 'confirm' && styles.progressDotComplete]}>
            <Text style={styles.progressDotText}>🏪</Text>
          </View>
          <View style={[styles.progressLine, step === 'confirm' && styles.progressLineComplete]} />
          <View style={[styles.progressDot, step === 'confirm' && styles.progressDotComplete]}>
            <Text style={styles.progressDotText}>✓</Text>
          </View>
        </View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: slideAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

// ============================================
// STYLES
// ============================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    width: 60,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotComplete: {
    backgroundColor: '#E8F8EB',
  },
  progressDotText: {
    fontSize: 18,
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
  progressLineComplete: {
    backgroundColor: '#34C759',
  },
  content: {
    flex: 1,
  },
  // Stores step
  storesContainer: {
    flex: 1,
    padding: 16,
  },
  storesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  storesZipcode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  changeLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  errorBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 15,
  },
  // Confirm step
  confirmContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F8EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmIconText: {
    fontSize: 40,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  confirmNote: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
  },
});

export default ShoppingSetupModal;
