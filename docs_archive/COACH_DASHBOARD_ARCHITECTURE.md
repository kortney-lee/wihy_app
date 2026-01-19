# WIHY Dashboard Architecture

## Core Philosophy

**1-to-1 coaching is the default. Families are a separate use case.**

- Every user gets a personal health dashboard
- Coaches use WIHY for their own health while managing clients
- Family features are independent from coaching features
- WIHY AI fills the scalability gap when human coaches can't reach everyone
- Human coaching is optional and premium

**Key Principles:**
- ✅ Coaches do NOT need family features by default
- ✅ Families do NOT need coach tools by default
- ✅ AI works across all plans as an add-on or inclusion
- ✅ Navigation is capability-based (show only what user has access to)

## Pricing Structure & Feature Access

### Individual Plans (1 Person)

**Free**
- Limited access
- No AI
- No meal automation
- Basic tracking only

**WIHY Premium** — $12.99/month or $99/year
- Full personal dashboard
- Manual meal creation
- Workout tracking
- Research + nutrition tools
- **Optional add-ons:**
  - WIHY AI Coach (monthly fee)
  - Instacart Pro (monthly fee)

### Family Plans (Multiple People)

**Family Basic** — $24.99/month or $249/year
- Up to 4 people
- Individual Premium features for each member
- Family dashboard
- Shared meals & plans
- **Optional:**
  - WIHY AI Coach (family-wide)
  - Instacart Pro ($4.99/month)

**Family Premium** — $34.99/month or $349/year
- Up to 6 people
- Everything in Family Basic
- **WIHY AI Coach INCLUDED**
- **Instacart Pro INCLUDED**

### Coach Plans (1-to-1 Focused)

**WIHY Coach Platform** — $99.99 setup + $29.99/month
- Coach dashboard
- Client management (unlimited clients)
- Program creation (meals & workouts)
- 1% commission on client transactions
- Ability to assign plans to individual clients
- **Personal Premium access for the coach**

**Does NOT include:**
- Family dashboards
- Family billing/management

