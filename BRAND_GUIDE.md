# WiHY Brand Guide

## Color Palette

### Primary Brand Colors

#### WiHY Orange
- **Primary Orange**: `#fa5f06`
  - Usage: Primary brand color, buttons, accents, borders
  - RGB: `rgb(250, 95, 6)`
  - Components: Search inputs, CTAs, highlights

#### WiHY Kelly Green
- **Kelly Green**: `#4cbb17`
  - Usage: Success states, excellent health scores, positive indicators
  - RGB: `rgb(76, 187, 23)`
  - Components: Health score badges (85-100), success messages, positive highlights
  - Also used in: Chart availability indicators, NOVA 1 badges

### Background Colors

#### Light Blue (Primary Page Background)
- **Color**: `#e0f2fe`
  - Usage: **STANDARD for all new pages** - Main page background, content areas
  - RGB: `rgb(224, 242, 254)`
  - Components: Dashboard, SearchResults, NutritionFacts, ProductScanView
  - Description: Very light blue with subtle warmth
  - **Pattern**: Use this as the default background for all new page designs

#### Slate-50 (Deprecated - Legacy Content)
- **Color**: `#f8fafc`
  - Tailwind: `bg-slate-50`
  - Usage: [!] Legacy use only - being phased out
  - RGB: `rgb(248, 250, 252)`
  - Note: Previously used in content areas, now replaced by #e0f2fe

#### Pure White
- **Color**: `#ffffff`
  - Usage: Headers, navigation bars, cards, input fields, modals
  - RGB: `rgb(255, 255, 255)`
  - Components: Top navigation bars, header sections, card containers, modal backgrounds
  - **Pattern**: Use for UI elements that sit on top of the #e0f2fe background

### Text Colors

#### Gray Scale
- **Dark Gray (Primary Text)**: `#1f2937`
  - Tailwind: `text-gray-800`
  - Usage: Headings, primary content text
  
- **Medium Gray (Secondary Text)**: `#6b7280`
  - Tailwind: `text-gray-500`
  - Usage: Secondary text, placeholders, no-results messages
  - Used in: Dashboard.css `.no-results-container`

- **Light Gray (Tertiary Text)**: `#9ca3af`
  - Tailwind: `text-gray-400`
  - Usage: Timestamps, metadata, disabled states

### Accent Colors

#### Light Blue (Page Background)
- **Light Blue**: `#e0f2fe`
  - Usage: **PRIMARY** page background color - standard for all pages
  - RGB: `rgb(224, 242, 254)`
  - Hex: `#e0f2fe`
  - Description: Soft, calming blue background that provides subtle color while maintaining readability

#### Success Green
- **Emerald**: `#10b981`
  - Tailwind: `bg-emerald-500`
  - Usage: Success indicators, chart availability dots, positive highlights

#### Health Score Colors
- **Excellent (Kelly Green)**: `#4cbb17` - Score 85-100
- **Good (Light Green)**: `#85c24b` - Score 70-84
- **Fair (Yellow)**: `#f4c430` - Score 50-69
- **Poor (Orange)**: `#fa8532` - Score 30-49
- **Bad (Red)**: `#e74c3c` - Score 0-29

### Border Colors

#### Subtle Borders
- **Light Gray Border**: `#e5e7eb`
  - Tailwind: `border-gray-200`
  - Usage: Dividers, card borders, subtle separators

- **Medium Gray Border**: `#d1d5db`
  - Tailwind: `border-gray-300`
  - Usage: Inputs, stronger separators

### Shadow Colors

#### Box Shadows
- **Orange Glow**: `rgba(250, 95, 6, 0.1)` - Subtle
- **Orange Glow (Focus)**: `rgba(250, 95, 6, 0.25)` - Emphasized
- **Black Shadow**: `rgba(0, 0, 0, 0.1)` - Default elevation
- **Black Shadow (Backdrop)**: `rgba(0, 0, 0, 0.5)` - Modal overlays

### Component-Specific Colors

#### NOVA Group Badges
- **NOVA 1 (Unprocessed)**: `#4cbb17` - Kelly Green
- **NOVA 2 (Processed)**: `#85c24b` - Light green
- **NOVA 3 (Processed)**: `#f4c430` - Yellow
- **NOVA 4 (Ultra-processed)**: `#e74c3c` - Red

