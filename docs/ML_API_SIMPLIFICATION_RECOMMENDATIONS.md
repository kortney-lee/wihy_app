# ML Backend API Simplification Recommendations

**For:** WIHY ML Backend Team  
**From:** Mobile Client Team  
**Date:** January 2026

---

## Current Pain Points

The client currently handles multiple inconsistencies that could be unified for easier integration.

---

## Issue 1: Inconsistent Request Field Names

### Problem
Different endpoints use different field names for the same concept:

| Endpoint | Field Name | Purpose |
|----------|------------|---------|
| `/ask` | `query` | User's question |
| `/chat/send-message` | `message` | User's question |
| `/chat/public` | `message` | User's question |

### Client Workaround
```typescript
// We have to build different request bodies per endpoint
const askBody = { query: text };           // /ask uses "query"
const chatBody = { message: text };        // /chat/* uses "message"
```

### Recommendation
**Standardize on `message` for all endpoints** (or `query` - just pick one):
```json
// ALL endpoints use same field
{ "message": "Is coffee healthy?" }
```

---

## Issue 2: Inconsistent Response Formats

### Problem
Different endpoints return different response structures:

**`/ask` Response:**
```json
{
  "response": "Coffee is healthy...",
  "type": "health_info",
  "confidence": 0.95,
  "recommendations": [...],
  "quick_insights": {...}
}
```

**`/chat/send-message` Response (ModalResponse):**
```json
{
  "assistantMessage": "Coffee is healthy...",
  "detectedIntent": "health_info",
  "actions": [...],
  "entities": [...],
  "traceId": "..."
}
```

### Client Workaround
```typescript
// We need two different parsers
private parseAskResponse(data) {
  return {
    response: data.response || data.assistantMessage,  // Different field!
    type: data.type || data.detectedIntent,           // Different field!
  };
}

private parseSendMessageResponse(data) {
  return {
    response: data.assistantMessage || data.response,
    type: data.detectedIntent || data.type,
  };
}
```

### Recommendation
**Unify response format across all endpoints:**
```json
{
  "success": true,
  "message": "Coffee is healthy...",
  "type": "health_info",
  "confidence": 0.95,
  "session_id": "sess-abc123",
  "metadata": {
    "cached": true,
    "processing_time_ms": 450,
    "trace_id": "abc-123"
  },
  "recommendations": [...],
  "citations": [...],
  "actions": [...],
  "entities": [...]
}
```

---

## Issue 3: Redundant Endpoints

### Problem
Three endpoints do essentially the same thing:

| Endpoint | Purpose | Session | Notes |
|----------|---------|---------|-------|
| `/ask` | Answer health questions | Optional | Primary endpoint |
| `/chat/public` | Answer health questions | No | Same as /ask without session? |
| `/chat/send-message` | Answer health questions | Required | Same but with session |

### Client Workaround
```typescript
// We have complex routing logic
if (isGuidedFlow) {
  response = await chatService.ask(text);           // Use /ask
} else if (sessionId) {
  response = await chatService.sendMessage(...);   // Use /chat/send-message
} else {
  // Fallback chain...
}
```

### Recommendation
**Consider consolidating to 2 endpoints:**

1. **`/ask`** - All queries (with optional session for context)
   ```json
   {
     "message": "Is coffee healthy?",
     "session_id": "optional",
     "user_id": "optional"
   }
   ```

2. **`/chat/history`** - Get history + session management
   ```
   GET /chat/sessions/{user_id}         → List sessions
   GET /chat/sessions/{session_id}      → Get history
   DELETE /chat/sessions/{session_id}   → Delete session
   ```

---

## Issue 4: Session ID in URL vs Body

### Problem
Some endpoints take IDs in URL, others in body:

```
GET  /chat/session/{session_id}/history    ← ID in URL
GET  /chat/user/{user_id}/sessions         ← ID in URL
POST /chat/send-message                    ← IDs in body
     { "session_id": "...", "user_id": "..." }
```

### Recommendation
**Be consistent - prefer IDs in URL for RESTful design:**
```
POST /chat/sessions/{session_id}/messages   ← ID in URL
GET  /chat/sessions/{session_id}/history    ← ID in URL
GET  /chat/users/{user_id}/sessions         ← ID in URL
```

---

## Issue 5: Field Name Casing

### Problem
Mixed snake_case and camelCase:

```json
{
  "session_id": "...",       // snake_case
  "sessionId": "...",        // camelCase (in /ask request)
  "user_id": "...",          // snake_case
  "assistantMessage": "...", // camelCase
  "processing_time_ms": 450  // snake_case
}
```

### Recommendation
**Pick one convention (snake_case is more common in Python APIs):**
```json
{
  "session_id": "...",
  "user_id": "...",
  "assistant_message": "...",
  "processing_time_ms": 450
}
```

---

## Summary: Ideal Unified API

If starting fresh, here's the ideal simplified API:

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ask` | POST | All health queries (with optional session) |
| `/sessions` | GET | List user's sessions |
| `/sessions/{id}` | GET | Get session history |
| `/sessions/{id}` | DELETE | Delete session |

### Request Format (all endpoints)
```json
{
  "message": "Is coffee healthy?",
  "session_id": "optional-for-context",
  "user_id": "optional-for-personalization"
}
```

### Response Format (all endpoints)
```json
{
  "success": true,
  "message": "Coffee is generally healthy...",
  "type": "health_info",
  "session_id": "sess-abc123",
  "confidence": 0.95,
  "cached": false,
  "metadata": {
    "processing_time_ms": 450,
    "trace_id": "abc-123"
  },
  "recommendations": ["Limit to 3-4 cups"],
  "citations": [{ "title": "...", "source": "..." }],
  "actions": [{ "type": "LOG_MEAL", "label": "Log this" }]
}
```

---

## Migration Path

If the ML backend wants to implement these changes:

1. **Phase 1:** Add `message` as alias for `query` in `/ask` (backward compatible)
2. **Phase 2:** Unify response format with `message` field (add alias)
3. **Phase 3:** Deprecate `/chat/public` (redirect to `/ask`)
4. **Phase 4:** Announce deprecation timeline for old field names

The client can handle aliases during transition:
```typescript
response: data.message || data.response || data.assistantMessage
```

---

## Questions for ML Team

1. Is `/chat/public` still needed if `/ask` supports anonymous requests?
2. Can we standardize on `message` for the request field?
3. Can we add `message` alias to the response (alongside `response`)?
4. What's the deprecation timeline for the old field names?
