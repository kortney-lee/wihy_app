# Wihy Health App - Design Patterns & Style Guide

## 🎨 WiHY Brand Guide

### Color Palette

#### Primary Brand Colors

**WiHY Orange**
- **Primary Orange**: `#fa5f06`
  - Usage: Primary brand color, buttons, accents, borders
  - RGB: `rgb(250, 95, 6)`
  - Components: Search inputs, CTAs, highlights

**WiHY Kelly Green**
- **Kelly Green**: `#4cbb17`
  - Usage: Success states, excellent health scores, positive indicators
  - RGB: `rgb(76, 187, 23)`
  - Components: Health score badges (85-100), success messages, positive highlights
  - Also used in: Chart availability indicators, NOVA 1 badges

#### Background Colors

**Light Blue (Primary Page Background)**
- **Color**: `#e0f2fe`
  - Usage: **STANDARD for all new pages** - Main page background, content areas
  - RGB: `rgb(224, 242, 254)`
  - Components: Dashboard, SearchResults, NutritionFacts, ProductScanView
  - Description: Very light blue with subtle warmth
  - **Pattern**: Use this as the default background for all new page designs
 
**Slate-50 (Deprecated - Legacy Content)**
- **Color**: `#f8fafc`
  - Tailwind: `bg-slate-50`
  - Usage: [!] Legacy use only - being phased out
  - RGB: `rgb(248, 250, 252)`
  - Note: Previously used in content areas, now replaced by #e0f2fe

**Pure White**
- **Color**: `#ffffff`
  - Usage: Headers, navigation bars, cards, input fields, modals
  - RGB: `rgb(255, 255, 255)`
  - Components: Top navigation bars, header sections, card containers, modal backgrounds
  - **Pattern**: Use for UI elements that sit on top of the #e0f2fe background

#### Text Colors

**Gray Scale**
- **Dark Gray (Primary Text)**: `#1f2937`
  - Tailwind: `text-gray-800`
  - Usage: Headings, primary content text
  
- **Medium Gray (Secondary Text)**: `#6b7280`
  - Tailwind: `text-gray-500`
  - Usage: Secondary text, placeholders, no-results messages

- **Light Gray (Tertiary Text)**: `#9ca3af`
  - Tailwind: `text-gray-400`
  - Usage: Timestamps, metadata, disabled states

#### Accent Colors

**Success Green**
- **Emerald**: `#10b981`
  - Tailwind: `bg-emerald-500`
  - Usage: Success indicators, chart availability dots, positive highlights

**Health Score Colors**
- **Excellent (Kelly Green)**: `#4cbb17` - Score 85-100
- **Good (Light Green)**: `#85c24b` - Score 70-84
- **Fair (Yellow)**: `#f4c430` - Score 50-69
- **Poor (Orange)**: `#fa8532` - Score 30-49
- **Bad (Red)**: `#e74c3c` - Score 0-29

#### Border Colors

**Subtle Borders**
- **Light Gray Border**: `#e5e7eb`
  - Tailwind: `border-gray-200`
  - Usage: Dividers, card borders, subtle separators

- **Medium Gray Border**: `#d1d5db`
  - Tailwind: `border-gray-300`
  - Usage: Inputs, stronger separators

#### Shadow Colors

**Box Shadows**
- **Orange Glow**: `rgba(250, 95, 6, 0.1)` - Subtle
- **Orange Glow (Focus)**: `rgba(250, 95, 6, 0.25)` - Emphasized
- **Black Shadow**: `rgba(0, 0, 0, 0.1)` - Default elevation
- **Black Shadow (Backdrop)**: `rgba(0, 0, 0, 0.5)` - Modal overlays

#### Component-Specific Colors

**NOVA Group Badges**
- **NOVA 1 (Unprocessed)**: `#4cbb17` - Kelly Green
- **NOVA 2 (Processed)**: `#85c24b` - Light green
- **NOVA 3 (Processed)**: `#f4c430` - Yellow
- **NOVA 4 (Ultra-processed)**: `#e74c3c` - Red

**Nutrition Score Grades**
- **Grade A**: `#4cbb17` - Excellent (Kelly Green)
- **Grade B**: `#85c24b` - Good
- **Grade C**: `#f4c430` - Average
- **Grade D**: `#fa8532` - Below Average
- **Grade E**: `#e74c3c` - Poor

### Typography

**Font Family**
- **Primary**: System font stack
  ```css
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  ```

**Font Sizes (Mobile First)**

*Mobile*
- **Small**: `11px` - Fine print, timestamps
- **Regular**: `14px` - Body text
- **Medium**: `16px` - Inputs, important text
- **Large**: `18px` - Section headers
- **XL**: `20px` - Page titles

*Desktop*
- **Small**: `12px` - Fine print
- **Regular**: `16px` - Body text
- **Medium**: `18px` - Inputs
- **Large**: `20px` - Section headers
- **XL**: `24px` - Page titles

**Font Weights**
- **Regular**: `400` - Body text
- **Medium**: `500` - Emphasized text
- **Semibold**: `600` - Subheadings
- **Bold**: `700` - Headings

### Spacing

**Padding/Margin Scale**
- **xs**: `4px`
- **sm**: `8px`
- **md**: `12px`
- **lg**: `16px`
- **xl**: `20px`
- **2xl**: `24px`
- **3xl**: `32px`

**Component Spacing**
- **Mobile Padding**: `16px` (sides), `12px` (vertical)
- **Desktop Padding**: `24px` (sides), `16px` (vertical)
- **Card Gap**: `16px`
- **Section Gap**: `24px`

### Border Radius

**Rounded Corners**
- **Small**: `8px` - Buttons, small cards
- **Medium**: `12px` - Standard cards
- **Large**: `16px` - Large cards, modals
- **XL**: `20px` - Feature cards
- **Full**: `24px`+ - Pills, search inputs

**Component-Specific**
- **Search Input**: `28px`
- **Buttons**: `16px`
- **Cards**: `12px`
- **Badges**: `12px`

### Z-Index Layers

**Layer Hierarchy**
- **Base Content**: `1`
- **Sticky Headers**: `100`
- **Dropdowns**: `1000`
- **Modals Backdrop**: `9999`
- **Modals Content**: `10000`
- **Toasts/Notifications**: `10001`

### Breakpoints

**Responsive Design**
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

**Media Queries**
```css
/* Mobile First */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### Animation & Transitions

**Duration**
- **Fast**: `0.2s` - Hover states, simple transitions
- **Normal**: `0.3s` - Modal open/close, slides
- **Slow**: `0.5s` - Complex animations

**Easing**
- **Standard**: `ease-in-out` - General use
- **Smooth**: `cubic-bezier(0.4, 0, 0.2, 1)` - Material Design

### Accessibility

**Contrast Ratios**
- **Primary Text on White**: WCAG AAA (>7:1)
- **Secondary Text on White**: WCAG AA (>4.5:1)
- **Orange on White**: WCAG AA (>4.5:1)

**Touch Targets**
- **Minimum Size**: `44x44px` (iOS)
- **Recommended**: `48x48px` (Material Design)

### Brand Usage Examples

**Primary Actions**
```css
background-color: #fa5f06; /* WiHY Orange */
color: #ffffff;
border-radius: 16px;
padding: 12px 24px;
```

**Page Background (Standard Pattern)**
```css
background-color: #e0f2fe; /* Light Blue - USE THIS FOR ALL NEW PAGES */
```

**Navigation & Headers**
```css
background-color: #ffffff; /* Pure White */
border-bottom: 1px solid #e5e7eb; /* Light gray border */
```

**Success Indicators**
```css
background-color: #10b981; /* Emerald Green */
border: 2px solid #ffffff;
```

**Subtle Borders**
```css
border: 1px solid #e5e7eb; /* Light Gray */
```

---

## 📋 Quick Reference: Screen Patterns

### Dashboard Screens (Dual SafeAreaView Pattern)
These screens use the standardized dashboard pattern with white header box:

| Screen | Gradient Color | Status |
|--------|---------------|---------|
| MyProgressDashboard | Red (`#dc2626`, `#b91c1c`) | ✅ Complete |
| OverviewDashboard | Blue (`#3b82f6`, `#2563eb`) | ✅ Complete |
| FitnessDashboard | Orange (`#f59e0b`, `#d97706`) | ✅ Complete |
| ConsumptionDashboard | Green (`#10b981`, `#059669`) | ✅ Complete |
| ResearchScreen | Purple (`#8b5cf6`, `#7c3aed`) | ✅ Complete |
| CoachSelection | Indigo (`#6366f1`, `#4f46e5`) | ✅ Complete |
| CreateMeals | Red/Orange (`#ef4444`, `#dc2626`) | ✅ Complete |
| CoachDashboard | Purple (`#8b5cf6`, `#7c3aed`) | ⚠️ Needs Update |
| ParentDashboard | Purple (`#9333ea`, `#7e22ce`) | ⚠️ Needs Update |

