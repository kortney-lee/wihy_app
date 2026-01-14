# WIHY iOS OAuth Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     iOS App (Expo)                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Login Screen (src/screens/Login.tsx)                       │ │
│  │                                                             │ │
│  │  "Welcome to WIHY"                                        │ │
│  │  [   Continue   ]                                         │ │
│  │                                                             │ │
│  │  → Opens MultiAuthLogin Modal                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ MultiAuthLogin Component (src/components/auth/)            │ │
│  │                                                             │ │
│  │  "Log in or sign up to WIHY"                             │ │
│  │  [🔵 Continue with Google ] ← USER TAPS HERE            │ │
│  │  [🍎 Continue with Apple  ]                              │ │
│  │  [📧 Continue with Email  ]                              │ │
│  │                                                             │ │
│  │  → Calls: signIn('google')                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ AuthContext (src/context/AuthContext.tsx)                  │ │
│  │                                                             │ │
│  │  handleGoogleAuth()                                        │ │
│  │  → Calls: enhancedAuthService.authenticateWithOAuth()    │ │
│  │                                                             │ │
│  │  Returns: User object with token                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Enhanced Auth Service (src/services/)                      │ │
│  │                                                             │ │
│  │  authenticateWithOAuth('google')                           │ │
│  │  → Opens WebView/Browser                                  │ │
│  │  → Loads Google OAuth URL                                 │ │
│  │  → Handles redirect with auth code                        │ │
│  │  → Exchanges code for token                               │ │
│  │                                                             │ │
│  │  Returns: {success: true, user: {...}, token: "..."}     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               ↓                                    │
└─────────────────────────────────────────────────────────────────┘
                               ↓
            ┌──────────────────────────────────────┐
            │  🌐 Google OAuth Server              │
            │                                      │
            │  1. User logs in with Google        │
            │  2. Grant permissions               │
            │  3. Return auth code                │
            │  4. Exchange for ID token           │
            │  5. Return user info + token        │
            │                                      │
            └──────────────────────────────────────┘
                               ↓
            ┌──────────────────────────────────────┐
            │  🔙 App Receives Token              │
            │                                      │
            │  ID Token contains:                 │
            │  - User ID                          │
            │  - User Email                       │
            │  - User Name                        │
            │  - Profile Picture                  │
            │                                      │
            └──────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Backend API (wihy.ai)                           │
│                                                                   │
│  POST /api/auth/google                                          │
│  {                                                              │
│    id_token: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyI..."        │
│  }                                                              │
│                                                                   │
│  ✓ Validates token with Google                                 │
│  ✓ Creates/updates user in database                            │
│  ✓ Returns session token                                       │
│                                                                   │
│  Response:                                                      │
│  {                                                              │
│    success: true,                                              │
│    data: {                                                      │
│      user: {...},                                              │
│      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."         │
│    }                                                            │
│  }                                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                     App Authenticated                            │
│                                                                   │
│  ✓ Token stored in AsyncStorage                                │
│  ✓ User context updated                                        │
│  ✓ Navigate to Home/Dashboard                                  │
│  ✓ All subsequent requests include token                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App (App.js)
  └── AuthProvider (AuthContext)
      └── AppNavigator
          └── Stack Navigator
              ├── AuthenticationScreen
              │   └── Login (src/screens/Login.tsx)
              │       └── MultiAuthLogin (src/components/auth/MultiAuthLogin.tsx)
              │           └── GoogleSignInButton (optional, for direct integration)
              │
              └── HomeScreen / MainApp
                  (After successful authentication)
```

---

## OAuth Flow Timeline

```
Time  │ Component                      │ Action
──────┼────────────────────────────────┼──────────────────────────────
0ms   │ User                          │ Opens app
      │                               │
100ms │ Login Screen                  │ Displays "Continue" button
      │                               │
200ms │ User                          │ Taps "Continue"
      │                               │
210ms │ MultiAuthLogin                │ Shows provider options
      │                               │
250ms │ User                          │ Taps "Continue with Google"
      │                               │
260ms │ AuthContext                   │ Calls signIn('google')
      │                               │
270ms │ enhancedAuthService           │ Opens OAuth WebView
      │                               │
500ms │ Google OAuth Server           │ Shows login page
      │                               │
2000ms│ User                          │ Enters credentials
      │                               │ Grants permissions
      │                               │
2500ms│ Google                        │ Redirects with auth code
      │                               │
2510ms│ enhancedAuthService           │ Exchanges code for token
      │                               │
2600ms│ enhancedAuthService           │ Calls backend /api/auth/google
      │                               │
2700ms│ Backend                       │ Validates token
      │                               │ Creates/updates user
      │                               │
2750ms│ Backend                       │ Returns session token
      │                               │
2760ms│ AuthContext                   │ Updates user state
      │                               │
2770ms│ AsyncStorage                  │ Saves user data
      │                               │
2780ms│ NavigationStack               │ Routes to Home screen
      │                               │
2800ms│ Home Screen                   │ Displays authenticated content
      │                               │
