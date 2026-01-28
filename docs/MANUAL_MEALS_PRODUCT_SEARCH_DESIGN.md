# Manual Meal Creation with Product Search Integration

**Created:** January 28, 2026  
**Status:** Design Proposal

---

## Current State Analysis

### Current Manual Meal Creation Flow
1. User fills in meal name manually
2. User manually enters nutrition facts (calories, protein, carbs, fat)
3. User manually types ingredients with amounts
4. User adds tags and notes
5. User saves meal to library

### Problems with Current Design
- ❌ **Manual data entry is tedious** - typing nutrition facts is error-prone
- ❌ **No nutrition data validation** - users can enter incorrect values
- ❌ **No ingredient suggestions** - users must know exact names
- ❌ **Missing brand information** - can't track specific products
- ❌ **No product images** - less visual appeal
- ❌ **No barcode scanning** - missed opportunity for quick entry

---

## Proposed Enhanced Design

### New Flow with Product Search Integration

```
┌─────────────────────────────────────────────────────────────┐
│  CREATE MEAL - Enhanced                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Meal Name: [Chicken Caesar Salad____________]              │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │ 🔍 Search Products (Optional)             │               │
│  │ [Search for ingredients..._________]  🔍  │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  Quick Add Popular Items:                                   │
│  [🥗 Grilled Chicken] [🥬 Romaine] [🧀 Parmesan] [🍞 Croutons]│
│                                                              │
│  ──────────────────────────────────────────────              │
│                                                              │
│  INGREDIENTS                                                 │
│  ┌────────────────────────────────────────────────┐         │
│  │ ✓ Grilled Chicken Breast (Tyson)               │         │
│  │   4 oz  •  165 cal  •  31g protein             │ [×]     │
│  │                                                 │         │
│  │ ✓ Romaine Lettuce                               │         │
│  │   2 cups  •  16 cal  •  1g protein             │ [×]     │
│  │                                                 │         │
│  │ + Add ingredient manually                       │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  NUTRITION FACTS (Auto-calculated)                           │
│  ┌────────────────────────────────────────────────┐         │
│  │  Calories: 650    Protein: 45g                 │         │
│  │  Carbs: 38g       Fat: 32g                      │         │
│  │                                                 │         │
│  │  [Override manually] [Recalculate]              │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  [Save to Library]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Add Product Search Component

**File:** `mobile/src/components/ProductSearchModal.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { productSearchService, FoodProduct } from '../services/productSearchService';
import SvgIcon from './shared/SvgIcon';

interface ProductSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: FoodProduct) => void;
}

