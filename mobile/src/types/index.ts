export interface NavigationProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
    replace: (screen: string) => void;
  };
}

// Export all API types from centralized api.ts
export * from './api';

// Legacy types - kept for backward compatibility
// Use types from api.ts for new code
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Payment types (from paymentService)
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
export type RefundStatus = 'pending' | 'succeeded' | 'failed';
export type RefundReason = 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'other';

export interface StripeAccount {
  id: string;
  userId: string;
  stripeAccountId: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  defaultCurrency: string;
  country: string;
  email?: string;
  businessType?: 'individual' | 'company';
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  stripePaymentId: string;
  coachId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  refundedAt?: string;
  refundAmount?: number;
}

export interface Subscription {
  id: string;
  stripeSubscriptionId: string;
  coachId: string;
  clientId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  interval: 'week' | 'month' | 'year';
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  createdAt: string;
}

export interface CoachEarnings {
  total: number;
  pending: number;
  available: number;
  currency: string;
  lastPayout?: {
    amount: number;
    date: string;
  };
  thisMonth: number;
  lastMonth: number;
  totalClients: number;
  activeSubscriptions: number;
}

export interface Refund {
  id: string;
  paymentId: string;
  stripeRefundId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: RefundReason;
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

// Family permission types
export interface FamilyPermissions {
  canViewMeals: boolean;
  canEditMeals: boolean;
  canViewWorkouts: boolean;
  canEditWorkouts: boolean;
  canViewProgress: boolean;
  canManageMembers: boolean;
  canInviteMembers: boolean;
}

// Export Goals types (skip if overlapping with api.ts)
// export * from './goals.types';

// Export Progress types (skip if overlapping with api.ts)
// export * from './progress.types';

// Export Reminders types (skip if overlapping with api.ts)
// export * from './reminders.types';

// Export Scan types
export * from './scan.types';
