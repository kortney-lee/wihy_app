# Consumption Dashboard - User Behavior Specification

## Overview

This document describes all user interactions with the Consumption Dashboard (Nutrition Analysis) feature, covering daily nutrition tracking, meal logging, recipe browsing, pending meal confirmations, and shopping list integration.

---

## 1. Initial Screen Load & Dashboard Overview

### When User Opens Consumption Dashboard

**Scenario: First-time user viewing consumption dashboard**
- **Given** user hasn't logged any meals today
- **When** Consumption dashboard loads
- **Then** user sees:
  - Collapsing header with title "Nutrition Analysis"
  - Subtitle: "Track your daily nutrition intake"
  - Progress badge: "0% daily goal achieved"
  - Tab selector: Nutrition | Meals | Recipes | Shopping
  - Nutrition tab selected (default)
  - Empty or default nutrition goals:
    * Calories: 0 / 2200 kcal (circular progress)
    * Protein: 0g / 120g (progress bar)
    * Carbs: 0g / 200g (progress bar)
    * Fat: 0g / 85g (progress bar)
  - Hydration tracker: 0 / 8 glasses
  - "Add Water" quick action button
  - Search bar: "Search food, meals, recipes..."

**Scenario: Returning user with logged meals**
- **Given** user has logged 3 meals today
- **When** dashboard loads
- **Then** user sees:
  - Updated nutrition progress:
    * Calories: 1,283 / 2200 kcal (58% circular progress)
    * Protein: 98g / 120g (82% filled bar - orange/red)
    * Carbs: 156g / 200g (78% filled bar - yellow/orange)
    * Fat: 67g / 85g (79% filled bar - purple)
  - Hydration: 6 / 8 glasses (6 filled water icons)
  - Progress badge: "58% daily goal achieved"
  - Real-time data from nutrition API
  - All logged meals visible in Meals tab

**Scenario: User with active meal plan**
- **Given** user has active meal plan with today's meals
- **When** dashboard loads on Meals tab
- **Then** user sees:
  - "Today's Meals" section header
  - "3 pending" meals to confirm badge
  - Pending meal cards showing:
    * Greek Yogurt with Berries (Breakfast, 8:00 AM)
    * Grilled Chicken Salad (Lunch, 12:30 PM)
    * Salmon with Quinoa (Dinner, 7:00 PM)
  - Each card shows: calories, macros (P/C/F), source indicator
  - Action buttons: "I Ate This" | "Skip" | Edit icon
  - "Already Logged Today" section (if meals logged)

---

## 2. Tab Navigation & Organization

### 2.1 Tab Structure

**Available Tabs:**
```
1. Nutrition (default)
   - Calorie circular progress
   - Macro progress bars (Protein/Carbs/Fat)
   - Hydration tracker
   - Focus: Daily totals and goals

2. Meals
   - Pending meal confirmations (from meal plans)
   - Already logged meals today
   - Focus: Meal-by-meal logging

3. Recipes
   - Browse saved meals, templates, scanned items
   - Filter by source: All | My Meals | Templates | Scanned
   - Focus: Recipe library browsing

4. Shopping
   - Active shopping lists
   - Items from meal plans
   - Checked/unchecked status
   - Focus: Shopping list management
```

**Scenario: User switches tabs**
```
Given user on Nutrition tab
When user taps "Meals" tab
Then:
  - Tab highlights (deep orange background)
  - Tab text turns white
  - Nutrition tab becomes inactive (gray background)
  - Content area loads pending meals
  - Loading indicator if data fetching
  - Smooth transition animation
  - Previous tab content cached
```

---

### 2.2 Tab-Specific Data Loading

**Nutrition Tab Loading:**
```
On mount:
  - Calls nutritionService.getDailySummary(userId)
  - Loads today's nutrition totals
  - Fetches logged meals list
  - Calculates goal percentages
  - Updates water intake count
  - Display: Circular progress, macro bars, hydration
```

**Meals Tab Loading:**
```
On first view:
  - Calls mealService.getUserMealPlans(userId)
  - Finds active meal plan
  - Calculates current day number
  - Fetches today's planned meals
  - Shows pending confirmations
  - Loads already-logged meals from dailySummary
  - Fallback to mock data if no plan
```

**Recipes Tab Loading:**
```
On first view:
  - Calls mealService.getUserMeals(userId) - user's saved meals
  - Calls mealService.getTemplates() - meal templates
  - Combines into browsable recipe list
  - Shows source tags: "My Meal" | "Template" | "Scanned"
  - Enables filtering by source
  - Displays prep time, macros, calories
```

**Shopping Tab Loading:**
```
On first view:
  - Calls shoppingService.getUserLists(userId)
  - Fallback to AsyncStorage if API unavailable
  - Shows list name, progress (X/Y items checked)
  - Displays total items count
  - Empty state if no lists
```

---

## 3. Nutrition Tab - Daily Tracking

### 3.1 Circular Calorie Progress

**Visual Design:**
```
Circular ring display:
  - Size: 120x120 pixels
  - Stroke width: 8px
  - Track color: Light gray (#e5e7eb)
  - Fill color: Primary blue (#3b82f6)
  - Center text:
    * Large number: "1,283" (current calories)
    * Small text: "/ 2200" (target)
    * Label: "calories"
  - Rotation: -90° (starts at top)
  - Fill: 0-100% (caps at 100%)
```

