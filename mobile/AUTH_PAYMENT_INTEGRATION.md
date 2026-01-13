# WIHY Auth & Payment Integration Guide

## Overview

This guide covers the complete authentication and payment integration for the WIHY mobile app, supporting Web, iOS, and Android platforms.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        WIHY App                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ AuthContext │  │ useCheckout │  │ usePaymentCallback  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────────▼──────────┐  │
│  │ authService │  │checkoutSvc  │  │   Deep Link Handler │  │
│  │ appleAuth   │  │paymentSvc   │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
└─────────┼────────────────┼──────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   https://auth.wihy.ai                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │ Gateway │→│  Auth   │→│ Payment │→│ Stripe Checkout │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

The app uses these key packages (already in package.json):
- `expo-auth-session` - OAuth flows
- `expo-web-browser` - In-app browser for checkout
- `expo-linking` - Deep link handling
- `expo-apple-authentication` - Apple Sign-In (iOS)
- `@react-native-async-storage/async-storage` - Secure token storage

### 2. Configure Environment

Copy `.env.example` to `.env` and add your credentials:

```bash
cd mobile
cp .env.example .env
```

Required variables:
```env
EXPO_PUBLIC_WIHY_NATIVE_CLIENT_ID=your_client_id
EXPO_PUBLIC_WIHY_NATIVE_CLIENT_SECRET=your_client_secret
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### 3. Wrap App with AuthProvider

```tsx
// App.tsx
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
```

## Authentication

### Using the Auth Context

```tsx
import { useAuth } from '../context/AuthContext';

function LoginScreen() {
  const { signIn, signOut, user, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn('google'); // or 'apple', 'email', 'facebook', 'microsoft'
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View>
      {user ? (
        <>
          <Text>Welcome, {user.name}!</Text>
          <Button title="Sign Out" onPress={signOut} />
        </>
      ) : (
        <Button title="Sign In" onPress={handleLogin} />
      )}
    </View>
  );
}
```

### Email/Password Authentication

```tsx
// Registration
await signIn('email', {
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
  isRegister: true,
  plan: 'free', // optional
});

// Login
await signIn('email', {
  email: 'user@example.com',
  password: 'SecurePass123!',
});
```

### OAuth Providers

```tsx
// Google Sign-In
await signIn('google');

// Apple Sign-In (iOS & Web)
await signIn('apple');

// Facebook
await signIn('facebook');

// Microsoft (Enterprise)
await signIn('microsoft');
```

### Direct Service Usage

```tsx
import { authService } from '../services/authService';

// Register
const result = await authService.registerLocal(
  'user@example.com',
  'password',
  'John Doe',
  { plan: 'premium' }
);

// Login
const result = await authService.loginLocal(
  'user@example.com',
  'password'
);

// Check session
const session = await authService.verifySession();

// Logout
await authService.logout();
```

## Payments & Subscriptions

### Available Plans

| Plan ID | Name | Price | Interval |
|---------|------|-------|----------|
| `free` | Free | $0 | - |
| `premium` | Premium | $12.99 | month |
| `premium-yearly` | Premium Annual | $99.99 | year |
| `family-basic` | Family Basic | $24.99 | month |
| `family-pro` | Family Pro | $49.99 | month |
| `coach` | Coach | $99.99 | one-time |

### Using the Checkout Hook

```tsx
import { useCheckout, usePaymentCallback } from '../hooks/usePayment';

function UpgradeScreen() {
  const { 
    plans, 
    selectedPlan, 
    selectPlan, 
    checkout, 
    loading, 
    error 
  } = useCheckout();

  // Handle payment callbacks
  usePaymentCallback({
    onSuccess: (result) => {
      console.log('Payment successful!', result.plan);
      navigation.navigate('Dashboard');
    },
    onCancel: (result) => {
      console.log('Payment cancelled');
    },
  });

  const handleUpgrade = async () => {
    const result = await checkout(); // Uses user.email from context
    
    if (result.success) {
      Alert.alert('Success', 'Thank you for subscribing!');
    }
  };

  return (
    <View>
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          selected={selectedPlan?.id === plan.id}
          onSelect={() => selectPlan(plan.id)}
        />
      ))}
      
      <Button 
        title={`Subscribe to ${selectedPlan?.name}`}
        onPress={handleUpgrade}
        disabled={!selectedPlan || loading}
      />
    </View>
  );
}
```

### Using the Plan Selector Component

```tsx
import { PlanSelector } from '../components/subscription/PlanSelector';

function SubscriptionScreen() {
  return (
    <PlanSelector
      onPlanSelected={(plan) => console.log('Selected:', plan)}
      onCheckoutSuccess={() => navigation.navigate('Dashboard')}
      onCheckoutCancel={() => console.log('Cancelled')}
      showFreeOption={true}
      highlightPlan="premium"
    />
  );
}
```

### Direct Checkout Service Usage

```tsx
import { checkoutService } from '../services/checkoutService';

// Get all plans
const plans = await checkoutService.getPlans();

// Initiate checkout
const { checkoutUrl, sessionId } = await checkoutService.initiateCheckout(
  'premium',
  'user@example.com'
);

