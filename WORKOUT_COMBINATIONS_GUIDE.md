# Workout Generation Combinations Guide

This document outlines all possible parameter combinations for generating workouts in the WIHY Fitness app using the unified `/api/fitness/quick-workout` endpoint. All 3 modes (Quick, Routine, Training) use this single endpoint.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Quick Mode Combinations](#quick-mode-combinations)
3. [Routine Mode Combinations](#routine-mode-combinations)
4. [Training Mode Combinations](#training-mode-combinations)
5. [Parameter Reference](#parameter-reference)
6. [Common User Personas](#common-user-personas)
7. [API Request Examples](#api-request-examples)

---

## API Overview

### Unified Endpoint

```
POST /api/fitness/quick-workout
```

All 3 workout modes use this single endpoint with different `mode` values:

| Mode | API Value | Purpose | Duration | Output |
|------|-----------|---------|----------|--------|
| **Quick** | `mode: "quick"` | Single workout for today | 15-60 min | 1 workout with segments |
| **Routine** | `mode: "routine"` | Multi-day weekly program | 15-60 min × days | Weekly schedule with workouts |
| **Training** | `mode: "training"` | Sport-specific workout | 15-60 min | Sport-optimized workout |

### Parameter Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALL MODES - COMMON PARAMS                    │
├─────────────────────────────────────────────────────────────────┤
│  user_id           →  Required: User identifier                 │
│  mode              →  "quick" | "routine" | "training"          │
│  workout_type      →  9 types (full_body, upper, lower, etc.)   │
│  intensity         →  "light" | "moderate" | "intense"          │
│  duration          →  15 | 20 | 30 | 45 | 60 minutes            │
│  fitness_level     →  "beginner" | "intermediate" | "advanced"  │
│  equipment         →  Array of equipment strings                │
│  equipmentPreset   →  Preset name (full_gym, home_gym, etc.)    │
│  muscleGroups      →  Array of muscle groups                    │
├─────────────────────────────────────────────────────────────────┤
│                    ROUTINE MODE ONLY                            │
├─────────────────────────────────────────────────────────────────┤
│  days_per_week     →  1-7 training days per week                │
│  goals             →  Array of goal strings                     │
├─────────────────────────────────────────────────────────────────┤
│                    TRAINING MODE ONLY                           │
├─────────────────────────────────────────────────────────────────┤
│  sport             →  Sport name (basketball, running, etc.)    │
│  training_phase    →  "off_season" | "pre_season" | "in_season" │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Mode Combinations

### Decision Tree

```
Quick Mode
    │
    ├─► Equipment Access
    │       │
    │       ├─► Bodyweight ────────────────────────────────────┐
    │       │                                                   │
    │       └─► Gym                                             │
    │               │                                           │
    │               ├─► Full Gym (API preset)                   │
    │               ├─► Basic (dumbbells, barbell, bench...)    │
    │               └─► Custom (select from library)            │
    │                                                           │
    ▼                                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Workout Type (required)                                        │
│  ─────────────────────────                                      │
│  • Full Body    • Upper Body    • Lower Body    • Core          │
│  • Cardio       • HIIT          • Strength      • Flexibility   │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Target Areas (optional, multi-select)                          │
│  ─────────────────────────────────────                          │
│  □ Chest    □ Back    □ Shoulders    □ Arms                     │
│  □ Legs     □ Glutes  □ Core                                    │
│                                                                 │
│  Note: Auto-populated based on Workout Type if not selected     │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Fitness Level (required)                                       │
│  ─────────────────────────                                      │
│  ○ Beginner      - Foundational movements, longer rest          │
│  ○ Intermediate  - Moderate complexity, standard rest           │
│  ○ Advanced      - Complex movements, shorter rest              │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Intensity (required)                                           │
│  ─────────────────────                                          │
│  ○ Light     - 90 second rest, lower rep ranges                 │
│  ○ Moderate  - 60 second rest, medium rep ranges                │
│  ○ Intense   - 30-45 second rest, higher rep ranges             │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Duration (required)                                            │
│  ─────────────────────                                          │
│  ○ 15 min    ○ 20 min    ○ 30 min    ○ 45 min    ○ 60 min      │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Mode Combination Count

| Parameter | Options | Count |
|-----------|---------|-------|
| Equipment Access | Bodyweight, Gym | 2 |
| Gym Preset (if Gym) | Full Gym, Basic, Custom | 3 |
| Workout Type | 8 types | 8 |
| Target Areas | 7 areas (127 combinations) | ~10 common |
| Fitness Level | 3 levels | 3 |
| Intensity | 3 levels | 3 |
| Duration | 5 options | 5 |

**Theoretical combinations**: 2 × 3 × 8 × 127 × 3 × 3 × 5 = **274,320**
**Practical combinations (90% coverage)**: ~2,160 (using 10 common target area combos)

### Top 20 Quick Mode Combinations (by popularity)

| # | Equipment | Type | Target | Level | Intensity | Duration |
|---|-----------|------|--------|-------|-----------|----------|
| 1 | Bodyweight | Full Body | All | Beginner | Moderate | 30 min |
| 2 | Bodyweight | Full Body | All | Intermediate | Moderate | 30 min |
| 3 | Bodyweight | HIIT | All | Beginner | Intense | 20 min |
| 4 | Bodyweight | Upper Body | Chest, Back, Arms | Beginner | Moderate | 30 min |
| 5 | Bodyweight | Lower Body | Legs, Glutes | Beginner | Moderate | 30 min |
| 6 | Bodyweight | Core | Core | Beginner | Moderate | 15 min |
| 7 | Full Gym | Full Body | All | Intermediate | Moderate | 45 min |
| 8 | Full Gym | Upper Body | Chest, Back, Shoulders | Intermediate | Moderate | 45 min |
| 9 | Full Gym | Lower Body | Legs, Glutes | Intermediate | Moderate | 45 min |
| 10 | Full Gym | Strength | All | Advanced | Intense | 60 min |
| 11 | Basic Gym | Full Body | All | Beginner | Moderate | 30 min |
| 12 | Basic Gym | Upper Body | Chest, Back, Arms | Intermediate | Moderate | 30 min |
| 13 | Bodyweight | Cardio | All | Beginner | Moderate | 20 min |
| 14 | Bodyweight | Full Body | All | Advanced | Intense | 30 min |
| 15 | Full Gym | HIIT | All | Intermediate | Intense | 30 min |
| 16 | Bodyweight | Flexibility | All | Beginner | Light | 15 min |
| 17 | Full Gym | Strength | Chest, Back | Advanced | Intense | 60 min |
| 18 | Bodyweight | Upper Body | Chest, Shoulders, Arms | Intermediate | Moderate | 20 min |
| 19 | Basic Gym | Lower Body | Legs, Glutes | Intermediate | Moderate | 30 min |
| 20 | Full Gym | Full Body | All | Beginner | Light | 30 min |

---

## Routine Mode Combinations

### Additional Parameters (beyond Quick)

```
Routine Mode = Quick Mode Parameters + 
    │
    ├─► Repeat Per Week (1-7 days)
    │       │
    │       ├─► 1 day/week  - Maintenance
    │       ├─► 2 days/week - Light routine
    │       ├─► 3 days/week - Standard (most popular)
    │       ├─► 4 days/week - Intermediate
    │       ├─► 5 days/week - Dedicated
    │       ├─► 6 days/week - Advanced
    │       └─► 7 days/week - Elite
    │
    └─► Goal Tags (multi-select)
            │
            ├─► Build Muscle
            ├─► Lose Fat
            ├─► Increase Strength
            ├─► Improve Endurance
            ├─► Enhance Flexibility
            └─► General Fitness
```

### Routine Mode Combination Count

| Parameter | Options | Count |
|-----------|---------|-------|
| All Quick Mode params | (from above) | 2,160 |
| Repeat Per Week | 7 options | 7 |
| Goal Tags | 6 tags (63 combinations) | ~6 common |

**Theoretical combinations**: 2,160 × 7 × 63 = **952,560**
**Practical combinations (90% coverage)**: ~9,072 (using common goal combos)

### Popular Routine Combinations

| # | Equipment | Type | Level | Days/Week | Goal | Duration |
|---|-----------|------|-------|-----------|------|----------|
| 1 | Bodyweight | Full Body | Beginner | 3 | General Fitness | 30 min |
| 2 | Full Gym | Full Body | Intermediate | 4 | Build Muscle | 45 min |
| 3 | Full Gym | Strength | Intermediate | 4 | Increase Strength | 60 min |
| 4 | Bodyweight | HIIT | Beginner | 3 | Lose Fat | 20 min |
| 5 | Full Gym | Full Body | Advanced | 5 | Build Muscle | 60 min |
| 6 | Bodyweight | Full Body | Beginner | 2 | General Fitness | 30 min |
| 7 | Basic Gym | Full Body | Intermediate | 3 | Build Muscle | 45 min |
| 8 | Bodyweight | Cardio | Beginner | 4 | Lose Fat | 30 min |
| 9 | Full Gym | Upper/Lower Split | Intermediate | 4 | Build Muscle | 45 min |
| 10 | Bodyweight | Flexibility | Beginner | 3 | Enhance Flexibility | 20 min |

### Split Routines (for 4+ days/week)

When users select 4+ days per week, the system can generate split routines:

| Days/Week | Split Type | Schedule |
|-----------|------------|----------|
| 4 | Upper/Lower | Upper - Lower - Rest - Upper - Lower - Rest - Rest |
| 4 | Push/Pull | Push - Pull - Rest - Push - Pull - Rest - Rest |
| 5 | PPL + Upper/Lower | Push - Pull - Legs - Upper - Lower - Rest - Rest |
| 6 | PPL × 2 | Push - Pull - Legs - Push - Pull - Legs - Rest |

---

## Training Mode Combinations

### Sport Selection

```
Training Mode
    │
    └─► Sport Selection (required)
            │
            ├─► Team Sports
            │       ├─► Football
            │       ├─► Basketball
            │       ├─► Soccer
            │       ├─► Baseball
            │       ├─► Hockey
            │       ├─► Volleyball
            │       └─► Lacrosse
            │
            ├─► Individual Sports
            │       ├─► Tennis
            │       ├─► Golf
            │       ├─► Swimming
            │       ├─► Track & Field
            │       ├─► Boxing/MMA
            │       └─► Cycling
            │
            └─► General Training
                    ├─► CrossFit
                    ├─► Powerlifting
                    └─► Bodybuilding
```

### Sport-Specific Target Areas (Auto-populated)

| Sport | Primary Target Areas | Secondary | Typical Intensity |
|-------|---------------------|-----------|-------------------|
| Football | Legs, Core, Shoulders | Chest, Back | Intense |
| Basketball | Legs, Core, Shoulders | Arms | Moderate-Intense |
| Soccer | Legs, Core, Glutes | Back | Moderate |
| Baseball | Core, Shoulders, Arms | Legs | Moderate |
| Tennis | Arms, Shoulders, Core | Legs | Moderate |
| Golf | Core, Back, Shoulders | Arms | Light-Moderate |
| Swimming | Back, Shoulders, Core | Arms, Legs | Moderate |
| Boxing/MMA | Core, Arms, Shoulders | Legs, Back | Intense |
| Track & Field | Legs, Glutes, Core | Arms | Moderate-Intense |
| CrossFit | All | All | Intense |
| Powerlifting | Legs, Back, Chest | Core, Arms | Intense |
| Bodybuilding | All (rotation) | All | Moderate-Intense |

### Training Mode Parameters

| Parameter | Options | Count |
|-----------|---------|-------|
| Sport | 16 sports | 16 |
| Equipment Access | Bodyweight, Gym | 2 |
| Gym Preset | 3 options | 3 |
| Fitness Level | 3 levels | 3 |
| Intensity | 3 levels | 3 |
| Duration | 5 options | 5 |
| Training Phase | Off-season, Pre-season, In-season | 3 |

**Theoretical combinations**: 16 × 2 × 3 × 3 × 3 × 5 × 3 = **12,960**
**Practical combinations (90% coverage)**: ~1,440 (common sport + level combos)

---

## Parameter Reference

### Workout Types

| Type | Description | Auto Target Areas | Best For |
|------|-------------|------------------|----------|
| `full_body` | Complete body workout | All muscle groups | General fitness, beginners |
| `upper_body` | Arms, chest, back, shoulders | chest, back, shoulders, arms | Upper focus days |
| `lower_body` | Legs, glutes, calves | legs, glutes | Lower focus days |
| `core` | Abs, obliques, lower back | core | Core stability |
| `cardio` | Heart-pumping endurance | legs, core | Endurance (auto-converts to walking for beginners) |
| `hiit` | High intensity intervals | All muscle groups | Fat loss, conditioning |
| `strength` | Heavy compound movements | chest, back, shoulders, legs | Building strength |
| `flexibility` | Stretching and mobility | All muscle groups | Recovery, mobility |
| `walking` | Simple walking cardio | legs | **Beginners**, recovery, low-impact |

### Equipment Presets

| Preset | Equipment Included |
|--------|-------------------|
| `bodyweight` | No equipment - bodyweight only |
| `basic` | dumbbells, bands |
| `home_gym` | dumbbells, barbell, bench, pull_up_bar, kettlebell |
| `home_gym_plus` | Well-equipped home gym |
| `full_gym` | All equipment including machines, squat rack, leg press |
| `weights_only` | Free weights - barbells, dumbbells, cables |
| `cardio_gym` | Cardio machines and light equipment |
| `crossfit_box` | Functional fitness equipment |
| `apartment` | Quiet, minimal space needed |
| `travel` | Portable equipment only |
| `outdoor` | Park and outdoor equipment |

### Gym-Specific Presets

| Preset | Description |
|--------|-------------|
| `planet_fitness` | Planet Fitness equipment (Smith machines, cables, no barbells) |
| `ymca` | YMCA/community gym equipment |
| `la_fitness` | LA Fitness standard equipment |

### Muscle Groups

| ID | Label | Icon |
|----|-------|------|
| `chest` | Chest | 💪 |
| `back` | Back | 🔙 |
| `shoulders` | Shoulders | 🎯 |
| `arms` | Arms (biceps + triceps) | 💪 |
| `legs` | Legs | 🦵 |
| `glutes` | Glutes | 🍑 |
| `core` | Core | 🎯 |

### Fitness Levels

| Level | Rest Modifier | Exercise Complexity | Rep Ranges |
|-------|--------------|---------------------|------------|
| `beginner` | +15 seconds | Basic movements only | 8-12 reps |
| `intermediate` | Standard | Moderate complexity | 8-15 reps |
| `advanced` | -15 seconds | Complex/compound | 6-20 reps |

### Intensities

| Intensity | Rest Between Sets | Calories/Min | HR Zone |
|-----------|------------------|--------------|---------|
| `light` | 90 seconds | ~5 | Zone 2 (60-70%) |
| `moderate` | 60 seconds | ~8 | Zone 3 (70-80%) |
| `intense` | 30-45 seconds | ~12 | Zone 4 (80-90%) |

### Duration Breakdowns

| Total | Warmup | Main | Cooldown |
|-------|--------|------|----------|
| 15 min | 2 min | 11 min | 2 min |
| 20 min | 3 min | 14 min | 3 min |
| 30 min | 4 min | 23 min | 3 min |
| 45 min | 5 min | 35 min | 5 min |
| 60 min | 7 min | 46 min | 7 min |

### Routine Mode - Goals

| Goal ID | Description |
|---------|-------------|
| `weight_loss` | Focus on calorie burn, cardio |
| `muscle_gain` | Hypertrophy-focused training |
| `endurance` | Build stamina and conditioning |
| `flexibility` | Mobility and stretching |
| `general_fitness` | Balanced overall fitness |
| `sports_performance` | Athletic performance |

### Training Mode - Sports

**Endurance Sports:**
- `running`, `swimming`, `cycling`, `triathlon`, `hiking`

**Team Sports:**
- `basketball`, `soccer`

**Racquet & Individual Sports:**
- `tennis`, `golf`, `rock_climbing`, `skiing`

**Strength & Conditioning:**
- `weightlifting`, `crossfit`, `yoga`, `martial_arts`

**General:**
- `general_fitness`

### Training Phases

| Phase | Focus | Volume |
|-------|-------|--------|
| `off_season` | Build base strength, address weaknesses | Higher |
| `pre_season` | Sport-specific preparation | Moderate |
| `in_season` | Maintain fitness, prioritize recovery | Lower |

---

## Common User Personas

### Persona 1: "Beginner Brian"
**Demographics**: New to fitness, no gym membership
**Typical Selections**:
- Equipment: Bodyweight
- Workout Type: Full Body
- Level: Beginner
- Intensity: Light to Moderate
- Duration: 20-30 min
- Mode: Quick (learning) → Routine (3x/week)

### Persona 2: "Intermediate Irene"
**Demographics**: 1-2 years experience, gym membership
**Typical Selections**:
- Equipment: Full Gym or Basic
- Workout Type: Varies (Upper/Lower split)
- Level: Intermediate
- Intensity: Moderate
- Duration: 45 min
- Mode: Routine (4x/week)
- Goals: Build Muscle, General Fitness

### Persona 3: "Advanced Alex"
**Demographics**: 3+ years experience, serious lifter
**Typical Selections**:
- Equipment: Full Gym
- Workout Type: Strength or Split
- Level: Advanced
- Intensity: Intense
- Duration: 60 min
- Mode: Routine (5-6x/week)
- Goals: Build Muscle, Increase Strength

### Persona 4: "Athlete Amy"
**Demographics**: Competitive sports player
**Typical Selections**:
- Equipment: Full Gym
- Sport: Basketball/Soccer/etc.
- Level: Intermediate to Advanced
- Intensity: Moderate to Intense
- Duration: 45-60 min
- Mode: Training
- Training Phase: Pre-season/In-season

### Persona 5: "Busy Bob"
**Demographics**: Limited time, home workouts
**Typical Selections**:
- Equipment: Bodyweight or Basic
- Workout Type: HIIT or Full Body
- Level: Any
- Intensity: Intense (maximize time)
- Duration: 15-20 min
- Mode: Quick or Routine (3x/week)
- Goals: Lose Fat, General Fitness

### Persona 6: "Recovery Rachel"
**Demographics**: Focus on mobility/flexibility
**Typical Selections**:
- Equipment: Bodyweight
- Workout Type: Flexibility
- Level: Any
- Intensity: Light
- Duration: 15-20 min
- Mode: Quick or Routine
- Goals: Enhance Flexibility

---

## API Request Examples

### Example 1: Quick Bodyweight Full Body (Beginner)
```json
POST /api/fitness/quick-workout
{
  "user_id": "user_123",
  "mode": "quick",
  "workout_type": "full_body",
  "equipment": ["none"],
  "fitness_level": "beginner",
  "intensity": "moderate",
  "duration": 30,
  "muscleGroups": ["chest", "back", "shoulders", "arms", "legs", "glutes", "core"]
}
```

### Example 2: Quick Full Gym Upper Body (Intermediate)
```json
POST /api/fitness/quick-workout
{
  "user_id": "user_123",
  "mode": "quick",
  "workout_type": "upper_body",
  "equipmentPreset": "full_gym",
  "fitness_level": "intermediate",
  "intensity": "moderate",
  "duration": 45,
  "muscleGroups": ["chest", "back", "shoulders", "arms"]
}
```

### Example 3: Routine - 3 Day Beginner Program
```json
POST /api/fitness/quick-workout
{
  "user_id": "user_123",
  "mode": "routine",
  "workout_type": "full_body",
  "equipment": ["none"],
  "fitness_level": "beginner",
  "intensity": "moderate",
  "duration": 30,
  "days_per_week": 3,
  "goals": ["general_fitness"]
}
```

### Example 4: Routine - 4 Day Muscle Building
```json
POST /api/fitness/quick-workout
{
  "user_id": "user_123",
  "mode": "routine",
  "workout_type": "full_body",
  "equipmentPreset": "full_gym",
  "fitness_level": "intermediate",
  "intensity": "moderate",
  "duration": 45,
  "days_per_week": 4,
  "goals": ["muscle_gain", "general_fitness"]
}
```

### Example 5: Training Mode - Basketball Pre-Season
```json
POST /api/fitness/quick-workout
{
  "user_id": "user_123",
  "mode": "training",
  "sport": "basketball",
  "training_phase": "pre_season",
  "equipmentPreset": "full_gym",
  "fitness_level": "intermediate",
  "intensity": "intense",
  "duration": 45
}
```

### Example 6: Training Mode - Running (5K Improvement)
```json
POST /api/fitness/quick-workout
{
  "user_id": "user_123",
  "mode": "training",
  "sport": "running",
  "training_phase": "pre_season",
  "fitness_level": "intermediate",
  "intensity": "moderate",
  "duration": 45
}
```

### Example 7: Quick HIIT Workout (Fat Loss)
```json
POST /api/fitness/quick-workout
{
  "user_id": "user_123",
  "mode": "quick",
  "workout_type": "hiit",
  "equipment": ["none"],
  "fitness_level": "beginner",
  "intensity": "intense",
  "duration": 20,
  "muscleGroups": ["chest", "back", "shoulders", "arms", "legs", "glutes", "core"]
}
```

---

## Response Structures

### Quick Mode Response

```json
{
  "success": true,
  "workout": {
    "workout_id": "qw_1704567890123_abc123",
    "user_id": "user_123",
    "title": "Moderate Full Body Blast",
    "subtitle": "30 min · Moderate intensity",
    "workout_type": "full_body",
    "intensity": {
      "level": "moderate",
      "label": "Moderate",
      "description": "Steady effort - challenging but sustainable"
    },
    "duration_minutes": 30,
    "equipment_used": ["Bodyweight"],
    "estimated_calories": 240,
    "mode": "quick",
    "segments": [
      {
        "phase": "warmup",
        "duration_minutes": 4,
        "exercises": [
          { "name": "March in Place", "duration_seconds": 60 },
          { "name": "Arm Circles", "duration_seconds": 30 }
        ]
      },
      {
        "phase": "main",
        "duration_minutes": 23,
        "exercises": [
          { "name": "Push-ups", "sets": 3, "reps": 12, "rest_seconds": 45 },
          { "name": "Squats", "sets": 3, "reps": 15, "rest_seconds": 45 }
        ]
      },
      {
        "phase": "cooldown",
        "duration_minutes": 3,
        "exercises": [
          { "name": "Quad Stretch", "duration_seconds": 30, "per_side": true }
        ]
      }
    ],
    "total_exercises": 15,
    "created_at": "2026-01-07T15:30:00.000Z"
  }
}
```

### Routine Mode Response

```json
{
  "success": true,
  "routine": {
    "routine_id": "rt_1704567890123_abc123",
    "title": "4-Day Upper/Lower Routine",
    "subtitle": "Intermediate · 45min sessions · Moderate intensity",
    "split_type": "upper_lower",
    "days_per_week": 4,
    "goals": ["muscle_gain", "general_fitness"],
    "goal_recommendations": [
      { "goal": "muscle_gain", "tip": "Focus on progressive overload. Increase weight or reps each week." }
    ],
    "weekly_schedule": [
      { "day": "Monday", "day_number": 1, "type": "upper_body", "workout": { "...full workout object..." } },
      { "day": "Tuesday", "day_number": 2, "type": "lower_body", "workout": { "...full workout object..." } },
      { "day": "Wednesday", "day_number": 3, "type": "rest", "workout": null },
      { "day": "Thursday", "day_number": 4, "type": "upper_body", "workout": { "...full workout object..." } },
      { "day": "Friday", "day_number": 5, "type": "lower_body", "workout": { "...full workout object..." } },
      { "day": "Saturday", "day_number": 6, "type": "rest", "workout": null },
      { "day": "Sunday", "day_number": 7, "type": "rest", "workout": null }
    ],
    "total_workouts": 4,
    "estimated_weekly_calories": 1200
  }
}
```

### Training Mode Response

```json
{
  "success": true,
  "workout": {
    "workout_id": "st_1704567890123_abc123",
    "title": "Basketball Training - Pre Season",
    "subtitle": "Basketball · 45min · Intense intensity",
    "sport": "basketball",
    "training_phase": "pre_season",
    "phase_description": "Sport-specific preparation and conditioning",
    "target_areas": ["legs", "core", "shoulders"],
    "training_focus": "Vertical jump, lateral quickness, endurance",
    "segments": [
      {
        "phase": "warmup",
        "exercises": [
          { "name": "Light Jog/March", "duration_seconds": 60 },
          { "name": "Dynamic Leg Swings", "duration_seconds": 30 }
        ]
      },
      {
        "phase": "main",
        "exercises": [
          { "name": "Jump Squats", "sets": 3, "reps": 10, "sport_relevance": "Key for basketball Vertical jump" },
          { "name": "Lateral Bounds", "sets": 3, "reps": 10, "sport_relevance": "Key for basketball Lateral quickness" }
        ]
      },
      {
        "phase": "cooldown",
        "exercises": [
          { "name": "Light Walking", "duration_seconds": 60 },
          { "name": "Legs Stretch", "duration_seconds": 30 }
        ]
      }
    ],
    "estimated_calories": 630
  }
}
```

---

## Combination Matrix (90% Coverage)

### Quick Mode - Core Combinations (36 scenarios)

| Equipment | Workout Type | Level | Intensity | Duration |
|-----------|--------------|-------|-----------|----------|
| Bodyweight | Full Body | Beginner | Light | 15/20/30 |
| Bodyweight | Full Body | Beginner | Moderate | 20/30 |
| Bodyweight | Full Body | Intermediate | Moderate | 30 |
| Bodyweight | Upper Body | Beginner/Int | Moderate | 20/30 |
| Bodyweight | Lower Body | Beginner/Int | Moderate | 20/30 |
| Bodyweight | Core | Any | Moderate | 15/20 |
| Bodyweight | HIIT | Beginner/Int | Intense | 15/20 |
| Bodyweight | Cardio | Any | Moderate | 20/30 |
| Full Gym | Full Body | Int/Adv | Moderate | 30/45/60 |
| Full Gym | Upper Body | Int/Adv | Moderate/Intense | 45/60 |
| Full Gym | Lower Body | Int/Adv | Moderate/Intense | 45/60 |
| Full Gym | Strength | Int/Adv | Intense | 45/60 |
| Basic Gym | Full Body | Beginner/Int | Moderate | 30/45 |
| Basic Gym | Upper Body | Beginner/Int | Moderate | 30 |

### Routine Mode - Core Combinations (24 scenarios)

| Equipment | Type | Level | Days | Goal | Duration |
|-----------|------|-------|------|------|----------|
| Bodyweight | Full Body | Beginner | 2/3 | General | 30 |
| Bodyweight | Full Body | Int | 3/4 | General | 30 |
| Bodyweight | HIIT | Any | 3 | Lose Fat | 20 |
| Full Gym | Full Body | Int | 3/4 | Build Muscle | 45 |
| Full Gym | Split | Int/Adv | 4/5 | Build Muscle | 45/60 |
| Full Gym | Strength | Adv | 4/5 | Strength | 60 |
| Basic Gym | Full Body | Beginner/Int | 3 | General | 30/45 |

### Training Mode - Core Combinations (16 scenarios)

| Sport Category | Equipment | Level | Phase |
|---------------|-----------|-------|-------|
| Team (Football/Basketball/Soccer) | Full Gym | Int/Adv | Pre/In-season |
| Individual (Tennis/Swimming) | Full Gym/Basic | Int | Any |
| Combat (Boxing/MMA) | Full Gym/Bodyweight | Int/Adv | Any |
| Strength (Powerlifting/CrossFit) | Full Gym | Int/Adv | Any |

---

## Summary Statistics

| Mode | Theoretical Combinations | 90% Coverage | Core Scenarios |
|------|-------------------------|--------------|----------------|
| Quick | 274,320 | 2,160 | 36 |
| Routine | 952,560 | 9,072 | 24 |
| Training | 12,960 | 1,440 | 16 |
| **Total** | **1,239,840** | **12,672** | **76** |

The 76 core scenarios cover approximately **90% of user requests**. The API should be optimized to handle these combinations efficiently while still supporting the full range of possibilities.

---

## Next Steps for Implementation

1. **Validate API Coverage**: Ensure `/api/fitness/quick-workout` handles all parameter combinations
2. **Add Routine/Training Endpoints**: If not using quick-workout for all modes
3. **Pre-compute Popular Workouts**: Cache the 76 core scenarios for faster response
4. **A/B Test UI**: Determine if users prefer guided (fewer options) or flexible (all options) selection
5. **Analytics Tracking**: Track actual usage to refine the "90% coverage" assumptions
