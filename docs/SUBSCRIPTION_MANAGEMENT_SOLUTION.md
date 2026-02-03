# Subscription Management Solution

## Problem Analysis

### Current State
1. **Two Pages Exist:**
   - `/subscription` (WebSubscriptionScreen) - Public pricing/marketing page
   - Profile page - Has "Subscription" section but doesn't reflect actual user plan status

2. **Issues:**
   - Profile subscription section shows "Upgrade to Premium" for ALL users
   - Doesn't display current plan (Free, Premium, Family, etc.)
   - No downgrade/cancel functionality for premium users
   - PlansModal shows all plans but doesn't track current plan
   - No clear distinction between marketing page and in-app management

## Proposed Solution

### 1. Page Responsibilities

#### `/subscription` Page (WebSubscriptionScreen)
- **Purpose:** Public marketing/pricing page
- **Audience:** Unauthenticated users, visitors browsing plans
- **Should NOT:** Handle subscription management for logged-in users
- **Should:** Redirect logged-in users to Profile > Subscription section

#### Profile > Subscription Section
- **Purpose:** Subscription management for authenticated users
- **Audience:** Logged-in users only
- **Features:**
  - Display current plan with status badge
  - For FREE users: Show upgrade options
  - For PREMIUM users: Show manage/cancel/downgrade options
  - For FAMILY users: Show family management + subscription options
  - For COACH users: Show coach features + subscription options

### 2. UI/UX Changes Needed

#### A. Profile Subscription Section - Dynamic Display

**For FREE Users:**
```
┌─────────────────────────────────────┐
│ 💎 Subscription                      │
├─────────────────────────────────────┤
│ Current Plan: Free                   │
│ [FREE] badge                         │
│                                      │
│ → Upgrade to Premium                 │
│   Unlock unlimited scans & AI features│
│                                      │
│ → View All Plans                     │
│   Compare Premium & Family options   │
└─────────────────────────────────────┘
```

**For PREMIUM Users:**
```
┌─────────────────────────────────────┐
│ ✨ Subscription                      │
├─────────────────────────────────────┤
│ Current Plan: Premium                │
│ [PREMIUM] badge | $12.99/month       │
│ Next billing: Feb 28, 2026          │
│                                      │
│ → Manage Subscription                │
│   Update payment method             │
│                                      │
│ → Cancel Subscription                │
│   Downgrade to Free plan            │
└─────────────────────────────────────┘
```

**For FAMILY Users:**
```
┌─────────────────────────────────────┐
│ 👨‍👩‍👧‍👦 Subscription                    │
├─────────────────────────────────────┤
│ Current Plan: Family Premium         │
│ [FAMILY] badge | $24.99/month        │
│ 4 of 6 members active               │
│ Next billing: Feb 28, 2026          │
│                                      │
│ → Manage Family Members              │
│   Add/remove family accounts        │
│                                      │
│ → Manage Subscription                │
│   Update payment or cancel          │
└─────────────────────────────────────┘
```

#### B. Subscription Management Modal

Create new `SubscriptionManagementModal.tsx` with tabs:
- **Overview** - Current plan details, billing info
- **Change Plan** - Upgrade/downgrade options
- **Billing** - Payment method, billing history
- **Cancel** - Cancellation flow with retention offers

### 3. Implementation Plan

#### Step 1: Update Profile.tsx
```typescript
// Add state for user's subscription details
const [currentPlan, setCurrentPlan] = useState<{
  name: string;
  status: 'free' | 'premium' | 'family-basic' | 'family-pro' | 'coach';
  price?: string;
  nextBilling?: string;
  memberCount?: number;
}>({
  name: 'Free',
  status: 'free',
});

// Fetch subscription details from backend
useEffect(() => {
  if (user?.id) {
    fetchSubscriptionDetails();
  }
}, [user?.id]);

const fetchSubscriptionDetails = async () => {
  // Call backend API to get Stripe subscription details
  // Update currentPlan state
};

// Update handleSubscribe logic
const handleSubscribe = () => {
  if (currentPlan.status === 'free') {
    // Show upgrade options
    setShowPlansModal(true);
  } else {
    // Show manage subscription modal
    setShowManageSubscriptionModal(true);
  }
};
```

#### Step 2: Create SubscriptionManagementModal
```typescript
// New component: mobile/src/components/SubscriptionManagementModal.tsx
interface Props {
  visible: boolean;
  onClose: () => void;
  currentPlan: {
    name: string;
    status: string;
    price?: string;
    nextBilling?: string;
  };
  onUpgrade: () => void;
  onCancel: () => void;
  onUpdatePayment: () => void;
}

// Tabs: Overview, Change Plan, Billing, Cancel
```

#### Step 3: Update Subscription Section Items
```typescript
const subscriptionItems = [];

// Always show current plan status
subscriptionItems.push({
  id: 'current-plan',
  title: `Current Plan: ${getPlanDisplayName(user?.plan)}`,
  subtitle: getPlanSubtitle(user?.plan),
  type: 'navigation',
  icon: getPlanIcon(user?.plan),
  badge: getPlanBadge(user?.plan), // FREE, PREMIUM, FAMILY, etc.
  onPress: () => {
    if (user?.plan === 'free') {
      setShowPlansModal(true); // Upgrade
    } else {
      setShowManageSubscriptionModal(true); // Manage
    }
  },
});

// For FREE users - show upgrade
if (user?.plan === 'free') {
  subscriptionItems.push({
    id: 'upgrade',
    title: 'Upgrade to Premium',
    subtitle: 'Unlock unlimited scans & AI features',
    type: 'navigation',
    icon: 'rocket',
    onPress: () => setShowPlansModal(true),
  });
}

// For PREMIUM/FAMILY users - show manage/cancel
if (user?.plan !== 'free') {
  subscriptionItems.push({
    id: 'manage',
    title: 'Manage Subscription',
    subtitle: 'Update payment method or plan',
    type: 'navigation',
    icon: 'settings',
    onPress: () => setShowManageSubscriptionModal(true),
  });
  
  subscriptionItems.push({
    id: 'cancel',
    title: 'Cancel Subscription',
    subtitle: 'Downgrade to Free plan',
    type: 'navigation',
    icon: 'close-circle',
    destructive: true,
    onPress: handleCancelSubscription,
  });
}
```

