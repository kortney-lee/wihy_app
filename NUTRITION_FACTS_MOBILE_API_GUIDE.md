# NutritionFacts Mobile API Guide

## Overview

This document explains how the NutritionFacts.tsx component's API architecture works for mobile platforms. The system uses a multi-layered API approach designed to work seamlessly across both web and mobile environments using the same endpoints.

---

## API Architecture

### Base API URL
```
https://services.wihy.ai
```

### Primary Endpoints

1. **`/api/scan`** - Scanner API (barcode & image scanning)
2. **`/api/ask`** - Conversational AI (chat follow-ups)
3. **`/api/openfda/ingredient/{ingredient}`** - FDA ingredient analysis

---

## 1. Barcode Scanning Flow (Mobile)

### User Flow
```
User taps Scan button
    ↓
Camera opens (native device camera via Capacitor)
    ↓
User scans barcode (e.g., "012345678901")
    ↓
Barcode detected → API call to /api/scan
    ↓
Product data returned → Navigate to NutritionFacts page
    ↓
Display nutrition information
```

### Implementation

**File**: `client/src/pages/NutritionFacts.tsx` (lines 493-530)

```typescript
const handleNewScan = async () => {
  await scanningService.openCameraWithBarcodeScanning(
    async (barcode: string) => {
      // Step 1: Scan barcode via wihyScanningService
      const barcodeResult = await wihyScanningService.scanBarcode(barcode);
      
      // Step 2: Normalize the result to standard format
      const newNutritionfacts = normalizeBarcodeScan(barcodeResult);
      
      // Step 3: Navigate to nutrition facts page
      navigate('/nutritionfacts', {
        state: {
          nutritionfacts: newNutritionfacts,
          sessionId: barcodeResult.sessionId,
          fromChat: false,
          isNewScan: true
        }
      });
    }
  );
}
```

### API Call Details

**File**: `client/src/services/wihyScanningService.ts` (lines 349-395)

**Request:**
```typescript
POST https://services.wihy.ai/api/scan

Headers:
  Content-Type: application/json

Body:
{
  "barcode": "012345678901",
  "user_context": {
    "userId": "web-user",
    "trackHistory": true,
    "health_goals": ["nutrition_analysis"],
    "dietary_restrictions": []
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "product": {
    "name": "Organic Almond Milk",
    "brand": "Whole Foods",
    "barcode": "012345678901",
    "categories": ["Beverages", "Plant-based milk"],
    "nova_group": 2,
    "image_url": "https://..."
  },
  "nutrition": {
    "score": 85,
    "grade": "B",
    "per_100g": {
      "energy_kcal": 45,
      "fat": 2.5,
      "saturated_fat": 0.2,
      "carbohydrates": 3.5,
      "sugars": 2.0,
      "fiber": 0.5,
      "proteins": 1.5,
      "salt": 0.12,
      "sodium": 48
    },
    "daily_values": {
      "energy": 2,
      "fat": 3,
      "saturated_fat": 1
    }
  },
  "health_score": 85,
  "nova_group": 2,
  "health_analysis": {
    "alerts": [
      {
        "type": "low_sugar",
        "message": "Low in added sugars",
        "severity": "positive"
      }
    ],
    "recommendations": [
      "Good source of calcium",
      "Low in calories"
    ],
    "processing_level": {
      "nova_group": 2,
      "description": "Processed culinary ingredients",
      "details": "Minimally processed with few additives"
    }
  },
  "scan_metadata": {
    "scan_id": "scan_1735401234567",
    "timestamp": "2025-12-28T10:30:00Z",
    "confidence_score": 0.95,
    "data_sources": ["openfoodfacts", "usda"],
    "session_id": "barcode_012345678901_1735401234567",
    "ingredients_text": "Almond milk (filtered water, almonds), calcium...",
    "ask_wihy": "Tell me about the health benefits of Organic Almond Milk"
  }
}
```

### Response Structure

```typescript
interface BarcodeScanResult {
  success: boolean;
  product: {
    name: string;
    brand: string;
    barcode: string;
    categories: string[];
    nova_group: number;        // 1-4 (processing level)
    image_url?: string;
  };
  nutrition: {
    score: number;             // 0-100
    grade: string;             // A, B, C, D, E
    per_100g: {
      energy_kcal: number;
      fat: number;
      saturated_fat: number;
      carbohydrates: number;
      sugars: number;
      fiber: number;
      proteins: number;
      salt: number;
      sodium: number;
    };
    daily_values: {
      energy: number;          // % of daily value
      fat: number;
      saturated_fat: number;
    };
  };
  health_score?: number;       // 0-100
  nova_group?: number;         // 1-4
  health_analysis?: {
    alerts: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    recommendations: string[];
    processing_level: {
      nova_group: number;
      description: string;
      details: string;
    };
  };
  scan_metadata?: {
    scan_id: string;
    timestamp: string;
    confidence_score: number;
    data_sources: string[];
    session_id?: string;       // For chat continuity
    ingredients_text?: string;
    ask_wihy?: string;         // Pre-formatted chat query
  };
  error?: string;
}
```

---

## 2. Image Scanning Flow (Mobile)

