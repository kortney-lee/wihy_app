# Create Meals - User Behavior Specification

## Overview

This document describes all user interactions with the Create Meals feature, covering meal planning, meal creation, library management, calendar scheduling, and shopping list generation.

---

## 1. Initial Screen Load & Dashboard

### When User Opens Create Meals Screen

**Scenario: First-time user with no meal plans**
- **Given** user has no saved meal plans or meals
- **When** create meals screen loads
- **Then** user sees:
  - Header with "Create Meals" title
  - Dashboard view showing:
    * "No active meal plan" message
    * Quick action cards:
      - 🎯 "Create Meal Plan" (AI-powered)
      - ➕ "Add Manual Meal"
      - 📚 "Browse Library"
    * Bottom navigation tabs:
      - Dashboard (active)
      - Create
      - Calendar
      - Library

**Scenario: Returning user with active meal plan**
- **Given** user has an active meal plan
- **When** dashboard loads
- **Then** user sees:
  - Active meal plan card showing:
    * Plan name (e.g., "7-Day Family Dinners")
    * Duration and servings
    * Current day indicator (e.g., "Day 3 of 7")
    * Today's meals preview
  - "Today's Meals" section with:
    * Breakfast card (if included)
    * Lunch card (if included)
    * Dinner card (if included)
    * Snack cards (if included)
  - Shopping list quick access button
  - Action buttons:
    * "View Full Calendar"
    * "Generate New Plan"
    * "Shopping List"

**Scenario: User has saved meals but no active plan**
- **Given** user has meals in library but no active plan
- **When** dashboard loads
- **Then** user sees:
  - Recently saved meals carousel (last 5)
  - "Create Your First Meal Plan" CTA
  - Quick meal stats:
    * Total meals saved: X
    * Favorite meals: Y
    * Most logged meal type

---

## 2. Creating AI Meal Plans

### 2.1 Starting Meal Plan Creation

**User Journey: Generate personalized meal plan with AI**

**Scenario: User selects "Create Meal Plan"**
```
Given user taps "Create Meal Plan" button
When plan creation modal opens
Then user sees 3 plan modes to choose from:
  - 🎯 Goal-Based Planning (Diet mode)
    * For weight loss, muscle gain, health goals
    * Includes macro tracking and calorie targets
  - 📅 Weekly Meal Planning (Plan mode)
    * Multi-day meal scheduling (7, 14, or 30 days)
    * Family meals, batch cooking, variety
  - ⚡ Quick Single Meal (Quick mode)
    * Generate one meal on-the-fly
    * Dinner ideas, breakfast recipes
```

---

### 2.2 Goal-Based Planning (Diet Mode)

**Scenario: User selects goal-based planning**
```
Given user taps "Goal-Based Planning"
When configuration screen appears
Then user sees Step 1: Fitness Goal Selection
  - Primary goals (single-select):
    ○ Weight Loss (calorie deficit)
    ○ Muscle Gain (calorie surplus)
    ○ Maintenance (balanced)
    ○ General Health
    ○ Energy & Performance
    ○ Gut Health
    ○ Anti-Inflammatory
  - Activity level (single-select):
    ○ Sedentary (desk job, minimal exercise)
    ○ Light (light exercise 1-3 days/week)
    ○ Moderate (moderate exercise 3-5 days/week)
    ○ Active (hard exercise 6-7 days/week)
    ○ Very Active (physical job + daily training)
    ○ Light Weight Training (specific for lifters)
```

**Scenario: User configures goal parameters**
```
Given user selected fitness goal and activity level
When user taps "Next"
Then user sees Step 2: Nutrition Targets
  - Daily calorie target (auto-calculated or manual):
    * Auto: Based on goal + activity level
    * Manual slider: 1200 - 4000 kcal
    * Shows: "Recommended: 2200 kcal"
  - Macro distribution (sliders):
    * Protein: X% (shows grams based on calories)
    * Carbs: Y%
    * Fat: Z%
    * Total must equal 100%
    * Preset buttons:
      - "Balanced" (30/40/30)
      - "High Protein" (40/30/30)
      - "Low Carb" (35/20/45)
      - "Keto" (20/5/75)
```

**Scenario: User sets dietary preferences**
```
Given user configured nutrition targets
When user taps "Next"
Then user sees Step 3: Dietary Preferences
  - Dietary restrictions (multi-select, searchable):
    * Plant-based: Vegan, Vegetarian, Pescatarian
    * Macronutrient: Keto, Low Carb, High Protein
    * Ancestral: Paleo, Carnivore
    * Regional: Mediterranean
    * Medical: Gluten-Free, Low Sodium, Diabetic Friendly, Low FODMAP
    * Therapeutic: Anti-Inflammatory, Whole30
    * Timing: Intermittent Fasting
    * Spiritual: Daniel Fast
  - Search bar to filter options
  - Selected restrictions show as chips below
  - Info icon on each shows description
```

**Scenario: User configures meal structure**
```
Given user selected dietary preferences
When user taps "Next"
Then user sees Step 4: Meal Structure
  - Duration (picker):
    * 7 days (1 week)
    * 14 days (2 weeks)
    * 30 days (1 month)
  - Meals per day (toggles):
    ☐ Breakfast
    ☐ Morning Snack
    ☐ Lunch
    ☐ Evening Snack
    ☐ Dinner
    ☐ Snack (any time)
  - Servings per meal (number input):
    * Default: 2
    * Range: 1-10
    * Label: "Family size / meal prep portions"
```

**Scenario: User sets cooking preferences**
```
Given user configured meal structure
When user taps "Next"
Then user sees Step 5: Cooking & Shopping
  - Cooking skill level:
    ○ Beginner (simple 3-4 ingredient recipes)
    ○ Intermediate (standard home cooking)
    ○ Advanced (complex techniques, gourmet)
  - Time per meal:
    ○ Quick (15-30 min)
    ○ Moderate (30-45 min)
    ○ No Preference (any duration)
  - Meal variety preference:
    ○ Balanced (good variety, some repeats)
    ○ Family Friendly (kid-approved, familiar)
    ○ Maximum Variety (different every day)
    ○ Batch Cooking (make once, eat multiple times)
    ○ High Protein (protein-focused meals)
  - Preferred stores (multi-select):
    ☐ Costco
    ☐ Trader Joe's
    ☐ Whole Foods
    ☐ Walmart
    ☐ Kroger
    ☐ Aldi
  - Budget per meal (optional slider):
    * $5 - $50 per meal
```

**Scenario: User generates goal-based plan**
```
Given user completed all configuration steps
When user taps "Generate Plan"
Then:
  - Loading screen appears with:
    * Animated spinner (WIHY logo)
    * Message: "Creating your personalized meal plan..."
    * Progress messages rotating every 3s:
      - "Calculating your nutrition targets..."
      - "Finding recipes that match your goals..."
      - "Balancing macros across the week..."
      - "Organizing your shopping list..."
  - AI generates plan (15-30 seconds)
  - Redirects to preview screen
```

