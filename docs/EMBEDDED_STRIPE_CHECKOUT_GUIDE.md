# Embedded Stripe Checkout - Client Implementation Guide

**Last Updated:** February 2, 2026  
**Backend Status:** ✅ Updated to support embedded checkout (revision 00068-rwk+)

---

## Overview

The backend now supports **Stripe Embedded Checkout**, allowing users to complete payment without leaving your app. This eliminates the need for in-app browser redirects and provides a seamless mobile experience.

### What Changed (Backend)

- ✅ Added `ui_mode: 'embedded'` to checkout session creation
- ✅ Returns `clientSecret` instead of redirect URL
- ✅ Changed `success_url` to `return_url` (Stripe embedded requirement)
- ✅ Backward compatible - still returns legacy fields

---

## Getting Started

### 1. Install Stripe.js

#### For React Web App

```bash
npm install @stripe/stripe-js
```

#### For React Native

```bash
npm install @stripe/stripe-react-native
```

### 2. Get Your Publishable Key

Contact backend team or retrieve from GCP Secret Manager:

**TEST Mode:**
```bash
gcloud secrets versions access latest --secret="stripe-test-publishable-key"
# Output: pk_test_51SSoCzCb0XQPUqHr...
```

**LIVE Mode:**
```bash
gcloud secrets versions access latest --secret="stripe-live-publishable-key"
# Output: pk_live_51SSoCzCb0XQPUqHr...
```

---

## Implementation

### React Web App (Complete Example)

```jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51SSoCzCb0XQPUqHr...');

function CheckoutPage({ user, selectedPlan }) {
  const [checkoutError, setCheckoutError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setCheckoutError(null);

      // Step 1: Create checkout session (call your backend)
      const response = await fetch('https://payment.wihy.ai/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth token if needed
          // 'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,           // REQUIRED
          email: user.email,          // REQUIRED
          plan: selectedPlan,         // e.g., 'family_pro', 'pro_monthly'
          name: user.name,            // Optional
          successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
          source: 'web'               // Optional: 'web', 'ios', 'android'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Step 2: Initialize Stripe embedded checkout
      const stripe = await stripePromise;
      const checkout = await stripe.initEmbeddedCheckout({
        clientSecret: data.clientSecret
      });

      // Step 3: Mount checkout in your div
      checkout.mount('#checkout-container');

    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Checkout - {selectedPlan}</h1>
      
      {/* Checkout button */}
      {!loading && (
        <button onClick={handleCheckout} disabled={loading}>
          {loading ? 'Loading...' : 'Proceed to Payment'}
        </button>
      )}

      {/* Error display */}
      {checkoutError && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {checkoutError}
        </div>
      )}

      {/* Checkout form will be mounted here */}
      <div id="checkout-container" style={{ marginTop: '20px' }}></div>
    </div>
  );
}

export default CheckoutPage;
```

### React Native (Complete Example)

```jsx
import React, { useState } from 'react';
import { View, Button, Alert, ActivityIndicator } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SSoCzCb0XQPUqHr...';

function CheckoutScreen({ user, selectedPlan }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Step 1: Create checkout session
      const response = await fetch('https://payment.wihy.ai/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if needed
          // 'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          plan: selectedPlan,  // 'family_pro', 'pro_monthly', etc.
          name: user.name,
          successUrl: 'https://wihy.ai/payment/success',
          cancelUrl: 'https://wihy.ai/payment/cancel',
          source: 'mobile'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Step 2: Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'WIHY',
        returnURL: 'wihy://payment-success',  // Your app's deep link
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      // Step 3: Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment canceled', presentError.message);
      } else {
        Alert.alert('Success', 'Your payment was successful!');
        // Navigate to success screen
        // navigation.navigate('PaymentSuccess');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button
          title={`Subscribe to ${selectedPlan}`}
          onPress={handleCheckout}
          disabled={loading}
        />
      )}
    </View>
  );
}

// Wrap in StripeProvider
export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <CheckoutScreen user={currentUser} selectedPlan="family_pro" />
    </StripeProvider>
  );
}
```

---

## API Reference

### Backend Endpoint

**POST** `https://payment.wihy.ai/api/stripe/create-checkout-session`