**Scenario: User viewing calorie progress**
```
Given user consumed 1,847 calories (target: 2200)
When circular progress renders
Then:
  - Circle fills to 84% (1847/2200)
  - Shows "1847" in center (large text)
  - Shows "/ 2200" below (small text)
  - Shows "calories" label at bottom
  - Blue arc spans 84% of circumference
  - Remaining 16% shows gray track
```

**Scenario: User exceeds calorie target**
```
Given user consumed 2,450 calories (target: 2200)
When circular progress renders
Then:
  - Circle fills to 100% (capped)
  - Shows "2450" in red text (warning color)
  - Shows "/ 2200" below
  - Message: "Over target by 250 cal"
  - OR: Shows 111% completion indicator
```

---

### 3.2 Macro Progress Bars

**Macro Display Structure:**
```
Each macro shows:
  - Label: "Protein" | "Carbs" | "Fat"
  - Value: "98g / 120g" (current / target)
  - Horizontal progress bar:
    * Background: Light gray
    * Fill color: Macro-specific
    * Height: 6px
    * Rounded corners
  - Percentage: "82%" (right-aligned below bar)
```

**Macro Colors:**
```
Protein: Red/Orange (#ef4444 or #f97316)
  - Primary muscle-building nutrient
  - Typically highest priority
  
Carbs: Yellow/Orange (#f59e0b)
  - Energy source
  - Moderate priority
  
Fat: Purple (#8b5cf6)
  - Essential fatty acids
  - Calorie-dense
```

**Scenario: User views macro breakdown**
```
Given user's current macros:
  - Protein: 98g / 120g (82%)
  - Carbs: 156g / 200g (78%)
  - Fat: 67g / 85g (79%)

When macro bars render
Then each shows:
  - Protein bar: 82% filled in red/orange
  - Carbs bar: 78% filled in yellow
  - Fat bar: 79% filled in purple
  - All below 100% target (healthy range)
  - Percentage indicators on right
```

**Scenario: User exceeds protein target**
```
Given user consumed 135g protein (target: 120g)
When protein bar displays
Then:
  - Bar fills to 100%
  - Shows "135g / 120g"
  - Percentage: "113%" (possibly in green - exceeding is good)
  - No warning (protein overage is beneficial)
```

---

### 3.3 Hydration Tracker

**Visual Design:**
```
Water glasses display:
  - 8 circular icons in horizontal row
  - Each represents 250ml (1 glass)
  - Icon: Water droplet (Ionicons "water")
  - States:
    * Empty: Gray border, gray icon
    * Filled: Blue background (20% opacity), blue border, blue icon
  - Below icons: "6 / 8 glasses" text
  - "Add Water" button (top right)
```

**Scenario: User views hydration progress**
```
Given user drank 6 glasses of water (1,500ml)
When hydration section displays
Then user sees:
  - First 6 glass icons filled (blue)
  - Last 2 glass icons empty (gray)
  - Text: "6 / 8 glasses"
  - Progress: 75% to goal (2,000ml target)
  - "Add Water" button visible
```

**Scenario: User adds water**
```
Given user tapped "Add Water" button
When action processes
Then:
  - Calls nutritionService.logWater({ userId, amountMl: 250 })
  - Increments water count: 6 → 7
  - 7th glass icon fills with blue
  - Text updates: "7 / 8 glasses"
  - Dashboard refreshes
  - No modal/confirmation (instant action)
  - Success feedback (haptic + visual)
```

**Water Targets:**
```
Default goal: 8 glasses = 2,000ml
Calculation: 250ml per glass
Can customize in user settings
Recommendations based on:
  - Body weight
  - Activity level
  - Climate/temperature
```

---

## 4. Meals Tab - Meal Logging

### 4.1 Pending Meals Section

**Pending Meal Card Structure:**
```
Each card displays:
  - Header row:
    * Meal type badge (icon + label)
      - Breakfast: Sunny icon, yellow/orange
      - Lunch: Partly-sunny icon, blue
      - Dinner: Moon icon, purple
      - Snack: Cafe icon, accent color
    * Scheduled time (e.g., "8:00 AM")
  
  - Meal name: "Greek Yogurt with Berries"
  
  - Nutrition summary:
    * Large text: "245 cal"
    * Macro row: "P: 18g  C: 28g  F: 6g"
  
  - Source indicator:
    * Icon: Calendar (meal plan) or Cart (shopping)
    * Text: "From: Today's Meal Plan"
  
  - Action buttons:
    * "I Ate This" (green button with checkmark)
    * "Skip" (outline button with X icon)
    * Edit icon (pencil outline)
```

**Scenario: User views pending meals**
```
Given user has 3 pending meals from meal plan
When Meals tab loads
Then user sees:
  - Section header: "Today's Meals"
  - Badge: "3 pending"
  - Three meal cards stacked vertically:
    
    1. Breakfast (8:00 AM)
       Greek Yogurt with Berries
       245 cal | P: 18g C: 28g F: 6g
       From: Today's Meal Plan
    
    2. Lunch (12:30 PM)
       Grilled Chicken Salad
       387 cal | P: 35g C: 15g F: 18g
       From: Today's Meal Plan
    
    3. Dinner (7:00 PM)
       Salmon with Quinoa
       456 cal | P: 32g C: 48g F: 18g
       From: Today's Meal Plan
  
  - All show confirmation buttons
  - Sorted by scheduled time
```

