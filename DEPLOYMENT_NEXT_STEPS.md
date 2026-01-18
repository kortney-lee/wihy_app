# 🚨 URGENT: Tab Navigation Issue - What's Happening & How to Fix

**Problem:** Users on production cannot click tabs after app loads. Network error in console.

**Root Cause:** 
- Old app bundle (hash: `b09a0932...`) is being served from your hosting
- New bundle (hash: `29996a06...`) was built locally but NOT deployed yet
- Old bundle has incomplete error handling → app freezes on network error

---

## ✅ Immediate Action Items (Do These Now)

### 1️⃣ **Redeploy the `mobile/dist/` folder to your hosting**

This is the **critical step** - the new code is ready but not live yet.

#### If Using **AWS S3 + CloudFront:**
```powershell
# From repo root
aws s3 sync mobile/dist/ s3://your-wihy-bucket/ --delete --cache-control "public, max-age=3600"
# Then invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### If Using **Vercel:**
```powershell
cd mobile
vercel deploy --prod
```

#### If Using **Firebase Hosting:**
```powershell
cd mobile
firebase deploy --only hosting
```

#### If Using **Azure Storage:**
```powershell
# Upload dist folder to your storage account
az storage blob upload-batch -d '$web' -s mobile/dist/ --account-name youraccountname
```

---

### 2️⃣ **Clear Browser & CDN Cache**

```javascript
// In browser console, unregister any service workers:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  location.reload();
});

// Hard refresh (depending on OS):
// Windows/Linux: Ctrl+Shift+R
// macOS: Cmd+Shift+R
```

### 3️⃣ **Verify New Bundle is Loaded**

```javascript
// In browser console:
console.log(document.querySelectorAll('script[src*="AppEntry"]')[0]?.src);
// Should contain: AppEntry-29996a069a88cff8049839365b19f0aa.js
// NOT: AppEntry-b09a0932...
```

### 4️⃣ **Test Tab Navigation**

1. Go to https://wihy.ai/
2. Open DevTools Console (F12)
3. Look for: `[AuthContext] Loaded user from storage fallback` or similar ✅
4. Should NOT see unhandled NetworkError ❌
5. Click each tab - should respond immediately ✅

---

## 📋 Code Changes Made (Already Pushed)

### ✅ What's Fixed:
1. **AuthContext** - Now gracefully handles network failures on app startup
2. **authService** - Added 10s timeout to prevent hanging, better error logging
3. **Error Recovery** - Falls back to localStorage, allows guest access

### ✅ Commits Made:
- Branch: `main`
- Commit: `c816360` ("Add network resilience & graceful error handling...")
- Files: `AuthContext.tsx`, `authService.ts`, `PRODUCTION_DEPLOYMENT_FIX.md`

### 📖 Full Details:
See: `PRODUCTION_DEPLOYMENT_FIX.md` (in repo root)

---

## 🔍 If Issue Persists After Deployment

### Check Network Tab:
1. Open DevTools → Network tab
2. Reload page
3. Look for failed requests (red entries)
4. Check status code:
   - `0` = Network blocked/CORS issue
   - `404` = Endpoint doesn't exist
   - `5xx` = Server error
   - `timeout` = Backend not responding

### Verify Bundle Hash Manually:
```bash
# Check what's actually deployed
curl https://wihy.ai/ | grep -o 'AppEntry-[^.]*'
# Should output: AppEntry-29996a069a88cff8049839365b19f0aa
```

### Test API Directly:
```bash
curl -X POST https://api.wihy.ai/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
# Should get a response (even if error), not a timeout
```

---

## 📞 If You Need Help

**What to provide:**
1. Screenshot of Network tab (f12 → Network → Reload) showing failed request
2. Full URL where issue occurs
3. Confirmed that `mobile/dist/` was deployed to your hosting
4. Any error messages from hosting provider's dashboard

---

## ⏱️ Timeline to Resolution

| Step | Time | Status |
|------|------|--------|
| Code fixes & commit | ✅ Done | Complete |
| Push to GitHub | ✅ Done | Complete |
| **Redeploy dist/** | ⏳ TODO | **YOU NEED TO DO THIS** |
| Cache purge | ⏳ TODO | After deployment |
| Verify in browser | ⏳ TODO | After cache clear |
| Monitor for 24h | ⏳ TODO | After verification |

**Estimated time to full resolution: 5-10 minutes** (mostly waiting for CDN cache to clear)

---

## 🎯 One-Line Summary for Slack/PM

> **Tabs won't respond because old app bundle is deployed. New fixed code is committed. Redeploying `mobile/dist/` to production will resolve issue. ETA: 10min after deployment.**
