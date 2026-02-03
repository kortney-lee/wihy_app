# Industry-Based Subscription Feature Plan

**Date:** February 3, 2026  
**Status:** Planning Phase  
**Related:** Profile Subscription Management, Embedded Checkout

---

## 🎯 Objective

Build a subscription system that recommends and customizes plans based on the user's **industry/profession**, leveraging the existing embedded Stripe checkout for seamless payment.

---

## 📋 Current State

### ✅ What We Have

1. **Embedded Stripe Checkout** ([EmbeddedCheckout.tsx](../mobile/src/components/web/EmbeddedCheckout.tsx))
   - Fully functional on web
   - Stripe.js integration complete
   - Modal overlay with clientSecret support
   - Status: **Production Ready (Web)**

2. **Coach Specialty Tracking** ([CoachProfileSetup.tsx](../mobile/src/screens/CoachProfileSetup.tsx))
   - Specialties: nutrition, fitness, wellness, mental_health, business, life_coaching
   - Multi-select specialty array
   - API: `coachService.getSpecialties()`
   - Status: **Implemented**

3. **Subscription Config** ([subscriptionConfig.ts](../mobile/src/config/subscriptionConfig.ts))
   - Plans: free, pro_monthly, pro_yearly, family_basic, family_pro, coach
   - Pricing, features, Stripe price IDs
   - Status: **Complete**

4. **Profile Subscription Section** ([Profile.tsx](../mobile/src/screens/Profile.tsx))
   - Dynamic items based on plan
   - Family/Coach conditional display
   - Status: **Implemented**

### ❌ What's Missing

1. **User Industry Field**
   - Not in `User` interface (AuthContext.tsx)
   - Not in `UserProfile` (userService.ts)
   - Not tracked during onboarding
   - **Status:** Missing

2. **Industry-Specific Plans**
   - No workplace-core, workplace-plus, corporate-enterprise plans in config
   - No k12-school, university, hospital plans
   - Mentioned in User.plan type but not defined
   - **Status:** Partially Missing

3. **Industry-Based Recommendations**
   - No logic to recommend plans based on industry
   - No industry → plan mapping
   - **Status:** Missing

4. **Mobile Embedded Checkout**
   - Currently web-only (Platform.OS === 'web' check)
   - Need @stripe/stripe-react-native for iOS/Android
   - **Status:** Web Only

---

## 🏗️ Architecture Design

### User Industry Taxonomy

```typescript
export type UserIndustry = 
  // Individual
  | 'individual'           // Default - personal health
  | 'student'              // Student/academic
  
  // Health & Fitness
  | 'health_fitness_pro'   // Personal trainer, dietitian, nutritionist
  | 'healthcare'           // Doctor, nurse, healthcare provider
  | 'mental_health'        // Therapist, counselor
  
  // Education
  | 'k12_education'        // K-12 teacher, school admin
  | 'higher_education'     // University professor, staff
  
  // Corporate
  | 'corporate'            // Corporate employee
  | 'hr_wellness'          // HR/wellness coordinator
  | 'hospitality'          // Hotel, restaurant industry
  
  // Coaching
  | 'life_coach'           // Life/business coach
  | 'fitness_coach'        // Fitness coach
  | 'nutrition_coach'      // Nutrition coach
  | 'wellness_coach';      // Wellness coach
```

### Plan Recommendations by Industry

```typescript
const INDUSTRY_PLAN_MAPPING: Record<UserIndustry, PlanId[]> = {
  individual: ['free', 'pro_monthly', 'pro_yearly'],
  student: ['free', 'pro_monthly'],
  health_fitness_pro: ['coach', 'pro_yearly'],
  healthcare: ['workplace-plus', 'coach'],
  mental_health: ['coach', 'workplace-core'],
  k12_education: ['k12-school', 'workplace-core'],
  higher_education: ['university', 'workplace-plus'],
  corporate: ['workplace-core', 'workplace-plus', 'corporate-enterprise'],
  hr_wellness: ['corporate-enterprise', 'workplace-plus'],
  hospitality: ['hospitality', 'workplace-core'],
  life_coach: ['coach'],
  fitness_coach: ['coach'],
  nutrition_coach: ['coach'],
  wellness_coach: ['coach'],
};
```

### Embedded Checkout Platform Support

| Platform | Current Status | Implementation |
|----------|----------------|----------------|
| Web | ✅ Complete | `@stripe/stripe-js` |
| iOS | ❌ Missing | `@stripe/stripe-react-native` |
| Android | ❌ Missing | `@stripe/stripe-react-native` |

---

## 📝 Implementation Tasks

### Phase 1: User Industry Tracking

**Files to Update:**

