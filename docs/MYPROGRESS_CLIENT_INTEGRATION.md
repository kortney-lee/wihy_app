# MyProgress API Client Integration Guide

## Overview

The MyProgress API provides comprehensive user progress tracking, dashboard analytics, and goal management capabilities for the WIHY mobile and web applications. This API enables clients to build rich progress dashboards with real-time data, weight tracking, action items, and AI-powered recommendations.

## Base URL

```
https://user.wihy.ai/api/progress
```

## Authentication

All endpoints require JWT authentication with user identification:

**Required Headers:**
```http
Authorization: Bearer <jwt_token>
x-user-id: <user_uuid>
Content-Type: application/json
```

**Example Authentication Flow:**
```javascript
// 1. Login to get JWT token
const loginResponse = await fetch('https://auth.wihy.ai/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;
const userId = data.user.id;

// 2. Use token and userId for progress API calls
const headers = {
  'Authorization': `Bearer ${token}`,
  'x-user-id': userId,
  'Content-Type': 'application/json'
};
```

## API Endpoints

### 1. Progress Dashboard

**`GET /api/progress/dashboard`**

Returns aggregated progress data for the main dashboard interface including progress cards and trends.

**Query Parameters:**
- `user_id` (optional): User UUID (can also use x-user-id header)

**Response:**
```json
{
  "success": true,
  "summary": {
    "period": "today",
    "cards": {
      "calories": {
        "current": 1850,
        "target": 2200,
        "unit": "kcal"
      },
      "protein": {
        "current": 98,
        "target": 120,
        "unit": "g"
      },
      "workouts": {
        "current": 1,
        "target": 1,
        "unit": "sessions",
        "period": "today"
      },
      "hydration": {
        "current": 6,
        "target": 8,
        "unit": "glasses"
      },
      "sleep": {
        "current": 7.5,
        "target": 8,
        "unit": "hours"
      }
    },
    "trends": {
      "weight": {
        "current": 254.5,
        "change": -2.1,
        "period": "week"
      },
      "calories": {
        "average": 2050,
        "change": 5.2,
        "period": "week"
      },
      "workouts": {
        "total": 4,
        "change": 1,
        "period": "week"
      }
    }
  }
}
```

**Client Implementation:**
```javascript
const getDashboard = async () => {
  const response = await fetch(
    `https://user.wihy.ai/api/progress/dashboard?user_id=${userId}`,
    { headers }
  );
  return response.json();
};
```

### 2. Weight Tracking

#### Get Weight Data
**`GET /api/progress/weight`**

Returns current weight, target, trends, and historical data.

**Response:**
```json
{
  "success": true,
  "weight": {
    "current": 254.5,
    "target": 200,
    "unit": "lbs",
    "trend": "down",
    "changeThisWeek": -2.0,
    "history": [
      {
        "date": "2026-01-20",
        "weight": 257.2
      },
      {
        "date": "2026-01-21", 
        "weight": 256.8
      },
      {
        "date": "2026-01-27",
        "weight": 254.5
      }
    ]
  }
}
```

#### Log Weight Entry
**`POST /api/progress/weight`**

Records a new weight measurement.

**Request Body:**
```json
{
  "weight": 254.5,
  "notes": "Morning weigh-in after workout"
}
```

**Response:**
```json
{
  "success": true,
  "weight": {
    "current": 254.5,
    "loggedAt": "2026-01-27T20:41:45.155Z"
  }
}
```

**Client Implementation:**
```javascript
const logWeight = async (weight, notes) => {
  const response = await fetch('https://user.wihy.ai/api/progress/weight', {
    method: 'POST',
    headers,
    body: JSON.stringify({ weight, notes })
  });
  return response.json();
};
```

### 3. Action Items

**`GET /api/progress/actions`**

Returns daily action items/tasks with completion status.

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format (defaults to today)

**Response:**
```json
{
  "success": true,
  "actions": [
    {
      "id": "action-1",
      "title": "Drink 8 glasses of water",
      "description": "Stay hydrated throughout the day",
      "type": "hydration",
      "icon": "water",
      "completed": true,
      "completedAt": "2026-01-27T15:30:00Z",
      "scheduledTime": "09:00"
    },
    {
      "id": "action-2",
      "title": "Complete morning workout", 
      "description": "45 min strength training",
      "type": "workout",
      "icon": "fitness",
      "completed": false,
      "scheduledTime": "07:00"
    }
  ],
  "summary": {
    "completed": 1,
    "total": 2,
    "percentage": 50
  }
}
```

**Client Implementation:**
```javascript
const getActions = async (date = null) => {
  const url = new URL('https://user.wihy.ai/api/progress/actions');
  if (date) url.searchParams.append('date', date);
  url.searchParams.append('user_id', userId);
  
  const response = await fetch(url.toString(), { headers });
  return response.json();
};
```

### 4. AI Recommendations

**`GET /api/progress/recommendations`**

Returns personalized AI-generated coaching recommendations based on user progress.

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Increase Protein Intake",
      "message": "You're averaging 98g protein daily. Try adding a protein shake post-workout to reach your 120g target.",
      "type": "nutrition",
      "priority": "high",
      "icon": "nutrition",
      "actionLabel": "View Meal Ideas",
      "actionRoute": "CreateMeals"
    },
    {
      "id": "rec-2",
      "title": "Great Workout Consistency!",
      "message": "You've completed 4 workouts this week. Keep up the momentum!",
      "type": "workout",
      "priority": "low", 
      "icon": "fitness"
    }
  ]
}
```

**Recommendation Types:**
- `nutrition` - Diet and macro recommendations
- `workout` - Exercise and fitness guidance  
- `wellness` - Sleep, hydration, recovery tips
- `goal` - Goal progress and motivation

