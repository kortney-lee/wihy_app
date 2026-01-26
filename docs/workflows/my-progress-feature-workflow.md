# My Progress Dashboard - User Behavior Specification

## Overview

This document describes all user interactions with the My Progress Dashboard feature, covering health metrics tracking, goal setting, action items, coach recommendations, and scan-based health trends across daily, weekly, and monthly timeframes.

---

## 1. Initial Screen Load & Dashboard Overview

### When User Opens My Progress Dashboard

**Scenario: First-time user viewing progress dashboard**
- **Given** user has just started using WIHY app
- **When** My Progress dashboard loads for first time
- **Then** user sees:
  - Collapsing header with title "My Progress"
  - Subtitle: "Track your daily health journey"
  - Today's Progress badge showing 0%
  - Period selector tabs (Today/Week/Month) - Today selected
  - Empty state or mock data for progress cards
  - Today's Actions section (mock items)
  - Meal & Fitness Goals section (selectable goals)
  - AI Coach Recommendations
  - Message: "Connect health tracker or log activities to see progress"

**Scenario: Returning user with health data**
- **Given** user has Health Connect/Samsung Health/Google Fit connected
- **When** dashboard loads
- **Then** user sees:
  - Real-time health metrics from connected tracker
  - Progress cards showing actual data:
    * Daily Steps (e.g., 7,450 / 10,000)
    * Active Minutes (e.g., 22 / 30)
    * Calories Burned (e.g., 385 / 500)
    * Distance (e.g., 6.2 / 8 km)
    * Sleep Duration (if available)
    * Heart Rate (if available)
    * Hydration (if logged)
    * Weight (if tracked)
  - Today's progress percentage updated
  - Scan-Based Health Trends section
  - Active goal progress (if goal selected)

**Scenario: User without health tracker but with logged activities**
- **Given** user hasn't connected health tracker
- **And** user has logged meals and workouts
- **When** dashboard loads
- **Then** user sees fallback metrics:
  - Meals Logged (e.g., 3 / 4 meals)
  - Calories (from logged meals)
  - Protein (from logged meals)
  - Workouts (completed sessions)
  - Banner: "Connect health tracker for more metrics"

---

## 2. Period Selection & Navigation

### 2.1 Switching Between Time Periods

**Scenario: User selects "Today" period**
```
Given user on My Progress dashboard
When user taps "Today" tab
Then:
  - Today tab highlights (green background)
  - Progress cards update to show today's metrics:
    * Real-time step count
    * Today's active minutes
    * Calories burned today
    * Distance traveled today
    * Current sleep (if overnight data)
    * Current heart rate
  - Section title: "Today's Metrics"
  - Navigation arrows: back disabled, forward enabled
  - Loading indicator while fetching data
```

**Scenario: User selects "Week" period**
```
Given user on My Progress dashboard
When user taps "Week" tab
Then:
  - Week tab highlights
  - Progress cards update to show weekly averages/totals:
    * Avg Daily Steps (e.g., 8,200 steps/day)
    * Total Steps (e.g., 57,400 steps)
    * Avg Active Minutes (e.g., 26 min/day)
    * Avg Calories (e.g., 450 kcal/day)
    * Total Calories (e.g., 3,150 kcal)
    * Days Active (e.g., 5 / 7 days with >5000 steps)
    * Avg Heart Rate (e.g., 72 bpm)
    * Avg Sleep (e.g., 7.2 hours)
  - Section title: "This Week's Metrics"
  - Both navigation arrows enabled
```

**Scenario: User selects "Month" period**
```
Given user on My Progress dashboard
When user taps "Month" tab
Then:
  - Month tab highlights
  - Progress cards update to show monthly data:
    * Total Steps (7 days) (e.g., 57,400 steps)
    * Avg Steps/Day (e.g., 8,200 steps)
    * Total Distance (7d) (e.g., 45.9 km)
    * Total Calories (7d) (e.g., 3,150 kcal)
    * Avg Active Minutes (e.g., 26 min/day)
    * Total Active Time (e.g., 182 minutes)
    * Active Days (e.g., 5 / 7 days)
    * Avg Heart Rate (e.g., 72 bpm)
    * Consistency (e.g., 71%)
  - Section title: "This Month's Metrics"
  - Navigation arrows: back enabled, forward disabled
```

---

### 2.2 Period Navigation with Arrows

**Scenario: User taps forward arrow from Today**
```
Given user on Today period
When user taps chevron-forward arrow
Then:
  - Switches to Week period
  - Progress cards animate to weekly view
  - Tab selector updates to Week
  - Forward arrow remains enabled
```

**Scenario: User taps back arrow from Week**
```
Given user on Week period
When user taps chevron-back arrow
Then:
  - Switches to Today period
  - Progress cards animate to today's view
  - Tab selector updates to Today
  - Back arrow becomes disabled (grayed out)
```

**Scenario: User taps forward arrow from Week**
```
Given user on Week period
When user taps chevron-forward arrow
Then:
  - Switches to Month period
  - Progress cards animate to monthly view
  - Tab selector updates to Month
  - Forward arrow becomes disabled (grayed out)
```

---

## 3. Progress Metrics Display

### 3.1 Progress Card Structure

**Progress Card Components:**
```
Each metric card shows:
  - Color-coded icon (in colored circle background)
  - Percentage (large number, e.g., "74%")
  - Metric name (e.g., "Daily Steps")
  - Value & target (e.g., "7,450 / 10,000 steps")
  - Progress bar (colored, showing percentage)

Card grid:
  - 2 columns
  - 48.5% width each
  - Wraps to multiple rows
  - Gap: 12px between cards
  - White background
  - Rounded corners (16px)
  - Shadow elevation
```

**Scenario: User views progress card**
```
Given user viewing Today metrics
When user looks at "Daily Steps" card
Then card displays:
  - Blue footsteps icon in light blue circle
  - "74%" large percentage text
  - "Daily Steps" title
  - "7,450 / 10,000 steps" value
  - Progress bar: 74% filled with blue color
  
Color meanings:
  - <50% completion: Red tones
  - 50-79% completion: Orange/yellow tones
  - 80-100% completion: Green tones
  - >100% completion: Green with celebration indicator
```

**Scenario: User exceeds daily target**
```
Given user walked 12,500 steps (target 10,000)
When progress card displays
Then:
  - Shows "125%" in green
  - Value shows "12,500 / 10,000 steps"
  - Progress bar fills completely (100%)
  - Potential celebration animation/badge
```

