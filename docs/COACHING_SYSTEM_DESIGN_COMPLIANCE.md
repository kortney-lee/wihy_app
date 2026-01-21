# Coaching System Design Pattern Compliance

## Overview

All coaching-related screens have been updated to comply with the design patterns specified in `DESIGN_PATTERNS.md`. This document tracks the current state of each screen and validates compliance with the standardized UI/UX patterns.

---

## Design Pattern Standards

### Background Colors
- **Standard Page Background**: `#e0f2fe` (Light Blue)
- **Card/Modal Background**: `#ffffff` (Pure White)
- **Borders**: `#e5e7eb` (Light Gray)

### Theme Colors by Screen Type

| Screen Type | Header Color | Theme | Status |
|------------|--------------|-------|---------|
| Coach Selection | `#6366f1` (Indigo) | Coach Discovery | ✅ Updated |
| Coach Dashboard | `#3b82f6` (Blue) | Coach Hub | ✅ Compliant |
| Coach Overview | `#3b82f6` (Blue) | Coach Stats | ✅ Compliant |
| Client Management | `#8b5cf6` (Purple) | Coach-Client | ✅ Compliant |
| Client Onboarding | `#10b981` (Green) | Client Setup | ✅ Compliant |
| Client Progress | `#3b82f6` (Blue) | Client Tracking | ✅ Updated |

---

## Screen-by-Screen Compliance

### 1. CoachSelection.tsx ✅ UPDATED

**Purpose**: Browse and select coaches for client-coach matching

**Design Pattern Compliance**:
- ✅ Background: `#e0f2fe` (Light Blue)
- ✅ Header: `#6366f1` (Indigo) - Updated from cyan
- ✅ Collapsing Header: Animation implemented (140px → 0px)
- ✅ SafeAreaView: Proper insets handling
- ✅ ScrollView: Animated scroll listener

**Key Components**:
```tsx
const HEADER_MAX_HEIGHT = 140;
const HEADER_MIN_HEIGHT = 0;

// Header interpolation
const headerHeight = scrollY.interpolate({
  inputRange: [0, HEADER_SCROLL_DISTANCE],
  outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
  extrapolate: 'clamp',
});
```

**Visual Hierarchy**:
- Header: Indigo gradient with coach stats
- Content: White coach cards on light blue background
- Actions: Blue primary buttons (`#3b82f6`)

---

### 2. CoachDashboardPage.tsx ✅ COMPLIANT

**Purpose**: Main hub for coach dashboard with view selection

**Design Pattern Compliance**:
- ✅ Background: `#e0f2fe` (Light Blue)
- ✅ Header: `#3b82f6` (Blue)
- ✅ Collapsing Header: Animation implemented
- ✅ SafeAreaView: Dual pattern (status bar + content)
- ✅ ScrollView: Proper bottom padding (100px for tabs)

**Key Features**:
- Dashboard grid with colored cards
- View switcher (Overview, Dashboard, Clients, Meals, Onboard)
- Hamburger menu integration
- Responsive layout with `dashboardTheme`

**Color Scheme**:
- Header: Blue (`#3b82f6`)
- Cards: Various (Green `#10b981`, Blue `#3b82f6`, Purple `#8b5cf6`, Orange `#f59e0b`)
- Background: Light Blue (`#e0f2fe`)

---

### 3. CoachOverview.tsx ✅ COMPLIANT

**Purpose**: Coach revenue and activity overview

**Design Pattern Compliance**:
- ✅ Background: `#e0f2fe` (Light Blue)
- ✅ Header: `#3b82f6` (Blue)
- ✅ Collapsing Header: Full animation with opacity and scale
- ✅ SafeAreaView: Status bar area handling
- ✅ Revenue Cards: Color-coded stats

**Key Components**:
```tsx
// Revenue stats display
const revenueStats = {
  totalRevenue: { color: '#10b981', label: 'Total Revenue' },
  monthlyRevenue: { color: '#3b82f6', label: 'This Month' },
  activeClients: { color: '#f59e0b', label: 'Active Clients' },
  commissionRate: { color: '#8b5cf6', label: 'Commission' }
};
```

**Data Integration**:
- Connected to `coachService.getCoachOverview()`
- Real-time client stats
- Recent activity feed
- Quick actions grid

---

### 4. ClientManagement.tsx ✅ COMPLIANT

**Purpose**: Coach view of all clients with filtering and management

**Design Pattern Compliance**:
- ✅ Background: `#e0f2fe` (Light Blue)
- ✅ Header: `#8b5cf6` (Purple) - Client management theme
- ✅ Collapsing Header: Full animation implemented
- ✅ SafeAreaView: Proper insets
- ✅ List/Grid Views: Toggle between layouts

