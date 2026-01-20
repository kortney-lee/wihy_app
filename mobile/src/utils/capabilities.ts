/**
 * Capabilities & Feature Access Utilities
 * 
 * This file manages plan-based capabilities and feature access control.
 * Replaces the old role-based system with a more flexible plan-based approach.
 * 
 * @see PLAN_FEATURES_MATRIX.md for complete feature comparison
 */

import { User } from '../context/AuthContext';

/**
 * User capabilities based on their subscription plan
 */
export interface Capabilities {
  // Core Features
  meals: boolean;              // Can view/access meal plans
  workouts: boolean;           // Can view/access workout plans
  family: boolean;             // Has family features
  familyMembers?: number;      // Max family members (3 or 5)
  
  // Coach Platform
  coachPlatform: boolean;      // Has coach features
  clientManagement?: boolean;  // Can manage clients
  
  // AI & Integrations
  wihyAI: boolean;             // Has AI coach (included or add-on available)
  instacart: boolean;          // Can use Instacart integration
  
  // Analytics & Export
  progressTracking: 'basic' | 'advanced';
  dataExport: boolean;         // Can export data
  
  // API & Development
  apiAccess: boolean;          // Has API access
  webhooks: boolean;           // Can use webhooks
  
  // B2B/Enterprise Features
  adminDashboard: boolean;     // Organization admin dashboard
  usageAnalytics: boolean;     // Usage reporting & analytics
  roleManagement: boolean;     // User role assignment
  whiteLabel: boolean;         // White-label customization
  
  // Communication
  communication: 'none' | 'limited' | 'full';
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
    progressTracking: 'basic',
    dataExport: false,
    apiAccess: false,
    webhooks: false,
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
    communication: 'limited',
  },
  premium: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: false,
    wihyAI: false,      // Available as add-on ($4.99/mo)
    instacart: false,
    progressTracking: 'advanced',
    dataExport: false,
    apiAccess: false,
    webhooks: false,
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
    communication: 'full',
  },
  'family-basic': {
    meals: true,
    workouts: true,
    family: true,
    familyMembers: 3,
    coachPlatform: false,
    wihyAI: false,      // Available as add-on ($4.99/mo)
    instacart: false,
    progressTracking: 'advanced',
    dataExport: false,
    apiAccess: false,
    webhooks: false,
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
    communication: 'full',
  },
  'family-pro': {
    meals: true,
    workouts: true,
    family: true,
    familyMembers: 5,
    coachPlatform: false,
    wihyAI: false,      // Available as add-on ($4.99/mo)
    instacart: true,    // INCLUDED
    progressTracking: 'advanced',
    dataExport: true,   // INCLUDED
    apiAccess: false,
    webhooks: false,
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
    communication: 'full',
  },
  // Alias for family-pro (used in some screens)
  'family-premium': {
    meals: true,
    workouts: true,
    family: true,
    familyMembers: 5,
    coachPlatform: false,
    wihyAI: false,
    instacart: true,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: false,
    webhooks: false,
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
    communication: 'full',
  },
  coach: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: true,
    clientManagement: true,
    wihyAI: true,       // INCLUDED for coaches
    instacart: true,    // INCLUDED for coaches
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,    // API access for coaches
    webhooks: true,     // Webhook notifications
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
    communication: 'full',
  },
  'coach-family': {
    meals: true,
    workouts: true,
    family: true,
    familyMembers: 5,
    coachPlatform: true,
    clientManagement: true,
    wihyAI: true,
    instacart: true,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: false,
    usageAnalytics: false,
    roleManagement: false,
    whiteLabel: false,
    communication: 'full',
  },
  
  // Admin Plan - Full access to everything (for role: 'admin')
  admin: {
    meals: true,
    workouts: true,
    family: true,
    familyMembers: 10,        // Admin gets extra capacity
    coachPlatform: true,
    clientManagement: true,
    wihyAI: true,
    instacart: true,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,     // Admin dashboard access
    usageAnalytics: true,     // Full analytics
    roleManagement: true,     // Can manage user roles
    whiteLabel: true,         // All features
    communication: 'full',
  },
  
  // B2B/Enterprise Plans (all include AI + admin features)
  'workplace-core': {
    meals: true,
    workouts: true,
    family: false,      // Employees only
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
    communication: 'full',
  },
  'workplace-plus': {
    meals: true,
    workouts: true,
    family: true,       // Employees + household
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
    communication: 'full',
  },
  'corporate-enterprise': {
    meals: true,
    workouts: true,
    family: true,       // Employees + families
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: true,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
    communication: 'full',
  },
  'k12-school': {
    meals: true,
    workouts: true,
    family: false,      // Students only
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
    communication: 'full',
  },
  'university': {
    meals: true,
    workouts: true,
    family: false,      // Students only
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
    communication: 'full',
  },
  'hospital': {
    meals: true,
    workouts: true,
    family: false,      // Staff + patients
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
    communication: 'full',
  },
  'hospitality': {
    meals: true,
    workouts: true,
    family: false,      // Residents
    coachPlatform: false,
    wihyAI: true,       // Included
    instacart: false,
    progressTracking: 'advanced',
    dataExport: true,
    apiAccess: true,
    webhooks: true,
    adminDashboard: true,
    usageAnalytics: true,
    roleManagement: true,
    whiteLabel: true,
    communication: 'full',
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
  if (addOns.includes('ai') || addOns.includes('wihy-ai')) {
    base.wihyAI = true;
  }
  if (addOns.includes('instacart')) {
    base.instacart = true;
  }
  
  return base;
};

