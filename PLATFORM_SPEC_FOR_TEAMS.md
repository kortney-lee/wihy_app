# WiHY Platform Specification
## Complete Documentation for Authentication, Payment & Marketing Teams

**Date**: December 29, 2025  
**Version**: 1.0  
**Status**: Production Ready

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Authentication System](#authentication-system)
3. [Payment & Pricing Structure](#payment-pricing-structure)
4. [Brand & Marketing Guidelines](#brand-marketing-guidelines)
5. [User Roles & Permissions](#user-roles-permissions)
6. [Family Account System](#family-account-system)
7. [Technical Architecture](#technical-architecture)
8. [API Integration](#api-integration)
9. [Compliance & Privacy](#compliance-privacy)

---

## Platform Overview

### What is WiHY?

**WiHY** (What's In How You Eat) is a comprehensive family health platform providing:
- Nutrition tracking and analysis
- Barcode scanning for instant product information
- Family meal planning
- Health coaching dashboards
- Parent/child health management
- Multi-tier account system for families

### Core Platforms
- **Web Application**: React/TypeScript SPA
- **Mobile Apps**: React Native (iOS & Android)
- **API Services**: RESTful backend with Firebase integration

---

## Authentication System

### 1. Authentication Methods

#### Local Authentication (Email/Password)
- **Registration**
  - Email validation
  - Password requirements: Minimum 8 characters
  - Optional name field
  - Email verification flow
  
- **Login**
  - Email/password combination
  - Session-based authentication
  - "Remember me" option
  - Password reset via email

#### OAuth2 Providers
All OAuth flows use state validation for CSRF protection:

- **Google OAuth2**
  - Google Sign-In integration
  - Automatic profile photo import
  - Email verification included
  
- **Microsoft OAuth2**
  - Azure AD integration
  - Work/school account support
  - Personal Microsoft account support
  
- **Facebook OAuth2**
  - Facebook Login SDK
  - Profile data import
  - Friends list access (optional)
  
- **Apple Sign In** (Mobile)
  - iOS native integration
  - Privacy-focused option
  - Email relay feature
  
- **Samsung Account** (Mobile)
  - Android Samsung devices
  - Regional availability

### 2. Session Management

#### Session Configuration
```typescript
{
  sessionDuration: "24 hours",
  tokenType: "JWT + Cookie-based",
  autoRefresh: true,
  persistAcrossRefresh: true,
  secureStorage: true
}
```

#### Session Features
- **Auto-expiry**: 24-hour default (configurable)
- **Token Storage**: HttpOnly cookies + localStorage
- **State Persistence**: Survives page refreshes
- **Real-time Updates**: Subscription-based state management
- **Session Validation**: Automatic background checks

### 3. Security Features

- ✅ **Password Hashing**: PBKDF2 with salt (API-side)
- ✅ **CSRF Protection**: State validation for OAuth flows
- ✅ **Secure Cookies**: HttpOnly, Secure flags
- ✅ **Token-based Auth**: JWT with header support
- ✅ **Input Validation**: Server-side sanitization
- ✅ **Rate Limiting**: Login attempt throttling
- ✅ **Session Expiry**: Automatic timeout
- ✅ **HTTPS Required**: Production environment

### 4. Authentication API Endpoints

**Base URL**: `http://wihy-auth-api.centralus.azurecontainer.io:5000`

#### Core Endpoints
```
GET  /api/health                          - Health check
GET  /api/auth/providers                  - List auth providers
POST /api/auth/local/register             - Register new user
POST /api/auth/local/login                - Login user
POST /api/auth/local/change-password      - Change password
GET  /api/auth/{provider}/authorize       - Initiate OAuth
GET  /api/auth/{provider}/callback        - OAuth callback
GET  /api/auth/session                    - Check session status
POST /api/auth/logout                     - End session
```

#### Request/Response Examples

**Registration**
```json
POST /api/auth/local/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session_token": "eyJhbGc..."
}
```

**Login**
```json
POST /api/auth/local/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "parent"
  },
  "session_token": "eyJhbGc...",
  "expires_at": "2025-12-30T12:00:00Z"
}
```

### 5. React Integration

#### AuthContext Hook
```typescript
const {
  isAuthenticated,     // Boolean: User logged in
  user,                // User object with profile data
  loading,             // Boolean: Auth state loading
  error,               // String: Error message
  login,               // Function: Email/password login
  register,            // Function: New user registration
  logout,              // Function: End session
  changePassword,      // Function: Update password
  loginWithGoogle,     // Function: Google OAuth
  loginWithMicrosoft,  // Function: Microsoft OAuth
  loginWithFacebook,   // Function: Facebook OAuth
  checkSession,        // Function: Validate session
  refreshAuth          // Function: Refresh auth state
} = useAuth();
```

#### Protected Routes
```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute redirectTo="/login">
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

---

## Payment & Pricing Structure

### 1. Account Tiers

#### Individual Plans

**Free Tier**
- Basic barcode scanning
- Limited nutrition search
- Personal dashboard
- 10 scans per day
- **Price**: Free

**Premium Individual**
- Unlimited barcode scanning
- Advanced nutrition analysis
- Meal planning tools
- Shopping list generation
- Priority support
- **Price**: $9.99/month or $99/year

#### Family Plans

**Family Basic**
- Up to 4 family members
- Shared meal planning
- Parent dashboard
- Child profiles
- Basic health tracking
- **Price**: $14.99/month or $149/year

**Family Premium**
- Up to 6 family members
- All Premium features
- Multi-tier account roles
- Parental controls
- Advanced health tracking
- Coach assignment (optional)
- Priority support
- **Price**: $24.99/month or $249/year

#### Professional Plans

**Coach/Nutritionist**
- Client management dashboard
- Meal plan creation
- Progress tracking
- Client communication
- Revenue tracking
- 10% platform commission
- **Price**: Free + commission

**Manager/Organization**
- Multi-coach management
- Team dashboard
- Organization analytics
- Bulk client management
- Custom branding
- **Price**: Custom pricing

### 2. Payment Features Required

#### Payment Processing
- [ ] Stripe integration
- [ ] Credit/debit card processing
- [ ] Subscription management
- [ ] Recurring billing
- [ ] Payment method storage
- [ ] Invoice generation
- [ ] Payment history

#### Subscription Management
- [ ] Plan upgrades/downgrades
- [ ] Proration handling
- [ ] Auto-renewal
- [ ] Cancellation flow
- [ ] Refund processing
- [ ] Trial periods (14 days)
- [ ] Promotional codes

#### Family Account Billing
- [ ] Primary account holder billing
- [ ] Multi-member pricing
- [ ] Add/remove family members
- [ ] Transfer billing ownership
- [ ] Family member limits enforcement

#### Coach Commission System
- [ ] 10% commission tracking
- [ ] Automatic payment splits
- [ ] Monthly payout processing
- [ ] Revenue reporting
- [ ] Tax documentation (1099 generation)

### 3. Payment Data Structure

```typescript
interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium_individual' | 'family_basic' | 'family_premium' | 'coach';
  status: 'active' | 'canceled' | 'past_due' | 'trial';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  paymentMethod: PaymentMethod;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: 'USD';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  created: Date;
  paidAt?: Date;
  receiptUrl: string;
}

interface CoachRevenue {
  coachId: string;
  month: string;
  totalRevenue: number;
  platformCommission: number;
  netPayout: number;
  transactionCount: number;
  payoutStatus: 'pending' | 'processing' | 'completed';
}
```

---

## Brand & Marketing Guidelines

### 1. Color Palette

#### Primary Brand Colors

**WiHY Orange** - Primary brand color
- Hex: `#fa5f06`
- RGB: `rgb(250, 95, 6)`
- Usage: Primary buttons, CTAs, brand accents, highlights
- Components: Search inputs, action buttons, links

**WiHY Kelly Green** - Success & health
- Hex: `#4cbb17`
- RGB: `rgb(76, 187, 23)`
- Usage: Success states, excellent health scores (85-100), positive indicators
- Components: Health badges, success messages, NOVA 1 badges

#### Background Colors

**Light Blue** - Standard page background
- Hex: `#f0f7ff`
- RGB: `rgb(240, 247, 255)`
- Usage: **PRIMARY** background for all new pages
- Components: Dashboard, SearchResults, NutritionFacts, ProductScanView

**Pure White** - UI elements
- Hex: `#ffffff`
- RGB: `rgb(255, 255, 255)`
- Usage: Headers, navigation bars, cards, input fields, modals
- Components: Top nav, header sections, card containers, modal backgrounds

#### Text Colors

**Dark Gray** - Primary text
- Hex: `#1f2937`
- Tailwind: `text-gray-800`
- Usage: Headings, primary content text

**Medium Gray** - Secondary text
- Hex: `#6b7280`
- Tailwind: `text-gray-500`
- Usage: Secondary text, placeholders, no-results messages

**Light Gray** - Tertiary text
- Hex: `#9ca3af`
- Tailwind: `text-gray-400`
- Usage: Timestamps, metadata, disabled states

### 2. Typography

**Font Family**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

**Font Sizes**
- Small: 12px - Fine print, timestamps
- Regular: 16px - Body text
- Medium: 18px - Inputs, important text
- Large: 20px - Section headers
- XL: 24px - Page titles

**Font Weights**
- Regular (400) - Body text
- Medium (500) - Emphasized text
- Semibold (600) - Subheadings
- Bold (700) - Headings

### 3. Design System

#### Border Radius
- Small: 8px - Buttons, small cards
- Medium: 12px - Standard cards
- Large: 16px - Large cards, modals
- Search inputs: 28px - Pill shape

#### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- 2xl: 24px
- 3xl: 32px

#### Shadows
```css
/* Standard card shadow */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

/* Elevated card shadow */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Orange glow (focus states) */
box-shadow: 0 0 0 3px rgba(250, 95, 6, 0.25);
```

### 4. Health Score Colors

**Color-Coded Health Scores**
- 85-100 (Excellent): Kelly Green `#4cbb17`
- 70-84 (Good): Light Green `#85c24b`
- 50-69 (Fair): Yellow `#f4c430`
- 30-49 (Poor): Orange `#fa8532`
- 0-29 (Bad): Red `#e74c3c`

**NOVA Group Badges**
- NOVA 1 (Unprocessed): Kelly Green
- NOVA 2 (Processed): Light Green
- NOVA 3 (Processed): Yellow
- NOVA 4 (Ultra-processed): Red

### 5. Marketing Messaging

#### Brand Voice
- **Tone**: Friendly, supportive, educational
- **Style**: Clear, concise, conversational
- **Avoid**: Medical jargon, fear-based messaging
- **Focus**: Empowerment, family health, positive choices

#### Key Value Propositions

**For Parents**
- "Empower your family's health journey"
- "Know what's in your food - instantly"
- "Meal planning made simple for busy families"
- "Track your children's nutrition with confidence"

**For Health Coaches**
- "Grow your coaching business with powerful tools"
- "Manage clients effortlessly"
- "Create personalized meal plans in minutes"
- "Track client progress and celebrate wins"

**For Individuals**
- "Your personal nutrition detective"
- "Make informed food choices every day"
- "Scan, learn, improve"
- "Nutrition knowledge at your fingertips"

### 6. Page Layout Standard

**All new pages follow this structure:**

```tsx
// Page container - Light blue background
<div style={{ backgroundColor: '#f0f7ff' }} className="fixed inset-0">
  
  {/* Top Navigation Bar - White */}
  <div className="bg-white px-3 py-2">
    {/* Hamburger menu, action buttons */}
  </div>
  
  {/* Header Section - White */}
  <div className="bg-white px-4 py-3 border-b border-gray-200">
    {/* Page title, tabs, breadcrumbs */}
  </div>
  
  {/* Main Content - Light blue background */}
  <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f0f7ff' }}>
    {/* White content cards */}
    <div className="bg-white rounded-xl border border-gray-200 p-4 m-4">
      {/* Actual content */}
    </div>
  </div>
</div>
```

---

## User Roles & Permissions

### 1. Multi-Tier Account System

#### Account Roles

**Admin** (Primary Account Holder)
- Full account management
- Billing and payment control
- Add/remove family members
- Set parental controls
- View all family data
- Assign coaches
- Export data

**Co-Parent**
- View all children's data
- Edit child profiles
- Manage meal plans
- Add notes and actions
- Cannot modify billing
- Cannot remove Admin

**Teen** (Ages 13-17)
- Own profile access
- Limited data editing
- Parent-approved changes
- Privacy controls
- Cannot view siblings without permission
- Restricted features

**Child** (Ages 6-12)
- View-only access
- Gamified interface
- Parent-guided activities
- No data export
- Full parental oversight

**Toddler** (Ages 0-5)
- Parent-managed only
- No direct access
- Data collected by parents
- Growth tracking

### 2. Permission Matrix

| Feature | Admin | Co-Parent | Teen | Child | Toddler |
|---------|-------|-----------|------|-------|---------|
| **Account Management** |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Add family members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove family members | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Change subscription | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Child Management** |
| View all children | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Edit child profiles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete child data | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Meal Planning** |
| Create meal plans | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Edit meal plans | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Generate shopping lists | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Health Data** |
| View own data | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit own data | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Coaching** |
| Assign coach | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Message coach | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Privacy** |
| Set privacy controls | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| Share data | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |

**Legend**:
- ✅ Full access
- ⚠️ Limited/supervised access
- ❌ No access

### 3. Parental Control Features

#### Content Filtering
- Age-appropriate content display
- Restricted ingredient warnings
- Simplified health scores for children
- Gamification for young users

#### Activity Monitoring
- Parent notification for teen actions
- Login activity tracking
- Food logging oversight
- Screen time limits

#### Privacy Protection
- Child profile visibility controls
- Data sharing restrictions
- Coach interaction supervision
- Third-party data blocking

---

## Family Account System

### 1. Family Structure

```typescript
interface FamilyAccount {
  id: string;
  name: string;
  primaryAccountHolder: {
    userId: string;
    email: string;
    name: string;
    role: 'admin';
  };
  members: FamilyMember[];
  subscription: Subscription;
  settings: FamilySettings;
  createdAt: Date;
  updatedAt: Date;
}

interface FamilyMember {
  id: string;
  userId?: string;  // Optional for young children
  name: string;
  role: 'co_parent' | 'teen' | 'child' | 'toddler';
  birthDate: Date;
  age: number;
  avatarColor: string;
  dietaryRestrictions?: string[];
  healthGoals?: string[];
  permissions: Permission[];
  addedAt: Date;
  addedBy: string;  // userId of who added them
}

interface FamilySettings {
  allowSiblingView: boolean;
  requireParentApproval: boolean;
  dataRetentionDays: number;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    weeklyReport: boolean;
  };
  privacyLevel: 'strict' | 'moderate' | 'relaxed';
}
```

### 2. Child Profile Management

**Parent Dashboard Features**
- ✅ Add unlimited children
- ✅ Edit child profiles
- ✅ Delete child profiles
- ✅ Track daily health metrics
- ✅ Meal planning per child
- ✅ Shopping list generation
- ✅ Action items and priorities
- ✅ Notes and observations
- ✅ Growth tracking
- ✅ Dietary restrictions management

**Child Data Tracked**
```typescript
interface ChildProfile {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  avatarColor: string;
  status: 'ok' | 'needs_attention' | 'offline';
  mainGoal: string;
  riskFlags: string[];
  dietaryRestrictions: string[];
  
  // Daily metrics
  today: {
    date: string;
    mealsLogged: number;
    movementMinutes: number;
    steps: number;
    sleepHours: number;
    mood: 'happy' | 'tired' | 'upset' | 'neutral';
  };
  
  // Nutrition tracking
  food: {
    todayQuality: 'great' | 'good' | 'mixed' | 'poor';
    favorites: string[];
    problemFoods: string[];
    notes?: string;
  };
  
  // Activity tracking
  activity: {
    todayMinutes: number;
    weekMinutes: number;
    sports?: string;
  };
  
  // Meal planning
  mealProgram?: MealProgram;
  shoppingList?: ShoppingListItem[];
  
  // Task management
  actions: Action[];
  priorities: Priority[];
  notes: string[];
}
```

### 3. Family Meal Planning

**Shared Meal Programs**
- Create family meal plans
- Individual child meal customization
- Dietary restriction filtering
- Shared shopping lists
- Instacart integration
- Recipe storage
- Prep batch scheduling

**Shopping List Features**
- Auto-generate from meal plans
- Combine family members' needs
- Category organization
- Quantity calculation
- Check-off functionality
- Export to mobile app
- Instacart direct ordering

---

## Technical Architecture

### 1. Frontend Stack

**Web Application**
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management
- Axios for HTTP requests
- Firebase SDK for backend integration

**Mobile Application**
- React Native
- Native navigation
- AsyncStorage for persistence
- Native camera integration
- Platform-specific UI components

### 2. Backend Services

**Firebase Services**
- **Authentication**: User management
- **Firestore**: NoSQL database
- **Storage**: File uploads (images)
- **Functions**: Serverless API endpoints
- **Hosting**: Static asset serving

**Custom API Services**
- **Auth API**: Authentication microservice
- **Nutrition API**: Product database
- **Barcode API**: Scanning service
- **Payment API**: Stripe integration

### 3. Database Schema

**Users Collection**
```typescript
/users/{userId}
{
  email: string;
  name: string;
  role: 'parent' | 'coach' | 'manager' | 'admin';
  accountType: 'individual' | 'family' | 'professional';
  subscriptionId: string;
  familyAccountId?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  preferences: UserPreferences;
}
```

**Family Accounts Collection**
```typescript
/familyAccounts/{familyId}
{
  name: string;
  primaryUserId: string;
  memberIds: string[];
  subscriptionId: string;
  settings: FamilySettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/familyAccounts/{familyId}/members/{memberId}
{
  userId?: string;
  name: string;
  role: string;
  birthDate: Timestamp;
  permissions: string[];
  profile: ChildProfile;
}
```

**Subscriptions Collection**
```typescript
/subscriptions/{subscriptionId}
{
  userId: string;
  familyAccountId?: string;
  plan: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  paymentMethodId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}
```

**Meal Plans Collection**
```typescript
/mealPlans/{planId}
{
  userId: string;
  familyMemberId?: string;
  programTitle: string;
  days: MealDay[];
  dietaryRestrictions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'draft' | 'archived';
}
```

### 4. API Routes

**Web App Routes**
```
/                      - Landing page
/login                 - Authentication
/register              - Sign up
/dashboard             - Main dashboard
/search                - Product search
/scan                  - Barcode scanner
/nutrition-facts/:id   - Product details
/meal-plans            - Meal planning
/shopping-list         - Shopping lists
/parent-dashboard      - Family management
/coach-dashboard       - Coach workspace
/settings              - Account settings
```

**API Endpoints**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

GET    /api/products/:barcode
GET    /api/products/search
GET    /api/nutrition-facts/:productId

GET    /api/family/:familyId
POST   /api/family/:familyId/members
PUT    /api/family/:familyId/members/:memberId
DELETE /api/family/:familyId/members/:memberId

GET    /api/meal-plans/:userId
POST   /api/meal-plans
PUT    /api/meal-plans/:planId
DELETE /api/meal-plans/:planId

POST   /api/subscriptions/create
PUT    /api/subscriptions/:subscriptionId
POST   /api/subscriptions/:subscriptionId/cancel
GET    /api/invoices/:userId
```

---

## API Integration

### 1. Authentication Flow

**Login Process**
```typescript
// 1. User submits credentials
const result = await authService.login(email, password);

// 2. API validates and returns session
{
  success: true,
  user: { id, email, name, role },
  session_token: "jwt_token",
  expires_at: "timestamp"
}

// 3. Client stores session
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('session_token', token);

// 4. AuthContext updates state
setIsAuthenticated(true);
setUser(user);
```

**OAuth Flow**
```typescript
// 1. Initiate OAuth
const { authorization_url, state } = await authService.initiateOAuth('google');

// 2. Redirect to provider
window.location.href = authorization_url;

// 3. Handle callback
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const state = params.get('state');

// 4. Exchange code for session
const result = await authService.handleOAuthCallback('google', code, state);
```

### 2. Protected API Calls

**Authorization Headers**
```typescript
// Include session token in all authenticated requests
const headers = {
  'Authorization': `Bearer ${sessionToken}`,
  'Content-Type': 'application/json'
};

// Example API call
const response = await fetch('/api/family/123/members', {
  method: 'GET',
  headers: headers,
  credentials: 'include'  // Include cookies
});
```

### 3. Error Handling

**Standard Error Response**
```typescript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  details?: object
}
```

**Common Error Codes**
- `AUTH_REQUIRED` - Not authenticated
- `INVALID_CREDENTIALS` - Wrong email/password
- `SESSION_EXPIRED` - Session timeout
- `PERMISSION_DENIED` - Insufficient permissions
- `PAYMENT_REQUIRED` - Subscription needed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Invalid input

---

## Compliance & Privacy

### 1. COPPA Compliance (Children's Online Privacy Protection Act)

**Requirements for Users Under 13**
- ✅ Parental consent required
- ✅ No direct marketing to children
- ✅ Limited data collection
- ✅ No third-party data sharing
- ✅ Parent-controlled data access
- ✅ Verifiable parental consent mechanisms

**Implementation**
```typescript
// Age verification during child profile creation
if (childAge < 13) {
  requireParentalConsent = true;
  limitDataCollection = true;
  disableDirectMessaging = true;
  restrictThirdPartyAccess = true;
}
```

### 2. GDPR Compliance (General Data Protection Regulation)

**User Rights**
- ✅ Right to access data
- ✅ Right to data portability
- ✅ Right to be forgotten
- ✅ Right to rectification
- ✅ Right to restrict processing
- ✅ Consent management

**Data Processing**
```typescript
interface DataProcessingConsent {
  userId: string;
  purposes: {
    essential: boolean;           // Always true
    analytics: boolean;           // Optional
    marketing: boolean;           // Optional
    thirdPartySharing: boolean;  // Optional
  };
  consentDate: Date;
  consentVersion: string;
  ipAddress: string;
}
```

**Data Export**
```typescript
// User can request full data export
POST /api/users/{userId}/export
Response: {
  profile: UserProfile,
  familyData: FamilyData,
  mealPlans: MealPlan[],
  scans: ProductScan[],
  activityHistory: Activity[]
}
```

**Data Deletion**
```typescript
// User can request account deletion
POST /api/users/{userId}/delete
- Anonymize personal data
- Delete within 30 days
- Preserve legally required records
- Notify family members
```

### 3. HIPAA Considerations

**Not HIPAA-Required** (Wellness app, not medical records)
However, implementing best practices:
- ✅ End-to-end encryption option
- ✅ Audit logging
- ✅ Role-based access control
- ✅ Data minimization
- ✅ Secure data transmission

### 4. Privacy Features

**Data Minimization**
- Collect only necessary data
- Anonymous analytics where possible
- Optional fields for sensitive info
- Automatic data expiration

**User Controls**
- Privacy settings dashboard
- Granular permission controls
- Data sharing toggles
- Download personal data
- Delete account option

**Security Measures**
- End-to-end encryption for messages
- Encrypted data at rest
- TLS 1.3 for data in transit
- Regular security audits
- Penetration testing
- Bug bounty program

---

## Implementation Checklist

### Authentication Team

- [ ] Set up Auth API infrastructure
- [ ] Implement OAuth provider configurations
- [ ] Configure session management
- [ ] Set up email verification system
- [ ] Implement password reset flow
- [ ] Create rate limiting rules
- [ ] Configure CORS policies
- [ ] Set up monitoring and logging
- [ ] Implement MFA (future)

### Payment Team

- [ ] Set up Stripe account
- [ ] Configure subscription plans
- [ ] Implement webhook handlers
- [ ] Create invoice generation system
- [ ] Set up commission tracking
- [ ] Implement refund processing
- [ ] Configure tax handling
- [ ] Create payment failure recovery
- [ ] Set up analytics tracking

### Marketing Team

- [ ] Finalize pricing tiers
- [ ] Create marketing landing pages
- [ ] Design conversion funnels
- [ ] Set up A/B testing
- [ ] Implement referral program
- [ ] Create email campaigns
- [ ] Design social media assets
- [ ] Prepare launch materials
- [ ] Set up analytics tracking
- [ ] Create help documentation

### Development Team

- [ ] Integrate Auth API
- [ ] Implement family account system
- [ ] Build parent dashboard
- [ ] Create payment UI
- [ ] Implement subscription management
- [ ] Add parental controls
- [ ] Build data export feature
- [ ] Implement COPPA safeguards
- [ ] Add GDPR compliance tools
- [ ] Set up monitoring and alerts

---

## Support & Documentation

### Developer Resources
- **Integration Guide**: `WIHY_AUTH_INTEGRATION_GUIDE.md`
- **Setup Checklist**: `WIHY_AUTH_SETUP_CHECKLIST.md`
- **Brand Guide**: `BRAND_GUIDE.md`
- **API Documentation**: Interactive docs at API base URL

### API Testing
- **Live API**: http://wihy-auth-api.centralus.azurecontainer.io:5000
- **Health Check**: /api/health
- **Interactive Demo**: Available at base URL

### Contact
- **Technical Support**: dev@wihy.ai
- **Business Inquiries**: business@wihy.ai
- **Security Issues**: security@wihy.ai

---

## Appendix

### A. Session Management Flow Diagram

```
User Login → API Authentication → Generate JWT → Store Session
     ↓              ↓                    ↓             ↓
  Frontend ← Return User Data ← Set Cookie ← Update State
     ↓
Protected Routes Check Session → Valid? → Allow Access
     ↓                              ↓
  Invalid → Redirect to Login      ↓
                              Auto-refresh if expired
```

### B. Family Account Hierarchy

```
Family Account
├── Admin (Primary Account Holder)
│   ├── Full billing control
│   ├── Member management
│   └── All permissions
├── Co-Parent(s)
│   ├── Child management
│   ├── Meal planning
│   └── Limited admin
├── Teen(s)
│   ├── Own profile
│   ├── Supervised actions
│   └── Privacy controls
├── Child(ren)
│   ├── Gamified interface
│   ├── View-only
│   └── Parent oversight
└── Toddler(s)
    ├── Parent-managed
    └── No direct access
```

### C. Payment Flow

```
User Selects Plan → Stripe Checkout → Payment Processing
       ↓                  ↓                   ↓
   Enter Card → Validate Payment → Create Subscription
       ↓                  ↓                   ↓
  Confirm → Store Payment Method → Activate Plan
       ↓                  ↓                   ↓
 Redirect Dashboard ← Update Account ← Send Confirmation
```

---

**Document Version**: 1.0  
**Last Updated**: December 29, 2025  
**Next Review**: January 15, 2026  
**Maintained By**: WiHY Platform Team