---

### 4.2 Confirming Meals ("I Ate This")

**Scenario: User confirms eating a meal**
```
Given user taps "I Ate This" on Breakfast meal
When confirmation modal opens
Then user sees:
  - Modal title: "Log This Meal"
  - Meal name: "Greek Yogurt with Berries"
  
  - Meal Type Selector:
    * 4 options: Breakfast | Lunch | Dinner | Snack
    * Icons for each type
    * "Breakfast" pre-selected (from scheduled type)
    * Tap to change if needed
  
  - Servings Selector:
    * Minus button | "1" | Plus button
    * Increments: 0.5 servings
    * Range: 0.5 - 10 servings
    * Default: 1 serving
  
  - Calculated Nutrition (live updates):
    * Calories: 245 (based on servings)
    * Protein: 18g
    * Carbs: 28g
    * Fat: 6g
  
  - "Confirm & Log" button (green, with checkmark)
  - Close button (X, top right)
```

**Scenario: User adjusts servings**
```
Given modal open for Greek Yogurt meal
When user taps Plus button twice
Then:
  - Servings: 1 → 1.5 → 2
  - Nutrition recalculates:
    * Calories: 245 → 368 → 490
    * Protein: 18g → 27g → 36g
    * Carbs: 28g → 42g → 56g
    * Fat: 6g → 9g → 12g
  - All values multiply by servings
  - Updates in real-time
  - No lag or delay
```

**Scenario: User changes meal type**
```
Given breakfast meal scheduled for 8:00 AM
And user ate it at lunch time instead
When user taps "Lunch" in modal
Then:
  - Lunch option highlights (blue background)
  - Breakfast de-selects
  - Lunch icon shows
  - Meal will log as lunch type
  - Nutrition calculations unchanged
  - Allows flexibility for actual eating time
```

**Scenario: User confirms and logs meal**
```
Given user filled out confirmation modal
  - Meal type: Breakfast
  - Servings: 1.5
When user taps "Confirm & Log"
Then:
  - Calls nutritionService.logMeal({
      userId,
      mealType: 'breakfast',
      foodName: 'Greek Yogurt with Berries',
      calories: 368,
      protein_g: 27,
      carbs_g: 42,
      fat_g: 9,
      servings: 1.5
    })
  - Pending meal marked as confirmed
  - Card disappears from pending list
  - Badge updates: "3 pending" → "2 pending"
  - Meal appears in "Already Logged Today" section
  - Dashboard nutrition totals update:
    * Calories: +368
    * Protein: +27g
    * Carbs: +42g
    * Fat: +9g
  - Modal closes
  - Success alert: "Greek Yogurt with Berries logged!"
  - Circular progress updates to new percentage
```

---

### 4.3 Skipping Meals

**Scenario: User skips a meal**
```
Given user doesn't want to eat scheduled Dinner
When user taps "Skip" button on dinner card
Then:
  - Meal marked as skipped (no confirmation needed)
  - Card disappears from pending list
  - Badge updates: "3 pending" → "2 pending"
  - No nutrition logged
  - Doesn't affect meal plan for future days
  - Can undo by refreshing/reloading (meal reappears)
  - Skipped status not permanent
```

---

### 4.4 Already Logged Meals Section

**Display Structure:**
```
Section: "Already Logged Today"
Shown when: User has logged ≥1 meal

Each logged meal card shows:
  - Left side:
    * Meal type icon (colored circle)
    * Meal name
    * Logged time (e.g., "8:23 AM")
    * Macro tags: P: Xg | C: Yg | F: Zg
  
  - Right side:
    * Large calorie number
    * "cal" label
  
  - Tap behavior:
    * Opens nutrition facts detail view
    * Shows full breakdown
```

**Scenario: User views logged meals**
```
Given user logged 3 meals today
When viewing Meals tab
Then "Already Logged Today" section shows:
  
  1. Greek Yogurt with Berries
     8:23 AM | Breakfast
     P: 27g | C: 42g | F: 9g
     368 cal
  
  2. Grilled Chicken Salad
     1:15 PM | Lunch
     P: 35g | C: 15g | F: 18g
     387 cal
  
  3. Protein Smoothie
     3:45 PM | Snack
     P: 25g | C: 12g | F: 4g
     195 cal
  
  - Sorted chronologically (newest first OR oldest first)
  - Each tappable for details
```

**Scenario: User taps logged meal**
```
Given user taps "Greek Yogurt with Berries"
When navigation triggers
Then:
  - Opens nutrition facts screen
  - Shows detailed breakdown:
    * Calories: 368 kcal
    * Protein: 27g (29% DV)
    * Carbs: 42g (14% DV)
    * Fat: 9g (12% DV)
    * Fiber, sugar, sodium (if available)
  - "Edit" and "Delete" options
  - Can adjust servings retroactively
```

---

### 4.5 Empty States

**No Pending Meals:**
```
Display:
  - Large checkmark icon (green)
  - Title: "All caught up!"
  - Message: "No pending meals to confirm. Check Recipes tab to log something new."
  - Centered in content area
  - Still shows "Already Logged Today" if meals exist
```

