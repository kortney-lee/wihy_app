# WIHY Health - Plan-Based Architecture Testing Guide

## Quick Start - How to Test

### 1. Access the Dev Plan Switcher

1. Open the WIHY Health app
2. Navigate to the **Profile** tab (bottom navigation)
3. Look for the floating **orange "DEV" button** in the bottom right corner
4. Tap it to open the Plan Switcher modal

### 2. Test Different Plans

#### Test Scenario 1: Free Plan (No Features)
```
Plan: Free
Add-ons: None
Expected: Only Personal dashboard visible, all features locked
```

#### Test Scenario 2: Premium Plan (Meals + Workouts)
```
Plan: Premium
Add-ons: None
Expected: Personal dashboard with meals/workouts enabled
```

#### Test Scenario 3: Premium + AI Add-on
```
Plan: Premium
Add-ons: AI enabled
Expected: Personal dashboard + AI features unlocked
```

#### Test Scenario 4: Family Basic (4 Members)
```
Plan: Family Basic
Add-ons: None (can add AI + Instacart)
Expected: Personal + Family dashboards, 4 member limit
```

#### Test Scenario 5: Family Premium (Unlimited)
```
Plan: Family Premium
Add-ons: AI + Instacart included automatically
Expected: Personal + Family dashboards, unlimited members, all features
```

#### Test Scenario 6: Coach Plan
```
Plan: Coach
Add-ons: None (can add AI)
Expected: Personal + Coach dashboards, revenue tracking
```

#### Test Scenario 7: Coach + Family (All Features)
```
Plan: Coach + Family
Add-ons: AI + Instacart included automatically
Expected: All 3 dashboards (Personal, Family, Coach), all features unlocked
```

## What to Verify

### Dashboard Switcher Behavior
- [ ] Switcher only shows if user has 2+ dashboards
- [ ] Personal tab always visible
- [ ] Family tab only visible if `hasFamilyAccess(user)` = true
- [ ] Coach tab only visible if `hasCoachAccess(user)` = true
- [ ] Active tab highlights correctly
- [ ] Switching between tabs works smoothly

### Personal Dashboard
- [ ] Always accessible to all users
- [ ] Shows meals/workouts based on capabilities
- [ ] AI features locked for Free plan
- [ ] AI features unlocked for Premium + AI add-on or Family/Coach premium plans

### Family Dashboard
- [ ] Only visible for Family Basic, Family Premium, Coach + Family plans
- [ ] Shows Guardian Code for family owners
- [ ] Share Guardian Code button works
- [ ] Family members list displays correctly
- [ ] Member limit enforced (4 for Basic, unlimited for Premium)
- [ ] Upgrade banner shows for Family Basic when at capacity
- [ ] AI locked for Family Basic (unless added)
- [ ] AI unlocked for Family Premium
- [ ] Instacart locked for Family Basic (unless added)
- [ ] Instacart unlocked for Family Premium

### Coach Dashboard
- [ ] Only visible for Coach and Coach + Family plans
- [ ] Shows Overview tab with revenue tracking
- [ ] Shows commission rate (30% default)
- [ ] Active clients count displays
- [ ] AI Assistant locked unless AI add-on enabled
- [ ] Quick actions work correctly

### Feature Gating
- [ ] Locked features show `LockedFeatureButton` with upgrade prompt
- [ ] AI features respect `hasAIAccess(user)` check
- [ ] Instacart features respect `hasInstacartAccess(user)` check
- [ ] Upgrade messages are clear and actionable

### Add-on Logic
- [ ] AI add-on available for: Premium, Family Basic, Coach
- [ ] AI automatically included for: Family Premium, Coach + Family
- [ ] Instacart add-on available for: Family Basic only
- [ ] Instacart automatically included for: Family Premium, Coach + Family
- [ ] Add-on toggles disabled when not available

## Implementation Status

### ✅ Completed Phases

#### Phase 1: User Model & Utilities (COMPLETE)
- [x] Created `src/utils/capabilities.ts` with complete capability system
- [x] Updated `User` interface with plan, addOns, capabilities
- [x] Updated `AuthContext` to compute capabilities from plan
- [x] Deleted old `userRoles.ts` file
- [x] Fixed TypeScript errors

#### Phase 2: Dashboard Switcher (COMPLETE)
- [x] Created `src/components/DashboardSwitcher.tsx`
- [x] Dynamic tab rendering based on capabilities
- [x] Hides when only one dashboard available
- [x] Clean UI with active state indicators

#### Phase 3: Multi-Context Navigation (COMPLETE)
- [x] Created `src/screens/HealthHub.tsx`
- [x] Integrated DashboardSwitcher with all dashboards
- [x] Updated navigation to use HealthHub

#### Phase 4: Update Coach Dashboard (COMPLETE)
- [x] Created `src/screens/CoachOverview.tsx` with revenue tracking
- [x] Added AI integration (locked/unlocked based on add-on)
- [x] Added quick actions with lock states
- [x] Integrated into CoachDashboardPage

#### Phase 5: Create Family Dashboard (COMPLETE)
- [x] Created `src/screens/FamilyDashboardPage.tsx`
- [x] Family member management with Guardian Code
- [x] Share Guardian Code functionality
- [x] Member limit enforcement (4 vs unlimited)
- [x] AI and Instacart feature gating
- [x] Updated HealthHub to use FamilyDashboardPage

