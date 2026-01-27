# MyProgress API Requirements

## Base URL
```
https://user.wihy.ai/api/users/{userId}/progress
```

---

## 1. GET /api/users/{userId}/progress/summary

**Purpose:** Returns aggregated progress data for the dashboard header and progress cards.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `today`, `week`, `month` (default: `today`) |

### Response
```json
{
  "success": true,
  "summary": {
    "period": "today",
    "periodStart": "2026-01-27T00:00:00.000Z",
    "periodEnd": "2026-01-27T23:59:59.999Z",
    
    "progressCards": [
      {
        "id": "calories",
        "title": "Calories",
        "completed": 1450,
        "target": 2200,
        "unit": "kcal",
        "icon": "flame",
        "color": "#ef4444"
      },
      {
        "id": "protein",
        "title": "Protein",
        "completed": 85,
        "target": 120,
        "unit": "g",
        "icon": "nutrition",
        "color": "#f97316"
      },
      {
        "id": "workouts",
        "title": "Workouts",
        "completed": 1,
        "target": 1,
        "unit": "sessions",
        "icon": "fitness",
        "color": "#8b5cf6"
      },
      {
        "id": "hydration",
        "title": "Hydration",
        "completed": 6,
        "target": 8,
        "unit": "glasses",
        "icon": "water",
        "color": "#3b82f6"
      },
      {
        "id": "sleep",
        "title": "Sleep",
        "completed": 7.2,
        "target": 8,
        "unit": "hours",
        "icon": "moon",
        "color": "#6366f1"
      }
    ],
    
    "overallProgress": 72,
    "dayStreak": 5,
    "completedActions": 4,
    "totalActions": 6
  }
}
```

---

## 2. GET /api/users/{userId}/progress/weight

**Purpose:** Returns weight tracking history for charts and trends.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `week`, `month`, `3months`, `6months`, `year` (default: `month`) |
| `limit` | number | No | Max data points to return (default: 30) |

### Response
```json
{
  "success": true,
  "weight": {
    "current": 247.0,
    "starting": 255.0,
    "target": 200.0,
    "unit": "lbs",
    
    "change": {
      "amount": -8.0,
      "percentage": -3.1,
      "direction": "down",
      "periodLabel": "this month"
    },
    
    "history": [
      {
        "date": "2026-01-01",
        "weight": 255.0
      },
      {
        "date": "2026-01-07",
        "weight": 252.0
      },
      {
        "date": "2026-01-14",
        "weight": 250.0
      },
      {
        "date": "2026-01-21",
        "weight": 248.5
      },
      {
        "date": "2026-01-27",
        "weight": 247.0
      }
    ],
    
    "projectedGoalDate": "2026-06-15",
    "weeklyAvgLoss": 2.0
  }
}
```

---

## 3. POST /api/users/{userId}/progress/weight

**Purpose:** Log a new weight entry.

### Request Body
```json
{
  "weight": 246.5,
  "unit": "lbs",
  "date": "2026-01-27",
  "notes": "Morning weigh-in"
}
```

### Response
```json
{
  "success": true,
  "entry": {
    "id": "weight-123",
    "weight": 246.5,
    "unit": "lbs",
    "date": "2026-01-27T08:00:00.000Z",
    "notes": "Morning weigh-in",
    "createdAt": "2026-01-27T08:00:00.000Z"
  }
}
```

---

## 4. GET /api/users/{userId}/progress/actions

**Purpose:** Returns today's action items (tasks to complete).

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | ISO date (default: today) |

### Response
```json
{
  "success": true,
  "actions": [
    {
      "id": "action-1",
      "title": "Morning Workout",
      "description": "Complete your 30-minute HIIT routine",
      "type": "workout",
      "icon": "fitness",
      "completed": true,
      "completedAt": "2026-01-27T07:30:00.000Z",
      "scheduledTime": "07:00"
    },
    {
      "id": "action-2",
      "title": "Log Breakfast",
      "description": "Track your morning meal",
      "type": "meal",
      "icon": "restaurant",
      "completed": true,
      "completedAt": "2026-01-27T08:15:00.000Z",
      "scheduledTime": "08:00"
    },
    {
      "id": "action-3",
      "title": "Drink Water",
      "description": "Stay hydrated - 8 glasses daily",
      "type": "habit",
      "icon": "water",
      "completed": false,
      "progress": 6,
      "target": 8,
      "scheduledTime": null
    },
    {
      "id": "action-4",
      "title": "Log Lunch",
      "description": "Track your midday meal",
      "type": "meal",
      "icon": "restaurant",
      "completed": false,
      "scheduledTime": "12:00"
    },
    {
      "id": "action-5",
      "title": "Evening Walk",
      "description": "10,000 steps goal",
      "type": "workout",
      "icon": "walk",
      "completed": false,
      "progress": 6500,
      "target": 10000,
      "scheduledTime": "18:00"
    },
    {
      "id": "action-6",
      "title": "Log Dinner",
      "description": "Complete your food diary",
      "type": "meal",
      "icon": "restaurant",
      "completed": false,
      "scheduledTime": "19:00"
    }
  ],
  "summary": {
    "completed": 2,
    "total": 6,
    "percentage": 33
  }
}
```

