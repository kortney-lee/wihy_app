# Health Overview - User Behavior Specification

## Overview

This document describes all user interactions with the Health Overview Dashboard, covering health metrics tracking, scan history, AI insights, wellness trends, and predictive analytics.

---

## 1. Initial Screen Load & Dashboard

### When User Opens Health Overview

**Scenario: First-time user with no health data**
- **Given** user has not granted health tracking permissions
- **When** health overview screen loads
- **Then** user sees:
  - Header with "Health Overview" title
  - Subtitle: "Your personalized health dashboard"
  - Current date badge
  - Permission request card showing:
    * 💪 Fitness icon (large)
    * "Health Access Required" title
    * Description explaining need for health data
    * "Enable Health Tracking" button (primary CTA)
  - Summary tab selected by default
  - Tab navigation: Summary | Insights | Wellness | Trends | Predictive

**Scenario: Returning user with health permissions granted**
- **Given** user granted health tracking permissions
- **When** dashboard loads
- **Then** user sees:
  - Collapsing header with:
    * "Health Overview" title (fades on scroll)
    * Current date
    * Animated scroll behavior
  - Health metrics grid showing:
    * Health Score
    * Daily Steps
    * Active Minutes
    * Distance
    * Calories Burned
    * Sleep Hours
    * Heart Rate
    * Hydration
    * Weight
    * Meals Logged
    * Protein Intake
    * Water Intake
  - Recent Scans section (horizontal scroll)
  - All metrics color-coded by status (green/yellow/red)

**Scenario: User with partial health data**
- **Given** user has some but not all health apps connected
- **When** dashboard loads
- **Then** user sees:
  - Available metrics displayed with real data
  - Missing metrics show default/mock values
  - Prompt to "Connect More Apps" for fuller picture
  - Metrics update as more data becomes available

---

## 2. Health Metrics Display

### 2.1 Metric Cards

**Scenario: User views health metric card**
```
Each metric card displays:
  - Icon with colored background (status-based):
    * Green: Good status (goal met)
    * Orange: Warning (approaching concern)
    * Red: Alert (needs attention)
  - Primary value (large, bold):
    * "82" (Health Score)
    * "8,247" (Steps)
    * "7.2" (Sleep hours)
  - Title label:
    * "Health Score"
    * "Daily Steps"
    * "Sleep"
  - Unit/target:
    * "/100"
    * "steps"
    * "/ 2,200 kcal"
    * "hours"
  - Trend indicator (small icon):
    * ↗ Trending up (green)
    * ↘ Trending down (red)
    * → Stable (gray)
```

**Metric Categories:**

**Activity Metrics:**
- Daily Steps (footsteps icon, blue)
- Active Minutes (fitness icon, green)
- Distance (walk icon, purple)
- Calories Burned (flame icon, orange)

**Nutrition Metrics:**
- Meals Logged (restaurant icon, pink)
- Calories Consumed (nutrition icon, orange)
- Protein (nutrition icon, purple)
- Water Intake (water icon, cyan)

**Wellness Metrics:**
- Health Score (fitness icon, green/orange/red)
- Sleep (moon icon, indigo)
- Heart Rate (heart icon, red)
- Hydration (water icon, cyan)
- Weight (scale icon, purple)

**Fitness Metrics:**
- Today's Workout (dumbbell icon, red)
- Weekly Workouts (fitness icon, green)

---

### 2.2 Status Indicators

**Scenario: Good status metrics**
```
Given metric meets or exceeds target
When displayed on dashboard
Then:
  - Background color: Light green (#10b98120)
  - Icon color: Green (#10b981)
  - Value text: Dark gray
  - Trend: Up arrow (if improving)
  
Examples:
  - Health Score: 80+/100
  - Steps: 8,000+ per day
  - Sleep: 7+ hours
  - Active Minutes: 30+ min
```

**Scenario: Warning status metrics**
```
Given metric approaching concern threshold
When displayed on dashboard
Then:
  - Background color: Light orange (#f59e0b20)
  - Icon color: Orange (#f59e0b)
  - Value text: Dark gray
  - Trend: May show stable or down
  
Examples:
  - Health Score: 60-79/100
  - Steps: 5,000-7,999 per day
  - Sleep: 6-6.9 hours
  - Calories: 10% over or 50% under goal
```