### Detail/Modal Screens (Standard Header Pattern)
These screens use simpler header without dual SafeAreaView:

| Screen | Header Color | Status |
|--------|-------------|---------|
| NutritionFacts | Green (`#10b981`, `#059669`) | ⚠️ Current |
| CameraScreen | Blue (`#3b82f6`, `#2563eb`) | ⚠️ Current |
| FullChat | Primary | ⚠️ Current |
| Login | Primary | ✅ Current |
| Profile | Blue | ⚠️ Needs Review |

### Pattern Comparison

| Feature | Dashboard Pattern | Detail/Modal Pattern |
|---------|------------------|---------------------|
| SafeAreaView | Dual (top box + content) | Single with edges |
| White Header Box | ✅ Yes | ❌ No |
| Header Inside ScrollView | ✅ Yes | ❌ No (Fixed) |
| Uses dashboardTheme | ✅ Required | ⚠️ Optional |
| Bottom Tab Spacing | ✅ 100px | ❌ Not needed |
| Background Color | `#e0f2fe` (theme) | Varies |
| Best For | Main hub screens | Detail/modal screens |

---

## 🚨 CRITICAL: Stack vs Tab Navigation (READ THIS FIRST!)

### Navigation Architecture Overview

**React Navigation has TWO types of navigators:**

1. **Tab Navigator** (Bottom Navigation)
   - Shows bottom navigation bar (Home, Scan, Chat, Health, Profile)
   - Used for main app sections
   - Screens: HealthHub, ScanScreen, ChatScreen, ProfileScreen

2. **Stack Navigator** (Modal/Detail Screens)
   - NO bottom navigation bar
   - Used for detail screens, modals, forms
   - Screens: NutritionFacts, CoachSelection, ClientOnboarding, etc.

### 🎯 DECISION TREE: Where to Add New Screens?

**Ask yourself: "Should this screen show bottom navigation?"**

#### YES - Screen should show bottom navigation:
- **Embed in DashboardPage/CoachDashboardPage** (NOT in Stack!)
- Examples: CreateMeals, OverviewDashboard, MyProgressDashboard
- Benefits: Users can navigate to Home/Scan/Chat while viewing this screen
- Implementation: Add to `renderSelectedDashboard()` in DashboardPage

#### NO - Screen is a detail/modal view:
- **Add to Stack Navigator** in AppNavigator.tsx
- Examples: NutritionFacts, CoachSelection, ClientOnboarding
- Benefits: Full-screen focus, user must navigate back explicitly
- Implementation: `<Stack.Screen name="ScreenName" component={Component} />`

### Navigation Structure Diagram

```
App
├─ TabNavigator ← BOTTOM NAVIGATION VISIBLE
│  ├─ Home Tab
│  ├─ Scan Tab
│  ├─ Chat Tab
│  ├─ Health Tab ← Contains HealthHub
│  │  └─ HealthHub
│  │     ├─ DashboardSwitcher (Personal/Family/Coach tabs)
│  │     ├─ DashboardPage (Personal) ← Embeds dashboards
│  │     │  ├─ OverviewDashboard
│  │     │  ├─ MyProgressDashboard
│  │     │  ├─ ConsumptionDashboard
│  │     │  ├─ FitnessDashboard
│  │     │  ├─ ResearchScreen
│  │     │  ├─ ParentDashboard
│  │     │  └─ CreateMeals ← EMBEDDED = Bottom nav visible
│  │     ├─ FamilyDashboardPage (Family)
│  │     └─ CoachDashboardPage (Coach)
│  │        ├─ CoachDashboard
│  │        ├─ CoachOverview
│  │        ├─ CreateMeals ← EMBEDDED = Bottom nav visible
│  │        ├─ ClientManagement
│  │        └─ ClientOnboarding
│  └─ Profile Tab
│
└─ StackNavigator ← NO BOTTOM NAVIGATION
   ├─ NutritionFacts ← Stack screen
   ├─ CoachSelection ← Stack screen
   ├─ ClientOnboarding ← Stack screen (if navigated via Stack)
   └─ FullChat ← Stack screen
```

### Common Mistakes & Solutions

**❌ WRONG - Adding dashboard to Stack:**
```tsx
// AppNavigator.tsx - WRONG!
<Stack.Screen
  name="CreateMeals"
  component={CreateMeals}
  options={{ headerShown: false }}
/>
// Result: NO bottom navigation, user is stuck in screen
```

**✅ CORRECT - Embedding dashboard in DashboardPage:**
```tsx
// DashboardPage.tsx - CORRECT!
import CreateMeals from './CreateMeals';

const renderSelectedDashboard = () => {
  // ... other dashboards
  {selectedDashboard === 'meals' && <CreateMeals />}
};
// Result: Bottom navigation visible, user can navigate freely
```

**❌ WRONG - Embedding modal/detail screen:**
```tsx
// DashboardPage.tsx - WRONG!
{selectedDashboard === 'nutritionFacts' && <NutritionFacts />}
// Result: User can navigate away without completing the detail view
```

**✅ CORRECT - Modal/detail in Stack:**
```tsx
// AppNavigator.tsx - CORRECT!
<Stack.Screen
  name="NutritionFacts"
  component={NutritionFacts}
  options={{ presentation: 'modal' }}
/>
// Result: Full-screen modal, user must explicitly go back
```

### Guidelines for New Screens

| Screen Type | Where to Add | Bottom Nav? | Use Case |
|-------------|--------------|-------------|----------|
| Dashboard/Hub | DashboardPage | ✅ Yes | Main app sections users switch between |
| Detail View | Stack | ❌ No | Viewing specific item details |
| Form/Creation | Stack (unless part of dashboard) | ❌ No | Single-purpose creation flows |
| Modal | Stack | ❌ No | Overlay content requiring user action |
| Settings | Stack | ❌ No | Configuration screens |
| Coach Tools | CoachDashboardPage | ✅ Yes | Coach's main working screens |

### Implementation Checklist

**When creating a new dashboard screen:**
- [ ] Import component in DashboardPage.tsx
- [ ] Add to DashboardType union type
- [ ] Add to selectedDashboard state type
- [ ] Add case in renderSelectedDashboard()
- [ ] Add navigation handler in handleNavigateToDashboard()
- [ ] Use Pattern A (Simple View + ScrollView) - no SafeAreaView wrappers
- [ ] Return fragment `<>...</>` with content only

**When creating a new Stack screen:**
- [ ] Import component in AppNavigator.tsx
- [ ] Add Stack.Screen with unique name
- [ ] Set headerShown: false if using custom header
- [ ] Use Dual SafeAreaView pattern if dashboard-style
- [ ] Add to RootStackParamList type in navigation types

---

## 🎯 CRITICAL: SafeAreaView Patterns

### Understanding Screen Hierarchy

**HealthHub Architecture:**
```
HealthHub (has DashboardSwitcher with SafeAreaView top)
  ├─ DashboardSwitcher ← WHITE SAFE AREA BAR (handles all top safe area)
  │   └─ Personal/Family/Coach tabs (when multiple contexts available)
  │
  ├─ DashboardPage (Personal context) ← Wraps individual dashboards in ScrollView
  │   └─ OverviewDashboard ← NO extra SafeAreaView top
  │   └─ MyProgressDashboard ← NO extra SafeAreaView top
  │   └─ ConsumptionDashboard ← NO extra SafeAreaView top
  │   └─ ResearchScreen ← NO extra SafeAreaView top
  │   └─ FitnessDashboard ← NO extra SafeAreaView top
  │   └─ ParentDashboard ← NO extra SafeAreaView top
  │   └─ CreateMeals ← NO extra SafeAreaView top (embedded in DashboardPage)
  │
  ├─ FamilyDashboardPage (Family context)
  │   └─ ParentDashboard, etc.
  │
  └─ CoachDashboardPage (Coach context)
      └─ CreateMeals ← NO extra SafeAreaView top (embedded in CoachDashboardPage)
      └─ ClientManagement
      └─ CoachOverview
```

**🚨 CRITICAL RULE: Individual dashboards rendered inside DashboardPage MUST NOT have:**
- ❌ DashboardSwitcher component (only at HealthHub level)
- ❌ `SafeAreaView edges={['top']}` creating a white top box
- ❌ Extra wrapper Views for safe area handling
- ✅ Simple structure: `<View style={styles.container}><ScrollView>...</ScrollView></View>`

**TWO DIFFERENT PATTERNS - CHOOSE CORRECTLY:**

