# Create Meals API Requirements

This document outlines the API endpoints needed to make the Create Meals feature fully functional.

## Overview

The Create Meals screen allows users to:
- Create custom meal plans with nutrition information
- Add ingredients and preparation instructions
- Tag meals for categorization
- Use templates for quick meal creation
- Scan recipes from images
- Import recipes from URLs
- Save meals to their personal library

---

## Required API Endpoints

### 1. Save Custom Meal

**Endpoint:** `POST /api/meals/create`

**Description:** Creates a new custom meal and saves it to the user's meal library.

**Request Body:**
```json
{
  "user_id": "string",
  "meal_name": "Grilled Chicken Salad",
  "serving_size": 1,
  "nutrition": {
    "calories": 450,
    "protein": 35,
    "carbohydrates": 25,
    "fat": 15,
    "fiber": 5,
    "sugar": 3,
    "sodium": 450,
    "saturated_fat": 2
  },
  "ingredients": [
    {
      "name": "Chicken breast",
      "amount": "6",
      "unit": "oz"
    },
    {
      "name": "Mixed greens",
      "amount": "2",
      "unit": "cups"
    },
    {
      "name": "Olive oil",
      "amount": "1",
      "unit": "tbsp"
    }
  ],
  "tags": ["Lunch", "High Protein", "Low Carb"],
  "notes": "Grill chicken for 6-7 minutes per side. Toss with greens and dressing.",
  "preparation_time": 30,
  "created_at": "2026-01-03T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "meal_id": "meal_abc123",
  "message": "Meal saved successfully",
  "timestamp": "2026-01-03T00:00:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid nutrition data",
  "message": "Calories must be a positive number"
}
```

**Integration Point:** Line 94 in `CreateMeals.tsx` - `handleSaveMeal()` function

---

### 2. Get Meal Templates

**Endpoint:** `GET /api/meals/templates`

**Description:** Retrieves pre-configured meal templates that users can customize.

**Query Parameters:**
- `category` (optional): Filter by meal category (breakfast, lunch, dinner, snack)
- `tags` (optional): Filter by tags (high-protein, low-carb, vegan, etc.)
- `limit` (optional): Maximum number of templates to return (default: 20)

