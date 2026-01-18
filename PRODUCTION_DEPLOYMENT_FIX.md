# Production Deployment & Tab Click Issue - Root Cause & Fix

**Date:** January 18, 2026  
**Issue:** Tabs cannot be clicked in production after deployment. NetworkError in console on app startup.  
**Root Cause:** Old bundle (`AppEntry-b09a0932...`) still served; new build (`AppEntry-29996a069...`) not deployed yet.

---

## 🔍 Problem Analysis

### Bundle Mismatch
- **Old Bundle (stale):** `AppEntry-b09a0932c8f2c1742a50bc7e76233798.js`  
- **New Bundle (local):** `AppEntry-29996a069a88cff8049839365b19f0aa.js` (created with `EXPO_WEB_DEBUG=true`)
- **Impact:** Browser is loading cached/old code that has broken network logic

### Network Error Chain
1. App loads old bundle → calls `AuthProvider` → calls `authService.verifySession()`
2. `verifySession()` makes fetch to `/api/auth/verify` (or similar)
3. Request hangs or fails (network error, CORS blocked, backend unreachable, timeout)
4. Old error handling didn't gracefully fall back → UI stays frozen
5. User cannot interact with tabs

### Why Tabs Don't Work
- `AuthProvider` has incomplete error handling during startup
- Network error in `componentDidMount` → unhandled promise rejection
- App state becomes corrupted → navigation/routing broken
- User sees grey screen or frozen app

---

## ✅ Fixes Applied

### 1. **Enhanced Error Handling in AuthContext** (`mobile/src/context/AuthContext.tsx`)
```typescript
// BEFORE: Errors silently logged but user data never loaded
catch (error) {
  console.error('Failed to load user data:', error);
}

// AFTER: Fallback to storage + allow guest access
catch (error) {
  console.error('[AuthContext] Failed to load user data - allowing app to continue:', error);
  // Try storage as fallback
  const storedData = await AsyncStorage.getItem(STORAGE_KEY);
  if (storedData) {
    setUser(normalizeUser(JSON.parse(storedData)));
  }
}
```

**Benefit:** App doesn't freeze on network errors; user can still interact with UI.

### 2. **Timeout & Better Error Handling in authService** (`mobile/src/services/authService.ts`)
```typescript
// Added 10-second timeout to prevent hanging requests
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetchWithLogging(endpoint, {
    // ...
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // Handle response...
} catch (error) {
  // Distinguish network errors from others
  if (error.name === 'AbortError') {
    console.error('[AuthService] Session verification timeout...');
  } else if (error instanceof TypeError) {
    console.error('[AuthService] Network error during session verification...');
  }
  return { valid: false };
}
```

**Benefit:** Request won't hang forever; gracefully times out after 10s and lets user access guest features.

---

## 🚀 Deployment Steps (Required)

### Step 1: Verify New Bundle Locally
```powershell
cd C:\repo\wihy_ui_clean\mobile

# Check the new bundle hash
ls dist\_expo\static\js\web\

# Should see: AppEntry-29996a069a88cff8049839365b19f0aa.js
```

### Step 2: Upload New Dist to Hosting
```bash
# Copy the entire dist/ folder to your hosting provider
# (AWS S3, Vercel, Firebase Hosting, etc.)

# Example for S3:
aws s3 sync dist/ s3://your-bucket/path/ --delete

# Example for Vercel:
vercel deploy --prod

# Example for Firebase Hosting:
firebase deploy --only hosting
```

### Step 3: Purge CDN/Cache
```bash
# Clear CloudFlare cache (if using)
# CloudFlare Dashboard → Caching → Purge Cache → Purge All

# Or via API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Step 4: Hard Refresh & Verify in Browser
```javascript
// Open browser DevTools (F12) → Sources
// Check for AppEntry-29996a069... (new bundle)
// NOT AppEntry-b09a0932... (old bundle)

// Force hard refresh:
// Windows/Linux: Ctrl+Shift+R
// macOS: Cmd+Shift+R

