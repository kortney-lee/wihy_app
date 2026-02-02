# Product Search Autocomplete - Client Implementation Guide

> **Last Updated:** February 1, 2026  
> **API Base URL:** `https://services.wihy.ai`

## Overview

The Product Search API provides Google-like autocomplete functionality for searching food, beauty, and pet food products. It includes:

- **Instant suggestions** as users type
- **Trending searches** for empty search boxes
- **Fast caching** for sub-millisecond responses on repeated queries

---

## API Endpoints

| Endpoint | Purpose | When to Call |
|----------|---------|--------------|
| `GET /api/products/trending` | Popular search terms | Empty search box |
| `GET /api/products/suggest` | Autocomplete suggestions | User typing (2+ chars) |
| `GET /api/products/search` | Full search results | User submits/selects |

---

## 1. Trending Searches (Empty Search Box)

When the search box is empty or focused, show trending searches.

### Request

```
GET /api/products/trending?type=food&limit=10
```

### Parameters

| Param | Type | Required | Values | Default |
|-------|------|----------|--------|---------|
| `type` | string | No | `food`, `beauty`, `petfood` | `all` |
| `limit` | number | No | 1-20 | 10 |

### Response

```json
{
  "success": true,
  "type": "food",
  "trending": [
    "Organic snacks",
    "Protein bars",
    "Gluten-free",
    "Keto friendly",
    "Low sugar",
    "Plant-based",
    "Whole grain",
    "High protein",
    "Zero calorie",
    "Natural ingredients"
  ],
  "timestamp": "2026-02-01T19:06:13.015Z"
}
```

### Usage

```javascript
// Fetch trending when search box is focused with empty query
const fetchTrending = async (type = 'food') => {
  const res = await fetch(
    `https://services.wihy.ai/api/products/trending?type=${type}&limit=10`
  );
  const data = await res.json();
  return data.trending; // Array of strings
};
```

---

## 2. Autocomplete Suggestions (User Typing)

As the user types, fetch suggestions after 2+ characters.

### Request

```
GET /api/products/suggest?q=coke&type=food&limit=8
```

### Parameters

| Param | Type | Required | Values | Default |
|-------|------|----------|--------|---------|
| `q` | string | Yes | Search query (min 2 chars) | - |
| `type` | string | No | `food`, `beauty`, `petfood` | `all` |
| `limit` | number | No | 1-15 | 8 |

### Response

```json
{
  "success": true,
  "query": "coke",
  "type": "food",
  "suggestions": [
    "Diet coke soda",
    "Caffeine Free Zero Calorie Cola",
    "Coke",
    "coke"
  ],
  "products": [
    {
      "name": "Diet coke soda",
      "brand": "Coke, Diet Coke",
      "type": "food"
    },
    {
      "name": "Caffeine Free Zero Calorie Cola",
      "brand": "Coke, Coca Cola, Coke zero",
      "type": "food"
    }
  ],
  "brands": [
    "Coke",
    "Coke zero",
    "Coke Zero",
    "Coke cherry"
  ],
  "categories": [],
  "responseTime": "0ms",
  "fromCache": true,
  "timestamp": "2026-02-01T19:06:08.962Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `suggestions` | string[] | Product names matching the query |
| `products` | object[] | Products with name, brand, and type |
| `brands` | string[] | Matching brand names |
| `categories` | string[] | Matching category names |
| `responseTime` | string | Query execution time |
| `fromCache` | boolean | Whether result was from cache |

### Usage

```javascript
// Debounced autocomplete (call on every keystroke with 150ms delay)
const fetchSuggestions = async (query, type = 'food') => {
  if (query.length < 2) {
    return { suggestions: [], products: [], brands: [] };
  }
  
  const res = await fetch(
    `https://services.wihy.ai/api/products/suggest?q=${encodeURIComponent(query)}&type=${type}&limit=8`
  );
  return await res.json();
};
```

---

## 3. Full Search Results (User Submits)

When user selects a suggestion or presses Enter, fetch full results.

### Request

```
GET /api/products/search?q=coke&type=food&limit=20
```

### Parameters

| Param | Type | Required | Values | Default |
|-------|------|----------|--------|---------|
| `q` | string | Yes | Search query | - |
| `type` | string | No | `food`, `beauty`, `petfood` | `all` |
| `limit` | number | No | 1-50 | 20 |

### Response

```json
{
  "success": true,
  "query": "doritos",
  "type": "food",
  "food": [
    {
      "id": "0028400017114",
      "name": "Doritos Flavored Tortilla Chips Nacho Cheese",
      "brand": "Doritos, Frito Lay",
      "categories": "Snacks, Salty snacks, Chips and fries",
      "nutrition": {
        "calories": 540,
        "protein": 7,
        "carbs": 60,
        "fat": 30,
        "fiber": 1,
        "sugar": 2,
        "sodium": 0.32,
        "saturated_fat": 4,
        "salt": 0.8,
        "per": "100g"
      },
      "nutriscore_grade": "e",
      "nova_group": 4,
      "serving_size": "28g (about 12 chips)",
      "ingredients": "Corn, Vegetable Oil, Maltodextrin, Salt, Cheddar Cheese...",
      "additives": ["en:e110", "en:e129", "en:e627", "en:e631"],
      "allergens": ["en:milk"],
      "countries": "United States",
      "score": 0.3,
      "type": "food"
    }
  ],
  "beauty": [],
  "petfood": [],
  "counts": {
    "food": 20,
    "beauty": 0,
    "petfood": 0
  },
  "total": 20,
  "timestamp": "2026-02-01T18:41:24.125Z"
}
```

### Nutrition Fields Reference

| Field | Description | Unit |
|-------|-------------|------|
| `calories` | Energy content | kcal per 100g |
| `protein` | Protein content | g per 100g |
| `carbs` | Carbohydrate content | g per 100g |
| `fat` | Total fat content | g per 100g |
| `fiber` | Dietary fiber | g per 100g |
| `sugar` | Sugar content | g per 100g |
| `sodium` | Sodium content | g per 100g |
| `saturated_fat` | Saturated fat | g per 100g |
| `salt` | Salt content | g per 100g |
| `per` | Unit basis | Always "100g" |

### Metadata Fields

| Field | Description | Values |
|-------|-------------|--------|
| `nutriscore_grade` | Nutri-Score health rating | a, b, c, d, e (a=best) |
| `nova_group` | Food processing level | 1-4 (1=unprocessed, 4=ultra-processed) |
| `serving_size` | Recommended serving | e.g., "28g (about 12 chips)" |
| `ingredients` | Full ingredients list | Text string |
| `additives` | Food additives (E-numbers) | Array of codes like "en:e110" |
| `allergens` | Allergen information | Array like ["en:milk", "en:gluten"] |
| `countries` | Countries where sold | Text string |

### Additive Code Reference

Common additives you might see:
- `en:e110` - Sunset Yellow FCF (colorant)
- `en:e129` - Allura Red AC (colorant)
- `en:e322` - Lecithin (emulsifier)
- `en:e330` - Citric acid (acidity regulator)
- `en:e500` - Sodium carbonates (raising agent)

---

## Complete React Native Example

```jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

