import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from './shared';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getPlanDisplayName } from '../utils/capabilities';

/**
 * Development Plan Switcher
 * Allows testing different plan tiers and add-ons in development
 * REMOVE IN PRODUCTION
 */

type PlanType = 'free' | 'premium' | 'family-basic' | 'family-premium' | 'family-pro' | 'coach' | 'coach-family'
  | 'workplace-core' | 'workplace-plus' | 'corporate-enterprise' | 'k12-school' 
  | 'university' | 'hospital' | 'hospitality';

interface PlanOption {
  id: PlanType;
  displayName: string;
  price: string;
  description: string;
  color: string;
  category: 'consumer' | 'b2b';
}

const PLAN_OPTIONS: PlanOption[] = [
  // Consumer Plans
  {
    id: 'free',
    displayName: 'Free',
    price: '$0',
    description: 'No features (upgrade prompts)',
    color: '#6b7280',
    category: 'consumer',
  },
  {
    id: 'premium',
    displayName: 'Premium',
    price: '$12.99/mo',
    description: 'Meals + Workouts',
    color: '#3b82f6',
    category: 'consumer',
  },
  {
    id: 'family-basic',
    displayName: 'Family Basic',
    price: '$24.99/mo',
    description: 'Up to 4 members, add-ons available',
    color: '#8b5cf6',
    category: 'consumer',
  },
  {
    id: 'family-premium',
    displayName: 'Family Premium',
    price: '$34.99/mo',
    description: 'Unlimited members, AI + Instacart',
    color: '#a855f7',
    category: 'consumer',
  },
  {
    id: 'family-pro',
    displayName: 'Family Pro',
    price: '$29.99/mo',
    description: 'Up to 5 members, AI + Instacart',
    color: '#7c3aed',
    category: 'consumer',
  },
  {
    id: 'coach',
    displayName: 'Coach',
    price: '$29.99/mo',
    description: '1-to-1 coaching platform',
    color: '#f59e0b',
    category: 'consumer',
  },
  {
    id: 'coach-family',
    displayName: 'Coach + Family',
    price: '$64.97/mo',
    description: 'All features unlocked',
    color: '#10b981',
    category: 'consumer',
  },
  // B2B Plans
  {
    id: 'workplace-core',
    displayName: 'Workplace - Core',
    price: '$3/user',
    description: 'Employers (50-1K), AI included',
    color: '#3b82f6',
    category: 'b2b',
  },
  {
    id: 'workplace-plus',
    displayName: 'Workplace - Plus',
    price: '$5/user',
    description: 'Employers + families, AI included',
    color: '#2563eb',
    category: 'b2b',
  },
  {
    id: 'corporate-enterprise',
    displayName: 'Corporate Enterprise',
    price: '$7/user',
    description: 'Large employers (1K+), all features',
    color: '#1e40af',
    category: 'b2b',
  },
  {
    id: 'k12-school',
    displayName: 'K-12 Schools',
    price: '$1.50/student',
    description: 'Public & private schools, AI included',
    color: '#10b981',
    category: 'b2b',
  },
  {
    id: 'university',
    displayName: 'Universities',
    price: '$2.50/student',
    description: 'Colleges & universities, AI included',
    color: '#059669',
    category: 'b2b',
  },
  {
    id: 'hospital',
    displayName: 'Hospitals',
    price: '$4-6/user',
    description: 'Staff + patients, AI included',
    color: '#ef4444',
    category: 'b2b',
  },
  {
    id: 'hospitality',
    displayName: 'Hospitality',
    price: '$3-5/resident',
    description: 'Hotels, housing, military, AI included',
    color: '#f59e0b',
    category: 'b2b',
  },
];

