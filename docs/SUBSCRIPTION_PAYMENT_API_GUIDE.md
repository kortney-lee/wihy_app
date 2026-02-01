# WIHY Subscription Plans & Payment API Guide

**Last Updated:** February 1, 2026  
**Purpose:** Complete reference for frontend developers to correctly wire subscription flows

---

## Table of Contents

1. [Subscription Plans](#subscription-plans)
2. [Pricing Overview](#pricing-overview)
3. [Add-ons](#add-ons)
4. [API Endpoints](#api-endpoints)
5. [Complete Payment Flow](#complete-payment-flow)
6. [API Response Schemas](#api-response-schemas)
7. [Frontend Integration Checklist](#frontend-integration-checklist)
8. [Testing with Stripe Test Mode](#testing-with-stripe-test-mode)

---

## Subscription Plans

### 1. Free Plan
**Plan ID:** `free`

**Price:** $0/month

**Features:**
- Barcode scanning
- Photo food analysis
- Medication tracking
- Basic health dashboard

**Notes:** Default plan for all new users

---

### 2. WIHY Premium (Monthly)
**Plan ID:** `pro_monthly`

**Price:** $12.99/month

**Features:**
- Full nutrition and fitness tools
- Personal dashboard
- Meal planning and tracking
- Optional WIHY Coach (AI) add-on

**Upgrade Path:** Can upgrade to `pro_yearly`, `family_basic`, `family_pro`, `family_yearly`

---

### 3. WIHY Premium (Annual)
**Plan ID:** `pro_yearly`

**Price:** $99.00/year

**Features:**
- Everything in Premium Monthly
- Save 36% ($57/year)
- 2 months free

**Savings:** $56.88/year vs monthly plan

**Upgrade Path:** Can upgrade to `family_basic`, `family_pro`, `family_yearly`

---

### 4. WIHY Family Basic
**Plan ID:** `family_basic`

**Price:** $24.99/month

**Features:**
- Up to 4 family members
- Shared parent/guardian dashboard
- Individual accounts for everyone
- Optional WIHY Coach (AI) add-on

**Upgrade Path:** Can upgrade to `family_pro`, `family_yearly`

---

### 5. WIHY Family Pro
**Plan ID:** `family_pro`

**Price:** $49.99/month

**Features:**
- Up to 5 family members
- Every member gets their own login
- WIHY Coach (AI) included (no additional cost)
- Instacart Pro included (no additional cost)

**Upgrade Path:** Can upgrade to `family_yearly`

---

### 6. WIHY Family Pro Annual
**Plan ID:** `family_yearly`

**Price:** $479.99/year

**Features:**
- Everything in Family Pro
- Save 20% on annual plan
- Priority family support

**Savings:** $120/year vs monthly Family Pro

---

### 7. WIHY Coach Platform
**Plan ID:** `coach`

**Price:** $29.99/month + $99.99 one-time setup fee

**Features:**
- Unlimited clients
- Meal plan and workout creation
- Progress tracking & reporting
- Full app access for yourself
- Up to 1% affiliate commission

**Notes:**
- First payment includes both setup fee ($99.99) and first month ($29.99) = **$129.98 total**
- Subsequent months: $29.99/month only
- Cannot upgrade or downgrade to other plans
- Designed for health coaches and nutritionists

---

## Add-ons

### WIHY Coach (AI)
**Add-on ID:** `wihy_coach`

**Price:** $9.99/month

**Features:**
- 24/7 AI health coaching
- Personalized meal recommendations
- Workout guidance
- Progress insights and motivation

**Included FREE with:** `family_pro`, `family_yearly`

---

### Instacart Integration
**Add-on ID:** `instacart`

**Price:** $7.99/month

**Features:**
- AI-powered meal suggestions
- Auto-generate shopping lists
- One-click Instacart ordering
- Recipe library access

**Included FREE with:** `family_pro`, `family_yearly`

---

## Pricing Overview

| Plan | Monthly Price | Annual Price | Savings | Add-ons Available |
|------|---------------|--------------|---------|-------------------|
| Free | $0 | - | - | No |
| Premium | $12.99 | $99.00/year | $56.88/year | Yes |
| Family Basic | $24.99 | - | - | Yes |
| Family Pro | $49.99 | $479.99/year | $120/year | Included |
| Coach Platform | $29.99* | - | - | No |

*Coach plan includes $99.99 one-time setup fee on first payment

---

## API Endpoints

### Base URLs

- **Production:** `https://payment.wihy.ai/api/stripe`
- **Test Mode:** Same URL (switched via environment variables)

### Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/plans` | Get all available plans and pricing |
| POST | `/create-checkout-session` | Create Stripe checkout session |
| GET | `/checkout-session/:sessionId` | Retrieve session details + login token |
| POST | `/webhook` | Stripe webhook handler (internal) |

---

## Complete Payment Flow

### Step 1: User Selects Plan

Frontend displays plans using data from `GET /plans`:

```javascript
// Fetch available plans
const response = await fetch('https://payment.wihy.ai/api/stripe/plans');
const data = await response.json();

console.log(data.plans); // Array of plan objects
```

### Step 2: Create Checkout Session

```javascript
const response = await fetch('https://payment.wihy.ai/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',           // REQUIRED
    plan: 'pro_monthly',                  // REQUIRED
    source: 'web',                        // 'web', 'ios', 'android'
    successUrl: 'https://wihy.ai/payment/success',  // Optional
    cancelUrl: 'https://wihy.ai/payment/cancel',    // Optional
    name: 'John Doe',                     // Optional
    userId: 'uuid-if-logged-in',          // Optional
    affiliateId: 'coach-uuid'             // Optional (for coach plan)
  })
});

const data = await response.json();
// data = { success: true, checkoutUrl: 'https://checkout.stripe.com/...', sessionId: 'cs_test_...' }
```

### Step 3: Redirect to Stripe Checkout

```javascript
// Redirect user to Stripe hosted checkout
window.location.href = data.checkoutUrl;
```

### Step 4: User Completes Payment

User enters payment details on Stripe's secure checkout page and completes payment.

### Step 5: Stripe Redirects to Success URL

Stripe automatically redirects to:
```
https://wihy.ai/payment/success?session_id=cs_test_a1bj6VQOgZvNuMjY4gFyMkpv0Jc2Q9tjEy3vPPSriVPPMrG0Rm6k7NShb2
```

### Step 6: Retrieve Session + Login Token

**CRITICAL:** The frontend MUST extract `session_id` from URL query params and call the checkout-session endpoint:

```javascript
// Extract session_id from URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

if (!sessionId) {
  console.error('No session_id in URL!');
  return;
}

// Retrieve checkout session details
const response = await fetch(`https://payment.wihy.ai/api/stripe/checkout-session/${sessionId}`);
const data = await response.json();

console.log('Checkout session retrieved:', data);
```

### Step 7: Auto-Login with Token

**CRITICAL PATH FOR LOGIN:**

```javascript
// ❌ WRONG - Looking in the wrong place
const loginToken = data.session.loginToken; // undefined!

// ✅ CORRECT - Token is in auth object
const loginToken = data.auth.loginToken;
const userId = data.auth.userId;
const isNewUser = data.auth.isNewUser;

if (!loginToken) {
  console.error('No login token in checkout session');
  // Handle error - payment succeeded but can't auto-login
  return;
}

// Store token and user data
localStorage.setItem('authToken', loginToken);
localStorage.setItem('userId', userId);

// Redirect to dashboard or onboarding
if (isNewUser) {
  window.location.href = '/onboarding';
} else {
  window.location.href = '/dashboard';
}
```

---

## API Response Schemas

### 1. GET `/plans`

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "pro_monthly",
      "name": "WIHY Premium",
      "price": 12.99,
      "interval": "month",
      "priceId": "price_1SrKJTCb0XQPUqHrkDY0fLzp",
      "stripePriceId": "price_1SrKJTCb0XQPUqHrkDY0fLzp",
      "stripeProductName": "WIHY Premium",
      "features": [
        "Full nutrition and fitness tools",
        "Personal dashboard",
        "Meal planning and tracking",
        "Optional WIHY Coach (AI)"
      ]
    },
    {
      "id": "coach",
      "name": "WIHY Coach Platform",
      "price": 29.99,
      "setupFee": 99.99,
      "interval": "month",
      "priceId": "price_1SrKJVCb0XQPUqHrT17VvmGU",
      "setupPriceId": "price_1SrKJWCb0XQPUqHrHzHS8cG1",
      "features": [
        "Unlimited clients",
        "Meal plan and workout creation",
        "Progress tracking & reporting",
        "Full app access for yourself",
        "Up to 1% affiliate commission"
      ]
    }
  ],
  "data": [...] // Mirror of plans array
}
```

---

### 2. POST `/create-checkout-session`

**Request Body:**
```json
{
  "email": "user@example.com",
  "plan": "pro_monthly",
  "source": "web",
  "successUrl": "https://wihy.ai/payment/success",
  "cancelUrl": "https://wihy.ai/payment/cancel",
  "name": "John Doe",
  "userId": "312d15b6-3147-4a24-b2f6-d1c812ab0ea6",
  "affiliateId": "coach-uuid-here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_a1bj6VQOgZvNuMjY4gFyMkpv0Jc2Q9tjEy3vPPSriVPPMrG0Rm6k7NShb2",
  "sessionId": "cs_test_a1bj6VQOgZvNuMjY4gFyMkpv0Jc2Q9tjEy3vPPSriVPPMrG0Rm6k7NShb2",
  "plan": "pro_monthly",
  "email": "user@example.com",
  "url": "https://checkout.stripe.com/...",
  "sessionUrl": "https://checkout.stripe.com/...",
  "data": {
    "url": "https://checkout.stripe.com/...",
    "sessionId": "cs_test_..."
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Email is required",
  "code": "VALIDATION_ERROR"
}
```

---

### 3. GET `/checkout-session/:sessionId`

**⚠️ MOST IMPORTANT ENDPOINT FOR AUTO-LOGIN**

**Request:**
```http
GET https://payment.wihy.ai/api/stripe/checkout-session/cs_test_a1bj6VQOgZvNuMjY4gFyMkpv0Jc2Q9tjEy3vPPSriVPPMrG0Rm6k7NShb2
```

**Success Response (200) - Payment Complete:**
```json
{
  "success": true,
  "session": {
    "id": "cs_test_a1bj6VQOgZvNuMjY4gFyMkpv0Jc2Q9tjEy3vPPSriVPPMrG0Rm6k7NShb2",
    "status": "complete",
    "paymentStatus": "paid",
    "email": "user@example.com",
    "plan": "pro_monthly",
    "customerId": "cus_TttYdzEoKxSJXA",
    "subscriptionId": "sub_1Sw5lnCb0XQPUqHrKfMkufDy"
  },
  "auth": {
    "userId": "312d15b6-3147-4a24-b2f6-d1c812ab0ea6",
    "isNewUser": false,
    "loginToken": "2a61bf3f7e920cdcd7132bfcf296147065b49c973fee7ca4200897807044a96d"
  }
}
```

**Success Response (200) - Payment NOT Complete:**
```json
{
  "success": true,
  "session": {
    "id": "cs_test_...",
    "status": "open",
    "paymentStatus": "unpaid",
    "email": "user@example.com",
    "plan": "pro_monthly",
    "customerId": null,
    "subscriptionId": null
  },
  "auth": null
}
```

---

### 4. Auth Service Response (Internal)

When payment service calls `POST /api/auth/create-from-payment`:

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "pro_monthly",
  "stripeCustomerId": "cus_TttYdzEoKxSJXA",
  "stripeSubscriptionId": "sub_1Sw5lnCb0XQPUqHrKfMkufDy",
  "source": "stripe"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "312d15b6-3147-4a24-b2f6-d1c812ab0ea6",
  "isNewUser": true,
  "loginToken": "2a61bf3f7e920cdcd7132bfcf296147065b49c973fee7ca4200897807044a96d",
  "expiresAt": "2026-02-01T19:23:45.678Z"
}
```

**User Database Record After Subscription:**
```sql
SELECT id, email, name, plan, subscription_status, stripe_customer_id, 
       stripe_subscription_id, provider, email_verified, status
FROM users 
WHERE email = 'user@example.com';
```

**Result:**
```
id:                     312d15b6-3147-4a24-b2f6-d1c812ab0ea6
email:                  user@example.com
name:                   John Doe
plan:                   pro_monthly
subscription_status:    active
stripe_customer_id:     cus_TttYdzEoKxSJXA
stripe_subscription_id: sub_1Sw5lnCb0XQPUqHrKfMkufDy
provider:               stripe
email_verified:         false (will verify via magic link)
status:                 ACTIVE
subscription_start_date: 2026-02-01 18:53:19
created_at:             2026-02-01 18:53:19
updated_at:             2026-02-01 18:53:19
```

---

## Frontend Integration Checklist

### ✅ Step 1: Display Plans Page
```javascript
// Fetch plans
const plans = await fetch('https://payment.wihy.ai/api/stripe/plans')
  .then(r => r.json())
  .then(d => d.plans);

// Render plan cards with features and pricing
plans.forEach(plan => {
  renderPlanCard({
    name: plan.name,
    price: plan.price,
    interval: plan.interval,
    features: plan.features,
    setupFee: plan.setupFee, // For coach plan
    onSubscribe: () => createCheckoutSession(plan.id)
  });
});
```

---

### ✅ Step 2: Create Checkout Session
```javascript
async function createCheckoutSession(planId) {
  const user = getCurrentUser(); // Get from state/context
  
  const response = await fetch('https://payment.wihy.ai/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email || promptForEmail(),
      plan: planId,
      source: 'web', // or 'ios', 'android'
      successUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      name: user.name,
      userId: user.id,
      affiliateId: getReferralCode() // If applicable
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Redirect to Stripe checkout
    window.location.href = data.checkoutUrl;
  } else {
    alert(`Error: ${data.error}`);
  }
}
```

---

### ✅ Step 3: Handle Success Page (CRITICAL)
```javascript
// /payment/success page component

async function handlePaymentSuccess() {
  // Extract session_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (!sessionId) {
    console.error('❌ No session_id in URL - payment flow broken!');
    alert('Payment session not found. Please contact support.');
    return;
  }
  
  console.log('✅ Session ID found:', sessionId);
  
  try {
    // Fetch checkout session details + login token
    const response = await fetch(
      `https://payment.wihy.ai/api/stripe/checkout-session/${sessionId}`
    );
    const data = await response.json();
    
    console.log('Checkout session retrieved:', {
      hasAuth: !!data.auth,
      hasLoginToken: !!data.auth?.loginToken,
      email: data.session.email
    });
    
    // ⚠️ CRITICAL: Check auth object, not session object
    if (!data.auth || !data.auth.loginToken) {
      console.error('❌ No login token in checkout session');
      
      // Payment succeeded but can't auto-login
      // Option 1: Send magic link
      await sendMagicLink(data.session.email);
      alert('Payment successful! Check your email for login instructions.');
      
      // Option 2: Redirect to login
      window.location.href = '/login?email=' + encodeURIComponent(data.session.email);
      return;
    }
    
    // ✅ Login token found - auto-login user
    const { loginToken, userId, isNewUser } = data.auth;
    
    // Store auth data
    localStorage.setItem('authToken', loginToken);
    localStorage.setItem('userId', userId);
    
    // Redirect based on user status
    if (isNewUser) {
      console.log('✅ New user - redirecting to onboarding');
      window.location.href = '/onboarding?plan=' + data.session.plan;
    } else {
      console.log('✅ Existing user - redirecting to dashboard');
      window.location.href = '/dashboard';
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    alert('Error verifying payment. Please contact support.');
  }
}

// Call on page load
handlePaymentSuccess();
```

---

### ✅ Step 4: Handle Cancel Page
```javascript
// /payment/cancel page component

function handlePaymentCancel() {
  console.log('User cancelled payment');
  
  // Show message
  displayMessage('Payment cancelled. You can try again anytime.');
  
  // Redirect back to plans after 3 seconds
  setTimeout(() => {
    window.location.href = '/plans';
  }, 3000);
}
```

---

## Testing with Stripe Test Mode

### Current Test Mode Configuration

**Status:** ✅ ACTIVE (as of Feb 1, 2026)

**Test Price IDs:**
```javascript
STRIPE_PRICE_PRO_MONTHLY=price_1SrKJTCb0XQPUqHrkDY0fLzp
STRIPE_PRICE_PRO_YEARLY=price_1SrKJUCb0XQPUqHrXewrKuc0
STRIPE_PRICE_FAMILY_BASIC=price_1SrKJUCb0XQPUqHr9GlZ4uXG
STRIPE_PRICE_FAMILY_PRO=price_1SrKJVCb0XQPUqHrT17VvmGU
STRIPE_PRICE_FAMILY_YEARLY=price_1SrKJVCb0XQPUqHrHzHS8cG1
STRIPE_PRICE_COACH_MONTHLY=price_1SrKJWCb0XQPUqHrJ8ZjK3Lm
STRIPE_PRICE_COACH_SETUP=price_1SrKJWCb0XQPUqHrT9YuI2Kn
```

### Test Credit Cards

Use these test cards in Stripe checkout:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success (any future expiry, any CVV) |
| 4000 0025 0000 3155 | Requires 3D Secure authentication |
| 4000 0000 0000 9995 | Card declined (insufficient funds) |
| 4000 0000 0000 0002 | Card declined (generic decline) |

**Expiry:** Any future date (e.g., 12/28)  
**CVV:** Any 3 digits (e.g., 123)  
**ZIP:** Any 5 digits (e.g., 12345)

### Test Workflow

1. **Create checkout session** with test email:
   ```bash
   POST /create-checkout-session
   Body: { email: "test@example.com", plan: "pro_monthly" }
   ```

2. **Navigate to checkout URL** returned in response

3. **Enter test card:** 4242 4242 4242 4242

4. **Complete payment**

5. **Verify redirect** to success URL with session_id

6. **Check login token** is returned in `auth.loginToken`

7. **Verify user in database:**
   ```sql
   SELECT * FROM users WHERE email = 'test@example.com';
   ```

---

## Common Frontend Issues & Solutions

### ❌ Issue 1: "No login token in checkout session"

**Cause:** Frontend looking for `session.loginToken` instead of `auth.loginToken`

**Solution:**
```javascript
// ❌ WRONG
const token = data.session.loginToken;

// ✅ CORRECT
const token = data.auth?.loginToken;
```

---

### ❌ Issue 2: "No session_id in URL"

**Cause:** Success URL overwrites `{CHECKOUT_SESSION_ID}` placeholder

**Solution:** Backend now auto-appends session_id parameter (fixed in rev 00058)

---

### ❌ Issue 3: Payment succeeds but user not created

**Cause:** Webhook not firing or auth service error

**Solution:** Check payment-service logs:
```bash
gcloud run services logs read wihy-payment-service --region=us-central1
```

Look for:
- `checkout.session.completed` webhook events
- `Auth result: userId=... isNewUser=... hasToken=...`

---

### ❌ Issue 4: Coach plan shows $29.99 instead of $129.98

**Cause:** Not displaying setup fee on first payment

**Solution:**
```javascript
const totalFirstPayment = plan.price + (plan.setupFee || 0);
// For coach: $29.99 + $99.99 = $129.98
```

---

## Expected User Journey

### New User Subscribing

1. User visits `/plans` → sees all plans
2. User clicks "Subscribe to Premium" → creates checkout session
3. Redirected to Stripe → enters card 4242 4242 4242 4242
4. Payment succeeds → redirected to `/payment/success?session_id=cs_test_...`
5. Frontend extracts `session_id` → calls `/checkout-session/:id`
6. Response contains `auth.loginToken` → stores token
7. User auto-logged in → redirected to `/onboarding` (isNewUser=true)
8. User completes onboarding → redirected to `/dashboard`

### Existing User Upgrading

1. Logged-in user visits `/plans` → sees upgrade options
2. User clicks "Upgrade to Family Pro" → creates checkout session with userId
3. Redirected to Stripe → enters card
4. Payment succeeds → redirected to success page
5. Frontend gets `auth.loginToken` → updates auth state
6. User stays logged in → redirected to `/dashboard` (isNewUser=false)
7. Dashboard shows new plan features immediately

---

## Database Schema Reference

### Users Table (After Subscription)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',  -- 'free', 'pro_monthly', 'family_pro', etc.
  subscription_status VARCHAR(50),  -- 'active', 'canceled', 'past_due', etc.
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_start_date TIMESTAMP,
  provider VARCHAR(50),  -- 'local', 'google', 'stripe', etc.
  email_verified BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'ACTIVE',  -- 'ACTIVE', 'INACTIVE', 'SUSPENDED'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Login Token Table

```sql
CREATE TABLE password_reset_tokens (
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) NOT NULL,  -- SHA256 hash of login token
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id)
);
```

**Token Expiry:** 1 hour from creation

---

## Support & Debugging

### Check Service Health

```bash
# Payment service
curl https://payment.wihy.ai/health

# Auth service
curl https://auth.wihy.ai/health
```

### View Logs

```bash
# Payment service logs
gcloud run services logs read wihy-payment-service --region=us-central1 --limit=100

# Auth service logs
gcloud run services logs read wihy-auth-service --region=us-central1 --limit=100
```

### Test Checkout Flow (PowerShell)

```powershell
# Create checkout session
$body = @{
  plan = 'pro_monthly'
  email = 'test@example.com'
  source = 'web'
} | ConvertTo-Json

$session = Invoke-RestMethod -Uri 'https://payment.wihy.ai/api/stripe/create-checkout-session' -Method POST -Headers @{'Content-Type'='application/json'} -Body $body

# Get session details (after payment)
$details = Invoke-RestMethod -Uri "https://payment.wihy.ai/api/stripe/checkout-session/$($session.sessionId)" -Method GET

# Check for login token
$details.auth.loginToken
```

---

## Revision History

| Date | Revision | Changes |
|------|----------|---------|
| 2026-02-01 | 1.0 | Initial documentation |
| 2026-02-01 | 1.1 | Fixed session_id auto-append logic (rev 00058) |
| 2026-02-01 | 1.2 | Clarified auth.loginToken path (not session.loginToken) |

---

**Document Owner:** Engineering Team  
**Last Verified:** February 1, 2026 (TEST mode active, all endpoints working)