1. **mobile/src/context/AuthContext.tsx**
   ```typescript
   export interface User {
     // ... existing fields
     industry?: UserIndustry;
     profession?: string;  // Free-form text
   }
   ```

2. **mobile/src/services/userService.ts**
   ```typescript
   export interface UserProfile {
     // ... existing fields
     industry?: UserIndustry;
     profession?: string;
   }
   ```

3. **mobile/src/screens/ProfileSetupScreen.tsx**
   - Add "Industry & Profession" step (Step 6)
   - Dropdown for industry selection
   - Optional profession text input
   - Call `userService.updateUserProfile()` with industry

4. **mobile/src/screens/Profile.tsx**
   - Add "Edit Profile" → Industry/Profession fields
   - Display industry badge in header

**API Requirements:**
- Backend must accept `industry` and `profession` fields in `PUT /api/profile/:userId`
- Store in user profile table

---

### Phase 2: Industry-Specific Subscription Plans

**Files to Update:**

1. **mobile/src/config/subscriptionConfig.ts**
   ```typescript
   // Add missing B2B plans
   export const SUBSCRIPTION_PLANS: Record<PlanId, PlanConfig> = {
     // ... existing plans
     
     'workplace-core': {
       id: 'workplace-core',
       name: 'Workplace Core',
       displayName: 'Workplace Core',
       monthlyPrice: 15.00,
       interval: 'month',
       tagline: 'For businesses with 10-100 employees',
       icon: 'briefcase',
       features: [
         'Team health dashboards',
         'Wellness challenges',
         'Basic analytics',
         'Email support',
       ],
     },
     
     'workplace-plus': {
       id: 'workplace-plus',
       name: 'Workplace Plus',
       displayName: 'Workplace Plus',
       monthlyPrice: 25.00,
       interval: 'month',
       tagline: 'For organizations with advanced needs',
       icon: 'business',
       features: [
         'Everything in Core',
         'Advanced analytics',
         'Custom integrations',
         'Dedicated support',
         'API access',
       ],
     },
     
     'corporate-enterprise': {
       id: 'corporate-enterprise',
       name: 'Corporate Enterprise',
       displayName: 'Enterprise',
       monthlyPrice: 50.00,  // or custom pricing
       interval: 'month',
       tagline: 'For large organizations (100+ employees)',
       icon: 'business',
       features: [
         'Everything in Plus',
         'Custom SLA',
         'White-label options',
         'Dedicated account manager',
         'On-premise deployment',
       ],
     },
     
     'k12-school': {
       id: 'k12-school',
       name: 'K-12 School',
       displayName: 'K-12 School Plan',
       monthlyPrice: 500.00,  // per school
       interval: 'month',
       tagline: 'For K-12 schools and districts',
       icon: 'school',
       features: [
         'Student nutrition tracking',
         'Cafeteria meal planning',
         'Parent dashboards',
         'FERPA compliance',
       ],
     },
     
     'university': {
       id: 'university',
       name: 'University',
       displayName: 'University Plan',
       monthlyPrice: 1000.00,  // per institution
       interval: 'month',
       tagline: 'For colleges and universities',
       icon: 'school',
       features: [
         'Campus-wide access',
         'Student wellness programs',
         'Research data access',
         'Integration with campus systems',
       ],
     },
     
     'hospital': {
       id: 'hospital',
       name: 'Hospital',
       displayName: 'Hospital/Healthcare',
       monthlyPrice: 2000.00,  // per facility
       interval: 'month',
       tagline: 'For healthcare facilities',
       icon: 'medkit',
       features: [
         'HIPAA compliance',
         'Patient nutrition tracking',
         'EMR integration',
         'Clinical dashboards',
       ],
     },
     
     'hospitality': {
       id: 'hospitality',
       name: 'Hospitality',
       displayName: 'Hospitality Plan',
       monthlyPrice: 300.00,  // per location
       interval: 'month',
       tagline: 'For hotels and restaurants',
       icon: 'restaurant',
       features: [
         'Menu nutrition analysis',
         'Allergen tracking',
         'Guest dietary preferences',
         'Kitchen integration',
       ],
     },
   };
   ```

2. **mobile/src/utils/industryPlanMapping.ts** (NEW FILE)
   ```typescript
   import type { UserIndustry, PlanId } from '../config/subscriptionConfig';
   
   export const INDUSTRY_PLAN_MAPPING: Record<UserIndustry, {
     recommended: PlanId[];
     description: string;
   }> = {
     individual: {
       recommended: ['free', 'pro_monthly', 'pro_yearly'],
       description: 'Perfect for personal health tracking',
     },
     health_fitness_pro: {
       recommended: ['coach', 'pro_yearly'],
       description: 'Coach plan recommended for fitness professionals',
     },
     // ... etc
   };
   
   export function getRecommendedPlans(industry?: UserIndustry): PlanId[] {
     if (!industry) return ['free', 'pro_monthly', 'pro_yearly'];
     return INDUSTRY_PLAN_MAPPING[industry]?.recommended || [];
   }
   ```