// Open checkout (handles platform differences)
const result = await checkoutService.openCheckout(checkoutUrl);

// Check payment status
const status = await checkoutService.getPaymentStatus('user@example.com');
```

### Subscription Management

```tsx
import { useSubscription } from '../hooks/usePayment';

function SubscriptionSettings() {
  const { 
    subscription, 
    isActive, 
    daysRemaining, 
    cancel, 
    resume 
  } = useSubscription();

  if (!isActive) {
    return <UpgradePrompt />;
  }

  return (
    <View>
      <Text>Plan: {subscription?.planName}</Text>
      <Text>Days remaining: {daysRemaining}</Text>
      
      {subscription?.cancelAtPeriodEnd ? (
        <Button title="Resume Subscription" onPress={resume} />
      ) : (
        <Button title="Cancel Subscription" onPress={() => cancel(false)} />
      )}
    </View>
  );
}
```

## Deep Linking

### Configuration

Deep links are configured in `app.json`:

```json
{
  "expo": {
    "scheme": "wihy",
    "ios": {
      "associatedDomains": ["applinks:auth.wihy.ai"]
    },
    "android": {
      "intentFilters": [
        {
          "data": [
            { "scheme": "wihy", "host": "payment-success" },
            { "scheme": "wihy", "host": "payment-cancel" }
          ]
        }
      ]
    }
  }
}
```

### Callback URLs

| Event | Mobile URL | Web URL |
|-------|------------|---------|
| Payment Success | `wihy://payment-success?session_id=xxx&plan=xxx` | `https://wihy.ai/payment/success` |
| Payment Cancel | `wihy://payment-cancel?plan=xxx` | `https://wihy.ai/payment/cancel` |
| Auth Callback | `wihy://auth/callback?token=xxx` | `https://wihy.ai/auth/callback` |

### Setting Up Listeners

```tsx
// In App.tsx or root component
import { usePaymentCallback } from '../hooks/usePayment';

function App() {
  usePaymentCallback({
    onSuccess: (result) => {
      // User completed payment
      // Update UI, navigate to success screen
    },
    onCancel: (result) => {
      // User cancelled payment
    },
  });

  return <Navigation />;
}
```

## API Reference

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/local/login` | Email/password login |
| POST | `/api/auth/local/register` | User registration |
| GET | `/api/auth/google/authorize` | Google OAuth |
| GET | `/api/auth/facebook/authorize` | Facebook OAuth |
| GET | `/api/auth/microsoft/authorize` | Microsoft OAuth |
| POST | `/api/auth/apple/callback` | Apple Sign-In |
| POST | `/api/auth/verify` | Verify session |
| POST | `/api/auth/logout` | Logout |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payment/plans` | Get available plans |
| POST | `/api/payment/initiate` | Create checkout session |
| GET | `/api/payment/status/:email` | Check subscription status |

## File Structure

```
mobile/src/
├── context/
│   └── AuthContext.tsx        # Auth state management
├── services/
│   ├── authService.ts         # Core authentication
│   ├── appleAuthService.ts    # Apple Sign-In
│   ├── checkoutService.ts     # Stripe checkout
│   ├── paymentService.ts      # Payment management
│   └── enhancedAuthService.ts # OAuth WebView flow
├── hooks/
│   └── usePayment.ts          # Payment hooks
├── components/
│   └── subscription/
│       └── PlanSelector.tsx   # Plan selection UI
└── types/
    └── auth.ts                # Type definitions
```

## Testing

### Test Accounts

```
Email: cloudsync@test.com
Password: TestPass123!
```

### Test Payment Callbacks

```bash
# iOS Simulator
xcrun simctl openurl booted "wihy://payment-success?session_id=test123&plan=premium"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "wihy://payment-success?session_id=test123&plan=premium" com.wihy.app
```

## Troubleshooting

### Common Issues

**"Network Error" during auth**
- Check internet connection
- Verify API endpoint is correct (`https://auth.wihy.ai`)

**OAuth redirect not working**
- Ensure `scheme: "wihy"` is in app.json
- Check associated domains are configured

**Apple Sign-In not available**
- Only works on iOS 13+ and macOS
- Requires Apple Developer Program membership

**Payment checkout not opening**
- Check `expo-web-browser` is installed
- Verify deep link handlers are set up

### Debug Logging

Enable debug logging in development:

```tsx
import { debugLogService } from '../services/debugLogService';

debugLogService.setLogLevel('debug');
```

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use secure token storage** - `AsyncStorage` with encryption
3. **Implement token refresh** - Auth service handles this automatically
4. **Validate OAuth state** - Prevents CSRF attacks
5. **Use HTTPS only** - All API calls use HTTPS

## Next Steps

1. Set up OAuth provider credentials in auth.wihy.ai admin
2. Configure Stripe webhooks for subscription events
3. Test payment flows in Stripe test mode
4. Deploy to TestFlight/Internal Testing
5. Switch to production Stripe keys for launch

---

**Last Updated:** January 13, 2026
**Version:** 1.0.0