**Optional add-ons:**
- WIHY AI Coach (for coach's own use)
- Instacart Pro (for client meal execution)

**Coach + Family Bundle** — $99.99 setup + $29.99/month + $34.99/month
- ⚠️ Edge case for coaches who also manage a family
- Includes Coach Platform
- Includes Family Premium
- AI included for family use
- Instacart included

## WIHY AI Agent (Digital Assistant)

### What It Is
- AI-powered digital assistant
- Creates meal plans, workouts, and guidance
- Works with or without a human coach
- Available to all user types

### Who Can Use It
- ✅ Individuals
- ✅ Parents
- ✅ Coaches
- ✅ Coach clients (if coach enables it)

### Pricing Rule
**AI is never the base plan. AI is always an add-on or included upgrade.**

| User Type | AI Availability |
|-----------|----------------|
| Free | Not available |
| Individual Premium | Add-on ($X/month) |
| Family Basic | Add-on ($X/month) |
| Family Premium | **Included** |
| Coach Platform | Add-on ($X/month) |
| Coach + Family Bundle | **Included** |

## Architecture Overview

WIHY uses a **capability-based dashboard system** where users see only the features they have access to:

- **Personal Dashboard** (Everyone) - Individual health tracking
- **Family Dashboard** (Family plans only) - Household management
- **Coach Dashboard** (Coach platform only) - Professional workspace

## User Model

### User Interface

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  
  // Plan information
  plan: 'free' | 'premium' | 'family-basic' | 'family-premium' | 'coach' | 'coach-family';
  
  // Feature capabilities (derived from plan + add-ons)
  capabilities: {
    // Core features
    meals: boolean;           // Meal planning access
    workouts: boolean;        // Workout plans
    
    // Advanced features
    family: boolean;          // Family dashboard
    coachPlatform: boolean;   // Coach dashboard
    
    // Add-ons
    wihyAI: boolean;          // AI assistant
    instacart: boolean;       // Grocery ordering
  };
  
  // Family info (if applicable)
  familyId?: string;
  familyRole?: 'owner' | 'member';
  
  // Coach info (if applicable)
  coachId?: string;
  commissionRate?: number;
}
```

### Capability Mapping

```typescript
// Map plans to capabilities
const PLAN_CAPABILITIES = {
  free: {
    meals: false,
    workouts: false,
    family: false,
    coachPlatform: false,
    wihyAI: false,
    instacart: false,
  },
  premium: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: false,
    wihyAI: false,  // Can add as optional
    instacart: false,  // Can add as optional
  },
  'family-basic': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: false,  // Can add as optional
    instacart: false,  // Can add as optional
  },
  'family-premium': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: true,  // INCLUDED
    instacart: true,  // INCLUDED
  },
  coach: {
    meals: true,
    workouts: true,
    family: false,  // NOT INCLUDED
    coachPlatform: true,
    wihyAI: false,  // Can add as optional
    instacart: false,  // Can add as optional
  },
  'coach-family': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: true,
    wihyAI: true,  // Included via Family Premium
    instacart: true,  // Included via Family Premium
  },
};
```

### Examples

**Individual Premium User:**
```typescript
{
  plan: 'premium',
  capabilities: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: false,
    wihyAI: false,  // Can upgrade
    instacart: false,
  }
}
// Sees: Personal Dashboard only
// AI: Shows "Upgrade to WIHY AI" prompt
```

**Family Premium User:**
```typescript
{
  plan: 'family-premium',
  capabilities: {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: true,  // INCLUDED
    instacart: true,  // INCLUDED
  }
}
// Sees: Personal Dashboard + Family Dashboard
// AI: Fully enabled
```

**Coach User:**
```typescript
{
  plan: 'coach',
  capabilities: {
    meals: true,
    workouts: true,
    family: false,  // Does NOT have family
    coachPlatform: true,
    wihyAI: false,  // Can add as optional
    instacart: false,
  }
}
// Sees: Personal Dashboard + Coach Dashboard
// Does NOT see: Family Dashboard
// AI: Shows "Add WIHY AI" prompt
```

**Coach + Family Bundle User:**
```typescript
{
  plan: 'coach-family',
  capabilities: {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: true,
    wihyAI: true,
    instacart: true,
  }
}
// Sees: Personal Dashboard + Coach Dashboard + Family Dashboard
// AI: Enabled in all contexts
```

## Role-Based Access (What Users See)

### Individual User
**Plan:** Free or Premium

**Sees:**
- ✅ Personal dashboard
- ✅ Nutrition, Fitness, Research
- ✅ Settings
- ✅ "Ask WIHY AI" button (locked or enabled based on add-on)

**Does NOT see:**
- ❌ Coach dashboard
- ❌ Family management

**Upgrade Prompts:**
- "Upgrade to WIHY AI" (if not enabled)
- "Upgrade to Premium" (if on Free)

---

### Parent (Family Owner)
**Plan:** Family Basic or Family Premium

**Sees:**
- ✅ Personal dashboard (own health)
- ✅ Family dashboard
- ✅ Member management
- ✅ Family meals & shopping
- ✅ AI features (based on Family plan tier)

**Does NOT see:**
- ❌ Coach dashboard
- ❌ Client management

**AI Access:**
- Family Basic: "Add WIHY AI" prompt
- Family Premium: AI fully enabled

---

### Coach
**Plan:** Coach Platform ($99.99 + $29.99/month)

**Sees TWO dashboards:**

1. **Personal Dashboard** (same as Individual Premium)
   - Own nutrition
   - Own fitness
   - Own meal plans
   - Own workouts
   - Own AI (if added as optional)

2. **Coach Dashboard**
   - Client management
   - Program creation
   - Client assignments
   - Revenue tracking
   - 1% commission view

**Does NOT see:**
- ❌ Family dashboard
- ❌ Family billing/management

**Why This Works:**
- Coaches should use WIHY for their own health too
- Separates professional from personal
- No confusion between "my meal plan" vs "client's meal plan"

---

### Coach + Family (Edge Case)
**Plan:** Coach Platform + Family Premium

**Sees THREE dashboards:**

1. **Personal Dashboard** - Own health
2. **Coach Dashboard** - Professional workspace
3. **Family Dashboard** - Household management

**AI Access:**
- ✅ Enabled via Family Premium inclusion
- Available in all three contexts

**Use Case:**
- Coach who also manages a family
- Rare but supported configuration

## Navigation Behavior

## Dashboard Structure

### 1. Personal Dashboard (Universal)
**Location:** `src/screens/DashboardPage.tsx`

**Shown to:** Every logged-in user (including coaches, parents, everyone)

**Always Visible Features:**
- Overview (health summary)
- Nutrition (food logging)
- Fitness (workouts)
- Progress (personal tracking)
- Research (health insights)
- Settings (account preferences)

**Conditionally Visible:**
- Meal Plans (if `capabilities.meals === true`)
- "Ask WIHY AI" (locked if `capabilities.wihyAI === false`, enabled if true)
- Instacart ordering (if `capabilities.instacart === true`)

**Key Point:** This dashboard is identical for everyone. A coach using WIHY for their own health sees the same personal dashboard as an individual user.

---

### 2. Family Dashboard (Conditional)
**Location:** `src/screens/FamilyDashboardPage.tsx` (to be created)

**Shown to:** Users with `capabilities.family === true`

**Visibility Rules:**
- Family Basic: ✅ Visible
- Family Premium: ✅ Visible
- Coach Platform: ❌ NOT visible (unless Coach + Family Bundle)
- Individual Premium: ❌ NOT visible

**Features:**
- Family Overview
- Member Management (up to 4-6 people)
- Family Meals & Shared Plans
- Shopping Lists
- Family Progress Tracking
- Child/Member Profiles

**Navigation:**
- Accessible via dashboard switcher tabs
- User can toggle between Personal ↔ Family
- State preserved when switching

**AI Integration:**
- Family Basic: AI prompts show "Add WIHY AI for Family"
- Family Premium: AI fully enabled for family-wide use

---

### 3. Coach Dashboard (Conditional)
**Location:** `src/screens/CoachDashboardPage.tsx`

**Shown to:** Users with `capabilities.coachPlatform === true`

**Visibility Rules:**
- Coach Platform: ✅ Visible
- Coach + Family: ✅ Visible
- Family plans: ❌ NOT visible
- Individual plans: ❌ NOT visible

**Features:**
- Client Dashboard (overview)
- Client Management (roster)
- Programs (meal plans & workout builder)
- Revenue Tracking (1% commission view)
- Client Onboarding

**Navigation:**
- Accessible via dashboard switcher tabs
- User can toggle between Personal ↔ Coach
- Separate from personal health context

**Client Assignment:**
- Coaches assign programs to individual clients
- No family billing
- 1-to-1 focused

**AI Integration:**
- Coach can add WIHY AI as optional add-on
- AI assists with program creation
- Not included by default in Coach plan

## Navigation Behavior

### Capability-Based Navigation

**Navigation is based on what you have access to, not what plan you're on.**

```
┌─────────────────────────────────┐
│  [Personal] [Family] [Coach]    │  ← Only enabled tabs appear
└─────────────────────────────────┘
```

**Rules:**
- ✅ Personal tab: Always visible (everyone)
- ✅ Family tab: Only if `capabilities.family === true`
- ✅ Coach tab: Only if `capabilities.coachPlatform === true`
- ✅ Active tab highlights current context
- ✅ Switching preserves state in each dashboard

### Navigation Examples

**Individual Premium:**
```
┌─────────────────────────────────┐
│  [Personal]                      │  ← Only one tab
└─────────────────────────────────┘
```

**Family Premium:**
```
┌─────────────────────────────────┐
│  [Personal] [Family]             │  ← Two tabs
└─────────────────────────────────┘
```

**Coach:**
```
┌─────────────────────────────────┐
│  [Personal] [Coach]              │  ← Two tabs
└─────────────────────────────────┘
```

**Coach + Family Bundle:**
```
┌─────────────────────────────────┐
│  [Personal] [Family] [Coach]     │  ← All three tabs
└─────────────────────────────────┘
```

### Navigation Flow

```
App Root
├── Personal Dashboard (ALWAYS VISIBLE)
│   ├── Overview
│   ├── Nutrition
│   ├── Fitness
│   ├── Progress
│   ├── Research
│   ├── Meal Plans (if capabilities.meals)
│   ├── "Ask WIHY AI" (locked or enabled)
│   └── Settings
│
├── Family Dashboard (if capabilities.family === true)
│   ├── Family Overview
│   ├── Members (up to 4-6)
│   ├── Family Meals
│   ├── Shopping Lists
│   ├── Family Progress
│   └── "Ask WIHY AI" (family-wide, if enabled)
│
└── Coach Dashboard (if capabilities.coachPlatform === true)
    ├── Client Dashboard
    ├── Client Management
    ├── Programs (meal + workout builder)
    ├── Revenue (1% commission)
    ├── Client Onboarding
    └── "Ask WIHY AI" (if coach added as optional)