---

### 3.2 Health Data Sources

**Data Loading Priority:**
```
1. PRIMARY: Health Connect / Samsung Health / Google Fit
   - Real-time step count
   - Active minutes
   - Calories burned
   - Distance
   - Sleep hours
   - Heart rate
   - Hydration (if supported)
   - Weight (if tracked)

2. FALLBACK: Logged Activities
   - Meals logged (from nutrition service)
   - Calories consumed
   - Protein intake
   - Workouts completed (from fitness service)

3. MOCK DATA: If no data available
   - Generic progress indicators
   - Sample values for demonstration
   - "Connect your health tracker" message
```

**Scenario: Health tracker permission denied**
```
Given user denied Health Connect permission
When dashboard attempts to load health data
Then:
  - Falls back to logged activities
  - Shows metrics from manual entries:
    * Meals Logged (from meal diary)
    * Calories (from logged meals)
    * Protein (from nutrition tracking)
    * Workouts (from fitness tracking)
  - Banner appears: "Connect health tracker for detailed metrics"
  - CTA button: "Enable Health Tracking"
```

---

### 3.3 Metric-Specific Behaviors

**Steps Metric:**
```
Icon: footsteps (blue)
Units: steps
Targets:
  - Daily: 10,000 steps
  - Weekly: 70,000 total or 10,000 avg
  - Monthly: Shows 7-day rolling totals

Data source: Health Connect > Samsung Health > Google Fit > Manual
Refresh: Real-time (updates every 5 min)
```

**Active Minutes Metric:**
```
Icon: fitness (orange)
Units: minutes or min/day
Targets:
  - Daily: 30 minutes
  - Weekly: 30 min/day average
  - Monthly: 210 total minutes

Counted as: Heart rate >100 bpm or movement intensity >moderate
Data source: Health trackers
```

**Calories Burned Metric:**
```
Icon: flame (red)
Units: kcal
Targets:
  - Daily: 500 kcal (exercise-based)
  - Weekly: 3,500 kcal total
  - Monthly: Shows daily averages

Calculation: Active calories (not including BMR)
Data source: Health trackers
```

**Sleep Duration Metric:**
```
Icon: moon (purple)
Units: hours
Target: 8 hours
Only shown if: Sleep data available from tracker

Data source: Sleep tracking from Health Connect
Breakdown: Deep, Light, REM sleep (if available)
```

**Heart Rate Metric:**
```
Icon: heart (red)
Units: bpm (beats per minute)
Target: 60-80 bpm resting

Shows: Current or daily average
Data source: Continuous heart rate monitoring
Alert: If >100 resting or <50 resting
```

**Hydration Metric:**
```
Icon: water (cyan)
Units: liters or glasses
Target: 2.5 liters (8 glasses)

Data source: Manual logging (water intake tracking)
Increments: 250ml per glass
Quick add: Button to log water
```

**Weight Metric:**
```
Icon: scale (purple)
Units: kg or lbs
Target: User's goal weight

Data source: Smart scale or manual entry
Frequency: Daily or weekly weigh-ins
Trend: Shows gain/loss indicator
```

---

## 4. Collapsing Header Animation

### 4.1 Header Behavior on Scroll

**Scenario: User scrolls down dashboard**
```
Given user at top of dashboard (scroll position 0)
When user scrolls down
Then header collapses with animations:
  - Header height: 140px → 0px (over 140px scroll)
  - Header opacity: 100% → 0% (over 70px scroll)
  - Title scale: 1.0 → 0.8
  - Title translateY: 0 → -20px
  - Red gradient background maintained
  - Period selector remains fixed (not collapsed)
  - Smooth animation using Animated API
```

**Scenario: User scrolls back to top**
```
Given user scrolled down (header collapsed)
When user scrolls back to top
Then header expands:
  - Height increases to 140px
  - Content fades in (opacity 0 → 1)
  - Title scales back to normal size
  - Progress badge reappears
  - Smooth reverse animation
```

**Header States:**
```
EXPANDED (scroll Y = 0):
  - Title: "My Progress" (28px, bold)
  - Subtitle: "Track your daily health journey" (14px)
  - Progress badge: "Today's Progress: 45%"
  - Background: Red gradient (#dc2626)
  - Height: 140px
  
COLLAPSED (scroll Y > 140):
  - Header completely hidden
  - Period selector visible
  - Content scrolled to top of viewport
  - Red status bar remains
```

---

### 4.2 Period Selector Persistence

**Fixed Position Behavior:**
```
Given user scrolling through dashboard
When header collapses
Then period selector:
  - Remains visible at top
  - Fixed position (doesn't scroll)
  - Stays below status bar
  - White background
  - Shadow to lift above content
  - Always accessible for period switching
```

---

## 5. Scan-Based Health Trends

### 5.1 Health Trends Section Display

**Scenario: User has recent scans**
```
Given user scanned products/food/pills this period
When viewing Health Trends section
Then user sees:
  - Section title: "Scan-Based Health Trends"
  - "Scan History" link (top right)
  - Scan statistics row:
    * Total Scans (number)
    * Avg Score (health score average, e.g., 75)
    * Food Scans (count of food/barcode scans)
  - Scan Type Breakdown:
    * Barcode scans (count)
    * Pill scans (count)
    * Label scans (count)
  - Health Score Trend Bar:
    * Gradient bar (green/yellow/red)
    * Indicator at user's average score position
    * Labels: "Poor" | "Good" | "Excellent"
  - Loading state while fetching
```

**Scenario: User has no scans for period**
```
Given user hasn't scanned anything in selected period
When Health Trends section loads
Then:
  - Empty state displays:
    * Analytics icon (gray)
    * "No scan data for this period"
    * "Start Scanning" button
  - Tapping button:
    * Navigates to Camera screen
    * Opens barcode scanner mode
```

**Scenario: User taps "Scan History"**
```
Given Health Trends section visible
When user taps "Scan History" link
Then:
  - Navigates to Scan History screen
  - Shows full list of all scans
  - Filtered by current period (Today/Week/Month)
```

---

### 5.2 Health Score Visualization

**Health Score Gradient Bar:**
```
Visual representation:
  - Horizontal bar with gradient
  - Left (0-59): Red (#ef4444 → #dc2626)
  - Middle (60-79): Yellow/Orange (#f59e0b → #d97706)
  - Right (80-100): Green (#10b981 → #059669)
  
Indicator position:
  - White circle with blue border
  - Positioned at user's average score
  - Example: 75% score → circle at 75% along bar
  
Labels below:
  - Left: "Poor" (0-59)
  - Center: "Good" (60-79)
  - Right: "Excellent" (80-100)
```

