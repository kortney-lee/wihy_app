# Permissions & Authorization Architecture

## Overview
This document outlines the permission and authorization requirements for the coach/client management system based on the analyzed pages.

## User Roles

### 1. **Client Role**
- Primary user seeking health guidance
- Can have one active coach at a time
- Limited access to coach management features

### 2. **Coach Role** 
- Health professional providing guidance
- Can manage multiple clients
- Access to client data and plan creation tools

### 3. **Admin Role** (Future)
- Platform administration
- User management and moderation
- System-wide analytics

## Permission Matrix

| Feature | Client | Coach | Admin |
|---------|--------|-------|--------|
| **Profile Management** |
| View own profile | [OK] | [OK] | [OK] |
| Edit own profile | [OK] | [OK] | [OK] |
| View client profiles | [X] | [OK] (own clients) | [OK] |
| Edit client profiles | [X] | [OK] (own clients) | [OK] |
| **Coach Discovery & Invitations** |
| Browse coaches | [OK] | [X] | [OK] |
| Send coach invitations | [OK] | [X] | [OK] |
| Receive coach invitations | [X] | [OK] | [OK] |
| Accept/decline invitations | [OK]/[OK] | [OK]/[OK] | [OK] |
| **Client Management** |
| View client list | [X] | [OK] (own clients) | [OK] |
| Add new clients | [X] | [OK] | [OK] |
| Remove clients | [X] | [OK] (own clients) | [OK] |
| Update client status | [X] | [OK] (own clients) | [OK] |
| **Meal Planning** |
| Create meal plans | [X] | [OK] (for own clients) | [OK] |
| View meal plans | [OK] (own plans) | [OK] (own clients) | [OK] |
| Edit meal plans | [X] | [OK] (own clients) | [OK] |
| Generate shopping lists | [X] | [OK] (for own clients) | [OK] |
| **Workout Planning** |
| Create workout plans | [X] | [OK] (for own clients) | [OK] |
| View workout plans | [OK] (own plans) | [OK] (own clients) | [OK] |
| Edit workout plans | [X] | [OK] (own clients) | [OK] |
| **Progress Tracking** |
| View own progress | [OK] | [X] | [OK] |
| View client progress | [X] | [OK] (own clients) | [OK] |
| Update progress data | [OK] (own data) | [OK] (own clients) | [OK] |
| **Communication** |
| Message coach | [OK] (own coach) | [X] | [OK] |
| Message clients | [X] | [OK] (own clients) | [OK] |
| Send check-ins | [X] | [OK] (to own clients) | [OK] |
| **Actions & Tasks** |
| Create actions | [X] | [OK] (for own clients) | [OK] |
| View actions | [OK] (own actions) | [OK] (own clients) | [OK] |
| Update action status | [OK] (own actions) | [OK] (own clients) | [OK] |

## Permission Checks Required

### 1. **Resource Ownership Checks**
```typescript
interface PermissionCheck {
  // Client ownership
  isClientOwner(userId: string, clientId: string): Promise<boolean>;
  
  // Coach-client relationship
  isCoachOfClient(coachId: string, clientId: string): Promise<boolean>;
  
  // Plan ownership
  isMealPlanOwner(userId: string, planId: string): Promise<boolean>;
  isWorkoutPlanOwner(userId: string, programId: string): Promise<boolean>;
  
  // Communication access
  canMessageUser(fromUserId: string, toUserId: string): Promise<boolean>;
}
```

### 2. **Role-Based Access Control (RBAC)**
```typescript
interface RolePermissions {
  // Role checking
  hasRole(userId: string, role: UserRole): Promise<boolean>;
  getUserRoles(userId: string): Promise<UserRole[]>;
  
  // Permission checking
  hasPermission(userId: string, permission: string): Promise<boolean>;
  canPerformAction(userId: string, action: string, resourceId?: string): Promise<boolean>;
}
```

### 3. **Context-Based Permissions**
```typescript
interface ContextPermissions {
  // Invitation context
  canSendInvitation(fromUserId: string, toUserId: string): Promise<boolean>;
  canAcceptInvitation(userId: string, invitationId: string): Promise<boolean>;
  
  // Onboarding context
  canAccessOnboarding(userId: string): Promise<boolean>;
  
  // Dashboard context
  canAccessCoachDashboard(userId: string): Promise<boolean>;
  canAccessClientDashboard(userId: string): Promise<boolean>;
}
```

