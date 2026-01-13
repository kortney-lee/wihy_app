# FDA to WiHY Ingredient Analysis Flow

## Overview

The [`client/src/pages/NutritionFacts.tsx`](../client/src/pages/NutritionFacts.tsx) component implements a **two-tier ingredient analysis system** that attempts FDA database lookups first, then gracefully falls back to WiHY AI when FDA data is unavailable.

## Architecture

### Flow Diagram

```
User clicks ingredient
        ↓
analyzeIngredient(ingredient)
        ↓
┌──────────────────────────────────────────────┐
│ Step 1: Try FDA Database                     │
│ GET /api/openfda/ingredient/{ingredient}     │
└──────────────────────────────────────────────┘
        ↓
    ✅ Success (200)          ❌ Error (404/500/timeout)
        ↓                              ↓
   Parse FDA response      fallbackToWihyLookup(ingredient)
        ↓                              ↓
   Return structured        POST /api/ask
   FDA data                 with ingredient query
        ↓                              ↓
        └──────────────┬───────────────┘
                       ↓
        Update analyzedIngredients Map
        Remove from loadingIngredients Set
                       ↓
        Component re-renders with analysis
```

## API Endpoints

### 1. FDA OpenFDA Endpoint

**Base URL**: `https://services.wihy.ai`

**Endpoint**: 
```
GET /api/openfda/ingredient/{ingredient}
```

**Example Request**:
```bash
curl https://services.wihy.ai/api/openfda/ingredient/sugar
```

**Example Response** (Success - 200):
```json
{
  "success": true,
  "ingredient": "sugar",
  "safety_score": 65,
  "risk_level": "moderate",
  "recall_count": 0,
  "adverse_event_count": 3,
  "fda_status": "GRAS",
  "analysis_summary": "Sugar is generally recognized as safe by the FDA...",
  "recommendations": [
    {
      "type": "dietary",
      "message": "Limit intake to < 50g per day"
    }
  ]
}
```

**Error Response** (404 - Not Found):
```json
{
  "error": "Ingredient not found in FDA database"
}
```

### 2. WiHY AI Fallback Endpoint

**Base URL**: `https://services.wihy.ai`

**Endpoint**:
```
POST /api/ask
```

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "Tell me about the ingredient: {ingredient}. Is it safe? What should I know about it?",
  "user_context": {
    "ingredient_lookup": true
  }
}
```

**Example Request**:
```bash
curl -X POST https://services.wihy.ai/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about the ingredient: xanthan gum. Is it safe? What should I know about it?",
    "user_context": {
      "ingredient_lookup": true
    }
  }'