export function ProductSearchModal({
  visible,
  onClose,
  onSelectProduct,
}: ProductSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await productSearchService.search(query, {
        type: 'food',
        limit: 30,
      });
      setResults(data.food);
    } catch (error) {
      console.error('Product search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSelectProduct = (product: FoodProduct) => {
    onSelectProduct(product);
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <SvgIcon name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Products</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SvgIcon name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for ingredients..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {loading && <ActivityIndicator size="small" />}
        </View>

        {/* Quick Categories */}
        {!searched && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Popular Categories</Text>
            <View style={styles.categoriesGrid}>
              {['Chicken', 'Beef', 'Fish', 'Rice', 'Pasta', 'Cheese', 'Vegetables', 'Fruits'].map(
                (category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryButton}
                    onPress={() => {
                      setQuery(category);
                      handleSearch();
                    }}
                  >
                    <Text style={styles.categoryText}>{category}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        {/* Results */}
        {searched && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContainer}
            ListEmptyComponent={
              loading ? null : (
                <View style={styles.emptyState}>
                  <SvgIcon name="search" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>
                    {query ? 'No products found' : 'Search to find products'}
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => handleSelectProduct(item)}
              >
                <View style={styles.productInfo}>
                  <View>
                    <Text style={styles.productName}>{item.name}</Text>
                    {item.brand && (
                      <Text style={styles.productBrand}>{item.brand}</Text>
                    )}
                    {item.servingSize && (
                      <Text style={styles.productServing}>Serving: {item.servingSize}</Text>
                    )}
                  </View>

                  {/* Nutrition Summary */}
                  {item.calories !== undefined && (
                    <View style={styles.nutritionSummary}>
                      <View style={styles.nutritionBadge}>
                        <Text style={styles.nutritionLabel}>CAL</Text>
                        <Text style={styles.nutritionValue}>{item.calories}</Text>
                      </View>
                      {item.protein !== undefined && (
                        <View style={styles.nutritionBadge}>
                          <Text style={styles.nutritionLabel}>PRO</Text>
                          <Text style={styles.nutritionValue}>{item.protein}g</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <SvgIcon name="add-circle" size={24} color="#3b82f6" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoriesContainer: {
    padding: 16,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    color: '#374151',
  },
  resultsContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productBrand: {
    fontSize: 14,
    color: '#6b7280',
  },
  productServing: {
    fontSize: 12,
    color: '#9ca3af',
  },
  nutritionSummary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  nutritionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  nutritionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
});
```

---

### Phase 2: Update CreateMeals.tsx

**Add state for product search:**

```typescript
// Add to existing state
const [showProductSearch, setShowProductSearch] = useState(false);
const [searchedProducts, setSearchedProducts] = useState<FoodProduct[]>([]);
```

**Add product selection handler:**

```typescript
const handleSelectProduct = (product: FoodProduct) => {
  // Add as ingredient with nutrition data
  const newIngredient: Ingredient = {
    id: Date.now().toString(),
    name: product.name,
    amount: '1',
    unit: product.servingSize || 'serving',
    // Store nutrition data in ingredient
    calories: product.calories,
    protein: product.protein,
    carbs: product.carbs,
    fat: product.fat,
    brand: product.brand,
  };

  setIngredients([...ingredients, newIngredient]);
  setSearchedProducts([...searchedProducts, product]);
  
  // Auto-calculate total nutrition
  recalculateNutrition();
};
```

**Add nutrition auto-calculation:**

```typescript
const recalculateNutrition = useCallback(() => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  ingredients.forEach((ingredient) => {
    if (ingredient.calories) totalCalories += ingredient.calories;
    if (ingredient.protein) totalProtein += ingredient.protein;
    if (ingredient.carbs) totalCarbs += ingredient.carbs;
    if (ingredient.fat) totalFat += ingredient.fat;
  });

  setCalories(totalCalories.toString());
  setProtein(totalProtein.toFixed(1));
  setCarbs(totalCarbs.toFixed(1));
  setFat(totalFat.toFixed(1));
}, [ingredients]);
```

**Update ingredients section UI:**

```tsx
{/* Ingredients Section - Enhanced */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Ingredients</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable 
        onPress={() => setShowProductSearch(true)} 
        style={styles.searchButton}
      >
        <SvgIcon name="search" size={18} color="#3b82f6" />
        <Text style={styles.searchButtonText}>Search</Text>
      </Pressable>
      <Pressable onPress={addIngredient} style={styles.addButton}>
        <SvgIcon name="add-circle" size={20} color="#3b82f6" />
        <Text style={styles.addButtonText}>Manual</Text>
      </Pressable>
    </View>
  </View>

  <View style={styles.card}>
    {ingredients.length === 0 ? (
      <View style={styles.emptyState}>
        <SvgIcon name="search" size={32} color="#d1d5db" />
        <Text style={styles.emptyText}>
          Search for products or add manually
        </Text>
      </View>
    ) : (
      ingredients.map((ingredient) => (
        <View key={ingredient.id} style={styles.ingredientRow}>
          <View style={styles.ingredientInfo}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            {ingredient.brand && (
              <Text style={styles.ingredientBrand}>{ingredient.brand}</Text>
            )}
            {ingredient.calories && (
              <Text style={styles.ingredientNutrition}>
                {ingredient.calories} cal • {ingredient.protein}g protein
              </Text>
            )}
          </View>
          <View style={styles.ingredientAmount}>
            <TextInput
              style={[styles.input, styles.ingredientAmountInput]}
              placeholder="1"
              value={ingredient.amount}
              onChangeText={(value) => {
                updateIngredient(ingredient.id, 'amount', value);
                recalculateNutrition();
              }}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.ingredientUnitInput]}
              placeholder="serving"
              value={ingredient.unit}
              onChangeText={(value) =>
                updateIngredient(ingredient.id, 'unit', value)
              }
            />
          </View>
          <Pressable onPress={() => {
            removeIngredient(ingredient.id);
            recalculateNutrition();
          }}>
            <SvgIcon name="close-circle" size={24} color="#ef4444" />
          </Pressable>
        </View>
      ))
    )}
  </View>
</View>

{/* Product Search Modal */}
<ProductSearchModal
  visible={showProductSearch}
  onClose={() => setShowProductSearch(false)}
  onSelectProduct={handleSelectProduct}
/>
```

---

## Enhanced Features

### 1. Auto-Calculate Nutrition

```typescript
// Show auto-calculated badge
{ingredients.some(i => i.calories) && (
  <View style={styles.nutritionBadge}>
    <SvgIcon name="calculator" size={16} color="#10b981" />
    <Text style={styles.badgeText}>
      Auto-calculated from {ingredients.filter(i => i.calories).length} ingredients
    </Text>
    <TouchableOpacity onPress={recalculateNutrition}>
      <Text style={styles.recalculateLink}>Recalculate</Text>
    </TouchableOpacity>
  </View>
)}
```

### 2. Ingredient Suggestions

```typescript
// Popular ingredients for meal type
const getPopularIngredients = (mealType: string): string[] => {
  switch (mealType) {
    case 'breakfast':
      return ['Eggs', 'Oatmeal', 'Yogurt', 'Berries', 'Toast'];
    case 'lunch':
      return ['Chicken Breast', 'Brown Rice', 'Salad', 'Whole Wheat Bread'];
    case 'dinner':
      return ['Salmon', 'Quinoa', 'Broccoli', 'Sweet Potato'];
    case 'snack':
      return ['Almonds', 'Greek Yogurt', 'Apple', 'Protein Bar'];
    default:
      return [];
  }
};
```

### 3. Barcode Scanner Integration (Future)

```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';

const scanBarcode = async () => {
  const { status } = await BarCodeScanner.requestPermissionsAsync();
  if (status === 'granted') {
    // Show barcode scanner
    setShowBarcodeScanner(true);
  }
};

const handleBarcodeScan = async ({ data }: { data: string }) => {
  // Search product by barcode
  const product = await productSearchService.getProductByBarcode(data);
  if (product) {
    handleSelectProduct(product);
  }
  setShowBarcodeScanner(false);
};
```

---

## Updated Ingredient Interface

```typescript
interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  // Enhanced with nutrition data
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  brand?: string;
  productId?: string; // For tracking source
  imageUrl?: string;
}
```

---

## UI/UX Improvements

### Before (Current)
```
┌────────────────────────────┐
│ Ingredients                │
│ [Add]                      │
├────────────────────────────┤
│ [Ingredient Name____]      │
│ [Amount] [Unit]            │
└────────────────────────────┘
```

### After (Enhanced)
```
┌────────────────────────────────────────┐
│ Ingredients    [🔍 Search] [+ Manual]  │
├────────────────────────────────────────┤
│ ✓ Grilled Chicken Breast (Tyson)       │
│   4 oz • 165 cal • 31g protein    [×]  │
│                                         │
│ ✓ Brown Rice                            │
│   1 cup • 215 cal • 5g protein    [×]  │
│                                         │
│ Total: 380 cal, 36g protein            │
└────────────────────────────────────────┘
```

---

## Benefits

### For Users
- ✅ **Faster meal creation** - search instead of typing
- ✅ **Accurate nutrition data** - from OpenFoodFacts database
- ✅ **Brand tracking** - know exact products used
- ✅ **Visual feedback** - see product images
- ✅ **Auto-calculation** - no manual math needed

### For Business
- ✅ **Better data quality** - validated nutrition facts
- ✅ **Instacart integration** - easy shopping list creation
- ✅ **Brand partnerships** - track popular brands
- ✅ **Analytics** - understand user food preferences
- ✅ **Premium upsell** - advanced features for paid users

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create `productSearchService.ts`
- [ ] Create `ProductSearchModal.tsx` component
- [ ] Add product search to services exports
- [ ] Add basic tests

### Phase 2: Integration (Week 2)
- [ ] Update `Ingredient` interface with nutrition fields
- [ ] Add product search modal to CreateMeals screen
- [ ] Implement `handleSelectProduct` handler
- [ ] Implement `recalculateNutrition` function
- [ ] Update ingredient row UI to show nutrition

### Phase 3: Enhancement (Week 3)
- [ ] Add popular ingredient suggestions
- [ ] Add auto-calculate badge
- [ ] Add manual override option
- [ ] Improve ingredient card design
- [ ] Add loading states

### Phase 4: Polish (Week 4)
- [ ] Add empty states
- [ ] Add error handling
- [ ] Add analytics tracking
- [ ] User testing and feedback
- [ ] Documentation

---

## Success Metrics

Track these metrics to measure success:

1. **Adoption Rate**
   - % of meals created using product search vs manual
   - Target: >60% within 2 months

2. **Time to Create**
   - Average time to create a meal
   - Target: <2 minutes (down from 5 minutes)

3. **Data Quality**
   - % of meals with complete nutrition data
   - Target: >80%

4. **User Satisfaction**
   - NPS score for meal creation feature
   - Target: >8/10

---

## Future Enhancements

1. **Barcode Scanner**
   - Scan product barcodes to add instantly
   - Integration with camera API

2. **Recipe Import**
   - Parse recipes from URLs
   - Extract ingredients and nutrition automatically

3. **AI Suggestions**
   - Suggest complementary ingredients
   - Recommend portion sizes based on goals

4. **Nutrition Optimization**
   - Suggest healthier alternatives
   - Balance macros automatically

5. **Community Sharing**
   - Share custom meals with community
   - Vote on best meals