```

### Bottom Tab Navigation

Bottom tabs adapt based on active dashboard context:

**Personal Context:**
```
[Overview] [Nutrition] [Fitness] [Progress] [Research]
```

**Family Context:**
```
[Family Home] [Members] [Meals] [Shopping] [Progress]
```

**Coach Context:**
```
[Dashboard] [Clients] [Programs] [Revenue] [Settings]
```

### "Ask WIHY AI" Entry Point (Universal)

The AI assistant appears across all contexts but with different states:

**Locked State** (AI not enabled):
```
┌─────────────────────────────────┐
│  🤖 Ask WIHY AI                  │
│  Upgrade to unlock AI assistant  │
└─────────────────────────────────┘
```

**Enabled State** (AI included or added):
```
┌─────────────────────────────────┐
│  🤖 Ask WIHY AI                  │
│  Get personalized guidance       │
└─────────────────────────────────┘
```

**Where it appears:**
- Personal Dashboard (for personal health)
- Family Dashboard (for family guidance)
- Coach Dashboard (for program creation)

## Capability Utilities

### Feature Access Functions

```typescript
// Location: src/utils/capabilities.ts

export const hasCapability = (
  user: User | null, 
  capability: keyof User['capabilities']
): boolean => {
  if (!user?.capabilities) return false;
  return user.capabilities[capability] === true;
};

