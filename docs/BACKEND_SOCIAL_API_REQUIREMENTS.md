# Social Service Client Requirements

## Overview
The `social-server.js` service handles notifications, messaging, and check-ins for the WIHY app.
Base URL: `https://services.wihy.ai` (via gateway) or port `8006` locally.

---

## 1. Push Notifications

### Register Device Token
Call on app launch and when token refreshes.

```typescript
// POST /api/notifications/token
const registerPushToken = async (token: string, platform: 'ios' | 'android' | 'web') => {
  const response = await fetch('/api/notifications/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      token,
      platform,
      user_id: currentUser.id // UUID
    })
  });
  return response.json();
};
```

### Deactivate Token (Logout)
```typescript
// DELETE /api/notifications/token
const deactivateToken = async (token: string) => {
  await fetch('/api/notifications/token', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ token })
  });
};
```

---

## 2. Notification Preferences

### Get Preferences
```typescript
// GET /api/notifications/preferences
interface NotificationPreferences {
  meal_reminders_enabled: boolean;
  meal_reminder_times: { breakfast: string; lunch: string; dinner: string };
  water_reminders_enabled: boolean;
  water_reminder_frequency: number; // minutes
  workout_reminders_enabled: boolean;
  workout_reminder_time: string; // "07:00"
  workout_reminder_days: string[]; // ["Mon", "Tue", ...]
  medication_reminders_enabled: boolean;
  sleep_reminders_enabled: boolean;
  coach_message_notifications: boolean;
  check_in_notifications: boolean;
  marketing_push: boolean;
}

const getPreferences = async (): Promise<NotificationPreferences> => {
  const response = await fetch('/api/notifications/preferences', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const { data } = await response.json();
  return data;
};
```

### Update Preferences
```typescript
// PUT /api/notifications/preferences
const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
  const response = await fetch('/api/notifications/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};
```

---

## 3. Reminders

### Create Reminder
```typescript
// POST /api/notifications/reminders
interface Reminder {
  type: 'meal' | 'water' | 'workout' | 'medication' | 'sleep' | 'weigh_in' | 'custom';
  title: string;
  message?: string;
  time: string; // "08:00" HH:MM format
  days: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  enabled?: boolean;
}

const createReminder = async (reminder: Reminder) => {
  const response = await fetch('/api/notifications/reminders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(reminder)
  });
  return response.json();
};
```

### Get User Reminders
```typescript
// GET /api/notifications/reminders
const getReminders = async (): Promise<Reminder[]> => {
  const response = await fetch('/api/notifications/reminders', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const { data } = await response.json();
  return data;
};
```

### Update/Delete Reminder
```typescript
// PUT /api/notifications/reminders/:id
// DELETE /api/notifications/reminders/:id
```

---

## 4. In-App Notifications

### Send Notification (Internal/Coach Use)
```typescript
// POST /api/notifications/send
interface SendNotification {
  user_id: string; // UUID
  type: 'message' | 'check_in' | 'reminder' | 'coach_invite' | 'system';
  title: string;
  message?: string;
  action_url?: string; // Deep link: "wihy://check-in/123"
  data?: Record<string, any>;
}
```

---

## 5. Messaging (Coach-Client Communication)

### Send Message
```typescript
// POST /api/communication/messages
interface SendMessage {
  recipient_id: string; // UUID
  message_text: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    name?: string;
  }>;
}

const sendMessage = async (recipientId: string, text: string) => {
  const response = await fetch('/api/communication/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      recipient_id: recipientId,
      message_text: text
    })
  });
  return response.json();
};
```

### Get Conversation Thread
```typescript
// GET /api/communication/threads/:userId/:otherUserId?limit=50
interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  attachments: any[];
  read_at: string | null;
  created_at: string;
}

const getConversation = async (otherUserId: string, limit = 50): Promise<Message[]> => {
  const response = await fetch(
    `/api/communication/threads/${currentUser.id}/${otherUserId}?limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  const { data } = await response.json();
  return data;
};
```

### Mark Messages Read
```typescript
// PUT /api/communication/conversations/:conversationId/read
const markAsRead = async (conversationId: string) => {
  await fetch(`/api/communication/conversations/${conversationId}/read`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};
```

---

## 6. Check-Ins (Coach Feature)

### Create Check-In (Coach)
```typescript
// POST /api/communication/check-ins
interface CheckIn {
  client_id: string; // UUID
  title: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'text' | 'number' | 'scale' | 'yesno';
    options?: string[];
  }>;
  scheduled_for?: string; // ISO date
}

