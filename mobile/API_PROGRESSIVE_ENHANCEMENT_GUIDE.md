# API Progressive Enhancement Guide - Meal Planning

## Overview

The WIHY Meal Planning API supports **three levels of functionality** through optional parameters, enabling backward compatibility while providing enhanced features when available.

## Three Enhancement Levels

```
┌─────────────────────────────────────────────────────────────┐
│                   ENHANCEMENT LEVELS                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│     BASIC       │    ZIPCODE      │      FULL               │
│   (Generic)     │  (Regional)     │  (Store-Specific)       │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • No zipcode    │ • Zipcode only  │ • Zipcode + Store       │
│ • Generic data  │ • Store suggest │ • Real products         │
│ • Est. costs    │ • Region costs  │ • Actual prices         │
│ • Works always  │ • Partial shop  │ • Full Instacart        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Level 1: Basic Mode (Fully Backward Compatible)

### When to Use
- Client hasn't implemented zipcode collection yet
- User doesn't want shopping integration
- Quick meal planning without shopping
- Offline/cached meal plans

### Request Example
```json
POST /api/meal-programs
{
  "description": "My Meal Plan",
  "duration": 7,
  "servings": 1,
  "mealsPerDay": {
    "breakfast": true,
    "lunch": true,
    "dinner": true
  },
  "dietaryRestrictions": ["vegetarian"],
  "food_exclusions": ["cottage cheese", "tofu"],
  "favorite_foods": ["chicken", "rice", "broccoli"]
  // NO postal_code
  // NO store_preference
}
```

### What You Get
✅ **Complete meal plan** with all fields  
✅ **Ingredient lists** with generic data  
✅ **Estimated costs** from ingredient library  
✅ **Common brand suggestions** (Kirkland, Organic)  
✅ **Aisle locations** (generic)  
❌ No real-time product availability  
❌ No region-specific pricing  
❌ No Instacart integration  

### Response Structure
```json
{
  "success": true,
  "program_id": "mp_1704567890123",
  "enhancement_level": "basic",
  "shopping_ready": false,
  "can_enhance": true,
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "meal_name": "Chicken Breast Protein Bowl",
          "ingredients": [
            {
              "name": "Chicken breast",
              "amount": 6,
              "unit": "oz",
              "brand": "Kirkland Signature",  // Generic suggestion
              "price": 3.99,                   // Estimated from library
              "aisle": "Meat",
              "instacart_product_id": null,    // Not available
              "available": null                 // Unknown
            }
          ],
          "cost_per_serving": 5.98,             // Estimated
          "total_cost": 11.96
        }
      ]
    }
  ]
}
```

## Level 2: Zipcode-Enhanced Mode

### When to Use
- Collect zipcode upfront, let user select store later
- Show available stores before generating plan
- Progressive disclosure UX pattern
- Prepare for shopping but don't force it

### Request Example
```json
POST /api/meal-programs
{
  "user_id": 123,
  "duration_days": 7,
  "servings": 4,
  "meals_per_day": {
    "breakfast": true,
    "lunch": true,
    "dinner": true
  },
  "dietary_restrictions": ["vegetarian"],
  "postal_code": "90210"  // Zipcode provided, store TBD
  // NO store_preference yet
}
```

### What You Get
✅ Everything from Level 1 PLUS:  
✅ **Available stores** in user's area  
✅ **Regional cost adjustments**  
✅ **Store distance/locations**  
✅ **Ability to enhance later**  
⏸️ Products still generic (until store selected)  

### Response Structure
```json
{
  "success": true,
  "program_id": "mp_1704567890123",
  "enhancement_level": "zipcode",
  "shopping_ready": false,
  "can_enhance": true,
  "postal_code": "90210",
  "available_stores": [
    {
      "id": "costco",
      "name": "Costco Wholesale",
      "distance_mi": 2.3,
      "supports_instacart": true,
      "estimated_total_cost": "$142"
    },
    {
      "id": "walmart",
      "name": "Walmart Supercenter",
      "distance_mi": 1.8,
      "supports_instacart": true,
      "estimated_total_cost": "$128"
    },
    {
      "id": "trader_joes",
      "name": "Trader Joe's",
      "distance_mi": 3.1,
      "supports_instacart": true,
      "estimated_total_cost": "$156"
    }
  ],
  "days": [...],  // Same as Level 1, with regional cost adjustments
  "next_step": {
    "action": "select_store",
    "endpoint": "PATCH /api/meal-programs/mp_1704567890123/shopping-setup",
    "description": "Select a store to get real products and pricing"
  }
}
```

### Enhance Later
```json
PATCH /api/meal-programs/mp_1704567890123/shopping-setup
{
  "store_preference": "costco"
}

