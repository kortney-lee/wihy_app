# Profile System API Integration Status

**Date**: January 21, 2026  
**Status**: Mixed - Some implemented, some stubbed

---

## Current API Integration Status

### ✅ **ProfileSetupScreen.tsx** - FULLY IMPLEMENTED
**Lines 196, 315**
```typescript
// Load existing profile
const profile = await userService.getUserByEmail(user.email);

// Save profile updates
await userService.updateUserProfile(user.id, profileData);
```
**Status**: ✅ Using real userService API calls

---

### ✅ **EditProfileScreen.tsx** - FULLY IMPLEMENTED
**Lines 71, 107**
```typescript
// Load profile for editing
const profile = await userService.getUserByEmail(user.email);

// Save profile updates
const result = await userService.updateUserProfile(user.id, updates);
```
**Status**: ✅ Using real userService API calls

---

### ✅ **Profile.tsx** - PARTIALLY IMPLEMENTED
**Line 138**
```typescript
// Load user profile
const profile = await userService.getUserByEmail(user.email);
```

**Inline preference updates (lines 185-191)**
```typescript
const persistPreferences = async (patch: Partial<typeof defaultPreferences>) => {
  try {
    const merged = { ...userInfo.preferences, ...patch };
    await updateUser({ preferences: merged } as any);
  } catch (err) {
    console.error('Failed to persist preferences:', err);
  }
};
```
**Status**: ✅ Profile loading implemented, ⚠️ Preferences use AuthContext.updateUser()

---

### ❌ **ProfileSettings.tsx** - NEEDS IMPLEMENTATION (ORPHANED)
**Current**: All stubbed with Alert.alert()

**Needs Implementation**:
1. **Change Email** (line 55-70)
   - Should call: `userService.updateUserProfile()` or create new endpoint
   - Currently: Just shows alert

2. **Change Password** (line 72-87)
   - Should call: `userService.changePassword(userId, oldPassword, newPassword)`
   - Currently: Just shows alert about email

3. **Toggle 2FA** (line 89-124)
   - Needs: `userService.enable2FA()` / `userService.disable2FA()` (NOT YET IN SERVICE)
   - Currently: Just toggles local state

4. **Connect Google/Apple** (line 126-134)
   - Needs: OAuth integration endpoints (NOT YET IN SERVICE)
   - Currently: Just shows "will be implemented" alert

5. **Download Data** (line 151-167)
   - Needs: `userService.exportUserData()` (NOT YET IN SERVICE)
   - Currently: Just shows "will prepare" alert

6. **Delete Account** (line 172-201)
   - Needs: `userService.deleteAccount()` (NOT YET IN SERVICE)
   - Currently: Just shows confirmation alerts

**Status**: ❌ Fully stubbed, not currently used anywhere

---

### ❌ **PrivacySettings.tsx** - NEEDS IMPLEMENTATION (ORPHANED)
**Current**: All stubbed with Alert.alert()

**State Variables** (lines 48-63):
```typescript
const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'friends'>('private');
const [showEmail, setShowEmail] = useState(false);
const [showPhone, setShowPhone] = useState(false);
const [showLocation, setShowLocation] = useState(true);
const [showActivityStatus, setShowActivityStatus] = useState(true);
const [shareProgressWithCoach, setShareProgressWithCoach] = useState(true);
const [shareHealthData, setShareHealthData] = useState(true);
const [shareMealLogs, setShareMealLogs] = useState(true);
const [shareWorkoutData, setShareWorkoutData] = useState(true);
const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
const [personalizedAds, setPersonalizedAds] = useState(false);
const [thirdPartySharing, setThirdPartySharing] = useState(false);
```

**Needs Implementation**:
1. **Privacy Settings Persistence**
   - Should call: `userService.updateSettings()` or `userService.updateUserPreferences()`
   - Currently: Just updates local state

2. **Activity Log** (line 65-90)
   - Needs: `userService.getActivityLog()` / `userService.clearActivityLog()` (NOT YET IN SERVICE)
   - Currently: Just shows alerts

3. **Clear Cache** (line 92-107)
   - Needs: Local cache clearing logic + AsyncStorage
   - Currently: Just shows alert with fake size

4. **Clear Search History** (line 109-122)
   - Needs: `userService.clearSearchHistory()` (NOT YET IN SERVICE)
   - Currently: Just shows alert

