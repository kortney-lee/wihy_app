# NutritionFacts Client Display Specification

This document outlines what the NutritionFacts screen displays and the expected API payload structure.

---

## Scan Types

The NutritionFacts screen handles 4 scan types:
- `barcode` - Product barcode scan
- `foodPhoto` - Food photo analysis
- `pill` - Medication/pill identification
- `label` - Product label reading

---

## Common Fields (All Scan Types)

### Product Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Product/food name |
| `brand` | string | ❌ | Brand name |
| `barcode` | string | ❌ | Barcode number |
| `category` | string | ❌ | Product category |

### Images
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `capturedImage` | string | ❌ | **User's captured photo URI** (prioritized for display) |
| `image_url` | string | ❌ | API product image URL (fallback) |
| `image_nutrition_url` | string | ❌ | Nutrition label image |
| `image_ingredients_url` | string | ❌ | Ingredients label image |

### Serving Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `servingSize.amount` | number | ✅ | Serving size amount |
| `servingSize.unit` | string | ✅ | Serving size unit (g, ml, cup, etc.) |
| `servings_per_container` | number | ❌ | Servings per container |
| `calories_per_serving` | number | ❌ | Calories per serving |

---

## Barcode Scan Fields

### Calories & Macronutrients
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `calories` | number | ✅ | Calories per 100g |
| `macros.protein` | number | ✅ | Protein in grams |
| `macros.carbs` | number | ✅ | Carbohydrates in grams |
| `macros.fat` | number | ✅ | Total fat in grams |
| `macros.fiber` | number | ✅ | Fiber in grams |
| `macros.sugar` | number | ❌ | Sugar in grams |
| `macros.saturated_fat` | number | ❌ | Saturated fat in grams |
| `macros.sodium` | number | ❌ | Sodium in mg |
| `macros.cholesterol` | number | ❌ | Cholesterol in mg |
| `macros.trans_fat` | number | ❌ | Trans fat in grams |
| `macros.potassium` | number | ❌ | Potassium in mg |

### Vitamins & Minerals
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nutrients` | NutrientData[] | ❌ | Array of nutrient data |

```typescript
interface NutrientData {
  name: string;        // "Vitamin C", "Iron", etc.
  amount: number;      // 10
  unit: string;        // "mg", "mcg"
  dailyValue: number;  // Percentage of daily value (0-100)
  category: 'vitamin' | 'mineral' | 'other';
}
```

### Health Scoring
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `health_score` | number | ❌ | 0-100 health score |
| `nutrition_score` | number | ❌ | Nutrition score |
| `grade` | string | ❌ | Letter grade (A, B, C, D, E) |
| `confidence` | number | ❌ | API confidence score |

### Processing Level
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nova_group` | number | ❌ | 1-4 NOVA processing level |
| `processing_level` | string | ❌ | Text description |
| `total_additives` | number | ❌ | Count of additives |
| `total_ingredients` | number | ❌ | Count of ingredients |

### Health Insights
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `health_summary` | string | ❌ | ~~Overall health summary text~~ **DEPRECATED** - Removed from UI, use Ask WiHY button instead |
| `health_alerts` | HealthAlertItem[] | ❌ | Warning alerts |
| `health_positive` | PositiveAspectItem[] | ❌ | Positive aspects |
| `health_concerns` | HealthAlertItem[] | ❌ | Areas of concern |

```typescript
interface HealthAlertItem {
  message: string;
  severity?: 'high' | 'medium' | 'low';
  recommendation?: string;
}

interface PositiveAspectItem {
  message: string;
  severity?: 'high' | 'medium' | 'low';
  benefit?: string;
}
```

### Ingredients
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ingredientsText` | string | ❌ | Raw ingredients text |
| `ingredients` | string[] | ❌ | Array of ingredient names |
| `allergens` | string[] | ❌ | Allergen warnings |
| `additives` | any[] | ❌ | Additive details |

### Boolean Flags
| Field | Type | Description |
|-------|------|-------------|
| `is_healthy` | boolean | Quick health check |
| `is_processed` | boolean | Is ultra-processed |
| `has_health_alerts` | boolean | Has warnings |

### Chat Integration
| Field | Type | Description |
|-------|------|-------------|
| `askWihy` | string | Suggested chat prompt for health analysis |

---

## Food Photo Scan Fields

Uses `foodPhotoData` object:

```typescript
interface FoodPhotoData {
  summary?: string;              // AI summary of the food
  detectedFoods?: DetectedFood[]; // Array of detected foods
  detectedText?: string[];       // Text detected in image
  confidenceScore?: number;      // 0-1 confidence
  healthScore?: number;          // 0-100 health score
  nutritionGrade?: {
    grade?: string;              // "A", "B", etc.
    description?: string;
  };
  novaGroup?: number;            // 1-4 processing level
  nutritionAnalysis?: any;       // Detailed nutrition
  healthAlerts?: any[];          // Warnings
  positiveAspects?: any[];       // Good things
  areasOfConcern?: any[];        // Concerns
  servingRecommendations?: any;  // Serving suggestions
  charts?: any;                  // Chart data
  metadata?: any;                // Additional metadata
}

