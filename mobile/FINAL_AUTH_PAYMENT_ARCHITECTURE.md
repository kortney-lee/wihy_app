# WIHY Authentication & Payment Architecture - Final Document

> **Complete Guide for All Platforms**  
> **Last Updated:** January 10, 2026  
> **Version:** 1.0

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Payment Integration](#payment-integration)
4. [Account Creation](#account-creation)
5. [Subscription Management](#subscription-management)
6. [Platform-Specific Implementation](#platform-specific-implementation)
7. [API Reference](#api-reference)
8. [Callback & Webhook Handling](#callback--webhook-handling)
9. [Error Handling](#error-handling)
10. [Security & Best Practices](#security--best-practices)

---

## Architecture Overview

### System Components

```
┌─────────────┐
│   Client    │ (Web, iOS, Android)
│ Application │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│Auth Service │    │   Payment   │
│auth.wihy.ai │    │  Providers  │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │    ┌─────────────┤
       │    │             │
       ▼    ▼             ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Stripe    │
│   Database   │   │ Apple Pay    │
│              │   │ Google Play  │
└──────────────┘   └──────────────┘
       │
       │
       ▼
┌──────────────┐
│     GHL      │
│ Integration  │
└──────────────┘
```

### Service Responsibilities

| Service | Responsibility | Endpoint |
|---------|---------------|----------|
| **Auth Service** | Authentication, User Management, Session | `https://auth.wihy.ai` |
| **Stripe** | Web Payments, Subscriptions | `https://api.stripe.com` |
| **Apple Pay** | iOS In-App Purchases | Apple App Store |
| **Google Play** | Android In-App Purchases | Google Play Store |
| **GHL** | Marketing Automation, Contact Sync | `https://rest.gohighlevel.com` |

---

## Authentication Flow

### 1. User Registration & Login

#### Web Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthService
    participant Database
    participant GHL
    
    Client->>AuthService: POST /api/auth/local/register
    AuthService->>Database: Create user record
    Database-->>AuthService: User created
    AuthService->>GHL: Sync contact
    GHL-->>AuthService: Contact synced
    AuthService-->>Client: { user, token }
    Client->>Client: Store token in localStorage
```

**API Call:**
```http
POST https://auth.wihy.ai/api/auth/local/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "plan": "premium",
  "referralCode": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free",
    "provider": "local",
    "createdAt": "2026-01-10T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

#### OAuth Flow (Google, Facebook, Microsoft)

```mermaid
sequenceDiagram
    participant Client
    participant AuthService
    participant OAuthProvider
    participant Database
    participant GHL
    
    Client->>AuthService: GET /api/auth/google/authorize
    AuthService-->>Client: Redirect to Google
    Client->>OAuthProvider: User authorizes
    OAuthProvider-->>AuthService: Callback with code
    AuthService->>OAuthProvider: Exchange code for token
    OAuthProvider-->>AuthService: User info
    AuthService->>Database: Create/update user
    Database-->>AuthService: User record
    AuthService->>GHL: Sync contact
    GHL-->>AuthService: Contact synced
    AuthService-->>Client: Redirect with token
```

**OAuth Authorization URL:**
```
GET https://auth.wihy.ai/api/auth/google/authorize?redirect_uri=https://app.wihy.ai/callback&state=abc123
```

**Callback Handler:**
```http
GET https://app.wihy.ai/callback?code=4/0AY0e...&state=abc123
```

**Client-side handling:**
```typescript
// Extract code from URL
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

// Exchange for token
const response = await fetch('https://auth.wihy.ai/api/auth/google/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
});

const { user, token } = await response.json();
localStorage.setItem('auth_token', token);
```

---

## Payment Integration

### Payment Flow Architecture

```
User Selects Plan → Platform Detection → Payment Provider → Subscription Created → Callback → Verify → Update Account
```

### Platform-Specific Payment Flows

#### 1. WEB - Stripe Payment Links

**Flow:**
```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Stripe
    participant Webhook
    participant AuthService
    participant Database
    
    User->>WebApp: Click "Upgrade to Premium"
    WebApp->>WebApp: Get Stripe Payment Link
    WebApp->>Stripe: Redirect to checkout
    Stripe->>User: Display payment form
    User->>Stripe: Enter payment details
    Stripe->>Stripe: Process payment
    Stripe-->>User: Redirect to success URL
    Stripe->>Webhook: POST /api/stripe/webhook
    Webhook->>AuthService: POST /api/users/{id}/subscription
    AuthService->>Database: Update user plan
    Database-->>AuthService: Plan updated
    AuthService-->>Webhook: Success
    Webhook-->>Stripe: 200 OK
    User->>WebApp: Return to app
    WebApp->>AuthService: GET /api/users/me
    AuthService-->>WebApp: User with premium plan
```

**Implementation:**

```typescript
// Client-side: Redirect to Stripe
const STRIPE_PAYMENT_LINKS = {
  premium_monthly: 'https://buy.stripe.com/3cI3cu6cu7BZ5aA4KVasg00',
  premium_yearly: 'https://buy.stripe.com/00w4gy58qaOb6eE0uFasg01',
  family_basic: 'https://buy.stripe.com/9B6aEWbwOf4rauUa5fasg02',
  family_premium: 'https://buy.stripe.com/6oUbJ0cASe0n1Yo0uFasg03',
  coach_setup: 'https://buy.stripe.com/bJe00igR81dB46wdhrasg04'
};

function upgradePlan(plan: string) {
  // Get current user ID
  const userId = authService.getUserId();
  
  // Add user metadata to Stripe checkout
  const checkoutUrl = `${STRIPE_PAYMENT_LINKS[plan]}?client_reference_id=${userId}`;
  
  // Redirect to Stripe
  window.location.href = checkoutUrl;
}
```

**Stripe Webhook Handler:**

```http
POST https://auth.wihy.ai/api/stripe/webhook
Content-Type: application/json
Stripe-Signature: t=1736553600,v1=abc123...

{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "customer": "cus_123",
      "client_reference_id": "user_123",
      "subscription": "sub_123",
      "amount_total": 1299,
      "metadata": {
        "plan": "premium_monthly"
      }
    }
  }
}
```

**Backend Webhook Processing:**

```javascript
// auth/routes/stripe.js
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const plan = session.metadata.plan;
    
    // Update user subscription
    await db.query(
      'UPDATE users SET plan = $1, stripe_customer_id = $2, stripe_subscription_id = $3 WHERE id = $4',
      [plan, session.customer, session.subscription, userId]
    );
    
    // Sync to GHL
    await syncToGHL(userId, { plan, status: 'active' });
  }
  
  res.json({ received: true });
});
```

#### 2. iOS - Apple In-App Purchase

**Flow:**
```mermaid
sequenceDiagram
    participant iOS
    participant StoreKit
    participant AppStore
    participant Backend
    participant Database
    
    iOS->>StoreKit: Request products
    StoreKit->>AppStore: Fetch products
    AppStore-->>StoreKit: Product list
    StoreKit-->>iOS: Display products
    iOS->>StoreKit: Purchase product
    StoreKit->>AppStore: Process payment
    AppStore-->>StoreKit: Transaction receipt
    StoreKit-->>iOS: Transaction completed
    iOS->>Backend: POST /api/iap/apple/verify
    Backend->>AppStore: Verify receipt
    AppStore-->>Backend: Receipt valid
    Backend->>Database: Update subscription
    Database-->>Backend: Updated
    Backend-->>iOS: Subscription activated
```

**iOS Implementation:**

```swift
// Configure StoreKit
import StoreKit

class SubscriptionManager: NSObject, SKProductsRequestDelegate, SKPaymentTransactionObserver {
    let productIds = [
        "com.wihy.premium.monthly",
        "com.wihy.premium.yearly",
        "com.wihy.family.basic",
        "com.wihy.family.premium"
    ]
    
    // Request products
    func loadProducts() {
        let request = SKProductsRequest(productIdentifiers: Set(productIds))
        request.delegate = self
        request.start()
    }
    
    // Purchase product
    func purchase(product: SKProduct) {
        let payment = SKPayment(product: product)
        SKPaymentQueue.default().add(payment)
    }
    
    // Handle transaction
    func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        for transaction in transactions {
            switch transaction.transactionState {
            case .purchased:
                verifyReceipt(transaction: transaction)
                SKPaymentQueue.default().finishTransaction(transaction)
            case .failed:
                SKPaymentQueue.default().finishTransaction(transaction)
            default:
                break
            }
        }
    }
    
    // Verify with backend
    func verifyReceipt(transaction: SKPaymentTransaction) {
        guard let receiptURL = Bundle.main.appStoreReceiptURL,
              let receiptData = try? Data(contentsOf: receiptURL) else {
            return
        }
        
        let receiptString = receiptData.base64EncodedString()
        
        // Send to backend
        let url = URL(string: "https://auth.wihy.ai/api/iap/apple/verify")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "receipt": receiptString,
            "productId": transaction.payment.productIdentifier,
            "transactionId": transaction.transactionIdentifier ?? ""
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }.resume()
    }
}
```

**Backend Receipt Verification:**

```http
POST https://auth.wihy.ai/api/iap/apple/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "receipt": "base64_encoded_receipt_data",
  "productId": "com.wihy.premium.monthly",
  "transactionId": "1000000123456789"
}
```

**Backend Handler:**

```javascript
app.post('/api/iap/apple/verify', authenticateToken, async (req, res) => {
  const { receipt, productId, transactionId } = req.body;
  const userId = req.user.id;
  
  // Verify with Apple
  const appleResponse = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receipt,
      'password': process.env.APPLE_SHARED_SECRET
    })
  });
  
  const appleData = await appleResponse.json();
  
  if (appleData.status === 0) {
    // Receipt is valid
    const plan = productIdToPlan(productId);
    
    await db.query(
      'UPDATE users SET plan = $1, apple_transaction_id = $2 WHERE id = $3',
      [plan, transactionId, userId]
    );
    
    // Sync to GHL
    await syncToGHL(userId, { plan, status: 'active', platform: 'ios' });
    
    res.json({ success: true, plan });
  } else {
    res.status(400).json({ error: 'Invalid receipt' });
  }
});
```

#### 3. Android - Google Play Billing

**Flow:**
```mermaid
sequenceDiagram
    participant Android
    participant BillingClient
    participant PlayStore
    participant Backend
    participant Database
    
    Android->>BillingClient: Query products
    BillingClient->>PlayStore: Fetch SKUs
    PlayStore-->>BillingClient: Product details
    BillingClient-->>Android: Display products
    Android->>BillingClient: Launch purchase
    BillingClient->>PlayStore: Process payment
    PlayStore-->>BillingClient: Purchase token
    BillingClient-->>Android: Purchase successful
    Android->>Backend: POST /api/iap/google/verify
    Backend->>PlayStore: Verify purchase
    PlayStore-->>Backend: Purchase valid
    Backend->>Database: Update subscription
    Database-->>Backend: Updated
    Backend-->>Android: Subscription activated
```

**Android Implementation:**

```kotlin
// Configure Play Billing
import com.android.billingclient.api.*

class BillingManager(private val activity: Activity) {
    private lateinit var billingClient: BillingClient
    
    private val productIds = listOf(
        "premium_monthly",
        "premium_yearly",
        "family_basic",
        "family_premium"
    )
    
    fun initialize() {
        billingClient = BillingClient.newBuilder(activity)
            .setListener(purchaseUpdateListener)
            .enablePendingPurchases()
            .build()
            
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProducts()
                }
            }
            
            override fun onBillingServiceDisconnected() {
                // Retry connection
            }
        })
    }
    
    private fun queryProducts() {
        val params = SkuDetailsParams.newBuilder()
            .setSkusList(productIds)
            .setType(BillingClient.SkuType.SUBS)
            .build()
            
        billingClient.querySkuDetailsAsync(params) { billingResult, skuDetailsList ->
            // Display products
        }
    }
    
    fun purchase(skuDetails: SkuDetails) {
        val flowParams = BillingFlowParams.newBuilder()
            .setSkuDetails(skuDetails)
            .build()
            
        billingClient.launchBillingFlow(activity, flowParams)
    }
    
    private val purchaseUpdateListener = PurchasesUpdatedListener { billingResult, purchases ->
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                verifyPurchase(purchase)
            }
        }
    }
    
    private fun verifyPurchase(purchase: Purchase) {
        // Send to backend
        val url = "https://auth.wihy.ai/api/iap/google/verify"
        val json = JSONObject().apply {
            put("purchaseToken", purchase.purchaseToken)
            put("productId", purchase.skus[0])
            put("orderId", purchase.orderId)
        }
        
        // Make API call
        val request = Request.Builder()
            .url(url)
            .post(json.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", "Bearer $authToken")
            .build()
            
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                // Handle success
                if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED && !purchase.isAcknowledged) {
                    acknowledgePurchase(purchase)
                }
            }
            
            override fun onFailure(call: Call, e: IOException) {
                // Handle error
            }
        })
    }
    
    private fun acknowledgePurchase(purchase: Purchase) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
            
        billingClient.acknowledgePurchase(params) { billingResult ->
            // Purchase acknowledged
        }
    }
}
```

**Backend Verification:**

```http
POST https://auth.wihy.ai/api/iap/google/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "purchaseToken": "abcdefg123456",
  "productId": "premium_monthly",
  "orderId": "GPA.1234-5678-9012-34567"
}
```

**Backend Handler:**

```javascript
const { google } = require('googleapis');

app.post('/api/iap/google/verify', authenticateToken, async (req, res) => {
  const { purchaseToken, productId, orderId } = req.body;
  const userId = req.user.id;
  
  // Initialize Google Play Developer API
  const auth = new google.auth.GoogleAuth({
    keyFile: './play-billing-key.json',
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });
  
  const androidpublisher = google.androidpublisher({
    version: 'v3',
    auth
  });
  
  try {
    // Verify purchase
    const result = await androidpublisher.purchases.subscriptions.get({
      packageName: 'ai.wihy.app',
      subscriptionId: productId,
      token: purchaseToken
    });
    
    if (result.data.paymentState === 1) {
      // Payment received
      const plan = productIdToPlan(productId);
      
      await db.query(
        'UPDATE users SET plan = $1, google_order_id = $2 WHERE id = $3',
        [plan, orderId, userId]
      );
      
      // Sync to GHL
      await syncToGHL(userId, { plan, status: 'active', platform: 'android' });
      
      res.json({ success: true, plan });
    } else {
      res.status(400).json({ error: 'Payment not received' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});
```

---

## Account Creation

### Complete Account Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthService
    participant Database
    participant Stripe
    participant GHL
    
    Client->>AuthService: POST /api/auth/local/register
    AuthService->>Database: BEGIN TRANSACTION
    AuthService->>Database: INSERT INTO users
    Database-->>AuthService: user_id
    AuthService->>Database: INSERT INTO user_profiles
    Database-->>AuthService: profile_id
    AuthService->>Stripe: Create customer
    Stripe-->>AuthService: customer_id
    AuthService->>Database: UPDATE users SET stripe_customer_id
    Database-->>AuthService: Updated
    AuthService->>Database: COMMIT TRANSACTION
    AuthService->>GHL: Create contact
    GHL-->>AuthService: contact_id
    AuthService->>Database: UPDATE users SET ghl_contact_id
    AuthService-->>Client: { user, token }
```

### Account Creation Endpoints

#### 1. Local Registration

```http
POST https://auth.wihy.ai/api/auth/local/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "+1234567890",
  "plan": "free",
  "referralCode": "FRIEND123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free",
    "stripeCustomerId": "cus_xyz789",
    "ghlContactId": "contact_123",
    "createdAt": "2026-01-10T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

#### 2. OAuth Registration

```http
GET https://auth.wihy.ai/api/auth/google/authorize?redirect_uri=https://app.wihy.ai/callback&state=abc123
```

Callback handles account creation automatically.

---

## Subscription Management

### Subscription Status Flow

```mermaid
graph TD
    A[User Account] --> B{Has Subscription?}
    B -->|No| C[Free Plan]
    B -->|Yes| D{Platform?}
    D -->|Web| E[Check Stripe]
    D -->|iOS| F[Check Apple]
    D -->|Android| G[Check Google]
    E --> H[Active Subscription]
    F --> H
    G --> H
    H --> I[Sync to GHL]
    I --> J[Update Database]
```

### Check Subscription Status

```http
GET https://auth.wihy.ai/api/users/me/subscription
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "active",
  "plan": "premium_monthly",
  "platform": "web",
  "provider": "stripe",
  "subscriptionId": "sub_123",
  "currentPeriodEnd": "2026-02-10T12:00:00Z",
  "cancelAtPeriodEnd": false,
  "paymentMethod": {
    "type": "card",
    "last4": "4242",
    "brand": "visa"
  }
}
```

### GHL Integration

**Sync User to GHL:**

```javascript
async function syncToGHL(userId, subscriptionData) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  const ghlData = {
    email: user.email,
    name: user.name,
    phone: user.phone,
    customFields: {
      user_id: userId,
      plan: subscriptionData.plan,
      subscription_status: subscriptionData.status,
      platform: subscriptionData.platform,
      stripe_customer_id: user.stripe_customer_id,
      last_payment_date: new Date().toISOString()
    },
    tags: [
      subscriptionData.plan,
      subscriptionData.status,
      `platform_${subscriptionData.platform}`
    ]
  };
  
  const response = await fetch('https://rest.gohighlevel.com/v1/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ghlData)
  });
  
  const contact = await response.json();
  
  // Update user with GHL contact ID
  await db.query(
    'UPDATE users SET ghl_contact_id = $1 WHERE id = $2',
    [contact.id, userId]
  );
  
  return contact;
}
```

---

## Platform-Specific Implementation

### Web (React/TypeScript)

```typescript
import { authService } from './services/authService';

class PaymentManager {
  // Upgrade to premium
  async upgradeToPremium(plan: string) {
    const paymentLinks = {
      premium_monthly: process.env.REACT_APP_STRIPE_PREMIUM_MONTHLY,
      premium_yearly: process.env.REACT_APP_STRIPE_PREMIUM_YEARLY,
      family_basic: process.env.REACT_APP_STRIPE_FAMILY_BASIC,
      family_premium: process.env.REACT_APP_STRIPE_FAMILY_PREMIUM,
    };
    
    // Get current user
    const user = authService.getUser();
    
    // Redirect to Stripe with metadata
    const checkoutUrl = `${paymentLinks[plan]}?client_reference_id=${user.id}`;
    window.location.href = checkoutUrl;
  }
  
  // Handle return from Stripe
  async handlePaymentReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      // Wait for webhook to process
      await this.waitForSubscriptionUpdate();
      
      // Reload user data
      const profile = await authService.getUserProfile();
      return profile;
    }
  }
  
  private async waitForSubscriptionUpdate(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const profile = await authService.getUserProfile();
      if (profile.plan !== 'free') {
        return profile;
      }
    }
  }
}
```

### iOS (Swift)

```swift
import Foundation
import StoreKit

class WIHYPaymentManager: NSObject {
    private let authService: AuthService
    private let subscriptionManager: SubscriptionManager
    
    // Complete purchase flow
    func purchasePlan(productId: String, completion: @escaping (Result<UserProfile, Error>) -> Void) {
        // 1. Purchase from App Store
        subscriptionManager.purchase(productId: productId) { result in
            switch result {
            case .success(let transaction):
                // 2. Verify with backend
                self.verifyPurchase(transaction: transaction) { verifyResult in
                    switch verifyResult {
                    case .success:
                        // 3. Fetch updated profile
                        self.authService.getUserProfile { profile in
                            completion(.success(profile))
                        }
                    case .failure(let error):
                        completion(.failure(error))
                    }
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    // Restore purchases
    func restorePurchases(completion: @escaping (Result<UserProfile, Error>) -> Void) {
        subscriptionManager.restorePurchases { result in
            switch result {
            case .success(let transactions):
                // Verify most recent
                if let latest = transactions.first {
                    self.verifyPurchase(transaction: latest, completion: completion)
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
}
```

### Android (Kotlin)

```kotlin
class WIHYPaymentManager(
    private val activity: Activity,
    private val authService: AuthService
) {
    private val billingManager = BillingManager(activity)
    
    // Purchase flow
    fun purchasePlan(productId: String, callback: (Result<UserProfile>) -> Unit) {
        billingManager.purchase(productId) { result ->
            when (result) {
                is BillingResult.Success -> {
                    // Verify with backend
                    verifyPurchase(result.purchase) { verified ->
                        if (verified) {
                            // Fetch updated profile
                            authService.getUserProfile { profile ->
                                callback(Result.success(profile))
                            }
                        } else {
                            callback(Result.failure(Exception("Verification failed")))
                        }
                    }
                }
                is BillingResult.Error -> {
                    callback(Result.failure(result.error))
                }
            }
        }
    }
    
    // Check subscription status
    fun checkSubscriptionStatus(callback: (SubscriptionStatus) -> Unit) {
        billingManager.queryPurchases { purchases ->
            val activePurchase = purchases.firstOrNull { it.isActive() }
            
            if (activePurchase != null) {
                callback(SubscriptionStatus.Active(activePurchase))
            } else {
                callback(SubscriptionStatus.Inactive)
            }
        }
    }
}
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/local/register` | Register with email/password | No |
| POST | `/api/auth/local/login` | Login with email/password | No |
| GET | `/api/auth/google/authorize` | Initiate Google OAuth | No |
| GET | `/api/auth/facebook/authorize` | Initiate Facebook OAuth | No |
| GET | `/api/auth/microsoft/authorize` | Initiate Microsoft OAuth | No |
| POST | `/api/auth/google/callback` | Handle Google OAuth callback | No |
| POST | `/api/auth/verify` | Verify session token | Yes |
| POST | `/api/auth/logout` | End session | Yes |
| POST | `/api/auth/refresh` | Refresh access token | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Get current user profile | Yes |
| PUT | `/api/users/me` | Update user profile | Yes |
| GET | `/api/users/me/subscription` | Get subscription status | Yes |
| PUT | `/api/users/me/plan` | Update subscription plan | Yes |
| POST | `/api/users/me/addons` | Add subscription addon | Yes |
| DELETE | `/api/users/me/addons` | Remove subscription addon | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/stripe/webhook` | Stripe webhook handler | No (Signed) |
| POST | `/api/iap/apple/verify` | Verify Apple IAP receipt | Yes |
| POST | `/api/iap/google/verify` | Verify Google Play purchase | Yes |
| POST | `/api/payments/create-checkout` | Create Stripe checkout session | Yes |
| GET | `/api/payments/portal` | Get billing portal URL | Yes |

### Subscription Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subscriptions/status` | Check subscription status | Yes |
| POST | `/api/subscriptions/cancel` | Cancel subscription | Yes |
| POST | `/api/subscriptions/resume` | Resume subscription | Yes |
| GET | `/api/subscriptions/history` | Get payment history | Yes |

---

## Callback & Webhook Handling

### Stripe Webhooks

**Endpoint:** `POST https://auth.wihy.ai/api/stripe/webhook`

**Events to Handle:**

```javascript
const WEBHOOK_EVENTS = {
  'checkout.session.completed': handleCheckoutCompleted,
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
};

app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  const handler = WEBHOOK_EVENTS[event.type];
  if (handler) {
    await handler(event.data.object);
  }
  
  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id;
  const plan = session.metadata.plan;
  
  await db.query(
    `UPDATE users SET 
      plan = $1, 
      stripe_customer_id = $2,
      stripe_subscription_id = $3,
      subscription_status = 'active'
    WHERE id = $4`,
    [plan, session.customer, session.subscription, userId]
  );
  
  await syncToGHL(userId, {
    plan,
    status: 'active',
    platform: 'web'
  });
}

async function handleSubscriptionDeleted(subscription) {
  await db.query(
    `UPDATE users SET 
      plan = 'free',
      subscription_status = 'canceled'
    WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );
}
```

### OAuth Callbacks

**Google Callback:**
```http
GET https://app.wihy.ai/callback?code=4/0AY0e...&state=abc123
```

**Handling:**
```typescript
// In your app
useEffect(() => {
  const handleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      const result = await authService.handleOAuthCallback('google', window.location.href);
      
      if (result.success) {
        // User logged in
        navigate('/dashboard');
      } else {
        // Error
        showError(result.error);
      }
    }
  };
  
  handleCallback();
}, []);
```

### Success/Cancel URLs

**Stripe Payment Success:**
```
https://app.wihy.ai/payment/success?session_id={CHECKOUT_SESSION_ID}
```

**Stripe Payment Cancel:**
```
https://app.wihy.ai/payment/cancel
```

**Handler:**
```typescript
// Success page
const PaymentSuccess: React.FC = () => {
  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      
      if (sessionId) {
        // Wait for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Refresh user data
        const profile = await authService.getUserProfile();
        
        if (profile.plan !== 'free') {
          showSuccess('Subscription activated!');
          navigate('/dashboard');
        } else {
          showWarning('Processing payment...');
        }
      }
    };
    
    verifyPayment();
  }, []);
  
  return <div>Processing your subscription...</div>;
};
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Client Action |
|------|---------|---------------|
| 200 | Success | Continue |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Fix request parameters |
| 401 | Unauthorized | Refresh token or re-login |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email exists) |
| 422 | Validation Error | Fix validation errors |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Server Error | Retry with exponential backoff |