**Score Calculation:**
```
Average Health Score = 
  Sum of all scan health scores / Number of scans
  
Scans included:
  - Barcode scans (product health score)
  - Food photo scans (meal healthiness)
  - Pill scans (medication safety)
  - Label scans (greenwashing score)
  
Weighted by:
  - Recency (recent scans weighted higher)
  - Scan type importance
```

---

### 5.3 Scan Statistics

**Total Scans Card:**
```
Icon: scan-outline (blue)
Number: Total scans in period
Label: "Total Scans"

Calculation:
  - Today: Scans from today
  - Week: Scans from last 7 days
  - Month: Scans from last 30 days
```

**Average Score Card:**
```
Icon: heart-outline (green)
Number: Rounded average health score
Label: "Avg Score"

Display:
  - Shows "--" if no scans
  - Color-coded by score:
    * Green (80+): Excellent
    * Yellow (60-79): Good
    * Red (<60): Needs improvement
```

**Food Scans Card:**
```
Icon: restaurant-outline (orange)
Number: Food photo + barcode scans
Label: "Food Scans"

Includes:
  - Food photo scans (camera)
  - Barcode scans (product nutrition)
  - Excludes: Pills, labels
```

---

### 5.4 Scan Type Breakdown

**Display Logic:**
```
Given user has multiple scan types
When breakdown section renders
Then shows chips for:
  - Barcodes (if count > 0):
    * Icon: barcode-outline
    * Text: "X Barcodes"
  - Pills (if count > 0):
    * Icon: medical-outline
    * Text: "X Pills"
  - Labels (if count > 0):
    * Icon: document-text-outline
    * Text: "X Labels"

Layout:
  - Horizontal row with flex wrap
  - Gray background chips
  - Gap between items
  - Hidden if no scans of that type
```

---

## 6. Meal & Fitness Goals

### 6.1 Goal Selection

**Available Goals:**
```
1. Weight Loss
   - Icon: flame (red #ef4444)
   - Formula: "Deficit + Cardio"
   - Color: Red
   
2. Muscle Gain
   - Icon: barbell (orange #f97316)
   - Formula: "Surplus + Strength"
   - Color: Orange
   
3. Body Recomposition
   - Icon: body (purple #8b5cf6)
   - Formula: "Balanced + Hybrid"
   - Color: Purple
   
4. Maintenance
   - Icon: scale (green #10b981)
   - Formula: "Maintain + Active"
   - Color: Green
   
5. Athletic Performance
   - Icon: trophy (blue #3b82f6)
   - Formula: "Optimize + Train"
   - Color: Blue
   
6. General Health
   - Icon: heart (pink #ec4899)
   - Formula: "Wellness + Habits"
   - Color: Pink
```

**Scenario: User selects a goal**
```
Given user viewing Meal & Fitness Goals section
When user taps a goal card (e.g., "Weight Loss")
Then:
  - Goal card highlights with solid color background
  - Icon background turns white with transparency
  - Text turns white
  - Other goal cards remain in inactive state
  - Backend API called to set active goal
  - Goal stored in user preferences
  - "Active Goal Progress" section appears below
  - Loading indicator during save
```

**Scenario: User already has active goal**
```
Given user previously selected "Muscle Gain"
When dashboard loads
Then:
  - Muscle Gain card shown with orange background
  - Icon in white circle with transparency
  - White text
  - Other cards in inactive state (white bg, colored text)
  - Progress section displays below goals
```

---

### 6.2 Goal Card States

**Inactive Goal Card:**
```
Appearance:
  - White background
  - Gray border (1px, #e5e7eb)
  - Colored icon in colored circle background
  - Dark text for title
  - Gray text for formula
  
Layout:
  - 48% width (2 columns)
  - Rounded corners (16px)
  - Padding: 16px
  - Min height: 140px
  - Center-aligned content
```

**Active Goal Card:**
```
Appearance:
  - Solid color background (goal's color)
  - No border
  - White icon in semi-transparent white circle
  - White text for title
  - Semi-transparent white text for formula
  
Visual cue:
  - Stands out from other cards
  - Slightly elevated (shadow)
```

---

### 6.3 Active Goal Progress Tracking

**Scenario: User has active goal and logged activities**
```
Given user selected "Muscle Gain" goal
And user logged workout and meals today
When viewing Active Goal Progress section
Then user sees:
  - Section title: "Muscle Gain Progress"
  - "Clear Goal" button (top right)
  - Three stat cards:
    
    1. Workout Status:
       - Checkmark icon (green) if completed
       - "Done!" text
       - Light green background
       OR:
       - Fitness icon (orange) if not completed
       - "Workout" text
       - White background
    
    2. Calories Logged:
       - Restaurant icon (purple)
       - "2,450 cal" (actual logged calories)
       - White background
    
    3. Overall Progress:
       - Trending-up icon (green)
       - "65%" (progress percentage)
       - White background
```

**Scenario: User clears active goal**
```
Given user has active goal
When user taps "Clear Goal" button
Then:
  - Confirmation modal: "Clear your active goal?"
  - Options: "Cancel" | "Clear Goal"
  - If confirmed:
    * Active goal removed
    * All goal cards return to inactive state
    * Progress section disappears
    * Backend updated
    * Toast: "Goal cleared"
```

---

### 6.4 Community Statistics

**Scenario: Viewing community stats**
```
Given goals dashboard loaded
When Community section appears
Then user sees:
  - "Community" section title
  - Three stats in horizontal row:
    
    1. Active Users:
       - People icon (blue)
       - "24k" (total active users in thousands)
       - Label: "Active"
    
    2. Waste Reduced:
       - Leaf icon (green)
       - "156k lbs" (total waste reduced)
       - Label: "Waste Reduced"
    
    3. Top Goal:
       - Trophy icon (orange)
       - "weight loss" (most popular goal)
       - Label: "Top Goal"
  
  - Stats update from backend
  - Refreshes with page
```

---

## 7. Today's Actions

### 7.1 Action Items Display