**Scenario: Alert status metrics**
```
Given metric needs immediate attention
When displayed on dashboard
Then:
  - Background color: Light red (#ef444420)
  - Icon color: Red (#ef4444)
  - Value text: Dark gray
  - Trend: Usually down arrow
  
Examples:
  - Health Score: <60/100
  - Steps: <5,000 per day
  - Sleep: <6 hours
  - Meals logged: 0 today
```

---

### 2.3 Metric Calculations

**Health Score Formula:**
```
Weighted average of:
  - Activity level (30%)
  - Nutrition quality (25%)
  - Sleep quality (20%)
  - Hydration (10%)
  - Consistency (15%)
  
Range: 0-100
- 80-100: Excellent (green)
- 60-79: Good (orange)
- 0-59: Needs improvement (red)
```

**Activity Targets:**
```
Daily Steps:
  - Alert: <5,000 steps
  - Warning: 5,000-7,999 steps
  - Good: 8,000+ steps
  
Active Minutes:
  - Alert: <15 min
  - Warning: 15-29 min
  - Good: 30+ min (WHO recommendation)
  
Distance:
  - Alert: <3 km
  - Warning: 3-4.9 km
  - Good: 5+ km
```

**Nutrition Targets:**
```
Calories:
  - Alert: <50% of goal
  - Warning: 110%+ of goal
  - Good: 80-110% of goal
  
Protein:
  - Alert: <30% of goal
  - Warning: 30-49% of goal
  - Good: 50%+ of goal
  
Hydration:
  - Alert: <25% of goal
  - Warning: 25-49% of goal
  - Good: 50%+ of goal
```

**Sleep Targets:**
```
Hours:
  - Alert: <6 hours
  - Warning: 6-6.9 hours
  - Good: 7+ hours
```

**Heart Rate (Resting):**
```
Normal: 60-100 bpm
  - Alert: <40 or >120 bpm
  - Warning: 40-59 or 101-120 bpm
  - Good: 60-100 bpm
```

---

## 3. Tabs & Navigation

### 3.1 Tab Selector

**Scenario: User switches between tabs**
```
Given user on Health Overview dashboard
When tab bar displays
Then user sees 5 tabs (horizontal scroll):
  - Summary (default, active)
  - Insights
  - Wellness
  - Trends
  - Predictive
  
Active tab styling:
  - Bold text
  - Underline indicator
  - Primary color (#059669)
  
Inactive tabs:
  - Regular weight text
  - Gray color (#6b7280)
  - Tappable to activate
```

---

### 3.2 Summary Tab

**Scenario: User views Summary tab (default)**
```
Given user on Summary tab
When content displays
Then user sees:
  - "Health Summary" section title
  - Grid of health metric cards (2-3 columns):
    * Health Score
    * Daily Steps
    * Active Minutes
    * Distance
    * Calories Burned
    * Sleep
    * Heart Rate
    * Hydration
    * Weight
    * Meals Logged
    * Calories Consumed
    * Protein
    * Water Intake
    * Today's Workout
    * Weekly Workouts
  - "Recent Scans" section:
    * Section title with "View All" link
    * Horizontal scrolling scan cards
    * Shows last 5 scans
```

**Scenario: Loading health data**
```
Given health data is being fetched
When Summary tab displays
Then user sees:
  - Loading spinner (centered)
  - Message: "Loading health data..."
  - Gray background
  - No metric cards yet
```

**Scenario: No health data available**
```
Given health tracking permission not granted
When Summary tab displays
Then user sees:
  - Fitness icon (large, gray)
  - "Health Access Required" title
  - Description text explaining benefits
  - "Enable Health Tracking" button
  - Empty state (no metric cards)
```

---

### 3.3 Insights Tab

