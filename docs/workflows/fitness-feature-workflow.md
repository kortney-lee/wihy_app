# Fitness Screen - User Behavior Specification

## Overview

This document describes all user interactions with the Fitness Dashboard, covering workout creation, execution, tracking, history, and calendar management.

---

## 1. Initial Screen Load

### When User Opens Fitness Dashboard

**Scenario: First-time user with no programs**
- **Given** user has no saved workout programs
- **When** fitness dashboard loads
- **Then** user sees:
  - Welcome message with "Create Your First Workout" CTA
  - Quick start options (Quick Workout, Custom Program)
  - Pre-made program templates (if available)
  - Empty calendar view

**Scenario: Returning user with active programs**
- **Given** user has 1 or more active programs
- **When** fitness dashboard loads
- **Then** user sees:
  - Today's scheduled workout (if any)
  - Calendar showing all scheduled workouts
  - Program progress card (current week, day, completion %)
  - List of user's saved programs
  - Workout history summary

**Scenario: User has workout scheduled for today**
- **Given** user has a program with workout scheduled for today
- **When** dashboard loads
- **Then** user sees:
  - Highlighted "Today's Workout" card at top
  - Workout details (name, duration, exercises preview)
  - "Start Workout" button (primary CTA)
  - Weather widget (if enabled)
  - Warm-up, main exercises, cooldown sections

---

## 2. Creating Workouts

### 2.1 Quick Workout (Single Session)

**User Journey: Generate a one-time workout**

**Scenario: User selects quick workout goals**
```
Given user taps "Quick Workout" button
When goal selection modal opens
Then user can:
  - Select from quick goal categories:
    * Full Body Blast
    * Upper Body Strength
    * Lower Body Power
    * Core & Abs
    * Cardio Burn
    * Stretch & Mobility
  - Choose workout duration (15, 30, 45, 60 minutes)
  - Select available equipment (checkboxes for multiple)
  - Tap "Generate Workout" button
```

**Scenario: Workout generation in progress**
```
Given user taps "Generate Workout"
When API call is processing
Then user sees:
  - Loading spinner with message "Creating your perfect workout..."
  - Progress indicator (optional)
  - Cancel button to abort generation
```

**Scenario: Generated workout preview**
```
Given workout generation succeeds
When preview screen appears
Then user sees:
  - Workout name and estimated duration
  - Three sections:
    * Warm-up (5-10 min) - dynamic stretches
    * Main Workout - exercises with sets/reps
    * Cool-down (5 min) - static stretches
  - Equipment list required
  - Two action buttons:
    * "Start Now" - begins workout immediately
    * "Save for Later" - adds to calendar
```

**Input Validation:**
- Duration: Must select one of [15, 30, 45, 60]
- Equipment: At least "None" or 1+ equipment selected
- Goals: At least one goal selected

**Error Handling:**
- If generation fails → show error message with "Try Again" button
- If network error → show offline message with cached workout suggestions
- If invalid inputs → highlight missing fields in red

---

### 2.2 Custom Program (Multi-Week Plan)

**User Journey: Create a structured training program**

**Scenario: User starts program creation**
```
Given user taps "Create Program" button
When program creation wizard opens
Then user sees Step 1: Goal Selection
  - Performance Goals (tabs):
    * Strength
    * Hypertrophy (Muscle Building)
    * Endurance
    * Weight Loss
    * Athletic Performance
  - Body Goals (multi-select):
    * Build Arms
    * Sculpt Abs
    * Tone Legs
    * Increase Chest Size
    * Strengthen Back
    * Improve Posture
  - Selected goals appear as chips with X to remove
```

**Scenario: User configures program parameters**
```
Given user selected at least one goal
When user taps "Next"
Then user sees Step 2: Program Configuration
  - Program duration (slider):
    * 4 weeks (minimum)
    * 8 weeks (recommended)
    * 12 weeks (advanced)
    * 16 weeks (maximum)
  - Days per week (picker):
    * 3 days (beginner-friendly)
    * 4 days (balanced)
    * 5 days (intermediate)
    * 6 days (advanced)
  - Workout duration per session:
    * 30 min (quick sessions)
    * 45 min (standard)
    * 60 min (comprehensive)
  - Rest day preferences:
    * Auto-schedule (system decides)
    * Specific days (user picks from calendar)
```

