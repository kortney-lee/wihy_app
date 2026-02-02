# Subscription Checkout - Testing & Validation Guide

## Quick Validation Checklist

Use this guide to validate the subscription checkout improvements are working correctly.

## ✅ Pre-Deployment Checklist

### Code Review
- [ ] Review `mobile/src/screens/WebSubscriptionScreen.tsx` for:
  - ✅ `authReady` import from useAuth
  - ✅ `pendingCheckoutPlanId` and `pendingCheckoutCycle` state
  - ✅ `generateCheckoutAttemptId()` function exists
  - ✅ `handleAuthSuccess()` writes to both storages
  - ✅ `useEffect` watches authReady and pendingCheckoutPlanId
  - ✅ `checkoutAttemptId` passed to checkout service

- [ ] Review `mobile/src/services/checkoutService.ts` for:
  - ✅ `CheckoutRequest` includes `checkoutAttemptId`
  - ✅ `initiateCheckout()` accepts `checkoutAttemptId` parameter
  - ✅ `getCallbackUrls()` uses `window.location.origin`
  - ✅ Fallback URL improved to `app.wihy.ai`

- [ ] Review `mobile/src/utils/planValidator.ts` for:
  - ✅ File exists with PlanId enum
  - ✅ `isValidPlanId()` function implemented
  - ✅ `validateCheckoutRequest()` function implemented
  - ✅ `getStripePriceId()` mapping function

### Build & Lint
```bash
# Run TypeScript checks
npm run type-check

# Run linting
npm run lint

# Build the app
npm run build
```

## 🧪 Manual Testing

### Test 1: Web - Auth Required Flow (Login)

**Scenario:** User not logged in, clicks Subscribe

```
1. Open https://localhost:3000 (or your dev domain)
2. Navigate to /subscription
3. Click "Subscribe" on "Premium" plan
4. Should see "Auth Modal" (login screen)
5. Open DevTools → Console
6. Check logs:
   - "[Subscribe] User not authenticated - showing auth modal"
   - "[Subscribe] Plan ID for checkout: pro_monthly"
   - "pendingCheckoutPlanId set to: pro_monthly"

7. Enter test credentials and login
8. Watch console for:
   - "[Subscribe] Authentication successful, preparing for checkout"
   - "Stored pending plan to sessionStorage"
   - "Stored pending plan to localStorage"
   - "[Subscribe] Auth is ready, proceeding with pending checkout"
   - "[Subscribe] Checkout attempt ID: checkout_attempt_..."
   - "Creating checkout for authenticated user"
   - "[Checkout] === INITIATING CHECKOUT REQUEST ===" 
   - "[Checkout] Parameters: { ..., checkoutAttemptId: '...' }"
   - "[Subscribe] Redirecting to checkout"

9. Should redirect to Stripe checkout page
```

**Success Criteria:**
- ✅ Auth modal appears
- ✅ Console shows authReady becoming true
- ✅ Checkout proceeds automatically without setTimeout delay
- ✅ checkoutAttemptId is logged
- ✅ Both sessionStorage and localStorage have pendingPlan

### Test 2: Web - Already Authenticated

**Scenario:** User already logged in, clicks Subscribe

```
1. Login first
2. Navigate to /subscription
3. Click "Subscribe" on "Premium" plan
4. Watch console for:
   - "Creating checkout for authenticated user"
   - "Checkout attempt ID: checkout_attempt_..."
   - "[Checkout] === INITIATING CHECKOUT REQUEST ==="
   - "[Subscribe] Redirecting to checkout"

5. Should redirect to Stripe immediately (no auth modal)
```

**Success Criteria:**
- ✅ No auth modal appears
- ✅ Immediate checkout (no delays)
- ✅ checkoutAttemptId is generated
- ✅ Checkout URL uses correct domain

### Test 3: Storage Fallback

**Scenario:** Test storage redundancy

```
1. Open DevTools → Application → Storage
2. Trigger auth flow (Test 1)
3. Check storages:
   - sessionStorage['pendingPlan'] should exist
   - localStorage['pendingPlan'] should exist
   - Both should have same data

4. Clear sessionStorage only
5. Reload page during auth flow
6. Check localStorage['pendingPlan'] still has data
7. Continue login/checkout flow
8. Should recover from localStorage

9. Clear both storages
10. Trigger auth flow again
11. Both storages should be written to again
```

**Success Criteria:**
- ✅ Both storages are used
- ✅ Data survives localStorage clear
- ✅ Fallback mechanism works
- ✅ No errors in console on quota exceeded

### Test 4: Return URLs

**Scenario:** Test that Stripe returns to correct domain

```
1. Start checkout flow
2. In Stripe test environment, complete payment
3. Should be redirected to:
   - Web: {window.location.origin}/payment/success
   - Not: hardcoded domain

4. Check that redirect includes correct domain:
   - Dev: http://localhost:3000/payment/success
   - Staging: https://staging.wihy.ai/payment/success
   - Prod: https://app.wihy.ai/payment/success

5. Can test by:
   - Adding breakpoint in openCheckout()
   - Logging callbacks before sending to API
   - Checking Stripe session details
```

**Success Criteria:**
- ✅ Return URL uses current domain
- ✅ Not hardcoded to wihy.ai
- ✅ Works on all environments

### Test 5: Plan Validation

**Scenario:** Test plan validation utility