### Error Response Format

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect",
  "details": {
    "field": "password",
    "code": "INVALID"
  }
}
```

### Client-side Error Handling

```typescript
async function handleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (error.status === 401) {
      // Token expired - refresh or logout
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        return await apiCall(); // Retry
      } else {
        await authService.logout();
        navigate('/login');
      }
    } else if (error.status === 429) {
      // Rate limited - wait and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await apiCall();
    } else {
      // Show error to user
      showError(error.message);
      throw error;
    }
  }
}
```

---

## Security & Best Practices

### Authentication Security

1. **Token Storage:**
   - Web: `localStorage` (XSS-safe if no 3rd party scripts)
   - iOS: Keychain
   - Android: EncryptedSharedPreferences

2. **Token Expiration:**
   - Access tokens: 1 hour
   - Refresh tokens: 30 days
   - Implement token refresh 5 minutes before expiry

3. **HTTPS Only:**
   - All API calls must use HTTPS
   - No sensitive data in URLs

### Payment Security

1. **Never store card details**
2. **Use Stripe/Apple/Google SDKs only**
3. **Verify all purchases server-side**
4. **Implement idempotency keys**
5. **Log all payment events**

### Webhook Security

1. **Verify signatures:**
   ```javascript
   const sig = req.headers['stripe-signature'];
   const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
   ```

2. **Implement replay protection:**
   ```javascript
   const eventId = event.id;
   const processed = await redis.get(`webhook:${eventId}`);
   if (processed) {
     return res.status(200).json({ received: true });
   }
   await redis.setex(`webhook:${eventId}`, 86400, 'processed');
   ```

3. **Return 200 quickly:**
   - Process webhooks asynchronously
   - Don't make external API calls in webhook handler

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

---

## Complete Integration Checklist

### Web Application

- [ ] Implement authService integration
- [ ] Add Stripe payment links to pricing page
- [ ] Handle payment success/cancel callbacks
- [ ] Implement subscription status checking
- [ ] Add billing portal link
- [ ] Handle OAuth callbacks
- [ ] Implement token refresh
- [ ] Add error handling

### iOS Application

- [ ] Configure StoreKit
- [ ] Add product IDs to App Store Connect
- [ ] Implement purchase flow
- [ ] Add receipt verification
- [ ] Handle restore purchases
- [ ] Implement subscription status checking
- [ ] Add OAuth integration
- [ ] Test with sandbox environment

### Android Application

- [ ] Configure Play Billing Library
- [ ] Add product IDs to Play Console
- [ ] Implement purchase flow
- [ ] Add purchase verification
- [ ] Handle subscription status
- [ ] Implement OAuth integration
- [ ] Test with test accounts

### Backend

- [ ] Implement all auth endpoints
- [ ] Set up Stripe webhook handler
- [ ] Configure Apple IAP verification
- [ ] Configure Google Play verification
- [ ] Implement GHL sync
- [ ] Add subscription management
- [ ] Set up monitoring
- [ ] Configure error logging

---

## Testing Guide

### Test Accounts

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

**Apple Sandbox:**
- Create sandbox tester in App Store Connect
- Sign out of production Apple ID
- Sign in with sandbox account when prompted

**Google Play:**
- Add test account in Play Console
- Use test account on device
- Purchases won't be charged

### Test Scenarios

1. **New User Registration:**
   - Register via email
   - Register via Google OAuth
   - Verify email sent
   - Check GHL contact created

2. **Payment Flow:**
   - Purchase subscription (Web/iOS/Android)
   - Verify webhook received
   - Check subscription activated
   - Verify GHL updated

3. **Subscription Management:**
   - Cancel subscription
   - Restore purchases (mobile)
   - Update payment method
   - Check billing history

4. **Error Cases:**
   - Invalid payment method
   - Expired token
   - Network failure
   - Duplicate email

---

## Support & Troubleshooting

### Common Issues

**"Payment succeeded but subscription not activated"**
- Check webhook logs
- Verify webhook endpoint is accessible
- Check Stripe webhook secret is correct
- Look for processing errors in logs

**"Receipt verification failed"**
- Verify shared secret (Apple) is correct
- Check service account permissions (Google)
- Ensure receipt is base64 encoded
- Use sandbox environment for testing

**"OAuth callback not working"**
- Verify redirect URI matches exactly
- Check state parameter validation
- Ensure cookies/localStorage enabled
- Check CORS configuration

### Debug Logging

```typescript
// Enable debug mode
localStorage.setItem('DEBUG', 'wihy:*');