**Scenario: User selects equipment and body focus**
```
Given user configured program parameters
When user taps "Next"
Then user sees Step 3: Equipment & Focus
  - Available equipment (multi-select checkboxes):
    ☐ No equipment (bodyweight)
    ☐ Dumbbells
    ☐ Barbell
    ☐ Resistance Bands
    ☐ Pull-up Bar
    ☐ Bench
    ☐ Cable Machine
    ☐ Kettlebell
    ☐ Full Gym Access
  - Target muscle groups (optional, multi-select):
    ☐ Chest
    ☐ Back
    ☐ Shoulders
    ☐ Arms (Biceps/Triceps)
    ☐ Legs (Quads/Hamstrings)
    ☐ Glutes
    ☐ Core/Abs
    ☐ Calves
```

**Scenario: Program preview before saving**
```
Given user completed all configuration steps
When user taps "Generate Program"
Then user sees Program Preview:
  - Program name (auto-generated or user can edit)
  - Total duration summary (e.g., "8 weeks, 4 days/week")
  - Weekly schedule visualization:
    * Monday: Upper Body Strength (45 min)
    * Tuesday: Rest
    * Wednesday: Lower Body Power (45 min)
    * Thursday: Rest
    * Friday: Push Day (45 min)
    * Saturday: Pull Day (45 min)
    * Sunday: Rest
  - Sample workout from Week 1 Day 1
  - Progressive overload plan summary
  - Two buttons:
    * "Edit Program" - go back to modify
    * "Save & Start Program" - commit and schedule
```

**Scenario: User saves program and sets start date**
```
Given user taps "Save & Start Program"
When save confirmation modal appears
Then user can:
  - Choose start date (calendar picker):
    * Default: Today
    * Or: Pick future date
  - Select notification preferences:
    ☐ Remind me 1 hour before workouts
    ☐ Daily morning reminder
    ☐ Weekly progress check-ins
  - Tap "Confirm & Save"
```

**Input Validation:**
- Program must have:
  * At least 1 goal selected
  * Duration between 4-16 weeks
  * Days per week between 3-6
  * At least 1 equipment option (including "None")
- Start date must be today or future date
- Program name must be unique (or auto-generate with timestamp)

---

## 3. Executing Workouts

### 3.1 Starting a Workout

**Scenario: User starts scheduled workout**
```
Given user has a workout scheduled for today
When user taps "Start Workout" button
Then:
  - Timer starts counting total workout duration
  - Screen transitions to Exercise Execution View
  - First exercise displays with full details
  - User sees:
    * Exercise name and image/video
    * Current set number (e.g., "Set 1 of 4")
    * Target reps (e.g., "12-15 reps")
    * Recommended weight (if applicable)
    * Rest timer (inactive until set complete)
    * Form tips toggle
```

**Scenario: User starts quick workout**
```
Given user generated a quick workout
When user taps "Start Now" from preview
Then:
  - Workout begins immediately (same as scheduled)
  - No program association (standalone session)
  - Completion tracked in history only
```

---

### 3.2 Logging Exercise Sets

**User Journey: Recording performance for each set**

**Scenario: User completes a set**
```
Given user is viewing current exercise
When user performs the exercise
Then user can log:
  - Reps completed (number input):
    * Tap to activate keyboard
    * Enter actual reps (e.g., 12)
    * Default: pre-filled with target reps
  - Weight used (number input + unit picker):
    * Enter weight (e.g., 45)
    * Select unit (lbs or kg)
    * Default: last logged weight for this exercise
  - Form rating (optional, 1-5 stars):
    * Star rating for self-assessment
    * Helps track technique quality
```

**Scenario: Input field behavior**
```
Given user taps reps/weight input field
When keyboard appears
Then:
  - Numeric keyboard shows (0-9, decimal, backspace)
  - Previous value is highlighted for quick override
  - "Clear" button to reset to empty
  - "Use Recommended" button to auto-fill suggested values
```

