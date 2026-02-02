# WIHY Pricing & Plans Reference

## 🚨 Subscription to Profile Workflow

### Complete Authentication Flow (Subscription → Profile Setup)

This section documents the end-to-end flow from subscription selection through profile completion.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION → AUTH WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: SELECT PLAN
─────────────────────
• Web: /subscription (WebSubscriptionScreen.tsx)
• Mobile: SubscriptionScreen.tsx

User selects a plan (Free, Premium, Family, Coach)
↓

Step 2: CREATE CHECKOUT SESSION
─────────────────────────────────
• POST https://payment.wihy.ai/api/stripe/create-checkout-session
• Request: { email, plan, source: 'web'|'ios'|'android' }
• Response: { checkoutUrl, sessionId }
↓

Step 3: STRIPE CHECKOUT
─────────────────────────
• Redirect to checkoutUrl (Stripe hosted page)
• User enters payment details
• Payment processed
↓

Step 4: PAYMENT SUCCESS REDIRECT
────────────────────────────────
• Stripe redirects to: /payment/success?session_id=cs_xxx
• PaymentSuccessScreen.tsx handles this route
↓

Step 5: RETRIEVE AUTH TOKEN
───────────────────────────
• GET https://payment.wihy.ai/api/stripe/checkout-session/{sessionId}
• Response includes:
  {
    session: { id, status, email, plan },
    auth: {
      userId: "uuid",
      isNewUser: true|false,
      loginToken: "xxx"  ← THIS IS THE AUTH TOKEN
    }
  }
↓

Step 6: STORE AUTH & REDIRECT
─────────────────────────────
• Store loginToken as authToken in localStorage/AsyncStorage
• Store userId
• Refresh AuthContext

• IF isNewUser === true:
  └→ Redirect to /onboarding (OnboardingFlow)
     └→ Step 1: ProfileSetup
     └→ Step 2: First Scan
     └→ Step 3: Log Meal
     └→ Step 4: Set Goals
     └→ Step 5: Find Coach

• IF isNewUser === false (returning subscriber):
  └→ Redirect to /dashboard (Main app)

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PLATFORM-SPECIFIC BEHAVIOR                          │
└─────────────────────────────────────────────────────────────────────────────┘

WEB PLATFORM:
─────────────
1. /payment/success?session_id=xxx
2. PaymentSuccessScreen retrieves session
3. Stores auth token in localStorage:
   - localStorage.setItem('accessToken', loginToken)
   - localStorage.setItem('authToken', loginToken)
   - localStorage.setItem('userId', userId)
4. Refreshes user context
5. Redirects:
   - New users: window.location.href = '/onboarding?plan=xxx'
   - Existing: window.location.href = '/dashboard'

⚠️ KNOWN ISSUE: On web, OnboardingFlow is NOT shown (native only).
   New web users go directly to the main app.
   TODO: Either show OnboardingFlow on web OR redirect to /ProfileSetup

NATIVE (iOS/Android):
────────────────────
1. Deep link: wihy://payment/success?session_id=xxx
2. PaymentSuccessScreen or checkoutService handles callback
3. Stores auth token via authService.storeSessionToken()
4. For new users (isFirstTimeUser && !onboardingCompleted):
   - AppNavigator shows OnboardingFlow stack
   - OnboardingFlow Step 1 → ProfileSetup screen
   - User completes profile before seeing main app
5. For existing users:
   - Navigation resets to Main tab navigator

┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY CODE LOCATIONS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

FILE                                    PURPOSE
────────────────────────────────────── ────────────────────────────────────────
screens/WebSubscriptionScreen.tsx       Plan selection UI (web)
screens/SubscriptionScreen.tsx          Plan selection UI (mobile)
services/checkoutService.ts             Create checkout session, get session
screens/PaymentSuccessScreen.tsx        Handle Stripe redirect, auto-login
screens/PostPaymentRegistrationScreen   Alternative: password creation flow
screens/OnboardingFlow.tsx              Native onboarding wizard (5 steps)
screens/ProfileSetupScreen.tsx          Profile/health preferences form
navigation/AppNavigator.tsx             Route definitions, platform logic
context/AuthContext.tsx                 Auth state, refreshUserContext()

┌─────────────────────────────────────────────────────────────────────────────┐
│                         API RESPONSE EXAMPLE                                │
└─────────────────────────────────────────────────────────────────────────────┘

GET /checkout-session/cs_test_xxx

