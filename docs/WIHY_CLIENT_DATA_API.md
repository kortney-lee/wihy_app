# WIHY Client Data API

Flexible key-value storage for client-side data including links, feature flags, cached values, and preferences.

**Base URL:** `https://user.wihy.ai/api/client-data`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Namespaces](#namespaces)
4. [Endpoints](#endpoints)
5. [Swift Examples](#swift-examples)
6. [Kotlin Examples](#kotlin-examples)
7. [Best Practices](#best-practices)

---

## Overview

The Client Data API provides a flexible key-value store for each user. Data is organized by **namespace** for logical grouping and supports:

- **Simple values** - Strings, numbers, booleans
- **Complex objects** - JSON objects and arrays
- **Platform-specific data** - Store different values for iOS, Android, Web
- **Expiring data** - Set expiration for cached/temporary values
- **Version tracking** - Auto-incrementing version on updates

### When to Use

| Use Case | Example |
|----------|---------|
| **App initialization** | Load all user data in one call |
| **Share links** | Referral links, profile share URLs |
| **Feature flags** | Enable beta features per user |
| **UI preferences** | Widget order, dashboard layout |
| **Sync state** | Last sync timestamp, sync tokens |
| **Cached values** | Badge counts, unread messages |
| **Session data** | Instacart URLs, temporary links, active plan data |

---

## Authentication

All endpoints require a valid JWT token:

```http
Authorization: Bearer <session_token>
```

The token is obtained from login/register on the Auth Service.

---

## Namespaces

Data is organized by namespace:

| Namespace | Purpose | Example Keys |
|-----------|---------|--------------|
| `links` | URLs, deep links, referral links | `referral_link`, `share_profile_url`, `invite_url` |
| `features` | Feature flags, A/B tests | `beta_features`, `experimental_ui`, `a_b_test_group` |
| `cache` | Cached values, sync tokens | `last_sync_token`, `notification_badge_count` |
| `preferences` | Client-side UI preferences | `home_widgets`, `dashboard_layout`, `quick_actions` |
| `social` | Social sharing settings | `connected_accounts`, `share_settings` |
| `widgets` | Widget configurations | `home_widget_order`, `dashboard_cards` |
| `session` | Active session data, temporary URLs | `instacart_url`, `active_meal_plan_id`, `checkout_cart`, `pending_actions` |

You can use any namespace name - these are just suggestions.

### Session Namespace Details

The `session` namespace is designed for **temporary, user-session-specific data** that needs to persist across app restarts but may expire or be replaced frequently.

| Key | Type | Description | Expiration |
|-----|------|-------------|------------|
| `instacart_url` | string | Active Instacart shopping list URL | 24 hours |
| `instacart_urls` | object | Map of plan_id → Instacart URL | 7 days |
| `active_meal_plan_id` | string | Currently active meal plan ID | No expiry |
| `checkout_cart` | object | Items in checkout process | 1 hour |
| `pending_actions` | array | Actions queued for sync | No expiry |
| `last_screen` | string | Last viewed screen for resume | 1 hour |

**Example Session Data:**
```json
{
  "session": {
    "instacart_url": "https://www.instacart.com/store/partner_recipe?recipeSourceUrl=...",
    "instacart_urls": {
      "plan_abc123": "https://www.instacart.com/store/partner_recipe?...",
      "plan_def456": "https://www.instacart.com/store/partner_recipe?..."
    },
    "active_meal_plan_id": "plan_abc123",
    "last_screen": "CreateMeals"
  }
}
```

---

## Endpoints

### GET `/api/client-data`

Get all client data for the authenticated user. **Use this on app startup.**

**Request:**
```http
GET /api/client-data
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `platform` | string | Optional. Filter by: `ios`, `android`, `web` |

**Response:**
```json
{
  "success": true,
  "data": {
    "links": {
      "referral_link": "https://wihy.ai/invite/abc123",
      "share_profile_url": "https://wihy.ai/u/abc123"
    },
    "features": {
      "beta_features": true,
      "experimental_ui": false
    },
    "preferences": {
      "home_widgets": ["daily_goals", "water_tracker", "meal_log"],
      "theme": "dark"
    },
    "session": {
      "instacart_url": "https://www.instacart.com/store/partner_recipe?...",
      "active_meal_plan_id": "plan_abc123"
    }
  }
}
```

---

### GET `/api/client-data/session`

Get all session data for the user. **Use this to restore user state after app restart.**

**Request:**
```http
GET /api/client-data/session
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instacart_url": "https://www.instacart.com/store/partner_recipe?...",
    "instacart_urls": {
      "plan_abc123": "https://www.instacart.com/store/partner_recipe?..."
    },
    "active_meal_plan_id": "plan_abc123",
    "last_screen": "CreateMeals"
  }
}
```

---

### PUT `/api/client-data/session`

Update session data. Commonly used after generating Instacart links or switching meal plans.

**Request:**
```http
PUT /api/client-data/session
Authorization: Bearer <token>
Content-Type: application/json

{
  "instacart_url": "https://www.instacart.com/store/partner_recipe?recipeSourceUrl=...",
  "active_meal_plan_id": "plan_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instacart_url": "https://www.instacart.com/store/partner_recipe?...",
    "active_meal_plan_id": "plan_abc123"
  },
  "meta": {
    "keysUpdated": 2
  }
}
```

---

### PUT `/api/client-data/session/instacart_url`

Save the current Instacart URL for quick re-access.

**Request:**
```http
PUT /api/client-data/session/instacart_url
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "https://www.instacart.com/store/partner_recipe?recipeSourceUrl=...",
  "expiresAt": "2026-01-26T12:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "namespace": "session",
    "key": "instacart_url",
    "value": "https://www.instacart.com/store/partner_recipe?...",
    "version": 1
  }
}
```

---

### GET `/api/client-data/links`

Get all links for the user. **Auto-generates standard links if none exist.**

**Request:**
```http
GET /api/client-data/links
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referral_link": "https://wihy.ai/invite/abc123",
    "share_profile_url": "https://wihy.ai/u/abc123",
    "invite_url": "https://wihy.ai/join?ref=abc123",
    "deep_link_prefix": "wihy://user/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### PUT `/api/client-data/links`

