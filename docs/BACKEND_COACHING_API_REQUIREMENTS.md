# Backend Coaching API Requirements

## Overview

The frontend app (`coachService.ts`) expects coaching endpoints at `services.wihy.ai` but they are returning **404 Not Found**. These endpoints are required for the Coach and Client onboarding flows to work.

**Current Status:** ❌ Not deployed  
**Priority:** 🔴 CRITICAL (blocking coach/client features)

---

## Missing Route Prefixes

The gateway needs to register these route prefixes:

```
/api/coaches/*
/api/coaching/*
/api/families/*
```

**Currently Available Routes (from 404 response):**
```
/api/scan/*, /api/meals/*, /api/fitness/*, /api/consumption/*, 
/api/nutrition-tracking/*, /api/energy/*, /api/goals/*, /api/goals-dashboard/*,
/api/global-goals/*, /api/wellness/*, /api/progress/*, /api/notifications/*,
/api/reminders/*, /api/user/*, /api/health/*, /api/shopping/*, /api/research/*,
/api/search/*, /api/news/*, /api/nutrition/*, /api/social/*, /api/tracking/*,
/api/integration/*, /api/ai/*, /api/analysis/*, /api/content/*, /api/storage/*,
/api/analytics/*
```

---

## Coach Profile & Discovery Endpoints

### 0a. Get Coach Profile (Public)

```
GET /api/coaches/{coachId}/profile
```

**Purpose:** Get a coach's public profile for clients to view

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "coach_123",
    "name": "Sarah Mitchell",
    "title": "Registered Dietitian & Health Coach",
    "avatar_url": "https://storage.wihy.ai/avatars/coach_123.jpg",
    "bio": "Passionate about helping clients achieve sustainable weight loss through balanced nutrition and lifestyle changes.",
    "specialties": ["Weight Loss", "Meal Planning", "Diabetes"],
    "certifications": ["RD", "CDN", "CPT"],
    "years_experience": 8,
    "location": {
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "timezone": "America/New_York"
    },
    "pricing": {
      "session_rate": 75.00,
      "currency": "USD",
      "session_duration_minutes": 60
    },
    "rating": {
      "average": 4.9,
      "total_reviews": 127
    },
    "availability": {
      "accepting_clients": true,
      "next_available": "2026-01-22T10:00:00Z"
    },
    "social_links": {
      "website": "https://sarahmitchell.com",
      "instagram": "@sarahfitness",
      "linkedin": "sarahmitchellrd"
    },
    "created_at": "2025-06-15T00:00:00Z"
  }
}
```

---

### 0b. Update Coach Profile (Coach Only)

```
PUT /api/coaches/{coachId}/profile
```

**Purpose:** Coach updates their own profile

**Request Body:**
```json
{
  "name": "Sarah Mitchell",
  "title": "Registered Dietitian & Health Coach",
  "avatar_url": "https://storage.wihy.ai/avatars/coach_123.jpg",
  "bio": "Passionate about helping clients achieve sustainable weight loss...",
  "specialties": ["Weight Loss", "Meal Planning", "Diabetes"],
  "certifications": ["RD", "CDN", "CPT"],
  "years_experience": 8,
  "location": {
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "timezone": "America/New_York"
  },
  "pricing": {
    "session_rate": 75.00,
    "currency": "USD",
    "session_duration_minutes": 60
  },
  "availability": {
    "accepting_clients": true,
    "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "available_hours": {
      "start": "09:00",
      "end": "17:00"
    }
  },
  "social_links": {
    "website": "https://sarahmitchell.com",
    "instagram": "@sarahfitness",
    "linkedin": "sarahmitchellrd"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "coach_123",
    "profile_complete": true,
    "updated_at": "2026-01-20T16:00:00Z"
  }
}
```

---

### 0c. Search/Discover Coaches (Client View)

```
GET /api/coaches/discover
GET /api/coaches/discover?specialty=Weight+Loss
GET /api/coaches/discover?location=New+York
GET /api/coaches/discover?min_rating=4.5
GET /api/coaches/discover?max_price=100
GET /api/coaches/discover?search=Sarah
```

**Purpose:** Clients search for available coaches ("Find Your Coach" screen)

**Query Parameters:**
- `search` (optional): Search by name or bio text
- `specialty` (optional): Filter by specialty tag
- `location` (optional): Filter by city/state
- `min_rating` (optional): Minimum rating (e.g., 4.5)
- `max_price` (optional): Maximum session rate
- `accepting_clients` (optional): Only show coaches accepting new clients (default: true)
- `sort` (optional): `rating` | `price_low` | `price_high` | `experience` | `reviews`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "coaches": [
      {
        "id": "coach_123",
        "name": "Sarah Mitchell",
        "title": "Registered Dietitian & Health Coach",
        "avatar_url": "https://storage.wihy.ai/avatars/coach_123.jpg",
        "bio": "Passionate about helping clients achieve sustainable weight loss...",
        "specialties": ["Weight Loss", "Meal Planning", "Diabetes"],
        "certifications": ["RD", "CDN", "CPT"],
        "years_experience": 8,
        "location": {
          "city": "New York",
          "state": "NY"
        },
        "pricing": {
          "session_rate": 75.00,
          "currency": "USD"
        },
        "rating": {
          "average": 4.9,
          "total_reviews": 127
        },
        "accepting_clients": true
      },
      {
        "id": "coach_456",
        "name": "Marcus Johnson",
        "title": "Sports Nutritionist",
        "avatar_url": "https://storage.wihy.ai/avatars/coach_456.jpg",
        "bio": "Former athlete turned nutrition expert...",
        "specialties": ["Sports Nutrition", "Muscle Building", "Performance"],
        "certifications": ["CSCS", "CISSN"],
        "years_experience": 12,
        "location": {
          "city": "Los Angeles",
          "state": "CA"
        },
        "pricing": {
          "session_rate": 90.00,
          "currency": "USD"
        },
        "rating": {
          "average": 5.0,
          "total_reviews": 89
        },
        "accepting_clients": true
      }
    ],
    "total": 47,
    "page": 1,
    "limit": 20,
    "filters_applied": {
      "specialty": "Weight Loss"
    }
  }
}
```