interface DetectedFood {
  name: string;
  category?: string;
  confidence?: number;
}
```

---

## Pill Scan Fields

Uses `pillData` object:

```typescript
interface PillData {
  scanId?: string;
  matches?: PillMatch[];
  topMatch?: {
    name?: string;
    brandName?: string;
    genericName?: string;
    imprint?: string;
    color?: string;
    shape?: string;
    rxcui?: string;
    confidence?: number;
    dosage?: string;
    manufacturer?: string;
  };
}
```

---

## Label Scan Fields

Uses `labelData` object (same structure as foodPhotoData):

```typescript
interface LabelData {
  productName?: string;
  summary?: string;
  detectedText?: string[];
  detectedFoods?: any[];
  healthScore?: number;
  nutritionGrade?: { grade?: string; description?: string };
  novaGroup?: number;
  nutritionAnalysis?: any;
  healthAlerts?: any[];
  positiveAspects?: any[];
  areasOfConcern?: any[];
  servingRecommendations?: any;
  charts?: any;
  metadata?: any;
}
```

---

## Image Upload Payload (upload_only flag)

When uploading user's captured barcode photo for storage:

### Request
```
POST /api/scan
Content-Type: application/json
```

```json
{
  "image": "data:image/jpeg;base64,...",
  "barcode": "0123456789012",
  "upload_only": true,
  "user_context": {
    "userId": "user@email.com",
    "scan_type": "barcode",
    "timestamp": "2026-01-11T12:00:00.000Z"
  }
}
```

### Response
```json
{
  "success": true,
  "image_url": "https://storage.wihy.ai/scans/user123/barcode_0123456789012_1736600400.jpg"
}
```

### Backend Behavior with `upload_only: true`
1. Store the image to S3/storage
2. Associate with barcode and user
3. Return the permanent URL
4. **Skip** the full analysis/processing
5. **Skip** OpenAI/ML calls

This is used when:
- User scans a barcode → We already have nutrition data from database
- We just want to store their photo of the actual product
- Don't need AI analysis (we have barcode lookup data)

---

## Example API Response (Barcode Scan v3.0)

```json
{
  "success": true,
  "product_name": "Organic Greek Yogurt",
  "brand": "Chobani",
  "barcode": "0818290010012",
  "categories": ["Dairy", "Yogurt"],
  
  "image_url": "https://images.openfoodfacts.org/...",
  
  "calories": 100,
  "calories_per_serving": 150,
  "serving_size": "170g",
  "servings_per_container": 1,
  
  "protein_g": 17,
  "carbs_g": 6,
  "fat_g": 0,
  "fiber_g": 0,
  "sugar_g": 4,
  "saturated_fat_g": 0,
  "sodium_mg": 65,
  
  "health_score": 85,
  "nutrition_score": 82,
  "nutrition_grade": "A",
  "nova_group": 1,
  "processing_level": "Unprocessed or minimally processed",
  "total_additives": 0,
  "total_ingredients": 3,
  
  "summary": "Excellent source of protein with minimal processing.",
  "health_alerts": [],
  "positive_aspects": [
    { "message": "High protein content", "benefit": "Supports muscle health" },
    { "message": "Low sugar", "benefit": "Better for blood sugar control" }
  ],
  "areas_of_concern": [],
  
  "ingredients_text": "Cultured nonfat milk, live cultures",
  "allergens": ["milk"],
  
  "is_healthy": true,
  "is_processed": false,
  "has_health_alerts": false,
  
  "ask_wihy": "Tell me more about Chobani Organic Greek Yogurt",
  
  "timestamp": "2026-01-11T12:00:00.000Z",
  "processing_time": 245
}
```

---

## Field Mapping: API → Client

| API Field (v3.0) | Client Field |
|------------------|--------------|
| `product_name` | `name` |
| `brand` | `brand` |
| `barcode` | `barcode` |
| `image_url` | `image_url` |
| `calories` | `calories` |
| `protein_g` | `macros.protein` |
| `carbs_g` | `macros.carbs` |
| `fat_g` | `macros.fat` |
| `fiber_g` | `macros.fiber` |
| `sugar_g` | `macros.sugar` |
| `saturated_fat_g` | `macros.saturated_fat` |
| `sodium_mg` | `macros.sodium` |
| `health_score` | `health_score` |
| `nutrition_grade` | `grade` |
| `nova_group` | `nova_group` |
| `summary` | `health_summary` |
| `health_alerts` | `health_alerts` |
| `positive_aspects` | `health_positive` |
| `areas_of_concern` | `health_concerns` |
| `ingredients_text` | `ingredientsText` |
| `allergens` | `allergens` |
| `ask_wihy` | `askWihy` |