**Request Example:**
```
GET /api/meals/templates?category=lunch&tags=high-protein
```

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "template_001",
      "name": "Basic Protein Bowl",
      "category": "lunch",
      "description": "A balanced meal with lean protein and vegetables",
      "nutrition": {
        "calories": 500,
        "protein": 40,
        "carbohydrates": 45,
        "fat": 18,
        "fiber": 8,
        "sugar": 5
      },
      "ingredients": [
        {
          "name": "Grilled chicken",
          "amount": "6",
          "unit": "oz"
        },
        {
          "name": "Brown rice",
          "amount": "1",
          "unit": "cup"
        },
        {
          "name": "Steamed broccoli",
          "amount": "1",
          "unit": "cup"
        }
      ],
      "tags": ["High Protein", "Lunch", "Meal Prep"],
      "preparation_time": 25,
      "image_url": "https://example.com/templates/protein-bowl.jpg"
    },
    {
      "id": "template_002",
      "name": "Quick Breakfast Smoothie",
      "category": "breakfast",
      "description": "Nutrient-dense breakfast on the go",
      "nutrition": {
        "calories": 350,
        "protein": 25,
        "carbohydrates": 40,
        "fat": 10,
        "fiber": 6,
        "sugar": 20
      },
      "ingredients": [
        {
          "name": "Protein powder",
          "amount": "1",
          "unit": "scoop"
        },
        {
          "name": "Banana",
          "amount": "1",
          "unit": "medium"
        },
        {
          "name": "Almond milk",
          "amount": "1",
          "unit": "cup"
        },
        {
          "name": "Spinach",
          "amount": "1",
          "unit": "cup"
        }
      ],
      "tags": ["Breakfast", "Quick", "High Protein"],
      "preparation_time": 5,
      "image_url": "https://example.com/templates/smoothie.jpg"
    }
  ],
  "count": 2,
  "timestamp": "2026-01-03T00:00:00Z"
}
```

**Integration Point:** Line 338 in `CreateMeals.tsx` - "Use Template" button

---

### 3. Import Recipe from URL

**Endpoint:** `POST /api/meals/import-url`

**Description:** Extracts meal information from a recipe URL using web scraping or third-party recipe APIs.

**Request Body:**
```json
{
  "url": "https://www.example.com/recipes/grilled-chicken-salad",
  "user_id": "mobile-user",
  "auto_save": false
}
```

**Response:**
```json
{
  "success": true,
  "meal_data": {
    "name": "Grilled Chicken Caesar Salad",
    "description": "Classic Caesar salad with grilled chicken",
    "source_url": "https://www.example.com/recipes/grilled-chicken-salad",
    "nutrition": {
      "calories": 480,
      "protein": 38,
      "carbohydrates": 22,
      "fat": 26,
      "fiber": 4,
      "sugar": 3,
      "sodium": 890
    },
    "ingredients": [
      {
        "name": "Chicken breast",
        "amount": "8",
        "unit": "oz"
      },
      {
        "name": "Romaine lettuce",
        "amount": "4",
        "unit": "cups"
      },
      {
        "name": "Caesar dressing",
        "amount": "3",
        "unit": "tbsp"
      },
      {
        "name": "Parmesan cheese",
        "amount": "2",
        "unit": "tbsp"
      },
      {
        "name": "Croutons",
        "amount": "1/2",
        "unit": "cup"
      }
    ],
    "instructions": [
      "Season chicken with salt, pepper, and garlic powder",
      "Grill chicken for 6-7 minutes per side until internal temp reaches 165°F",
      "Let chicken rest for 5 minutes, then slice",
      "Toss lettuce with Caesar dressing",
      "Top with sliced chicken, parmesan, and croutons"
    ],
    "preparation_time": 30,
    "cooking_time": 15,
    "servings": 2,
    "suggested_tags": ["Lunch", "Dinner", "High Protein"],
    "image_url": "https://www.example.com/recipes/grilled-chicken-salad/image.jpg"
  },
  "timestamp": "2026-01-03T00:00:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Unable to parse recipe",
  "message": "The URL does not contain a valid recipe or is not accessible",
  "timestamp": "2026-01-03T00:00:00Z"
}
```

**Integration Point:** Line 348 in `CreateMeals.tsx` - "Import" button

---

### 4. Scan Recipe from Image

**Endpoint:** `POST /api/scan/recipe`

**Description:** Analyzes a recipe image (from cookbook, printed recipe, or screen) and extracts meal information using OCR and AI.

**Request Body:**
```json
{
  "image": "base64_encoded_image_data",
  "user_context": {
    "userId": "mobile-user",
    "scan_type": "recipe",
    "language": "en",
    "extract_nutrition": true,
    "extract_ingredients": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "meal_name": "Chocolate Chip Cookies",
    "confidence_score": 0.92,
    "detected_text": "Full OCR text extracted from image...",
    "ingredients": [
      {
        "name": "All-purpose flour",
        "amount": "2 1/4",
        "unit": "cups",
        "confidence": 0.95
      },
      {
        "name": "Butter",
        "amount": "1",
        "unit": "cup",
        "confidence": 0.98
      },
      {
        "name": "Brown sugar",
        "amount": "3/4",
        "unit": "cup",
        "confidence": 0.96
      },
      {
        "name": "White sugar",
        "amount": "3/4",
        "unit": "cup",
        "confidence": 0.97
      },
      {
        "name": "Eggs",
        "amount": "2",
        "unit": "large",
        "confidence": 0.99
      },
      {
        "name": "Vanilla extract",
        "amount": "2",
        "unit": "tsp",
        "confidence": 0.94
      },
      {
        "name": "Baking soda",
        "amount": "1",
        "unit": "tsp",
        "confidence": 0.93
      },
      {
        "name": "Salt",
        "amount": "1",
        "unit": "tsp",
        "confidence": 0.95
      },
      {
        "name": "Chocolate chips",
        "amount": "2",
        "unit": "cups",
        "confidence": 0.97
      }
    ],
    "nutrition_facts": {
      "serving_size": "1 cookie",
      "servings_per_recipe": 48,
      "calories": 180,
      "protein": 2,
      "carbohydrates": 24,
      "fat": 9,
      "fiber": 1,
      "sugar": 15,
      "sodium": 120,
      "saturated_fat": 5
    },
    "instructions": [
      "Preheat oven to 375°F (190°C)",
      "Cream together butter and sugars until fluffy",
      "Beat in eggs and vanilla",
      "Mix flour, baking soda, and salt in separate bowl",
      "Gradually blend dry ingredients into butter mixture",
      "Stir in chocolate chips",
      "Drop rounded tablespoons onto ungreased cookie sheets",
      "Bake 9-11 minutes or until golden brown",
      "Cool on baking sheet for 2 minutes before removing"
    ],
    "preparation_time": 15,
    "cooking_time": 10,
    "total_time": 25,
    "suggested_tags": ["Snack", "Dessert", "Baking"],
    "category": "dessert"
  },
  "image_url": "https://services.wihy.ai/scans/recipe_abc123.jpg",
  "timestamp": "2026-01-03T00:00:00Z",
  "processing_time": 1.2
}
```

**Integration Point:** Line 343 in `CreateMeals.tsx` - "Scan Recipe" button

---

### 5. Get User's Saved Meals

**Endpoint:** `GET /api/meals/user/{user_id}`

**Description:** Retrieves all meals saved by a specific user.

**Query Parameters:**
- `tags` (optional): Filter by tags (comma-separated)
- `search` (optional): Search by meal name
- `sort` (optional): Sort by `created_at`, `name`, `calories` (default: `created_at`)
- `order` (optional): `asc` or `desc` (default: `desc`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Request Example:**
```
GET /api/meals/user/mobile-user?tags=lunch,high-protein&sort=calories&order=asc&limit=10
```

**Response:**
```json
{
  "success": true,
  "meals": [
    {
      "id": "meal_abc123",
      "name": "Grilled Chicken Salad",
      "created_at": "2026-01-03T00:00:00Z",
      "updated_at": "2026-01-03T00:00:00Z",
      "serving_size": 1,
      "nutrition": {
        "calories": 450,
        "protein": 35,
        "carbohydrates": 25,
        "fat": 15,
        "fiber": 5,
        "sugar": 3
      },
      "ingredients": [
        {
          "name": "Chicken breast",
          "amount": "6",
          "unit": "oz"
        }
      ],
      "tags": ["Lunch", "High Protein", "Low Carb"],
      "notes": "Grill chicken for 6-7 minutes per side",
      "is_favorite": false,
      "times_logged": 12
    }
  ],
  "total_count": 45,
  "filtered_count": 1,
  "limit": 10,
  "offset": 0,
  "timestamp": "2026-01-03T00:00:00Z"
}
```

**Use Case:** Display user's meal library, enable meal selection for logging

---

### 6. Update Existing Meal

**Endpoint:** `PUT /api/meals/{meal_id}`

**Description:** Updates an existing meal's information.

**Request Body:**
```json
{
  "user_id": "mobile-user",
  "meal_name": "Updated Grilled Chicken Salad",
  "nutrition": {
    "calories": 425,
    "protein": 38,
    "carbohydrates": 20,
    "fat": 14
  },
  "tags": ["Lunch", "High Protein", "Low Carb", "Keto"],
  "notes": "Updated preparation notes"
}
```

**Response:**
```json
{
  "success": true,
  "meal_id": "meal_abc123",
  "message": "Meal updated successfully",
  "updated_at": "2026-01-03T00:00:00Z"
}
```

**Use Case:** Edit saved meals

---

### 7. Delete Meal

**Endpoint:** `DELETE /api/meals/{meal_id}`

**Description:** Removes a meal from the user's library.

**Request Body:**
```json
{
  "user_id": "mobile-user"
}
```

**Response:**
```json
{
  "success": true,
  "meal_id": "meal_abc123",
  "message": "Meal deleted successfully",
  "timestamp": "2026-01-03T00:00:00Z"
}
```

**Use Case:** Remove unwanted meals from library

---

### 8. Log Meal Consumption (Optional)

**Endpoint:** `POST /api/meals/log`

**Description:** Records when a user consumes a meal for tracking purposes.

**Request Body:**
```json
{
  "user_id": "mobile-user",
  "meal_id": "meal_abc123",
  "consumed_at": "2026-01-03T12:30:00Z",
  "serving_multiplier": 1.0,
  "meal_type": "lunch",
  "notes": "Had extra protein"
}
```

**Response:**
```json
{
  "success": true,
  "log_id": "log_xyz789",
  "message": "Meal consumption logged",
  "nutrition_contribution": {
    "calories": 450,
    "protein": 35,
    "carbohydrates": 25,
    "fat": 15
  },
  "daily_totals": {
    "calories": 1250,
    "protein": 95,
    "carbohydrates": 120,
    "fat": 45
  }
}
```

**Use Case:** Track meal consumption for nutrition dashboard

---

## Implementation Priority

### Phase 1 - Core Functionality
1. ✅ Save Custom Meal (`POST /api/meals/create`)
2. ✅ Get User's Saved Meals (`GET /api/meals/user/{user_id}`)
3. ✅ Update Existing Meal (`PUT /api/meals/{meal_id}`)
4. ✅ Delete Meal (`DELETE /api/meals/{meal_id}`)

### Phase 2 - Enhanced Features
5. Get Meal Templates (`GET /api/meals/templates`)
6. Scan Recipe from Image (`POST /api/scan/recipe`)

### Phase 3 - Advanced Features
7. Import Recipe from URL (`POST /api/meals/import-url`)
8. Log Meal Consumption (`POST /api/meals/log`)

---

## Data Validation Rules

### Meal Creation
- `meal_name`: Required, 1-100 characters
- `serving_size`: Required, positive number (0.25 - 20)
- `calories`: Required, positive integer (0 - 5000)
- `protein`: Required, positive number (0 - 200g)
- `carbohydrates`: Required, positive number (0 - 500g)
- `fat`: Required, positive number (0 - 200g)
- `tags`: Optional, array of strings (max 10 tags)
- `ingredients`: Optional, array of objects (max 50 ingredients)
- `notes`: Optional, max 1000 characters

### Nutrition Facts Constraints
- Per-100g values should not exceed:
  - Calories: 900 kcal
  - Protein: 100g
  - Carbohydrates: 100g
  - Fat: 100g
  - Fiber: 100g
  - Sugar: 100g

---

## Error Handling

### Common Error Codes
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (invalid user)
- `404` - Not Found (meal doesn't exist)
- `409` - Conflict (duplicate meal name)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "calories",
    "issue": "Value must be positive"
  },
  "timestamp": "2026-01-03T00:00:00Z"
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid user authentication token
2. **Authorization**: Users can only access/modify their own meals
3. **Rate Limiting**: 
   - Create/Update/Delete: 30 requests per minute
   - Get/List: 100 requests per minute
   - Image Scan: 10 requests per minute
4. **Input Sanitization**: All user input must be sanitized to prevent injection attacks
5. **File Upload**: Image scans should validate file type and size (max 10MB)

---

## Integration Code Examples

### Service File Structure
```typescript
// src/services/mealService.ts
import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