**No Logged Meals:**
```
Display:
  - Empty meals list
  - Message: "No meals logged yet today"
  - CTA: "Browse Recipes to add a meal"
  - OR: Quick add buttons:
    * "Log Breakfast"
    * "Log Lunch"
    * "Log Dinner"
```

---

## 5. Recipes Tab - Recipe Browsing

### 5.1 Recipe Filtering

**Filter Options:**
```
Horizontal scrollable chips:
  - All (default, shows all recipes)
  - My Meals (user_created source)
  - Templates (template source)
  - Scanned (scanned source)

Visual states:
  - Active: Colored background (primary blue), white text
  - Inactive: Light gray background, dark text
  
Tap behavior:
  - Single select (one filter active at a time)
  - Instant filtering (no loading)
```

**Scenario: User filters by "My Meals"**
```
Given user viewing all recipes (120 total)
When user taps "My Meals" filter chip
Then:
  - Chip highlights (blue background)
  - "All" chip de-selects
  - Recipe list filters to user-created meals only
  - Shows: 35 recipes (user's saved meals)
  - Hides: Templates and scanned items
  - No loading indicator (instant)
  - Scroll position resets to top
```

**Scenario: User filters by "Templates"**
```
Given 45 recipe templates available
When user taps "Templates"
Then:
  - Shows only template recipes
  - Each shows "Template" source tag
  - Official recipe photos displayed
  - Nutrition guaranteed (from database)
  - Can browse and log directly
```

---

### 5.2 Recipe Card Display

**Recipe Card Structure:**
```
Grid layout: 2 columns
Card size: ~48% width each
Vertical scroll

Each card shows:
  - Top right corner:
    * Favorite heart icon (if favorited, red)
    * Source tag: "My Meal" | "Template" | "Scanned"
  
  - Recipe name (2 lines max, ellipsis)
  
  - Nutrition row:
    * Large: "380 cal"
    * Small macros: P: 32g | C: 24g | F: 16g
  
  - Prep time (if available):
    * Clock icon
    * "25 min"
  
  - Bottom button:
    * "Log" button (blue, with + icon)
    * Tap to log recipe
```

**Scenario: User views recipe grid**
```
Given 35 recipes in "My Meals"
When recipes render in grid
Then user sees 2-column layout:
  
  Column 1:
  ┌──────────────────────┐
  │ ♥️  [My Meal tag]   │
  │ Chicken Stir Fry     │
  │ 380 cal              │
  │ P:32g C:24g F:16g    │
  │ ⏱️ 25 min            │
  │  [➕ Log]            │
  └──────────────────────┘
  
  Column 2:
  ┌──────────────────────┐
  │    [Template tag]    │
  │ Protein Smoothie     │
  │ Bowl                 │
  │ 295 cal              │
  │ P:28g C:35g F:6g     │
  │ ⏱️ 10 min            │
  │  [➕ Log]            │
  └──────────────────────┘
  
  - Alternating rows
  - Scroll to see more
  - Consistent spacing
```

**Scenario: User taps recipe card**
```
Given user taps "Chicken Stir Fry" recipe
When tap registers
Then:
  - Opens confirmation modal (same as pending meals)
  - Shows recipe name
  - Meal type defaults to current time:
    * Morning (6am-11am): Breakfast
    * Midday (11am-3pm): Lunch
    * Afternoon (3pm-6pm): Snack
    * Evening (6pm+): Dinner
  - Servings: 1 (default)
  - Nutrition: 380 cal, 32g P, 24g C, 16g F
  - User can adjust and log
```

---

### 5.3 Recipe Search

**Search Functionality:**
```
Search bar: "Search food, meals, recipes..."
Location: Top of screen (fixed)
Behavior: Live filtering as user types

Searches in:
  - Recipe names
  - Ingredients (if available)
  - Tags (if available)

Not case-sensitive
Filters current tab content (respects active filter)
```

**Scenario: User searches for "chicken"**
```
Given user on Recipes tab with "All" filter
When user types "chicken" in search bar
Then:
  - Recipe list filters in real-time
  - Shows recipes containing "chicken":
    * "Chicken Stir Fry"
    * "Grilled Chicken Salad"
    * "Chicken Pesto Pasta"
    * "BBQ Chicken Bowl"
  - Hides non-matching recipes
  - Shows count: "4 recipes found"
  - Clear button (X) appears in search bar
```

**Scenario: User clears search**
```
Given search active with results filtered
When user taps X button in search bar
Then:
  - Search query clears
  - All recipes reappear (respecting filter)
  - Full recipe list restored
  - Search bar shows placeholder text
```

---

### 5.4 Empty States & Loading

**No Search Results:**
```
Display:
  - Restaurant icon (gray, large)
  - "No recipes found"
  - "Try a different search or filter, or create a new meal."
  - Centered in content area
```

**Loading Recipes:**
```
Display:
  - Small spinner (primary color)
  - Centered in recipe area
  - Replaces recipe grid
  - Brief duration (1-2 seconds typical)
```

---

## 6. Shopping Tab - Shopping Lists

### 6.1 Shopping List Display