## Security Implementations

### 1. **Page-Level Protection**
```typescript
// Route guards for each page
const pagePermissions = {
  '/coach/dashboard': ['coach'],
  '/coach/clients': ['coach'],
  '/client/onboarding': ['client', 'new_user'],
  '/coach/selection': ['client'],
  '/client/management': ['coach'],
  '/progress': ['client', 'coach'] // Context-dependent
};
```

### 2. **Component-Level Protection**
```typescript
// Conditional rendering based on permissions
interface ProtectedComponentProps {
  requiredRole?: UserRole;
  requiredPermission?: string;
  resourceId?: string;
  fallback?: React.ReactNode;
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  requiredRole,
  requiredPermission,
  resourceId,
  children,
  fallback
}) => {
  // Permission checking logic
};
```

### 3. **API-Level Protection**
```typescript
// Middleware for API endpoints
const permissionMiddleware = {
  // Client management
  'POST /api/clients': ['coach'],
  'GET /api/clients/:id': ['coach', 'client_owner'],
  'PUT /api/clients/:id': ['coach_of_client'],
  'DELETE /api/clients/:id': ['coach_of_client'],
  
  // Meal plans
  'POST /api/meal-plans': ['coach'],
  'GET /api/meal-plans/:id': ['coach_of_client', 'client_owner'],
  'PUT /api/meal-plans/:id': ['coach_of_client'],
  
  // Workout plans
  'POST /api/workout-plans': ['coach'],
  'GET /api/workout-plans/:id': ['coach_of_client', 'client_owner'],
  'PUT /api/workout-plans/:id': ['coach_of_client'],
  
  // Invitations
  'POST /api/invitations': ['client', 'coach'],
  'PUT /api/invitations/:id/accept': ['invitation_recipient'],
  'PUT /api/invitations/:id/decline': ['invitation_recipient']
};
```

## Permission Validation Flow

### 1. **Authentication Flow**
```
User Login → Token Validation → Role Assignment → Permission Caching
```

### 2. **Authorization Flow**
```
Action Request → Permission Check → Resource Ownership Check → Allow/Deny
```

### 3. **Real-time Permission Updates**
```
Role Change → Invalidate Cache → Broadcast Update → UI Refresh
```

## Data Privacy & Access Control

### 1. **Client Data Protection**
- Clients can only access their own data
- Coaches can only access their assigned clients' data
- No cross-client data visibility

### 2. **Coach Data Protection**
- Coach profiles public for discovery
- Client lists private to each coach
- Communication logs private between coach-client pairs

### 3. **Sensitive Information Handling**
- Health information (medications, conditions) - Coach + Client only
- Progress data - Coach + Client only
- Payment information - User only
- Personal contact info - Limited visibility

## Implementation Requirements

### 1. **Permission Service**
```typescript
class PermissionService {
  async checkPermission(userId: string, action: string, resourceId?: string): Promise<boolean>;
  async getUserPermissions(userId: string): Promise<string[]>;
  async validateResourceAccess(userId: string, resourceType: string, resourceId: string): Promise<boolean>;
}
```

### 2. **Permission Decorators/Guards**
```typescript
// For React components
const withPermission = (permission: string) => (Component: React.FC) => {
  // HOC implementation
};

// For API routes
const requirePermission = (permission: string) => (req, res, next) => {
  // Middleware implementation
};
```

### 3. **Error Handling**
- 401 Unauthorized - Invalid/missing token
- 403 Forbidden - Valid token, insufficient permissions
- 404 Not Found - Resource doesn't exist or no access
- Custom permission error messages for better UX

## Future Considerations

### 1. **Multi-tenancy Support**
- Organization-level permissions
- Team-based access control
- Cross-organization collaboration

### 2. **Granular Permissions**
- Field-level access control
- Time-based permissions
- Conditional permissions based on client status

### 3. **Audit & Compliance**
- Permission change logging
- Access audit trails
- HIPAA compliance for health data
- GDPR compliance for personal data

## Testing Strategy

### 1. **Permission Unit Tests**
- Role-based access tests
- Resource ownership tests
- Edge case validation

### 2. **Integration Tests**
- End-to-end permission flows
- Cross-role interaction tests
- Security penetration tests

### 3. **User Acceptance Tests**
- Role switching scenarios
- Permission error handling
- UI/UX permission feedback