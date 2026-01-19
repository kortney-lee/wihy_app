# FitnessDashboard - Deep Dive Architecture & Features

**Location:** `mobile/src/screens/FitnessDashboard.tsx`  
**Lines:** ~4,276 lines of comprehensive fitness program management  
**Complexity:** Advanced state management + API integration + real-time tracking

---

## 🎯 High-Level Purpose

The **FitnessDashboard** is a complete fitness program management and execution system that allows users to:
1. **Create** custom workout programs via multi-step wizard
2. **Schedule** and manage recurring workout routines
3. **Execute** workouts with real-time tracking
4. **Monitor** progress and achievements
5. **View** calendar of scheduled workouts
6. **Save** favorite programs for future use

---

## 🏗️ Component Architecture

### Master State Management
The dashboard manages **30+ state variables** organized into logical groups:

```
┌─────────────────────────────────────────────────────────┐
│ FITNESSDASHBOARD STATE ORGANIZATION                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. API DATA STATE (from backend)                        │
│    ├─ workout (today's workout)                         │
│    ├─ todayWorkouts (all workouts scheduled today)      │
│    ├─ scheduledWorkouts (calendar view of all programs) │
│    ├─ session (active workout session)                  │
│    ├─ programProgress (user's progress in current prog) │
│    ├─ userPrograms (all saved programs)                 │
│    └─ workoutHistory (past completed workouts)          │
│                                                          │
│ 2. LOADING/ERROR STATE                                  │
│    ├─ loading / refreshing                              │
│    ├─ error (display error messages)                    │
│    ├─ programsLoading / historyLoading                  │
│    └─ isGenerating (during workout creation)            │
│                                                          │
│ 3. GOAL SELECTION STATE (wizard)                        │
│    ├─ showGoalSelector (open/close wizard modal)        │
│    ├─ modalStep ('goals' | 'program' | 'preview')      │
│    ├─ selectedPerformanceGoals (multiple selection)     │
│    ├─ selectedBodyGoals (multiple selection)            │
│    ├─ selectedBodyParts (auto-populated, customizable)  │
│    ├─ selectedEquipment (what's available to user)      │
│    ├─ workoutDuration (15/20/30/45/60 min)              │
│    ├─ programDays (how many days per week)              │
│    ├─ goalText (natural language input)                 │
│    └─ isQuickWorkout (single session vs multi-week)     │
│                                                          │
│ 4. EXERCISE SELECTION STATE                             │
│    ├─ phaseId (e.g., 'foundation', 'strength')          │
│    ├─ levelId (beginner/intermediate/advanced)          │
│    ├─ dayId (which day of program to show)              │
│    ├─ viewMode ('simple' | 'detailed')                  │
│    └─ expandedSections (which sections visible)         │
│                                                          │
│ 5. ACTIVE WORKOUT STATE (during execution)              │
│    ├─ isWorkoutActive (workout in progress?)            │
│    ├─ workoutStartTime (when workout started)           │
│    ├─ elapsedTime (seconds elapsed)                     │
│    ├─ currentExerciseIndex (which exercise showing)     │
│    ├─ currentSet (which set of current exercise)        │
│    ├─ completedSets (array of logged sets)              │
│    ├─ restTimerActive (rest period between sets)        │
│    ├─ restTimeRemaining (seconds left)                  │
│    ├─ loggedReps / loggedWeight (user input)            │
│    └─ showWorkoutCompleteModal (finish screen)          │
│                                                          │
│ 6. UI/VIEW STATE                                        │
│    ├─ showGuide (help overlay)                          │
│    ├─ showWeather (weather display toggle)              │
│    ├─ weather (weather data from API)                   │
│    ├─ selectedDate (calendar date picker)               │
│    ├─ calendarMonth (current month view)                │
│    └─ showDeleteModal (confirm delete program)          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Key Features Breakdown

### Feature 1: Multi-Step Workout Creation Wizard

**Purpose:** Guide users through creating either a quick workout or full program

**Steps:**

#### Step 1: Goal Selection
```
User chooses from:
├─ Quick Workouts
│  ├─ Full Body (30 min)
│  ├─ Upper Body (20 min)
│  ├─ Lower Body (25 min)
│  ├─ Core (15 min)
│  ├─ Cardio (30 min)
│  └─ HIIT (20 min)
│
├─ Performance Goals (multi-select)
│  ├─ 5K Training
│  ├─ 10K Training
│  ├─ Half Marathon
│  ├─ Basketball
│  └─ [Sport-specific programs]
│
└─ Body Composition Goals (multi-select)
   ├─ Lose Weight
   ├─ Build Muscle
   ├─ Get Toned
   └─ Improve Strength
