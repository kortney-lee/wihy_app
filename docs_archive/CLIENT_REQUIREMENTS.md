# Client Requirements for B2B/Enterprise Implementation

## Overview
This document outlines the backend infrastructure, API endpoints, database schema, and third-party integrations required to support the WIHY app's B2B/Enterprise plan architecture with 13 total plans (6 consumer + 7 B2B).

---

## 1. Database Schema Changes

### 1.1 Users Table Updates
Add the following columns to support B2B plans:

```sql
ALTER TABLE users ADD COLUMN plan VARCHAR(50);
-- Values: 'free', 'premium', 'family-basic', 'family-premium', 'coach', 'coach-family',
--         'workplace-core', 'workplace-plus', 'corporate-enterprise', 
--         'k12-school', 'university', 'hospital', 'hospitality'

ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN organization_role VARCHAR(20);
-- Values: 'admin', 'user', 'student', 'employee'

ALTER TABLE users ADD COLUMN add_ons TEXT[]; -- JSON array of add-on IDs
ALTER TABLE users ADD COLUMN family_id UUID REFERENCES families(id);
ALTER TABLE users ADD COLUMN family_role VARCHAR(20); -- 'owner', 'member'
ALTER TABLE users ADD COLUMN guardian_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN coach_id UUID REFERENCES coaches(id);
ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5,2); -- For coaches
```

### 1.2 Organizations Table (NEW)
Create a new table for B2B organizations:

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'workplace', 'corporate', 'k12', 'university', 'hospital', 'hospitality'
  plan VARCHAR(50) NOT NULL, -- B2B plan type
  license_count INTEGER NOT NULL, -- Number of licenses purchased
  active_users INTEGER DEFAULT 0, -- Current active users
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  billing_email VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  white_label_config JSONB, -- Logo, colors, branding
  custom_domain VARCHAR(255),
  contract_start_date TIMESTAMP,
  contract_end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_active ON organizations(is_active);
```

### 1.3 Families Table (NEW)
For family plan support:

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50), -- 'family-basic', 'family-premium'
  member_limit INTEGER DEFAULT 5,
  guardian_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_families_owner ON families(owner_id);
CREATE INDEX idx_families_guardian_code ON families(guardian_code);
```

### 1.4 Coaches Table (NEW)
For coach platform:

```sql
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plan VARCHAR(50), -- 'coach', 'coach-family'
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  client_count INTEGER DEFAULT 0,
  stripe_connect_account_id VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coaches_user ON coaches(user_id);
```

### 1.5 Organization Users Table (NEW)
Join table for organization membership:

```sql
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'admin', 'user', 'student', 'employee'
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_users_org ON organization_users(organization_id);
CREATE INDEX idx_org_users_user ON organization_users(user_id);
```

---

## 2. API Endpoints Required

### 2.1 Authentication & User Management
```
POST   /api/auth/local/login        - Email/password login (✅ IMPLEMENTED)
POST   /api/auth/local/register     - Email/password registration (✅ IMPLEMENTED)
GET    /api/auth/google/authorize   - Google OAuth (✅ IMPLEMENTED)
GET    /api/auth/facebook/authorize - Facebook OAuth (✅ IMPLEMENTED)
GET    /api/auth/microsoft/authorize- Microsoft OAuth (✅ IMPLEMENTED)
POST   /api/oauth/token             - Token exchange (✅ IMPLEMENTED)
GET    /api/oauth/userinfo          - User profile with capabilities (✅ IMPLEMENTED)
POST   /api/auth/verify             - Verify session (✅ IMPLEMENTED)
POST   /api/auth/logout             - Logout user (✅ IMPLEMENTED)
GET    /api/auth/providers          - List auth providers (✅ IMPLEMENTED)
PUT    /api/users/me                - Update user profile (⚠️ NEEDED)
PUT    /api/users/me/plan           - Update user plan (⚠️ NEEDED)
PUT    /api/users/me/preferences    - Update user preferences (⚠️ NEEDED)
```

### 2.2 Plan & Subscription Management
```
GET    /api/plans                   - List all available plans (consumer + B2B)
GET    /api/plans/:planId           - Get plan details with pricing
POST   /api/subscriptions           - Create new subscription (Stripe)
GET    /api/subscriptions/active    - Get user's active subscriptions
PUT    /api/subscriptions/:id       - Update subscription (upgrade/downgrade)
DELETE /api/subscriptions/:id       - Cancel subscription
POST   /api/add-ons                 - Purchase add-on (AI/Instacart)
GET    /api/add-ons                 - List user's active add-ons
```

### 2.3 Organization Management (B2B)
```
POST   /api/organizations           - Create new organization (admin)
GET    /api/organizations/:id       - Get organization details
PUT    /api/organizations/:id       - Update organization settings
GET    /api/organizations/:id/users - List organization members
POST   /api/organizations/:id/users - Add user to organization
PUT    /api/organizations/:id/users/:userId - Update user role
DELETE /api/organizations/:id/users/:userId - Remove user
GET    /api/organizations/:id/analytics - Usage analytics
GET    /api/organizations/:id/billing - Billing information
```

### 2.4 Family Management
```
POST   /api/families                - Create family group
GET    /api/families/:id            - Get family details
PUT    /api/families/:id            - Update family settings
POST   /api/families/join           - Join family with guardian code
DELETE /api/families/:id/members/:userId - Remove family member
GET    /api/families/:id/guardian-code - Get/regenerate guardian code
```

### 2.5 Coach Platform
```
GET    /api/coaches/me              - Get coach profile
PUT    /api/coaches/me              - Update coach settings
GET    /api/coaches/clients         - List coach's clients
GET    /api/coaches/revenue         - Get revenue analytics
POST   /api/coaches/connect-stripe  - Connect Stripe account
GET    /api/coaches/payouts         - List payout history
```

---

## 3. WIHY Auth Service Requirements

### 3.1 OAuth2 Configuration
The WIHY Auth Service must support:

- **Authorization Code Flow** with PKCE
- **Scopes**: `openid`, `profile`, `email`, `plan:read`, `plan:write`, `organization:read`, `organization:write`
- **Token Endpoint**: Returns access token + refresh token
- **User Info Endpoint**: Returns user profile with plan and capabilities

### 3.2 User Object Structure (Current Implementation)
The mobile app expects this exact user object structure from the auth service:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'local' | 'google' | 'facebook' | 'microsoft';
  memberSince: string;
  healthScore: number;
  streakDays: number;
  preferences: {
    notifications: boolean;
    biometrics: boolean;
    darkMode: boolean;
    analytics: boolean;
    autoScan: boolean;
  };
  
  // Plan-based access control
  plan: 'free' | 'premium' | 'family-basic' | 'family-premium' | 'coach' | 'coach-family' 
    | 'workplace-core' | 'workplace-plus' | 'corporate-enterprise' | 'k12-school' 
    | 'university' | 'hospital' | 'hospitality';
  addOns?: string[];  // ['ai', 'instacart']
  capabilities: {
    meals: boolean;
    workouts: boolean;
    family: boolean;
    coachPlatform: boolean;
    wihyAI: boolean;
    instacart: boolean;
    adminDashboard: boolean;
    usageAnalytics: boolean;
    roleManagement: boolean;
    whiteLabel: boolean;
  };
  
  // Family info (if applicable)
  familyId?: string;
  familyRole?: 'owner' | 'member';
  guardianCode?: string;
  
  // Coach info (if applicable)
  coachId?: string;
  commissionRate?: number;
  
  // B2B/Enterprise info (if applicable)
  organizationId?: string;
  organizationRole?: 'admin' | 'user' | 'student' | 'employee';
  
  // Legacy field (keep for backward compatibility)
  userRole?: 'user' | 'coach' | 'parent' | 'admin';
}
```

**CRITICAL**: The `capabilities` object is calculated server-side based on the user's plan and addOns. The mobile app reads this object to enable/disable features.

### 3.3 Current Auth Service Implementation
**Base URL**: `https://auth.wihy.ai`

**Mobile App Configuration**:
```typescript
{
  clientId: 'wihy_native_2025',
  redirectUri: 'wihy://auth/callback',
  scopes: ['profile', 'email', 'health_data', 'offline_access']
}
```

**Authentication Endpoints** (Currently Implemented):
```
POST /api/auth/local/login          - Email/password login
POST /api/auth/local/register       - Email/password registration
GET  /api/auth/google/authorize     - Google OAuth redirect
GET  /api/auth/facebook/authorize   - Facebook OAuth redirect
GET  /api/auth/microsoft/authorize  - Microsoft OAuth redirect
POST /api/oauth/token               - Exchange auth code for tokens
GET  /api/oauth/userinfo            - Get user profile with capabilities
POST /api/auth/verify               - Verify session token
POST /api/auth/logout               - Logout and revoke session
GET  /api/auth/providers            - List available auth providers
GET  /api/health                    - Health check
```

**Session Flow** (Current Implementation):
1. User selects auth provider (Google/Facebook/Microsoft) or enters email/password
2. App redirects to auth service: `https://auth.wihy.ai/api/auth/{provider}/authorize`
3. Auth service handles OAuth flow server-side
4. Auth service redirects back to app: `wihy://auth/callback?session_token={token}`
5. App exchanges session_token for user object via `/api/oauth/userinfo`
6. App stores session_token and user object locally
7. App automatically refreshes access tokens using refresh_token

**Token Storage** (AsyncStorage):
```
@wihy_session_token   - Main session token
@wihy_access_token    - Short-lived access token
@wihy_refresh_token   - Long-lived refresh token
@wihy_user_data       - Cached user object
@wihy_token_expiry    - Token expiration timestamp
```

---

## 4. Stripe Integration

### 4.1 Products & Prices Setup
Create Stripe products for all 13 plans:

**Consumer Plans:**
- `free` - $0/month (no Stripe product needed)
- `premium` - $8.99/month
- `family-basic` - $19.99/month
- `family-premium` - $29.99/month
- `coach` - $24.97/month
- `coach-family` - $64.97/month

**B2B Plans (per seat pricing):**
- `workplace-core` - $3.00/user/month
- `workplace-plus` - $5.00/user/month
- `corporate-enterprise` - $7.00/user/month
- `k12-school` - $1.50/student/month
- `university` - $2.50/student/month
- `hospital` - $5.00/user/month (tiered: $4-6 based on volume)
- `hospitality` - $4.00/resident/month (tiered: $3-5 based on volume)

**Add-Ons:**
- `wihy-ai` - $4.99/month (for non-premium consumer plans)
- `instacart` - $9.99/month

### 4.2 Subscription Logic
- **Consumer plans**: Single user subscription
- **Family plans**: Owner pays, can add up to 5 members
- **Coach plans**: Individual coach subscription + commission tracking
- **B2B plans**: Organization pays for N seats (license count)

### 4.3 Webhooks Required
```
POST /webhooks/stripe
```

Handle events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

---

## 5. GoHighLevel (GHL) Integration

### 5.1 Required Tags
The app expects the following GHL tags to be synced:

**Consumer Plan Tags:**
- `wihy_free_active`
- `wihy_premium_active`
- `wihy_family_basic_active`
- `wihy_family_premium_active`
- `wihy_coach_active`
- `wihy_coach_family_active`

**B2B Plan Tags:**
- `wihy_b2b_core_active`
- `wihy_b2b_plus_active`
- `wihy_b2b_enterprise_active`
- `wihy_b2b_k12_active`
- `wihy_b2b_university_active`
- `wihy_b2b_hospital_active`
- `wihy_b2b_hospitality_active`

**Role Tags:**
- `wihy_role_user`
- `wihy_role_coach`
- `wihy_role_family_owner`
- `wihy_role_org_admin`
- `wihy_role_student`
- `wihy_role_employee`

**Add-On Tags:**
- `wihy_addon_ai_active`
- `wihy_addon_instacart_active`

### 5.2 GHL API Integration
```
POST /api/ghl/sync                 - Sync user plan to GHL tags
GET  /api/ghl/contacts/:email      - Get contact from GHL
PUT  /api/ghl/contacts/:id/tags    - Update contact tags
```

### 5.3 Automation Triggers
- Tag applied when plan activated → Trigger welcome workflow
- Tag removed when plan cancelled → Trigger retention workflow
- `wihy_role_org_admin` tag → Trigger admin onboarding
- `wihy_b2b_*_active` tag → Trigger B2B welcome sequence

---

## 6. Admin Dashboard Backend

### 6.1 Dashboard Structure (Current Implementation)
The mobile app uses a **unified Health tab** with three contextual dashboards:

1. **Personal Dashboard** (context: 'personal')
   - Hub view: Overview, My Progress, Nutrition, Research cards
   - Detail views: Individual dashboards for each feature
   - Available to: ALL plans

2. **Family Dashboard** (context: 'family')
   - Family member health tracking
   - Guardian code management
   - Member roster and health scores
   - Available to: family-basic, family-premium, coach-family, workplace-plus, corporate-enterprise plans

3. **Coach Dashboard** (context: 'coach')  
   - Client management
   - Program creation
   - Revenue analytics
   - Available to: coach, coach-family plans

**Navigation Pattern**:
- `DashboardSwitcher` shows Personal/Family/Coach tabs based on user capabilities
- `HamburgerMenu` provides contextual navigation to detail dashboards
- All dashboards use consistent 2x2 card grid layout with colored gradient headers

### 6.2 Analytics Endpoints (⚠️ NEEDED)
```
GET /api/admin/analytics/overview        - Total users, revenue, active plans
GET /api/admin/analytics/usage           - Feature usage metrics
GET /api/admin/analytics/engagement      - User engagement scores
GET /api/admin/organizations/:id/usage   - Organization-specific usage
GET /api/admin/organizations/:id/roster  - Active/inactive users roster
```

### 6.2 User Management Endpoints
```
GET    /api/admin/users                  - List all users (paginated)
GET    /api/admin/users/:id              - Get user details
PUT    /api/admin/users/:id/plan         - Update user plan (admin action)
PUT    /api/admin/users/:id/role         - Update organization role
POST   /api/admin/users/:id/disable      - Disable user account
POST   /api/admin/users/:id/enable       - Re-enable user account
```

### 6.3 Role Management
```
GET    /api/admin/roles                  - List available roles
POST   /api/admin/bulk-assign-roles      - Bulk role assignment
GET    /api/admin/permissions-matrix     - Get role-permission mapping
```

---

## 7. White-Label Configuration

### 7.1 Organization Branding
B2B organizations with white-label capability need:

```json
{
  "organizationId": "uuid",
  "whiteLabelConfig": {
    "logo": "https://cdn.wihy.com/org-logos/acme-corp.png",
    "primaryColor": "#0066cc",
    "secondaryColor": "#ff6600",
    "appName": "Acme Wellness",
    "customDomain": "wellness.acmecorp.com",
    "supportEmail": "support@acmecorp.com",
    "termsUrl": "https://acmecorp.com/terms",
    "privacyUrl": "https://acmecorp.com/privacy"
  }
}
```

### 7.2 API Endpoint
```
GET /api/organizations/:id/branding      - Get white-label config
PUT /api/organizations/:id/branding      - Update branding (admin only)
```

---

## 8. Payment Processing Flow

### 8.1 Consumer Plan Purchase
1. User selects plan in app → `DevPlanSwitcher` or upgrade prompt
2. App calls `POST /api/checkout/session` with plan ID
3. Backend creates Stripe Checkout Session
4. App opens Stripe Checkout URL
5. User completes payment
6. Stripe webhook → `checkout.session.completed`
7. Backend updates `users.plan` and `users.add_ons`
8. Backend syncs GHL tags
9. Backend returns updated user object to app
10. App refetches user profile → Capabilities unlocked

### 8.2 B2B Organization Setup
1. Sales team creates organization in admin panel
2. Admin sets license count (e.g., 500 seats)
3. Stripe subscription created for organization
4. Organization admin receives invitation email
5. Admin logs in → Gets `adminDashboard` capability
6. Admin invites users via email or bulk CSV upload
7. Users join organization → `organization_id` assigned
8. Users inherit organization plan capabilities
9. Backend tracks `active_users` vs `license_count`
10. Alert when approaching license limit

---

## 9. Environment Variables Required

### Backend Service
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/wihy_db

# WIHY Auth Service
WIHY_AUTH_URL=https://auth.wihy.com
OAUTH_CLIENT_ID=wihy_mobile_app
OAUTH_CLIENT_SECRET=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxx

# GoHighLevel
GHL_API_KEY=xxx
GHL_LOCATION_ID=xxx
GHL_API_URL=https://rest.gohighlevel.com/v1

# App Config
API_BASE_URL=https://api.wihy.com
FRONTEND_REDIRECT_URI=exp://192.168.1.100:8081/--/auth/callback