**Key Features**:
- Search bar with debouncing
- Status filters (All, Active, Inactive, Pending)
- View switcher (List/Grid)
- Client cards with adherence metrics
- Empty state handling

**API Integration**:
```tsx
// Connected to coach service
const overview = await coachService.getCoachOverview(coachId);
const clients = overview.clients.map(apiClient => ({
  id, name, email, status, program, adherence
}));
```

---

### 5. ClientOnboarding.tsx ✅ COMPLIANT

**Purpose**: Multi-step client onboarding wizard

**Design Pattern Compliance**:
- ✅ Background: `#e0f2fe` (Light Blue)
- ✅ Header: `#10b981` (Green) - Onboarding/success theme
- ✅ Collapsing Header: Animation implemented
- ✅ SafeAreaView: Proper insets
- ✅ Step Indicator: Visual progress tracking

**Key Features**:
- 5-step wizard (Personal, Health, Goals, Preferences, Consent)
- Step validation before proceeding
- Progress indicator dots
- Form field validation
- Animated header collapse

**Form Structure**:
```tsx
const totalSteps = 5;
const [currentStep, setCurrentStep] = useState(1);

// Steps:
// 1. Personal Information (firstName, lastName, email, phone, DOB, gender)
// 2. Health Profile (height, weight, activityLevel, conditions, allergies)
// 3. Goals (primaryGoal, targetWeight, timeframe, motivation)
// 4. Preferences (dietary, cuisine, meal frequency)
// 5. Consent (terms, privacy, communication)
```

---

### 6. ClientProgressScreen.tsx ✅ UPDATED

**Purpose**: Track client progress across fitness, nutrition, health, and body metrics

**Design Pattern Compliance**:
- ✅ Background: `#e0f2fe` (Light Blue) - Updated from gray
- ✅ Header: `#3b82f6` (Blue)
- ✅ Collapsing Header: Full animation with opacity and scale
- ✅ SafeAreaView: Status bar area handling
- ✅ Tab Navigation: Fitness, Nutrition, Health, Body, Notes

**Key Changes**:
- Background changed from `#f9fafb` (gray) to `#e0f2fe` (light blue)
- Matches standard dashboard pattern
- Improved visual consistency

**Tab Structure**:
```tsx
type TabType = 'overview' | 'fitness' | 'nutrition' | 'health' | 'body' | 'notes';

// Tab content includes:
// - Overview: Summary cards with key metrics
// - Fitness: Workout sessions, streaks, weekly progress
// - Nutrition: Meal diary, calorie tracking, weekly chart
// - Health: Measurements, vitals, trends
// - Body: Measurements, progress photos, body composition
// - Notes: Coach notes with categories and filtering
```

---

## Collapsing Header Pattern

All dashboard screens implement the standardized collapsing header:

### Implementation Template

```tsx
// Animation setup
const scrollY = useRef(new Animated.Value(0)).current;
const insets = useSafeAreaInsets();
const HEADER_MAX_HEIGHT = 140;
const HEADER_MIN_HEIGHT = 0;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Height interpolation
const headerHeight = scrollY.interpolate({
  inputRange: [0, HEADER_SCROLL_DISTANCE],
  outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
  extrapolate: 'clamp',
});

// Opacity interpolation
const headerOpacity = scrollY.interpolate({
  inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
  outputRange: [1, 0],
  extrapolate: 'clamp',
});

// Scale interpolation
const titleScale = scrollY.interpolate({
  inputRange: [0, HEADER_SCROLL_DISTANCE],
  outputRange: [1, 0.9],
  extrapolate: 'clamp',
});
```

### JSX Structure

```tsx
<View style={styles.container}>
  {/* Status bar area */}
  <View style={{ height: insets.top, backgroundColor: HEADER_COLOR }} />
  
  {/* Collapsing header */}
  <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
    <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
      <Animated.Text style={[styles.headerTitle, { transform: [{ scale: titleScale }] }]}>
        Title
      </Animated.Text>
      {/* Header content */}
    </Animated.View>
  </Animated.View>
  
  {/* Scrollable content */}
  <Animated.ScrollView
    onScroll={Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false }
    )}
    scrollEventThrottle={16}
  >
    {/* Content */}
  </Animated.ScrollView>
</View>
```

---

## Color Palette Summary

### Coach Screens
- **Primary**: `#3b82f6` (Blue) - Main coach actions
- **Secondary**: `#8b5cf6` (Purple) - Client management
- **Tertiary**: `#6366f1` (Indigo) - Coach selection/discovery
- **Accent**: `#10b981` (Green) - Success states

### Client Screens
- **Primary**: `#10b981` (Green) - Onboarding/success
- **Secondary**: `#3b82f6` (Blue) - Progress tracking
- **Background**: `#e0f2fe` (Light Blue) - Standard page background

