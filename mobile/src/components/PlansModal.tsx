import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkoutService } from '../services/checkoutService';
import { useAuth } from '../context/AuthContext';
// import { purchaseService } from '../services/purchaseService'; // Requires production build

// Map plan IDs to in-app purchase product IDs
// In-app purchases require a production build (EAS Build)
// For development in Expo Go, we'll show the UI without actual purchases

interface Plan {
  id: string;
  displayName: string;
  price: string;
  description: string;
  features: string[];
  color: string;
  recommended?: boolean;
}

interface PlansModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
  onEnrollment?: (type: 'coach' | 'family') => void;
  title?: string;
  subtitle?: string;
  showAddOns?: boolean;
}

interface AddOn {
  id: string;
  displayName: string;
  price: string;
  description: string;
  icon: string;
  color: string;
}

const ADD_ONS: AddOn[] = [
  {
    id: 'ai-coach',
    displayName: 'AI Coach',
    price: '$4.99/mo',
    description: 'Personalized AI health coaching & recommendations',
    icon: 'sparkles',
    color: '#8b5cf6',
  },
  {
    id: 'instacart',
    displayName: 'Instacart Integration',
    price: '$4.99/mo',
    description: 'Auto-order groceries from your meal plans',
    icon: 'cart',
    color: '#10b981',
  },
];

const PLANS: Plan[] = [
  {
    id: 'free',
    displayName: 'Free',
    price: '$0/mo',
    description: 'Essential features to get started',
    features: [
      'Barcode scanning',
      'Photo food analysis',
      'Medication tracking',
      'Basic health dashboard',
      'Browse coaches',
    ],
    color: '#6b7280',
  },
  {
    id: 'pro_monthly',
    displayName: 'Premium',
    price: '$12.99/mo',
    description: 'Meals + Workouts',
    features: [
      'Unlimited barcode scanning',
      'Full health dashboard',
      'Meal planning',
      'Workout programs',
      'Priority support',
    ],
    color: '#3b82f6',
  },
  {
    id: 'family_basic',
    displayName: 'Family Basic',
    price: '$24.99/mo',
    description: 'Up to 4 members, add-ons available',
    features: [
      'All Premium features',
      'Up to 4 family members',
      'Family dashboard',
      'AI Coach add-on ($4.99/mo)',
      'Instacart add-on ($9.99/mo)',
    ],
    color: '#8b5cf6',
  },
  {
    id: 'family_pro',
    displayName: 'Family Pro',
    price: '$49.99/mo',
    description: 'Unlimited members, AI + Instacart included',
    features: [
      'All Premium features',
      'Unlimited family members',
      'Family dashboard',
      '🤖 AI Coach included',
      '🛒 Instacart included',
      'Priority support',
    ],
    color: '#a855f7',
    recommended: true,
  },
  {
    id: 'coach',
    displayName: 'Coach',
    price: '$99.99 setup + $29.99/mo',
    description: 'For health & fitness professionals',
    features: [
      'Unlimited clients',
      'Meal plan & workout creation',
      'Progress tracking & reporting',
      'Full app access for yourself',
      'Up to 1% affiliate commission',
      'A team member will reach out for training',
    ],
    color: '#f97316',
  },
];