**Scenario: User views AI Insights**
```
Given user taps "Insights" tab
When insights content loads
Then user sees:
  - "AI Health Insights" section title
  - Insight cards (vertical list):
    
    Insight Card 1 - Hydration:
      Icon: 💡 Bulb (yellow)
      Title: "Hydration Goal"
      Text: "You're 0.5L behind your daily water goal. 
             Consider drinking a glass now."
    
    Insight Card 2 - Sleep:
      Icon: 🌙 Moon (blue)
      Title: "Sleep Pattern"
      Text: "Your sleep duration decreased by 45 minutes 
             this week. Try a consistent bedtime."
    
    Insight Card 3 - Activity:
      Icon: 👟 Steps (green)
      Title: "Activity Level"
      Text: "Great job! You've increased your daily steps 
             by 15% this week."
    
    Insight Card 4 - Nutrition:
      Icon: 🥗 Food (orange)
      Title: "Protein Intake"
      Text: "You consistently hit your protein goal. 
             Keep up the excellent work!"
```

**Insight Types:**
- **Achievements** (green): Positive reinforcement
- **Recommendations** (yellow): Actionable suggestions
- **Warnings** (orange): Areas needing attention
- **Trends** (blue): Pattern observations

**Scenario: Tapping insight card**
```
Given user taps an insight card
When action is triggered
Then:
  - Navigates to relevant feature:
    * Hydration → Water tracking
    * Sleep → Sleep log
    * Activity → Fitness dashboard
    * Nutrition → Meal diary
  - Or: Shows detailed insight modal with:
    * Expanded explanation
    * Historical data chart
    * Actionable next steps
    * "Track Progress" button
```

---

### 3.4 Wellness Tab

**Scenario: User views Wellness overview**
```
Given user taps "Wellness" tab
When wellness content loads
Then user sees:
  - "Coming Soon" message (if not implemented)
  - Or: Wellness features including:
    * Mental health check-ins
    * Stress level tracking
    * Mood journal
    * Meditation minutes
    * Mindfulness goals
    * Social connection score
    * Work-life balance index
```

---

### 3.5 Trends Tab

**Scenario: User views health trends**
```
Given user taps "Trends" tab
When trends content loads
Then user sees:
  - "Coming Soon" message (if not implemented)
  - Or: Trend visualizations including:
    * Weekly activity chart (steps/day)
    * Sleep trend line (hours over time)
    * Weight progression graph
    * Calorie intake vs burn chart
    * Workout frequency bar chart
  - Time period selector:
    ○ Last 7 Days (default)
    ○ Last 30 Days
    ○ Last 3 Months
    ○ Last Year
  - Export data button (CSV/PDF)
```

---

### 3.6 Predictive Tab

**Scenario: User views predictive analytics**
```
Given user taps "Predictive" tab
When predictive content loads
Then user sees:
  - "Coming Soon" message (if not implemented)
  - Or: AI predictions including:
    * Health score forecast (next 30 days)
    * Weight trajectory prediction
    * Workout consistency probability
    * Sleep quality forecast
    * Risk alerts:
      - "At risk of burnout based on activity"
      - "Sleep debt accumulating"
      - "Nutrition imbalance detected"
  - Confidence intervals shown
  - Recommendations to improve predictions
```

---

## 4. Recent Scans Section

### 4.1 Scan History Display

**Scenario: User views recent scans**
```
Given user has scan history
When Recent Scans section displays
Then user sees:
  - Section header:
    * "Recent Scans" title
    * "View All" link → ScanHistory screen
  - Horizontal scrolling list of scan cards
  - Shows last 5 scans (most recent first)
  - Each scan card shows:
    * Scan type icon (colored background):
      - Barcode: Blue barcode icon
      - Food Photo: Green restaurant icon
      - Pill: Red medical icon
      - Label: Orange document icon
    * Product name or scan type label
    * Timestamp: "2h ago", "Yesterday", "3d ago"
    * Health score badge (if available):
      - Green: 80-100
      - Orange: 60-79
      - Red: 0-59
```

**Scenario: Loading scan history**
```
Given scan history is being fetched
When Recent Scans section displays
Then:
  - Shows loading spinner (small)
  - No scan cards visible
  - Section header still visible
```

