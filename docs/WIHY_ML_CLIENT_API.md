# WIHY ML Backend - Client API Documentation

**Base URL:** `https://ml.wihy.ai`  
**Version:** 2.0 (January 2026)  
**Client Implementation:** `mobile/src/services/chatService.ts`

---

## Quick Reference

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/ask` | POST | Universal health questions | Optional |
| `/chat/start-session` | POST | Start chat session | No |
| `/chat/send-message` | POST | Send message in session | No |
| `/chat/session/{id}/history` | GET | Get session history | No |
| `/chat/user/{id}/sessions` | GET | List user's sessions | No |
| `/chat/public` | POST | One-shot public chat | No |

---

## Authentication

All API requests support **optional authentication** via OAuth2 Bearer token. Anonymous access is allowed but rate-limited.

### Authenticated Requests
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
};
```

### Anonymous Requests (Rate-Limited)
```typescript
const headers = {
  'Content-Type': 'application/json',
  // No Authorization header = anonymous access
};
```

### Rate Limits
| Tier | Requests/Min |
|------|--------------|
| Anonymous | 10 |
| Authenticated | 100 |
| Premium | 500 |

---

## Core Endpoints

### 1. `/ask` - Universal Health Question

The primary endpoint for all health, nutrition, and food-related queries. Supports session continuity via optional `sessionId`.

**Request:**
```typescript
// chatService.ask(query, context?)
await chatService.ask('Is coffee healthy?');

// With session for follow-ups
await chatService.ask('What about decaf?', { session_id: 'sess-abc123' });
```

**Request Body:**
```json
{
  "query": "Is coffee healthy?",
  "sessionId": "optional-session-id",
  "user_context": {
    "user_id": "optional-user-id"
  }
}
```

**Response:**
```json
{
  "type": "health_info",
  "response": "Coffee is generally healthy in moderation...",
  "confidence": 0.95,
  "cached": true,
  "session_id": "sess-abc123",
  "success": true,
  "recommendations": [
    "Limit to 3-4 cups daily"
  ],
  "citations": [
    {
      "title": "Coffee consumption and health",
      "sourceType": "research",
      "author": "Poole R, et al.",
      "year": 2017
    }
  ],
  "quick_insights": {
    "health_score": 85,
    "processing_level": "Minimal",
    "frequency": "Daily OK"
  }
}
```

**TypeScript Response Type:**
```typescript
interface ChatResponse {
  success: boolean;
  response: string;
  type?: 'health_info' | 'meal_analysis' | 'barcode' | 'ingredient_analysis' | 'rag';
  confidence?: number;
  cached?: boolean;
  session_id?: string;
  recommendations?: string[];
  citations?: Array<{
    title: string;
    sourceType: string;
    author?: string;
    year?: number;
  }>;
  quick_insights?: {
    health_score?: number;
    processing_level?: string;
    frequency?: string;
  };
  created_resources?: CreatedResource[];
  suggested_actions?: SuggestedAction[];
}
```

---

### 2. `/chat/start-session` - Start Chat Session

Create a new chat session for multi-turn conversations.

**Request:**
```typescript
// chatService.startSession(userId)
const session = await chatService.startSession('user-123');
// session.session_id = 'sess-abc123def456'
```

**Request Body:**
```json
{
  "user_id": "user-123",
  "session_name": "Health Questions",
  "context": {
    "diet_preference": "vegetarian"
  }
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "sess-abc123def456",
  "created_at": "2026-01-19T10:30:00.000Z"
}
```

---

### 3. `/chat/send-message` - Send Chat Message

Send a message in an active session. Maintains conversation history server-side.

**Request:**
```typescript
// chatService.sendMessage(message, sessionId, userId, context?)
const response = await chatService.sendMessage(
  'What should I eat for breakfast?',
  'sess-abc123',
  'user-123'
);
```

**Request Body:**
```json
{
  "session_id": "sess-abc123def456",
  "user_id": "user-123",
  "message": "What should I eat for breakfast?"
}
```

**Response (ModalResponse format):**
```json
{
  "assistantMessage": "For a healthy breakfast, consider oatmeal...",
  "citations": [...],
  "actions": [
    {
      "type": "LOG_MEAL",
      "label": "Log this breakfast",
      "payload": { "meal": "oatmeal", "calories": 350 }
    }
  ],
  "entities": [
    { "type": "food", "id": "oatmeal", "label": "Oatmeal" }
  ],
  "traceId": "ae8b9b3a-1c7d-4c23-...",
  "conversationId": "sess-abc123def456",
  "mode": "chat",
  "detectedIntent": "meal_suggestion",
  "success": true
}
```

---

### 4. `/chat/session/{session_id}/history` - Get Chat History

Retrieve conversation history for a session.

**Request:**
```typescript
// chatService.getHistory(sessionId)
const messages = await chatService.getHistory('sess-abc123');
```

**Response:**
```json
{
  "success": true,
  "session_id": "sess-abc123def456",
  "messages": [
    {
      "role": "user",
      "content": "Is coffee healthy?",
      "timestamp": "2026-01-19T10:30:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Coffee is generally healthy...",
      "timestamp": "2026-01-19T10:30:01.000Z"
    }
  ],
  "total_messages": 2
}
```

