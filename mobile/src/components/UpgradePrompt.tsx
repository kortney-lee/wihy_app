import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from './shared';
import { LinearGradient } from 'expo-linear-gradient';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: string;
  description?: string;
  requiredPlan?: string;
}

export function UpgradePrompt({
  visible,
  onClose,
  onUpgrade,
  feature,
  description,
  requiredPlan = 'Premium',
}: UpgradePromptProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.androidBlur} />
        
        <View style={styles.modalContainer}>
          <View style={styles.card}>
            {/* Icon Header */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.iconGradient}
              >
                <Ionicons name="lock-closed" size={32} color="#fff" />
              </LinearGradient>
            </View>

            {/* Content */}
            <Text style={styles.title}>Unlock {feature}</Text>
            <Text style={styles.description}>
              {description || `${feature} is available with ${requiredPlan} or higher.`}
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <BenefitItem
                icon="checkmark-circle"
                text="AI-powered meal planning"
              />
              <BenefitItem
                icon="checkmark-circle"
                text="Custom workout programs"
              />
              <BenefitItem
                icon="checkmark-circle"
                text="Advanced health tracking"
              />
              <BenefitItem
                icon="checkmark-circle"
                text="Family sharing (Family plans)"
              />
            </View>

            {/* Pricing */}
            <View style={styles.pricingContainer}>
              <Text style={styles.pricingText}>
                Starting at <Text style={styles.price}>$12.99</Text>/month
              </Text>
              <Text style={styles.savingsText}>Save 40% with annual plan</Text>
            </View>

            {/* Actions */}
            <Pressable
              style={styles.upgradeButton}
              onPress={() => {
                onClose();
                onUpgrade();
              }}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface BenefitItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name={icon} size={20} color="#10b981" />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  androidBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 420,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  pricingContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  pricingText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  savingsText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
});