**Scenario: User confirms set completion**
```
Given user entered reps and weight
When user taps "Complete Set" button
Then:
  - Set data saves to workout session
  - Rest timer begins countdown (e.g., 60 seconds)
  - Rest timer displays:
    * Large countdown (60, 59, 58...)
    * "Skip Rest" button
    * "Add 30s" button to extend rest
  - Progress indicator updates (Set 1/4 → Set 2/4)
  - Completed set shows checkmark ✓
```

**Scenario: Rest timer countdown**
```
Given rest timer is active
When countdown reaches 0
Then:
  - Haptic feedback (vibration)
  - Audio cue (optional beep)
  - Alert banner: "Rest complete! Ready for set 2?"
  - Auto-advance to next set input screen
```

**Scenario: User skips rest period**
```
Given rest timer is counting down
When user taps "Skip Rest"
Then:
  - Timer stops immediately
  - Advances to next set
  - Actual rest time logged (for analytics)
```

---

### 3.3 Navigating Between Exercises

**Scenario: User completes all sets for an exercise**
```
Given user finished final set (e.g., Set 4/4)
When user taps "Complete Set"
Then:
  - Exercise marked as complete ✓
  - Celebration animation (optional)
  - Auto-advance to next exercise after 3 seconds
  - Or: User can tap "Next Exercise" immediately
```

**Scenario: User navigates exercise list**
```
Given workout is in progress
When user swipes left/right or taps exercise list
Then user can:
  - View all exercises in workout (carousel/list)
  - See completion status for each:
    * Not Started (gray)
    * In Progress (blue, shows X/Y sets)
    * Completed (green with checkmark)
  - Jump to any exercise by tapping
  - Return to current exercise via "Resume" button
```

**Scenario: User pauses workout**
```
Given workout is active
When user taps "Pause" button or exits app
Then:
  - Workout timer pauses
  - Modal appears: "Pause Workout?"
    * "Resume" - continues where left off
    * "End Workout" - prompts for early completion confirmation
    * "Save Progress" - saves partial session
  - Data auto-saves every 30 seconds
```

---

### 3.4 Exercise Form & Instructions

**Scenario: User views exercise instructions**
```
Given user is on exercise screen
When user taps "How to Perform" or info icon
Then modal displays:
  - Exercise video/animation (auto-play loop)
  - Step-by-step instructions (numbered list)
  - Form tips (bullet points):
    * "Keep core engaged throughout movement"
    * "Don't lock elbows at top of rep"
    * "Control the descent for 2-3 seconds"
  - Common mistakes to avoid
  - "Got it" button to dismiss
```

**Scenario: User reports difficulty with exercise**
```
Given user is viewing an exercise
When user taps "This is too hard/easy"
Then modal appears with options:
  - "Suggest easier variation" (e.g., knee push-ups instead of regular)
  - "Suggest harder variation" (e.g., diamond push-ups instead of regular)
  - "Skip this exercise" (counts as incomplete)
  - "Replace exercise" (suggests alternative for same muscle group)
```

---

### 3.5 Completing Workouts

**Scenario: User finishes all exercises**
```
Given user completed final exercise
When user taps "Complete Workout"
Then completion modal appears showing:
  - Workout summary:
    * Total duration (e.g., "42 minutes")
    * Sets completed (e.g., "24/24 sets")
    * Total volume (e.g., "12,450 lbs lifted")
    * Estimated calories burned (e.g., "385 kcal")
  - Achievements earned (if any):
    * 🔥 "5 Day Streak!"
    * 💪 "New Personal Record - Bench Press 135 lbs"
    * ⭐ "First Workout Complete!"
  - Feedback section:
    * "How did you feel?" (emoji scale: 😫 😐 😊 😄 🤩)
    * "Rate your energy level" (1-10 slider)
    * "Any pain or discomfort?" (yes/no toggle)
      - If yes: Body map to mark location
    * "Notes" (optional text field)
  - Two buttons:
    * "Save & Share" - posts to social/saves
    * "Just Save" - saves privately
```

**Scenario: User abandons workout mid-session**
```
Given user has completed some but not all exercises
When user taps "End Workout Early"
Then confirmation modal appears:
  - "Are you sure you want to end this workout?"
  - Progress shown: "You've completed 6 of 10 exercises"
  - Options:
    * "Yes, save partial workout" - logs what was done
    * "No, keep going" - returns to workout
    * "Discard workout" - deletes session, no save
```

