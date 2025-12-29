# NutritionFacts  Chat Mobile Flow Guide

## Overview

This document explains how the **NutritionFacts** page and **FullScreenChat** component work together on mobile devices. The relationship is different from web - on mobile, they exist as **view modes within the same page** rather than separate routes, enabling smooth swipe gestures and instant transitions.

---

## Architecture Comparison

### Web (Desktop) Flow
```
┌─────────────────┐         ┌─────────────────┐
│ NutritionFacts  │ ────── │ FullScreenChat  │
│ Page (Route)    │  Modal  │ (Overlay)       │
└─────────────────┘  Popup  └─────────────────┘
     Separate              Slides in from
     route/page            right as modal
```

### Mobile Flow (Embedded Integration)
```
┌──────────────────────────────────────────┐
│        NutritionFacts Page               │
│                                          │
│  ┌────────────┐      ┌────────────┐     │
│  │  Overview  │────│    Chat    │     │
│  │  View Mode │ Swipe│  View Mode │     │
│  └────────────┘      └────────────┘     │
│                                          │
│  Both exist in same component            │
│  Toggle visibility with CSS transforms   │
└──────────────────────────────────────────┘
```

---

## Key Concepts

### 1. View Mode System

**File**: `NutritionFacts.tsx` (line 17, 82)

```typescript
type ViewMode = "overview" | "chat";

const [viewMode, setViewMode] = useState<ViewMode>(
  locationState.fromChat ? "chat" : "overview"
);
```

**Two modes:**
- **`overview`**: Shows nutrition facts, ingredients, health scores
- **`chat`**: Shows embedded FullScreenChat component

**Why?** On mobile, switching between separate pages/routes feels slow and breaks the user's flow. Using view modes keeps everything in memory for instant transitions.

### 2. Embedded vs Standalone Chat

**FullScreenChat** can operate in two modes:

```typescript
interface FullScreenChatProps {
  isEmbedded?: boolean;      // Is chat embedded in another page?
  onBackToOverview?: () => void;  // Callback to return to parent
  // ... other props
}
```

**Embedded Mode** (NutritionFacts page):
- [OK] No backdrop overlay
- [OK] Parent controls visibility
- [OK] Uses parent's navigation
- [OK] Smooth swipe gestures work

**Standalone Mode** (Opened from home):
- [OK] Full-screen overlay with backdrop
- [OK] Independent routing
- [OK] Slides in from right edge
- [X] No swipe gestures (uses close button)

---

## NutritionFacts → Chat Flow

### User Actions
1. User views nutrition facts in **overview mode**
2. User **swipes left** OR **taps "Chat" button**
3. Chat view slides in from right
4. User can ask questions about the product

### Implementation

#### Step 1: Touch Gesture Detection

**File**: `NutritionFacts.tsx` (lines 157-182)

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
};

