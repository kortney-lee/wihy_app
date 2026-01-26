# Subscription Implementation Analysis

**Date:** January 26, 2026  
**Status:** Issues Found - Needs Fixes

---

## Current State

### What Exists

1. **Services Created:**
   - ✅ `subscriptionService.ts` - Full API implementation
   - ✅ `purchaseService.ts` - Updated to use payment.wihy.ai
   - ✅ Exported from `services/index.ts`

2. **Screens Created:**
   - ✅ `SubscriptionManagementScreen.tsx` - Comprehensive management UI
   - ✅ `SubscriptionScreen.tsx` - Platform router (web/native)
   - ✅ `WebSubscriptionScreen.tsx` - Web marketing page
   - ✅ `NativeSubscriptionScreen.tsx` - Native IAP UI

3. **Navigation:**
   - ✅ Route exists: `Subscription` → `SubscriptionScreen`
   - ❌ No route to `SubscriptionManagementScreen`

### Current Profile.tsx Issues

#### 1. **WRONG PRICING** ❌

**Line 272:**
```typescript
subtitle: 'AI Coach & Instacart • $4.99/mo each',
```

**CORRECT PRICING:**
- **Add-ons** ($4.99/mo each):
  - Grocery Deals
  - Restaurant Partnerships

- **Integrations** ($7.99/mo each):
  - Instacart Meals Integration
  - Workout Tracking Integration

**Fix Needed:**
```typescript
subtitle: 'Grocery & Restaurant Deals • $4.99/mo | Instacart & Fitness • $7.99/mo',
```

Or better yet, make it dynamic by calling the API.

#### 2. **HARDCODED VALUES** ❌

Current implementation uses hardcoded strings instead of fetching real data:
- No API calls to get actual subscription status
- No real pricing from backend
- No actual add-on/integration data

#### 3. **NAVIGATION ISSUES** ❌

**Current:**
- "Upgrade to Premium" → `handleSubscribe()` → Opens PlansModal
- "Power-Up Add-ons" → `setShowAddOnsModal(true)` → Shows modal (doesn't exist properly)

**Should Be:**
- Both should navigate to `SubscriptionManagementScreen` which has:
  - Full subscription management
  - Add-ons tab
  - Integrations tab
  - Upgrade options

---

## API Endpoints (from WIHY_CLIENT_DATA_API.md)

### Base URL: `https://payment.wihy.ai/api/stripe`

### Subscription Plans
```http
GET /api/stripe/plans
```
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
      "priceId": "price_xxx",
      "features": [...]
    }
  ]
}
```

### Add-ons ($4.99/mo)
```http
GET /api/stripe/addons
```
**Items:**
- `grocery_deals` - Weekly coupons, store deals, price alerts
- `restaurant_partnerships` - 10-20% off at partners, exclusive menu items

### Integrations ($7.99/mo)
```http
GET /api/stripe/integrations
```
**Items:**
- `instacart_meals` - AI meal planning, shopping lists, direct ordering
- `workout_tracking` - Apple Watch, Fitbit, Garmin sync

### Active Subscription
```http
GET /api/subscriptions/active
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "active": true,
    "plan": "premium",
    "provider": "stripe",
    "expires_at": "2026-02-26T00:00:00Z",
    "auto_renew": true,
    "addons": [
      {
        "id": "grocery_deals",
        "name": "Grocery Deals",
        "price": 4.99,
        "subscriptionItemId": "si_xxx"
      }
    ]
  }
}
```

---

## Required Fixes

### Fix 1: Update Profile.tsx Subscription Section

**Replace hardcoded values with dynamic data:**

```typescript
// At top of Profile.tsx
import { subscriptionService, type ActiveSubscription } from '../services/subscriptionService';

// Add state
const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
const [loadingSubscription, setLoadingSubscription] = useState(true);

// Load subscription on mount
useEffect(() => {
  loadSubscriptionData();
}, []);

const loadSubscriptionData = async () => {
  try {
    setLoadingSubscription(true);
    const subscription = await subscriptionService.getActiveSubscription();
    setActiveSubscription(subscription);
  } catch (error) {
    console.error('[Profile] Failed to load subscription:', error);
  } finally {
    setLoadingSubscription(false);
  }
};