1. **Simple View + ScrollView** - For dashboards rendered inside DashboardPage/HealthHub
2. **Dual SafeAreaView** - For standalone dashboard screens (NOT in HealthHub hierarchy)

---

## 🚨 PATTERN A: Simple View + ScrollView (Dashboards in DashboardPage)

**Use this pattern for individual dashboards rendered inside DashboardPage** (HealthHub already provides safe area via DashboardSwitcher)

### When to Use:
- ✅ OverviewDashboard (rendered in DashboardPage)
- ✅ MyProgressDashboard (rendered in DashboardPage)
- ✅ ConsumptionDashboard (rendered in DashboardPage)
- ✅ FitnessDashboard (rendered in DashboardPage)
- ✅ ResearchScreen (rendered in DashboardPage)
- ✅ ParentDashboard (rendered in DashboardPage)
- ✅ CreateMeals (accessed via CoachDashboardPage)
- ✅ ClientManagement (accessed via CoachDashboardPage)
- ✅ Any sView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';

// ✅ CORRECT - Simple View + ScrollView (DashboardPage handles safe area)
return (
  <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Gradient Header - HealthHub's DashboardSwitcher provides white safe area */}
      <LinearGradient
        colors={['#dc2626', '#b91c1c']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Dashboard Title</Text>
        <Text style={styles.headerSubtitle}>Subtitle</Text>
      </LinearGradient>

      {/* Content sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Section Title</Text>
      </View>

      {/* Bottom spacing for tab navigation */}
      <View style={{ height: 100 }} />
    </ScrollView>
  </View>
);

// ❌ WRONG - DO NOT ADD these when in DashboardPage:
// <SafeAreaView edges={['top']} style={styles.topBox}>
// <DashboardSwitcher ... />    {/* Content sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Section Title</Text>
      </View>

      {/* Bottom spacing for tab navigation */}
      <View style={{ height: 100 }} />
    </ScrollView>
  </SafeAreaView>
);
```

### Required Styles:
```tsx
const styles = StyleSheet.create({
  container: dashboardTheme.spacing.lg,
    paddingTop: dashboardTheme.spacing.xl,
  },
  headerTitle: {
    ...dashboardTheme.typography.headerLarge,
    color: '#ffffff',
    marginBottom: dashboardTheme.spacing.xs,
  },
  headerSubtitle: {
    ...dashboardTheme.typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: dashboardTheme.spacing.md,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: dashboardTheme.spacing.lg,
  },
});

// ❌ DO NOT INCLUDE these styles (only for standalone dashboards):
// topBox: { backgroundColor: '#ffffff' }
// topBoxContent: { height: 0 }
// scrollContainer: { flex: 1, backgroundColor: ... }
```

### Why Simple View + ScrollView:
- ❌ NO white topBox needed
- ❌ NO SafeAreaView edges={['top']}
- ❌ NO DashboardSwitcher component
- ✅ HealthHub's DashboardSwitcher already handles all top safe area
- ✅ DashboardPage wraps individual dashboards in its own ScrollView
- ✅ Colored header appears directly below white DashboardSwitcher bar
- ✅ Prevents duplicate white space from double safe area handling
- ❌ NO white topBox needed
- ❌ NO dual SafeAreaView structure
- ✅ HealthHub already handles top safe area with DashboardSwitcher
- ✅ Only handle left/right edges
- ✅ Red header touches bottom of Personal/Family/Coach tabs

---

## 🎯 PATTERN B: Dual SafeAreaView (Standalone Dashboards)

**Use this pattern for standalone dashboard screens NOT accessed through HealthHub**

### When to Use:
- ✅ MyProgressDashboard (when used standalone)
- ✅ OverviewDashboard (when used standalone)
- ✅ FitnessDashboard (when used standalone)
- ✅ ConsumptionDashboard (when used standalone)
- ✅ ResearchScreen (when used standalone)
- ✅ Any dashboard NOT inside HealthHub hierarchy

### Structure:
### Structure:
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';

return (
  <View style={styles.container}>
    {/* White header box at top */}
    <SafeAreaView edges={['top']} style={styles.topBox}>
      <View style={styles.topBoxContent} />
    </SafeAreaView>
    
    {/* Main content area */}
    <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <LinearGradient
          colors={['#dc2626', '#b91c1c']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Dashboard Title</Text>
          <Text style={styles.headerSubtitle}>Dashboard subtitle</Text>
        </LinearGradient>

        {/* Dashboard content sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section Title</Text>
        </View>

        {/* Bottom spacing for tab navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  </View>
);
```

