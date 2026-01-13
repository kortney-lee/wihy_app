# WiHY Application Workflow Guide

## Overview

WiHY is a React-based health and nutrition application that provides AI-powered food analysis, fitness tracking, and personalized health insights. This guide covers the core design patterns and implementation details for the web application.

---

## Core User Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER ENTRY POINT                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  VHealthSearch.tsx (/)                                                          │
│  ─────────────────────                                                          │
│  • Google-style search landing page                                             │
│  • Rotating placeholder prompts                                                 │
│  • Image upload via ImageUploadModal                                            │
│  • Voice input support                                                          │
│  • Barcode scanning integration                                                 │
│  • Animated border sweep effect                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                              │                              │
         │ Text Query                   │ Image Upload                 │ Barcode Scan
         ▼                              ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────────┐
│  /results           │    │  FullScreenChat     │    │  /nutritionfacts        │
│  SearchResults.tsx  │    │  (Modal Overlay)    │    │  NutritionFacts.tsx     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────────┘
         │                              │                              │
         └──────────────────────────────┼──────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DashboardPage.tsx (/overview, /myprogress, /intake, /fitness, /parent)         │
│  ──────────────────────────────────────────────────────────────────────────────  │
│  Routes to specialized dashboards based on URL path                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Web Navigation (Routes)

**File:** `client/src/App.tsx`

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | VHealthSearch | Landing page with search |
| `/results` | ResultsPage | Search results display |
| `/nutritionfacts` | NutritionFactsPage | Product nutrition analysis |
| `/about` | AboutPage | Company info |
| `/investors` | InvestorsPage | Investor information |
| `/privacy` | PrivacyPage | Privacy policy |
| `/terms` | TermsPage | Terms of service |
| `/news` | NewsPage | Health news |
| `/research` | ResearchDashboard | AI health research |
| `/dashboard` | Redirects → `/overview` | Dashboard redirect |
| `/overview` | DashboardPage (overview) | Health overview |
| `/myprogress` | DashboardPage (myprogress) | Daily progress tracking |
| `/intake` | DashboardPage (intake) | Food intake logging |
| `/fitness` | DashboardPage (fitness) | Workout programs |
| `/coach` | CoachDashboardPage | Coach features |
| `/parent` | DashboardPage (parent) | Family health |
| `/create-meals` | CreateMealsPage | Meal planning |

---

## VHealthSearch.tsx Design

### Component Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VHealthSearch.tsx (1534 lines)                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  STATE (15+ variables)              │  HANDLERS (12+ functions)                 │
│  ─────────────────────              │  ─────────────────────                    │
│  • searchQuery                      │  • handleSearch                           │
│  • isLoading                        │  • handleAnalysisComplete                 │
│  • isUploadModalOpen                │  • handleBarcodeResult                    │
│  • showResults                      │  • handleProductSearchResult              │
│  • currentApiResponse               │  • handleImageAnalysisResult              │
│  • placeholder (rotating)           │  • handleCancelSearch                     │
│  • isListening (voice)              │  • handleClearSearch                      │
│  • isDarkMode                       │  • handleRefresh                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Component Layout (Layered Z-Index)

```tsx
<div className="search-landing">
  {/* LAYER 1: Loading Overlay (z-index highest) */}
  {isLoading && <Spinner overlay={true} onClose={handleCancelSearch} />}
  
  {/* LAYER 2: Authentication (top-right fixed, z-[10002]) */}
  <div className="fixed top-5 right-5 z-[10002]">
    {isAuthenticated ? <UserPreference /> : <MultiAuthLogin />}
  </div>

  {/* LAYER 3: Main Content (centered) */}
  <div className="search-container-centered">
    {/* Logo */}
    <div className="logo-container">
      <img src="/assets/wihylogo.png" onClick={() => navigate('/about')} />
    </div>
    
    {/* Search Input with animated border sweep */}
    <div className="animate-border-sweep ...">
      <textarea placeholder={placeholder} />
      <div className="action-icons">
        {/* Clear | Camera | Voice buttons */}
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="search-buttons-mobile">
      <button onClick={handleSearch}>Analyze Nutrition</button>
      <button onClick={() => navigate('/research')}>Verify With Evidence</button>
    </div>
  </div>
  
  {/* LAYER 4: Results Overlay (conditional) */}
  {showResults && <ResultsPanel />}
  
  {/* LAYER 5: Image Upload Modal */}
  <ImageUploadModal isOpen={isUploadModalOpen} />
  
  {/* LAYER 6: Bottom Navigation (native only) */}
  {PlatformDetectionService.isNative() && <BottomNav />}
</div>
```