### User Flow
```
User taps Scan button → Selects "Take Photo"
    ↓
Camera opens (native camera)
    ↓
User captures food photo
    ↓
Image converted to base64 → API call to /api/scan
    ↓
AI analyzes image → Identifies food items
    ↓
Nutrition data returned → Display in NutritionFacts
```

### Implementation

**File**: `client/src/services/wihyScanningService.ts` (lines 188-261)

```typescript
async scanImage(image: File | string, userContext?: any): Promise<ScanResult> {
  // Convert File to base64
  let imageData: string;
  if (image instanceof File) {
    imageData = await this.fileToBase64(image);
  } else {
    imageData = image;
  }
  
  // POST to /api/scan with image
  const response = await fetch(`${this.baseUrl}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData,
      context: 'Image analysis',
      userContext: {
        health_goals: ['nutrition_analysis'],
        dietary_restrictions: [],
        ...userContext
      }
    })
  });
  
  const scannerData = await response.json();
  
  return {
    success: true,
    analysis: {
      summary: scannerData.analysis?.summary || 'Image analysis completed',
      recommendations: scannerData.analysis?.recommendations || [],
      confidence_score: scannerData.confidence_score || 0.8,
      charts: scannerData.charts_data,
      metadata: {
        health_score: scannerData.health_score,
        nova_group: scannerData.nova_group,
        product_info: scannerData.product_info,
        nutrition_facts: scannerData.nutrition_facts
      }
    },
    timestamp: scannerData.timestamp || new Date().toISOString(),
    processing_time: scannerData.processing_time
  };
}
```

**Request:**
```typescript
POST https://services.wihy.ai/api/scan

Headers:
  Content-Type: application/json

Body:
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
  "context": "Image analysis: food_photo.jpg",
  "userContext": {
    "health_goals": ["nutrition_analysis"],
    "dietary_restrictions": []
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "analysis": {
    "summary": "Detected: Grilled chicken breast with vegetables",
    "recommendations": [
      "Good source of lean protein",
      "Rich in vitamins from vegetables"
    ],
    "confidence_score": 0.87,
    "metadata": {
      "health_score": 78,
      "nova_group": 1,
      "product_info": {
        "name": "Grilled Chicken with Vegetables",
        "detected_items": ["chicken", "broccoli", "carrots"]
      },
      "nutrition_facts": {
        "calories": 285,
        "protein_g": 42,
        "carbohydrates_g": 12,
        "fat_g": 8
      }
    }
  },
  "charts_data": { /* chart configurations */ },
  "timestamp": "2025-12-28T10:30:00Z",
  "processing_time": 2.3
}
```

---

## 3. Chat/Follow-up Questions (Mobile)

### User Flow
```
User views nutrition facts
    ↓
Taps "Chat" or swipes left to chat view
    ↓
Asks question: "Is this healthy for weight loss?"
    ↓
API call to /api/ask with session context
    ↓
AI response considers scanned product
    ↓
Display conversational answer
```

### Implementation

**File**: `client/src/pages/NutritionFacts.tsx` (lines 420-460)

```typescript
const preloadChatResponse = async (askWihyQuery: string) => {
  if (chatPreloaded || chatLoading || !askWihyQuery) return;
  
  setChatLoading(true);
  
  try {
    const response = await fetch('https://services.wihy.ai/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: askWihyQuery,
        context: {
          product_name: nutritionfacts?.name,
          nutrition_data: nutritionfacts,
          session_id: sessionId  // Maintains conversation context
        }
      })
    });
    
    const data = await response.json();
    setChatResponse(data.response || data.answer);
    setChatPreloaded(true);
  } catch (error) {
    console.error('Error pre-loading chat response:', error);
  }
}
```

**Request:**
```typescript
POST https://services.wihy.ai/api/ask

Headers:
  Content-Type: application/json