---

### Phase 3: Dynamic Subscription Recommendations

**Files to Update:**

1. **mobile/src/screens/SubscriptionManagementScreen.tsx**
   ```typescript
   import { getRecommendedPlans } from '../utils/industryPlanMapping';
   
   // Inside component
   const { user } = useAuth();
   const recommendedPlanIds = getRecommendedPlans(user?.industry);
   const recommendedPlans = availablePlans.filter(p => 
     recommendedPlanIds.includes(p.id)
   );
   ```

2. **mobile/src/screens/Profile.tsx**
   ```typescript
   // Show industry-specific upgrade recommendation
   const getUpgradeMessage = () => {
     if (user?.industry === 'health_fitness_pro') {
       return 'Upgrade to Coach Plan for client management';
     }
     if (user?.industry === 'corporate') {
       return 'Upgrade to Workplace Plan for team features';
     }
     return 'Unlock unlimited scans & AI features';
   };
   ```

---

### Phase 4: Mobile Embedded Checkout

**React Native Implementation:**

1. **Install Package**
   ```bash
   npm install @stripe/stripe-react-native
   ```

2. **Create mobile/src/components/native/EmbeddedCheckoutNative.tsx**
   ```typescript
   import React from 'react';
   import { StripeProvider, CardField, useConfirmPayment } from '@stripe/stripe-react-native';
   
   export const EmbeddedCheckoutNative = ({ 
     clientSecret, 
     onComplete, 
     onCancel 
   }) => {
     const { confirmPayment } = useConfirmPayment();
     
     const handlePayment = async () => {
       const { error } = await confirmPayment(clientSecret, {
         paymentMethodType: 'Card',
       });
       
       if (error) {
         console.error('Payment failed:', error);
       } else {
         onComplete();
       }
     };
     
     return (
       <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
         <CardField onCardChange={(cardDetails) => {}} />
         <Button title="Pay Now" onPress={handlePayment} />
       </StripeProvider>
     );
   };
   ```

3. **Update Profile.tsx to use platform-specific checkout**
   ```typescript
   import { Platform } from 'react-native';
   import { EmbeddedCheckout } from '../components/web/EmbeddedCheckout';
   import { EmbeddedCheckoutNative } from '../components/native/EmbeddedCheckoutNative';
   
   const CheckoutComponent = Platform.select({
     web: EmbeddedCheckout,
     default: EmbeddedCheckoutNative,
   });
   ```

---

## 🔄 User Flow

### New User Onboarding

```
1. Sign Up
2. Profile Setup (Name, Goals, Preferences)
3. Industry Selection (NEW)
   ├─ "What industry are you in?"
   ├─ Dropdown: Individual, Coach, Corporate, Healthcare, etc.
   └─ Optional: Profession text input
4. Industry-Based Plan Recommendation
   ├─ Show 2-3 recommended plans
   ├─ "Based on your industry, we recommend..."
   └─ Option to browse all plans
5. Embedded Checkout (if choosing paid plan)
   ├─ Web: Stripe.js embedded checkout
   └─ Mobile: Stripe React Native
6. Confirmation & Dashboard
```

### Existing User Upgrade Flow

```
Profile → Subscription Section
├─ Current Plan Badge
├─ Industry: "Health & Fitness Professional" (badge)
├─ Recommended: "Coach Plan - $9.99/mo + 10% commission"
└─ [Upgrade Now] → Embedded Checkout
```

---

## 🎨 UI Components Needed

### 1. Industry Selector
**File:** `mobile/src/components/IndustrySelector.tsx`

```typescript
interface IndustrySelectorProps {
  value?: UserIndustry;
  onChange: (industry: UserIndustry) => void;
}

export const IndustrySelector = ({ value, onChange }: IndustrySelectorProps) => {
  return (
    <Picker
      selectedValue={value}
      onValueChange={onChange}
    >
      <Picker.Item label="Individual (Personal)" value="individual" />
      <Picker.Item label="Student" value="student" />
      <Picker.Item label="Health & Fitness Professional" value="health_fitness_pro" />
      <Picker.Item label="Healthcare Provider" value="healthcare" />
      {/* ... more options */}
    </Picker>
  );
};
```

### 2. Industry Badge
**File:** `mobile/src/components/IndustryBadge.tsx`