// Returns Level 3 response with real products
```

## Level 3: Full-Enhanced Mode (Recommended)

### When to Use
- User wants complete shopping integration
- One-click Instacart ordering
- Accurate pricing and availability needed
- Best user experience

### Request Example
```json
POST /api/meal-programs
{
  "user_id": 123,
  "duration_days": 7,
  "servings": 4,
  "meals_per_day": {
    "breakfast": true,
    "lunch": true,
    "dinner": true
  },
  "dietary_restrictions": ["vegetarian"],
  "food_exclusions": ["cottage cheese"],
  "postal_code": "90210",         // Required
  "store_preference": "costco"    // Required
}
```

### What You Get
✅ Everything from Level 1 & 2 PLUS:  
✅ **Real Instacart product IDs**  
✅ **Actual store brands** (Kirkland Signature from Costco)  
✅ **Current pricing** from selected store  
✅ **Product availability status**  
✅ **One-click Instacart cart** creation  
✅ **Accurate total costs**  

### Response Structure
```json
{
  "success": true,
  "program_id": "mp_1704567890123",
  "enhancement_level": "full",
  "shopping_ready": true,
  "can_enhance": false,
  "postal_code": "90210",
  "store_preference": "costco",
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "meal_name": "Chicken Breast Protein Bowl",
          "ingredients": [
            {
              "name": "Chicken breast",
              "amount": 6,
              "unit": "oz",
              "brand": "Kirkland Signature",       // REAL brand from Costco
              "price": 3.99,                       // ACTUAL price
              "aisle": "Meat & Seafood",
              "instacart_product_id": "12345678",  // REAL product ID
              "available": true,                    // IN STOCK
              "product_url": "https://instacart.com/..."
            }
          ],
          "cost_per_serving": 5.98,               // ACCURATE
          "total_cost": 11.96
        }
      ]
    }
  ],
  "shopping": {
    "total_estimated_cost": "$142.38",
    "instacart_cart_url": "https://instacart.com/cart?items=12345678,23456789,...",
    "shopping_list_url": "/api/meal-programs/mp_1704567890123/shopping-list",
    "estimated_delivery_fee": "$9.99",
    "minimum_order": "$35.00",
    "meets_minimum": true
  }
}
```

## Comparison Matrix

| Feature | Basic Mode | Zipcode Mode | Full Enhanced |
|---------|-----------|--------------|---------------|
| **Meal Generation** |
| Unique recipes | ✅ 7B+ combos | ✅ 7B+ combos | ✅ 7B+ combos |
| Complete nutrition | ✅ Yes | ✅ Yes | ✅ Yes |
| Food exclusions | ✅ Yes | ✅ Yes | ✅ Yes |
| Favorite foods | ✅ Yes | ✅ Yes | ✅ Yes |
| Cooking instructions | ✅ Yes | ✅ Yes | ✅ Yes |
| **Product Data** |
| Ingredient names | ✅ Yes | ✅ Yes | ✅ Yes |
| Brand names | Generic | Generic | **Real Store Brands** |
| Pricing | Estimated | Regional Avg | **Live Pricing** |
| Product IDs | ❌ No | ❌ No | ✅ **Instacart IDs** |
| Availability | ❌ Unknown | ❌ Unknown | ✅ **Real-time** |
| **Shopping** |
| Available stores | ❌ No | ✅ **Yes** | ✅ Yes |
| Store selection | ❌ N/A | Later | ✅ Immediate |
| Shopping list | ✅ Generic | ✅ Generic | ✅ **Store-specific** |
| Instacart cart | ❌ No | ❌ No | ✅ **One-click** |
| Cost accuracy | ~70% | ~85% | **95%+** |
| **API Parameters** |
| postal_code | ❌ Optional | ✅ **Required** | ✅ **Required** |
| store_preference | ❌ Optional | ❌ Optional | ✅ **Required** |
| **Response Time** |
| Generation speed | Fast (2-3s) | Medium (3-4s) | Slower (4-6s) |
| Cacheability | High | Medium | Low |

## Recommended UX Flows

### Flow 1: Basic → Progressive Enhancement

**Best for**: General users, gradual adoption

```
User: "Create 7-day meal plan"
  ↓
