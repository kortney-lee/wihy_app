/**
 * STRIPE CHECKOUT SERVICE REQUIREMENTS
 * 
 * Backend must implement: POST /api/stripe/create-checkout-session
 * 
 * This endpoint handles Stripe checkout session creation for the WIHY app.
 * Client sends validated email and plan, backend creates Stripe session.
 * 
 * ============================================================
 * REQUEST BODY (JSON)
 * ============================================================
 * 
 * {
 *   "plan": "pro_monthly" | "pro_yearly" | "family_basic" | "family_pro" | "coach",
 *   "email": "user@example.com",
 *   "source": "web" | "ios" | "android",
 *   "successUrl": "https://wihy.ai/payment/success?session_id={CHECKOUT_SESSION_ID}",
 *   "cancelUrl": "https://wihy.ai/payment/cancel"
 * }
 * 
 * ============================================================
 * VALIDATION (MUST IMPLEMENT)
 * ============================================================
 * 
 * 1. Email validation:
 *    - REQUIRED: Must not be empty or null
 *    - MUST be valid email format (regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
 *    - Response if missing/invalid: 400 "Email is required"
 * 
 * 2. Plan validation:
 *    - REQUIRED: Must be one of: pro_monthly, pro_yearly, family_basic, family_pro, coach
 *    - Response if missing/invalid: 400 "Plan is required"
 * 
 * 3. Source validation:
 *    - RECOMMENDED: Should be 'web', 'ios', or 'android'
 *    - Default to 'web' if not provided
 * 
 * ============================================================
 * SUCCESS RESPONSE (200 OK)
 * ============================================================
 * 
 * {
 *   "success": true,
 *   "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
 *   "sessionId": "cs_test_...",
 *   "plan": "pro_monthly",
 *   "email": "user@example.com"
 * }
 * 
 * ============================================================
 * ERROR RESPONSES
 * ============================================================
 * 
 * 400 Bad Request - Missing required parameters:
 * {
 *   "success": false,
 *   "error": "Email is required",
 *   "code": "VALIDATION_ERROR"
 * }
 * 
 * 400 Bad Request - Invalid email format:
 * {
 *   "success": false,
 *   "error": "Invalid email format",
 *   "code": "VALIDATION_ERROR"
 * }
 * 
 * 400 Bad Request - Invalid plan:
 * {
 *   "success": false,
 *   "error": "Invalid plan: invalid_plan_id",
 *   "code": "VALIDATION_ERROR"
 * }
 * 
 * 500 Internal Server Error - Stripe error:
 * {
 *   "success": false,
 *   "error": "Failed to create checkout session",
 *   "details": "Stripe error message here",
 *   "code": "CHECKOUT_ERROR"
 * }
 * 
 * ============================================================
 * STRIPE CONFIGURATION REQUIRED
 * ============================================================
 * 
 * Environment Variables:
 * - STRIPE_SECRET_KEY: Stripe API secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 * - STRIPE_PRICE_PRO_MONTHLY: Price ID for pro monthly plan
 * - STRIPE_PRICE_PRO_YEARLY: Price ID for pro yearly plan
 * - STRIPE_PRICE_FAMILY_BASIC: Price ID for family basic plan
 * - STRIPE_PRICE_FAMILY_PRO: Price ID for family pro plan
 * - STRIPE_PRICE_COACH: Price ID for coach plan
 * - FRONTEND_URL: Frontend URL for success/cancel redirects (default: https://wihy.ai)
 * 
 * ============================================================
 * BACKEND IMPLEMENTATION CHECKLIST
 * ============================================================
 * 
 * ✓ Validate email is not empty and matches regex pattern
 * ✓ Validate plan is not empty and is in allowed list
 * ✓ Create or get Stripe customer by email
 * ✓ Create Stripe checkout session with correct price ID
 * ✓ Return checkoutUrl and sessionId in response
 * ✓ Handle Stripe API errors gracefully
 * ✓ Log all checkout attempts for debugging
 * ✓ Store pending checkout info for webhook handling
 * ✓ Implement webhook handler for checkout.session.completed
 * ✓ Update user subscription in database after payment
 * 
 * ============================================================
 * IMPORTANT NOTES
 * ============================================================
 * 
 * 1. Client-side validation is already implemented in checkoutService.ts
 *    but backend MUST also validate to prevent abuse
 * 
 * 2. The 400 error indicates missing email or plan parameters
 *    Client will retry if backend returns 400 with proper error message
 * 
 * 3. Email should be normalized: toLowerCase() + trim()
 * 
 * 4. Free plan (plan: "free") should NOT hit Stripe
 *    Return success immediately without Stripe session
 * 
 * 5. Store pending checkout info to handle webhook events
 *    Maps checkout session ID to user email and plan
 * 
 * 6. Webhook events to handle:
 *    - checkout.session.completed: Update user subscription to ACTIVE
 *    - customer.subscription.updated: Update subscription status
 *    - customer.subscription.deleted: Set subscription to CANCELED
 *    - invoice.payment_failed: Send notification to user
 */

// ============================================================
// IMPLEMENTATION TEMPLATE (TypeScript/Express)
// ============================================================

import express, { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = express.Router();

// Plan to Stripe Price ID mapping
const PLAN_CONFIG: Record<string, { name: string; stripePriceId: string }> = {
  'pro_monthly': {
    name: 'Pro Monthly',
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  },
  'pro_yearly': {
    name: 'Pro Yearly',
    stripePriceId: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  'family_basic': {
    name: 'Family Basic',
    stripePriceId: process.env.STRIPE_PRICE_FAMILY_BASIC!,
  },
  'family_pro': {
    name: 'Family Pro',
    stripePriceId: process.env.STRIPE_PRICE_FAMILY_PRO!,
  },
  'coach': {
    name: 'Coach',
    stripePriceId: process.env.STRIPE_PRICE_COACH!,
  },
};

interface CheckoutRequest {
  plan: string;
  email: string;
  source?: string;
  successUrl?: string;
  cancelUrl?: string;
}

router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { plan, email, source = 'web', successUrl, cancelUrl } = req.body as CheckoutRequest;

    // CRITICAL: Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'VALIDATION_ERROR',
      });
    }

    // CRITICAL: Validate plan
    if (!plan || typeof plan !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Plan is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate email format
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'VALIDATION_ERROR',
      });
    }

    // Validate plan exists
    if (!PLAN_CONFIG[plan]) {
      return res.status(400).json({
        success: false,
        error: `Invalid plan: ${plan}`,
        code: 'VALIDATION_ERROR',
      });
    }

    console.log(`[Stripe] Creating checkout for ${trimmedEmail}, plan: ${plan}`);

    // Get or create Stripe customer
    let customer = await stripe.customers.list({
      email: trimmedEmail,
      limit: 1,
    });

    let customerId: string;
    if (customer.data.length > 0) {
      customerId = customer.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: trimmedEmail,
        metadata: { source },
      });
      customerId = newCustomer.id;
    }

    // Create checkout session
    const planConfig = PLAN_CONFIG[plan];
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.FRONTEND_URL || 'https://wihy.ai'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'https://wihy.ai'}/payment/cancel`,
      metadata: {
        plan,
        email: trimmedEmail,
        source,
      },
    });

    console.log(`[Stripe] Checkout session created: ${session.id}`);

    return res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      plan,
      email: trimmedEmail,
    });

  } catch (error: any) {
    console.error('[Stripe] Checkout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      details: error.message,
      code: 'CHECKOUT_ERROR',
    });
  }
});

export default router;