**Input Validation:**
- Must select at least one fitness goal
- Must select activity level
- Calorie target must be between 1200-4000
- Macros must total 100%
- Must select at least one meal per day
- Servings must be 1-10
- Duration must be 7, 14, or 30 days

---

### 2.3 Weekly Meal Planning (Plan Mode)

**Scenario: User selects weekly meal planning**
```
Given user taps "Weekly Meal Planning"
When planning screen appears
Then user sees Step 1: Quick Goals or Custom
  - Quick goal presets (buttons):
    * 👨‍👩‍👧‍👦 Family Dinners
      Description: "Easy family dinners for 4"
      Auto-fills: family_friendly variety, 4 servings, dinner only
    * 📦 Meal Prep
      Description: "Batch cooking for the week"
      Auto-fills: batch_cooking variety, 6 servings, lunch + dinner
    * 💪 High Protein
      Description: "Protein-focused meals"
      Auto-fills: high_protein variety, 2 servings, all meals
    * ⚡ Quick & Easy
      Description: "Under 30 min recipes"
      Auto-fills: quick time constraint, beginner cooking
    * 💰 Budget Meals
      Description: "Affordable ingredients"
      Auto-fills: Walmart/Aldi stores, budget focus
    * ❤️ Healthy
      Description: "Balanced nutrition"
      Auto-fills: balanced variety, low_sodium, whole_foods
  - "Or create custom plan" link at bottom
```

**Scenario: User selects quick goal preset**
```
Given user taps one of the quick goals (e.g., "Family Dinners")
When preset is selected
Then:
  - Configuration auto-populates with preset values
  - User can still modify:
    * Duration (7, 14, 30 days)
    * Servings (if different family size)
    * Add dietary restrictions
    * Modify meal types
  - Skips directly to dietary restrictions step
  - "Generate Plan" button enabled immediately
```

**Scenario: User creates custom weekly plan**
```
Given user taps "create custom plan"
When custom configuration opens
Then user follows similar steps as goal-based:
  - Step 1: Duration selection (7/14/30 days)
  - Step 2: Meal types (breakfast/lunch/dinner/snacks)
  - Step 3: Dietary restrictions (same as goal-based)
  - Step 4: Cooking preferences (skill, time, variety)
  - Step 5: Store preferences
  - Optional: Natural language description field
    * "I want easy dinners with chicken and vegetables"
    * AI interprets and customizes plan
```

**Natural Language Input:**
```
Text area placeholder: "Describe your ideal meal plan..."
Examples shown below:
  - "Easy family dinners for 4 using Costco ingredients"
  - "High protein meal prep, no seafood, under 30 minutes"
  - "Vegan recipes for 2, maximum variety, all meals"
  - "Budget-friendly dinners, beginner cooking level"
  
User can type or tap examples to auto-fill
```

---

### 2.4 Quick Single Meal (Quick Mode)

**Scenario: User selects quick meal generation**
```
Given user taps "Quick Single Meal"
When quick meal screen appears
Then user sees simplified form:
  - Meal type (single-select):
    ○ Breakfast
    ○ Lunch
    ○ Dinner
    ○ Snack
    ○ Dessert
  - Cuisine type (dropdown):
    * Italian
    * Mexican
    * Asian
    * American
    * Mediterranean
    * Indian
    * Thai
    * Any/Surprise Me
  - Time available (single-select):
    ○ Quick (under 20 min)
    ○ Moderate (20-40 min)
    ○ Standard (40-60 min)
    ○ Slow (60+ min, weekend cooking)
  - Servings (number input): 1-10
  - Dietary restrictions (optional multi-select)
  - Optional natural language field:
    "I want something with chicken and rice"
```

**Scenario: User generates quick meal**
```
Given user filled in meal type and servings
When user taps "Generate Meal"
Then:
  - Quick loading (5-10 seconds)
  - Single meal card appears with:
    * Meal name
    * Photo (if available)
    * Prep + cook time
    * Nutrition facts (calories, protein, carbs, fat)
    * Ingredient list
    * Instructions
  - Actions:
    * "Cook This Meal" - starts meal
    * "Save to Library" - adds to saved meals
    * "Generate Another" - new suggestion
    * "Add to Calendar" - schedule for specific date
```

---

### 2.5 Plan Preview & Acceptance

**Scenario: Generated plan preview displays**
```
Given AI successfully generated meal plan
When preview screen loads
Then user sees:
  - Plan summary card:
    * Plan name (auto-generated or editable)
    * Duration: "7 days"
    * Total meals: "21 meals"
    * Avg calories/day: "2,200 kcal"
    * Avg protein/day: "150g"
    * Estimated weekly cost: "$85-$120"
  - Daily breakdown (scrollable cards):
    * Day 1, Day 2, ... Day 7
    * Each day shows:
      - Date (if start date set)
      - Meals for that day (thumbnail + name)
      - Daily nutrition totals
      - Tap to expand full details
  - Shopping list preview:
    * "45 ingredients needed"
    * "View full shopping list" link
  - Action buttons:
    * "Accept Plan" (primary, green)
    * "Regenerate" (secondary, outline)
    * "Edit Plan" (secondary, outline)
    * "Cancel" (text button)
```

**Scenario: User expands day details**
```
Given user on plan preview
When user taps a day card
Then day expands to show:
  - All meals with full details:
    * Meal photo
    * Meal name
    * Meal type (breakfast/lunch/dinner)
    * Nutrition: Calories, P/C/F macros
    * Cooking time
    * Ingredient count
  - Tap on specific meal shows:
    * Full ingredient list
    * Step-by-step instructions
    * Nutrition breakdown
  - Actions per meal:
    * "Replace This Meal" (generates alternative)
    * "Remove from Plan"
    * "Swap with Another Day"
```

**Scenario: User replaces a meal**
```
Given user tapped "Replace This Meal"
When replacement modal appears
Then user can:
  - See 3 alternative meal suggestions
  - Each shows similar:
    * Same meal type
    * Similar calories/macros
    * Same dietary restrictions
  - Tap one to swap
  - Or "Generate More Options"
```

**Scenario: User accepts plan**
```
Given user reviewed plan
When user taps "Accept Plan"
Then success modal appears showing:
  - "🎉 Meal Plan Created!"
  - Summary confirmation
  - Next steps options:
    * "View Calendar" - see scheduled meals
    * "Generate Shopping List" - create list
    * "Send to Instacart" - auto-fill cart
    * "Save for Later" - save without activating
  - Plan automatically becomes active
  - Calendar populates with scheduled meals
```

**Scenario: User regenerates plan**
```
Given user not satisfied with plan
When user taps "Regenerate"
Then:
  - Modal asks: "What would you like to change?"
  - Options:
    ☐ More variety
    ☐ Different cuisine styles
    ☐ Simpler recipes
    ☐ Higher/lower calories
    ☐ More vegetarian options
    ☐ Different proteins
  - "Generate New Plan" button
  - Keeps previous settings, applies changes
```

---

## 3. Manual Meal Creation

### 3.1 Creating Meal from Scratch

**User Journey: Manually add a meal to library**