Update user links.

**Request:**
```http
PUT /api/client-data/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_share_url": "https://wihy.ai/share/custom-code",
  "avatar_url": "https://cdn.wihy.ai/avatars/user123.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referral_link": "https://wihy.ai/invite/abc123",
    "share_profile_url": "https://wihy.ai/u/abc123",
    "custom_share_url": "https://wihy.ai/share/custom-code",
    "avatar_url": "https://cdn.wihy.ai/avatars/user123.jpg"
  }
}
```

---

### POST `/api/client-data/links/generate`

Generate standard user links (referral, share profile, invite, deep link).

**Request:**
```http
POST /api/client-data/links/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "userCode": "custom-code"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userCode` | string | No | Custom code for links (defaults to first 8 chars of user ID) |

**Response:**
```json
{
  "success": true,
  "data": {
    "referral_link": "https://wihy.ai/invite/custom-code",
    "share_profile_url": "https://wihy.ai/u/custom-code",
    "invite_url": "https://wihy.ai/join?ref=custom-code",
    "deep_link_prefix": "wihy://user/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### GET `/api/client-data/features`

Get feature flags for the user.

**Request:**
```http
GET /api/client-data/features?platform=ios
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "beta_features": true,
    "experimental_ui": false,
    "a_b_test_group": "control"
  }
}
```

---

### PUT `/api/client-data/features`

Set feature flags for the user.

**Request:**
```http
PUT /api/client-data/features
Authorization: Bearer <token>
Content-Type: application/json