**Scenario: User views Today's Actions**
```
Given user on My Progress dashboard
When Today's Actions section loads
Then user sees:
  - Section title: "Today's Actions (2/5)"
    * Shows completed / total actions
  - List of action items:
    1. Morning Workout
       - Fitness icon (orange circle)
       - "7:00 AM" time badge
       - "Complete your 30-minute HIIT routine"
       - Status: Completed (checkmark, grayed out)
    
    2. Healthy Breakfast
       - Restaurant icon (purple circle)
       - "8:30 AM" time
       - "Log your morning meal with protein focus"
       - Status: Completed
    
    3. Hydration Check
       - Water icon (blue circle)
       - "2:00 PM" time
       - "Drink 2 more glasses of water"
       - Status: Not completed (empty checkbox)
    
    4. Evening Stretch
       - Body icon (orange circle)
       - "7:00 PM" time
       - "Complete 15-minute flexibility routine"
       - Status: Not completed
    
    5. Dinner Planning
       - Restaurant icon (purple circle)
       - "6:00 PM" time
       - "Plan and log your evening meal"
       - Status: Not completed
```

---

### 7.2 Completing Actions

**Scenario: User completes an action**
```
Given user views "Hydration Check" action (not completed)
When user taps the action card OR checkbox
Then:
  - Checkbox fills with green background
  - Checkmark appears in checkbox
  - Action title gets strikethrough
  - Card opacity reduces to 70%
  - Icon changes to checkmark (green)
  - Completed count updates: "3/5"
  - Today's Progress badge updates
  - Animation: gentle fade + scale
  - Haptic feedback (if enabled)
```

**Scenario: User uncompletes an action**
```
Given user previously completed "Morning Workout"
When user taps completed action again
Then:
  - Checkbox returns to empty state
  - Checkmark removed
  - Strikethrough removed from title
  - Card returns to full opacity
  - Original icon restored
  - Completed count updates: "1/5"
  - Today's Progress badge updates
```

---

### 7.3 Action Item Types & Colors

**Workout Actions:**
```
Icon: fitness
Color: Orange (#f97316)
Examples:
  - "Morning Workout"
  - "Evening Stretch"
  - "Cardio Session"
Background: Orange with 20% opacity
```

**Meal Actions:**
```
Icon: restaurant
Color: Purple (#8b5cf6)
Examples:
  - "Healthy Breakfast"
  - "Dinner Planning"
  - "Log Lunch"
Background: Purple with 20% opacity
```

**Habit Actions:**
```
Icon: water, checkmark-circle, etc.
Color: Blue (#3b82f6)
Examples:
  - "Hydration Check"
  - "Take Vitamins"
  - "Evening Walk"
Background: Blue with 20% opacity
```

**Health Actions:**
```
Icon: medical, heart, etc.
Color: Red (#ef4444)
Examples:
  - "Blood Pressure Check"
  - "Take Medication"
  - "Health Scan"
Background: Red with 20% opacity
```

---

### 7.4 Action Item Interactions

**Tap Behaviors:**
```
Tapping action card:
  - Toggles completion state
  - Same as tapping checkbox
  - Immediate visual feedback
  - State persists across sessions

Tapping time badge:
  - No action (informational only)
  - Shows scheduled time

Long press (future):
  - Opens action options
  - Edit, Delete, Reschedule
```

---

## 8. AI Coach Recommendations

### 8.1 Recommendation Display

**Scenario: User views coach recommendations**
```
Given AI analyzed user's progress and patterns
When Coach Recommendations section loads
Then user sees:
  - Section title: "AI Coach Recommendations"
  - List of recommendation cards:
    
    1. Adjust Workout Intensity
       - Priority: MEDIUM (yellow badge)
       - Fitness icon (yellow circle)
       - Message: "Based on yesterday's performance, consider reducing intensity by 10% today."
       - Action: "Apply Suggestion" button
    
    2. Increase Protein Intake
       - Priority: HIGH (red badge)
       - Nutrition icon (red circle)
       - Message: "Your protein intake is below target. Add a protein shake or nuts to your snack."
       - Action: "Apply Suggestion" button
    
    3. Sleep Optimization
       - Priority: MEDIUM (yellow badge)
       - Moon icon (yellow circle)
       - Message: "Try winding down 30 minutes earlier tonight for better sleep quality."
       - Action: "Apply Suggestion" button
```

---

### 8.2 Priority Levels

**High Priority:**
```
Badge color: Red (#ef4444)
Text: "HIGH"
Meaning: Urgent recommendation requiring immediate attention
Examples:
  - Critical nutrition deficiencies
  - Over-training risk
  - Health concern detected
Icon background: Red with 20% opacity
```

**Medium Priority:**
```
Badge color: Orange/Yellow (#f59e0b)
Text: "MEDIUM"
Meaning: Important but not urgent
Examples:
  - Workout adjustments
  - Meal timing suggestions
  - Sleep improvements
Icon background: Orange with 20% opacity
```

**Low Priority:**
```
Badge color: Green (#10b981)
Text: "LOW"
Meaning: Optional optimization
Examples:
  - Hydration reminders
  - Activity variety suggestions
  - General wellness tips
Icon background: Green with 20% opacity
```

---

### 8.3 Recommendation Types

**Workout Recommendations:**
```
Icon: fitness, barbell, etc.
Focus: Exercise optimization
Examples:
  - "Adjust intensity based on recovery"
  - "Try different workout type for variety"
  - "Rest day recommended"
Generated from:
  - Recent workout performance
  - Heart rate data
  - Recovery metrics
```

**Nutrition Recommendations:**
```
Icon: nutrition, restaurant, etc.
Focus: Dietary improvements
Examples:
  - "Increase protein intake"
  - "Add more vegetables"
  - "Timing of pre-workout meal"
Generated from:
  - Meal logs
  - Macro tracking
  - Goal alignment
```

**Wellness Recommendations:**
```
Icon: moon, heart, water, etc.
Focus: Overall health
Examples:
  - "Sleep optimization"
  - "Stress management"
  - "Hydration improvement"
Generated from:
  - Sleep data
  - Activity patterns
  - Health trends
```

---

### 8.4 Applying Suggestions

**Scenario: User applies suggestion**
```
Given user views "Increase Protein Intake" recommendation
When user taps "Apply Suggestion" button
Then:
  - Modal opens with implementation steps:
    * "Add 30g protein to next meal"
    * "Suggested foods: chicken, eggs, protein shake"
    * "Log meal when complete"
  - Options:
    * "Add to Meal Plan" - creates reminder
    * "Dismiss" - acknowledges but doesn't apply
    * "Not Now" - snoozes for later
  - If applied:
    * Recommendation marked as applied
    * Action item may be created
    * Tracking begins for suggestion
```

