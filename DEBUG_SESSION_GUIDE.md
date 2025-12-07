# Debug Session Tracking Guide

## Overview
The debug overlay now tracks the **entire user journey** from start to finish, persisting logs across page navigations using sessionStorage.

## How to Use

### 1. Start a Debug Session
Add `?debug=true` to any URL:
```
http://localhost:3000/?debug=true
https://wihy.ai/?debug=true
http://localhost:3000/nutritionfacts?debug=true
```

### 2. The Debug Parameter Propagates
Once `?debug=true` is set, the debug overlay automatically adds it to all navigation links, so logs persist through:
- Search page → Image upload modal
- Camera scan → Barcode detection  
- Product lookup → FullScreenChat
- FullScreenChat → NutritionFacts page
- NutritionFacts → Follow-up questions

### 3. Debug Overlay Features

**Header Bar (Bottom of Screen)**
- Shows current page name
- Displays total log count
- Shows session start time
- Tap to expand/collapse

**Buttons**
- **Reset**: Clear session and reload (removes ?debug=true)
- **Export**: Download complete session as JSON file

**Filter Tabs**
- `ALL`: Show all logs
- `NAVIGATION`: Page transitions
- `SCAN`: Camera, barcode detection
- `API`: HTTP requests/responses
- `ERROR`: Exceptions and failures
- `CSS`: Stylesheet loading
- `RENDER`: Component lifecycle
- `STATE`: State changes
- `EVENT`: User interactions
- `SYSTEM`: Device info, platform

**Log Format**
```
+2.345s [ImageUploadModal] SCAN: BARCODE DETECTED!
  └─ Time since session start
  └─ Originating page
  └─ Log type
  └─ Message
  └─ Optional: 📋 View Data (expandable)
```

## What Gets Tracked

### Complete Scan Flow Example

**1. User opens search page with ?debug=true**
```
+0.000s [VHealthSearch] SYSTEM: Page: VHealthSearch
+0.001s [VHealthSearch] SYSTEM: UserAgent: Mozilla/5.0...
+0.002s [VHealthSearch] SYSTEM: Platform: iPhone
+0.003s [VHealthSearch] SYSTEM: Viewport: 393x852
```

**2. User clicks camera button**
```
+5.234s [ImageUploadModal] SCAN: Camera button clicked
  Data: { platform: "iOS", isMobile: true }
+5.456s [ImageUploadModal] SCAN: BarcodeDetector initialized
  Data: { formats: ["ean_13", "ean_8", "upc_a"...] }
```

**3. Barcode is detected**
```
+8.789s [ImageUploadModal] SCAN: ✅ BARCODE DETECTED!
  Data: { barcode: "012000161155", format: "ean_13" }
+8.790s [ImageUploadModal] API: Calling wihyScanningService.scanBarcode
  Data: { barcode: "012000161155" }
```

**4. Product data returns**
```
+9.234s [ImageUploadModal] API: Barcode API response received
  Data: { success: true, hasSessionId: true }
+9.235s [ImageUploadModal] NAVIGATION: Navigating to NutritionFacts page
  Data: { sessionId: "abc123..." }
```

**5. NutritionFacts page loads**
```
+9.456s [NutritionFacts] RENDER: NutritionFacts component mounted
+9.457s [NutritionFacts] STATE: Checking data sources
  Data: { hasLocationState: true }
+9.458s [NutritionFacts] STATE: Data loaded successfully
  Data: { productName: "Coca-Cola Classic" }
```

**6. User asks follow-up question**
```
+15.678s [NutritionFacts] API: Sending followup question
  Data: { question: "Is this healthy?", sessionId: "abc123..." }
+16.234s [NutritionFacts] API: Followup response received
  Data: { success: true }
```

## Exported Session Format