{
  "beta_features": true,
  "new_dashboard": false
}
```

---

### GET `/api/client-data/:namespace`

Get all data for a specific namespace.

**Request:**
```http
GET /api/client-data/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "home_widgets": ["daily_goals", "water_tracker"],
    "dashboard_layout": "compact",
    "theme": "dark"
  }
}
```

---

### PUT `/api/client-data/:namespace`

Set multiple keys in a namespace at once.

**Request:**
```http
PUT /api/client-data/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "home_widgets": ["daily_goals", "water_tracker", "progress_chart"],
  "dashboard_layout": "expanded",
  "theme": "light"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "home_widgets": ["daily_goals", "water_tracker", "progress_chart"],
    "dashboard_layout": "expanded",
    "theme": "light"
  },
  "meta": {
    "keysUpdated": 3
  }
}
```

---

### GET `/api/client-data/:namespace/:key`

Get a specific key value.

**Request:**
```http
GET /api/client-data/links/referral_link
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referral_link": "https://wihy.ai/invite/abc123"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Key not found"
}
```

---

### PUT `/api/client-data/:namespace/:key`

Set a specific key value.

**Request:**
```http
PUT /api/client-data/cache/last_sync_token
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "sync_token_12345",
  "expiresAt": "2026-01-26T00:00:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | any | Yes | The value to store (string, number, boolean, or object) |
| `platform` | string | No | Platform-specific: `ios`, `android`, `web` |
| `expiresAt` | string | No | ISO date when this data expires |

**Response:**
```json
{
  "success": true,
  "data": {
    "namespace": "cache",
    "key": "last_sync_token",
    "value": "sync_token_12345",
    "version": 1
  }
}
```

---

### DELETE `/api/client-data/:namespace/:key`

Delete a specific key.

**Request:**
```http
DELETE /api/client-data/cache/last_sync_token
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Key deleted"
}
```

---

### DELETE `/api/client-data/:namespace`

Delete all keys in a namespace.

**Request:**
```http
DELETE /api/client-data/cache
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 5 keys from cache"
}
```

---

## React Native / TypeScript Examples

### clientDataService.ts

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const BASE_URL = 'https://user.wihy.ai/api/client-data';

class ClientDataService {
  private static instance: ClientDataService;
  
  static getInstance(): ClientDataService {
    if (!ClientDataService.instance) {
      ClientDataService.instance = new ClientDataService();
    }
    return ClientDataService.instance;
  }

  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('session_token');
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Load all data on app startup
  async loadAllData(): Promise<Record<string, Record<string, any>>> {
    const headers = await this.getHeaders();
    const response = await fetch(BASE_URL, { headers });
    const json = await response.json();
    return json.data || {};
  }

  // Get namespace
  async getNamespace(namespace: string): Promise<Record<string, any>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${BASE_URL}/${namespace}`, { headers });
    const json = await response.json();
    return json.data || {};
  }

  // Get single value
  async getValue(namespace: string, key: string): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${BASE_URL}/${namespace}/${key}`, { headers });
    
    if (response.status === 404) {
      return null;
    }
    
    const json = await response.json();
    return json.data?.[key];
  }

  // Set single value
  async setValue(
    namespace: string, 
    key: string, 
    value: any, 
    expiresAt?: Date
  ): Promise<void> {
    const headers = await this.getHeaders();
    const body: any = { value };
    
    if (expiresAt) {
      body.expiresAt = expiresAt.toISOString();
    }
    
    await fetch(`${BASE_URL}/${namespace}/${key}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
  }

  // Set multiple values
  async setValues(namespace: string, values: Record<string, any>): Promise<void> {
    const headers = await this.getHeaders();
    await fetch(`${BASE_URL}/${namespace}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(values),
    });
  }

  // Get links
  async getLinks(): Promise<Record<string, string>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${BASE_URL}/links`, { headers });
    const json = await response.json();
    return json.data || {};
  }

  // Delete key
  async deleteValue(namespace: string, key: string): Promise<void> {
    const headers = await this.getHeaders();
    await fetch(`${BASE_URL}/${namespace}/${key}`, {
      method: 'DELETE',
      headers,
    });
  }

  // ============================================================================
  // SESSION-SPECIFIC HELPERS
  // ============================================================================

  // Get session data
  async getSession(): Promise<Record<string, any>> {
    return this.getNamespace('session');
  }

  // Save Instacart URL to session
  async saveInstacartUrl(url: string, planId?: string): Promise<void> {
    const session = await this.getSession();
    const instacartUrls = session.instacart_urls || {};
    
    // Always save as current URL
    await this.setValue('session', 'instacart_url', url, 
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour expiry
    );
    
    // Also save by plan ID if provided
    if (planId) {
      instacartUrls[planId] = url;
      await this.setValue('session', 'instacart_urls', instacartUrls,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 day expiry
      );
    }
  }

  // Get Instacart URL (current or by plan ID)
  async getInstacartUrl(planId?: string): Promise<string | null> {
    if (planId) {
      const urls = await this.getValue('session', 'instacart_urls');
      return urls?.[planId] || null;
    }
    return this.getValue('session', 'instacart_url');
  }

  // Set active meal plan
  async setActiveMealPlan(planId: string): Promise<void> {
    await this.setValue('session', 'active_meal_plan_id', planId);
  }

  // Get active meal plan
  async getActiveMealPlan(): Promise<string | null> {
    return this.getValue('session', 'active_meal_plan_id');
  }
}

export const clientDataService = ClientDataService.getInstance();
```

