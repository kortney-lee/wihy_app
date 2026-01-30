# Dark Mode Quick Reference

> **⚡ Fast reference for dark mode implementation. See [DARK_MODE_DESIGN_STANDARDS.md](DARK_MODE_DESIGN_STANDARDS.md) for complete documentation.**

---

## 🚨 Critical: The White Card Problem

**Dashboard screens show WHITE cards on black background in dark mode!**

### The Issue
`dashboardTheme.colors.surface` is hardcoded to `#ffffff` - it does NOT adapt to dark mode.

### The Fix
```tsx
// ❌ WRONG - white cards in dark mode
backgroundColor: dashboardTheme.colors.surface

// ✅ CORRECT - dark cards in dark mode
backgroundColor: theme.colors.card  // Applied inline, not in StyleSheet
borderColor: theme.colors.border
borderWidth: 2
```

### Quick Steps
1. Remove `backgroundColor: dashboardTheme.colors.surface` from StyleSheet
2. Add `borderWidth: 2` to StyleSheet
3. Apply inline: `{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }`

---

## 🎯 Three Core Rules

### 1. All Text Uses Theme Colors

```tsx
import { useTheme } from '@react-navigation/native';
const theme = useTheme();

// Primary text
color: theme.colors.text  // #f9fafb

// Secondary text (labels, placeholders)
color: theme.colors.textSecondary  // #9ca3af

// Headers on gradients
color: '#ffffff'
```

### 2. All Borders Are 2px

```tsx
// ❌ WRONG
borderWidth: 1

// ✅ CORRECT
borderWidth: 2
```

### 3. Safe Areas Properly Configured

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();

// Status bar area
<View style={{ height: insets.top, backgroundColor: '#3b82f6' }} />
```

---

## ⚡ Quick Fixes

### Fix Text Colors

**Replace:**
```tsx
// ❌ Remove these
color: '#1f2937'
color: '#6b7280'
color: '#374151'
color: colors.textPrimary
color: colors.textSecondary
```

**With:**
```tsx
// ✅ Use these
color: theme.colors.text
color: theme.colors.textSecondary
```

### Fix Borders

**Search for:** `borderWidth: 1`  
**Replace with:** `borderWidth: 2`

**Apply to:**
- Input fields
- Buttons (secondary/outline)
- Chips/pills
- Cards
- Badges

### Fix Placeholders

```tsx
<TextInput
  placeholderTextColor={theme.colors.textSecondary}
  style={{ color: theme.colors.text }}
/>
```

---

## 📋 Component Patterns

### Dashboard Card (MOST IMPORTANT!)
```tsx
// In StyleSheet - NO backgroundColor!
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 2,  // Required for dark mode
    padding: 16,
  },
});

// In render - apply theme colors inline
<View style={[
  styles.card, 
  { 
    backgroundColor: theme.colors.card,      // Dark gray in dark mode
    borderColor: theme.colors.border         // Visible border
  }
]}>
  <Text style={{ color: theme.colors.text }}>Title</Text>
  <Text style={{ color: theme.colors.textSecondary }}>Description</Text>
</View>
```

### Input
```tsx
<TextInput
  style={{
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
  }}
  placeholderTextColor={theme.colors.textSecondary}
/>
```

### Button (Secondary)
```tsx
<Pressable
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  }}
>
  <Text style={{ color: theme.colors.text }}>Action</Text>
</Pressable>
```

### Chip/Pill
```tsx
<View
  style={{
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  }}
>
  <Text style={{ color: theme.colors.text }}>Label</Text>
</View>
```

### Card
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
  <Text style={{ color: theme.colors.text }}>Title</Text>
  <Text style={{ color: theme.colors.textSecondary }}>Description</Text>
</View>
```

---

## ✅ Checklist

Before completing dark mode work:

- [ ] Import `useTheme` from `@react-navigation/native`
- [ ] **NO `dashboardTheme.colors.surface` in card backgrounds**
- [ ] **Cards use `theme.colors.card` inline**
- [ ] All text uses `theme.colors.text` or `theme.colors.textSecondary`
- [ ] All borders changed from 1px to 2px
- [ ] All placeholders use `theme.colors.textSecondary`
- [ ] Safe areas configured correctly
- [ ] **Tested in dark mode - cards are DARK with WHITE borders**

---

## 📚 Full Documentation

- [DARK_MODE_DESIGN_STANDARDS.md](DARK_MODE_DESIGN_STANDARDS.md) - Complete guide
- [DESIGN_PATTERNS.md](../docs_archive/DESIGN_PATTERNS.md) - General design system

## 🎨 Color Values

```tsx
// Dark mode
theme.colors.text = '#f9fafb'              // Nearly white
theme.colors.textSecondary = '#9ca3af'     // Light gray
theme.colors.background = '#1a1a1a'        // Dark background
theme.colors.card = '#2d2d2d'              // Card background
theme.colors.border = '#404040'            // Border color
```

## ⚠️ Common Mistakes

❌ Using `dashboardTheme.colors.surface` (hardcoded white - breaks dark mode!)  
❌ Using `colors.textPrimary` (light mode only)  
❌ Using `colors.textSecondary` (light mode only)  
❌ Hardcoding gray values  
❌ Using 1px borders  
❌ Forgetting placeholder colors  

✅ Always use `theme.colors.card` for card backgrounds (inline)  
✅ Always use `theme.colors.text`  
✅ Always use `theme.colors.textSecondary`  
✅ Always use 2px borders  
✅ Always set `placeholderTextColor`  

---

## 🔍 Search & Replace Patterns

### Priority 1: Fix White Cards
**Search:** `backgroundColor: dashboardTheme.colors.surface`  
**Action:** 
1. Remove from StyleSheet
2. Add `borderWidth: 2` to StyleSheet
3. Apply inline: `{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }`

### Priority 2: Fix Text Colors
**Search:** `color: '#1f2937'` or `color: dashboardTheme.colors.text`  
**Replace:** Remove from StyleSheet, apply inline: `{ color: theme.colors.text }`

### Priority 3: Fix Borders
**Search:** `borderWidth: 1`  
**Replace:** `borderWidth: 2`  
