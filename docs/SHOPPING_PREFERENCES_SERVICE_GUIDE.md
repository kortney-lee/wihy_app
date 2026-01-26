# Shopping Preferences Service - Usage Guide

## Overview

The Shopping Preferences Service provides a complete client-side implementation for managing user shopping preferences in the WIHY app. It connects to `user.wihy.ai` and handles caching, offline support, and all CRUD operations.

## Quick Start

### Import the Service

```typescript
import { 
  shoppingPreferencesService,
  type ShoppingPreferences,
  type BudgetPreference,
  type OrganicPreference,
  type DeliveryPreference 
} from '@/services';
```

### Basic Usage

#### Get User's Shopping Preferences

```typescript
// Get preferences with cache (recommended)
const preferences = await shoppingPreferencesService.getPreferences(userId);

// Force refresh from server
const freshPreferences = await shoppingPreferencesService.getPreferences(userId, true);

console.log('Preferred stores:', preferences.preferred_stores);
console.log('Budget preference:', preferences.budget_preference);
console.log('Organic preference:', preferences.organic_preference);
```

**Returns default preferences if none exist:**
```typescript
{
  user_id: "ef803597-c6cf-4a83-b8ac-4e0ff6a150e4",
  preferred_stores: [],
  budget_preference: "moderate",
  organic_preference: "when_possible",
  brand_preferences: {},
  default_postal_code: null,
  delivery_preference: "asap"
}
```

#### Save Complete Preferences

```typescript
const newPreferences = await shoppingPreferencesService.savePreferences({
  userId: 'ef803597-c6cf-4a83-b8ac-4e0ff6a150e4',
  preferred_stores: ['costco', 'trader_joes', 'whole_foods'],
  budget_preference: 'moderate',
  organic_preference: 'when_possible',
  brand_preferences: {
    chicken: 'organic_valley',
    milk: 'horizon_organic',
    bread: 'daves_killer_bread',
  },
  default_postal_code: '90210',
  delivery_preference: 'scheduled',
});
```

#### Update Specific Fields

```typescript
// Update only budget and organic preferences
const updated = await shoppingPreferencesService.updatePreferences(userId, {
  budget_preference: 'premium',
  organic_preference: 'always',
});

// Add a brand preference
const withBrand = await shoppingPreferencesService.updatePreferences(userId, {
  brand_preferences: {
    yogurt: 'chobani',
    eggs: 'vital_farms',
  },
});
```

#### Delete All Preferences

```typescript
// User will revert to defaults
await shoppingPreferencesService.deletePreferences(userId);
```

## Convenience Methods

### Store Management

```typescript
// Add a preferred store
await shoppingPreferencesService.addPreferredStore(userId, 'whole_foods');

// Remove a preferred store
await shoppingPreferencesService.removePreferredStore(userId, 'walmart');
```

### Brand Preferences

```typescript
// Set brand preference for a category
await shoppingPreferencesService.setBrandPreference(userId, 'chicken', 'organic_valley');

// Remove brand preference
await shoppingPreferencesService.removeBrandPreference(userId, 'bread');
```

### Validation

```typescript
// Validate before saving (throws error if invalid)
try {
  shoppingPreferencesService.validatePreferences({
    budget_preference: 'premium',
    organic_preference: 'always',
    default_postal_code: '90210',
  });
  
  // All valid, proceed with save
  await shoppingPreferencesService.savePreferences({ userId, ...preferences });
} catch (error) {
  console.error('Invalid preferences:', error.message);
}
```

## Type Definitions

### Budget Preferences

```typescript
type BudgetPreference = 'budget' | 'moderate' | 'premium';

// budget: Focus on lowest prices, generic brands
// moderate: Balance of quality and price (default)
// premium: Premium brands, organic options prioritized
```

### Organic Preferences

```typescript
type OrganicPreference = 'always' | 'when_possible' | 'never';

// always: Only organic options
// when_possible: Organic when available/affordable (default)
// never: No preference for organic
```

### Delivery Preferences

```typescript
type DeliveryPreference = 'asap' | 'scheduled' | 'pickup';

// asap: Fastest delivery available (default)
// scheduled: Schedule delivery for specific time
// pickup: In-store or curbside pickup
```

### Common Store Identifiers

```typescript
type PreferredStore = 
  | 'costco'
  | 'trader_joes'
  | 'whole_foods'
  | 'safeway'
  | 'kroger'
  | 'walmart'
  | 'target'
  | 'aldi'
  | 'sprouts'
  | string; // Custom stores allowed
```

## React Native Component Example