**List Card Structure:**
```
Each shopping list shows:
  - Left side:
    * Cart icon (blue circle)
  
  - Center content:
    * List name: "My Shopping List"
    * Progress text: "24 / 45 items checked"
    * Progress bar (horizontal):
      - Background: Light gray
      - Fill: Primary blue
      - Shows: 53% filled (24/45)
  
  - Right side:
    * Chevron-forward icon (tap indicator)
  
  - Tap behavior:
    * Opens shopping list detail view
    * Shows all items by category
    * Allows checking/unchecking
```

**Scenario: User views shopping lists**
```
Given user has 2 shopping lists
When Shopping tab loads
Then user sees:
  - Section header: "Shopping Lists"
  - Badge: "2 lists"
  
  List 1:
  ┌─────────────────────────────────┐
  │ 🛒  My Shopping List            │
  │     24 / 45 items checked       │
  │     [████████░░░] 53%           │
  │                               › │
  └─────────────────────────────────┘
  
  List 2:
  ┌─────────────────────────────────┐
  │ 🛒  Weekly Groceries            │
  │     12 / 30 items checked       │
  │     [████░░░░░░░] 40%           │
  │                               › │
  └─────────────────────────────────┘
  
  - Sorted by most recent or by name
  - All tappable
```

**Scenario: User taps shopping list**
```
Given user taps "My Shopping List"
When navigation occurs
Then:
  - Opens shopping list detail screen
  - Shows categorized items:
    * 🥩 Proteins (5 items)
    * 🥬 Produce (12 items)
    * 🥛 Dairy (8 items)
    * 🌾 Grains (6 items)
    * 🧂 Pantry (10 items)
    * 🛒 Other (4 items)
  - Each item has checkbox
  - Can check/uncheck items
  - Progress updates in real-time
  - Can share, clear completed, etc.
```

---

### 6.2 Shopping List Sources

**Data Sources:**
```
1. API: shoppingService.getUserLists(userId)
   - Primary source
   - Server-stored lists
   - Synced across devices

2. AsyncStorage: @wihy_shopping_list
   - Fallback/offline storage
   - Local persistence
   - Used by CreateMeals screen

3. Meal Plans:
   - Auto-generated from accepted plans
   - Ingredients extracted
   - Categorized automatically
```

**List Formats:**
```
API Format:
  - list_id: UUID
  - user_id: User ID
  - name: String
  - items: Array of ShoppingListItem
  - total_items: Number
  - checked_items: Number
  - created_at: ISO date
  - updated_at: ISO date

Local Format (AsyncStorage):
  - Object keyed by category
  - Each category: Array of items
  - Items: { item_name, quantity, checked }
  - Converted to API format for display
```

---

### 6.3 Empty State

**No Shopping Lists:**
```
Display:
  - Cart icon (gray, large)
  - "No shopping lists"
  - "Create a meal plan to generate a shopping list."
  - CTA button: "Create Meal Plan" (navigates to CreateMeals)
```

---

## 7. Collapsing Header Animation

### 7.1 Header Behavior on Scroll

**Header Structure:**
```
Expanded (scroll Y = 0):
  - Height: 140px
  - Background: Deep orange (#ea580c)
  - Title: "Nutrition Analysis" (28px, bold)
  - Subtitle: "Track your daily nutrition intake" (16px)
  - Progress badge: "58% daily goal achieved"
  - Full opacity

Collapsed (scroll Y > 140):
  - Height: 0px
  - Opacity: 0
  - Title scaled to 0.8
  - translateY: -20px
  - Header completely hidden
```

**Scenario: User scrolls down**
```
Given user at top of dashboard
When user scrolls down 140+ pixels
Then header animates:
  - Height: 140px → 0px (smooth)
  - Opacity: 1 → 0 (fades out at 70px)
  - Title scale: 1.0 → 0.8
  - Title translates up (-20px)
  - Tab selector remains visible (fixed)
  - Orange status bar remains
  - Smooth 60fps animation
  - Uses Animated API
```

**Scenario: User scrolls back to top**
```
Given user scrolled down (header collapsed)
When user scrolls back to top
Then header expands:
  - Height: 0px → 140px
  - Opacity: 0 → 1 (fades in)
  - Title scale: 0.8 → 1.0
  - Title translates down (+20px to 0)
  - Progress badge reappears
  - Reverse animation (same smoothness)
```

---

### 7.2 Fixed Tab Selector

**Behavior:**
```
Tab selector:
  - Always visible (not affected by scroll)
  - Fixed position below header/status bar
  - White background
  - Top and bottom borders
  - Scrolls horizontally (4 tabs)
  - Persists during header collapse
  - Provides constant navigation
```

---

## 8. Search Functionality

### 8.1 Global Search Bar

**Search Behavior:**
```
Scope: Varies by active tab
  - Nutrition: Not applicable (no searchable items)
  - Meals: Searches logged and pending meals
  - Recipes: Searches recipe names, ingredients, tags
  - Shopping: Searches shopping list items

Live filtering: Results update as user types
Debouncing: None (instant results)
Clear button: X appears when text entered
```

**Scenario: User searches on Recipes tab**
```
Given user on Recipes tab
When user types "smoothie"
Then:
  - Filters recipe list in real-time
  - Shows matching recipes:
    * "Protein Smoothie Bowl"
    * "Berry Smoothie"
    * "Green Smoothie"
  - Hides non-matching recipes
  - Respects active filter (My Meals/Templates/etc)
  - Clear X button appears
```