```typescript
export const IndustryBadge = ({ industry }: { industry?: UserIndustry }) => {
  if (!industry || industry === 'individual') return null;
  
  const getIndustryLabel = () => {
    switch (industry) {
      case 'health_fitness_pro': return 'Health & Fitness Pro';
      case 'healthcare': return 'Healthcare';
      // ... etc
    }
  };
  
  return (
    <View style={styles.badge}>
      <Ionicons name="briefcase" size={12} color="#00BFA6" />
      <Text style={styles.badgeText}>{getIndustryLabel()}</Text>
    </View>
  );
};
```

### 3. Plan Recommendation Card
**File:** `mobile/src/components/PlanRecommendationCard.tsx`

```typescript
export const PlanRecommendationCard = ({ 
  plan, 
  reason 
}: { 
  plan: PlanConfig; 
  reason: string; 
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>RECOMMENDED FOR YOU</Text>
      </View>
      <Text style={styles.planName}>{plan.displayName}</Text>
      <Text style={styles.reason}>{reason}</Text>
      <Text style={styles.price}>${plan.monthlyPrice}/mo</Text>
      <Pressable style={styles.button}>
        <Text>Select Plan</Text>
      </Pressable>
    </View>
  );
};
```

---

## 📊 Backend API Requirements

### Endpoint Changes Needed

1. **PUT /api/profile/:userId** - Add industry field
   ```json
   {
     "industry": "health_fitness_pro",
     "profession": "Registered Dietitian"
   }
   ```

2. **GET /api/subscriptions/recommended** (NEW)
   ```
   GET /api/subscriptions/recommended?userId={userId}
   
   Response:
   {
     "success": true,
     "recommended": [
       {
         "planId": "coach",
         "reason": "Based on your industry: Health & Fitness Professional"
       }
     ],
     "allPlans": [...]
   }
   ```

3. **Stripe Price IDs** - Create for new B2B plans
   - workplace-core
   - workplace-plus
   - corporate-enterprise
   - k12-school
   - university
   - hospital
   - hospitality

---

## ✅ Implementation Checklist

### Phase 1: User Industry (Week 1)
- [ ] Add `industry` and `profession` to User interface
- [ ] Add `industry` and `profession` to UserProfile
- [ ] Create IndustrySelector component
- [ ] Add industry step to ProfileSetupScreen
- [ ] Add industry field to Profile edit
- [ ] Update userService.updateUserProfile()
- [ ] Test industry save/load

### Phase 2: Industry Plans (Week 2)
- [ ] Add B2B plan configs to subscriptionConfig.ts
- [ ] Create industryPlanMapping.ts utility
- [ ] Update SubscriptionManagementScreen with recommendations
- [ ] Create PlanRecommendationCard component
- [ ] Test plan filtering by industry

### Phase 3: UI Integration (Week 3)
- [ ] Create IndustryBadge component
- [ ] Add industry badge to Profile header
- [ ] Update subscription section with industry-based messaging
- [ ] Add "Recommended for you" section
- [ ] Test all user flows

### Phase 4: Mobile Checkout (Week 4)
- [ ] Install @stripe/stripe-react-native
- [ ] Create EmbeddedCheckoutNative component
- [ ] Add platform-specific checkout rendering
- [ ] Test iOS checkout flow
- [ ] Test Android checkout flow

### Phase 5: Backend Integration (Week 5)
- [ ] Backend: Add industry field to user table
- [ ] Backend: Update PUT /api/profile endpoint
- [ ] Backend: Create Stripe price IDs for B2B plans
- [ ] Backend: Implement GET /api/subscriptions/recommended
- [ ] E2E testing

---

## 🚀 Quick Start Guide

To implement this feature, start here:

1. **Add industry to User type:**
   ```bash
   # Edit AuthContext.tsx and userService.ts
   # Add industry?: UserIndustry field
   ```

2. **Create industry selector:**
   ```bash
   # Create mobile/src/components/IndustrySelector.tsx
   # Add to ProfileSetupScreen as Step 6
   ```

3. **Add B2B plans:**
   ```bash
   # Edit mobile/src/config/subscriptionConfig.ts
   # Add workplace-core, workplace-plus, etc.
   ```

4. **Test embedded checkout:**
   ```bash
   # Verify EmbeddedCheckout.tsx works on web
   # Install @stripe/stripe-react-native for mobile
   ```

---

## 📚 Related Documentation

- [Embedded Stripe Checkout Guide](EMBEDDED_STRIPE_CHECKOUT_GUIDE.md)
- [Subscription Config](../mobile/src/config/subscriptionConfig.ts)
- [Profile Subscription Management](../mobile/src/screens/Profile.tsx)
- [Coach Profile Setup](../mobile/src/screens/CoachProfileSetup.tsx)

---

**Next Steps:**
1. Review this plan with team
2. Get approval for B2B plan pricing
3. Coordinate with backend on API changes
4. Start Phase 1 implementation

