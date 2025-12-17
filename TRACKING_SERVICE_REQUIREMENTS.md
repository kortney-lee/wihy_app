# WIHY Tracking Service Requirements

## Overview
Backend service to support link tracking, analytics, and engagement dashboards for WIHY marketing and partner attribution.

---

## Database Schema

### `tracking_events` Table
```sql
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer VARCHAR(255) NOT NULL,
  campaign VARCHAR(255) NOT NULL,
  landing_page TEXT NOT NULL,
  original_source VARCHAR(255),
  destination_url TEXT,
  event_type VARCHAR(20) CHECK (event_type IN ('inbound', 'outbound')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address VARCHAR(45),
  session_id VARCHAR(255),
  
  INDEX idx_referrer (referrer),
  INDEX idx_campaign (campaign),
  INDEX idx_original_source (original_source),
  INDEX idx_timestamp (timestamp),
  INDEX idx_event_type (event_type)
);
```

### `tracking_users` Table (Admin Access)
```sql
CREATE TABLE tracking_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  
  INDEX idx_email (email)
);
```

### `partner_access` Table (Public Engagement Dashboard)
```sql
CREATE TABLE partner_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(255) UNIQUE NOT NULL,
  partner_name VARCHAR(255),
  email VARCHAR(255),
  access_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  INDEX idx_tracking_id (tracking_id),
  INDEX idx_access_token (access_token)
);
```

---

## API Endpoints

### Public Endpoints (No Auth Required)

#### `POST /api/tracking/capture`
Capture tracking events from client-side clicks

**Request Body:**
```json
{
  "referrer": "partner_john",
  "campaign": "facebook_nov_2024",
  "landingPage": "/about",
  "originalSource": "facebook_ad_campaign",
  "destinationUrl": "https://kickstarter.com/...",
  "eventType": "inbound" | "outbound",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "uuid-here"
}
```

#### `GET /api/tracking/engagement/:trackingId`
Public engagement dashboard for partners/marketers

**Query Parameters:**
- `token` (optional) - Access token for private stats

**Response:**
```json
{
  "trackingId": "partner_john",
  "totalClicks": 1250,
  "totalConversions": 340,
  "conversionRate": 27,
  "topCampaigns": [
    { "campaign": "facebook_nov", "clicks": 450 },
    { "campaign": "instagram_story", "clicks": 320 }
  ],
  "destinations": [
    { "name": "Kickstarter", "clicks": 280 },
    { "name": "Instagram", "clicks": 60 }
  ],
  "recentActivity": [
    {
      "timestamp": "2024-12-16T10:30:00Z",
      "campaign": "facebook_nov",
      "destination": "Kickstarter",
      "eventType": "outbound"
    }
  ],
  "clicksByDay": [
    { "date": "2024-12-16", "clicks": 45 },
    { "date": "2024-12-15", "clicks": 52 }
  ]
}
```

---

### Protected Endpoints (Require Authentication)

#### `POST /api/auth/login`
Admin login for tracking dashboard access

**Request Body:**
```json
{
  "email": "admin@wihy.ai",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "admin@wihy.ai",
    "role": "admin"
  }
}
```

#### `GET /api/tracking/stats`
Admin tracking dashboard - aggregated statistics

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "totalEvents": 5000,
  "byReferrer": {
    "partner_john": 1250,
    "partner_sarah": 890
  },
  "byCampaign": {
    "facebook_nov": 1500,
    "instagram_story": 980
  },
  "byLandingPage": {
    "/about": 2300,
    "/": 1800
  },
  "recent": [
    {
      "referrer": "partner_john",
      "campaign": "facebook_nov",
      "timestamp": "2024-12-16T10:30:00Z",
      "landingPage": "/about",
      "originalSource": "facebook",
      "destinationUrl": "https://kickstarter.com/...",
      "eventType": "outbound"
    }
  ]
}
```

#### `GET /api/tracking/referrer/:referrerId`
Admin tracking dashboard - specific referrer details

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "referrerId": "partner_john",
  "totalClicks": 1250,
  "campaigns": {
    "facebook_nov": 450,
    "instagram_story": 320
  },
  "events": [
    {
      "id": "uuid",
      "campaign": "facebook_nov",
      "timestamp": "2024-12-16T10:30:00Z",
      "landingPage": "/about",
      "eventType": "inbound"
    }
  ]
}
```

#### `POST /api/tracking/partner/create`
Create partner access for engagement dashboard

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "trackingId": "partner_john",
  "partnerName": "John Smith",
  "email": "john@example.com",
  "expiresInDays": 365
}
```

**Response:**
```json
{
  "success": true,
  "trackingId": "partner_john",
  "accessToken": "generated_token_here",
  "dashboardUrl": "https://wihy.ai/engagement/partner_john?token=generated_token_here",
  "expiresAt": "2025-12-16T10:30:00Z"
}
```

#### `GET /api/tracking/partners`
List all partner access records

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "partners": [
    {
      "id": "uuid",
      "trackingId": "partner_john",
      "partnerName": "John Smith",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "isActive": true
    }
  ]
}
```