**Scenario: User searches on Meals tab**
```
Given user on Meals tab with 5 logged meals
When user types "chicken"
Then:
  - Filters logged meals
  - Shows "Grilled Chicken Salad"
  - Hides other meals
  - Pending meals also filtered (if searchable)
```

---

## 9. Pull-to-Refresh

**Scenario: User pulls down to refresh**
```
Given user at top of any tab
When user pulls down on scroll view
Then:
  - Refresh indicator appears (spinner)
  - Calls loadDailySummary()
  - Refreshes current tab data:
    * Nutrition: Reloads nutrition totals
    * Meals: Reloads pending + logged meals
    * Recipes: Reloads recipe library
    * Shopping: Reloads shopping lists
  - Indicator disappears when complete
  - Content updates with latest data
  - Success haptic feedback
```

---

## 10. Error States & Validation

### 10.1 API Errors

**Nutrition Load Failure:**
```
When nutritionService.getDailySummary fails:
  - Shows error alert: "Failed to load nutrition data"
  - Displays last cached data (if available)
  - Shows "Retry" button
  - Allows offline functionality with stale data
```

**Recipe Load Failure:**
```
When mealService API fails:
  - Falls back to mock data
  - Shows 3 sample recipes
  - Banner: "Using sample data. Check connection."
  - "Retry" option in error state
```

**Shopping List Failure:**
```
When shoppingService fails:
  - Checks AsyncStorage for local data
  - Converts local format to display format
  - Shows local shopping list
  - Banner: "Offline mode - using local list"
```

---

### 10.2 Empty States

**No Data Available:**
```
Each tab has specific empty state:
  - Nutrition: Default goals (0 consumed)
  - Meals: "No meals logged yet today"
  - Recipes: "No recipes found. Create a meal!"
  - Shopping: "No shopping lists. Create meal plan."

All include:
  - Icon (large, gray)
  - Title text
  - Helpful message
  - CTA button (if applicable)
```

---

### 10.3 Validation & Constraints

**Servings Adjustment:**
```
Minimum: 0.5 servings
Maximum: 10 servings
Increment: 0.5
  - Prevents: 0 servings (must log something)
  - Allows: Partial servings (ate half)
  - Caps: Reasonable max to prevent errors
```

**Meal Type Required:**
```
When logging meal:
  - Must select: Breakfast | Lunch | Dinner | Snack
  - Default: Based on current time
  - Cannot submit without selection
  - Red border if missing
```

---

## 11. Accessibility & Interactions

### 11.1 Screen Reader Support

**VoiceOver / TalkBack Announcements:**
```
Nutrition Progress:
  - "Calories: 1,847 out of 2,200, 84 percent complete"
  - "Protein: 98 grams out of 120 grams, 82 percent"
  - "Add water button"

Pending Meals:
  - "Breakfast, Greek Yogurt with Berries, 245 calories, scheduled for 8:00 AM"
  - "I ate this button"
  - "Skip button"

Recipe Cards:
  - "Chicken Stir Fry, 380 calories, 25 minutes prep time, my meal"
  - "Log button"

Tabs:
  - "Nutrition tab, selected"
  - "Meals tab, not selected, button"
```

---

### 11.2 Haptic Feedback

**Haptic Events:**
```
Water Added:
  - Success notification haptic
  - Confirms action completion

Meal Logged:
  - Success notification haptic
  - Medium impact
  - Positive feedback

Tab Switch:
  - Light impact selection
  - Subtle feedback

Button Taps:
  - Light impact
  - Confirms interaction
```

---

### 11.3 Gesture Support

**Pull-to-Refresh:**
```
- Pull down from top of scroll view
- Works on all tabs
- Native iOS/Android behavior
- Spinner during refresh
```

**Horizontal Scroll:**
```
- Tab selector scrolls horizontally
- Filter chips scroll horizontally
- Shopping list items (future: swipe to delete)
```

---

## 12. Navigation & Deep Links

### 12.1 Navigation Targets

**From Consumption Dashboard:**
```
Logged Meal Card → Nutrition Facts Detail
  - Shows full nutritional breakdown
  - Edit/delete options

Recipe Card → Confirmation Modal → Log Success
  - Modal for servings/type selection
  - Logs to nutrition service
  - Updates dashboard

Shopping List → Shopping List Detail
  - Full list with categories
  - Check/uncheck items
  - Share options

Search → Filtered Results
  - Stays on current tab
  - Shows matching items only
```

---

### 12.2 Tab Persistence

**State Management:**
```
When switching tabs:
  - Previous tab data cached (5 min)
  - Scroll position preserved
  - Search query persists on tab
  - Filter selection persists
  - No unnecessary reloads
```

---

## 13. Performance Optimizations

### 13.1 Data Caching

**Cache Strategy:**
```
Nutrition Summary:
  - Cache: 5 minutes
  - Refresh: On pull-to-refresh, meal log
  - Source: nutritionService.getDailySummary

Recipes:
  - Cache: 30 minutes
  - Refresh: Manual only
  - Source: mealService (user meals + templates)

Shopping Lists:
  - Cache: 10 minutes
  - Fallback: AsyncStorage (offline)
  - Refresh: On tab switch, manual

Pending Meals:
  - Cache: Until day changes
  - Refresh: On meal log/skip
  - Source: Active meal plan
```

