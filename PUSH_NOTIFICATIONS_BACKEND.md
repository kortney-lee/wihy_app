# Push Notifications Backend Requirements

**Last Updated:** January 2, 2026  
**Status:** Ready for Implementation  
**Mobile Client:** ✅ Complete (notificationService.ts implemented)

---

## Overview

The WIHY mobile app now has a complete notification service layer. This document outlines the backend endpoints and infrastructure needed to support push notifications.

## 📱 Mobile Implementation Status

### ✅ Completed (Mobile Side):
1. **NotificationService** (`src/services/notificationService.ts`)
   - Permission handling
   - Push token registration
   - Local notification scheduling
   - Event listeners
   - Preset notification helpers
   
2. **UI Integration**
   - Profile screen notification toggle
   - Permission request flow
   - Settings deep link support
   
3. **Packages Installed**
   - `expo-notifications` - Notification handling
   - `expo-device` - Device detection

---

## 🔴 Backend Requirements

### 1. Push Token Management

#### **Endpoint: POST /api/notifications/register-token**

Register a user's push notification token.

**Request:**
```json
{
  "userId": "user_abc123",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios" | "android",
  "deviceId": "iPhone 15 Pro"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token registered successfully"
}
```

**Database Schema:**
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(512) NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL, -- 'ios' or 'android'
  device_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_active (is_active)
);
```

**Implementation Notes:**
- Store multiple tokens per user (they may have multiple devices)
- Mark old tokens as inactive when new ones are registered for the same device
- Update `last_used_at` when notifications are successfully sent

---

#### **Endpoint: POST /api/notifications/unregister-token**

Unregister a push token (user logged out or disabled notifications).

**Request:**
```json
{
  "userId": "user_abc123",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token unregistered successfully"
}
```

**Implementation:**
- Set `is_active = false` instead of deleting (for audit trail)
- Don't send notifications to inactive tokens

---

### 2. Sending Push Notifications

You'll need to integrate with **Expo Push Notification Service** to send notifications to mobile clients.

#### **Expo Push API Integration**

**Endpoint:** `https://exp.host/--/api/v2/push/send`

**Authentication:** None required (Expo handles token validation)

**Request Format:**
```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Message from Coach",
  "body": "Great job on today's workout!",
  "data": {
    "type": "coach-message",
    "coachId": "coach_123",
    "clientId": "user_abc123"
  },
  "sound": "default",
  "badge": 1,
  "priority": "high",
  "channelId": "coach-messages" // Android only
}
```

**Batch Request (recommended for multiple users):**
```json
[
  {
    "to": "ExponentPushToken[token1]",
    "title": "Meal Reminder",
    "body": "Time for lunch!"
  },
  {
    "to": "ExponentPushToken[token2]",
    "title": "Meal Reminder",
    "body": "Time for lunch!"
  }
]
```

**Response:**
```json
{
  "data": [
    {
      "status": "ok",
      "id": "notification-id-123"
    }
  ]
}
```

**Error Responses:**
- `DeviceNotRegistered` - Token is invalid, remove from database
- `MessageTooBig` - Notification payload exceeds 4KB
- `MessageRateExceeded` - Sending too many notifications

---

### 3. Notification Scenarios

#### **Scenario 1: Coach Sends Message to Client**

**Trigger:** POST /api/coaching/messages

**Flow:**
1. Coach sends message via web/mobile dashboard
2. Backend receives message
3. Look up client's active push tokens
4. Send notification via Expo Push API
5. Store message in chat history

**Backend Code Example:**
```javascript
async function notifyClientOfCoachMessage(clientId, coachName, message) {
  // Get client's active tokens
  const tokens = await db.query(
    'SELECT token FROM push_tokens WHERE user_id = $1 AND is_active = true',
    [clientId]
  );
  
  // Prepare notifications
  const notifications = tokens.map(({ token }) => ({
    to: token,
    title: `Message from ${coachName}`,
    body: message.substring(0, 100), // Truncate long messages
    data: {
      type: 'coach-message',
      coachId: message.coachId,
      messageId: message.id,
    },
    sound: 'default',
    badge: 1,
    channelId: 'coach-messages', // Android
  }));
  
  // Send via Expo
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notifications),
  });
  
  return response.json();
}
```