Body:
{
  "query": "Is this healthy for weight loss?",
  "context": {
    "product_name": "Organic Almond Milk",
    "nutrition_data": {
      "name": "Organic Almond Milk",
      "healthScore": 85,
      "novaGroup": 2,
      "nutrition": { /* full nutrition object */ }
    },
    "session_id": "barcode_012345678901_1735401234567"
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "response": "Yes, Organic Almond Milk can be a good choice for weight loss! With only 45 calories per 100ml and low sugar content (2g), it's a lighter alternative to dairy milk. The healthy fats from almonds help with satiety, keeping you fuller longer. Just watch your portion sizes and check for added sugars in other brands.",
  "session_id": "barcode_012345678901_1735401234567",
  "timestamp": "2025-12-28T10:35:00Z"
}
```

### Key Feature: Session Continuity

The `session_id` created during the initial barcode scan is passed to all subsequent `/api/ask` calls. This allows the AI to:
- Remember what product was scanned
- Provide context-aware answers
- Reference specific nutrition data
- Maintain conversation flow across multiple questions

---

## 4. FDA Ingredient Analysis

### User Flow
```
User views ingredient list
    ↓
Taps specific ingredient (e.g., "Sugar")
    ↓
API call to /api/openfda/ingredient/sugar
    ↓
FDA database queried for safety data
    ↓
Display: safety score, recalls, adverse events
```

### State Management

**File**: `client/src/pages/NutritionFacts.tsx` (lines 91-96)

The component uses a sophisticated state structure to track individual ingredient analyses:

```typescript
interface IngredientAnalysisState {
  loading: boolean;                              // Global loading flag (deprecated)
  analyses: IngredientAnalysis[];                // Array of all analyses (deprecated)
  error: string | null;                          // Global error message
  loadingIngredients: Set<string>;               // Track which ingredients are being analyzed
  analyzedIngredients: Map<string, IngredientAnalysis>; // Store individual results by ingredient name
}

const [ingredientAnalysis, setIngredientAnalysis] = useState<IngredientAnalysisState>({
  loading: false,
  analyses: [],
  error: null,
  loadingIngredients: new Set(),
  analyzedIngredients: new Map()
});
```

**Key Design Decisions:**
- **Set for loading state**: Allows multiple ingredients to be analyzed simultaneously
- **Map for results**: O(1) lookup by ingredient name, prevents duplicates
- **Individual tracking**: Each ingredient has independent loading/success/error states

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  NutritionFacts Component State                             │
│                                                              │
│  ingredientAnalysis: {                                       │
│    loadingIngredients: Set(['Sugar', 'Salt']),              │
│    analyzedIngredients: Map({                               │
│      'Water': { success: true, safety_score: 95, ... },    │
│      'Sugar': { success: true, safety_score: 65, ... }     │
│    })                                                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
         │
         │ User clicks "Sugar" ingredient
         ▼
┌─────────────────────────────────────────────────────────────┐
│  analyzeIndividualIngredient('Sugar')                        │
│                                                              │
│  1. Check if already analyzed or loading                     │
│  2. Add to loadingIngredients Set                           │
│  3. Call analyzeIngredient('Sugar')                         │
│  4. Update analyzedIngredients Map with result              │
│  5. Remove from loadingIngredients Set                      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  analyzeIngredient('Sugar')                                  │
│                                                              │
│  Try: GET /api/openfda/ingredient/Sugar                     │
│       ↓                                                      │
│    ✅ Success → Return FDA data                             │
│    ❌ Error → fallbackToWihyLookup('Sugar')                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (if FDA fails)
┌─────────────────────────────────────────────────────────────┐
│  fallbackToWihyLookup('Sugar')                               │
│                                                              │
│  POST /api/ask                                               │
│  Body: {                                                     │
│    query: "Tell me about the ingredient: Sugar...",         │
│    context: { ingredient_lookup: true }                     │
│  }                                                           │
│       ↓                                                      │
│  Return Wihy AI analysis                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  State Updated                                               │
│                                                              │
│  analyzedIngredients.set('Sugar', {                         │
│    ingredient: 'Sugar',                                     │
│    success: true,                                           │
│    safety_score: 65,                                        │
│    risk_level: 'moderate',                                  │
│    recall_count: 0,                                         │
│    adverse_event_count: 3,                                  │
│    fda_status: 'GRAS',                                      │
│    analysis_summary: '...'                                  │
│  })                                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Component Re-renders                                        │
│                                                              │
│  - Ingredient card shows analysis inline                     │
│  - Safety score badge displays                              │
│  - Risk color applied (green/yellow/orange/red)             │
│  - Summary stats updated                                    │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

**File**: `client/src/pages/NutritionFacts.tsx` (lines 274-350)

```typescript
const analyzeIngredient = async (ingredient: string): Promise<IngredientAnalysis> => {
  try {
    // Primary: Try FDA database
    const response = await fetch(
      `${WIHY_API_BASE}/api/openfda/ingredient/${encodeURIComponent(ingredient.trim())}`
    );
    
    if (!response.ok) {
      // Fallback: Use Wihy AI for ingredient analysis
      return await fallbackToWihyLookup(ingredient.trim());
    }
    
    const data = await response.json();
    return {
      ingredient: ingredient.trim(),
      success: data.success || true,
      safety_score: data.safety_score || 0,
      risk_level: data.risk_level || 'low',
      recall_count: data.recall_count || 0,
      adverse_event_count: data.adverse_event_count || 0,
      recommendations: data.recommendations || [],
      fda_status: data.fda_status || 'No data available',
      analysis_summary: data.analysis_summary || 'No analysis available'
    };
  } catch (error: any) {
    // Network errors also get wihy fallback
    return await fallbackToWihyLookup(ingredient.trim());
  }
};

// Fallback to Wihy AI when FDA database has no data
const fallbackToWihyLookup = async (ingredient: string): Promise<IngredientAnalysis> => {
  const response = await fetch(`${WIHY_API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `Tell me about the ingredient: ${ingredient}. Is it safe? What should I know about it?`,
      context: { ingredient_lookup: true }
    })
  });

  const data = await response.json();
  return {
    ingredient: ingredient,
    success: true,
    safety_score: 0,
    risk_level: 'low',
    recall_count: 0,
    adverse_event_count: 0,
    recommendations: [],
    fda_status: 'Wihy Analysis',
    analysis_summary: data.response || data.answer
  };
};
```

**Request:**
```typescript
GET https://services.wihy.ai/api/openfda/ingredient/sugar
```

**Response:**
```typescript
{
  "success": true,
  "ingredient": "sugar",
  "safety_score": 65,
  "risk_level": "moderate",
  "recall_count": 0,
  "adverse_event_count": 3,
  "recommendations": [
    {
      "type": "consumption",
      "message": "Limit daily intake to less than 10% of total calories"
    },
    {
      "type": "health_concern",
      "message": "High consumption linked to obesity and diabetes risk"
    }
  ],
  "fda_status": "Generally Recognized as Safe (GRAS)",
  "analysis_summary": "Sugar is a GRAS substance but excessive consumption is associated with various health concerns including obesity, type 2 diabetes, and dental issues. The FDA recommends limiting added sugar intake.",
  "timestamp": "2025-12-28T10:40:00Z"
}
```

### Fallback Strategy

If FDA database returns no results or errors:
1. Automatically falls back to `/api/ask` endpoint
2. Uses Wihy AI to analyze the ingredient
3. Returns conversational analysis instead of structured FDA data
4. Prevents user-facing errors

---

## 5. Rendering Logic: How Analysis Results Display

### Ingredient List Rendering

**File**: `client/src/pages/NutritionFacts.tsx` (lines 876-965)

Each ingredient is rendered as a clickable card that shows analysis results inline:

```typescript
{product.ingredientsText.split(',').map((ingredient, idx) => {
  const trimmedIngredient = ingredient.trim();
  
  // 1️⃣ RETRIEVE ANALYSIS DATA from state Map
  const analysis = ingredientAnalysis.analyzedIngredients.get(trimmedIngredient);
  const isLoading = ingredientAnalysis.loadingIngredients.has(trimmedIngredient);
  
  // 2️⃣ DETERMINE COLOR SCHEME based on risk level
  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low': 
        return { 
          bg: 'from-green-50 to-emerald-50', 
          border: 'border-green-400', 
          text: 'text-green-600', 
          badge: 'bg-green-500' 
        };
      case 'moderate': 
        return { 
          bg: 'from-yellow-50 to-amber-50', 
          border: 'border-yellow-400', 
          text: 'text-yellow-600', 
          badge: 'bg-yellow-500' 
        };
      case 'high': 
        return { 
          bg: 'from-orange-50 to-red-50', 
          border: 'border-orange-400', 
          text: 'text-orange-600', 
          badge: 'bg-orange-500' 
        };
      case 'very_high': 
        return { 
          bg: 'from-red-50 to-pink-50', 
          border: 'border-red-400', 
          text: 'text-red-600', 
          badge: 'bg-red-500' 
        };
      default: 
        return { 
          bg: 'from-blue-50 to-indigo-50', 
          border: 'border-blue-400', 
          text: 'text-blue-600', 
          badge: 'bg-blue-500' 
        };
    }
  };
  
  const colors = analysis ? getRiskColor(analysis.risk_level) : defaultColors[idx % 6];
  
  // 3️⃣ RENDER INGREDIENT CARD with conditional states
  return (
    <div 
      key={idx} 
      className={`p-3 bg-gradient-to-r ${colors.bg} rounded-lg border-l-4 ${colors.border} cursor-pointer`}
      onClick={() => !isLoading && !analysis && analyzeIndividualIngredient(trimmedIngredient)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{trimmedIngredient}</span>
        
        {/* 4️⃣ LOADING SPINNER - shows while API call in progress */}
        {isLoading && (
          <svg className="w-4 h-4 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        )}
        
        {/* 5️⃣ SUCCESS BADGE - shows safety score when analysis complete */}
        {analysis && analysis.success && (
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full ${colors.badge} flex items-center justify-center text-white text-xs font-bold`}>
              {analysis.safety_score || '?'}
            </span>
            <span className={`text-xs font-bold ${colors.text}`}>
              {analysis.risk_level.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* 6️⃣ DETAILED ANALYSIS - expands inline after successful analysis */}
      {analysis && analysis.success && (
        <div className="mt-2 pt-2 border-t border-white/50 text-xs text-gray-600 space-y-1">
          <p><strong>FDA Status:</strong> {analysis.fda_status}</p>
          
          {/* Show recall/adverse event counts if any */}
          {(analysis.recall_count > 0 || analysis.adverse_event_count > 0) && (
            <div className="flex gap-3">
              {analysis.recall_count > 0 && (
                <span className="text-red-600">⚠️ {analysis.recall_count} recalls</span>
              )}
              {analysis.adverse_event_count > 0 && (
                <span className="text-orange-600">⚠️ {analysis.adverse_event_count} events</span>
              )}
            </div>
          )}
          
          {/* Summary from FDA or Wihy AI */}
          {analysis.analysis_summary && (
            <p className="italic">{analysis.analysis_summary}</p>
          )}
        </div>
      )}
      
      {/* 7️⃣ ERROR STATE - shows friendly message on failure */}
      {analysis && !analysis.success && (
        <div className="mt-2 pt-2 border-t border-white/50 text-xs text-gray-500">
          {analysis.error === 'No results found' ? 'No results found' : (analysis.error || 'Analysis unavailable')}
        </div>
      )}
    </div>
  );
})}
```

### Data Nesting Structure

The analysis data is nested as follows:

```typescript
// TOP LEVEL: Component State
ingredientAnalysis: {
  
  // LOADING TRACKER: Set of ingredient names currently being analyzed
  loadingIngredients: Set<string>
    ├─ "Sugar"
    ├─ "Salt"
    └─ "Water"
  
  // RESULTS STORAGE: Map of ingredient name → analysis object
  analyzedIngredients: Map<string, IngredientAnalysis>
    ├─ "Water": {
    │    ingredient: "Water",
    │    success: true,
    │    safety_score: 95,
    │    risk_level: "low",
    │    recall_count: 0,
    │    adverse_event_count: 0,
    │    recommendations: [],
    │    fda_status: "GRAS - Generally Recognized as Safe",
    │    analysis_summary: "Water is essential for life..."
    │  }
    │
    ├─ "Sugar": {
    │    ingredient: "Sugar",
    │    success: true,
    │    safety_score: 65,
    │    risk_level: "moderate",
    │    recall_count: 0,
    │    adverse_event_count: 3,
    │    recommendations: [
    │      {
    │        type: "consumption",
    │        message: "Limit daily intake to less than 10% of total calories"
    │      },
    │      {
    │        type: "health_concern",
    │        message: "High consumption linked to obesity and diabetes risk"
    │      }
    │    ],
    │    fda_status: "GRAS",
    │    analysis_summary: "Sugar is a GRAS substance but excessive consumption..."
    │  }
    │
    └─ "Salt": {
         ingredient: "Salt",
         success: true,
         safety_score: 70,
         risk_level: "moderate",
         ...
       }
}
```

### Rendering State Transitions

```
┌─────────────────────────────────────────┐
│  INITIAL STATE (Not Analyzed)           │
│  ┌───────────────────────────────────┐  │
│  │  Sugar                            │  │
│  │                                   │  │
│  │  [Blue card, no badge]            │  │
│  └───────────────────────────────────┘  │
│  ↓ User clicks                          │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  LOADING STATE                           │
│  ┌───────────────────────────────────┐  │
│  │  Sugar              🔄 [spinner]  │  │
│  │                                   │  │
│  │  [Blue card + loading spinner]    │  │
│  └───────────────────────────────────┘  │
│  ↓ API returns data                     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  SUCCESS STATE (FDA Data)                │
│  ┌───────────────────────────────────┐  │
│  │  Sugar              [65] MODERATE │  │
│  │  ─────────────────────────────    │  │
│  │  FDA Status: GRAS                 │  │
│  │  ⚠️ 3 adverse events              │  │
│  │  "Excessive consumption..."        │  │
│  │                                   │  │
│  │  [Yellow card + safety badge]     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Summary Statistics Rendering