---

### 13.2 Lazy Loading

**Tab Loading:**
```
Initial render:
  - Load Nutrition tab data immediately
  - Defer other tabs until viewed
  - Show loading spinner when switching
  - Cache loaded data

Recipe Grid:
  - Load first 20 recipes
  - Load more on scroll (pagination)
  - Prevents large initial load

Image Loading:
  - Lazy load recipe images
  - Placeholder while loading
  - Cache after first load
```

---

### 13.3 Animation Performance

**Header Collapse:**
```
- Uses Animated API
- Native driver: false (layout changes)
- Smooth 60fps target
- Interpolate: height, opacity, scale, translateY
```

**Progress Animations:**
```
- Circular progress: SVG or border manipulation
- Macro bars: Width animation
- Water glasses: Opacity + background color
- Smooth transitions (300ms duration)
```

---

## 14. Future Enhancements

**Planned Features:**
```
✨ Meal Photo Upload:
  - Take photo of meal
  - AI calorie estimation
  - Visual meal diary

✨ Barcode Scanning:
  - Scan packaged foods
  - Auto-populate nutrition
  - Add to meal log

✨ Meal Templates:
  - Save custom meal templates
  - Quick log common meals
  - "Breakfast #1" shortcuts

✨ Nutrition Insights:
  - Weekly nutrition trends
  - Macro balance over time
  - Deficit/surplus tracking

✨ Recipe Details:
  - Full recipe view
  - Cooking instructions
  - Ingredient list
  - Nutrition per ingredient

✨ Shopping List Integration:
  - Check off items while shopping
  - Sync with grocery apps
  - Price tracking

✨ Meal Reminders:
  - Notifications for pending meals
  - Hydration reminders
  - "Did you eat?" prompts

✨ Export & Reports:
  - PDF meal diary
  - CSV export
  - Share with nutritionist

✨ Advanced Filtering:
  - Filter by macro ranges
  - Filter by prep time
  - Filter by ingredients
```

---

## 15. Summary of Key User Flows

### Quick Reference Chart

| User Goal | Starting Point | Key Steps | End State |
|-----------|----------------|-----------|-----------|
| **View daily nutrition** | Dashboard load | Nutrition tab → View circular progress | Nutrition totals displayed |
| **Log water** | Nutrition tab | Tap "Add Water" | Water count +1, glass fills |
| **Confirm pending meal** | Meals tab | Tap "I Ate This" → Adjust servings → Confirm | Meal logged, totals updated |
| **Skip meal** | Meals tab | Tap "Skip" on meal card | Meal removed from pending |
| **Browse recipes** | Recipes tab | Filter by source → Search (optional) | Recipe grid displayed |
| **Log recipe** | Recipe card | Tap recipe → Set servings/type → Confirm | Recipe logged as meal |
| **View shopping lists** | Shopping tab | View list cards → Tap list | List details opened |
| **Search recipes** | Recipes tab | Type in search bar | Filtered recipe results |
| **Refresh data** | Any tab top | Pull down → Release | All data refreshes |
| **Switch tabs** | Any tab | Tap tab name | Tab content loads |

---

## 16. Backend Integration Points

### 16.1 API Endpoints & Routes

**Base URLs:**
```
User Service:       https://user.wihy.ai
Services API:       https://services.wihy.ai
Nutrition/Meals:    https://user.wihy.ai/api/users/:userId/meals
```

---

#### Nutrition Service
**Daily Nutrition Tracking**

```typescript
// Get daily nutrition summary
- GET https://user.wihy.ai/api/users/:userId/nutrition/daily-summary
  → Query Params: date (optional, defaults to today)
  → Returns: DailySummary {
      totals: { calories, protein_g, carbs_g, fat_g },
      goals: { calories, protein_g, carbs_g, fat_g },
      meals: MealItem[],
      water_ml: number,
      water_goal_ml: number
    }
  → Client Method: nutritionService.getDailySummary(userId)

// Log meal to nutrition diary
- POST https://user.wihy.ai/api/users/:userId/nutrition/log-meal
  → Body: {
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
      foodName: string,
      calories: number,
      protein_g: number,
      carbs_g: number,
      fat_g: number,
      servings: number,
      loggedAt?: ISO date
    }
  → Returns: { success: boolean, meal_id?: string, message?: string }
  → Client Method: nutritionService.logMeal(data)

// Log water intake
- POST https://user.wihy.ai/api/users/:userId/nutrition/log-water
  → Body: { amountMl: number, loggedAt?: ISO date }
  → Returns: { success: boolean, total_water_ml: number }
  → Client Method: nutritionService.logWater(data)

// Get nutrition goals
- GET https://user.wihy.ai/api/users/:userId/nutrition/goals
  → Returns: { calories, protein_g, carbs_g, fat_g, water_ml }

// Update nutrition goals
- PUT https://user.wihy.ai/api/users/:userId/nutrition/goals
  → Body: { calories?, protein_g?, carbs_g?, fat_g?, water_ml? }
  → Returns: { success: boolean, goals: NutritionGoals }
```

---

#### Meal Service
**Meal Plans & Meal Diary**