---

### Rotating Placeholder Prompts

```typescript
const rotatingPrompts = [
  "Scan food and explain it",
  "Analyze my meals",
  "Create a nutrition plan for me",
  "Build me a workout plan",
  "Review this health claim",
  "Show me my habits over time",
  "Help me improve my health"
];

// Rotate every 4 seconds
useEffect(() => {
  const interval = setInterval(() => {
    setPlaceholder(prev => {
      const nextIndex = (rotatingPrompts.indexOf(prev) + 1) % rotatingPrompts.length;
      return rotatingPrompts[nextIndex];
    });
  }, 4000);
  return () => clearInterval(interval);
}, []);
```

---

## Animated Border Sweep Effect

The search bar features a continuously animated gradient border that sweeps from left to right using WiHY brand colors.

---

### Visual Effect

```
┌──────────────────────────────────────────────────────────────┐
│  🟠 Orange → ⚪ White → ⚫ Silver → 🟢 Green → 🔵 Blue       │
│                    ← sweeps left to right →                  │
│                                                              │
│  [Search input textarea with gradient border animation]     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### The Technique: Border-Box Gradient Masking

This uses a CSS trick that allows animated gradients on rounded borders (which `border-image` cannot do).

---

### Step 1: Create an Invisible Border

```css
border-2 border-transparent
```

Creates a 2px border that's transparent - you can't see it, but it takes up space.

---

### Step 2: Two-Layer Background with Box-Model Clipping

```css
background: 
  linear-gradient(#fff, #fff) padding-box,    /* Layer 1: White fill */
  linear-gradient(90deg, colors...) border-box /* Layer 2: Gradient */
```

| Keyword | What it does |
|---------|--------------|
| `padding-box` | Background stops at the padding edge (doesn't go into border) |
| `border-box` | Background extends into the border area |

**Result:** The white layer covers the content area, but the gradient layer extends into the border - making **only the border** show the gradient.

---

### Step 3: Make the Gradient 2x Wider

```css
backgroundSize: '100% 100%, 200% 100%'
```

| Layer | Size | Purpose |
|-------|------|---------|
| White layer | 100% width | Fills content normally |
| Gradient layer | 200% width | Twice as wide for sweep room |

---

### Step 4: Animate the Position

**Tailwind Config** (`client/tailwind.config.js`):

```javascript
keyframes: {
  'wiH-border-sweep': {
    '0%':   { backgroundPosition: '0 0, 0% 0' },   // Gradient at left
    '100%': { backgroundPosition: '0 0, 200% 0' }, // Gradient at right
  }
},
animation: {
  'border-sweep': 'wiH-border-sweep 2.2s linear infinite'
}
```

---

### Animation Timeline

```
Time 0%:   [🟠⚪⚫🟢🔵................] ← gradient at start
           ├──visible──┤
           
Time 50%:  [.....🟠⚪⚫🟢🔵..........]  ← gradient middle
                ├──visible──┤
                
Time 100%: [................🟠⚪⚫🟢🔵] ← gradient at end  
                       ├──visible──┤

Then loops back to 0%
```

---

### Complete VHealthSearch Implementation

**Location:** `VHealthSearch.tsx` (line ~1155)

```tsx
<div 
  className="relative w-full max-w-[584px] mx-auto my-6 p-0 rounded-3xl 
             bg-white transition-shadow duration-200 
             shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)] 
             animate-border-sweep border-2 border-transparent"
  style={{
    background: `
      linear-gradient(#fff, #fff) padding-box, 
      linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box
    `,
    backgroundSize: '100% 100%, 200% 100%'
  }}