**Post-Completion Actions:**
- Workout data saves to history
- Program progress updates (if part of program)
- Calendar marks workout as complete ✓
- Stats update (total workouts, volume, streaks)
- Next workout in program unlocks (if applicable)

---

## 4. Workout History

### 4.1 Viewing Past Workouts

**Scenario: User accesses workout history**
```
Given user taps "History" tab
When history screen loads
Then user sees:
  - List of all completed workouts (most recent first)
  - Each entry shows:
    * Date and time
    * Workout name
    * Duration
    * Total sets/exercises
    * Quick stats (volume, calories)
  - Filter options:
    * Date range picker
    * Program filter (dropdown)
    * Workout type (strength/cardio/etc.)
  - Search bar to find specific workouts
```

**Scenario: User views specific workout details**
```
Given user taps on a history entry
When detail view opens
Then user sees:
  - Full workout summary (same as completion modal)
  - Exercise-by-exercise breakdown:
    * Exercise name
    * All logged sets with reps and weight
    * Rest times taken
    * Form ratings
  - Comparison to previous performance:
    * "You lifted 5% more than last time! 🎉"
    * "You completed this 3 minutes faster"
  - Graph showing progression over time
  - Options:
    * "Repeat This Workout" - creates new session
    * "Share" - export/social media
    * "Delete" - remove from history
```

**Scenario: User views exercise history**
```
Given user taps on specific exercise from history
When exercise detail view opens
Then user sees:
  - Chart of weight progression over time
  - Chart of reps/volume over time
  - Personal records:
    * Max weight lifted
    * Most reps in a set
    * Best total volume
  - All past sets for this exercise (table view)
  - Trendline showing improvement
```

---

### 4.2 Workout Statistics & Analytics

**Scenario: User views overall fitness stats**
```
Given user accesses "Stats" section
When stats dashboard loads
Then user sees:
  - Summary cards:
    * Total workouts completed
    * Current streak (consecutive days/weeks)
    * Longest streak ever
    * Total time exercised (hours)
    * Total weight lifted (volume)
  - Charts:
    * Workouts per week (bar chart, last 12 weeks)
    * Volume by muscle group (pie chart)
    * Workout duration trends (line graph)
  - Personal records table:
    * Exercise | Max Weight | Date Achieved
  - Weekly comparison:
    * This week vs last week volume
    * This week vs 4-week average
```

**Scenario: User filters stats by date range**
```
Given user on stats screen
When user selects custom date range
Then:
  - All charts and numbers update
  - Shows comparative data for selected period
  - "Export Data" option appears (CSV download)
```

---

## 5. Calendar & Scheduling

### 5.1 Calendar View

**Scenario: User views workout calendar**
```
Given user on calendar tab
When calendar renders
Then user sees:
  - Month view calendar
  - Each day shows:
    * Workout indicator dot (colored by type)
    * Rest day marker (if applicable)
    * Today highlighted with border
  - Legend:
    * 🟢 Completed workout
    * 🔵 Scheduled workout (upcoming)
    * 🟡 Missed workout (past, not completed)
    * ⚪ Rest day
  - Navigation:
    * < > arrows to change month
    * "Today" button to jump to current date
```

**Scenario: User taps on a calendar day**
```
Given user taps a specific date
When day detail modal opens
Then user sees:
  - All workouts scheduled for that day
  - For each workout:
    * Name and duration
    * Completion status
    * "View Details" button
    * "Start Workout" button (if today or future)
  - If past date:
    * "Workout Missed" indicator (if not completed)
    * "Log Retroactively" option
  - If rest day:
    * "Rest Day" message
    * "Add Workout" option to override
```

**Scenario: User adds workout to specific date**
```
Given user taps "Add Workout" from calendar
When workout selection modal appears
Then user can:
  - Choose from saved programs (dropdown)
  - Select specific workout from program
  - Or: Create new quick workout for that date
  - Set time of day (morning/afternoon/evening)
  - Add reminder notification
  - Tap "Schedule" to confirm
```

