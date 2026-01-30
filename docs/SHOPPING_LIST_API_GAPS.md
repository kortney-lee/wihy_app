# Shopping List API Gaps Documentation

## Overview
This document lists all backend API endpoints that need to be implemented to support the full Shopping List feature, including manual list creation, item management, and dashboard integration.

**Status**: ✅ Complete - All APIs Implemented (January 30, 2026)

**Backend Implementation**:
- Routes: `routes/shoppingListRoutes.js`
- Service: `services/shopping/ShoppingListService.js`

**Related Files**:
- `mobile/src/screens/ShoppingListScreen.tsx` - Frontend implementation (Pattern A, dual-mode)
- `mobile/src/services/shoppingService.ts` - Frontend service layer (UPDATED with new methods)
- `mobile/src/screens/DashboardPage.tsx` - Dashboard integration

---

## Current API Status

### ✅ Existing Endpoints (Already Implemented)

These endpoints are already implemented and working:

| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/shopping-lists/:listId` | GET | Get shopping list by ID | Stack navigation from CreateMeals |
| `/api/shopping-lists` | POST | Create shopping list | CreateMeals meal plan generation |
| `/api/shopping-lists/:listId` | PUT | Update shopping list | Item check/uncheck status |
| `/api/shopping-lists/:listId` | DELETE | Delete shopping list | List cleanup |
| `/api/shopping-lists/generate` | POST | Generate from meal plan | CreateMeals integration |
| `/api/shopping-lists/:listId/categories` | GET | Get items by category | Category organization |
| `/api/shopping-lists/:listId/instacart` | POST | Send to Instacart | Instacart integration |
| `/api/shopping-lists?userId=&status=&limit=` | GET | Get user's shopping lists | **Dashboard mode loading** |

---

## ✅ All Endpoints Now Implemented (January 30, 2026)

All 5 previously missing endpoints have been implemented and are ready for use:

### Phase 1: Critical (✅ COMPLETE)
1. ✅ `GET /api/shopping-lists?userId=&status=` - Already existed
2. ✅ `POST /api/shopping-lists/manual` - Create manual list - **NOW READY**
3. ✅ `POST /api/shopping-lists/:listId/items` - Add item - **NOW READY**
4. ✅ `DELETE /api/shopping-lists/:listId/items/:itemId` - Delete item - **NOW READY**

### Phase 2: Enhanced Features (✅ COMPLETE)
5. ✅ `PUT /api/shopping-lists/:listId/items/:itemId` - Edit item - **NOW READY**
6. ✅ `PATCH /api/shopping-lists/:listId/items/bulk` - Bulk operations - **NOW READY**

---

## Frontend Service Methods (✅ IMPLEMENTED)

The following methods have been added to `mobile/src/services/shoppingService.ts`:

```typescript
// ✅ IMPLEMENTED - All methods now available