#### Phase 6: Update Navigation (COMPLETE)
- [x] Updated `src/types/navigation.ts` with FamilyDashboardPage route
- [x] Updated `src/navigation/AppNavigator.tsx` with new routes
- [x] Conditional dashboard visibility working

#### Phase 7: Feature Gating (COMPLETE)
- [x] Created `src/components/LockedFeatureButton.tsx`
- [x] AI access gating in Coach Dashboard
- [x] Instacart access gating in Family Dashboard
- [x] Upgrade prompts for locked features

#### DEV TOOLS (COMPLETE)
- [x] Created `src/components/DevPlanSwitcher.tsx`
- [x] Added to Profile screen
- [x] Floating DEV button for easy access
- [x] Plan selector with all 6 tiers
- [x] Add-on toggles with availability logic
- [x] Live capability preview

### ⏳ Remaining Phases

#### Phase 8: Backend Integration (PENDING)
- [ ] Update GHL subscription sync to use plan field
- [ ] Create plan upgrade/downgrade flows
- [ ] Add-on purchase integration
- [ ] Guardian Code generation backend
- [ ] Family member invitation system
- [ ] Revenue tracking API integration

#### Phase 9: Testing & Validation (PENDING)
- [ ] Test all plan tiers with real data
- [ ] Test add-on combinations
- [ ] Test dashboard switching performance
- [ ] Test Guardian Code sharing
- [ ] Test member limits
- [ ] End-to-end user flows

## Architecture Quick Reference

### Plan Capabilities Matrix

| Plan | Meals | Workouts | Family | Coach Platform | WIHY AI | Instacart |
|------|-------|----------|--------|----------------|---------|-----------|
| Free | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Premium | ✅ | ✅ | ❌ | ❌ | 💰 Add-on | ❌ |
| Family Basic | ✅ | ✅ | ✅ (4) | ❌ | 💰 Add-on | 💰 Add-on |
| Family Premium | ✅ | ✅ | ✅ (∞) | ❌ | ✅ Included | ✅ Included |
| Coach | ✅ | ✅ | ❌ | ✅ | 💰 Add-on | ❌ |
| Coach + Family | ✅ | ✅ | ✅ (∞) | ✅ | ✅ Included | ✅ Included |

### Key Functions

```typescript
// Check specific capabilities
hasCoachAccess(user)      // Returns user.capabilities.coachPlatform
hasFamilyAccess(user)     // Returns user.capabilities.family
hasAIAccess(user)         // Returns user.capabilities.wihyAI
hasInstacartAccess(user)  // Returns user.capabilities.instacart
hasMealsAccess(user)      // Returns user.capabilities.meals
hasWorkoutsAccess(user)   // Returns user.capabilities.workouts

// Get available dashboards
getAvailableDashboards(user) // Returns ['personal', 'family', 'coach']

// Check upgrade eligibility
canUpgradeTo(user, 'ai')        // Can user add AI?
canUpgradeTo(user, 'instacart') // Can user add Instacart?
getUpgradeMessage(user, 'ai')   // Get upgrade prompt text
```

## Files Created/Modified

### New Files
- `src/utils/capabilities.ts` (280 lines)
- `src/components/DashboardSwitcher.tsx` (114 lines)
- `src/components/DevPlanSwitcher.tsx` (356 lines)
- `src/components/LockedFeatureButton.tsx` (114 lines)
- `src/screens/HealthHub.tsx` (29 lines)
- `src/screens/CoachOverview.tsx` (354 lines)
- `src/screens/FamilyDashboardPage.tsx` (498 lines)

### Modified Files
- `src/context/AuthContext.tsx` - Updated User interface + capability computation
- `src/screens/DashboardPage.tsx` - Updated to use new capabilities
- `src/screens/CoachDashboardPage.tsx` - Added CoachOverview, fixed TypeScript
- `src/screens/Profile.tsx` - Added DevPlanSwitcher
- `src/types/navigation.ts` - Added FamilyDashboardPage route
- `src/navigation/AppNavigator.tsx` - Integrated HealthHub + routes

### Deleted Files
- `src/utils/userRoles.ts` - Replaced by capabilities.ts

## Development Workflow

1. **Change plan**: Profile tab → DEV button → Select plan → Apply
2. **Test dashboard switching**: Health tab → See switcher → Tap tabs
3. **Verify features**: Check for locked/unlocked states
4. **Test limits**: Family Basic (4 members) vs Family Premium (unlimited)
5. **Test add-ons**: Enable AI on Premium, verify unlock

## Production Checklist

Before deploying to production:
- [ ] Remove `DevPlanSwitcher` from Profile screen
- [ ] Delete `src/components/DevPlanSwitcher.tsx`
- [ ] Connect to real GHL subscription API
- [ ] Implement plan upgrade flows
- [ ] Set up Stripe/payment integration for add-ons
- [ ] Test Guardian Code backend generation
- [ ] Verify revenue tracking API
- [ ] Load test dashboard switching
- [ ] Security audit for family access controls

## Support

For issues or questions:
- Check COACH_DASHBOARD_ARCHITECTURE.md for detailed architecture
- Review PRICING_QUICK_REFERENCE.md for plan details
- See GHL_TAGS_AND_AUTOMATIONS.md for backend integration

---

**Happy Testing! 🚀**