**Priority Levels:**
- `high` - Important actionable items
- `medium` - Helpful suggestions  
- `low` - Motivational/congratulatory messages

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `AUTHENTICATION_REQUIRED` - Missing or invalid JWT token
- `VALIDATION_ERROR` - Invalid request parameters
- `SERVER_ERROR` - Internal server error
- `NOT_FOUND` - Resource not found

**Client Error Handling:**
```javascript
const handleApiCall = async (apiCall) => {
  try {
    const response = await apiCall();
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    return response;
  } catch (error) {
    console.error('API Error:', error.message);
    // Handle error in UI (show toast, etc.)
    throw error;
  }
};
```

## React Native Integration Example

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';

const ProgressDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch(
        `https://user.wihy.ai/api/progress/dashboard?user_id=${userId}`,
        { headers: getAuthHeaders() }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.summary);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressCard = (title, data) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>
        {data.current}/{data.target} {data.unit}
      </Text>
    </View>
  );

  if (loading) return <Text>Loading...</Text>;

  return (
    <ScrollView>
      <Text style={styles.title}>My Progress</Text>
      
      {/* Progress Cards */}
      <View style={styles.cardsContainer}>
        {renderProgressCard('Calories', dashboardData.cards.calories)}
        {renderProgressCard('Protein', dashboardData.cards.protein)}
        {renderProgressCard('Workouts', dashboardData.cards.workouts)}
        {renderProgressCard('Hydration', dashboardData.cards.hydration)}
      </View>
      
      {/* Weight Trend */}
      <View style={styles.trendContainer}>
        <Text style={styles.trendTitle}>Weight Progress</Text>
        <Text style={styles.trendValue}>
          {dashboardData.trends.weight.current} lbs
          ({dashboardData.trends.weight.change > 0 ? '+' : ''}
          {dashboardData.trends.weight.change} this week)
        </Text>
      </View>
    </ScrollView>
  );
};
```

## Flutter Integration Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ProgressService {
  final String baseUrl = 'https://user.wihy.ai/api/progress';
  final Map<String, String> headers;

  ProgressService({required String token, required String userId}) 
    : headers = {
        'Authorization': 'Bearer $token',
        'x-user-id': userId,
        'Content-Type': 'application/json',
      };

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await http.get(
      Uri.parse('$baseUrl/dashboard'),
      headers: headers,
    );

    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> logWeight(double weight, String? notes) async {
    final response = await http.post(
      Uri.parse('$baseUrl/weight'),
      headers: headers,
      body: json.encode({
        'weight': weight,
        'notes': notes,
      }),
    );

    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> getActions() async {
    final response = await http.get(
      Uri.parse('$baseUrl/actions'),
      headers: headers,
    );

    return json.decode(response.body);
  }
}
```

## Testing

**Test with cURL:**
```bash
# Get JWT token
TOKEN=$(curl -s -X POST https://auth.wihy.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  jq -r '.data.token')

USER_ID=$(curl -s -X POST https://auth.wihy.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  jq -r '.data.user.id')

# Test dashboard
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-user-id: $USER_ID" \
     "https://user.wihy.ai/api/progress/dashboard"

# Test weight logging  
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-user-id: $USER_ID" \
     -H "Content-Type: application/json" \
     -d '{"weight": 180.5, "notes": "Morning weigh-in"}' \
     "https://user.wihy.ai/api/progress/weight"
```

**PowerShell Testing:**
```powershell
# Authenticate
$loginResponse = Invoke-RestMethod -Uri "https://auth.wihy.ai/api/auth/login" -Method POST -Body '{"email":"test@example.com","password":"password123"}' -ContentType "application/json"
$token = $loginResponse.data.token
$userId = $loginResponse.data.user.id
$headers = @{
  "Authorization" = "Bearer $token"
  "x-user-id" = $userId
  "Content-Type" = "application/json"
}

# Test dashboard
Invoke-RestMethod -Uri "https://user.wihy.ai/api/progress/dashboard" -Headers $headers

# Test weight tracking
Invoke-RestMethod -Uri "https://user.wihy.ai/api/progress/weight" -Headers $headers
```

## Rate Limiting

- **Rate Limit:** 100 requests per minute per user
- **Burst Limit:** 10 requests per 10 seconds
- **Headers:** Rate limit info included in response headers

## Best Practices

### Caching
- Cache dashboard data for 30 seconds
- Cache weight history for 5 minutes  
- Invalidate cache after POST operations

### Performance
- Use query parameters efficiently
- Batch related API calls when possible
- Implement optimistic updates for weight logging

### User Experience
- Show loading states during API calls
- Implement offline data persistence  
- Provide clear error messages
- Use pull-to-refresh for data updates

### Security
- Never log or store JWT tokens permanently
- Validate all user inputs before API calls
- Implement proper session management
- Use HTTPS for all requests

## Changelog

### v1.0.0 (2026-01-27)
- Initial MyProgress API release
- Dashboard summary endpoint
- Weight tracking (GET/POST)
- Action items management  
- AI recommendations system
- Complete authentication integration

## Support

For API support and questions:
- **Documentation:** This guide
- **Base URL:** `https://user.wihy.ai/api/progress`
- **Authentication:** JWT Bearer + x-user-id header
- **Status:** Production ready ✅

## Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard` | GET | Progress summary & cards |
| `/weight` | GET | Weight history & trends |
| `/weight` | POST | Log weight entry |
| `/actions` | GET | Daily action items |
| `/recommendations` | GET | AI coach recommendations |

All endpoints require JWT authentication and return JSON with `success` boolean.