---

## 9. Data Refresh & Loading States

### 9.1 Initial Load

**Scenario: Dashboard loading**
```
Given user opens My Progress screen
When data is being fetched
Then:
  - Collapsing header appears immediately
  - Period selector appears
  - Progress cards section shows:
    * Loading spinner (centered)
    * "Loading health data..." text
    * Gray background card placeholders
  - Other sections load progressively:
    * Health Trends: Small spinner
    * Actions: Skeleton loading
    * Goals: Skeleton cards
    * Coach: Skeleton cards
  - Sections populate as data arrives
  - No blocking loading (partial display OK)
```

---

### 9.2 Pull-to-Refresh

**Scenario: User pulls down to refresh**
```
Given user at top of dashboard
When user pulls down on scroll view
Then:
  - Refresh indicator appears
  - Message: "Syncing health data..."
  - Data refreshes from all sources:
    * Health Connect/Samsung Health
    * Meal logs
    * Workout history
    * Scan history
    * Goals progress
  - Progress cards update with latest values
  - Actions update with completion status
  - Trends recalculate
  - Refresh indicator disappears
  - Haptic feedback on completion
```

---

### 9.3 Period Switch Loading

**Scenario: User switches from Today to Week**
```
Given user on Today period
When user taps Week tab
Then:
  - Week tab highlights immediately
  - Progress cards show loading state:
    * Opacity reduces to 50%
    * Small spinner on each card
  - Data fetches for weekly period
  - Cards update one by one as data arrives
  - Section title updates: "This Week's Metrics"
  - Smooth transition animations
  - No full-screen blocking
```

---

## 10. Error States & Fallbacks

### 10.1 Health Tracker Connection Errors

**Scenario: Health Connect permission denied**
```
Given user hasn't granted Health Connect permission
When dashboard tries to load health data
Then:
  - Banner appears at top:
    * "Connect health tracker for detailed metrics"
    * "Enable Health Tracking" button
  - Falls back to meal/workout data
  - Shows available metrics:
    * Meals Logged
    * Calories (from meals)
    * Protein
    * Workouts
  - Missing metrics show:
    * "-- / 10,000 steps"
    * "Connect tracker" placeholder
```

**Scenario: User enables health tracking**
```
Given user sees "Enable Health Tracking" banner
When user taps button
Then:
  - Navigation to Health Connect settings
  - Permission request modal
  - If granted:
    * Returns to dashboard
    * Auto-refreshes data
    * Health metrics populate
    * Banner disappears
  - If denied:
    * Returns to dashboard
    * Banner remains
    * Fallback data continues
```

---

### 10.2 Network Errors

**Scenario: Network error loading data**
```
Given user has no internet connection
When dashboard tries to fetch data
Then:
  - Error card appears:
    * Cloud-off icon
    * "Unable to sync data"
    * "Check your connection"
    * "Retry" button
  - Shows cached data (if available):
    * Last known values
    * Timestamp: "Last updated: 2 hours ago"
  - Partial functionality:
    * Can view cached metrics
    * Can complete local actions
    * Cannot refresh trends
```

**Scenario: User taps Retry**
```
Given network error displayed
When user taps "Retry" button
Then:
  - Loading indicator appears
  - Attempts to reconnect
  - If successful:
    * Data refreshes
    * Error card disappears
    * Latest data loads
  - If failed:
    * Error persists
    * Suggests checking WiFi/cellular
```

---

### 10.3 Empty States

**No Health Data:**
```
Display:
  - Empty metrics cards or mock data
  - "No health data available"
  - "Connect a health tracker or log activities"
  - "Get Started" CTA button
  
Action:
  - Guides to Health Connect setup
  - Or: Opens activity logging
```

**No Scans:**
```
Display:
  - Analytics icon (gray)
  - "No scan data for this period"
  - "Start scanning products to see trends"
  - "Start Scanning" button
  
Action:
  - Opens Camera screen
  - Ready to scan barcode
```

**No Active Goal:**
```
Display:
  - All goals in inactive state
  - "Select your goal to get a personalized plan"
  - No progress section displayed
  
Action:
  - User can tap any goal to activate
```

---

## 11. Accessibility & Interactions

### 11.1 Screen Reader Support

**VoiceOver / TalkBack Announcements:**
```
Progress Cards:
  - "Daily Steps, 74%, 7,450 out of 10,000 steps, button"
  - "Active Minutes, 73%, 22 out of 30 minutes, button"

Action Items:
  - "Morning Workout, completed, 7:00 AM, button"
  - "Hydration Check, not completed, 2:00 PM, button"

Goal Cards:
  - "Weight Loss, Deficit plus Cardio, not selected, button"
  - "Muscle Gain, Surplus plus Strength, active goal, button"

Period Selector:
  - "Today, selected, tab"
  - "Week, not selected, tab"
  - "Month, not selected, tab"
```

---

### 11.2 Haptic Feedback

**Haptic Events:**
```
Goal Selection:
  - Medium impact when tapping goal
  - Success notification when goal saved

Action Completion:
  - Light impact when checking off action
  - Success notification when all actions complete

Period Switch:
  - Selection feedback (light impact)

Pull-to-Refresh:
  - Refresh completion notification
```

---

### 11.3 Text Scaling

**Dynamic Type Support:**
```
All text respects user's text size settings:
  - Headers scale proportionally
  - Body text enlarges for readability
  - Metric numbers remain prominent
  - Cards expand to fit larger text
  - Minimum touch targets: 44x44 points
```

---

## 12. Navigation & Deep Links

### 12.1 Navigation from Dashboard

**Navigation Targets:**
```
From Health Trends:
  - "Scan History" → Scan History screen
  - "Start Scanning" → Camera screen

From Actions:
  - Action items (future) → Relevant screens
  - Workout action → Fitness screen
  - Meal action → Meal Diary screen

From Goals:
  - Goal cards (future) → Goal detail/setup
  - Progress stats → Detailed analytics

From Coach:
  - "Apply Suggestion" → Implementation modal
  - Recommendation cards (future) → AI Coach chat
```

---

### 12.2 Tab Navigation

**Bottom Tab Bar:**
```
Given user on My Progress dashboard
When user taps other tab icons
Then:
  - Navigates to selected tab
  - Dashboard state preserved
  - Returns to same scroll position
  - Data remains cached (5 min)
```

---

## 13. Performance Optimizations

### 13.1 Data Caching

