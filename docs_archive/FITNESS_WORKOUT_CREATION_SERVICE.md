# Fitness Workout Creation Service - Architecture & Flow

**Location:** `mobile/src/screens/fitness/`  
**Date:** January 18, 2026  
**Purpose:** Multi-step workflow for users to create personalized workout plans

---

## 📋 Overview

The fitness workout creation service is a **3-step wizard** that guides users from selecting their fitness level → setting goals → generating a customized workout plan. It supports three distinct workout modes to accommodate different user needs.

---

## 🏗️ Component Architecture

### Component Structure:
```
FitnessDashboard (Main Container)
├── FitnessLevelSelection (Step 1)
│   └── Displays fitness level options with descriptions
├── GoalSelection/GoalSelectionV2 (Step 2)
│   ├── Quick Mode: Fast single workout generation
│   ├── Routine Mode: Structured recurring workouts
│   └── Train/Sports Mode: Program-based training
└── WorkoutResult (Step 3)
    └── Displays generated workout plan
```

---

## 🔄 User Journey

### Step 1: Fitness Level Selection (`FitnessLevelSelection.tsx`)

**Purpose:** Assess user's current fitness capability

**What It Does:**
- Displays 3 fitness levels with descriptions, icons, and features
- Each level has:
  - **Title:** Beginner, Intermediate, Advanced
  - **Description:** Plain-language explanation
  - **Icon:** Visual indicator (dumbbell, runner, etc.)
  - **Features:** List of 3-4 bullet points describing what level entails
  - **Color Coding:** Each level has distinct color (green, blue, red)

**Selected Level Example:**
```typescript
{
  id: 'beginner',
  title: 'Beginner',
  description: 'New to fitness or returning after a break',
  icon: 'fitness-outline',
  color: '#22c55e', // Green
  features: [
    'Bodyweight and light weights focus',
    'Low to moderate intensity',
    'Emphasis on form and consistency',
    'Minimal equipment needed'
  ]
}
```

**Data Flow:**
```
User taps level card 
  ↓
onSelectLevel(levelId) callback triggered
  ↓
State updates in FitnessDashboard
  ↓
Navigation to Step 2 (GoalSelection)
```

---

### Step 2: Goal Selection (`GoalSelection.tsx` / `GoalSelectionV2.tsx`)

**Purpose:** Capture workout preferences and constraints

**Architecture: 3 Workout Modes**

#### Mode 1: QUICK (Single Workout)
**Use Case:** User wants a one-time workout session

**Inputs:**
- **Workout Type:** Full body, Upper body, Lower body, Core, Cardio, HIIT
- **Intensity:** Light, Moderate, Intense
- **Equipment:** None, Dumbbells, Barbells, Machine, Bands, Kettlebells
- **Duration:** 15, 20, 30, 45, 60 minutes

**Flow:**
```
Select workout type
  ↓
Auto-populate target areas based on type
  ↓
Choose intensity level
  ↓
Select available equipment
  ↓
Set workout duration
  ↓
Generate immediate workout
```

**Example:**
- Type: Full Body
- Intensity: Moderate
- Equipment: Dumbbells
- Duration: 30 minutes
- **Result:** 30-minute dumbbell full-body workout

---

#### Mode 2: ROUTINE (Recurring Workouts)
**Use Case:** User wants a structured weekly routine

**Equipment Gate (First Choice):**
- **Bodyweight Only:** Uses only body resistance
- **Gym Access:** Full gym equipment available

**Inputs (if Gym selected):**
- **Workout Focus:** Strength, Hypertrophy (Build Muscle), Endurance, Flexibility
- **Target Areas:** 7 options (Chest, Back, Shoulders, Arms, Legs, Glutes, Core)
  - Checkboxes allow multi-select
  - Auto-populated based on focus selection
- **Repeat Per Week:** 2, 3, 4, 5, 6 days
- **Goal Tags:** Up to 2 tags (Lose Weight, Build Muscle, Get Toned, Improve Strength)
- **Gym Equipment:** Dumbbells, Barbells, Machines, Cables, etc.

**Conditional Sections:**
- Equipment section only appears if "Gym" is selected
- Target areas auto-populate but user can customize

**Flow:**
```
Select equipment gate (Bodyweight vs Gym)
  ↓
IF Gym:
  ├─ Choose workout focus (auto-fills target areas)
  ├─ Customize target areas
  ├─ Select gym equipment
  ├─ Set repeat frequency per week
  └─ Add goal tags
  ↓
Generate recurring workout plan
```

**Example:**
- Gate: Gym
- Focus: Hypertrophy (Build Muscle)
- Target Areas: Chest, Back, Shoulders, Arms (auto-filled, user customized)
- Equipment: Dumbbells, Barbells, Cables
- Frequency: 4 days/week
- Goals: Build Muscle, Improve Strength
- **Result:** 4-day per week muscle-building routine with 8-week progression

---

#### Mode 3: TRAIN/SPORTS (Program-Based)
**Use Case:** User training for specific sport or running goal

