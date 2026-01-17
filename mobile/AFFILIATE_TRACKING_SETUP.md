# Affiliate Tracking Setup Guide

## Overview

WIHY uses LeadConnector/GoHighLevel's affiliate manager for tracking referrals and conversions. The system uses a two-step process:

1. **Visitor Tracking** - Tracks when visitors arrive via affiliate links
2. **Signup Tracking** - Tracks when visitors convert to leads (sign up)
3. **Sales Tracking** - Handled server-side via Stripe webhooks (automatic)

## Architecture

```
Affiliate Link Visit
        ↓
┌─────────────────────────────────────────┐
│ Step 1: Visitor Tracking (am.js)        │
│ Sets am_id cookie on .wihy.ai domain    │
└─────────────────────────────────────────┘
        ↓
User signs up
        ↓
┌─────────────────────────────────────────┐
│ Step 2: Signup Tracking                  │
│ affiliateService.trackSignup()           │
│ → affiliateManager.trackLead()           │
└─────────────────────────────────────────┘
        ↓
User makes purchase (Stripe)
        ↓
┌─────────────────────────────────────────┐
│ Step 3: Sales Tracking (Server-side)     │
│ Stripe webhook → backend → LeadConnector │
└─────────────────────────────────────────┘
```

## Implementation

### Step 1: Visitor Tracking Script

**File**: `mobile/web/index.html`

The visitor tracking script is added before the `</head>` tag:

```html
<!-- Affiliate Manager - Visitor Tracking Script -->
<script type="text/javascript">
  (function() {
    var t = document.createElement("script");
    t.type = "text/javascript", t.async = !0, t.src = 'https://link.msgsndr.com/js/am.js', t.onload = t.onreadystatechange = function() {
        var t = this.readyState;
        if (!t || "complete" == t || "loaded" == t) try {
          affiliateManager.init('Z1nzIRZ2FzhYiScXwPhv', 'https://backend.leadconnectorhq.com', '.wihy.ai')
        } catch (t) {}
    };
    var e = document.getElementsByTagName("script")[0];
    e.parentNode.insertBefore(t, e)
  })();
</script>
```

**Configuration**:
- Account ID: `Z1nzIRZ2FzhYiScXwPhv`
- Backend: `https://backend.leadconnectorhq.com`
- Cookie Domain: `.wihy.ai` (works across all subdomains)

### Step 2: Signup Tracking Service

**File**: `mobile/src/services/affiliateService.ts`

The affiliate service wraps the `affiliateManager.trackLead()` function:

```typescript
import { affiliateService } from './affiliateService';

// After successful registration:
await affiliateService.trackSignup(
  user.name,           // Full name (will be split into first/last)
  user.email,          // Email address
  user.stripeCustomerId // Optional: Stripe customer ID for reliable matching
);
```

**How it works**:
- Only runs on web platform (skips on iOS/Android)
- Checks if `window.affiliateManager` is available (visitor came from affiliate link)
- Sends lead data to LeadConnector for attribution
- Non-blocking: doesn't affect registration flow if tracking fails

### Step 3: Integration in authService

**File**: `mobile/src/services/authService.ts`

Affiliate tracking is automatically called after successful registration:

```typescript
// In register() and registerAfterPayment()
if (user?.email && user?.name) {
  affiliateService.trackSignup(user.name, user.email, user.id).catch((err) => {
    console.log('[Auth] Affiliate tracking skipped:', err);
  });
}
```

## Testing

### Test Flow

1. Open an **incognito window** (clear cookies)
2. Visit the test affiliate link: `https://wihy.ai/subscription?am_id=lavat1981`
3. Verify the `am_id` cookie is set for `.wihy.ai`
4. Complete a signup
5. Check browser Network tab for call to `/affiliate-manager/affiliate-campaign/v2/external-lead`

### Debug Checklist

| Check | How to Verify |
|-------|---------------|
| am.js loaded | Browser DevTools → Network → filter "am.js" |
| Cookie set | DevTools → Application → Cookies → am_id |
| trackLead called | DevTools → Console → "[Affiliate] Tracking lead" |
| API call made | Network → filter "external-lead" |

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No cookie set | Different domain | Script domain must match current domain |
| trackLead not called | No am_id cookie | Visit affiliate link first |
| API call canceled | Page redirect | Add 1s delay before redirect |
| iframe issues | Cross-domain | Use postMessage to parent window |

## Lead Matching

Leads are matched to Stripe customers for commission payouts:

| Field | Priority | Notes |
|-------|----------|-------|
| `uid` (Stripe Customer ID) | Preferred | Reliable even if email changes |
| `email` | Fallback | Works if same email used in Stripe |

**Best Practice**: Always pass both `email` and `uid` when available.

## Subdomain Support

The tracking works across WIHY subdomains:

- ✅ `wihy.ai` → `app.wihy.ai`
- ✅ `blog.wihy.ai` → `app.wihy.ai`
- ❌ `wihy.ai` → `different-domain.com` (different domain)

## Files

| File | Purpose |
|------|---------|
| `mobile/web/index.html` | Visitor tracking script |
| `mobile/src/services/affiliateService.ts` | Lead tracking service |
| `mobile/src/services/authService.ts` | Integration point (after registration) |

## Dashboard

Affiliate stats and commissions are managed at:
- **LeadConnector Dashboard**: Monitor affiliates, leads, and payouts
- **Note**: Test affiliate link visits don't appear on dashboard - use real affiliate links for testing

---

**Last Updated**: January 16, 2026
**Account ID**: Z1nzIRZ2FzhYiScXwPhv
**Cookie Domain**: .wihy.ai
