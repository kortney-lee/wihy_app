/**
 * GoHighLevel (GHL) Integration Service
 * 
 * Manages subscription status and user data sync with GoHighLevel CRM.
 * GHL is used as the source of truth for premium subscription status.
 */

import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

export interface GHLSubscriptionStatus {
  isPremium: boolean;
  subscriptionType?: 'monthly' | 'yearly' | 'lifetime';
  expiresAt?: string;
  features: string[];
  contactId?: string;
}

export interface GHLContactData {
  email: string;
  name: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

class GHLService {
  private baseUrl = API_CONFIG.baseUrl;

  /**
   * Check if user has an active premium subscription in GHL
   */
  async checkSubscriptionStatus(email: string): Promise<GHLSubscriptionStatus> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/ghl/subscription-status?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GHL API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[GHLService] Subscription status:', data);

      return {
        isPremium: data.isPremium || false,
        subscriptionType: data.subscriptionType,
        expiresAt: data.expiresAt,
        features: data.features || [],
        contactId: data.contactId,
      };
    } catch (error) {
      console.error('[GHLService] Failed to check subscription:', error);
      // Default to free tier on error
      return {
        isPremium: false,
        features: [],
      };
    }
  }

  /**
   * Sync contact data to GHL when user signs up or updates profile
   */
  async syncContact(contactData: GHLContactData): Promise<boolean> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/ghl/sync-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`GHL sync failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[GHLService] Contact synced:', result.contactId);
      return true;
    } catch (error) {
      console.error('[GHLService] Failed to sync contact:', error);
      return false;
    }
  }

  /**
   * Update subscription status in GHL after successful purchase
   */
  async updateSubscription(
    email: string,
    subscriptionType: 'monthly' | 'yearly' | 'lifetime',
    transactionId: string
  ): Promise<boolean> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/ghl/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subscriptionType,
          transactionId,
          purchasedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`GHL update failed: ${response.status}`);
      }

      console.log('[GHLService] Subscription updated in GHL');
      return true;
    } catch (error) {
      console.error('[GHLService] Failed to update subscription:', error);
      return false;
    }
  }

  /**
   * Add tags to contact in GHL (e.g., "premium", "active_user")
   */
  async addTags(email: string, tags: string[]): Promise<boolean> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/ghl/add-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, tags }),
      });

      if (!response.ok) {
        throw new Error(`GHL add tags failed: ${response.status}`);
      }

      console.log('[GHLService] Tags added:', tags);
      return true;
    } catch (error) {
      console.error('[GHLService] Failed to add tags:', error);
      return false;
    }
  }

  /**
   * Get user's feature access based on GHL subscription
   */
  async getFeatureAccess(email: string): Promise<string[]> {
    try {
      const status = await this.checkSubscriptionStatus(email);
      return status.features;
    } catch (error) {
      console.error('[GHLService] Failed to get feature access:', error);
      return [];
    }
  }
}

export const ghlService = new GHLService();