#### Request Body

```json
{
  "userId": "user-uuid",           // REQUIRED - User must be logged in
  "email": "user@example.com",     // REQUIRED
  "plan": "family_pro",            // REQUIRED - Plan ID
  "name": "John Doe",              // Optional - User's full name
  "successUrl": "https://...",     // Optional - Return URL after payment
  "cancelUrl": "https://...",      // Optional - Return URL on cancel
  "source": "web",                 // Optional - 'web', 'ios', 'android'
  "affiliateId": "affiliate123"    // Optional - Affiliate tracking
}
```

#### Valid Plan IDs (TEST Mode)

| Plan ID | Description | Price | Interval |
|---------|-------------|-------|----------|
| `pro_monthly` | WIHY Premium (Monthly) | $12.99 | month |
| `pro_yearly` | WIHY Premium (Annual) | $99.00 | year |
| `family_basic` | WIHY Premium+ | $24.99 | month |
| `family_pro` | WIHY Family+ (Monthly) | $34.99 | month |
| `family_yearly` | WIHY Family+ (Annual) | $349.99 | year |
| `coach` | WIHY Coach + Family Bundle | $64.98 | month |

#### Response (Success)

```json
{
  "success": true,
  "clientSecret": "cs_test_a1b2c3...",  // Use this for embedded checkout
  "sessionId": "cs_test_a1b2c3...",
  "plan": "family_pro",
  "email": "user@example.com",
  "data": {
    "clientSecret": "cs_test_a1b2c3...",
    "sessionId": "cs_test_a1b2c3...",
    "url": null  // null in embedded mode
  }
}
```

#### Response (Error - User Not Logged In)

```json
{
  "success": false,
  "error": "User must be logged in before checkout. Please sign up or login first.",
  "code": "AUTH_REQUIRED"
}
```

---

## Payment Success Flow

After successful payment, Stripe will:

1. **Webhook triggers** → Backend updates user's subscription in database
2. **User redirected** → To your `successUrl` with `?session_id={CHECKOUT_SESSION_ID}`

### Verify Payment on Success Page