**Caching Strategy:**
```
Health Data:
  - Cache duration: 5 minutes
  - Auto-refresh on focus
  - Manual refresh via pull-to-refresh

Scan Trends:
  - Cache duration: 10 minutes
  - Refresh on period change
  
Goals Data:
  - Cache duration: 30 minutes
  - Refresh on goal selection/clear

Coach Recommendations:
  - Cache duration: 1 hour
  - Refresh daily
```

---

### 13.2 Lazy Loading

**Progressive Loading:**
```
Initial render:
  - Header (immediate)
  - Period selector (immediate)
  - Progress cards skeleton

Deferred loading:
  - Health trends (after metrics)
  - Actions (background)
  - Goals (background)
  - Coach recommendations (background)

Benefit: Faster perceived load time
```

---

### 13.3 Animation Performance

**Optimized Animations:**
```
Header collapse:
  - Uses Animated API
  - Native driver: false (layout changes)
  - Smooth 60fps target

Period transitions:
  - Fade in/out with opacity
  - Transform for slide effects
  - Batch updates for card data

Action completion:
  - CSS-like transitions
  - Hardware acceleration
```

---

## 14. Summary of Key User Flows

### Quick Reference Chart

| User Goal | Starting Point | Key Steps | End State |
|-----------|----------------|-----------|-----------|
| **View today's metrics** | Dashboard | Default view → See progress cards | Today's health data displayed |
| **Check weekly progress** | Dashboard | Tap "Week" tab → View averages | Weekly summary shown |
| **Select fitness goal** | Goals section | Tap goal card → Confirm | Goal activated, progress tracking starts |
| **Complete action** | Actions list | Tap action → Check off | Action marked done, progress updated |
| **View scan trends** | Health Trends | View stats → Tap "Scan History" | Full scan history opened |
| **Refresh data** | Top of dashboard | Pull down → Release | All data refreshes |
| **Apply coach suggestion** | Recommendations | Tap "Apply" → Follow steps | Suggestion implemented |
| **Clear active goal** | Goals section | Tap "Clear Goal" → Confirm | Goal removed |
| **Switch time period** | Period selector | Tap Today/Week/Month | Metrics update to period |
| **Enable health tracking** | Error banner | Tap "Enable" → Grant permission | Health data loads |

---

## 15. Backend Integration Points

### 15.1 API Endpoints & Routes

**Base URLs:**
```
Production API: https://services.wihy.ai
User Service:   https://user.wihy.ai
Health API:     https://user.wihy.ai/api/users/me/health-data
```

---

#### Health Data Service
**Primary Data Source: Health Connect / Google Fit / HealthKit**

```typescript
// Initialize health tracking
- healthDataService.initialize()
  → Returns: boolean (permission granted)

// Get today's metrics
- healthDataService.getTodayMetrics()
  → Returns: HealthMetrics
  → Data: { steps, distance, calories, activeMinutes, heartRate, sleepHours, weight, hydration }

// Get weekly aggregated data
- healthDataService.getWeeklyData()
  → Returns: WeeklyHealthData
  → Data: { startDate, endDate, days[], averages, trends }

// Sync health data to backend
- POST https://user.wihy.ai/api/users/me/health-data
  → Body: HealthSyncPayload
  → Payload: {
      source: 'apple_healthkit' | 'google_health_connect' | 'manual',
      deviceType: string,
      timezone: string,
      recordedAt: ISO date,
      metrics: {
        steps, distanceMeters, activeMinutes, activeCalories, totalCalories,
        heartRateAvg, heartRateMin, heartRateMax, heartRateResting,
        sleepHours, sleepDeepHours, sleepRemHours, waterMl, weightKg, etc.
      }
    }
  → Returns: { success, data: { id, recordedAt, syncedAt } }

// Batch sync multiple days
- POST https://user.wihy.ai/api/users/me/health-data/batch
  → Body: HealthSyncBatchPayload
  → Payload: {
      source, deviceType, timezone,
      records: [{ recordedAt, metrics }]
    }
  → Returns: { success, data: { synced, skipped, errors[] } }

// Get historical health data from backend
- GET https://user.wihy.ai/api/users/me/health-data?start=YYYY-MM-DD&end=YYYY-MM-DD
  → Query Params: start (date), end (date), metrics (optional filter)
  → Returns: {
      userId, dateRange: { start, end }, latestSync, source,
      records: [{ date, steps, activeMinutes, sleepHours, heartRateAvg, healthScore }],
      summary: { avgSteps, avgActiveMinutes, avgSleepHours, trend }
    }
```

---

#### Nutrition Service
**Meal & Calorie Tracking**

```typescript
// Get today's nutrition summary
- nutritionService.getDailySummary(userId)
  → Returns: DailySummary
  → Data: {
      totals: { calories, protein_g, carbs_g, fat_g },
      goals: { calories, protein_g, carbs_g, fat_g },
      meals: MealItem[],
      water_ml, water_goal_ml
    }

// Get weekly nutrition trends
- nutritionService.getWeeklyTrends(userId)
  → Returns: Array<DailyNutritionSummary>
  → Data: Daily totals for past 7 days with averages

// Log meal (affects progress metrics)
- nutritionService.logMeal(data)
  → Body: { userId, mealType, foodName, calories, protein_g, carbs_g, fat_g, servings }
  → Returns: { success, message }
```

---

#### Fitness Service
**Workout & Exercise Tracking**

```typescript
// Get today's workout
- fitnessService.getTodayWorkout(userId)
  → Returns: WorkoutSession | null
  → Data: { workout_id, program_id, name, exercises[], completed, duration_minutes }

// Get workout history
- fitnessService.getHistory(userId, days = 7)
  → Returns: Array<WorkoutSession>
  → Data: Past workouts with completion status

// Mark workout as complete
- fitnessService.completeWorkout(workoutId, userId)
  → Returns: { success, message }
  → Updates: Today's progress metrics
```

---

#### Goals Dashboard Service
**Centralized Goal Management**

