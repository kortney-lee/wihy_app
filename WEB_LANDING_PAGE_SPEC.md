# WiHY Web Landing Page Specification

## Overview
This document describes the web landing page design for future implementation. The landing page is meant to be the **only web-facing component** - all other functionality links to the mobile app.

## Design Reference
Based on VHealthSearch.tsx CSS specifications.

---

## Layout Structure

### Container
- Full viewport height (`min-h-screen`)
- White background (`#ffffff`)
- Centered content (flexbox column, align-items: center, justify-content: center)

### Logo
- WiHY logo image
- Max width: 600px (desktop), 85% viewport width (mobile)
- Height: 120px (desktop), 100px (mobile)
- Margin bottom: 32px (2rem)

### Search Bar
- **Width**: 90% of screen width on desktop (>768px), max 584px on mobile
- **Height**: 48px (desktop), 44px (mobile)
- **Border radius**: 24px
- **Shadow**: `0 2px 5px 1px rgba(64,60,67,0.16)`

### Login Button (Top Right)
- Position: absolute, top 48px, right 20px
- Size: 40x40px circular
- Background: `linear-gradient(to bottom right, #dbeafe, #bfdbfe)` (blue-100 to blue-200)
- Icon: Person icon, color `#2563eb` (blue-600)
- Opens auth modal on click

---

## Border Sweep Animation (Signature Effect)

### CSS Implementation
```css
@keyframes wiH-border-sweep {
  0%   { background-position: 0 0, 0% 0; }
  100% { background-position: 0 0, 200% 0; }
}

.search-input-container {
  position: relative;
  border: 2px solid transparent;
  border-radius: 24px;
  box-shadow: 0 2px 5px 1px rgba(64,60,67,0.16);
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box;
  background-size: 100% 100%, 200% 100%;
  animation: wiH-border-sweep 2.2s linear infinite;
  transition: box-shadow 200ms;
}

.search-input-container:hover,
.search-input-container:focus-within {
  box-shadow: 0 4px 8px 2px rgba(64,60,67,0.2);
}
```

### Brand Colors in Gradient
- **WiHY Orange**: `#fa5f06`
- **White**: `#ffffff`
- **Silver**: `#C0C0C0`
- **WiHY Green**: `#4cbb17`
- **WiHY Blue**: `#1a73e8`

---

## Search Bar Icons

### Icon Buttons (Right Side)
All icons inside search bar, positioned absolute right.

| Button | Icon | Size | Color | Action |
|--------|------|------|-------|--------|
| Clear | `close` (Ionicons) | 20px | `#6b7280` | Clears input text |
| Camera | `camera` (Ionicons) | 20px | `#70757a` | Opens scan/camera |
| Mic | `mic` (Ionicons) | 20px | `#70757a` (white when active) | Voice input via Web Speech API |

### Voice Input (Web Speech API)
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setQuery(transcript);
};

recognition.start();
```

### Mic Button Active State
- Background: `#ea4335` (red)
- Icon color: `#ffffff` (white)

---

## Rotating Placeholder Prompts

Cycles every 4 seconds:
1. "Scan food and explain it"
2. "Analyze my meals"
3. "Create a nutrition plan for me"
4. "Build me a workout plan"
5. "Review this health claim"
6. "Show me my habits over time"
7. "Help me improve my health"

---

## Responsive Breakpoints

| Device | Width | Search Bar Width | Padding |
|--------|-------|------------------|---------|
| Mobile | < 768px | 100%, max 584px | 20px |
| Tablet/Desktop | ≥ 768px | 90% viewport | 60px |

---

## Implementation Notes

### NativeWind Issue
NativeWind v4 with `react-native-css-interop@0.2.1` has a bug parsing `aspect-ratio: auto` from Tailwind's preflight styles. Options:
1. Disable preflight and aspectRatio in tailwind config
2. Use pure React Native styles for native, CSS only for web
3. Wait for fix in react-native-css-interop

### Recommended Approach
Create separate implementations:
- **Web**: Pure React/HTML with CSS for sweep animation
- **Native**: React Native StyleSheet (static orange border fallback)

### Key Files to Create
1. `App.web.js` - Web-specific entry with CSS import
2. `global.css` - Web-only CSS with sweep animation
3. `WihyHomeScreen.tsx` - Shared component with Platform.OS checks

### Tab Bar Visibility
- **Web**: Hide tab bar on Home screen (landing page only)
- **Native**: Show tab bar normally

---

## Future Considerations

1. **Standalone Web App**: Consider building a separate Next.js/Vite app for web
2. **Deep Linking**: Web landing should deep-link to mobile app stores
3. **SEO**: Web landing needs proper meta tags and SSR
4. **PWA**: Could add PWA support for web users

---

## Reference Screenshots

The web landing page should match the Google-style search layout with:
- Centered logo above search bar
- Full-width search with animated gradient border
- Minimal UI (just logo, search, login button)
- Clean white background