export const DevPlanSwitcher: React.FC = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(user?.plan || 'free');
  const [selectedCategory, setSelectedCategory] = useState<'consumer' | 'b2b'>('consumer');
  const [aiAddOn, setAiAddOn] = useState(user?.addOns?.includes('ai') || false);
  const [instacartAddOn, setInstacartAddOn] = useState(user?.addOns?.includes('instacart') || false);

  const canUseDevTools = __DEV__ || user?.isDeveloper || user?.role === 'admin' || user?.userRole === 'admin';

  if (!user || !canUseDevTools) return null;

  const handleApply = async () => {
    const addOns: string[] = [];
    if (aiAddOn) addOns.push('ai');
    if (instacartAddOn) addOns.push('instacart');

    // Update plan and wait for state to propagate
    await updateUser({
      plan: selectedPlan,
      addOns,
    });

    setVisible(false);
    
    // Log for debugging
    console.log('[DevPlanSwitcher] Plan changed to:', selectedPlan, 'Add-ons:', addOns);
  };

  const canAddAI = ['premium', 'family-basic', 'coach'].includes(selectedPlan);
  const canAddInstacart = selectedPlan === 'family-basic';
  const hasAIIncluded = ['family-premium', 'coach-family', 'workplace-core', 'workplace-plus', 'corporate-enterprise', 'k12-school', 'university', 'hospital', 'hospitality'].includes(selectedPlan);
  const hasInstacartIncluded = ['family-premium', 'coach-family'].includes(selectedPlan);
  
  const filteredPlans = PLAN_OPTIONS.filter(plan => plan.category === selectedCategory);

  return (
    <>
      {/* Floating Dev Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="build" size={24} color="#fff" />
        <Text style={styles.floatingButtonText}>DEV</Text>
      </TouchableOpacity>

      {/* Plan Switcher Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>🛠️ Dev Plan Switcher</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={28} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {/* Current Plan Display */}
              <View style={styles.currentPlanCard}>
                <Text style={styles.currentPlanLabel}>Current Plan</Text>
                <Text style={styles.currentPlanName}>{getPlanDisplayName(user.plan)}</Text>
                {user.addOns && user.addOns.length > 0 && (
                  <Text style={styles.currentAddOns}>
                    Add-ons: {user.addOns.join(', ').toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Category Tabs */}
              <View style={styles.categoryTabs}>
                <TouchableOpacity
                  style={[
                    styles.categoryTab,
                    selectedCategory === 'consumer' && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory('consumer')}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === 'consumer' && styles.categoryTabTextActive,
                    ]}
                  >
                    Consumer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryTab,
                    selectedCategory === 'b2b' && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory('b2b')}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === 'b2b' && styles.categoryTabTextActive,
                    ]}
                  >
                    B2B / Enterprise
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Plan Options */}
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'consumer' ? 'Individual & Family Plans' : 'Organization Plans'}
              </Text>
              {filteredPlans.map(plan => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selectedPlan === plan.id && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  <View
                    style={[
                      styles.planColorBadge,
                      { backgroundColor: plan.color },
                    ]}
                  />
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.displayName}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </TouchableOpacity>
              ))}

              {/* Add-ons (only for consumer plans) */}
              {selectedCategory === 'consumer' && (
                <>
                  <Text style={styles.sectionTitle}>Add-ons</Text>

              {/* AI Add-on */}
              <View style={styles.addOnCard}>
                <View style={styles.addOnInfo}>
                  <Text style={styles.addOnName}>🤖 WIHY AI</Text>
                  <Text style={styles.addOnDescription}>
                    {hasAIIncluded
                      ? '✅ Included in plan'
                      : canAddAI
                      ? 'Available as add-on'
                      : '❌ Not available for this plan'}
                  </Text>
                </View>
                {!hasAIIncluded && (
                  <Switch
                    value={aiAddOn}
                    onValueChange={setAiAddOn}
                    disabled={!canAddAI}
                  />
                )}
              </View>

              {/* Instacart Add-on */}
              <View style={styles.addOnCard}>
                <View style={styles.addOnInfo}>
                  <Text style={styles.addOnName}>🛒 Instacart</Text>
                  <Text style={styles.addOnDescription}>
                    {hasInstacartIncluded
                      ? '✅ Included in plan'
                      : canAddInstacart
                      ? 'Available as add-on'
                      : '❌ Not available for this plan'}
                  </Text>
                </View>
                {!hasInstacartIncluded && (
                  <Switch
                    value={instacartAddOn}
                    onValueChange={setInstacartAddOn}
                    disabled={!canAddInstacart}
                  />
                )}
              </View>
                </>
              )}

              {/* B2B Note */}
              {selectedCategory === 'b2b' && (
                <View style={styles.b2bNote}>
                  <Text style={styles.b2bNoteTitle}>✅ B2B Plans Include:</Text>
                  <Text style={styles.b2bNoteText}>• WIHY Coach (AI) - Included</Text>
                  <Text style={styles.b2bNoteText}>• Admin Dashboard</Text>
                  <Text style={styles.b2bNoteText}>• Usage Analytics</Text>
                  <Text style={styles.b2bNoteText}>• Role Management</Text>
                  <Text style={styles.b2bNoteText}>• White-Label Ready</Text>
                </View>
              )}

              {/* Apply Button */}
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply Changes</Text>
              </TouchableOpacity>

              {/* Integration Test Button */}
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => {
                  setVisible(false);
                  // Navigate to IntegrationTest screen
                  (navigation as any).navigate('IntegrationTest');
                }}
              >
                <Text style={styles.testButtonText}>🧪 Run Integration Tests</Text>
              </TouchableOpacity>

              <Text style={styles.warningText}>
                ⚠️ This is a development tool. Remove before production.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: '#f59e0b',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  currentPlanCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 4,
  },
  currentAddOns: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  planColorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  planDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  addOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addOnDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  testButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  warningText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 20,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: '#fff',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryTabTextActive: {
    color: '#3b82f6',
  },
  b2bNote: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  b2bNoteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  b2bNoteText: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 4,
  },
});