When you click **Export**, you get a JSON file like:
```json
{
  "session_start": "2025-12-07T14:30:45.678Z",
  "session_duration": "23.5s",
  "current_page": "NutritionFacts",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)",
  "platform": "iPhone",
  "viewport": "393x852",
  "screen": "1179x2556",
  "pixel_ratio": 3,
  "touch_support": true,
  "total_logs": 47,
  "logs": [
    {
      "time": "+0.000s",
      "page": "VHealthSearch",
      "type": "system",
      "message": "Page: VHealthSearch",
      "data": null
    },
    {
      "time": "+8.789s",
      "page": "ImageUploadModal",
      "type": "scan",
      "message": "✅ BARCODE DETECTED!",
      "data": {
        "barcode": "012000161155",
        "format": "ean_13"
      }
    }
    // ... all logs
  ]
}
```

## Mobile Testing

**On iPhone/Android:**
1. Open Safari/Chrome
2. Navigate to: `https://wihy.ai/?debug=true`
3. Tap camera icon
4. Scan a barcode
5. View nutrition facts
6. Scroll to bottom to see debug overlay
7. Tap header to expand/collapse
8. Filter logs by type
9. Export session for analysis

**What You'll See:**
- Camera permission requests logged
- BarcodeDetector availability (iOS 15+ only)
- Barcode detection events
- API call timing
- Navigation between pages
- CSS conflicts (if any)
- Console errors captured
- All state changes

## Troubleshooting with Debug Logs

### White Screen Issue
1. Add `?debug=true` to URL
2. Filter by `CSS` to see which stylesheets loaded
3. Filter by `ERROR` to see any exceptions
4. Check `RENDER` logs to confirm components mounted
5. Export session and check for mobile-fixes.css conflicts

### Barcode Not Scanning
1. Filter by `SCAN` logs
2. Check if `BarcodeDetector initialized` appears
3. Look for "BarcodeDetector NOT available" message
4. Check if camera permissions were granted
5. Verify format is supported (ean_13, upc_a, etc.)

### Navigation Lost Data
1. Filter by `NAVIGATION` logs
2. Check if sessionId was passed
3. Look at `STATE` logs in NutritionFacts
4. Verify sessionStorage backup was created
5. Check if data age is < 30 seconds

## Performance Impact

- **Minimal**: Logs stored in memory + sessionStorage
- **Session Limit**: ~5MB sessionStorage (thousands of logs)
- **Auto-cleanup**: Session clears on browser tab close
- **No server impact**: All client-side only

## Privacy Note

- Debug logs stay in your browser (sessionStorage)
- Export is manual - no automatic sending
- Logs cleared when you:
  - Click "Reset" button
  - Close browser tab
  - Clear browser data
- No sensitive data logged (passwords, tokens filtered out)

## Development Tips

### Adding Custom Logs

```typescript
import { useDebugLog } from '../components/debug/DebugOverlay';

const MyComponent = () => {
  const debug = useDebugLog('MyComponent');
  
  // Available methods:
  debug.logRender('Component mounted', { props });
  debug.logState('State updated', { newState });
  debug.logEvent('Button clicked', { buttonId });
  debug.logAPI('Fetching data', { url });
  debug.logError('API failed', { error });
  debug.logNavigation('Navigating to page', { route });
  debug.logScan('Barcode detected', { barcode });
};
```

### Best Practices

1. **Log important events only** - Don't log every render
2. **Include context** - Pass data object with relevant info
3. **Use correct type** - navigation, scan, api, error, etc.
4. **Keep messages concise** - Short, descriptive messages
5. **Log before/after async** - Track API call timing

## URL Parameter Behavior

- `?debug=true` → Debug enabled
- `?debug=false` → Debug disabled
- No parameter → Debug disabled
- Parameter persists through all navigation
- Reset button removes parameter and reloads

## Testing Checklist

- [ ] Start session with `?debug=true`
- [ ] Scan barcode with camera
- [ ] Verify barcode detection logged
- [ ] Check API call logs appear
- [ ] Navigate to nutrition facts
- [ ] Confirm logs persist across navigation
- [ ] Filter by different log types
- [ ] Export session JSON
- [ ] Verify all timestamps relative to start
- [ ] Test Reset button clears everything
- [ ] Verify overlay works on mobile (touch scrolling)
- [ ] Check collapse/expand functionality
