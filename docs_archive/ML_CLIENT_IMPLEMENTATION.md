# WIHY ML Client Implementation Guide

## Production Endpoints

| Endpoint | URL |
|----------|-----|
| **ML Backend** | `https://ml.wihy.ai` |
| **API Docs** | `https://ml.wihy.ai/docs` |

---

## Quick Reference

| Use Case | Endpoint | Auth Required |
|----------|----------|---------------|
| Quick question (public) | `POST /api/chat/public/ask` | No |
| Quick question (protected) | `POST /ask` | Bearer Token |
| Conversation with history | `POST /api/chat/send-message` | Session ID |
| Start conversation | `POST /api/chat/start-session` | User ID |
| Get chat history | `GET /api/chat/session/{id}/history` | None |
| Get user sessions | `GET /api/chat/user/{id}/sessions` | None |

---

## Client Implementation

### chatService.ts Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `ask(message)` | `/api/chat/public/ask` | Stateless quick questions (WihyHomeScreen) |
| `startSession(userId)` | `/api/chat/start-session` | Start a new chat session |
| `sendMessage(message, sessionId, userId)` | `/api/chat/send-message` | Send message with history (FullChat) |
| `getHistory(sessionId)` | `/api/chat/session/{id}/history` | Get messages for a session |
| `getUserSessions(userId)` | `/api/chat/user/{id}/sessions` | List user's past sessions |

### Flow: WihyHomeScreen (Ask Mode)
```
User types question → POST /api/chat/public/ask → Display response
```

### Flow: FullChat (Chat Mode)
```
Open chat → startSession(userId) → Get session_id
User types → sendMessage(text, sessionId, userId) → Display response
Follow-up → sendMessage(text, sessionId, userId) → Display with context
```

### Request Format (Ask)
```json
{
  "message": "What are the health benefits of eggs?"
}
```

### Response Format (Ask)
```json
{
  "assistantMessage": "Eggs are packed with good stuff...",
  "success": true,
  "detectedIntent": "health_info",
  "mode": "ask",
  "traceId": "uuid",
  "processingTimeMs": 5648
}
```

### Request Format (Send Message)
```json
{
  "session_id": "9fc63efa-...",
  "user_id": "user-123",
  "message": "What about cholesterol?"
}
```

### Response Format (Send Message)
```json
{
  "assistantMessage": "Eggs do contain cholesterol...",
  "detectedIntent": "health_info",
  "service": "wihy_ai",
  "modal": {
    "type": "info",
    "title": "Eggs",
    "content": "...",
    "actions": []
  }
}
```

---

## Chat History

### ChatHistoryScreen
- Shows list of user's past chat sessions
- Accessible via history button in FullChat header
- Navigate to `ChatHistory` route
- Uses `getUserSessions(userId)` to load sessions
- Uses `getHistory(sessionId)` when resuming a session

### Session Management
- Sessions are created on first message in Chat tab
- Session ID stored in state for follow-up messages
- 30-minute timeout for inactive sessions (client-side)
- Server retains history for retrieval

---

## Intent Types

| Intent | Description |
|--------|-------------|
| `health_info` | General health questions |
| `nutrition_info` | Nutrition/calorie questions |
| `create_meal` | Meal planning |
| `log_food` | Food logging |
| `research_topic` | Research questions |
| `scan_barcode` | Product scanning |
| `fitness_advice` | Workout questions |
| `goals` | Goal setting |
