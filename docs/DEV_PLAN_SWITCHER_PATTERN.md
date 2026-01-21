# Dev Plan Switcher Pattern Analysis

## Overview
The Dev Plan Switcher is a development tool that allows testing different subscription plans and add-ons without backend changes. It works identically on web and native mobile platforms.

---

## Key Components

### 1. **DevPlanSwitcher Component** (`mobile/src/components/DevPlanSwitcher.tsx`)

**Purpose:** Floating development tool for switching plans and add-ons during testing

**Key Features:**
- ✅ **Platform-agnostic** - Works on iOS, Android, and Web
- ✅ **Floating button** - Bottom-right overlay (doesn't block UI)
- ✅ **Modal interface** - Full-screen plan selector
- ✅ **Add-on toggles** - AI and Instacart switches
- ✅ **Category tabs** - Consumer vs B2B plans
- ✅ **Real-time updates** - Changes apply immediately

---

## Access Control

```typescript
// From DevPlanSwitcher.tsx line 154
const canUseDevTools = __DEV__ || user?.isDeveloper || user?.role === 'admin' || user?.userRole === 'admin';

if (!user || !canUseDevTools) return null;
```

**Who Can See It:**
1. ✅ Development builds (`__DEV__ = true`)
2. ✅ Users with `isDeveloper: true` flag
3. ✅ Users with `role: 'admin'`

**Who Cannot See It:**
- ❌ Production builds
- ❌ Regular users (free, premium, family, coach)
- ❌ Employee role (has features but `isDeveloper: false`)

---

## Integration Pattern

### Where It's Used

**Profile Screen** (`mobile/src/screens/Profile.tsx`):
```typescript
// Line 26: Import
import { DevPlanSwitcher } from '../components/DevPlanSwitcher';

// Line 671-672: Render at bottom of component
{/* Dev Plan Switcher - Remove in Production */}
<DevPlanSwitcher />
```

**Key Points:**
- Rendered **once** at root level of screen
- No props needed (reads from AuthContext)
- Self-contained (manages own modal state)
- Floating button positioned absolutely (doesn't affect layout)

---

## How It Works

### 1. **Current Plan Display**
```typescript
// Shows user's current plan from AuthContext
<Text style={styles.currentPlanName}>{getPlanDisplayName(user.plan)}</Text>
```

### 2. **Plan Selection**
```typescript
const [selectedPlan, setSelectedPlan] = useState<PlanType>(user?.plan || 'free');
```

Plans are categorized:
- **Consumer Plans:** free, premium, family-basic, family-pro, coach, coach-family
- **B2B Plans:** workplace-core, workplace-plus, corporate-enterprise, k12-school, university, hospital, hospitality

### 3. **Add-On Management**
```typescript
const [aiAddOn, setAiAddOn] = useState(user?.addOns?.includes('ai') || false);
const [instacartAddOn, setInstacartAddOn] = useState(user?.addOns?.includes('instacart') || false);

// Add-ons only available for specific plans
const canAddAI = ['premium', 'family-basic', 'coach'].includes(selectedPlan);
const canAddInstacart = selectedPlan === 'family-basic';
```

### 4. **Apply Changes**
```typescript
const handleApply = async () => {
  const addOns: string[] = [];
  if (aiAddOn) addOns.push('ai');
  if (instacartAddOn) addOns.push('instacart');

  // Update plan and wait for state to propagate
  await updateUser({
    plan: selectedPlan,
    addOns,
  });

  setVisible(false);
  
  // Log for debugging
  console.log('[DevPlanSwitcher] Plan changed to:', selectedPlan, 'Add-ons:', addOns);
};
```

---

## State Management Flow

### AuthContext Integration

**1. updateUser() Function** (`mobile/src/context/AuthContext.tsx` line 331):
```typescript
const updateUser = async (userData: Partial<User>): Promise<User> => {
  if (!user) {
    throw new Error('No user to update');
  }

  // Handle plan/add-on updates - recompute capabilities
  let updatedCapabilities = user.capabilities;
  if (userData.plan || userData.addOns) {
    const newPlan = userData.plan || user.plan;
    const newAddOns = userData.addOns || user.addOns || [];
    updatedCapabilities = getPlanCapabilities(newPlan, newAddOns);
  }

  const updatedUser: User = normalizeUser({
    ...user,
    ...userData,
    capabilities: updatedCapabilities,
    preferences: {
      ...user.preferences,
      ...userData.preferences,
    },
  });

  setUser(updatedUser);
  await saveUserData(updatedUser);
  return updatedUser;
};
```

**Key Points:**
- Updates local state immediately (no backend call)
- Recomputes capabilities based on new plan + add-ons
- Saves to AsyncStorage for persistence
- Returns updated user object

---

## Capability Computation

### Plan → Capabilities Mapping (`mobile/src/utils/capabilities.ts`)

```typescript
import { getPlanCapabilities, Capabilities } from '../utils/capabilities';

// When plan changes:
const updatedCapabilities = getPlanCapabilities(newPlan, newAddOns);
```

**Example Capabilities:**
```typescript
{
  meals: true,                // Meal planning/tracking
  workouts: true,             // Workout planning/tracking
  family: true,               // Family dashboard (maxFamilyMembers)
  coachPlatform: true,        // Coach dashboard
  wihyAI: true,               // AI Coach add-on
  instacartIntegration: true, // Instacart integration
  adminDashboard: true,       // Admin tools (admin plan only)
  maxFamilyMembers: 5,        // Family plan limits
}
```

---

## UI Reactivity

### How UI Updates Instantly

**HealthHub Dashboard** (`mobile/src/screens/HealthHub.tsx`):
```typescript
// Line 29-32: Reset context when plan changes
useEffect(() => {
  setCurrentContext('personal');
  setShowMenu(false);
}, [user?.plan]);
```

**Dashboard Access Checks**:
```typescript
// Line 55-56: Check capabilities in real-time
const canAccessFamily = hasFamilyAccess(user);
const canAccessCoach = hasCoachAccess(user);
```

**Helper Functions** (`mobile/src/utils/capabilities.ts`):
```typescript
export const hasFamilyAccess = (user: User | null): boolean => {
  return Boolean(user?.capabilities?.family);
};

export const hasCoachAccess = (user: User | null): boolean => {
  return Boolean(user?.capabilities?.coachPlatform);
};

export const hasAdminAccess = (user: User | null): boolean => {
  return Boolean(user?.capabilities?.adminDashboard);
};
```

---

## Adding DevPlanSwitcher to Other Screens

### Pattern to Follow

**1. Import the Component:**
```typescript
import { DevPlanSwitcher } from '../components/DevPlanSwitcher';
```

**2. Render at Root Level:**
```typescript
export default function MyScreen() {
  // ... screen logic
  
  return (
    <View style={styles.container}>
      {/* Main screen content */}
      <ScrollView>
        {/* Your components */}
      </ScrollView>
      
      {/* Dev Plan Switcher - floats above content */}
      <DevPlanSwitcher />
    </View>
  );
}
```

**Key Requirements:**
- ✅ Parent `View` must have `position: relative` (or default)
- ✅ DevPlanSwitcher uses `position: absolute` to float
- ✅ No props needed - reads from AuthContext
- ✅ Automatically hides if user lacks dev access

---

## Styling & Positioning

### Floating Button Styles
```typescript
floatingButton: {
  position: 'absolute',
  bottom: 120,        // Above tab bar
  right: 20,
  backgroundColor: '#f59e0b', // Orange
  width: 60,
  height: 60,
  borderRadius: 30,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,      // Android shadow
  zIndex: 1000,      // Above all content
}
```

**Design Considerations:**
- Bottom-right position (consistent iOS/Android/Web)
- 60dp button (easy touch target)
- Orange color (#f59e0b) - stands out, indicates dev tool
- High z-index - always visible
- Shadow/elevation - appears floating

---

## Platform Differences

### Cross-Platform Compatibility

**Web:**
- Uses React Native Web components
- Modal works identically
- Floating button positioned with CSS

**iOS:**
- Native Modal component
- Safe area insets respected
- Haptic feedback on button press

**Android:**
- Native Modal component
- Back button closes modal
- Material elevation shadows

**All Platforms:**
- Same component code
- Same AuthContext integration
- Same capability logic

---

## Permissions Integration

### How It Respects Real Backend Permissions

**When Backend Returns Role:**
```json
{
  "user": {
    "role": "ADMIN",
    "plan": "free"
  }
}
```

**AuthContext Processes:**
```typescript
// Line 188: Normalize role
const normalizedRole = roleFromServer.toLowerCase().replace('_', '-'); // "admin"

// Line 192: Override plan based on role
const getPlanFromRole = (role: User['role'] | undefined, backendPlan: string): User['plan'] => {
  switch (role) {
    case 'admin':       return 'admin';        // Full access
    case 'employee':    return 'coach-family'; // Coach + Family, NO dev
    case 'coach':       return 'coach';
    // ... other roles
    default:            return backendPlan as User['plan'];
  }
};

const plan = getPlanFromRole(normalizedRole, authUser.plan);

// Line 200-206: Compute capabilities
const capabilities = getPlanCapabilities(plan, addOns);

// Line 211: Set developer flag (admin only, NOT employee)
const isDeveloperFlag = Boolean(
  authUser.profile_data?.is_developer ||
  normalizedRole === 'admin'
);
```

**Result:**
- `user.role = 'admin'`
- `user.plan = 'admin'` (overrides backend "free")
- `user.capabilities = { meals: true, workouts: true, family: true, coachPlatform: true, adminDashboard: true, ... }`
- `user.isDeveloper = true` (shows DevPlanSwitcher)

---

## Testing Workflow

### How Developers Use This Tool

**1. Open Any Screen with DevPlanSwitcher:**
- Profile screen (already integrated)
- Health Hub (to be added)
- Any screen that checks capabilities

**2. Tap Floating DEV Button:**
- Modal opens with plan selector

**3. Select Plan to Test:**
- Example: Switch from "free" → "family-pro"

**4. Toggle Add-ons:**
- Enable AI Coach
- Enable Instacart (if available)

**5. Tap "Apply Changes":**
- Modal closes
- User context updates instantly
- All components re-render with new capabilities

**6. Verify UI Changes:**
- Check which dashboards are visible
- Verify feature access (meals, workouts, family, coach)
- Test paywall behavior
- Confirm add-on features work

**7. Switch to Different Plan:**
- Repeat process to test other tiers

---

## Best Practices

### ✅ DO
- Add DevPlanSwitcher to screens where you test capabilities
- Use in development builds only
- Check `user?.capabilities` for feature access
- Test all plan tiers before production
- Use console.log to verify capability changes

### ❌ DON'T
- Ship DevPlanSwitcher in production builds (check `__DEV__`)
- Use DevPlanSwitcher for real user plan changes (that's backend's job)
- Assume capabilities without checking (plans change)
- Hard-code plan checks (use capability helpers)

---

## Implementation Checklist

To add DevPlanSwitcher to a new screen:

- [ ] Import component: `import { DevPlanSwitcher } from '../components/DevPlanSwitcher';`
- [ ] Add to render tree (at root level)
- [ ] Verify parent View allows absolute positioning
- [ ] Test floating button appears (bottom-right)
- [ ] Verify modal opens on tap
- [ ] Test plan switching updates UI
- [ ] Check capabilities react to changes
- [ ] Confirm it only shows for dev users

---

## Example: Adding to HealthHub

### Current State
HealthHub does NOT have DevPlanSwitcher yet.

### How to Add

**1. Import Component:**
```typescript
// mobile/src/screens/HealthHub.tsx
import { DevPlanSwitcher } from '../components/DevPlanSwitcher';
```

**2. Add to Render:**
```typescript
export default function HealthHub() {
  // ... existing code ...
  
  return (
    <WebPageWrapper activeTab="health">
      <View style={[styles.container, isWeb && { flex: undefined, minHeight: undefined }]}>
        {renderDashboard()}
        
        {/* Dev Plan Switcher - Remove in Production */}
        <DevPlanSwitcher />
      </View>
    </WebPageWrapper>
  );
}
```

**3. Test:**
- Open Health tab
- Should see orange "DEV" button (bottom-right)
- Tap to open plan switcher
- Switch from "free" → "family-pro"
- Verify Family dashboard tile appears
- Switch to "coach" → verify Coach dashboard appears

---

## Troubleshooting

### DevPlanSwitcher Not Showing
**Check:**
1. Is `__DEV__` true? (Run `console.log(__DEV__)`)
2. Does user have `isDeveloper: true` or `role: 'admin'`?
3. Is user logged in? (DevPlanSwitcher requires `user` object)
4. Is component imported correctly?
5. Is component rendered in view tree?

### Plan Changes Not Updating UI
**Check:**
1. Are components using `user?.capabilities` from AuthContext?
2. Is component subscribed to AuthContext? (`const { user } = useContext(AuthContext)`)
3. Are capability helpers used correctly? (`hasFamilyAccess(user)`)
4. Check console for capability updates: `console.log(user?.capabilities)`

### Add-ons Not Available
**Check:**
1. Plan compatibility: AI = premium/family-basic/coach, Instacart = family-basic only
2. Some plans include add-ons: family-pro, coach-family (can't toggle)
3. B2B plans include AI by default

---

## Related Files

| File | Purpose |
|------|---------|
| [DevPlanSwitcher.tsx](../mobile/src/components/DevPlanSwitcher.tsx) | Main component |
| [AuthContext.tsx](../mobile/src/context/AuthContext.tsx) | User state management |
| [capabilities.ts](../mobile/src/utils/capabilities.ts) | Plan → capabilities mapping |
| [Profile.tsx](../mobile/src/screens/Profile.tsx) | Example integration |
| [HealthHub.tsx](../mobile/src/screens/HealthHub.tsx) | Example reactive UI |

---

## Summary

**What DevPlanSwitcher Does:**
- Allows testing different subscription plans without backend changes
- Updates user context in real-time
- Recomputes capabilities based on plan + add-ons
- Works identically on web and native mobile
- Only visible to developers and admins

**How to Use:**
1. Import component
2. Add to screen render tree (root level)
3. Tap floating "DEV" button
4. Select plan and add-ons
5. Apply changes
6. Verify UI updates

**Key Pattern:**
```typescript
// 1. Import
import { DevPlanSwitcher } from '../components/DevPlanSwitcher';

// 2. Render
<DevPlanSwitcher />

// 3. Check capabilities
const canAccessFamily = hasFamilyAccess(user);
```

This pattern enables rapid testing of all subscription tiers without modifying backend data or creating test accounts for each plan level.