// Shorthand helpers
export const hasCoachAccess = (user: User | null): boolean => 
  hasCapability(user, 'coachPlatform');

export const hasFamilyAccess = (user: User | null): boolean => 
  hasCapability(user, 'family');

export const hasAIAccess = (user: User | null): boolean => 
  hasCapability(user, 'wihyAI');

export const hasMealsAccess = (user: User | null): boolean => 
  hasCapability(user, 'meals');

export const hasInstacartAccess = (user: User | null): boolean => 
  hasCapability(user, 'instacart');
```

### Conditional Rendering

```tsx
// Show Family Dashboard tab
{hasFamilyAccess(user) && (
  <Tab.Screen name="Family" component={FamilyDashboardPage} />
)}

// Show Coach Dashboard tab
{hasCoachAccess(user) && (
  <Tab.Screen name="Coach" component={CoachDashboardPage} />
)}

// Show AI assistant or upgrade prompt
{hasAIAccess(user) ? (
  <WihyAIButton onPress={openAIChat} />
) : (
  <LockedAIButton onPress={showUpgradeModal} />
)}

// Show Instacart ordering
{hasInstacartAccess(user) && (
  <InstacartOrderButton mealPlan={mealPlan} />
)}
```

### Plan-to-Capability Mapping

```typescript
// Location: src/utils/planMapping.ts

export const getPlanCapabilities = (
  plan: User['plan'],
  addOns: string[] = []
): User['capabilities'] => {
  const base = PLAN_CAPABILITIES[plan];
  
  // Apply add-ons
  const capabilities = { ...base };
  if (addOns.includes('ai')) capabilities.wihyAI = true;
  if (addOns.includes('instacart')) capabilities.instacart = true;
  
  return capabilities;
};

// Usage in AuthContext
const user = await authAPI.getUser();
const capabilities = getPlanCapabilities(user.plan, user.addOns);
setUser({ ...user, capabilities });
```

## Meal Planning — Unified Logic

Meal planning works the same across Personal, Family, and Coach contexts.

### Meal Creation Sources

Meals can be created by:
1. **User** (manual entry)
2. **Human Coach** (professional assignment)
3. **WIHY AI** (digital assistant)

### Requirements

- ✅ `capabilities.meals` must be `true`
- ✅ AI is optional (manual creation always works)
- ✅ Instacart is optional (grocery lists work without it)

### Context Examples

**Personal Context (Individual):**
```
User → creates meal for themselves
User → asks WIHY AI to generate meal plan
User's hired coach → assigns meal plan to user
```

**Family Context (Parent):**
```
Parent → creates meal for child
Parent → asks WIHY AI for family meal ideas
Parent → assigns different meals to each family member
```

**Coach Context (Professional):**
```
Coach → creates meal plan for client
Coach → asks WIHY AI to generate client-specific meal
Coach → sends meal plan with Instacart grocery list to client
```

### Meal Builder (Universal Component)

The meal builder component is shared across all contexts:

**Location:** `src/components/MealBuilder.tsx`

**Props:**
```typescript
interface MealBuilderProps {
  context: 'personal' | 'family' | 'coach';
  targetUserId?: string;  // For family members or clients
  aiEnabled: boolean;     // Based on capabilities.wihyAI
  instacartEnabled: boolean;  // Based on capabilities.instacart
}
```

**Behavior adapts:**
- Personal: Creates for current user
- Family: Creates for selected family member
- Coach: Creates for selected client

---

## WIHY AI Assistant

### What It Is
- 🤖 AI-powered digital assistant
- **Not** a human coach
- **Not** tied to a specific role or plan
- **Always an add-on or included upgrade**

### Who Can Access
- ✅ Individual Premium (add-on)
- ✅ Family Basic (add-on)
- ✅ Family Premium (**included**)
- ✅ Coach Platform (add-on)
- ✅ Coach + Family (**included** via Family Premium)

### Where It Appears
- Personal Dashboard (for personal health guidance)
- Family Dashboard (for family-wide meal/workout ideas)
- Coach Dashboard (for client program creation)

### UI States

**Locked (Not Enabled):**
```
┌────────────────────────────────┐
│  🔒 Ask WIHY AI                │
│  Add AI Assistant for $X/month │
│  [Upgrade Now]                 │
└────────────────────────────────┘
```

**Enabled:**
```
┌────────────────────────────────┐
│  🤖 Ask WIHY AI                │
│  Get personalized guidance     │
│  [Ask a Question]              │
└────────────────────────────────┘
```

### Context-Aware Responses

WIHY AI adapts based on context:

| Context | AI Focus |
|---------|----------|
| Personal | Individual health, personal goals |
| Family | Family meals, household nutrition |
| Coach | Client programming, professional guidance |

---

## Instacart Integration

### Purpose
Optional enhancement for grocery shopping convenience.

### Availability
- Individual Premium (add-on: $X/month)
- Family Basic (add-on: $4.99/month)
- Family Premium (**included**)
- Coach Platform (add-on for client meal execution)
- Coach + Family (**included**)

### If Enabled
- ✅ "Order with Instacart" buttons appear
- ✅ One-click grocery list export
- ✅ Direct checkout integration

### If Not Enabled
- ✅ Meal plans still work perfectly
- ✅ Grocery lists can be viewed/printed/exported
- ❌ No "Order" buttons (show upgrade prompt instead)

### Usage Contexts

**Personal:**
```
User creates meal plan → generates grocery list → orders via Instacart
```

**Family:**
```
Parent creates family meals → combined grocery list → orders for household
```

**Coach → Client:**
```
Coach assigns meal plan → client receives grocery list → client can order
Note: Client needs their own Instacart access to order
```

## Implementation Guide

### 1. Update User Interface

**Location:** `src/context/AuthContext.tsx`

**Before (Old Model):**
```typescript
interface User {
  userRole?: 'user' | 'coach' | 'parent' | 'admin';
}
```

**After (Correct Model):**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  
  // Plan tier
  plan: 'free' | 'premium' | 'family-basic' | 'family-premium' | 'coach' | 'coach-family';
  
  // Add-ons (if applicable)
  addOns?: string[];  // ['ai', 'instacart']
  
  // Computed capabilities (derived from plan + addOns)
  capabilities: {
    meals: boolean;
    workouts: boolean;
    family: boolean;
    coachPlatform: boolean;
    wihyAI: boolean;
    instacart: boolean;
  };
  
  // Family info
  familyId?: string;
  familyRole?: 'owner' | 'member';
  
  // Coach info
  coachId?: string;
  commissionRate?: number;
}
```