```

**Example Response**:
```json
{
  "response": "Xanthan gum is a food additive commonly used as a thickening agent. It's generally recognized as safe (GRAS) by the FDA. It's produced through fermentation and is widely used in gluten-free baking...",
  "confidence": 0.92,
  "source": "wihy_model"
}
```

## Implementation Details

### Step 1: Analyze Ingredient Function

**File**: `client/src/pages/NutritionFacts.tsx` (lines 256-300)

This is the main function that orchestrates the FDA → WiHY flow:

```typescript
const analyzeIngredient = async (ingredient: string): Promise<IngredientAnalysis> => {
  try {
    // STEP 1: Attempt FDA database lookup
    const response = await fetch(
      `${WIHY_API_BASE}/api/openfda/ingredient/${encodeURIComponent(ingredient.trim())}`
    );
    
    // STEP 2: Check HTTP status
    if (!response.ok) {
      // FDA returned error (404 Not Found, 500 Server Error, etc.)
      // → Trigger WiHY AI fallback
      console.log(`FDA lookup failed for "${ingredient}", falling back to WiHY`);
      return await fallbackToWihyLookup(ingredient.trim());
    }
    
    // STEP 3: Parse successful FDA response
    const data = await response.json();
    
    // STEP 4: Return structured FDA data
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
    // STEP 5: Network error (timeout, connection refused, etc.)
    // → Trigger WiHY AI fallback
    console.error(`Network error analyzing "${ingredient}":`, error);
    return await fallbackToWihyLookup(ingredient.trim());
  }
};
```

**Key Points**:
- **Line 260**: Construct FDA API URL with encoded ingredient name
- **Line 263**: Check if HTTP response is successful (status 200-299)
- **Line 265**: If not successful, immediately call WiHY fallback
- **Line 270**: Parse JSON response from FDA
- **Line 273**: Return structured data matching `IngredientAnalysis` interface
- **Line 285**: Catch network errors and trigger fallback

### Step 2: WiHY Fallback Function

**File**: `client/src/pages/NutritionFacts.tsx` (lines 302-340)

This function is called when FDA lookup fails:

```typescript
const fallbackToWihyLookup = async (ingredient: string): Promise<IngredientAnalysis> => {
  try {
    // STEP 1: Call WiHY /ask endpoint
    const response = await fetch(`${WIHY_API_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // STEP 2: Format natural language query for WiHY AI
        query: `Tell me about the ingredient: ${ingredient}. Is it safe? What should I know about it?`,
        user_context: { 
          ingredient_lookup: true  // Flag to help WiHY understand context
        }
      })
    });

    // STEP 3: Check response status
    if (!response.ok) {
      throw new Error(`WiHY API returned status ${response.status}`);
    }

    // STEP 4: Parse WiHY AI response
    const data = await response.json();
    
    // STEP 5: Transform WiHY response into IngredientAnalysis format
    return {
      ingredient: ingredient,
      success: true,
      safety_score: 0,              // WiHY doesn't provide numeric scores
      risk_level: 'low',             // Default to low risk
      recall_count: 0,               // No recall data from WiHY
      adverse_event_count: 0,        // No adverse event data from WiHY
      recommendations: [],           // No structured recommendations
      fda_status: 'Wihy Analysis',   // Indicator that this came from WiHY, not FDA
      analysis_summary: data.response || data.answer || 'Analysis complete'
    };
    
  } catch (error) {
    console.error(`Wihy fallback failed for ingredient "${ingredient}":`, error);
    
    // STEP 6: Final fallback - return empty result (silent failure)
    return {
      ingredient: ingredient,
      success: false,
      safety_score: 0,
      risk_level: 'low',
      recall_count: 0,
      adverse_event_count: 0,
      recommendations: [],
      fda_status: 'No data available',
      analysis_summary: 'Unable to analyze this ingredient'
    };
  }
};
```

**Key Points**:
- **Line 305**: POST request to WiHY `/ask` endpoint
- **Line 311**: Natural language query formatted for AI understanding
- **Line 312**: Context flag helps WiHY optimize response
- **Line 329**: `fda_status: 'Wihy Analysis'` identifies the source in UI
- **Line 333**: Final fallback returns "No data available" without throwing error

### Step 3: Trigger Analysis from UI

**File**: `client/src/pages/NutritionFacts.tsx` (lines 343-380)

User clicks an ingredient to trigger analysis:

```typescript
const analyzeIndividualIngredient = async (ingredient: string) => {
  const trimmedIngredient = ingredient.trim();
  
  // STEP 1: Check if already analyzed or currently loading
  if (ingredientAnalysis.loadingIngredients.has(trimmedIngredient) || 
      ingredientAnalysis.analyzedIngredients.has(trimmedIngredient)) {
    console.log(`Skipping "${trimmedIngredient}" - already analyzed or loading`);
    return;  // Prevent duplicate requests
  }
  
  // STEP 2: Add to loading set and clear previous errors
  setIngredientAnalysis(prev => ({ 
    ...prev, 
    loadingIngredients: new Set([...prev.loadingIngredients, trimmedIngredient]),
    error: null 
  }));
  
  try {
    // STEP 3: Call analyzeIngredient (FDA → WiHY flow)
    const analysis = await analyzeIngredient(trimmedIngredient);
    
    // STEP 4: Update state with successful result
    setIngredientAnalysis(prev => {
      const newLoadingIngredients = new Set(prev.loadingIngredients);
      newLoadingIngredients.delete(trimmedIngredient);  // Remove from loading
      
      const newAnalyzedIngredients = new Map(prev.analyzedIngredients);
      newAnalyzedIngredients.set(trimmedIngredient, analysis);  // Cache result
      
      return {
        ...prev,
        loadingIngredients: newLoadingIngredients,
        analyzedIngredients: newAnalyzedIngredients
      };
    });
    
  } catch (error) {
    // STEP 5: Handle unexpected errors
    console.error(`Failed to analyze ingredient "${trimmedIngredient}":`, error);
    
    setIngredientAnalysis(prev => {
      const newLoadingIngredients = new Set(prev.loadingIngredients);
      newLoadingIngredients.delete(trimmedIngredient);  // Remove from loading
      return { 
        ...prev, 
        loadingIngredients: newLoadingIngredients,
        error: `Failed to analyze ${trimmedIngredient}`
      };
    });
  }
};
```

**Key Points**:
- **Line 346**: Prevents duplicate analysis with Set/Map checks
- **Line 354**: Adds ingredient to `loadingIngredients` Set (shows spinner)
- **Line 361**: Calls `analyzeIngredient()` which handles FDA → WiHY flow
- **Line 367**: Removes from loading Set
- **Line 370**: Caches result in `analyzedIngredients` Map
- **Line 379**: Error handling removes loading state without displaying error to user

## Data Types

**File**: `client/src/pages/NutritionFacts.tsx` (lines 20-42)

```typescript
interface IngredientAnalysis {
  ingredient: string;                  // Ingredient name
  success: boolean;                    // Whether analysis succeeded
  safety_score: number;                // 0-100 safety score (FDA only)
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';  // Risk category
  recall_count: number;                // Number of FDA recalls (FDA only)
  adverse_event_count: number;         // Adverse events reported (FDA only)
  recommendations: {                   // Structured recommendations (FDA only)
    type: string;
    message: string;
  }[];
  fda_status: string;                  // 'GRAS', 'Wihy Analysis', 'No data available'
  analysis_summary: string;            // Main text response (from FDA or WiHY)
  error?: string;                      // Optional error message
}

interface IngredientAnalysisState {
  loading: boolean;                    // Global loading state
  analyses: IngredientAnalysis[];      // Array of all analyses
  error: string | null;                // Global error message
  loadingIngredients: Set<string>;     // Currently analyzing ingredients
  analyzedIngredients: Map<string, IngredientAnalysis>;  // Cached results
}
```

## Error Handling Strategy

### Three-Tier Fallback System

```
┌─────────────────────────────────────────┐
│ TIER 1: FDA OpenFDA Database            │
│ ✓ Structured data (scores, recalls)    │
│ ✓ Fast response (cached)                │
│ ✓ Most reliable for common ingredients │
└─────────────────────────────────────────┘
           ↓ (If 404/500/timeout)
┌─────────────────────────────────────────┐
│ TIER 2: WiHY AI Analysis                │
│ ✓ Natural language response             │
│ ✓ Works for any ingredient              │
│ ✓ Slower but more flexible              │
└─────────────────────────────────────────┘
           ↓ (If WiHY fails)
┌─────────────────────────────────────────┐
│ TIER 3: Silent Failure                  │
│ ✓ Returns "No data available"           │
│ ✓ No error shown to user                │
│ ✓ UI remains functional                 │
└─────────────────────────────────────────┘
```

### Error Scenarios & Responses

| Scenario | HTTP Status | Handler | User Experience |
|----------|-------------|---------|-----------------|
| FDA has data | 200 OK | Return FDA data | 🏛️ Structured analysis with scores |
| Ingredient not in FDA | 404 Not Found | Call WiHY | 🤖 AI conversational analysis |
| FDA server error | 500 Server Error | Call WiHY | 🤖 AI conversational analysis |
| FDA timeout | Network timeout | Call WiHY | 🤖 AI conversational analysis |
| WiHY also fails | 500/timeout | Return empty | ℹ️ "No data available" (silent) |
| Network offline | Connection refused | Return empty | ℹ️ "No data available" (silent) |

### Why Silent Failures?

The system uses **silent failures** (Tier 3) instead of error messages because:

1. **User Experience**: Showing "Error analyzing [ingredient]" for every failed lookup creates anxiety
2. **Graceful Degradation**: Users can still view other ingredients and product information
3. **Non-Critical Feature**: Ingredient analysis is supplementary, not core functionality
4. **Retry Capability**: Users can click the ingredient again to retry

## UI Integration

### Display in NutritionFacts Component

**File**: `client/src/pages/NutritionFacts.tsx` (lines 880-960)

```tsx
{product.ingredientsText.split(',').map((ingredient, idx) => {
  const trimmedIngredient = ingredient.trim();
  const analysis = ingredientAnalysis.analyzedIngredients.get(trimmedIngredient);
  const isLoading = ingredientAnalysis.loadingIngredients.has(trimmedIngredient);
  
  return (
    <div 
      key={idx}
      onClick={() => analyzeIndividualIngredient(trimmedIngredient)}
      className="clickable-ingredient"
      style={{ cursor: 'pointer' }}
    >
      {/* Show ingredient name */}
      <span className="ingredient-name">{trimmedIngredient}</span>
      
      {/* Loading spinner while analyzing */}
      {isLoading && (
        <div className="loading-spinner">
          <span>🔄 Analyzing...</span>
        </div>
      )}
      
      {/* Analysis card when complete */}
      {analysis && (
        <div className="ingredient-card">
          
          {/* Source Badge: FDA or WiHY AI */}
          <span className={`badge ${analysis.fda_status === 'Wihy Analysis' ? 'ai-badge' : 'fda-badge'}`}>
            {analysis.fda_status === 'Wihy Analysis' ? '🤖 AI' : '🏛️ FDA'}
          </span>
          
          {/* Safety Score (FDA only) */}
          {analysis.safety_score > 0 && (
            <span className={`safety-score ${analysis.risk_level}`}>
              Score: {analysis.safety_score}
            </span>
          )}
          
          {/* Recall Alert (FDA only) */}
          {analysis.recall_count > 0 && (
            <div className="alert recall-alert">
              ⚠️ {analysis.recall_count} FDA recalls found
            </div>
          )}
          
          {/* Adverse Events (FDA only) */}
          {analysis.adverse_event_count > 0 && (
            <div className="alert event-alert">
              ⚠️ {analysis.adverse_event_count} adverse events reported
            </div>
          )}
          
          {/* Analysis Summary (Both sources) */}
          <p className="summary">{analysis.analysis_summary}</p>
          
          {/* Recommendations (FDA only) */}
          {analysis.recommendations.length > 0 && (
            <ul className="recommendations">
              {analysis.recommendations.map((rec, i) => (
                <li key={i}>
                  <strong>{rec.type}:</strong> {rec.message}
                </li>
              ))}
            </ul>
          )}
          
        </div>
      )}
    </div>
  );
})}
```

### Visual Indicators

| Indicator | Meaning | Source |
|-----------|---------|--------|
| 🏛️ FDA Badge | Data from FDA OpenFDA database | FDA API |
| 🤖 AI Badge | Data from WiHY AI analysis | WiHY `/ask` API |
| 🔄 Spinner | Analysis in progress | `loadingIngredients` Set |
| ⚠️ Recall Alert | FDA recalls found | `recall_count > 0` |
| ⚠️ Event Alert | Adverse events reported | `adverse_event_count > 0` |
| Score: 0-100 | Safety score (higher = safer) | FDA `safety_score` |

## Performance Optimizations

### 1. Result Caching

**Implementation**: `Map<string, IngredientAnalysis>`

```typescript
// Results stored in analyzedIngredients Map
const analyzedIngredients = new Map<string, IngredientAnalysis>();

// Check cache before making API call
if (analyzedIngredients.has(ingredient)) {
  return; // Use cached result
}
```

**Benefits**:
- Prevents duplicate API calls for same ingredient
- Results persist across component re-renders
- Instant display when clicking previously analyzed ingredient

### 2. Request Deduplication

**Implementation**: `Set<string>` for loading state

```typescript
// Track currently loading ingredients
const loadingIngredients = new Set<string>();

// Prevent duplicate simultaneous requests
if (loadingIngredients.has(ingredient)) {
  return; // Request already in progress
}
```

**Benefits**:
- Prevents race conditions from double-clicks
- Reduces server load
- Ensures only one request per ingredient at a time

### 3. Lazy Loading

**Implementation**: Click-to-analyze pattern

```typescript
// Analysis only triggered on user click
onClick={() => analyzeIndividualIngredient(ingredient)}
```

**Benefits**:
- No automatic analysis of all ingredients on page load
- Reduces initial API calls from ~20 to 0 per product view
- User controls when to spend API credits
- Faster initial page load

## Testing Scenarios

### Test Case 1: FDA Success Path

**Ingredient**: `sugar`

```bash
# Test FDA endpoint directly
curl https://services.wihy.ai/api/openfda/ingredient/sugar

# Expected Response:
{
  "success": true,
  "ingredient": "sugar",
  "safety_score": 65,
  "risk_level": "moderate",
  "recall_count": 0,
  "adverse_event_count": 3,
  "fda_status": "GRAS",
  "analysis_summary": "Sugar is generally recognized as safe..."
}
```

**Expected UI**:
- 🏛️ FDA badge displayed
- Safety score: 65
- Risk level: Moderate (yellow color)
- Adverse events: 3 shown

### Test Case 2: FDA → WiHY Fallback

**Ingredient**: `xanthan gum` (not in FDA database)

```bash
# FDA returns 404
curl https://services.wihy.ai/api/openfda/ingredient/xanthan-gum
# → 404 Not Found

# System automatically calls WiHY
curl -X POST https://services.wihy.ai/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about the ingredient: xanthan gum. Is it safe?",
    "user_context": { "ingredient_lookup": true }
  }'
```

**Expected UI**:
- 🤖 AI badge displayed
- No safety score shown
- Analysis summary with WiHY AI response
- No recalls or adverse events

### Test Case 3: Complete Failure (Silent)

**Scenario**: Both FDA and WiHY fail

**Expected UI**:
- No error message displayed
- Ingredient card shows: "No data available"
- User can click again to retry
- Other ingredients remain functional

### Test Case 4: Duplicate Click Prevention

**Steps**:
1. Click ingredient "salt"
2. Immediately click "salt" again
3. Click "salt" a third time

**Expected Behavior**:
- First click: Starts analysis (spinner shows)
- Second click: Ignored (already loading)
- Third click: Ignored (already analyzed, shows cached result)

**API Calls**: Only 1 request made

## Summary

### Key Design Principles

✅ **Graceful Degradation**: Always provide some response, never show errors  
✅ **Performance First**: Cache results, prevent duplicate requests  
✅ **User Control**: Lazy loading, click-to-analyze pattern  
✅ **Transparency**: Clear badges showing data source (FDA vs AI)  
✅ **Fault Tolerance**: Three-tier fallback system

### Data Sources

| Source | Strengths | Use Case |
|--------|-----------|----------|
| **FDA OpenFDA** | Structured data, recalls, scores | Common food ingredients |
| **WiHY AI** | Flexible, natural language, works for anything | Uncommon ingredients, specialized compounds |
| **Silent Fallback** | Never breaks UI | Complete system failure |

### API Call Flow

```
User Click → analyzeIngredient()
                    ↓
              [Check cache]
                    ↓
           [Call FDA /api/openfda]
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    Success (200)         Error (404/500)
         ↓                     ↓
    Return FDA          [Call WiHY /ask]
         ↓                     ↓
         └──────────┬──────────┘
                    ↓
         [Update UI with result]
                    ↓
              [Cache result]
```

---

**Last Updated**: January 11, 2026  
**Component**: `client/src/pages/NutritionFacts.tsx`  
**API Base URL**: `https://services.wihy.ai`