**Scenario: User selects "Add Manual Meal"**
```
Given user taps "Add Manual Meal" or Create tab
When manual entry form appears
Then user sees form with sections:
  - Basic Information
  - Nutrition Facts
  - Ingredients
  - Tags & Preferences
  - Notes
```

**Scenario: User fills basic information**
```
Section: Basic Information
Fields:
  - Meal name (text input):
    * Placeholder: "e.g., Grilled Chicken Caesar Salad"
    * Required field
  - Meal type (single-select buttons):
    ○ Breakfast 🍳
    ○ Lunch 🥗
    ○ Dinner 🍽️
    ○ Snack 🍎
    ○ Dessert 🍰
  - Serving size (number input):
    * Default: 1
    * Range: 0.5 - 10
    * Unit: servings
  - Preparation time (number input, optional):
    * Minutes
    * Range: 0-300
  - Cooking time (number input, optional):
    * Minutes
    * Range: 0-300
```

**Scenario: User enters nutrition facts**
```
Section: Nutrition Facts (per serving)
Fields:
  - Calories (number input):
    * Required
    * Range: 0-3000
    * Unit: kcal
  - Protein (number input):
    * Required
    * Range: 0-200
    * Unit: grams
  - Carbohydrates (number input):
    * Required
    * Range: 0-300
    * Unit: grams
  - Fat (number input):
    * Required
    * Range: 0-200
    * Unit: grams
  - Fiber (number input, optional):
    * Range: 0-100
    * Unit: grams
  - Sugar (number input, optional):
    * Range: 0-150
    * Unit: grams
    
Display:
  - Shows macro percentages as user types
  - Visual breakdown (pie chart):
    * Protein: X% (4 cal/g)
    * Carbs: Y% (4 cal/g)
    * Fat: Z% (9 cal/g)
```

**Scenario: User adds ingredients**
```
Section: Ingredients
Display:
  - "Add Ingredient" button
  - List of added ingredients (empty initially)
  
When user taps "Add Ingredient":
  - New ingredient row appears with:
    * Ingredient name (text input)
      Placeholder: "e.g., Chicken breast"
    * Amount (number input)
      Placeholder: "2"
    * Unit (dropdown)
      Options: cups, tbsp, tsp, oz, lbs, g, kg, pieces, whole, to taste
    * Delete button (X icon)
  - Can add multiple ingredients
  - Drag handle to reorder
```

**Scenario: User adds tags**
```
Section: Tags & Preferences
Display:
  - Tag chips (multi-select):
    Available tags:
    ☐ Breakfast
    ☐ Lunch
    ☐ Dinner
    ☐ Snack
    ☐ High Protein
    ☐ Low Carb
    ☐ Vegan
    ☐ Gluten-Free
    ☐ Quick (< 30 min)
    ☐ Meal Prep
    ☐ Kid Friendly
    ☐ Keto
    ☐ Paleo
    ☐ Budget Friendly
  - "+ Add Custom Tag" button
  - Selected tags highlight in color
```

**Scenario: User adds notes/instructions**
```
Section: Notes & Instructions (optional)
Fields:
  - Cooking instructions (text area):
    * Placeholder: "Step-by-step cooking instructions..."
    * Multi-line input
    * Supports numbered lists
  - Personal notes (text area):
    * Placeholder: "Personal notes, modifications, tips..."
```

**Scenario: User saves meal**
```
Given user filled required fields
When user taps "Save Meal" button
Then:
  - Validation checks:
    * Meal name not empty
    * At least one nutrition value > 0
    * Meal type selected
  - If valid:
    * Shows saving spinner
    * Calls Meal Diary API
    * Success toast: "✓ Meal saved to library"
    * Clears form for next entry
    * Option to "Add Another" or "View in Library"
  - If invalid:
    * Highlights missing required fields in red
    * Shows error message at top
    * Scrolls to first error
```

**Input Validation:**
- Meal name: Required, 1-100 characters
- Calories: Required, 0-3000
- Protein, Carbs, Fat: Required, 0-300
- Serving size: 0.5-10
- Ingredients: Optional but recommended
- Tags: At least one recommended

---

### 3.2 Scanning Recipe from Package

**Scenario: User scans food label**
```
Given user taps "Scan Recipe" button
When camera permission granted
Then:
  - Camera view opens in label reader mode
  - Overlay shows:
    * "Point camera at nutrition label"
    * Bounding box guide
    * Flash toggle
    * Cancel button
  - User frames nutrition facts panel
  - Taps capture button
```

**Scenario: Label scan processes**
```
Given user captured photo of label
When OCR processing starts
Then:
  - Loading spinner appears
  - Message: "Reading nutrition facts..."
  - AI extracts:
    * Serving size
    * Calories
    * Protein, Carbs, Fat
    * Fiber, Sugar (if visible)
    * Ingredients list (if visible)
  - Returns to manual form with pre-filled data
```

**Scenario: User reviews scanned data**
```
Given OCR completed
When form reappears with data
Then:
  - All extracted fields are pre-filled
  - Yellow highlight on auto-filled fields
  - Message at top: "Review and confirm scanned data"
  - User can:
    * Edit any field
    * Add missing information
    * Add meal name (not from label)
    * Save meal
```

---

### 3.3 Using Meal Templates

**Scenario: User accesses templates**
```
Given user taps "Browse Templates" button
When template library opens
Then user sees:
  - Categories (tabs):
    * Popular
    * Breakfast
    * Lunch
    * Dinner
    * Snacks
    * Healthy
    * Quick Meals
  - Template grid/list showing:
    * Template thumbnail
    * Name
    * Meal type icon
    * Nutrition summary (calories, protein)
    * Preparation time
    * Tags
  - Search bar at top
```

**Scenario: User selects template**
```
Given user taps a template
When template detail opens
Then user sees:
  - Full template information:
    * Large photo
    * Complete nutrition facts
    * Ingredient list
    * Cooking instructions
    * Tags
  - Actions:
    * "Use This Template" (primary)
    * "Save to Library" (secondary)
    * "Customize" (secondary)
```

**Scenario: User uses template**
```
Given user tapped "Use This Template"
When action processes
Then:
  - Template data copies to manual form
  - User can modify any fields
  - Can adjust serving size (scales nutrition)
  - Saves as new meal in user's library
```

---

## 4. Meal Library Management

### 4.1 Browsing Saved Meals

**Scenario: User accesses library tab**
```
Given user taps "Library" tab
When library screen loads
Then user sees:
  - Search bar at top
  - Filter pills below search:
    * All Meals (active)
    * Breakfast
    * Lunch
    * Dinner
    * Snacks
    * Favorites ⭐
    * Recent
    * High Protein
    * Low Carb
  - Grid/list of saved meals showing:
    * Meal photo or icon
    * Meal name
    * Meal type badge
    * Nutrition summary (cal, protein)
    * Favorite star (tap to toggle)
    * Times logged count
    * Tags
  - Sort options (dropdown):
    * Recently Added (default)
    * Name A-Z
    * Most Logged
    * Highest Protein
    * Lowest Calories
```

