# WIHY API Endpoint Reference for Client Integration

## ⚠️ Important: Correct Endpoints

You have been calling `auth.wihy.ai` for all requests. This is **incorrect** for payment and user operations.

Each service has its **own subdomain**:

| Service | Correct URL | Purpose |
|---------|-------------|---------|
| **Payment** | `https://payment.wihy.ai` | Stripe checkout, subscriptions, billing |
| **User** | `https://user.wihy.ai` | User profiles, account management |
| **Auth** | `https://auth.wihy.ai` | Login, registration, tokens only |

---

## 🔴 WRONG vs ✅ CORRECT

### Payment Checkout

```
❌ WRONG:  https://auth.wihy.ai/api/stripe/create-checkout-session
✅ CORRECT: https://payment.wihy.ai/api/stripe/create-checkout-session
```

### User Profile

```
❌ WRONG:  https://auth.wihy.ai/api/users/email/user@example.com
✅ CORRECT: https://user.wihy.ai/api/users/email/user@example.com
```

---

## 💳 Payment Service Endpoints

**Base URL:** `https://payment.wihy.ai`

### Create Checkout Session (POST)

**Endpoint:** `POST /api/stripe/create-checkout-session`

**Full URL:** `https://payment.wihy.ai/api/stripe/create-checkout-session`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "plan": "pro_monthly"
}
```

**Valid Plans:**
| Plan ID | Description |
|---------|-------------|
| `pro_monthly` | Pro plan, billed monthly |
| `pro_yearly` | Pro plan, billed yearly |
| `family_basic` | Family Basic plan |
| `family_pro` | Family Pro plan |
| `coach` | Coach plan |

⚠️ **Note:** `"premium"` is NOT a valid plan. Use one of the plans above.

**Success Response (200):**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_live_abc123...",
  "sessionId": "cs_live_abc123...",
  "plan": "pro_monthly",
  "email": "customer@example.com"
}
```

**Error Response (400) - Invalid Email:**
```json
{
  "success": false,
  "error": "Valid email is required",
  "code": "VALIDATION_ERROR"
}
```

**Error Response (400) - Invalid Plan:**
```json
{
  "success": false,
  "error": "Invalid plan: premium",
  "code": "VALIDATION_ERROR"
}
```

**Example cURL:**
```bash
curl -X POST https://payment.wihy.ai/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","plan":"pro_monthly"}'
```

**Example JavaScript:**
```javascript
const response = await fetch('https://payment.wihy.ai/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'customer@example.com',
    plan: 'pro_monthly'
  })
});

const data = await response.json();
if (data.success) {
  // Redirect to Stripe checkout
  window.location.href = data.checkoutUrl;
}
```

---

### Get Stripe Config (GET)

**Endpoint:** `GET /api/stripe/config`

**Full URL:** `https://payment.wihy.ai/api/stripe/config`

**Response:**
```json
{
  "publishableKey": "pk_live_..."
}
```

---

### Get Available Plans (GET)

**Endpoint:** `GET /api/stripe/plans`

**Full URL:** `https://payment.wihy.ai/api/stripe/plans`

**Response:**
```json
{
  "plans": {
    "pro_monthly": { "name": "Pro Monthly", "priceId": "price_..." },
    "pro_yearly": { "name": "Pro Yearly", "priceId": "price_..." },
    "family_basic": { "name": "Family Basic", "priceId": "price_..." },
    "family_pro": { "name": "Family Pro", "priceId": "price_..." },
    "coach": { "name": "Coach", "priceId": "price_..." }
  }
}
```

---

### Health Check (GET)

**Endpoint:** `GET /health`

**Full URL:** `https://payment.wihy.ai/health`

**Response:**
```json
{
  "status": "healthy",
  "service": "payment-service"
}
```

---

## 👤 User Service Endpoints

**Base URL:** `https://user.wihy.ai`

### Get Current User (GET) - Requires Auth Token

**Endpoint:** `GET /api/users/me`

**Full URL:** `https://user.wihy.ai/api/users/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",
    "plan": "free",
    "emailVerified": true,
    "lastLogin": "2026-01-19T10:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X GET https://user.wihy.ai/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Get User by ID (GET)

**Endpoint:** `GET /api/users/:id`

**Full URL:** `https://user.wihy.ai/api/users/uuid-here`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",
    "provider": "email",
    "profile": {},
    "plan": "free",
    "emailVerified": true,
    "lastLogin": "2026-01-19T10:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X GET https://user.wihy.ai/api/users/uuid-here
```

---

### Get User by Email (GET)

**Endpoint:** `GET /api/users/email/:email`

**Full URL:** `https://user.wihy.ai/api/users/email/user@example.com`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",
    "provider": "email",
    "profile_data": {},
    "email_verified": true,
    "last_login_at": "2026-01-19T10:00:00Z",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X GET https://user.wihy.ai/api/users/email/user@example.com
```

---

### Update User (PUT)

**Endpoint:** `PUT /api/users/:id`

**Full URL:** `https://user.wihy.ai/api/users/uuid-here`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "profile_data": {
    "date_of_birth": "1990-01-15",
    "gender": "female",
    "height": 165,
    "weight": 60
  }
}
```

**Example cURL:**
```bash
curl -X PUT https://user.wihy.ai/api/users/uuid-here \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith"}'
```

---

### Get User Profile (GET)

**Endpoint:** `GET /api/users/:userId/profile`

**Full URL:** `https://user.wihy.ai/api/users/uuid-here/profile`