**Scenario: No scans available**
```
Given user has no scan history
When Recent Scans section displays
Then user sees:
  - Scan icon (gray, centered)
  - "No recent scans" message
  - "Start Scanning" button (primary)
    * Tapping navigates to Camera screen
```

---

### 4.2 Scan Card Details

**Scan Card Components:**

**Barcode Scan:**
```
Icon: Barcode outline (blue background)
Title: Product name (e.g., "Coca-Cola Zero Sugar")
Date: "2h ago"
Score: "72" (orange badge)
```

**Food Photo Scan:**
```
Icon: Restaurant outline (green background)
Title: "Food Photo" or recognized food name
Date: "5h ago"
Score: "85" (green badge)
```

**Pill Scan:**
```
Icon: Medical outline (red background)
Title: "Pill Scan" or medication name
Date: "1d ago"
Score: N/A (pills don't have health scores)
```

**Label Scan:**
```
Icon: Document text outline (orange background)
Title: "Product Label" or brand name
Date: "3d ago"
Score: "58" (red badge)
```

**Scenario: User taps scan card**
```
Given user taps a scan card
When navigation is triggered
Then:
  - Navigates to Scan History screen
  - Scrolls to selected scan
  - Or: Opens scan detail modal showing:
    * Full product information
    * Health score breakdown
    * Nutrition facts
    * Ingredients analysis
    * Recommendations
    * Actions:
      - "Log to Diary"
      - "Compare Products"
      - "Share Results"
      - "Delete Scan"
```

---

### 4.3 Scan Type Icons & Colors

**Icon Mapping:**
```
Barcode:
  - Icon: 'barcode-outline'
  - Color: #3b82f6 (blue)
  - Background: #3b82f620 (light blue)
  
Food Photo:
  - Icon: 'restaurant-outline'
  - Color: #10b981 (green)
  - Background: #10b98120 (light green)
  
Pill:
  - Icon: 'medical-outline'
  - Color: #ef4444 (red)
  - Background: #ef444420 (light red)
  
Product Label:
  - Icon: 'document-text-outline'
  - Color: #f97316 (orange)
  - Background: #f9731620 (light orange)
```

---

### 4.4 Scan Timestamp Formatting

**Relative Time Display:**
```
< 1 minute: "Just now"
< 60 minutes: "Xm ago" (e.g., "45m ago")
< 24 hours: "Xh ago" (e.g., "5h ago")
< 7 days: "Xd ago" (e.g., "3d ago")
7+ days: Absolute date (e.g., "Jan 20, 2026")
```

---

### 4.5 Health Score Badge

**Score Ranges & Colors:**
```
80-100:
  - Badge color: Green (#10b981)
  - Text: White
  - Interpretation: Excellent choice
  
60-79:
  - Badge color: Orange (#f59e0b)
  - Text: White
  - Interpretation: Moderate choice
  
0-59:
  - Badge color: Red (#ef4444)
  - Text: White
  - Interpretation: Poor choice, consider alternatives
  
No Score:
  - Badge hidden
  - Applies to: Pill scans, some labels
```

---

## 5. Health Permission Modal

### 5.1 Permission Request

**Scenario: User taps "Enable Health Tracking"**
```
Given user tapped enable button
When permission modal opens
Then modal displays (full screen overlay):
  - Header:
    * Fitness icon (large, colored)
    * Close button (X, top right)
  - Title: "Enable Health Tracking"
  - Description:
    "WiHY uses Health Connect to access your health 
     data from Samsung Health, Google Fit, and other 
     fitness apps for personalized insights."
  - Features list (3 cards):
    1. Activity Tracking
       Icon: Footsteps
       Desc: "Steps, distance, and active minutes 
              from any fitness app"
    
    2. Health Metrics
       Icon: Heart
       Desc: "Heart rate, weight, sleep, and 
              body measurements"
    
    3. Workout History
       Icon: Barbell
       Desc: "Exercise sessions and calories burned"
  
  - Privacy note:
    Shield icon + "Works with your device's health app. 
    Your data stays private and secure."
  
  - Action buttons:
    * "Grant Access" (primary, green)
    * "Maybe Later" (secondary, text only)
```