---

### 0d. Get Coach Reviews

```
GET /api/coaches/{coachId}/reviews
GET /api/coaches/{coachId}/reviews?page=1&limit=10
```

**Purpose:** Get reviews for a specific coach

**Response:**
```json
{
  "success": true,
  "data": {
    "coach_id": "coach_123",
    "rating_summary": {
      "average": 4.9,
      "total_reviews": 127,
      "distribution": {
        "5": 112,
        "4": 10,
        "3": 3,
        "2": 1,
        "1": 1
      }
    },
    "reviews": [
      {
        "id": "review_001",
        "client_name": "John D.",
        "rating": 5,
        "title": "Life changing experience",
        "content": "Sarah helped me lose 30 pounds and keep it off. Her meal plans are easy to follow and she's always available to answer questions.",
        "created_at": "2026-01-15T00:00:00Z",
        "verified_client": true
      }
    ],
    "page": 1,
    "limit": 10
  }
}
```

---

### 0e. Submit Coach Review (Client Only)

```
POST /api/coaches/{coachId}/reviews
```

**Purpose:** Client submits a review for their coach

**Request Body:**
```json
{
  "client_id": "client_456",
  "rating": 5,
  "title": "Amazing coach!",
  "content": "Sarah has been incredibly helpful..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review_id": "review_128",
    "status": "published",
    "created_at": "2026-01-20T16:00:00Z"
  }
}
```

---

### 0f. Book Coach Session

```
POST /api/coaches/{coachId}/book
```

**Purpose:** Client books a session with a coach

**Request Body:**
```json
{
  "client_id": "client_456",
  "date": "2026-01-22",
  "time": "10:00",
  "duration_minutes": 60,
  "session_type": "initial_consultation",
  "notes": "I want to discuss my weight loss goals"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": "booking_789",
    "coach_id": "coach_123",
    "client_id": "client_456",
    "scheduled_at": "2026-01-22T10:00:00Z",
    "duration_minutes": 60,
    "status": "confirmed",
    "meeting_link": "https://meet.wihy.ai/session/booking_789"
  }
}
```

---

### 0g. Get Coach Availability

```
GET /api/coaches/{coachId}/availability
GET /api/coaches/{coachId}/availability?start_date=2026-01-20&end_date=2026-01-27
```

**Purpose:** Get available time slots for booking

**Response:**
```json
{
  "success": true,
  "data": {
    "coach_id": "coach_123",
    "timezone": "America/New_York",
    "available_slots": [
      {
        "date": "2026-01-22",
        "slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]
      },
      {
        "date": "2026-01-23",
        "slots": ["09:00", "10:00", "14:00", "15:00", "16:00"]
      }
    ]
  }
}
```

