# Account-First Checkout Flow

**Status**: ✅ Live in Production  
**Last Updated**: February 2, 2026  
**Build**: `AppEntry-7d8f24cfc1023eeae7d1ed56ddae34ef.js`

## Overview

WIHY now enforces an **account-first checkout** architecture where users must authenticate before initiating payment. This replaces the old payment-first flow where users could pay before creating an account.

## Why Account-First?

1. **Backend Requirement**: Payment API requires `userId` field (user must exist before checkout)
2. **Simplified Flow**: No account creation after payment, reduces post-payment errors
3. **Better Analytics**: Know exactly which user initiated payment from the start
4. **Webhook Integration**: Backend can automatically link payment to authenticated user

## The Complete Flow

### Step 1: User Visits Subscription Page
```
User opens: https://wihy.ai/subscription
OR clicks: "Subscribe" button from app
```

**What happens:**
- User sees pricing plans (Free, Premium, Family Basic, Family Pro, Coach)
- User can select plan and billing cycle (monthly/yearly)
- No payment yet

### Step 2: User Clicks "Subscribe to [Plan]"
```
User taps: "Get Started" or "Upgrade" button for any paid plan
```

**Client-Side Check:**
```typescript
// WebSubscriptionScreen.tsx - handleSubscribe()
if (!user?.id || !user?.email) {
  // NOT AUTHENTICATED - show login modal
  sessionStorage.setItem('pendingPlan', JSON.stringify({
    planId: 'pro_monthly',      // e.g., pro_monthly, family_basic, family_pro
    billingCycle: 'monthly',     // or 'yearly'
  }));
  setShowAuthModal(true);
  return;
}

// AUTHENTICATED - proceed to checkout
```

### Step 3: Authentication Modal Opens
```
User sees: MultiAuthLogin modal with options:
  - Continue with Google
  - Continue with Apple
  - Continue with Facebook
  - Continue with Microsoft
  - Continue with Email (signup or login)
```

**What happens:**
- User can login to existing account OR signup for new account
- Auth service validates credentials with backend
- User data stored in AuthContext: `{ id, email, name, role, plan }`
- Token stored in localStorage (web) or secure storage (mobile)

### Step 4: Auth Context Updates
```
AuthContext processes user data:
  ✅ user.id = "user_12345"
  ✅ user.email = "user@example.com"
  ✅ user.name = "John Doe"
  ✅ user.plan = "free"  (new users start on free plan)
```

**Critical Timing:**
- Client waits **2 seconds** for auth context to fully update
- This includes token refresh, user profile fetch, and plan verification
- Signup takes longer than login due to account creation on backend

```typescript
// WebSubscriptionScreen.tsx - handleAuthSuccess()
await new Promise(resolve => setTimeout(resolve, 2000));  // 2 second wait

if (user?.id && user?.email) {
  console.log('✅ User authenticated, proceeding to checkout');
  handleSubscribe(planId);  // Retry checkout with updated user data
} else {
  console.error('❌ User data not populated after auth');
  Alert.alert('Error', 'Failed to complete authentication');
}
```

### Step 5: Plan ID Mapping
```
User selected plan ID → Stripe Price ID mapping:

Monthly Plans:
  pro_monthly           → pro_monthly (Stripe)
  family_basic          → family_basic (Stripe)
  family_pro            → family_pro (Stripe)
  coach                 → coach (Stripe)

Yearly Plans (if selected):
  pro_monthly + yearly  → pro_yearly (Stripe) ⭐ KEY FIX
  family_pro + yearly   → family_pro_yearly (Stripe) ⭐ KEY FIX
  family_basic          → NO yearly option
  coach                 → NO yearly option
```