**Category Selection:**
- **Running:** Couch to 5K, 5K, 10K, Half Marathon, Marathon
- **Sports:** Soccer, Football, Basketball, Tennis, Cycling, Swimming, etc. (16 sports)

**Inputs:**
- **Training Category:** Running or Sports
- **Program Selection:** Based on category (e.g., "Marathon Training - 16 weeks")
- **Experience Level:** Beginner, Intermediate, Advanced
  - Each has description for clarity

**Program Details:**
- Each running program shows week duration
- Sport programs show sport icon and name
- Experience level affects intensity and progression

**Flow:**
```
Select training category (Running or Sports)
  ↓
IF Running:
  ├─ Choose running program (5K, 10K, Marathon, etc.)
  └─ Select experience level
  ↓
IF Sports:
  ├─ Choose sport from 16 options
  └─ Select experience level
  ↓
Generate sport-specific training plan
```

**Example (Running):**
- Category: Running
- Program: Marathon Training (16 weeks)
- Experience: Intermediate
- **Result:** 16-week marathon training plan with intermediate intensity

**Example (Sports):**
- Category: Sports
- Sport: Soccer
- Experience: Beginner
- **Result:** 8-week soccer conditioning program for beginners

---

### Step 3: Workout Generation & Display

**Service Call Triggered:**
```typescript
onGenerateWorkout(params) {
  // Sends all user selections to backend
  // Backend generates workout plan based on:
  // - Fitness level
  // - Mode (Quick/Routine/Train)
  // - All selected parameters
  // - User profile (height, weight, etc.)
}
```

**Backend Receives:**
```typescript
{
  mode: 'quick' | 'routine' | 'train',
  duration: 30,
  // Quick mode
  workoutType?: 'full_body',
  intensity?: 'moderate',
  equipment?: ['dumbbells'],
  // Routine mode
  equipmentGate?: 'gym',
  workoutFocus?: 'hypertrophy',
  targetAreas?: ['chest', 'back', 'shoulders'],
  repeatPerWeek?: 4,
  goalTags?: ['build_muscle'],
  // Train mode
  trainingCategory?: 'running',
  program?: 'marathon',
  experienceLevel?: 'intermediate'
}
```

**Response Structure:**
```typescript
{
  success: boolean,
  workout: {
    id: string,
    title: string,
    description: string,
    duration: number,
    exercises: Exercise[],
    schedule?: WorkoutSchedule,
    progression?: ProgressionPhase[]
  }
}
```

---

## 🎯 Key Features by Component

### FitnessLevelSelection (`FitnessLevelSelection.tsx`)
- **Displays:** 3 fitness levels with full details
- **Selectable:** Each level card is touchable
- **Visual Feedback:** Selected level has checkmark and highlighted border
- **Responsive:** Adapts layout for tablet (768px+)
- **Color Coded:** Each level has distinct color
- **Accessibility:** Clear descriptions and feature lists

### GoalSelection/V2 (`GoalSelection.tsx` & `GoalSelectionV2.tsx`)
- **Multi-Mode:** Supports Quick, Routine, Train modes
- **Collapsible Sections:** Each section expands/collapses
- **Auto-Population:** Target areas populate based on selections
- **Equipment Gating:** In Routine mode, equipment selection gates other options
- **Multi-Select:** Supports checkboxes for multiple target areas
- **Tag System:** Goal tags with max 2 selections
- **Real-Time Validation:** "Generate" button enabled/disabled based on selections
- **Natural Language:** Optional text input for custom goals
- **Conditional Rendering:** Different UI based on mode selection

### FitnessDashboardStyles (`FitnessDashboardStyles.ts`)
- **Extracted Styles:** Large stylesheet for performance
- **Responsive:** Tablet vs phone detection
- **Component Styles:**
  - Collapsible sections with icons
  - Chip/button patterns
  - Grid layouts for exercise selections
  - Card styles for equipment/goals
  - Color variants for states (selected, disabled, etc.)

---

## 📊 Data Relationships

### Equipment Gate Pattern (Routine Mode):
```
User selects: "Gym" gate
  ↓
Equipment dropdown appears with 10+ gym equipment options
  ↓
User selects: Dumbbells, Barbells
  ↓
Backend filters exercises available to use those equipment
  ↓
Generates routine only using selected equipment
```

### Target Area Auto-Population:
```
User selects: "Full Body" workout type (Quick mode)
  ↓
FitnessDashboard auto-sets: [chest, back, shoulders, arms, legs, glutes, core]
  ↓
User changes to "Upper Body"
  ↓
Auto-updates to: [chest, back, shoulders, arms]
  ↓
User can manually add/remove areas if desired
```

### Program Duration:
```
Running programs: "Marathon" = 16 weeks
Soccer program: "Soccer Training" = 8 weeks
```

---

## 🔌 Service Integration Points

### Called Services:
1. **WorkoutService** - Main service for generating workouts
   - `generateQuickWorkout(params)`
   - `generateRoutineWorkout(params)`
   - `generateSportWorkout(params)`