---

## Authentication & Authorization

### Admin Dashboard Access
- **Method:** JWT-based authentication
- **Token Storage:** HTTP-only cookies or localStorage
- **Token Expiry:** 24 hours
- **Refresh:** Automatic refresh with valid session

### Partner/Engagement Dashboard Access
- **Method:** Optional token-based access for private stats
- **Public Access:** Basic stats visible without token
- **Private Access:** Detailed stats require valid access token
- **Token Format:** Long-lived (365 days default)

---

## Security Requirements

1. **Rate Limiting:**
   - `/api/tracking/capture`: 100 requests/minute per IP
   - `/api/tracking/engagement/:trackingId`: 30 requests/minute per IP
   - Admin endpoints: 50 requests/minute per user

2. **Data Validation:**
   - Sanitize all input parameters
   - Validate tracking IDs (alphanumeric, underscore, hyphen only)
   - Validate URLs for destination tracking

3. **CORS Configuration:**
   - Allow `https://wihy.ai` and `https://*.wihy.ai`
   - Allow `http://localhost:3000` for development

4. **Privacy:**
   - Hash IP addresses for storage
   - Anonymize user agents after 90 days
   - GDPR-compliant data retention (configurable)

---

## Data Retention Policy

- **Active Events:** Retain indefinitely for analytics
- **Anonymization:** After 90 days, remove IP and user agent details
- **Partner Access Tokens:** Expire after configured period (default 365 days)
- **Session Data:** Clear after 24 hours of inactivity

---

## Performance Requirements

- **Response Time:** < 100ms for capture endpoint
- **Response Time:** < 500ms for analytics endpoints
- **Concurrent Users:** Support 1000+ simultaneous tracking captures
- **Database:** PostgreSQL with read replicas for analytics queries
- **Caching:** Redis for frequently accessed aggregations

---

## Monitoring & Logging

### Required Metrics
- Total events captured per hour
- Failed capture attempts
- API response times (p50, p95, p99)
- Database query performance
- Authentication failures

### Logging
- All capture events (info level)
- Authentication attempts (info level)
- Failed validations (warn level)
- System errors (error level)

---

## Deployment Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/wihy_tracking
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=24h
ADMIN_EMAIL=admin@wihy.ai
ADMIN_PASSWORD_HASH=bcrypt_hash_here

# CORS
ALLOWED_ORIGINS=https://wihy.ai,https://www.wihy.ai,http://localhost:3000

# Rate Limiting
RATE_LIMIT_CAPTURE=100
RATE_LIMIT_ANALYTICS=30
RATE_LIMIT_ADMIN=50

# Data Retention
ANONYMIZE_AFTER_DAYS=90
SESSION_TIMEOUT_HOURS=24
```

### Docker Compose Example
```yaml
version: '3.8'
services:
  tracking-api:
    image: wihy/tracking-service:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=wihy_tracking
      - POSTGRES_USER=wihy
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Client Integration

### Frontend Components (Already Built)
- `/tracking-dashboard` - Admin analytics dashboard (requires auth)
- `/tracking-admin` - Link generator tool (requires auth)
- `/engagement/:trackingId` - Public partner dashboard

### LinkTrackingService (Already Implemented)
Located: `client/src/components/tracking/LinkTracker.tsx`

**Methods:**
- `generateTrackingLink(userId, campaign?, destination?)` - Create tracking URLs
- `captureTracking(search)` - Capture inbound tracking
- `trackOutboundClick(userId, destinationUrl, campaign)` - Track conversions

---

## Migration Path

### Phase 1: Database Setup
1. Create PostgreSQL database `wihy_tracking`
2. Run schema migrations for tables
3. Create initial admin user
4. Set up Redis for caching

### Phase 2: API Implementation
1. Deploy tracking capture endpoint
2. Migrate in-memory `trackingEvents` to database
3. Implement authentication endpoints
4. Deploy protected analytics endpoints

### Phase 3: Partner Access
1. Build partner creation workflow
2. Deploy engagement dashboard endpoint
3. Create partner invitation system
4. Test public access controls

### Phase 4: Optimization
1. Add database indexes
2. Implement Redis caching
3. Set up read replicas
4. Enable CDN for static dashboard assets

---

## Testing Requirements

### Unit Tests
- Event capture validation
- Authentication flow
- Data aggregation logic
- Rate limiting enforcement

### Integration Tests
- End-to-end event tracking
- Admin dashboard queries
- Partner access token validation
- CORS and security headers

### Load Tests
- 1000 events/second capture
- Concurrent dashboard access (100 users)
- Large dataset analytics queries (1M+ events)

---

## Next Steps for Implementation

1. **Set up PostgreSQL database** with schema
2. **Implement authentication service** (JWT-based)
3. **Create tracking API endpoints** (capture, stats, engagement)
4. **Add partner management** (create, list, revoke access)
5. **Deploy to services.wihy.ai** with proper CORS and security
6. **Update client to use production API** instead of in-memory storage
7. **Add monitoring and alerting** (Datadog, Sentry, or similar)