---

### 0h. Create Coach Profile (New Coach Registration)

```
POST /api/coaches/profile
```

**Purpose:** Create a new coach profile during coach onboarding (CoachProfileSetup screen)

**Request Headers:**
```
Authorization: Bearer [token]
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Sarah Mitchell",
  "email": "sarah@example.com",
  "phone": "+1-555-123-4567",
  "title": "Registered Dietitian & Health Coach",
  "bio": "Passionate about helping clients achieve sustainable weight loss...",
  "specialties": ["Weight Loss", "Meal Planning", "Diabetes"],
  "certifications": [
    {
      "name": "Registered Dietitian",
      "abbreviation": "RD",
      "issuing_org": "Academy of Nutrition and Dietetics",
      "year_obtained": 2018
    }
  ],
  "years_experience": 8,
  "location": {
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "timezone": "America/New_York"
  },
  "pricing": {
    "session_rate": 75.00,
    "currency": "USD",
    "session_duration_minutes": 60
  },
  "availability": {
    "accepting_clients": true,
    "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "available_hours": {
      "start": "09:00",
      "end": "17:00"
    }
  },
  "social_links": {
    "website": "https://sarahmitchell.com",
    "instagram": "@sarahfitness",
    "linkedin": "sarahmitchellrd"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "coach_123",
    "profile_complete": true,
    "created_at": "2026-01-20T16:00:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid profile data",
    "details": {
      "name": "Name is required",
      "specialties": "At least one specialty is required"
    }
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "PROFILE_EXISTS",
    "message": "Coach profile already exists for this user"
  }
}
```

---

### 0i. Get Coach Bookings (Coach View)

```
GET /api/coaches/{coachId}/bookings
GET /api/coaches/{coachId}/bookings?status=pending
GET /api/coaches/{coachId}/bookings?status=confirmed
GET /api/coaches/{coachId}/bookings?start_date=2026-01-20&end_date=2026-01-27
```

**Purpose:** Get all bookings for a coach (used in BookingsManagement screen)

