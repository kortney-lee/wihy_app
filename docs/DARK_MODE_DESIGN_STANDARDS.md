# Dark Mode Design Standards

## 🌙 Overview

This document defines the dark mode design standards for the Wihy Health App. All screens must follow these patterns to ensure visual consistency, accessibility, and proper theme integration.

---

## 🎨 Color Standards

### Text Colors

**CRITICAL: All text in dark mode MUST use theme colors**

```tsx
import { useTheme } from '@react-navigation/native';

const theme = useTheme();

// Primary text (nearly white)
color: theme.colors.text  // #f9fafb in dark mode

// Secondary text (light gray) 
color: theme.colors.textSecondary  // #9ca3af in dark mode
```

**❌ NEVER USE:**
- Hardcoded gray colors: `#4b5563`, `#6b7280`, `#374151`
- Black or dark colors: `#000000`, `#1f2937`
- `colors.textPrimary` (only exists in light mode)

**✅ ALWAYS USE:**
- `theme.colors.text` for primary content
- `theme.colors.textSecondary` for secondary/placeholder text

### Examples

```tsx
// Headers and titles
<Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>
  My Title
</Text>

// Body text
<Text style={{ color: theme.colors.text, fontSize: 16 }}>
  Primary content
</Text>

// Secondary text (labels, timestamps, placeholders)
<Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
  Last updated: 2 hours ago
</Text>

// Input placeholders
<TextInput
  placeholder="Search..."
  placeholderTextColor={theme.colors.textSecondary}
  style={{ color: theme.colors.text }}
/>
```

---

## 📦 Border Standards

### Border Width

**CRITICAL: All UI element borders MUST be 2px in dark mode**

Dark mode requires thicker borders for visibility. All borders that were 1px must be increased to 2px.

```tsx
// ❌ WRONG - too thin for dark mode
borderWidth: 1

// ✅ CORRECT - visible in dark mode
borderWidth: 2
```

### UI Elements Requiring 2px Borders

**Input Fields:**
```tsx
<TextInput
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
  }}
/>
```

**Buttons:**
```tsx
// Secondary/outline buttons
<Pressable
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  }}
>
  <Text style={{ color: theme.colors.text }}>Action</Text>
</Pressable>
```

**Chips/Pills:**
```tsx
// Filter chips, category pills, tags
<View
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  }}
>
  <Text style={{ color: theme.colors.text }}>Chip Label</Text>
</View>
```

**Cards:**
```tsx
<View
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: theme.colors.card,
  }}
>
  {/* Card content */}
</View>
```

**Badges:**
```tsx
<View
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  }}
>
  <Text style={{ color: theme.colors.text, fontSize: 12 }}>Badge</Text>
</View>
```

**Search Result Cards:**
```tsx
<Pressable
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.card,
  }}
>
  {/* Result content */}
</Pressable>
```

### Border Colors

Always use theme-aware border colors:

```tsx
// Dynamic border color (adapts to theme)
borderColor: theme.colors.border
```

---

## 🎯 Component Patterns

### The White Card Problem (CRITICAL!)

**Issue:** Dashboard screens often use `dashboardTheme.colors.surface` which is hardcoded to `#ffffff`. This causes white cards to appear on black backgrounds in dark mode.

**Visual Comparison:**
- ❌ **Wrong (Image 2):** White cards on black background - hard to see, looks broken
- ✅ **Correct (Image 1):** Dark gray cards with white borders - clear contrast, professional

**Root Cause:**
```tsx
// dashboardTheme.ts
export const dashboardTheme = {
  colors: {
    surface: '#ffffff',  // ❌ HARDCODED - does not adapt to dark mode!
    // ...
  }
};
```

**The Fix:**

```tsx
// BEFORE (WRONG - white cards in dark mode)
const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: dashboardTheme.colors.surface,  // ❌ Always white!
    borderRadius: 12,
    padding: 16,
  },
});

// Render
<View style={styles.summaryCard}>
  <Text style={{ color: dashboardTheme.colors.text }}>Content</Text>
</View>


// AFTER (CORRECT - adapts to dark mode)
const styles = StyleSheet.create({
  summaryCard: {
    // Remove backgroundColor from style
    borderRadius: 12,
    borderWidth: 2,  // ✅ Add border for visibility
    padding: 16,
  },
});

// Render with theme colors inline
<View style={[
  styles.summaryCard, 
  { 
    backgroundColor: theme.colors.card,      // ✅ #111827 in dark mode
    borderColor: theme.colors.border         // ✅ #374151 in dark mode
  }
]}>
  <Text style={{ color: theme.colors.text }}>Content</Text>  {/* ✅ #f9fafb in dark mode */}
</View>
```