/**
 * Permission-based access control strings
 */
export const PERMISSIONS = {
  // Free plan permissions
  FREE: [
    'food:scan-barcode',
    'food:analyze-photo',
    'food:track-manually',
    'medication:track',
    'medication:view',
    'profile:view-own',
    'profile:edit-own',
    'dashboard:view-basic',
    'coach:browse',
    'coach:send-invitation',
    'notifications:receive',
  ] as string[],
  
  // Premium additions
  PREMIUM: [
    'meal-plans:view-own',
    'recipes:access',
    'workout-plans:view-own',
    'exercises:access',
    'dashboard:view-advanced',
    'analytics:view-trends',
    'analytics:view-predictions',
    'progress:track-advanced',
    'progress:photos',
    'coach:message',
  ] as string[],
  
  // Family additions
  FAMILY: [
    'family:manage-members',
    'family:view-dashboard',
    'family:guardian-controls',
    'meal-plans:share',
    'progress:view-family',
  ] as string[],
  
  // Coach additions
  COACH: [
    'clients:view',
    'clients:add',
    'clients:edit',
    'clients:remove',
    'clients:view-profiles',
    'clients:edit-profiles',
    'meal-plans:create',
    'meal-plans:edit',
    'meal-plans:delete',
    'meal-plans:view-all-clients',
    'shopping-lists:generate',
    'workout-plans:create',
    'workout-plans:edit',
    'workout-plans:delete',
    'workout-plans:view-all-clients',
    'clients:message',
    'clients:send-checkin',
    'actions:create',
    'actions:edit',
    'actions:view-all-clients',
    'coach-dashboard:access',
    'client-progress:view',
    'payments:process',
    'payments:view-history',
    'api:access',
    'webhooks:configure',
    'invitations:receive',
    'invitations:accept',
    'invitations:decline',
  ] as string[],
};

/**
 * Get all permissions for a user based on their plan
 */