# Email Service
SENDGRID_API_KEY=xxx
FROM_EMAIL=noreply@wihy.com

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=wihy-uploads
AWS_REGION=us-east-1
```

---

## 10. Testing Requirements

### 10.1 Test Accounts Needed
Create test users for each plan type:

```
free@test.com              - Free plan
premium@test.com           - Premium plan
family@test.com            - Family Basic owner
familymember@test.com      - Family member
coach@test.com             - Coach plan
coachfamily@test.com       - Coach Family plan
workplace@test.com         - Workplace Core user
workplaceadmin@test.com    - Workplace admin
corporate@test.com         - Corporate Enterprise admin
k12student@test.com        - K-12 student
university@test.com        - University student
hospital@test.com          - Hospital staff
hospitality@test.com       - Hospitality resident
```

### 10.2 Test Organizations
Create test B2B organizations:
- **Acme Corporation** (corporate-enterprise, 100 licenses)
- **Springfield Elementary** (k12-school, 500 licenses)
- **State University** (university, 10,000 licenses)
- **General Hospital** (hospital, 250 licenses)
- **Sunrise Senior Living** (hospitality, 150 licenses)

### 10.3 Stripe Test Mode
- Use Stripe test cards: `4242 4242 4242 4242`
- Test subscription creation, updates, cancellations
- Test webhook delivery

---

## 11. Security Requirements

### 11.1 Authorization Checks
Every API endpoint must verify:
1. User is authenticated (valid JWT)
2. User has required capability for the feature
3. User has permission to access the resource (organization membership, family ownership, etc.)

Example middleware:
```javascript
function requireCapability(capability) {
  return (req, res, next) => {
    if (!req.user.capabilities[capability]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage:
router.get('/admin/analytics', requireCapability('adminDashboard'), getAnalytics);
```

### 11.2 Rate Limiting
- **Free plan**: 100 requests/hour
- **Premium plans**: 1,000 requests/hour
- **B2B plans**: 10,000 requests/hour

### 11.3 Data Isolation
- Family members can only see family data
- Organization users can only see organization data
- Coaches can only see their clients
- Admins have full access within their organization

---

## 12. Migration Plan for Existing Users

### 12.1 Legacy to Plan-Based Migration
If you have existing users with the old `userRole` system:

```sql
-- Migration script
UPDATE users SET plan = 'free' WHERE user_role = 'user' AND plan IS NULL;
UPDATE users SET plan = 'coach' WHERE user_role = 'coach' AND plan IS NULL;
UPDATE users SET plan = 'family-basic' WHERE user_role = 'parent' AND plan IS NULL;
```

### 12.2 Capability Recalculation
After migration, trigger capability recalculation for all users:
```
POST /api/admin/recalculate-capabilities
```

---

## 13. Deployment Checklist

### Pre-Launch
- [ ] Database schema applied to production
- [ ] All API endpoints deployed and tested
- [ ] Stripe products created for all 13 plans
- [ ] Stripe webhooks configured and verified
- [ ] OAuth2 integration with WIHY Auth Service tested
- [ ] GHL tags created and automation workflows set up
- [ ] Test accounts created for each plan type
- [ ] Admin dashboard accessible
- [ ] White-label configuration tested
- [ ] Rate limiting configured
- [ ] Error logging and monitoring set up (Sentry, Datadog, etc.)

### Post-Launch
- [ ] Monitor Stripe webhook deliveries
- [ ] Monitor GHL tag sync success rate
- [ ] Track API error rates
- [ ] Monitor database performance
- [ ] Review analytics data accuracy
- [ ] Test organization invite flow
- [ ] Test family guardian code flow
- [ ] Verify coach commission calculations

---

## 14. Support Documentation Needed

### For Developers
- API documentation (Swagger/OpenAPI)
- Webhook event reference
- Capability system guide
- Testing guide with example requests

### For Admins
- Organization setup guide
- User management guide
- Analytics interpretation guide
- Billing and subscription management

### For Sales Team
- B2B pricing calculator
- Plan comparison matrix
- Contract templates
- Onboarding playbook

---

## 15. Cost Estimates

### Infrastructure
- **Database**: PostgreSQL (AWS RDS) - ~$100-300/month
- **API Server**: AWS ECS/EC2 - ~$200-500/month
- **File Storage**: AWS S3 - ~$50-100/month
- **CDN**: CloudFront - ~$50-100/month
- **Monitoring**: Datadog/Sentry - ~$100-200/month

### Third-Party Services
- **Stripe**: 2.9% + $0.30 per transaction
- **GoHighLevel**: Existing account (no additional cost)
- **SendGrid**: ~$20-50/month for email delivery
- **OAuth Service**: WIHY Auth Service (internal, cost TBD)

### Total Estimated Monthly Cost: **$520-1,300/month** (depending on scale)

---

## 17. Current API Services Integration

### 17.1 Existing Services (Already Configured)
The mobile app already connects to these WIHY services:

**Main API Service** (`https://services.wihy.ai`):
```
POST /api/scan                         - Barcode scanning
POST /api/scan/photo                   - Food photo analysis (Google Vision)
POST /api/scan/label                   - Product label greenwashing detection
GET  /api/scan/history                 - Scan history
POST /api/v1/medications/pills/scan    - Pill identification
POST /api/v1/medications/pills/confirm - Confirm pill ID
POST /api/v1/medications/labels/scan   - Prescription label OCR
GET  /api/v1/medications/labels/by-ndc - Get med info by NDC code
POST /api/openfda/ingredient           - OpenFDA ingredient lookup
```

**ML API Service** (`https://ml.wihy.ai`):
```
POST /ask                              - WIHY Coach AI chat (no /api prefix)
```

**Auth Service** (`https://auth.wihy.ai`):
```
[See section 3.3 for complete auth endpoints]
```

### 17.2 API Service Configuration
```typescript
// src/services/config.ts
export const API_CONFIG = {
  baseUrl: 'https://services.wihy.ai',
  mlApiUrl: 'https://ml.wihy.ai',
  authUrl: 'https://auth.wihy.ai',
  timeout: 30000, // 30 seconds
};
```

### 17.3 Required New Endpoints
The following endpoints need to be added to support the plan-based architecture:

**User Management** (`https://services.wihy.ai`):
```
PUT  /api/users/me                     - Update user profile
PUT  /api/users/me/plan                - Update user plan
PUT  /api/users/me/preferences         - Update preferences
GET  /api/users/me/subscription        - Get subscription details
```

**Plan & Subscription** (`https://services.wihy.ai`):
```
GET  /api/plans                        - List all available plans
GET  /api/plans/:planId                - Get plan details
POST /api/subscriptions                - Create subscription (Stripe)
GET  /api/subscriptions/active         - Get active subscription
PUT  /api/subscriptions/:id            - Update subscription
DELETE /api/subscriptions/:id          - Cancel subscription
POST /api/add-ons                      - Purchase add-on
GET  /api/add-ons                      - List active add-ons
```

**Family Management** (`https://services.wihy.ai`):
```
POST   /api/families                   - Create family group
GET    /api/families/:id               - Get family details
PUT    /api/families/:id               - Update family settings
POST   /api/families/join              - Join with guardian code
DELETE /api/families/:id/members/:userId - Remove member
GET    /api/families/:id/guardian-code - Get/regenerate code
GET    /api/families/:id/members       - List family members
```

**Coach Platform** (`https://services.wihy.ai`):
```
GET    /api/coaches/me                 - Get coach profile
PUT    /api/coaches/me                 - Update coach settings
GET    /api/coaches/clients            - List clients
POST   /api/coaches/clients            - Add client
DELETE /api/coaches/clients/:id        - Remove client
GET    /api/coaches/revenue            - Revenue analytics
POST   /api/coaches/connect-stripe     - Connect Stripe
GET    /api/coaches/payouts            - Payout history
```

**Organization (B2B)** (`https://services.wihy.ai`):
```
POST   /api/organizations              - Create organization (admin)
GET    /api/organizations/:id          - Get organization details
PUT    /api/organizations/:id          - Update organization
GET    /api/organizations/:id/users    - List members
POST   /api/organizations/:id/users    - Add user
PUT    /api/organizations/:id/users/:userId - Update role
DELETE /api/organizations/:id/users/:userId - Remove user
GET    /api/organizations/:id/analytics - Usage analytics
GET    /api/organizations/:id/billing  - Billing info
PUT    /api/organizations/:id/branding - White-label config
```

---

## 18. Mobile App Capability Checks

### 18.1 Current Implementation
The mobile app uses these utility functions to check user capabilities:

```typescript
// src/utils/capabilities.ts

// Check specific capability
hasCapability(user, 'wihyAI')        // Check if user has AI access
hasCapability(user, 'family')        // Check if user has family dashboard

// Convenience functions
hasCoachAccess(user)                 // Check coach platform access
hasFamilyAccess(user)                // Check family dashboard access
hasAIAccess(user)                    // Check WIHY Coach AI access
hasInstacartAccess(user)             // Check Instacart integration
```

### 18.2 Feature Gating Pattern
```typescript
// Example: Show AI chat only if user has capability
{hasAIAccess(user) && (
  <TouchableOpacity onPress={navigateToAIChat}>
    <Text>Ask WIHY Coach</Text>
  </TouchableOpacity>
)}

// Example: Filter dashboard options by context
const dashboardOptions = allOptions.filter(option => 
  option.contexts.includes(currentContext)
);
```

### 18.3 Plan Capability Matrix (Reference)
```typescript
// Free plan capabilities
{
  meals: false,
  workouts: false,
  family: false,
  coachPlatform: false,
  wihyAI: false,           // Can add as $4.99/mo add-on
  instacart: false,
  adminDashboard: false,
  usageAnalytics: false,
  roleManagement: false,
  whiteLabel: false
}

// Premium plan capabilities ($8.99/mo)
{
  meals: true,
  workouts: true,
  family: false,
  coachPlatform: false,
  wihyAI: false,           // Can add as $4.99/mo add-on
  instacart: false,
  adminDashboard: false,
  usageAnalytics: false,
  roleManagement: false,
  whiteLabel: false
}

// Family Premium capabilities ($29.99/mo)
{
  meals: true,
  workouts: true,
  family: true,
  coachPlatform: false,
  wihyAI: true,            // INCLUDED
  instacart: true,         // INCLUDED
  adminDashboard: false,
  usageAnalytics: false,
  roleManagement: false,
  whiteLabel: false
}

// Coach Family capabilities ($64.97/mo)
{
  meals: true,
  workouts: true,
  family: true,
  coachPlatform: true,
  wihyAI: true,            // Included via Family Premium
  instacart: true,         // Included via Family Premium
  adminDashboard: false,
  usageAnalytics: false,
  roleManagement: false,
  whiteLabel: false
}

// B2B plans (all include)
{
  meals: true,
  workouts: true,
  family: varies,          // Depends on specific plan
  coachPlatform: false,
  wihyAI: true,            // INCLUDED in all B2B plans
  instacart: false,
  adminDashboard: true,
  usageAnalytics: true,
  roleManagement: true,
  whiteLabel: true
}
```

[See src/utils/capabilities.ts for complete matrix]

---

## 19. Development Tools

### 19.1 Dev Plan Switcher
The mobile app includes a development tool for testing different plans:

**Location**: Profile screen → Enable Developer Mode  
**Component**: `src/components/DevPlanSwitcher.tsx`

**Features**:
- Switch between any of the 13 plans instantly
- Toggle AI and Instacart add-ons
- See real-time capability changes
- State automatically resets when plan changes

**Usage**:
1. Open Profile
2. Tap "Copilot Info" 3 times to enable Dev Mode
3. Tap "Dev Mode: Enabled" badge
4. Select plan and add-ons
5. Hit "Apply"
6. User object updates, capabilities recalculated
7. Navigation state resets to show correct dashboards

**Current Plans in Switcher**:
```typescript
const plans = [
  { id: 'free', label: 'Free' },
  { id: 'premium', label: 'Premium ($8.99/mo)' },
  { id: 'family-basic', label: 'Family Basic ($19.99/mo)' },
  { id: 'family-premium', label: 'Family Premium ($29.99/mo)' },
  { id: 'coach', label: 'Coach ($24.97/mo)' },
  { id: 'coach-family', label: 'Coach Family ($64.97/mo)' },
  { id: 'workplace-core', label: 'Workplace Core (B2B)' },
  { id: 'workplace-plus', label: 'Workplace Plus (B2B)' },
  { id: 'corporate-enterprise', label: 'Corporate Enterprise (B2B)' },
  { id: 'k12-school', label: 'K-12 School (B2B)' },
  { id: 'university', label: 'University (B2B)' },
  { id: 'hospital', label: 'Hospital (B2B)' },
  { id: 'hospitality', label: 'Hospitality (B2B)' },
];
```

### 19.2 Mock Session for Coaches
**Location**: Profile screen → "Sign in as Coach" button (visible in dev mode)  
**Purpose**: Create a mock coaching session to test client management features

---

## 20. Plan Feature Breakdown & User Journeys

### 20.1 Free Plan User Experience

**What Free Users CAN Do:**
✅ **Core Health Tracking:**
- Barcode scanning for food products (`POST /api/scan`)
- Photo food analysis with Google Vision (`POST /api/scan/photo`)
- Product label greenwashing detection (`POST /api/scan/label`)
- View scan history (`GET /api/scan/history`)
- OpenFDA ingredient lookup (`POST /api/openfda/ingredient`)

✅ **Medication Management:**
- Pill identification via photo (`POST /api/v1/medications/pills/scan`)
- Prescription label OCR (`POST /api/v1/medications/labels/scan`)
- NDC code lookup (`GET /api/v1/medications/labels/by-ndc`)

✅ **Basic Health Dashboard:**
- Personal dashboard (Overview view only)
- Health score tracking
- Streak days tracking
- Basic profile management

✅ **Account Features:**
- Multi-provider authentication (Google, Facebook, Microsoft, Email)
- Basic preferences (notifications, dark mode, biometrics)

**What Free Users DON'T Get (Paywalls):**
❌ **Meal Plans** (`meals: false`)
- Custom meal creation
- Nutrition tracking
- Recipe suggestions

❌ **Workout Plans** (`workouts: false`)
- Fitness programs
- Workout tracking
- Exercise library

❌ **WIHY AI Coach** (`wihyAI: false`)
- AI-powered health chat (unless they buy $4.99/mo add-on)
- Personalized health recommendations
- Smart goal setting

❌ **Instacart Integration** (`instacart: false`)
- One-click grocery ordering
- Recipe-to-cart feature

❌ **Family Dashboard** (`family: false`)
- Family member tracking
- Guardian code access
- Multi-user health monitoring

❌ **Coach Platform** (`coachPlatform: false`)
- Client management
- Revenue analytics
- Program creation

❌ **B2B Features** (`adminDashboard: false`, `usageAnalytics: false`, etc.)
- Organization management
- Analytics dashboards
- Role management
- White-label branding

### 20.2 Upgrade Prompts & Paywalls

**Where Users Hit Paywalls:**

1. **Meal Plan Creation** (requires Premium or higher)
   - Location: Nutrition screen → "Create Meal Plan" button
   - Prompt: "Unlock meal plans with Premium"
   - CTA: "Upgrade to Premium - $8.99/mo"

2. **Workout Programs** (requires Premium or higher)
   - Location: Fitness screen → "Start Program" button
   - Prompt: "Get personalized workout plans"
   - CTA: "Upgrade to Premium - $8.99/mo"

3. **WIHY AI Coach** (requires Premium + AI add-on, or Family Premium+, or B2B)
   - Location: Chat icon in navigation
   - Prompt: "Ask WIHY Coach anything about your health"
   - CTA Options:
     * "Add AI for $4.99/mo" (if Premium)
     * "Upgrade to Premium + AI" (if Free)
     * "Upgrade to Family Premium" (includes AI + Instacart)

4. **Family Dashboard** (requires Family Basic or higher)
   - Location: DashboardSwitcher (tab hidden if no access)
   - Prompt: "Track your family's health together"
   - CTA: "Upgrade to Family Basic - $19.99/mo"

5. **Instacart Integration** (requires Family Premium or add-on)
   - Location: Nutrition screen → "Order Ingredients" button
   - Prompt: "Get groceries delivered from your recipes"
   - CTA: "Add Instacart for $9.99/mo" or "Upgrade to Family Premium"

6. **Coach Platform** (requires Coach plan)
   - Location: Hidden unless user has coach plan
   - Prompt: "Become a WIHY Coach and earn 20% commission"
   - CTA: "Start Coaching - $24.97/mo"

### 20.3 Feature Comparison Table

| Feature | Free | Premium | Family Basic | Family Premium | Coach | Coach Family | B2B Plans |
|---------|------|---------|--------------|----------------|-------|--------------|-----------|
| **Price** | $0 | $8.99/mo | $19.99/mo | $29.99/mo | $24.97/mo | $64.97/mo | Varies by plan |
| **Barcode Scanning** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Photo Food Analysis** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Medication Tracking** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Health Dashboard** | ✅ (Basic) | ✅ (Full) | ✅ (Full) | ✅ (Full) | ✅ (Full) | ✅ (Full) | ✅ (Full) |
| **Meal Plans** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Workout Plans** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **WIHY AI Coach** | $4.99/mo add-on | $4.99/mo add-on | $4.99/mo add-on | ✅ Included | ❌ | ✅ Included | ✅ Included |
| **Instacart Integration** | ❌ | $9.99/mo add-on | $9.99/mo add-on | ✅ Included | ❌ | ✅ Included | ❌ |
| **Family Dashboard** | ❌ | ❌ | ✅ (up to 5) | ✅ (up to 5) | ❌ | ✅ (up to 5) | ✅ (varies) |
| **Coach Platform** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Client Management** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Revenue Analytics** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Admin Dashboard** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Usage Analytics** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Role Management** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **White-Label Branding** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Rate Limit** | 100/hr | 1,000/hr | 1,000/hr | 1,000/hr | 1,000/hr | 1,000/hr | 10,000/hr |

### 20.4 User Journeys by Plan Type

#### Journey 1: Free User → Premium Upgrade
**Scenario**: Sarah wants meal plans and workout routines

1. Sarah signs up with Google (Free plan)
2. Scans products and tracks medications (free features)
3. Tries to create meal plan → **PAYWALL**
4. Sees upgrade prompt: "Unlock meal plans with Premium - $8.99/mo"
5. Clicks "Upgrade" → Stripe Checkout
6. Completes payment
7. Backend: `users.plan = 'premium'`, capabilities updated, GHL tag `wihy_premium_active`
8. Sarah returns to app → Meal plans now available
9. AI Coach still locked → Can add for $4.99/mo

#### Journey 2: Premium User → Family Premium Upgrade
**Scenario**: John wants to track his kids' health + get AI Coach

1. John is on Premium ($8.99/mo)
2. Sees "Family" tab disabled in DashboardSwitcher
3. Clicks info icon → "Track your family's health - Upgrade to Family Premium"
4. Sees benefits: Family dashboard + AI Coach + Instacart all included
5. Clicks "Upgrade to Family Premium - $29.99/mo"
6. Stripe upgrade flow (prorated)
7. Backend: `users.plan = 'family-premium'`, creates `families` record, generates guardian code
8. John gets all capabilities: meals, workouts, family, wihyAI, instacart
9. Shares guardian code with wife and kids
10. Family members join via `POST /api/families/join` with code

#### Journey 3: Coach User Journey
**Scenario**: Maria wants to offer coaching services

1. Maria is fitness instructor, signs up as Free user
2. Sees "Become a WIHY Coach" banner in profile
3. Clicks → Learns about Coach platform (20% commission, client management)
4. Upgrades to Coach plan ($24.97/mo)
5. Backend: Creates `coaches` record, sets commission_rate = 20.00
6. Maria connects Stripe account via `POST /api/coaches/connect-stripe`
7. Coach Dashboard now visible in DashboardSwitcher
8. Maria adds clients via email invite
9. Clients join → Maria earns 20% of their subscriptions
10. Views revenue analytics in Coach Dashboard

#### Journey 4: B2B Organization Setup
**Scenario**: Acme Corp wants wellness program for 500 employees

1. Sales team creates organization in admin panel
2. `organizations` record: plan = 'corporate-enterprise', license_count = 500
3. Stripe subscription: $7/seat × 500 = $3,500/mo
4. HR admin receives invite email
5. Admin logs in → Gets `adminDashboard`, `usageAnalytics`, `roleManagement` capabilities
6. Admin uploads 500 employee emails via bulk CSV
7. Each employee gets invite → Signs up → `organization_id` assigned
8. Employees inherit organization capabilities (meals, workouts, wihyAI)
9. Admin monitors usage in Admin Dashboard
10. Backend tracks `active_users` vs `license_count`

#### Journey 5: Free User with Add-Ons
**Scenario**: David wants AI Coach but doesn't need Premium features

1. David is on Free plan
2. Tries to chat with WIHY Coach → **PAYWALL**
3. Sees two options:
   - "Upgrade to Premium ($8.99/mo) + AI ($4.99/mo)" = $13.98/mo
   - "Upgrade to Family Premium ($29.99/mo)" - includes AI + more
4. David chooses to stay Free and just add AI for $4.99/mo
5. Clicks "Add AI Coach - $4.99/mo"
6. Stripe Checkout for add-on subscription
7. Backend: `users.add_ons = ['ai']`, capabilities.wihyAI = true
8. David can now chat with AI Coach
9. Still no meal plans or workouts (those require Premium upgrade)

### 20.5 API Responses for Plan Checks

**Example: User tries to access feature without capability**

Request:
```http
POST /api/meals
Authorization: Bearer {access_token}
{
  "name": "Healthy Dinner",
  "calories": 600
}
```

Response (403 Forbidden):
```json
{
  "error": "insufficient_permissions",
  "message": "Meal creation requires Premium plan or higher",
  "currentPlan": "free",
  "requiredCapability": "meals",
  "upgradeOptions": [
    {
      "plan": "premium",
      "price": "$8.99/mo",
      "includes": ["meals", "workouts"]
    },
    {
      "plan": "family-premium",
      "price": "$29.99/mo",
      "includes": ["meals", "workouts", "family", "wihyAI", "instacart"]
    }
  ]
}
```

**Example: Successful capability check**

Request:
```http
GET /api/oauth/userinfo
Authorization: Bearer {session_token}
```

Response (200 OK):
```json
{
  "id": "user123",
  "email": "user@example.com",
  "plan": "family-premium",
  "addOns": [],
  "capabilities": {
    "meals": true,
    "workouts": true,
    "family": true,
    "coachPlatform": false,
    "wihyAI": true,
    "instacart": true,
    "adminDashboard": false,
    "usageAnalytics": false,
    "roleManagement": false,
    "whiteLabel": false
  },
  "familyId": "fam789",
  "familyRole": "owner",
  "guardianCode": "WIHY-ABC123"
}
```

### 20.6 Mobile App Feature Gating Implementation

**Current Pattern in Mobile App:**
```typescript
// src/screens/NutritionScreen.tsx

import { hasCapability } from '../utils/capabilities';
import { useAuth } from '../context/AuthContext';

function NutritionScreen() {
  const { user } = useAuth();
  
  const handleCreateMeal = () => {
    if (!hasCapability(user, 'meals')) {
      // Show upgrade prompt
      Alert.alert(
        'Premium Feature',
        'Meal plans require Premium or higher',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    // User has capability, proceed
    navigation.navigate('CreateMeal');
  };
  
  return (
    <View>
      {/* Show button but gate functionality */}
      <TouchableOpacity onPress={handleCreateMeal}>
        <Text>Create Meal Plan</Text>
        {!hasCapability(user, 'meals') && (
          <Icon name="lock" /> {/* Show lock icon */}
        )}
      </TouchableOpacity>
    </View>
  );
}
```

**Backend API Enforcement:**
```javascript
// Backend middleware
function requireCapability(capability) {
  return async (req, res, next) => {
    const user = await getUserFromToken(req.headers.authorization);
    
    if (!user.capabilities[capability]) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: `This feature requires ${capability} capability`,
        currentPlan: user.plan,
        requiredCapability: capability,
        upgradeOptions: getUpgradeOptions(user.plan, capability)
      });
    }
    
    next();
  };
}

// Usage
router.post('/api/meals', requireCapability('meals'), createMeal);
router.post('/api/workouts', requireCapability('workouts'), createWorkout);
router.get('/api/families/:id', requireCapability('family'), getFamilyDetails);
```

---

## 21. Timeline Estimate

### Phase 1: Core Backend - User Management (2-3 weeks) ✅ PARTIALLY COMPLETE
- [x] Database schema implementation (Users table basics)
- [x] Authentication/OAuth2 integration (Google, Facebook, Microsoft)  
- [x] Session management and token refresh
- [ ] Plan management API (PUT /api/users/me/plan)
- [ ] User profile update API (PUT /api/users/me)
- [ ] Preferences update API (PUT /api/users/me/preferences)
- [ ] Stripe integration for consumer plans
- [ ] Capability calculation server-side

### Phase 2: Subscription & Payment (3-4 weeks) ⚠️ NEEDED
- [ ] Stripe product setup for all 13 plans
- [ ] Subscription creation API
- [ ] Subscription management (upgrade/downgrade/cancel)
- [ ] Add-on purchase flow (AI, Instacart)
- [ ] Webhook handlers (subscription events)
- [ ] Payment processing flow
- [ ] Invoice management

### Phase 3: Family Features (2-3 weeks) ⚠️ NEEDED  
- [ ] Families table implementation
- [ ] Family creation API
- [ ] Guardian code generation
- [ ] Family join flow
- [ ] Member management
- [ ] Family dashboard data API

### Phase 4: Coach Platform (2-3 weeks) ⚠️ NEEDED
- [ ] Coaches table implementation
- [ ] Coach profile management
- [ ] Client roster API
- [ ] Revenue tracking
- [ ] Stripe Connect integration
- [ ] Commission calculations
- [ ] Payout history

### Phase 5: B2B/Enterprise Features (3-4 weeks) ⚠️ NEEDED
- [ ] Organizations table implementation
- [ ] Organization management API
- [ ] Admin dashboard backend
- [ ] Analytics endpoints
- [ ] Role management
- [ ] Usage tracking
- [ ] White-label configuration
- [ ] License management

### Phase 6: Integrations (2-3 weeks) ⚠️ NEEDED
- [ ] GHL tag sync automation
- [ ] Email notifications (SendGrid)
- [ ] Webhook security
- [ ] Background job processing

### Phase 7: Testing & Launch (2-3 weeks)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] API documentation
- [ ] Deployment to production

**Total Estimated Timeline: 19-27 weeks (5-7 months)**  
**Current Status**: Phase 1 partially complete (auth working, plan management needed)

---

## Contact & Questions

For questions about this implementation, contact:
- **Technical Lead**: [Your Backend Dev Team]
- **Product Owner**: [Product Manager]
- **Mobile Team**: [React Native Team]

**Document Version**: 2.0  
**Last Updated**: December 31, 2025  
**Status**: Updated with Current Implementation Details - Ready for API Development

---

# APPENDIX A: WIHY Auth Service - Complete API Reference

**Base URL**: `https://auth.wihy.ai`  
**Version**: 2.0.0  
**Last Updated**: December 31, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Plans](#plans)
4. [Organizations](#organizations)
5. [Families](#families)
6. [Coaches](#coaches)
7. [OAuth2 Server](#oauth2-server)
8. [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require authentication via session token.

### Authentication Methods

**Session Token (Cookie)**:
```http
Cookie: session_token={token}
```

**Session Token (Header)**:
```http
Authorization: Bearer {session_token}
```

**Session Token (Header - Alternative)**:
```http
X-Session-Token: {session_token}
```

---

## 1. Authentication Endpoints

### 1.1 Health Check

**GET** `/api/health`

Check service health and configuration.

**Authentication**: None required

**Request Headers**:
```http
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "encryption": "available",
  "timestamp": "2025-12-31T10:00:00.000Z",
  "providers": {
    "local": true,
    "oauth": ["google", "facebook", "microsoft"],
    "oauth2": true
  },
  "oauth2_server": {
    "grant_types_supported": ["client_credentials", "authorization_code", "refresh_token"],
    "response_types_supported": ["code"],
    "scopes_supported": ["profile", "email", "openid", "admin", "health_data", "offline_access"],
    "registered_clients": 4,
    "client_ids": ["wihy_native_2025", "wihy_services_2025", "wihy_ml_2025", "wihy_frontend_2025"],
    "token_endpoint": "/api/oauth/token",
    "authorization_endpoint": "/api/oauth/authorize",
    "userinfo_endpoint": "/api/oauth/userinfo"
  }
}
```

---

### 1.2 List Auth Providers

**GET** `/api/auth/providers`

Get available authentication providers.

**Authentication**: None required

**Request Headers**:
```http
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "providers": {
    "local": {
      "name": "Email/Password",
      "type": "local",
      "endpoints": {
        "login": "/api/auth/local/login",
        "register": "/api/auth/local/register"
      }
    },
    "google": {
      "name": "Google",
      "type": "oauth",
      "enabled": true,
      "authorize_url": "/api/auth/google/authorize"
    },
    "facebook": {
      "name": "Facebook",
      "type": "oauth",
      "enabled": true,
      "authorize_url": "/api/auth/facebook/authorize"
    },
    "microsoft": {
      "name": "Microsoft",
      "type": "oauth",
      "enabled": true,
      "authorize_url": "/api/auth/microsoft/authorize"
    }
  }
}
```

---

### 1.3 Email/Password Login

**POST** `/api/auth/local/login`

Login with email and password.

**Authentication**: None required

**Request Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "session_token": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "local",
    "profile_data": {}
  }
}
```

**Set-Cookie Header**:
```http
Set-Cookie: session_token={token}; HttpOnly; Secure; SameSite=None; Max-Age=86400000
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "invalid_credentials",
  "message": "Invalid email or password"
}
```

---

### 1.4 Email/Password Registration

**POST** `/api/auth/local/register`

Register a new user with email and password.

**Authentication**: None required

**Request Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Jane Smith"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "session_token": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "provider": "local",
    "profile_data": {}
  }
}
```

**Set-Cookie Header**:
```http
Set-Cookie: session_token={token}; HttpOnly; Secure; SameSite=None; Max-Age=86400000
```

**Error Response** (409 Conflict):
```json
{
  "error": "user_exists",
  "message": "User already exists with this email"
}
```

---

### 1.5 Google OAuth

**GET** `/api/auth/google/authorize`

Initiate Google OAuth flow.

**Authentication**: None required

**Query Parameters**:
- `redirect_uri` (optional) - Custom redirect URI

**Request**:
```http
GET /api/auth/google/authorize?redirect_uri=wihy://auth/callback
```

**Response**: Redirect to Google OAuth consent screen

**Callback**: After user authenticates, redirects to:
```
{redirect_uri}?session_token={token}
```

---

### 1.6 Facebook OAuth

**GET** `/api/auth/facebook/authorize`

Initiate Facebook OAuth flow.

**Authentication**: None required

**Query Parameters**:
- `redirect_uri` (optional) - Custom redirect URI

**Request**:
```http
GET /api/auth/facebook/authorize?redirect_uri=wihy://auth/callback
```

**Response**: Redirect to Facebook OAuth consent screen

**Callback**: After user authenticates, redirects to:
```
{redirect_uri}?session_token={token}
```

---

### 1.7 Microsoft OAuth

**GET** `/api/auth/microsoft/authorize`

Initiate Microsoft OAuth flow.

**Authentication**: None required

**Query Parameters**:
- `redirect_uri` (optional) - Custom redirect URI

**Request**:
```http
GET /api/auth/microsoft/authorize?redirect_uri=wihy://auth/callback
```

**Response**: Redirect to Microsoft OAuth consent screen

**Callback**: After user authenticates, redirects to:
```
{redirect_uri}?session_token={token}
```

---

### 1.8 Verify Session

**POST** `/api/auth/verify`

Verify if session token is valid.

**Authentication**: Required (session token)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "valid": true,
  "session": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "google",
    "created_at": "2025-12-31T09:00:00.000Z",
    "expires_at": "2026-01-01T09:00:00.000Z"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "valid": false,
  "error": "invalid_session",
  "message": "Session token is invalid or expired"
}
```

---

### 1.9 Logout

**POST** `/api/auth/logout`

Logout user and invalidate session.

**Authentication**: Required (session token)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Set-Cookie Header** (clears cookie):
```http
Set-Cookie: session_token=; HttpOnly; Secure; SameSite=None; Max-Age=0
```

---

## 2. User Management

### 2.1 Get User Profile

**GET** `/api/users/me`

Get current user's profile with capabilities.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg",
  "provider": "google",
  "plan": "family-premium",
  "addOns": ["ai"],
  "capabilities": {
    "meals": true,
    "workouts": true,
    "family": true,
    "coachPlatform": false,
    "wihyAI": true,
    "instacart": true,
    "adminDashboard": false,
    "usageAnalytics": false,
    "roleManagement": false,
    "whiteLabel": false
  },
  "familyId": "family-uuid-here",
  "familyRole": "owner",
  "guardianCode": "WIHY-ABC123",
  "organizationId": null,
  "organizationRole": null,
  "coachId": null,
  "commissionRate": null,
  "healthScore": 85,
  "streakDays": 12,
  "memberSince": "2025-01-15T10:00:00.000Z",
  "preferences": {
    "notifications": true,
    "biometrics": true,
    "darkMode": false,
    "analytics": true,
    "autoScan": true
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

### 2.2 Update User Profile

**PUT** `/api/users/me`

Update user profile information.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Updated Doe",
  "picture": "https://example.com/new-avatar.jpg"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Updated Doe",
    "picture": "https://example.com/new-avatar.jpg",
    "plan": "family-premium",
    "capabilities": { /* ... */ }
  }
}
```

---

### 2.3 Update User Preferences

**PUT** `/api/users/me/preferences`

Update user preferences.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "notifications": false,
  "darkMode": true,
  "biometrics": true,
  "analytics": false,
  "autoScan": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "preferences": {
    "notifications": false,
    "darkMode": true,
    "biometrics": true,
    "analytics": false,
    "autoScan": false
  }
}
```

---

### 2.4 Update User Plan

**PUT** `/api/users/me/plan`

Change user's subscription plan.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "plan": "premium"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "plan": "premium",
    "oldPlan": "free",
    "capabilities": {
      "meals": true,
      "workouts": true,
      "family": false,
      "coachPlatform": false,
      "wihyAI": false,
      "instacart": false,
      "adminDashboard": false,
      "usageAnalytics": false,
      "roleManagement": false,
      "whiteLabel": false
    },
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "invalid_plan",
  "message": "Plan 'invalid-plan' does not exist",
  "validPlans": ["free", "premium", "family-basic", "family-premium", "coach", "coach-family", "workplace-core", "workplace-plus", "corporate-enterprise", "k12-school", "university", "hospital", "hospitality"]
}
```

---

### 2.5 Add Add-On

**POST** `/api/users/me/addons`

Add an add-on to user's account (AI or Instacart).

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "addon": "ai"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "plan": "premium",
    "addOns": ["ai"],
    "capabilities": {
      "meals": true,
      "workouts": true,
      "family": false,
      "coachPlatform": false,
      "wihyAI": true,
      "instacart": false,
      "adminDashboard": false,
      "usageAnalytics": false,
      "roleManagement": false,
      "whiteLabel": false
    }
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "invalid_addon",
  "message": "Invalid add-on. Must be 'ai' or 'instacart'"
}
```

---

### 2.6 Remove Add-On

**DELETE** `/api/users/me/addons/:addon`

Remove an add-on from user's account.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `addon` - Add-on to remove (`ai` or `instacart`)

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "plan": "premium",
    "addOns": [],
    "capabilities": {
      "meals": true,
      "workouts": true,
      "family": false,
      "coachPlatform": false,
      "wihyAI": false,
      "instacart": false,
      "adminDashboard": false,
      "usageAnalytics": false,
      "roleManagement": false,
      "whiteLabel": false
    }
  }
}
```

---

### 2.7 Update Health Metrics

**PUT** `/api/users/me/health`

Update user's health metrics.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "healthScore": 92,
  "streakDays": 15,
  "weight": 75.5,
  "height": 180,
  "age": 30,
  "activityLevel": "moderate"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "metrics": {
    "healthScore": 92,
    "streakDays": 15,
    "weight": 75.5,
    "height": 180,
    "age": 30,
    "activityLevel": "moderate",
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 2.8 Get Subscription History

**GET** `/api/users/me/subscriptions`

Get user's plan change history.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "subscriptions": [
    {
      "id": "sub-123",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "oldPlan": "free",
      "newPlan": "premium",
      "reason": "upgrade",
      "changedAt": "2025-12-01T10:00:00.000Z"
    },
    {
      "id": "sub-124",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "oldPlan": "premium",
      "newPlan": "family-premium",
      "reason": "upgrade",
      "changedAt": "2025-12-15T10:00:00.000Z"
    }
  ]
}
```

---

### 2.9 Get User Capabilities

**GET** `/api/users/me/capabilities`

Get user's current capabilities based on plan.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "plan": "family-premium",
  "addOns": ["ai"],
  "capabilities": {
    "meals": true,
    "workouts": true,
    "family": true,
    "coachPlatform": false,
    "wihyAI": true,
    "instacart": true,
    "adminDashboard": false,
    "usageAnalytics": false,
    "roleManagement": false,
    "whiteLabel": false
  },
  "rateLimit": {
    "requestsPerHour": 1000,
    "aiMessagesPerDay": -1,
    "scanLimit": -1
  }
}
```

---

## 3. Plans

### 3.1 List All Plans

**GET** `/api/plans`

Get all available subscription plans.

**Authentication**: None required

**Request Headers**:
```http
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "plans": [
    {
      "name": "free",
      "displayName": "Free",
      "price": 0,
      "interval": "month",
      "description": "Essential features for getting started",
      "features": [
        "Barcode scanning",
        "Photo food analysis",
        "Medication tracking",
        "Basic health dashboard"
      ],
      "capabilities": {
        "meals": false,
        "workouts": false,
        "family": false,
        "coachPlatform": false,
        "wihyAI": false,
        "instacart": false,
        "adminDashboard": false,
        "usageAnalytics": false,
        "roleManagement": false,
        "whiteLabel": false
      }
    },
    {
      "name": "premium",
      "displayName": "Premium",
      "price": 8.99,
      "interval": "month",
      "description": "Unlock meal plans and workout programs",
      "features": [
        "All Free features",
        "Meal planning",
        "Workout programs",
        "Full health dashboard",
        "AI Coach add-on available ($4.99/mo)"
      ],
      "capabilities": {
        "meals": true,
        "workouts": true,
        "family": false,
        "coachPlatform": false,
        "wihyAI": false,
        "instacart": false,
        "adminDashboard": false,
        "usageAnalytics": false,
        "roleManagement": false,
        "whiteLabel": false
      }
    }
    /* ... other 11 plans */
  ]
}
```

---

### 3.2 Get Plan Details

**GET** `/api/plans/:planName`

Get details for a specific plan.

**Authentication**: None required

**Request Headers**:
```http
Content-Type: application/json
```

**URL Parameters**:
- `planName` - Plan identifier (e.g., `premium`, `family-basic`)

**Response** (200 OK):
```json
{
  "name": "family-premium",
  "displayName": "Family Premium",
  "price": 29.99,
  "interval": "month",
  "description": "Complete family health platform with AI & Instacart",
  "features": [
    "All Premium features",
    "Up to 5 family members",
    "WIHY AI Coach included",
    "Instacart integration included",
    "Family dashboard",
    "Priority support"
  ],
  "capabilities": {
    "meals": true,
    "workouts": true,
    "family": true,
    "coachPlatform": false,
    "wihyAI": true,
    "instacart": true,
    "adminDashboard": false,
    "usageAnalytics": false,
    "roleManagement": false,
    "whiteLabel": false
  },
  "limits": {
    "familyMembers": 5,
    "requestsPerHour": 1000,
    "aiMessagesPerDay": -1
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "plan_not_found",
  "message": "Plan 'invalid-plan' does not exist"
}
```

---

## 4. Organizations

### 4.1 Create Organization

**POST** `/api/organizations`

Create a new B2B organization.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "type": "corporate",
  "plan": "corporate-enterprise",
  "licenseCount": 500,
  "contactEmail": "admin@acmecorp.com",
  "contactPhone": "+1-555-0100",
  "billingEmail": "billing@acmecorp.com"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "organization": {
    "id": "org-550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "type": "corporate",
    "plan": "corporate-enterprise",
    "licenseCount": 500,
    "activeUsers": 0,
    "contactEmail": "admin@acmecorp.com",
    "contactPhone": "+1-555-0100",
    "billingEmail": "billing@acmecorp.com",
    "isActive": true,
    "createdAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 4.2 Get Organization

**GET** `/api/organizations/:id`

Get organization details.

**Authentication**: Required (organization member)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID

**Response** (200 OK):
```json
{
  "id": "org-550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Corporation",
  "type": "corporate",
  "plan": "corporate-enterprise",
  "licenseCount": 500,
  "activeUsers": 247,
  "contactEmail": "admin@acmecorp.com",
  "contactPhone": "+1-555-0100",
  "billingEmail": "billing@acmecorp.com",
  "whiteLabelConfig": {
    "logo": "https://cdn.wihy.com/org-logos/acme.png",
    "primaryColor": "#0066cc",
    "secondaryColor": "#ff6600",
    "appName": "Acme Wellness"
  },
  "customDomain": "wellness.acmecorp.com",
  "contractStartDate": "2025-01-01T00:00:00.000Z",
  "contractEndDate": "2026-01-01T00:00:00.000Z",
  "isActive": true,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-12-31T10:00:00.000Z"
}
```

**Error Response** (403 Forbidden):
```json
{
  "error": "forbidden",
  "message": "You do not have access to this organization"
}
```

---

### 4.3 Update Organization

**PUT** `/api/organizations/:id`

Update organization settings.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID

**Request Body**:
```json
{
  "name": "Acme Corporation Updated",
  "contactEmail": "newadmin@acmecorp.com",
  "licenseCount": 750
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "organization": {
    "id": "org-550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation Updated",
    "contactEmail": "newadmin@acmecorp.com",
    "licenseCount": 750,
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 4.4 Add User to Organization

**POST** `/api/organizations/:id/users`

Add a user to the organization.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID

**Request Body**:
```json
{
  "userId": "user-550e8400-e29b-41d4-a716-446655440000",
  "role": "employee"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "member": {
    "userId": "user-550e8400-e29b-41d4-a716-446655440000",
    "organizationId": "org-550e8400-e29b-41d4-a716-446655440000",
    "role": "employee",
    "joinedAt": "2025-12-31T10:00:00.000Z",
    "isActive": true
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "license_limit_reached",
  "message": "Organization has reached maximum license count (500/500)"
}
```

---

### 4.5 Remove User from Organization

**DELETE** `/api/organizations/:id/users/:userId`

Remove a user from the organization.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID
- `userId` - User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User removed from organization"
}
```

---

### 4.6 Update User Role

**PUT** `/api/organizations/:id/users/:userId/role`

Update user's role in organization.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID
- `userId` - User UUID

**Request Body**:
```json
{
  "role": "admin"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "member": {
    "userId": "user-550e8400-e29b-41d4-a716-446655440000",
    "organizationId": "org-550e8400-e29b-41d4-a716-446655440000",
    "role": "admin",
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 4.7 List Organization Members

**GET** `/api/organizations/:id/users`

Get all members of the organization.

**Authentication**: Required (organization member)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID

**Response** (200 OK):
```json
{
  "members": [
    {
      "userId": "user-1",
      "email": "admin@acmecorp.com",
      "name": "Admin User",
      "role": "admin",
      "joinedAt": "2025-01-01T10:00:00.000Z",
      "isActive": true
    },
    {
      "userId": "user-2",
      "email": "employee1@acmecorp.com",
      "name": "Employee One",
      "role": "employee",
      "joinedAt": "2025-01-15T10:00:00.000Z",
      "isActive": true
    }
  ],
  "totalMembers": 247,
  "activeMembers": 235,
  "licenseCount": 500
}
```

---

### 4.8 Get Organization Analytics

**GET** `/api/organizations/:id/analytics`

Get usage analytics for the organization.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID

**Response** (200 OK):
```json
{
  "organizationId": "org-550e8400-e29b-41d4-a716-446655440000",
  "period": "30days",
  "analytics": {
    "totalUsers": 247,
    "activeUsers": 235,
    "inactiveUsers": 12,
    "newUsersThisPeriod": 15,
    "averageHealthScore": 82.5,
    "totalScans": 15420,
    "totalMealsLogged": 8930,
    "totalWorkoutsCompleted": 3250,
    "engagementRate": 0.87
  },
  "topFeatures": [
    { "feature": "Meal Planning", "usageCount": 8930 },
    { "feature": "Barcode Scanning", "usageCount": 15420 },
    { "feature": "Workout Tracking", "usageCount": 3250 }
  ]
}
```

---

### 4.9 Update Organization Branding

**PUT** `/api/organizations/:id/branding`

Update white-label branding configuration.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID

**Request Body**:
```json
{
  "logo": "https://cdn.wihy.com/org-logos/acme-new.png",
  "primaryColor": "#0066cc",
  "secondaryColor": "#ff6600",
  "appName": "Acme Wellness Platform",
  "customDomain": "wellness.acmecorp.com",
  "supportEmail": "support@acmecorp.com",
  "termsUrl": "https://acmecorp.com/terms",
  "privacyUrl": "https://acmecorp.com/privacy"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "branding": {
    "logo": "https://cdn.wihy.com/org-logos/acme-new.png",
    "primaryColor": "#0066cc",
    "secondaryColor": "#ff6600",
    "appName": "Acme Wellness Platform",
    "customDomain": "wellness.acmecorp.com",
    "supportEmail": "support@acmecorp.com",
    "termsUrl": "https://acmecorp.com/terms",
    "privacyUrl": "https://acmecorp.com/privacy",
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 4.10 Get Organization Billing

**GET** `/api/organizations/:id/billing`

Get billing information for the organization.

**Authentication**: Required (admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Organization UUID

**Response** (200 OK):
```json
{
  "organizationId": "org-550e8400-e29b-41d4-a716-446655440000",
  "plan": "corporate-enterprise",
  "licenseCount": 500,
  "activeUsers": 247,
  "pricePerSeat": 7.00,
  "monthlyTotal": 3500.00,
  "billingEmail": "billing@acmecorp.com",
  "stripeCustomerId": "cus_ABC123",
  "stripeSubscriptionId": "sub_ABC123",
  "nextBillingDate": "2026-01-01T00:00:00.000Z",
  "contractStartDate": "2025-01-01T00:00:00.000Z",
  "contractEndDate": "2026-01-01T00:00:00.000Z"
}
```

---

## 5. Families

### 5.1 Create Family

**POST** `/api/families`

Create a new family group.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "The Smith Family",
  "plan": "family-premium"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "family": {
    "id": "family-550e8400-e29b-41d4-a716-446655440000",
    "ownerId": "user-550e8400-e29b-41d4-a716-446655440000",
    "name": "The Smith Family",
    "plan": "family-premium",
    "memberLimit": 5,
    "guardianCode": "WIHY-AB12CD",
    "createdAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 5.2 Get Family Details

**GET** `/api/families/:id`

Get family details.

**Authentication**: Required (family member)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Family UUID

**Response** (200 OK):
```json
{
  "id": "family-550e8400-e29b-41d4-a716-446655440000",
  "ownerId": "user-550e8400-e29b-41d4-a716-446655440000",
  "name": "The Smith Family",
  "plan": "family-premium",
  "memberLimit": 5,
  "memberCount": 3,
  "guardianCode": "WIHY-AB12CD",
  "createdAt": "2025-12-31T10:00:00.000Z",
  "updatedAt": "2025-12-31T10:00:00.000Z"
}
```

---

### 5.3 Update Family

**PUT** `/api/families/:id`

Update family settings.

**Authentication**: Required (owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Family UUID

**Request Body**:
```json
{
  "name": "The Smith-Johnson Family"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "family": {
    "id": "family-550e8400-e29b-41d4-a716-446655440000",
    "name": "The Smith-Johnson Family",
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 5.4 Join Family

**POST** `/api/families/join`

Join a family using guardian code.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "guardianCode": "WIHY-AB12CD"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "family": {
    "id": "family-550e8400-e29b-41d4-a716-446655440000",
    "name": "The Smith Family",
    "plan": "family-premium",
    "role": "member",
    "joinedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "member_limit_reached",
  "message": "Family has reached maximum member limit (5/5)"
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "invalid_code",
  "message": "Guardian code not found or expired"
}
```

---

### 5.5 Remove Family Member

**DELETE** `/api/families/:id/members/:userId`

Remove a member from the family.

**Authentication**: Required (owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Family UUID
- `userId` - User UUID to remove

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Member removed from family"
}
```

---

### 5.6 List Family Members

**GET** `/api/families/:id/members`

Get all family members.

**Authentication**: Required (family member)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Family UUID

**Response** (200 OK):
```json
{
  "familyId": "family-550e8400-e29b-41d4-a716-446655440000",
  "members": [
    {
      "userId": "user-1",
      "name": "John Smith",
      "email": "john@example.com",
      "role": "owner",
      "healthScore": 85,
      "streakDays": 12,
      "joinedAt": "2025-12-01T10:00:00.000Z"
    },
    {
      "userId": "user-2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "member",
      "healthScore": 90,
      "streakDays": 18,
      "joinedAt": "2025-12-05T10:00:00.000Z"
    }
  ],
  "totalMembers": 3,
  "memberLimit": 5
}
```

---

### 5.7 Get Guardian Code

**GET** `/api/families/:id/code`

Get family's guardian code.

**Authentication**: Required (owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Family UUID

**Response** (200 OK):
```json
{
  "familyId": "family-550e8400-e29b-41d4-a716-446655440000",
  "guardianCode": "WIHY-AB12CD",
  "createdAt": "2025-12-01T10:00:00.000Z"
}
```

---

### 5.8 Regenerate Guardian Code

**POST** `/api/families/:id/code`

Generate a new guardian code for the family.

**Authentication**: Required (owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Family UUID

**Response** (200 OK):
```json
{
  "success": true,
  "guardianCode": "WIHY-XY78ZW",
  "oldCode": "WIHY-AB12CD",
  "updatedAt": "2025-12-31T10:00:00.000Z"
}
```

---

### 5.9 Leave Family

**POST** `/api/families/leave`

Leave current family.

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Successfully left family"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "owner_cannot_leave",
  "message": "Family owner cannot leave. Transfer ownership or delete the family first"
}
```

---

## 6. Coaches

### 6.1 Create Coach Profile

**POST** `/api/coaches`

Create a coach profile.

**Authentication**: Required (coach plan)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "plan": "coach",
  "commissionRate": 20.00
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "coach": {
    "id": "coach-550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-550e8400-e29b-41d4-a716-446655440000",
    "plan": "coach",
    "commissionRate": 20.00,
    "totalRevenue": 0,
    "clientCount": 0,
    "isVerified": false,
    "createdAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 6.2 Get Coach Profile

**GET** `/api/coaches/:id`

Get coach profile details.

**Authentication**: Required (coach or admin)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID

**Response** (200 OK):
```json
{
  "id": "coach-550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-550e8400-e29b-41d4-a716-446655440000",
  "name": "Coach John",
  "email": "coach@example.com",
  "plan": "coach",
  "commissionRate": 20.00,
  "totalRevenue": 2450.00,
  "clientCount": 15,
  "stripeConnectAccountId": "acct_ABC123",
  "isVerified": true,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-12-31T10:00:00.000Z"
}
```

---

### 6.3 Update Coach Profile

**PUT** `/api/coaches/:id`

Update coach profile settings.

**Authentication**: Required (coach owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID

**Request Body**:
```json
{
  "commissionRate": 25.00
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "coach": {
    "id": "coach-550e8400-e29b-41d4-a716-446655440000",
    "commissionRate": 25.00,
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 6.4 Add Client

**POST** `/api/coaches/:id/clients`

Add a client to the coach's roster.

**Authentication**: Required (coach owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID

**Request Body**:
```json
{
  "clientId": "user-550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "client": {
    "clientId": "user-550e8400-e29b-41d4-a716-446655440000",
    "coachId": "coach-550e8400-e29b-41d4-a716-446655440000",
    "startedAt": "2025-12-31T10:00:00.000Z",
    "isActive": true
  }
}
```

---

### 6.5 Remove Client

**DELETE** `/api/coaches/:id/clients/:clientId`

Remove a client from the coach's roster.

**Authentication**: Required (coach owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID
- `clientId` - Client user UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Client removed from roster"
}
```

---

### 6.6 List Clients

**GET** `/api/coaches/:id/clients`

Get all clients of the coach.

**Authentication**: Required (coach owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID

**Response** (200 OK):
```json
{
  "coachId": "coach-550e8400-e29b-41d4-a716-446655440000",
  "clients": [
    {
      "clientId": "user-1",
      "name": "Client One",
      "email": "client1@example.com",
      "plan": "premium",
      "healthScore": 85,
      "startedAt": "2025-10-01T10:00:00.000Z",
      "isActive": true
    },
    {
      "clientId": "user-2",
      "name": "Client Two",
      "email": "client2@example.com",
      "plan": "premium",
      "healthScore": 78,
      "startedAt": "2025-11-15T10:00:00.000Z",
      "isActive": true
    }
  ],
  "totalClients": 15,
  "activeClients": 14
}
```

---

### 6.7 Get Revenue Analytics

**GET** `/api/coaches/:id/revenue`

Get coach's revenue analytics.

**Authentication**: Required (coach owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID

**Response** (200 OK):
```json
{
  "coachId": "coach-550e8400-e29b-41d4-a716-446655440000",
  "commissionRate": 20.00,
  "revenue": {
    "total": 2450.00,
    "thisMonth": 450.00,
    "lastMonth": 380.00,
    "thisYear": 2450.00
  },
  "clients": {
    "total": 15,
    "active": 14,
    "inactive": 1
  },
  "breakdown": [
    {
      "clientId": "user-1",
      "clientName": "Client One",
      "subscription": "premium",
      "monthlyValue": 8.99,
      "commission": 1.80,
      "startedAt": "2025-10-01T10:00:00.000Z"
    }
  ]
}
```

---

### 6.8 Connect Stripe Account

**POST** `/api/coaches/:id/stripe`

Connect Stripe account for payouts.

**Authentication**: Required (coach owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID

**Request Body**:
```json
{
  "stripeAccountId": "acct_ABC123XYZ"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "coach": {
    "id": "coach-550e8400-e29b-41d4-a716-446655440000",
    "stripeConnectAccountId": "acct_ABC123XYZ",
    "isVerified": true,
    "updatedAt": "2025-12-31T10:00:00.000Z"
  }
}
```

---

### 6.9 Get Payout History

**GET** `/api/coaches/:id/payouts`

Get payout history for the coach.

**Authentication**: Required (coach owner)

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**URL Parameters**:
- `id` - Coach UUID

**Response** (200 OK):
```json
{
  "coachId": "coach-550e8400-e29b-41d4-a716-446655440000",
  "payouts": [
    {
      "id": "payout-1",
      "amount": 450.00,
      "period": "2025-12",
      "status": "paid",
      "paidAt": "2025-12-31T10:00:00.000Z",
      "stripePayoutId": "po_ABC123"
    },
    {
      "id": "payout-2",
      "amount": 380.00,
      "period": "2025-11",
      "status": "paid",
      "paidAt": "2025-11-30T10:00:00.000Z",
      "stripePayoutId": "po_DEF456"
    }
  ],
  "totalPaidOut": 2070.00,
  "pendingAmount": 450.00
}
```

---

## 7. OAuth2 Server

### 7.1 Get User Info

**GET** `/api/oauth/userinfo`

Get user profile information (OAuth2 UserInfo endpoint).

**Authentication**: Required

**Request Headers**:
```http
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg",
  "provider": "google",
  "plan": "family-premium",
  "addOns": ["ai"],
  "capabilities": {
    "meals": true,
    "workouts": true,
    "family": true,
    "coachPlatform": false,
    "wihyAI": true,
    "instacart": true,
    "adminDashboard": false,
    "usageAnalytics": false,
    "roleManagement": false,
    "whiteLabel": false
  },
  "familyId": "family-550e8400-e29b-41d4-a716-446655440000",
  "familyRole": "owner",
  "guardianCode": "WIHY-AB12CD",
  "organizationId": null,
  "organizationRole": null,
  "coachId": null,
  "commissionRate": null,
  "healthScore": 85,
  "streakDays": 12,
  "memberSince": "2025-01-15T10:00:00.000Z",
  "preferences": {
    "notifications": true,
    "biometrics": true,
    "darkMode": false,
    "analytics": true,
    "autoScan": true
  }
}
```

---

### 7.2 Token Exchange

**POST** `/api/oauth/token`

Exchange authorization code for access token (OAuth2 Token endpoint).

**Authentication**: Client credentials required

**Request Headers**:
```http
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}
```

**Request Body** (form-encoded):
```
grant_type=authorization_code
code={authorization_code}
redirect_uri={redirect_uri}
client_id={client_id}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "profile email health_data offline_access"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code is invalid or expired"
}
```

---

## 8. Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error description",
  "details": {
    /* Optional additional context */
  }
}
```

### Common HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| `200 OK` | Request succeeded |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Invalid request parameters |
| `401 Unauthorized` | Authentication required or failed |
| `403 Forbidden` | Authenticated but not authorized |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Resource already exists |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Server error |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `invalid_credentials` | Email/password combination invalid |
| `unauthorized` | Session token missing or invalid |
| `forbidden` | User lacks required permissions |
| `not_found` | Requested resource doesn't exist |
| `user_exists` | Email already registered |
| `invalid_plan` | Plan name not recognized |
| `invalid_addon` | Add-on not recognized |
| `license_limit_reached` | Organization at max capacity |
| `member_limit_reached` | Family at max members |
| `invalid_code` | Guardian code invalid |
| `owner_cannot_leave` | Family owner must transfer ownership first |
| `rate_limit_exceeded` | API rate limit hit |

### Example Error Responses

**401 Unauthorized**:
```json
{
  "error": "unauthorized",
  "message": "Authentication required. Please provide a valid session token."
}
```

**403 Forbidden**:
```json
{
  "error": "forbidden",
  "message": "You do not have permission to access this resource",
  "details": {
    "requiredRole": "admin",
    "currentRole": "employee"
  }
}
```

**400 Bad Request**:
```json
{
  "error": "invalid_plan",
  "message": "Plan 'invalid-plan' does not exist",
  "validPlans": [
    "free", "premium", "family-basic", "family-premium",
    "coach", "coach-family", "workplace-core", "workplace-plus",
    "corporate-enterprise", "k12-school", "university",
    "hospital", "hospitality"
  ]
}
```

**429 Too Many Requests**:
```json
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded. Please try again later.",
  "details": {
    "limit": 1000,
    "period": "hour",
    "retryAfter": 3600
  }
}
```

---

## Authentication Flow Examples

### Example 1: Email/Password Login

```bash
# 1. Login
curl -X POST https://auth.wihy.ai/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response includes session_token
{
  "success": true,
  "session_token": "550e8400-e29b-41d4-a716-446655440000",
  "user": { ... }
}

# 2. Use session_token for authenticated requests
curl -X GET https://auth.wihy.ai/api/users/me \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000"
```

### Example 2: OAuth Flow (Google)

```bash
# 1. Redirect user to Google authorization
https://auth.wihy.ai/api/auth/google/authorize?redirect_uri=wihy://auth/callback

# 2. After user authorizes, Google redirects back:
wihy://auth/callback?session_token=550e8400-e29b-41d4-a716-446655440000

# 3. Use session_token for authenticated requests
curl -X GET https://auth.wihy.ai/api/users/me \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000"
```

### Example 3: Plan Upgrade Flow

```bash
# 1. Get current user profile
curl -X GET https://auth.wihy.ai/api/users/me \
  -H "Authorization: Bearer {token}"

# Response shows current plan
{
  "plan": "free",
  "capabilities": {
    "meals": false,
    "workouts": false
  }
}

# 2. Upgrade to premium
curl -X PUT https://auth.wihy.ai/api/users/me/plan \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"plan": "premium"}'

# Response shows updated capabilities
{
  "plan": "premium",
  "capabilities": {
    "meals": true,
    "workouts": true
  }
}
```

---

## Rate Limits

| Plan | Requests/Hour |
|------|---------------|
| Free | 100 |
| Premium | 1,000 |
| Family Plans | 1,000 |
| Coach Plans | 1,000 |
| B2B Plans | 10,000 |

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1735646400
```

---

**API Reference Version**: 1.0  
**Last Updated**: December 31, 2025  
**Total Endpoints**: 49