**Scenario: User reschedules a workout**
```
Given user long-presses a scheduled workout
When contextual menu appears
Then user can:
  - "Move to Different Date" (opens date picker)
  - "Mark as Complete" (for retroactive logging)
  - "Skip Workout" (removes from calendar)
  - "Delete from Program" (removes entirely)
```

---

### 5.2 Program Progress Tracking

**Scenario: User views program progress**
```
Given user has active program
When user taps program card
Then program detail screen shows:
  - Progress bar:
    * "Week 3 of 8"
    * "Day 2 of 4 this week"
    * Overall completion: "37% complete"
  - This week's schedule (list view):
    ✓ Mon: Upper Body (completed)
    → Wed: Lower Body (today's workout)
    ○ Fri: Full Body (upcoming)
    ○ Sun: Cardio (upcoming)
  - Stats for this program:
    * Workouts completed: 9 / 32
    * Current streak: 3 weeks
    * Avg workout duration: 43 min
  - Next workout preview card
  - Actions:
    * "Pause Program" (stops scheduling new workouts)
    * "Modify Program" (adjust parameters)
    * "Delete Program" (confirmation required)
```

**Scenario: User completes a program**
```
Given user finishes final workout of program
When workout completion saves
Then celebration modal appears:
  - "🎉 Program Complete!"
  - Summary:
    * Duration: "8 weeks"
    * Workouts completed: "32/32"
    * Total time: "22 hours 15 minutes"
    * Total volume: "142,580 lbs"
  - Progress photos comparison (if user uploaded):
    * Before (Week 1) vs After (Week 8)
  - Achievements unlocked
  - Options:
    * "Start New Program" (goal selection)
    * "Repeat This Program" (with progressive overload)
    * "View All Stats" (detailed analytics)
    * "Share Success" (social media)
```

---

## 6. Progressive Overload & Recommendations

### 6.1 Weight Recommendations

**Scenario: System suggests weight increase**
```
Given user logged multiple sets for an exercise
When user starts same exercise in future workout
Then system displays:
  - "Last time: 3x12 @ 45 lbs"
  - "Recommended today: 3x12 @ 50 lbs (+5 lbs)"
  - Reason: "You completed all reps easily last time"
  - User can:
    * Accept recommendation (use 50 lbs)
    * Use previous weight (45 lbs)
    * Enter custom weight
```

**Scenario: User achieves personal record**
```
Given user logs weight higher than previous max
When set is saved
Then:
  - Alert appears: "🏆 New Personal Record!"
  - Shows: "Bench Press: 155 lbs (previous: 145 lbs)"
  - Celebration animation
  - Record auto-saves to PR list
  - Option to share achievement
```

---

### 6.2 Adaptive Training

**Scenario: User consistently struggles with exercise**
```
Given user fails to hit target reps 3 times in a row
When workout is in progress
Then system suggests:
  - "Having trouble with Barbell Rows?"
  - Options:
    * "Reduce weight by 10%" (auto-adjust)
    * "Switch to easier variation" (e.g., Dumbbell Rows)
    * "Continue with current weight" (keep trying)
  - User choice saves for future workouts
```

**Scenario: User reports pain during exercise**
```
Given user marks "felt pain" in workout feedback
When feedback is submitted
Then:
  - System notes pain location (from body map)
  - Future workouts auto-adjust:
    * Removes exercises targeting painful area
    * Suggests alternative exercises
    * Adds extra warm-up for that muscle group
  - Warning appears next time: "Take it easy on your lower back"
```

---

## 7. Input Fields & Data Entry

### 7.1 Numeric Inputs

**Reps Field:**
- Type: Number
- Range: 1-999
- Default: Target reps from workout plan
- Behavior:
  * Tap to edit
  * Numeric keyboard appears
  * Previous value highlights
  * Can type new value or clear
  * "Enter" saves and advances to weight field

**Weight Field:**
- Type: Number + Unit
- Range: 0-999 (adjustable by equipment)
- Default: Last logged weight for this exercise
- Unit toggle: lbs ↔ kg (tap to switch)
- Behavior:
  * Separate input for number and unit
  * Smart suggestions based on equipment
  * "+" / "-" buttons for quick 5 lb adjustments
  * Long-press "+" for faster increment