### Usage Examples

```typescript
import { clientDataService } from '../services/clientDataService';

// On app startup - load all data
useEffect(() => {
  const loadUserData = async () => {
    const allData = await clientDataService.loadAllData();
    
    // Restore session state
    if (allData.session?.instacart_url) {
      setInstacartUrl(allData.session.instacart_url);
    }
    
    if (allData.session?.active_meal_plan_id) {
      setActivePlanId(allData.session.active_meal_plan_id);
    }
    
    // Load preferences
    if (allData.preferences?.theme) {
      setTheme(allData.preferences.theme);
    }
  };
  
  loadUserData();
}, []);

// Save Instacart URL after generation
const handleInstacartSuccess = async (url: string, planId: string) => {
  // Save to session (replaces AsyncStorage)
  await clientDataService.saveInstacartUrl(url, planId);
  setInstacartUrl(url);
};

// Get Instacart URL for a specific plan
const openSavedInstacartList = async (planId: string) => {
  const url = await clientDataService.getInstacartUrl(planId);
  if (url) {
    await Linking.openURL(url);
  } else {
    Alert.alert('No saved list', 'Generate a new Instacart list for this plan.');
  }
};

// Save user preference
const handleThemeChange = async (theme: 'light' | 'dark') => {
  await clientDataService.setValue('preferences', 'theme', theme);
  setTheme(theme);
};
```

---

## Swift Examples

### ClientDataService.swift