export default function PlansModal({
  visible,
  onClose,
  onSelectPlan,
  onEnrollment,
  title = 'Upgrade to Access Features',
  subtitle = 'Choose a plan that works for you',
  showAddOns = false,
}: PlansModalProps) {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState(false);
  const [initializingPurchases, setInitializingPurchases] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'addons'>(showAddOns ? 'addons' : 'plans');

  useEffect(() => {
    if (visible) {
      initializePurchases();
    }
  }, [visible]);

  const initializePurchases = async () => {
    // In production build, this would initialize expo-in-app-purchases
    // For Expo Go development, we skip this step
    setInitializingPurchases(false);
  };

  const handleSelectPlan = async (planId: string) => {
    const selectedPlan = PLANS.find(p => p.id === planId);
    
    // Free plan - no payment needed, just close modal
    if (planId === 'free') {
      onClose();
      if (onSelectPlan) {
        onSelectPlan(planId);
      }
      Alert.alert(
        'Free Plan',
        'You are on the Free plan. Enjoy the basic features or upgrade anytime to unlock more!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if this is a family or coach plan that requires enrollment
    if (planId === 'coach') {
      onClose();
      if (onEnrollment) {
        onEnrollment('coach');
      }
      return;
    }
    
    if (planId.includes('family')) {
      onClose();
      if (onEnrollment) {
        onEnrollment('family');
      }
      return;
    }
    
    // Use web checkout for web platform
    if (Platform.OS === 'web') {
      setPurchasing(true);
      try {
        // Map plan IDs to checkout service plan IDs
        const checkoutPlanMap: Record<string, string> = {
          'premium': 'premium',
          'family-basic': 'family_basic',
          'family-premium': 'family_premium',
          'coach': 'coach',
        };
        
        const checkoutPlanId = checkoutPlanMap[planId] || planId;
        const userEmail = user?.email || '';
        const result = await checkoutService.initiateCheckout(checkoutPlanId, userEmail);
        
        if (result.success && result.checkoutUrl) {
          // Open Stripe checkout in new tab
          if (typeof window !== 'undefined') {
            window.open(result.checkoutUrl, '_blank');
          } else {
            await Linking.openURL(result.checkoutUrl);
          }
          onClose();
        } else {
          Alert.alert('Error', result.error || 'Failed to start checkout');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to start checkout. Please try again.');
      } finally {
        setPurchasing(false);
      }
      return;
    }
    
    // Native in-app purchases require production build
    Alert.alert(
      'Subscription Upgrade',
      `You selected: ${selectedPlan?.displayName || planId}\n\n` +
      'In-app purchases require a production build.\n\n' +
      'To enable purchases:\n' +
      '1. Run: npx eas build\n' +
      '2. Configure product IDs in App Store Connect / Google Play Console\n' +
      '3. Test in TestFlight or Internal Testing',
      [
        { text: 'OK', onPress: () => onClose() }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Current Plan Info */}
          <View style={styles.currentPlanBanner}>
            <Ionicons name="information-circle" size={24} color="#2563eb" />
            <Text style={styles.currentPlanText}>
              You're on the Free plan. Upgrade to unlock advanced features.
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'plans' && styles.tabActive]}
              onPress={() => setActiveTab('plans')}
            >
              <Ionicons name="layers" size={18} color={activeTab === 'plans' ? '#3b82f6' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'plans' && styles.tabTextActive]}>Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'addons' && styles.tabActive]}
              onPress={() => setActiveTab('addons')}
            >
              <Ionicons name="add-circle" size={18} color={activeTab === 'addons' ? '#3b82f6' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'addons' && styles.tabTextActive]}>Add-ons</Text>
            </TouchableOpacity>
          </View>

          {/* Plans List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'plans' && PLANS.map((plan) => (
              <Pressable
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.recommended && styles.planCardRecommended,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
              >
                {plan.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View
                    style={[styles.planColorBadge, { backgroundColor: plan.color }]}
                  />
                  <View style={styles.planHeaderText}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.planName}>{plan.displayName}</Text>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                    </View>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={plan.color}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    { backgroundColor: plan.color },
                    plan.recommended && styles.selectButtonRecommended,
                  ]}
                  onPress={() => handleSelectPlan(plan.id)}
                >
                  <Text style={styles.selectButtonText}>
                    Select {plan.displayName}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </Pressable>
            ))}

            {/* Add-ons Tab Content */}
            {activeTab === 'addons' && (
              <>
                <View style={styles.addOnsHeader}>
                  <Text style={styles.addOnsTitle}>Power Up Your Experience</Text>
                  <Text style={styles.addOnsSubtitle}>
                    Add these features to any paid plan
                  </Text>
                </View>
                
                {ADD_ONS.map((addon) => (
                  <Pressable
                    key={addon.id}
                    style={styles.addOnCard}
                    onPress={() => handleSelectPlan(addon.id)}
                  >
                    <View style={[styles.addOnIconContainer, { backgroundColor: addon.color + '20' }]}>
                      <Ionicons name={addon.icon as any} size={28} color={addon.color} />
                    </View>
                    <View style={styles.addOnInfo}>
                      <Text style={styles.addOnName}>{addon.displayName}</Text>
                      <Text style={styles.addOnDescription}>{addon.description}</Text>
                    </View>
                    <View style={styles.addOnPriceContainer}>
                      <Text style={styles.addOnPrice}>{addon.price}</Text>
                      <TouchableOpacity
                        style={[styles.addOnButton, { backgroundColor: addon.color }]}
                        onPress={() => handleSelectPlan(addon.id)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                ))}
                
                <View style={styles.addOnsNote}>
                  <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
                  <Text style={styles.addOnsNoteText}>
                    Add-ons require an active subscription. Family Premium includes both add-ons.
                  </Text>
                </View>
              </>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                • Cancel anytime{'\n'}
                • 7-day money-back guarantee{'\n'}
                • Secure payment processing
              </Text>
            </View>
          </ScrollView>

          {/* Loading Overlay */}
          {(initializingPurchases || purchasing) && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>
                  {initializingPurchases ? 'Loading plans...' : 'Processing purchase...'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  currentPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#dbeafe',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  currentPlanText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardRecommended: {
    borderColor: '#a855f7',
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#a855f7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planColorBadge: {
    width: 12,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
  },
  planHeaderText: {
    flex: 1,
  },
  planTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  planDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  selectButtonRecommended: {
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  // Add-ons
  addOnsHeader: {
    marginBottom: 16,
  },
  addOnsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  addOnsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addOnIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  addOnDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  addOnPriceContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  addOnPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addOnButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOnsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  addOnsNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
});
