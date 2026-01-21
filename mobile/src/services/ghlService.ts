/**
 * GoHighLevel (GHL) Integration Service
 * 
 * Manages subscription status checks with GoHighLevel CRM.
 * GHL is used as the source of truth for premium subscription status.
 * 
 * NOTE: Frontend only checks subscription status via GET endpoints.
 * Contact sync, subscription updates, and tag management are handled
 * server-to-server via payment webhooks and internal automation.
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