**Scenario: User searches library**
```
Given user taps search bar
When keyboard appears
Then:
  - User types search query
  - Results filter in real-time
  - Searches in:
    * Meal names
    * Ingredients
    * Tags
  - Shows match count: "12 meals found"
  - Clear button (X) to reset search
```

**Scenario: User filters by tag**
```
Given user on library view
When user taps a filter pill (e.g., "High Protein")
Then:
  - Filter pill highlights
  - List filters to show only matching meals
  - Can combine multiple filters (AND logic)
  - Active filters show with X to remove
  - "Clear All Filters" button appears
```

---

### 4.2 Viewing Meal Details

**Scenario: User taps on saved meal**
```
Given user taps meal card in library
When meal detail modal opens
Then user sees full-screen modal with:
  - Header:
    * Meal name (large)
    * Close button (X)
    * Actions menu (⋮):
      - Edit Meal
      - Delete Meal
      - Share Meal
      - Duplicate Meal
  - Hero image (if available)
  - Quick stats bar:
    * Total calories
    * Protein (g)
    * Carbs (g)
    * Fat (g)
  - Tabs:
    * Ingredients (default)
    * Instructions
    * Nutrition
  - Bottom actions:
    * "Log This Meal" (adds to today)
    * "Add to Calendar" (schedule)
    * Favorite star toggle
```

**Scenario: User views ingredients tab**
```
Given user on ingredients tab
When tab displays
Then user sees:
  - Serving size adjuster:
    * Current: X servings
    * - / + buttons to adjust (0.5 - 10)
    * Nutrition scales proportionally
  - Ingredient list (checkable):
    ☐ 2 cups rice
    ☐ 1 lb chicken breast
    ☐ 1 tbsp olive oil
    ☐ Salt and pepper to taste
  - Checkboxes for shopping/cooking
  - "Copy All" button (copies to clipboard)
  - "Add to Shopping List" button
```

**Scenario: User views instructions tab**
```
Given user taps "Instructions" tab
When tab switches
Then user sees:
  - Step-by-step cooking instructions (numbered):
    1. Preheat oven to 350°F
    2. Season chicken with salt and pepper
    3. Bake for 25-30 minutes
    4. Serve over rice
  - If no instructions: Message "No instructions available"
  - Timer button next to time-based steps
  - "Start Cooking Mode" button:
    * Enables voice reading of steps
    * Large text mode
    * Next/previous navigation
```

**Scenario: User views nutrition tab**
```
Given user taps "Nutrition" tab
When tab switches
Then user sees detailed breakdown:
  - Macro pie chart visualization
  - Detailed nutrition table:
    * Calories: XXX kcal
    * Total Fat: XX g (Y% DV)
      - Saturated: X g
      - Trans: X g
    * Cholesterol: XX mg
    * Sodium: XX mg
    * Total Carbohydrates: XX g (Y% DV)
      - Dietary Fiber: X g
      - Sugars: X g
    * Protein: XX g
    * Vitamins & Minerals (if available)
  - Per serving basis
  - Adjusts with serving size slider
```

---

### 4.3 Editing & Deleting Meals

**Scenario: User edits saved meal**
```
Given user taps "Edit Meal" from menu
When edit form opens
Then:
  - Same form as manual creation
  - All fields pre-filled with current data
  - Can modify any field
  - "Save Changes" button (replaces "Save Meal")
  - "Cancel" button (discards changes)
```

**Scenario: User saves edited meal**
```
Given user modified meal fields
When user taps "Save Changes"
Then:
  - Validation runs
  - If valid:
    * Update confirmation modal:
      "Save changes to [Meal Name]?"
      - "Save" (primary)
      - "Cancel" (secondary)
    * If confirmed:
      - Calls Meal Diary API update
      - Success toast: "✓ Meal updated"
      - Returns to library
      - Updated meal reflects changes
```

**Scenario: User deletes meal**
```
Given user taps "Delete Meal" from menu
When delete action triggered
Then confirmation alert appears:
  - Title: "Delete Meal"
  - Message: "Are you sure you want to delete '[Meal Name]'?"
  - Actions:
    * "Cancel" (default, dismisses)
    * "Delete" (destructive, red text)
```

**Scenario: User confirms deletion**
```
Given user taps "Delete"
When deletion processes
Then:
  - Calls Meal Diary API delete
  - Removes from library list
  - Closes detail modal
  - Success toast: "Meal deleted"
  - If meal was in active plan:
    * Warning: "This meal is in your active plan"
    * Option to remove from plan or keep placeholder
```

---

### 4.4 Logging Meals to Diary

**Scenario: User logs meal from library**
```
Given user viewing meal details
When user taps "Log This Meal"
Then quick log modal appears:
  - Date picker:
    * Default: Today
    * Can select past or future dates
  - Meal time:
    ○ Breakfast
    ○ Lunch  
    ○ Dinner
    ○ Snack
    * Auto-selects based on current time
  - Servings consumed:
    * Number input (0.5 - 10)
    * Default: 1 serving
  - Notes (optional):
    * "Any modifications or notes?"
  - "Log Meal" button
```

**Scenario: User confirms meal log**
```
Given user taps "Log Meal"
When logging processes
Then:
  - Calls Meal Diary API to log entry
  - Success feedback:
    * Toast: "✓ Logged to [Date]"
    * Updates "Times Logged" counter
    * Returns to previous screen
  - Meal appears in:
    * Meal diary for selected date
    * Recent meals list
    * Today's meals (if today)
```

---

## 5. Calendar & Scheduling

### 5.1 Calendar View

**Scenario: User accesses calendar tab**
```
Given user taps "Calendar" tab
When calendar view loads
Then user sees:
  - Month view calendar grid
  - Each day cell shows:
    * Date number
    * Meal indicator dots (colored by type):
      - 🟡 Breakfast
      - 🟢 Lunch
      - 🔵 Dinner
      - 🟣 Snack
    * Number of meals: "3 meals"
    * Today highlighted with border
  - Navigation:
    * < > arrows for prev/next month
    * "Today" button to jump to current date
  - Current month/year header
```

**Scenario: User taps on calendar date**
```
Given user taps a specific date
When day detail modal opens
Then user sees:
  - Selected date header (e.g., "Monday, January 27, 2026")
  - List of meals scheduled for that day:
    * Breakfast: [Meal Name]
      - Calories, P/C/F
      - Cooking time
      - Checkmark if completed
    * Lunch: [Meal Name]
    * Dinner: [Meal Name]
  - Daily nutrition totals:
    * Total: 2,200 cal
    * Protein: 150g
    * Carbs: 220g
    * Fat: 75g
  - Actions:
    * "+ Add Meal to This Day"
    * "View Shopping List for Week"
  - Each meal has:
    * Tap to view details
    * Swipe actions:
      - ✓ Mark as Complete
      - 🔄 Replace Meal
      - 🗑️ Remove from Calendar
```

**Scenario: User adds meal to calendar**
```
Given user tapped "+ Add Meal to This Day"
When meal selection appears
Then user can:
  - Browse from saved meals library
  - Search meals
  - Or tap "Create New Meal"
  - Select meal type (breakfast/lunch/dinner)
  - Select which meal to add
```