---

### 2. Create Capability Utilities

**Location:** `src/utils/capabilities.ts` (new file)

```typescript
import type { User } from '../context/AuthContext';

// Base capability plans
export const PLAN_CAPABILITIES = {
  free: {
    meals: false,
    workouts: false,
    family: false,
    coachPlatform: false,
    wihyAI: false,
    instacart: false,
  },
  premium: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: false,
    wihyAI: false,
    instacart: false,
  },
  'family-basic': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: false,
    instacart: false,
  },
  'family-premium': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: true,      // INCLUDED
    instacart: true,   // INCLUDED
  },
  coach: {
    meals: true,
    workouts: true,
    family: false,     // NOT included
    coachPlatform: true,
    wihyAI: false,
    instacart: false,
  },
  'coach-family': {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: true,
    wihyAI: true,      // Included via Family Premium
    instacart: true,   // Included via Family Premium
  },
};

// Apply plan + add-ons to get final capabilities
export const getPlanCapabilities = (
  plan: User['plan'],
  addOns: string[] = []
): User['capabilities'] => {
  const base = { ...PLAN_CAPABILITIES[plan] };
  
  // Apply add-ons
  if (addOns.includes('ai')) base.wihyAI = true;
  if (addOns.includes('instacart')) base.instacart = true;
  
  return base;
};

// Convenience checkers
export const hasCapability = (
  user: User | null,
  capability: keyof User['capabilities']
): boolean => {
  if (!user?.capabilities) return false;
  return user.capabilities[capability] === true;
};

export const hasCoachAccess = (user: User | null): boolean =>
  hasCapability(user, 'coachPlatform');

export const hasFamilyAccess = (user: User | null): boolean =>
  hasCapability(user, 'family');

export const hasAIAccess = (user: User | null): boolean =>
  hasCapability(user, 'wihyAI');

export const hasMealsAccess = (user: User | null): boolean =>
  hasCapability(user, 'meals');

export const hasInstacartAccess = (user: User | null): boolean =>
  hasCapability(user, 'instacart');
```

---

### 3. Update AuthContext to Compute Capabilities

**Location:** `src/context/AuthContext.tsx`

```typescript
import { getPlanCapabilities } from '../utils/capabilities';

// When user signs in or profile loads
const loadUser = async () => {
  const userData = await authAPI.getUser();
  
  // Compute capabilities from plan + add-ons
  const capabilities = getPlanCapabilities(
    userData.plan,
    userData.addOns || []
  );
  
  const user: User = {
    ...userData,
    capabilities,
  };
  
  setUser(user);
};
```

