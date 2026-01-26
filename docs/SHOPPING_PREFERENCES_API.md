# Shopping Preferences API

**Base URL**: `https://user.wihy.ai`  
**Version**: 1.0  
**Last Updated**: January 25, 2026

## Overview

The Shopping Preferences API allows users to save and manage their grocery shopping preferences, including preferred stores, budget settings, organic preferences, brand choices, and delivery options. These preferences are used to personalize meal planning and shopping list generation.

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Shopping Preferences

Retrieve a user's shopping preferences. Returns default values if no preferences have been saved.

**Endpoint**: `GET /api/users/shopping-preferences/:userId`

**Request**:
```http
GET /api/users/shopping-preferences/ef803597-c6cf-4a83-b8ac-4e0ff6a150e4
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "preferences": {
    "user_id": "ef803597-c6cf-4a83-b8ac-4e0ff6a150e4",
    "preferred_stores": ["costco", "trader_joes", "whole_foods"],
    "budget_preference": "moderate",
    "organic_preference": "when_possible",
    "brand_preferences": {
      "chicken": "organic_valley",
      "milk": "horizon_organic",
      "bread": "daves_killer_bread"
    },
    "default_postal_code": "90210",
    "delivery_preference": "asap",
    "updated_at": "2026-01-25T10:30:00.000Z"
  }
}
```

**Default Response** (if no preferences exist):
```json
{
  "success": true,
  "preferences": {
    "user_id": "ef803597-c6cf-4a83-b8ac-4e0ff6a150e4",
    "preferred_stores": [],
    "budget_preference": "moderate",
    "organic_preference": "when_possible",
    "brand_preferences": {},
    "default_postal_code": null,
    "delivery_preference": "asap"
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User attempting to access another user's preferences
- `500 Internal Server Error` - Server error

---

### 2. Save Shopping Preferences

Create or update shopping preferences for a user. All fields are optional except `userId`.

**Endpoint**: `POST /api/users/shopping-preferences`

**Request**:
```http
POST /api/users/shopping-preferences
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userId": "ef803597-c6cf-4a83-b8ac-4e0ff6a150e4",
  "preferred_stores": ["costco", "trader_joes"],
  "budget_preference": "moderate",
  "organic_preference": "when_possible",
  "brand_preferences": {
    "chicken": "organic_valley",
    "milk": "horizon_organic"
  },
  "default_postal_code": "90210",
  "delivery_preference": "scheduled"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Shopping preferences saved successfully",
  "preferences": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "ef803597-c6cf-4a83-b8ac-4e0ff6a150e4",
    "preferred_stores": ["costco", "trader_joes"],
    "budget_preference": "moderate",
    "organic_preference": "when_possible",
    "brand_preferences": {
      "chicken": "organic_valley",
      "milk": "horizon_organic"
    },
    "default_postal_code": "90210",
    "delivery_preference": "scheduled",
    "created_at": "2026-01-25T10:30:00.000Z",
    "updated_at": "2026-01-25T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing userId or invalid field values
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User attempting to modify another user's preferences
- `500 Internal Server Error` - Server error

---

### 3. Delete Shopping Preferences

Delete all shopping preferences for a user. User will revert to default preferences.

**Endpoint**: `DELETE /api/users/shopping-preferences/:userId`