**Code:**
```typescript
// WebSubscriptionScreen.tsx - handleSubscribe()
let checkoutPlanId = planId;

if (billingCycle === 'yearly' && plan.yearlyPrice) {
  if (planId === 'pro_monthly') {
    checkoutPlanId = 'pro_yearly';      // FIXED: was 'pro_monthly-yearly'
  } else if (planId === 'family_pro') {
    checkoutPlanId = 'family_pro_yearly'; // FIXED: was 'family_pro-yearly'
  }
}

console.log('[Subscribe] Plan ID for checkout:', checkoutPlanId);
const response = await checkoutService.initiateCheckout(
  checkoutPlanId,
  user.email,
  user.id  // REQUIRED: User authenticated before this point
);
```

### Step 6: Backend Creates Stripe Session
```
Client sends POST /api/stripe/create-checkout-session

REQUEST BODY:
{
  "plan": "pro_yearly",          // Stripe price ID
  "email": "user@example.com",   // Required for payment
  "userId": "user_12345",        // REQUIRED for account-first flow
  "source": "web",               // Platform: web, ios, android
  "successUrl": "https://wihy-ai.web.app/payment/success",
  "cancelUrl": "https://wihy-ai.web.app/payment/cancel"
}
```

**Backend Processing:**
1. Validates `userId` exists in database
2. Creates Stripe checkout session
3. Associates session with user ID
4. Returns Stripe checkout URL to client

### Step 7: Redirect to Stripe
```
Client receives response:
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_live_...",
  "sessionId": "cs_live_..."
}

Client redirects browser:
window.location.href = "https://checkout.stripe.com/pay/cs_live_...";
```

### Step 8: Payment Processing
```
User enters payment details in Stripe checkout:
  - Card number, expiry, CVC
  - Billing address
  - Billing email (pre-filled with user.email)

Stripe processes payment:
  ✅ Payment successful → Stripe sends webhook
  ❌ Payment failed → User returns to app
  ⏱️ User closes checkout → User returns to app
```

### Step 9: Webhook Processing (Backend)
```
Stripe webhook: POST /api/webhooks/stripe
Payload: charge.succeeded event

Backend processing:
1. Verify webhook signature
2. Extract userId from session metadata
3. Activate subscription for user
4. Update user.plan in database
5. Emit event: user plan changed
```

### Step 10: Return to App
```
SUCCESS PATH:
  Browser redirected to: https://wihy-ai.web.app/payment/success?session_id=cs_live_...
  
CANCEL/FAILED PATH:
  Browser redirected to: https://wihy-ai.web.app/payment/cancel

Client-side handling:
  - PaymentSuccessScreen handles success path
  - Shows confirmation message
  - Refreshes user context
  - Offers option to return to app
```

---

## File Changes & Code Locations

### 1. WebSubscriptionScreen.tsx
**File**: `mobile/src/screens/WebSubscriptionScreen.tsx`

**Key Functions:**
- `handleSubscribe(planId)` - Lines 336-485
  - Checks authentication before checkout
  - Maps plan IDs to yearly variants
  - Calls checkoutService.initiateCheckout()
  - Redirects to Stripe
  
- `handleAuthSuccess()` - Lines 294-329
  - Called after user signs in/signs up
  - Waits 2 seconds for auth context update
  - Validates user.id and user.email exist
  - Retries handleSubscribe() with pending plan

**Critical Changes:**
```typescript
// BEFORE: Generated invalid plan IDs
const checkoutPlanId = billingCycle === 'yearly' && plan.yearlyPrice 
  ? `${planId}-yearly`  // ❌ pro_monthly-yearly (invalid!)
  : planId;

// AFTER: Maps to correct Stripe price IDs
let checkoutPlanId = planId;
if (billingCycle === 'yearly' && plan.yearlyPrice) {
  if (planId === 'pro_monthly') {
    checkoutPlanId = 'pro_yearly';        // ✅ Correct!
  } else if (planId === 'family_pro') {
    checkoutPlanId = 'family_pro_yearly'; // ✅ Correct!
  }
}
```

### 2. checkoutService.ts
**File**: `mobile/src/services/checkoutService.ts`