2. **HealthDataService** - Gets user fitness data
   - `getFitnessLevel()`
   - `getUserProfile()` (height, weight, etc.)

3. **AnalyticsService** - Tracks user selections
   - `trackWorkoutCreation(mode, parameters)`
   - `trackFitnessLevelSelection(levelId)`

4. **AuthService** - Validates user session
   - `verifyUserPermissions()`

---

## 🎨 UI/UX Patterns

### Collapsible Sections:
- Icon + Title + Badge count on header
- Click to expand/collapse smooth animation
- Content shows/hides with border styling

### Chip Selection:
- Rounded buttons with border
- Selected state: green background + green border
- Unselected state: gray background + gray border
- Text color changes on selection

### Equipment Gating:
- First choice: "Bodyweight" vs "Gym"
- If "Gym": Equipment selector appears below
- Creates progressive disclosure UI

### Target Area Grid:
- 2-column grid on mobile, 3-column on tablet
- Icons + labels
- Checkmarks on selected items
- Can auto-populate or be manually controlled

---

## 🚀 Generate Button Logic

**Button enabled when:**
```typescript
// Quick mode
hasWorkoutType && (hasDuration || true)

// Routine mode
hasEquipmentGate && hasWorkoutFocus && (hasTargetAreas || true)

// Train mode
hasTrainingCategory && hasProgram && (hasExperienceLevel || true)
```

**Button states:**
- **Enabled (Green):** User can tap to generate
- **Disabled (Gray):** Missing required selections
- **Loading:** Spinner shows during generation
- **Success:** Navigates to workout results

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ FITNESS DASHBOARD - COMPLETE WORKFLOW                   │
└─────────────────────────────────────────────────────────┘

START
  ↓
┌─ STEP 1: SELECT FITNESS LEVEL ─┐
│ - Choose: Beginner/Intermediate/Advanced
│ - See features & requirements
│ - Tap card to select
└────────────────────────────────┘
  ↓
┌─ STEP 2: SELECT WORKOUT MODE ─┐
│ ┌─────────────────────────────┐
│ │ QUICK MODE (Single Workout)
│ │ ├─ Choose workout type
│ │ ├─ Set intensity
│ │ ├─ Select equipment
│ │ └─ Set duration
│ └─────────────────────────────┘
│ ┌─────────────────────────────┐
│ │ ROUTINE MODE (Weekly Plan)
│ │ ├─ Choose equipment gate
│ │ ├─ IF gym: select equipment
│ │ ├─ Choose workout focus
│ │ ├─ Select target areas
│ │ ├─ Set frequency/week
│ │ └─ Add goal tags
│ └─────────────────────────────┘
│ ┌─────────────────────────────┐
│ │ TRAIN MODE (Sport Program)
│ │ ├─ Choose category
│ │ ├─ Select program
│ │ └─ Choose experience level
│ └─────────────────────────────┘
└────────────────────────────────┘
  ↓
┌─ STEP 3: GENERATE WORKOUT ─┐
│ - Validate selections
│ - Call backend API
│ - Show loading spinner
└────────────────────────────┘
  ↓
┌─ STEP 4: DISPLAY RESULTS ─┐
│ - Workout plan
│ - Exercise list with sets/reps
│ - Schedule (if routine/train)
│ - Save/Download options
└────────────────────────────┘
  ↓
END

USER CAN:
- Save workout to profile
- Download as PDF
- Share with coach
- Start workout immediately
- Go back and modify selections
```

---

## 📱 Responsive Behavior

| Screen Size | Behavior |
|------------|----------|
| **Mobile (<768px)** | Full-width cards, single column grids, horizontal scroll for options |
| **Tablet (768px+)** | Larger padding, multi-column grids, enhanced spacing, bigger touch targets |

---

## ⚡ Performance Optimizations

1. **Styles Extracted:** `FitnessDashboardStyles.ts` separates large stylesheet
2. **Collapsible Sections:** Only render expanded sections to reduce load
3. **Memoization:** Components memo-ized to prevent re-renders
4. **Lazy Loading:** Workout results load asynchronously
5. **Progressive Disclosure:** Equipment gate shows/hides sections based on selection

---

## 🔐 Validation

**Frontend Validations:**
- Fitness level selected before proceeding
- Mode-specific required fields filled
- Equipment gate selected in Routine mode
- At least one target area selected (if applicable)

**Backend Validations:**
- User fitness level matches data
- Equipment exists in system
- Target areas are valid
- Program duration is within reason
- User has necessary permissions

---

## 🎓 Summary

**What This Service Does:**
1. **Captures** user fitness level and preferences
2. **Supports** three distinct workout creation modes
3. **Auto-populates** derived data (e.g., target areas from focus)
4. **Validates** user selections before generation
5. **Integrates** with backend to generate customized plans
6. **Displays** results in structured format

**Key Innovation:** Progressive disclosure + auto-population = minimal user inputs for maximum specificity

**Best For:** Users who want workouts tailored to their exact situation (level, equipment, goals, sport)