**File**: `client/src/pages/NutritionFacts.tsx` (lines 974-1002)

After ingredients are analyzed, summary stats are calculated in real-time:

```typescript
{ingredientAnalysis.analyzedIngredients.size > 0 && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
      {/* Total Analyzed Count */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-blue-600">
          {ingredientAnalysis.analyzedIngredients.size}
        </div>
        <div className="text-xs text-blue-600">Analyzed</div>
      </div>
      
      {/* Average Safety Score - calculated from Map values */}
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-green-600">
          {Math.round(
            Array.from(ingredientAnalysis.analyzedIngredients.values())
              .reduce((sum, a) => sum + a.safety_score, 0) / 
            ingredientAnalysis.analyzedIngredients.size
          )}
        </div>
        <div className="text-xs text-green-600">Avg Safety</div>
      </div>
      
      {/* High Risk Count - filter by risk_level */}
      <div className="bg-orange-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-orange-600">
          {Array.from(ingredientAnalysis.analyzedIngredients.values())
            .filter(a => a.risk_level === 'high' || a.risk_level === 'very_high')
            .length}
        </div>
        <div className="text-xs text-orange-600">High Risk</div>
      </div>
      
      {/* Total Issues - sum of recalls + adverse events */}
      <div className="bg-red-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-red-600">
          {Array.from(ingredientAnalysis.analyzedIngredients.values())
            .reduce((sum, a) => sum + a.recall_count + a.adverse_event_count, 0)}
        </div>
        <div className="text-xs text-red-600">Total Issues</div>
      </div>
    </div>
  </div>
)}
```