---

### 5. `/chat/user/{user_id}/sessions` - List User Sessions

Get all chat sessions for a user.

**Request:**
```typescript
// chatService.getUserSessions(userId)
const sessions = await chatService.getUserSessions('user-123');
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "session_id": "sess-abc123",
      "title": "Health Questions",
      "created_at": "2026-01-19T10:00:00.000Z",
      "last_message_at": "2026-01-19T10:30:00.000Z",
      "message_count": 5
    }
  ],
  "total_sessions": 1
}
```

---

### 6. `/chat/public` - Public One-Shot Chat

For anonymous, one-shot queries without session management.

**Request Body:**
```json
{
  "message": "How much protein do I need daily?"
}
```

**Response:** Same as `/chat/send-message` (ModalResponse format)

---

## Client Implementation Guide

### Flow Selection

The client uses two distinct flows based on user context:

1. **Guided Flow** (Home screen → `/ask`)
   - Stateless, one-shot queries
   - No session required
   - Ideal for quick questions

2. **Conversation Flow** (Chat tab → `/chat/send-message`)
   - Multi-turn conversations
   - Session-based with history
   - Ideal for extended interactions

```typescript
// In FullChat.tsx
const isGuidedFlow = context?.type === 'search' || context?.type === 'verify';

if (isGuidedFlow) {
  // Use /ask endpoint
  response = await chatService.ask(text);
} else if (sessionId) {
  // Use /chat/send-message with session
  response = await chatService.sendMessage(text, sessionId, userId);
}
```

### Handling Created Resources

When `/ask` creates fitness programs or meal plans, navigate to the appropriate screen:

```typescript
if (response.created_resources) {
  response.created_resources.forEach(resource => {
    switch (resource.type) {
      case 'fitness_program':
        navigation.navigate('FitnessProgramDetails', { 
          programId: resource.id 
        });
        break;
      case 'meal_program':
        navigation.navigate('MealPlanDetails', { 
          planId: resource.id 
        });
        break;
    }
  });
}
```

### Handling Suggested Actions

Parse backend routes to React Navigation screens:

```typescript
const parseRouteToNavigation = (route: string) => {
  const parts = route.replace(/^\//, '').split('/');
  
  // /fitness/programs/{id}
  if (parts[0] === 'fitness' && parts[1] === 'programs' && parts[2]) {
    return { screen: 'FitnessProgramDetails', params: { programId: parts[2] } };
  }
  
  // /meals/programs/{id}
  if (parts[0] === 'meals' && parts[1] === 'programs') {
    return { screen: 'MealPlanDetails', params: { planId: parts[2] } };
  }
  
  return null;
};
```

---

## Error Handling

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | - |
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Refresh token |
| 404 | Not Found | Endpoint doesn't exist |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |

### 401 Handling with Token Refresh

```typescript
async function callWithRefresh(endpoint: string, body: object) {
  let response = await fetch(`${WIHY_API}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  });
  
  if (response.status === 401) {
    // Token expired - refresh and retry
    accessToken = await refreshToken();
    response = await fetch(`${WIHY_API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });
  }
  
  return response.json();
}
```

### Graceful Fallbacks

The chatService implements fallbacks for API failures:

```typescript
// In sendMessage - fallback to /ask if /chat/send-message fails
if (response.status === 404) {
  console.log('Chat API not available, falling back to /ask');
  return this.ask(message, context);
}

// In startSession - fallback to local session ID
if (response.status === 404) {
  const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return { session_id: localSessionId, ... };
}
```

---

## Response Caching

The `/ask` endpoint implements response caching for deterministic answers:

| Query Type | Cached | Example |
|------------|--------|---------|
| General health | ✅ Yes | "Is coffee healthy?" |
| Personal queries | ❌ No | "What did I eat today?" |
| Time-sensitive | ❌ No | "How many calories today?" |
| Action requests | ❌ No | "Log my breakfast" |

Check `response.cached` to know if a response came from cache.

---

## Deprecated Endpoints

These endpoints no longer exist and will return 404:

| Old Endpoint | Replacement |
|--------------|-------------|
| `/api/search/modal` | `/ask` |
| `/search/*` | `/ask` |
| `/api/chat/public/ask` | `/ask` |
| `/api/chat/start-session` | `/chat/start-session` |
| `/api/chat/send-message` | `/chat/send-message` |

---

## Files Reference

| File | Purpose |
|------|---------|
| `mobile/src/services/config.ts` | API endpoint configuration |
| `mobile/src/services/chatService.ts` | Chat API client implementation |
| `mobile/src/services/types.ts` | TypeScript interfaces |
| `mobile/src/screens/FullChat.tsx` | Chat screen using chatService |
| `mobile/src/screens/ChatHistoryScreen.tsx` | Session history screen |

---

## Changelog

### v2.0 (January 2026)
- Updated `/ask` to use `query` field (was `message`)
- Removed `/api` prefix from chat endpoints
- Added `/chat/public` for anonymous one-shot queries
- Added `cached` field to responses
- Added `quick_insights` to `/ask` responses
- Updated response parsing for ModalResponse format