```swift
import Foundation

class ClientDataService {
    static let shared = ClientDataService()
    private let baseURL = "https://user.wihy.ai/api/client-data"
    
    private var token: String? {
        AuthManager.shared.sessionToken
    }
    
    // MARK: - Load All Data (App Startup)
    
    func loadAllData() async throws -> [String: [String: Any]] {
        let url = URL(string: baseURL)!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ClientDataResponse.self, from: data)
        return response.data
    }
    
    // MARK: - Get Namespace
    
    func getNamespace(_ namespace: String) async throws -> [String: Any] {
        let url = URL(string: "\(baseURL)/\(namespace)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        return response["data"] as? [String: Any] ?? [:]
    }
    
    // MARK: - Get Single Value
    
    func getValue(namespace: String, key: String) async throws -> Any? {
        let url = URL(string: "\(baseURL)/\(namespace)/\(key)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if (response as? HTTPURLResponse)?.statusCode == 404 {
            return nil
        }
        
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let dataDict = json["data"] as? [String: Any]
        return dataDict?[key]
    }
    
    // MARK: - Set Single Value
    
    func setValue(namespace: String, key: String, value: Any, expiresAt: Date? = nil) async throws {
        let url = URL(string: "\(baseURL)/\(namespace)/\(key)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        var body: [String: Any] = ["value": value]
        if let expiresAt = expiresAt {
            body["expiresAt"] = ISO8601DateFormatter().string(from: expiresAt)
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let _ = try await URLSession.shared.data(for: request)
    }
    
    // MARK: - Set Multiple Values
    
    func setValues(namespace: String, values: [String: Any]) async throws {
        let url = URL(string: "\(baseURL)/\(namespace)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: values)
        
        let _ = try await URLSession.shared.data(for: request)
    }
    
    // MARK: - Get Links
    
    func getLinks() async throws -> [String: String] {
        let url = URL(string: "\(baseURL)/links")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        return response["data"] as? [String: String] ?? [:]
    }
    
    // MARK: - Delete Key
    
    func deleteValue(namespace: String, key: String) async throws {
        let url = URL(string: "\(baseURL)/\(namespace)/\(key)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        
        let _ = try await URLSession.shared.data(for: request)
    }
    
    // MARK: - Session Helpers
    
    func getSession() async throws -> [String: Any] {
        return try await getNamespace("session")
    }
    
    func saveInstacartUrl(_ url: String, planId: String? = nil) async throws {
        // Save current URL with 24h expiry
        try await setValue(
            namespace: "session",
            key: "instacart_url",
            value: url,
            expiresAt: Calendar.current.date(byAdding: .day, value: 1, to: Date())
        )
        
        // Also save by plan ID if provided
        if let planId = planId {
            var urls = try await getValue(namespace: "session", key: "instacart_urls") as? [String: String] ?? [:]
            urls[planId] = url
            try await setValue(
                namespace: "session",
                key: "instacart_urls",
                value: urls,
                expiresAt: Calendar.current.date(byAdding: .day, value: 7, to: Date())
            )
        }
    }
    
    func getInstacartUrl(planId: String? = nil) async throws -> String? {
        if let planId = planId {
            let urls = try await getValue(namespace: "session", key: "instacart_urls") as? [String: String]
            return urls?[planId]
        }
        return try await getValue(namespace: "session", key: "instacart_url") as? String
    }
}

// MARK: - Response Models

struct ClientDataResponse: Codable {
    let success: Bool
    let data: [String: [String: AnyCodable]]
}

// Use AnyCodable from a library or implement your own wrapper
```

### Usage Examples

```swift
// On app startup - load all data
Task {
    let allData = try await ClientDataService.shared.loadAllData()
    
    // Restore session
    if let session = allData["session"] {
        if let instacartUrl = session["instacart_url"] as? String {
            self.instacartUrl = instacartUrl
        }
    }
    
    // Cache locally
    if let preferences = allData["preferences"] {
        UserDefaults.standard.set(preferences["theme"], forKey: "theme")
    }
    
    if let links = allData["links"] {
        self.referralLink = links["referral_link"] as? String
    }
}

// Save Instacart URL after generation
Task {
    try await ClientDataService.shared.saveInstacartUrl(
        productsLinkUrl,
        planId: mealPlanId
    )
}

// Get Instacart URL for specific plan
Task {
    if let url = try await ClientDataService.shared.getInstacartUrl(planId: planId) {
        UIApplication.shared.open(URL(string: url)!)
    }
}

// Save user preference
Task {
    try await ClientDataService.shared.setValue(
        namespace: "preferences",
        key: "theme",
        value: "dark"
    )
}

// Save multiple preferences at once
Task {
    try await ClientDataService.shared.setValues(
        namespace: "preferences",
        values: [
            "home_widgets": ["daily_goals", "water_tracker"],
            "dashboard_layout": "compact"
        ]
    )
}

// Get referral link for sharing
Task {
    let links = try await ClientDataService.shared.getLinks()
    if let referralLink = links["referral_link"] {
        // Show share sheet
        shareURL(URL(string: referralLink)!)
    }
}
```

---

## Kotlin Examples

### ClientDataService.kt