**Step-by-Step:**
1. Find all instances of `backgroundColor: dashboardTheme.colors.surface`
2. Remove the backgroundColor from the StyleSheet
3. Add `borderWidth: 2` to the StyleSheet
4. Apply `backgroundColor: theme.colors.card` inline in the render
5. Apply `borderColor: theme.colors.border` inline in the render
6. Update all text to use `theme.colors.text` or `theme.colors.textSecondary`

**Affected Components:**
- Summary cards
- Action cards
- Insight cards
- Scan history cards
- Quick action grids
- Metric displays
- Tab containers

### Collapsing Headers

Headers with collapse animations must maintain proper text visibility:

```tsx
// Header text - always white on gradient backgrounds
<Text style={{ 
  color: '#ffffff',  // Headers use white text on colored gradients
  fontSize: 24, 
  fontWeight: '700' 
}}>
  Screen Title
</Text>

// Subtitle text
<Text style={{ 
  color: 'rgba(255, 255, 255, 0.9)',  // Slightly transparent white
  fontSize: 16 
}}>
  Subtitle
</Text>
```

### Safe Area Handling

Status bar areas must match header gradient color:

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

// Status bar area before header
<View 
  style={{ 
    height: insets.top, 
    backgroundColor: '#3b82f6'  // Match your header gradient color
  }} 
/>

// Main content with safe area
<SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
  {/* Content */}
</SafeAreaView>
```

---

## 📋 Implementation Checklist

When implementing dark mode on any screen:

### Text Colors
- [ ] Replace all hardcoded text colors with `theme.colors.text`
- [ ] Replace all secondary text colors with `theme.colors.textSecondary`
- [ ] Update placeholder text to use `theme.colors.textSecondary`
- [ ] Verify header text uses white (`#ffffff`) on gradient backgrounds
- [ ] Remove any references to `colors.textPrimary` or `colors.textSecondary` (light-only)

### Borders
- [ ] Change all `borderWidth: 1` to `borderWidth: 2`
- [ ] Update borderColor to use `theme.colors.border`
- [ ] Check input fields have 2px borders
- [ ] Check buttons have 2px borders
- [ ] Check chips/pills have 2px borders
- [ ] Check cards have 2px borders
- [ ] Check badges have 2px borders
- [ ] Check search results have 2px borders

### Backgrounds
- [ ] Verify card backgrounds use `theme.colors.card`
- [ ] Verify page backgrounds use `theme.colors.background`
- [ ] Check gradient headers maintain proper colors

### Safe Areas
- [ ] Status bar area matches header gradient color
- [ ] SafeAreaView configured with correct edges
- [ ] No content hiding under notch/status bar

---

## 🔍 Common Issues & Fixes

### Issue: Text Not Visible in Dark Mode

**Problem:** Text appears black or dark gray on dark background

**Solution:**
```tsx
// ❌ WRONG
<Text style={{ color: '#1f2937' }}>Text</Text>
<Text style={{ color: '#6b7280' }}>Text</Text>
<Text style={{ color: colors.textPrimary }}>Text</Text>

// ✅ CORRECT
<Text style={{ color: theme.colors.text }}>Text</Text>
<Text style={{ color: theme.colors.textSecondary }}>Secondary Text</Text>
```

### Issue: Borders Too Thin/Invisible

**Problem:** 1px borders not visible in dark mode

**Solution:**
```tsx
// ❌ WRONG
borderWidth: 1

// ✅ CORRECT
borderWidth: 2
```

### Issue: Header Text Not Visible

**Problem:** Header text using theme colors on colored gradient

**Solution:**
```tsx
// Headers with gradient backgrounds should use white
// ✅ CORRECT
<Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }}>
  Header Title
</Text>
```

### Issue: Inconsistent Placeholder Colors

**Problem:** Input placeholders dark or invisible

**Solution:**
```tsx
// ✅ CORRECT
<TextInput
  placeholder="Enter text..."
  placeholderTextColor={theme.colors.textSecondary}
  style={{ color: theme.colors.text }}
/>
```

---

## 🤖 Copilot Instructions

When working with dark mode, always:

1. **Import useTheme at the top:**
   ```tsx
   import { useTheme } from '@react-navigation/native';
   ```