#### Nutrition Score Grades
- **Grade A**: `#4cbb17` - Excellent (Kelly Green)
- **Grade B**: `#85c24b` - Good
- **Grade C**: `#f4c430` - Average
- **Grade D**: `#fa8532` - Below Average
- **Grade E**: `#e74c3c` - Poor

## Typography

### Font Family
- **Primary**: System font stack
  ```css
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  ```

### Font Sizes (Mobile First)

#### Mobile
- **Small**: `11px` - Fine print, timestamps
- **Regular**: `14px` - Body text
- **Medium**: `16px` - Inputs, important text
- **Large**: `18px` - Section headers
- **XL**: `20px` - Page titles

#### Desktop
- **Small**: `12px` - Fine print
- **Regular**: `16px` - Body text
- **Medium**: `18px` - Inputs
- **Large**: `20px` - Section headers
- **XL**: `24px` - Page titles

### Font Weights
- **Regular**: `400` - Body text
- **Medium**: `500` - Emphasized text
- **Semibold**: `600` - Subheadings
- **Bold**: `700` - Headings

## Spacing

### Padding/Margin Scale
- **xs**: `4px`
- **sm**: `8px`
- **md**: `12px`
- **lg**: `16px`
- **xl**: `20px`
- **2xl**: `24px`
- **3xl**: `32px`

### Component Spacing
- **Mobile Padding**: `16px` (sides), `12px` (vertical)
- **Desktop Padding**: `24px` (sides), `16px` (vertical)
- **Card Gap**: `16px`
- **Section Gap**: `24px`

## Border Radius

### Rounded Corners
- **Small**: `8px` - Buttons, small cards
- **Medium**: `12px` - Standard cards
- **Large**: `16px` - Large cards, modals
- **XL**: `20px` - Feature cards
- **Full**: `24px`+ - Pills, search inputs

### Component-Specific
- **Search Input**: `28px`
- **Buttons**: `16px`
- **Cards**: `12px`
- **Badges**: `12px`

## Z-Index Layers

### Layer Hierarchy
- **Base Content**: `1`
- **Sticky Headers**: `100`
- **Dropdowns**: `1000`
- **Modals Backdrop**: `9999`
- **Modals Content**: `10000`
- **Toasts/Notifications**: `10001`

## Breakpoints

### Responsive Design
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### Media Queries
```css
/* Mobile First */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

## Animation & Transitions

### Duration
- **Fast**: `0.2s` - Hover states, simple transitions
- **Normal**: `0.3s` - Modal open/close, slides
- **Slow**: `0.5s` - Complex animations

### Easing
- **Standard**: `ease-in-out` - General use
- **Smooth**: `cubic-bezier(0.4, 0, 0.2, 1)` - Material Design

## Accessibility

### Contrast Ratios
- **Primary Text on White**:  WCAG AAA (>7:1)
- **Secondary Text on White**:  WCAG AA (>4.5:1)
- **Orange on White**:  WCAG AA (>4.5:1)

### Touch Targets
- **Minimum Size**: `44x44px` (iOS)
- **Recommended**: `48x48px` (Material Design)

## Usage Examples

### Standard Page Layout Pattern
**All new pages should follow this structure:**

```tsx
// Page container - Light blue background
<div style={{ backgroundColor: '#e0f2fe' }} className="...">
  
  {/* Top Navigation Bar - White background */}
  <div className="bg-white">
    {/* Hamburger menu, chart button, etc. */}
  </div>
  
  {/* Header Section - White background */}
  <div className="bg-white">
    {/* Title, toggle pills, etc. */}
  </div>
  
  {/* Main Content Area - Light blue background */}
  <div style={{ backgroundColor: '#e0f2fe' }}>
    {/* White cards with content */}
    <div className="bg-white rounded-xl">
      {/* Content */}
    </div>
  </div>
