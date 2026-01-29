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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '../components/shared';
import { RootStackParamList } from '../types/navigation';

// Subscription plans for native - matches backend plan keys
const NATIVE_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0/month',
    description: 'Essential features to get started',
  },
  {
    id: 'pro_monthly',
    name: 'Premium',
    price: '$12.99/month',
    description: 'Full access to all health tracking features',
  },
  {
    id: 'family_basic',
    name: 'Family Basic',
    price: '$24.99/month',
    description: 'Health tracking for the whole family',
  },
  {
    id: 'family_pro',
    name: 'Family Pro',
    price: '$49.99/month',
    description: 'Complete family wellness solution',
    popular: true,
  },
  {
    id: 'coach',
    name: 'Coach',
    price: '$99.99 setup + $29.99/mo',
    description: 'For health & fitness professionals',
    features: [
      'Unlimited clients',
      'Meal plan & workout creation',
      'Progress tracking & reporting',
      'Up to 1% affiliate commission',
      'A team member will reach out for training',
    ],
  },
];

type SubscriptionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Subscription'
>;

interface Props {
  navigation: SubscriptionScreenNavigationProp;
}

// Native Subscription Screen (Android/iOS)
export const NativeSubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (planId: string) => {
    // Free plan - no payment needed
    if (planId === 'free') {
      Alert.alert(
        'Free Plan',
        'You are on the Free plan. Enjoy the basic features or upgrade anytime!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setPurchasing(true);
    try {
      // TODO: Integrate with expo-in-app-purchases when installed
      // For now, show info alert
      Alert.alert(
        'Coming Soon',
        'In-app purchases will be available in the next update. Thank you for your interest!',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Purchases',
      'Purchase restoration will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Premium Features</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Premium Benefits</Text>
          {['Unlimited barcode scans', 'Advanced nutrition analysis', 'Personalized health insights', 'Priority support', 'Ad-free experience'].map((benefit, i) => (
            <View key={i} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Plans</Text>
          {NATIVE_PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.productCard,
                selectedPlan === plan.id && styles.productCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              disabled={purchasing}
            >
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.productTitle}>{plan.name}</Text>
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Popular</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.productDescription}>{plan.description}</Text>
              </View>
              <View style={styles.productPricing}>
                <Text style={styles.productPrice}>{plan.price}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </Pressable>
          ))}
        </View>

        {selectedPlan && (
          <Pressable
            style={styles.subscribeButton}
            onPress={() => handlePurchase(selectedPlan)}
            disabled={purchasing}
          >
            <Text style={styles.subscribeButtonText}>
              {purchasing ? 'Processing...' : 'Subscribe Now'}
            </Text>
          </Pressable>
        )}

        {Platform.OS === 'ios' && (
          <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={purchasing}>
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </Pressable>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period.</Text>
          <Text style={styles.footerText}>Payment will be charged to your App Store or Google Play account.</Text>
        </View>
      </ScrollView>

      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.purchasingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0f2fe' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { flex: 1 },
  benefitsSection: { backgroundColor: '#fff', padding: 20, marginBottom: 16 },
  section: { backgroundColor: '#fff', padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 16 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitText: { fontSize: 16, color: '#333', marginLeft: 12 },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  productCardSelected: { backgroundColor: '#f0fdf4', borderRadius: 8, marginHorizontal: -8, paddingHorizontal: 8 },
  productInfo: { flex: 1, marginRight: 16 },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  productTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  productDescription: { fontSize: 14, color: '#666', lineHeight: 20 },
  productPricing: { flexDirection: 'row', alignItems: 'center' },
  productPrice: { fontSize: 18, fontWeight: '700', color: '#4CAF50', marginRight: 8 },
  popularBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  popularBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  subscribeButton: { backgroundColor: '#4CAF50', padding: 16, marginHorizontal: 20, marginVertical: 16, borderRadius: 12, alignItems: 'center' },
  subscribeButtonText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  restoreButton: { backgroundColor: '#fff', padding: 16, marginHorizontal: 20, marginBottom: 16, borderRadius: 8, alignItems: 'center' },
  restoreButtonText: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  footer: { padding: 20, paddingBottom: 40 },
  footerText: { fontSize: 12, color: '#999', lineHeight: 18, marginBottom: 8 },
  purchasingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  purchasingText: { marginTop: 16, fontSize: 16, color: '#fff', fontWeight: '600' },
});