2. **Get theme in component:**
   ```tsx
   const theme = useTheme();
   ```

3. **Apply theme colors to all text:**
   - Primary text: `theme.colors.text`
   - Secondary text: `theme.colors.textSecondary`
   - Header text (on gradients): `#ffffff`

4. **Use 2px borders everywhere:**
   - All input fields: `borderWidth: 2`
   - All buttons: `borderWidth: 2`
   - All chips/pills: `borderWidth: 2`
   - All cards: `borderWidth: 2`
   - All badges: `borderWidth: 2`

5. **Test in both modes:**
   - Verify text is readable in dark mode
   - Verify borders are visible in dark mode
   - Check safe area handling
   - Confirm no hardcoded colors remain

---

## 📊 Affected Screens

The following screens have been updated to follow these standards:

### ✅ Fully Compliant
- [ResearchScreen.tsx](../mobile/src/screens/ResearchScreen.tsx)
- [CreateMeals.tsx](../mobile/src/screens/CreateMeals.tsx)
- [ManualMealForm.tsx](../mobile/src/components/ManualMealForm.tsx)
- [CoachProfileSetup.tsx](../mobile/src/screens/CoachProfileSetup.tsx)
- [CoachOverview.tsx](../mobile/src/screens/CoachOverview.tsx)
- [CoachDetailPage.tsx](../mobile/src/screens/CoachDetailPage.tsx)
- [CoachSelection.tsx](../mobile/src/screens/CoachSelection.tsx)
- [OverviewDashboard.tsx](../mobile/src/screens/OverviewDashboard.tsx) - **Health Overview screen**

### ⚠️ Needs Update (White Cards in Dark Mode)
These screens use `dashboardTheme.colors.surface` (hardcoded white) instead of `theme.colors.card`:
- [MyProgressDashboard.tsx](../mobile/src/screens/MyProgressDashboard.tsx)
- [DashboardPage.tsx](../mobile/src/screens/DashboardPage.tsx)
- [ConsumptionDashboard.tsx](../mobile/src/screens/ConsumptionDashboard.tsx)
- [FitnessDashboard.tsx](../mobile/src/screens/FitnessDashboard.tsx) (if exists)
- [NotificationTile.tsx](../mobile/src/components/shared/NotificationTile.tsx)

### Pattern Applied (Compliant Screens)
1. **Text Colors:** All text uses `theme.colors.text` or `theme.colors.textSecondary`
2. **Border Width:** All UI elements use `borderWidth: 2`
3. **Card Backgrounds:** All cards use `theme.colors.card` (not `dashboardTheme.colors.surface`)
4. **Collapsing Headers:** 180px height with proper safe area handling
5. **Safe Areas:** Status bar colored areas before headers

### Required Changes for Non-Compliant Screens
1. Replace `backgroundColor: dashboardTheme.colors.surface` with inline `backgroundColor: theme.colors.card`
2. Add `borderWidth: 2` to all card styles
3. Add `borderColor: theme.colors.border` to all cards
4. Replace hardcoded text colors with `theme.colors.text` or `theme.colors.textSecondary`
5. Update all inline renders to pass theme colors

---

## 🎨 Theme Color Reference

### Dark Mode Colors

```tsx
theme.colors = {
  // Text
  text: '#f9fafb',              // Nearly white - primary text
  textSecondary: '#9ca3af',     // Light gray - secondary text
  
  // Backgrounds
  background: '#1a1a1a',        // Main background
  card: '#2d2d2d',              // Card background
  
  // Borders
  border: '#404040',            // Border color
  
  // UI Elements
  primary: '#fa5f06',           // WiHY Orange
  notification: '#ef4444',      // Red
}
```

### Header Gradients

Headers use colored gradients with white text:

```tsx
// Example: Blue gradient header
<LinearGradient
  colors={['#3b82f6', '#2563eb']}
  style={styles.header}
>
  <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }}>
    Screen Title
  </Text>
</LinearGradient>
```

---

## 📝 Summary

**Three Core Rules for Dark Mode:**

1. **All text uses theme colors**
   - `theme.colors.text` for primary content
   - `theme.colors.textSecondary` for secondary content
   - `#ffffff` for text on colored gradient headers

2. **All borders are 2px**
   - Inputs, buttons, chips, cards, badges
   - Provides necessary visibility in dark mode

3. **Safe areas properly configured**
   - Status bar area matches header color
   - Content doesn't hide under notch

Follow these standards on every screen for consistent dark mode experience.