**Data Source for Stats:**
- All stats calculated from `ingredientAnalysis.analyzedIngredients.values()`
- Real-time updates as new ingredients are analyzed
- Uses Array methods: `reduce()`, `filter()`, `length`

### Key Rendering Features

1. **On-Demand Analysis**: Ingredients only analyzed when clicked (no auto-analysis)
2. **Visual Feedback**: Spinner shows during API call, badge appears on completion
3. **Color Coding**: Card background changes based on risk level (green/yellow/orange/red)
4. **Inline Expansion**: Analysis details appear under ingredient name (no modals)
5. **Persistent State**: Once analyzed, results stay visible (stored in Map)
6. **Real-Time Stats**: Summary calculations update as each ingredient completes

---

## Mobile-Specific Features

### 1. Platform Detection

**File**: `client/src/services/shared/platformDetectionService.ts`

```typescript
export class PlatformDetectionService {
  /**
   * Check if running as native mobile app (iOS or Android)
   */
  static isNative(): boolean {
    return typeof window !== 'undefined' && 
           (window as any).Capacitor?.isNativePlatform();
  }

  /**
   * Check if running on iOS
   */
  static isIOS(): boolean {
    return this.isNative() && 
           (window as any).Capacitor?.getPlatform() === 'ios';
  }

  /**
   * Check if running on Android
   */
  static isAndroid(): boolean {
    return this.isNative() && 
           (window as any).Capacitor?.getPlatform() === 'android';
  }

  /**
   * Get the current platform name
   * @returns 'web' | 'ios' | 'android'
   */
  static getPlatform(): string {
    if (typeof window === 'undefined') return 'web';
    return (window as any).Capacitor?.getPlatform() || 'web';
  }
}
```