const createCheckIn = async (checkIn: CheckIn) => {
  const response = await fetch('/api/communication/check-ins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      coach_id: currentUser.id,
      ...checkIn
    })
  });
  return response.json();
};
```

### Send Check-In
```typescript
// POST /api/communication/check-ins/:checkInId/send
const sendCheckIn = async (checkInId: string) => {
  await fetch(`/api/communication/check-ins/${checkInId}/send`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};
```

### Respond to Check-In (Client)
```typescript
// POST /api/communication/check-ins/:checkInId/respond
interface CheckInResponse {
  responses: Array<{ question_id: string; answer: string | number }>;
  mood_rating?: number; // 1-5
  energy_level?: number; // 1-5
  notes?: string;
}

const respondToCheckIn = async (checkInId: string, response: CheckInResponse) => {
  await fetch(`/api/communication/check-ins/${checkInId}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(response)
  });
};
```

### Get Client Check-Ins
```typescript
// GET /api/communication/check-ins/client/:clientId?status=SENT
const getMyCheckIns = async (status?: 'DRAFT' | 'SENT' | 'COMPLETED') => {
  const url = `/api/communication/check-ins/client/${currentUser.id}` + 
    (status ? `?status=${status}` : '');
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const { data } = await response.json();
  return data;
};
```

---

## 7. TypeScript Types Summary

```typescript
// Add to your types file
export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface NotificationPreferences {
  meal_reminders_enabled: boolean;
  meal_reminder_times: { breakfast: string; lunch: string; dinner: string };
  water_reminders_enabled: boolean;
  water_reminder_frequency: number;
  workout_reminders_enabled: boolean;
  workout_reminder_time: string;
  workout_reminder_days: string[];
  medication_reminders_enabled: boolean;
  sleep_reminders_enabled: boolean;
  coach_message_notifications: boolean;
  check_in_notifications: boolean;
  marketing_push: boolean;
}

export interface Reminder {
  id?: string;
  type: 'meal' | 'water' | 'workout' | 'medication' | 'sleep' | 'weigh_in' | 'custom';
  title: string;
  message?: string;
  time: string;
  days: string[];
  enabled: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  attachments: Attachment[];
  read_at: string | null;
  created_at: string;
}

export interface Attachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
}

export interface CheckIn {
  id: string;
  coach_id: string;
  client_id: string;
  title: string;
  questions: CheckInQuestion[];
  status: 'DRAFT' | 'SENT' | 'COMPLETED' | 'OVERDUE';
  due_date: string | null;
  sent_at: string | null;
}

export interface CheckInQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'scale' | 'yesno';
  options?: string[];
}

export interface CheckInResponse {
  responses: Array<{ question_id: string; answer: string | number }>;
  mood_rating?: number;
  energy_level?: number;
  notes?: string;
}
```

---

## 8. React Native Integration

### Push Notification Setup (Expo)
```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id'
  });

  // Register with backend
  await registerPushToken(
    token.data,
    Platform.OS as 'ios' | 'android'
  );

  return token.data;
};
```

### Deep Link Handling
```typescript
// Handle notification action_url deep links
const linking = {
  prefixes: ['wihy://'],
  config: {
    screens: {
      CheckIn: 'check-in/:id',
      Message: 'message/:conversationId',
      Reminder: 'reminder/:id',
    }
  }
};
```

---

## 9. Screen Mapping

| Screen | Endpoint | Notes |
|--------|----------|-------|
| Settings > Notifications | `GET/PUT /api/notifications/preferences` | Toggle switches |
| Reminders List | `GET /api/notifications/reminders` | CRUD reminders |
| Messages/Inbox | `GET /api/communication/threads/:u1/:u2` | Coach-client chat |
| Coach Check-Ins | `POST /api/communication/check-ins` | Coach creates |
| Client Check-Ins | `GET /api/communication/check-ins/client/:id` | Client responds |

---

## 10. Service Info

- **Service**: `wihy-social-service`
- **Port**: 8006
- **Gateway Path**: `/api/notifications/*`, `/api/communication/*`
- **Database**: `wihy_services` (PostgreSQL)