App: Generate with Basic Mode (no zipcode)
  ↓
Show: Complete meal plan with generic data
  ↓
User: Clicks "Shop for this plan"
  ↓
App: Prompt for zipcode → PATCH with postal_code
  ↓
Show: Available stores
  ↓
User: Selects "Costco"
  ↓
App: PATCH with store_preference → Get enhanced data
  ↓
Show: Instacart cart button
```

**Implementation:**
```javascript
// Step 1: Generate basic plan
const response1 = await fetch('/api/meal-programs', {
  method: 'POST',
  body: JSON.stringify({
    duration_days: 7,
    servings: 4,
    dietary_restrictions: ['vegetarian']
    // No postal_code or store_preference
  })
});

const plan = await response1.json();
// plan.shopping_ready = false
// plan.can_enhance = true

// Step 2: User clicks "Shop" → collect zipcode
const zipcode = await promptUserForZipcode();

const response2 = await fetch(`/api/meal-programs/${plan.program_id}/shopping-setup`, {
  method: 'PATCH',
  body: JSON.stringify({ postal_code: zipcode })
});

const withStores = await response2.json();
// withStores.available_stores = [...]

// Step 3: User selects store
const store = await promptUserForStore(withStores.available_stores);

const response3 = await fetch(`/api/meal-programs/${plan.program_id}/shopping-setup`, {
  method: 'PATCH',
  body: JSON.stringify({ store_preference: store.id })
});

const enhanced = await response3.json();
// enhanced.shopping_ready = true
// enhanced.shopping.instacart_cart_url = "..."
```

### Flow 2: Upfront Full Enhancement

**Best for**: Users who always shop, streamlined UX

```
User: "Create 7-day meal plan"
  ↓
App: Check if user has saved zipcode & store preference
  ↓
Generate: POST with postal_code + store_preference
  ↓
Show: Complete plan with Instacart cart ready
```

**Implementation:**
```javascript
// Get user preferences
const userProfile = await getUserProfile(userId);

const response = await fetch('/api/meal-programs', {
  method: 'POST',
  body: JSON.stringify({
    duration_days: 7,
    servings: 4,
    dietary_restrictions: ['vegetarian'],
    postal_code: userProfile.postal_code || null,           // Optional
    store_preference: userProfile.store_preference || null  // Optional
  })
});

const plan = await response.json();

if (plan.shopping_ready) {
  // Show Instacart button immediately
  showInstacartButton(plan.shopping.instacart_cart_url);
} else if (plan.can_enhance) {
  // Show "Set up shopping" button
  showEnhanceButton(plan.program_id);
}
```

### Flow 3: Hybrid (Recommended)

**Best for**: Best of both worlds

```
App: Check user profile
  ↓
Has zipcode saved? 
  ├─ YES → POST with postal_code → Show stores
  └─ NO  → POST without zipcode → Show basic plan
  ↓