(Total authentication time: ~2.8 seconds)
```

---

## Data Flow

```
User Input (Google Credentials)
           ↓
    ┌──────────────────┐
    │ Google OAuth     │
    │ Server           │
    └──────────────────┘
           ↓
    ID Token (JWT)
           ↓
    ┌──────────────────┐
    │ Enhanced Auth    │
    │ Service          │
    └──────────────────┘
           ↓
    POST /api/auth/google
    { id_token: "..." }
           ↓
    ┌──────────────────┐
    │ Backend API      │
    │ (wihy.ai)        │
    └──────────────────┘
           ↓
    Session Token (JWT)
    + User Object
           ↓
    ┌──────────────────┐
    │ AuthContext      │
    └──────────────────┘
           ↓
    ┌──────────────────┐
    │ AsyncStorage     │
    │ (Persistent)     │
    └──────────────────┘
           ↓
    ┌──────────────────┐
    │ App State        │
    │ (In Memory)      │
    └──────────────────┘
           ↓
    Authenticated User
    (All subsequent API calls use session token)
```

---

## Configuration Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│  Google Cloud Console                                           │
│  ├── OAuth 2.0 Client IDs                                      │
│  │   ├── Web Client ID                                         │
│  │   │   └── 12913076533-nm...@apps.googleusercontent.com     │
│  │   │                                                          │
│  │   └── iOS Client ID                                         │
│  │       ├── Bundle ID: com.wihy.app                           │
│  │       └── Team ID: A1B2C3D4E5                              │
│  │                                                              │
│  └── OAuth Consent Screen                                      │
│      └── [PUBLISHED]                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  app.json (mobile/)                                             │
│  └── expo                                                       │
│      └── ios                                                    │
│          ├── bundleIdentifier: "com.wihy.app"                 │
│          └── infoPlist                                         │
│              ├── GIDClientID: "12913076533-nm..."             │
│              └── CFBundleURLTypes                              │
│                  └── [com.googleusercontent.apps...]           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  Native iOS Runtime                                             │
│  ├── Expo Framework                                            │
│  ├── expo-auth-session                                         │
│  ├── expo-web-browser                                          │
│  └── Info.plist                                                │
│      ├── GIDClientID                                           │
│      └── URL Schemes                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  App Services                                                   │
│  ├── googleAuthService.ts                                      │
│  ├── enhancedAuthService.ts                                    │
│  ├── authService.ts (backend API)                              │
│  └── AuthContext.tsx (state management)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔷 GoogleAuthService (Direct OAuth)                            │
│                                                                   │
│ Purpose: Low-level OAuth handling                              │
│ Usage: Optional, for custom OAuth flows                        │
│ File: src/services/googleAuthService.ts                        │
│                                                                   │
│ async signIn(): Promise<string | null>                         │
│   → Returns: ID Token                                          │
│                                                                   │
│ ⚠️  Note: Currently NOT used by AuthContext                   │
│        AuthContext uses enhancedAuthService instead            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🟢 EnhancedAuthService (Recommended)                            │
│                                                                   │
│ Purpose: Full OAuth flow with backend integration              │
│ Usage: Used by AuthContext.handleGoogleAuth()                  │
│ File: src/services/enhancedAuthService.ts                      │
│                                                                   │
│ async authenticateWithOAuth(provider: string)                  │
│   → Opens browser/WebView                                      │
│   → Gets ID token                                              │
│   → Sends to backend                                           │
│   → Returns: User object + session token                       │
│                                                                   │
│ ✅ This is the main flow used by your app                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔵 AuthService (Backend API)                                    │
│                                                                   │
│ Purpose: Communicate with backend API                          │
│ Usage: Called by enhancedAuthService                           │
│ File: src/services/authService.ts                              │
│                                                                   │
│ POST /api/auth/google { id_token }                             │
│   → Backend validates token                                    │
│   → Returns: session token + user                              │
│                                                                   │
│ ✅ Backend receives and validates Google tokens               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ⚫ AuthContext (State Management)                               │
│                                                                   │
│ Purpose: Manage authentication state                           │
│ Usage: Used by all screens/components                          │
│ File: src/context/AuthContext.tsx                              │
│                                                                   │
│ signIn(provider: string): Promise<User>                        │
│   → Routes to handleGoogleAuth() for 'google'                 │
│   → Updates user state                                         │
│   → Saves to AsyncStorage                                      │
│   → Triggers navigation to Home                                │
│                                                                   │
│ ✅ Central hub for all auth operations                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Token Flow

```
┌──────────────────────────────────────┐
│ Google OAuth Token (JWT)             │
│                                      │
│ Issued by: Google                    │
│ Contains:                            │
│   - User ID                          │
│   - Email                            │
│   - Name                             │
│   - Picture                          │
│   - Issued At (iat)                  │
│   - Expiry (exp)                     │
│   - Signature                        │
│                                      │
│ Validity: ~1 hour                    │
│ Purpose: Prove identity to backend   │
│                                      │
│ Example: eyJhbGciOiJSUzI1NiIs...   │
└──────────────────────────────────────┘
              ↓
    (Send to Backend)
              ↓