### Preferences Settings Screen

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { shoppingPreferencesService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';

export function ShoppingPreferencesScreen() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await shoppingPreferencesService.getPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (value: BudgetPreference) => {
    try {
      const updated = await shoppingPreferencesService.updatePreferences(user.id, {
        budget_preference: value,
      });
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  const toggleStore = async (store: string) => {
    try {
      const isSelected = preferences.preferred_stores.includes(store);
      const updated = isSelected
        ? await shoppingPreferencesService.removePreferredStore(user.id, store)
        : await shoppingPreferencesService.addPreferredStore(user.id, store);
      
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to toggle store:', error);
    }
  };

  if (loading) {
    return <Text>Loading preferences...</Text>;
  }

  return (
    <ScrollView>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Shopping Preferences
        </Text>

        {/* Budget Selection */}
        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 20 }}>
          Budget Preference
        </Text>
        {['budget', 'moderate', 'premium'].map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => updateBudget(level as BudgetPreference)}
            style={{
              padding: 15,
              backgroundColor: preferences.budget_preference === level ? '#007AFF' : '#F0F0F0',
              borderRadius: 10,
              marginTop: 10,
            }}
          >
            <Text style={{
              color: preferences.budget_preference === level ? 'white' : 'black',
              fontWeight: '600',
            }}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Preferred Stores */}
        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 30 }}>
          Preferred Stores
        </Text>
        {['costco', 'trader_joes', 'whole_foods', 'safeway'].map((store) => (
          <View
            key={store}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 15,
              backgroundColor: '#F0F0F0',
              borderRadius: 10,
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 16 }}>
              {store.split('_').join(' ').toUpperCase()}
            </Text>
            <Switch
              value={preferences.preferred_stores.includes(store)}
              onValueChange={() => toggleStore(store)}
            />
          </View>
        ))}

        {/* Organic Preference */}
        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 30 }}>
          Organic Preference
        </Text>
        <Text style={{ color: '#666', marginTop: 5 }}>
          Current: {preferences.organic_preference}
        </Text>
      </View>
    </ScrollView>
  );
}
```

### Shopping List Integration

```tsx
import { shoppingPreferencesService } from '@/services';

export async function generateShoppingList(userId: string, mealPlanId: string) {
  // Get user's shopping preferences
  const preferences = await shoppingPreferencesService.getPreferences(userId);

  // Use preferences to customize shopping list
  const shoppingList = await generateListWithPreferences({
    mealPlanId,
    preferredStores: preferences.preferred_stores,
    budgetLevel: preferences.budget_preference,
    organicPreference: preferences.organic_preference,
    brandPreferences: preferences.brand_preferences,
    postalCode: preferences.default_postal_code,
  });

  return shoppingList;
}
```

## Caching & Performance

### Automatic Caching

The service automatically caches preferences for 10 minutes:

```typescript
// First call - fetches from API
const prefs1 = await shoppingPreferencesService.getPreferences(userId);

// Within 10 minutes - returns from cache
const prefs2 = await shoppingPreferencesService.getPreferences(userId);

// Force refresh
const prefs3 = await shoppingPreferencesService.getPreferences(userId, true);
```

### Cache Clearing

```typescript
// Clear all cached preferences (memory + AsyncStorage)
await shoppingPreferencesService.clearCache();
```

## Offline Support

The service handles offline scenarios gracefully:

```typescript
try {
  const preferences = await shoppingPreferencesService.getPreferences(userId);
  // Returns cached data if offline
  // Returns fresh data if online
} catch (error) {
  // Only throws if offline AND no cache exists
  console.error('Unable to load preferences:', error);
}
```

## Error Handling

### Common Error Scenarios

```typescript
try {
  const preferences = await shoppingPreferencesService.savePreferences({
    userId: 'invalid-id',
    budget_preference: 'premium',
  });
} catch (error) {
  if (error.message.includes('401')) {
    // Session expired - redirect to login
  } else if (error.message.includes('403')) {
    // Attempting to modify another user's preferences
  } else if (error.message.includes('No internet')) {
    // Offline - show offline message
  } else {
    // Generic error handling
  }
}
```

### Validation Errors

```typescript
try {
  shoppingPreferencesService.validatePreferences({
    budget_preference: 'invalid', // Will throw
  });
} catch (error) {
  console.error(error.message);
  // "Invalid budget_preference. Must be one of: budget, moderate, premium"
}
```

## API Endpoints Used

The service connects to the following endpoints on `user.wihy.ai`:

- **GET** `/api/users/shopping-preferences/:userId` - Get preferences
- **POST** `/api/users/shopping-preferences` - Save/update preferences
- **DELETE** `/api/users/shopping-preferences/:userId` - Delete preferences

All requests require JWT authentication via `Authorization: Bearer <token>`.

## Best Practices

1. **Always use caching** - Let the service handle cache management
2. **Validate before saving** - Use `validatePreferences()` for client-side validation
3. **Handle defaults gracefully** - Empty arrays and null values are valid
4. **Update incrementally** - Use `updatePreferences()` to change specific fields
5. **Cache for UI** - Store preferences in component state for UI responsiveness
6. **Error boundaries** - Wrap service calls in try-catch blocks
7. **Postal code format** - Validate US (12345) or Canadian (A1A 1A1) formats

## Testing

### Manual Testing

```typescript
// Test with sample user
const testUserId = 'ef803597-c6cf-4a83-b8ac-4e0ff6a150e4';

// Get defaults
const defaults = await shoppingPreferencesService.getPreferences(testUserId);
console.log('Defaults:', defaults);

// Save preferences
const saved = await shoppingPreferencesService.savePreferences({
  userId: testUserId,
  preferred_stores: ['costco'],
  budget_preference: 'premium',
});
console.log('Saved:', saved);

// Update specific field
const updated = await shoppingPreferencesService.updatePreferences(testUserId, {
  organic_preference: 'always',
});
console.log('Updated:', updated);

// Delete
await shoppingPreferencesService.deletePreferences(testUserId);
console.log('Deleted - should revert to defaults');
```

## Related Documentation

- **API Reference**: [docs/SHOPPING_PREFERENCES_API.md](../SHOPPING_PREFERENCES_API.md)
- **User Service**: [docs/USER_SERVICE_API.md](USER_SERVICE_API.md)
- **Shopping Service**: [docs/SHOPPING_SERVICE_API.md](SHOPPING_SERVICE_API.md)

---

**Version**: 1.0  
**Last Updated**: January 25, 2026  
**Author**: WIHY Development Team
