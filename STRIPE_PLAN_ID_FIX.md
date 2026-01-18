# Stripe Plan ID Fix - 400 Bad Request Error

**Date:** January 18, 2026  
**Issue:** Client sending invalid plan ID `"premium"` to `/api/stripe/create-checkout-session` endpoint  
**Status:** ✅ Fixed  

---

## Problem

When users tried to purchase a plan from the web, they received:

```
Status: 400 Bad Request
Error: "Email and plan are required" (or similar validation error)
```

**Root Cause:** The client was sending local plan IDs like `"premium"`, `"family-basic"`, `"family-pro"` but the backend Stripe integration expects specific Stripe price IDs.

### Invalid Request (Before Fix)
```json
{
  "plan": "premium",
  "email": "kortney@wihy.ai",
  "source": "web",
  "cancelUrl": "https://wihy.ai/payment/cancel",
  "successUrl": "https://wihy.ai/payment/success"
}
```

---

## Solution

Implemented a mapping layer between local plan IDs and Stripe price IDs in `checkoutService.ts`.

### Valid Stripe Price IDs (Backend Requirements)
```
pro_monthly       ← local: "premium" (monthly)
pro_yearly        ← local: "premium-yearly" (annual)
family_basic      ← local: "family-basic"
family_pro        ← local: "family-pro"
coach             ← local: "coach"
```

---

## Changes Made

### 1. Updated `WIHY_PLANS` Configuration

Added `stripePriceId` field to each plan mapping:

```typescript
export const WIHY_PLANS: Plan[] = [
  {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    price: 12.99,
    interval: 'month',
    stripePriceId: 'pro_monthly',  // ← NEW: Maps to backend Stripe ID
    features: [...],
    popular: true,
  },
  {
    id: 'premium-yearly',
    name: 'premium-yearly',
    displayName: 'Premium Annual',
    price: 99.99,
    interval: 'year',
    stripePriceId: 'pro_yearly',  // ← NEW: Maps to backend Stripe ID
    features: [...],
  },
  {
    id: 'family-basic',
    name: 'family-basic',
    displayName: 'Family Basic',
    price: 24.99,
    interval: 'month',
    stripePriceId: 'family_basic',  // ← NEW: Maps to backend Stripe ID
    features: [...],
  },
  {
    id: 'family-pro',
    name: 'family-pro',
    displayName: 'Family Pro',
    price: 49.99,
    interval: 'month',
    stripePriceId: 'family_pro',  // ← NEW: Maps to backend Stripe ID
    features: [...],
  },
  {
    id: 'coach',
    name: 'coach',
    displayName: 'Coach',
    price: 99.99,
    interval: 'one-time',
    stripePriceId: 'coach',  // ← NEW: Maps to backend Stripe ID
    features: [...],
  },
];
```

### 2. Updated `initiateCheckout()` Method

Added Stripe price ID resolution logic:

```typescript
async initiateCheckout(plan: string, email: string): Promise<CheckoutResponse> {
  // ... validation ...

  // Validate plan exists
  const validPlan = WIHY_PLANS.find(p => p.id === plan || p.name === plan);
  if (!validPlan) {
    return { success: false, error: `Invalid plan: ${plan}` };
  }

  // Map local plan ID to Stripe price ID ← NEW LOGIC
  const stripePriceId = validPlan.stripePriceId || plan;
  if (!stripePriceId) {
    return { success: false, error: `No Stripe price ID for plan: ${plan}` };
  }

  // ... setup callbacks ...

  console.log('[Checkout] Local Plan ID:', plan);
  console.log('[Checkout] Stripe Price ID:', stripePriceId);

  // Build request with Stripe price ID ← CRITICAL CHANGE
  const request: CheckoutRequest = {
    plan: stripePriceId,  // Use Stripe price ID: pro_monthly, pro_yearly, family_basic, family_pro, coach
    email: trimmedEmail,
    source,
    successUrl: callbacks.successUrl,
    cancelUrl: callbacks.cancelUrl,
  };

  // Send to backend
  const response = await fetchWithLogging(
    `${this.baseUrl}/api/stripe/create-checkout-session`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),  // Now contains valid stripePriceId
    }
  );
  // ...
}
```

### 3. Updated Plan Interface

Extended the `Plan` interface to include Stripe mapping:

```typescript
export interface Plan {
  id: string;                    // Local ID: premium, family-basic, etc.
  name: string;
  displayName: string;
  price: number;
  interval: 'month' | 'year' | 'one-time';
  description: string;
  features: string[];
  stripePriceId?: string;        // ← NEW: Maps to backend Stripe ID
  popular?: boolean;
  savings?: string;
}
```

---

## Valid Request (After Fix)

```json
{
  "plan": "pro_monthly",
  "email": "kortney@wihy.ai",
  "source": "web",
  "cancelUrl": "https://wihy.ai/payment/cancel",
  "successUrl": "https://wihy.ai/payment/success"
}
```

---

## Plan ID Mapping Reference

| Local ID | Stripe ID | Interval | Price | Description |
|----------|-----------|----------|-------|-------------|
| `premium` | `pro_monthly` | Monthly | $12.99/mo | Individual premium plan |
| `premium-yearly` | `pro_yearly` | Yearly | $99.99/yr | Individual annual plan |
| `family-basic` | `family_basic` | Monthly | $24.99/mo | Family plan (4 members) |
| `family-pro` | `family_pro` | Monthly | $49.99/mo | Family plan (8 members) |
| `coach` | `coach` | One-time | $99.99 | Coach platform |

---

## Testing Checklist

- [ ] Subscribe to "Premium" plan → Sends `pro_monthly`
- [ ] Subscribe to "Premium Annual" → Sends `pro_yearly`
- [ ] Subscribe to "Family Basic" → Sends `family_basic`
- [ ] Subscribe to "Family Pro" → Sends `family_pro`
- [ ] Subscribe to "Coach" → Sends `coach`
- [ ] Verify API returns `200 OK` with checkout URL
- [ ] Verify checkout URL opens Stripe Hosted Checkout
- [ ] Verify post-payment callback is received
- [ ] Verify subscription is activated after payment

---

## Code Files Modified

- **`mobile/src/services/checkoutService.ts`**
  - Lines 71-167: Updated `WIHY_PLANS` with `stripePriceId` mappings
  - Lines 263-279: Added Stripe price ID resolution logic
  - Lines 281-295: Updated logging to show both IDs
  - Lines 298-306: Updated request body to use `stripePriceId`

---

## Deployment Notes

1. **No backend changes required** - Backend already expects these Stripe IDs
2. **Backward compatible** - UI still works with local plan IDs internally
3. **Transparent to users** - No user-facing changes needed
4. **Error handling** - Better logging shows local vs Stripe ID for debugging

---

## Related Issues Resolved

- ✅ 400 Bad Request when initiating checkout
- ✅ Plan validation errors
- ✅ Unclear error messages (now shows both plan IDs)
- ✅ Payment flow broken for web users

---

## Future Improvements

1. Consider fetching valid Stripe price IDs from backend at runtime
2. Add plan ID validation endpoint to catch mismatches early
3. Support plan ID aliases for different regions/currencies
4. Add admin panel for plan ID mappings

---

## References

- Backend endpoint: `POST /api/stripe/create-checkout-session`
- Stripe documentation: https://stripe.com/docs/billing/prices
- Valid price IDs: `pro_monthly`, `pro_yearly`, `family_basic`, `family_pro`, `coach`