**Query Parameters:**
- `status` (optional): `pending` | `confirmed` | `completed` | `cancelled` | `all`
- `start_date` (optional): Filter bookings from this date (ISO 8601)
- `end_date` (optional): Filter bookings until this date (ISO 8601)
- `client_id` (optional): Filter by specific client
- `sort` (optional): `date_asc` | `date_desc` (default: `date_asc`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_789",
        "client": {
          "id": "client_456",
          "name": "John Doe",
          "email": "john@example.com",
          "avatar_url": "https://storage.wihy.ai/avatars/client_456.jpg"
        },
        "scheduled_at": "2026-01-22T10:00:00Z",
        "duration_minutes": 60,
        "session_type": "initial_consultation",
        "status": "confirmed",
        "notes": "Wants to discuss weight loss goals",
        "meeting_link": "https://meet.wihy.ai/session/booking_789",
        "created_at": "2026-01-18T14:30:00Z"
      },
      {
        "id": "booking_790",
        "client": {
          "id": "client_457",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "avatar_url": null
        },
        "scheduled_at": "2026-01-22T14:00:00Z",
        "duration_minutes": 30,
        "session_type": "follow_up",
        "status": "pending",
        "notes": "Weekly check-in",
        "meeting_link": null,
        "created_at": "2026-01-19T09:15:00Z"
      }
    ],
    "summary": {
      "total": 15,
      "pending": 3,
      "confirmed": 8,
      "completed": 2,
      "cancelled": 2
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_pages": 1,
      "total_count": 15
    }
  }
}
```

---

### 0j. Update Booking Status (Coach Action)

```
PUT /api/coaches/{coachId}/bookings/{bookingId}
```

**Purpose:** Coach confirms, cancels, or updates a booking

**Request Body (Confirm):**
```json
{
  "action": "confirm",
  "meeting_link": "https://meet.wihy.ai/session/booking_789"
}
```

**Request Body (Cancel):**
```json
{
  "action": "cancel",
  "reason": "Schedule conflict - rescheduling required"
}
```

**Request Body (Complete):**
```json
{
  "action": "complete",
  "notes": "Session completed successfully. Follow-up scheduled for next week.",
  "follow_up_date": "2026-01-29"
}
```

**Request Body (Reschedule):**
```json
{
  "action": "reschedule",
  "new_date": "2026-01-25",
  "new_time": "14:00",
  "reason": "Client requested different time"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking_789",
    "status": "confirmed",
    "meeting_link": "https://meet.wihy.ai/session/booking_789",
    "updated_at": "2026-01-20T10:30:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Coach is not authorized to manage this booking"
  }
}
```

---

## Required Endpoints

### 1. Coach Overview

```
GET /api/coaches/{coachId}/overview
```

**Purpose:** Dashboard data for coach's main screen

**Request Headers:**
```
X-Client-ID: wihy_services_*
X-Client-Secret: [secret]
Authorization: Bearer [token]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coach_id": "coach_123",
    "total_clients": 5,
    "active_clients": 3,
    "pending_invitations": 2,
    "total_revenue": 1250.00,
    "monthly_revenue": 450.00,
    "commission_rate": 0.01,
    "recent_activity": [
      {
        "type": "client_joined",
        "client_name": "John Doe",
        "timestamp": "2026-01-20T10:00:00Z"
      }
    ]
  }
}
```

---

### 2. List Coach's Clients

```
GET /api/coaches/{coachId}/clients
GET /api/coaches/{coachId}/clients?status=active
GET /api/coaches/{coachId}/clients?status=pending
```

**Purpose:** Get all clients assigned to a coach

**Query Parameters:**
- `status` (optional): `active` | `pending` | `inactive`

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "client_456",
        "name": "John Doe",
        "email": "john@example.com",
        "status": "active",
        "joined_date": "2026-01-15T00:00:00Z",
        "health_score": 82,
        "last_active": "2026-01-20T09:30:00Z",
        "assigned_programs": {
          "meal_plan": "weight_loss_plan",
          "workout": "strength_training"
        }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

### 3. Add Client to Coach

```
POST /api/coaches/{coachId}/clients
```

**Purpose:** Directly add a client (after onboarding)

**Request Body:**
```json
{
  "client_id": "client_456",
  "email": "client@example.com",
  "name": "John Doe",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "relationship_id": "rel_789",
    "coach_id": "coach_123",
    "client_id": "client_456",
    "status": "active",
    "created_at": "2026-01-20T16:00:00Z"
  }
}
```

---

### 4. Remove Client

```
DELETE /api/coaches/{coachId}/clients/{clientId}
```

**Purpose:** Remove a client from coach's roster

**Response:**
```json
{
  "success": true,
  "message": "Client removed successfully"
}
```

---

### 5. Update Client Status

```
PUT /api/coaches/{coachId}/clients/{clientId}/status
```

**Purpose:** Change client status (active, inactive, paused)

**Request Body:**
```json
{
  "status": "inactive",
  "reason": "Client request"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client_id": "client_456",
    "status": "inactive",
    "updated_at": "2026-01-20T16:00:00Z"
  }
}
```

---

### 6. Get Client Dashboard (for Coach view)

```
GET /api/coaches/{coachId}/clients/{clientId}/dashboard
```

**Purpose:** Coach viewing a specific client's data

**Response:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "client_456",
      "name": "John Doe",
      "email": "john@example.com",
      "health_score": 82,
      "goals": ["Lose Weight", "Build Muscle"]
    },
    "progress": {
      "weight_change": -5.2,
      "workouts_completed": 12,
      "meals_logged": 45,
      "streak_days": 7
    },
    "assigned_programs": {
      "meal_plan": {...},
      "workout": {...}
    },
    "recent_activity": [...]
  }
}
```

---

## Invitation Endpoints

### 7. Send Invitation

```
POST /api/coaching/invitations/send
```

**Purpose:** Coach invites a new client via email

**Request Body:**
```json
{
  "coach_id": "coach_123",
  "client_email": "newclient@example.com",
  "client_name": "Jane Smith",
  "message": "I'd like to help you reach your fitness goals!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invitation_id": "inv_abc123",
    "status": "pending",
    "expires_at": "2026-01-27T16:00:00Z",
    "invitation_link": "https://app.wihy.ai/invite/inv_abc123"
  }
}
```

---

### 8. Get Pending Invitations

```
GET /api/coaching/invitations/pending?coachId={coachId}
```

**Purpose:** List all pending invitations sent by a coach