**Scenario: User confirms calendar addition**
```
Given user selected meal and type
When user confirms
Then:
  - Meal adds to selected date
  - Calendar updates with new meal dot
  - Day's nutrition totals recalculate
  - Success toast: "Meal added to calendar"
```

---

### 5.2 Active Meal Plan on Calendar

**Scenario: Calendar with active plan**
```
Given user has active meal plan
When viewing calendar
Then:
  - Plan start and end dates highlighted
  - Each plan day auto-populated with meals
  - Plan indicator banner at top:
    * "[Plan Name]"
    * "Day X of Y"
    * Progress bar
  - Days within plan show:
    * All scheduled meals from plan
    * Different styling (plan meals vs manual)
  - Can still add manual meals to plan days
```

**Scenario: User navigates plan days**
```
Given user on calendar with plan
When user taps different plan days
Then:
  - Shows that day's plan meals
  - Indicates if completed or upcoming
  - Can mark meals as complete
  - Progress updates: "3 of 7 days completed"
```

---

### 5.3 Meal Plan Completion Tracking

**Scenario: User completes a meal**
```
Given user cooked/ate a scheduled meal
When user marks meal as complete
Then:
  - Meal gets checkmark ✓
  - Completion timestamp recorded
  - If all meals for day complete:
    * Day gets completion badge
    * Celebration animation
    * Streak tracking updates
  - Progress updates in plan summary
```

**Scenario: User views plan progress**
```
Given user has active plan
When viewing plan from dashboard
Then user sees:
  - Overall completion: "60% complete (12/21 meals)"
  - Days completed: "4 of 7 days"
  - Current streak: "3 days in a row"
  - Next upcoming meal
  - Progress chart (bar chart by day)
```

---

## 6. Shopping List Generation

### 6.1 Generating Shopping List

**Scenario: User generates shopping list from plan**
```
Given user has accepted meal plan
When user taps "Generate Shopping List"
Then:
  - Loading modal appears
  - Message: "Organizing your shopping list..."
  - AI extracts all ingredients from plan
  - Categorizes by grocery section
  - Merges duplicate ingredients
  - Calculates total quantities
```

**Scenario: Shopping list displays**
```
Given shopping list generated
When list appears
Then user sees categorized sections:
  - 🥩 Proteins (5 items)
    ☐ 2.5 lbs chicken breast
    ☐ 1 lb ground beef
    ☐ 12 eggs
  - 🥬 Produce (8 items)
    ☐ 3 heads broccoli
    ☐ 2 lbs carrots
    ☐ 4 bell peppers
  - 🥛 Dairy (3 items)
  - 🌾 Grains (4 items)
  - 🧂 Pantry (6 items)
  - 🛒 Other (2 items)
  
Each section expandable/collapsible
Total items count at top: "28 items"
```

**Scenario: User interacts with shopping list**
```
Given shopping list displayed
When user uses list
Then user can:
  - Check off items as purchased
    * Checkbox toggles
    * Checked items gray out
    * Strikethrough text
    * Move to bottom of category
  - Manually add items:
    * "+ Add Item" button per category
    * Text input appears
    * Saves to list
  - Edit quantities:
    * Tap on quantity to edit
    * Number + unit picker
  - Delete items:
    * Swipe left to delete
    * Confirmation: "Remove from list?"
  - Share list:
    * Export as text
    * Send via SMS, email, messaging
```

---

### 6.2 Instacart Integration

**Scenario: User sends to Instacart**
```
Given shopping list generated
When user taps "Send to Instacart"
Then:
  - Store selection modal if multiple stores
  - Options:
    * Costco
    * Whole Foods
    * Walmart
    * Other participating stores
  - User selects preferred store
```

**Scenario: Instacart cart creation**
```
Given user selected store
When Instacart integration processes
Then:
  - Loading: "Creating Instacart cart..."
  - Backend calls Instacart API
  - Attempts to match ingredients to products
  - Generates cart URL
  - Success modal appears:
    * "🛒 Instacart cart ready!"
    * Item match summary: "24 of 28 items found"
    * Estimated total: "$85-$95"
    * Actions:
      - "Open Instacart" (primary)
      - "View Unmatched Items" (link)
      - "Save Cart Link" (link)
```

**Scenario: User opens Instacart**
```
Given Instacart cart created
When user taps "Open Instacart"
Then:
  - Opens Instacart app (if installed)
  - Or: Opens Instacart website
  - Cart pre-filled with matched items
  - User can:
    * Review items
    * Adjust quantities
    * Search for unmatched items
    * Complete checkout in Instacart
```

**Error Handling:**
- If Instacart unavailable in area: "Instacart not available in your location"
- If store doesn't support Instacart: "This store doesn't support Instacart. Try another store."
- If matching fails: "Shopping list saved locally. Manual Instacart shopping needed."

---

### 6.3 Shopping List Persistence

**Scenario: Shopping list saves automatically**
```
Given shopping list generated
When user makes any changes (check items, add, edit)
Then:
  - Changes auto-save to local storage
  - Syncs to backend API (if available)
  - Persists across app sessions
  - Shows sync status indicator
```

**Scenario: User accesses saved shopping list**
```
Given user previously generated list
When user returns to shopping list tab
Then:
  - Loads saved list state
  - Shows checked items
  - Preserves custom additions
  - Shows timestamp: "Last updated: 2 hours ago"
  - Option to "Clear Completed Items"
```

---

## 7. Progressive Enhancement (Store Integration)

### 7.1 Basic Mode (No Location)

**Scenario: User creates plan without store preference**
```
Given user didn't provide postal code or store
When meal plan generates
Then:
  - Basic mode activated
  - Ingredients show:
    * Generic descriptions (e.g., "chicken breast")
    * No specific brands
    * No pricing
    * No store locations
  - Shopping list has simple ingredients
  - No Instacart integration
  - Banner: "Add your location for store-specific pricing & Instacart"
```

---

### 7.2 Zipcode Mode (Location Provided)

**Scenario: User adds postal code**
```
Given user entering meal plan preferences
When postal code field appears (optional)
Then:
  - Input: "Enter your zipcode (optional)"
  - Format: 5-digit US zip
  - Validation: Must be valid zip
  - Info tooltip: "Get store-specific suggestions"
```

**Scenario: Plan generates with zipcode**
```
Given user provided valid postal code
When meal plan generates
Then:
  - Zipcode mode activated
  - Shows available stores in area:
    * List of nearby stores (within 10 mi)
    * Each shows:
      - Store name
      - Distance (e.g., "2.5 mi away")
      - Supports Instacart: Yes/No
  - Ingredients still generic
  - No pricing yet
  - Message: "Select a store for specific brands and pricing"
```

**Scenario: User selects store from available list**
```
Given zipcode mode active
When user taps a store from list
Then:
  - Upgrades to Full Mode
  - Regenerates plan with store-specific data
```

---

### 7.3 Full Mode (Store Selected)