const handleTouchMove = (e: React.TouchEvent) => {
  touchEndX.current = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  const swipeThreshold = 50; // minimum swipe distance in pixels
  const diff = touchStartX.current - touchEndX.current;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0 && viewMode === "overview") {
      // Swiped LEFT → Show chat
      handleViewModeChange("chat");
    }
  }
};
```

**How it works:**
- Tracks touch start position (`touchStartX`)
- Tracks touch end position (`touchEndX`)
- Calculates swipe distance (`diff`)
- If swipe distance > 50px AND swiped left → switch to chat

#### Step 2: View Mode Change

**File**: `NutritionFacts.tsx` (lines 185-208)

```typescript
const handleViewModeChange = (newMode: ViewMode) => {
  if (newMode === 'chat') {
    // Pre-mount chat if not already mounted
    if (!chatMounted) {
      setChatMounted(true);
    }
    
    // Smooth transition to chat
    setSlideDirection('left');
    setTimeout(() => {
      setViewMode(newMode);
    }, 50);
  }
}
```

**What happens:**
1. Sets `chatMounted = true` (renders FullScreenChat in DOM)
2. Sets `slideDirection = 'left'` (triggers CSS animation)
3. After 50ms, sets `viewMode = 'chat'` (makes chat visible)

#### Step 3: Chat Component Renders

**File**: `NutritionFacts.tsx` (lines 1087-1127)

```typescript
{/* Chat Content - Conditionally mounted with smooth transitions */}
{(chatMounted || viewMode === "chat") && (
  <div 
    className={`absolute top-0 left-0 right-0 bottom-0 ${
      viewMode === "chat" 
        ? "opacity-100 translate-x-0 pointer-events-auto" 
        : "opacity-0 translate-x-full pointer-events-none"
    }`}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    <FullScreenChat
      isOpen={viewMode === "chat"}
      initialQuery={initialQuery || nutritionfacts.askWihy}
      initialResponse={chatPreloaded ? chatResponse : undefined}
      onClose={() => handleViewModeChange("overview")}
      isEmbedded={true}  // ← KEY: Tells chat it's embedded
      onBackToOverview={() => handleViewModeChange("overview")}
      onNewScan={handleNewScan}
      productName={nutritionfacts.name}
      apiResponseData={nutritionfacts}
      sessionId={sessionId}
      askWihy={nutritionfacts.askWihy}
    />
  </div>
)}
```

**CSS Transitions:**
- **Hidden**: `opacity-0 translate-x-full pointer-events-none` (off-screen right)
- **Visible**: `opacity-100 translate-x-0 pointer-events-auto` (on-screen)
- **Duration**: 300ms smooth transition

#### Step 4: Chat Auto-loads Response

**File**: `FullScreenChat.tsx` (lines 313-403)

```typescript
// Auto-call /ask endpoint when chat opens with initialQuery and askWihy
useEffect(() => {
  if (!isOpen || !initialQuery || !askWihy) return;
  if (messages.length > 0) return; // Only run if no messages yet
  if (isLoading) return;

  const autoFetchInitialResponse = async () => {
    console.log(' AUTO-FETCHING: Calling /ask endpoint on chat open');
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `initial_${Date.now()}`,
      type: 'user',
      message: initialQuery,
      timestamp: new Date()
    };
    setMessages([userMessage]);

    try {
      // Call /ask endpoint directly with askWihy parameter
      const response = await chatService.sendDirectMessage(
        initialQuery,
        currentSessionId || undefined,
        askWihy  // ← Pre-formatted query from scan API
      );

      // Process response and add to chat...
    } catch (error) {
      console.error(' AUTO-FETCH ERROR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Small delay to ensure session is initialized
  const timer = setTimeout(autoFetchInitialResponse, 300);
  return () => clearTimeout(timer);
}, [isOpen, initialQuery, askWihy, currentSessionId]);
```

**Key Points:**
- Automatically calls `/api/ask` when chat opens
- Uses `askWihy` parameter from the barcode scan (pre-formatted query)
- Uses `sessionId` for conversation continuity
- Only runs once (prevents duplicate calls)

---

## Chat → NutritionFacts Flow

### User Actions
1. User is in **chat mode** asking questions
2. User **swipes right** OR **taps back arrow**
3. Overview slides back in from left
4. User sees nutrition facts again

### Implementation

#### Step 1: Touch Gesture Detection (Reverse)

**File**: `NutritionFacts.tsx` (lines 165-180)

```typescript
const handleTouchEnd = () => {
  const swipeThreshold = 50;
  const diff = touchStartX.current - touchEndX.current;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff < 0 && viewMode === "chat") {
      // Swiped RIGHT → Show overview
      handleViewModeChange("overview");
    }
  }
};
```

**How it works:**
- If `diff < 0` (swiped right) AND in chat mode → return to overview

#### Step 2: View Mode Change (Reverse)

**File**: `NutritionFacts.tsx` (lines 185-208)

```typescript
const handleViewModeChange = (newMode: ViewMode) => {
  if (newMode === 'overview') {
    // Smooth transition to overview
    setSlideDirection('right');
    setTimeout(() => {
      setViewMode(newMode);
    }, 50);
  }
}
```

**What happens:**
1. Sets `slideDirection = 'right'` (triggers reverse animation)
2. After 50ms, sets `viewMode = 'overview'` (makes overview visible)

#### Step 3: Overview Becomes Visible Again

**File**: `NutritionFacts.tsx` (lines 601-625)

```typescript
{/* Overview Content - Show/Hide with transitions */}
<div 
  ref={overviewRef}
  className={`${
    slideDirection === 'right'
      ? `transition-all duration-300 ease-in-out ${
          viewMode === "overview" 
            ? "opacity-100 translate-x-0 pointer-events-auto" 
            : "opacity-0 translate-x-full pointer-events-none absolute inset-0"
        }`
      : /* left slide animation */
  }`}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* Nutrition facts content */}