### Required Styles:
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBox: {
    backgroundColor: '#ffffff',
  },
  topBoxContent: {
    height: 0,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  header: {
    padding: dashboardTheme.spacing.lg,
    paddingTop: dashboardTheme.spacing.xl,
  },
  headerTitle: {
    ...dashboardTheme.typography.headerLarge,
    color: '#ffffff',
    marginBottom: dashboardTheme.spacing.xs,
  },
  headerSubtitle: {
    ...dashboardTheme.typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: dashboardTheme.spacing.md,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: dashboardTheme.spacing.lg,
  },
});
```

### Why Dual SafeAreaView:
- ✅ Creates white box at top for status bar
- ✅ Self-contained safe area handling
- ✅ Used when screen is NOT inside HealthHub
- ✅ Provides consistent top spacing across devices

---

## 📝 STEP-BY-STEP IMPLEMENTATION GUIDE

### Step 1: Determine Which Pattern to Use

**Ask these questions:**
1. Is my screen rendered inside DashboardPage/HealthHub? → Use **Pattern A (Simple)**
2. Does DashboardSwitcher appear in parent hierarchy? → Use **Pattern A (Simple)**
3. Is it an individual dashboard component? → Use **Pattern A (Simple)** if in DashboardPage
4. Is it a completely standalone screen? → Use **Pattern B (Dual)**

**Examples:**
- OverviewDashboard rendered in DashboardPage → **Pattern A** ✅
- MyProgressDashboard rendered in DashboardPage → **Pattern A** ✅
- ConsumptionDashboard rendered in DashboardPage → **Pattern A** ✅
- FitnessDashboard rendermple View + ScrollView) - Complete Checklist

**Imports:**
```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { dashboardTheme } from '../theme/dashboardTheme';
// ❌ DO NOT import SafeAreaView for dashboards in DashboardPage
// ❌ DO NOT import DashboardSwitcher for individual dashboards
```

**Component Structure:**
- [ ] Root: `<View style={styles.container}>`
- [ ] ❌ DO NOT add `SafeAreaView edges={['top']}` wrapper
- [ ] ❌ DO NOT add topBox, topBoxContent structure
- [ ] ❌ DO NOT add DashboardSwitcher component
- [ ] ❌ DO NOT add nested SafeAreaView wrappers
- [ ] ScrollView directly inside View container
- [ ] LinearGradient header as first child of ScrollView
- [ ] Bottom spacing: `<View style={{ height: 100 }} />`

**Styles Required:**
- [ ] `container: { flex: 1, backgroundColor: dashboardTheme.colors.background }`
- [ ] `header: { padding: dashboardTheme.spacing.lg, paddingTop: dashboardTheme.spacing.xl }`
- [ ] ❌ DO NOT include: `topBox`, `topBoxContent`, `scrollContainer`

**Visual Check:**
- [ ] White DashboardSwitcher bar visible at very top (from HealthHub)
- [ ] Colored header appears directly below white bar (no gap)
- [ ] No extra white space between DashboardSwitcher and coloreafeAreaView
- [ ] LinearGradient header as first child of ScrollView
- [ ] Bottom spacing: `<View style={{ height: 100 }} />`

**Styles Required:**
- [ ] `container: { flex: 1, backgroundColor: dashboardTheme.colors.background }`
- [ ] `header: { paddingHorizontal: dashboardTheme.spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: dashboardTheme.spacing.lg }`
- [ ] DO NOT include: `topBox`, `topBoxContent`, `scrollContainer`

**Visual Check:**
- [ ] Red/colored header touches bottom of Personal/Family/Coach tabs
- [ ] No white gap between tabs and header
- [ ] Content scrolls properly
- [ ] Bottom content not hidden by tab bar

### Step 3: Pattern B (Dual SafeAreaView) - Complete Checklist

**Imports:**
```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { dashboardTheme } from '../theme/dashboardTheme';
```

**Component Structure:**
- [ ] Root: `<View style={styles.container}>`
- [ ] First child: `<SafeAreaView edges={['top']} style={styles.topBox}>`
- [ ] Inside topBox: `<View style={styles.topBoxContent} />`
- [ ] Second child: `<SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>`
- [ ] ScrollView inside scrollContainer
- [ ] LinearGradient header as first child of ScrollView
- [ ] Bottom spacing: `<View style={{ height: 100 }} />`

**Styles Required:**
- [ ] `container: { flex: 1 }`
- [ ] `topBox: { backgroundColor: '#ffffff' }`
- [ ] `topBoxContent: { height: 0 }`
- [ ] `scrollContainer: { flex: 1, backgroundColor: dashboardTheme.colors.background }`
- [ ] `header: { padding: dashboardTheme.spacing.lg, paddingTop: dashboardTheme.spacing.xl }`

**Visual Check:**
- [ ] White box visible at top above header
- [ ] Colored header has proper padding
- [ ] Content scrolls properly
- [ ] Bottom content not hidden by tab bar

### Step 4: Common Mistakes to Avoid

**❌ WRONG - Using dual pattern in HealthHub sub-screen:**
```tsx
// CreateMeals.tsx - WRONG!
return (
  <View style={styles.container}>
    <SafeAreaView edges={['top']} style={styles.topBox}> {/* ← CREATES GAP */}
      <View style={styles.topBoxContent} />
    </SafeAreaView>
    <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
      <ScrollView>...</ScrollView>
    </SafeAreaView>
  </View>
);
```
**Result:** White gap between tabs and red header ❌

**✅ CORRECT - Single pattern in HealthHub sub-screen:**
```tsx
// CreateMeals.tsx - CORRECT!
return (
  <SafeAreaView style={styles.container} edges={['left', 'right']}>
    <ScrollView>
      <LinearGradient style={styles.header}>...</LinearGradient>
    </ScrollView>
  </SafeAreaView>
);
```
**Result:** Red header touches tabs perfectly ✅

**❌ WRONG - Forgetting platform-specific padding:**
```tsx
header: {
  padding: 24Dual Pattern to Simple Pattern (for Dashboards in DashboardPage):**

This is the fix applied to MyProgressDashboard, OverviewDashboard, ConsumptionDashboard, and FitnessDashboard.

1. **Remove imports:**
```tsx
// BEFORE
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardSwitcher, DashboardContext } from '../components/DashboardSwitcher';

// AFTER
// Remove both imports - not needed for dashboards in DashboardPage
```

2. **Remove state and component usage:**
```tsx
// BEFORE
const [dashboardContext, setDashboardContext] = useState<DashboardContext>('personal');

return (
  <View>
    <DashboardSwitcher 
      currentContext={dashboardContext}
      onContextChange={setDashboardContext}
    />
    ...

// AFTER
// Remove dashboardContext state completely
// Remove DashboardSwitcher component - only at HealthHub level
```

3. **Simplify component structure:**
```tsx
// BEFORE (7 lines with nested SafeAreaViews)
<View style={styles.container}>
  <SafeAreaView edges={['top']} style={styles.topBox}>
    <View style={styles.topBoxContent} />
  </SafeAreaView>
  <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
    <ScrollView>
      <LinearGradient style={styles.header}>...</LinearGradient>

// AFTER (3 lines - simple and clean)
<View style={styles.container}>
  <ScrollView>
    <LinearGradient style={styles.header}>...</LinearGradient>
```

4. **Update closing tags:**
```tsx
// BEFORE
    </ScrollView>
  </SafeAreaView>
</View>

// AFTER
    </ScrollView>
</View>
```

5. **Update styles:**
```tsx
// BEFORE (4 style objects)
container: { flex: 1 },
topBox: { backgroundColor: '#ffffff' },
topBoxContent: { height: 0 },
scrollContainer: { flex: 1, backgroundColor: dashboardTheme.colors.background },

// AFTER (1 style object)
container: { flex: 1, backgroundColor: dashboardTheme.colors.background },
// DELETE: topBox, topBoxContent, scrollContainer
```

6. **Keep header padding as-is:**
```tsx
// For dashboards in DashboardPage - no change needed
header: {
  padding: dashboardTheme.spacing.lg,
  paddingTop: dashboardTheme.spacing.xl,
}
```

**🎯 Result After Migration:**
- ✅ White DashboardSwitcher bar at top (from HealthHub)
- ✅ Colored header directly below (no gap)
- ✅ Clean, simple code structure
- ✅ No duplicate safe area handling
- ✅ Consistent across all 6 dashboard screens
4. **Update header padding:**
```tsx
// BEFORE
header: {
  padding: dashboardTheme.spacing.lg,
  paddingTop: dashboardTheme.spacing.xl,
}

// AFTER
header: {
  paddingHorizontal: dashboardTheme.spacing.lg,
  paddingTop: Platform.OS === 'ios' ? 60 : 40,
  paddingBottom: dashboardTheme.spacing.lg,
}
```

---

## 🧩 Reusable Dashboard Header Component

**IMPORTANT:** Always use the `GradientDashboardHeader` component for dashboard headers to prevent regression and ensure consistency.

### Location
`src/components/shared/GradientDashboardHeader.tsx`

### Available Gradient Presets
```tsx
import { GradientDashboardHeader, DASHBOARD_GRADIENTS } from '../components/shared';

// All preset gradients available:
DASHBOARD_GRADIENTS = {
  // Primary Dashboards
  fitness: ['#f59e0b', '#d97706'],           // Orange/Amber
  progress: ['#dc2626', '#b91c1c'],          // Red
  overview: ['#059669', '#047857'],          // Emerald Green
  consumption: ['#ea580c', '#c2410c'],       // Deep Orange
  research: ['#8b5cf6', '#7c3aed'],          // Purple
  coach: ['#3b82f6', '#2563eb'],             // Blue
  createMeals: ['#ef4444', '#dc2626'],       // Red
  parent: ['#f59e0b', '#d97706'],            // Amber (Family)
  clientManagement: ['#8b5cf6', '#7c3aed'],  // Purple
  
  // Nutrition & Food Screens
  nutritionFacts: ['#3b82f6', '#2563eb'],    // Blue (barcode)
  nutritionPhoto: ['#10b981', '#059669'],    // Green (food photo)
  nutritionPill: ['#f59e0b', '#d97706'],     // Orange (pill ID)
  nutritionLabel: ['#ef4444', '#dc2626'],    // Red (label reader)
  mealDetails: ['#f59e0b', '#d97706'],       // Orange/Amber
  mealPreferences: ['#ef4444', '#dc2626'],   // Red
  shoppingList: ['#4cbb17', '#3d9914'],      // Green
  cookingMode: ['#1f2937', '#111827'],       // Dark Gray
  
  // User Screens
  profile: ['#3B82F6', '#1d4ed8'],           // Blue
  subscription: ['#4CAF50', '#388e3c'],      // Green
  scanHistory: ['#3b82f6', '#2563eb'],       // Blue
  
  // Coach & Client Screens
  coachSelection: ['#06b6d4', '#0891b2'],    // Cyan
  clientOnboarding: ['#10b981', '#059669'],  // Emerald
  coachOverview: ['#3b82f6', '#2563eb'],     // Blue
  
  // Workout Screens
  workoutExecution: ['#4cbb17', '#3b9e12'],  // Lime Green
  
  // Chat Screen
  chat: ['#10b981', '#059669'],              // Emerald
  
  // Utility Screens
  weather: ['#38bdf8', '#0ea5e9'],           // Sky Blue
  todo: ['#8b5cf6', '#7c3aed'],              // Purple
  
  // Calendar & Planning
  mealCalendar: ['#3b82f6', '#2563eb'],      // Blue
  
  // Family Dashboard
  family: ['#0ea5e9', '#0284c7'],            // Sky Blue
}
```

### Basic Usage
```tsx
<GradientDashboardHeader
  title="Today's Workout"
  subtitle="Chest & Triceps - Week 1 Day 1"
  gradient="fitness"
  badge={{ icon: "sparkles-outline", text: "Personalized for you" }}
/>
```

### All Props
```tsx
interface GradientDashboardHeaderProps {
  title: string;                                    // Main title
  subtitle?: string;                                // Subtitle text
  gradient?: DashboardGradientType | [string, string]; // Preset name or custom colors
  badge?: { icon?: string; text: string };          // Optional badge below subtitle
  stats?: { icon: string; value: string; label: string }[]; // Stats row
  showBackButton?: boolean;                         // Show back arrow
  onBackPress?: () => void;                         // Back button callback
  rightAction?: { icon: string; onPress: () => void }; // Right action button
  style?: ViewStyle;                                // Additional styles
  children?: React.ReactNode;                       // Additional content
}
```

### Why Use This Component
- ✅ **Prevents Regression** - Centralized header logic like bottom navigation
- ✅ **Consistent Design** - All dashboards look the same
- ✅ **Easy Updates** - Change once, updates everywhere
- ✅ **Type Safety** - TypeScript props prevent errors
- ✅ **Preset Colors** - No need to remember hex codes

---

## 🎨 Dashboard-Specific Gradient Colors

All dashboards now use the `GradientDashboardHeader` component with these presets:

**MyProgressDashboard** (Red) - `gradient="progress"`
```tsx
colors={['#dc2626', '#b91c1c']}
```

**OverviewDashboard** (Emerald) - `gradient="overview"`
```tsx
colors={['#059669', '#047857']}
```

**FitnessDashboard** (Orange) - `gradient="fitness"`
```tsx
colors={['#f59e0b', '#d97706']}
```

**ConsumptionDashboard** (Deep Orange) - `gradient="consumption"`
```tsx
colors={['#ea580c', '#c2410c']}
```

**ResearchScreen** (Purple) - `gradient="research"`
```tsx
colors={['#8b5cf6', '#7c3aed']}
```

**CoachDashboard** (Blue) - `gradient="coach"`
```tsx
colors={['#3b82f6', '#2563eb']}
```

**CreateMeals** (Red) - `gradient="createMeals"`
```tsx
colors={['#ef4444', '#dc2626']}
```

**ParentDashboard/Family** (Amber) - `gradient="parent"`
```tsx
colors={['#f59e0b', '#d97706']}
```

**ClientManagement** (Purple) - `gradient="clientManagement"`
```tsx
colors={['#8b5cf6', '#7c3aed']}
```

---

**Problem: Extra white space above dashboard colored header (MOST COMMON)**
```tsx
// ❌ WRONG - Dashboard inside DashboardPage with extra SafeAreaView
// MyProgressDashboard.tsx, OverviewDashboard.tsx, etc.
return (
  <View style={styles.container}>
    <SafeAreaView edges={['top']} style={styles.topBox}>  {/* ← CREATES DUPLICATE WHITE SPACE */}
      <View style={styles.topBoxContent} />
    </SafeAreaView>
    <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
      <ScrollView>
        <LinearGradient style={styles.header}>...</LinearGradient>
      </ScrollView>
    </SafeAreaView>
  </View>
);

// ✅ CORRECT - Simple View + ScrollView (HealthHub handles safe area)
return (
  <View style={styles.container}>
    <ScrollView>
      <LinearGradient style={styles.header}>...</LinearGradient>
    </ScrollView>
  </View>
);
```
**Root Cause:** Individual dashboards rendered inside DashboardPage should NOT have their own `SafeAreaView edges={['top']}` because HealthHub's DashboardSwitcher already provides the white safe area bar at the top level.

**Solution Steps:**
1. Remove `<SafeAreaView edges={['top']} style={styles.topBox}>` wrapper
2. Remove `<View style={styles.topBoxContent} />` inside topBox
3. Remove nested `<SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>`
4. Simplify to: `<View style={styles.container}><ScrollView>...</ScrollView></View>`
5. Remove `topBox`, `topBoxContent`, `scrollContainer` from styles
6. Update `container` style to: `{ flex: 1, backgroundColor: dashboardTheme.colors.background }`

**Problem: White gap between Personal/Coach tabs and colored header**
```tsx
// ❌ WRONG - Screen is in HealthHub but using extra SafeAreaView
// CreateMeals.tsx
<View style={styles.container}>
  <SafeAreaView edges={['top']} style={styles.topBox}>
    <View style={styles.topBoxContent} />
  </SafeAreaView>
  <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>

// ✅ CORRECT - Use simple structure for HealthHub screens
<View style={styles.container}>
  <ScrollView>
```
**Solution:** Remove all extra SafeAreaView wrappers. HealthHub's DashboardSwitcherrn
// CreateMeals.tsx
<View style={styles.container}>
  <SafeAreaView edges={['top']} style={styles.topBox}>
    <View style={styles.topBoxContent} />
  </SafeAreaView>
  <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>

// ✅ CORRECT - Use single SafeAreaView for HealthHub screens
<SafeAreaView style={styles.container} edges={['left', 'right']}>
```
**Solution:** Rmple View for standalone dashboard
<View style={styles.container}>
  <ScrollView>

// ✅ CORRECT - Dual SafeAreaView for standalone
<View style={styles.container}>
  <SafeAreaView edges={['top']} style={styles.topBox}>
    <View style={styles.topBoxContent} />
  </SafeAreaView>
  <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
```
**Note:** Only use dual pattern for standalone dashboards NOT accessed through HealthHub/DashboardPage.

**Problem: Accidentally added DashboardSwitcher to individual dashboard**
```tsx
// ❌ WRONG - DashboardSwitcher in MyProgressDashboard.tsx
import { DashboardSwitcher } from '../components/DashboardSwitcher';
rendered inside DashboardPage/HealthHub hierarchy?**
   - YES → Pattern A (Simple View + ScrollView)
   - NO → Pattern B (Dual SafeAreaView with white topBox)

2. **Does HealthHub's DashboardSwitcher appear above this screen?**
   - YES → Pattern A (DashboardSwitcher already handles top safe area)
   - NO → Pattern B (screen must handle own top safe area)

3. **Is this an individual dashboard component (OverviewDashboard, MyProgressDashboard, etc.)?**
   - YES and rendered in DashboardPage → Pattern A (NO extra SafeAreaView)
   - YES but standalone (not in DashboardPage) → Pattern B (with SafeAreaView)
   - NO (non-dashboard screen) → Consider context

### 🚨 CRITICAL CHECKS Before Adding SafeAreaView:
- [ ] Is DashboardSwitcher already present in parent hierarchy? → Use Pattern A
- [ ] Is this screen rendered inside DashboardPage? → Use Pattern A
- [ ] Can I see Personal/Family/Coach tabs above this screen? → Use Pattern A
- [ ] Is this a completely standalone screen? → Use Pattern B

### Reference Implementations:
- **Pattern A (Simple):** OverviewDashboard.tsx, MyProgressDashboard.tsx, ConsumptionDashboard.tsx, FitnessDashboard.tsx (all rendered inside DashboardPage)
- **Pattern B (Dual):** Standalone dashboard screens NOT in HealthHub hierarchy
**Solution:** DashboardSwitcher should ONLY exist at HealthHub level, never in individual dashboard components
  paddingTop: Platform.OS === 'ios' ? 60 : 40,
}
```

**Problem: Extra white space between header and content sections**
```tsx
// ❌ WRONG - Creates gap
section: {
  padding: 16, // Adds padding on all sides including top
}

// ✅ CORRECT - No gap
section: {
  paddingHorizontal: 16,
  paddingTop: dashboardTheme.spacing.lg,
}
```

**Problem: Content hidden by tab navigation**
```tsx
// ❌ WRONG - Last content hidden
</ScrollView>

// ✅ CORRECT - Adds bottom spacing
  <View style={{ height: 100 }} />
</ScrollView>
```

**Problem: Standalone dashboard not showing white box**
```tsx
// ❌ WRONG - Single SafeAreaView for standalone
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>

// ✅ CORRECT - Dual SafeAreaView for standalone
<View style={styles.container}>
  <SafeAreaView edges={['top']} style={styles.topBox}>
    <View style={styles.topBoxContent} />
  </SafeAreaView>
  <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
```
**Note:** Only use dual pattern for standalone dashboards NOT in HealthHub.

---

## 📚 Quick Reference Summary

### Pattern Selection Flow:
1. **Is screen in HealthHub hierarchy?**
   - YES → Pattern A (Single SafeAreaView with edges={['left', 'right']})
   - NO → Pattern B (Dual SafeAreaView with white topBox)

2. **Does it show Personal/Family/Coach tabs?**
   - YES → Pattern A (tabs already handle top)
   - NO → Pattern B (handle own top safe area)

3. **Accessed via DashboardPage/CoachDashboardPage/FamilyDashboardPage?**
   - YES → Pattern A
   - NO → Pattern B

### Reference Implementations:
- **Pattern A:** CreateMeals.tsx (single, in HealthHub)
- **Pattern B:** MyProgressDashboard.tsx (dual, standalone)

---

## 🎨 UNIFIED DASHBOARD PATTERNS (January 2026)

> **⚠️ CRITICAL REFERENCE:** Do not deviate from these patterns without updating ALL dashboards.

### Quick Reference Card

| Property | Grid Container | Individual Card |
|----------|---------------|-----------------|
| Direction | `flexDirection: 'row'` | - |
| Wrapping | `flexWrap: 'wrap'` | - |
| Justify | `justifyContent: 'space-between'` | - |
| Spacing | `rowGap: 12` | - |
| Width | - | `width: '48.5%'` |
| Padding | - | `paddingVertical: 20, paddingHorizontal: 16` |
| Key prop | - | On root element (TouchableOpacity/View) |
| Wrapper | **NONE** | **NEVER wrap in extra View** |

---

## 🏗️ FIXED HEADER PATTERN

The `GradientDashboardHeader` must be **FIXED OUTSIDE the ScrollView** so it doesn't scroll with content.

### Standard Dashboard Structure

```tsx
import { GradientDashboardHeader } from '../components/shared';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyDashboard = () => {
  return (
    <View style={styles.container}>
      {/* Status bar background - matches header gradient top color */}
      <View style={styles.statusBarBackground} />
      
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* ✅ FIXED HEADER - Outside ScrollView */}
        <GradientDashboardHeader
          title="Dashboard Title"
          subtitle="Subtitle text here"
          gradient="overview"  // See gradient presets below
        />

        {/* Scrollable Content - Starts below fixed header */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Card grid and other content */}
          <View style={styles.contentContainer}>
            {/* ... */}
          </View>
          
          {/* Bottom padding for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
```

### Required Styles

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#059669', // Match gradient[0] color
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingTop: dashboardTheme.spacing.lg,
  },
});
```

### Gradient Presets Quick Reference

| Screen | Gradient Prop | Top Color (statusBarBackground) |
|--------|--------------|----------------------------------|
| Health Overview | `gradient="overview"` | `#059669` (Emerald) |
| My Progress | `gradient="progress"` | `#dc2626` (Red) |
| Fitness | `gradient="fitness"` | `#f59e0b` (Orange) |
| Nutrition | `gradient="nutrition"` | `#7c3aed` (Purple) |
| Family/Parent | `gradient="parent"` | `#ec4899` (Pink) |
| Coach | `gradient="coach"` | `#3b82f6` (Blue) |
| Create Meals | `gradient="createMeals"` | `#ef4444` (Red) |