---

## 5. PATCH /api/users/{userId}/progress/actions/{actionId}

**Purpose:** Toggle action completion status.

### Request Body
```json
{
  "completed": true
}
```

### Response
```json
{
  "success": true,
  "action": {
    "id": "action-3",
    "completed": true,
    "completedAt": "2026-01-27T14:30:00.000Z"
  }
}
```

---

## 6. GET /api/users/{userId}/progress/recommendations

**Purpose:** Returns AI-generated coach recommendations.

### Response
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Increase Protein Intake",
      "message": "You're averaging 85g protein daily. Try adding a protein shake post-workout to reach your 120g target.",
      "type": "nutrition",
      "priority": "high",
      "icon": "nutrition",
      "actionLabel": "View Meal Ideas",
      "actionRoute": "CreateMeals"
    },
    {
      "id": "rec-2",
      "title": "Great Workout Consistency!",
      "message": "You've completed 5 workouts this week. Keep up the momentum!",
      "type": "workout",
      "priority": "low",
      "icon": "fitness"
    },
    {
      "id": "rec-3",
      "title": "Hydration Reminder",
      "message": "You're 2 glasses behind your daily water goal. Drink up!",
      "type": "wellness",
      "priority": "medium",
      "icon": "water",
      "actionLabel": "Log Water",
      "actionRoute": "AddHydration"
    }
  ]
}
```

---

## 7. GET /api/users/{userId}/progress/hydration

**Purpose:** Returns hydration tracking for the day.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | ISO date (default: today) |

### Response
```json
{
  "success": true,
  "hydration": {
    "date": "2026-01-27",
    "current": 6,
    "target": 8,
    "unit": "glasses",
    "entries": [
      { "time": "07:00", "amount": 1 },
      { "time": "09:30", "amount": 1 },
      { "time": "11:00", "amount": 1 },
      { "time": "12:30", "amount": 1 },
      { "time": "14:00", "amount": 1 },
      { "time": "16:00", "amount": 1 }
    ],
    "weeklyAverage": 7.2
  }
}
```

---

## 8. POST /api/users/{userId}/progress/hydration

**Purpose:** Log water intake.

### Request Body
```json
{
  "amount": 1,
  "unit": "glasses",
  "time": "2026-01-27T17:00:00.000Z"
}
```

### Response
```json
{
  "success": true,
  "hydration": {
    "current": 7,
    "target": 8,
    "remaining": 1
  }
}
```

---

## 9. GET /api/users/{userId}/progress/macros

**Purpose:** Returns macro breakdown for charts.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `today`, `week`, `month` (default: `today`) |

### Response
```json
{
  "success": true,
  "macros": {
    "period": "today",
    "totals": {
      "calories": 1450,
      "caloriesTarget": 2200,
      "protein": 85,
      "proteinTarget": 120,
      "carbs": 150,
      "carbsTarget": 200,
      "fat": 55,
      "fatTarget": 70
    },
    "breakdown": {
      "protein": { "grams": 85, "calories": 340, "percentage": 23 },
      "carbs": { "grams": 150, "calories": 600, "percentage": 41 },
      "fat": { "grams": 55, "calories": 495, "percentage": 34 }
    },
    "dailyHistory": [
      {
        "date": "2026-01-27",
        "calories": 1450,
        "protein": 85,
        "carbs": 150,
        "fat": 55
      }
    ]
  }
}
```

---

## 10. GET /api/users/{userId}/progress/streaks

**Purpose:** Returns streak and consistency data.

### Response
```json
{
  "success": true,
  "streaks": {
    "currentDayStreak": 5,
    "longestDayStreak": 14,
    "weeklyConsistency": 85,
    "monthlyConsistency": 78,
    
    "achievements": [
      {
        "id": "streak-5",
        "title": "5 Day Streak",
        "icon": "flame",
        "earnedAt": "2026-01-27"
      }
    ],
    
    "calendar": {
      "month": "2026-01",
      "completedDays": [1, 2, 3, 5, 6, 7, 8, 10, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27],
      "partialDays": [4, 9, 11, 16, 17, 18, 19],
      "missedDays": []
    }
  }
}
```

---

## 11. GET /api/users/{userId}/progress/body-measurements

**Purpose:** Returns body measurement history.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `month`, `3months`, `6months`, `year` (default: `month`) |

### Response
```json
{
  "success": true,
  "measurements": {
    "latest": {
      "date": "2026-01-27",
      "waist": 38.5,
      "chest": 44.0,
      "hips": 42.0,
      "arms": 15.0,
      "thighs": 25.0,
      "unit": "inches"
    },
    "starting": {
      "date": "2026-01-01",
      "waist": 40.0,
      "chest": 44.5,
      "hips": 43.0,
      "arms": 14.5,
      "thighs": 26.0,
      "unit": "inches"
    },
    "changes": {
      "waist": { "amount": -1.5, "percentage": -3.75 },
      "chest": { "amount": -0.5, "percentage": -1.12 },
      "hips": { "amount": -1.0, "percentage": -2.33 },
      "arms": { "amount": 0.5, "percentage": 3.45 },
      "thighs": { "amount": -1.0, "percentage": -3.85 }
    },
    "history": [
      {
        "date": "2026-01-01",
        "waist": 40.0,
        "chest": 44.5,
        "hips": 43.0,
        "arms": 14.5,
        "thighs": 26.0
      },
      {
        "date": "2026-01-15",
        "waist": 39.0,
        "chest": 44.0,
        "hips": 42.5,
        "arms": 14.75,
        "thighs": 25.5
      },
      {
        "date": "2026-01-27",
        "waist": 38.5,
        "chest": 44.0,
        "hips": 42.0,
        "arms": 15.0,
        "thighs": 25.0
      }
    ]
  }
}
```

---

## 12. POST /api/users/{userId}/progress/body-measurements

**Purpose:** Log new body measurements.

### Request Body
```json
{
  "date": "2026-01-27",
  "measurements": {
    "waist": 38.5,
    "chest": 44.0,
    "hips": 42.0,
    "arms": 15.0,
    "thighs": 25.0
  },
  "unit": "inches"
}
```

### Response
```json
{
  "success": true,
  "entry": {
    "id": "measure-123",
    "date": "2026-01-27",
    "measurements": {
      "waist": 38.5,
      "chest": 44.0,
      "hips": 42.0,
      "arms": 15.0,
      "thighs": 25.0
    },
    "unit": "inches",
    "createdAt": "2026-01-27T10:00:00.000Z"
  }
}
```

---

## 13. GET /api/users/{userId}/progress/goals

**Purpose:** Returns user's active goals and progress toward them.

### Response
```json
{
  "success": true,
  "goals": {
    "activeGoal": "weight_loss",
    "targetWeight": 200,
    "targetDate": "2026-06-15",
    
    "available": [
      {
        "id": "weight_loss",
        "label": "Weight Loss",
        "formula": "Caloric Deficit",
        "icon": "trending-down",
        "color": "#ef4444",
        "isActive": true
      },
      {
        "id": "muscle_gain",
        "label": "Muscle Gain",
        "formula": "Caloric Surplus",
        "icon": "barbell",
        "color": "#f97316",
        "isActive": false
      },
      {
        "id": "body_recomposition",
        "label": "Body Recomp",
        "formula": "Maintenance",
        "icon": "body",
        "color": "#8b5cf6",
        "isActive": false
      },
      {
        "id": "maintenance",
        "label": "Maintenance",
        "formula": "Balanced",
        "icon": "shield-checkmark",
        "color": "#10b981",
        "isActive": false
      }
    ],
    
    "progress": {
      "overallProgress": 17,
      "weightLost": 8,
      "weightRemaining": 47,
      "daysActive": 27,
      "projectedCompletion": "2026-06-15"
    }
  }
}
```

---

## 14. PUT /api/users/{userId}/progress/goals

**Purpose:** Update user's active goal.

### Request Body
```json
{
  "activeGoal": "weight_loss",
  "targetWeight": 200,
  "targetDate": "2026-06-15"
}
```

### Response
```json
{
  "success": true,
  "goals": {
    "activeGoal": "weight_loss",
    "targetWeight": 200,
    "targetDate": "2026-06-15",
    "updatedAt": "2026-01-27T10:00:00.000Z"
  }
}
```

---

## Summary of Required Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/progress/summary` | Dashboard header & progress cards |
| 2 | GET | `/progress/weight` | Weight history for charts |
| 3 | POST | `/progress/weight` | Log new weight entry |
| 4 | GET | `/progress/actions` | Today's action items |
| 5 | PATCH | `/progress/actions/{id}` | Toggle action completion |
| 6 | GET | `/progress/recommendations` | AI coach recommendations |
| 7 | GET | `/progress/hydration` | Daily hydration tracking |
| 8 | POST | `/progress/hydration` | Log water intake |
| 9 | GET | `/progress/macros` | Macro breakdown for charts |
| 10 | GET | `/progress/streaks` | Streak & consistency data |
| 11 | GET | `/progress/body-measurements` | Body measurements history |
| 12 | POST | `/progress/body-measurements` | Log new measurements |
| 13 | GET | `/progress/goals` | User goals & progress |
| 14 | PUT | `/progress/goals` | Update active goal |

---

## Authentication

All endpoints require:
- Bearer token in `Authorization` header
- OR user ID in the URL path (already authenticated via session)

```
Authorization: Bearer {jwt_token}
```

---

## Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `NOT_FOUND` | 404 | User or resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SERVER_ERROR` | 500 | Internal server error |