**Scenario: User selects preferred store**
```
Given user on meal plan creation
When store preference dropdown appears
Then user can select:
  - Preferred store from list:
    * Costco
    * Trader Joe's
    * Whole Foods
    * Walmart
    * Kroger
    * Aldi
  - Store logos displayed
  - Multi-select allowed
```

**Scenario: Plan generates with store preference**
```
Given user selected Costco as preferred store
When meal plan generates in Full Mode
Then ingredients show:
  - Store-specific brands:
    * "Kirkland Signature Chicken Breast"
    * "Organic Valley Milk"
  - Actual prices from store:
    * "$4.99/lb"
    * "$3.49/gallon"
  - Aisle locations:
    * "Aisle 12 - Refrigerated"
  - Product availability indicators
  - Total estimated cost:
    * Per meal
    * Per day
    * Weekly total: "$85-$95"
  - Instacart integration fully enabled
```

**Scenario: Store not available warning**
```
Given user selected store not in their area
When plan attempts to generate
Then:
  - Warning appears:
    * "Costco not available in your area"
    * "Available stores: Walmart (3.2 mi), Kroger (4.5 mi)"
  - Options:
    * Select different store
    * Continue without store preference
```

---

## 8. Food Preferences & Personalization

### 8.1 Food Exclusions

**Scenario: User sets food exclusions**
```
Given user in plan preferences
When "Food Exclusions" section expands
Then user can:
  - Add foods they NEVER want:
    * Search/browse common exclusions:
      - Dairy (milk, cheese, yogurt)
      - Proteins (beef, pork, seafood, eggs)
      - Vegetables (mushrooms, onions, peppers)
      - Textures (slimy, crunchy, mushy)
    * Type custom exclusions
    * Multi-select allowed
  - Selected exclusions show as removable chips
  - Info: "We'll never include these in your meals"
```

**Scenario: Plan respects exclusions**
```
Given user excluded mushrooms and seafood
When meal plan generates
Then:
  - No meals contain mushrooms
  - No meals contain fish, shrimp, or seafood
  - Alternative proteins used
  - Substitution note if recipe normally includes excluded item:
    * "Replaced shrimp with chicken in this recipe"
```

---

### 8.2 Favorite Foods

**Scenario: User adds favorite foods**
```
Given user in plan preferences
When "Favorite Foods" section expands
Then user can:
  - Add foods they LOVE:
    * Search common foods
    * Categories: Proteins, Vegetables, Grains, Snacks
    * Type custom favorites
  - Selected favorites show as chips
  - Info: "We'll include these more often"
```

**Scenario: Plan emphasizes favorites**
```
Given user favorites include chicken and broccoli
When meal plan generates
Then:
  - Increased frequency of chicken-based meals
  - Broccoli appears as side in multiple meals
  - Note: "Based on your favorites, we included..."
```

---

### 8.3 Ingredient Substitutions

**Scenario: User sets automatic substitutions**
```
Given user in preferences
When "Ingredient Substitutions" section expands
Then user sees:
  - Common substitution pairs:
    * Butter → Olive Oil
    * Dairy Milk → Almond Milk
    * White Rice → Cauliflower Rice
    * Ground Beef → Ground Turkey
  - "+ Add Custom Substitution" button
  - Format: "When recipe calls for [X], use [Y] instead"
```

**Scenario: User adds custom substitution**
```
Given user taps "+ Add Custom Substitution"
When modal opens
Then user fills:
  - Original ingredient (text input):
    * "sour cream"
  - Substitute with (text input):
    * "Greek yogurt"
  - Apply to (dropdown):
    ○ All meals (default)
    ○ Specific meal types only
  - "Save Substitution" button
```

**Scenario: Plan applies substitutions**
```
Given user set "sour cream → Greek yogurt"
When meal plan generates
Then:
  - Recipes automatically use Greek yogurt
  - Nutrition recalculates for substitution
  - Note on recipe: "✏️ Modified: Greek yogurt instead of sour cream"
  - User can override per meal
```

---

## 9. Error States & Validation

### 9.1 Form Validation

**Missing Required Fields:**
```
When user tries to generate plan without required data:
  - Highlight missing fields in red
  - Error messages below fields:
    * "Please select a fitness goal"
    * "Duration is required"
    * "Select at least one meal per day"
  - Disable "Generate" button until valid
  - Scroll to first error field
```

**Invalid Data Ranges:**
```
When user enters out-of-range values:
  - Calories < 1200: "Minimum 1200 calories recommended"
  - Calories > 4000: "Maximum 4000 calories"
  - Macros don't total 100%: "Macros must equal 100%"
  - Servings < 1: "Must be at least 1 serving"
  - Duration not 7/14/30: "Choose 7, 14, or 30 days"
```

---

### 9.2 Network Errors

**Plan Generation Failure:**
```
When API call fails during generation:
  - Error modal appears:
    * "Oops! We couldn't generate your meal plan"
    * Reason: "Network connection lost"
    * Actions:
      - "Try Again" (retry API)
      - "Save Preferences" (keep settings for later)
      - "Cancel" (return to dashboard)
```

**Shopping List API Failure:**
```
When shopping list generation fails:
  - Fallback to local extraction
  - Warning banner:
    * "⚠️ Using basic shopping list. Full features unavailable."
  - Still functional but missing:
    * Store-specific brands
    * Pricing
    * Instacart integration
```

---

### 9.3 Data Conflicts

**Conflicting Dietary Restrictions:**
```
When user selects incompatible restrictions:
  - Warning appears:
    * "Vegan and Carnivore are conflicting diets"
    * "Please choose one or the other"
  - Highlights conflicting selections
  - Blocks generation until resolved
```

**Meal Already Exists:**
```
When saving meal with duplicate name:
  - Confirmation modal:
    * "A meal named '[Name]' already exists"
    * Actions:
      - "Overwrite Existing"
      - "Save as New (append timestamp)"
      - "Rename This Meal"
      - "Cancel"
```

---

## 10. Notifications & Reminders

### 10.1 Meal Reminders

**Meal Prep Reminder:**
```
Time: Day before scheduled meal
Content:
  "🥘 Tomorrow's dinner: Grilled Chicken Caesar"
  "Tap to view ingredients & prep tips"
  
Actions:
  - Tap → Opens meal details
  - Swipe → "Add to Shopping List"
```

**Upcoming Meal Notification:**
```
Time: 2 hours before meal time
Content:
  "💪 Lunch in 2 hours: High Protein Bowl"
  "Prep time: 15 minutes"
  
Actions:
  - "View Recipe"
  - "Already Ate"
  - "Skip Today"
```

---

### 10.2 Progress Notifications

**Plan Milestone:**
```
When user completes day 7 of 7:
  "🎉 Week complete! You cooked 21 healthy meals!"
  "View your meal plan report →"
```

**Streak Achievement:**
```
When user logs meals 7 days in a row:
  "🔥 7-Day Streak! Keep the healthy eating going!"
```

---

## 11. Accessibility & Preferences

### 11.1 Display Settings