async createManualList(userId: string, data?: {...}): Promise<ShoppingList>
async addItemsToList(listId: string, items: ShoppingListItem[]): Promise<{...}>
async updateItem(listId: string, itemId: string, updates: Partial<ShoppingListItem>): Promise<{...}>
async deleteItem(listId: string, itemId: string): Promise<{...}>
async bulkUpdateItems(listId: string, operation: 'check' | 'uncheck' | 'delete', itemIds: string[]): Promise<{...}>
```

---

## ShoppingListScreen.tsx (✅ UPDATED)

The `handleAddItem()` function in ShoppingListScreen.tsx has been updated to use the real APIs:

```typescript
const handleAddItem = async () => {
  // Validation
  if (!newItemName.trim() || !newItemQuantity.trim()) {
    Alert.alert('Missing Information', 'Please enter item name and quantity');
    return;
  }

  if (!user?.id) {
    Alert.alert('Not Signed In', 'Please sign in to create shopping lists');
    return;
  }

  try {
    setLoading(true);
    
    // Create list if none exists
    let listId = activeList?.list_id;
    if (!listId) {
      const newList = await shoppingService.createManualList(user.id, {
        name: `Shopping List - ${new Date().toLocaleDateString()}`,
        budget: 150,
      });
      listId = newList.list_id!;
      setActiveList(newList);
    }
    
    // Add item to list
    const newItem = {
      name: newItemName,
      quantity: parseFloat(newItemQuantity),
      unit: newItemUnit,
      category: newItemCategory,
    };
    
    await shoppingService.addItemsToList(listId, [newItem]);
    await loadUserShoppingLists();
    
    // Reset form and close modal
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('oz');
    setNewItemCategory('Other');
    setShowAddItemModal(false);
    
    Alert.alert('Success', 'Item added to shopping list');
  } catch (error) {
    console.error('Error adding item:', error);
    Alert.alert('Error', 'Failed to add item. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

## 🔴 Missing Endpoints (Need Implementation)

These endpoints are required for manual shopping list features to work in dashboard mode:

### 1. Create Manual Shopping List
**Endpoint**: `POST /api/shopping-lists/manual`

**Purpose**: Create a new shopping list manually (not from meal plan)

**Request Body**:
```json
{
  "user_id": "string",
  "name": "string (optional, default: 'Shopping List - {date}')",
  "status": "active" | "completed" | "archived"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "list_id": "string",
    "user_id": "string",
    "name": "Shopping List - Jan 30, 2026",
    "status": "active",
    "items": [],
    "items_by_category": {},
    "total_items": 0,
    "checked_items": 0,
    "created_at": "2026-01-30T12:00:00Z",
    "updated_at": "2026-01-30T12:00:00Z"
  }
}
```

**Usage**: Called when user opens ShoppingListScreen in dashboard mode and has no active lists

---

### 2. Add Item to Shopping List
**Endpoint**: `POST /api/shopping-lists/:listId/items`

**Purpose**: Add a single item to an existing shopping list

**Request Body**:
```json
{
  "name": "string",
  "quantity": "number | string",
  "unit": "string (optional)",
  "category": "Proteins" | "Produce" | "Dairy" | "Grains" | "Pantry" | "Other",
  "brand_suggestion": "string (optional)",
  "notes": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "item_id": "string",
    "name": "Chicken Breast",
    "quantity": 2,
    "unit": "lbs",
    "category": "Proteins",
    "checked": false,
    "created_at": "2026-01-30T12:00:00Z"
  }
}
```

**Usage**: Called from ShoppingListScreen "Add Item" modal when user manually adds items

---

### 3. Update Shopping List Item
**Endpoint**: `PUT /api/shopping-lists/:listId/items/:itemId`

**Purpose**: Update an existing item (edit name, quantity, category, etc.)

**Request Body**:
```json
{
  "name": "string (optional)",
  "quantity": "number | string (optional)",
  "unit": "string (optional)",
  "category": "string (optional)",
  "checked": "boolean (optional)",
  "brand_suggestion": "string (optional)",
  "notes": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "item_id": "string",
    "name": "Organic Chicken Breast",
    "quantity": 1.5,
    "unit": "lbs",
    "category": "Proteins",
    "checked": false,
    "brand_suggestion": "Perdue",
    "updated_at": "2026-01-30T12:05:00Z"
  }
}
```

**Usage**: Called when user edits item details or checks/unchecks items

---

### 4. Delete Shopping List Item
**Endpoint**: `DELETE /api/shopping-lists/:listId/items/:itemId`

**Purpose**: Remove a single item from shopping list

**Response**:
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

**Usage**: Called when user swipes to delete item or removes checked items

---

### 5. Bulk Update Item Status
**Endpoint**: `PATCH /api/shopping-lists/:listId/items/bulk`

**Purpose**: Update multiple items at once (e.g., check/uncheck, delete)

**Request Body**:
```json
{
  "item_ids": ["string", "string", ...],
  "action": "check" | "uncheck" | "delete",
  "checked": "boolean (optional, for check/uncheck)"
}
```

**Response**:
```json
{
  "success": true,
  "updated_count": 5,
  "message": "5 items updated successfully"
}
```

**Usage**: Called when user checks/unchecks multiple items or clears completed items

---

## Database Schema Updates

To support these endpoints, the following database schema changes may be needed:

### Shopping Lists Table
```sql
CREATE TABLE shopping_lists (
  list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  meal_plan_id UUID REFERENCES meal_plans(id),  -- NULL for manual lists
  duration_days INTEGER,
  total_items INTEGER DEFAULT 0,
  checked_items INTEGER DEFAULT 0,
  estimated_total_cost DECIMAL(10, 2),
  instacart_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_status (user_id, status),
  INDEX idx_created_at (created_at DESC)
);
```

### Shopping List Items Table
```sql
CREATE TABLE shopping_list_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(list_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  checked BOOLEAN DEFAULT FALSE,
  brand_suggestion VARCHAR(255),
  store_suggestion VARCHAR(255),
  estimated_price DECIMAL(10, 2),
  notes TEXT,
  source_meals TEXT[],  -- For items from meal plans
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_list_category (list_id, category),
  INDEX idx_checked (checked)
);
```

---

## Implementation Priority

### Phase 1: Critical (Required for MVP)
1. ✅ `GET /api/shopping-lists?userId=&status=` - Already exists
2. 🔴 `POST /api/shopping-lists/manual` - Create manual list
3. 🔴 `POST /api/shopping-lists/:listId/items` - Add item
4. 🔴 `DELETE /api/shopping-lists/:listId/items/:itemId` - Delete item

### Phase 2: Enhanced Features
5. 🟡 `PUT /api/shopping-lists/:listId/items/:itemId` - Edit item
6. 🟡 `PATCH /api/shopping-lists/:listId/items/bulk` - Bulk operations

---

## Frontend Integration Plan

### Current Implementation Status

**ShoppingListScreen.tsx** is already updated with:
- ✅ Pattern A (View + ScrollView) for dashboard embedding
- ✅ Dual-mode support (Stack navigation + dashboard)
- ✅ Manual item entry UI with modal form
- ✅ Loading state for dashboard mode
- ✅ Category picker, quantity/unit inputs
- ✅ `handleAddItem()` function with API gap alert

**When APIs are ready**, update `handleAddItem()`:
```typescript
const handleAddItem = async () => {
  if (!newItemName.trim() || !newItemQuantity.trim()) {
    Alert.alert('Missing Information', 'Please enter item name and quantity');
    return;
  }

  try {
    setLoading(true);
    
    // Create list if none exists
    let listId = activeList?.list_id;
    if (!listId) {
      const newList = await shoppingService.createManualList(user.id);
      listId = newList.list_id;
      setActiveList(newList);
    }
    
    // Add item to list
    const newItem = {
      name: newItemName,
      quantity: parseFloat(newItemQuantity),
      unit: newItemUnit,
      category: newItemCategory,
    };
    
    await shoppingService.addItemToList(listId, newItem);
    await loadUserShoppingLists();
    
    // Reset form
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('oz');
    setNewItemCategory('Other');
    setShowAddItemModal(false);
    
    Alert.alert('Success', 'Item added to shopping list');
  } catch (error) {
    console.error('Error adding item:', error);
    Alert.alert('Error', 'Failed to add item');
  } finally {
    setLoading(false);
  }
};
```

**shoppingService.ts** needs these methods:
```typescript
// Add to ShoppingService class
async createManualList(userId: string, name?: string): Promise<ShoppingList> {
  const response = await fetchWithLogging(`${this.baseUrl}/api/shopping-lists/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      user_id: userId, 
      name: name || `Shopping List - ${new Date().toLocaleDateString()}`,
      status: 'active'
    }),
  });
  const data = await response.json();
  return data.data;
}

