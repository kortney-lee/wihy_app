# Subscription Configuration Guide

## Overview

All subscription plans, add-ons, and integrations are now defined in a **single source of truth**: 
`mobile/src/config/subscriptionConfig.ts`

⚠️ **NEVER hardcode prices anywhere else!** Always import from this config file.

---

## Pricing Structure

### Plans
| Plan ID | Name | Price | Description |
|---------|------|-------|-------------|
| `free` | Free | $0/mo | Essential features |
| `pro_monthly` | Premium | $12.99/mo | Full features |
| `pro_yearly` | Premium (Annual) | $99.99/yr ($8.33/mo) | Save 20% |
| `family_basic` | Family Basic | $24.99/mo | Up to 4 members |
| `family_pro` | Family Pro | $49.99/mo | Up to 5 members + perks |
| `family_yearly` | Family Pro (Annual) | $479.99/yr ($39.99/mo) | Save 20% |
| `coach` | Coach Platform | $99.99 setup + $29.99/mo + 1% | For professionals |

### Add-ons - $4.99/mo
| ID | Name | Features |
|----|------|----------|
| `grocery_deals` | Grocery Store Deals | Weekly coupons, store deals, price match |
| `restaurant_partnerships` | Restaurant Discounts | 10-20% off at partners |

### Integrations - $7.99/mo
| ID | Name | Features |
|----|------|----------|
| `instacart_meals` | Instacart Meals | AI meal planning, auto shopping lists, direct ordering |
| `workout_tracking` | Fitness App Sync | Apple Watch, Fitbit, Garmin sync |

---

## Usage

### Import the Config

```typescript
import { 
  SUBSCRIPTION_PLANS,
  ADD_ONS,
  INTEGRATIONS,
  formatPrice,
  getPlan,
  getAddOn,
  getIntegration,
} from '../config/subscriptionConfig';
```

### Get Plan Details

```typescript
// Get a specific plan
const premiumPlan = SUBSCRIPTION_PLANS.pro_monthly;
console.log(premiumPlan.monthlyPrice); // 12.99

// Or use helper
const plan = getPlan('pro_monthly');
console.log(formatPrice(plan.monthlyPrice)); // "$12.99/mo"
```

### Get Add-on/Integration Details

```typescript
// Add-ons (all $4.99/mo)
const groceryDeals = ADD_ONS.grocery_deals;
console.log(groceryDeals.price); // 4.99

// Integrations (all $7.99/mo)
const instacart = INTEGRATIONS.instacart_meals;
console.log(instacart.price); // 7.99
```

### Get All Items as Arrays

```typescript
import { getAllPlans, getAllAddOns, getAllIntegrations } from '../config/subscriptionConfig';

const plans = getAllPlans(); // Array of all plan configs
const addons = getAllAddOns(); // Array of all add-on configs
const integrations = getAllIntegrations(); // Array of all integration configs
```

### Calculate Total Cost

```typescript
import { calculateTotalCost } from '../config/subscriptionConfig';

// Premium + Grocery Deals + Instacart Meals
const total = calculateTotalCost('pro_monthly', ['grocery_deals', 'instacart_meals']);
console.log(total); // 12.99 + 4.99 + 7.99 = 25.97
```

### Get Upgrade Options

```typescript
import { getUpgradeOptions } from '../config/subscriptionConfig';

// User on free plan
const upgrades = getUpgradeOptions('free');
// Returns: [pro_monthly, pro_yearly, family_basic, family_pro, family_yearly]
```

---

## Files Using This Config

### ✅ Updated to Use Config
- `mobile/src/config/subscriptionConfig.ts` - **Central config file** (SINGLE SOURCE OF TRUTH)
- `mobile/src/components/PlansModal.tsx` - Subscription plans modal
- `mobile/src/screens/Profile.tsx` - Profile screen with pricing display
- `mobile/src/screens/SubscriptionManagementScreen.tsx` - Full subscription management

### ⚠️ Should Also Use (Future Updates)
- `mobile/src/screens/WebSubscriptionScreen.tsx` - Web subscription page
- `mobile/src/screens/NativeSubscriptionScreen.tsx` - Native IAP screen
- Any future components showing pricing

---

## Fixing Pricing Displays

### ❌ WRONG - Hardcoded Pricing
```typescript
// DON'T DO THIS!
subtitle: 'AI Coach & Instacart • $4.99/mo each' // WRONG!
```

### ✅ CORRECT - Use Config
```typescript
import { ADD_ONS, INTEGRATIONS } from '../config/subscriptionConfig';

// Option 1: Generic description
subtitle: 'Add-ons $4.99/mo | Integrations $7.99/mo'

// Option 2: Dynamic from config
const addonPrice = Object.values(ADD_ONS)[0].price; // 4.99
const integrationPrice = Object.values(INTEGRATIONS)[0].price; // 7.99
subtitle: `Add-ons $${addonPrice.toFixed(2)}/mo | Integrations $${integrationPrice.toFixed(2)}/mo`

// Option 3: Show specific items
subtitle: `${ADD_ONS.grocery_deals.displayName} ($${ADD_ONS.grocery_deals.price}/mo), ${INTEGRATIONS.instacart_meals.displayName} ($${INTEGRATIONS.instacart_meals.price}/mo)`
```

