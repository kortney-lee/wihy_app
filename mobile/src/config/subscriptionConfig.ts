/**
 * Subscription Configuration - Single Source of Truth
 * 
 * All plans, add-ons, and integrations defined here
 * Used by Profile.tsx, SubscriptionScreen, PlansModal, etc.
 * 
 * ⚠️ DO NOT hardcode prices anywhere else!
 * Import from this file to ensure consistency across web/mobile
 */

// ============= PLAN IDS =============
export type PlanId = 
  | 'free'
  | 'pro_monthly' 
  | 'pro_yearly'
  | 'family_basic'
  | 'family_pro'
  | 'family_yearly'
  | 'coach';

export type AddOnId = 
  | 'grocery_deals'
  | 'restaurant_partnerships';

export type IntegrationId =
  | 'instacart_meals'
  | 'workout_tracking';

// ============= SUBSCRIPTION PLANS =============

export interface PlanConfig {
  id: PlanId;
  name: string;
  displayName: string; // For UI
  monthlyPrice: number;
  yearlyPrice?: number;
  setupFee?: number;
  commission?: string; // For coach plan
  interval: 'month' | 'year';
  tagline: string;
  features: string[];
  icon: string;
  popular?: boolean;
  
  // Stripe Price IDs (from backend)
  stripePriceId?: {
    monthly?: string;
    yearly?: string;
  };
  
  // Native IAP Product IDs
  iapProductId?: {
    ios?: string;
    android?: string;
  };
}

export const SUBSCRIPTION_PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    interval: 'month',
    tagline: 'Get started with essential features',
    icon: 'gift',
    features: [
      'Barcode scanning',
      'Photo food analysis',
      'Medication tracking',
      'Basic health dashboard',
    ],
  },
  
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Premium',
    displayName: 'WIHY Premium',
    monthlyPrice: 12.99,
    interval: 'month',
    tagline: 'For individuals focused on their health journey',
    icon: 'person',
    stripePriceId: {
      monthly: 'price_1SqhOPCb0XQPUqHrLcjV8wID',
    },
    iapProductId: {
      ios: 'com.wihy.native.premium_monthly',
      android: 'com.wihy.native.premium_monthly',
    },
    features: [
      'Full nutrition and fitness tools',
      'Personal dashboard',
      'Meal planning and tracking',
      'Optional WIHY Coach (AI)',
    ],
  },
  
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Premium',
    displayName: 'WIHY Premium (Annual)',
    monthlyPrice: 8.33, // $99.99 / 12
    yearlyPrice: 99.99,
    interval: 'year',
    tagline: 'Save 20% with annual billing',
    icon: 'person',
    stripePriceId: {
      yearly: 'price_1SqhOQCb0XQPUqHrpJK9Mtmn',
    },
    iapProductId: {
      ios: 'com.wihy.native.premium_yearly',
      android: 'com.wihy.native.premium_yearly',
    },
    features: [
      'Full nutrition and fitness tools',
      'Personal dashboard',
      'Meal planning and tracking',
      'Optional WIHY Coach (AI)',
      'Save $56/year vs monthly',
    ],
  },
  
  family_basic: {
    id: 'family_basic',
    name: 'Family Basic',
    displayName: 'WIHY Family Basic',
    monthlyPrice: 24.99,
    interval: 'month',
    tagline: 'For households with up to 4 members',
    icon: 'people',
    stripePriceId: {
      monthly: 'price_1SqhORCb0XQPUqHrRVuN7Pbn',
    },
    iapProductId: {
      ios: 'com.wihy.native.family_basic_monthly',
      android: 'com.wihy.native.family_basic_monthly',
    },
    features: [
      'Up to 4 family members',
      'Shared parent/guardian dashboard',
      'Individual accounts for everyone',
      'Optional WIHY Coach (AI)',
    ],
  },
  
  family_pro: {
    id: 'family_pro',
    name: 'Family Pro',
    displayName: 'WIHY Family Pro',
    monthlyPrice: 49.99,
    interval: 'month',
    tagline: 'For entire households — no limits',
    icon: 'home',
    popular: true,
    stripePriceId: {
      monthly: 'price_1SqhOSCb0XQPUqHrWuJM9YbK',
    },
    iapProductId: {
      ios: 'com.wihy.native.family_pro_monthly',
      android: 'com.wihy.native.family_pro_monthly',
    },
    features: [
      'Up to 5 family members',
      'Every member gets their own login',
      'WIHY Coach (AI) included',
      'Instacart Pro included',
    ],
  },
  
  family_yearly: {
    id: 'family_yearly',
    name: 'Family Pro',
    displayName: 'WIHY Family Pro (Annual)',
    monthlyPrice: 39.99, // $479.99 / 12
    yearlyPrice: 479.99,
    interval: 'year',
    tagline: 'Save 20% with annual family plan',
    icon: 'home',
    stripePriceId: {
      yearly: 'price_1SqhOTCb0XQPUqHrGk8p2Vnm',
    },
    iapProductId: {
      ios: 'com.wihy.native.family_pro_yearly',
      android: 'com.wihy.native.family_pro_yearly',
    },
    features: [
      'Up to 5 family members',
      'Every member gets their own login',
      'WIHY Coach (AI) included',
      'Instacart Pro included',
      'Save $120/year vs monthly',
    ],
  },
  
  coach: {
    id: 'coach',
    name: 'Coach Platform',
    displayName: 'WIHY Coach Platform',
    monthlyPrice: 29.99,
    setupFee: 99.99,
    commission: '1%',
    interval: 'month',
    tagline: 'For health & fitness professionals',
    icon: 'fitness',
    stripePriceId: {
      monthly: 'price_1SqhOUCb0XQPUqHrzFCx7KLo',
    },
    features: [
      'Unlimited clients',
      'Meal plan and workout creation',
      'Progress tracking & reporting',
      'Full app access for yourself',
      'Up to 1% affiliate commission',
      'A team member will reach out for training',
    ],
  },
};