**Scenario: User grants access**
```
Given user taps "Grant Access"
When permission request processes
Then:
  - Modal closes
  - System health permission dialog appears
  - User grants permissions in system dialog
  - Dashboard reloads health data
  - Metric cards populate with real data
  - Success toast: "Health tracking enabled"
```

**Scenario: User declines access**
```
Given user taps "Maybe Later"
When action processes
Then:
  - Modal closes
  - Dashboard shows permission denied state
  - User can still use other features
  - Banner remains: "Enable health tracking for insights"
```

---

### 5.2 Health Connect Integration

**Supported Health Apps:**
- Samsung Health
- Google Fit
- Fitbit
- Garmin Connect
- Strava
- MyFitnessPal
- Apple Health (iOS only)
- Mi Fit
- Huawei Health

**Data Points Accessed:**
```
Activity:
  - Steps
  - Distance
  - Active minutes
  - Calories burned
  - Floors climbed
  
Vitals:
  - Heart rate
  - Blood pressure
  - Oxygen saturation
  - Body temperature
  
Body Metrics:
  - Weight
  - BMI
  - Body fat percentage
  - Muscle mass
  
Sleep:
  - Sleep duration
  - Sleep stages (light, deep, REM)
  - Sleep quality score
  
Workouts:
  - Exercise type
  - Duration
  - Calories
  - Heart rate zones
  
Nutrition:
  - Meals logged
  - Calorie intake
  - Macros (protein, carbs, fat)
  - Water intake
```

---

## 6. Quick Actions

### 6.1 Action Cards

**Scenario: User views quick action cards**
```
Given user on dashboard
When quick actions section displays
Then user sees 4 action cards (grid):

1. Log Meal
   Icon: Restaurant (green)
   Subtitle: "Track your nutrition"
   Action: Navigate to Camera (food photo mode)

2. Start Workout
   Icon: Fitness (orange)
   Subtitle: "Begin exercise routine"
   Action: Navigate to Fitness Dashboard

3. Check Symptoms
   Icon: Medical (red)
   Subtitle: "Health assessment"
   Action: Navigate to AI Chat (symptom checker)

4. AI Chat
   Icon: Chatbubble (blue)
   Subtitle: "Ask health questions"
   Action: Open AI chat with prompt
```

**Scenario: User taps action card**
```
Given user taps an action card
When navigation is triggered
Then:
  - Haptic feedback (light tap)
  - Navigates to appropriate screen:
    * Log Meal → Camera screen
    * Start Workout → Fitness dashboard
    * Check Symptoms → Chat with health context
    * AI Chat → Chat screen
```

---

### 6.2 Responsive Layout

**Phone (< 768px):**
```
Grid: 2x2 (4 cards)
Card width: ~48% of screen
Icon size: 28px
Font size: 12px subtitle
Spacing: 8px gap
```

**Tablet (>= 768px):**
```
Grid: 4x1 or 6x1 (horizontal)
Card width: Evenly distributed
Icon size: 32px
Font size: 14px subtitle
Spacing: 12px gap
```

---

## 7. Collapsing Header Animation

### 7.1 Header Behavior

**Scenario: User scrolls dashboard**
```
Given user on health overview
When user scrolls down
Then header animates:
  - Height: 140px → 0px
  - Opacity: 1.0 → 0.0
  - Title scale: 1.0 → 0.8
  - Smooth easing animation
  - Background stays emerald (#059669)
  
When user scrolls up:
  - Header expands back to full height
  - Opacity and scale restore
  - Reverse animation
```

**Header Content (Expanded State):**
```
- Title: "Health Overview" (28px, bold, white)
- Subtitle: "Your personalized health dashboard" 
  (16px, white, 90% opacity)
- Date badge: "Monday, January 24, 2026"
  (14px, white, rounded background)
```

**Header Content (Collapsed State):**
```
- Height: 0px (fully hidden)
- Content faded out
- Status bar remains emerald
```

---