**Status**: ❌ Fully stubbed, not currently used anywhere

---

## userService Available Methods

### ✅ Already Implemented in userService:
```typescript
// Profile Management
getUserProfile(): Promise<UserProfile | null>
getUserByEmail(email: string): Promise<UserProfile | null>
updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<any>
uploadAvatar(userId: string, imageData: string): Promise<any>

// Preferences
getUserPreferences(userId: string): Promise<UserPreferences | null>
updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<any>

// Settings
updateSettings(userId: string, settings: Partial<UserSettings>): Promise<any>

// Password
changePassword(userId: string, oldPassword: string, newPassword: string): Promise<any>
```

### ❌ NOT Implemented (Needed for Settings Screens):
```typescript
// Security
enable2FA(userId: string): Promise<any>
disable2FA(userId: string, confirmationCode: string): Promise<any>

// OAuth
connectGoogleAccount(userId: string, googleToken: string): Promise<any>
connectAppleAccount(userId: string, appleToken: string): Promise<any>
disconnectOAuthAccount(userId: string, provider: string): Promise<any>

// Data Management  
exportUserData(userId: string): Promise<any>
deleteAccount(userId: string, confirmation: string): Promise<any>
getActivityLog(userId: string): Promise<any>
clearActivityLog(userId: string): Promise<any>
clearSearchHistory(userId: string): Promise<any>
```

---

## Action Items

### Priority 1: Wire Up Existing Functionality ✅
These can be done NOW with existing userService methods:

1. **ProfileSettings.tsx - Privacy Toggles**
   - Wire email/push notification toggles to `updateUserPreferences()`
   - Status: Ready to implement

2. **PrivacySettings.tsx - Privacy Preferences**
   - Wire all privacy toggles to `updateSettings()` or `updateUserPreferences()`
   - Status: Ready to implement

3. **ProfileSettings.tsx - Change Password**
   - Wire to existing `userService.changePassword()`
   - Status: Ready to implement

### Priority 2: Add Missing Methods to userService 🔧
These require new endpoints:

1. Add 2FA methods
2. Add OAuth connection methods
3. Add data export method
4. Add account deletion method
5. Add activity log methods
6. Add cache/history clearing methods

### Priority 3: Decide on Orphaned Screens ⚠️
**ProfileSettings.tsx** and **PrivacySettings.tsx** are orphaned:
- Not navigated to from anywhere
- Profile.tsx already has inline settings

**Options**:
1. Delete them (simplest)
2. Wire them up and link from Profile.tsx (more features)
3. Keep them for future use (current state)

---

## Recommendation

### Short Term (Immediate):
1. ✅ Keep ProfileSetupScreen.tsx, EditProfileScreen.tsx, Profile.tsx as-is (already working)
2. ⚠️ **DELETE** ProfileSettings.tsx and PrivacySettings.tsx (orphaned, fully stubbed, not used)
3. ✅ Update documentation to reflect actual state

### Medium Term (When needed):
1. Add missing userService methods as features are requested
2. Implement 2FA, OAuth, data export when backend endpoints are ready
3. Create new simplified settings screens if needed

---

## Files Status Summary

| File | API Integration | Navigation | Action |
|------|----------------|-----------|---------|
| ProfileSetupScreen.tsx | ✅ Fully implemented | ✅ Used from dashboards | ✅ Keep |
| EditProfileScreen.tsx | ✅ Fully implemented | ✅ Used from Profile.tsx | ✅ Keep |
| Profile.tsx | ✅ Mostly implemented | ✅ Main profile tab | ✅ Keep |
| ProfileSettings.tsx | ❌ Fully stubbed | ❌ Not used | ❌ **DELETE** |
| PrivacySettings.tsx | ❌ Fully stubbed | ❌ Not used | ❌ **DELETE** |

---

## Conclusion

**Current State**: 
- 3 active profile screens are properly using userService API calls ✅
- 2 orphaned screens are fully stubbed and not integrated ❌

**Recommendation**: 
- Delete ProfileSettings.tsx and PrivacySettings.tsx
- They were created as part of the duplicate work that got consolidated
- Profile.tsx already handles essential settings inline
- If advanced settings are needed later, create NEW screens with proper API integration from the start