</div>
```

**CSS Transitions:**
- **Hidden**: `opacity-0 translate-x-full` (off-screen right)
- **Visible**: `opacity-100 translate-x-0` (on-screen)
- Overview slides in from right as chat slides out to right

#### Step 4: Scroll Position Restored

**File**: `NutritionFacts.tsx` (lines 107-120)

```typescript
const overviewScrollPos = useRef<number>(0);
const overviewRef = useRef<HTMLDivElement>(null);

// Save scroll position when switching away from overview
useEffect(() => {
  if (viewMode !== 'overview' && overviewRef.current) {
    overviewScrollPos.current = overviewRef.current.scrollTop;
  }
}, [viewMode]);

// Restore scroll position when returning to overview
useEffect(() => {
  if (viewMode === 'overview' && overviewRef.current) {
    overviewRef.current.scrollTop = overviewScrollPos.current;
  }
}, [viewMode]);
```

**Why?** User doesn't lose their place when switching views. If they scrolled down to ingredients, they return to that same position.

---

## Chat → New Scan → New NutritionFacts Flow

### User Actions
1. User is in **chat mode**
2. User taps **camera icon** in chat header
3. Camera opens for barcode scanning
4. User scans a **different product**
5. New NutritionFacts page loads with new product data

### Implementation

#### Step 1: Camera Icon Tap in Chat

**File**: `FullScreenChat.tsx` (lines 1210-1298)

```typescript
{/* Camera button in chat header */}
<button
  onClick={onNewScan}  // ← Calls parent's handleNewScan
  className="p-2 hover:bg-white/10 rounded-full transition-colors"
  title="Scan Product"
>
  <Camera className="w-6 h-6 text-white" />