---

### 4. Create Dashboard Switcher Component

**Location:** `src/components/DashboardSwitcher.tsx` (new file)

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { hasCoachAccess, hasFamilyAccess } from '../utils/capabilities';

interface DashboardContext {
  id: 'personal' | 'family' | 'coach';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const DashboardSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [activeContext, setActiveContext] = useState<DashboardContext['id']>('personal');

  const availableContexts: DashboardContext[] = [
    { id: 'personal', label: 'Personal', icon: 'person' },
    hasFamilyAccess(user) && { id: 'family', label: 'Family', icon: 'people' },
    hasCoachAccess(user) && { id: 'coach', label: 'Coach', icon: 'briefcase' },
  ].filter(Boolean) as DashboardContext[];

  // If only one context, don't show switcher
  if (availableContexts.length === 1) return null;

  return (
    <View style={styles.container}>
      {availableContexts.map((context) => (
        <TouchableOpacity
          key={context.id}
          style={[
            styles.tab,
            activeContext === context.id && styles.activeTab,
          ]}
          onPress={() => setActiveContext(context.id)}
        >
          <Ionicons
            name={context.icon}
            size={20}
            color={activeContext === context.id ? '#007AFF' : '#8E8E93'}
          />
          <Text
            style={[
              styles.label,
              activeContext === context.id && styles.activeLabel,
            ]}
          >
            {context.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8E8E93',
  },
  activeLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
```

---

### 5. Update Navigation with Conditional Tabs

**Location:** `src/navigation/AppNavigator.tsx`

```tsx
import { hasCoachAccess, hasFamilyAccess } from '../utils/capabilities';

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator>
      {/* Personal Dashboard - ALWAYS VISIBLE */}
      <Tab.Screen 
        name="Personal" 
        component={DashboardPage}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      
      {/* Family Dashboard - CONDITIONAL */}
      {hasFamilyAccess(user) && (
        <Tab.Screen 
          name="Family" 
          component={FamilyDashboardPage}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
          }}
        />
      )}
      
      {/* Coach Dashboard - CONDITIONAL */}
      {hasCoachAccess(user) && (
        <Tab.Screen 
          name="Coach" 
          component={CoachDashboardPage}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
};
```

---

### 6. Update Existing Components

**DashboardPage.tsx** (Personal Dashboard):
```tsx
import { hasAIAccess, hasInstacartAccess } from '../utils/capabilities';

// Remove old role-based logic
// Add capability-based rendering
{hasAIAccess(user) ? (
  <WihyAIButton />
) : (
  <LockedAIButton message="Add WIHY AI for $X/month" />
)}
```

**CoachDashboardPage.tsx**:
```tsx
// This component should ONLY appear if hasCoachAccess(user) === true
// No need for internal role checks
```

**FamilyDashboardPage.tsx** (new file to create):
```tsx
// This component should ONLY appear if hasFamilyAccess(user) === true
// No need for internal role checks
```

## Migration Path

### Phase 1: Update User Model & Utilities
- [ ] Update `src/context/AuthContext.tsx`
  - Change `userRole` to `plan` + `capabilities`
  - Add `familyId`, `coachId`, `addOns` fields
- [ ] Create `src/utils/capabilities.ts`
  - Add `PLAN_CAPABILITIES` mapping
  - Add `getPlanCapabilities()` function
  - Add convenience helpers (`hasCoachAccess`, etc.)
- [ ] Delete `src/utils/userRoles.ts` (old file)
- [ ] Update sign-in flow to compute capabilities

**Goal:** User model reflects plan-based capabilities, not roles

---

### Phase 2: Create Dashboard Switcher
- [ ] Create `src/components/DashboardSwitcher.tsx`
- [ ] Add switcher to top of navigation
- [ ] Implement context state management
- [ ] Handle tab switching with state preservation

**Goal:** Users can toggle between Personal, Family, Coach contexts

---

### Phase 3: Refactor Personal Dashboard
- [ ] Update `src/screens/DashboardPage.tsx`
  - Ensure it works for everyone (individuals, coaches, parents)
  - Remove any coach-specific embedded features
  - Add "Ask WIHY AI" with locked/enabled states
  - Add Instacart conditional rendering
- [ ] Remove old role-based conditional logic
- [ ] Test as Individual, Coach, Parent user

**Goal:** Personal dashboard is universal, not role-specific

---

### Phase 4: Update Coach Dashboard
- [ ] Update `src/screens/CoachDashboardPage.tsx`
  - Remove "Find a Coach" (already done ✅)
  - Ensure it's an ADDITIONAL context, not a replacement
  - Add Revenue tracking feature
  - Add AI integration (if coach has add-on)
- [ ] Test that coaches still have full Personal dashboard access

**Goal:** Coach dashboard is a professional workspace, separate from personal health

---

### Phase 5: Create Family Dashboard
- [ ] Create `src/screens/FamilyDashboardPage.tsx`
  - Family overview
  - Member management (up to 4-6)
  - Family meals & shopping
  - Family progress tracking
- [ ] Add to navigation conditionally
- [ ] Test with Family Basic (no AI) and Family Premium (AI included)

**Goal:** Family features are isolated in their own dashboard

---

### Phase 6: Update Navigation
- [ ] Update `src/navigation/AppNavigator.tsx`
  - Personal tab: Always visible
  - Family tab: `{hasFamilyAccess(user) && ...}`
  - Coach tab: `{hasCoachAccess(user) && ...}`
- [ ] Update `src/types/navigation.ts`
  - Add FamilyDashboardPage to routes
  - Update param lists
- [ ] Test tab visibility for each plan type

**Goal:** Navigation adapts based on user's capabilities

---

### Phase 7: Feature Gating (AI & Instacart)
- [ ] Update all meal creation components
  - Show "Ask WIHY AI" based on `hasAIAccess(user)`
  - Show Instacart buttons based on `hasInstacartAccess(user)`
- [ ] Create LockedFeatureButton component for upgrade prompts
- [ ] Add upgrade modals/flows
- [ ] Test AI visibility:
  - Free: Not visible
  - Premium: Locked (upgrade prompt)
  - Family Premium: Enabled
  - Coach: Locked (upgrade prompt)
  - Coach + Family: Enabled

**Goal:** AI and Instacart appear correctly based on plan + add-ons

---

### Phase 8: Backend Integration
- [ ] Update API to return `plan`, `addOns`, `capabilities`
- [ ] Update sign-up flow to assign plans
- [ ] Update upgrade flows (Premium → Family, add AI, etc.)
- [ ] Test plan transitions

**Goal:** Frontend capabilities sync with backend subscription state

---

### Phase 9: Testing & Validation
- [ ] Test Individual Free user
  - ✅ Personal dashboard only
  - ✅ No AI, no Instacart
  - ✅ Upgrade prompts visible
- [ ] Test Individual Premium user
  - ✅ Personal dashboard only
  - ✅ Meals & workouts enabled
  - ✅ AI locked (can add)
- [ ] Test Family Premium user
  - ✅ Personal + Family dashboards
  - ✅ AI enabled
  - ✅ Instacart enabled
- [ ] Test Coach user
  - ✅ Personal + Coach dashboards
  - ✅ No Family tab
  - ✅ AI locked (can add)
- [ ] Test Coach + Family user
  - ✅ All three dashboards
  - ✅ AI enabled
  - ✅ Instacart enabled

**Goal:** All plan configurations work correctly

---

### Current Status
- ✅ CoachDashboardPage created
- ✅ Basic role utilities created (needs update to capabilities)
- ⚠️ User model still uses `userRole` (needs migration to `plan` + `capabilities`)
- ❌ Dashboard switcher not created
- ❌ Family dashboard not created
- ❌ Navigation still uses old role-based logic
- ❌ AI/Instacart not properly gated

**Next Step:** Phase 1 - Update User Model & Utilities

## Testing Scenarios

### Test Case 1: Individual Free
```typescript
const user = {
  plan: 'free',
  capabilities: {
    meals: false,
    workouts: false,
    family: false,
    coachPlatform: false,
    wihyAI: false,
    instacart: false,
  }
};

// Expected Navigation:
// ✅ Personal tab only
// ❌ No Family tab
// ❌ No Coach tab

// Expected Features:
// ✅ Basic tracking
// ❌ No meal creation
// ❌ No AI (locked)
// ❌ No Instacart
// ✅ "Upgrade to Premium" prompts
```

---

### Test Case 2: Individual Premium
```typescript
const user = {
  plan: 'premium',
  capabilities: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: false,
    wihyAI: false,
    instacart: false,
  }
};

// Expected Navigation:
// ✅ Personal tab only

// Expected Features:
// ✅ Full personal dashboard
// ✅ Manual meal creation
// ✅ Workout tracking
// ❌ AI locked (shows "Add WIHY AI for $X/month")
// ❌ Instacart locked (shows "Add Instacart Pro")
```

---

### Test Case 3: Family Premium
```typescript
const user = {
  plan: 'family-premium',
  capabilities: {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: true,      // INCLUDED
    instacart: true,   // INCLUDED
  }
};

// Expected Navigation:
// ✅ Personal tab
// ✅ Family tab

// Expected Features:
// ✅ Personal health tracking
// ✅ Family dashboard
// ✅ Member management (up to 6)
// ✅ Family meals & shopping
// ✅ AI enabled in both Personal and Family contexts
// ✅ Instacart ordering enabled
```

---

### Test Case 4: Coach Platform
```typescript
const user = {
  plan: 'coach',
  capabilities: {
    meals: true,
    workouts: true,
    family: false,     // NOT included
    coachPlatform: true,
    wihyAI: false,
    instacart: false,
  }
};

// Expected Navigation:
// ✅ Personal tab (own health)
// ✅ Coach tab (professional workspace)
// ❌ No Family tab

// Expected Features:
// ✅ Personal dashboard (for coach's own health)
// ✅ Coach dashboard (client management)
// ✅ Program creation (meals & workouts)
// ✅ Revenue tracking (1% commission)
// ❌ AI locked (shows "Add WIHY AI")
// ❌ No family features
```

---

### Test Case 5: Coach + Family Bundle
```typescript
const user = {
  plan: 'coach-family',
  capabilities: {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: true,
    wihyAI: true,      // Included via Family Premium
    instacart: true,   // Included via Family Premium
  }
};

// Expected Navigation:
// ✅ Personal tab
// ✅ Family tab
// ✅ Coach tab

// Expected Features:
// ✅ Personal dashboard
// ✅ Family dashboard (household)
// ✅ Coach dashboard (professional)
// ✅ Can switch between all 3 contexts
// ✅ AI enabled in all contexts
// ✅ Instacart enabled everywhere
// ✅ Separate state for each context
```

---

### Test Case 6: Individual Premium + AI Add-On
```typescript
const user = {
  plan: 'premium',
  addOns: ['ai'],
  capabilities: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: false,
    wihyAI: true,      // Added as optional
    instacart: false,
  }
};

// Expected Features:
// ✅ Personal dashboard
// ✅ Meals & workouts
// ✅ AI enabled (purchased as add-on)
// ❌ Instacart still locked
```

---

### Test Case 7: Coach + AI Add-On
```typescript
const user = {
  plan: 'coach',
  addOns: ['ai'],
  capabilities: {
    meals: true,
    workouts: true,
    family: false,
    coachPlatform: true,
    wihyAI: true,      // Added as optional
    instacart: false,
  }
};

// Expected Features:
// ✅ Personal dashboard
// ✅ Coach dashboard
// ✅ AI enabled in both Personal and Coach contexts
// ✅ AI helps with client program creation
// ❌ No Family tab
```

## Why This Architecture Works

### 1. ✅ Matches Real Coaching Behavior (1-to-1)
- Coaches manage individual clients, not families
- Clean separation between professional and personal use
- No confusion between "my meal plan" vs "client's meal plan"
- Commission tracking per client, not per household

### 2. ✅ Keeps Families Separate and Clean
- Family features are for households, not professional coaching
- Parents manage their own family members
- No overlap with coach platform features
- Different pricing tiers for different use cases

### 3. ✅ Makes AI the Scalable Differentiator
- WIHY AI fills the gap when human coaches can't reach everyone
- Available as add-on to all plan types
- Included in premium tiers (Family Premium, Coach + Family)
- Works across all contexts (Personal, Family, Coach)

### 4. ✅ Avoids Pricing Explosion
- Clear plan tiers with predictable pricing
- Add-ons are optional, not required
- No complex role + permission combinations
- Easy to explain to customers

### 5. ✅ User-Centric Design
- Everyone gets personal health tracking first
- Professional and family features layer on top
- No loss of features when upgrading
- Coaches use WIHY for their own health too

### 6. ✅ Clean Mental Model
**"Personal health app + optional add-ons"**

- Easy to explain: "You keep your dashboard, we just add more"
- No confusion about roles or permissions
- Natural upgrade paths (Premium → Family, Premium → Coach)
- AI and Instacart work the same way everywhere

### 7. ✅ Flexible Monetization
- Individual → Premium ($12.99/month)
- Premium → Family Basic ($24.99/month)
- Premium → Coach ($29.99/month)
- Optional: Add AI or Instacart to any plan
- Premium bundles: Family Premium (AI included), Coach + Family (all included)

### 8. ✅ Scalability for Future Features
- Easy to add new contexts (Nutritionist, Trainer, Therapist, etc.)
- Features compose cleanly without conflicts
- No role-based edge cases
- Can add specialized professional dashboards

### 9. ✅ Maintainability
- Each dashboard is independent and focused
- Shared components (MealBuilder, WorkoutBuilder, AI Chat)
- Capability flags control visibility
- Easy to test each plan configuration
- Clear boundaries between features

### 10. ✅ Maps to Backend/GHL
- Plans = GoHighLevel Products
- Add-ons = Additional Products/Tags
- Capabilities computed from plan + add-ons
- Clean subscription management
- Easy to track revenue per feature