---

## 🎨 UNIFIED CARD LAYOUT PATTERN (Commit a31709fe)

### Overview
All dashboards use a consistent 2x2 card grid layout with standardized spacing, sizing, and typography. This pattern was unified in commit a31709fe: "Unify dashboard styling: remove gaps, consistent 2x2 card layout across all dashboards".

### 1. Container Pattern Simplification

**DashboardPage.tsx Container Structure:**
```tsx
return (
  <View style={styles.container}>
    {/* HamburgerMenu OUTSIDE ScrollView */}
    {showHamburgerMenu && (
      <HamburgerMenu
        visible={showHamburgerMenu}
        onClose={() => {
          setShowHamburgerMenu(false);
          onMenuClose?.();
        }}
        onNavigateToDashboard={handleNavigateToDashboard}
        context="personal"
        // No isCoach prop needed - handled internally
      />
    )}

    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Direct dashboard rendering - NO WRAPPER VIEWS */}
      {selectedDashboard === 'overview' && <OverviewDashboard onAnalyze={handleAnalyze} />}
      {selectedDashboard === 'progress' && <MyProgressDashboard />}
      {selectedDashboard === 'nutrition' && <ConsumptionDashboard onAnalyze={handleAnalyze} />}
      {selectedDashboard === 'research' && <ResearchScreen isDashboardMode={true} />}
      {selectedDashboard === 'fitness' && <FitnessDashboard />}
      {selectedDashboard === 'parent' && <ParentDashboard />}
    </ScrollView>
  </View>
);
```

