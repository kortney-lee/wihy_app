<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements

- [x] Scaffold the Project

- [x] Customize the Project

- [x] Install Required Extensions

- [x] Compile the Project

- [x] Create and Run Task

- [x] Launch the Project

- [x] Ensure Documentation is Complete

## Project Summary

This is a React Native application for Android and iOS development with the following features:
- TypeScript support for type safety
- React Navigation for screen navigation
- Cross-platform compatibility
- Modern React Native architecture with hooks
- ESLint and Prettier for code quality
- VS Code tasks for development workflow

## Development Setup Complete

All project setup steps have been completed:
- ✅ Project scaffolded with React Native 0.75.4
- ✅ TypeScript configuration
- ✅ React Navigation setup
- ✅ Required VS Code extensions installed
- ✅ Dependencies installed and compiled
- ✅ Metro bundler running
- ✅ VS Code tasks configured

## Next Steps

To run the app:
1. For Android: Use Command Palette > "Tasks: Run Task" > "Run Android" (requires Android SDK)
2. For iOS: Use Command Palette > "Tasks: Run Task" > "Run iOS" (requires Xcode, macOS only)
3. Metro bundler is already running in the background

## Project Structure

- `src/App.tsx` - Main app component with navigation
- `src/screens/` - Screen components (Home, About, Profile, etc.)
- `src/components/` - Reusable UI components
- `src/theme/` - Design system (colors, typography, spacing)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Helper functions including apiLogger.ts
- `src/services/` - API services (auth, user, payment, etc.)
- `src/context/` - React contexts (AuthContext)
- `android/` - Android-specific code and configuration
- `ios/` - iOS-specific code and configuration

## Authentication Architecture

### Token Storage Strategy
- **Web Platform:** Uses `localStorage` for JWT tokens (more reliable than AsyncStorage on web)
- **Mobile Platform:** Uses `AsyncStorage` for JWT tokens
- **Dual Storage:** Tokens are stored to both `@wihy_access_token` and `@wihy_session_token` keys for compatibility

### Token Injection
- All authenticated API requests automatically include `Authorization: Bearer {token}` header
- Implemented in `src/utils/apiLogger.ts` via `fetchWithLogging()` function
- Token retrieval checks localStorage first (web), then falls back to AsyncStorage

### API Services
- **auth.wihy.ai** - Authentication (login, register, OAuth, verify)
- **user.wihy.ai** - User profiles and preferences  
- **services.wihy.ai** - Nutrition, fitness, scans (requires Bearer token + Client credentials)
- **ml.wihy.ai** - AI chat and health questions (requires Bearer token + Client credentials)
- **payment.wihy.ai** - Stripe and subscriptions (requires Bearer token)

### Client Credentials
Services require both JWT Bearer token AND client credentials:
- `X-Client-Id`: Client identifier
- `X-Client-Secret`: Client secret
- Automatically injected by `getAuthHeadersForUrl()` based on URL

### Token Lifecycle
1. **Login:** JWT stored to both localStorage (web) and AsyncStorage
2. **API Calls:** Token auto-injected via `fetchWithLogging()`
3. **Expiration:** Token expiry checked before each request
4. **401 Errors:** Auto-logout and redirect to login on invalid token signature
5. **Refresh:** Attempted before logout if refresh token available

### JWT Secret
- Current: `wihy-jwt-secret-2025-super-secure-key-for-token-generation`
- Old tokens signed with previous secret will fail verification
- Solution: Users must log out and log back in after secret changes

## Deployment

### Firebase Hosting - Manual Deployment (Local)

**Complete deployment process:**
```bash
# 1. Check Firebase login status
firebase login:list

# 2. Build the web app (from mobile directory)
cd mobile
npx expo export --platform web

# 3. Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Important Notes:**
- Always build BEFORE deploying (don't deploy without fresh build)
- Build output goes to `mobile/dist/`
- Deployment reads from `mobile/dist/` (configured in firebase.json)
- Live URL: https://wihy-ai.web.app

**Common Issues:**
- If `cd mobile` fails with "path not found", use full path: `cd C:\repo\wihy_ui_clean\mobile`
- Build must complete successfully before deploying
- Verify 11 files are uploaded during deployment

### GitHub Actions
- Workflow: `.github/workflows/deploy-web.yml`
- Triggers: Push to `main` branch
- Auto-deploys to Firebase Hosting

### iOS Build & TestFlight Deployment (EAS)

**IMPORTANT: All commands must be run from the `mobile` directory**

**Prerequisites:**
- EAS CLI installed: `npm install -g eas-cli`
- Logged in to Expo: `npx eas whoami` (should show @wihy-ai)
- Apple Developer account credentials

**Build and Submit to TestFlight:**
```bash
# Navigate to mobile directory FIRST
cd mobile

# Build iOS production and auto-submit to TestFlight
EAS_NO_VCS=1 npx eas build --platform ios --profile production --auto-submit

# Or build without auto-submit, then submit separately
EAS_NO_VCS=1 npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

**Important Notes:**
- `EAS_NO_VCS=1` is REQUIRED due to monorepo structure (git status issues)
- Build number auto-increments (configured in eas.json)
- Apple credentials are stored remotely on EAS servers
- ASC App ID: 6758858368 (configured in eas.json for auto-submit)

**EAS Configuration (eas.json):**
- Bundle ID: `com.wihy.ai.app`
- Apple Team ID: `6Q442R8GCU` (WIHY AI LLC)
- Production profile uses `m-medium` resource class for faster builds

**Check Build Status:**
```bash
cd mobile
npx eas build:list --platform ios
npx eas build:view <build-id>
```

**Common Issues:**
- "git status -s -uall exited with non-zero code: 128" → Use `EAS_NO_VCS=1` prefix
- "Set ascAppId" error → Already fixed in eas.json, use latest version
- Build fails with missing native module → Web-only modules need conditional imports

### Android Build (EAS)

**Build APK for testing:**
```bash
cd mobile
EAS_NO_VCS=1 npx eas build --platform android --profile preview
```

**Build AAB for Play Store:**
```bash
cd mobile
EAS_NO_VCS=1 npx eas build --platform android --profile production
```