**Dietary Units:**
```
Settings > Meals > Units
○ Imperial (lbs, oz, cups, tbsp)
○ Metric (kg, g, ml, l)

Changes all measurements throughout app
```

**Serving Size Display:**
```
Settings > Meals > Default Servings
- Slider: 1 - 6 servings
- Default for new meals
```

---

### 11.2 Meal Preferences Storage

**Save User Preferences:**
```
Settings > Meals > My Preferences
- Dietary restrictions (persist)
- Favorite foods (persist)
- Cooking skill level
- Preferred stores
- Time constraints
- "Apply to All New Plans" toggle
```

---

## 12. Backend Integration Points

### 12.1 API Endpoints & Routes

**Base URLs:**
```
User Service:     https://user.wihy.ai
Services API:     https://services.wihy.ai
Meal Planning:    https://user.wihy.ai/api/users/:userId/meal-plans
AI Generation:    https://services.wihy.ai/api/meals/generate
```

---

#### Meal Plan Service
**AI-Powered Meal Planning**

```typescript
// Generate AI meal plan (3 modes: Family, Solo, Quick)
- POST https://services.wihy.ai/api/meals/generate-plan
  → Body: {
      userId: string,
      mode: 'family' | 'solo' | 'quick_meal',
      duration_days?: number,    // Family/Solo: 3-14 days
      servings?: number,          // Family/Solo: 1-6 servings
      meals_per_day?: number,     // 1-4 meals
      dietary_restrictions?: string[],
      cuisine_preferences?: string[],
      budget?: 'low' | 'medium' | 'high',
      cooking_skill?: 'beginner' | 'intermediate' | 'advanced',
      prep_time_max?: number,     // minutes
      avoid_ingredients?: string[]
    }
  → Returns: {
      plan_id: string,
      name: string,
      duration_days: number,
      servings: number,
      meals: DayMeal[][],  // Array of days, each with meals
      nutrition_summary: NutritionTotals,
      estimated_cost?: number
    }
  → Client Method: mealPlanService.generatePlan(request)

// Quick meal generation (single meal)
- POST https://services.wihy.ai/api/meals/generate-quick
  → Body: {
      userId: string,
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack',
      servings: number,
      dietary_restrictions?: string[],
      max_prep_time?: number
    }
  → Returns: SavedMeal
  → Client Method: mealPlanService.generateQuickMeal(request)

// Save generated meal plan
- POST https://user.wihy.ai/api/users/:userId/meal-plans
  → Body: {
      name: string,
      duration_days: number,
      servings: number,
      meals: DayMeal[][],
      is_active: boolean,
      preferences?: object
    }
  → Returns: { success: boolean, plan_id: string, plan: MealPlan }
  → Client Method: mealPlanService.savePlan(userId, plan)

// Get user's meal plans
- GET https://user.wihy.ai/api/users/:userId/meal-plans
  → Query Params: status? ('active' | 'completed'), limit?, offset?
  → Returns: {
      plans: MealPlan[],
      total: number,
      hasMore: boolean
    }
  → Client Method: mealPlanService.getUserPlans(userId)

// Get specific meal plan
- GET https://user.wihy.ai/api/users/:userId/meal-plans/:planId
  → Returns: MealPlan (full details with all days/meals)

// Update meal plan (activate/deactivate)
- PATCH https://user.wihy.ai/api/users/:userId/meal-plans/:planId
  → Body: { is_active?: boolean, name?: string }
  → Returns: { success: boolean, plan: MealPlan }

// Delete meal plan
- DELETE https://user.wihy.ai/api/users/:userId/meal-plans/:planId
  → Returns: { success: boolean, message: string }

// Replace meal in plan
- PUT https://user.wihy.ai/api/users/:userId/meal-plans/:planId/days/:dayNum/meals/:mealIndex
  → Body: { meal: SavedMeal }
  → Returns: { success: boolean, updated_plan: MealPlan }
```

---

#### Saved Meals Library
**User's Personal Meal Collection**

```typescript
// IMPORTANT: Meal endpoints are on user.wihy.ai, NOT services.wihy.ai
// Using services.wihy.ai/api/users/:userId/meals returns 410 Gone

// Get user's saved meals
- GET https://user.wihy.ai/api/users/:userId/meals
  → Query Params: 
      limit?, offset?, search?, 
      source? ('user_created' | 'template' | 'scanned'),
      meal_type? ('breakfast' | 'lunch' | 'dinner' | 'snack')
  → Returns: {
      meals: SavedMeal[],
      total: number,
      hasMore: boolean
    }
  → Client Method: mealService.getUserMeals(userId, options)

// Create/Save meal manually
- POST https://user.wihy.ai/api/users/:userId/meals
  → Body: {
      name: string,
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack',
      servings: number,
      prep_time_minutes?: number,
      ingredients: [{
        name: string,
        quantity: number,
        unit: string,
        category?: string
      }],
      nutrition: {
        calories: number,
        protein_g: number,
        carbs_g: number,
        fat_g: number,
        fiber_g?: number,
        sugar_g?: number
      },
      recipe_steps?: string[],
      tags?: string[],
      source: 'user_created'
    }
  → Returns: { success: boolean, meal_id: string, meal: SavedMeal }
  → Client Method: mealService.createMeal(userId, mealData)

// Update saved meal
- PUT https://user.wihy.ai/api/users/:userId/meals/:mealId
  → Body: Same as create (partial updates allowed)
  → Returns: { success: boolean, meal: SavedMeal }

// Delete saved meal
- DELETE https://user.wihy.ai/api/users/:userId/meals/:mealId
  → Returns: { success: boolean, message: string }

// Get meal templates
- GET https://user.wihy.ai/api/meals/templates
  → Query Params: category?, cuisine?, meal_type?, dietary_restrictions?
  → Returns: MealTemplate[]
  → Client Method: mealService.getTemplates(filters)

// Copy template to user's meals
- POST https://user.wihy.ai/api/users/:userId/meals/from-template
  → Body: { template_id: string }
  → Returns: { success: boolean, meal_id: string, meal: SavedMeal }
```

---

#### Meal Diary (Nutrition Logging)
**Logging Meals to Daily Diary**

```typescript
// CRITICAL: Diary endpoint is user.wihy.ai, not services.wihy.ai
// services.wihy.ai/api/users/:userId/meals/diary → 410 Gone (deprecated)

// Get meal diary (logged meals)
- GET https://user.wihy.ai/api/users/:userId/meals/diary
  → Query Params: 
      limit? (default: 50),
      date? (YYYY-MM-DD for specific day),
      startDate?, endDate? (date range)
  → Returns: {
      meals: LoggedMeal[] [{
        log_id, meal_id, name, meal_type,
        calories, protein_g, carbs_g, fat_g,
        servings, logged_at, created_at
      }],
      total: number,
      hasMore: boolean
    }
  → Status: Active (not deprecated)
  → Client Method: mealService.getMealDiary(userId, options)

// Log meal to diary
- POST https://user.wihy.ai/api/users/:userId/meals/diary
  → Body: {
      meal_id?: string,      // If from saved meals
      name: string,
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack',
      calories: number,
      protein_g: number,
      carbs_g: number,
      fat_g: number,
      servings: number,
      logged_at?: ISO date   // Defaults to now
    }
  → Returns: { success: boolean, log_id: string }
  → Client Method: mealService.logMeal(userId, mealData)

// Update diary entry
- PUT https://user.wihy.ai/api/users/:userId/meals/diary/:logId
  → Body: { servings?, logged_at? }
  → Returns: { success: boolean, log: LoggedMeal }

// Delete diary entry
- DELETE https://user.wihy.ai/api/users/:userId/meals/diary/:logId
  → Returns: { success: boolean, message: string }
```