const API_BASE = 'https://services.wihy.ai';

const ProductSearch = ({ onSelectProduct }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [products, setProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch trending on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/products/trending?type=food`)
      .then(res => res.json())
      .then(data => setTrending(data.trending || []))
      .catch(console.error);
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/products/suggest?q=${encodeURIComponent(query)}&type=food&limit=8`
        );
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Handle suggestion selection
  const handleSelect = async (selectedQuery) => {
    setQuery(selectedQuery);
    setShowDropdown(false);

    try {
      const res = await fetch(
        `${API_BASE}/api/products/search?q=${encodeURIComponent(selectedQuery)}&type=food&limit=20`
      );
      const data = await res.json();
      setProducts(data.food || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Handle search submit
  const handleSubmit = () => {
    if (query.length >= 2) {
      handleSelect(query);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <TextInput
        style={styles.input}
        placeholder="Search products..."
        value={query}
        onChangeText={setQuery}
        onFocus={() => setShowDropdown(true)}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {/* Show trending when empty */}
          {query.length < 2 && trending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Trending Searches</Text>
              {trending.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.item}
                  onPress={() => handleSelect(item)}
                >
                  <Text>🔥 {item}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Show suggestions when typing */}
          {suggestions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.item}
                  onPress={() => handleSelect(item)}
                >
                  <Text>🔍 {item}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}

      {/* Search Results */}
      {products.length > 0 && (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.product}
              onPress={() => onSelectProduct?.(item)}
            >
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productBrand}>{item.brand}</Text>
              {item.nutrition?.calories && (
                <Text style={styles.productCalories}>
                  {item.nutrition.calories} cal
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  product: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productCalories: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default ProductSearch;
```

---

## Web (Vanilla JavaScript) Example

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .search-container { position: relative; width: 400px; }
    .search-input { width: 100%; padding: 12px; font-size: 16px; }
    .dropdown { 
      position: absolute; 
      width: 100%; 
      background: white; 
      border: 1px solid #ddd;
      max-height: 300px;
      overflow-y: auto;
    }
    .dropdown-item { padding: 10px; cursor: pointer; }
    .dropdown-item:hover { background: #f0f0f0; }
    .section-title { 
      padding: 8px; 
      background: #f5f5f5; 
      font-size: 12px; 
      font-weight: bold; 
    }
  </style>
</head>
<body>
  <div class="search-container">
    <input 
      type="text" 
      class="search-input" 
      id="searchInput" 
      placeholder="Search products..."
    >
    <div class="dropdown" id="dropdown" style="display: none;"></div>
  </div>

  <script>
    const API_BASE = 'https://services.wihy.ai';
    const input = document.getElementById('searchInput');
    const dropdown = document.getElementById('dropdown');
    let debounceTimer;

    // Fetch trending on page load
    async function loadTrending() {
      const res = await fetch(`${API_BASE}/api/products/trending?type=food`);
      const data = await res.json();
      return data.trending || [];
    }

    // Fetch suggestions
    async function fetchSuggestions(query) {
      const res = await fetch(
        `${API_BASE}/api/products/suggest?q=${encodeURIComponent(query)}&type=food&limit=8`
      );
      return await res.json();
    }

    // Render dropdown
    function renderDropdown(items, title, icon = '🔍') {
      dropdown.innerHTML = `
        <div class="section-title">${title}</div>
        ${items.map(item => `
          <div class="dropdown-item" data-value="${item}">
            ${icon} ${item}
          </div>
        `).join('')}
      `;
      dropdown.style.display = 'block';
    }

    // Handle input
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      debounceTimer = setTimeout(async () => {
        if (query.length < 2) {
          const trending = await loadTrending();
          renderDropdown(trending, 'Trending Searches', '🔥');
        } else {
          const data = await fetchSuggestions(query);
          renderDropdown(data.suggestions, 'Suggestions', '🔍');
        }
      }, 150);
    });

    // Handle selection
    dropdown.addEventListener('click', (e) => {
      if (e.target.classList.contains('dropdown-item')) {
        const value = e.target.dataset.value;
        input.value = value;
        dropdown.style.display = 'none';
        // Do full search...
        console.log('Selected:', value);
      }
    });

    // Show dropdown on focus
    input.addEventListener('focus', async () => {
      if (input.value.length < 2) {
        const trending = await loadTrending();
        renderDropdown(trending, 'Trending Searches', '🔥');
      }
    });

    // Hide dropdown on blur (with delay for click handling)
    input.addEventListener('blur', () => {
      setTimeout(() => dropdown.style.display = 'none', 200);
    });
  </script>
</body>
</html>
```

---

## Performance

| Scenario | Response Time |
|----------|---------------|
| Cached query | **0ms** |
| First query | 50-100ms |
| Cache TTL | 1 minute |

The API uses Redis caching for instant responses on repeated queries.

---

## Error Handling

```javascript
try {
  const res = await fetch(`${API_BASE}/api/products/suggest?q=${query}&type=food`);
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Search failed');
  }
  
  return data;
} catch (error) {
  console.error('Search error:', error);
  // Show user-friendly error message
  return { suggestions: [], products: [], brands: [] };
}
```

---

## Best Practices

1. **Debounce** - Wait 150ms after last keystroke before calling API
2. **Minimum characters** - Only call suggest after 2+ characters
3. **Show trending** - Display trending when search box is empty/focused
4. **Cache locally** - Store recent searches in local storage
5. **Loading states** - Show spinner while fetching
6. **Error handling** - Gracefully handle network errors

---

## Integration with Shopping List

When integrating with the manual shopping list creation feature:

1. **Product Selection** - When user selects a product from search results, add to shopping list
2. **Quantity Input** - After selection, prompt for quantity/servings
3. **Quick Add** - Allow adding custom items not found in search
4. **Recent Items** - Show recently added items for quick re-add

### Example Integration

```typescript
// In ShoppingListScreen or AddItemModal
const handleProductSelect = (product: Product) => {
  // Add to shopping list with default quantity
  addToShoppingList({
    id: product.id,
    name: product.name,
    brand: product.brand,
    quantity: 1,
    unit: 'item',
    nutrition: product.nutrition,
    checked: false,
  });
  
  // Close search modal
  setShowSearch(false);
};
```

---

## Support

For issues or questions, contact the WIHY API team.