**Response:**
```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "inv_abc123",
        "client_email": "newclient@example.com",
        "client_name": "Jane Smith",
        "status": "pending",
        "sent_at": "2026-01-20T10:00:00Z",
        "expires_at": "2026-01-27T10:00:00Z"
      }
    ]
  }
}
```

---

### 9. Accept Invitation

```
POST /api/coaching/invitations/accept
```

**Purpose:** Client accepts coach invitation

**Request Body:**
```json
{
  "invitation_id": "inv_abc123",
  "client_id": "client_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "relationship_id": "rel_789",
    "coach_id": "coach_123",
    "client_id": "client_456",
    "status": "active"
  }
}
```

---

### 10. Decline Invitation

```
POST /api/coaching/invitations/decline
```

**Purpose:** Client declines coach invitation

**Request Body:**
```json
{
  "invitation_id": "inv_abc123",
  "reason": "Not interested at this time"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation declined"
}
```

---

### 11. Get Client's Coach

```
GET /api/coaching/relationships/client/{clientId}/coach
```

**Purpose:** Get the coach assigned to a client

**Response:**
```json
{
  "success": true,
  "data": {
    "coach": {
      "id": "coach_123",
      "name": "Sarah Mitchell",
      "email": "sarah@coach.com",
      "specialty": "Weight Loss",
      "avatar_url": "https://..."
    },
    "relationship": {
      "id": "rel_789",
      "status": "active",
      "started_at": "2026-01-15T00:00:00Z"
    }
  }
}
```

---

## Program Assignment Endpoints

### 12. Assign Meal Program

```
POST /api/coaches/{coachId}/clients/{clientId}/meal-program
```

**Request Body:**
```json
{
  "program_id": "meal_plan_123",
  "start_date": "2026-01-21",
  "notes": "Focus on high protein"
}
```

---

### 13. Get Client's Meal Programs

```
GET /api/coaches/{coachId}/clients/{clientId}/meal-programs
```

---

### 14. Remove Meal Program

```
DELETE /api/coaches/{coachId}/clients/{clientId}/meal-program/{assignmentId}
```

---

### 15. Create Meal Plan for Client

```
POST /api/coaches/{coachId}/clients/{clientId}/create-meal-plan
```

**Request Body:**
```json
{
  "name": "Custom Weight Loss Plan",
  "description": "Tailored for John",
  "daily_calories": 1800,
  "meals": [...]
}
```

---

### 16. Create Workout Plan for Client

```
POST /api/coaches/{coachId}/clients/{clientId}/create-workout-plan
```

**Request Body:**
```json
{
  "name": "Strength Building",
  "description": "4-week progressive program",
  "days_per_week": 4,
  "workouts": [...]
}
```

---

### 17. Assign Workout Program

```
POST /api/coaches/{coachId}/clients/{clientId}/workout-program
```

---

## Database Schema Required

### coach_profiles table
```sql
CREATE TABLE coach_profiles (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id) UNIQUE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  specialties JSONB DEFAULT '[]', -- ["Weight Loss", "Meal Planning"]
  certifications JSONB DEFAULT '[]', -- ["RD", "CDN", "CPT"]
  years_experience INT DEFAULT 0,
  
  -- Location
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'USA',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  
  -- Pricing
  session_rate DECIMAL(10,2) DEFAULT 75.00,
  currency VARCHAR(3) DEFAULT 'USD',
  session_duration_minutes INT DEFAULT 60,
  
  -- Availability
  accepting_clients BOOLEAN DEFAULT true,
  available_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
  available_hours_start TIME DEFAULT '09:00',
  available_hours_end TIME DEFAULT '17:00',
  
  -- Social
  website_url TEXT,
  instagram_handle VARCHAR(100),
  linkedin_handle VARCHAR(100),
  
  -- Status
  profile_complete BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coach_profiles_specialties ON coach_profiles USING GIN(specialties);
CREATE INDEX idx_coach_profiles_location ON coach_profiles(city, state);
CREATE INDEX idx_coach_profiles_accepting ON coach_profiles(accepting_clients);
```