---

#### Shopping List Service
**Generate & Manage Shopping Lists**

```typescript
// Generate shopping list from meal plan
- POST https://user.wihy.ai/api/users/:userId/shopping-lists/from-meal-plan
  → Body: {
      meal_plan_id: string,
      days?: number[],        // Specific days, or all if omitted
      exclude_ingredients?: string[],
      group_by_category?: boolean  // Default: true
    }
  → Returns: {
      success: boolean,
      list_id: string,
      list: ShoppingList {
        name, created_at,
        items: [{
          item_name, quantity, unit, category,
          meal_ids: string[],  // Which meals need this
          checked: false
        }],
        total_items, checked_items: 0,
        meal_plan_id
      }
    }
  → Client Method: shoppingService.createFromMealPlan(userId, planId, options)

// Get user's shopping lists
- GET https://user.wihy.ai/api/users/:userId/shopping-lists
  → Query Params: include_completed? (boolean)
  → Returns: ShoppingList[]
  → Client Method: shoppingService.getUserLists(userId)

// Update shopping list
- PUT https://user.wihy.ai/api/users/:userId/shopping-lists/:listId
  → Body: { name?, items?: ShoppingListItem[] }
  → Returns: { success: boolean, list: ShoppingList }

// Update item (check/uncheck)
- PATCH https://user.wihy.ai/api/users/:userId/shopping-lists/:listId/items/:itemId
  → Body: { checked: boolean }
  → Returns: { success: boolean, checked_items: number }

// Delete shopping list
- DELETE https://user.wihy.ai/api/users/:userId/shopping-lists/:listId
  → Returns: { success: boolean }

// Share to Instacart (integration)
- POST https://user.wihy.ai/api/users/:userId/shopping-lists/:listId/share-instacart
  → Body: { store_id?: string, delivery_date?: string }
  → Returns: {
      success: boolean,
      instacart_url: string,  // Deep link to Instacart app
      cart_id?: string
    }
  → Client Method: instacartService.shareList(userId, listId, options)
```

---

#### User Preferences
**Dietary Restrictions & Settings**

```typescript
// Get meal preferences
- GET https://user.wihy.ai/api/users/:userId/preferences/meals
  → Returns: {
      dietary_restrictions: string[],
      avoid_ingredients: string[],
      favorite_cuisines: string[],
      cooking_skill: 'beginner' | 'intermediate' | 'advanced',
      max_prep_time: number,
      budget_preference: 'low' | 'medium' | 'high',
      default_servings: number,
      preferred_stores: string[]
    }

// Update meal preferences
- PUT https://user.wihy.ai/api/users/:userId/preferences/meals
  → Body: Any subset of preferences object
  → Returns: { success: boolean, preferences: MealPreferences }
  → Client Method: userService.updateMealPreferences(userId, prefs)
```

---

### 12.2 Authentication & Headers

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

// Get from AuthContext
const { accessToken, user } = useContext(AuthContext);
const userId = user?.id;
```

---

### 12.3 Data Flow & Sync

**Meal Plan Generation Flow:**
```typescript
1. User fills out plan creation form
2. Client validates inputs (servings 1-6, days 3-14, etc.)
3. POST /api/meals/generate-plan with preferences
4. AI generates meal plan (15-30 seconds)
5. Shows loading screen with progress messages
6. Returns generated plan with meals array
7. User previews plan in modal
8. User accepts → POST /api/users/:userId/meal-plans
9. Plan saved as active
10. Calendar updated
11. Dashboard refreshes with active plan
```

**Shopping List Generation Flow:**
```typescript
1. User has active meal plan
2. Taps "Generate Shopping List"
3. POST /api/users/:userId/shopping-lists/from-meal-plan
4. Server extracts all ingredients from plan's meals
5. Groups by category (produce, meat, dairy, etc.)
6. Combines duplicates (e.g., 3 eggs + 2 eggs = 5 eggs)
7. Returns organized list
8. Client displays categorized list
9. User can check items as shopped
10. Optional: Share to Instacart
```

**Meal Logging Flow:**
```typescript
1. User selects meal from library
2. Taps "Log to Diary"
3. Adjusts servings if needed
4. Selects date/time (defaults to now)
5. POST /api/users/:userId/meals/diary
6. Meal logged to nutrition tracking
7. Appears in Consumption Dashboard
8. Updates daily nutrition totals
9. Contributes to calorie/macro goals
```

**Offline Support:**
```typescript
- Meal plans cached locally (AsyncStorage)
- Saved meals cached (24-hour TTL)
- Shopping lists cached with local edits
- Writes queued when offline (syncEngine)
- Auto-sync when connection restored
- Optimistic UI updates
- Conflict resolution on sync
```

---

## 13. Summary of Key User Flows

### Quick Reference Chart

| User Goal | Starting Point | Key Steps | End State |
|-----------|----------------|-----------|-----------|
| **Create AI meal plan** | Dashboard | Tap "Create Plan" → Select mode → Configure → Generate → Accept | Active plan, calendar populated |
| **Quick single meal** | Create tab | Select "Quick Meal" → Meal type → Generate → Save | Meal saved to library |
| **Manual meal entry** | Create tab | Fill form → Add nutrition → Add ingredients → Save | Meal in library |
| **View calendar** | Calendar tab | Browse dates → Tap day → View meals | Day's meals displayed |
| **Generate shopping list** | Accepted plan | Tap "Shopping List" → Review items → Check off | List ready for shopping |
| **Send to Instacart** | Shopping list | Tap "Instacart" → Select store → Confirm | Instacart cart created |
| **Edit saved meal** | Library | Tap meal → Menu → Edit → Modify → Save | Meal updated |
| **Delete meal** | Library | Tap meal → Menu → Delete → Confirm | Meal removed |
| **Log meal to diary** | Library | Tap meal → "Log Meal" → Select date/time → Confirm | Meal logged to diary |
| **Browse templates** | Templates | Browse categories → Select → Use | Template copied to form |
| **Replace plan meal** | Plan preview | Tap meal → "Replace" → Select alternative | New meal swapped in |
| **Track plan progress** | Dashboard | View active plan → See completion % | Progress displayed |

---

## Document Version

**Version:** 1.0  
**Last Updated:** January 24, 2026  
**Author:** AI Assistant (Copilot)  
**Review Status:** Draft  

This document serves as the behavioral specification for the Create Meals feature. All interactions should match these behaviors for consistency and optimal user experience.