</button>
```

#### Step 2: Parent Handles Camera Scan

**File**: `NutritionFacts.tsx` (lines 493-562)

```typescript
const handleNewScan = async () => {
  debug.logEvent('New scan initiated', { currentProduct: nutritionfacts?.name });
  
  try {
    await scanningService.openCameraWithBarcodeScanning(
      async (barcode: string) => {
        console.log('[OK] Barcode detected from NutritionFacts camera:', barcode);
        
        try {
          // Scan new barcode and navigate to new nutrition facts
          const barcodeResult = await wihyScanningService.scanBarcode(barcode);
          if (barcodeResult.success) {
            // Use the normalize function to convert barcode result
            const newNutritionfacts = normalizeBarcodeScan(barcodeResult);
            
            // Cache in sessionStorage
            sessionStorage.setItem('nutritionfacts_data', JSON.stringify({
              nutritionfacts: newNutritionfacts,
              sessionId: barcodeResult.sessionId,
              timestamp: Date.now()
            }));
            
            // Navigate to NEW nutrition facts page
            navigate('/nutritionfacts', {
              state: {
                nutritionfacts: newNutritionfacts,
                sessionId: barcodeResult.sessionId,
                fromChat: false,  // Start in overview mode
                isNewScan: true   // Trigger slide-in animation
              },
              replace: false  // Create new history entry (back button works)
            });
            return;
          }
          
          // If scan fails, show error
          alert(barcodeResult.error || 'Barcode not found in database');
        } catch (error) {
          console.error('Error during camera barcode processing:', error);
          alert('Please try scanning again.');
        }
      },
      () => {
        console.log('[X] Camera scan closed by user');
      }
    );
  } catch (error) {
    console.error('[X] Error opening camera:', error);
    alert('Camera access failed. Please ensure permissions are granted.');
  }
};
```

**Key Points:**
1. Opens native camera via `scanningService`
2. When barcode detected → calls `/api/scan` endpoint
3. Normalizes API response to `NutritionFactsData` format
4. **Navigates to NEW page** (not just changing view mode)
5. Uses `replace: false` so back button returns to previous product
6. Starts in `overview` mode (not chat)

#### Step 3: New Page Initialization

**File**: `NutritionFacts.tsx` (lines 211-230)

```typescript
// Disable transitions on initial mount to prevent flash
React.useEffect(() => {
  const state = location.state as LocationState;
  const isNewScan = window.history.state?.usr?.isNewScan;
  
  if (isNewScan) {
    // New scan - slide in from right
    setSlideDirection('right');
    setIsInitialMount(false);
  } else {
    // First load or from home - no animation
    setSlideDirection('none');
    setTimeout(() => {
      setIsInitialMount(false);
    }, 50);
  }
}, [location.state]);
```

**Animation behavior:**
- **New scan** (`isNewScan: true`): Slides in from right
- **First load**: No animation (instant display)

---

## Data Flow & Session Continuity

### Session ID Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    BARCODE SCAN                          │
│  POST /api/scan { barcode: "012345678901" }            │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Returns scan_metadata.session_id
                        ▼
┌─────────────────────────────────────────────────────────┐
│           session_id: "barcode_012345678901_1735..."    │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Passed to NutritionFacts page
                        ▼
┌─────────────────────────────────────────────────────────┐
│              NutritionFacts Component                    │
│  const [sessionId, setSessionId] = useState(...)        │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Passed as prop to FullScreenChat
                        ▼
┌─────────────────────────────────────────────────────────┐
│               FullScreenChat Component                   │
│  sessionId prop → currentSessionId state                │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Used in all /api/ask calls
                        ▼
┌─────────────────────────────────────────────────────────┐
│         POST /api/ask                                    │
│  {                                                       │
│    query: "Is this healthy?",                           │
│    context: {                                            │
│      product_name: "Organic Almond Milk",              │
│      nutrition_data: {...},                             │
│      session_id: "barcode_012345678901_1735..."        │
│    }                                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                        │
                        │ AI remembers the scanned product!
                        ▼
                  "Yes, Organic Almond Milk is..."
```

**Why Session ID Matters:**
- AI can reference the specific product scanned
- Maintains conversation context across multiple questions
- Enables personalized responses based on product data

### Props Passed to Chat

**File**: `NutritionFacts.tsx` (lines 1110-1120)

```typescript
<FullScreenChat
  isOpen={viewMode === "chat"}
  initialQuery={initialQuery || nutritionfacts.askWihy}
  initialResponse={chatPreloaded ? chatResponse : undefined}
  onClose={() => handleViewModeChange("overview")}
  isEmbedded={true}
  onBackToOverview={() => handleViewModeChange("overview")}
  onNewScan={handleNewScan}
  productName={nutritionfacts.name}
  apiResponseData={nutritionfacts}
  sessionId={sessionId}
  askWihy={nutritionfacts.askWihy}
/>
```

**Prop Breakdown:**

