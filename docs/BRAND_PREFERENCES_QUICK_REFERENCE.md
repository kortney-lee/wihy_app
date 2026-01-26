# Brand Preferences Implementation - Quick Reference

## Overview

Phase 2 of Instacart integration is now implemented with a **simple, lightweight approach**:
- Text input for comma-separated brand names
- 10 clickable example chips for quick selection
- No complex modals, no search, no USDA integration (that's Phase 3 - backend only)

## What Was Added

### 1. BrandInput Component
**Location**: `mobile/src/components/shared/BrandInput.tsx`

**Purpose**: Simple UI for users to specify preferred brands

**Features**:
- Text field accepts comma-separated brand names (e.g., "Prego, Classico")
- 10 hardcoded example brands as clickable chips
- Tap chip → adds to selection (or removes if already selected)
- Auto-parses text input into array for API

**Example Usage**:
```typescript
import { BrandInput } from '../components/shared';

const [brands, setBrands] = useState<string[]>([]);

<BrandInput
  value={brands}
  onChange={setBrands}
  placeholder="e.g., Prego, Classico"
/>
```

### 2. Updated instacartService
**Location**: `mobile/src/services/instacartService.ts`

**New Types**:
```typescript
export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  filters?: {
    brand_filters?: string[];      // ["Prego", "Classico"]
    health_filters?: string[];     // ["ORGANIC", "GLUTEN_FREE"]
  };
}

export interface InstacartLinkResponse {
  success: boolean;
  data: {
    productsLinkUrl: string;
    listId: string;
    createdAt: string;
  };
}

export type HealthFilter =
  | 'ORGANIC'
  | 'GLUTEN_FREE'
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'KOSHER'
  | 'HALAL'
  | 'NON_GMO'
  | 'GRASS_FED'
  | 'NO_ADDED_SUGAR'
  | 'LOW_SODIUM';
```

**New Function**:
```typescript
export async function createShoppingList(
  items: ShoppingListItem[],
  userId: string,
  zipCode?: string
): Promise<InstacartLinkResponse>
```

## How to Integrate

### Step 1: Add Brand Field to Ingredient Type

Update your ingredient interface to include `preferredBrands`:

```typescript
interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string;
  notes?: string;
  
  // NEW: Brand preferences
  preferredBrands?: string[];     // ["Prego", "Classico"]
  healthFilters?: string[];       // ["ORGANIC", "GLUTEN_FREE"]
}
```

### Step 2: Add BrandInput to Ingredient Form

Wherever you have an ingredient input form, add the BrandInput component:

```typescript
import { BrandInput } from '../components/shared';

const AddIngredientForm = () => {
  const [ingredient, setIngredient] = useState<Ingredient>({
    name: '',
    amount: 1,
    unit: 'cup',
    preferredBrands: []
  });

  return (
    <View>
      {/* Existing fields: name, amount, unit */}
      
      <BrandInput
        value={ingredient.preferredBrands || []}
        onChange={(brands) => setIngredient(prev => ({
          ...prev,
          preferredBrands: brands
        }))}
      />
    </View>
  );
};
```

### Step 3: Pass Brands to Instacart API

When creating shopping lists, include brand filters:

```typescript
import { createShoppingList, ShoppingListItem } from '../services/instacartService';

const handleCreateShoppingList = async (ingredients: Ingredient[]) => {
  // Transform ingredients to Instacart format
  const lineItems: ShoppingListItem[] = ingredients.map(ing => ({
    name: ing.name,
    quantity: ing.amount,
    unit: ing.unit,
    notes: ing.notes,
    filters: {
      // Include brand preferences if specified
      ...(ing.preferredBrands?.length > 0 && {
        brand_filters: ing.preferredBrands
      }),
      // Include health filters if specified
      ...(ing.healthFilters?.length > 0 && {
        health_filters: ing.healthFilters
      })
    }
  }));

  try {
    const result = await createShoppingList(lineItems, userId, zipCode);
    
    if (result.success && result.data.productsLinkUrl) {
      // Show InstacartLinkButton with the URL
      setInstacartUrl(result.data.productsLinkUrl);
    }
  } catch (error) {
    console.error('Failed to create shopping list:', error);
  }
};
```

## Example Brands (Hardcoded)

The BrandInput component includes 10 popular brands as examples:
1. **Prego** - Pasta sauce
2. **Ragu** - Pasta sauce
3. **Kraft** - Cheese, dairy
4. **Barilla** - Pasta
5. **Organic Valley** - Dairy, meat
6. **Chobani** - Yogurt
7. **Classico** - Pasta sauce
8. **De Cecco** - Pasta
9. **Horizon** - Milk
10. **Fage** - Yogurt

Users can:
- Tap these chips to quickly add brands
- Type custom brands in the text field
- Mix both approaches

## Testing

### Manual Test Flow

1. **Add Ingredient with Brands**:
   ```
   - Name: "Pasta sauce"
   - Amount: 1
   - Unit: "jar"
   - Brands: Tap "Prego" and "Classico" chips
   - Result: preferredBrands = ["Prego", "Classico"]
   ```

2. **Create Shopping List**:
   ```
   - Add 3-5 ingredients with brand preferences
   - Submit to Instacart
   - Check console logs for API request
   ```

3. **Verify API Request**:
   ```json
   {
     "line_items": [
       {
         "name": "Pasta sauce",
         "quantity": 1,
         "unit": "jar",
         "filters": {
           "brand_filters": ["Prego", "Classico"]
         }
       }
     ]
   }
   ```

4. **Open in Instacart**:
   ```
   - Tap "Open in Instacart" button
   - Verify preferred brands appear first
   - User can still select other brands if preferred unavailable
   ```

## API Payload Example

```typescript
// Full example of creating shopping list with brands
const exampleRequest = {
  userId: "user_123",
  list_data: {
    line_items: [
      {
        name: "Pasta sauce",
        quantity: 1,
        unit: "jar",
        filters: {
          brand_filters: ["Prego", "Classico"],
          health_filters: ["ORGANIC"]
        }
      },
      {
        name: "Ground beef",
        quantity: 1,
        unit: "lb",
        filters: {
          brand_filters: ["Organic Valley"],
          health_filters: ["GRASS_FED", "ORGANIC"]
        }
      },
      {
        name: "Pasta",
        quantity: 1,
        unit: "box",
        filters: {
          brand_filters: ["Barilla", "De Cecco"]
        }
      }
    ]
  },
  options: {
    delivery_method: "delivery",
    zip_code: "94102"
  }
};
```

## Phase 3 (Future - No Work Needed)

**Backend team will handle**:
- OpenFoodFacts API integration (700k+ products, < 100ms response time)
- Real brand suggestions based on ingredient names
- Country filtering (US, CA, UK)
- Automatic brand recommendations

**Why OpenFoodFacts instead of USDA?**
- ✅ 700,000+ products worldwide (vs USDA's limited brand data)
- ✅ No API key required (public API)
- ✅ < 100ms response time (very fast)
- ✅ Real-time product updates
- ✅ Backend already has OpenFoodFacts service in scan-server.js

**When ready, they'll either**:
1. Add a new endpoint: `GET /api/ingredients/:name/brands?country=US`
2. Include `suggestedBrands` in existing API responses

**No client work needed** - the BrandInput component will work as-is. You can optionally fetch suggestions from backend and replace the hardcoded EXAMPLE_BRANDS array.

## Troubleshooting

### Issue: Brands Not Showing in API Request

**Check**:
```typescript
console.log('Ingredient data:', ingredient);
console.log('Brands array:', ingredient.preferredBrands);
```

**Solution**: Ensure `preferredBrands` is included in your ingredient type and properly passed to the API transform function.

### Issue: Text Input Not Parsing Correctly

**Check**:
```typescript
// Input: "Prego, Classico, Kraft"
// Should parse to: ["Prego", "Classico", "Kraft"]

const testInput = "Prego, Classico, Kraft";
const parsed = testInput.split(',').map(b => b.trim()).filter(b => b.length > 0);
console.log('Parsed brands:', parsed);
```

**Solution**: The BrandInput component handles this automatically in `handleTextChange`.

### Issue: Chips Not Updating

**Check**:
```typescript
// Ensure value prop is up-to-date
<BrandInput
  value={ingredient.preferredBrands || []}  // Must be current state
  onChange={(brands) => {
    console.log('New brands:', brands);
    setIngredient(prev => ({ ...prev, preferredBrands: brands }));
  }}
/>
```

**Solution**: Make sure you're updating state correctly and passing the updated value back to the component.

## Next Steps

1. **Integrate into CreateMeals.tsx**:
   - Find where ingredients are added/edited
   - Add BrandInput component to the form
   - Update state management to include `preferredBrands`

2. **Update Shopping List Creation**:
   - Transform ingredients to include `filters.brand_filters`
   - Pass to `createShoppingList()` function
   - Test with real Instacart orders

3. **Add to Meal Diary** (optional):
   - Allow brand preferences when logging meals
   - Save preferences for future use

4. **User Testing**:
   - Test with common ingredients (pasta sauce, milk, cheese)
   - Verify brands appear in Instacart
   - Collect feedback on UX

## Summary

✅ **Phase 2 Complete**:
- Simple text input + clickable chips
- No complex UI, no modals, no search
- 10 hardcoded example brands
- Full brand filtering support in API
- Ready to integrate into your app

⏳ **Phase 3 Waiting**:
- Backend team handles OpenFoodFacts integration (700k+ products, < 100ms)
- No client work needed until backend is ready
- Current implementation will work with backend suggestions when available

📋 **Implementation Time**: ~1-2 hours to integrate into existing forms

**Backend Status**:
- ✅ OpenFoodFacts service already exists in scan-server.js
- ⏳ Needs brand suggestions endpoint: `/api/ingredients/:name/brands?country=US`
- ⏳ Estimated: 1-2 hours backend work

---

**Questions?** Check the full [Client Implementation Guide](../docs/CLIENT_IMPLEMENTATION_GUIDE_INSTACART.md) or review the components in:
- `mobile/src/components/shared/BrandInput.tsx`
- `mobile/src/services/instacartService.ts`