{
  "success": true,
  "session": {
    "id": "cs_test_xxx",
    "status": "complete",
    "paymentStatus": "paid",
    "email": "user@example.com",
    "plan": "pro_monthly"
  },
  "auth": {
    "userId": "312d15b6-3147-4a24-b2f6-d1c812ab0ea6",
    "isNewUser": true,
    "loginToken": "2a61bf3f7e920cdcd7132bfcf296147065b49c973fee7ca4200897807044a96d"
  }
}

⚠️ CRITICAL: loginToken is in auth object, NOT session object!

┌─────────────────────────────────────────────────────────────────────────────┐
│                         TROUBLESHOOTING                                     │
└─────────────────────────────────────────────────────────────────────────────┘

PROBLEM: User lands on /ProfileSetup but can't proceed
─────────────────────────────────────────────────────────
✅ FIXED: ProfileSetup now has fixed footer with Get Started/Continue buttons
   and progress bar always visible at bottom of screen.

PROBLEM: "Failed to authenticate with payment token"
─────────────────────────────────────────────────────
✅ FIXED: Use loginToken directly from auth object as authToken.
   No verifyPaymentToken() call needed - loginToken IS the auth token.

PROBLEM: User not logged in after payment
─────────────────────────────────────────
CHECK:
1. session_id present in URL query params?
2. getCheckoutSession() returns auth.loginToken?
3. Token stored in localStorage/AsyncStorage?
4. refreshUserContext() called after storing token?

PROBLEM: New users skip profile setup on web
────────────────────────────────────────────
CURRENT BEHAVIOR: Web redirects to /onboarding but OnboardingFlow
is mobile-only. Web users see main app directly.

POTENTIAL FIXES:
1. Enable OnboardingFlow for web (remove Platform.OS !== 'web' check)
2. Redirect web users to /ProfileSetup instead of /onboarding
3. Check !profileSetupCompleted in AppNavigator to force ProfileSetup

```

---

## 🔄 Upgrade Flow (Free → Paid)

When an existing FREE user upgrades to a paid plan, the flow is slightly different from new signups.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FREE → PAID UPGRADE WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

TRIGGER POINTS (Where users can upgrade):
─────────────────────────────────────────
1. "Upgrade" tile on Dashboard (DashboardPage.tsx)
   - Only shown to free users
   - Navigates to Subscription screen

2. Lock badge on premium features
   - Locked tiles show 🔒 icon
   - Clicking redirects to Subscription

3. UpgradePrompt modal (UpgradePrompt component)
   - Shown when free user tries to access premium feature
   - Example: FitnessDashboard, CreateMeals, TrainingDashboard

4. Profile screen subscription section
   - Shows current plan status
   - "Upgrade" button for free users

UPGRADE FLOW STEPS:
─────────────────────

Step 1: USER TRIGGERS UPGRADE
────────────────────────────
• User is already authenticated (has valid session token)
• User clicks "Upgrade" or tries to access locked feature
• Redirect to /subscription or show UpgradePrompt modal
↓

Step 2: SELECT PAID PLAN
─────────────────────────
• Subscription screen shows available plans
• User selects Premium, Family, or Coach plan
↓

Step 3: CREATE CHECKOUT (AUTHENTICATED)
────────────────────────────────────────
• POST /create-checkout-session
• Request includes Authorization header with existing token
• Request body: { email: user.email, plan, source }
• Backend associates checkout with existing userId
↓

Step 4: STRIPE CHECKOUT
────────────────────────
• Redirect to Stripe checkout URL
• User enters/confirms payment details
• Payment processed
↓

Step 5: PAYMENT SUCCESS REDIRECT
─────────────────────────────────
• Stripe redirects to /payment/success?session_id=xxx
• PaymentSuccessScreen handles callback
↓

Step 6: RETRIEVE SESSION (EXISTING USER)
─────────────────────────────────────────
• GET /checkout-session/{sessionId}
• Response has isNewUser: FALSE for upgrades
• loginToken may be same token or refreshed

{
  "auth": {
    "userId": "existing-user-uuid",
    "isNewUser": false,  ← KEY DIFFERENCE
    "loginToken": "xxx"
  }
}
↓

Step 7: UPDATE AUTH & REDIRECT TO DASHBOARD
────────────────────────────────────────────
• Store new/refreshed token
• Call refreshUserContext() to reload user data
  - This fetches updated subscription status
  - Updates user.plan, user.features in context
• Redirect to /dashboard (NOT ProfileSetup)
• User sees unlocked premium features immediately

┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY DIFFERENCES: NEW vs UPGRADE                     │
└─────────────────────────────────────────────────────────────────────────────┘

                          NEW USER SIGNUP     FREE → PAID UPGRADE
─────────────────────────────────────────────────────────────────────────────
isNewUser                 true                false
Has existing token        No                  Yes (Authorization header)
Profile exists            No                  Yes (may need updates)
After payment redirect    /ProfileSetup       /dashboard
Needs onboarding          Yes (5 steps)       No
refreshUserContext        Creates new user    Updates subscription

┌─────────────────────────────────────────────────────────────────────────────┐
│                         UPGRADE IMPLEMENTATION DETAILS                      │
└─────────────────────────────────────────────────────────────────────────────┘

FILE                                    PURPOSE
────────────────────────────────────── ────────────────────────────────────────
screens/DashboardPage.tsx               "Upgrade" tile (lines 535-548)
components/UpgradePrompt.tsx            Modal for locked features
screens/NativeSubscriptionScreen.tsx    Plan selection (shows current plan)
services/checkoutService.ts             Sends auth header if logged in
context/AuthContext.tsx                 refreshUserContext() updates plan

UPGRADE PROMPT COMPONENT:
─────────────────────────
```tsx
import { UpgradePrompt } from '../components/UpgradePrompt';

