/**
 * GoHighLevel (GHL) Integration Service
 * 
 * Manages subscription status and user data sync with GoHighLevel CRM.
 * GHL is used as the source of truth for premium subscription status.
 * 
 * NOTE: Uses user.wihy.ai (userUrl) for all user-related endpoints
 * since user data operations belong to the User Service.
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
  private userUrl = API_CONFIG.userUrl; // User service for user data

  /**
   * Check if user has an active premium subscription in GHL
   * Two-step process:
   * 1. Get user ID from email: GET /api/users/email/:email
   * 2. Get GHL status: GET /api/users/:id/ghl-status
   */
  async checkSubscriptionStatus(email: string): Promise<GHLSubscriptionStatus> {
    try {
      // Step 1: Get user by email
      const userResponse = await fetchWithLogging(
        `${this.userUrl}/api/users/email/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!userResponse.ok) {
        console.warn(`[GHLService] User not found for email: ${email}`);
        return {
          isPremium: false,
          features: [],
        };
      }

      const userData = await userResponse.json();
      const userId = userData.data?.user?.id || userData.data?.id;

      if (!userId) {
        console.warn('[GHLService] No user ID in response');
        return {
          isPremium: false,
          features: [],
        };
      }

      // Step 2: Get GHL status for user
      const ghlResponse = await fetchWithLogging(
        `${this.userUrl}/api/users/${userId}/ghl-status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!ghlResponse.ok) {
        console.warn(`[GHLService] GHL API error: ${ghlResponse.status}`);
        return {
          isPremium: false,
          features: [],
        };
      }

      const data = await ghlResponse.json();
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
      const response = await fetchWithLogging(`${this.userUrl}/api/users/sync-contact`, {
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
      const response = await fetchWithLogging(`${this.userUrl}/api/users/update-ghl-subscription`, {
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
      const response = await fetchWithLogging(`${this.userUrl}/api/users/ghl-tags`, {
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