---

#### **Scenario 2: Daily Meal Reminder (Scheduled)**

**Trigger:** Cron job at specific times (8am, 12pm, 6pm)

**Flow:**
1. Cron job runs at meal time
2. Query users with notifications enabled
3. Send meal reminder to all active users
4. Track sent notifications

**Cron Schedule:**
```
0 8,12,18 * * * /usr/bin/node send-meal-reminders.js
```

**Backend Code:**
```javascript
async function sendMealReminders(mealType, hour) {
  // Get all users who have notifications enabled
  const users = await db.query(`
    SELECT DISTINCT u.id, u.name, pt.token 
    FROM users u
    JOIN push_tokens pt ON pt.user_id = u.id
    JOIN user_preferences up ON up.user_id = u.id
    WHERE up.notifications = true 
    AND pt.is_active = true
  `);
  
  const notifications = users.map(({ token, name }) => ({
    to: token,
    title: `Time for ${mealType}! 🍽️`,
    body: `Don't forget to log your ${mealType} to stay on track`,
    data: {
      type: 'meal-reminder',
      mealType,
      hour,
    },
    sound: 'default',
    channelId: 'health-reminders',
  }));
  
  // Send in batches of 100 (Expo limit)
  for (let i = 0; i < notifications.length; i += 100) {
    const batch = notifications.slice(i, i + 100);
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    
    // Rate limiting - wait 1 second between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

#### **Scenario 3: Workout Reminder (User-Specific)**

**Trigger:** User sets workout time in app preferences

**Flow:**
1. User configures workout reminder time in mobile app
2. Mobile app calls backend to schedule notification
3. Backend stores reminder preference
4. Cron job checks every hour for scheduled reminders

**Endpoint: POST /api/notifications/schedule-reminder**

**Request:**
```json
{
  "userId": "user_abc123",
  "type": "workout",
  "hour": 17,
  "minute": 30,
  "enabled": true
}
```

**Database Schema:**
```sql
CREATE TABLE notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'workout', 'meal', 'hydration', 'weigh-in'
  hour INT NOT NULL CHECK (hour >= 0 AND hour < 24),
  minute INT NOT NULL CHECK (minute >= 0 AND minute < 60),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, type)
);
```

---

#### **Scenario 4: Scan Result Notification**

**Trigger:** AI analysis completes for product scan

**Flow:**
1. User scans product barcode/photo
2. Backend processes scan (may take 2-5 seconds)
3. When analysis complete, send push notification
4. User taps notification → opens app to results

**Backend Code:**
```javascript
async function notifyScanComplete(userId, scanResult) {
  const tokens = await getActiveTokens(userId);
  
  const emoji = scanResult.healthScore >= 80 ? '✅' : 
                scanResult.healthScore >= 60 ? '⚠️' : '❌';
  
  const notifications = tokens.map(token => ({
    to: token,
    title: `Scan Complete ${emoji}`,
    body: `${scanResult.productName} - Health Score: ${scanResult.healthScore}`,
    data: {
      type: 'scan-complete',
      scanId: scanResult.id,
      productName: scanResult.productName,
      healthScore: scanResult.healthScore,
    },
    sound: 'default',
    badge: 1,
  }));
  
  return sendPushNotifications(notifications);
}
```

---

### 4. Notification Preferences

#### **Endpoint: GET /api/notifications/preferences/:userId**

Get user's notification preferences.

**Response:**
```json
{
  "userId": "user_abc123",
  "enabled": true,
  "preferences": {
    "meals": {
      "enabled": true,
      "breakfast": { "hour": 8, "minute": 0 },
      "lunch": { "hour": 12, "minute": 30 },
      "dinner": { "hour": 18, "minute": 0 }
    },
    "workouts": {
      "enabled": true,
      "time": { "hour": 17, "minute": 30 }
    },
    "hydration": {
      "enabled": true,
      "interval": 120 // minutes
    },
    "coachMessages": {
      "enabled": true
    },
    "scanResults": {
      "enabled": true
    },
    "weeklyWeighIn": {
      "enabled": true,
      "weekday": 1, // Sunday
      "time": { "hour": 7, "minute": 0 }
    }
  }
}
```

#### **Endpoint: PUT /api/notifications/preferences/:userId**

Update notification preferences.

---

### 5. Analytics & Monitoring

Track notification effectiveness:

**Database Schema:**
```sql
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  token VARCHAR(512) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'failed', 'clicked'
  expo_id VARCHAR(255), -- Expo's notification ID
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_sent_at (sent_at),
  INDEX idx_status (status)
);
```

**Metrics to Track:**
- Delivery rate (sent vs delivered)
- Click-through rate (delivered vs clicked)
- Failure reasons
- Popular notification times
- Most engaged notification types

---

## 🔐 Security Considerations

1. **Token Validation**
   - Validate that tokens belong to the user making the request
   - Don't expose tokens in API responses
   
2. **Rate Limiting**
   - Limit notification frequency per user (max 10/hour)
   - Prevent spam from coaches
   
3. **Content Validation**
   - Sanitize notification content (no injection attacks)
   - Limit message length (4KB max for Expo)
   
4. **Privacy**
   - Don't send sensitive health data in notification body
   - Use deep links to show details in app

---

## 📊 Priority Implementation Order

### Phase 1: Foundation (Week 1)
1. ✅ Token registration endpoint
2. ✅ Expo Push API integration
3. ✅ Basic notification sending
4. ✅ Coach message notifications

### Phase 2: Scheduled Notifications (Week 2)
1. ❌ Meal reminder cron jobs
2. ❌ Workout reminder system
3. ❌ Hydration reminders
4. ❌ Notification preferences API

### Phase 3: Advanced Features (Week 3)
1. ❌ Scan result notifications
2. ❌ Analytics tracking
3. ❌ A/B testing for notification copy
4. ❌ Notification templates

---

## 🧪 Testing

### Manual Testing Checklist:
- [ ] Register token from iOS device
- [ ] Register token from Android device
- [ ] Send test notification via Expo Push Tool
- [ ] Verify notification appears in app foreground
- [ ] Verify notification appears when app is backgrounded
- [ ] Verify notification appears when app is killed
- [ ] Test notification tap opens correct screen
- [ ] Test unregister token on logout
- [ ] Test multiple devices for same user
- [ ] Test notification preferences toggle

### Automated Testing:
```javascript
// Example test
describe('Push Notifications', () => {
  it('should register token successfully', async () => {
    const response = await request(app)
      .post('/api/notifications/register-token')
      .send({
        userId: 'test_user',
        token: 'ExponentPushToken[test]',
        platform: 'ios',
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 📚 Resources

- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Tool](https://expo.dev/notifications) - Test sending notifications
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications) - iOS
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging) - Android
- [Notification Best Practices](https://docs.expo.dev/push-notifications/sending-notifications/#notification-payload)

---

## 💡 Future Enhancements

1. **Rich Notifications**
   - Images in notifications
   - Action buttons (e.g., "Log Meal", "Start Workout")
   
2. **Silent Push**
   - Update app data in background
   - Sync without showing notification
   
3. **Notification Channels** (Android)
   - Custom sounds per channel
   - User-controllable importance levels
   
4. **Smart Timing**
   - ML-powered send time optimization
   - Avoid sending during sleep hours
   
5. **Multi-language Support**
   - Localized notification content
   - Timezone-aware scheduling

---

**Questions?** Contact the mobile development team or refer to `src/services/notificationService.ts` for the complete client-side implementation.