**Usage:**
```typescript
if (PlatformDetectionService.isNative()) {
  // Use native camera APIs
} else {
  // Use web camera APIs
}
```

### 2. Native Camera Access

**File**: `client/src/services/scanningService.ts` (lines 79-123)

```typescript
async openCameraWithBarcodeScanning(
  onBarcodeDetected: (barcode: string) => void,
  onClose: () => void,
  onPhotoCapture?: (file: File) => void
): Promise<void> {
  // Check camera availability
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera access is not available on this device.');
  }

  // Create React component for camera UI
  const scanningElement = React.createElement(ImageScanning, {
    isOpen: true,
    onClose: () => {
      this.hideCameraScanning();
      onClose();
    },
    onBarcodeDetected: async (barcode) => {
      console.log('Barcode detected:', barcode);
      
      // Hide camera
      this.hideCameraScanning();
      
      // Show loading spinner
      this.showSpinner(`Looking up product ${barcode}...`);
      
      try {
        // Process barcode
        await onBarcodeDetected(barcode);
      } finally {
        this.hideSpinner();
      }
    },
    onPhotoCapture: onPhotoCapture ? async (file: File) => {
      this.hideCameraScanning();
      onPhotoCapture(file);
    } : undefined
  });

  // Render camera component
  this.scanningRoot = createRoot(this.scanningContainer);
  this.scanningRoot.render(scanningElement);
}
```

**Mobile Integration:**
- On **iOS/Android**: Uses Capacitor's native camera APIs via `@capacitor/camera`
- On **Web**: Uses browser's `navigator.mediaDevices.getUserMedia()`
- Same React component works across all platforms

### 3. Touch Gestures

**File**: `client/src/pages/NutritionFacts.tsx` (lines 165-182)

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
};