// ============= ADD-ONS ($4.99/mo) =============

export interface AddOnConfig {
  id: AddOnId;
  name: string;
  displayName: string;
  price: number;
  interval: 'month';
  description: string;
  features: string[];
  icon: string;
  stripePriceId: string;
}

export const ADD_ONS: Record<AddOnId, AddOnConfig> = {
  grocery_deals: {
    id: 'grocery_deals',
    name: 'Grocery Deals',
    displayName: 'Grocery Store Deals',
    price: 4.99,
    interval: 'month',
    description: 'Exclusive grocery store deals and discounts',
    icon: 'pricetag',
    stripePriceId: 'price_1SqhOSCb0XQPUqHrQwmDghSO',
    features: [
      'Weekly grocery coupons',
      'Store-specific deals',
      'Price match notifications',
    ],
  },
  
  restaurant_partnerships: {
    id: 'restaurant_partnerships',
    name: 'Restaurant Partnerships',
    displayName: 'Restaurant Discounts',
    price: 4.99,
    interval: 'month',
    description: 'Discounts at partner restaurants',
    icon: 'restaurant',
    stripePriceId: 'price_1SqhOTCb0XQPUqHrohVBqrPV',
    features: [
      '10-20% off at partner restaurants',
      'Exclusive menu items',
      'Priority reservations',
    ],
  },
};

// ============= INTEGRATIONS ($7.99/mo) =============

export interface IntegrationConfig {
  id: IntegrationId;
  name: string;
  displayName: string;
  price: number;
  interval: 'month';
  description: string;
  features: string[];
  icon: string;
  stripePriceId: string;
}