class MealService {
  async createMeal(mealData: MealData): Promise<MealResponse> {
    const endpoint = `${API_CONFIG.baseUrl}/api/meals/create`;
    // Implementation
  }

  async getMealTemplates(filters?: TemplateFilters): Promise<TemplatesResponse> {
    const endpoint = `${API_CONFIG.baseUrl}/api/meals/templates`;
    // Implementation
  }

  async scanRecipe(imageUri: string): Promise<RecipeScanResponse> {
    const endpoint = `${API_CONFIG.baseUrl}/api/scan/recipe`;
    // Implementation
  }

  async importFromUrl(url: string): Promise<RecipeImportResponse> {
    const endpoint = `${API_CONFIG.baseUrl}/api/meals/import-url`;
    // Implementation
  }
}

export const mealService = new MealService();
```

---

## Testing Requirements

### Unit Tests
- Validate request payload formatting
- Test error handling for invalid data
- Mock API responses

### Integration Tests
- End-to-end meal creation flow
- Template selection and customization
- Recipe scanning and import
- Meal library CRUD operations

### Performance Tests
- Image upload and processing time
- Recipe import response time
- List pagination efficiency

---

## Future Enhancements

1. **AI Meal Suggestions**: Generate meal recommendations based on user preferences and nutrition goals
2. **Meal Sharing**: Allow users to share custom meals with friends or community
3. **Nutrition Goal Tracking**: Integrate with daily calorie/macro targets
4. **Meal Planning Calendar**: Schedule meals in advance
5. **Grocery List Generation**: Auto-generate shopping lists from meal plans
6. **Barcode Integration**: Scan packaged foods to add as meals
7. **Recipe Video Analysis**: Extract recipe from cooking videos
8. **Collaborative Meal Planning**: Share meal plans with family members or coaches

---

## Questions for Backend Team

1. What authentication method should be used? (JWT, OAuth, API Key)
2. Should meals be versioned (track edit history)?
3. Is there a limit on number of meals per user?
4. Should meal templates be user-specific or global?
5. What image formats are supported for recipe scanning?
6. Is there OCR capability already implemented or needed?
7. Should we support meal duplication/cloning?
8. Are meal analytics needed (most consumed, favorites, etc.)?
