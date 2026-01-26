# Profile Setup - User Behavior Specification

## Overview

This document describes all user interactions with the Profile Setup feature, a multi-step wizard that collects user information to personalize their health journey. The feature supports both onboarding (first-time users) and post-onboarding (profile updates) modes.

---

## 1. Entry Points & Modes

### 1.1 Onboarding Mode

**Scenario: New user completing registration**
- **Given** user just registered account
- **When** registration completes successfully
- **Then** app automatically navigates to Profile Setup
  - `isOnboarding: true` flag set
  - Cannot skip/back out to main app
  - Completion navigates to Main dashboard
  - Purpose: Essential profile creation

**Scenario: User completing OAuth registration**
- **Given** user registered via Google/Apple OAuth
- **And** has basic name/email from OAuth provider
- **When** profile setup loads
- **Then** first name pre-populated from OAuth
  - Can edit all fields including pre-populated ones
  - Must still complete all required steps

---

### 1.2 Dashboard Mode

**Scenario: User accessing from Dashboard**
- **Given** user already has account
- **When** user taps "Profile Setup" card on Dashboard
- **Then** opens in dashboard mode
  - `isDashboardMode: true` flag set
  - Back button returns to dashboard
  - Can skip optional steps
  - Changes saved to existing profile
  - Teal card color (#14b8a6)

**Scenario: User updating existing profile**
- **Given** user completed onboarding previously
- **When** profile setup loads in dashboard mode
- **Then** all existing data pre-populated:
  - Name from user.name
  - Health goals previously selected
  - Dietary preferences saved
  - Fitness level shown
  - Can edit any field
  - Saving updates backend profile

---

### 1.3 Direct Navigation

**Scenario: Family Dashboard navigation**
- **Given** user on Family Dashboard
- **When** user taps "Profile Setup" feature button
- **Then** navigates with route params:
  ```typescript
  navigation.navigate('ProfileSetup', { isOnboarding: false })
  ```
  - Opens in non-onboarding mode
  - Same editing capabilities as dashboard mode

---

## 2. Multi-Step Flow Structure

### 2.1 Step Progression

**Available Steps (in order):**
```
1. Basics (basics)
   - Basic personal information
   - Name, DOB, gender, height, weight
   - REQUIRED: First name only

2. Goals (goals)
   - Health and wellness goals
   - Target weight/date (conditional)
   - REQUIRED: At least 1 goal selected

3. Preferences (preferences)
   - Dietary preferences (vegetarian, vegan, keto, etc.)
   - Food allergies
   - Other restrictions
   - OPTIONAL: All fields can be skipped

4. Fitness (fitness)
   - Current fitness level
   - Preferred activities
   - Weekly exercise goal
   - REQUIRED: Fitness level selection

5. Complete (complete)
   - Summary of entered information
   - Final confirmation
   - Save and exit
```

**Progress Indicator:**
```
Header badge shows: "Step X of 5"
Progress calculation: (currentStepIndex + 1) / 5 * 100
Examples:
  - Step 1: "Step 1 of 5" (20% progress)
  - Step 3: "Step 3 of 5" (60% progress)
  - Step 5: "Step 5 of 5" (100% progress)
```

---

### 2.2 Navigation Controls

**Continue Button:**
```
Conditions:
  - Enabled when: canProceed() returns true
  - Disabled when: Required fields empty
  - Visual state: Opacity 0.5 when disabled
  - Action: Advances to next step
  - Last step: Shows "Start My Journey" instead
```

**Skip Button:**
```
Availability:
  - Not shown on: basics (step 1)
  - Not shown on: complete (step 5)
  - Shown on: goals, preferences, fitness
Action:
  - Bypasses current step
  - Advances to next step
  - No validation required
  - Data left empty/default
```

**Back Button:**
```
Behavior by mode:
  - Onboarding: Goes to previous step (step 1 exits to login)
  - Dashboard mode: Previous step or calls onBack()
  - First step in dashboard mode: Returns to dashboard
Visual:
  - Native platform back button
  - Android: Hardware back button support
  - iOS: Swipe gesture support
```

---

## 3. Step 1: Basic Information

### 3.1 Personal Information Section

**Scenario: User enters name**
```
Given user on Basics step
When user enters first name
Then:
  - First name field updates in real-time
  - Last name optional (can be empty)
  - Full name combined: "firstName lastName"
  - Continue button enables (required field met)
  - Character limit: None (practical limit ~50 chars)
  - No special validation (allows unicode, spaces)
```

**Field Layout:**
```
Row 1 (Two columns 50/50):
  ┌──────────────────┬──────────────────┐
  │ First Name *     │ Last Name        │
  │ [John          ] │ [Doe           ] │
  └──────────────────┴──────────────────┘

Label: "About You"
Required indicator: * (asterisk)
Placeholder: "John" / "Doe"
Input style: Light gray background, rounded corners
```

**Scenario: User enters date of birth**
```
Given user on Basics step
When user taps DOB field
Then:
  - Keyboard: Default (text input, not date picker)
  - Placeholder: "MM/DD/YYYY"
  - Format: Free text entry
  - No validation: Accepts any format
  - Optional field: Can skip
  - Use case: Age-based recommendations
```

---

### 3.2 Gender Selection

**Scenario: User selects gender**
```
Given 4 gender options displayed
When user taps an option
Then:
  - Selected option highlights (primary blue)
  - Text color changes to white
  - Other options reset to default style
  - Single selection only
  - Options: Male, Female, Other, Prefer not to say
  - Stored value: Lowercase ("male", "female", "other", "prefer not to say")
```

**Visual Design:**
```
Options row (horizontal chips):
┌───────┬────────┬───────┬─────────────────┐
│ Male  │ Female │ Other │ Prefer not to say│
└───────┴────────┴───────┴─────────────────┘

Unselected: Light gray background, dark text
Selected: Blue background (#3b82f6), white text
Border radius: 20px (fully rounded)
```

---

### 3.3 Physical Stats (Optional)

**Scenario: User enters height and weight**
```
Given user on Physical Stats section
When user enters measurements
Then:
  - Height: Numeric input only (inches)
  - Weight: Numeric input only (pounds)
  - Both optional: Can skip
  - Keyboard: Numeric with decimal
  - Placeholder: "68" (height), "150" (weight)
  - Use case: BMI calculation, calorie recommendations
```

**Field Layout:**
```
Row 2 (Two columns 50/50):
  ┌──────────────────┬──────────────────┐
  │ Height (inches)  │ Weight (lbs)     │
  │ [68            ] │ [150           ] │
  └──────────────────┴──────────────────┘

Label: "Physical Stats (Optional)"
Hint: "This helps us provide accurate nutrition recommendations"
```

**Validation:**
```
Height:
  - Numeric only
  - No range validation
  - Decimal allowed: 68.5

Weight:
  - Numeric only
  - No range validation
  - Decimal allowed: 150.5
```

---

## 4. Step 2: Health Goals

### 4.1 Goal Selection Grid

**Scenario: User selects health goals**
```
Given 8 goal options in 2-column grid
When user taps a goal card
Then:
  - Card border changes to goal color
  - Card background: goal color at 10% opacity
  - Goal label turns goal color
  - Checkmark badge appears (top-right corner)
  - Can select multiple goals
  - Tapping again deselects
  - Continue button enables when ≥1 selected
```

**Goal Options:**
```
┌─────────────────┬─────────────────┐
│ 🔻 Lose Weight  │ 🔺 Gain Weight │
│ Red (#ef4444)   │ Green (#22c55e) │
├─────────────────┼─────────────────┤
│ ⇄ Maintain     │ 💪 Build Muscle │
│ Blue (#3b82f6)  │ Purple (#8b5cf6)│
├─────────────────┼─────────────────┤
│ ⚡ More Energy  │ 🌙 Better Sleep│
│ Orange (#f59e0b)│ Indigo (#6366f1)│
├─────────────────┼─────────────────┤
│ 🥗 Eat Healthier│ 🍃 Reduce Stress│
│ Green (#10b981) │ Teal (#14b8a6)  │
└─────────────────┴─────────────────┘

Card size: 47% width each
Gap: 12px between cards
Padding: 16px inside each card
```

**Goal Card Structure:**
```
Each card displays:
  - Icon circle (48x48, colored background 20% opacity)
  - Goal label (centered below icon)
  - Check badge (20x20, top-right, selected only)
  - Border: 2px (default gray, selected = goal color)
```

---

### 4.2 Conditional Target Details

**Scenario: User selects weight loss goal**
```
Given user selected "Lose Weight" goal
When goals step rerenders
Then "Target Details" section appears:
  - Target Weight field (numeric input)
  - Target Date field (text input, MM/DD/YYYY)
  - Both optional fields
  - Purpose: Track progress toward goal
```

**Scenario: User selects weight gain goal**
```
Given user selected "Gain Weight" goal
When goals step rerenders
Then "Target Details" section appears:
  - Same fields as weight loss
  - Target Weight: Higher than current weight
  - Target Date: Future date
```

**Scenario: User selects non-weight goals only**
```
Given user selected "More Energy" + "Better Sleep"
And did NOT select weight loss or gain
When goals step renders
Then:
  - No "Target Details" section shown
  - Continue button still enabled (goals selected)
  - Can proceed directly to next step
```

**Target Details Layout:**
```
Row (Two columns 50/50):
  ┌──────────────────┬──────────────────┐
  │ Target Weight    │ Target Date      │
  │ (lbs)            │                  │
  │ [140           ] │ [06/15/2026    ] │
  └──────────────────┴──────────────────┘

Label: "Target Details"
Shows when: weight_loss OR weight_gain in selectedGoals
```

---

## 5. Step 3: Dietary Preferences

### 5.1 Dietary Preference Selection

**Scenario: User selects dietary preference**
```
Given 10 dietary preference chips
When user taps a preference
Then:
  - Multiple selections allowed
  - Chip background: Blue (#3b82f6)
  - Chip text: White, bold
  - Icon color: White
  - Can deselect by tapping again
  - "No Restrictions" behavior: Special case
```

**Special Case: "No Restrictions"**
```
Given user taps "No Restrictions"
When tap registers
Then:
  - All other selections clear
  - dietaryPrefs array becomes empty []
  - "No Restrictions" appears selected (visual only)
  - Mutually exclusive with other options

Given user has "No Restrictions" selected
When user taps another preference
Then:
  - "No Restrictions" deselects
  - New preference adds to array
  - Can now select multiple others
```

**Preference Options:**
```
Chips (wrap layout):
┌──────────────┬──────────────┬──────────────┬─────────────┐
│ ✓ No Rest... │   Vegetarian │   Vegan      │ Pescatarian │
├──────────────┼──────────────┼──────────────┼─────────────┤
│   Keto       │   Paleo      │ Gluten-Free  │ Dairy-Free  │
├──────────────┴──────────────┼──────────────┼─────────────┤
│   Halal                      │   Kosher     │             │
└──────────────────────────────┴──────────────┴─────────────┘

Layout: Flexbox wrap
Gap: 8px between chips
Padding: 14px horizontal, 10px vertical
Border radius: 20px (pill shape)
```

**Icons:**
```
Each preference has icon:
  - No Restrictions: checkmark-circle
  - Vegetarian: leaf
  - Vegan: flower
  - Pescatarian: fish
  - Keto: flame
  - Paleo: nutrition
  - Gluten-Free: ban
  - Dairy-Free: close-circle
  - Halal: star
  - Kosher: star-outline
```

---

### 5.2 Food Allergies

**Scenario: User selects allergies**
```
Given 8 common allergy chips
When user taps an allergy
Then:
  - Chip background: Red (#ef4444)
  - Chip text: White
  - Close icon appears (white)
  - Multiple selections allowed
  - Tapping again deselects
  - All optional
```

**Allergy Options:**
```
Common allergies (8 options):
┌─────────┬───────────┬───────┬──────┐
│ Peanuts │ Tree Nuts │ Dairy │ Eggs │
├─────────┼───────────┼───────┼──────┤
│ Soy     │ Wheat     │ Fish  │ Shellfish │
└─────────┴───────────┴───────┴──────┘

Visual:
  - Unselected: Light gray background
  - Selected: Red background (#ef4444)
  - Icon: Close (X) on selected chips
  - Purpose: Meal plan filtering, warnings
```

---

### 5.3 Other Restrictions

**Scenario: User enters custom restrictions**
```
Given free-text input field
When user types restrictions
Then:
  - Multiline text area
  - Placeholder: "Any other foods to avoid..."
  - Min height: 80px (3 lines)
  - No character limit
  - Optional field
  - Examples: "Low sodium", "No red meat", "Organic only"
  - Saved as plain text
```

**Input Style:**
```
Text area:
  - Background: Light gray (#f9fafb)
  - Border: 1px gray
  - Border radius: 12px
  - Padding: 14px
  - Font size: 16px
  - Text align: Top-left
  - Auto-expand: No (fixed 3 lines)
```

---

## 6. Step 4: Fitness Level

### 6.1 Fitness Level Selection

**Scenario: User selects fitness level**
```
Given 5 fitness level cards
When user taps a level
Then:
  - Single selection (radio button behavior)
  - Card border changes to level color
  - Card background: level color at 10% opacity
  - Label text turns level color
  - Radio button fills with level color
  - Other cards reset to unselected state
  - Continue button enables
```

**Fitness Levels:**
```
Vertical stack (5 cards):

┌────────────────────────────────────────┐
│ 🛏️  Sedentary                         │
│     Little to no exercise, mostly      │
│     sitting                            │
│     Color: Gray (#9ca3af)              │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🚶  Lightly Active                     │
│     Light exercise 1-3 days/week       │
│     Color: Light Blue (#60a5fa)        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🚴  Moderately Active                  │
│     Moderate exercise 3-5 days/week    │
│     Color: Green (#34d399)             │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🏃  Very Active                        │
│     Hard exercise 6-7 days/week        │
│     Color: Orange (#f59e0b)            │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🏆  Athlete                            │
│     Professional or competitive        │
│     Color: Purple (#8b5cf6)            │
└────────────────────────────────────────┘
```

**Card Structure:**
```
Each card:
  - Icon circle (56x56, left side, colored background)
  - Label + description (center, flex 1)
  - Radio button (24x24, right side)
  - Padding: 16px
  - Gap: 16px between elements
  - Border: 2px
```

---

### 6.2 Preferred Activities

**Scenario: User selects preferred activities**
```
Given 8 activity type chips
When user taps an activity
Then:
  - Multiple selections allowed
  - Chip background: Blue (#3b82f6)
  - Chip text: White
  - Icon color: White
  - Can deselect by tapping again
  - All optional
  - Purpose: Activity recommendations, tracking
```

**Activity Options:**
```
Chips (wrap layout):
┌─────────┬─────────┬─────────┬──────────┐
│ Walking │ Running │ Cycling │ Swimming │
├─────────┼─────────┼─────────┼──────────┤
│ Weights │ Yoga    │ Sports  │ HIIT     │
└─────────┴─────────┴─────────┴──────────┘

Unselected: Light blue background (10% opacity)
Selected: Solid blue (#3b82f6)
Border: 1px blue (30% opacity when unselected)
```

**Activity Icons:**
```
  - Walking: walk
  - Running: fitness
  - Cycling: bicycle
  - Swimming: water
  - Weight Training: barbell
  - Yoga: body
  - Team Sports: football
  - HIIT: flash
```

---

### 6.3 Weekly Exercise Goal

**Scenario: User sets weekly exercise goal**
```
Given 7 number buttons (1-7)
When user taps a number
Then:
  - Button background: Blue (#3b82f6)
  - Button text: White
  - Other buttons reset to unselected
  - Default: 3 days per week
  - Label below: "days per week"
  - Helps set realistic goals
```

**Button Layout:**
```
Row of 7 equal-width buttons:
┌───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │
└───┴───┴───┴───┴───┴───┴───┘
         days per week

Button size: Flex 1, height 48px
Gap: 8px between buttons
Border radius: 12px
Font: 18px, bold
```

---

## 7. Step 5: Complete

### 7.1 Success Confirmation

**Scenario: User reaches completion step**
```
Given user completed all 4 previous steps
When complete step loads
Then:
  - Success icon displays (checkmark-circle, 80px)
  - Title: "You're All Set! 🎉"
  - Description: Personalization confirmation
  - Summary card with all entered data
  - "Start My Journey" button (replaces Continue)
```

**Visual Design:**
```
Centered layout:
  ┌────────────────────────────────┐
  │         ✓ (80px green)         │
  │                                │
  │    You're All Set! 🎉         │
  │                                │
  │  Your personalized health      │
  │  profile is ready. We'll use   │
  │  this information to give you  │
  │  tailored nutrition insights.  │
  │                                │
  │  ┌──────────────────────────┐ │
  │  │  Profile Summary         │ │
  │  │  ────────────────────    │ │
  │  │  Name: John Doe          │ │
  │  │  Goals: Lose Weight, ... │ │
  │  │  Diet: Vegetarian        │ │
  │  │  Fitness: Moderately ... │ │
  │  └──────────────────────────┘ │
  │                                │
  │  [Start My Journey →]          │
  └────────────────────────────────┘
```

---

### 7.2 Profile Summary Display

**Summary Card Content:**
```
4 rows showing user selections:

Row 1: Name
  - Label: "Name"
  - Value: "John Doe" (firstName + lastName)

Row 2: Goals
  - Label: "Goals"
  - Value: Comma-separated goal labels
  - Example: "Lose Weight, Build Muscle, Eat Healthier"
  - Fallback: "None set" if empty

Row 3: Diet
  - Label: "Diet"
  - Value: Comma-separated dietary preferences
  - Example: "Vegetarian, Gluten-Free"
  - Fallback: "No restrictions" if empty array

Row 4: Fitness
  - Label: "Fitness"
  - Value: Selected fitness level label
  - Example: "Moderately Active"
  - Fallback: "Not specified" if empty
```

**Card Styling:**
```
Summary card:
  - Background: White (#ffffff)
  - Border: 1px gray (#e5e7eb)
  - Border radius: 16px
  - Padding: 20px
  - Width: 100%

Each row:
  - Flex row (space-between)
  - Padding vertical: 12px
  - Border bottom: 1px gray (except last row)
  - Label: 14px gray (left)
  - Value: 14px bold dark (right, flex 1, text-align right)
```

---

## 8. Data Persistence & Saving

### 8.1 Auto-Save Behavior

**When data is NOT saved:**
```
Navigation between steps:
  - Data held in component state
  - No API calls during step transitions
  - Can navigate back/forward freely
  - Data persists in memory only

Exiting without completion:
  - Back button in dashboard mode: No save
  - Android back button: No save
  - App backgrounding: Data lost
  - Component unmount: Data lost
```

**When data IS saved:**
```
Only on completion step:
  - User taps "Start My Journey"
  - handleComplete() function executes
  - Saves to backend + local context
  - Navigation after successful save
```

---

### 8.2 Save Operation

**Scenario: User completes profile setup**
```
Given user on complete step
When user taps "Start My Journey"
Then:
  1. Validate user.id exists
  2. Show loading spinner on button
  3. Build profileData object:
     {
       firstName: "John",
       lastName: "Doe",
       name: "John Doe",
       dateOfBirth: "01/15/1990" (if entered),
       gender: "male" (if entered),
       height: 68 (if entered, parsed to float),
       weight: 150 (if entered, parsed to float),
       healthPreferences: {
         goals: ["weight_loss", "muscle"],
         targetWeight: 140 (if entered, parsed to float),
         targetDate: "06/15/2026" (if entered),
         dietaryPrefs: ["vegetarian"],
         allergies: ["peanuts", "dairy"],
         otherRestrictions: "Low sodium" (if entered),
         fitnessLevel: "moderate",
         preferredActivities: ["walking", "yoga"],
         weeklyExerciseGoal: 3 (parsed to int)
       },
       onboardingCompleted: true,
       profileSetupCompleted: true
     }
  4. Call updateUser(profileData) - updates AuthContext
  5. Call userService.updateUserProfile(userId, profileData)
  6. On success:
     - Onboarding mode: navigation.reset to Main
     - Dashboard mode: call onBack() or navigation.goBack()
  7. On error:
     - Show Alert: "Failed to save your profile. Please try again."
     - Hide loading spinner
     - User can retry
```

**Empty Value Handling:**
```
Only include fields with values:
  - Empty strings NOT sent: "" → field omitted
  - Zero values sent: 0 → included
  - Empty arrays sent: [] → included
  - Uses spread operator conditionals:
    ...(dateOfBirth && { dateOfBirth })
  - Backend receives clean data
  - Prevents validation errors
```

---

### 8.3 Profile Loading

**Scenario: User reopens profile setup**
```
Given user previously completed profile setup
And user reopens from dashboard
When ProfileSetupScreen mounts
Then:
  1. useEffect triggers on user change
  2. Calls loadUserProfile()
  3. Fetches userService.getUserByEmail(user.email)
  4. Populates all fields with saved data:
     - firstName, lastName from profile
     - healthPreferences.goals → selectedGoals
     - healthPreferences.dietaryPrefs → dietaryPrefs
       (handles old single value migration)
     - healthPreferences.allergies → allergies
     - healthPreferences.fitnessLevel → fitnessLevel
     - healthPreferences.preferredActivities → preferredActivities
  5. User can edit any field
  6. Saving updates existing profile
```

**Migration Handling:**
```
Old format support:
  - Old: dietaryPref: "vegetarian" (single string)
  - New: dietaryPrefs: ["vegetarian"] (array)
  
Migration logic:
  if (prefs.dietaryPrefs) {
    setDietaryPrefs(prefs.dietaryPrefs);
  } else if (prefs.dietaryPref) {
    // Migrate old single value
    setDietaryPrefs(prefs.dietaryPref === 'none' ? [] : [prefs.dietaryPref]);
  }
```

---

## 9. Collapsing Header Animation

### 9.1 Header Behavior

**Header States:**
```
Expanded (scroll Y = 0):
  - Height: 140px
  - Background: Teal (#14b8a6)
  - Title: Step name (28px, white, bold)
  - Subtitle: Step description (16px, white)
  - Progress badge: "Step X of 5"
  - Full opacity: 1.0

Collapsed (scroll Y ≥ 140):
  - Height: 0px
  - Opacity: 0
  - Title/subtitle/badge hidden
  - More content space
  - Smooth animation
```

**Animation Details:**
```
Scroll tracking:
  - Animated.Value(0) for scrollY
  - Updated on scroll event
  - scrollEventThrottle: 16 (60fps)

Height interpolation:
  - Input: [0, 140]
  - Output: [140, 0]
  - Extrapolate: clamp

Opacity interpolation:
  - Input: [0, 70]
  - Output: [1, 0]
  - Fades out at halfway point
  - Extrapolate: clamp
```

**Scenario: User scrolls down**
```
Given user at top of page (scrollY = 0)
When user scrolls down
Then as scrollY increases:
  - 0-70px: Header fades out (opacity 1 → 0)
  - 0-140px: Header collapses (height 140 → 0)
  - 140px+: Header fully hidden
  - Content scrolls underneath
  - Animation smooth (60fps target)
  - Uses non-native driver (layout changes)
```

**Scenario: User scrolls back to top**
```
Given user scrolled down (header collapsed)
When user scrolls back up
Then as scrollY decreases:
  - Header expands (height 0 → 140)
  - Header fades in (opacity 0 → 1)
  - Progress badge reappears
  - Reverse of collapse animation
  - Same smoothness
```

---

### 9.2 Progress Badge

**Badge Display:**
```
Visual:
  - Background: White 20% opacity (rgba(255,255,255,0.2))
  - Text: White, 14px, semibold
  - Padding: 16px horizontal, 8px vertical
  - Border radius: 20px (pill shape)
  - Centered below subtitle
  - Updates on step change

Content updates:
  - Step 1: "Step 1 of 5"
  - Step 2: "Step 2 of 5"
  - Step 3: "Step 3 of 5"
  - Step 4: "Step 4 of 5"
  - Step 5: "Step 5 of 5"
```

---

## 10. Validation & Error Handling

### 10.1 Field Validation

**Required Field Checks:**
```
Step 1 (Basics):
  - Required: firstName.trim().length > 0
  - Continue enabled: When first name entered
  - All other fields optional

Step 2 (Goals):
  - Required: selectedGoals.length > 0
  - Continue enabled: When ≥1 goal selected
  - Target fields optional

Step 3 (Preferences):
  - Required: None
  - Always can proceed: true
  - All fields optional

Step 4 (Fitness):
  - Required: fitnessLevel !== ''
  - Continue enabled: When level selected
  - Activities and exercise goal optional

Step 5 (Complete):
  - No validation needed
  - Always can proceed
```

**canProceed() Logic:**
```typescript
const canProceed = (): boolean => {
  switch (currentStep) {
    case 'basics':
      return firstName.trim().length > 0;
    case 'goals':
      return selectedGoals.length > 0;
    case 'preferences':
      return true; // All optional
    case 'fitness':
      return fitnessLevel !== '';
    case 'complete':
      return true;
    default:
      return true;
  }
};
```

---

### 10.2 Error Scenarios

**No User ID (Save Error):**
```
Given user not authenticated
When user tries to save profile
Then:
  - Alert displays: "Please log in to save your profile"
  - Save operation cancelled
  - User remains on complete step
  - Can retry after logging in
```

**Network Error (Save Failure):**
```
Given network connection lost
When userService.updateUserProfile fails
Then:
  - Catch block executes
  - Alert displays: "Failed to save your profile. Please try again."
  - Loading spinner hides
  - User remains on complete step
  - Can tap "Start My Journey" to retry
  - Error logged to console
```

**Profile Load Failure:**
```
Given backend returns error
When loadUserProfile() fails
Then:
  - Error logged to console
  - Fields remain empty (no pre-population)
  - User can still enter data manually
  - Save will work normally
  - Silent failure (no user alert)
```

---

## 11. Keyboard & Input Handling

### 11.1 Keyboard Behavior

**Text Input Fields:**
```
Keyboard types:
  - Name fields: Default
  - Date of birth: Default (free text)
  - Height/Weight: Numeric
  - Target weight: Numeric
  - Target date: Default
  - Other restrictions: Default (multiline)

Auto-capitalize:
  - Name fields: Words
  - All others: None

Return key:
  - Behavior: Dismisses keyboard
  - No automatic next-field focus
```

**Scenario: User typing in numeric field**
```
Given user taps Height field
When keyboard appears
Then:
  - Keyboard type: Numeric with decimal
  - Can enter: 0-9, decimal point
  - Cannot enter: Letters, special chars
  - No max length validation
  - Accepts: 68, 68.5, 6, 6.75
```

---

### 11.2 ScrollView Behavior

**Auto-Scroll on Input Focus:**
```
Not implemented (default platform behavior):
  - iOS: Automatically scrolls to focused input
  - Android: May require manual adjustment
  - KeyboardAvoidingView: Not currently used
  - Potential enhancement: Add KeyboardAvoidingView wrapper
```

---

## 12. Visual Design & Theme

### 12.1 Color Scheme

**Primary Colors:**
```
Background: Light blue (#e0f2fe)
  - Matches standard page background
  - Consistent with design patterns
  - Clean, health-focused

Header: Teal (#14b8a6)
  - Profile/wellness theme color
  - Used on dashboard card
  - High contrast with white text

Accent: Blue (#3b82f6)
  - Primary action color
  - Selected state
  - Continue button

Success: Green (#22c55e)
  - Checkmark on complete step
  - Positive feedback

Error: Red (#ef4444)
  - Allergy selections
  - Error messages
```

**Secondary Colors:**
```
Card background: White (#ffffff)
Input background: Very light gray (#f9fafb)
Border: Light gray (#e5e7eb)
Text primary: Dark gray (#1f2937)
Text secondary: Medium gray (#6b7280)
```

---

### 12.2 Typography

**Header Text:**
```
Title: 28px, weight 700, white
Subtitle: 16px, weight 400, white (90% opacity)
Progress badge: 14px, weight 600, white
```

**Section Text:**
```
Section title: 16px, weight 700, dark gray
Section hint: 13px, weight 400, medium gray
Input label: 14px, weight 600, dark gray
Input text: 16px, weight 400, dark gray
```

**Button Text:**
```
Primary button: 16px, weight 600, white
Skip button: 16px, weight 600, medium gray
Chip text: 14px, weight 400/600 (unselected/selected)
```

---

### 12.3 Spacing & Layout

**Container Spacing:**
```
Horizontal padding: 16px (dashboardTheme.spacing.lg)
Top padding: 16px
Section margin bottom: 12px (dashboardTheme.spacing.md)
Row gap: 12px
Chip gap: 8px
```

**Card Dimensions:**
```
Goal cards: 47% width (2 columns)
Fitness cards: 100% width (vertical stack)
Activity chips: Auto width (wrap)
Input fields: 100% width (or 50% in rows)
```

**Border Radius:**
```
Cards: 12-16px
Input fields: 12px
Chips: 20px (pill shape)
Buttons: 12px
Icons: 24-28px (circular backgrounds)
```

---

## 13. Accessibility

### 13.1 Screen Reader Support

**VoiceOver / TalkBack Announcements:**
```
Header:
  - "Basic Information, Step 1 of 5"
  - "Let's start with some basic information about you."

Input fields:
  - "First Name, required, text field"
  - "Height in inches, optional, numeric field"

Goal cards:
  - "Lose Weight, not selected, button"
  - "Lose Weight, selected, button"

Fitness levels:
  - "Moderately Active, moderate exercise 3 to 5 days per week, radio button, not selected"

Buttons:
  - "Continue, button, disabled"
  - "Skip, button"
  - "Start My Journey, button"
```

---

### 13.2 Touch Targets

**Minimum Touch Sizes:**
```
Buttons: 52px height (primary/skip buttons)
Chips: 38-42px height (adequate for touch)
Goal cards: 100+ px height (large touch area)
Fitness cards: 80+ px height (large touch area)
Radio buttons: 24px (part of larger card)
```

---

### 13.3 Focus Management

**Focus Order:**
```
Step progression:
  1. First input field auto-focuses (platform default)
  2. Tab order: Top to bottom
  3. Continue/Skip buttons last in order
  4. Back button native focus

Goal/preference selections:
  - Focus moves on tap
  - No automatic advancement
  - Allows review before proceeding
```

---

## 14. Platform Differences

### 14.1 iOS Specific

**Gestures:**
```
Swipe back:
  - Enabled on all steps
  - Triggers handleBack()
  - Respects onboarding vs dashboard mode
  - Native iOS edge swipe gesture
```

**Keyboard:**
```
Dismiss:
  - Tap outside input
  - Scroll view tap
  - Native "Done" button
```

---

### 14.2 Android Specific

**Hardware Back Button:**
```
Behavior:
  - Triggers handleBack()
  - Same as on-screen back button
  - Can exit to previous screen
  - Onboarding mode: Back to login
```

**Keyboard:**
```
Dismiss:
  - Native back button
  - Tap outside input
  - Scroll view tap
```

---

## 15. Performance Considerations

### 15.1 Rendering Optimization

**Component State:**
```
Local state only:
  - All form data in component state
  - No Redux/global state pollution
  - Fast re-renders
  - Minimal memory footprint

Conditional rendering:
  - Only current step rendered
  - Previous/next steps unmounted
  - Reduces DOM complexity
  - Faster step transitions
```

---

### 15.2 Animation Performance

**Header Animation:**
```
Performance:
  - Animated API (React Native)
  - useNativeDriver: false (layout changes required)
  - scrollEventThrottle: 16ms (60fps)
  - Interpolation cached
  - Smooth on most devices

Potential optimization:
  - Could use transform instead of height
  - Would allow useNativeDriver: true
  - Trade-off: Layout shift handling
```

---

## 16. Future Enhancements

**Planned Features:**
```
✨ Profile Photo Upload:
  - Add avatar selection
  - Camera or gallery access
  - Crop/resize functionality
  - Displayed on profile

✨ Date Picker:
  - Native date picker for DOB
  - Calendar UI for target date
  - Better UX than text input
  - Format validation

✨ Unit Toggle:
  - Switch between metric/imperial
  - Height: inches ↔ cm
  - Weight: lbs ↔ kg
  - Stored preference

✨ Progress Persistence:
  - Save draft to backend
  - Resume partial completion
  - Don't lose data on exit
  - Auto-save on step change

✨ Smart Defaults:
  - Age-based calorie goals
  - BMI-based recommendations
  - Gender-specific targets
  - Personalized hints

✨ Social Sharing:
  - Share goals with friends
  - Find accountability partners
  - Challenge friends
  - Privacy controls

✨ Gamification:
  - Badges for completion
  - Streak tracking
  - Progress milestones
  - Motivational messages

✨ Advanced Validation:
  - Date format validation
  - Realistic height/weight ranges
  - Age calculation from DOB
  - Field-specific error messages

✨ Multi-language:
  - Localized strings
  - RTL layout support
  - Cultural diet options
  - Regional measurements
```

---

## 17. Summary of Key User Flows

### Quick Reference Chart

| User Goal | Entry Point | Key Steps | End State |
|-----------|-------------|-----------|-----------|
| **Complete onboarding** | Post-registration | Basics → Goals → Preferences → Fitness → Complete | Main dashboard |
| **Update profile** | Dashboard "Profile Setup" card | Load existing → Edit any step → Save | Return to dashboard |
| **Set health goals** | Goals step | Select 1+ goals → Optional target | Goals saved in profile |
| **Configure diet** | Preferences step | Select diet → Allergies → Restrictions | Diet preferences saved |
| **Set fitness level** | Fitness step | Select level → Activities → Weekly goal | Fitness profile saved |
| **Skip optional step** | Any skippable step | Tap "Skip" button | Next step loaded |
| **Go back** | Any step | Back button | Previous step or exit |
| **Review summary** | Complete step | View all entered data | Confirm before save |
| **Save profile** | Complete step | Tap "Start My Journey" | Backend save → Navigate |

---

## 18. Backend Integration

### 18.1 API Endpoints

**User Profile Service:**
```typescript
// Get user profile by email
GET https://user.wihy.ai/api/users?email={email}
Returns: {
  firstName: string,
  lastName: string,
  name: string,
  dateOfBirth?: string,
  gender?: string,
  height?: number,
  weight?: number,
  healthPreferences?: {
    goals: string[],
    targetWeight?: number,
    targetDate?: string,
    dietaryPrefs: string[],
    allergies: string[],
    otherRestrictions?: string,
    fitnessLevel?: string,
    preferredActivities: string[],
    weeklyExerciseGoal: number
  },
  onboardingCompleted: boolean,
  profileSetupCompleted: boolean
}

// Update user profile
PUT https://user.wihy.ai/api/users/{userId}
Body: Same structure as above
Returns: { success: boolean, user: UpdatedUserObject }
```

---

### 18.2 Data Flow

**Profile Load Sequence:**
```
1. Component mounts
2. useEffect triggers on user context
3. loadUserProfile() async function
4. userService.getUserByEmail(user.email)
5. Parse response
6. Set all state variables
7. UI updates with loaded data
8. User can now edit
```

**Profile Save Sequence:**
```
1. User taps "Start My Journey"
2. Validate user.id exists
3. Build profileData object
4. updateUser(profileData) - Local context
5. userService.updateUserProfile(userId, profileData) - Backend
6. Await both promises
7. On success: Navigate to destination
8. On error: Show alert, stay on page
```

---

### 18.3 AuthContext Integration

**User Context:**
```typescript
const { user, updateUser } = useContext(AuthContext);

user object contains:
  - id: User ID (required for save)
  - email: Email address
  - name: Full name
  - Other profile fields

updateUser() function:
  - Updates local AuthContext
  - Propagates to all components
  - Persists in AsyncStorage
  - Syncs with backend via service
```

---

## Document Version

**Version:** 1.0  
**Last Updated:** January 25, 2026  
**Author:** AI Assistant (Copilot)  
**Review Status:** Draft  

This document serves as the behavioral specification for the Profile Setup feature. All interactions should match these behaviors for consistency and optimal user experience.