---

## Stripe Price IDs

Each plan includes Stripe Price IDs for backend integration:

```typescript
const plan = SUBSCRIPTION_PLANS.pro_monthly;
console.log(plan.stripePriceId.monthly); // 'price_1SqhOPCb0XQPUqHrLcjV8wID'
```

For IAP (iOS/Android):

```typescript
const plan = SUBSCRIPTION_PLANS.pro_monthly;
console.log(plan.iapProductId.ios); // 'com.wihy.native.premium_monthly'
console.log(plan.iapProductId.android); // 'com.wihy.native.premium_monthly'
```

---

## Type Safety

All types are exported for TypeScript safety:

```typescript
import type { 
  PlanId, 
  AddOnId, 
  IntegrationId,
  PlanConfig,
  AddOnConfig,
  IntegrationConfig,
} from '../config/subscriptionConfig';

function handlePlanSelect(planId: PlanId) {
  // TypeScript will autocomplete: 'free' | 'pro_monthly' | 'pro_yearly' | ...
}
```

---

## Benefits of Central Configuration

1. **Consistency**: All pricing comes from one place
2. **Easy Updates**: Change price in one file, updates everywhere
3. **Type Safety**: TypeScript autocomplete for plan IDs
4. **Maintainability**: No hunting for hardcoded prices
5. **Accuracy**: No more $4.99 vs $7.99 mix-ups
6. **Future-Proof**: Easy to add new plans/add-ons

---

## API Integration

The subscriptionService.ts uses this config for default values but always defers to API responses:

```typescript
// subscriptionService fetches real-time data from API
const plans = await subscriptionService.getPlans();

// But uses config for helper methods
import { formatPrice, calculateTotalCost } from '../config/subscriptionConfig';
```

---

## Testing

When testing locally, you can:

1. **Modify Config**: Change prices in `subscriptionConfig.ts`
2. **See Updates Everywhere**: All UI using the config will update
3. **No Code Changes Needed**: Just reload the app

---

## Common Mistakes to Avoid

### ❌ Hardcoding Prices
```typescript
// DON'T!
<Text>AI Coach - $4.99/mo</Text>
<Text>Instacart - $4.99/mo</Text> // WRONG! Should be $7.99
```

### ✅ Use Config
```typescript
// DO THIS!
import { ADD_ONS, INTEGRATIONS } from '../config/subscriptionConfig';

<Text>{ADD_ONS.grocery_deals.displayName} - ${ADD_ONS.grocery_deals.price}/mo</Text>
<Text>{INTEGRATIONS.instacart_meals.displayName} - ${INTEGRATIONS.instacart_meals.price}/mo</Text>
```

### ❌ Mixing Add-ons and Integrations
```typescript
// DON'T!
"AI Coach & Instacart • $4.99/mo each" // Instacart is $7.99, not $4.99!
```

### ✅ Separate Them
```typescript
// DO THIS!
"Add-ons $4.99/mo | Integrations $7.99/mo"
```

---

## Future Enhancements

To extend the config:

### Add a New Plan
```typescript
// In subscriptionConfig.ts
export const SUBSCRIPTION_PLANS = {
  // ... existing plans
  
  new_plan: {
    id: 'new_plan',
    name: 'New Plan',
    displayName: 'WIHY New Plan',
    monthlyPrice: 19.99,
    interval: 'month',
    tagline: 'A new awesome plan',
    features: ['Feature 1', 'Feature 2'],
    icon: 'star',
    stripePriceId: { monthly: 'price_xxx' },
    iapProductId: { ios: 'com.wihy.native.new_plan', android: 'com.wihy.native.new_plan' },
  },
};
```

### Add a New Add-on
```typescript
// In subscriptionConfig.ts
export const ADD_ONS = {
  // ... existing add-ons
  
  new_addon: {
    id: 'new_addon',
    name: 'New Add-on',
    displayName: 'Cool New Feature',
    price: 4.99, // All add-ons are $4.99
    interval: 'month',
    description: 'Description here',
    features: ['Feature 1', 'Feature 2'],
    icon: 'gift',
    stripePriceId: 'price_xxx',
  },
};
```

---

## Summary

✅ **Always import from `subscriptionConfig.ts`**  
✅ **Never hardcode prices**  
✅ **Add-ons = $4.99/mo**  
✅ **Integrations = $7.99/mo**  
✅ **Use helper functions for formatting**  
✅ **Keep config as single source of truth**  

For questions, see:
- `SUBSCRIPTION_ANALYSIS.md` - Original analysis
- `subscriptionConfig.ts` - The config file itself
- `WIHY_CLIENT_DATA_API.md` - Backend API docs