```
1. Import planValidator in component
2. Test each function:

// Test isValidPlanId
import { isValidPlanId } from '../utils/planValidator';
console.log(isValidPlanId('pro_monthly'));  // true
console.log(isValidPlanId('invalid_plan')); // false

// Test validateCheckoutRequest
import { validateCheckoutRequest } from '../utils/planValidator';
const result = validateCheckoutRequest('pro_monthly', 'user@example.com', 'user123');
console.log(result.valid);  // true

// Test getStripePriceId
import { getStripePriceId } from '../utils/planValidator';
console.log(getStripePriceId('pro_monthly')); // 'pro_monthly'

// Test mapPlanToBillingCycle
import { mapPlanToBillingCycle } from '../utils/planValidator';
console.log(mapPlanToBillingCycle('pro_monthly', true)); // 'pro_yearly'
```

**Success Criteria:**
- ✅ All validation functions work
- ✅ Correct plan mappings
- ✅ No TypeScript errors
- ✅ Plan enum matches backend

## 🔍 Console Log Inspection

### Expected Console Logs During Checkout

**When User Clicks Subscribe (Not Authenticated):**
```
[Subscribe] User not authenticated - showing auth modal
[Subscribe] Plan ID for checkout: pro_monthly
pendingCheckoutPlanId → pro_monthly
```

**After Login (handleAuthSuccess):**
```
[Subscribe] Authentication successful, preparing for checkout
[Subscribe] Stored pending plan to sessionStorage
[Subscribe] Stored pending plan to localStorage
```

**When authReady Becomes True (useEffect trigger):**
```
[Subscribe] Auth is ready, proceeding with pending checkout
[Subscribe] User state: { id: 'user123', email: 'user@example.com' }
[Subscribe] Checkout attempt ID: checkout_attempt_1704067200000_a1b2c3d
```

**During handleSubscribe:**
```
[Subscribe] Creating checkout for authenticated user: { userId: 'user123', email: 'user@example.com' }
[Subscribe] Plan ID for checkout: pro_monthly
```

**In Checkout Service:**
```
[Checkout] === INITIATING CHECKOUT REQUEST ===
[Checkout] Parameters: { plan, email, userId, checkoutAttemptId }
[Checkout] === INITIATING CHECKOUT ===
[Checkout] Sending request body: { ... }
[Checkout] === CHECKOUT SESSION CREATED ===
[Checkout] Checkout URL: https://checkout.stripe.com/pay/cs_...
[Subscribe] Redirecting to checkout
```

## 🚨 Error Scenarios

### Error: "User not authenticated" after login
**Root Cause:** authReady still false
**Solution:** Check useEffect logs, verify AuthContext is setting authReady=true
**Fix:** Already implemented via authReady flag

### Error: "pendingPlan lost"
**Root Cause:** Storage clear or quota exceeded
**Solution:** Check both storages, should have fallback
**Fix:** Already implemented with dual storage

### Error: Return URL wrong domain
**Root Cause:** Hardcoded domain
**Solution:** Use window.location.origin
**Fix:** Already implemented in getCallbackUrls()

### Error: checkoutAttemptId not in logs
**Root Cause:** Not generated or passed
**Solution:** Verify generateCheckoutAttemptId called, passed to service
**Fix:** Already implemented, check console logs

## 📊 Metrics to Monitor

Post-deployment, monitor these metrics:

### 1. Checkout Success Rate
- Before: Track baseline
- After: Should improve (fewer race conditions)

### 2. Auth → Checkout Time
- Before: Typically 2+ seconds (setTimeout delay)
- After: Should be <500ms (immediate when authReady)

### 3. Storage Availability
- Monitor: How often localStorage fallback is used
- Goal: Minimize (most use sessionStorage)

### 4. Return URL Correctness
- Monitor: Stripe webhook events with correct return URLs
- Goal: 100% of checkouts have valid return URLs

### 5. checkoutAttemptId Usage
- Monitor: Tracing IDs in logs
- Goal: Every checkout has unique ID for debugging

## 🐛 Debugging Commands

### Browser Console Debugging

```javascript
// Check current auth state
auth.user      // User object
auth.authReady // Should be true if logged in
auth.isHydrating // Should be false

// Check pending plan
sessionStorage.getItem('pendingPlan')
localStorage.getItem('pendingPlan')

// Check current URL
window.location.origin

// Manually test planValidator
import { isValidPlanId, validateCheckoutRequest } from './utils/planValidator'
isValidPlanId('pro_monthly')
validateCheckoutRequest('pro_monthly', 'test@example.com', 'user123')
```

### Backend Log Correlation

When a checkout fails, search logs for checkoutAttemptId:

```bash
# Find all related logs for a checkout attempt
grep -r "checkout_attempt_1704067200000_a1b2c3d" /var/log/

# Should find logs in:
# - Browser console logs (client-side)
# - API logs (backend)
# - Stripe webhook logs (payment events)
```

## ✅ Final Sign-Off Checklist

Before marking as complete:

- [ ] All manual tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Both storage systems work
- [ ] checkoutAttemptId appears in logs
- [ ] Return URLs use window.location.origin
- [ ] Plan validation works
- [ ] Documentation updated
- [ ] Ready for staging deployment
- [ ] Ready for production deployment

---

**Validation Date:** ___________  
**Tested By:** ___________  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete  