Has store preference?
  ├─ YES → Auto-select → Full enhancement
  └─ NO  → Let user choose → PATCH later
```

## Migration Guide for Existing Clients

### Current API (Still Works)
```json
POST /api/meal-programs
{
  "duration": 7,
  "servings": 4
}
// Returns: Basic Mode response
```

### Enhanced API (New Fields Optional)
```json
POST /api/meal-programs
{
  "duration": 7,
  "servings": 4,
  "postal_code": "90210",        // NEW, OPTIONAL
  "store_preference": "costco"   // NEW, OPTIONAL
}
// Returns: Full Enhanced response if both provided
//          Zipcode Enhanced if only postal_code
//          Basic Mode if neither
```

### Breaking Change Check
❌ **NO BREAKING CHANGES**
- All new fields are optional
- Old requests work identically
- Response structure is backward compatible
- New fields can be ignored by old clients

## API Endpoints Summary

### Primary Endpoint
```
POST /api/meal-programs
```

**Supports all three modes based on parameters**

### Enhancement Endpoint (NEW)
```
PATCH /api/meal-programs/:programId/shopping-setup
Body: { "postal_code": "90210" }  // Step 1: Get available stores

PATCH /api/meal-programs/:programId/shopping-setup
Body: { "store_preference": "costco" }  // Step 2: Get real products
```

**Use cases:**
- Enhance existing Basic Mode plan
- Add zipcode after initial generation
- Change store selection
- Re-fetch products with updated availability

### Shopping List Endpoint
```
GET /api/meal-programs/:programId/shopping-list
GET /api/meal-programs/:programId/shopping-list?format=pdf
GET /api/meal-programs/:programId/shopping-list?format=text
```

**Available in all modes, enhanced in Full mode**

## Error Handling

### Missing Zipcode with Store
```json
POST /api/meal-programs
{
  "store_preference": "costco"
  // Missing postal_code
}

// Response:
{
  "success": false,
  "error": "postal_code required when store_preference is specified",
  "code": "MISSING_POSTAL_CODE"
}
```

### Invalid Zipcode
```json
{
  "success": false,
  "error": "Invalid postal code format",
  "code": "INVALID_POSTAL_CODE"
}
```

### Store Not Available in Area
```json
{
  "success": true,  // Plan still generated
  "warning": "Costco not available in 12345. Showing generic data.",
  "enhancement_level": "basic",
  "postal_code": "12345",
  "requested_store": "costco",
  "available_stores": ["walmart", "kroger"]
}
```

## Performance Considerations

| Mode | Response Time | Cacheability | API Calls |
|------|--------------|--------------|-----------|
| Basic | 2-3s | High (24hr) | 0 external |
| Zipcode | 3-4s | Medium (6hr) | 1 (geocoding) |
| Full | 4-6s | Low (1hr) | 3-10 (Instacart) |

### Optimization Tips

1. **Cache user preferences**
   ```javascript
   // Save in user profile
   { postal_code: "90210", store_preference: "costco" }
   ```

2. **Pre-fetch stores on app load**
   ```javascript
   GET /api/stores?postal_code=90210
   // Cache available stores
   ```

3. **Generate async, enhance later**
   ```javascript
   // Fast initial response
   POST /api/meal-programs (basic mode)
   // Background enhancement
   PATCH /api/meal-programs/:id/shopping-setup
   ```

## Summary

✅ **Three enhancement levels** support all use cases  
✅ **Fully backward compatible** - no breaking changes  
✅ **Progressive enhancement** - adopt features gradually  
✅ **Optimal UX flexibility** - choose flow that fits your app  
✅ **No forced shopping** - users can opt-in when ready  

**Recommendation**: Start with Basic Mode, add Zipcode Mode when collecting location, enable Full Mode for shopping features.

---

*WIHY API Documentation - Progressive Enhancement Guide*  
*Last Updated: January 7, 2026*