```

**Code Flow:**
```typescript
selectQuickGoal(goal)
  ├─ setSelectedBodyParts(goal.bodyParts)
  ├─ setWorkoutDuration(goal.duration)
  ├─ setIsQuickWorkout(true)  // Single workout, not multi-week
  └─ setGoalText(`${goal.label} workout`)

togglePerformanceGoal(goal)
  ├─ setIsQuickWorkout(false)  // This is a program
  ├─ addToSelectedPerformanceGoals(goal)
  ├─ updateBodyPartsFromGoals()
  └─ auto-populate target areas based on all selected goals
```

#### Step 2: Customization
```
User can customize:
├─ Target Body Parts
│  ├─ Chest, Back, Shoulders
│  ├─ Arms, Legs, Glutes, Core
│  └─ (Auto-filled based on goals, can be customized)
│
├─ Equipment Available
│  ├─ Dumbbells, Barbells
│  ├─ Machines, Cables, Resistance Bands
│  └─ Kettlebells, Medicine Balls
│
├─ Workout Duration
│  └─ 15, 20, 30, 45, 60 minutes
│
└─ Program Frequency (if not quick)
   └─ 2, 3, 4, 5, 6 days per week
```

#### Step 3: Program Preview
```
Backend generates program with:
├─ Warm-up exercises
├─ Main workout exercises (with sets/reps)
├─ Cool-down exercises
├─ Rest periods
├─ Progressive overload recommendations
└─ Schedule (if recurring program)
```

**API Call:**
```typescript
POST /api/fitness/programs/create
{
  mode: 'quick' | 'routine' | 'train',
  fitness_level: 'beginner' | 'intermediate' | 'advanced',
  duration: 30,
  goal_type: 'quick_workout' | 'strength' | 'hypertrophy',
  target_areas: ['chest', 'back', 'shoulders'],
  equipment: ['dumbbells', 'barbells'],
  days_per_week: 4,
  sport_category?: 'running' | 'sports',
  program_type?: 'marathon' | 'soccer',
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
}
```

---

### Feature 2: Program Management

**Purpose:** Save, organize, and manage all user's fitness programs

#### Load User Programs
```typescript
loadUserPrograms() {
  GET /api/fitness/programs/user
  ├─ Returns: [
  │    {
  │      program_id: 'prog_123',
  │      program_name: 'Strength Building',
  │      created_at: '2026-01-15',
  │      type: 'routine', // quick | routine | train
  │      status: 'active', // active | completed | paused
  │      current_week: 3,
  │      total_weeks: 8,
  │      days_per_week: 4,
  │      description: 'Personalized strength program',
  │      workout_ids: ['wkt_1', 'wkt_2', ...],
  │      next_workout: { id: 'wkt_1', date: '2026-01-18' }
  │    },
  │    ...
  │  ]
  └─ Cache for 5 minutes to avoid excessive API calls
}
```

#### Delete Program
```typescript
deleteProgram(programId) {
  1. Show confirmation modal with program name
  2. If confirmed:
     DELETE /api/fitness/programs/:programId
     ├─ Clear program cache
     ├─ Reload user programs
     └─ Remove from scheduled workouts calendar
```

#### Program Status Tracking
```
Each program has:
├─ Current Week / Total Weeks (e.g., 3 of 8)
├─ Completion Percentage
├─ Streak Days (consecutive days completed)
├─ Next Workout Date & Details
└─ Progressive Overload Recommendations
```

---

### Feature 3: Calendar View

**Purpose:** Visual overview of all scheduled workouts across programs

**Data Structure:**
```typescript
scheduledWorkouts = [
  {
    date: Date('2026-01-18'),
    workout: { /* workout details */ },
    programId: 'prog_123',
    programName: 'Strength Building'
  },
  {
    date: Date('2026-01-20'),
    workout: { /* workout details */ },
    programId: 'prog_123',
    programName: 'Strength Building'
  },
  ...
]
```

**Calendar Helper Functions:**
```typescript
getCalendarDays()
  └─ Returns array of dates for month grid (6 weeks x 7 days)

isWorkoutDay(date)
  ├─ Checks if date has scheduled workout
  ├─ Fallback: Mon/Wed/Fri (1,3,5)
  └─ Returns boolean

isRestDay(date)
  └─ Not a scheduled workout day

isToday(date)
  └─ Compares to current date

isPastDate(date)
  └─ Checks if date is in the past

isWorkoutCompleted(date)
  ├─ Checks workout history
  ├─ Mock: odd-numbered days = completed
  └─ Real: Check against completedWorkouts array

changeMonth(delta)
  └─ Navigate calendar forward/backward
```

**Visual Indicators:**
```
Calendar Cell Styles:
├─ TODAY: Blue background, larger date
├─ WORKOUT DAY: Green indicator
├─ REST DAY: Gray text
├─ COMPLETED: Green checkmark
├─ MISSED: Red X
└─ UPCOMING: Normal styling
```

---

### Feature 4: Workout Execution Engine

**Purpose:** Real-time tracking during active workout

#### Initialization
```typescript
handleStartSession() {
  1. Get current workout from displayed exercises
  2. Initialize session with:
     ├─ session_id
     ├─ user_id
     ├─ workout_id
     ├─ program_id
     ├─ start_time: now
     └─ exercises: []
  3. setIsWorkoutActive(true)
  4. setWorkoutStartTime(new Date())
  5. Show first exercise
}
```

#### Exercise Loop
```
┌─ Exercise N of M ─────────────────────┐
│                                        │
│ ┌─ Set 1 of 3 ────────────────┐      │
│ │ Exercise Name                │      │
│ │ 10-15 reps @ 25 lbs          │      │
│ │ [Input: Reps] [Input: Weight]│      │
│ │ [Log Set] [Skip Set]         │      │
│ └────────────────────────────────┘      │
│                                        │
│ REST: 60 seconds                       │
│ [Skip Rest] [Pause]                    │
│                                        │
└────────────────────────────────────────┘
```

**Set Logging:**
```typescript
logCompletedSet() {
  1. Parse loggedReps and loggedWeight
  2. Add to completedSets array:
     {
       exercise_id: 'ex_123',
       set: 1,
       reps: 12,
       weight: 25,
       timestamp: '2026-01-18T10:30:00Z'
     }
  3. Clear input fields
  4. If not last set:
     ├─ Start rest timer
     └─ Show countdown (60 seconds)
     else:
     ├─ Move to next exercise
     └─ Reset set counter
}
```

**Rest Timer:**
```typescript
Timer runs in useEffect:
├─ Decrements restTimeRemaining every 1 second
├─ Plays beep when 0
├─ Allows user to skip rest
└─ Auto-advances after countdown
```

#### Timer Management
```typescript
Elapsed Time Tracking:
├─ Updates every second while workout active
├─ Displays: MM:SS format
├─ Used for:
│  ├─ Workout duration
│  ├─ Achievement calculation
│  └─ API logging
└─ Stops when workout ends
```

---

### Feature 5: Achievement System

**Purpose:** Gamify workouts and motivate users

**Achievement Types:**

```typescript
First Workout Achievement
├─ Icon: 🎉
├─ Title: "Getting Started"
├─ Description: "You completed your first workout!"
└─ Color: Gold

Full Completion
├─ Icon: 💪
├─ Title: "All Done"
├─ Description: "Completed all exercises in this workout!"
└─ Color: Green

Streak Milestone (every 7 days)
├─ Icon: 🔥
├─ Title: "7-Day Streak"
├─ Description: "You've worked out 7 days straight!"
└─ Color: Red

Long Workout (45+ minutes)
├─ Icon: ⏱️
├─ Title: "Endurance Champion"
├─ Description: "You crushed a 45+ minute workout!"
└─ Color: Blue

calculateAchievements() {
  checks:
  ├─ if firstWorkout → add First Workout badge
  ├─ if allExercisesCompleted → add Full Completion badge
  ├─ if streakMilestone → add Streak badge
  └─ if workoutLong → add Endurance badge
}
```

---

### Feature 6: Workout Completion & Results

**Purpose:** Summarize performance and save data

#### Finalize Workout
```typescript
finishActiveWorkout() {
  1. Stop timer
  2. Calculate statistics:
     ├─ totalWeight = sum(weight × reps for all sets)
     ├─ totalReps = sum(reps for all sets)
     ├─ estimatedCalories = sets × 5 + (time_min × 4)
     └─ achievements = calculateAchievements()
  
  3. Try API call (if program_id available):
     POST /api/fitness/programs/:programId/workouts/:workoutId/complete
     {
       completed_at: timestamp,
       duration_seconds: elapsedTime,
       exercises_completed: completedSets,
       achievements: achievements,
       notes: optionalUserNotes
     }
  
  4. Show completion modal with:
     ├─ Duration: MM:SS
     ├─ Sets Completed: N
     ├─ Estimated Calories: XXX
     ├─ Achievements: [badges]
     └─ Actions: [Save] [Share] [Continue]
}
```

#### Results Modal
```
┌─ WORKOUT COMPLETE ────────────────┐
│                                    │
│ ⏱️  Duration: 45:32                │
│ 💪 Sets Completed: 12              │
│ 🔥 Estimated Calories: 280         │
│                                    │
│ ACHIEVEMENTS EARNED:               │
│ 🎉 Getting Started                 │
│ 💪 Full Completion                 │
│ 🔥 7-Day Streak                    │
│                                    │
│ [Save] [Share] [Next Workout]      │
└────────────────────────────────────┘
```

---

### Feature 7: Caching Strategy

**Purpose:** Optimize performance and reduce API calls

```typescript
CACHE_KEY_PREFIX = '@wihy_program_workouts_';
CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

getCachedProgramWorkouts(programId)
  ├─ Load from AsyncStorage with key: `${prefix}${programId}`
  ├─ Check timestamp: if > 5 min old, return null (expired)
  └─ Return: { workouts: [], timestamp: 1234567890 }

setCachedProgramWorkouts(programId, workouts)
  └─ Save to AsyncStorage with current timestamp

clearProgramCache(programId)
  └─ Delete cache entry for this program

Usage:
  loadProgramsToCalendar()
    ├─ For each program:
    │  ├─ Check cache first
    │  ├─ If stale/missing: fetch from API
    │  ├─ Parse workouts into calendar dates
    │  └─ Cache result
    └─ Build scheduledWorkouts array
```

**Cache invalidation:**
- Deleted when program is deleted
- Cleared on manual refresh
- Expires after 5 minutes
- Auto-reloaded on new app launch

---

### Feature 8: Natural Language Goal Input

**Purpose:** Allow users to describe goals in plain text

```typescript
goalText = "I want to build muscle and lose fat, focus on upper body"

generateWorkout(isQuick, durationOverride) {
  1. Create goals hash to prevent re-generation:
     hash = JSON.stringify({
       perfGoals: sorted array,
       bodyGoals: sorted array,
       bodyParts: sorted array,
       equipment: sorted array,
       duration,
       level,
       goalText,
       isQuick
     })
  
  2. If hash === lastGeneratedGoals && generatedProgram exists:
     └─ Use cached result (skip API call)
  
  3. Else:
     POST /api/fitness/programs/create
     {
       ...structured data,
       goal_description: goalText // Free text for AI analysis
     }
     └─ Backend uses NLP to enhance program
}
```

---

## 🔌 API Integrations

### Endpoints Called:

| Endpoint | Method | Purpose | Cache? |
|----------|--------|---------|--------|
| `/api/fitness/programs/user` | GET | Load all user programs | 5 min |
| `/api/fitness/programs/create` | POST | Generate new program | No |
| `/api/fitness/programs/:id` | DELETE | Remove program | No |
| `/api/fitness/programs/:id/workouts` | GET | Get program workouts | 5 min |
| `/api/fitness/programs/:id/workouts/:wid/complete` | POST | Log completion | No |
| `/api/fitness/programs/:id/progress` | GET | Get progress tracking | Real-time |
| `/api/fitness/daily-workouts` | GET | Get today's workouts | Real-time |
| `/api/fitness/history` | GET | Workout history | 1 day |
| `/api/weather` | GET | Get weather data | 1 hour |

---

## 📊 Data Flow Diagrams

### Workout Creation Flow
```
User Opens Dashboard
  ↓
Click "Create Workout"
  ↓
┌─ STEP 1: Select Goal ──────────────┐
│ - Choose quick or performance goal  │
│ - setSelectedPerformanceGoals([])   │
│ - setIsQuickWorkout(true/false)     │
└────────────────────────────────────┘
  ↓
┌─ STEP 2: Customize ────────────────┐
│ - Pick body parts (auto-populated)  │
│ - Select equipment available        │
│ - Set duration & frequency          │
│ - Add natural language notes        │
└────────────────────────────────────┘
  ↓
┌─ STEP 3: Generate ────────────────┐
│ - Create goals hash to check cache  │
│ - POST /api/fitness/programs/create │
│ - Get workout plan from backend     │
│ - Display preview with exercises    │
└───────────────────────────────────┘
  ↓
┌─ STEP 4: Preview ─────────────────┐
│ - Show all exercises (sets/reps)    │
│ - Display warm-up & cool-down       │
│ - Show recommended weights          │
│ - [Start Workout] button            │
└───────────────────────────────────┘
  ↓
Save to Programs or Start Immediately
```

### Workout Execution Flow
```
Click "Start Workout"
  ↓
Initialize Session
  ├─ setIsWorkoutActive(true)
  ├─ setWorkoutStartTime(now)
  └─ setCurrentExerciseIndex(0)
  ↓
Show Exercise 1
  ├─ Display: Name, Sets, Reps, Weight
  ├─ Show: Equipment, Muscle Groups
  └─ Wait for user to log sets
  ↓
User Logs Set
  ├─ Input: reps (e.g., 12)
  ├─ Input: weight (e.g., 25)
  ├─ Click "Log Set"
  ├─ Save to completedSets array
  └─ Clear inputs
  ↓
More Sets Left?
  ├─ YES: Start Rest Timer
  │  ├─ Count down 60 seconds
  │  ├─ Allow skip
  │  └─ Auto-advance to next set
  └─ NO: Go to Next Exercise
  ↓
More Exercises?
  ├─ YES: Repeat from "Show Exercise"
  └─ NO: Go to Finish
  ↓
Finish Workout
  ├─ Calculate stats (weight, reps, calories)
  ├─ Calculate achievements
  ├─ POST /api/fitness/programs/.../complete
  ├─ Show completion modal
  └─ Update program progress
```

---

## 🎨 View Modes

### Simple View
```
┌─ Exercise Name ─────────────────┐
│ 3 Sets × 10-12 Reps             │
│ 60s Rest                         │
│ [Tap to expand details]          │
└─────────────────────────────────┘
```

### Detailed View
```
┌─ Exercise Name ─────────────────┐
│                                  │
│ Fitness Load:                    │
│ ├─ Strength: ████░░░░ 60%       │
│ ├─ Cardio: ██░░░░░░░░ 20%       │
│ └─ Core: ███░░░░░░░░ 30%        │
│                                  │
│ Muscle Groups:                   │
│ ├─ Chest: 3/5                   │
│ ├─ Shoulders: 2/5               │
│ └─ Triceps: 2/5                 │
│                                  │
│ Prescription:                    │
│ ├─ Sets: 3                      │
│ ├─ Reps: 8-12                   │
│ ├─ Rest: 60 seconds             │
│ └─ Equipment: Dumbbells         │
│                                  │
└─────────────────────────────────┘
```

---

## 🔐 Session Management

**Session Tracking:**
```typescript
WorkoutSession {
  session_id: 'sess_abc123',
  user_id: 'user_xyz',
  workout_id: 'wkt_123',
  program_id: 'prog_456',
  start_time: '2026-01-18T10:00:00Z',
  exercises: [
    {
      exercise_id: 'ex_1',
      sets: [
        { set_num: 1, reps: 12, weight: 25 },
        { set_num: 2, reps: 10, weight: 30 },
        { set_num: 3, reps: 8, weight: 35 }
      ]
    }
  ],
  duration_seconds: 2532,
  end_time: '2026-01-18T10:42:12Z',
  completed: true
}
```

---

## 📱 Responsive Behavior

| Screen | Layout | Behavior |
|--------|--------|----------|
| Mobile (<768px) | Single column | Full-width cards, stacked exercises |
| Tablet (768px+) | Enhanced spacing | Larger touch targets, better proportions |

---

## ⚡ Performance Optimizations

1. **Memoization:** `useMemo` for expensive calculations
2. **Caching:** 5-minute cache for program workouts
3. **Lazy Loading:** Load weather only if toggled on
4. **Progressive Rendering:** Collapsible sections reduce initial load
5. **Efficient Timer:** Single interval for all countdown timers
6. **Batch Updates:** Load programs and history in parallel

---

## 🎓 Key Innovations

### 1. Multi-Selection Goals
- Users can combine multiple performance goals
- Target areas auto-populate from combined selections
- UI updates body parts in real-time

### 2. Equipment Gating
- Different workouts based on available equipment
- "Bodyweight only" vs "Gym access"
- Gracefully degrades when equipment unavailable

### 3. Smart Caching
- 5-minute cache prevents API hammer
- Hash-based change detection
- Automatic cache invalidation on delete

### 4. Progressive Disclosure
- Only show relevant options based on selections
- Collapsible sections hide complexity
- Step-by-step wizard reduces cognitive load

### 5. Real-Time Gamification
- Achievements calculated and shown immediately
- Streak tracking motivates consistency
- Visual progress indicators everywhere

---

## 🚀 Complete Feature Map

```
FITNESSDASHBOARD
│
├─ CREATION
│  ├─ Quick Workout (single session)
│  ├─ Routine Program (recurring)
│  ├─ Sport Training (program-based)
│  └─ AI Goal Interpretation (natural language)
│
├─ MANAGEMENT
│  ├─ Save Programs
│  ├─ Delete Programs
│  ├─ View All Programs
│  └─ Track Progress
│
├─ EXECUTION
│  ├─ Start Workout
│  ├─ Log Sets/Reps/Weight
│  ├─ Rest Timer
│  ├─ Real-time Elapsed Time
│  └─ Complete & Save
│
├─ TRACKING
│  ├─ Workout History
│  ├─ Calendar View
│  ├─ Progress Metrics
│  ├─ Achievements
│  └─ Streak Counter
│
├─ VISUALIZATION
│  ├─ Simple/Detailed Views
│  ├─ Calendar Grid
│  ├─ Scheduled Workouts
│  ├─ Weather Integration
│  └─ Day Picker
│
└─ OPTIMIZATION
   ├─ Caching (5 min)
   ├─ API Call Batching
   ├─ Responsive Design
   └─ Performance Tuning
```

---

## 📋 Summary

**FitnessDashboard is:**
- A **complete fitness program lifecycle manager**
- Featuring **3 workout modes** (Quick, Routine, Train)
- With **real-time execution tracking** and **achievement gamification**
- Backed by **smart caching** and **API integration**
- Optimized for **mobile and tablet** experiences
- Built with **30+ state variables** and **multiple view modes**

**It enables:**
- ✅ Custom workout creation
- ✅ Program scheduling and management
- ✅ Real-time exercise tracking
- ✅ Progress visualization
- ✅ Achievement rewards
- ✅ Intelligent performance optimization