// In your component:
const [showUpgrade, setShowUpgrade] = useState(false);

// Check access before allowing feature
const handleFeatureClick = () => {
  if (!isPremium) {
    setShowUpgrade(true);
    return;
  }
  // ... proceed with feature
};

// Render modal
<UpgradePrompt
  visible={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  onUpgrade={() => navigation.navigate('Subscription')}
/>
```

CHECKOUT WITH AUTH TOKEN:
─────────────────────────
```typescript
// checkoutService.ts sends auth header for logged-in users
const sessionToken = await authService.getSessionToken();
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};
if (sessionToken) {
  headers['Authorization'] = `Bearer ${sessionToken}`;
}
```

REFRESH USER AFTER UPGRADE:
────────────────────────────
```typescript
// PaymentSuccessScreen.tsx
await refreshUserContext(); // Reloads user with updated plan

// User context now has:
// user.plan = 'pro_monthly' (was 'free')
// user.features = ['meals', 'fitness', 'coaching', ...]
```

┌─────────────────────────────────────────────────────────────────────────────┐
│                         UPGRADE TROUBLESHOOTING                             │
└─────────────────────────────────────────────────────────────────────────────┘

PROBLEM: Features still locked after upgrade
────────────────────────────────────────────
CHECK:
1. refreshUserContext() was called after payment success?
2. Backend updated subscription status?
3. User context reflects new plan? (check user.plan)
4. Feature access checks use current user.plan?

PROBLEM: User redirected to ProfileSetup after upgrade
───────────────────────────────────────────────────────
CHECK:
1. isNewUser should be FALSE for existing users
2. Backend correctly identifies existing user by email
3. PaymentSuccessScreen checks isNewUser before redirecting

PROBLEM: Upgrade tile still shows after upgrading
─────────────────────────────────────────────────
CHECK:
1. DashboardPage checks isPremiumUser correctly
2. refreshUserContext() updated user state
3. isPremiumUser includes all paid plans (not just 'premium')

```

---

## Pricing Approach: Client + Feature Based

WIHY uses a **client and feature-based pricing model** where users pay based on:
1. **Number of clients/members** they manage
2. **Features/add-ons** they enable

This allows flexible pricing that scales with usage.

---

## Consumer Plans

### Free - $0/month
**Tagline:** Get started with essential features

**Features:**
- ✅ Barcode scanning
- ✅ Photo food analysis
- ✅ Medication tracking
- ✅ Basic health dashboard
- ✅ Limited AI chat

**Capabilities:**
- Progress Tracking: Basic
- Meals: ❌
- Workouts: ❌
- Family: ❌
- WIHY AI: ❌
- Instacart: ❌
- Data Export: ❌

---

### Premium - $12.99/month (or $99.99/year)
**Tagline:** For individuals focused on their health journey

**Base Features:**
- ✅ Everything in Free
- ✅ Full nutrition and fitness tools
- ✅ Personal dashboard
- ✅ Meal planning and tracking
- ✅ Workout plans
- ✅ Progress tracking (advanced)
- ✅ Research insights

