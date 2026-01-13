# NutritionFacts Screen - API v2.0 Migration Guide

## Overview
The new Scan API v2.0 uses a simplified, flat structure instead of nested objects. This guide outlines what needs to be updated in `NutritionFacts.tsx`.

## ✅ Completed Changes
1. ✅ Updated TypeScript interfaces to match new API structure (`BarcodeScanResponse`)
2. ✅ Updated scan type detection to use `scan_type` field from API
3. ✅ Updated mock data generator to use new flat structure
4. ✅ Updated macro display to use direct fields (`protein_g`, `carbs_g`, `fat_g`, `fiber_g`)

## ⚠️ Remaining Field Mappings Needed

### Product Info
| Old Field | New Field | Status |
|-----------|-----------|--------|
| `name` | `product_name` | ⚠️ Update needed |
| `grade` | `nutrition_grade` | ⚠️ Update needed |
| `category` | `categories[0]` | ⚠️ Update needed |
| `askWihy` | `ask_wihy` | ⚠️ Update needed |

### Nutrition Facts
| Old Field | New Field | Status |
|-----------|-----------|--------|
| `macros.protein` | `protein_g` | ✅ Done |
| `macros.carbs` | `carbs_g` | ✅ Done |
| `macros.fat` | `fat_g` | ✅ Done |
| `macros.fiber` | `fiber_g` | ✅ Done |
| `macros.sugar` | `sugar_g` | ⚠️ Check usages |
| `macros.sodium` | `sodium_mg` | ⚠️ Check usages |
| `macros.saturated_fat` | `saturated_fat_g` | ⚠️ Check usages |
| `servingSize.amount` | Extract from `serving_size` string | ⚠️ Need parser |
| `servingSize.unit` | Extract from `serving_size` string | ⚠️ Need parser |

### Health Analysis
| Old Field | New Field | Status |
|-----------|-----------|--------|
| `health_summary` | `summary` | ⚠️ Update needed |
| `health_positive` | `positive_aspects` (now string[]) | ⚠️ Update needed |
| `health_concerns` | `areas_of_concern` (now string[]) | ⚠️ Update needed |

### Images
| Old Field | New Field | Status |
|-----------|-----------|--------|
| `image_url` | `image_front_url` (primary) | ⚠️ Update needed |
| - | `image_nutrition_url` (new) | ✅ Already supported |
| - | `image_ingredients_url` (new) | ✅ Already supported |

## 🔧 Specific Code Changes Needed

### 1. Update Data Normalization (Lines ~280-350)
The current code has complex normalization logic that tries to support old nested structure. This should be simplified to just pass through the new flat API response.

**Current:**
```typescript
const processedFoodItem: FoodAnalysis = {
  name: initialFoodItem.name || 'Unknown Food',
  macros: {
    protein: initialFoodItem.protein || macrosSource.protein || 0,
    // ...
  },
  servingSize: initialFoodItem.servingSize || { amount: 100, unit: 'g' },
  // ...
};
```

**Should be:**
```typescript
// API already returns flat structure, just use it directly
setFoodItem(initialFoodItem);
```

### 2. Update Product Name Displays
Search and replace throughout file:
- `foodItem.name` → `foodItem.product_name`
- `foodItem.grade` → `foodItem.nutrition_grade`
- `foodItem.askWihy` → `foodItem.ask_wihy`

### 3. Update Health Analysis Display
Current code assumes `health_positive` and `health_concerns` are objects with `.message` property.
New API returns simple string arrays.

**Lines ~1070-1120** (Health Summary section):
```typescript
// OLD
{foodItem.health_positive?.map((item, index) => (
  <Text key={index}>{item.message}</Text>
))}

// NEW  
{foodItem.positive_aspects?.map((message, index) => (
  <Text key={index}>{message}</Text>
))}
```

### 4. Update Category Display
**Line ~1474**:
```typescript
// OLD
{foodItem.category || 'Fresh Fruits'}

// NEW
{foodItem.categories?.[0] || 'Fresh Fruits'}
```

### 5. Remove Old Scan Type Logic
The code currently checks for `pillData`, `labelData`, `foodPhotoData` to determine scan type.
New API provides `scan_type` field directly.

**Already done** ✅

### 6. Update Serving Size Parser
The new API returns `serving_size` as a string like `"1 cup (37g)"` or `"330ml (1 can)"`.
Need to parse this for display and calculations.

**Add helper function:**
```typescript
const parseServingSize = (servingStr: string): { amount: number; unit: string } => {
  // Parse "1 cup (37g)" → { amount: 1, unit: 'cup' }
  const match = servingStr.match(/^([\d.]+)\s*(\w+)/);
  if (match) {
    return { amount: parseFloat(match[1]), unit: match[2] };
  }
  return { amount: 1, unit: 'serving' };
};
```

## 📝 Testing Checklist

After updates, test:
- [ ] Barcode scan displays correctly
- [ ] Photo scan displays correctly
- [ ] Product lookup displays correctly
- [ ] Health scores show correct values
- [ ] Macros display with new field names
- [ ] Serving size calculations work
- [ ] Health alerts/positive aspects render
- [ ] Ask WIHY button uses correct field
- [ ] Category/brand info displays
- [ ] Image URLs work (front, nutrition, ingredients)

## 🎯 Recommended Approach

1. **Phase 1: Critical Fixes** (Do first)
   - ✅ Update TypeScript interfaces
   - ⚠️ Update all `foodItem.name` → `foodItem.product_name`
   - ⚠️ Simplify data normalization logic
   - ⚠️ Fix health analysis arrays

2. **Phase 2: Enhanced Features**
   - Add serving size parser
   - Use additional image URLs
   - Display extended nutrition (vitamins/minerals)

3. **Phase 3: Testing**
   - Test with real API responses
   - Verify all scan types work
   - Check edge cases (missing data)

## 🔗 References
- New API Spec: `NUTRITION_FACTS_CLIENT_SPEC.md` (updated structure in your message)
- TypeScript Interfaces: Already added to `NutritionFacts.tsx` lines 37-138