| Prop | Purpose | Example Value |
|------|---------|---------------|
| `isOpen` | Controls visibility | `viewMode === "chat"` |
| `initialQuery` | First user message | `"Tell me about Organic Almond Milk"` |
| `initialResponse` | Pre-loaded AI response | Chat response from pre-load |
| `onClose` | Return to overview | `() => handleViewModeChange("overview")` |
| `isEmbedded` | Embedded mode flag | `true` |
| `onBackToOverview` | Back button handler | `() => handleViewModeChange("overview")` |
| `onNewScan` | Camera scan handler | `handleNewScan` |
| `productName` | Product display name | `"Organic Almond Milk"` |
| `apiResponseData` | Full nutrition data | Complete `NutritionFactsData` object |
| `sessionId` | Conversation ID | `"barcode_012345678901_1735..."` |
| `askWihy` | Pre-formatted query | `"Tell me about the health benefits of..."` |

---

## Mobile vs Web Differences

### Mobile (Embedded Integration)

[OK] **Advantages:**
- Instant view switching (no route changes)
- Smooth swipe gestures
- Maintains scroll position
- Pre-loaded chat responses
- No full-page reloads

[!] **Considerations:**
- Both views loaded in memory
- Larger initial bundle size
- More complex state management

**User Experience:**
```
User scans barcode
    ↓ (Instant)
Overview loads
    ↓ (Swipe left - 300ms animation)
Chat appears
    ↓ (Already loaded - instant response!)
AI response shows
    ↓ (Swipe right - 300ms animation)
Overview appears (scroll position restored)
```

### Web (Modal Overlay)

**File**: `FullScreenChat.tsx` (lines 1171-1177)

```typescript
{/* Backdrop overlay - only show for standalone (non-embedded) mode */}
{!isEmbedded && (
  <div 
    className={`fixed inset-0 bg-black/50 z-[9999] ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    onClick={onClose} 
  />
)}
```

[OK] **Advantages:**
- Clear separation of concerns
- Smaller initial page load
- Traditional UX pattern (familiar to users)
- Can click backdrop to close

[!] **Considerations:**
- Route changes feel slower
- No swipe gestures
- Separate mount/unmount cycles
- More network requests

**User Experience:**
```
User scans barcode
    ↓ (Route navigation)
NutritionFacts page loads
    ↓ (Click chat button)
Modal slides in from right (500ms)
    ↓ (API call to /api/ask)
Wait for response (1-2 seconds)
    ↓ (Click backdrop or close)
Modal slides out (500ms)
```

---

## Performance Optimizations

### 1. Chat Pre-loading

**File**: `NutritionFacts.tsx` (lines 420-473)

```typescript
// Pre-load chat response when nutrition facts data is available
const preloadChatResponse = async (askWihyQuery: string) => {
  if (chatPreloaded || chatLoading || !askWihyQuery) return;
  
  setChatLoading(true);
  
  try {
    const response = await fetch('https://services.wihy.ai/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: askWihyQuery,
        context: {
          product_name: nutritionfacts?.name,
          nutrition_data: nutritionfacts,
          session_id: sessionId
        }
      })
    });
    
    const data = await response.json();
    setChatResponse(data.response || data.answer);
    setChatPreloaded(true);
  } catch (error) {
    console.error('Error pre-loading chat response:', error);
    setChatPreloaded(true); // Prevent retries
  }
};

