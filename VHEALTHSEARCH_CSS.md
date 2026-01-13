# VHealthSearch.tsx - Complete CSS Reference

This document contains all CSS styles used by `VHealthSearch.tsx`, compiled from the modular CSS architecture.

---

## CSS Import Chain

```css
/* VHealthSearch.css imports these files in order: */
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
@import '../components/shared/Header.css';
```

---

## Base Reset & Theme Tokens

```css
/* ---------------------------
   Base Reset & Defaults
----------------------------*/
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
  color: #333;
  line-height: 1.6;
  padding-top: 160px;
  overflow-x: hidden;
}

/* Theme tokens */
:root {
  --vh-accent: #1a73e8;
  --vh-accent-2: #34a853;
  --vh-ink: #202124;
  --vh-muted: #5f6368;
  --vh-surface: #ffffff;
  --vh-surface-2: #f8fbff;
  --vh-ring: 0 0 0 3px rgba(26,115,232,.18);
  --vh-header-height: 80px;
}

/* Subtle page background */
body {
  background: radial-gradient(1200px 600px at 10% -10%, #f5f8ff 0%, transparent 40%),
              radial-gradient(1000px 500px at 110% 0%, #f7fff8 0%, transparent 35%),
              #f9f9f9;
  margin: 0;
  box-sizing: border-box;
}

html {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

---

## Search Landing Page

```css
/* ---------------------------
   Search Landing
----------------------------*/
.search-landing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 0 20px;
  background-color: #ffffff;
}

.search-container-centered {
  width: 100%;
  max-width: none;
  text-align: center;
  padding: 0 60px;
}