#### Step 4: Backend API Endpoints Needed
```typescript
// GET /api/subscriptions/current
// Returns: { plan, status, nextBilling, price, stripeCustomerId, etc. }

// POST /api/subscriptions/cancel
// Cancels at end of billing period

// POST /api/subscriptions/upgrade
// Upgrades plan (creates new Stripe Checkout session)

// POST /api/subscriptions/downgrade
// Downgrades plan at end of billing period

// GET /api/subscriptions/billing-history
// Returns payment history

// POST /api/subscriptions/update-payment-method
// Updates Stripe payment method
```

#### Step 5: Stripe Integration Updates
```typescript
// Use Stripe Customer Portal for:
// - Update payment method
// - View billing history
// - Cancel subscription
// - Download invoices

const openCustomerPortal = async () => {
  const { url } = await fetch('/api/subscriptions/customer-portal', {
    method: 'POST',
  }).then(r => r.json());
  
  if (Platform.OS === 'web') {
    window.location.href = url;
  } else {
    // Open in WebView for native
    navigation.navigate('CustomerPortal', { url });
  }
};
```

### 4. User Flows

#### Upgrade Flow (Free → Premium)
1. User clicks "Upgrade to Premium" in Profile
2. PlansModal opens showing all plan options
3. User selects Premium plan
4. Stripe embedded checkout modal opens
5. User completes payment
6. Backend webhook updates user.plan to 'premium'
7. Profile updates to show Premium status

#### Manage Flow (Premium User)
1. User clicks "Manage Subscription" in Profile
2. SubscriptionManagementModal opens
3. Tabs: Overview | Change Plan | Billing | Cancel
4. User can:
   - View current subscription details
   - Change to different plan (Family, downgrade to Free)
   - Update payment method (via Stripe portal)
   - View billing history
   - Cancel subscription

#### Cancel Flow
1. User clicks "Cancel Subscription"
2. Confirmation dialog appears with:
   - "Are you sure? You'll lose access to premium features"
   - Retention offer: "Save 20% - stay subscribed!"
3. If user confirms:
   - Backend calls Stripe API to cancel at period end
   - UI shows "Cancels on: [date]"
   - User keeps access until billing period ends
4. If user accepts retention offer:
   - Apply discount code
   - Keep subscription active

### 5. File Structure
```
mobile/src/
├── components/
│   ├── SubscriptionManagementModal.tsx (NEW)
│   ├── SubscriptionOverviewTab.tsx (NEW)
│   ├── ChangePlanTab.tsx (NEW)
│   ├── BillingHistoryTab.tsx (NEW)
│   ├── CancelSubscriptionTab.tsx (NEW)
│   └── PlansModal.tsx (UPDATE - add currentPlan prop)
├── screens/
│   ├── Profile.tsx (UPDATE - dynamic subscription section)
│   └── WebSubscriptionScreen.tsx (UPDATE - redirect logged-in users)
├── services/
│   └── subscriptionService.ts (NEW - Stripe API calls)
└── types/
    └── subscription.ts (NEW - subscription types)
```

### 6. Migration Strategy

#### Phase 1: Backend Setup
1. Add subscription status endpoints
2. Set up Stripe webhooks for subscription events
3. Add Stripe Customer Portal configuration

#### Phase 2: Frontend - Profile Updates
1. Update Profile subscription section to be dynamic
2. Add current plan display with badge
3. Show appropriate actions based on plan status

#### Phase 3: Subscription Management Modal
1. Create SubscriptionManagementModal component
2. Implement Overview tab
3. Implement Change Plan tab
4. Implement Billing tab
5. Implement Cancel tab

#### Phase 4: Testing & Polish
1. Test all user flows (free→premium, premium→cancel, etc.)
2. Add loading states and error handling
3. Add analytics tracking
4. Test Stripe webhooks

### 7. Key Considerations

#### Security
- All subscription operations must validate user authentication
- Stripe Customer Portal URLs must be session-specific
- Webhook signature verification for all Stripe events

#### UX
- Clear messaging about what changes when upgrading/downgrading
- Prorated billing explanation
- Retention offers for cancellation flow
- Loading states during Stripe operations

#### Edge Cases
- Failed payment handling
- Subscription past due status
- Trial period handling
- Coupon/discount code support
- Multiple subscriptions (Premium + Add-ons)

### 8. Success Metrics
- Conversion rate: Free → Premium
- Churn rate reduction through retention offers
- Support ticket reduction (self-service management)
- User satisfaction with subscription management

## Summary

**Key Changes:**
1. `/subscription` = Marketing page for non-authenticated users
2. Profile > Subscription = Complete subscription management for logged-in users
3. Dynamic display based on current plan (Free, Premium, Family, Coach)
4. Upgrade, downgrade, cancel, manage payment - all in Profile
5. Use Stripe Customer Portal for advanced management features