┌──────────────────────────────────────┐
│ Backend Validation                   │
│                                      │
│ 1. Get token from request            │
│ 2. Verify signature with Google      │
│ 3. Check expiry                      │
│ 4. Extract user info                 │
│ 5. Create/update user in DB          │
│ 6. Generate session token            │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ Session Token (JWT)                  │
│                                      │
│ Issued by: Your Backend              │
│ Contains:                            │
│   - User ID (internal)               │
│   - Roles/Permissions                │
│   - Session ID                       │
│   - Issued At (iat)                  │
│   - Expiry (exp)                     │
│   - Signature (HMAC)                 │
│                                      │
│ Validity: Varies (24h, 7d, etc)      │
│ Purpose: Authenticate API requests   │
│                                      │
│ Example: eyJhbGciOiJIUzI1NiIs...   │
└──────────────────────────────────────┘
              ↓
    (Stored in AsyncStorage)
              ↓
┌──────────────────────────────────────┐
│ Subsequent API Requests              │
│                                      │
│ Authorization: Bearer {session_token}│
│                                      │
│ GET /api/user/profile                │
│ GET /api/meals                       │
│ POST /api/workouts                   │
│ etc.                                 │
│                                      │
│ Backend validates session token      │
│ and processes request                │
└──────────────────────────────────────┘
```

---

## Storage Strategy

```
┌─────────────────────────────────────────────────────────┐
│ AsyncStorage (Persistent)                              │
│                                                         │
│ Key: "wihy_user_data"                                  │
│ Value: {                                               │
│   id: string,                                          │
│   name: string,                                        │
│   email: string,                                       │
│   picture?: string,                                    │
│   provider: 'google' | 'apple' | ...,                 │
│   memberSince: string,                                │
│   healthScore: number,                                │
│   streakDays: number,                                 │
│   preferences: {...},                                 │
│   plan: string,                                       │
│   capabilities: {...},                                │
│   isFirstTimeUser?: boolean,                          │
│   onboardingCompleted?: boolean                       │
│ }                                                      │
│                                                         │
│ Lifetime: Until user logs out                         │
│ Scope: App-specific                                   │
│ Security: Encrypted by OS                            │
└─────────────────────────────────────────────────────────┘
              ↓ (On App Launch)
┌─────────────────────────────────────────────────────────┐
│ AuthContext State (In Memory)                          │
│                                                         │
│ user: User | null                                      │
│ loading: boolean                                       │
│ token: string (not persisted)                         │
│                                                         │
│ Lifetime: While app is running                        │
│ Scope: Entire app (via Context)                       │
│ Security: RAM only                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
User Action
    ↓
Try OAuth
    ↓
├─ Network Error
│   └─ Display: "Check your internet connection"
│       └─ Retry
│
├─ OAuth Cancelled
│   └─ Display: Nothing (silent)
│       └─ Return to login screen
│
├─ Invalid Token
│   └─ Display: "OAuth failed, please try again"
│       └─ Retry
│
├─ Backend Error
│   └─ Display: "Authentication failed"
│       └─ Retry with same token
│
├─ User Not Found
│   └─ Create new account
│       └─ Redirect to onboarding
│
└─ Success
    └─ Save token & user
        └─ Navigate to home screen
```

---

## Security Considerations

✅ **Token Security**
- Tokens stored in AsyncStorage (OS-encrypted)
- Tokens sent only to authenticated Google + your backend
- Session tokens expire after configurable period
- Logout clears all tokens

✅ **HTTPS Only**
- All API calls use HTTPS
- OAuth redirect uses app scheme (safe)
- No credentials in URLs

✅ **User Privacy**
- Only request: profile, email scopes
- No access to: contacts, calendar, drive
- User can revoke access anytime

⚠️ **Considerations**
- Test on real device (simulator has limitations)
- Ensure backend validates all tokens
- Monitor failed auth attempts
- Implement rate limiting on backend

---

## Performance Optimization

```
Optimization          │ Status │ Implementation
─────────────────────┼────────┼─────────────────────────
Token Refresh        │ ⏳     │ enhancedAuthService
Offline Support      │ ⏳     │ AsyncStorage fallback
WebView Caching      │ ✅     │ Expo handles
Preload Login        │ ✅     │ Lazy load on demand
Connection Pooling   │ ✅     │ HTTP/2 default
Request Timeout      │ ✅     │ 30s default
```

---

## Monitoring & Debugging

```
Enable Logs
├── authService.ts: console.log('OAuth request')
├── enhancedAuthService.ts: console.log('Token received')
├── AuthContext.tsx: console.log('User updated')
└── Backend: log all /api/auth/google requests

Check Console
├── Expo dev tools
├── Xcode Console (native build)
├── Safari Web Inspector (WebView)
└── Backend logs

Verify
├── Token format (JWT structure)
├── Token expiry
├── User object completeness
└── Navigation success
```