### Universal
- **Cards**: `#ffffff` (Pure White)
- **Borders**: `#e5e7eb` (Light Gray)
- **Text Primary**: `#111827` (Dark Gray)
- **Text Secondary**: `#6b7280` (Medium Gray)
- **Text Tertiary**: `#9ca3af` (Light Gray)

---

## Mobile vs. Web Considerations

All screens detect platform and adjust accordingly:

```tsx
const isWeb = Platform.OS === 'web';
```

### Platform-Specific Adjustments
- **Mobile**: Full touch optimization, 44px+ touch targets
- **Web**: Hover states, cursor pointers, responsive grid layouts
- **Responsive**: Breakpoints at 768px (tablet), 1024px (desktop)

---

## API Integration Status

### Coaching Services Connected

| Screen | Service | Endpoint | Status |
|--------|---------|----------|---------|
| CoachSelection | `coachService` | `GET /api/coaches/discover` | ✅ Ready |
| CoachOverview | `coachService` | `GET /api/coaches/:id/overview` | ✅ Connected |
| ClientManagement | `coachService` | `GET /api/coaches/:id/overview` | ✅ Connected |
| ClientProgress | `coachService` | Client-specific endpoints | ⏳ Pending |
| ClientOnboarding | `coachService` | `POST /api/coaches/:id/clients` | ⏳ Pending |

---

## Workflow Integration

### Coach Signup Flow
1. **Role Selection** → Signup with role='COACH'
2. **Profile Setup** → 3-step wizard (Basic, Details, Pricing)
3. **Verification** → Admin approval (pending state)
4. **Dashboard Access** → CoachDashboardPage unlocked

### Client-Finds-Coach Flow
1. **Discovery** → CoachSelection.tsx (browse/search)
2. **Profile View** → Coach detail page
3. **Request** → Send coaching request
4. **Acceptance** → Coach accepts → ClientManagement

### Coach-Invites-Client Flow
1. **Send Invitation** → From CoachDashboardPage
2. **Email Notification** → Client receives invitation
3. **Client Accepts** → Login/signup if needed
4. **Onboarding** → ClientOnboarding.tsx
5. **Active Relationship** → Appears in ClientManagement

---

## Testing Checklist

### Visual Compliance
- [x] All backgrounds use `#e0f2fe`
- [x] Headers use theme-specific colors
- [x] Collapsing header animations smooth (140px → 0px)
- [x] SafeAreaView handles notches/status bars
- [x] Cards use white background with proper shadows

### Functional Testing
- [ ] CoachSelection: Search and filter coaches
- [ ] CoachDashboardPage: Navigate between views
- [ ] CoachOverview: Display revenue stats
- [ ] ClientManagement: Filter and view clients
- [ ] ClientOnboarding: Complete 5-step wizard
- [ ] ClientProgressScreen: Switch between tabs

### Responsive Testing
- [ ] Mobile: Touch targets ≥ 44px
- [ ] Tablet: 2-column layouts work
- [ ] Desktop: Full multi-column layouts
- [ ] Web: Hover states and pointers

---

## Next Steps

### Phase 1: Complete Backend Integration ⏳
- [ ] Connect ClientOnboarding to coach service
- [ ] Implement client progress tracking endpoints
- [ ] Add booking/scheduling API integration

### Phase 2: Enhanced Features 📋
- [ ] Real-time notifications (new client requests)
- [ ] Video call integration (Zoom/Teams)
- [ ] Payment processing (Stripe)
- [ ] Review/rating system

### Phase 3: Analytics & Reporting 📊
- [ ] Coach earnings dashboard
- [ ] Client retention metrics
- [ ] Session analytics
- [ ] Progress tracking charts

---

## Summary

✅ **All 6 coaching screens now comply with design patterns**

**Updated**:
- CoachSelection.tsx: Header color cyan → indigo
- ClientProgressScreen.tsx: Background gray → light blue

**Verified Compliant**:
- CoachDashboardPage.tsx: Blue theme ✓
- CoachOverview.tsx: Blue theme ✓
- ClientManagement.tsx: Purple theme ✓
- ClientOnboarding.tsx: Green theme ✓

**Pattern Adherence**:
- ✅ Standard background: `#e0f2fe`
- ✅ Collapsing headers: All screens
- ✅ SafeAreaView: Proper insets
- ✅ Theme colors: Consistent palette
- ✅ Animations: Smooth 0.3s transitions
- ✅ Typography: System font stack
- ✅ Spacing: Consistent padding/margins

---

*Last Updated: January 21, 2026*
*Commit: 7d122f0 - Update coaching screens to match design patterns*