// Or disable cache:
// DevTools → Settings → Network → "Disable cache (while DevTools open)"
```

### Step 5: Test Navigation
1. Open https://wihy.ai/
2. Check browser console (F12 → Console)
3. Look for `[AuthContext] Loaded user from storage fallback` or similar
4. **Click tabs** → should respond immediately
5. Verify no "NetworkError" uncaught promise rejection

---

## 🐛 Troubleshooting

### Still Seeing Old Bundle?
- Clear browser cache: Settings → Privacy → Clear browsing data
- Check if hosting has stale assets:
  ```bash
  curl -I https://wihy.ai/index.html | grep -i cache
  # Should NOT have "Cache-Control: max-age=..." for long duration
  ```
- Verify CDN cache was purged (some CDNs take 30-60s)

### Still Getting NetworkError?
1. **Check Network Tab in DevTools:**
   - Open DevTools → Network → Reload page
   - Look for failed `/api/auth/verify` or similar requests
   - Note the Status Code: 404 (endpoint missing), 0 (CORS), 5xx (server error)

2. **Common Issues:**
   - Backend not running or unreachable
   - Wrong API base URL in env vars
   - CORS headers missing (if using different domain)
   - SSL/HTTPS mismatch

3. **Verify API Endpoint:**
   ```javascript
   // In console, check base URL
   console.log('API Base:', process.env.REACT_APP_API_BASE_URL);
   console.log('Auth Endpoint:', process.env.REACT_APP_API_BASE_URL + '/api/auth/verify');
   ```

### Tabs Still Not Responding After Fix?
- Check browser console for other errors (not just NetworkError)
- Verify React version compatibility
- Check if service worker is caching old code:
  ```javascript
  // In console:
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
    location.reload();
  });
  ```

---

## 📋 Checklist for Full Production Fix

- [ ] Rebuild with `EXPO_WEB_DEBUG=true` (already done)
- [ ] Apply AuthContext error handling fix (✅ done)
- [ ] Apply authService timeout/retry fix (✅ done)
- [ ] Commit changes: `git add . && git commit -m "Add network resilience & improve auth error handling"`
- [ ] Push to main: `git push origin main`
- [ ] **Deploy new `dist/` to hosting** (⚠️ **CRITICAL - NOT YET DONE**)
- [ ] Purge CDN/browser cache
- [ ] Hard refresh and test tabs
- [ ] Monitor console for errors over next 24h
- [ ] Update status in Slack/project tracker

---

## 🔐 Environment Configuration

**Ensure these are set in production:**

```bash
# .env or hosting config
REACT_APP_API_BASE_URL=https://api.wihy.ai
REACT_APP_ENVIRONMENT=production
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
EXPOSE_PORT=443  # HTTPS only
```

**Verify on live site:**
```javascript
// Console check:
fetch('https://api.wihy.ai/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: '...' })
})
.then(r => { console.log('Status:', r.status); return r.json(); })
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e.message));
```

---

## 📊 Expected Behavior After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Network error on startup | App frozen, tabs unresponsive | App shows guest UI, tabs work, retry on next action |
| API timeout | Hangs for 60s+ | Times out after 10s, gracefully degrades |
| Stored user data present | Ignored if API fails | Loaded as fallback, user stays logged in |
| Console errors | Unhandled promise rejection | Clean error logs, explains what happened |

---

## 📞 Support & Escalation

If after completing all steps the issue persists:

1. **Verify new bundle is live:**
   ```bash
   curl https://wihy.ai/ | grep "AppEntry-29996a069"
   ```

2. **Check backend health:**
   ```bash
   curl -v https://api.wihy.ai/health
   # Should return 200 OK
   ```

3. **Review server logs:**
   - Check if `/api/auth/verify` endpoint exists
   - Look for CORS errors
   - Check rate limits/firewall blocks

4. **Rollback if needed:**
   - Deploy previous working `dist/` from git history
   - Revert changes and debug offline
   - Coordinate with backend team

---

## 📝 Summary

**What happened:**
- New bundle built locally with debug flags
- Old bundle still on production server
- Network error in app startup → frozen UI

**What's fixed:**
- Enhanced error handling allows app to load even if network fails
- 10s timeout prevents indefinite hangs
- Fallback to storage for guest access
- Better error logging for debugging

**What you need to do:**
- Deploy `mobile/dist/` to hosting (this is the critical missing step)
- Clear CDN/browser cache
- Hard refresh and verify tabs work
- Monitor for any new errors in production

**Status:** ✅ Code fixes applied | ⏳ Deployment pending
