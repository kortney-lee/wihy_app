# Debug Logging System - Infrastructure Requirements

## Current State
Debug logs are currently stored in browser `localStorage` (max 10 sessions) and `sessionStorage` (current session). This works for development but has limitations:
- Limited storage (5-10MB per domain)
- Not accessible across devices
- Lost when clearing browser data
- No centralized monitoring

## Future: Dedicated Logging Tier

When ready to move to a production logging system, here's what you'll need:

---

## 1. Logging Service API

A dedicated microservice for debug log ingestion and retrieval.

### Endpoints Required

```
POST   /api/v1/debug-sessions
       - Create new debug session
       - Body: { sessionId, userAgent, platform, startTime, url }
       - Returns: { success, sessionId }

POST   /api/v1/debug-sessions/:id/logs
       - Batch upload logs for a session
       - Body: { logs: DebugLog[], timestamp }
       - Batches up to 50 logs per request
       - Returns: { success, logsReceived }

POST   /api/v1/debug-sessions/:id/close
       - Mark session as closed
       - Body: { endTime }
       - Returns: { success, sessionId, logCount }

GET    /api/v1/debug-sessions
       - List all sessions (paginated)
       - Query: ?limit=50&offset=0&platform=web&startDate=...
       - Returns: { sessions: DebugSession[], total, hasMore }

GET    /api/v1/debug-sessions/:id
       - Get specific session with all logs
       - Returns: { session: DebugSession, logs: DebugLog[] }

GET    /api/v1/debug-sessions/search
       - Search logs across sessions
       - Query: ?q=error&type=error&page=ProductView
       - Returns: { logs: DebugLog[], matches }

DELETE /api/v1/debug-sessions/:id
       - Delete session and logs (admin only)
       - Returns: { success, deleted }
```

---

## 2. Database Schema

PostgreSQL with JSONB support for flexible log data.

```sql
-- Debug Sessions Table
CREATE TABLE debug_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_agent TEXT,
  platform VARCHAR(50),
  start_url TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  log_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_debug_sessions_created_at ON debug_sessions(created_at DESC);
CREATE INDEX idx_debug_sessions_platform ON debug_sessions(platform);

-- Debug Logs Table (Partitioned by date for performance)
CREATE TABLE debug_logs (
  id BIGSERIAL,
  session_id UUID REFERENCES debug_sessions(id) ON DELETE CASCADE,
  timestamp VARCHAR(50),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  page VARCHAR(255),
  stack TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE debug_logs_2025_12 PARTITION OF debug_logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Indexes for fast queries
CREATE INDEX idx_debug_logs_session_id ON debug_logs(session_id);
CREATE INDEX idx_debug_logs_type ON debug_logs(type);
CREATE INDEX idx_debug_logs_created_at ON debug_logs(created_at DESC);
CREATE INDEX idx_debug_logs_page ON debug_logs(page);
CREATE INDEX idx_debug_logs_data ON debug_logs USING GIN (data);

-- Full-text search index for messages
CREATE INDEX idx_debug_logs_message_search ON debug_logs USING GIN (to_tsvector('english', message));
```

---

## 3. Client-Side Integration

The client library (`debugLogService.ts`) is already created and ready. Key features:

### Batching & Queueing
- Logs batched every 5 seconds OR when 50 logs accumulated
- Queues in memory if API is unavailable
- Retries failed uploads with exponential backoff
- Flushes remaining logs on page unload

### Session Management
- Creates session on first log with unique ID
- Associates all logs with session ID
- Closes session on page unload/navigation
- Preserves sessionId across pages in sessionStorage

### Usage Example
```typescript
import { debugLogService } from './services/debugLogService';

// Create session (auto-called on first log)
await debugLogService.createSession(sessionId);

// Queue logs (auto-batched)
debugLogService.queueLog({
  timestamp: '+0.123s',
  type: 'api',
  message: 'API call to /search',
  data: { query: 'health' },
  page: 'VHealthSearch'
}, sessionId);

// Flush immediately (on page unload)
await debugLogService.flush(sessionId);

// Close session
await debugLogService.closeSession(sessionId);
```

---

## 4. Data Retention & Cleanup

### Retention Policy
- **Hot Storage**: Last 7 days (fast queries)
- **Warm Storage**: 8-30 days (slower queries)
- **Archive**: 31-90 days (S3/blob storage)
- **Delete**: After 90 days

### Cleanup Job
```sql
-- Delete sessions older than 90 days (cascade deletes logs)
DELETE FROM debug_sessions 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive old logs to S3 before deletion
COPY (
  SELECT * FROM debug_logs 
  WHERE created_at < NOW() - INTERVAL '30 days'
) TO PROGRAM 'aws s3 cp - s3://wihy-debug-logs/archive/$(date +%Y-%m-%d).csv'
WITH CSV HEADER;
```