**Available Add-Ons:**
| Add-On | Price | Description |
|--------|-------|-------------|
| WIHY Coach AI | $4.99/mo | AI-powered health coaching |
| Instacart Integration | $7.99/mo | Grocery delivery + shopping lists |

---

### Family Plans - Client-Based Pricing

Family pricing scales based on the number of family members:

| Members | Plan | Monthly | Yearly |
|---------|------|---------|--------|
| Up to 4 | Family Basic | $24.99 | $249.99 |
| Up to 5 | Family Pro | $49.99 | $499.99 |

**Family Basic Features:**
- ✅ All Premium features
- ✅ Shared parent/guardian dashboard
- ✅ Individual accounts for everyone
- ⭐ Add-on: WIHY Coach AI (+$4.99/mo)

**Family Pro Features (includes everything):**
- ✅ All Family Basic features
- ✅ WIHY Coach AI **INCLUDED**
- ✅ Instacart Pro **INCLUDED**
- ✅ Data export

---

## Professional Plans

### Coach Platform - Client-Based Pricing

Coach pricing is based on:
1. **Setup Fee:** $99.99 one-time
2. **Base Platform:** $29.99/month
3. **Commission:** 1% on client subscriptions

**All Features Included:**
- ✅ Unlimited clients
- ✅ Meal plan and workout creation
- ✅ Progress tracking & reporting
- ✅ Client management dashboard
- ✅ WIHY Coach AI
- ✅ Instacart Pro
- ✅ API access + Webhooks
- 📞 Training from WIHY team

---

## Feature Access Matrix

| Feature Area | Dimension | **Free** $0 | **Premium** $12.99/mo | **Premium+** $24.99/mo | **Family** $24.99/mo | **Family+** $49.99/mo | **Coach** $29.99/mo |
|---|---|---|---|---|---|---|---|
| **Scanning (Food + Meds)** | Access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Action (Scan) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Action (Save) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Retention | 30 days | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |
| **Health Overview** | Access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Action | ❌ read-only | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Nutrition (Meals)** | Access | 👁️ tile only | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Action (Create/Plan) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Shopping Lists** | Access | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cooking** | Access | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Fitness / Training** | Access | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Action (Track) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Progress / Trends** | Access | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Family Hub** | Access | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Coach Hub** | Access | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **AI Automation (WIHY Coach AI)** | Access | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Instacart** | Access | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Data Export** | Action | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Feature Add-Ons (Available for all paid plans)

| Feature | Price | Description |
|---------|-------|-------------|
| WIHY Coach AI | $4.99/mo | AI-powered health coaching and recommendations |
| Instacart Pro | $7.99/mo | Grocery delivery integration, auto shopping lists |
| Data Export | $2.99/mo | Export health data in various formats |
| API Access | $9.99/mo | Developer API access for integrations |

*Note: Some plans include add-ons at no extra cost (Family Pro, Coach)*

---

## B2B / Enterprise Plans - Custom Client-Based Pricing

Enterprise pricing is based on:
1. **Number of users/seats**
2. **Features enabled**
3. **Integration requirements**

| Plan | Target | Pricing Model |
|------|--------|---------------|
| Workplace Core | Small-Medium Business | Per-seat pricing |
| Workplace Plus | Medium Business + Families | Per-seat + household |
| Corporate Enterprise | Large Corporations | Volume licensing |
| K-12 School | Schools & Districts | Per-student pricing |
| University | Higher Education | Campus licensing |
| Hospital | Healthcare Facilities | Per-bed/staff pricing |
| Hospitality | Senior/Assisted Living | Per-resident pricing |

**All Enterprise Plans Include:**
- ✅ WIHY Coach AI
- ✅ Admin Dashboard
- ✅ Usage Analytics
- ✅ Role Management
- ✅ API Access + Webhooks
- ✅ White-label Options
- ✅ Dedicated Support

*Contact sales for custom pricing based on your organization size and needs.*

---

## Dashboard Tiles & Access by Plan

### Health Dashboard Tiles (20 tiles)