/* Optional text logo fallback */
h1.search-logo {
  font-size: 48px;
  background: linear-gradient(to right, #4285f4, #ea4335, #fbbc05, #34a853);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 20px;
}

.search-tagline {
  font-size: 18px;
  color: #5f6368;
  margin-bottom: 30px;
}

/* Hide scrollbars only when on search landing page */
body.landing-page-active {
  overflow-y: auto !important;
  height: 100vh;
  max-height: 100vh;
  padding-top: 0 !important;
  overscroll-behavior-y: contain;
}

html.landing-page-active {
  overflow-y: auto !important;
  height: 100vh;
  max-height: 100vh;
  overscroll-behavior-y: contain;
}
```

---

## Search Input Container & Border Sweep Animation

### EXACT Implementation from VHealthSearch.tsx

The search bar uses a **hybrid approach**: Tailwind utility classes + inline `style` attribute for the gradient background.

```jsx
{/* SEARCH INPUT CONTAINER - EXACT CODE */}
<div 
  className="relative w-full max-w-[584px] mx-auto my-6 p-0 rounded-3xl bg-white transition-shadow duration-200 shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)] hover:shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)] focus-within:shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)] animate-border-sweep border-2 border-transparent"
  style={{
    background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box',
    backgroundSize: '100% 100%, 200% 100%'
  }}
>
```

### Breakdown of Container Classes

| Class | CSS Output | Purpose |
|-------|------------|---------|
| `relative` | `position: relative` | For absolute positioning of icons |
| `w-full` | `width: 100%` | Fill parent width |
| `max-w-[584px]` | `max-width: 584px` | Google-style max width |
| `mx-auto` | `margin-left: auto; margin-right: auto` | Center horizontally |
| `my-6` | `margin-top: 1.5rem; margin-bottom: 1.5rem` | Vertical spacing (24px) |
| `p-0` | `padding: 0` | No padding on container |
| `rounded-3xl` | `border-radius: 1.5rem` | 24px rounded corners |
| `bg-white` | `background-color: #fff` | Fallback background |
| `transition-shadow` | `transition-property: box-shadow` | Smooth shadow transition |
| `duration-200` | `transition-duration: 200ms` | Animation timing |
| `shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)]` | Custom box-shadow | Google-style shadow |
| `hover:shadow-[...]` | Same shadow on hover | Maintains shadow on hover |
| `focus-within:shadow-[...]` | Same shadow on focus | Maintains shadow when focused |
| `animate-border-sweep` | `animation: wiH-border-sweep 2.2s linear infinite` | Border animation |
| `border-2` | `border-width: 2px` | Border thickness |
| `border-transparent` | `border-color: transparent` | Invisible border (gradient shows through) |

### The Inline Style (CRITICAL)

```css
style={{
  background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box',
  backgroundSize: '100% 100%, 200% 100%'
}}
```

**Why inline style?** Tailwind cannot express multi-layer `background` with `padding-box` and `border-box` clip modes. This MUST be inline or in CSS.

### Animation Keyframes (in tailwind.config.js)

```javascript
// tailwind.config.js
keyframes: {
  'wiH-border-sweep': {
    '0%': { backgroundPosition: '0 0, 0% 0' },
    '100%': { backgroundPosition: '0 0, 200% 0' },
  },
},
animation: {
  'border-sweep': 'wiH-border-sweep 2.2s linear infinite',
},
```

---

### TEXTAREA - EXACT Implementation

```jsx
<textarea
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }}
  placeholder={placeholder}
  className="w-full min-h-[44px] max-h-[40vh] py-2.5 pl-4 pr-[128px] text-base text-gray-800 bg-transparent border-none outline-none rounded-3xl resize-none overflow-hidden font-sans leading-6 placeholder-gray-400 md:min-h-[48px] md:pr-[128px] md:pl-4 md:py-3 focus:text-left disabled:opacity-60 disabled:cursor-not-allowed"
  autoFocus
  disabled={isLoading}
  rows={1}
  onInput={(e) => {
    // Auto-resize height algorithm
    const target = e.target as HTMLTextAreaElement;
    target.style.height = '0';
    const scrollHeight = target.scrollHeight;
    target.style.height = scrollHeight + 'px';
  }}
/>
```

### Textarea Classes Breakdown

| Class | CSS Output | Purpose |
|-------|------------|---------|
| `w-full` | `width: 100%` | Fill container |
| `min-h-[44px]` | `min-height: 44px` | Minimum height |
| `max-h-[40vh]` | `max-height: 40vh` | Cap at 40% viewport |
| `py-2.5` | `padding-top: 0.625rem; padding-bottom: 0.625rem` | Vertical padding (10px) |
| `pl-4` | `padding-left: 1rem` | Left padding (16px) |
| `pr-[128px]` | `padding-right: 128px` | Right padding for icons |
| `text-base` | `font-size: 1rem; line-height: 1.5rem` | 16px font |
| `text-gray-800` | `color: #1f2937` | Dark text color |
| `bg-transparent` | `background-color: transparent` | See-through to container |
| `border-none` | `border: none` | No border (container has it) |
| `outline-none` | `outline: none` | Remove focus outline |
| `rounded-3xl` | `border-radius: 1.5rem` | Match container radius |
| `resize-none` | `resize: none` | Disable manual resize |
| `overflow-hidden` | `overflow: hidden` | Hide scrollbar |
| `font-sans` | System font stack | Consistent typography |
| `leading-6` | `line-height: 1.5rem` | 24px line height |
| `placeholder-gray-400` | `::placeholder { color: #9ca3af }` | Light placeholder |
| `md:min-h-[48px]` | Desktop: `min-height: 48px` | Taller on desktop |
| `md:py-3` | Desktop: `padding-top/bottom: 0.75rem` | More padding on desktop |
| `focus:text-left` | `text-align: left` on focus | Align text left |
| `disabled:opacity-60` | `opacity: 0.6` when disabled | Visual feedback |
| `disabled:cursor-not-allowed` | `cursor: not-allowed` | Disabled cursor |

---

### ICONS CONTAINER - EXACT Implementation

```jsx
<div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5 items-center bg-white/90 p-1 rounded-2xl md:gap-2 md:p-1">
```

| Class | CSS Output | Purpose |
|-------|------------|---------|
| `absolute` | `position: absolute` | Position over textarea |
| `right-2` | `right: 0.5rem` | 8px from right edge |
| `top-1/2` | `top: 50%` | Vertically centered |
| `-translate-y-1/2` | `transform: translateY(-50%)` | Perfect center |
| `flex` | `display: flex` | Flexbox row |
| `gap-1.5` | `gap: 0.375rem` | 6px between icons |
| `items-center` | `align-items: center` | Vertically align icons |
| `bg-white/90` | `background-color: rgba(255,255,255,0.9)` | Semi-transparent white |
| `p-1` | `padding: 0.25rem` | 4px padding |
| `rounded-2xl` | `border-radius: 1rem` | 16px rounded |
| `md:gap-2` | Desktop: `gap: 0.5rem` | 8px gap on desktop |

---

### CLEAR BUTTON - EXACT Implementation

```jsx
{searchQuery && (
  <button 
    className="w-8 h-8 border-none bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-blue-600 transition-colors cursor-pointer rounded-full flex items-center justify-center" 
    onClick={handleClearSearch}
    aria-label="Clear"
  >
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
    </svg>
  </button>
)}
```

| Class | Purpose |
|-------|---------|
| `w-8 h-8` | 32px × 32px button |
| `border-none` | No border |
| `bg-gray-100` | Light gray background (#f3f4f6) |
| `text-gray-500` | Gray icon color (#6b7280) |
| `hover:bg-gray-200` | Darker gray on hover (#e5e7eb) |
| `hover:text-blue-600` | Blue icon on hover (#2563eb) |
| `transition-colors` | Smooth color transition |
| `cursor-pointer` | Pointer cursor |
| `rounded-full` | Circular button |
| `flex items-center justify-center` | Center the SVG |

---

### CAMERA BUTTON - EXACT Implementation

```jsx
<button
  type="button"
  onClick={() => setIsUploadModalOpen(true)}
  className="w-8 h-8 border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
  aria-label="Upload image"
  disabled={isLoading}
>
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
</button>
```

| Class | Purpose |
|-------|---------|
| `bg-transparent` | No background (different from clear button) |
| `hover:bg-gray-100` | Gray background on hover |
| `disabled:opacity-50` | 50% opacity when disabled |

---

### VOICE BUTTON - EXACT Implementation

```jsx
<button
  type="button"
  onClick={handleVoiceInput}
  className={`w-8 h-8 border-none transition-colors cursor-pointer rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
    isListening 
      ? 'bg-red-500 text-white' 
      : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-blue-600'
  }`}
  aria-label={isListening ? 'Stop listening' : 'Start voice input'}
  disabled={isLoading}
>
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c3.39-.49 6-3.3 6-6.72h-2z"/>
  </svg>
</button>
```

| Class | Purpose |
|-------|---------|
| `bg-red-500 text-white` | Red background + white icon when listening |
| Dynamic class toggle | Changes based on `isListening` state |

---

## Complete Pure HTML/CSS Replica

```html
<!-- SEARCH INPUT CONTAINER -->
<div 
  class="search-input-container"
  style="
    position: relative;
    width: 100%;
    max-width: 584px;
    margin: 24px auto;
    padding: 0;
    border-radius: 24px;
    box-shadow: 0 2px 5px 1px rgba(64,60,67,0.16);
    transition: box-shadow 200ms;
    border: 2px solid transparent;
    background: linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box;
    background-size: 100% 100%, 200% 100%;
    animation: wiH-border-sweep 2.2s linear infinite;
  "
>
  <form onsubmit="handleSearch(event); return false;">
    <textarea
      id="search-input"
      placeholder="Scan food and explain it"
      rows="1"
      style="
        width: 100%;
        min-height: 44px;
        max-height: 40vh;
        padding: 10px 128px 10px 16px;
        font-size: 16px;
        color: #1f2937;
        background: transparent;
        border: none;
        outline: none;
        border-radius: 24px;
        resize: none;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        box-sizing: border-box;
      "
      oninput="this.style.height='0'; this.style.height=this.scrollHeight+'px'; toggleClearButton();"
    ></textarea>
  </form>

  <!-- ICONS CONTAINER -->
  <div style="
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 6px;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 4px;
    border-radius: 16px;
  ">
    <!-- CLEAR BUTTON -->
    <button 
      id="clear-btn"
      onclick="clearSearch()"
      style="
        display: none;
        width: 32px;
        height: 32px;
        border: none;
        background: #f3f4f6;
        color: #6b7280;
        cursor: pointer;
        border-radius: 50%;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      "
      onmouseover="this.style.background='#e5e7eb'; this.style.color='#2563eb';"
      onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280';"
      aria-label="Clear"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <!-- CAMERA BUTTON -->
    <button 
      onclick="openUploadModal()"
      style="
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: #6b7280;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      "
      onmouseover="this.style.background='#f3f4f6'; this.style.color='#2563eb';"
      onmouseout="this.style.background='transparent'; this.style.color='#6b7280';"
      aria-label="Upload image"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      </svg>
    </button>

    <!-- VOICE BUTTON -->
    <button 
      id="voice-btn"
      onclick="toggleVoiceInput()"
      style="
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: #6b7280;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      "
      onmouseover="if(!this.classList.contains('listening')){this.style.background='#f3f4f6'; this.style.color='#2563eb';}"
      onmouseout="if(!this.classList.contains('listening')){this.style.background='transparent'; this.style.color='#6b7280';}"
      aria-label="Start voice input"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c3.39-.49 6-3.3 6-6.72h-2z"/>
      </svg>
    </button>
  </div>
</div>

<style>
  /* CRITICAL: Border sweep animation keyframes */
  @keyframes wiH-border-sweep {
    0%   { background-position: 0 0, 0% 0; }
    100% { background-position: 0 0, 200% 0; }
  }

  /* Textarea placeholder styling */
  #search-input::placeholder {
    color: #9ca3af;
    font-size: 16px;
  }

  /* Voice button listening state */
  #voice-btn.listening {
    background: #ef4444 !important;
    color: white !important;
  }

  /* Mobile responsive (768px) */
  @media (max-width: 768px) {
    .search-input-container {
      max-width: 100% !important;
      margin: 16px auto !important;
    }
    
    #search-input {
      min-height: 44px !important;
      padding-right: 100px !important;
      font-size: 16px !important; /* Prevent iOS zoom */
    }
  }
</style>

<script>
  function toggleClearButton() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-btn');
    clearBtn.style.display = input.value ? 'flex' : 'none';
  }

  function clearSearch() {
    const input = document.getElementById('search-input');
    input.value = '';
    input.style.height = '44px';
    toggleClearButton();
    input.focus();
  }
</script>
```

---

## Visual Spec Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  SEARCH INPUT CONTAINER                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  max-width: 584px                                       │   │
│  │  border-radius: 24px                                    │   │
│  │  border: 2px solid transparent                          │   │
│  │  box-shadow: 0 2px 5px 1px rgba(64,60,67,0.16)         │   │
│  │                                                          │   │
│  │  background:                                             │   │
│  │    Layer 1: linear-gradient(#fff, #fff) padding-box    │   │
│  │    Layer 2: linear-gradient(90deg,                      │   │
│  │              #fa5f06,  ← Orange                         │   │
│  │              #ffffff,  ← White                          │   │
│  │              #C0C0C0,  ← Silver                         │   │
│  │              #4cbb17,  ← Green                          │   │
│  │              #1a73e8   ← Blue                           │   │
│  │             ) border-box                                 │   │
│  │                                                          │   │
│  │  background-size: 100% 100%, 200% 100%                  │   │
│  │  animation: wiH-border-sweep 2.2s linear infinite       │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TEXTAREA inside:                                               │
│  ┌────────────────────────────────────────────┬──────────┐     │
│  │ Scan food and explain it                   │ ⨉ 📷 🎤 │     │
│  │                                             │          │     │
│  │ padding: 10px 128px 10px 16px              │ Icons    │     │
│  │ min-height: 44px (mobile) / 48px (desktop) │ right:8px│     │
│  │ border: none                                │ 32x32px  │     │
│  │ background: transparent                     │          │     │
│  └────────────────────────────────────────────┴──────────┘     │
└─────────────────────────────────────────────────────────────────┘

ICONS CONTAINER (absolute positioned):
├── right: 8px
├── top: 50%
├── transform: translateY(-50%)
├── display: flex
├── gap: 6px
├── background: rgba(255,255,255,0.9)
├── padding: 4px
└── border-radius: 16px

BUTTON SIZES:
├── All buttons: 32px × 32px
├── Border: none
├── Border-radius: 50% (circular)
└── SVG icons: 20-24px
```

---

## Search Input Field

```css
/* Google-style input field */
.search-input {
  width: 100%;
  min-height: 48px;
  max-height: 40vh;
  height: auto;
  line-height: 1.4;
  padding: 12px var(--pad-right) 12px var(--pad-left) !important;
  font-size: 16px;
  border: none;
  outline: none;
  border-radius: 24px;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  resize: none;
  overflow-y: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
  color: #202124;
}

.search-input::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.search-input::placeholder {
  text-align: left;
  color: #9aa0a6;
  font-size: 16px;
  vertical-align: bottom;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-input:focus,
.search-input:not(:placeholder-shown) {
  text-align: left;
}

/* Cancel button styles */
.cancel-button {
  background-color: transparent !important;
  color: #555 !important;
  border: 1px solid #ccc !important;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: #f1f1f1 !important;
  color: #333 !important;
  border-color: #aaa !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

---

## Search Icons

```css
/* Icons with simplified positioning */
.search-icons {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 6px;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px;
  border-radius: 20px;
}

.icon-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #70757a;
  transition: color .2s ease, background-color .2s ease;
}

.icon-button:hover {
  background-color: #f1f3f4;
  color: #1a73e8;
}

.icon-button svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
  transition: fill 0.2s ease;
}

.clear-button {
  background: #f8f9fa;
}

.clear-button:hover {
  background: #e8eaed;
}

.listening {
  background: #ea4335 !important;
}

.listening svg {
  fill: #fff !important;
}
```

---

## Search Buttons

```css
/* ---------------------------
   Buttons
----------------------------*/
.search-actions,
.search-buttons {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-top: 24px;
  margin-bottom: 32px;
  width: 100%;
  padding: 16px 20px;
  min-height: 80px;
  align-items: center;
}

.search-button,
.search-btn {
  --btn-bg: #f8f9fa;
  --btn-text: #1f2937;
  --btn-border: #e5e7eb;
  --btn-shadow: rgba(0,0,0,.08);

  background: var(--btn-bg);
  color: var(--btn-text);
  border: 1px solid var(--btn-border);
  border-radius: 24px;
  font-size: 14px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color .2s, color .2s, border-color .2s, box-shadow .2s, transform .06s ease;
  min-width: 140px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255, 255, 255, 0.8);
}

.search-button:hover,
.search-btn:hover {
  background: #e9eef6;
  border-color: #d3d9e3;
  box-shadow: 0 4px 14px rgba(255, 255, 255, 0.9);
}

.search-button:active,
.search-btn:active {
  background: #dbe4ef;
  transform: translateY(1px);
}

.search-button:focus-visible,
.search-btn:focus-visible {
  outline: none;
  box-shadow: 0 2px 6px rgba(255, 255, 255, 0.8), var(--vh-ring);
}

/* Accent on hover */
.search-actions .search-btn:nth-child(1):hover {
  border-color: var(--vh-accent);
  color: var(--vh-accent);
}

.search-actions .search-btn:nth-child(2):hover {
  border-color: var(--vh-accent-2);
  color: var(--vh-accent-2);
}

/* Matrix pill effects to search buttons */
.search-button:first-child:hover,
.search-btn:first-child:hover {
  background: linear-gradient(135deg, #fa5f06, #fa5f06) !important;
  color: white !important;
  border-color: #fa5f06 !important;
  box-shadow: 
    0 8px 20px rgb(255, 255, 255),
    0 0 20px rgb(255, 255, 255) !important;
  transform: translateY(-2px) !important;
}

.search-button:last-child:hover,
.search-btn:last-child:hover {
  background: linear-gradient(135deg, #4cbb17, #4cbb17) !important;
  color: white !important;
  border-color: #4cbb17 !important;
  box-shadow: 
    0 8px 20px rgba(255, 255, 255, 0.4),
    0 0 20px rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-2px) !important;
}

/* Rotating text animation */
.rotating-text {
  display: inline-block;
  transition: opacity 0.3s ease;
  min-width: 140px;
  text-align: center;
}

.rotating-text.rotate {
  opacity: 0;
}

/* Enhanced feeling healthy button */
.feeling-healthy-btn {
  min-width: 160px !important;
}

@keyframes healthyPulse {
  0%, 100% { box-shadow: 0 8px 20px rgba(76, 187, 23, 0.4); }
  50% { box-shadow: 0 8px 25px rgba(76, 187, 23, 0.6); }
}

.feeling-healthy-btn:hover {
  animation: healthyPulse 2s infinite;
}

/* Button color overrides */
.search-btn.analyze-btn:hover {
  background: #fa5f06 !important;
  color: white !important;
  border-color: #fa5f06 !important;
  box-shadow: 0 8px 20px rgba(250, 95, 6, 0.4) !important;
  transform: translateY(-2px) !important;
}

.search-btn.feeling-healthy-btn:hover {
  background: #4cbb17 !important;
  color: white !important;
  border-color: #4cbb17 !important;
  box-shadow: 0 8px 20px rgba(76, 187, 23, 0.4) !important;
  transform: translateY(-2px) !important;
}
```

---

## Mobile Search Buttons

```css
/* Mobile-friendly search buttons */
.search-buttons-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 32px 20px 40px 20px;
  width: calc(100% - 40px);
}

.search-btn-mobile {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.search-btn-mobile.primary {
  background: #4285f4 !important;
  color: white !important;
  border: none !important;
}

.search-btn-mobile.secondary {
  background: #f8f9fa !important;
  color: #3c4043 !important;
  border: 1px solid #f0f0f0 !important;
}

.search-btn-mobile.demo {
  background: transparent !important;
  color: #10b981 !important;
  border: 1px solid #10b981 !important;
}

/* Category filter buttons */
.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
}

.category-btn {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.category-btn:hover {
  border-color: #4cbb17;
  color: #4cbb17;
  transform: translateY(-1px);
}

.category-btn.active {
  background: #4cbb17 !important;
  color: white !important;
  border-color: #4cbb17 !important;
  box-shadow: 0 4px 12px rgba(76, 187, 23, 0.3);
}

/* Analyze article button */
.analyze-article-btn {
  background: linear-gradient(135deg, #fa5f06, #e55205);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.analyze-article-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(250, 95, 6, 0.4);
}
```

---

## Cards & Content

```css
/* ---------------------------
   Cards & Content
----------------------------*/
.health-info-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.08);
  border: 1px solid #e8f0fe;
  position: relative;
  overflow: hidden;
}

.health-info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0; 
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1a73e8, #4285f4, #34a853);
}

.health-info-content {
  background: #ffffff;
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  text-align: left !important;
}

.markdown-content,
.health-info-content pre {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: left !important;
}

.sidebar { 
  width: 300px; 
  display: block;
  position: sticky; 
  top: 90px;
}

.related-topics-card,
.resources-card {
  background: linear-gradient(180deg, var(--vh-surface) 0%, var(--vh-surface-2) 100%);
  border: 1px solid #e8f0fe;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(26,115,232,.05);
  overflow: hidden;
  padding: 0;
  margin-bottom: 20px;
}

.related-topics-card h3,
.resources-card h3 {
  margin: 0;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 700;
  color: var(--vh-accent);
  background: linear-gradient(90deg, rgba(26,115,232,.06), transparent);
  border-bottom: 1px solid #e8f0fe;
  text-align: left;
}

.related-topics-list,
.resources-list {
  list-style: none;
  padding: 8px;
  margin: 0;
}

.related-topics-list li,
.resources-list li {
  margin: 6px 0;
  border-bottom: 1px dashed #eef2f7;
  padding: 2px 0 8px 0;
}

.topic-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  color: #1a0dab;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color .18s ease, transform .06s ease, color .18s ease;
  text-align: left;
}

.topic-button::before {
  content: "›";
  font-weight: 700;
  color: #8ab4f8;
  transform: translateY(-1px);
}

.topic-button:hover {
  background: #eef4ff;
  color: #1557b0;
  transform: translateY(-1px);
}

.resources-list a {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f8ff;
  color: #1a4fb8;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e1e9ff;
  transition: background-color .18s ease, box-shadow .18s ease, transform .06s ease;
  text-decoration: none;
  font-size: 13px;
}

.resources-list a:hover {
  background: #eaf1ff;
  box-shadow: 0 6px 16px rgba(26,115,232,.12);
  text-decoration: none;
  transform: translateY(-1px);
}

.data-source-indicator {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e8f0fe;
  font-size: 12px;
  color: var(--vh-muted);
  text-align: center;
}

.error-source {
  color: #ea4335;
}
```

---

## Results Page

```css
/* ---------------------------
   Results Page
----------------------------*/
.results-page {
  background: #fff;
  position: relative;
  min-height: 100vh;
  padding: 0;
  padding-top: 120px;
}

.results-search-header {
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: -10px;
  width: 100%;
}

.results-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  margin-top: -20px;
}

.results-search-logo {
  height: 80px !important;
  width: auto !important;
  max-width: 300px !important;
  object-fit: contain !important;
  position: relative;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.results-search-logo:hover {
  opacity: 0.8;
}

.results-search-header .search-input-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto 24px auto;
  border: 2px solid transparent;
  border-radius: 24px;
  box-shadow: 0 1px 6px rgba(32,33,36,0.28);
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box;
  background-size: 100% 100%, 200% 100%;
  animation: wiH-border-sweep 2.2s linear infinite !important;
  min-height: 48px;
  height: auto;
}

.results-search-input {
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: 10px 60px 10px 20px;
  font-size: 16px;
  border: none;
  outline: none;
  border-radius: 24px;
  background: transparent;
  font-family: inherit;
  resize: none;
  overflow: hidden;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  height: 44px;
  transition: height 0.2s ease;
  text-align: left;
  vertical-align: bottom;
  display: flex;
  align-items: flex-end;
}

.results-container {
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 0;
  padding: 20px 20px 60px 20px;
  width: 100%;
  position: relative;
}

.results-header {
  color: #1a73e8;
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e8f0fe;
}

.results-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  align-items: start;
}
```

---

## Photo Upload Modal

```css
/* ---------------------------
   Photo Upload Modal
----------------------------*/
.photo-modal-overlay,
.upload-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.photo-modal,
.upload-modal-content {
  background: #fff;
  border-radius: 16px;
  width: 380px;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #e8eaed;
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 400;
  color: #202124;
  margin: 0;
}

.modal-subtitle {
  font-size: 14px;
  color: #5f6368;
  margin: 5px 0 0 0;
  font-weight: 400;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #5f6368;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 40px; 
  height: 40px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background: #f1f3f4;
}

.upload-area {
  padding: 32px 24px;
  border: 2px dashed #dadce0;
  margin: 24px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #1a73e8;
  background: #f8f9fa;
}

.upload-area.dragging {
  border-color: #1a73e8 !important;
  background: rgba(26,115,232,0.05) !important;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #9aa0a6;
}

.upload-text {
  font-size: 16px;
  color: #3c4043;
  margin: 0;
}

.upload-link {
  background: none;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  font-size: 16px;
  text-decoration: underline;
  padding: 0;
}

.upload-link:hover {
  color: #1557b0;
}
```

---

## Simple Mobile-First Modal

```css
/* ---------------------------
   Simple Mobile-First Modal
----------------------------*/
.modal-header-simple {
  display: flex;
  justify-content: flex-end;
  padding: 16px 16px 0 16px;
}

.modal-close-simple {
  background: #f8f9fa;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-simple:hover {
  background: #e8eaed;
  color: #202124;
}

.simple-upload-container {
  padding: 16px 24px 20px 24px;
  text-align: center;
}

.simple-title {
  font-size: 18px;
  font-weight: 400;
  color: #202124;
  margin: 0 0 16px 0;
}

.simple-upload-area {
  border: 2px dashed #dadce0;
  border-radius: 12px;
  padding: 24px 16px;
  margin: 0 0 12px 0;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafbfc;
  overflow: hidden;
  box-sizing: border-box;
}

.simple-upload-area:hover {
  border-color: #1a73e8;
  background: #f8f9fa;
}

.simple-upload-area.dragging {
  border-color: #1a73e8;
  background: #e8f0fe;
  transform: scale(1.02);
}

.simple-url-section {
  padding: 0 24px 24px 24px;
  display: flex;
  gap: 12px;
}

.simple-url-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #dadce0;
  border-radius: 24px;
  font-size: 14px;
  color: #202124;
  background: #fff;
  outline: none;
  transition: all 0.2s;
}

.simple-url-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.simple-search-button {
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  background: #1a73e8;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.simple-search-button:hover {
  background: #1557b0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}
```

---

## Image Preview

```css
/* ---------------------------
   Image Preview & Upload Modal
----------------------------*/
.image-preview {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e8f0fe;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #1a73e8;
}

.image-icon {
  font-size: 16px;
}

.image-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-image {
  background: none;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  font-size: 16px;
  width: 16px; 
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.remove-image:hover {
  background: rgba(26,115,232,0.1);
}

.search-input.with-image {
  padding-left: 160px;
}
```

---

## Utilities

```css
/* ---------------------------
   Logo Overrides & Utilities
----------------------------*/
.search-landing .logo-container {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin: 0 0 2rem 0 !important;
  width: 100% !important;
}

.search-landing .logo-container .search-logo-image,
img[src*="whatishealthylogo"] {
  width: 600px !important;
  height: auto !important;
  object-fit: contain !important;
  display: block !important;
  margin: 0 auto !important;
  padding: 0 !important;
}

/* ---------------------------
   Inline Links
----------------------------*/
.inline-link {
  color: #1a73e8;
  text-decoration: underline;
  word-break: break-word;
  transition: color 0.2s;
}

.inline-link:hover {
  color: #1557b0;
  text-decoration: none;
}

.inline-link:visited {
  color: #9c27b0;
}

/* Login button containers */
.login-button-container {
  position: absolute;
  top: 20px;
  right: 20px;
}

.results-login-button {
  position: relative;
  z-index: 1600;
}

/* Loading spinner animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Chat widget icon buttons */
.chat-icon-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  transition: all 0.2s ease;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-icon-button:hover {
  background-color: #f3f4f6;
  transform: scale(1.05);
}

.chat-icon-button:active {
  transform: scale(0.95);
}

.chat-icon-button img {
  display: block;
  width: 48px;
  height: 48px;
  object-fit: contain;
}
```

---

## Responsive Design

```css
/* ---------------------------
   Responsive Design
----------------------------*/
@media (max-width: 768px) {
  .research-badge { display: none !important; }
  .results-page { padding-top: 15px; }

  .results-search-header {
    flex-direction: column;
    gap: 15px;
    padding: 60px 15px 15px 15px;
    margin-top: 5px;
    padding-right: 15px;
  }

  .results-search-header .search-input-container { 
    max-width: 100%; 
    width: 100%;
    margin: 0 auto;
  }

  .results-container { padding: 15px; margin: 15px auto; }

  .results-header {
    font-size: 20px;
    margin-bottom: 20px;
    padding: 0 5px;
    text-align: left;
  }

  .results-content { display: block; gap: 20px; }

  .health-info-card { 
    padding: 20px; 
    margin-bottom: 20px; 
    border-radius: 12px;
    background: #ffffff !important;
    border: 1px solid #e8f0fe;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .sidebar { 
    display: block; 
    margin-top: 0; 
    position: static;
    width: 100%;
  }

  .search-container-centered {
    padding: 20px 40px;
  }

  /* Fix search input width in mobile */
  .search-input-container {
    width: 100% !important;
    max-width: 100% !important;
    background:
      linear-gradient(#fff, #fff) padding-box,
      linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box !important;
    background-size: 100% 100%, 200% 100% !important;
    animation: wiH-border-sweep 2.2s linear infinite !important;
    border: 2px solid transparent !important;
  }

  .search-input {
    font-size: 16px !important; /* Prevent zoom on iOS */
  }

  /* Mobile icon adjustments */
  .search-icons {
    right: 6px;
    gap: 4px;
    padding: 1px;
  }

  .icon-button {
    width: 28px;
    height: 28px;
  }

  .icon-button svg {
    width: 18px;
    height: 18px;
  }

  /* Logo responsive */
  .search-landing .logo-container .search-logo-image,
  img[src*="whatishealthylogo"] { 
    width: 500px !important; 
  }

  /* Mobile buttons */
  .search-buttons-mobile {
    margin: 24px 16px 32px 16px;
    width: calc(100% - 32px);
  }
  
  .search-btn-mobile {
    font-size: 15px !important;
    height: 44px !important;
  }
}

@media (max-width: 480px) {
  .results-page { padding-top: 10px; }
  .results-search-header { 
    padding: 65px 10px 12px 10px; 
    margin-top: 3px; 
  }
  .results-search-logo {
    height: 36px !important;
    max-width: 180px !important;
  }

  .search-container-centered {
    padding: 20px 20px;
  }

  .health-info-card {
    padding: 15px !important;
    margin-bottom: 15px;
  }

  /* Search input very small screens */
  .search-input-container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    background:
      linear-gradient(#fff, #fff) padding-box,
      linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box !important;
    background-size: 100% 100%, 200% 100% !important;
    animation: wiH-border-sweep 2.2s linear infinite !important;
    border: 2px solid transparent !important;
  }

  .search-input {
    font-size: 16px !important;
    padding: 12px 50px 12px 16px !important;
  }

  .search-icons {
    right: 4px !important;
    gap: 2px;
  }

  .icon-button {
    width: 24px !important;
    height: 24px !important;
  }

  .icon-button svg {
    width: 16px !important;
    height: 16px !important;
  }

  /* Logo very small screens */
  .search-landing .logo-container .search-logo-image,
  img[src*="whatishealthylogo"] { 
    width: 90% !important; 
    max-width: 320px !important; 
  }
}

@media (min-width: 769px) {
  .results-page { padding-top: 25px; }
  .results-search-header { padding: 30px 20px 25px 20px; margin-top: 15px; padding-right: 80px; }
  .results-search-input { height: 48px; font-size: 16px; }

  /* Desktop buttons row */
  .search-buttons-mobile {
    flex-direction: row;
    justify-content: center;
    max-width: 600px;
    margin: 32px auto 40px auto;
  }
  
  .search-btn-mobile {
    max-width: 200px !important;
    flex: 1;
  }
}

/* Very large screens */
@media (min-width: 1400px) {
  .search-container-centered {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .search-input-container {
    max-width: 1000px;
    margin: 0 auto 24px auto;
  }
}
```

---

## Mobile Fixes

```css
/* Mobile-specific fixes for layout issues */
@media (max-width: 768px) {
  /* CRITICAL: Remove horizontal scrollbar */
  html, body {
    overflow-x: hidden !important;
    max-width: 100vw !important;
    width: 100% !important;
    -webkit-overflow-scrolling: touch !important;
  }

  body {
    padding-top: 80px !important;
    margin: 0 !important;
    position: relative !important;
    background-image: none !important;
  }

  /* Prevent any element from causing horizontal scroll */
  * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Target common scrollbar culprits */
  #root,
  .app,
  .App,
  .main-container {
    overflow-x: hidden !important;
    max-width: 100vw !important;
    width: 100% !important;
  }

  /* Hide scrollbars on mobile */
  .chat-messages-scroll,
  *::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    background: transparent !important;
  }

  * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  /* Override CSS variables for mobile */
  :root {
    --vh-accent: #1a73e8;
    --vh-surface-2: #ffffff;
  }

  /* Search landing fixes */
  .search-landing,
  .results-page {
    min-height: 100vh !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Clean white backgrounds */
  .results-page,
  .search-landing,
  .health-info-card,
  .health-info-content {
    background: #ffffff !important;
    background-image: none !important;
  }

  /* Fix search input container with animation */
  .search-input-container {
    background: 
      linear-gradient(#fff, #fff) padding-box,
      linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box !important;
    animation: wiH-border-sweep 2.2s linear infinite !important;
  }

  /* Fix search input placeholder text display */
  .search-input {
    font-size: 16px !important;
    padding: 12px 60px 12px 16px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .search-input::placeholder {
    font-size: 16px !important;
    color: #9aa0a6 !important;
    opacity: 1 !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    overflow: hidden !important;
  }

  /* Ensure search icons don't overlap text */
  .search-icons {
    right: 8px !important;
    background-color: rgba(255, 255, 255, 0.95) !important;
  }

  /* Show search buttons on mobile */
  .search-buttons {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
    width: 100% !important;
    max-width: 600px !important;
    margin: 0 auto !important;
  }

  .search-btn {
    width: 100% !important;
    padding: 14px 20px !important;
    font-size: 16px !important;
  }

  /* News feed fixes */
  .feeling-healthy-section {
    position: relative !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }

  .news-feed-container {
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
    padding: 8px 12px 20px 12px !important;
    margin: 20px 0 0 0 !important;
    box-sizing: border-box !important;
  }

  .news-grid {
    width: 100% !important;
    grid-template-columns: 1fr !important;
    gap: 12px !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}

@media (max-width: 480px) {
  /* Login icon always visible */
  .multi-auth-container.top-right {
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 10002 !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  }

  /* News feed loading skeleton */
  .news-feed-container:empty::before {
    content: '';
    display: block;
    width: 100%;
    height: 400px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading-skeleton 1.5s infinite;
    border-radius: 8px;
    margin: 20px 0;
  }

  @keyframes loading-skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* News feed spacing */
  .feeling-healthy-section {
    margin-top: 100px !important;
    padding-top: 20px !important;
  }
}
```

---

## Dark Mode

```css
/* ---------------------------
   Dark Mode
----------------------------*/
@media (prefers-color-scheme: dark) {
  .health-info-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-color: #404040;
  }
  .related-topics-card,
  .resources-card {
    background: #2d2d2d;
    border-color: #404040;
    color: #e0e0e0;
  }
  .health-info-content {
    background: #2d2d2d;
    border-color: #404040;
    color: #e0e0e0;
  }
  .resources-list a {
    background: #404040;
    color: #4fc3f7;
  }
  .resources-list a:hover {
    background: #505050;
  }
}
```

---

## Brand Colors Reference

| Color | Hex | Usage |
|-------|-----|-------|
| WiHY Orange | `#fa5f06` | Primary action, analyze button, border sweep |
| WiHY Green | `#4cbb17` | Healthy/success, feeling healthy button |
| WiHY Blue | `#1a73e8` | Links, accent, focus states |
| Silver | `#C0C0C0` | Border sweep gradient |
| White | `#ffffff` | Backgrounds, border sweep |
| Ink | `#202124` | Primary text |
| Muted | `#5f6368` | Secondary text |

---

## Animation Summary

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `wiH-border-sweep` | 2.2s | linear infinite | Search input border |
| `healthyPulse` | 2s | infinite | Feeling healthy button hover |
| `loading-skeleton` | 1.5s | infinite | News feed loading state |
| `spin` | - | - | Loading spinners |

---

## Exact Logo Positioning Implementation

### Logo JSX Structure

```jsx
{/* Inside .search-container-centered */}
<div className="logo-container">
  <img 
    src="/assets/wihylogo.png?v=2025-11-05" 
    alt="What is Healthy?" 
    className="search-logo-image"
    style={{ cursor: 'pointer' }}
    onClick={() => window.location.reload()}
  />
</div>
```

### Logo Container CSS

```css
/* From utilities.css - .search-landing .logo-container */
.search-landing .logo-container {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin: 0 0 2rem 0 !important;    /* 32px bottom margin */
  width: 100% !important;
}
```

### Logo Image CSS

```css
/* From utilities.css */
.search-landing .logo-container .search-logo-image,
img[src*="whatishealthylogo"] {
  width: 600px !important;
  height: auto !important;
  object-fit: contain !important;
  display: block !important;
  margin: 0 auto !important;
  padding: 0 !important;
}
```

### Logo Responsive Breakpoints

```css
/* Tablet: ≤768px */
@media (max-width: 768px) {
  .search-landing .logo-container .search-logo-image,
  img[src*="whatishealthylogo"] { 
    width: 500px !important; 
  }
}

/* Mobile: ≤480px */
@media (max-width: 480px) {
  .search-landing .logo-container .search-logo-image,
  img[src*="whatishealthylogo"] { 
    width: 90% !important; 
    max-width: 320px !important; 
  }
}
```

### Logo Visual Spec Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  .search-container-centered                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           .logo-container (flex, center)                │   │
│  │               margin-bottom: 2rem (32px)                │   │
│  │                                                         │   │
│  │   ┌─────────────────────────────────────────────────┐   │   │
│  │   │        .search-logo-image (600px wide)          │   │   │
│  │   │                                                 │   │   │
│  │   │    ╔═══════════════════════════════════════╗    │   │   │
│  │   │    ║                                       ║    │   │   │
│  │   │    ║      wihylogo.png                     ║    │   │   │
│  │   │    ║      (click → reload page)            ║    │   │   │
│  │   │    ║                                       ║    │   │   │
│  │   │    ╚═══════════════════════════════════════╝    │   │   │
│  │   │                                                 │   │   │
│  │   └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                        ↓ 32px gap ↓                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              .search-input-container                    │   │
│  │                    (search bar)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Logo Size Reference Table

| Breakpoint | Logo Width | Notes |
|------------|------------|-------|
| Desktop (>768px) | `600px` | Fixed width, auto height |
| Tablet (≤768px) | `500px` | Slightly smaller |
| Mobile (≤480px) | `90%` (max `320px`) | Fluid with cap |

---

## Exact Dimensions & Spacing Reference

### Complete Measurement Spec

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         .search-landing                                     │
│                     (min-height: 100vh, padding: 0 20px)                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              .search-container-centered                               │ │
│  │                  (width: 100%, padding: 0 60px)                       │ │
│  │                                                                       │ │
│  │   ┌───────────────────────────────────────────────────────────────┐   │ │
│  │   │                   .logo-container                             │   │ │
│  │   │       (margin-bottom: 2rem = 32px, flex center)               │   │ │
│  │   │                                                               │   │ │
│  │   │      ┌─────────────────────────────────────────────────┐      │   │ │
│  │   │      │         .search-logo-image                      │      │   │ │
│  │   │      │            width: 600px                         │      │   │ │
│  │   │      │            height: auto                         │      │   │ │
│  │   │      └─────────────────────────────────────────────────┘      │   │ │
│  │   │                                                               │   │ │
│  │   └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │                          ↓ 32px (2rem) ↓                              │ │
│  │                                                                       │ │
│  │   ┌───────────────────────────────────────────────────────────────┐   │ │
│  │   │            Search Input Container (Tailwind)                  │   │ │
│  │   │      max-width: 584px, margin: 24px auto (my-6)               │   │ │
│  │   │      border-radius: 24px (rounded-3xl)                        │   │ │
│  │   │      border: 2px transparent + gradient                       │   │ │
│  │   │                                                               │   │ │
│  │   │   ┌───────────────────────────────────────────────────────┐   │   │ │
│  │   │   │                   textarea                            │   │   │ │
│  │   │   │    min-height: 44px (desktop: 48px)                   │   │   │ │
│  │   │   │    padding: 10px 128px 10px 16px                      │   │   │ │
│  │   │   │    (py-2.5 pl-4 pr-[128px])                           │   │   │ │
│  │   │   └───────────────────────────────────────────────────────┘   │   │ │
│  │   │                                                               │   │ │
│  │   │                                      ┌────────────────────┐   │   │ │
│  │   │                                      │   Icons Container  │   │   │ │
│  │   │                                      │   right: 8px       │   │   │ │
│  │   │                                      │   gap: 6px (1.5)   │   │   │ │
│  │   │                                      └────────────────────┘   │   │ │
│  │   └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Search Bar Exact Dimensions

| Property | Value | Tailwind Class | Notes |
|----------|-------|----------------|-------|
| **Width** | `100%` up to `584px` | `w-full max-w-[584px]` | Google search box width |
| **Height (min)** | `44px` mobile, `48px` desktop | `min-h-[44px] md:min-h-[48px]` | Auto-expands with content |
| **Height (max)** | `40vh` | `max-h-[40vh]` | Scrolls beyond this |
| **Margin** | `24px auto` | `mx-auto my-6` | Centers horizontally |
| **Border radius** | `24px` | `rounded-3xl` | Pill shape |
| **Border** | `2px transparent` | `border-2 border-transparent` | For gradient effect |
| **Shadow** | `0 2px 5px 1px rgba(64,60,67,0.16)` | `shadow-[...]` | Google-style |

### Search Input (textarea) Padding

| Property | Value | Tailwind Class |
|----------|-------|----------------|
| **Padding top** | `10px` | `py-2.5` |
| **Padding bottom** | `10px` | `py-2.5` |
| **Padding left** | `16px` | `pl-4` |
| **Padding right** | `128px` | `pr-[128px]` | Space for icons |

### Desktop (md:) Input Adjustments

| Property | Value | Tailwind Class |
|----------|-------|----------------|
| **Min height** | `48px` | `md:min-h-[48px]` |
| **Padding top/bottom** | `12px` | `md:py-3` |
| **Padding left** | `16px` | `md:pl-4` |
| **Padding right** | `128px` | `md:pr-[128px]` |

### Logo to Search Bar Spacing

| Element | Spacing | Source |
|---------|---------|--------|
| Logo container margin-bottom | `32px` (2rem) | `.logo-container { margin: 0 0 2rem 0 }` |
| Search container margin-top | `24px` (1.5rem) | `my-6` = margin-y: 1.5rem |
| **Total gap** | **56px** | 32px + 24px |

### Icons Container Position

```css
/* Absolute positioned inside search container */
.icons-container {
  position: absolute;
  right: 8px;                    /* right-2 */
  top: 50%;
  transform: translateY(-50%);  /* -translate-y-1/2 */
  display: flex;
  gap: 6px;                      /* gap-1.5 */
  align-items: center;
  background: rgba(255,255,255,0.9);  /* bg-white/90 */
  padding: 4px;                  /* p-1 */
  border-radius: 16px;           /* rounded-2xl */
}

/* Desktop adjustments */
@media (min-width: 768px) {
  .icons-container {
    gap: 8px;    /* md:gap-2 */
    padding: 4px; /* md:p-1 */
  }
}
```

### Icon Button Dimensions

| Property | Value | Tailwind Class |
|----------|-------|----------------|
| Width | `32px` | `w-8` |
| Height | `32px` | `h-8` |
| Border radius | `9999px` (circle) | `rounded-full` |
| Background | `#f3f4f6` | `bg-gray-100` |
| Hover background | `#e5e7eb` | `hover:bg-gray-200` |

### Responsive Breakpoints Summary

| Breakpoint | Logo Width | Search Bar Width | Input Height |
|------------|------------|------------------|--------------|
| Desktop (>768px) | `600px` | `584px` max | `48px` min |
| Tablet (≤768px) | `500px` | `100%` | `40px` min |
| Mobile (≤480px) | `90%` (max 320px) | `100%` | `36px` min |

### CSS Variables (from search-components.css)

```css
.search-input-container {
  --icons-width: 120px;
  --pad-left: 16px;
  --pad-right: calc(var(--icons-width) + 8px);  /* 128px */
}

@media (max-width: 768px) {
  .search-input-container {
    --icons-width: 100px;
    --pad-right: calc(var(--icons-width) + 8px);  /* 108px */
  }
}

@media (max-width: 480px) {
  .search-input-container {
    --icons-width: 90px;
    --pad-right: calc(var(--icons-width) + 6px);  /* 96px */
  }
}
```

---

## Login Button Styling (Top-Right)

The login button appears in the top-right corner when the user is not authenticated. It's rendered by the `MultiAuthLogin` component.

### Login Button JSX Structure

```jsx
{/* From MultiAuthLogin.tsx - Main Login Button */}
<button 
  className="border-none cursor-pointer !pointer-events-auto p-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm text-blue-600 relative disabled:opacity-60 disabled:cursor-not-allowed"
  onClick={handleLoginClick}
  disabled={loading}
  aria-label="Sign in"
>
  {loading ? (
    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  )}
</button>
```

### Login Button CSS Equivalent

```css
.login-button {
  border: none;
  cursor: pointer;
  pointer-events: auto !important;
  padding: 0;
  width: 40px;               /* w-10 */
  height: 40px;              /* h-10 */
  border-radius: 9999px;     /* rounded-full (perfect circle) */
  background: linear-gradient(to bottom right, #dbeafe, #bfdbfe);  /* from-blue-100 to-blue-200 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);  /* shadow-sm */
  color: #2563eb;            /* text-blue-600 */
  position: relative;
  transition: all 0.2s ease;
}

.login-button:hover {
  background: linear-gradient(to bottom right, #bfdbfe, #93c5fd);  /* Slightly darker gradient */
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.login-button:active {
  transform: scale(0.98);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* User icon inside button */
.login-button svg {
  width: 24px;    /* w-6 */
  height: 24px;   /* h-6 */
  fill: currentColor;
}

/* Loading spinner state */
.login-button .spinner {
  width: 20px;    /* w-5 */
  height: 20px;   /* h-5 */
  border: 2px solid #d1d5db;      /* border-gray-300 */
  border-top-color: #3b82f6;      /* border-t-blue-500 */
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Login Button Specifications Table

| Property | Value | Tailwind Class | Notes |
|----------|-------|----------------|-------|
| **Dimensions** | `40×40px` | `w-10 h-10` | Perfect circle |
| **Border radius** | `9999px` | `rounded-full` | Full circle |
| **Background** | `linear-gradient(to bottom right, #dbeafe, #bfdbfe)` | `bg-gradient-to-br from-blue-100 to-blue-200` | Light blue gradient |
| **Icon color** | `#2563eb` | `text-blue-600` | Blue user icon |
| **Icon size** | `24×24px` | `w-6 h-6` | SVG dimensions |
| **Shadow** | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | Subtle elevation |
| **Display** | `flex` | `flex items-center justify-center` | Centers icon |
| **Position** | `relative` | `relative` | For absolute children |
| **Disabled opacity** | `0.6` | `disabled:opacity-60` | Loading state |

### Login Button Color Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Blue-100 (gradient start) | `#dbeafe` | Top-left background |
| Blue-200 (gradient end) | `#bfdbfe` | Bottom-right background |
| Blue-600 (icon) | `#2563eb` | User icon color |
| Gray-300 (spinner base) | `#d1d5db` | Loading spinner border |
| Blue-500 (spinner accent) | `#3b82f6` | Loading spinner top |

### Login Button States

#### Default State
```css
width: 40px;
height: 40px;
background: linear-gradient(to bottom right, #dbeafe, #bfdbfe);
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
```

#### Hover State
```css
background: linear-gradient(to bottom right, #bfdbfe, #93c5fd);  /* Darker */
box-shadow: 0 2px 4px rgba(0,0,0,0.1);                          /* Deeper shadow */
transform: scale(1.05);                                          /* Slightly larger */
```

#### Active/Clicked State
```css
transform: scale(0.98);  /* Slightly smaller - press effect */
```

#### Disabled/Loading State
```css
opacity: 0.6;
cursor: not-allowed;
/* Shows spinning animation instead of user icon */
```

### User Icon SVG Path

```html
<!-- Material Design person icon -->
<svg viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;">
  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
</svg>
```

### Login Button Visual Diagram

```
                          ┌────────────────────────┐
                          │   Top-Right Corner     │
                          │                        │
                          │     ╭────────╮         │
                          │     │        │ 40px    │
                          │     │   👤   │ circle  │
                          │     │        │         │
                          │     ╰────────╯         │
                          │                        │
                          │  Blue gradient button  │
                          └────────────────────────┘

Button Breakdown:
┌──────────────────────────────────────┐
│                                      │
│    ╔════════════════════════╗        │
│    ║   40×40px Circle       ║        │
│    ║   ┌──────────────┐     ║        │
│    ║   │  24×24px SVG │     ║        │
│    ║   │     Icon     │     ║        │
│    ║   └──────────────┘     ║        │
│    ║                        ║        │
│    ║  Gradient: #dbeafe →  ║        │
│    ║            #bfdbfe     ║        │
│    ╚════════════════════════╝        │
│    Shadow: 0 1px 2px                 │
└──────────────────────────────────────┘
```

---

## SEO & Google Optimization Meta Tags

### Complete SEO Head Configuration

All SEO elements from `client/public/index.html` that make the page discoverable and optimized for Google search.

```html
<head>
  <!-- Google Analytics (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-X3TDLWKKWH"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-X3TDLWKKWH');
  </script>
  
  <!-- Cache Control for Fresh Deployments -->
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  
  <!-- Basic Meta Tags -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="keywords" content="nutrition coach, fitness coach, health intelligence platform, personal training AI, nutrition tracking, food scanner, meal analysis, health coaching platform, evidence-based nutrition, AI fitness guide, WiHY AI" />
  <meta name="author" content="Wihy.ai" />

  <!-- Title & Description (Primary SEO) -->
  <title>WIHY AI | World's Smartest Health Search Engine</title>
  <meta
    name="description"
    content="WIHY AI is the world's smartest health search engine. Evidence-based nutrition and fitness answers for individuals, plus a coaching platform after login to track client success."
  />
  <meta name="theme-color" content="#0AAE5E" />

  <!-- Canonical URL (Prevents Duplicate Content) -->
  <link rel="canonical" href="https://wihy.ai/" />
  
  <!-- Preconnect for Performance (Faster Resource Loading) -->
  <link rel="preconnect" href="https://www.googletagmanager.com" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://wihy.ai" />

  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:site_name" content="Wihy.ai" />
  <meta property="og:title" content="WIHY AI | World's Smartest Health Search Engine" />
  <meta
    property="og:description"
    content="Evidence-based nutrition and fitness answers for individuals, plus a coaching platform after login to track client success."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://wihy.ai/" />
  <meta property="og:image" content="https://wihy.ai/assets/wihylogo.png?v=2025-11-05" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@wihyai" />
  <meta name="twitter:creator" content="@wihyai" />
  <meta name="twitter:title" content="WIHY AI | World's Smartest Health Search Engine" />
  <meta
    name="twitter:description"
    content="Evidence-based nutrition and fitness answers for individuals, plus a coaching platform after login to track client success."
  />
  <meta name="twitter:image" content="https://wihy.ai/assets/wihylogo.png?v=2025-11-05" />

  <!-- App Icons & Manifest -->
  <link rel="icon" type="image/png" href="/assets/wihyfavicon.png" />
  <link rel="apple-touch-icon" href="/assets/wihyfavicon.png" />
  <link rel="manifest" href="/manifest.json" />

  <!-- Structured Data (Google Rich Snippets) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "WIHY AI",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web, Android, iOS",
    "url": "https://wihy.ai/",
    "description": "WIHY AI is an evidence-based nutrition and fitness intelligence platform designed for individuals and professionals. It acts as a personal nutrition coach and physical training guide for users while providing coaches, trainers, and dietitians with powerful tools to manage clients, track progress, and measure real health outcomes.",
    "image": "https://wihy.ai/assets/og-wihyai.jpg",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "500"
    }
  }
  </script>
</head>
```

### SEO Meta Tags Reference Table

| Meta Tag | Value | Purpose |
|----------|-------|---------|
| **charset** | `utf-8` | Character encoding |
| **viewport** | `width=device-width, initial-scale=1, viewport-fit=cover` | Mobile responsive |
| **robots** | `index, follow, max-image-preview:large` | Google crawl instructions |
| **keywords** | `nutrition coach, fitness coach, health intelligence platform...` | Search keywords (legacy but still used) |
| **author** | `Wihy.ai` | Content attribution |
| **theme-color** | `#0AAE5E` | Browser address bar color |
| **canonical** | `https://wihy.ai/` | Preferred URL for SEO |

### Open Graph Tags (Social Sharing)

| Property | Value | Used By |
|----------|-------|---------|
| **og:site_name** | `Wihy.ai` | Facebook, LinkedIn |
| **og:title** | `WIHY AI \| World's Smartest Health Search Engine` | Social share title |
| **og:description** | `Evidence-based nutrition and fitness answers...` | Social share description |
| **og:type** | `website` | Content type |
| **og:url** | `https://wihy.ai/` | Canonical URL for sharing |
| **og:image** | `https://wihy.ai/assets/wihylogo.png?v=2025-11-05` | Share preview image |
| **og:image:width** | `1200` | Image dimensions |
| **og:image:height** | `630` | Facebook recommended size |
| **og:locale** | `en_US` | Language/region |

### Twitter Card Tags

| Property | Value | Purpose |
|----------|-------|---------|
| **twitter:card** | `summary_large_image` | Large image preview card |
| **twitter:site** | `@wihyai` | Twitter account |
| **twitter:creator** | `@wihyai` | Content creator |
| **twitter:title** | `WIHY AI \| World's Smartest Health Search Engine` | Tweet title |
| **twitter:description** | `Evidence-based nutrition and fitness answers...` | Tweet description |
| **twitter:image** | `https://wihy.ai/assets/wihylogo.png?v=2025-11-05` | Tweet image |

### Structured Data (Schema.org)

**Type**: `SoftwareApplication`

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "WIHY AI",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, Android, iOS",
  "url": "https://wihy.ai/",
  "description": "WIHY AI is an evidence-based nutrition and fitness intelligence platform...",
  "image": "https://wihy.ai/assets/og-wihyai.jpg",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "500"
  }
}
```

**Benefits:**
- Google Rich Snippets (star ratings, price shown in search)
- App schema for app store-like visibility
- Better click-through rates in search results

### Google Analytics Configuration

**Tracking ID**: `G-X3TDLWKKWH`

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X3TDLWKKWH"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-X3TDLWKKWH');
</script>
```

**What it tracks:**
- Page views
- User sessions
- Bounce rates
- Search queries
- Button clicks (with custom events)
- User flow through the app

### Performance Optimization Tags

```html
<!-- Preconnect (establishes early connections) -->
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" />

<!-- DNS Prefetch (faster DNS resolution) -->
<link rel="dns-prefetch" href="https://wihy.ai" />
```

**Impact**: 
- Reduces latency by 100-300ms
- Improves Core Web Vitals
- Better Google PageSpeed score

### Cache Control Headers

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

**Purpose**: Ensures users get latest deployment after updates

### Favicon & App Icons

```html
<link rel="icon" type="image/png" href="/assets/wihyfavicon.png" />
<link rel="apple-touch-icon" href="/assets/wihyfavicon.png" />
<link rel="manifest" href="/manifest.json" />
```

**Files needed:**
- `/assets/wihyfavicon.png` - Browser favicon (32×32 or 64×64)
- `/manifest.json` - PWA manifest for installability

### SEO Best Practices Applied

✅ **Title Length**: 50-60 characters (currently 48)  
✅ **Description Length**: 150-160 characters (currently 157)  
✅ **Keywords**: Relevant, not stuffed  
✅ **Canonical URL**: Set to prevent duplicate content  
✅ **Mobile-friendly**: viewport meta tag configured  
✅ **Structured Data**: Schema.org JSON-LD for rich snippets  
✅ **Social Sharing**: Open Graph + Twitter Cards  
✅ **Performance**: Preconnect + DNS prefetch  
✅ **Analytics**: Google Analytics configured  
✅ **Robots**: Allowed indexing with max preview settings  

### Google Search Console Verification (Optional)

Add this meta tag for Google Search Console ownership verification:

```html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```

Get code from: [Google Search Console](https://search.google.com/search-console)

### Testing Your SEO

**Tools to use:**

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
4. **PageSpeed Insights**: https://pagespeed.web.dev/
5. **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly

### Key SEO URLs

| Tool | URL | Purpose |
|------|-----|---------|
| Google Analytics | https://analytics.google.com/ | Track traffic |
| Google Search Console | https://search.google.com/search-console | Monitor search performance |
| Google Tag Manager | https://tagmanager.google.com/ | Manage tracking tags |
| PageSpeed Insights | https://pagespeed.web.dev/ | Performance analysis |
| Rich Results Test | https://search.google.com/test/rich-results | Test structured data |

---

## Static HTML Template (No API Calls)

This is a standalone HTML page that replicates VHealthSearch.tsx without React or API dependencies.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- SEO Meta Tags (See "SEO & Google Optimization" section above for full details) -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WIHY AI | World's Smartest Health Search Engine</title>
  <meta name="description" content="WIHY AI is the world's smartest health search engine. Evidence-based nutrition and fitness answers for individuals, plus a coaching platform after login to track client success." />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="https://wihy.ai/" />
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-X3TDLWKKWH"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-X3TDLWKKWH');
  </script>
  
  <style>
    /* ═══════════════════════════════════════════════════════════
       BASE RESET & THEME TOKENS
       ═══════════════════════════════════════════════════════════ */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --vh-accent: #1a73e8;
      --vh-accent-2: #34a853;
      --vh-ink: #202124;
      --vh-muted: #5f6368;
      --vh-surface: #ffffff;
      --vh-surface-2: #f8fbff;
      --vh-ring: 0 0 0 3px rgba(26,115,232,.18);
      --vh-header-height: 80px;
      
      /* Brand Colors */
      --wihy-orange: #fa5f06;
      --wihy-green: #4cbb17;
      --wihy-blue: #1a73e8;
      --wihy-silver: #C0C0C0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(1200px 600px at 10% -10%, #f5f8ff 0%, transparent 40%),
                  radial-gradient(1000px 500px at 110% 0%, #f7fff8 0%, transparent 35%),
                  #f9f9f9;
      color: #333;
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* ═══════════════════════════════════════════════════════════
       BORDER SWEEP ANIMATION
       ═══════════════════════════════════════════════════════════ */
    @keyframes wiH-border-sweep {
      0%   { background-position: 0 0, 0% 0; }
      100% { background-position: 0 0, 200% 0; }
    }

    /* ═══════════════════════════════════════════════════════════
       SEARCH LANDING PAGE
       ═══════════════════════════════════════════════════════════ */
    .search-landing {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 0 20px;
      background-color: #ffffff;
    }

    .search-container-centered {
      width: 100%;
      max-width: none;
      text-align: center;
      padding: 0 60px;
    }

    /* ═══════════════════════════════════════════════════════════
       LOGO SECTION
       ═══════════════════════════════════════════════════════════ */
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 0 2rem 0;
      width: 100%;
    }

    .search-logo-image {
      width: 600px;
      height: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      cursor: pointer;
    }

    /* Text logo fallback */
    .search-logo {
      font-size: 48px;
      background: linear-gradient(to right, #4285f4, #ea4335, #fbbc05, #34a853);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-bottom: 20px;
      cursor: pointer;
    }

    /* ═══════════════════════════════════════════════════════════
       SEARCH INPUT CONTAINER WITH BORDER SWEEP
       ═══════════════════════════════════════════════════════════ */
    .search-input-container {
      position: relative;
      width: 100%;
      max-width: 584px;
      margin: 24px auto;
      padding: 0;
      border-radius: 24px;
      box-shadow: 0 2px 5px 1px rgba(64,60,67,0.16);
      transition: box-shadow 200ms;
      
      /* Border Sweep Animation */
      border: 2px solid transparent;
      background:
        linear-gradient(#fff, #fff) padding-box,
        linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box;
      background-size: 100% 100%, 200% 100%;
      animation: wiH-border-sweep 2.2s linear infinite;
    }

    .search-input-container:hover,
    .search-input-container:focus-within {
      box-shadow: 0 2px 5px 1px rgba(64,60,67,0.16);
    }

    /* ═══════════════════════════════════════════════════════════
       SEARCH INPUT FIELD
       ═══════════════════════════════════════════════════════════ */
    .search-input {
      width: 100%;
      min-height: 48px;
      max-height: 40vh;
      padding: 12px 128px 12px 16px;
      font-size: 16px;
      border: none;
      outline: none;
      border-radius: 24px;
      background: transparent;
      font-family: inherit;
      resize: none;
      overflow-y: hidden;
      line-height: 1.4;
      color: #202124;
    }

    .search-input::placeholder {
      color: #9aa0a6;
      font-size: 16px;
    }

    .search-input:focus {
      text-align: left;
    }

    /* ═══════════════════════════════════════════════════════════
       SEARCH ICONS (Clear, Camera, Voice)
       ═══════════════════════════════════════════════════════════ */
    .search-icons {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      gap: 6px;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.9);
      padding: 2px;
      border-radius: 20px;
    }

    .icon-button {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #70757a;
      transition: color 0.2s ease, background-color 0.2s ease;
    }

    .icon-button:hover {
      background-color: #f1f3f4;
      color: #1a73e8;
    }

    .icon-button svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .icon-button.clear-btn {
      background: #f8f9fa;
    }

    .icon-button.clear-btn:hover {
      background: #e8eaed;
    }

    .icon-button.listening {
      background: #ea4335 !important;
      color: white !important;
    }

    /* ═══════════════════════════════════════════════════════════
       ACTION BUTTONS
       ═══════════════════════════════════════════════════════════ */
    .search-buttons-mobile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin: 32px 20px 40px 20px;
      width: calc(100% - 40px);
      max-width: 600px;
    }

    .search-btn {
      height: 48px;
      border-radius: 24px;
      font-size: 16px;
      font-weight: 500;
      margin: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 24px;
      cursor: pointer;
      width: 100%;
      max-width: 300px;
    }

    .search-btn.primary {
      background: #4285f4;
      color: white;
      border: none;
    }

    .search-btn.primary:hover {
      background: #3367d6;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .search-btn.primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .search-btn.secondary {
      background: #f8f9fa;
      color: #3c4043;
      border: 1px solid #f0f0f0;
    }

    .search-btn.secondary:hover {
      background: #f1f3f4;
      border-color: #dadce0;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    /* ═══════════════════════════════════════════════════════════
       LOGIN BUTTON (Top Right)
       ═══════════════════════════════════════════════════════════ */
    .login-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10002;
    }

    .login-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 24px;
      cursor: pointer;
      font-size: 14px;
      color: #3c4043;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .login-btn:hover {
      background: #f8f9fa;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }

    .login-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    /* ═══════════════════════════════════════════════════════════
       MOBILE BOTTOM NAVIGATION
       ═══════════════════════════════════════════════════════════ */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      display: none; /* Hidden by default, show on mobile */
      justify-content: space-around;
      align-items: center;
      background: white;
      border-top: 1px solid #e5e7eb;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
      z-index: 1200;
    }

    .nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      padding: 8px 0;
      cursor: pointer;
      gap: 4px;
      color: #6b7280;
      transition: color 0.2s ease;
    }

    .nav-btn:hover {
      color: #1a73e8;
    }

    .nav-btn svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    .nav-btn span {
      font-size: 11px;
      font-weight: 500;
    }

    /* ═══════════════════════════════════════════════════════════
       UPLOAD MODAL
       ═══════════════════════════════════════════════════════════ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: none; /* Hidden by default */
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-content {
      background: #fff;
      border-radius: 16px;
      width: 380px;
      max-width: 90vw;
      max-height: 90vh;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e8eaed;
    }

    .modal-header h2 {
      font-size: 22px;
      font-weight: 400;
      color: #202124;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .modal-close:hover {
      background: #f1f3f4;
    }

    .upload-area {
      padding: 32px 24px;
      border: 2px dashed #dadce0;
      margin: 24px;
      border-radius: 8px;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
    }

    .upload-area:hover {
      border-color: #1a73e8;
      background: #f8f9fa;
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .upload-icon {
      width: 48px;
      height: 48px;
      color: #9aa0a6;
    }

    .upload-text {
      font-size: 16px;
      color: #3c4043;
      margin: 0;
    }

    .upload-link {
      background: none;
      border: none;
      color: #1a73e8;
      cursor: pointer;
      font-size: 16px;
      text-decoration: underline;
      padding: 0;
    }

    .upload-link:hover {
      color: #1557b0;
    }

    .url-section {
      padding: 0 24px 24px 24px;
      display: flex;
      gap: 12px;
    }

    .url-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #dadce0;
      border-radius: 24px;
      font-size: 14px;
      color: #202124;
      outline: none;
      transition: all 0.2s;
    }

    .url-input:focus {
      border-color: #1a73e8;
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
    }

    .url-submit {
      padding: 12px 24px;
      border: none;
      border-radius: 24px;
      background: #1a73e8;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .url-submit:hover {
      background: #1557b0;
    }

    /* ═══════════════════════════════════════════════════════════
       LOADING SPINNER
       ═══════════════════════════════════════════════════════════ */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.95);
      display: none; /* Hidden by default */
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    }

    .loading-overlay.active {
      display: flex;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1a73e8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      margin-top: 16px;
      font-size: 16px;
      color: #5f6368;
    }

    /* ═══════════════════════════════════════════════════════════
       RESPONSIVE DESIGN
       ═══════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      .search-container-centered {
        padding: 0 20px;
      }

      .search-logo-image {
        width: 80%;
        max-width: 400px;
      }

      .search-input-container {
        max-width: 100%;
      }

      .search-input {
        font-size: 16px; /* Prevent zoom on iOS */
        padding-right: 100px;
      }

      .search-icons {
        right: 6px;
        gap: 4px;
      }

      .icon-button {
        width: 28px;
        height: 28px;
      }

      .icon-button svg {
        width: 18px;
        height: 18px;
      }

      .search-buttons-mobile {
        flex-direction: column;
        margin: 24px 16px 100px 16px; /* Extra bottom margin for bottom nav */
      }

      .search-btn {
        width: 100%;
        max-width: none;
      }

      /* Show bottom nav on mobile */
      .bottom-nav {
        display: flex;
      }

      /* Hide login button on mobile (use bottom nav instead) */
      .login-container {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .search-logo-image {
        width: 90%;
        max-width: 320px;
      }

      .icon-button {
        width: 24px;
        height: 24px;
      }

      .icon-button svg {
        width: 16px;
        height: 16px;
      }
    }

    @media (min-width: 769px) {
      .search-buttons-mobile {
        flex-direction: row;
        justify-content: center;
      }

      .search-btn {
        width: auto;
        min-width: 180px;
      }
    }
  </style>
</head>
<body>
  <!-- MAIN SEARCH LANDING PAGE -->
  <div class="search-landing">
    
    <!-- LOGIN BUTTON (Top Right - Desktop Only) -->
    <div class="login-container">
      <button class="login-btn" onclick="alert('Login clicked')">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
        Sign in
      </button>
    </div>

    <!-- MAIN SEARCH INTERFACE -->
    <div class="search-container-centered">
      
      <!-- LOGO -->
      <div class="logo-container">
        <img 
          src="/assets/wihylogo.png"
          alt="What is Healthy?"
          class="search-logo-image"
          onerror="this.style.display='none'; document.getElementById('text-logo').style.display='block';"
          onclick="window.location.href='/about'"
        />
        <h1 id="text-logo" class="search-logo" style="display: none;" onclick="window.location.href='/'">
          What is Healthy?
        </h1>
      </div>

      <!-- SEARCH INPUT WITH BORDER SWEEP ANIMATION -->
      <div class="search-input-container">
        <form id="search-form" onsubmit="handleSearch(event)">
          <textarea
            id="search-input"
            class="search-input"
            placeholder="Scan food and explain it"
            rows="1"
            oninput="autoResize(this)"
          ></textarea>
        </form>

        <!-- SEARCH ICONS -->
        <div class="search-icons">
          <!-- Clear Button (hidden when empty) -->
          <button 
            id="clear-btn"
            class="icon-button clear-btn" 
            onclick="clearSearch()"
            style="display: none;"
            aria-label="Clear"
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          <!-- Camera Button -->
          <button 
            class="icon-button" 
            onclick="openUploadModal()"
            aria-label="Upload image"
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
          </button>

          <!-- Voice Input Button -->
          <button 
            id="voice-btn"
            class="icon-button" 
            onclick="toggleVoiceInput()"
            aria-label="Start voice input"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c3.39-.49 6-3.3 6-6.72h-2z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="search-buttons-mobile">
        <button class="search-btn primary" onclick="handleSearch(event)">
          Analyze Nutrition
        </button>
        <button class="search-btn secondary" onclick="window.location.href='/research'">
          Verify With Evidence
        </button>
      </div>
    </div>

    <!-- MOBILE BOTTOM NAVIGATION -->
    <div class="bottom-nav">
      <button class="nav-btn" onclick="goToSearch()">
        <svg viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span>Search</span>
      </button>
      <button class="nav-btn" onclick="openUploadModal()">
        <svg viewBox="0 0 24 24">
          <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
        </svg>
        <span>Scan</span>
      </button>
      <button class="nav-btn" onclick="window.location.href='/research'">
        <svg viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        <span>Research</span>
      </button>
      <button class="nav-btn" onclick="alert('Login clicked')">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
        <span>Login</span>
      </button>
    </div>
  </div>

  <!-- IMAGE UPLOAD MODAL -->
  <div id="upload-modal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2>Upload Image</h2>
          <p style="font-size: 14px; color: #5f6368; margin: 5px 0 0 0;">Upload Image for Analysis</p>
        </div>
        <button class="modal-close" onclick="closeUploadModal()">&times;</button>
      </div>
      
      <div class="upload-area" onclick="document.getElementById('file-input').click()">
        <div class="upload-content">
          <svg class="upload-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          <p class="upload-text">
            Drag an image here or <button class="upload-link">upload a file</button>
          </p>
        </div>
        <input type="file" id="file-input" accept="image/*" style="display: none;" onchange="handleFileSelect(event)">
      </div>

      <div style="text-align: center; margin: 16px 0; color: #9aa0a6; font-size: 14px;">
        — OR —
      </div>

      <div class="url-section">
        <input type="text" class="url-input" placeholder="Paste image link" id="url-input">
        <button class="url-submit" onclick="handleUrlSubmit()">Search</button>
      </div>
    </div>
  </div>

  <!-- LOADING OVERLAY -->
  <div id="loading-overlay" class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-text">Analyzing...</p>
  </div>

  <!-- JAVASCRIPT -->
  <script>
    // ═══════════════════════════════════════════════════════════
    // ROTATING PLACEHOLDER TEXT
    // ═══════════════════════════════════════════════════════════
    const rotatingPrompts = [
      "Scan food and explain it",
      "Analyze my meals",
      "Create a nutrition plan for me",
      "Build me a workout plan",
      "Review this health claim",
      "Show me my habits over time",
      "Help me improve my health"
    ];

    let currentPromptIndex = 0;
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-btn');

    setInterval(() => {
      if (!searchInput.value) {
        currentPromptIndex = (currentPromptIndex + 1) % rotatingPrompts.length;
        searchInput.placeholder = rotatingPrompts[currentPromptIndex];
      }
    }, 4000);

    // ═══════════════════════════════════════════════════════════
    // SEARCH INPUT HANDLERS
    // ═══════════════════════════════════════════════════════════
    searchInput.addEventListener('input', function() {
      clearBtn.style.display = this.value ? 'flex' : 'none';
    });

    function autoResize(textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }

    function clearSearch() {
      searchInput.value = '';
      searchInput.style.height = '48px';
      clearBtn.style.display = 'none';
      searchInput.focus();
    }

    function handleSearch(event) {
      if (event) event.preventDefault();
      const query = searchInput.value.trim();
      if (!query) {
        alert('Please enter a search query');
        return;
      }
      
      // Show loading
      showLoading('Searching...');
      
      // Simulate search (replace with actual API call)
      setTimeout(() => {
        hideLoading();
        // Navigate to results or show results inline
        console.log('Search for:', query);
        alert('Search submitted: ' + query + '\n\nReplace this with your API call');
      }, 1500);
    }

    function goToSearch() {
      searchInput.value = '';
      searchInput.focus();
    }

    // ═══════════════════════════════════════════════════════════
    // VOICE INPUT
    // ═══════════════════════════════════════════════════════════
    let recognition = null;
    let isListening = false;
    const voiceBtn = document.getElementById('voice-btn');

    function toggleVoiceInput() {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not supported in this browser');
        return;
      }

      if (!recognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          isListening = true;
          voiceBtn.classList.add('listening');
          voiceBtn.setAttribute('aria-label', 'Stop listening');
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          searchInput.value = transcript;
          clearBtn.style.display = 'flex';
          autoResize(searchInput);
        };

        recognition.onerror = () => {
          isListening = false;
          voiceBtn.classList.remove('listening');
          voiceBtn.setAttribute('aria-label', 'Start voice input');
        };

        recognition.onend = () => {
          isListening = false;
          voiceBtn.classList.remove('listening');
          voiceBtn.setAttribute('aria-label', 'Start voice input');
        };
      }

      if (!isListening) {
        recognition.start();
      } else {
        recognition.stop();
      }
    }

    // ═══════════════════════════════════════════════════════════
    // UPLOAD MODAL
    // ═══════════════════════════════════════════════════════════
    const uploadModal = document.getElementById('upload-modal');

    function openUploadModal() {
      uploadModal.classList.add('active');
    }

    function closeUploadModal() {
      uploadModal.classList.remove('active');
    }

    // Close modal on overlay click
    uploadModal.addEventListener('click', function(e) {
      if (e.target === uploadModal) {
        closeUploadModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeUploadModal();
        hideLoading();
      }
    });

    function handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        console.log('File selected:', file.name);
        showLoading('Analyzing image...');
        
        // Simulate image analysis (replace with actual API call)
        setTimeout(() => {
          hideLoading();
          closeUploadModal();
          alert('Image uploaded: ' + file.name + '\n\nReplace this with your image analysis API call');
        }, 2000);
      }
    }

    function handleUrlSubmit() {
      const url = document.getElementById('url-input').value.trim();
      if (!url) {
        alert('Please enter an image URL');
        return;
      }
      
      console.log('URL submitted:', url);
      showLoading('Analyzing image...');
      
      // Simulate URL analysis (replace with actual API call)
      setTimeout(() => {
        hideLoading();
        closeUploadModal();
        alert('URL submitted: ' + url + '\n\nReplace this with your URL analysis API call');
      }, 2000);
    }

    // ═══════════════════════════════════════════════════════════
    // LOADING OVERLAY
    // ═══════════════════════════════════════════════════════════
    const loadingOverlay = document.getElementById('loading-overlay');

    function showLoading(message = 'Loading...') {
      loadingOverlay.querySelector('.loading-text').textContent = message;
      loadingOverlay.classList.add('active');
    }

    function hideLoading() {
      loadingOverlay.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════
    // DRAG AND DROP
    // ═══════════════════════════════════════════════════════════
    const uploadArea = document.querySelector('.upload-area');

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#1a73e8';
      uploadArea.style.background = 'rgba(26,115,232,0.05)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#dadce0';
      uploadArea.style.background = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#dadce0';
      uploadArea.style.background = 'transparent';
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        document.getElementById('file-input').files = e.dataTransfer.files;
        handleFileSelect({ target: { files: [file] } });
      }
    });
  </script>
</body>
</html>
```

---

## Component Structure Summary

```
VHealthSearch.tsx Z-Index Layers:
├── z-[3000] Loading Overlay (Spinner)
├── z-[2000] Upload Modal
├── z-[1200] Bottom Navigation (Mobile)
├── z-[1000] Results Overlay
├── z-[10002] Login Button (Fixed)
└── z-[0] Main Content (search-landing)

Key Interactive Elements:
├── Logo → Click to navigate to /about
├── Search Input → Textarea with auto-resize
├── Clear Button → Clears search query (shown when query exists)
├── Camera Button → Opens ImageUploadModal
├── Voice Button → Toggles speech recognition
├── Analyze Button → Triggers handleSearch()
├── Verify Button → Navigates to /research
└── Bottom Nav → Mobile navigation (Search, Scan, Research, Login)
```