```typescript
// Get full dashboard data (goals, progress, community)
- GET https://services.wihy.ai/api/goals-dashboard?period=today|week|month
  → Query Params: period (default: 'today')
  → Returns: GoalsDashboardData {
      goals: GoalCard[],  // All 6 goal options
      activeGoal: GoalId, // Currently selected goal
      userProgress: {     // Simple display stats
        workoutsCompleted,
        caloriesLogged,
        overallProgress
      },
      progress: {         // Detailed metrics for active goal
        goalId, goalLabel, period,
        metrics: {
          caloriesBurned, caloriesConsumed, calorieDeficit,
          proteinGrams, proteinTarget,
          workoutsCompleted, workoutsTarget,
          mealsLogged, weight, weightChange
        },
        progressPercent,
        ranking: { percentile, label, totalUsers }
      },
      community: {
        totalActiveUsers,
        topGoal,
        totalWeightLost,
        totalWasteReduced
      }
    }
  → Caching: 5 minutes client-side

// Set active goal
- POST https://services.wihy.ai/api/goals-dashboard/active
  → Body: { goalId: 'weight_loss' | 'muscle_gain' | ... }
  → Returns: { success: true }
  → Note: Persisted locally immediately (optimistic), synced to server in background

// Clear active goal
- DELETE https://services.wihy.ai/api/goals-dashboard/active
  → Returns: { success: true }

// Hook Usage
- useGoalsDashboard(selectedPeriod)
  → Returns: {
      data: GoalsDashboardData,
      isLoading: boolean,
      error: Error | null,
      selectGoal: (goalId) => Promise<void>,
      clearGoal: () => Promise<void>,
      refresh: () => Promise<void>
    }
```

---

#### WIHY Scan Service
**Scan-Based Health Trends**

```typescript
// Get health trends from scans
- wihyApiService.getHealthTrends(timeRange: 'today' | 'week' | 'month')
  → Endpoint: GET https://services.wihy.ai/api/scan/health-trends?range=week
  → Returns: HealthTrends {
      trends: [{ date, avgScore, scanCount }],
      averageHealthScore: number,
      totalScans: number,
      scansByType: {
        barcode, food_photo, image, pill, product_label, label
      }
    }

// Get scan history
- wihyApiService.getScanHistory(limit = 50)
  → Endpoint: GET https://services.wihy.ai/api/scan/history?limit=50
  → Returns: {
      scans: ScanHistoryItem[],
      total: number,
      hasMore: boolean
    }
  → Cached: 5 minutes
```

---

#### User Service
**Goals API (Alternative to Goals Dashboard Service)**

```typescript
// Create goal
- POST https://user.wihy.ai/api/goals
  → Body: { user_id, type, title, target_value, target_date, category, initial_value }
  → Returns: { success, data: GoalObject }

// Get user's goals
- GET https://user.wihy.ai/api/goals?user_id=xxx&status=active&category=fitness
  → Query Params: user_id, status (optional), category (optional), type (optional)
  → Returns: { data: Goal[] }

// Get active goals
- GET https://user.wihy.ai/api/goals/active?user_id=xxx
  → Returns: { data: Goal[] }

// Get goal statistics
- GET https://user.wihy.ai/api/goals/stats?user_id=xxx
  → Returns: {
      total, active, completed, inProgress,
      completionRate, averageProgress
    }

// Get specific goal details
- GET https://user.wihy.ai/api/goals/:id
  → Returns: { data: Goal }

// Update goal
- PUT https://user.wihy.ai/api/goals/:id
  → Body: { title, target_value, target_date, status, etc. }
  → Returns: { success, data: Goal }

// Delete goal
- DELETE https://user.wihy.ai/api/goals/:id
  → Returns: { success, message }

// Log goal progress
- POST https://user.wihy.ai/api/goals/:id/progress
  → Body: { current_value, notes }
  → Returns: { success, data: ProgressEntry }
```

---

#### User Dashboard & Progress (Web Sharing)
**Public Progress Viewing**

```typescript
// Get user dashboard (includes progress)
- GET https://user.wihy.ai/api/users/:id/dashboard
  → Returns: UserDashboard {
      userId, displayName, avatar,
      stats: {
        totalWorkouts, totalMeals, currentStreak,
        healthScore, achievementCount
      },
      recentActivity: Activity[],
      activeGoals: Goal[],
      progressPhotos: Photo[],
      measurements: Measurement[]
    }
  → Note: Respects user's privacy settings

// Share progress (generate public link)
- POST https://user.wihy.ai/api/users/me/progress/share
  → Body: { period: 'week' | 'month', includePhotos: boolean }
  → Returns: {
      shareUrl: 'https://wihy.app/user/:userId/progress/:shareToken',
      expiresAt: ISO date,
      token: string
    }

// View shared progress (web interface)
- GET https://wihy.app/user/:userId/progress/:shareToken
  → Renders: Web page with progress metrics, charts, photos
  → Accessible: Anyone with link (no auth required)
  → Displays: Period's stats, goal progress, workout/meal summary
```

---

#### Progress Photos & Measurements
**Body Tracking**

```typescript
// Upload progress photo
- POST https://user.wihy.ai/api/progress/photos
  → Body: FormData { userId, photo (file), date, notes, visibility }
  → Returns: { success, data: { id, url, uploadedAt } }

// Get progress photos
- GET https://user.wihy.ai/api/progress/photos?user_id=xxx&start=YYYY-MM-DD&end=YYYY-MM-DD
  → Returns: { data: Photo[] }

// Log body measurements
- POST https://user.wihy.ai/api/progress/measurements
  → Body: {
      userId, date, weight_kg, body_fat_percent,
      chest_cm, waist_cm, hips_cm, thigh_cm, arm_cm
    }
  → Returns: { success, data: Measurement }

// Get measurement history
- GET https://user.wihy.ai/api/progress/measurements?user_id=xxx&start=YYYY-MM-DD&end=YYYY-MM-DD
  → Returns: { data: Measurement[] }
```

---

### 15.2 Authentication & Headers

**All API requests require authentication:**

```typescript
// Request headers
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${accessToken}`,  // From AuthContext
  'X-User-ID': userId,                       // Current user
  'X-Client-Version': '2.0.1',
  'X-Platform': 'react-native',
  'User-Agent': 'WIHY-Mobile/2.0.1'
}

// Get auth token
const { accessToken, user } = useContext(AuthContext);
const token = await authService.getAccessToken();
```

---

### 15.3 Data Flow & Sync Architecture

**Dashboard Load Sequence:**
```typescript
1. Component Mount:
   - Initialize AuthContext (get userId)
   - Initialize health service (request permissions)
   - Set default period: 'today'
   