// In authService
const log = {
  info: (msg: string, data?: any) => {
    if (localStorage.getItem('DEBUG')) {
      console.log(`[AuthService] ${msg}`, data);
    }
  }
};
```

---

## Appendix

### Environment Variables

```bash
# Auth Service
DATABASE_URL=postgresql://user:pass@localhost:5432/wihy_auth
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
FACEBOOK_APP_ID=123456789
FACEBOOK_APP_SECRET=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PREMIUM_MONTHLY=https://buy.stripe.com/xxx
STRIPE_PREMIUM_YEARLY=https://buy.stripe.com/xxx

# Apple
APPLE_SHARED_SECRET=xxx
APPLE_BUNDLE_ID=ai.wihy.app

# Google Play
GOOGLE_PLAY_PACKAGE_NAME=ai.wihy.app
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=./play-billing-key.json

# GHL
GHL_API_KEY=xxx
GHL_LOCATION_ID=xxx
```

### Product ID Mapping

```javascript
function productIdToPlan(productId) {
  const mapping = {
    // Stripe
    'price_xxx1': 'premium_monthly',
    'price_xxx2': 'premium_yearly',
    'price_xxx3': 'family_basic',
    'price_xxx4': 'family_premium',
    
    // Apple
    'com.wihy.premium.monthly': 'premium_monthly',
    'com.wihy.premium.yearly': 'premium_yearly',
    'com.wihy.family.basic': 'family_basic',
    'com.wihy.family.premium': 'family_premium',
    
    // Google
    'premium_monthly': 'premium_monthly',
    'premium_yearly': 'premium_yearly',
    'family_basic': 'family_basic',
    'family_premium': 'family_premium',
  };
  
  return mapping[productId] || 'free';
}
```

---

**Document Version:** 1.0  
**Last Updated:** January 10, 2026  
**Maintained By:** WIHY Engineering Team

---

*For questions or issues, contact: tech@wihy.ai*