| # | Tile | Icon | Subtitle | Free | Premium | Family | Coach | Description |
|---|------|------|----------|------|---------|--------|-------|-------------|
| 1 | Overview | analytics | Health metrics | ✅ | ✅ | ✅ | ✅ | Health metrics summary, daily stats |
| 2 | Notifications | notifications | Messages & alerts | ✅ | ✅ | ✅ | ✅ | Push notifications, messages |
| 3 | Nutrition | nutrition | Scan history | ✅ | ✅ | ✅ | ✅ | Food scan history, analysis |
| 4 | Profile Setup | person-add | Health profile | ✅ | ✅ | ✅ | ✅ | Health profile configuration |
| 5 | Progress | trending-up | Track goals | 🔒 | ✅ | ✅ | ✅ | Goal tracking, metrics history |
| 6 | AI Meal Plans | sparkles | Auto-generate | 🔒 | ✅ | ✅ | ✅ | AI-generated personalized meal plans |
| 7 | Meal Calendar | calendar | View schedule | 🔒 | ✅ | ✅ | ✅ | Weekly/monthly meal schedule |
| 8 | Plan Meal | create | Create meals | 🔒 | ✅ | ✅ | ✅ | Manual meal creation |
| 9 | Shopping List | cart | Grocery items | 🔒 | ✅ | ✅ | ✅ | Grocery list + Instacart integration |
| 10 | Cooking | flame | Instructions | 🔒 | ✅ | ✅ | ✅ | Today's meals with cooking steps |
| 11 | Research | library | Health insights | 🔒 | ✅ | ✅ | ✅ | Health research & studies |
| 12 | Fitness | fitness | Workout plans | 🔒 | ✅ | ✅ | ✅ | Workout programs & tracking |
| 13 | Training | trophy | Sports programs | 🔒 | ✅ | ✅ | ✅ | Sports-specific training templates |
| 14 | Find Coach | people | Expert guidance | ✅ | ✅ | ✅ | ✅ | Browse & hire coaches |
| 15 | Upgrade | rocket | Go Premium | ✅ | ❌ | ❌ | ❌ | Only shown to free users |
| 16 | Family | heart | $49.99/mo | 🔒 | 🔒 | ✅ | ❌ | Family member health overview |
| 17 | Family Hub | people-circle | Switch view | 🔒 | 🔒 | ✅ | ❌ | Switch to family dashboard context |
| 18 | Coach Hub | briefcase | Switch view | 🔒 | 🔒 | 🔒 | ✅ | Switch to coach dashboard context |
| 19 | Quick Start | compass | App guide | ✅ | ✅ | ✅ | ✅ | Interactive app tutorial |
| 20 | Personal | person | Back to my health | — | — | ✅ | ✅ | Switch back to personal dashboard |

### Coach Hub Tiles (8 tiles)

| # | Tile | Icon | Subtitle | Color | Description |
|---|------|------|----------|-------|-------------|
| 1 | Overview | stats-chart | Revenue & quick actions | #10b981 | Coach dashboard overview, revenue stats |
| 2 | Coach Dashboard | people | Manage your clients & programs | #3b82f6 | Full client/program management |
| 3 | Clients | people-circle | View and manage all clients | #8b5cf6 | Client list and management |
| 4 | Programs | restaurant | Meal plans & workout programs | #f59e0b | Create/manage meal & workout plans |
| 5 | Onboarding | person-add | Add new clients | #10b981 | Client onboarding flow |
| 6 | Bookings | calendar | Manage sessions & schedule | #6366f1 | Session scheduling & bookings |
| 7 | Coach Profile | briefcase | Your coach bio & settings | #14b8a6 | Coach profile configuration |
| 8 | Personal | person | Back to my health | #16a34a | Switch back to personal dashboard |

### Family Hub Features

The Family Hub is not a tile-based dashboard. It displays:

| Section | Description |
|---------|-------------|
| Guardian Code | Shareable code for family members to join |
| Family Members | List of all family members with health scores |
| Add Member | Button to invite new family members |
| Member Cards | Individual member stats, age, last active, health score |
| Back to Health Hub | Button to return to personal dashboard |

**Legend:**
- ✅ = Included (full access)
- 🔒 = Locked (shows tile with lock badge, redirects to Subscription on click)
- ❌ = Not available/not shown
- — = Not applicable (tile only appears in specific context)

---

## Meal Plan & Shopping Flow

### Meal Plan Creation Flow (2 Steps)

```
Dashboard → "AI Meal Plans" tile
  → Step 1: Goals (select dietary preferences, duration, servings)
  → Generate Plan (AI creates personalized meals)
  → Step 2: Preview (view all meals with calories/macros)
  → "Accept Plan" button
  → Success Modal ("Meal Plan Created!")
    → "View Shopping List" → ShoppingListScreen
    → "Save Meal Plan" → Saves + auto-opens ShoppingListScreen + Instacart
    → "Done" → Closes modal
```