// Pre-load chat when nutrition facts data is available
useEffect(() => {
  if (nutritionfacts?.askWihy && !chatPreloaded && !chatLoading) {
    // Add delay to let the page render first
    const timer = setTimeout(() => {
      preloadChatResponse(nutritionfacts.askWihy!);
    }, 2000);
    
    return () => clearTimeout(timer);
  }
}, [nutritionfacts?.askWihy, chatPreloaded, chatLoading]);
```

**How it works:**
1. User lands on NutritionFacts page (overview mode)
2. After 2 seconds (page fully rendered), start pre-loading chat response
3. Call `/api/ask` in background with `askWihy` query
4. Store response in `chatResponse` state
5. When user switches to chat mode → response already loaded! (instant display)

**Benefits:**
- Perceived instant chat response
- Better UX (no waiting spinner)
- Network call happens during idle time

### 2. Component Mounting Strategy

**File**: `NutritionFacts.tsx` (lines 476-489)

```typescript
// Mount chat component when switching to chat view
useEffect(() => {
  if (viewMode === 'chat') {
    setChatMounted(true);
    // If chat not preloaded yet, try to preload now
    if (!chatPreloaded && !chatLoading && nutritionfacts?.askWihy) {
      preloadChatResponse(nutritionfacts.askWihy);
    }
  }
}, [viewMode, chatPreloaded, chatLoading, nutritionfacts?.askWihy]);
```

**Strategy:**
- **First view switch**: Mount FullScreenChat component
- **Subsequent switches**: Component stays mounted (hidden/shown with CSS)
- **Benefit**: No re-mounting overhead, faster transitions

### 3. Conditional Rendering

**File**: `NutritionFacts.tsx` (lines 1087-1127)

```typescript
{/* Chat Content - Conditionally mounted with smooth transitions */}
{(chatMounted || viewMode === "chat") && (
  <div className={/* ... */}>
    <FullScreenChat {...props} />
  </div>
)}
```

**Logic:**
- Render chat if: `chatMounted === true` OR `viewMode === "chat"`
- Once mounted, stays in DOM even when hidden
- CSS controls visibility, not React mounting

### 4. SessionStorage Caching

**File**: `NutritionFacts.tsx` (lines 515-523)

```typescript
try {
  sessionStorage.setItem('nutritionfacts_data', JSON.stringify({
    nutritionfacts: newNutritionfacts,
    sessionId: barcodeResult.sessionId,
    timestamp: Date.now()
  }));
} catch (e) {
  console.warn('Failed to store in sessionStorage:', e);
}
```

**Benefits:**
- Survives page refreshes
- Reduces API calls on navigation
- Enables offline viewing (cached data)
- Fallback if navigation state is lost

---

## Common Mobile Issues & Solutions

### Issue 1: Chat Doesn't Remember Product

**Symptom:** User switches to chat, but AI doesn't know what product was scanned.

**Cause:** `sessionId` not passed correctly.

**Solution:**
```typescript
// [OK] CORRECT - Pass sessionId to chat
<FullScreenChat
  sessionId={sessionId}  // From barcode scan
  apiResponseData={nutritionfacts}
  productName={nutritionfacts.name}
/>

// [X] WRONG - Missing sessionId
<FullScreenChat
  productName={nutritionfacts.name}
/>
```

### Issue 2: Swipe Gestures Not Working

**Symptom:** User swipes left/right but nothing happens.

**Cause:** Touch event handlers not attached to parent div.

**Solution:**
```typescript
// [OK] CORRECT - Attach touch handlers
<div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* Content */}
</div>

// [X] WRONG - No touch handlers
<div>
  {/* Content */}
</div>
```

### Issue 3: Scroll Position Lost

**Symptom:** User scrolls down in overview, switches to chat, returns to overview → page is scrolled to top.

**Cause:** Not saving scroll position.

**Solution:**
```typescript
// [OK] CORRECT - Save and restore scroll position
const overviewScrollPos = useRef<number>(0);

useEffect(() => {
  if (viewMode !== 'overview' && overviewRef.current) {
    overviewScrollPos.current = overviewRef.current.scrollTop;
  }
}, [viewMode]);

