# Icon Styling Guide for WiHY

## Overview
This guide ensures all icons in the WiHY app follow a consistent pattern, size, and styling approach.

## Icon Sizes

Use these standardized sizes from `design-tokens.ts`:
```typescript
icons: {
  xs: 12,      // Small decorative icons, badges
  sm: 16,      // Input field icons, small buttons
  md: 20,      // Standard icons (profile, navigation)
  lg: 24,      // Header icons, important actions
  xl: 32,      // Large feature icons, dashboard cards
  xxl: 40,     // Profile pictures, main feature icons
}
```

## Icon Container Components

Instead of creating custom icon backgrounds, use the `IconContainer` component:

### Basic Usage
```tsx
import { IconContainer, MediumIconContainer } from '../components/IconContainer';

// Medium container (56x56) - most common
<MediumIconContainer 
  name="fitness" 
  size={24}
  color="#ffffff"
  backgroundColor="rgba(0,0,0,0.2)"
/>

// Small container (32x32)
<SmallIconContainer 
  name="checkmark"
  size={16}
  color="#10b981"
/>

// Large container (80x80)
<LargeIconContainer 
  name="heart"
  size={32}
  color="#ef4444"
/>
```

## Color Patterns

### Dashboard Cards
- Icon color: `#ffffff` (white)
- Background: `rgba(255, 255, 255, 0.2)` (semi-transparent white)
- Size: `xl` (32px) in `md` container (56x56)

### Status Indicators
- Success: `color: '#10b981'` (green)
- Warning: `color: '#f97316'` (orange)
- Error: `color: '#ef4444'` (red)
- Info: `color: '#3b82f6'` (blue)

### Stats & Metrics
- Primary: Use primary color (`#4285f4`)
- Muted: Use muted color (`#6b7280`)
- Size: `md` to `lg` (20-24px)

## Migration Path

When updating existing icon code:

### Before
```tsx
<View style={{ 
  width: 48, 
  height: 48, 
  borderRadius: 24,
  backgroundColor: '#f3f4f6',
  alignItems: 'center',
  justifyContent: 'center',
}}>
  <Ionicons name="fitness" size={20} color="#4285f4" />
</View>
```

### After
```tsx
<MediumIconContainer 
  name="fitness"
  size={20}
  color="#4285f4"
  backgroundColor="#f3f4f6"
  containerSize={48}
/>
```

## Consistency Checklist

- [ ] All circular icon backgrounds use `IconContainer` components
- [ ] Icon sizes match design-tokens `sizes.icons` scale
- [ ] Icon colors use defined colors from `design-tokens.ts`
- [ ] Container sizing is consistent (sm: 32, md: 56, lg: 80)
- [ ] No custom flexbox centering - let IconContainer handle it
- [ ] Accessibility: All icons have sufficient contrast
- [ ] Spacing: Icon containers have consistent padding/margins

## Common Patterns

### Dashboard Cards (like Health Dashboard)
```tsx
<TouchableOpacity style={styles.dashboardCard}>
  <MediumIconContainer 
    name="heart"
    size={32}
    color="#ffffff"
    backgroundColor="rgba(255,255,255,0.2)"
  />
  <Text style={styles.title}>Card Title</Text>
</TouchableOpacity>
```

### Status Lists (like Community Stats)
```tsx
<View style={styles.statItem}>
  <SmallIconContainer 
    name="people"
    size={20}
    color="#3b82f6"
  />
  <Text style={styles.value}>45k</Text>
  <Text style={styles.label}>Active</Text>
</View>
```

### Health Score Cards
```tsx
<View style={styles.scoreCard}>
  <LargeIconContainer 
    name="heart"
    size={40}
    color="#ef4444"
  />
  <Text style={styles.score}>95/100</Text>
</View>
```

## Files to Update

Key files that need icon standardization:
- `src/screens/DashboardPage.tsx` ✅ (cardIconContainer)
- `src/screens/MyProgressDashboard.tsx` ✅ (goal/stat icons)
- `src/screens/ConsumptionDashboard.tsx` (meal icons)
- `src/screens/FitnessDashboard.tsx` (workout icons)
- `src/screens/HealthOverview.tsx` (health metric icons)
- `src/components/shared/` (shared component icons)
- Bottom navigation tab icons
- Modal and dialog icons

## Testing

After updating icons:
1. Check alignment on phone (375px)
2. Check alignment on tablet (768px+)
3. Verify colors meet WCAG AA contrast requirements
4. Test with dynamic font sizes (accessibility)
5. Verify icons don't overlap with text
