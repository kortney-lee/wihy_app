# Dark Mode - What NOT to Change

## Summary
Headers, navigation bars, and fixed UI elements should NOT use theme colors. They should maintain their original brand colors (gradients, specific colors) regardless of dark/light mode.

## Elements to EXCLUDE from Theme Changes

### ❌ DO NOT Change These Elements:

1. **Gradient Headers** (LinearGradient components)
   - Already use gradient colors
   - Should stay as brand colors (blue, purple, orange, etc.)
   - Examples: ConsumptionDashboard header, FitnessDashboard header, CreateMeals header

2. **Fixed Navigation Headers** (Top bars)
   - The "Facts" tab bar area in FullChat
   - WihyHomeScreen top navigation
   - Any fixed position headers
   - Tab selectors below headers

3. **Modal/Popup Headers**
   - Modal title bars
   - Popup headers
   - Sheet headers

4. **Bottom Navigation/Tab Bar**
   - AppNavigator tab bar
   - Should stay white or original color

5. **Collapsible Headers** (Animated headers with titles)
   - DashboardPage collapsible header
   - SessionBooking collapsible header
   - ProfileSetupScreen header
   - These have gradient backgrounds and white text - keep as is

### ✅ ONLY Change These Elements:

1. **Content Cards** (Below headers)
   - Stat cards
   - Info cards  
   - List item cards
   - Section containers

2. **Page Body Sections**
   - Content areas below headers
   - List backgrounds
   - Form containers (not form headers)

3. **Modal/Popup Content** (Not headers)
   - Modal body content
   - Bottom sheet content areas

## Pattern to Follow

```tsx
// ❌ DO NOT change header backgrounds:
<LinearGradient colors={['#3b82f6', '#1e3a8a']} style={styles.header}>
  <Text style={styles.headerTitle}>Title</Text> {/* Keep white text */}
</LinearGradient>

// ❌ DO NOT change fixed navigation:
<View style={styles.tabBar}>  {/* Keep white background */}
  <Text>Facts</Text>
</View>

// ✅ DO change content cards:
<View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Content</Text>
</View>
```

## Specific Files with Headers (DO NOT Theme):

### Gradient Headers:
- `FullChat.tsx` - Green gradient header with "Chat History" button
- `NutritionFacts.tsx` - Blue gradient header
- `CreateMeals.tsx` - Red gradient header
- `FitnessDashboard.tsx` - Orange gradient header
- `ConsumptionDashboard.tsx` - Gradient header

### Tab/Navigation Headers:
- `FullChat.tsx` - "Facts" tab selector (white background, black text)
- `AppNavigator.tsx` - Bottom tab bar
- `WihyHomeScreen.tsx` - Top web navigation

### Collapsible Headers:
- `DashboardPage.tsx` - collapsibleHeader style
- `SessionBooking.tsx` - collapsibleHeader style
- `ProfileSetupScreen.tsx` - collapsibleHeader style
- `BookingsManagement.tsx` - collapsibleHeader style

## Verification

To check if a style should use theme colors:

1. Is it a header with gradient? → NO theme colors
2. Is it a fixed navigation bar? → NO theme colors
3. Is it a modal header/title bar? → NO theme colors
4. Is it content below a header? → YES, use theme.colors.surface
5. Is it a card/section in page body? → YES, use theme.colors.surface

## Summary

- **Headers stay branded** (gradients, fixed colors)
- **Content becomes themed** (cards, sections, backgrounds)
- In dark mode, headers remain visible and branded while content adapts