### coaches table (for revenue tracking)
```sql
CREATE TABLE coaches (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  profile_id VARCHAR(50) REFERENCES coach_profiles(id),
  commission_rate DECIMAL(5,4) DEFAULT 0.01,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  stripe_connect_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### coach_reviews table
```sql
CREATE TABLE coach_reviews (
  id VARCHAR(50) PRIMARY KEY,
  coach_id VARCHAR(50) REFERENCES coaches(id),
  client_id VARCHAR(50) REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  verified_client BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'published', -- published, hidden, flagged
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coach_reviews_coach ON coach_reviews(coach_id);
CREATE INDEX idx_coach_reviews_rating ON coach_reviews(rating);
```

### coach_bookings table
```sql
CREATE TABLE coach_bookings (
  id VARCHAR(50) PRIMARY KEY,
  coach_id VARCHAR(50) REFERENCES coaches(id),
  client_id VARCHAR(50) REFERENCES users(id),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 60,
  session_type VARCHAR(50), -- initial_consultation, follow_up, check_in
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  meeting_link TEXT,
  notes TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coach_bookings_coach ON coach_bookings(coach_id);
CREATE INDEX idx_coach_bookings_client ON coach_bookings(client_id);
CREATE INDEX idx_coach_bookings_scheduled ON coach_bookings(scheduled_at);
```

### coach_client_relationships table
```sql
CREATE TABLE coach_client_relationships (
  id VARCHAR(50) PRIMARY KEY,
  coach_id VARCHAR(50) REFERENCES coaches(id),
  client_id VARCHAR(50) REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### coaching_invitations table
```sql
CREATE TABLE coaching_invitations (
  id VARCHAR(50) PRIMARY KEY,
  coach_id VARCHAR(50) REFERENCES coaches(id),
  client_email VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, expired
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  responded_at TIMESTAMP
);
```

### program_assignments table
```sql
CREATE TABLE program_assignments (
  id VARCHAR(50) PRIMARY KEY,
  coach_id VARCHAR(50) REFERENCES coaches(id),
  client_id VARCHAR(50) REFERENCES users(id),
  program_type VARCHAR(20), -- meal_plan, workout
  program_id VARCHAR(50),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Specialty Tags (Standard List)

Use these standard specialty tags for filtering:

```json
[
  "Weight Loss",
  "Meal Planning", 
  "Diabetes",
  "Sports Nutrition",
  "Muscle Building",
  "Performance",
  "Plant-Based",
  "Vegan",
  "Keto",
  "Heart Health",
  "Gut Health",
  "Eating Disorders",
  "Prenatal Nutrition",
  "Pediatric Nutrition",
  "Senior Nutrition",
  "Food Allergies",
  "Autoimmune",
  "PCOS",
  "Thyroid",
  "General Wellness"
]
```

---

## Certification Abbreviations

Common certifications for validation:

```json
[
  "RD",      // Registered Dietitian
  "RDN",     // Registered Dietitian Nutritionist
  "CDN",     // Certified Dietitian Nutritionist
  "CNS",     // Certified Nutrition Specialist
  "CPT",     // Certified Personal Trainer
  "CSCS",    // Certified Strength & Conditioning Specialist
  "CISSN",   // Certified Sports Nutritionist
  "CDE",     // Certified Diabetes Educator
  "CHC",     // Certified Health Coach
  "NBC-HWC", // National Board Certified Health & Wellness Coach
  "ACE",     // ACE Certified
  "NASM",    // NASM Certified
  "ISSA",    // ISSA Certified
  "ACSM",    // ACSM Certified
  "PN1",     // Precision Nutrition Level 1
  "PN2"      // Precision Nutrition Level 2
]
```

---

## Error Response Format

All endpoints should return errors in this format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `COACH_NOT_FOUND` - Coach ID doesn't exist
- `CLIENT_NOT_FOUND` - Client ID doesn't exist
- `INVITATION_NOT_FOUND` - Invitation ID doesn't exist
- `INVITATION_EXPIRED` - Invitation has expired
- `ALREADY_HAS_COACH` - Client already assigned to a coach
- `UNAUTHORIZED` - Not authorized for this action

---

## Testing

Once deployed, test with:

```bash
# Test coach discovery (Find Your Coach)
curl -X GET "https://services.wihy.ai/api/coaches/discover" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test coach discovery with filters
curl -X GET "https://services.wihy.ai/api/coaches/discover?specialty=Weight+Loss&min_rating=4.5" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test get coach profile
curl -X GET "https://services.wihy.ai/api/coaches/coach_123/profile" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test coach overview (dashboard)
curl -X GET "https://services.wihy.ai/api/coaches/coach_123/overview" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test update coach profile
curl -X PUT "https://services.wihy.ai/api/coaches/coach_123/profile" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Mitchell",
    "title": "Registered Dietitian & Health Coach",
    "bio": "Passionate about helping clients...",
    "specialties": ["Weight Loss", "Meal Planning"],
    "certifications": ["RD", "CDN"],
    "years_experience": 8,
    "location": {"city": "New York", "state": "NY"},
    "pricing": {"session_rate": 75.00}
  }'

# Test get coach reviews
curl -X GET "https://services.wihy.ai/api/coaches/coach_123/reviews" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test get coach availability
curl -X GET "https://services.wihy.ai/api/coaches/coach_123/availability?start_date=2026-01-20&end_date=2026-01-27" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test book session
curl -X POST "https://services.wihy.ai/api/coaches/coach_123/book" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client_456",
    "date": "2026-01-22",
    "time": "10:00",
    "session_type": "initial_consultation"
  }'

# Test create coach profile (new registration)
curl -X POST "https://services.wihy.ai/api/coaches/profile" \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Mitchell",
    "email": "sarah@example.com",
    "title": "Registered Dietitian",
    "bio": "Passionate about helping clients...",
    "specialties": ["Weight Loss", "Meal Planning"],
    "certifications": [{"name": "RD", "abbreviation": "RD"}],
    "years_experience": 8,
    "location": {"city": "New York", "state": "NY", "timezone": "America/New_York"},
    "pricing": {"session_rate": 75.00, "currency": "USD"}
  }'