---

## 5. Infrastructure Requirements

### Compute
- **API Server**: 
  - Node.js 18+ or Python 3.11+
  - 2 CPU cores, 4GB RAM (handles ~1000 req/sec)
  - Auto-scaling for peak traffic
  
### Database
- **PostgreSQL 14+**
  - Minimum: 4GB RAM, 50GB SSD
  - Recommended: 8GB RAM, 100GB SSD
  - Enable JSONB indexing (GIN indexes)
  - Partition tables by month for performance

### Storage Estimates
- ~1KB per log entry
- ~100 logs per debug session
- ~100KB per session
- 10,000 sessions/day = ~1GB/day
- 30-day retention = ~30GB database storage

### Optional Components
- **Redis**: Rate limiting, session caching (2GB RAM)
- **S3/Blob Storage**: Long-term archive (cheap cold storage)
- **CDN**: Serve DebugFullScreen page globally
- **Monitoring**: Grafana + Prometheus for system health

---

## 6. Security & Privacy

### Authentication
- Require authentication to view debug logs
- Admin-only access for production sessions
- User can only view their own sessions (filter by userId)

### Data Protection
- Don't log sensitive data (passwords, tokens, PII)
- Sanitize user data before logging
- GDPR compliance: Allow users to delete their logs
- Encrypt data at rest and in transit (TLS 1.3)

### Rate Limiting
```typescript
// Rate limit: 100 log batches per minute per session
const rateLimit = {
  windowMs: 60000, // 1 minute
  max: 100,
  message: 'Too many logs, please slow down'
};
```

---

## 7. Monitoring & Alerting

### Metrics to Track
- Logs ingested per minute
- Average batch size
- Failed uploads (retry rate)
- Database size growth
- Query latency (p50, p95, p99)
- Top error types/pages

### Alerts
- Error log spike (>100/min)
- Database storage >80% full
- API latency >500ms p95
- Failed log uploads >10%

---

## 8. Migration Path

### Phase 1: Dual Mode (Current + Logging Tier)
1. Deploy logging service API
2. Update client to send logs to both localStorage AND API
3. Test with 10% of traffic
4. Monitor for issues

### Phase 2: API Primary
1. Increase to 100% of traffic
2. Keep localStorage as fallback
3. DebugFullScreen fetches from API first, localStorage second

### Phase 3: API Only
1. Remove localStorage writes
2. Keep sessionStorage for current session only
3. Full migration complete

---

## 9. Cost Estimates

### AWS Example (us-east-1)
- **ECS/Fargate**: $50/month (2 containers, 1GB each)
- **RDS PostgreSQL**: $100/month (db.t3.medium, 100GB)
- **S3 Archive**: $10/month (1TB archive, ~3 years)
- **Data Transfer**: $20/month
- **Total**: ~$180/month for 10K sessions/day

### Cheaper Alternatives
- **DigitalOcean**: $60/month (Droplet + Managed DB)
- **Render/Railway**: $40/month (combined)
- **Supabase**: $25/month (includes DB + storage)

---

## 10. Development Checklist

When you're ready to implement:

- [ ] Set up logging service repository
- [ ] Create database and run migrations
- [ ] Implement API endpoints
- [ ] Add authentication/authorization
- [ ] Add rate limiting
- [ ] Set up monitoring (Grafana/Datadog)
- [ ] Create cleanup cron job
- [ ] Update client to use API
- [ ] Update DebugFullScreen to fetch from API
- [ ] Test with small percentage of traffic
- [ ] Document API for team
- [ ] Set up alerting
- [ ] Create runbook for incidents

---

## Current Files to Update (When Ready)

1. **`client/src/services/debugLogService.ts`** - Already created, ready to use
2. **`client/src/components/debug/DebugOverlay.tsx`** - Update to send to API
3. **`client/src/pages/DebugFullScreen.tsx`** - Fetch sessions from API
4. **`server/routes/debugLogs.ts`** - Create API endpoints
5. **`server/migrations/007_debug_logs.sql`** - Create database tables

---

## Questions to Answer Before Implementation

1. **Volume**: How many debug sessions per day? (estimate 10K initially)
2. **Retention**: How long to keep logs? (recommend 30 days)
3. **Access**: Who needs access? (developers only, or customer support?)
4. **Budget**: What's the monthly budget for infrastructure? ($50-$200/month)
5. **Hosting**: Where to deploy? (AWS, DigitalOcean, Render, Railway?)
6. **Priority**: When needed? (low priority - current localStorage works fine)

---

**Current Status**: Using localStorage (perfect for development)  
**Next Step**: When needed, start with Phase 1 (deploy logging API)  
**Timeline**: No rush - implement when scaling requires it