const handleTouchMove = (e: React.TouchEvent) => {
  touchEndX.current = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  const swipeThreshold = 50; // minimum swipe distance in pixels
  const diff = touchStartX.current - touchEndX.current;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0 && viewMode === "overview") {
      // Swiped left - show chat
      handleViewModeChange("chat");
    } else if (diff < 0 && viewMode === "chat") {
      // Swiped right - show overview
      handleViewModeChange("overview");
    }
  }
};
```

**Mobile UX:**
- Swipe **left** on nutrition overview → Switch to chat view
- Swipe **right** on chat view → Return to nutrition overview
- Natural mobile navigation without extra buttons

### 4. Performance Optimizations

#### Chat Pre-loading
```typescript
// Pre-load chat response in background
useEffect(() => {
  if (nutritionfacts?.askWihy && !chatPreloaded && !chatLoading) {
    // Delay to let page render first
    const timer = setTimeout(() => {
      preloadChatResponse(nutritionfacts.askWihy!);
    }, 2000);
    
    return () => clearTimeout(timer);
  }
}, [nutritionfacts?.askWihy, chatPreloaded, chatLoading]);
```

**Benefits:**
- Chat response loads in background while user views nutrition facts
- Instant display when user switches to chat view
- Improves perceived performance on mobile

#### State Persistence
```typescript
// Save to sessionStorage for offline access
try {
  sessionStorage.setItem('nutritionfacts_data', JSON.stringify({
    nutritionfacts: newNutritionfacts,
    sessionId: barcodeResult.sessionId,
    timestamp: Date.now()
  }));
} catch (e) {
  console.warn('Failed to store in sessionStorage:', e);
}
```

**Benefits:**
- Survives page refreshes
- Reduces unnecessary API calls
- Works offline (shows cached data)

---

## Complete API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE DEVICE                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ User scans barcode "012345678901"
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          scanningService.openCameraWithBarcodeScanning()     │
│          - Opens native camera via Capacitor                 │
│          - Detects barcode using ZXing library               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Barcode detected
                            ▼
┌─────────────────────────────────────────────────────────────┐
│      wihyScanningService.scanBarcode("012345678901")         │
│                                                              │
│      POST https://services.wihy.ai/api/scan                  │
│      Body: { barcode, user_context }                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Response
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API RESPONSE                              │
│                                                              │
│  {                                                           │
│    product: { name, brand, barcode, image_url },            │
│    nutrition: { score, grade, per_100g: {...} },            │
│    health_score: 85,                                        │
│    nova_group: 2,                                           │
│    scan_metadata: {                                         │
│      session_id: "barcode_012345678901_1735401234567",     │
│      ingredients_text: "...",                               │
│      ask_wihy: "Tell me about..."                          │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Transform to NutritionFactsData
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          normalizeBarcodeScan(barcodeResult)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Navigate with state
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   navigate('/nutritionfacts', {                              │
│     state: {                                                 │
│       nutritionfacts: {...},                                 │
│       sessionId: "barcode_012345678901_...",                │
│       fromChat: false                                        │
│     }                                                         │
│   })                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Page renders
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NutritionFacts.tsx Page                         │
│                                                              │
│  - Display product name, image                               │
│  - Show nutrition facts table                                │
│  - Display health score, NOVA group                          │
│  - List ingredients                                          │
│                                                              │
│  [Background] Pre-load chat response:                        │
│  POST /api/ask { query: askWihy, session_id }              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ User taps ingredient "Sugar"
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            analyzeIngredient("Sugar")                        │
│                                                              │
│      GET /api/openfda/ingredient/sugar                       │
│                                                              │
│      Response: {                                             │
│        safety_score: 65,                                     │
│        risk_level: "moderate",                               │
│        recall_count: 0,                                      │
│        adverse_event_count: 3,                               │
│        recommendations: [...]                                │
│      }                                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Display FDA analysis modal
                            ▼
                   [User closes modal]
                            │
                            │ User swipes left or taps Chat
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Switch to Chat View                         │
│                                                              │
│  - Show pre-loaded chat response (instant!)                  │
│  - User can ask follow-up questions                          │
│  - Each question includes session_id for context             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ User asks: "Is this healthy?"
                            ▼
┌─────────────────────────────────────────────────────────────┐
│      POST https://services.wihy.ai/api/ask                   │
│                                                              │
│      Body: {                                                 │
│        query: "Is this healthy?",                            │
│        context: {                                            │
│          product_name: "Organic Almond Milk",               │
│          nutrition_data: {...},                              │
│          session_id: "barcode_012345678901_..."             │
│        }                                                      │
│      }                                                        │
│                                                              │
│      Response: {                                             │
│        response: "Yes, this is a healthy choice..."         │
│      }                                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Display AI response
                            ▼
                  [Conversation continues...]
```

---

## Error Handling & Fallbacks

### 1. API Failures

```typescript
// Barcode scan failure
if (!barcodeResult.success) {
  alert(barcodeResult.error || 'Barcode not found in database');
  // User stays on current page, can try again
}

// FDA API failure → Wihy AI fallback
const analyzeIngredient = async (ingredient: string) => {
  try {
    const response = await fetch(`/api/openfda/ingredient/${ingredient}`);
    if (!response.ok) {
      return await fallbackToWihyLookup(ingredient); // Seamless fallback
    }
    return await response.json();
  } catch (error) {
    return await fallbackToWihyLookup(ingredient); // Network error fallback
  }
};
```

### 2. Camera Permission Denied

```typescript
try {
  await scanningService.openCameraWithBarcodeScanning(...);
} catch (error) {
  if (error.message.includes('Camera access')) {
    alert('Please enable camera permissions in your device settings.');
  } else {
    alert('Unable to open camera. Please try again.');
  }
}
```

### 3. Network Offline

```typescript
// Use cached data from sessionStorage
const cachedData = sessionStorage.getItem('nutritionfacts_data');
if (cachedData) {
  const { nutritionfacts, sessionId } = JSON.parse(cachedData);
  setNutritionfacts(nutritionfacts);
  setSessionId(sessionId);
}
```

### 4. Unknown Products

```typescript
// Auto-switch to chat for unknown products
useEffect(() => {
  if (nutritionfacts && viewMode === "overview") {
    const isUnknownProduct = 
      nutritionfacts.name === "Unknown product" || 
      (!nutritionfacts.ingredientsText && !nutritionfacts.imageUrl);
    
    if (isUnknownProduct && !initialQuery) {
      setInitialQuery(
        `I scanned a product but couldn't find detailed information. Can you help analyze it?`
      );
      setViewMode("chat"); // Automatically open chat
    }
  }
}, [nutritionfacts, viewMode]);
```

---

## Mobile vs Web Differences

### Similarities (Same API, Same Code)
[OK] All API endpoints identical on mobile and web  
[OK] Same React components render on both platforms  
[OK] Same response data structures  
[OK] Same error handling logic  

### Mobile-Specific Features
[MOBILE] **Native Camera**: Uses Capacitor camera plugin instead of web camera  
[MOBILE] **Touch Gestures**: Swipe navigation between views  
[MOBILE] **Platform Detection**: `PlatformDetectionService.isNative()`  
[MOBILE] **Performance**: Chat pre-loading, optimized state management  
[MOBILE] **Offline Support**: SessionStorage caching  

### Code Example: Platform-Agnostic Design

```typescript
// Same code works on web AND mobile!
const barcodeResult = await wihyScanningService.scanBarcode(barcode);