2. Primary Data Load (Parallel):
   a. Health Metrics:
      - healthDataService.initialize()
      - healthDataService.getTodayMetrics()
      - Source priority: Health Connect > Samsung Health > Google Fit > Manual
      - Fallback: nutritionService + fitnessService data
      - Fallback: Mock data if no sources available
   
   b. Goals Dashboard:
      - useGoalsDashboard(selectedPeriod)
      - GET /api/goals-dashboard?period=today
      - Cache-first (5min TTL), background refresh
      - Returns: goals, activeGoal, userProgress, community
   
   c. Scan Trends:
      - wihyApiService.getHealthTrends('today')
      - GET /api/scan/health-trends?range=today
      - Cache-first (10min TTL)
      - Returns: trends, averageHealthScore, totalScans, scansByType
   
3. Secondary Data Load (Background):
   - Action items (currently mock, future: /api/users/me/actions)
   - Coach recommendations (currently mock, future: /api/ai/recommendations)
   - Progress photos (future: /api/progress/photos)
   
4. Display Strategy:
   - Render header immediately (no data needed)
   - Show loading skeletons for data sections
   - Populate sections progressively as data arrives
   - No blocking - partial display acceptable
   - Loading indicator per section (not full-screen)

5. Period Switch Flow:
   - User taps "Week" or "Month" tab
   - Update selectedPeriod state
   - Trigger data refresh:
     * healthDataService.getWeeklyData() for week/month
     * useGoalsDashboard(newPeriod) - fetches period-specific data
     * wihyApiService.getHealthTrends(newPeriod)
   - Animate transition (fade/slide)
   - Cache results per period
```

---

**Data Sync Strategy:**

```typescript
// Health Data Sync (Background, every 15 minutes)
sync_health_data() {
  1. Check if Health Connect authorized
  2. If yes:
     - Fetch today's steps, calories, activeMinutes, etc.
     - POST /api/users/me/health-data with metrics
     - Cache locally (AsyncStorage)
     - Update UI if dashboard visible
  3. If no:
     - Use cached data from previous sync
     - Show "Connect tracker" banner
}

// Goals Sync (Optimistic Updates)
set_active_goal(goalId) {
  1. Update local state immediately (optimistic)
  2. Save to AsyncStorage for persistence
  3. POST /api/goals-dashboard/active { goalId }
  4. On success: Confirm sync
  5. On failure: Queue for retry, show error toast
  6. Retry mechanism: Exponential backoff (5s, 30s, 2m)
}

// Offline Support
offline_behavior() {
  - All data cached with TTL (5-30 min depending on type)
  - Reads work offline (stale data displayed)
  - Writes queued via syncEngine
  - "Offline" banner shown when no connection
  - Auto-sync when connection restored
  - Cached data timestamp shown: "Updated 10 min ago"
}

// Pull-to-Refresh
pull_to_refresh() {
  1. User pulls down from top
  2. Invalidate all caches
  3. Fetch fresh data from all sources (parallel)
  4. Force server request (bypass cache)
  5. Update UI with latest data
  6. Show "Last updated: Just now"
}
```

---

**Data Caching Strategy:**

```typescript
Cache Keys & TTLs:
┌─────────────────────────────┬──────────┬───────────────┐
│ Data Type                   │ TTL      │ Storage       │
├─────────────────────────────┼──────────┼───────────────┤
│ Health Metrics (today)      │ 5 min    │ Memory        │
│ Health Metrics (week/month) │ 15 min   │ Memory        │
│ Goals Dashboard             │ 5 min    │ AsyncStorage  │
│ Active Goal                 │ 24 hours │ AsyncStorage  │
│ Scan Trends                 │ 10 min   │ Memory        │
│ Scan History                │ 5 min    │ Memory        │
│ Nutrition Summary           │ 5 min    │ AsyncStorage  │
│ Workout History             │ 10 min   │ AsyncStorage  │
│ Action Items (future)       │ 1 hour   │ Memory        │
│ Coach Recommendations       │ 1 hour   │ AsyncStorage  │
└─────────────────────────────┴──────────┴───────────────┘

Cache Invalidation Triggers:
- User completes action → Refresh progress metrics
- User logs meal → Refresh nutrition + progress
- User completes workout → Refresh fitness + progress
- User changes goal → Refresh goals dashboard
- User logs scan → Refresh scan trends
- Period switch → Load cached or fetch for new period
- Pull-to-refresh → Invalidate all, force fresh fetch
- App comes to foreground (>5 min) → Background refresh
```

---

**Error Handling & Retry Logic:**

```typescript
Error Scenarios:

1. Health Tracker Permission Denied:
   - Show: "Connect health tracker" banner
   - Action: "Enable Health Tracking" button
   - Fallback: Use meal/workout data
   - Retry: On button tap, open settings

2. API Request Failed (Network):
   - Show: "Unable to sync data. Check connection."
   - Action: "Retry" button
   - Fallback: Display cached data with timestamp
   - Auto-retry: When connection restored

3. API Request Failed (Server Error):
   - Show: "Server error. Please try again."
   - Log: Error to monitoring service
   - Fallback: Cached data if available
   - Retry: Exponential backoff (5s, 30s, 2m, 10m)

4. No Data Available (New User):
   - Show: Empty state with helpful message
   - Action: "Get Started" CTA
   - Display: Mock data for demonstration
   - Guide: Quick start guide overlay

5. Goal Not Set:
   - Section: Active Goal Progress not shown
   - Display: All goals in inactive state
   - Message: "Select your goal to track progress"
   - Action: Tap any goal card to activate

Retry Strategy:
- Attempt 1: Immediate (on error)
- Attempt 2: 5 seconds later
- Attempt 3: 30 seconds later
- Attempt 4: 2 minutes later
- Attempt 5: 10 minutes later
- After 5 failures: Give up, show persistent error
- Queue writes for later sync (offline support)
```

---

## 16. Future Enhancements

**Planned Features:**
```
✨ Actionable Recommendations:
  - One-tap apply from coach suggestions
  - Auto-create calendar events
  - Integration with meal/workout planners

✨ Social Features:
  - Compare progress with friends
  - Community challenges
  - Leaderboards

✨ Advanced Analytics:
  - Custom date ranges
  - Export progress reports
  - Trend predictions

✨ Smart Notifications:
  - Personalized reminders
  - Achievement celebrations
  - Milestone alerts

✨ Gamification:
  - Streak tracking
  - Badges and rewards
  - Daily challenges
```

---

## Document Version

**Version:** 1.0  
**Last Updated:** January 24, 2026  
**Author:** AI Assistant (Copilot)  
**Review Status:** Draft  

This document serves as the behavioral specification for the My Progress Dashboard feature. All interactions should match these behaviors for consistency and optimal user experience.