**Key Changes:**
- ✅ Changed from `SafeAreaView` → `View` for container
- ✅ Removed `dashboardContainer`, `dashboardContent`, `dashboardHeader` wrappers
- ✅ Removed `researchDashboardWrapper`, `fitnessDashboardWrapper` wrappers
- ✅ HamburgerMenu moved **before** ScrollView (not after)
- ✅ Added `scrollContent: { paddingBottom: 32 }` style
- ✅ Individual dashboards render directly without wrapper Views

**User Plan Change Reset:**
```tsx
// Reset dashboard state when user plan changes (dev mode switcher)
React.useEffect(() => {
  setSelectedDashboard(null);
  setShowHamburgerMenu(false);
}, [user?.plan]);
```

### 2. Consistent 2x2 Card Grid Layout

> **CRITICAL:** This pattern was finalized in January 2026. Do NOT modify without updating all dashboards.

**Visual Layout:**
```
┌─────────────┐  ┌─────────────┐
│   48.5%     │  │   48.5%     │
└─────────────┘  └─────────────┘
      ↕ 12px rowGap (NO column gap)
┌─────────────┐  ┌─────────────┐
│   48.5%     │  │   48.5%     │
└─────────────┘  └─────────────┘
```

**Content Area Container - KEEP IT SIMPLE:**
```tsx
// ✅ CORRECT - Only paddingHorizontal from layout hook
<View style={[styles.contentArea, { paddingHorizontal: layout.horizontalPadding }]}>
  {renderTabContent()}
</View>

// ❌ WRONG - Extra styles cause padding issues in the grid
<View style={[
  styles.contentArea, 
  { 
    paddingHorizontal: layout.horizontalPadding,
    maxWidth: layout.maxContentWidth,  // ← CAUSES ISSUES
    alignSelf: 'center',               // ← CAUSES ISSUES
    width: '100%',                     // ← CAUSES ISSUES
  }
]}>
```

> **Why:** Adding `maxWidth`, `alignSelf: 'center'`, or `width: '100%'` to the contentArea creates extra constraints that interfere with the card grid's 48.5% width calculation. This results in cards having different padding/margins than expected. MyProgressDashboard uses only `paddingHorizontal` and works correctly.

**Grid Container Style:**
```tsx
progressGrid: {
  flexDirection: 'row',       // Horizontal layout
  flexWrap: 'wrap',           // Cards wrap to next row
  justifyContent: 'space-between',  // Push cards to edges
  rowGap: 12,                 // 12px vertical spacing ONLY
  // NO columnGap or gap - the 3% leftover creates horizontal spacing
}
```

**Key Grid Properties:**
- `width: '48.5%'` - Each card takes ~half width (100% - 48.5% - 48.5% = 3% gap)
- `rowGap: 12` - Use `rowGap`, NOT `gap` (gap can cause issues)
- `justifyContent: 'space-between'` - Pushes cards to container edges

**Individual Cards:**
```tsx
progressCard: {
  width: '48.5%',              // ✅ Percentage-based, not pixel-based
  backgroundColor: dashboardTheme.colors.surface,
  paddingVertical: 20,         // Consistent vertical padding
  paddingHorizontal: 16,       // Consistent horizontal padding
  borderRadius: dashboardTheme.borderRadius.lg,
  ...dashboardTheme.shadows.md,
  alignItems: 'center',
  // ❌ NEVER USE: minWidth, flex: 1, marginHorizontal
}
```

**Rendering Cards - NO WRAPPER VIEW:**
```tsx
// ✅ CORRECT - Render cards directly, key on TouchableOpacity/View
<View style={styles.progressGrid}>
  {progressCards.map(card => renderProgressCard({ item: card }))}
</View>

// Inside renderProgressCard:
const renderProgressCard = ({ item }) => {
  return (
    <TouchableOpacity key={item.id} style={styles.progressCard}>
      {/* Card content */}
    </TouchableOpacity>
  );
};
```

```tsx
// ❌ WRONG - Extra wrapper View breaks the 48.5% width
<View style={styles.progressGrid}>
  {progressCards.map(card => (
    <View key={card.id}>  {/* ← THIS BREAKS LAYOUT! */}
      {renderProgressCard({ item: card })}
    </View>
  ))}
</View>
```

**Why Wrapper Views Break Layout:**
When you wrap a card in an extra `<View>`, the wrapper has no width set, so React Native gives it a default width. The card's `width: '48.5%'` then applies to the wrapper's width (not the grid container), resulting in extremely narrow cards.

**Quick Reference - Correct Pattern:**
```tsx
// Container
progressGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  rowGap: 12,
}

// Card
progressCard: {
  width: '48.5%',
  paddingVertical: 20,
  paddingHorizontal: 16,
  borderRadius: dashboardTheme.borderRadius.lg,
  ...dashboardTheme.shadows.md,
  alignItems: 'center',
}
```

**Screens Using This Pattern:**
- `MyProgressDashboard.tsx` - progressGrid, progressCard
- `ConsumptionDashboard.tsx` - recipesGrid, recipeCard (Recipes tab)
- Any dashboard with card grids

### 3. Card Content Layout (Simplified Structure)

**New Structure - No Nested Wrappers:**
```tsx
<View style={styles.progressCard}>
  {/* Icon - Direct child */}
  <View style={[styles.progressIcon, { backgroundColor: item.color + '20' }]}>
    <Ionicons name={item.icon} size={24} color={item.color} />
  </View>
  
  {/* Percentage - Direct child */}
  <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
  
  {/* Title - Direct child */}
  <Text style={styles.progressTitle}>{item.title}</Text>
  
  {/* Value - Direct child */}
  <Text style={styles.progressValue}>
    {item.completed} / {item.target} {item.unit}
  </Text>
  
  {/* Progress bar - Direct child */}
  <View style={styles.progressBarBackground}>
    <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: item.color }]} />
  </View>
</View>
```

