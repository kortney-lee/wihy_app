/**
 * Plan Validation Utility
 * 
 * Provides shared plan validation and mapping logic to prevent UI<->Backend mismatches.
 * This is the single source of truth for plan validation across the application.
 * 
 * Future: Move this to backend and fetch via API for full server-side validation.
 * 
 * @see https://wihy.ai/api/docs - Backend plan specifications
 */

// ============= PLAN DEFINITIONS =============

/**
 * Plan type definitions matching backend specifications
 * Source: WIHY Subscription Plans & Payment API Guide
 */
export enum PlanId {
  // Consumer Plans
  FREE = 'free',
  PRO_MONTHLY = 'pro_monthly',
  PRO_YEARLY = 'pro_yearly',
  FAMILY_BASIC = 'family_basic',
  FAMILY_PRO = 'family_pro',
  FAMILY_PRO_YEARLY = 'family_pro_yearly',
  
  // Professional Plans
  COACH = 'coach',
}

/**
 * Stripe Price IDs that map to our plan IDs
 * These are used for API requests to the payment backend
 */
export const STRIPE_PRICE_ID_MAP: Record<PlanId | string, string> = {
  // Consumer Plans
  [PlanId.FREE]: 'free',
  [PlanId.PRO_MONTHLY]: 'pro_monthly',
  [PlanId.PRO_YEARLY]: 'pro_yearly',
  [PlanId.FAMILY_BASIC]: 'family_basic',
  [PlanId.FAMILY_PRO]: 'family_pro',
  [PlanId.FAMILY_PRO_YEARLY]: 'family_pro_yearly',
  
  // Professional Plans
  [PlanId.COACH]: 'coach',
};

/**
 * Valid plan IDs for validation
 */
const VALID_PLAN_IDS = Object.values(PlanId);

/**
 * Validate if a plan ID is valid
 * 
 * @param planId - Plan ID to validate
 * @returns true if plan ID is valid, false otherwise
 */
export function isValidPlanId(planId: string): boolean {
  return VALID_PLAN_IDS.includes(planId as PlanId);
}

/**
 * Get Stripe price ID from plan ID
 * Maps local plan IDs to Stripe price IDs for API requests
 * 
 * @param planId - Plan ID
 * @returns Stripe price ID
 * @throws Error if plan ID is not found
 */
export function getStripePriceId(planId: string): string {
  const stripePriceId = STRIPE_PRICE_ID_MAP[planId];
  if (!stripePriceId) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return stripePriceId;
}

/**
 * Map yearly plan to monthly equivalent
 * Handles billing cycle transitions
 * 
 * @param planId - Plan ID
 * @param yearly - Whether to map to yearly version
 * @returns Mapped plan ID with correct billing cycle
 * @throws Error if plan doesn't support yearly or monthly variant
 */
export function mapPlanToBillingCycle(planId: string, yearly: boolean): string {
  // Validate plan
  if (!isValidPlanId(planId)) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  // Plans without yearly variants - reject yearly request
  if ((planId === PlanId.FAMILY_BASIC || planId === PlanId.COACH) && yearly) {
    throw new Error(`Plan ${planId} does not support yearly billing`);
  }
  
  // Map to yearly variants
  if (yearly) {
    if (planId === PlanId.PRO_MONTHLY) return PlanId.PRO_YEARLY;
    if (planId === PlanId.FAMILY_PRO) return PlanId.FAMILY_PRO_YEARLY;
  }
  
  // Map to monthly variants
  if (planId === PlanId.PRO_YEARLY) return PlanId.PRO_MONTHLY;
  if (planId === PlanId.FAMILY_PRO_YEARLY) return PlanId.FAMILY_PRO;
  
  // Already in correct cycle
  return planId;
}

/**
 * Validate plan for native in-app purchase
 * Some plans may not be available through native stores
 * 
 * @param planId - Plan ID
 * @returns true if plan supports native purchases, false if Stripe-only
 */
export function supportsNativePurchase(planId: string): boolean {
  // Stripe-only plans (not available in Google Play or Apple App Store)
  const stripeOnlyPlans = [
    PlanId.COACH, // Requires special setup with Stripe Connect
  ];
  
  return !stripeOnlyPlans.includes(planId as PlanId);
}

/**
 * Get plan display name
 * 
 * @param planId - Plan ID
 * @returns Human-readable plan name
 * @throws Error if plan ID is not found
 */
export function getPlanDisplayName(planId: string): string {
  const names: Record<string, string> = {
    [PlanId.FREE]: 'Free',
    [PlanId.PRO_MONTHLY]: 'Premium (Monthly)',
    [PlanId.PRO_YEARLY]: 'Premium (Annual)',
    [PlanId.FAMILY_BASIC]: 'Family Basic',
    [PlanId.FAMILY_PRO]: 'Family Pro (Monthly)',
    [PlanId.FAMILY_PRO_YEARLY]: 'Family Pro (Annual)',
    [PlanId.COACH]: 'Coach Platform',
  };
  
  const name = names[planId];
  if (!name) {
    throw new Error(`Unknown plan ID: ${planId}`);
  }
  return name;
}

/**
 * Validate checkout request parameters
 * Ensures all required parameters are present and valid
 * 
 * @param planId - Plan ID to validate
 * @param email - User email
 * @param userId - User ID
 * @returns { valid: boolean, errors: string[] }
 */
export function validateCheckoutRequest(
  planId: string,
  email: string,
  userId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate plan
  if (!planId) {
    errors.push('Plan ID is required');
  } else if (!isValidPlanId(planId)) {
    errors.push(`Invalid plan ID: ${planId}`);
  }
  
  // Validate email
  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }
  
  // Validate user ID
  if (!userId) {
    errors.push('User ID is required (user must be authenticated)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Get all valid plan IDs
 * 
 * @returns Array of valid plan IDs
 */
export function getValidPlanIds(): string[] {
  return [...VALID_PLAN_IDS];
}

/**
 * Check if plan is a consumer plan (vs professional)
 * 
 * @param planId - Plan ID
 * @returns true if consumer plan, false if professional plan
 */
export function isConsumerPlan(planId: string): boolean {
  const consumerPlans = [
    PlanId.FREE,
    PlanId.PRO_MONTHLY,
    PlanId.PRO_YEARLY,
    PlanId.FAMILY_BASIC,
    PlanId.FAMILY_PRO,
    PlanId.FAMILY_PRO_YEARLY,
  ];
  
  return consumerPlans.includes(planId as PlanId);
}

/**
 * Check if plan is a family plan
 * 
 * @param planId - Plan ID
 * @returns true if family plan, false otherwise
 */
export function isFamilyPlan(planId: string): boolean {
  const familyPlans = [
    PlanId.FAMILY_BASIC,
    PlanId.FAMILY_PRO,
    PlanId.FAMILY_PRO_YEARLY,
  ];
  
  return familyPlans.includes(planId as PlanId);
}

/**
 * Check if plan requires setup fee (coach platform)
 * 
 * @param planId - Plan ID
 * @returns true if plan has setup fee, false otherwise
 */
export function hasSetupFee(planId: string): boolean {
  return planId === PlanId.COACH;
}

export default {
  PlanId,
  isValidPlanId,
  getStripePriceId,
  mapPlanToBillingCycle,
  supportsNativePurchase,
  getPlanDisplayName,
  validateCheckoutRequest,
  isValidEmail,
  getValidPlanIds,
  isConsumerPlan,
  isFamilyPlan,
  hasSetupFee,
  STRIPE_PRICE_ID_MAP,
};
