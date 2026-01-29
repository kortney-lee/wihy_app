# Dark Mode Card Background Migration Guide

## Summary
We've systematically updated the application to support dark mode by changing hardcoded white backgrounds (`#ffffff`, `#fff`) to use dynamic `theme.colors.surface`.

## What Was Done

### Phase 1: StyleSheet Updates (Automated)
Ran script to comment out 233 hardcoded white backgrounds across 74 files:
- Changed `backgroundColor: '#ffffff',` → `// backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically`
- Changed `backgroundColor: '#fff',` → `// backgroundColor: '#fff', // Now using theme.colors.surface dynamically`

### Phase 2: JSX Dynamic Backgrounds (Manual - Partially Complete)
Added `{ backgroundColor: theme.colors.surface }` to JSX components in high-priority screens:

#### ✅ Completed Screens:
- **ConsumptionDashboard.tsx**: nutritionSummary, searchInputContainer
- **DashboardPage.tsx**: logoContainer, menuButton, researchDashboardWrapper
- **OverviewDashboard.tsx**: permissionModalContainer, permissionFeatureIconContainer
- **MyProgressDashboard.tsx**: healthScoreIndicator
- **CreateMeals.tsx**: Shopping list modal
- **NutritionFacts.tsx**: productImageContainer, progressFillWhite
- **ResearchScreen.tsx**: searchBar
- **MealDetailsScreen.tsx**: servingsCard, nutritionCard, tagsCard, timeCard, contentCard (both tabs)
- **FullChat.tsx**: resourceCard, textInputContainer
- **CoachDashboard.tsx**: searchContainer
- **SessionBooking.tsx**: summaryCard
- **ClientProgressScreen.tsx**: All 4 statCards
- **ShoppingListScreen.tsx**: All 3 statCards
- **SubscriptionManagementScreen.tsx**: currentPlanCard, activeAddonCard
- **NativeSubscriptionScreen.tsx**: benefitsSection
- **Profile.tsx**: All statCards and sectionContent (already complete)

## Remaining Work

### Files With Commented Out Backgrounds That May Need Dynamic Backgrounds
The following files had white backgrounds commented out but may still need JSX updates for all components:

**High Priority (User-Facing Screens):**
1. **GoalSelectionMeals.tsx** (1 replacement)
2. **BeautyFacts.tsx** (3 replacements)
3. **PetFoodFacts.tsx** (3 replacements)
4. **CoachDetailPage.tsx** (5 replacements)
5. **CoachOverview.tsx** (3 replacements)
6. **ClientOnboarding.tsx** (8 replacements)
7. **MealPreferencesScreen.tsx** (4 replacements)
8. **MealCalendar.tsx** (4 replacements)
9. **AcceptInvitation.tsx** (5 replacements)
10. **SendInvitation.tsx** (2 replacements)

**Medium Priority (Settings/Admin Screens):**
11. **CoachProfileSetup.tsx** (8 replacements)
12. **ClientManagement.tsx** (7 replacements)
13. **CoachSelection.tsx** (3 replacements)
14. **FamilyDashboardPage.tsx** (4 replacements)
15. **WebSubscriptionScreen.tsx** (5 replacements)
16. **PermissionsScreen.tsx** (4 replacements)
17. **AuthenticationScreen.tsx** (1 replacement)

**Lower Priority (Modals/Components):**
18. **ManualMealForm.tsx** (6 replacements)
19. **PlansModal.tsx** (5 replacements)
20. **ProductSearchModal.tsx** (3 replacements)
21. **MultiAuthLogin.tsx** (4 replacements)
22. **EmailCheckoutModal.tsx** (2 replacements)
23. And 30+ more component files...

## How to Complete Remaining Updates

For each file with commented out backgrounds:

### Step 1: Find the Style Usage
```bash
# Search for where the style is used
grep "styles.cardName" filename.tsx
```

### Step 2: Add Dynamic Background
Change from:
```tsx
<View style={styles.cardName}>
```

To:
```tsx
<View style={[styles.cardName, { backgroundColor: theme.colors.surface }]}>
```

### Step 3: Verify Theme Import
Ensure the file has:
```tsx
import { useTheme } from '../context/ThemeContext';

// Inside component:
const { theme } = useTheme();
```

## Pattern Examples

### Example 1: Simple Card
**Before:**
```tsx
// In StyleSheet:
card: {
  backgroundColor: '#ffffff', // ❌ Hardcoded
  padding: 16,
}

// In JSX:
<View style={styles.card}>
```

**After:**
```tsx
// In StyleSheet:
card: {
  // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
  padding: 16,
}

// In JSX:
<View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
```

### Example 2: Multiple Cards
```tsx
<View style={styles.statsContainer}>
  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
    <Text style={[styles.statValue, { color: theme.colors.text }]}>100</Text>
  </View>
  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
    <Text style={[styles.statValue, { color: theme.colors.text }]}>85</Text>
  </View>
</View>
```

### Example 3: Inline Styles (e.g., Modals)
**Before:**
```tsx
<View style={{ backgroundColor: '#fff', borderRadius: 12 }}>
```

**After:**
```tsx
<View style={{ backgroundColor: theme.colors.surface, borderRadius: 12 }}>
```

## Testing Checklist

After updating each screen:

1. ✅ Light mode: Cards should be white with dark text
2. ✅ Dark mode: Cards should be black with white text
3. ✅ Toggle between modes: Verify smooth transition
4. ✅ No white-on-white or black-on-black text
5. ✅ Shadows and borders still visible (may need conditional styling)

## Special Cases

### WihyHomeScreen
Uses `theme.colors.surface` (white/black) not `theme.colors.background` (light blue/black):
```tsx
<View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
```

### AI Chat Bubbles (FullChat)
Keep AI message bubbles white with dark text (not themed):
```tsx
// StyleSheet:
aiMessageText: {
  backgroundColor: '#ffffff', // Keep static for contrast
  color: '#1f2937',          // Keep static dark text
}

// No theme override in JSX for AI messages
```

### Transparent Backgrounds
Some components should remain transparent:
```tsx
container: {
  backgroundColor: 'transparent', // ✅ Keep as is
}
```

## Quick Script to Find Remaining Work

```powershell
# Find files with commented backgrounds but potentially missing JSX updates
Get-ChildItem -Path "mobile\src" -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "// backgroundColor: '#fff") {
        Write-Host $_.Name -ForegroundColor Yellow
        # Check if it has dynamic backgrounds
        $hasThemeBackground = $content -match "backgroundColor: theme\.colors\.surface"
        if (!$hasThemeBackground) {
            Write-Host "  ⚠️  May need JSX updates" -ForegroundColor Red
        }
    }
}
```

## Current Status

- ✅ **74 files** with StyleSheet backgrounds commented out
- ✅ **233 hardcoded backgrounds** removed from stylesheets
- ✅ **~20 high-priority screens** with dynamic backgrounds added to JSX
- ⚠️ **~54 files** may still need JSX updates for full dark mode support

## Next Steps

1. Test all updated screens in dark mode
2. Systematically update remaining high-priority screens
3. Update medium-priority screens
4. Update component/modal files
5. Final QA pass on all screens in both light and dark modes