// Platform detection happens internally
if (PlatformDetectionService.isNative()) {
  // Use Capacitor camera on mobile
  await Camera.getPhoto({...});
} else {
  // Use web camera on browser
  await navigator.mediaDevices.getUserMedia({...});
}
```

---

## Best Practices for Mobile API Integration

### 1. Always Include Session IDs
```typescript
// Create session ID on scan
const sessionId = `barcode_${barcode}_${Date.now()}`;

// Pass to all subsequent API calls
fetch('/api/ask', {
  body: JSON.stringify({
    query: userQuestion,
    context: { session_id: sessionId } // Maintains context!
  })
});
```

### 2. Pre-load Data for Better UX
```typescript
// Pre-load chat in background while user views nutrition facts
useEffect(() => {
  if (nutritionfacts?.askWihy && !chatPreloaded) {
    setTimeout(() => preloadChatResponse(nutritionfacts.askWihy), 2000);
  }
}, [nutritionfacts]);
```

### 3. Handle Offline Gracefully
```typescript
// Cache important data
try {
  sessionStorage.setItem('nutritionfacts_data', JSON.stringify(data));
} catch (e) {
  console.warn('Storage unavailable');
}

// Retrieve when offline
if (!navigator.onLine) {
  const cached = sessionStorage.getItem('nutritionfacts_data');
  if (cached) setNutritionfacts(JSON.parse(cached));
}
```

### 4. Provide Visual Feedback
```typescript
// Show spinner during API calls
this.showSpinner(`Looking up product ${barcode}...`);

try {
  const result = await wihyScanningService.scanBarcode(barcode);
} finally {
  this.hideSpinner(); // Always hide, even on error
}
```

### 5. Graceful Degradation
```typescript
// Primary: FDA database
// Fallback: Wihy AI
// Final: Generic message
const analyzeIngredient = async (ingredient: string) => {
  try {
    return await fetchFDAData(ingredient);
  } catch (error) {
    try {
      return await fallbackToWihyLookup(ingredient);
    } catch (error2) {
      return {
        ingredient,
        success: false,
        fda_status: 'No data available',
        analysis_summary: 'Unable to analyze this ingredient'
      };
    }
  }
};
```

---

## Testing Mobile API Integration

### 1. Test Barcode Scanning
```bash
# Test valid barcode
curl -X POST https://services.wihy.ai/api/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode": "012345678901"}'

# Test invalid barcode
curl -X POST https://services.wihy.ai/api/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode": "000000000000"}'
```

### 2. Test Image Analysis
```bash
# Convert image to base64
base64 food_photo.jpg > image_base64.txt

# Send to API
curl -X POST https://services.wihy.ai/api/scan \
  -H "Content-Type: application/json" \
  -d "{\"imageData\": \"$(cat image_base64.txt)\"}"
```

### 3. Test Chat Continuity
```bash
# Step 1: Scan barcode (get session_id)
SESSION_ID=$(curl -X POST https://services.wihy.ai/api/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode": "012345678901"}' | jq -r '.scan_metadata.session_id')

# Step 2: Ask question with session_id
curl -X POST https://services.wihy.ai/api/ask \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Is this healthy?\", \"context\": {\"session_id\": \"$SESSION_ID\"}}"
```

### 4. Test FDA Ingredient Lookup
```bash
curl https://services.wihy.ai/api/openfda/ingredient/sugar
curl https://services.wihy.ai/api/openfda/ingredient/aspartame
curl https://services.wihy.ai/api/openfda/ingredient/vitamin-c
```

---

## Troubleshooting Common Issues

### Issue: "Camera access is not available"
**Solution:** Check Capacitor camera permissions in `capacitor.config.ts`:
```typescript
{
  plugins: {
    Camera: {
      permissions: ["camera", "photos"]
    }
  }
}
```

### Issue: API returns 404 for barcode
**Solution:** This is expected for unknown products. Show user-friendly message:
```typescript
if (barcodeResult.error) {
  alert('Product not found. Try taking a photo instead!');
}
```

### Issue: Chat doesn't remember scanned product
**Solution:** Ensure session_id is passed to `/api/ask`:
```typescript
body: JSON.stringify({
  query: userQuestion,
  context: { 
    session_id: sessionId // REQUIRED for context
  }
})
```

### Issue: Image upload too slow on mobile
**Solution:** Compress image before sending:
```typescript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};

const compressedFile = await imageCompression(imageFile, options);
```

---

## Summary

The NutritionFacts mobile API integration is designed for **simplicity and performance**:

1. **Single API Base** - All endpoints use `https://services.wihy.ai`
2. **Three Main Endpoints** - `/api/scan`, `/api/ask`, `/api/openfda/ingredient/{name}`
3. **Platform Agnostic** - Same code works on web and mobile (Capacitor handles native features)
4. **Session-Based Context** - Each scan creates a session ID for conversation continuity
5. **Graceful Fallbacks** - FDA → Wihy AI → Generic messages
6. **Performance Optimized** - Pre-loading, caching, offline support

The entire system is built with mobile-first principles while maintaining full web compatibility through React and Capacitor.