export const getUserPermissions = (plan: string, addOns: string[] = []): string[] => {
  const permissions = [...PERMISSIONS.FREE];
  
  if (['premium', 'family-basic', 'family-pro', 'family-premium', 'coach', 'coach-family'].includes(plan) ||
      plan.startsWith('workplace') || plan.startsWith('corporate') ||
      ['k12-school', 'university', 'hospital', 'hospitality'].includes(plan)) {
    permissions.push(...PERMISSIONS.PREMIUM);
  }
  
  if (['family-basic', 'family-pro', 'family-premium', 'coach-family', 'workplace-plus', 'corporate-enterprise'].includes(plan)) {
    permissions.push(...PERMISSIONS.FAMILY);
  }
  
  if (['coach', 'coach-family', 'admin'].includes(plan)) {
    permissions.push(...PERMISSIONS.COACH);
  }
  
  // Admin gets all permissions
  if (plan === 'admin') {
    permissions.push(...PERMISSIONS.FAMILY);  // Ensure family too
  }
  
  return permissions;
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  user: User | null,
  permission: string
): boolean => {
  if (!user) return false;
  const userPermissions = getUserPermissions(user.plan, user.addOns || []);
  return userPermissions.includes(permission);
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
    'family-pro': 'Family Pro',
    'family-premium': 'Family Premium', // Alias
    'coach': 'Coach Platform',
    'coach-family': 'Coach + Family',
    'admin': 'Administrator',  // Full access for admin role
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
 * Get plan price for display
 */
export const getPlanPrice = (plan: string): { monthly: number; yearly?: number; setup?: number } => {
  const prices: Record<string, { monthly: number; yearly?: number; setup?: number }> = {
    'free': { monthly: 0 },
    'premium': { monthly: 12.99, yearly: 99 },
    'family-basic': { monthly: 24.99, yearly: 249 },
    'family-pro': { monthly: 49.99, yearly: 499 },
    'family-premium': { monthly: 49.99, yearly: 499 },
    'coach': { monthly: 0, setup: 99.99 }, // $99.99 setup + 1% commission
    'coach-family': { monthly: 64.97 }, // Coach + Family Premium
  };
  return prices[plan] || { monthly: 0 };
};

/**
 * Check if feature requires upgrade and return upgrade info
 */
export const getFeatureUpgradeInfo = (
  user: User | null,
  feature: 'meals' | 'workouts' | 'family' | 'coach' | 'ai' | 'instacart' | 'export'
): { requiresUpgrade: boolean; suggestedPlan: string; message: string } => {
  if (!user) {
    return {
      requiresUpgrade: true,
      suggestedPlan: 'free',
      message: 'Sign in to access this feature',
    };
  }

  const capabilities = getPlanCapabilities(user.plan, user.addOns || []);

  switch (feature) {
    case 'meals':
      if (!capabilities.meals) {
        return {
          requiresUpgrade: true,
          suggestedPlan: 'premium',
          message: 'Upgrade to Premium to unlock meal planning',
        };
      }
      break;
    case 'workouts':
      if (!capabilities.workouts) {
        return {
          requiresUpgrade: true,
          suggestedPlan: 'premium',
          message: 'Upgrade to Premium to unlock workout programs',
        };
      }
      break;
    case 'family':
      if (!capabilities.family) {
        return {
          requiresUpgrade: true,
          suggestedPlan: 'family-basic',
          message: 'Upgrade to Family Basic to add family members',
        };
      }
      break;
    case 'coach':
      if (!capabilities.coachPlatform) {
        return {
          requiresUpgrade: true,
          suggestedPlan: 'coach',
          message: 'Subscribe to Coach Platform to manage clients',
        };
      }
      break;
    case 'ai':
      if (!capabilities.wihyAI) {
        if (['premium', 'family-basic'].includes(user.plan)) {
          return {
            requiresUpgrade: true,
            suggestedPlan: user.plan,
            message: 'Add WIHY AI Coach for $4.99/month',
          };
        }
        return {
          requiresUpgrade: true,
          suggestedPlan: 'family-pro',
          message: 'Upgrade to Family Pro to get AI Coach included',
        };
      }
      break;
    case 'instacart':
      if (!capabilities.instacart) {
        return {
          requiresUpgrade: true,
          suggestedPlan: 'family-pro',
          message: 'Upgrade to Family Pro to unlock Instacart integration',
        };
      }
      break;
    case 'export':
      if (!capabilities.dataExport) {
        return {
          requiresUpgrade: true,
          suggestedPlan: 'family-pro',
          message: 'Upgrade to Family Pro to export your data',
        };
      }
      break;
  }

  return { requiresUpgrade: false, suggestedPlan: user.plan, message: '' };
};

/**
 * Check if user can access data export feature
 */
export const hasDataExportAccess = (user: User | null): boolean => {
  if (!user?.capabilities) return false;
  return user.capabilities.dataExport === true;
};

/**
 * Check if user has API access
 */
export const hasAPIAccess = (user: User | null): boolean => {
  if (!user?.capabilities) return false;
  return user.capabilities.apiAccess === true;
};

/**
 * Check if user can use webhooks
 */
export const hasWebhookAccess = (user: User | null): boolean => {
  if (!user?.capabilities) return false;
  return user.capabilities.webhooks === true;
};

/**
 * Get max family members for user's plan
 */
export const getMaxFamilyMembers = (user: User | null): number => {
  if (!user?.capabilities?.familyMembers) return 1;
  return user.capabilities.familyMembers;
};

/**
 * Check if user has client management (coach feature)
 */
export const hasClientManagement = (user: User | null): boolean => {
  if (!user?.capabilities) return false;
  return user.capabilities.clientManagement === true;
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
  userRole?: 'user' | 'coach' | 'parent' | 'admin' | 'family-admin'
): User['plan'] => {
  if (!userRole || userRole === 'user') return 'premium';
  if (userRole === 'coach') return 'coach';
  if (userRole === 'parent') return 'family-basic';
  if (userRole === 'family-admin') return 'family-pro'; // Family admin gets family pro features
  if (userRole === 'admin') return 'admin'; // Admin gets everything
  return 'free';
};