**Duration Field (for timed exercises):**
- Type: Minutes:Seconds
- Range: 00:00 - 59:59
- Input method: Time picker wheel
- Default: Target duration from plan

---

### 7.2 Selection Inputs

**Equipment Picker (Multi-select):**
```
☐ Dumbbells
☐ Barbell  
☐ Resistance Bands
☐ Pull-up Bar
☐ Bench
☐ No Equipment

Behavior:
- Checkboxes allow multiple selections
- "Select All" / "Clear All" buttons
- Selected count shows at top: "3 equipment types selected"
- Affects exercise recommendations
```

**Goal Picker (Multi-select with categories):**
```
Tabs: Performance | Body Goals | Quick Workouts

Performance:
☐ Build Strength
☐ Gain Muscle (Hypertrophy)
☐ Improve Endurance
☐ Lose Weight

Selected goals show as removable chips below picker
Max selections: 3 (prevents conflicting goals)
```

**Difficulty Level (Single-select):**
```
Radio buttons:
○ Beginner (I'm new to working out)
○ Intermediate (I workout regularly)
○ Advanced (I'm an experienced lifter)

Selection changes exercise complexity and volume
```

---

### 7.3 Sliders & Ranges

**Duration Slider:**
```
|----●----|----|----|----|
15   30   45   60   75+

- Tap and drag to adjust
- Shows time in minutes above thumb
- Snaps to 15-minute increments
- Label updates: "30 minutes per session"
```

**Intensity Slider (RPE - Rate of Perceived Exertion):**
```
Easy          Moderate          Hard
|----|----|----●----|----|----|
1    2    3    4    5    6    7

- Used in workout feedback
- Color gradient: green → yellow → red
- Descriptions appear below:
  * 1-2: Very easy
  * 3-4: Moderate effort
  * 5-6: Challenging
  * 7: Very hard
```

---

### 7.4 Date & Time Pickers

**Start Date Picker:**
```
Calendar modal:
- Month/year navigation
- Today highlighted
- Future dates selectable
- Past dates disabled (can't start program in past)
- Quick picks:
  * Today
  * Next Monday
  * Custom date
```

**Workout Time Picker:**
```
Time slot buttons:
○ Morning (6 AM - 12 PM)
○ Afternoon (12 PM - 5 PM)
○ Evening (5 PM - 9 PM)
○ Custom (time wheel picker)

Saves as reminder notification time
```

---

## 8. Error States & Validation

### 8.1 Form Validation

**Missing Required Fields:**
```
When user tries to proceed without required data:
- Highlight empty fields in red
- Show error message below field: "Please select at least one goal"
- Disable "Next" button until valid
- Scroll to first error field
```

**Invalid Data Ranges:**
```
When user enters invalid values:
- Weight < 0: "Weight must be positive"
- Reps > 999: "Maximum 999 reps per set"
- Duration > 120 min: "Maximum workout duration is 2 hours"
```

---

### 8.2 Network Errors

**Workout Generation Failure:**
```
When API call fails:
- Error modal appears:
  * "Oops! We couldn't generate your workout"
  * Reason: "Network connection lost"
  * Actions:
    - "Try Again" (retry API call)
    - "Use Offline Workout" (cached template)
    - "Cancel" (return to dashboard)
```

**Save Failed During Workout:**
```
When auto-save fails mid-workout:
- Warning banner at top (yellow):
  * "⚠️ Changes not saved. Reconnect to save progress."
- Data cached locally
- Auto-retry every 30 seconds
- Manual "Retry Save" button
```

---

### 8.3 Data Conflicts

**Program Already Exists:**
```
When user creates program with duplicate name:
- Modal appears:
  * "You already have a program named 'Summer Shred'"
  * Options:
    - "Rename New Program" (append timestamp)
    - "Replace Old Program" (confirmation required)
    - "Cancel Creation"
```

---

## 9. Notifications & Reminders

### 9.1 Workout Reminders

**Pre-Workout Notification:**
```
Time: 1 hour before scheduled workout
Content:
  "💪 Upper Body Strength in 1 hour"
  "45 min workout • Tap to view exercises"
  
Actions:
- Tap notification → Opens workout detail
- Swipe right → "Start Now" (launches immediately)
- Swipe left → "Reschedule" (opens date picker)
```

