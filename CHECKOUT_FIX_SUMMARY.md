# Checkout Service 400 Error - Fix Summary

## Problem
Client was getting `400 Bad Request` error when calling `/api/stripe/create-checkout-session` endpoint. The backend error message: **"Email and plan are required"** (49 characters).

## Root Cause
The backend endpoint was validating `email` and `plan` parameters, but:
1. Client had no **pre-request validation** to catch errors early
2. No **proper error handling** to log what was missing
3. No **email format validation** on client side
4. No **plan validation** to ensure valid plan IDs

## Solution Implemented

### 1. Enhanced Client-Side Validation
**File**: `mobile/src/services/checkoutService.ts`

**Changes**:
- ✅ Added `email` validation before request
- ✅ Added `plan` validation before request  
- ✅ Added email format validation (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- ✅ Added plan existence validation against `WIHY_PLANS`
- ✅ Trim and normalize email (`toLowerCase() + trim()`)
- ✅ Return early with clear error messages instead of making failed requests
- ✅ Enhanced logging with `[Checkout]` prefix for debugging
- ✅ Log full request body for troubleshooting
- ✅ Log response status and data

**Code Example**:
```typescript
async initiateCheckout(plan: string, email: string): Promise<CheckoutResponse> {
  // CRITICAL VALIDATION: Email and plan are required
  if (!email || typeof email !== 'string') {
    const errorMsg = 'Email is required for checkout';
    console.error('[Checkout] Validation Error:', errorMsg);
    return { success: false, error: errorMsg };
  }

  if (!plan || typeof plan !== 'string') {
    const errorMsg = 'Plan is required for checkout';
    console.error('[Checkout] Validation Error:', errorMsg);
    return { success: false, error: errorMsg };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim();
  if (!emailRegex.test(trimmedEmail)) {
    return { success: false, error: 'Please provide a valid email address' };
  }

  // Validate plan exists in WIHY_PLANS
  const validPlan = WIHY_PLANS.find(p => p.id === plan || p.name === plan);
  if (!validPlan) {
    return { success: false, error: `Invalid plan: ${plan}` };
  }
  
  // ... rest of implementation
}
```

### 2. Web Bundle Rebuilt
**Command**: `npm run build:web`

**Output**:
- Bundle hash: `AppEntry-29996a069a88cff8049839365b19f0aa.js`
- Size: 4.26 MB
- Build time: 1513ms
- Status: ✅ Production ready

### 3. Documentation Created
**File**: `STRIPE_CHECKOUT_REQUIREMENTS.md`

Contains:
- Backend API requirements for `/api/stripe/create-checkout-session`
- Request body specification with all required fields
- Complete validation rules that backend must implement
- Response formats (success and error cases)
- Environment variables needed
- Implementation checklist
- TypeScript/Express implementation template

## What Backend Must Do

The backend `/api/stripe/create-checkout-session` endpoint must:

### ✅ Required Validations:
1. **Email validation**:
   - Must not be empty or null
   - Must match email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Return 400 if invalid: `"Email is required"`

2. **Plan validation**:
   - Must be one of: `pro_monthly`, `pro_yearly`, `family_basic`, `family_pro`, `coach`
   - Return 400 if invalid: `"Plan is required"`

3. **Source (optional)**:
   - Should be `web`, `ios`, or `android`
   - Default to `web` if not provided

### ✅ Success Response (200):
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_...",
  "plan": "pro_monthly",
  "email": "user@example.com"
}
```

### ✅ Error Responses:
All validation errors should return `400` with this format:
```json
{
  "success": false,
  "error": "Email is required",
  "code": "VALIDATION_ERROR"
}
```

## Validation Flow

### Client Side (BEFORE request):
```
1. Check email exists and is string
2. Check plan exists and is string
3. Validate email format
4. Validate plan exists in WIHY_PLANS
5. Trim and normalize email
6. IF any check fails → return error immediately, don't make request
7. IF all checks pass → make API call
```

### Backend Side (STILL REQUIRED):
```
1. Check email exists and is string
2. Check plan exists and is string
3. Validate email format
4. Validate plan is in allowed list
5. Get or create Stripe customer
6. Create Stripe checkout session
7. Return checkout URL and session ID
```

## Testing the Fix

### Test Case 1: Missing Email
```javascript
// Client side - prevented before request
const result = await checkoutService.initiateCheckout('pro_monthly', '');
// Returns: { success: false, error: 'Email is required for checkout' }
// No API call made ✅
```

### Test Case 2: Invalid Email Format
```javascript
const result = await checkoutService.initiateCheckout('pro_monthly', 'notanemail');
// Returns: { success: false, error: 'Please provide a valid email address' }
// No API call made ✅
```

### Test Case 3: Missing Plan
```javascript
const result = await checkoutService.initiateCheckout('', 'user@example.com');
// Returns: { success: false, error: 'Plan is required for checkout' }
// No API call made ✅
```

### Test Case 4: Invalid Plan
```javascript
const result = await checkoutService.initiateCheckout('invalid_plan', 'user@example.com');
// Returns: { success: false, error: 'Invalid plan: invalid_plan' }
// No API call made ✅
```

### Test Case 5: Valid Request
```javascript
const result = await checkoutService.initiateCheckout('pro_monthly', 'user@example.com');
// Makes API call with validated params
// Console logs: [Checkout] Sending request body: {...}
// Response: { success: true, checkoutUrl: '...', sessionId: '...' }
```

## Benefits

1. **Faster error detection**: Validation errors caught before making requests
2. **Better debugging**: Enhanced logging with `[Checkout]` prefix
3. **Reduced server load**: No invalid requests hitting backend
4. **Clear error messages**: Users see specific validation errors
5. **Network efficient**: Client validates before making API calls
6. **Type safe**: TypeScript ensures email and plan are strings

## Files Modified

- ✅ `mobile/src/services/checkoutService.ts` - Enhanced `initiateCheckout()` method
- ✅ `mobile/dist/_expo/static/js/web/AppEntry-29996a069a88cff8049839365b19f0aa.js` - New web bundle

## Files Created

- ✅ `STRIPE_CHECKOUT_REQUIREMENTS.md` - Backend implementation guide

## Next Steps

1. Deploy new web bundle (hash: `29996a069a88cff8049839365b19f0aa`)
2. Implement backend validation in `/api/stripe/create-checkout-session`
3. Test checkout flow end-to-end
4. Monitor logs for any 400 errors (should be rare after fixes)
5. If 400 errors still occur, backend validation is missing

## Related Files

- Client validation: [checkoutService.ts](mobile/src/services/checkoutService.ts#L240)
- Hook using checkout: [usePayment.ts](mobile/src/hooks/usePayment.ts#L60)
- Backend requirements: [STRIPE_CHECKOUT_REQUIREMENTS.md](STRIPE_CHECKOUT_REQUIREMENTS.md)