# Test get coach bookings
curl -X GET "https://services.wihy.ai/api/coaches/coach_123/bookings" \
  -H "Authorization: Bearer [token]"

# Test get coach bookings with filters
curl -X GET "https://services.wihy.ai/api/coaches/coach_123/bookings?status=pending" \
  -H "Authorization: Bearer [token]"

# Test confirm booking
curl -X PUT "https://services.wihy.ai/api/coaches/coach_123/bookings/booking_789" \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "confirm",
    "meeting_link": "https://meet.wihy.ai/session/booking_789"
  }'

# Test cancel booking
curl -X PUT "https://services.wihy.ai/api/coaches/coach_123/bookings/booking_789" \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "cancel",
    "reason": "Client requested cancellation"
  }'

# Expected: 200 with data
# Current: 404 "Route not found"
```

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/coaches/discover` | GET | Search coaches (Find Your Coach) |
| `/api/coaches/profile` | POST | **NEW:** Create coach profile (registration) |
| `/api/coaches/{id}/profile` | GET | Get coach public profile |
| `/api/coaches/{id}/profile` | PUT | Update coach profile (coach only) |
| `/api/coaches/{id}/overview` | GET | Coach dashboard data |
| `/api/coaches/{id}/clients` | GET | List coach's clients |
| `/api/coaches/{id}/clients` | POST | Add client to coach |
| `/api/coaches/{id}/clients/{clientId}` | DELETE | Remove client |
| `/api/coaches/{id}/clients/{clientId}/status` | PUT | Update client status |
| `/api/coaches/{id}/clients/{clientId}/dashboard` | GET | Coach view of client |
| `/api/coaches/{id}/reviews` | GET | Get coach reviews |
| `/api/coaches/{id}/reviews` | POST | Submit review (client only) |
| `/api/coaches/{id}/availability` | GET | Get booking slots |
| `/api/coaches/{id}/bookings` | GET | **NEW:** List all coach bookings |
| `/api/coaches/{id}/bookings/{bookingId}` | PUT | **NEW:** Update booking status |
| `/api/coaches/{id}/book` | POST | Book a session (client action) |
| `/api/coaching/invitations/send` | POST | Send invitation |
| `/api/coaching/invitations/pending` | GET | List pending invites |
| `/api/coaching/invitations/{id}` | GET | **NEW:** Get invitation details |
| `/api/coaching/invitations/accept` | POST | Accept invitation |
| `/api/coaching/invitations/decline` | POST | Decline invitation |
| `/api/coaching/relationships/client/{id}/coach` | GET | Get client's coach |

---

## Contact

Frontend service files:
- `mobile/src/services/coachService.ts` - Coach management
- `mobile/src/screens/CoachSelectionScreen.tsx` - Find Your Coach UI
- `mobile/src/screens/CoachProfileScreen.tsx` - Coach profile view
- `mobile/src/screens/CoachOverviewScreen.tsx` - Coach dashboard

Let me know when these endpoints are deployed so we can test the coach/client flows end-to-end.