**Request**:
```http
DELETE /api/users/shopping-preferences/ef803597-c6cf-4a83-b8ac-4e0ff6a150e4
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Shopping preferences deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User attempting to delete another user's preferences
- `404 Not Found` - No preferences exist for this user
- `500 Internal Server Error` - Server error

---

## Field Definitions

### preferred_stores
- **Type**: Array of strings
- **Description**: List of user's preferred grocery stores
- **Common Values**: `costco`, `trader_joes`, `whole_foods`, `safeway`, `kroger`, `walmart`, `target`, `aldi`, `sprouts`
- **Example**: `["costco", "trader_joes", "whole_foods"]`

### budget_preference
- **Type**: String (enum)
- **Allowed Values**: `budget`, `moderate`, `premium`
- **Default**: `moderate`
- **Description**: User's budget preference for groceries
  - `budget` - Focus on lowest prices, generic brands
  - `moderate` - Balance of quality and price
  - `premium` - Premium brands, organic options prioritized

### organic_preference
- **Type**: String (enum)
- **Allowed Values**: `always`, `when_possible`, `never`
- **Default**: `when_possible`
- **Description**: User's organic food preference
  - `always` - Only organic options
  - `when_possible` - Organic when available/affordable
  - `never` - No preference for organic

### brand_preferences
- **Type**: JSON object
- **Description**: User's preferred brands by product category
- **Example**:
```json
{
  "chicken": "organic_valley",
  "milk": "horizon_organic",
  "bread": "daves_killer_bread",
  "yogurt": "chobani",
  "eggs": "vital_farms"
}
```

### default_postal_code
- **Type**: String (max 10 characters)
- **Description**: User's default postal/zip code for delivery and store selection
- **Example**: `"90210"`, `"M5H 2N2"` (Canadian postal code)

### delivery_preference
- **Type**: String (enum)
- **Allowed Values**: `asap`, `scheduled`, `pickup`
- **Default**: `asap`
- **Description**: User's preferred delivery method
  - `asap` - Fastest delivery available
  - `scheduled` - Schedule delivery for specific time
  - `pickup` - In-store or curbside pickup

---

## Implementation Examples

### JavaScript/TypeScript

```typescript
// Get shopping preferences
async function getShoppingPreferences(userId: string, token: string) {
  const response = await fetch(
    `https://user.wihy.ai/api/users/shopping-preferences/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.preferences;
}

// Save shopping preferences
async function saveShoppingPreferences(
  userId: string,
  preferences: ShoppingPreferences,
  token: string
) {
  const response = await fetch(
    'https://user.wihy.ai/api/users/shopping-preferences',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        ...preferences
      })
    }
  );
  
  const data = await response.json();
  return data.preferences;
}
```

### Swift (iOS)

```swift
struct ShoppingPreferences: Codable {
    let userId: String
    let preferredStores: [String]
    let budgetPreference: String
    let organicPreference: String
    let brandPreferences: [String: String]
    let defaultPostalCode: String?
    let deliveryPreference: String
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case preferredStores = "preferred_stores"
        case budgetPreference = "budget_preference"
        case organicPreference = "organic_preference"
        case brandPreferences = "brand_preferences"
        case defaultPostalCode = "default_postal_code"
        case deliveryPreference = "delivery_preference"
    }
}

func getShoppingPreferences(userId: String, token: String) async throws -> ShoppingPreferences {
    let url = URL(string: "https://user.wihy.ai/api/users/shopping-preferences/\(userId)")!
    
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(PreferencesResponse.self, from: data)
    
    return response.preferences
}

func saveShoppingPreferences(preferences: ShoppingPreferences, token: String) async throws {
    let url = URL(string: "https://user.wihy.ai/api/users/shopping-preferences")!
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(preferences)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(PreferencesResponse.self, from: data)
}
```

### Kotlin (Android)

```kotlin
data class ShoppingPreferences(
    @SerializedName("user_id") val userId: String,
    @SerializedName("preferred_stores") val preferredStores: List<String>,
    @SerializedName("budget_preference") val budgetPreference: String,
    @SerializedName("organic_preference") val organicPreference: String,
    @SerializedName("brand_preferences") val brandPreferences: Map<String, String>,
    @SerializedName("default_postal_code") val defaultPostalCode: String?,
    @SerializedName("delivery_preference") val deliveryPreference: String
)

suspend fun getShoppingPreferences(userId: String, token: String): ShoppingPreferences {
    val response = client.get("https://user.wihy.ai/api/users/shopping-preferences/$userId") {
        header("Authorization", "Bearer $token")
    }
    return response.body<PreferencesResponse>().preferences
}

suspend fun saveShoppingPreferences(preferences: ShoppingPreferences, token: String) {
    client.post("https://user.wihy.ai/api/users/shopping-preferences") {
        header("Authorization", "Bearer $token")
        header("Content-Type", "application/json")
        setBody(preferences)
    }
}
```

### React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const shoppingPreferencesService = {
  async get(userId) {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(
      `https://user.wihy.ai/api/users/shopping-preferences/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch shopping preferences');
    }
    
    const data = await response.json();
    return data.preferences;
  },
  
  async save(userId, preferences) {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(
      'https://user.wihy.ai/api/users/shopping-preferences',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          ...preferences
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to save shopping preferences');
    }
    
    const data = await response.json();
    return data.preferences;
  },
  
  async delete(userId) {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(
      `https://user.wihy.ai/api/users/shopping-preferences/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to delete shopping preferences');
    }
    
    const data = await response.json();
    return data;
  }
};
```

---

## Testing

### Test Credentials

For development/testing, use:
- **Test User ID**: `ef803597-c6cf-4a83-b8ac-4e0ff6a150e4`
- **Email**: `test.free@wihy.ai`
- **Generate Token**: Use the auth service to login and get a JWT token

### cURL Examples

**Get preferences**:
```bash
curl -X GET "https://user.wihy.ai/api/users/shopping-preferences/ef803597-c6cf-4a83-b8ac-4e0ff6a150e4" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Save preferences**:
```bash
curl -X POST "https://user.wihy.ai/api/users/shopping-preferences" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "ef803597-c6cf-4a83-b8ac-4e0ff6a150e4",
    "preferred_stores": ["costco", "trader_joes"],
    "budget_preference": "moderate",
    "organic_preference": "when_possible",
    "brand_preferences": {
      "chicken": "organic_valley"
    },
    "default_postal_code": "90210",
    "delivery_preference": "asap"
  }'
```

**Delete preferences**:
```bash
curl -X DELETE "https://user.wihy.ai/api/users/shopping-preferences/ef803597-c6cf-4a83-b8ac-4e0ff6a150e4" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Errors

**400 Bad Request**:
```json
{
  "success": false,
  "error": "userId is required"
}
```
```json
{
  "success": false,
  "error": "Invalid budget_preference. Must be one of: budget, moderate, premium"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "error": "Unauthorized access to user preferences"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Shopping preferences not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Best Practices

1. **Cache preferences** - These don't change frequently, cache for 5-10 minutes
2. **Validate before saving** - Check enum values client-side before API calls
3. **Handle defaults gracefully** - Empty arrays and null values are valid
4. **Update incrementally** - Only send changed fields to minimize payload
5. **Store selection** - Use `preferred_stores` to filter/sort store options in UI
6. **Brand matching** - Use `brand_preferences` keys to match product categories
7. **Postal code validation** - Validate format before saving (US: 5 or 9 digits, CA: A1A 1A1)

---

## Changelog

### Version 1.0 (January 25, 2026)
- Initial release
- GET, POST, DELETE endpoints
- Support for stores, budget, organic, brands, postal code, delivery preferences

---

## Support

For questions or issues:
- **GitHub Issues**: [wihy_auth repository](https://github.com/kortney-lee/wihy_auth)
- **Documentation**: See `/docs` folder in repository
- **Related APIs**: 
  - [Meal Logging API](MEAL_LOGGING_API.md)
  - [User Profile API](USER_PROFILE_API.md)