</div>
```

### Primary Actions
```css
background-color: #fa5f06; /* WiHY Orange */
color: #ffffff;
border-radius: 16px;
padding: 12px 24px;
```

### Page Background (Standard Pattern)
```css
background-color: #e0f2fe; /* Light Blue - USE THIS FOR ALL NEW PAGES */
```

### Navigation & Headers
```css
background-color: #ffffff; /* Pure White */
border-bottom: 1px solid #e5e7eb; /* Light gray border */
```

### Content Cards on Light Blue Background
```css
background-color: #10b981; /* Emerald Green */
border: 2px solid #ffffff;
```

### Subtle Borders
```css
border: 1px solid #e5e7eb; /* Light Gray */
```

## Design Patterns

### Page Layout Architecture

All new pages in the WiHY application should follow this standardized layout pattern:

#### 1. Page Container (Outermost Layer)
- **Background**: `#e0f2fe` (Light Blue)
- **Purpose**: Provides subtle colored frame for the entire page
- **Properties**: 
  ```css
  background-color: #e0f2fe;
  position: fixed;
  inset: 0;
  z-index: 10000;
  ```

#### 2. Top Navigation Bar
- **Background**: `#ffffff` (White)
- **Purpose**: Contains navigation controls (hamburger menu, action buttons)
- **Typical Elements**: History toggle, chart button, settings
- **Properties**:
  ```css
  background-color: #ffffff;
  padding: 8px 12px;
  min-height: 40px;
  ```

#### 3. Header Section
- **Background**: `#ffffff` (White)
- **Purpose**: Page title, view mode toggles, key information
- **Typical Elements**: Page title, tab pills, breadcrumbs
- **Properties**:
  ```css
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
  ```

#### 4. Main Content Area
- **Background**: `#e0f2fe` (Light Blue)
- **Purpose**: Scrollable content container
- **Contains**: White cards with actual content
- **Properties**:
  ```css
  background-color: #e0f2fe;
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  ```

#### 5. Content Cards (Within Main Area)
- **Background**: `#ffffff` (White)
- **Purpose**: Individual content sections
- **Properties**:
  ```css
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  margin-bottom: 16px;
  ```

### Implementation Examples

#### React Component Structure
```tsx
<div style={{ backgroundColor: '#e0f2fe' }} className="fixed inset-0 z-[10000] flex flex-col">
  {/* Top Navigation */}
  <div className="bg-white px-3 py-2 min-h-[40px]">
    <button></button>
    {/* Other nav items */}
  </div>

  {/* Header */}
  <div className="bg-white px-4 py-3 border-b border-gray-200">
    <h1>Page Title</h1>
  </div>

  {/* Main Content */}
  <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#e0f2fe' }}>
    <div className="bg-white rounded-xl border border-gray-200 p-4 m-4">
      {/* Content */}
    </div>
  </div>
</div>
```

#### CSS/Inline Styles
```tsx
// Use inline style for the exact blue color
style={{ backgroundColor: '#e0f2fe' }}

// Use Tailwind for white backgrounds
className="bg-white"
```

### Pages Using This Pattern
- [OK] Dashboard (`Dashboard.css`)
- [OK] SearchResults
- [OK] NutritionFacts
- [OK] ProductScanView
- [OK] FullScreenChat (partial - main container)
- [OK] CreateMealsPage (two-column meal builder + shopping outputs)

### Migration Notes
- Legacy `bg-slate-50` (#f8fafc) should be replaced with `#e0f2fe`
- All new pages must use this pattern for consistency
- Existing pages should be gradually migrated to this standard

---

## Additional Usage Examples

### Create Meals Page Pattern
**Two-column layout for meal building and shopping outputs:**

```tsx
// CreateMealsPage - Specialized two-column layout
<div style={{ backgroundColor: '#e0f2fe' }} className="create-meals-page">
  {/* Standard top navigation */}
  <div className="bg-white">
    {/* Back button, title */}
  </div>

  {/* Standard header section */}
  <div className="bg-white border-b">
    {/* Page title, plan selector, goal chips, actions */}
  </div>

  {/* Two-column main content */}
  <div className="main-content grid-cols-2">
    {/* Left: Meal Program Builder */}
    <div className="left-column">
      <MealProgramBuilder />
    </div>
    
    {/* Right: Shopping Outputs */}  
    <div className="right-column">
      <ShoppingOutputs />
    </div>
  </div>
</div>
```

### Specialized Component Colors
```css
/* Kelly Green for success states and prep batches */
background-color: #4cbb17; 

/* Orange for primary meal actions */
background-color: #fa5f06;

/* Success green for Instacart and positive actions */
background-color: #10b981;
```

### Subtle Borders

---

**Last Updated**: December 4, 2025  
**Version**: 1.0  
**Maintained By**: WiHY Development Team
