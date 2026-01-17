/**
 * Affiliate Tracking Service
 * 
 * Integrates with LeadConnector/GoHighLevel affiliate manager for tracking
 * signups and conversions. This service is web-only since it relies on
 * the am.js script loaded in web/index.html.
 * 
 * Sales tracking is handled server-side via Stripe webhooks.
 */

import { Platform } from 'react-native';

// Extend Window interface to include affiliateManager
declare global {
  interface Window {
    affiliateManager?: {
      init: (accountId: string, backendUrl: string, domain: string) => void;
      trackLead: (
        data: AffiliateLeadData,
        callback?: () => void
      ) => void;
    };
  }
}

export interface AffiliateLeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  uid?: string; // Stripe customer ID - preferred for matching
}

class AffiliateService {
  private isInitialized = false;

  constructor() {
    // Check if we're on web and affiliateManager is available
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      this.checkInitialization();
    }
  }

  /**
   * Check if affiliate manager script is loaded
   */
  private checkInitialization(): void {
    if (typeof window !== 'undefined' && window.affiliateManager) {
      this.isInitialized = true;
      console.log('[Affiliate] Manager initialized');
    } else {
      // Script might still be loading, check again shortly
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.affiliateManager) {
          this.isInitialized = true;
          console.log('[Affiliate] Manager initialized (delayed)');
        }
      }, 2000);
    }
  }

  /**
   * Track a lead/signup for affiliate attribution
   * 
   * This should be called after successful registration.
   * The uid (Stripe customer ID) is preferred over email for matching
   * since it's more reliable when email changes.
   * 
   * @param data - Lead data including name, email, and optional uid
   * @returns Promise that resolves when tracking is complete
   */
  async trackLead(data: AffiliateLeadData): Promise<boolean> {
    // Only works on web
    if (Platform.OS !== 'web') {
      console.log('[Affiliate] Skipping - not on web platform');
      return false;
    }

    // Check if affiliate manager is available
    if (typeof window === 'undefined' || !window.affiliateManager) {
      console.log('[Affiliate] Manager not available - visitor may not have come from affiliate link');
      return false;
    }

    return new Promise((resolve) => {
      try {
        console.log('[Affiliate] Tracking lead:', {
          email: data.email ? '***@***' : undefined,
          uid: data.uid ? '***' : undefined,
          hasName: !!data.firstName || !!data.lastName,
        });

        window.affiliateManager!.trackLead(
          {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            uid: data.uid, // Stripe customer ID for reliable matching
          },
          () => {
            console.log('[Affiliate] Lead tracked successfully');
            resolve(true);
          }
        );

        // Timeout fallback in case callback doesn't fire
        setTimeout(() => {
          resolve(true);
        }, 3000);

      } catch (error) {
        console.error('[Affiliate] Error tracking lead:', error);
        resolve(false);
      }
    });
  }

  /**
   * Track signup with parsed name
   * Convenience method that splits a full name into first/last
   * 
   * @param fullName - User's full name
   * @param email - User's email address
   * @param stripeCustomerId - Optional Stripe customer ID for reliable matching
   */
  async trackSignup(
    fullName: string,
    email: string,
    stripeCustomerId?: string
  ): Promise<boolean> {
    // Parse name into first/last
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return this.trackLead({
      firstName,
      lastName,
      email,
      uid: stripeCustomerId,
    });
  }

  /**
   * Check if affiliate tracking is available
   * (User came from an affiliate link and am.js is loaded)
   */
  isAvailable(): boolean {
    if (Platform.OS !== 'web') return false;
    return typeof window !== 'undefined' && !!window.affiliateManager;
  }
}

export const affiliateService = new AffiliateService();
export default affiliateService;
