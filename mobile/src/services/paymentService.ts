/**
 * Payment Service
 * 
 * Client-side service for Stripe Connect integration with auth.wihy.ai
 * Handles coach payments, subscriptions, and earnings tracking.
 */

import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { authService } from './authService';

// ============= TYPES =============

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

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
  };
  isDefault: boolean;
}

export interface SetupIntent {
  clientSecret: string;
  setupIntentId: string;
  status: string;
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

export interface CreateChargeRequest {
  coachId: string;
  clientId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionRequest {
  coachId: string;
  clientId: string;
  planId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Optional for partial refund
  reason: RefundReason;
  notes?: string;
}

export interface PaymentHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: PaymentStatus;
  limit?: number;
  offset?: number;
}

// ============= API RESPONSES =============

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============= SERVICE IMPLEMENTATION =============

class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.authUrl || 'https://auth.wihy.ai';
  }

  /**
   * Get authorization headers with JWT token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Handle API response and extract data or throw error
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `API Error: ${response.status}`);
    }
    
    return data.data || data;
  }

  // ==========================================
  // STRIPE CONNECT SETUP
  // ==========================================

  /**
   * Setup Stripe Connect for a coach
   * Returns onboarding URL to complete Stripe account setup
   * 
   * @param userId - Coach user ID
   * @returns Onboarding URL for Stripe Connect
   */
  async setupStripeConnect(userId: string): Promise<string> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/connect`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      }
    );

    const data = await this.handleResponse<{ onboardingUrl: string }>(response);
    return data.onboardingUrl;
  }

  /**
   * Get Stripe account status for a coach
   * 
   * @param userId - Coach user ID
   * @returns Stripe account details
   */
  async getStripeAccount(userId: string): Promise<StripeAccount | null> {
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/payments/connect/${userId}`,
        {
          method: 'GET',
          headers,
        }
      );

      return await this.handleResponse<StripeAccount>(response);
    } catch (error) {
      // Return null if no account exists
      return null;
    }
  }

  /**
   * Check if a coach has completed Stripe onboarding
   * 
   * @param userId - Coach user ID
   * @returns Whether onboarding is complete
   */
  async isStripeOnboardingComplete(userId: string): Promise<boolean> {
    const account = await this.getStripeAccount(userId);
    return account?.onboardingComplete ?? false;
  }

  // ==========================================
  // PAYMENT SETUP
  // ==========================================

  /**
   * Create a SetupIntent for adding a payment method
   * 
   * @param userId - User ID to attach payment method to
   * @returns SetupIntent with client secret for Stripe Elements
   */
  async createSetupIntent(userId: string): Promise<SetupIntent> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/setup-intent`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      }
    );

    return await this.handleResponse<SetupIntent>(response);
  }

  /**
   * Get payment methods for a user
   * 
   * @param userId - User ID
   * @returns List of payment methods
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/methods/${userId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<PaymentMethod[]>(response);
  }

  /**
   * Set default payment method
   * 
   * @param userId - User ID
   * @param paymentMethodId - Payment method ID to set as default
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    await fetchWithLogging(
      `${this.baseUrl}/api/payments/methods/${userId}/default`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ paymentMethodId }),
      }
    );
  }

  /**
   * Delete a payment method
   * 
   * @param paymentMethodId - Payment method ID to delete
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    await fetchWithLogging(
      `${this.baseUrl}/api/payments/methods/${paymentMethodId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
  }

  // ==========================================
  // CHARGES & PAYMENTS
  // ==========================================

  /**
   * Charge a client (coach-initiated payment)
   * 
   * @param request - Charge request with amount and details
   * @returns Payment record
   */
  async chargeClient(request: CreateChargeRequest): Promise<Payment> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/charge`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...request,
          currency: request.currency || 'usd',
        }),
      }
    );

    return await this.handleResponse<Payment>(response);
  }

  /**
   * Get a specific payment by ID
   * 
   * @param paymentId - Payment ID
   * @returns Payment record
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/${paymentId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<Payment>(response);
  }

  /**
   * Get payment history for a user
   * 
   * @param userId - User ID (coach or client)
   * @param filters - Optional filters for date range, status, pagination
   * @returns Paginated list of payments
   */
  async getPaymentHistory(
    userId: string,
    filters?: PaymentHistoryFilters
  ): Promise<PaginatedResponse<Payment>> {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = `${this.baseUrl}/api/payments/history/${userId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetchWithLogging(url, {
      method: 'GET',
      headers,
    });

    return await response.json();
  }

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================

  /**
   * Create a subscription for a client
   * 
   * @param request - Subscription request with plan details
   * @returns Subscription record
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/subscriptions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );

    return await this.handleResponse<Subscription>(response);
  }

  /**
   * Get subscription details
   * 
   * @param subscriptionId - Subscription ID
   * @returns Subscription record
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/subscriptions/${subscriptionId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<Subscription>(response);
  }

  /**
   * Get all subscriptions for a user
   * 
   * @param userId - User ID (coach or client)
   * @returns List of subscriptions
   */
  async getSubscriptions(userId: string): Promise<Subscription[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/subscriptions/user/${userId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<Subscription[]>(response);
  }

  /**
   * Cancel a subscription
   * 
   * @param subscriptionId - Subscription ID
   * @param immediately - If true, cancel immediately; otherwise cancel at period end
   * @returns Updated subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Subscription> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ immediately }),
      }
    );

    return await this.handleResponse<Subscription>(response);
  }

  /**
   * Resume a canceled subscription (if not yet ended)
   * 
   * @param subscriptionId - Subscription ID
   * @returns Updated subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/subscriptions/${subscriptionId}/resume`,
      {
        method: 'POST',
        headers,
      }
    );

    return await this.handleResponse<Subscription>(response);
  }

  // ==========================================
  // COACH EARNINGS
  // ==========================================

  /**
   * Get coach earnings summary
   * 
   * @param coachId - Coach user ID
   * @returns Earnings summary with totals and breakdown
   */
  async getCoachEarnings(coachId: string): Promise<{ earnings: CoachEarnings }> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coach/earnings/${coachId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<{ earnings: CoachEarnings }>(response);
  }

  /**
   * Request a payout to coach's bank account
   * 
   * @param coachId - Coach user ID
   * @param amount - Amount to payout (optional, defaults to available balance)
   * @returns Payout details
   */
  async requestPayout(coachId: string, amount?: number): Promise<{
    payoutId: string;
    amount: number;
    estimatedArrival: string;
  }> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coach/payouts`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ coachId, amount }),
      }
    );

    return await this.handleResponse(response);
  }

  // ==========================================
  // REFUNDS
  // ==========================================

  /**
   * Process a refund for a payment
   * 
   * @param request - Refund request with payment ID and reason
   * @returns Refund record
   */
  async processRefund(request: RefundRequest): Promise<Refund> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/refund`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );

    return await this.handleResponse<Refund>(response);
  }

  /**
   * Get refund details
   * 
   * @param refundId - Refund ID
   * @returns Refund record
   */
  async getRefund(refundId: string): Promise<Refund> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/payments/refund/${refundId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<Refund>(response);
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Format amount for display (converts cents to dollars)
   * 
   * @param amount - Amount in cents
   * @param currency - Currency code (default: USD)
   * @returns Formatted amount string
   */
  formatAmount(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  /**
   * Get payment status color for UI
   * 
   * @param status - Payment status
   * @returns Color string for UI display
   */
  getStatusColor(status: PaymentStatus | SubscriptionStatus | RefundStatus): string {
    const colors: Record<string, string> = {
      succeeded: '#22C55E',    // green
      active: '#22C55E',       // green
      pending: '#F59E0B',      // amber
      trialing: '#3B82F6',     // blue
      incomplete: '#F59E0B',   // amber
      failed: '#EF4444',       // red
      refunded: '#6B7280',     // gray
      canceled: '#6B7280',     // gray
      past_due: '#EF4444',     // red
      disputed: '#EF4444',     // red
    };
    return colors[status] || '#6B7280';
  }

  /**
   * Get human-readable status label
   * 
   * @param status - Payment/subscription status
   * @returns Human-readable label
   */
  getStatusLabel(status: PaymentStatus | SubscriptionStatus | RefundStatus): string {
    const labels: Record<string, string> = {
      succeeded: 'Succeeded',
      active: 'Active',
      pending: 'Pending',
      trialing: 'Trial',
      incomplete: 'Incomplete',
      failed: 'Failed',
      refunded: 'Refunded',
      canceled: 'Canceled',
      past_due: 'Past Due',
      disputed: 'Disputed',
    };
    return labels[status] || status;
  }

  /**
   * Calculate platform fee for a payment
   * 
   * @param amount - Payment amount in cents
   * @param feePercent - Platform fee percentage (default: 10%)
   * @returns Fee amount in cents
   */
  calculatePlatformFee(amount: number, feePercent = 10): number {
    return Math.round(amount * (feePercent / 100));
  }

  /**
   * Calculate coach payout for a payment
   * 
   * @param amount - Payment amount in cents
   * @param feePercent - Platform fee percentage (default: 10%)
   * @returns Payout amount in cents
   */
  calculateCoachPayout(amount: number, feePercent = 10): number {
    return amount - this.calculatePlatformFee(amount, feePercent);
  }

  /**
   * Check if a subscription is active (including trial)
   * 
   * @param subscription - Subscription object
   * @returns Whether subscription is active
   */
  isSubscriptionActive(subscription: Subscription): boolean {
    return ['active', 'trialing'].includes(subscription.status);
  }

  /**
   * Get days remaining in subscription period
   * 
   * @param subscription - Subscription object
   * @returns Days remaining
   */
  getDaysRemaining(subscription: Subscription): number {
    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