useEffect(() => {
  if (viewMode === 'overview' && overviewRef.current) {
    overviewRef.current.scrollTop = overviewScrollPos.current;
  }
}, [viewMode]);
```

### Issue 4: Chat Response Takes Too Long

**Symptom:** User switches to chat and waits 3+ seconds for response.

**Cause:** Not pre-loading chat response in background.

**Solution:**
```typescript
// [OK] CORRECT - Pre-load in background
useEffect(() => {
  if (nutritionfacts?.askWihy && !chatPreloaded) {
    const timer = setTimeout(() => {
      preloadChatResponse(nutritionfacts.askWihy!);
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [nutritionfacts?.askWihy]);

// [X] WRONG - Load only when chat opens
useEffect(() => {
  if (viewMode === 'chat') {
    loadChatResponse(); // User sees spinner!
  }
}, [viewMode]);
```

### Issue 5: Animations Choppy

**Symptom:** Slide transitions feel janky or stuttery.

**Cause:** Too complex CSS during transition or re-rendering during animation.

**Solution:**
```typescript
// [OK] CORRECT - Simple transform/opacity transitions
className={`transition-all duration-300 ease-in-out ${
  viewMode === "chat" 
    ? "opacity-100 translate-x-0" 
    : "opacity-0 translate-x-full"
}`}

// [X] WRONG - Complex transitions or layout changes
className={`transition-all duration-300 ${
  viewMode === "chat"
    ? "visible w-full h-full flex flex-col"
    : "invisible w-0 h-0 hidden"
}`}
```

**Additional tips:**
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid `width`, `height`, `margin` during transitions
- Use `will-change: transform, opacity` for smoother animations

---

## Best Practices for Mobile Integration

### 1. Always Use Embedded Mode on Mobile

```typescript
// [OK] CORRECT
<FullScreenChat
  isEmbedded={true}
  onBackToOverview={() => setViewMode("overview")}
/>

// [X] WRONG (use standalone only for desktop modals)
<FullScreenChat
  isEmbedded={false}
  onClose={onClose}
/>
```

### 2. Provide Multiple Navigation Options

```typescript
// User can:
// 1. Swipe left/right
// 2. Tap view mode buttons
// 3. Tap back arrow in chat header

<FullScreenChat
  onBackToOverview={() => handleViewModeChange("overview")}  // Back arrow
  onClose={() => handleViewModeChange("overview")}  // Fallback
/>
```

### 3. Pre-load Data Aggressively

```typescript
// Pre-load chat response while user reads nutrition facts
useEffect(() => {
  if (nutritionfacts?.askWihy) {
    setTimeout(() => preloadChatResponse(nutritionfacts.askWihy), 2000);
  }
}, [nutritionfacts]);

// Cache data for offline access
sessionStorage.setItem('nutritionfacts_data', JSON.stringify({
  nutritionfacts,
  sessionId,
  timestamp: Date.now()
}));
```

### 4. Maintain Session Continuity

```typescript
// Always pass session ID through the entire flow
Barcode Scan → sessionId generated
    ↓
NutritionFacts state → sessionId stored
    ↓
FullScreenChat prop → sessionId passed
    ↓
/api/ask calls → sessionId in context
```

### 5. Handle Navigation State Properly

```typescript
// New scan → Create new history entry (back button works)
navigate('/nutritionfacts', {
  state: { nutritionfacts, sessionId },
  replace: false  // Don't replace history
});

// View mode change → No navigation (same page)
setViewMode("chat");  // Just toggle visibility
```

---

## Complete Mobile Flow Example

### Scenario: User scans barcode → views facts → asks question → scans new product

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: User scans barcode "012345678901"               │
└─────────────────────────────────────────────────────────┘
                        │
                        │ POST /api/scan
                        ▼
                   API Response:
                   - product: "Organic Almond Milk"
                   - nutrition: {...}
                   - session_id: "barcode_012345678901_1735..."
                        │
                        │ navigate('/nutritionfacts', { state })
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: NutritionFacts Page Loads (Overview Mode)       │
│                                                          │
│  State:                                                  │
│  - viewMode = "overview"                                │
│  - sessionId = "barcode_012345678901_1735..."          │
│  - nutritionfacts = { name: "Organic Almond Milk", ... }│
│                                                          │
│  [After 2 seconds]                                      │
│  → Pre-loads chat response in background               │
│    POST /api/ask { query: askWihy, session_id }        │
└─────────────────────────────────────────────────────────┘
                        │
                        │ User swipes LEFT
                        ▼
                   setSlideDirection('left')
                   setTimeout(() => setViewMode('chat'), 50)
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Chat View Slides In (300ms animation)           │
│                                                          │
│  FullScreenChat renders with:                           │
│  - isEmbedded = true                                    │
│  - sessionId = "barcode_012345678901_1735..."          │
│  - initialResponse = pre-loaded response (instant!)     │
│                                                          │
│  Chat shows:                                             │
│  User: "Tell me about Organic Almond Milk"             │
│  AI:   [Pre-loaded response appears immediately]        │
└─────────────────────────────────────────────────────────┘
                        │
                        │ User types: "Is this good for weight loss?"
                        ▼
                   POST /api/ask {
                     query: "Is this good for weight loss?",
                     context: {
                       product_name: "Organic Almond Milk",
                       session_id: "barcode_012345678901_1735..."
                     }
                   }
                        │
                        │ API response (AI remembers the product!)
                        ▼
                   "Yes, Organic Almond Milk is great for
                    weight loss because..."
                        │
                        │ User taps Camera icon in chat
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Camera Opens for New Scan                       │
└─────────────────────────────────────────────────────────┘
                        │
                        │ User scans barcode "987654321098"
                        ▼
                   POST /api/scan { barcode: "987654321098" }
                        │
                        │ API Response:
                        │ - product: "Greek Yogurt"
                        │ - session_id: "barcode_987654321098_1735..."
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 5: NEW NutritionFacts Page (Different Product!)    │
│                                                          │
│  navigate('/nutritionfacts', {                          │
│    state: {                                              │
│      nutritionfacts: { name: "Greek Yogurt", ... },     │
│      sessionId: "barcode_987654321098_1735...",         │
│      fromChat: false,  ← Starts in overview mode        │
│      isNewScan: true   ← Triggers slide-in animation    │
│    },                                                    │
│    replace: false  ← Back button returns to prev product│
│  })                                                      │
│                                                          │
│  State:                                                  │
│  - viewMode = "overview" (fresh start)                  │
│  - sessionId = "barcode_987654321098_1735..." (NEW!)   │
│  - nutritionfacts = { name: "Greek Yogurt", ... }       │
└─────────────────────────────────────────────────────────┘
                        │
                        │ User presses BACK button
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 6: Returns to Previous NutritionFacts Page          │
│                                                          │
│  Product: "Organic Almond Milk"                         │
│  ViewMode: "chat" (where they left off!)               │
│  Session: Original conversation preserved               │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

### Key Takeaways

1. **Mobile uses view modes**, not separate routes
   - Faster transitions
   - Better UX with swipe gestures
   - More complex state management

2. **Embedded integration** is essential for mobile
   - `isEmbedded={true}` removes backdrop
   - Parent controls navigation
   - Smooth CSS transitions

3. **Session continuity** enables context-aware chat
   - `sessionId` from barcode scan
   - Passed to all `/api/ask` calls
   - AI remembers scanned product

4. **Pre-loading** improves perceived performance
   - Load chat response in background
   - Show instant response when user switches
   - Better than spinner/loading state

5. **Multiple navigation paths** to same destination
   - Swipe gestures (left/right)
   - Button taps (view mode toggle)
   - Back arrow (chat header)

6. **New scans create new pages**, not view changes
   - Enables back button navigation
   - Separate history entries per product
   - Clean state management

### Architecture Benefits

[OK] **Instant transitions** (300ms animations)  
[OK] **No loading spinners** (pre-loaded responses)  
[OK] **Natural mobile gestures** (swipe navigation)  
[OK] **Preserved scroll position** (better UX)  
[OK] **Session continuity** (context-aware AI)  
[OK] **Offline support** (sessionStorage caching)  
[OK] **Multi-product history** (back button works)  

This architecture provides a **native app-like experience** while maintaining the flexibility of a web application.