```typescript
// IMPORTANT: Meal diary endpoint is on user.wihy.ai, NOT services.wihy.ai
// Using services.wihy.ai returns 410 Gone (deprecated endpoint)

// Get meal diary (logged meals history)
- GET https://user.wihy.ai/api/users/:userId/meals/diary
  → Query Params: limit (default: 50), date?, startDate?, endDate?
  → Returns: {
      meals: LoggedMeal[],
      total: number,
      hasMore: boolean
    }
  → Status: Active endpoint (not deprecated)
  → Note: Previously at services.wihy.ai (now 410 Gone)

// Get user's meal plans
- GET https://user.wihy.ai/api/users/:userId/meal-plans
  → Query Params: status? ('active' | 'completed' | 'all')
  → Returns: MealPlan[] {
      program_id, name, is_active, duration_days,
      servings, created_at, meals_per_day
    }
  → Client Method: mealService.getUserMealPlans(userId)

// Get specific meal plan day
- GET https://user.wihy.ai/api/users/:userId/meal-plans/:programId/day/:dayNumber
  → Returns: DayPlan {
      day_number, date,
      meals: [{ meal_id, name, meal_type, calories, macros, ingredients }]
    }
  → Client Method: mealService.getMealPlanDay(programId, dayNumber)

// Get user's saved meals library
- GET https://user.wihy.ai/api/users/:userId/meals
  → Query Params: limit?, offset?, search?, source? ('user_created' | 'template' | 'scanned')
  → Returns: {
      meals: SavedMeal[],
      total: number,
      hasMore: boolean
    }
  → Client Method: mealService.getUserMeals(userId, options)

// Get meal templates
- GET https://user.wihy.ai/api/meals/templates
  → Query Params: category?, cuisine?, dietaryRestrictions?
  → Returns: MealTemplate[]
  → Client Method: mealService.getTemplates()

// Create/Save meal
- POST https://user.wihy.ai/api/users/:userId/meals
  → Body: {
      name, meal_type, ingredients[], nutrition: { calories, protein_g, carbs_g, fat_g },
      prep_time_minutes?, serving_size?, recipe_steps?
    }
  → Returns: { success: boolean, meal_id: string, meal: SavedMeal }

// Delete saved meal
- DELETE https://user.wihy.ai/api/users/:userId/meals/:mealId
  → Returns: { success: boolean, message: string }
```

---

#### Shopping Service
**Shopping Lists from Meal Plans**

```typescript
// Get user's shopping lists
- GET https://user.wihy.ai/api/users/:userId/shopping-lists
  → Query Params: include_completed? (boolean)
  → Returns: ShoppingList[] {
      list_id, name, created_at,
      items: [{ item_name, quantity, unit, checked, category }],
      total_items, checked_items,
      meal_plan_id? (if from meal plan)
    }
  → Client Method: shoppingService.getUserLists(userId)

// Create shopping list from meal plan
- POST https://user.wihy.ai/api/users/:userId/shopping-lists/from-meal-plan
  → Body: { meal_plan_id: string, days?: number[] }
  → Returns: { success: boolean, list_id: string, list: ShoppingList }

// Update shopping list item (check/uncheck)
- PATCH https://user.wihy.ai/api/users/:userId/shopping-lists/:listId/items/:itemId
  → Body: { checked: boolean }
  → Returns: { success: boolean }

// Delete shopping list
- DELETE https://user.wihy.ai/api/users/:userId/shopping-lists/:listId
  → Returns: { success: boolean }
```

---

### 16.2 Authentication & Headers

**All requests require authentication:**

```typescript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
  'X-User-ID': userId,
  'X-Client-Version': '2.0.1',
  'X-Platform': 'react-native',
  'User-Agent': 'WIHY-Mobile/2.0.1'
}

// Get auth token from AuthContext
const { accessToken, user } = useContext(AuthContext);
const userId = user?.id;
```

---

### 16.3 Data Flow & Loading Sequence

**Dashboard Load:**
```
1. User opens Consumption Dashboard
2. Load Nutrition tab (default)
3. Call nutritionService.getDailySummary(userId)
4. Parse response:
   - Extract totals (calories, macros, water)
   - Extract goals (targets)
   - Calculate percentages
   - Update UI components
5. Render circular progress, macro bars, hydration
6. Cache data (5 min expiry)
```

**Tab Switch to Meals:**
```
1. User taps "Meals" tab
2. Check if already loaded (cache)
3. If not loaded:
   - Call mealService.getUserMealPlans(userId)
   - Find active plan
   - Calculate current day
   - Call getMealPlanDay(programId, dayNumber)
   - Extract pending meals
4. Combine with already-logged meals from dailySummary
5. Render pending + logged sections
```

**Meal Logging:**
```
1. User confirms meal in modal
2. Extract: mealType, servings, calculated nutrition
3. Call nutritionService.logMeal(data)
4. On success:
   - Mark pending meal as confirmed
   - Reload dailySummary (refresh totals)
   - Update circular progress
   - Update macro bars
   - Show success alert
5. On error:
   - Show error alert
   - Don't update UI
```

---

## Document Version

**Version:** 1.0  
**Last Updated:** January 24, 2026  
**Author:** AI Assistant (Copilot)  
**Review Status:** Draft  

This document serves as the behavioral specification for the Consumption Dashboard feature. All interactions should match these behaviors for consistency and optimal user experience.
