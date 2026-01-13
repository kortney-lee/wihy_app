/**
 * Capabilities & Feature Access Utilities
 * 
 * This file manages plan-based capabilities and feature access control.
 * Replaces the old role-based system with a more flexible plan-based approach.
 */

import { User } from '../context/AuthContext';

/**
 * User capabilities based on their subscription plan
 */
export interface Capabilities {
  // Core Features
  meals: boolean;           // Meal planning access
  workouts: boolean;        // Workout plans access
  family: boolean;          // Family dashboard access
  coachPlatform: boolean;   // Coach dashboard access
  wihyAI: boolean;          // WIHY Coach (AI) assistant
  instacart: boolean;       // Instacart Pro integration
  
  // B2B/Enterprise Features
  adminDashboard: boolean;  // Organization admin dashboard
  usageAnalytics: boolean;  // Usage reporting & analytics
  roleManagement: boolean;  // User role assignment
  whiteLabel: boolean;      // White-label customization
}

/**
 * Plan capability definitions
 * Maps each plan tier to its included capabilities
 */
export const PLAN_CAPABILITIES: Record<string, Capabilities> = {
  // Consumer Plans
  free: {
    meals: false,
    workouts: false,
    family: false,
    coachPlatform: false,
    wihyAI: false,
    instacart: false,
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
  },
  premium: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: false,
    wihyAI: false,      // Available as add-on
    instacart: false,   // Not available
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
  },
  'family-basic': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: false,      // Available as add-on
    instacart: false,   // Available as add-on
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
  },
  'family-premium': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: true,       // INCLUDED
    instacart: true,    // INCLUDED
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
  },
  coach: {
    meals: true,
    workouts: true,
    family: false,      // NOT included (coaches work 1-to-1)
    coachPlatform: true,
    wihyAI: false,      // Available as add-on
    instacart: false,   // Not needed for coach platform
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
  },
  'coach-family': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: true,
    wihyAI: true,       // Included via Family Premium
    instacart: true,    // Included via Family Premium
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
  },
  
  // B2B/Enterprise Plans (all include AI + admin features)
  'workplace-core': {
    meals: true,
    workouts: true,
    family: false,      // Employees only
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
  },
  'workplace-plus': {
    meals: true,
    workouts: true,
    family: true,       // Employees + household
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
  },
  'corporate-enterprise': {
    meals: true,
    workouts: true,
    family: true,       // Employees + families
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
  },
  'k12-school': {
    meals: true,
    workouts: true,
    family: false,      // Students only
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
  },
  'university': {
    meals: true,
    workouts: true,
    family: false,      // Students only
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
  },
  'hospital': {
    meals: true,
    workouts: true,
    family: false,      // Staff + patients
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
  },
  'hospitality': {
    meals: true,
    workouts: true,
    family: false,      // Residents
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
  },
};

/**
 * Compute final capabilities from plan + add-ons
 * 
 * @param plan - User's subscription plan
 * @param addOns - Optional add-ons purchased (e.g., ['ai', 'instacart'])
 * @returns Complete capabilities object
 */
export const getPlanCapabilities = (
  plan: string,
  addOns: string[] = []
): Capabilities => {
  // Start with base plan capabilities
  const base = { ...(PLAN_CAPABILITIES[plan] || PLAN_CAPABILITIES.free) };
  
  // Apply add-ons
  if (addOns.includes('ai')) {
    base.wihyAI = true;
  }
  if (addOns.includes('instacart')) {
    base.instacart = true;
  }
  
  return base;
};

/**
 * Check if user has a specific capability
 * 
 * @param user - Current user object
 * @param capability - Capability to check
 * @returns true if user has the capability
 */
export const hasCapability = (
  user: User | null,
  capability: keyof Capabilities
): boolean => {
  if (!user?.capabilities) return false;
  return user.capabilities[capability] === true;
};

/**
 * Convenience function: Check if user has coach platform access
 */
export const hasCoachAccess = (user: User | null): boolean => {
  return hasCapability(user, 'coachPlatform');
};

/**
 * Convenience function: Check if user has family dashboard access
 */
export const hasFamilyAccess = (user: User | null): boolean => {
  return hasCapability(user, 'family');
};

/**
 * Convenience function: Check if user has WIHY Coach (AI) access
 */
export const hasAIAccess = (user: User | null): boolean => {
  return hasCapability(user, 'wihyAI');
};

/**
 * Convenience function: Check if user has meals feature
 */
export const hasMealsAccess = (user: User | null): boolean => {
  return hasCapability(user, 'meals');
};

