# In-App Purchases & Subscription Management

## Overview

This app uses a hybrid subscription management system:

- **GHL (GoHighLevel)** - Source of truth for subscription status and customer data
- **react-native-iap** - Handles actual App Store and Google Play purchases
- **Backend API** - Syncs purchase data between app stores and GHL

The implementation supports:

- **Subscriptions** (recurring payments)
- **One-time purchases** (consumable and non-consumable)
- Purchase verification
- Restore purchases (required for iOS)

## Architecture

### Subscription Flow

1. **User purchases subscription** via App Store or Google Play
2. **Purchase verified** on device using react-native-iap
3. **Receipt sent to backend** for server-side verification
4. **Backend verifies** with Apple/Google APIs
5. **Backend updates GHL** with subscription status
6. **App checks GHL** for subscription status on Profile screen

### Files Created

1. **src/services/purchaseService.ts** - Core purchase service handling all IAP logic
2. **src/services/ghlService.ts** - GHL API integration for subscription management
3. **src/screens/SubscriptionScreen.tsx** - UI for displaying and purchasing products
4. **src/screens/Profile.tsx** - Shows subscription status and upgrade button
5. **app.json** - Updated with iOS in-app-payments entitlement

## GHL Integration

### Backend API Requirements

Your backend must implement these endpoints:

#### 1. Check Subscription Status
```
GET /api/ghl/subscription-status?email={email}
```

Response:
```json
{
  "isPremium": true,
  "subscriptionType": "monthly" | "yearly" | "lifetime",
  "expiresAt": "2025-12-28T00:00:00Z",
  "features": ["unlimited_scans", "advanced_insights"],
  "contactId": "ghl_contact_id"
}
```

#### 2. Sync Contact to GHL
```
POST /api/ghl/sync-contact
```

Body:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "tags": ["app_user"],
  "customFields": {}
}
```

#### 3. Update Subscription
```
POST /api/ghl/update-subscription
```

Body:
```json
{
  "email": "user@example.com",
  "subscriptionType": "monthly",
  "transactionId": "apple_transaction_id",
  "purchasedAt": "2025-12-28T00:00:00Z"
}
```

#### 4. Verify Purchase
```
POST /api/verify-purchase
```

Body:
```json
{
  "receipt": "base64_encoded_receipt",
  "productId": "com.wihy.native.premium_monthly",
  "platform": "ios" | "android"
}
```

Response:
```json
{
  "valid": true,
  "transactionId": "1000000123456789",
  "productId": "com.wihy.native.premium_monthly",
  "purchaseDate": "2025-12-28T00:00:00Z"
}
```

### GHL Configuration

In your GoHighLevel account:

1. **Create Custom Fields** for contacts:
   - `subscription_type` (text)
   - `subscription_expires` (date)
   - `app_transaction_id` (text)

2. **Set up Tags**:
   - `premium_active` - Active premium subscriber
   - `premium_expired` - Expired subscription
   - `free_user` - Free tier user

3. **Create Workflows** (optional):
   - Send welcome email when user upgrades
   - Send renewal reminders before expiration
   - Downgrade actions when subscription expires

## Apple App Store Setup

### 1. App Store Connect Configuration

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **Features** → **In-App Purchases**
4. Create your products:

**Recommended Product IDs:**
- `com.wihy.native.premium_monthly` - Monthly subscription
- `com.wihy.native.premium_yearly` - Yearly subscription  
- `com.wihy.native.nutrition_analysis` - One-time purchase for analysis credits

### 2. Product Types

- **Auto-Renewable Subscriptions**: For premium monthly/yearly plans
- **Non-Consumable**: For permanent unlocks (e.g., "Premium Forever")
- **Consumable**: For credits that can be used up (e.g., "10 Scans")

### 3. Provisioning Profile

Ensure your provisioning profile includes the **In-App Purchase** capability:

1. Open Xcode
2. Select your project → Target → **Signing & Capabilities**
3. Click **+ Capability** → Add **In-App Purchase**
4. Rebuild with EAS: `eas build --platform ios`

### 4. Testing with Sandbox

1. Create sandbox test users in App Store Connect
2. Sign out of your real App Store account on the device
3. Run the app and make a purchase
4. Sign in with the sandbox account when prompted

## Google Play Store Setup

### 1. Google Play Console Configuration

1. Log in to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Monetize** → **Products** → **In-app products**
4. Create your products with the same IDs:

**Product IDs (must match iOS):**
- `com.wihy.native.premium_monthly`
- `com.wihy.native.premium_yearly`
- `com.wihy.native.nutrition_analysis`

### 2. Subscriptions vs Products

- **Subscriptions**: Go to **Monetize** → **Subscriptions**
- **One-time products**: Go to **Monetize** → **Products** → **In-app products**

### 3. Testing

1. Add test accounts in Google Play Console → **Settings** → **License Testing**
2. Upload a signed APK/AAB to internal testing track
3. Opt-in test users
4. Purchases will be free for test accounts

## Code Integration

### Using the Purchase Service

```typescript
import { purchaseService } from '../services';