// Update subscription section items
{
  id: 'premium',
  title: activeSubscription?.status === 'active' 
    ? `${activeSubscription.plan} Plan Active` 
    : 'Upgrade to Premium',
  subtitle: activeSubscription?.status === 'active'
    ? `Renews ${new Date(activeSubscription.currentPeriodEnd * 1000).toLocaleDateString()}`
    : 'Full nutrition and fitness tools',
  type: 'navigation' as const,
  icon: activeSubscription?.status === 'active' ? 'checkmark-circle' : 'rocket',
  onPress: () => navigation.navigate('SubscriptionManagement'),
},
{
  id: 'addons',
  title: 'Add-ons & Integrations',
  subtitle: loadingSubscription 
    ? 'Loading...'
    : `${activeSubscription?.addons?.length || 0} active`,
  type: 'navigation' as const,
  icon: 'sparkles',
  onPress: () => navigation.navigate('SubscriptionManagement'),
},
```

### Fix 2: Add SubscriptionManagement Route

**In AppNavigator.tsx:**

```typescript
import { SubscriptionManagementScreen } from '../screens/SubscriptionManagementScreen';

// In Stack.Navigator
<Stack.Screen
  name="SubscriptionManagement"
  component={SubscriptionManagementScreen}
  options={{ title: 'Manage Subscription' }}
/>
```

**In RootStackParamList:**

```typescript
export type RootStackParamList = {
  // ... existing routes
  SubscriptionManagement: undefined;
  // ... rest
};
```

### Fix 3: Remove/Update PlansModal

The `PlansModal` is now redundant. All subscription management should go through `SubscriptionManagementScreen`.

**Options:**
1. Remove PlansModal entirely
2. Keep it for quick upgrade prompts, but have it navigate to SubscriptionManagementScreen
3. Update it to use the new subscriptionService

### Fix 4: Update Pricing Display

**Current screen shows:** "AI Coach & Instacart • $4.99/mo each"

**Should show one of:**

**Option A - Simple:**
```
Add-ons starting at $4.99/mo
```

**Option B - Detailed:**
```
Add-ons $4.99/mo | Integrations $7.99/mo
```

**Option C - Dynamic:**
```typescript
// Fetch real counts and show
`${addonsCount} add-ons, ${integrationsCount} integrations available`
```

---

## Web vs Native Differences

### Web (Stripe)
- ✅ Full checkout flow with Stripe
- ✅ Customer portal for management
- ✅ Add-ons/Integrations via Stripe subscription items
- ✅ Prorated upgrades automatic

### Native (iOS/Android)
- ⚠️ In-App Purchases (IAP) required
- ⚠️ App Store/Google Play product IDs needed
- ⚠️ Receipt verification with backend
- ⚠️ Can't add add-ons via IAP (Apple/Google limitation)

**Current Solution:**
- Native shows "Coming Soon" alert
- Directs users to web version for full subscription management
- Future: Implement IAP for basic plans only

---

## Plan IDs Reference

```typescript
type PlanId = 
  | 'free'              // $0
  | 'pro_monthly'       // $12.99/mo
  | 'pro_yearly'        // $99.99/yr
  | 'family_basic'      // $24.99/mo
  | 'family_pro'        // $49.99/mo
  | 'family_yearly'     // $479.99/yr
  | 'coach';            // $99.99 setup + $29.99/mo
```

---

## Summary

**Critical Issues:**
1. ❌ Wrong pricing displayed ($4.99 for everything)
2. ❌ No dynamic subscription data loading
3. ❌ Navigation doesn't go to SubscriptionManagementScreen
4. ❌ Missing route in AppNavigator

**Action Items:**
1. Fix Profile.tsx pricing
2. Add dynamic subscription loading
3. Update navigation to use SubscriptionManagementScreen
4. Add route to AppNavigator
5. Test on both web and native
6. Verify all API endpoints work

**Timeline:**
- Pricing fix: 5 minutes
- Navigation fix: 10 minutes
- Testing: 15 minutes
- **Total: ~30 minutes**