**Old Structure - Nested Wrappers (REMOVED):**
```tsx
// ❌ REMOVED - Extra wrapper Views
<View style={styles.progressCard}>
  <View style={styles.progressHeader}>  {/* ← REMOVED */}
    <View style={styles.progressIcon}>...</View>
    <Text style={styles.progressPercentage}>...</Text>
  </View>
  <View style={styles.progressContent}>  {/* ← REMOVED */}
    <Text style={styles.progressTitle}>...</Text>
  </View>
  <View style={styles.progressBarContainer}>  {/* ← REMOVED */}
    <View style={styles.progressBarBackground}>...</View>
  </View>
</View>
```

### 4. Card Icon & Typography Updates

**Icon Sizing:**
```tsx
progressIcon: {
  width: 48,              // Was: 32
  height: 48,             // Was: 32
  borderRadius: 24,       // Fully circular (was: borderRadius.md)
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: dashboardTheme.spacing.sm,
}

// Icon size in JSX
<Ionicons name={item.icon} size={24} color={item.color} />  // Was: 20
```

**Typography - Bolder and Larger:**
```tsx
progressPercentage: {
  fontSize: 24,           // Was: caption (12-14px)
  fontWeight: '700',      // Was: '600'
  color: dashboardTheme.colors.text,  // Was: textSecondary
  marginBottom: 2,
}

progressTitle: {
  fontSize: 14,           // Was: body (15px)
  fontWeight: '600',
  color: dashboardTheme.colors.text,
  marginBottom: 2,        // Was: dashboardTheme.spacing.xs
  textAlign: 'center',    // Added for consistency
}

progressValue: {
  fontSize: 11,           // Was: caption
  color: dashboardTheme.colors.textSecondary,
  marginBottom: 2,        // Was: dashboardTheme.spacing.xs
}
```

**Progress Bar:**
```tsx
progressBarBackground: {
  width: '100%',          // Added explicit width
  height: 4,
  backgroundColor: dashboardTheme.colors.border,
  borderRadius: 2,
  overflow: 'hidden',
  // REMOVED: marginTop: dashboardTheme.spacing.sm
}

progressBarFill: {
  height: '100%',
  borderRadius: 2,
}
```

### 5. HamburgerMenu Enhancement

**Added isCoach Prop:**
```tsx
interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToDashboard: (dashboardType: ...) => void;
  context?: 'personal' | 'coach' | 'family';
  isCoach?: boolean;  // ← NEW: Hide "Find a Coach" for coaches
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  visible,
  onClose,
  onNavigateToDashboard,
  context = 'personal',
  isCoach = false,  // ← NEW: Default false
}) => {
  // Filter options based on current context
  const dashboardOptions = allDashboardOptions.filter(option => {
    // Hide 'Find a Coach' if user is already a coach
    if (option.id === 'coach-selection' && isCoach) {
      return false;
    }
    return option.contexts.includes(context);
  });
  
  // ... rest of component
};
```

**Usage in DashboardPage:**
```tsx
<HamburgerMenu
  visible={showHamburgerMenu}
  onClose={() => {
    setShowHamburgerMenu(false);
    onMenuClose?.();
  }}
  onNavigateToDashboard={handleNavigateToDashboard}
  context="personal"
  isCoach={hasCoachAccess(user)}  // ← Pass coach status
/>
```

### 6. SafeAreaView Pattern for Dashboards

**Each Individual Dashboard:**
```tsx
// Dashboard component (MyProgressDashboard, OverviewDashboard, etc.)
return (
  <View style={styles.container}>
    <SafeAreaView edges={['top']} style={styles.topBox}>
      <View style={styles.topBoxContent} />
    </SafeAreaView>
    <SafeAreaView style={styles.scrollContainer} edges={['left', 'right']}>
      <ScrollView>
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  </View>
);

// Styles
container: {
  flex: 1,
},
topBox: {
  backgroundColor: '#ffffff',
},
topBoxContent: {
  height: 0,
},
scrollContainer: {
  flex: 1,
  backgroundColor: dashboardTheme.colors.background,
},
```

### 7. Migration Checklist

When updating a dashboard to the unified pattern:

**Structure:**
- [ ] Import `Dimensions` from 'react-native'
- [ ] Add `const { width: screenWidth } = Dimensions.get('window');`
- [ ] Change card grid to `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: 12`
- [ ] Set card width to `(screenWidth - 64) / 2`
- [ ] Remove `flex: 1`, `minWidth: 0`, `marginHorizontal` from cards

**Card Layout:**
- [ ] Remove `progressHeader`, `progressContent`, `progressBarContainer` wrapper Views
- [ ] Make icon, percentage, title, value, progress bar direct children of card
- [ ] Update icon container: `width: 48`, `height: 48`, `borderRadius: 24`
- [ ] Update icon size to `24` (was `20`)

**Typography:**
- [ ] Update percentage: `fontSize: 24`, `fontWeight: '700'`, `color: text`
- [ ] Update title: `fontSize: 14`, `fontWeight: '600'`, `textAlign: 'center'`
- [ ] Update value: `fontSize: 11`, `marginBottom: 2`
- [ ] Change all `marginBottom: dashboardTheme.spacing.xs` to `marginBottom: 2`

**Progress Bar:**
- [ ] Add `width: '100%'` to progressBarBackground
- [ ] Remove `marginTop` from progressBarBackground
- [ ] Keep `height: 4`, `borderRadius: 2`

**Container (DashboardPage only):**
- [ ] Change `SafeAreaView` to `View` for root container
- [ ] Move HamburgerMenu before ScrollView
- [ ] Remove all wrapper Views (dashboardContainer, dashboardContent, etc.)
- [ ] Add `contentContainerStyle={styles.scrollContent}` with `paddingBottom: 32`
- [ ] Add user plan change useEffect

### 8. Example: Before & After

**Before (Old Pattern):**
```tsx
<View style={styles.progressGrid}>
  {cards.map(card => (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View style={styles.progressIcon}>
          <Ionicons name={card.icon} size={20} color={card.color} />
        </View>
        <Text style={styles.progressPercentage}>75%</Text>
      </View>
      <Text style={styles.progressTitle}>{card.title}</Text>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>
      </View>
    </View>
  ))}
</View>

// Styles
progressGrid: {
  gap: dashboardTheme.spacing.md,
}
progressCard: {
  flex: 1,
  minWidth: 0,
  padding: dashboardTheme.spacing.sm,
}
progressIcon: {
  width: 32,
  height: 32,
}
progressPercentage: {
  fontSize: 12,
  fontWeight: '600',
}
```

**After (New Pattern):**
```tsx
<View style={styles.progressGrid}>
  {cards.map(card => (
    <View style={styles.progressCard}>
      <View style={[styles.progressIcon, { backgroundColor: card.color + '20' }]}>
        <Ionicons name={card.icon} size={24} color={card.color} />
      </View>
      <Text style={styles.progressPercentage}>75%</Text>
      <Text style={styles.progressTitle}>{card.title}</Text>
      <Text style={styles.progressValue}>15 / 20 sessions</Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: '75%', backgroundColor: card.color }]} />
      </View>
    </View>
  ))}
</View>

// Styles
const { width: screenWidth } = Dimensions.get('window');

progressGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
}
progressCard: {
  width: (screenWidth - 64) / 2,
  padding: dashboardTheme.spacing.md,
}
progressIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  marginBottom: dashboardTheme.spacing.sm,
}
progressPercentage: {
  fontSize: 24,
  fontWeight: '700',
  color: dashboardTheme.colors.text,
  marginBottom: 2,
}
```

---

## Header Patterns (Non-Dashboard Screens)

### Standard Gradient Header (For Detail/Modal Screens)
Non-dashboard screens (like NutritionFacts, CameraScreen) use this simpler pattern:

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#6366f1', '#4f46e5']} // Match dashboard card color
  style={styles.header}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color="#fff" />
  </Pressable>
  <Text style={styles.headerTitle}>Screen Title</Text>
  <Pressable onPress={handleAction}>
    <Ionicons name="add-circle" size={28} color="#fff" />
  </Pressable>