**Missed Workout Notification:**
```
Time: 2 hours after scheduled time (if not completed)
Content:
  "Missed workout: Lower Body Power"
  "Log it later or skip today?"
  
Actions:
- "Log Retroactively" (opens workout with past time)
- "Skip Today" (marks as rest day)
- Dismiss (no action)
```

---

### 9.2 Progress Notifications

**Streak Milestone:**
```
When user completes 7 consecutive days:
  "🔥 7-Day Streak! Keep the momentum going!"
  
When user loses streak:
  "Your 14-day streak ended. Start a new one today!"
```

**Personal Record Alert:**
```
When PR is achieved during workout:
  "🏆 New PR! Squat: 185 lbs (+10 lbs)"
  Tap to share on social media
```

---

## 10. Accessibility & Preferences

### 10.1 Display Settings

**Units Preference:**
```
Settings > Fitness > Units
○ Imperial (lbs, ft, in)
○ Metric (kg, cm)

Changes all weight/height displays throughout app
```

**Voice Guidance:**
```
Settings > Fitness > Voice Coach
☐ Enable voice announcements
  - Announces exercise names
  - Counts down rest timer
  - Motivational cues ("Almost there!")
Volume: |----●----|----|
```

**Rest Timer Sound:**
```
Settings > Fitness > Rest Timer
☐ Play sound when rest ends
Sound: [Beep / Chime / Voice] (dropdown)
Volume: |----●----|----|
```

---

### 10.2 Visual Accessibility

**Large Text Mode:**
```
Settings > Accessibility > Large Text
- Increases font sizes by 20-30%
- Affects exercise names, reps, weight fields
```

**High Contrast:**
```
Settings > Accessibility > High Contrast
- Darker borders
- Bolder text
- Increased color saturation
```

---

## 11. Edge Cases & Special Scenarios

### 11.1 Program Conflicts

**Overlapping Programs:**
```
Given user has 2 active programs
When workouts scheduled for same day
Then:
  - Calendar shows both workouts
  - Warning appears: "2 workouts scheduled for this day"
  - User can:
    * Merge workouts (combine exercises)
    * Choose one to complete
    * Reschedule one workout
```

---

### 11.2 Device Compatibility

**Screen Keep-Awake During Workout:**
```
When workout is active:
- Screen doesn't auto-lock
- Prevents accidental data loss
- User can manually lock if needed
```

**Offline Mode:**
```
When internet unavailable:
- Shows cached programs/workouts
- All logging functions work (local storage)
- Sync icon appears showing "Not synced"
- Auto-sync when connection restored
- Warning: "Some features limited offline"
```

---

## 12. Summary of Key User Flows

### Quick Reference Chart

| User Goal | Starting Point | Key Steps | End State |
|-----------|----------------|-----------|-----------|
| **Create quick workout** | Dashboard | Tap "Quick Workout" → Select goals → Choose duration → Generate → Start | Workout in progress |
| **Create custom program** | Dashboard | Tap "Create Program" → Select goals → Configure params → Preview → Save | Program saved, scheduled |
| **Log a workout set** | Active workout | Enter reps → Enter weight → Tap "Complete Set" → Rest timer | Next set ready |
| **View workout history** | Dashboard | Tap "History" → Select workout → View details | Detailed stats displayed |
| **Check calendar** | Dashboard | Tap "Calendar" → Select date → View workouts | Day's schedule shown |
| **Track progress** | Program card | Tap program → View progress → Check stats | Progress metrics displayed |
| **Modify weight** | Exercise screen | Tap weight field → Enter new value → Save | Weight updated |
| **Skip exercise** | Active workout | Tap exercise menu → "Skip Exercise" → Confirm | Next exercise loads |
| **Complete program** | Final workout | Finish last exercise → Completion modal | Celebration shown |

---

## Document Version

**Version:** 1.0  
**Last Updated:** January 24, 2026  
**Author:** AI Assistant (Copilot)  
**Review Status:** Draft  

This document serves as the behavioral specification for the Fitness Dashboard. All interactions should match these behaviors for consistency and optimal user experience.
