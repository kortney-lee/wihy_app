# Health Data Sync - Client Implementation Guide

**Service:** `user.wihy.ai`  
**Created:** 2026-01-22  
**Status:** ✅ Implemented & Deployed

---

## Overview

The backend now supports syncing health data from Apple HealthKit (iOS) and Google Health Connect (Android). This allows:
- Mobile apps to sync device health data to cloud
- Web dashboard to display user health metrics
- Coaches to monitor client health progress
- AI/ML services to use health data for personalization

---

## Quick Start

### 1. Sync Health Data from Mobile

```javascript
// After user login, sync health data
const response = await fetch('https://user.wihy.ai/api/users/me/health-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` // From login
  },
  body: JSON.stringify({
    source: Platform.OS === 'ios' ? 'apple_healthkit' : 'google_health_connect',
    deviceType: Platform.OS, // 'iphone' or 'android'
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recordedAt: '2026-01-22T00:00:00Z', // Device time when data was recorded
    metrics: {
      steps: 8432,
      distanceMeters: 6540.5,
      activeMinutes: 45,
      heartRateAvg: 72,
      sleepHours: 7.5,
      healthScore: 78
      // ... more metrics (all optional)
    }
  })
});

const result = await response.json();
// { success: true, data: { id, recordedAt, syncedAt } }
```

### 2. View Health Data on Web

```javascript
// Fetch last 7 days of health data
const response = await fetch(
  'https://user.wihy.ai/api/users/me/health-data?startDate=2026-01-15&endDate=2026-01-22',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const { data } = await response.json();
// data.records = [{ date: '2026-01-22', steps: 8432, ... }]
// data.summary = { avgSteps, avgSleepHours, trend: { steps: 'up' } }
```

---

## API Endpoints

### 1. POST /api/users/me/health-data
**Sync single day of health data**

### 2. POST /api/users/me/health-data/batch
**Batch sync multiple days (max 100 records)**

### 3. GET /api/users/me/health-data
**Get health data with date range**

### 4. GET /api/users/:userId/health-data
**Get health data for another user (coach/guardian access)**

### 5. GET /api/users/me/health-data/latest
**Get latest health summary for dashboard**

### 6. DELETE /api/users/me/health-data
**Delete health data (GDPR compliance)**

---

## Supported Metrics

All metrics are **optional**. Only include the ones available from the device.

See full documentation for complete list of 30+ supported metrics.

---

**Last Updated:** 2026-01-22