**Key Methods:**
- `initiateCheckout(plan, email, userId)` - Lines 245-390
  - Validates email, plan, userId (all required)
  - Maps local plan ID to Stripe price ID
  - Creates checkout request
  - Returns Stripe checkout URL

- `openCheckout(checkoutUrl)` - Lines 396+
  - Opens Stripe URL in browser or webview
  - Platform-specific handling (web, iOS, Android)

**Validation:**
```typescript
async initiateCheckout(plan: string, email: string, userId: string) {
  // All three parameters required - account-first flow
  if (!email) return { success: false, error: 'Email required' };
  if (!plan) return { success: false, error: 'Plan required' };
  if (!userId) return { success: false, error: 'User must be authenticated' };
  
  // Validate plan exists
  const validPlan = WIHY_PLANS.find(p => 
    p.id === plan || p.name === plan || p.stripePriceId === plan
  );
  
  // Send to backend with all required fields
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({
      plan: stripePriceId,  // Stripe price ID
      email: trimmedEmail,
      userId,               // ⭐ REQUIRED for account-first
      source: 'web',
      successUrl: '...',
      cancelUrl: '...'
    })
  });
}
```

### 3. MultiAuthLogin.tsx
**File**: `mobile/src/components/auth/MultiAuthLogin.tsx`

**Key Behavior:**
- Shows OAuth providers (Google, Apple, Facebook, Microsoft)
- Shows email/password form for signup/login
- Calls `authService.signIn()` with provider
- Emits `onSignIn()` callback when authentication succeeds
- AuthContext auto-updates with new user data

### 4. AuthContext
**File**: `mobile/src/context/AuthContext.tsx`

**What It Does After Auth:**
1. Stores token in secure storage
2. Fetches user profile from `/api/user/profile`
3. Updates state: `{ user: { id, email, name, role, plan }, token, ... }`
4. Starts auto token refresh (every 5 minutes)

---

## Plan Configuration

### Available Plans

```typescript
// mobile/src/screens/WebSubscriptionScreen.tsx

const CONSUMER_PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    // Features for free plan
    // No checkout needed - user already on free plan
  },
  {
    id: 'pro_monthly',
    name: 'Premium',
    monthlyPrice: 12.99,
    yearlyPrice: 99.00,  // Save 36% - 2 months free!
    // Features for premium
  },
  {
    id: 'family_basic',
    name: 'Family Basic',
    monthlyPrice: 24.99,
    yearlyPrice: 0,  // No annual option
    // Features for family basic
  },
  {
    id: 'family_pro',
    name: 'Family Pro',
    monthlyPrice: 49.99,
    yearlyPrice: 479.99,  // Save 20% - $120/year
    // Features for family pro
    popular: true  // Highlighted on pricing page
  },
  {
    id: 'coach',
    name: 'Coach Platform',
    setupFee: 99.99,      // One-time
    monthlyPrice: 29.99,  // Recurring
    // Features for coach platform
  }
];
```

### Plan ID Reference

| Plan | Monthly ID | Yearly ID | Stripe Price ID (Monthly) | Stripe Price ID (Yearly) |
|------|-----------|-----------|--------------------------|-------------------------|
| Premium | `pro_monthly` | `pro_yearly` | `pro_monthly` | `pro_yearly` |
| Family Basic | `family_basic` | ❌ None | `family_basic` | N/A |
| Family Pro | `family_pro` | `family_pro_yearly` | `family_pro` | `family_pro_yearly` |
| Coach | `coach` | ❌ None | `coach` | N/A |

---

## Testing the Flow

### Web Browser Test

1. **Hard refresh** to clear cache:
   - Windows: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

2. **Open**: https://wihy-ai.web.app/subscription

3. **Test Case 1: Login (Existing User)**
   - Click "Upgrade" on Premium plan
   - Auth modal appears
   - Enter existing account credentials
   - Should proceed to Stripe checkout