export const INTEGRATIONS: Record<IntegrationId, IntegrationConfig> = {
  instacart_meals: {
    id: 'instacart_meals',
    name: 'Instacart Meals Integration',
    displayName: 'Instacart Meals',
    price: 7.99,
    interval: 'month',
    description: 'Meal planning with Instacart delivery',
    icon: 'cart',
    stripePriceId: 'price_1SqhOTCb0XQPUqHrDk84eaVq',
    features: [
      'AI-powered meal suggestions',
      'Auto-generate shopping lists',
      'Direct Instacart ordering',
      'Recipe library access',
    ],
  },
  
  workout_tracking: {
    id: 'workout_tracking',
    name: 'Workout Tracking Integration',
    displayName: 'Fitness App Sync',
    price: 7.99,
    interval: 'month',
    description: 'Sync with fitness apps and wearables',
    icon: 'fitness',
    stripePriceId: 'price_1SqhOUCb0XQPUqHrncrXDc0c',
    features: [
      'Apple Watch sync',
      'Fitbit integration',
      'Garmin sync',
      'Workout history import',
    ],
  },
};

// ============= UPGRADE PATHS =============

export const UPGRADE_PATHS: Record<PlanId, PlanId[]> = {
  free: ['pro_monthly', 'pro_yearly', 'family_basic', 'family_pro', 'family_yearly'],
  pro_monthly: ['pro_yearly', 'family_basic', 'family_pro', 'family_yearly'],
  pro_yearly: ['family_basic', 'family_pro', 'family_yearly'],
  family_basic: ['family_pro', 'family_yearly'],
  family_pro: ['family_yearly'],
  family_yearly: [],
  coach: [], // Coach is separate track
};

// ============= HELPER FUNCTIONS =============

/**
 * Get formatted price string
 */
export function formatPrice(price: number, interval: 'month' | 'year' = 'month'): string {
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}/${interval === 'month' ? 'mo' : 'yr'}`;
}

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): PlanConfig | undefined {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Get add-on by ID
 */
export function getAddOn(addonId: AddOnId): AddOnConfig | undefined {
  return ADD_ONS[addonId];
}

/**
 * Get integration by ID
 */
export function getIntegration(integrationId: IntegrationId): IntegrationConfig | undefined {
  return INTEGRATIONS[integrationId];
}

/**
 * Get all plans as array
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Get all add-ons as array
 */
export function getAllAddOns(): AddOnConfig[] {
  return Object.values(ADD_ONS);
}

/**
 * Get all integrations as array
 */
export function getAllIntegrations(): IntegrationConfig[] {
  return Object.values(INTEGRATIONS);
}

/**
 * Get valid upgrade options for current plan
 */
export function getUpgradeOptions(currentPlan: PlanId): PlanConfig[] {
  const upgradeIds = UPGRADE_PATHS[currentPlan] || [];
  return upgradeIds.map(id => SUBSCRIPTION_PLANS[id]).filter(Boolean);
}

/**
 * Calculate total monthly cost with add-ons
 */
export function calculateTotalCost(
  planId: PlanId,
  addonIds: (AddOnId | IntegrationId)[] = []
): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  let total = plan.monthlyPrice;
  
  addonIds.forEach(id => {
    const addon = ADD_ONS[id as AddOnId];
    const integration = INTEGRATIONS[id as IntegrationId];
    if (addon) total += addon.price;
    if (integration) total += integration.price;
  });
  
  return total;
}

/**
 * Get price summary for display
 */
export function getPriceSummary(planId: PlanId): string {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) return '';
  
  if (plan.setupFee) {
    return `$${plan.setupFee.toFixed(2)} setup + ${formatPrice(plan.monthlyPrice)}`;
  }
  
  if (plan.yearlyPrice) {
    const savings = (plan.monthlyPrice * 12) - plan.yearlyPrice;
    return `${formatPrice(plan.yearlyPrice, 'year')} (save $${savings.toFixed(0)}/yr)`;
  }
  
  return formatPrice(plan.monthlyPrice);
}

// ============= EXPORTS =============

export default {
  SUBSCRIPTION_PLANS,
  ADD_ONS,
  INTEGRATIONS,
  UPGRADE_PATHS,
  formatPrice,
  getPlan,
  getAddOn,
  getIntegration,
  getAllPlans,
  getAllAddOns,
  getAllIntegrations,
  getUpgradeOptions,
  calculateTotalCost,
  getPriceSummary,
};