### Shopping List & Instacart Integration

When a meal plan is saved:
1. Shopping list is extracted from meal plan ingredients
2. List is saved to user's account
3. Instacart link is auto-created with all items
4. Instacart app/website opens automatically
5. User can shop at ALDI, Walmart, Target, Costco, Wegmans, Kroger, etc.

**ShoppingListScreen Features:**
- View all items by category (Proteins, Produce, Dairy, Grains, Pantry, Other)
- Check off items as purchased
- Share list via text/email
- "Shop on Instacart" button for grocery delivery
- Collapsing header with progress indicator

### Cooking Dashboard

The Cooking Dashboard shows today's scheduled meals with detailed cooking instructions.

**Data Flow:**
1. Loads scheduled meals from `getMealsForDate` API
2. Fetches full meal details (ingredients, instructions) from `getMealDetails` API
3. Caches details on first expand for instant re-expansion

**Features:**
- Today's meals listed by meal slot (breakfast, lunch, dinner, snack)
- Pull-to-refresh to reload meals
- Expandable meal cards with:
  - Prep time & cook time
  - Serving size
  - Difficulty level
  - Full ingredients list with amounts
  - Step-by-step cooking instructions (numbered)
  - Nutrition per serving (calories, protein, carbs, fat)
- Loading indicator when fetching meal details
- Empty state when no meals scheduled
- Collapsing red header with "Ready to Cook" badge

### Training Dashboard

The Training Dashboard provides sport-specific training programs for athletes and fitness enthusiasts.

**Data Flow:**
1. User selects a sport from 16 available options
2. Configures training phase, intensity, duration, and equipment
3. Generates workout via `generateQuickWorkout` API with `mode: 'training'`
4. Caches recent workouts locally for quick access

**Sports Available (16):**
- Running, Cycling, Swimming, Triathlon
- Basketball, Soccer, Tennis, Golf
- Hiking, Rock Climbing, Skiing
- Martial Arts, CrossFit, Yoga
- Weightlifting, General Fitness

**Training Phases:**
- **Off Season** - Build base fitness & recovery
- **Pre Season** - Increase intensity & sport-specific
- **In Season** - Maintain & peak performance

**Features:**
- Sport selection grid with colorful icons
- Training phase selector (Off/Pre/In Season)
- Intensity selector (Light/Moderate/Intense)
- Duration picker (15-90 minutes)
- Equipment presets (Bodyweight, Basic, Home Gym, Full Gym, Outdoor)
- "Generate Workout" button styled to selected sport color
- Recent workouts carousel (last 5 saved locally)
- Pull-to-refresh to reload saved programs
- Collapsing green header with trophy icon (HEADER_MAX_HEIGHT=180)

**Workout Preview Modal:**
- Displays generated workout with segments (Warmup, Main, Cooldown)
- Stats row: Duration, Calories, Exercise count
- Exercise cards with sets, reps, instructions
- Equipment needed section
- "Start Workout" button

**Design Pattern Compliance:**
- ✅ Collapsing header (180px max, paddingBottom: 20, paddingTop: 10)
- ✅ Dark mode support (theme.colors.text, textSecondary, card, background, border)
- ✅ Pull-to-refresh with RefreshControl
- ✅ Safe area insets for notched devices
- ✅ useNativeDriver: false for scroll animations

---

## Paywall Display (shown on locked tiles)

| Tile | Display Text |
|------|--------------|
| Family Hub | $49.99/mo |
| Coach Hub | $99.99 one-time |
| Premium features | Redirects to Subscription screen |

---

## Implementation Notes

1. **All tiles visible to all users** - Users see the full feature set even on free plan
2. **Lock badge** - Locked tiles show a small lock icon in top-right corner
3. **Paywall on click** - Clicking a locked tile redirects to `/subscription`
4. **Client-based scaling** - Pricing increases with number of clients/members
5. **Feature add-ons** - Users can enable/disable features as needed
6. **Role-based access**:
   - `admin` role: Full access to everything + dev tools
   - `employee` role: Full access (dev tools only if `is_developer` flag)
   - `coach` role: Access to Coach Hub
   - `user` role: Access based on plan + enabled features

---

*Last updated: February 1, 2026*