## 8. Data Refresh & Updates

### 8.1 Auto-Refresh

**Scenario: Health data auto-updates**
```
Given dashboard is visible
When user has been on screen for 5+ minutes
Then:
  - Auto-refresh health data
  - Show subtle loading indicator (top of screen)
  - Update metric cards with new values
  - Refresh scan history
  - Animation: Fade in new values
```

**Scenario: Returning from background**
```
Given app was in background
When user returns to health overview
Then:
  - Check for stale data (>5 min old)
  - If stale: Refresh all data
  - Show loading states briefly
  - Update UI with fresh data
```

---

### 8.2 Pull-to-Refresh

**Scenario: User pulls to refresh**
```
Given user at top of dashboard
When user swipes down (pull gesture)
Then:
  - Pull-to-refresh indicator appears
  - Loading spinner activates
  - Fetches latest health data
  - Fetches latest scan history
  - Updates all metrics
  - Spinner disappears
  - Scroll returns to top
  - Haptic feedback on complete
```

---

### 8.3 Real-Time Updates

**Scenario: New scan completed**
```
Given user just completed a scan
When returning to health overview
Then:
  - New scan appears in Recent Scans
  - Slide-in animation from left
  - Scan count updates
  - Health score may update (if affected)
```

**Scenario: Meal logged in diary**
```
Given user logged meal in Consumption dashboard
When health overview refreshes
Then:
  - "Meals Logged" metric increments
  - "Calories Consumed" updates
  - "Protein" updates
  - Color status may change
  - Trend indicators may update
```

**Scenario: Workout completed**
```
Given user finished workout in Fitness
When health overview refreshes
Then:
  - "Today's Workout" appears/updates
  - "Weekly Workouts" increments
  - "Calories Burned" increases
  - "Active Minutes" updates
  - Health score may improve
```

---

## 9. Error States & Fallbacks

### 9.1 Network Errors

**Scenario: Failed to load health data**
```
When health data API fails
Then:
  - Shows last cached data (if available)
  - Banner at top: "⚠️ Using cached data. Check connection."
  - "Retry" button in banner
  - Metrics display with timestamp: "Updated 2h ago"
  - Tap retry → Attempts fresh fetch
```

**Scenario: Failed to load scan history**
```
When scan history API fails
Then Recent Scans section shows:
  - Empty state icon
  - "Unable to load scans"
  - "Retry" button
  - Or: Shows last cached scans with note
```

---

### 9.2 Permission Errors

**Scenario: Health permissions revoked**
```
Given user previously granted permissions
When permissions are revoked in system settings
Then dashboard shows:
  - All metrics gray out
  - Warning banner: "Health access was revoked"
  - "Re-enable Access" button
  - Tapping button → Opens permission modal
```

**Scenario: Health app not installed**
```
Given device has no Health Connect app
When trying to access health data
Then:
  - Error message: "Health Connect not found"
  - "Install Health Connect" button
  - Link to Play Store/App Store
  - Or: "Use alternative health app" option
```

---

### 9.3 Data Gaps

**Scenario: Missing health data**
```
Given some health metrics unavailable
When dashboard loads
Then:
  - Available metrics show real data
  - Missing metrics show:
    * Placeholder value (e.g., "--")
    * Gray icon
    * "No data" label
    * "Track this metric" link
```

---

## 10. Navigation & Links

### 10.1 Metric Card Actions

**Scenario: User taps health metric card**
```
Given user taps a metric card
When action is triggered
Then navigates to detailed view:
  - Steps → Activity detail screen
  - Sleep → Sleep tracker
  - Meals → Consumption dashboard
  - Workout → Fitness dashboard
  - Water → Hydration tracker
  - Weight → Weight log
  - Heart Rate → Vitals tracker
```

---

### 10.2 Section Links

**"View All" Links:**

**Recent Scans - View All:**
```
Given user taps "View All" in Recent Scans
When navigation triggers
Then:
  - Navigate to Scan History screen
  - Shows full list (50+ scans)
  - Filters and search available
  - Pagination for older scans
```