</LinearGradient>
```

### Header Styles (Non-Dashboard)
```tsx
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingTop: Platform.OS === 'ios' ? 60 : 20,
  paddingBottom: 16,
  borderBottomWidth: 0,
},
headerTitle: {
  fontSize: 20,
  fontWeight: '600',
  color: '#ffffff',
},
```

### Dashboard Color Mapping (Non-Dashboard Screens)
For detail/modal screens, match header gradient to related dashboard card colors. These colors come from `dashboardColors` in types.ts:

**Client/Coach Management Screens** (Accent Purple)
- `['#8B5CF6', '#7c3aed']`
- ClientManagement, ClientOnboarding
- Use for: user management, coaching, client workflows
- Matches: `dashboardColors.accent`

**Nutrition/Meal Screens** (Secondary Green)
- `['#10B981', '#059669']`
- NutritionFacts, NutritionScreen
- Use for: food detail screens, nutrition analysis
- Matches: `dashboardColors.secondary`

**Overview/Analytics Screens** (Primary Blue)
- `['#3B82F6', '#2563eb']`
- Dashboard, Profile
- Use for: general screens, profile management
- Matches: `dashboardColors.primary`

**Fitness/Activity Screens** (Orange)
- `['#F97316', '#ea580c']`
- ProgressScreen, WeatherScreen
- Use for: activity detail screens, fitness details
- Matches: `dashboardColors.orange`

### Required Imports (All Screens)
```tsx
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardTheme } from '../theme/dashboardTheme'; // For dashboards
```

---

## Filter Chip Patterns

### Standard Filter Chip with Dynamic Colors

```tsx
// Define color function
const getFilterColor = (filter: string) => {
  switch (filter) {
    case 'active':
      return '#10b981'; // green
    case 'pending':
      return '#f59e0b'; // orange
    case 'inactive':
      return '#6b7280'; // gray
    case 'all':
    default:
      return '#3b82f6'; // blue
  }
};

// Render filter chips
<Pressable
  style={[
    styles.filterChip,
    selectedFilter === filter && [
      styles.filterChipActive,
      {
        backgroundColor: getFilterColor(filter) + '15',
        borderColor: getFilterColor(filter),
      },
    ],
  ]}
  onPress={() => setSelectedFilter(filter)}
>
  <Ionicons
    name={icon as any}
    size={20}
    color={selectedFilter === filter ? getFilterColor(filter) : '#6b7280'}
  />
  <Text
    style={[
      styles.filterText,
      selectedFilter === filter && [
        styles.filterTextActive,
        { color: getFilterColor(filter) },
      ],
    ]}
  >
    {label}
  </Text>
</Pressable>
```

### Filter Chip Styles
```tsx
filterChip: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  paddingHorizontal: 20,
  paddingVertical: 14,
  borderRadius: 24,
  backgroundColor: '#f3f4f6',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  minHeight: 48,
},
filterChipActive: {
  backgroundColor: '#dbeafe',
  borderColor: '#3b82f6',
},
filterText: {
  fontSize: 15,
  color: '#6b7280',
  lineHeight: 20,
},
filterTextActive: {
  color: '#3b82f6',
  fontWeight: '600',
},
```

### Filter Container Spacing
```tsx
filtersContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
  gap: 16,
},
filtersScroll: {
  gap: 12,
  paddingRight: 16,
  flexGrow: 0,
},
```

## Specialty/Category Color Palette

### Nutrition/Health Categories
```tsx
const getSpecialtyColor = (key: string): string => {
  switch (key) {
    case 'Heart Health':
      return '#ef4444'; // red
    case 'Vegan/Plant-Based':
      return '#10b981'; // green
    case 'Weight Loss':
      return '#f59e0b'; // orange
    case 'Sports Nutrition':
      return '#8b5cf6'; // purple
    case 'Meal Planning':
      return '#06b6d4'; // cyan
    case 'Diabetes':
      return '#ec4899'; // pink
    case 'All':
    default:
      return '#3b82f6'; // blue
  }
};
```

### Status Colors
```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#10b981'; // green
    case 'inactive':
      return '#6b7280'; // gray
    case 'pending':
      return '#f59e0b'; // orange
    default:
      return '#6b7280';
  }
};
```

## Button Patterns

### Action Buttons (View, Message, Call)
```tsx
// Improved sizing and borders
clientActions: {
  flexDirection: 'row',
  gap: 10,
},
actionButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  paddingVertical: 14,
  borderRadius: 10,
  backgroundColor: '#fff',
  borderWidth: 1.5,
  borderColor: '#e5e7eb',
},
primaryAction: {
  backgroundColor: '#3b82f6',
  borderColor: '#3b82f6',
},
primaryActionText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#fff',
},
```

### Button Icon Sizes
- Primary action icons: `size={20}`
- Secondary action icons: `size={22}`
- Header icons: `size={24}` (back arrow), `size={28}` (add/action)
- Filter chip icons: `size={20}`

### Stat Cards with Colors
```tsx
<View style={[styles.statCard, { backgroundColor: '#d1fae5', borderColor: '#10b981' }]}>
  <Text style={[styles.statValue, { color: '#047857' }]}>3</Text>
  <Text style={[styles.statLabel, { color: '#065f46' }]}>Active</Text>
</View>
```

**Stat Card Color Schemes:**
- **Active**: bg `#d1fae5`, border `#10b981`, value `#047857`, label `#065f46`
- **Pending**: bg `#fef3c7`, border `#f59e0b`, value `#d97706`, label `#92400e`
- **Total**: bg `#dbeafe`, border `#3b82f6`, value `#1e40af`, label `#1e3a8a`
- **Adherence**: bg `#e9d5ff`, border `#a855f7`, value `#7c3aed`, label `#6b21a8`

## Icon and Text Sizing Standards

### Typography Scale
- Header Title: `fontSize: 20`, `fontWeight: '600'`
- Section Title: `fontSize: 18`, `fontWeight: '600'`
- Card Title: `fontSize: 16`, `fontWeight: '600'`
- Body Text: `fontSize: 15` or `fontSize: 14`
- Caption/Label: `fontSize: 12-14`
- Filter/Button Text: `fontSize: 15`, `lineHeight: 20`

### Icon Sizing Guide
- Navigation icons (back, menu): 24px
- Action icons (add, edit, delete): 22-28px
- Filter/chip icons: 20px
- List item icons: 16-20px
- Stat/badge icons: 16-18px

## Spacing Standards

### Container Padding
- Horizontal padding: `16px`
- Vertical padding: `12-16px`
- Section spacing: `16-20px`
- Element gaps: `8-12px`

### Button Padding
- Vertical: `14px` (primary/action buttons)
- Horizontal: `16-20px`
- Gap between icon and text: `6-8px`

### Border Radius
- Buttons: `8-10px`
- Cards: `12-16px`
- Filter chips: `20-24px`
- Badges: `12-16px`

## View Toggle Pattern

```tsx
viewToggle: {
  flexDirection: 'row',
  gap: 8,
  flexShrink: 0,
},
viewButton: {
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#f9fafb',
},
viewButtonActive: {
  backgroundColor: '#eff6ff',
},
```

## Search Bar Pattern

```tsx
searchContainer: {
  padding: 16,
  backgroundColor: '#fff',
},
searchBar: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  gap: 8,
},
searchInput: {
  flex: 1,
  fontSize: 16,
  color: '#111827',
},
```

## Best Practices

### 1. Consistent Color Usage
- Always use the color mapping functions for status, categories, and filters
- Match header gradient to corresponding dashboard card color
- Use white text on gradient backgrounds

### 2. Icon Guidelines
- Use consistent sizes within the same context
- White icons on colored backgrounds
- Gray icons (#6b7280) on white backgrounds when inactive
- Colored icons when active/selected

### 3. Touch Targets
- Minimum button height: 44-48px
- Use `paddingVertical: 14` for comfortable touch targets
- Add proper spacing between interactive elements

### 4. Border and Shadow
- Use subtle borders (1-1.5px) for definition
- Apply shadows sparingly for elevation
- Match border colors to background tints

### 5. Accessibility
- Ensure sufficient color contrast (WCAG AA minimum)
- Use semantic color meanings (green=active/success, red=error, orange=warning)
- Provide clear visual feedback for interactive states

### 6. Platform Considerations
- Use `Platform.OS` checks for iOS/Android-specific padding
- Apply SafeAreaView with both top and bottom edges
- Test on multiple screen sizes and orientations

## Example Implementation Checklist

When creating a new screen:

- [ ] Import LinearGradient for header
- [ ] Use SafeAreaView with top and bottom edges
- [ ] Match header gradient to dashboard card color
- [ ] Use white text/icons in gradient header
- [ ] Implement filter chips with dynamic colors (if applicable)
- [ ] Use proper icon sizing (20px for filters, 24px for navigation)
- [ ] Set button padding to 14px vertical
- [ ] Apply consistent spacing (16px horizontal, 12-16px vertical)
- [ ] Add color coding for stats/status indicators
- [ ] Test safe area on devices with notches
- [ ] Verify touch targets are 44px+ in height