4. **Test Case 2: Signup (New User)**
   - Click "Upgrade" on Family Pro plan
   - Click "Continue with Email"
   - Click "Create new account"
   - Enter: name, email, password
   - Should proceed to Stripe checkout after 2-second wait

5. **Test Case 3: Yearly Plan**
   - Toggle billing cycle to "Yearly"
   - Click "Upgrade" on Premium plan
   - Should redirect to Stripe with yearly pricing

6. **Monitor Console Logs** (DevTools → Console):
   ```
   [Subscribe] User not authenticated - showing auth modal
   [AuthContext] Processing user data...
   [Subscribe] Authentication successful, retrying checkout
   [Subscribe] Creating checkout for authenticated user: { userId: '...', email: '...' }
   [Checkout] === INITIATING CHECKOUT REQUEST ===
   [Checkout] Parameters: { plan: 'pro_yearly', email: 'user@...', userId: 'user_...' }
   [Checkout] === CHECKOUT SESSION CREATED ===
   [Checkout] Checkout URL: https://checkout.stripe.com/pay/cs_live_...
   [Subscribe] Redirecting to checkout
   ```

---

## Deleted Code (Old Payment-First Flow)

The following files were removed as part of migrating to account-first architecture:

### 1. CompleteAccountScreen.tsx
- **Purpose**: Create account after payment (old flow)
- **Removed**: Feb 2, 2026
- **Why**: No longer needed - account created before payment

### 2. SignupWithPaymentScreen.tsx
- **Purpose**: OAuth + payment form on same screen
- **Removed**: Feb 2, 2026
- **Why**: Replaced with multi-step flow

### 3. EmailCheckoutModal.tsx
- **Purpose**: Collect email before payment
- **Removed**: Feb 2, 2026
- **Why**: Replaced with MultiAuthLogin modal for full auth

---

## Troubleshooting

### Issue: "User not authenticated" after signup
**Solution**: Wait 2-3 seconds after signup for auth context to update. Check browser console for detailed logs.

### Issue: Invalid plan error
**Possible Causes**:
- Yearly plan selected but plan doesn't support it (Family Basic, Coach)
- Check CONSUMER_PLANS configuration
- Verify plan ID matches Stripe price ID

### Issue: Checkout session creation fails (400 error)
**Possible Causes**:
- Email invalid or missing
- Plan ID doesn't exist in Stripe
- User ID not provided
- Check backend logs: `POST /api/stripe/create-checkout-session`

### Issue: Success page not showing
**Solution**: Check payment webhook processing on backend. Verify `stripe.published` events are triggering user plan updates.

---

## API Endpoints

### POST /api/stripe/create-checkout-session
**Initiates Stripe checkout**

**Request:**
```json
{
  "plan": "pro_yearly",
  "email": "user@example.com",
  "userId": "user_12345",
  "source": "web",
  "successUrl": "https://...",
  "cancelUrl": "https://..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_live_...",
  "sessionId": "cs_live_..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid plan: unknown_plan"
}
```

### POST /webhooks/stripe
**Handles payment events**

**Triggered on:**
- `charge.succeeded` → Update user plan
- `subscription.updated` → Update subscription status
- `subscription.deleted` → Downgrade user plan

---

## Related Documentation

- [WIHY API Reference](./WIHY_API_REFERENCE.md)
- [Authentication Implementation](./AUTH_IMPLEMENTATION_SUMMARY.md)
- [Payment & Subscription Guide](./WIHY_API_REFERENCE.md#payment-flow)
- [User Service API](./USER_SERVICE_API_IMPLEMENTATION.md)

---

## Summary

The **account-first checkout flow** ensures:
- ✅ User exists before payment
- ✅ Correct plan IDs sent to Stripe
- ✅ Proper auth context updates before checkout
- ✅ Better error handling and logging
- ✅ Seamless experience for new users signing up

**All flows tested and live in production** as of February 2, 2026.