```kotlin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class ClientDataService private constructor() {
    
    companion object {
        val instance: ClientDataService by lazy { ClientDataService() }
        private const val BASE_URL = "https://user.wihy.ai/api/client-data"
    }
    
    private val client = OkHttpClient()
    private val JSON = "application/json; charset=utf-8".toMediaType()
    
    private val token: String?
        get() = AuthManager.instance.sessionToken
    
    // Load all data on app startup
    suspend fun loadAllData(): Map<String, Map<String, Any>> = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(BASE_URL)
            .header("Authorization", "Bearer ${token ?: ""}")
            .get()
            .build()
        
        val response = client.newCall(request).execute()
        val json = JSONObject(response.body?.string() ?: "{}")
        val data = json.getJSONObject("data")
        
        // Parse and return
        parseNestedMap(data)
    }
    
    // Get namespace
    suspend fun getNamespace(namespace: String): Map<String, Any> = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$BASE_URL/$namespace")
            .header("Authorization", "Bearer ${token ?: ""}")
            .get()
            .build()
        
        val response = client.newCall(request).execute()
        val json = JSONObject(response.body?.string() ?: "{}")
        parseMap(json.getJSONObject("data"))
    }
    
    // Set single value
    suspend fun setValue(namespace: String, key: String, value: Any, expiresAt: String? = null) = 
        withContext(Dispatchers.IO) {
            val body = JSONObject().apply {
                put("value", value)
                expiresAt?.let { put("expiresAt", it) }
            }
            
            val request = Request.Builder()
                .url("$BASE_URL/$namespace/$key")
                .header("Authorization", "Bearer ${token ?: ""}")
                .put(body.toString().toRequestBody(JSON))
                .build()
            
            client.newCall(request).execute()
        }
    
    // Set multiple values
    suspend fun setValues(namespace: String, values: Map<String, Any>) = withContext(Dispatchers.IO) {
        val body = JSONObject(values)
        
        val request = Request.Builder()
            .url("$BASE_URL/$namespace")
            .header("Authorization", "Bearer ${token ?: ""}")
            .put(body.toString().toRequestBody(JSON))
            .build()
        
        client.newCall(request).execute()
    }
    
    // Get links
    suspend fun getLinks(): Map<String, String> = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$BASE_URL/links")
            .header("Authorization", "Bearer ${token ?: ""}")
            .get()
            .build()
        
        val response = client.newCall(request).execute()
        val json = JSONObject(response.body?.string() ?: "{}")
        val data = json.getJSONObject("data")
        
        data.keys().asSequence().associateWith { data.getString(it) }
    }
    
    // Delete key
    suspend fun deleteValue(namespace: String, key: String) = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$BASE_URL/$namespace/$key")
            .header("Authorization", "Bearer ${token ?: ""}")
            .delete()
            .build()
        
        client.newCall(request).execute()
    }
    
    // Session helpers
    suspend fun getSession(): Map<String, Any> = getNamespace("session")
    
    suspend fun saveInstacartUrl(url: String, planId: String? = null) {
        // Save current URL
        setValue("session", "instacart_url", url)
        
        // Also save by plan ID
        planId?.let { id ->
            val urls = (getNamespace("session")["instacart_urls"] as? Map<String, String>)?.toMutableMap() ?: mutableMapOf()
            urls[id] = url
            setValue("session", "instacart_urls", urls)
        }
    }
    
    suspend fun getInstacartUrl(planId: String? = null): String? {
        return if (planId != null) {
            val urls = getNamespace("session")["instacart_urls"] as? Map<String, String>
            urls?.get(planId)
        } else {
            getNamespace("session")["instacart_url"] as? String
        }
    }
    
    private fun parseMap(json: JSONObject): Map<String, Any> {
        return json.keys().asSequence().associateWith { json.get(it) }
    }
    
    private fun parseNestedMap(json: JSONObject): Map<String, Map<String, Any>> {
        return json.keys().asSequence().associateWith { 
            parseMap(json.getJSONObject(it)) 
        }
    }
}
```

### Usage Examples