**Insights - Learn More:**
```
Given user taps insight card
When detail opens
Then:
  - Modal or new screen
  - Full explanation of insight
  - Historical data chart
  - Actionable recommendations
  - "Track Progress" button
  - "Dismiss" or "Got It" button
```

---

## 11. Accessibility & Preferences

### 11.1 Text Scaling

**Scenario: User enables large text**
```
Settings > Accessibility > Large Text
When enabled:
  - All text scales 20-30%
  - Metric values scale proportionally
  - Card heights adjust to fit
  - Icons maintain size
  - Layout remains responsive
```

---

### 11.2 Color Vision Support

**Scenario: User enables high contrast**
```
Settings > Accessibility > High Contrast
When enabled:
  - Stronger color differentiation
  - Thicker borders on cards
  - Bold text by default
  - Status colors remain distinct:
    * Good: Darker green
    * Warning: Darker orange
    * Alert: Darker red
```

---

### 11.3 Screen Reader Support

**Scenario: Screen reader active**
```
Given user uses screen reader
When navigating dashboard
Then:
  - Metric cards announce:
    "Health Score, 82 out of 100, Good status, Trending up"
  - Scan cards announce:
    "Barcode scan, Coca-Cola Zero Sugar, 2 hours ago, 
     Health score 72"
  - Action cards announce:
    "Log Meal button, Track your nutrition"
  - Proper focus order top to bottom
  - All interactive elements accessible
```

---

## 12. Performance Optimizations

### 12.1 Tab Focus Optimization

**Scenario: User switches tabs away from Health**
```
Given user on Health Overview tab
When user taps different bottom tab
Then:
  - Health screen marked as unfocused
  - No API calls triggered
  - Data remains in memory
  - Animations pause
  - Timers stop
```

**Scenario: User returns to Health tab**
```
Given Health tab was unfocused
When user taps Health tab again
Then:
  - Screen marked as focused
  - Check if data is stale (>5 min)
  - If stale: Refresh data
  - If fresh: Use cached data
  - Resume animations
```

---

### 12.2 Lazy Loading

**Scenario: Large scan history**
```
Given user has 100+ scans
When Recent Scans displays
Then:
  - Only load first 5 scans
  - Remaining scans load on "View All"
  - Pagination in Scan History screen
  - Prevents memory bloat
```

---

### 12.3 Image Caching

**Scenario: Scan cards with images**
```
Given scan cards display product images
When images load
Then:
  - Images cached locally
  - Subsequent views instant
  - Cache expires after 7 days
  - Placeholder while loading
```

---

## 13. Summary of Key User Flows

### Quick Reference Chart

| User Goal | Starting Point | Key Steps | End State |
|-----------|----------------|-----------|-----------|
| **View health metrics** | Dashboard | Open Health tab → View metrics grid | All health data displayed |
| **Enable health tracking** | Permission prompt | Tap "Enable" → Grant system permission → Reload | Metrics populate with data |
| **View recent scans** | Dashboard | Scroll to Recent Scans → Horizontal scroll | Scan history visible |
| **Access scan details** | Recent scan card | Tap scan card → View details | Full scan info displayed |
| **View AI insights** | Dashboard | Tap "Insights" tab → Browse cards | Personalized insights shown |
| **Refresh health data** | Dashboard | Pull down from top → Release | Fresh data loaded |
| **Check specific metric** | Metric card | Tap metric card → View detail | Detailed metric screen |
| **Log new meal** | Quick action | Tap "Log Meal" → Camera opens | Ready to scan food |
| **Start workout** | Quick action | Tap "Start Workout" → Fitness opens | Workout selection ready |
| **View trends** | Dashboard | Tap "Trends" tab → Select period | Charts displayed |
| **View all scans** | Recent Scans | Tap "View All" → Scan History | Full history screen |

---

## Document Version

**Version:** 1.0  
**Last Updated:** January 24, 2026  
**Author:** AI Assistant (Copilot)  
**Review Status:** Draft  

This document serves as the behavioral specification for the Health Overview Dashboard. All interactions should match these behaviors for consistency and optimal user experience.