>
  <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
    <textarea 
      value={searchQuery}
      placeholder={placeholder}
      className="w-full min-h-[44px] ... rounded-3xl resize-none"
    />
  </form>
  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
    {/* Clear button */}
    {searchQuery && <button onClick={handleClearSearch}>✕</button>}
    {/* Camera button */}
    <button onClick={() => setIsUploadModalOpen(true)}>📷</button>
    {/* Voice button */}
    <button onClick={handleVoiceInput}>🎤</button>
  </div>
</div>
```

---

### Brand Colors in Gradient

| Hex | Color | Role |
|-----|-------|------|
| `#fa5f06` | 🟠 WiHY Orange | Start |
| `#ffffff` | ⚪ White | Transition |
| `#C0C0C0` | ⚫ Silver/Gray | Middle |
| `#4cbb17` | 🟢 WiHY Green | Main brand |
| `#1a73e8` | 🔵 WiHY Blue | End |

---

### Animation Timing

| Property | Value | Effect |
|----------|-------|--------|
| Duration | `2.2s` | One full sweep |
| Timing | `linear` | Constant speed |
| Iteration | `infinite` | Continuous loop |

---

### Why This Technique?

| Alternative | Problem |
|-------------|---------|
| `border-image` | ❌ Doesn't support `border-radius` |
| Pseudo-elements (::before/::after) | ❌ Complex, harder to animate |
| SVG borders | ❌ Heavier, more markup |
| **This technique** | ✅ Works with rounded corners, pure CSS, GPU-accelerated |

---

## Header.tsx Design

### Component Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Header.tsx (1106 lines)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  TOP BAR                            │  MAIN BAR                                 │
│  ────────                           │  ────────                                 │
│  • HistoryNav (left)                │  • Logo (wihylogohome.png)                │
│  • UserPreference or MultiAuthLogin │  • Search Input (same sweep animation)   │
│    (right)                          │  • Action icons (clear, camera, voice)   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Header Layout

```tsx
<header className="vhealth-header">
  {/* TOP BAR: Navigation + Auth */}
  <div className="vhealth-topbar">
    {/* Left: History navigation */}
    <HistoryNav />
    
    {/* Right: Auth state */}
    {isAuthenticated ? <UserPreference /> : <MultiAuthLogin />}
  </div>
  
  {/* MAIN BAR: Logo + Search */}
  <div className="vhealth-mainbar">
    {/* Logo */}
    <img src="/assets/wihylogohome.png" onClick={handleLogoClick} />
    
    {/* Search Input (same border sweep as VHealthSearch) */}
    <div className="search-input-container" style={{...borderSweepStyles}}>
      <textarea placeholder="Ask anything about health..." />
      <div className="search-icons">
        {/* Clear | Camera | Voice */}
      </div>
    </div>
  </div>
</header>
```

---

### Header Border Sweep (JavaScript Animation)

The Header uses JavaScript-based animation for more reliable cross-browser support:

```typescript
useEffect(() => {
  const container = document.querySelector('.vhealth-header .search-input-container');
  if (container) {
    // Set up base styles
    container.style.setProperty('border', '2px solid transparent', 'important');
    container.style.setProperty('background', `
      linear-gradient(#fff, #fff) padding-box,
      linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box
    `, 'important');
    container.style.setProperty('background-size', '100% 100%, 200% 100%', 'important');
    
    // JavaScript animation loop
    let position = 0;
    const animate = () => {
      position += 1;
      if (position >= 200) position = 0;
      container.style.setProperty('background-position', `0 0, ${position}% 0`, 'important');
      requestAnimationFrame(animate);
    };
    animate();
  }
}, []);
```

---

### Header Height Measurement

Dynamic header height for proper body offset:

```typescript
useLayoutEffect(() => {
  const header = document.querySelector('header.vhealth-header');
  if (!header) return;

  const apply = () => {
    const h = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--vh-header-height', `${h}px`);
  };

  apply();
  
  // Update on resize
  const ro = new ResizeObserver(apply);
  ro.observe(header);
  window.addEventListener('resize', apply);

  return () => {
    window.removeEventListener('resize', apply);
    ro.disconnect();
  };
}, []);
```

---

### Header Props Interface

```typescript
interface HeaderProps {
  searchQuery?: string;
  onSearchSubmit?: (query: string) => void;
  onVoiceInput?: () => void;
  onImageUpload?: () => void;
  onLogoClick?: () => void;
  isListening?: boolean;
  showSearchInput?: boolean;
  variant?: 'landing' | 'results';
  className?: string;
  showLogin?: boolean;
  onChatMessage?: (query: string, response: any) => void;
  isInChatMode?: boolean;
  showProgressMenu?: boolean;
  onProgressMenuClick?: () => void;
  sessionId?: string;
}
```

---

## Tailwind Configuration

**File:** `client/tailwind.config.js`

### Brand Colors

```javascript
colors: {
  'vh-accent': '#1a73e8',
  'vh-accent-2': '#34a853',
  'vh-ink': '#202124',
  'vh-muted': '#5f6368',
  'vh-surface': '#ffffff',
  'wihy-green': '#4cbb17',
  'wihy-orange': '#fa5f06',
  'wihy-blue-light': '#f8faff',
  primary: '#1a73e8',
  secondary: '#34a853',
}
```

---

### Animations

```javascript
animation: {
  'fade-in': 'fadeIn 0.6s ease-out forwards',
  'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
  'slide-up': 'slideUp 0.6s ease-out forwards',
  'typing': 'typing 1.4s ease-in-out infinite',
  'spin': 'spin 1s linear infinite',
  'border-sweep': 'wiH-border-sweep 2.2s linear infinite',
}
```

---

### Custom Shadows

```javascript
boxShadow: {
  'vh-ring': '0 0 0 3px rgba(26,115,232,.18)',
  'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
  'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  'wihy': '0 25px 50px rgba(0, 0, 0, 0.4)',
  'green': '0 10px 25px rgba(76, 187, 23, 0.45)',
}
```

---

## CSS Architecture

### File Structure

```
client/src/styles/
├── VHealthSearch.css      # Main entry point (imports all)
├── base.css               # CSS variables, resets
├── buttons.css            # Button components
├── cards.css              # Card components
├── modals.css             # Modal dialogs
├── Dashboard.css          # Dashboard layouts
├── charts.css             # Chart components
├── chat-overlay.css       # FullScreenChat styling
├── search-components.css  # Search UI elements
├── responsive.css         # Media queries
├── mobile-fixes.css       # Mobile-specific fixes
└── utilities.css          # Helper classes
```

---

### CSS Import Chain

```css
/* VHealthSearch.css - Main entry point */
@import './base.css';
@import '../components/shared/MultiAuthLogin.css';
@import './search-components.css';
@import './buttons.css';
@import './results-page.css';
@import './cards.css';
@import './modals.css';
@import './responsive.css';
@import './utilities.css';
@import './mobile-fixes.css';
@import '../components/shared/Header.css';  /* Last for override priority */
```

---

## Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | `< 768px` | Phones |
| Tablet | `768px - 1024px` | Tablets |
| Desktop | `> 1024px` | Desktop browsers |

---

**Last Updated**: January 12, 2026  
**Component Root**: `client/src/components/`  
**Styles Root**: `client/src/styles/`
