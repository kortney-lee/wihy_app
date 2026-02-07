# Apple In-App Purchases Setup Guide

This guide walks you through setting up In-App Purchases (IAP) for the WIHY app in App Store Connect.

## Prerequisites

1. **Apple Developer Account** (paid, $99/year)
2. **App registered in App Store Connect**
3. **Bundle ID**: `com.wihy.ai.app`
4. **EAS Build configured** (IAP doesn't work in Expo Go)

---

## Step 1: Create a Subscription Group

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **Monetization** → **Subscriptions**
3. Click **+** next to "Subscription Groups"
4. Create group: **WIHY Subscriptions**
   - Reference Name: `wihy_subscriptions`

---

## Step 2: Create Auto-Renewable Subscriptions

Create each subscription within the **WIHY Subscriptions** group:

### Premium Plans

| Product ID | Reference Name | Duration | Price |
|-----------|----------------|----------|-------|
| `com.wihy.ai.app.premium_monthly` | WIHY Premium Monthly | 1 Month | $12.99 |
| `com.wihy.ai.app.premium_yearly` | WIHY Premium Yearly | 1 Year | $99.99 |

### Family Plans

| Product ID | Reference Name | Duration | Price |
|-----------|----------------|----------|-------|
| `com.wihy.ai.app.family_basic_monthly` | WIHY Family Basic Monthly | 1 Month | $24.99 |
| `com.wihy.ai.app.family_basic_yearly` | WIHY Family Basic Yearly | 1 Year | $239.99 |
| `com.wihy.ai.app.family_pro_monthly` | WIHY Family Pro Monthly | 1 Month | $49.99 |
| `com.wihy.ai.app.family_pro_yearly` | WIHY Family Pro Yearly | 1 Year | $479.99 |

### Coach Plans

| Product ID | Reference Name | Duration | Price |
|-----------|----------------|----------|-------|
| `com.wihy.ai.app.coach_monthly` | WIHY Coach Platform Monthly | 1 Month | $29.99 |
| `com.wihy.ai.app.coach_yearly` | WIHY Coach Platform Yearly | 1 Year | $287.99 |

### Add-Ons

| Product ID | Reference Name | Duration | Price |
|-----------|----------------|----------|-------|
| `com.wihy.ai.app.coach_ai_addon` | WIHY Coach AI Add-on | 1 Month | $9.99 |

---

## Step 3: Configure Each Subscription

For each subscription you create:

### 3.1 Subscription Pricing
1. Click on the subscription
2. Click **Add Subscription Price**
3. Select your base country/region
4. Enter the price
5. Click **Next** and confirm all territories

### 3.2 App Store Localization
1. Under **App Store Information**, click **+** to add localization
2. Select **English (U.S.)** (and other languages as needed)
3. Fill in:
   - **Subscription Display Name**: e.g., "WIHY Premium"
   - **Description**: e.g., "Full nutrition and fitness tools with meal planning"

### 3.3 Review Screenshot (Required for Review)
1. Upload a screenshot showing the subscription UI
2. Size: 640 x 920 pixels minimum

---

## Step 4: Configure App Store Server Notifications (Recommended)

This allows Apple to notify your backend of subscription events.

1. Go to App Store Connect → Your App → **App Information**
2. Scroll to **App Store Server Notifications**
3. Add your endpoint URL:
   ```
   https://payment.wihy.ai/api/apple/server-notifications
   ```
4. Select **Version 2** notifications

---

## Step 5: Get Your Shared Secret

Required for server-side receipt validation:

1. Go to **App Information** → **App-Specific Shared Secret**
2. Click **Manage** → **Generate**
3. Copy the secret and add to your backend environment:
   ```
   APPLE_SHARED_SECRET=your_shared_secret_here
   ```

---

## Step 6: Testing with Sandbox

### Create Sandbox Test Accounts
1. Go to **Users and Access** → **Sandbox** → **Testers**
2. Click **+** to add a new tester
3. Use a unique email (can be fake, e.g., `test1@example.com`)
4. Remember the password you set

### Test on Device
1. Build your app with EAS:
   ```bash
   npx eas build --platform ios --profile preview
   ```
2. Install on a physical device via TestFlight or direct install
3. Sign out of your real Apple ID in Settings → App Store
4. When making a purchase, sign in with your sandbox account
5. Purchases are free and auto-renew every few minutes for testing

### Sandbox Renewal Schedule
| Real Duration | Sandbox Duration |
|--------------|------------------|
| 1 Week | 3 minutes |
| 1 Month | 5 minutes |
| 2 Months | 10 minutes |
| 3 Months | 15 minutes |
| 6 Months | 30 minutes |
| 1 Year | 1 hour |

---

## Step 7: Backend Receipt Verification

Your backend should verify receipts at:
```
POST https://payment.wihy.ai/api/iap/verify-receipt
```

The app sends:
```json
{
  "receipt": "base64_encoded_receipt_data",
  "productId": "com.wihy.ai.app.premium_monthly",
  "platform": "ios"
}
```

Your backend verifies with Apple:
- **Sandbox**: `https://sandbox.itunes.apple.com/verifyReceipt`
- **Production**: `https://buy.itunes.apple.com/verifyReceipt`

```javascript
// Backend verification example
const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    'receipt-data': receipt,
    'password': process.env.APPLE_SHARED_SECRET,
    'exclude-old-transactions': true
  })
});

const data = await response.json();
// Status 0 = valid, 21007 = sandbox receipt sent to production (retry with sandbox URL)
```

---

## Step 8: Building for Production

### EAS Build Configuration

Make sure your `eas.json` includes the production profile:

```json
{
  "build": {
    "production": {
      "ios": {
        "distribution": "store"
      }
    },
    "preview": {
      "ios": {
        "distribution": "internal",
        "simulator": false
      }
    }
  }
}
```

### Build Commands

```bash
# Development (internal testing)
npx eas build --platform ios --profile preview

# Production (App Store submission)
npx eas build --platform ios --profile production
```

---

## Product ID Mapping Reference

The app maps plan IDs to Apple product IDs in `purchaseService.ts`:

```typescript
export const PLAN_TO_APPLE_PRODUCT = {
  'premium': {
    monthly: 'com.wihy.ai.app.premium_monthly',
    yearly: 'com.wihy.ai.app.premium_yearly',
  },
  'family-basic': {
    monthly: 'com.wihy.ai.app.family_basic_monthly',
    yearly: 'com.wihy.ai.app.family_basic_yearly',
  },
  'family-pro': {
    monthly: 'com.wihy.ai.app.family_pro_monthly',
    yearly: 'com.wihy.ai.app.family_pro_yearly',
  },
  'coach': {
    monthly: 'com.wihy.ai.app.coach_monthly',
    yearly: 'com.wihy.ai.app.coach_yearly',
  },
};
```

---

## Troubleshooting

### "Cannot connect to iTunes Store"
- Make sure you're on a physical device (not simulator)
- Check your internet connection
- Ensure the app is signed with the correct provisioning profile

### "Product not found"
- Verify product IDs match exactly (case-sensitive)
- Make sure products are in "Ready to Submit" state
- Wait 15-30 minutes after creating products

### "Invalid receipt"
- Check you're using the correct verification URL (sandbox vs production)
- Verify your shared secret is correct
- Ensure receipt data is properly base64 encoded

### Purchases not restoring
- Make sure you're signed in with the same Apple ID
- Check that `getPurchaseHistoryAsync()` is called correctly
- Verify subscription hasn't expired

---

## Checklist Before Submission

- [ ] All products created in App Store Connect
- [ ] Product IDs match code exactly
- [ ] Localization added for all products
- [ ] Review screenshots uploaded
- [ ] Server notifications URL configured
- [ ] Shared secret saved to backend
- [ ] Sandbox testing completed
- [ ] Receipt verification working
- [ ] Restore purchases working
- [ ] Error handling implemented

---

## Resources

- [Apple StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [expo-in-app-purchases](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Receipt Validation](https://developer.apple.com/documentation/appstorereceipts)
