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
import { Ionicons } from './shared';
import { useTheme } from '../context/ThemeContext';
import { checkoutService } from '../services/checkoutService';
import { useAuth } from '../context/AuthContext';
import { 
  SUBSCRIPTION_PLANS, 
  ADD_ONS, 
  formatPrice,
  type PlanConfig,
  type AddOnConfig,
} from '../config/subscriptionConfig';
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

// Add color coding for UI
const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  pro_monthly: '#3b82f6',
  pro_yearly: '#3b82f6',
  family_basic: '#8b5cf6',
  family_pro: '#a855f7',
  family_yearly: '#a855f7',
  coach: '#f97316',
};

const ADDON_COLORS: Record<string, string> = {
  wihy_coach: '#8b5cf6',
  instacart: '#10b981',
};

// Convert config to UI-friendly format
const PLANS: Plan[] = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
  id: plan.id,
  displayName: plan.displayName,
  price: formatPrice(plan.yearlyPrice || plan.monthlyPrice, plan.interval),
  description: plan.tagline,
  features: plan.features,
  color: PLAN_COLORS[plan.id] || '#6b7280',
  recommended: plan.popular,
}));

export default function PlansModal({
  visible,
  onClose,
  onSelectPlan,
  onEnrollment,
  title = 'Upgrade to Access Features',
  subtitle = 'Choose a plan that works for you',
  showAddOns = false,
}: PlansModalProps) {
  const { theme } = useTheme();
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
    const configPlan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    
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
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Current Plan Info */}
          <View style={[styles.currentPlanBanner, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="information-circle" size={24} color="#2563eb" />
            <Text style={[styles.currentPlanText, { color: theme.colors.text }]}>
              You're on the Free plan. Upgrade to unlock advanced features.
            </Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'plans' && styles.tabActive, activeTab === 'plans' && { backgroundColor: theme.colors.surface }]}
              onPress={() => setActiveTab('plans')}
            >
              <Ionicons name="layers" size={18} color={activeTab === 'plans' ? '#3b82f6' : '#6b7280'} />
              <Text style={[styles.tabText, { color: theme.colors.textSecondary }, activeTab === 'plans' && styles.tabTextActive]}>Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'addons' && styles.tabActive, activeTab === 'addons' && { backgroundColor: theme.colors.surface }]}
              onPress={() => setActiveTab('addons')}
            >
              <Ionicons name="add-circle" size={18} color={activeTab === 'addons' ? '#3b82f6' : '#6b7280'} />
              <Text style={[styles.tabText, { color: theme.colors.textSecondary }, activeTab === 'addons' && styles.tabTextActive]}>Add-ons</Text>
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
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
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
                      <Text style={[styles.planName, { color: theme.colors.text }]}>{plan.displayName}</Text>
                      <Text style={[styles.planPrice, { color: theme.colors.text }]}>{plan.price}</Text>
                    </View>
                    <Text style={[styles.planDescription, { color: theme.colors.textSecondary }]}>{plan.description}</Text>
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
                      <Text style={[styles.featureText, { color: theme.colors.text }]}>{feature}</Text>
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
                  <Text style={[styles.addOnsTitle, { color: theme.colors.text }]}>Power-Up Add-ons</Text>
                  <Text style={[styles.addOnsSubtitle, { color: theme.colors.textSecondary }]}>
                    Add these features to any paid plan
                  </Text>
                </View>
                
                {Object.values(ADD_ONS).map((addon) => (
                  <Pressable
                    key={addon.id}
                    style={[styles.addOnCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => handleSelectPlan(addon.id)}
                  >
                    <View style={[styles.addOnIconContainer, { backgroundColor: ADDON_COLORS[addon.id] + '20' }]}>
                      <Ionicons name={addon.icon as any} size={28} color={ADDON_COLORS[addon.id]} />
                    </View>
                    <View style={styles.addOnInfo}>
                      <Text style={[styles.addOnName, { color: theme.colors.text }]}>{addon.displayName}</Text>
                      <Text style={[styles.addOnDescription, { color: theme.colors.textSecondary }]}>{addon.description}</Text>
                    </View>
                    <View style={styles.addOnPriceContainer}>
                      <Text style={[styles.addOnPrice, { color: theme.colors.text }]}>${addon.price.toFixed(2)}/mo</Text>
                      <TouchableOpacity
                        style={[styles.addOnButton, { backgroundColor: ADDON_COLORS[addon.id] }]}
                        onPress={() => handleSelectPlan(addon.id)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                ))}
                
                <View style={[styles.addOnsNote, { backgroundColor: theme.colors.background }]}>
                  <Ionicons name="information-circle-outline" size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.addOnsNoteText, { color: theme.colors.textSecondary }]}>
                    Add-ons require an active subscription. WIHY Coach: $9.99/mo, Instacart: $7.99/mo
                  </Text>
                </View>
              </>
            )}

            <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                • Cancel anytime{'\n'}
                • 7-day money-back guarantee{'\n'}
                • Secure payment processing
              </Text>
            </View>
          </ScrollView>

          {/* Loading Overlay */}
          {(initializingPurchases || purchasing) && (
            <View style={styles.loadingOverlay}>
              <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={[styles.loadingText, { color: theme.colors.text }]}>
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

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    ...(isWeb && { alignItems: 'center', justifyContent: 'center' }),
  },
  modalContent: {
    // backgroundColor: '#ffffff', // theme.colors.background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
    ...(isWeb && { 
      borderRadius: 24, 
      maxWidth: 600, 
      width: '95%',
      overflow: 'hidden',
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor: '#e5e7eb', // theme.colors.border
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    // color: theme.colors.text
  },
  headerSubtitle: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  currentPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // backgroundColor: '#dbeafe', // theme.colors.background
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  currentPlanText: {
    flex: 1,
    fontSize: 13,
    // color: '#1e40af', // theme.colors.text
    lineHeight: 18,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
    ...(isWeb && { maxHeight: '60vh', overflowY: 'auto' } as any),
  },
  planCard: {
    // backgroundColor: '#fff', // theme.colors.surface
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    // borderColor: '#e5e7eb', // theme.colors.border
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
    // color: theme.colors.text
  },
  planDescription: {
    fontSize: 13,
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    // color: '#3b82f6', // theme.colors.text
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
    // color: theme.colors.text
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
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
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
    // backgroundColor: '#ffffff', // theme.colors.surface
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.textSecondary
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
    // color: theme.colors.text
    marginBottom: 4,
  },
  addOnsSubtitle: {
    fontSize: 14,
    // color: theme.colors.textSecondary
  },
  addOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#fff', // theme.colors.surface
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    // borderColor: '#e5e7eb', // theme.colors.border
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
    // color: theme.colors.text
    marginBottom: 2,
  },
  addOnDescription: {
    fontSize: 13,
    // color: theme.colors.textSecondary
    lineHeight: 18,
  },
  addOnPriceContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  addOnPrice: {
    fontSize: 16,
    fontWeight: '700',
    // color: theme.colors.text
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
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  addOnsNoteText: {
    flex: 1,
    fontSize: 13,
    // color: theme.colors.textSecondary
    lineHeight: 18,
  },
  footer: {
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
  },
  footerText: {
    fontSize: 13,
    // color: theme.colors.textSecondary
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
    // backgroundColor: '#fff', // theme.colors.surface
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    // color: theme.colors.text
    fontWeight: '600',
  },
});