// Initialize (do this once at app startup)
await purchaseService.initialize();

// Get available products
const products = purchaseService.getProducts();
const subscriptions = purchaseService.getSubscriptions();

// Purchase a product
await purchaseService.purchaseProduct('com.wihy.native.nutrition_analysis');

// Subscribe
await purchaseService.subscribe('com.wihy.native.premium_monthly');

// Restore purchases (iOS requirement)
await purchaseService.restorePurchases();

// Cleanup on unmount
await purchaseService.disconnect();
```

### Navigation to Subscription Screen

From any screen:

```typescript
navigation.navigate('Subscription');
```

## Server-Side Verification (Required for Production)

**IMPORTANT**: The current implementation has mock verification. You MUST implement server-side receipt verification for production.

### Backend Implementation Steps

1. Create an endpoint: `POST https://services.wihy.ai/api/verify-purchase`
2. For iOS, verify receipts with Apple's verification API:
   - Sandbox: `https://sandbox.itunes.apple.com/verifyReceipt`
   - Production: `https://buy.itunes.apple.com/verifyReceipt`
3. For Android, use Google Play Developer API
4. Update `purchaseService.ts` → `verifyPurchase()` method:

```typescript
private async verifyPurchase(purchase: Purchase): Promise<boolean> {
  const response = await fetch('https://services.wihy.ai/api/verify-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receipt: purchase.transactionReceipt,
      productId: purchase.productId,
      platform: Platform.OS,
    }),
  });
  
  const result = await response.json();
  return result.valid;
}
```

## Product Configuration

Update product IDs in `src/services/purchaseService.ts`:

```typescript
const PRODUCT_IDS = Platform.select({
  ios: [
    'com.wihy.native.premium_monthly',
    'com.wihy.native.premium_yearly',
    'com.wihy.native.nutrition_analysis',
  ],
  android: [
    'com.wihy.native.premium_monthly',
    'com.wihy.native.premium_yearly',
    'com.wihy.native.nutrition_analysis',
  ],
}) || [];
```

## Build Requirements

### iOS

```bash
# Build with EAS (includes entitlements)
eas build --platform ios --profile production

# Or for development
eas build --platform ios --profile development
```

### Android

```bash
# Build with EAS
eas build --platform android --profile production

# Or for local development
cd android && ./gradlew assembleRelease
```

## Testing Checklist

- [ ] Products created in App Store Connect
- [ ] Products created in Google Play Console
- [ ] Product IDs match in both stores and code
- [ ] Sandbox testing works on iOS
- [ ] License testing works on Android
- [ ] Purchase flow completes successfully
- [ ] Receipt verification implemented (server-side)
- [ ] Restore purchases works on iOS
- [ ] Subscription auto-renewal tested
- [ ] Error handling for cancelled purchases
- [ ] Loading states during purchase

## Common Issues

### iOS

1. **"Cannot connect to iTunes Store"**
   - Ensure you're signed in with a sandbox account
   - Check network connectivity
   - Verify products are approved in App Store Connect

2. **Products not loading**
   - Wait 2-4 hours after creating products
   - Check product IDs match exactly
   - Ensure app is approved for testing

### Android

1. **"Item unavailable"**
   - Upload a signed APK to Play Console
   - Ensure products are active
   - Test account must be opted into test track

2. **Billing not available**
   - Check Google Play Services is installed
   - Verify billing permission in AndroidManifest
   - Ensure app is published to at least internal testing

## Resources

- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [App Store Sandbox Testing](https://developer.apple.com/documentation/appstoreserverapi/testing_in_sandbox)
- [Google Play License Testing](https://developer.android.com/google/play/billing/test)

## Next Steps

1. **Create products in App Store Connect and Google Play Console**
2. **Update product IDs in purchaseService.ts**
3. **Implement server-side receipt verification**
4. **Test with sandbox/test accounts**
5. **Submit for app review**
