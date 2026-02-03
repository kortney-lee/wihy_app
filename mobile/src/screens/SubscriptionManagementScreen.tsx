/**
 * Subscription Management Screen
 * 
 * Unified subscription management for both web (Stripe) and native (IAP)
 * Handles plans, add-ons, and upgrades
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../components/shared';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  subscriptionService,
  type SubscriptionPlan,
  type AddOn,
  type ActiveSubscription,
  type UpgradeOption,
} from '../services/subscriptionService';

const isWeb = Platform.OS === 'web';

interface Props {
  navigation: any;
}

export const SubscriptionManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Subscription data
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState<'plans' | 'addons'>('plans');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Load active subscription
      const subscription = user?.id
        ? await subscriptionService.getActiveSubscription(user.id)
        : null;
      setActiveSubscription(subscription);

      // Load available plans and add-ons
      const [plansData, addonsData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getAddons(),
      ]);

      setPlans(plansData);
      setAddons(addonsData);

      // If user has active subscription, load upgrade options
      if (subscription?.plan) {
        const upgrades = await subscriptionService.getUpgradeOptions(subscription.plan);
        setUpgradeOptions(upgrades);
      }
    } catch (error) {
      console.error('[SubscriptionManagement] Failed to load data:', error);
      Alert.alert('Error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user?.email) {
      Alert.alert('Login Required', 'Please login to subscribe');
      return;
    }

    setProcessing(true);
    try {
      if (isWeb) {
        // Web: Create Stripe checkout session
        const session = await subscriptionService.createCheckoutSession(
          planId as any,
          user.email
        );
        
        // Redirect to Stripe checkout
        if (typeof window !== 'undefined') {
          window.location.href = session.checkoutUrl;
        }
      } else {
        // Native: Use IAP
        Alert.alert(
          'Coming Soon',
          'In-app purchases will be available soon. Please use the web version to subscribe.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[SubscriptionManagement] Failed to create checkout:', error);
      Alert.alert('Error', 'Failed to start checkout');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpgrade = async (newPlanId: string) => {
    const subscriptionId = activeSubscription?.providerSubscriptionId || activeSubscription?.id;
    if (!subscriptionId) return;

    setProcessing(true);
    try {
      await subscriptionService.upgradeSubscription(subscriptionId, newPlanId as any);
      
      Alert.alert('Success', 'Your subscription has been upgraded!');
      await loadSubscriptionData();
    } catch (error) {
      console.error('[SubscriptionManagement] Failed to upgrade:', error);
      Alert.alert('Error', 'Failed to upgrade subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddAddon = async (addonId: string) => {
    if (!activeSubscription?.id) {
      Alert.alert('No Subscription', 'You need an active subscription to add this feature');
      return;
    }

    setProcessing(true);
    try {
      await subscriptionService.addAddon(activeSubscription.id, addonId as any);
      Alert.alert('Success', 'Add-on added to your subscription!');
      await loadSubscriptionData();
    } catch (error) {
      console.error('[SubscriptionManagement] Failed to add addon:', error);
      Alert.alert('Error', 'Failed to add add-on');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveAddon = async (subscriptionItemId: string) => {
    Alert.alert(
      'Remove Add-on',
      'Are you sure you want to remove this add-on from your subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await subscriptionService.removeAddon(subscriptionItemId);
              Alert.alert('Success', 'Add-on removed');
              await loadSubscriptionData();
            } catch (error) {
              console.error('[SubscriptionManagement] Failed to remove addon:', error);
              Alert.alert('Error', 'Failed to remove add-on');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleManageSubscription = async () => {
    if (!isWeb) {
      Alert.alert(
        'Manage Subscription',
        'Please manage your subscription through the App Store or Google Play Store',
        [{ text: 'OK' }]
      );
      return;
    }

    setProcessing(true);
    try {
      const portalUrl = await subscriptionService.getCustomerPortal();
      if (typeof window !== 'undefined') {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error('[SubscriptionManagement] Failed to open portal:', error);
      Alert.alert('Error', 'Failed to open subscription portal');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading subscription data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasActiveSubscription = activeSubscription?.status === 'active';
  const currentAddons = activeSubscription?.addons || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Subscription Status */}
        {hasActiveSubscription && (
          <View style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <View>
                <Text style={styles.currentPlanLabel}>Current Plan</Text>
                <Text style={styles.currentPlanName}>{activeSubscription.plan}</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            
            {activeSubscription.currentPeriodEnd && (
              <Text style={styles.renewalText}>
                Renews on {new Date(activeSubscription.currentPeriodEnd * 1000).toLocaleDateString()}
              </Text>
            )}

            <Pressable
              style={styles.manageButton}
              onPress={handleManageSubscription}
              disabled={processing}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
              <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
            </Pressable>
          </View>
        )}

        {/* Current Add-ons */}
        {currentAddons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Add-ons</Text>
            {currentAddons.map((addon) => (
              <View key={addon.id} style={styles.activeAddonCard}>
                <View style={styles.addonInfo}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>${addon.price.toFixed(2)}/mo</Text>
                </View>
                <Pressable
                  onPress={() => handleRemoveAddon(addon.subscriptionItemId)}
                  disabled={processing}
                >
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, selectedTab === 'plans' && styles.tabActive]}
            onPress={() => setSelectedTab('plans')}
          >
            <Text style={[styles.tabText, selectedTab === 'plans' && styles.tabTextActive]}>
              {hasActiveSubscription ? 'Upgrades' : 'Plans'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, selectedTab === 'addons' && styles.tabActive]}
            onPress={() => setSelectedTab('addons')}
          >
            <Text style={[styles.tabText, selectedTab === 'addons' && styles.tabTextActive]}>
              Add-ons
            </Text>
          </Pressable>
        </View>

        {/* Plans / Upgrades */}
        {selectedTab === 'plans' && (
          <View style={styles.section}>
            {hasActiveSubscription && upgradeOptions.length > 0 ? (
              <>
                <Text style={styles.sectionDescription}>
                  Upgrade your plan to unlock more features
                </Text>
                {upgradeOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    style={styles.planCard}
                    onPress={() => handleUpgrade(option.id)}
                    disabled={processing}
                  >
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{option.name}</Text>
                      <Text style={styles.planPrice}>
                        ${option.price.toFixed(2)}/{option.interval}
                      </Text>
                    </View>
                    <Ionicons name="arrow-up-circle" size={24} color="#4CAF50" />
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                {plans.map((plan) => (
                  <Pressable
                    key={plan.id}
                    style={styles.planCard}
                    onPress={() => handleSelectPlan(plan.id)}
                    disabled={processing}
                  >
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>
                        ${plan.price.toFixed(2)}/{plan.interval}
                      </Text>
                      <View style={styles.planFeatures}>
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <Text key={i} style={styles.featureText}>
                            • {feature}
                          </Text>
                        ))}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}

        {/* Add-ons */}
        {selectedTab === 'addons' && (
          <View style={styles.section}>
            <Text style={styles.sectionDescription}>
              Enhance your subscription with these add-ons
            </Text>
            {addons.map((addon) => {
              const isActive = currentAddons.some((a) => a.id === addon.id);
              return (
                <View key={addon.id} style={styles.addonCard}>
                  <View style={styles.addonContent}>
                    <Text style={styles.addonName}>{addon.name}</Text>
                    <Text style={styles.addonDescription}>{addon.description}</Text>
                    <Text style={styles.addonPrice}>
                      ${addon.price.toFixed(2)}/month
                    </Text>
                  </View>
                  {isActive ? (
                    <View style={styles.addedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.addedBadgeText}>Added</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.addButton}
                      onPress={() => handleAddAddon(addon.id)}
                      disabled={processing || !hasActiveSubscription}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0f2fe' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { flex: 1 },
  currentPlanCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentPlanLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  currentPlanName: { fontSize: 24, fontWeight: '700', color: '#333', textTransform: 'capitalize' },
  activeBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  renewalText: { fontSize: 14, color: '#666', marginBottom: 16 },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  manageButtonText: { fontSize: 16, fontWeight: '600', color: '#4CAF50' },
  section: { backgroundColor: '#fff', padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 12 },
  sectionDescription: { fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 20 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4CAF50' },
  tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#4CAF50', fontWeight: '600' },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  planPrice: { fontSize: 16, fontWeight: '700', color: '#4CAF50', marginBottom: 8 },
  planFeatures: { marginTop: 8 },
  featureText: { fontSize: 13, color: '#666', marginBottom: 4 },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addonContent: { flex: 1, marginRight: 16 },
  addonName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  addonDescription: { fontSize: 14, color: '#666', marginBottom: 8, lineHeight: 20 },
  addonPrice: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  addedBadge: { flexDirection: 'row', alignItems: 'center' },
  addedBadgeText: { marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  activeAddonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addonInfo: { flex: 1 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: { marginTop: 16, fontSize: 16, color: '#fff', fontWeight: '600' },
});