async addItemToList(listId: string, item: ShoppingListItem): Promise<any> {
  const response = await fetchWithLogging(
    `${this.baseUrl}/api/shopping-lists/${listId}/items`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }
  );
  return response.json();
}

async updateItem(listId: string, itemId: string, updates: Partial<ShoppingListItem>): Promise<any> {
  const response = await fetchWithLogging(
    `${this.baseUrl}/api/shopping-lists/${listId}/items/${itemId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }
  );
  return response.json();
}

async deleteItem(listId: string, itemId: string): Promise<any> {
  const response = await fetchWithLogging(
    `${this.baseUrl}/api/shopping-lists/${listId}/items/${itemId}`,
    { method: 'DELETE' }
  );
  return response.json();
}

async bulkUpdateItems(listId: string, itemIds: string[], action: 'check' | 'uncheck' | 'delete'): Promise<any> {
  const response = await fetchWithLogging(
    `${this.baseUrl}/api/shopping-lists/${listId}/items/bulk`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_ids: itemIds, action }),
    }
  );
  return response.json();
}
```

---

## Testing Checklist

Once backend APIs are implemented, test these flows:

### Dashboard Mode (New Functionality)
- [ ] Open ShoppingListScreen from Health Hub dashboard
- [ ] Verify it loads user's active shopping lists
- [ ] Click "Add Item" button → Modal opens
- [ ] Fill in item name, quantity, unit, category → Save
- [ ] Verify item appears in correct category
- [ ] Check/uncheck items → Status updates
- [ ] Edit existing item → Changes persist
- [ ] Delete item → Item removed
- [ ] Navigate back to Health Hub → Bottom nav visible

### Stack Mode (Existing - Must Still Work)
- [ ] Create meal plan in CreateMeals
- [ ] Generate shopping list from meal plan
- [ ] Navigate to ShoppingListScreen with route params
- [ ] Verify all items from meal plan appear
- [ ] Check items → Status updates
- [ ] Create Instacart link → Link generated
- [ ] Share list → Share modal works
- [ ] Back button → Returns to CreateMeals

### PlanMealScreen Integration
- [ ] Create manual meal in PlanMealScreen
- [ ] Add ingredients to meal
- [ ] Click "Add to Instacart" → Ingredients added to hook cart
- [ ] Verify shopping functionality still works (no ShoppingListScreen navigation needed)

---

## Additional Notes

### Item Categories
Standard categories (must match frontend):
- `Proteins` - Meat, poultry, fish, eggs, tofu
- `Produce` - Fruits, vegetables, fresh herbs
- `Dairy` - Milk, cheese, yogurt, butter
- `Grains` - Rice, pasta, bread, cereals
- `Pantry` - Canned goods, condiments, spices, oils
- `Other` - Everything else

### Data Migration
If converting existing shopping lists to support items table:
1. Backup existing `shopping_lists` table
2. Create `shopping_list_items` table
3. Migrate `items` JSON column to separate rows
4. Update foreign keys and indices
5. Test data integrity

### Performance Considerations
- Index `user_id + status` for fast dashboard queries
- Index `list_id + category` for category grouping
- Limit active lists per user (e.g., 10 max)
- Auto-archive completed lists after 30 days

---

## Questions for Backend Team

1. Should manual lists auto-create when user adds first item, or require explicit creation?
2. What's the max items per list limit?
3. Should we support list sharing between family members?
4. How long to retain completed/archived lists?
5. Can users have multiple active lists simultaneously?

---

**Last Updated**: January 30, 2026  
**Status**: 🔴 Awaiting backend implementation  
**Frontend Ready**: ✅ Yes - ShoppingListScreen fully implemented with API gap alerts