**Response (200):**
```json
{
  "success": true,
  "profile": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "height": 180,
    "weight": 75,
    "activityLevel": "moderate",
    "goals": ["weight_loss", "muscle_gain"],
    "avatar": "https://...",
    "emailVerified": true,
    "plan": "free",
    "subscriptionStatus": "active",
    "createdAt": "2026-01-01T00:00:00Z",
    "settings": {
      "notificationsEnabled": true,
      "privacyLevel": "private",
      "unitsMetric": true
    }
  }
}
```

**Example cURL:**
```bash
curl -X GET https://user.wihy.ai/api/users/uuid-here/profile
```

---

### Update User Profile (PUT)

**Endpoint:** `PUT /api/users/:userId/profile`

**Full URL:** `https://user.wihy.ai/api/users/uuid-here/profile`

**Request Body:**
```json
{
  "name": "John Doe",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "height": 180,
  "weight": 75,
  "activity_level": "moderate",
  "goals": ["weight_loss", "muscle_gain"],
  "avatar": "https://example.com/avatar.jpg"
}
```

**Example cURL:**
```bash
curl -X PUT https://user.wihy.ai/api/users/uuid-here/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","height":180,"weight":75}'
```

---

### Get User Settings (GET)

**Endpoint:** `GET /api/users/:userId/settings`

**Full URL:** `https://user.wihy.ai/api/users/uuid-here/settings`

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "notificationsEnabled": true,
    "privacyLevel": "private",
    "unitsMetric": true,
    "theme": "system",
    "language": "en",
    "timezone": "UTC",
    "updatedAt": "2026-01-19T10:00:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X GET https://user.wihy.ai/api/users/uuid-here/settings
```

---

### Update User Settings (PUT)

**Endpoint:** `PUT /api/users/:userId/settings`

**Full URL:** `https://user.wihy.ai/api/users/uuid-here/settings`

**Request Body:**
```json
{
  "notificationsEnabled": true,
  "privacyLevel": "private",
  "unitsMetric": true,
  "theme": "dark",
  "language": "en",
  "timezone": "America/New_York"
}
```

**Valid Privacy Levels:** `public`, `friends`, `private`

**Example cURL:**
```bash
curl -X PUT https://user.wihy.ai/api/users/uuid-here/settings \
  -H "Content-Type: application/json" \
  -d '{"notificationsEnabled":true,"privacyLevel":"private","theme":"dark"}'
```

---

### Health Check (GET)

**Endpoint:** `GET /health`

**Full URL:** `https://user.wihy.ai/health`

**Response:**
```json
{
  "status": "healthy",
  "service": "user-service",
  "timestamp": "2026-01-19T10:00:00Z",
  "checks": {
    "database": "connected",
    "uptime": 12345.67
  }
}
```

---

## 🔐 Auth Service Endpoints (Reference)

**Base URL:** `https://auth.wihy.ai`

Auth service is ONLY for authentication operations:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/auth/refresh` | POST | Refresh token |
| `/auth/logout` | POST | Logout |
| `/auth/providers` | GET | OAuth providers |
| `/health` | GET | Health check |

⚠️ **Do NOT call** `/api/stripe/*` or `/api/users/*` on `auth.wihy.ai` - these will return 404.

---

## 📊 Quick Reference Table

| What You Want | Correct URL |
|---------------|-------------|
| Create Stripe checkout | `POST https://payment.wihy.ai/api/stripe/create-checkout-session` |
| Get Stripe config | `GET https://payment.wihy.ai/api/stripe/config` |
| Get available plans | `GET https://payment.wihy.ai/api/stripe/plans` |
| Get current user (auth required) | `GET https://user.wihy.ai/api/users/me` |
| Get user by ID | `GET https://user.wihy.ai/api/users/:id` |
| Get user by email | `GET https://user.wihy.ai/api/users/email/:email` |
| Update user | `PUT https://user.wihy.ai/api/users/:id` |
| Get user profile | `GET https://user.wihy.ai/api/users/:userId/profile` |
| Update user profile | `PUT https://user.wihy.ai/api/users/:userId/profile` |
| Get user settings | `GET https://user.wihy.ai/api/users/:userId/settings` |
| Update user settings | `PUT https://user.wihy.ai/api/users/:userId/settings` |
| Login | `POST https://auth.wihy.ai/auth/login` |
| Register | `POST https://auth.wihy.ai/auth/register` |

---

## 🔧 Troubleshooting

### Error: 404 Not Found

**Cause:** You're calling the wrong service.

```
❌ https://auth.wihy.ai/api/stripe/create-checkout-session → 404
✅ https://payment.wihy.ai/api/stripe/create-checkout-session → 200
```

### Error: "Invalid plan: premium"

**Cause:** You're using an invalid plan ID.

```
❌ "plan": "premium"
✅ "plan": "pro_monthly"
```

Valid plans: `pro_monthly`, `pro_yearly`, `family_basic`, `family_pro`, `coach`

### Error: "Valid email is required"

**Cause:** Email is missing, empty, or invalid format.

```
❌ "email": ""
❌ "email": "not-an-email"
✅ "email": "user@example.com"
```

---

## 📞 Support

If you have questions about these endpoints, please contact the WIHY development team.

---

**Last Updated:** January 19, 2026