```kotlin
// On app startup
lifecycleScope.launch {
    val allData = ClientDataService.instance.loadAllData()
    
    // Restore session
    allData["session"]?.let { session ->
        instacartUrl = session["instacart_url"] as? String
    }
    
    // Cache locally
    allData["preferences"]?.let { prefs ->
        sharedPrefs.edit()
            .putString("theme", prefs["theme"] as? String)
            .apply()
    }
    
    allData["links"]?.let { links ->
        referralLink = links["referral_link"] as? String
    }
}

// Save Instacart URL
lifecycleScope.launch {
    ClientDataService.instance.saveInstacartUrl(
        url = productsLinkUrl,
        planId = mealPlanId
    )
}

// Get Instacart URL for plan
lifecycleScope.launch {
    ClientDataService.instance.getInstacartUrl(planId)?.let { url ->
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        startActivity(intent)
    }
}

// Save user preference
lifecycleScope.launch {
    ClientDataService.instance.setValue(
        namespace = "preferences",
        key = "theme",
        value = "dark"
    )
}

// Share referral link
lifecycleScope.launch {
    val links = ClientDataService.instance.getLinks()
    links["referral_link"]?.let { link ->
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "Join WIHY! $link")
        }
        startActivity(Intent.createChooser(shareIntent, "Share via"))
    }
}
```

---

## Best Practices

### 1. Load All Data on Startup

Call `GET /api/client-data` once during app initialization, then cache locally:

```typescript
// App init
const data = await clientDataService.loadAllData();
LocalCache.clientData = data;
```

### 2. Use Namespaces Consistently

| Do | Don't |
|-------|---------|
| `preferences/theme` | `theme` (no namespace) |
| `cache/sync_token` | `syncToken` (inconsistent naming) |
| `session/instacart_url` | `instacart_url` (missing namespace) |
| `features/beta_enabled` | `FEATURES/betaEnabled` (case mixing) |

### 3. Set Expiration for Cached/Session Data

```typescript
await clientDataService.setValue(
  'session',
  'instacart_url',
  url,
  new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour expiry
);
```

### 4. Batch Updates

Instead of multiple calls:
```typescript
// Don't do this
await setValue('preferences', 'theme', 'dark');
await setValue('preferences', 'layout', 'compact');
await setValue('preferences', 'widgets', [...]);
```

Do a single batch call:
```typescript
// Do this
await setValues('preferences', {
  theme: 'dark',
  layout: 'compact',
  widgets: [...]
});
```

### 5. Handle 404 Gracefully

Keys that don't exist return 404. Handle with defaults:

```typescript
const theme = await clientDataService.getValue('preferences', 'theme') ?? 'light';
```

### 6. Use Session for Temporary Data

Store ephemeral data that needs to persist across app restarts but isn't permanent:

```typescript
// Good for session namespace
await clientDataService.saveInstacartUrl(url, planId);  // Temporary link
await clientDataService.setValue('session', 'checkout_cart', cartItems);  // In-progress checkout
await clientDataService.setValue('session', 'last_screen', 'CreateMeals');  // Resume state

// Not for session - use preferences instead
await clientDataService.setValue('preferences', 'theme', 'dark');  // Permanent setting
```

---

## Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Value is required` | Missing `value` field in PUT body |
| 400 | `Request body must be an object` | Invalid JSON body |
| 401 | `Unauthorized` | Missing or invalid token |
| 404 | `Key not found` | Requested key doesn't exist |
| 500 | `Failed to fetch client data` | Server error |

---

## Migration from AsyncStorage

If you're currently using AsyncStorage for client data, here's how to migrate:

### Before (AsyncStorage)
```typescript
// Saving
await AsyncStorage.setItem('instacart_url', url);
await AsyncStorage.setItem(`instacart_url_${planId}`, url);

// Loading
const url = await AsyncStorage.getItem('instacart_url');
```

### After (Client Data API)
```typescript
// Saving
await clientDataService.saveInstacartUrl(url, planId);

// Loading
const url = await clientDataService.getInstacartUrl(planId);
```

### Benefits of Migration
- **Cross-device sync** - Data follows user across devices
- **Server backup** - No data loss on app reinstall
- **Expiration support** - Automatic cleanup of stale data
- **Centralized management** - All client data in one API