/**
 * Convenience function: Check if user has workouts feature
 */
export const hasWorkoutsAccess = (user: User | null): boolean => {
  return hasCapability(user, 'workouts');
};

/**
 * Convenience function: Check if user has Instacart integration
 */
export const hasInstacartAccess = (user: User | null): boolean => {
  return hasCapability(user, 'instacart');
};

/**
 * Convenience function: Check if user has admin dashboard access (B2B)
 */
export const hasAdminAccess = (user: User | null): boolean => {
  return hasCapability(user, 'adminDashboard');
};

/**
 * Convenience function: Check if user has usage analytics access
 */
export const hasAnalyticsAccess = (user: User | null): boolean => {
  return hasCapability(user, 'usageAnalytics');
};

/**
 * Check if this is a B2B plan
 */
export const isB2BPlan = (plan: string): boolean => {
  return [
    'workplace-core',
    'workplace-plus',
    'corporate-enterprise',
    'k12-school',
    'university',
    'hospital',
    'hospitality',
  ].includes(plan);
};

/**
 * Get display name for a plan
 */
export const getPlanDisplayName = (plan: string): string => {
  const displayNames: Record<string, string> = {
    // Consumer Plans
    'free': 'Free',
    'premium': 'Premium',
    'family-basic': 'Family Basic',
    'family-premium': 'Family Premium',
    'coach': 'Coach Platform',
    'coach-family': 'Coach + Family',
    // B2B Plans
    'workplace-core': 'Workplace Wellness - Core',
    'workplace-plus': 'Workplace Wellness - Plus',
    'corporate-enterprise': 'Corporate Enterprise',
    'k12-school': 'K-12 Schools',
    'university': 'Universities',
    'hospital': 'Hospitals / Health Systems',
    'hospitality': 'Hospitality / Housing',
  };
  return displayNames[plan] || 'Unknown Plan';
};

/**
 * Get available dashboards for a user based on capabilities
 */
export const getAvailableDashboards = (user: User | null): Array<'personal' | 'family' | 'coach' | 'admin'> => {
  if (!user) return ['personal'];
  
  const dashboards: Array<'personal' | 'family' | 'coach' | 'admin'> = ['personal'];
  
  if (hasFamilyAccess(user)) {
    dashboards.push('family');
  }
  
  if (hasCoachAccess(user)) {
    dashboards.push('coach');
  }
  
  if (hasAdminAccess(user)) {
    dashboards.push('admin');
  }
  
  return dashboards;
};

/**
 * Check if user can upgrade to a feature
 * (Feature is not included but can be added as optional)
 */
export const canUpgradeTo = (
  user: User | null,
  feature: 'ai' | 'instacart'
): boolean => {
  if (!user) return false;
  
  // Already has the feature
  if (feature === 'ai' && hasAIAccess(user)) return false;
  if (feature === 'instacart' && hasInstacartAccess(user)) return false;
  
  // Check if feature is available as add-on for this plan
  if (feature === 'ai') {
    // AI available as add-on for: premium, family-basic, coach
    return ['premium', 'family-basic', 'coach'].includes(user.plan);
  }
  
  if (feature === 'instacart') {
    // Instacart available as add-on for: family-basic only
    return user.plan === 'family-basic';
  }
  
  return false;
};

/**
 * Get upgrade message for locked features
 */
export const getUpgradeMessage = (
  user: User | null,
  feature: 'ai' | 'instacart'
): string => {
  if (!user) return 'Sign in to access this feature';
  
  if (feature === 'ai') {
    if (canUpgradeTo(user, 'ai')) {
      return 'Add WIHY Coach (AI) for personalized guidance';
    }
    return 'Upgrade to Family Premium or Coach + Family to get AI included';
  }
  
  if (feature === 'instacart') {
    if (canUpgradeTo(user, 'instacart')) {
      return 'Add Instacart Pro for one-click grocery ordering';
    }
    return 'Upgrade to Family Premium or Coach + Family to get Instacart included';
  }
  
  return 'Upgrade to access this feature';
};

/**
 * Helper for migrating old userRole to new plan system
 * @deprecated - Use plan-based capabilities instead
 */
export const migrateUserRoleToPlan = (
  userRole?: 'user' | 'coach' | 'parent' | 'admin'
): User['plan'] => {
  if (!userRole || userRole === 'user') return 'premium';
  if (userRole === 'coach') return 'coach';
  if (userRole === 'parent') return 'family-basic';
  if (userRole === 'admin') return 'coach-family'; // Admin gets everything
  return 'free';
};