```javascript
// On your success page (e.g., /payment/success)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (sessionId) {
    // Optional: Call your backend to verify payment
    fetch(`https://payment.wihy.ai/api/stripe/verify-session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('Payment verified!', data);
          // Update UI, show success message
        }
      });
  }
}, []);
```

---

## Error Handling

### Common Errors

| Error Code | Message | Solution |
|------------|---------|----------|
| `AUTH_REQUIRED` | User must be logged in | Redirect to login page |
| `VALIDATION_ERROR` | Invalid email format | Fix email validation |
| `STRIPE_ERROR` | Stripe not configured | Contact backend team |
| `CARD_DECLINED` | Card declined | Ask user to try different card |

### Error Handling Example

```javascript
try {
  const response = await fetch('https://payment.wihy.ai/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email, plan })
  });

  const data = await response.json();

  if (!data.success) {
    // Handle specific error codes
    if (data.code === 'AUTH_REQUIRED') {
      // Redirect to login
      window.location.href = '/login?redirect=/checkout';
    } else if (data.code === 'VALIDATION_ERROR') {
      // Show validation error
      setError(data.error);
    } else {
      // Generic error
      setError('Payment failed. Please try again.');
    }
    return;
  }

  // Success - proceed with checkout
  const checkout = await stripe.initEmbeddedCheckout({
    clientSecret: data.clientSecret
  });
  checkout.mount('#checkout-container');

} catch (error) {
  console.error('Checkout error:', error);
  setError('Network error. Please check your connection.');
}
```

---

## Testing

### Test Cards (TEST Mode Only)

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | ✅ Successful payment |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |
| `4000 0000 0000 0069` | ⏰ Expired card |
| `4000 0000 0000 0127` | ❌ Incorrect CVC |

- **Expiry:** Use any future date (e.g., `12/34`)
- **CVC:** Use any 3 digits (e.g., `123`)
- **ZIP:** Use any 5 digits (e.g., `12345`)

### Testing Checklist

- [ ] User can initiate checkout after login
- [ ] Embedded checkout form displays correctly
- [ ] Test card `4242 4242 4242 4242` completes successfully
- [ ] User redirected to success page with `session_id`
- [ ] Webhook updates user's subscription in database
- [ ] User sees updated subscription status in app
- [ ] Test declined card `4000 0000 0000 0002` shows error
- [ ] Cancel flow redirects to cancel URL

---

## Migration from Redirect Checkout

If you previously used redirect-based checkout (`session.url`), here's what to change:

### Before (Redirect Checkout)

```javascript
const data = await createCheckoutSession();
window.location.href = data.checkoutUrl;  // Redirect to Stripe
```

### After (Embedded Checkout)

```javascript
const data = await createCheckoutSession();
const stripe = await loadStripe('pk_test_...');
const checkout = await stripe.initEmbeddedCheckout({
  clientSecret: data.clientSecret  // Use clientSecret instead
});
checkout.mount('#checkout-container');  // Mount in-app
```

### Backward Compatibility

The backend still returns legacy fields (`checkoutUrl`, `url`, `sessionUrl`) for backward compatibility, but these will be `null` in embedded mode. Update your frontend to use `clientSecret` instead.

---

## Security Best Practices

1. **Always validate userId** - Backend will reject requests without valid user ID
2. **Use HTTPS only** - Never send payment data over HTTP
3. **Don't log sensitive data** - Never log `clientSecret` or card details
4. **Verify on backend** - Always verify payment completion via webhook
5. **Use environment variables** - Store publishable keys in env vars, not in code

---

## Production Deployment

### Before Going LIVE

1. **Switch to LIVE publishable key:**
   ```javascript
   const stripePromise = loadStripe('pk_live_51SSoCzCb0XQPUqHr...');
   ```

2. **Update backend to LIVE mode** (backend team will handle this)

3. **Test with small real payment** ($1 test subscription) and immediately refund

4. **Verify webhook is working** - Check user subscription updates correctly

---

## Support & Resources

- **Stripe Embedded Checkout Docs:** https://stripe.com/docs/payments/checkout/embedded
- **Stripe.js Reference:** https://stripe.com/docs/js
- **React Integration:** https://stripe.com/docs/stripe-js/react
- **React Native SDK:** https://stripe.com/docs/payments/accept-a-payment?platform=react-native

### Contact

- **Backend API Issues:** Contact backend team
- **Stripe Configuration:** Check [STRIPE_PRODUCTS_PRICING.md](STRIPE_PRODUCTS_PRICING.md)
- **Account-First Flow:** See [ACCOUNT_FIRST_CHECKOUT_FLOW.md](ACCOUNT_FIRST_CHECKOUT_FLOW.md)

---

## Quick Start Summary

1. Install: `npm install @stripe/stripe-js` or `@stripe/stripe-react-native`
2. Get publishable key from backend team
3. Call backend to create checkout session (get `clientSecret`)
4. Initialize embedded checkout with `clientSecret`
5. Mount checkout in your app's div/component
6. Handle success redirect with `session_id` parameter
7. Verify payment via webhook (backend handles this)

**That's it!** Users can now complete checkout without leaving your app. 🎉

---

## Implementation Status

### WIHY Client Implementation

**Completed:**
- ✅ Installed `@stripe/stripe-js` package
- ✅ Created `EmbeddedCheckout.tsx` component in `mobile/src/components/web/`
- ✅ Updated `checkoutService.ts` to handle `clientSecret` response
- ✅ Updated `WebSubscriptionScreen.tsx` to show embedded checkout modal
- ✅ Fallback to redirect checkout if backend doesn't return `clientSecret`

**Files Changed:**
- `mobile/src/components/web/EmbeddedCheckout.tsx` - New embedded checkout modal component
- `mobile/src/services/checkoutService.ts` - Added `clientSecret` to `CheckoutResponse`
- `mobile/src/screens/WebSubscriptionScreen.tsx` - Integrated embedded checkout flow

**Flow:**
1. User clicks "Subscribe" button
2. If not authenticated → Show auth modal
3. After auth → Call `checkoutService.initiateCheckout()`
4. If response has `clientSecret` → Show `EmbeddedCheckout` modal
5. If response only has `checkoutUrl` → Fallback to redirect
6. On success → Redirect to `/payment/success`
