/**
 * WIHY Plan Selector Component
 * 
 * Displays available subscription plans with pricing and features.
 * Handles plan selection and checkout initiation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useCheckout, formatPlanPrice, getMonthlyPrice, isUpgrade } from '../../hooks/usePayment';
import { useAuth } from '../../context/AuthContext';
import { Plan, WIHY_PLANS } from '../../services/checkoutService';
import SvgIcon from '../shared/SvgIcon';

// ============= TYPES =============

interface PlanSelectorProps {
  onPlanSelected?: (plan: Plan) => void;
  onCheckoutSuccess?: () => void;
  onCheckoutCancel?: () => void;
  showFreeOption?: boolean;
  highlightPlan?: string;
  compact?: boolean;
}

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  isCurrentPlan: boolean;
  onSelect: () => void;
  compact?: boolean;
}

// ============= PLAN CARD COMPONENT =============

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected,
  isCurrentPlan,
  onSelect,
  compact = false,
}) => {
  const isWeb = Platform.OS === 'web';

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        isSelected && styles.planCardSelected,
        plan.popular && styles.planCardPopular,
        compact && styles.planCardCompact,
        isWeb && styles.planCardWeb,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Popular badge */}
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      {/* Plan header */}
      <View style={styles.planHeader}>
        <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
          {plan.displayName}
        </Text>
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text style={[styles.price, isSelected && styles.priceSelected]}>
          {plan.price === 0 ? 'Free' : formatPlanPrice(plan)}
        </Text>
        {plan.interval === 'year' && plan.price > 0 && (
          <Text style={styles.monthlyEquivalent}>
            ({getMonthlyPrice(plan)})
          </Text>
        )}
      </View>

      {/* Savings badge */}
      {plan.savings && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>{plan.savings}</Text>
        </View>
      )}

      {/* Description */}
      <Text style={styles.planDescription}>{plan.description}</Text>

      {/* Features list */}
      {!compact && (
        <View style={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <SvgIcon 
                name="checkmark-circle" 
                size={16} 
                color={isSelected ? '#0AAE5E' : '#6B7280'} 
              />
              <Text style={[styles.featureText, isSelected && styles.featureTextSelected]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Selection indicator */}
      <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorSelected]}>
        {isSelected && <SvgIcon name="checkmark-circle" size={24} color="#0AAE5E" />}
      </View>
    </TouchableOpacity>
  );
};

// ============= PLAN SELECTOR COMPONENT =============

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  onPlanSelected,
  onCheckoutSuccess,
  onCheckoutCancel,
  showFreeOption = true,
  highlightPlan,
  compact = false,
}) => {
  const { user } = useAuth();
  const { loading, plans, selectedPlan, error, selectPlan, checkout, clearError } = useCheckout();
  const [checkingOut, setCheckingOut] = useState(false);
  const isWeb = Platform.OS === 'web';

  // Filter plans based on props
  const displayPlans = plans.filter(plan => 
    showFreeOption || plan.id !== 'free'
  );

  // Auto-select highlighted plan
  useEffect(() => {
    if (highlightPlan && !selectedPlan) {
      selectPlan(highlightPlan);
    }
  }, [highlightPlan]);

  const handleSelectPlan = (plan: Plan) => {
    selectPlan(plan.id);
    onPlanSelected?.(plan);
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      showAlert('Please Select a Plan', 'Choose a subscription plan to continue.');
      return;
    }

    if (selectedPlan.id === 'free') {
      // Free plan doesn't need checkout
      onCheckoutSuccess?.();
      return;
    }

    if (!user?.email) {
      showAlert('Email Required', 'Please sign in to subscribe.');
      return;
    }

    setCheckingOut(true);
    clearError();

    try {
      const result = await checkout(user.email);

      if (result.success) {
        onCheckoutSuccess?.();
      } else if (result.canceled) {
        onCheckoutCancel?.();
      } else {
        showAlert('Checkout Failed', result.error || 'Please try again.');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setCheckingOut(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (isWeb) {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const currentPlanId = user?.plan || 'free';
  const canUpgrade = selectedPlan && isUpgrade(currentPlanId, selectedPlan.id);

  return (
    <View style={[styles.container, isWeb && styles.containerWeb]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Unlock the full power of WIHY AI
        </Text>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.dismissError}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Plans grid/list */}
      <ScrollView
        style={styles.plansScroll}
        contentContainerStyle={[
          styles.plansContainer,
          isWeb && styles.plansContainerWeb,
        ]}
        horizontal={!isWeb && !compact}
        showsHorizontalScrollIndicator={false}
      >
        {displayPlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan?.id === plan.id}
            isCurrentPlan={currentPlanId === plan.id}
            onSelect={() => handleSelectPlan(plan)}
            compact={compact}
          />
        ))}
      </ScrollView>

      {/* Checkout button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!selectedPlan || selectedPlan.id === 'free') && styles.checkoutButtonDisabled,
            checkingOut && styles.checkoutButtonLoading,
          ]}
          onPress={handleCheckout}
          disabled={!selectedPlan || selectedPlan.id === 'free' || checkingOut}
        >
          {checkingOut ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.checkoutButtonText}>
              {selectedPlan?.id === 'free' 
                ? 'Continue with Free' 
                : canUpgrade 
                  ? `Upgrade to ${selectedPlan?.displayName}` 
                  : selectedPlan 
                    ? `Subscribe to ${selectedPlan.displayName}` 
                    : 'Select a Plan'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.secureText}>
          🔒 Secure payment powered by Stripe
        </Text>
      </View>
    </View>
  );
};

// ============= STYLES =============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  containerWeb: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  dismissError: {
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 12,
  },
  plansScroll: {
    flex: 1,
  },
  plansContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  plansContainerWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  planCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 280,
    maxWidth: 320,
    position: 'relative',
  },
  planCardWeb: {
    flex: 1,
    minWidth: 280,
    maxWidth: 360,
  },
  planCardCompact: {
    minWidth: 'auto',
    marginRight: 0,
  },
  planCardSelected: {
    borderColor: '#0AAE5E',
    backgroundColor: '#F0FDF4',
  },
  planCardPopular: {
    borderColor: '#0AAE5E',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#0AAE5E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  planNameSelected: {
    color: '#0AAE5E',
  },
  currentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  priceSelected: {
    color: '#0AAE5E',
  },
  monthlyEquivalent: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  savingsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  savingsText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
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
  featureTextSelected: {
    color: '#111827',
  },
  selectIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  selectIndicatorSelected: {
    borderColor: '#0AAE5E',
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutButton: {
    backgroundColor: '#0AAE5E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  checkoutButtonLoading: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secureText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
  },
});

export default PlanSelector;
