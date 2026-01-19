# Scan Service API Migration - January 13, 2026

**Status:** ⚠️ PARTIAL IMPLEMENTATION - REQUIRES UPDATES

**Breaking Changes Deployed:** January 13, 2026  
**Migration Deadline:** February 13, 2026 (30 days)  
**Last Verified:** January 13, 2026

---

## Summary of Breaking Changes

Three endpoints changed from FLAT to NESTED response structures:

| Endpoint | Structure | Status | Migration Required |
|----------|-----------|--------|-------------------|
| **POST /api/scan/barcode** | FLAT ✅ | No changes | ❌ No |
| **POST /api/scan/product** | FLAT ✅ | No changes | ❌ No |
| **POST /api/scan/photo** | NESTED ⚠️ | **NEEDS FIX** | ✅ Yes |
| **POST /api/scan/recipe** | NESTED ⚠️ | **NEEDS FIX** | ✅ Yes |
| **POST /api/scan/label** | NESTED ⚠️ | **NEEDS FIX** | ✅ Yes |

---

## Current Implementation Status

### ✅ CORRECT - Barcode Scan (FLAT structure)

**File:** `mobile/src/services/scanService.ts` (Lines 24-103)

```typescript
// API v2.0 returns flat structure - CORRECT!
return data; // All fields at root level
```

**Status:** ✅ Working correctly - all fields at root level

---

### ⚠️ NEEDS REVIEW - Photo Scan (NESTED structure)

**File:** `mobile/src/services/scanService.ts` (Lines 194-275)

**Current Implementation Issue:**
The service transforms the nested response into a partially flattened structure:

```typescript
return {
  success: true,
  scan_id: data.analysis?.metadata?.scan_id,
  analysis: {
    summary: data.analysis?.summary,
    confidence_score: data.analysis?.confidence_score,
    metadata: data.analysis?.metadata,
    detected_foods: data.analysis?.metadata?.detected_foods, // Wrong path
    // ...
  },
};
```

**Problem:** Accessing `response.analysis.metadata.detected_foods` is incorrect!

**Correct Path (per API spec):** `response.analysis.detected_foods` (at analysis level, NOT nested in metadata)

**Client Code Impact:** [CameraScreen.tsx](mobile/src/screens/CameraScreen.tsx#L557-L570)

```typescript
// CURRENT (BROKEN)
const metadata = result.metadata as any || {};
const detectedFoods = metadata.detected_foods || [];

// SHOULD BE
const detectedFoods = result.analysis?.detected_foods || [];
const metadata = result.metadata || {};
```

---

### ⚠️ NEEDS REVIEW - Recipe Scan (NESTED structure)

**File:** `mobile/src/services/scanService.ts`

**Issue:** Recipe scan endpoint not implemented in service!

**Missing Implementation:**
- No `scanRecipe()` method in scanService
- Required to handle recipe image scanning
- Must return nested `analysis` object with recipe details

**Required Response Structure:**
```typescript
{
  "success": true,
  "scan_id": "scan_recipe_abc123",
  "analysis": {
    "recipe_title": "...",
    "ingredients": [...],
    "instructions": [...],
    "servings": 6,
    // ...
  },
  "timestamp": "...",
  "processing_time_ms": 3124
}
```

**What's Missing:**
- No recipe scan method
- No API integration for `/api/scan/recipe`
- No client usage in screens/components

---

### ⚠️ PARTIAL IMPLEMENTATION - Label Scan (NESTED structure)

**File:** `mobile/src/services/scanService.ts` (Lines 294-383)

**Current Response Handling:**
```typescript
const result = await scanService.scanLabel(imageData, {...});

if (result.success && result.analysis) {
  const { analysis } = result;
  const metadata = (analysis as any).metadata || {};  // WRONG!
```

**Problem:** Metadata is NOT nested inside analysis!

**Correct Structure (per API spec):**
```typescript
{
  "success": true,
  "scan_id": "...",
  "analysis": {
    "product_name": "...",
    "greenwashing_score": 15,
    "detected_claims": [...],
    "greenwashing_flags": [...]
  },
  "timestamp": "...",
  "processing_time_ms": 2156
}
```

**Client Code Issue:** [CameraScreen.tsx](mobile/src/screens/CameraScreen.tsx#L790-L810)

```typescript
// CURRENT (BROKEN)
const metadata = (analysis as any).metadata || {};  // undefined!
const detectedText = (metadata as any).detected_text || [];

// SHOULD BE
const greenwashing = analysis.greenwashing_score;
const claims = analysis.detected_claims || [];
const flags = analysis.greenwashing_flags || [];
```

---

## Migration Roadmap

### Phase 1: Add Safety Helper ✅ TODO
Create utility function for safe nested access to prevent runtime errors.

**File to create:** `mobile/src/utils/scanResponseHelper.ts`

```typescript
/**
 * Safe nested accessor for scan API responses
 * Handles both FLAT and NESTED structures gracefully
 */
export function getScanField<T>(
  response: any, 
  path: string, 
  defaultValue?: T
): T | undefined {
  const parts = path.split('.');
  let current = response;
  
  for (const part of parts) {
    if (current?.[part] === undefined) {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current as T;
}

// Convenience functions for each response type
export const ScanResponseHelpers = {
  // Photo Scan
  getPhotoHealthScore: (response: any) => 
    getScanField<number>(response, 'metadata.health_score', 0),
  getPhotoDetectedFoods: (response: any) => 
    getScanField<any[]>(response, 'analysis.detected_foods', []),
  
  // Recipe Scan
  getRecipeIngredients: (response: any) => 
    getScanField<any[]>(response, 'analysis.ingredients', []),
  getRecipeTitle: (response: any) => 
    getScanField<string>(response, 'analysis.recipe_title', ''),
  
  // Label Scan
  getLabelGreenwashing: (response: any) => 
    getScanField<number>(response, 'analysis.greenwashing_score', 0),
  getLabelClaims: (response: any) => 
    getScanField<any[]>(response, 'analysis.detected_claims', []),
};
```

### Phase 2: Update CameraScreen Photo Handling ✅ TODO
Fix photo scan response parsing to correctly access nested metadata.

**File:** `mobile/src/screens/CameraScreen.tsx` (Lines 555-600)

**Changes needed:**
- Update metadata extraction to use `response.metadata` (not from analysis)
- Update detected foods to use `response.analysis.detected_foods`
- Update confidence score access path

### Phase 3: Update Label Scan Handling ✅ TODO
Fix label scan response parsing to correctly access greenwashing data.

**File:** `mobile/src/screens/CameraScreen.tsx` (Lines 790-830)

**Changes needed:**
- Remove incorrect `metadata` extraction from analysis
- Access greenwashing data directly from `analysis` object
- Fix detected claims and flags access paths

### Phase 4: Implement Recipe Scan ✅ TODO
Add complete recipe scanning functionality.

**Files to update:**
- `mobile/src/services/scanService.ts` - Add `scanRecipe()` method
- `mobile/src/screens/CameraScreen.tsx` - Add recipe scan handler
- `mobile/src/screens/CreateMealScreen.tsx` - Integrate recipe scanning

### Phase 5: Update Type Definitions ✅ TODO
Ensure TypeScript types match new response structures.

**Files to update:**
- `mobile/src/services/types.ts` - Verify response types
- `mobile/src/types/scan.types.ts` - Add recipe/label response types

---

## Critical Issues Found

### Issue 1: Photo Scan Response Path Mismatch

**Location:** `mobile/src/screens/CameraScreen.tsx` Lines 557-570

**Problem:**
```typescript
const metadata = result.metadata as any || {};  // ✅ Correct
const detectedFoods = metadata.detected_foods || [];  // ❌ WRONG!
```

**Solution:**
```typescript
const metadata = result.metadata as any || {};  // ✅ Correct
const detectedFoods = result.analysis?.detected_foods || [];  // ✅ CORRECT
```

**Impact:** Detected foods array will always be empty, breaking meal creation workflow

---

### Issue 2: Label Scan Metadata Access

**Location:** `mobile/src/screens/CameraScreen.tsx` Lines 800-810

**Problem:**
```typescript
const { analysis } = result;
const metadata = (analysis as any).metadata || {};  // ❌ metadata NOT in analysis!
const detectedText = (metadata as any).detected_text || [];  // undefined
```

**Solution:**
```typescript
const { analysis } = result;
// Metadata is at root level, not inside analysis
const greenwashing = analysis.greenwashing_score || 0;
const claims = analysis.detected_claims || [];
const flags = analysis.greenwashing_flags || [];
```

**Impact:** Label scan results won't display greenwashing data correctly

---

### Issue 3: Missing Recipe Scan Implementation

**Location:** `mobile/src/services/scanService.ts`

**Problem:**
- No `scanRecipe()` method exists
- No endpoint defined in config
- No client code integration

**Solution:**
- Add recipe scan method to service
- Integrate with recipe creation workflow
- Update CameraScreen to handle recipe scanning

**Impact:** Recipe extraction from images not available to users

---

## API Response Structure Reference

### Photo Scan Response (NESTED)
```typescript
{
  "success": true,
  "scan_id": "scan_photo_abc123",
  "analysis": {
    "detected_foods": [
      { "name": "Grilled Chicken", "confidence": 0.94, ... }
    ],
    "confidence_score": 0.92,
    "meal_classification": "lunch"
  },
  "metadata": {
    "health_score": 88,
    "nutrition_facts": { "calories_serving": 335, ... },
    "diet_compatibility": { "keto": true, ... }
  },
  "timestamp": "...",
  "processing_time_ms": 2847
}

// Correct access patterns:
response.analysis.detected_foods        ✅ CORRECT
response.metadata.health_score          ✅ CORRECT
response.metadata.nutrition_facts       ✅ CORRECT
```

### Recipe Scan Response (NESTED)
```typescript
{
  "success": true,
  "scan_id": "scan_recipe_def456",
  "analysis": {
    "recipe_title": "Homemade Chicken Soup",
    "ingredients": [
      { "item": "Chicken breast", "amount": "2", "unit": "lbs" }
    ],
    "instructions": [...],
    "servings": 6,
    "prep_time_minutes": 15,
    "cook_time_minutes": 45
  },
  "timestamp": "...",
  "processing_time_ms": 3124
}

// Correct access patterns:
response.analysis.recipe_title          ✅ CORRECT
response.analysis.ingredients           ✅ CORRECT
response.analysis.instructions          ✅ CORRECT
```

### Label Scan Response (NESTED)
```typescript
{
  "success": true,
  "scan_id": "scan_label_ghi789",
  "analysis": {
    "product_name": "100% Organic Green Tea",
    "greenwashing_score": 15,
    "greenwashing_flags": [
      { "claim": "100% Organic", "verified": true, "risk_level": "none" }
    ],
    "detected_claims": [...],
    "sustainability_score": 95
  },
  "timestamp": "...",
  "processing_time_ms": 2156
}

// Correct access patterns:
response.analysis.greenwashing_score    ✅ CORRECT
response.analysis.greenwashing_flags    ✅ CORRECT
response.analysis.detected_claims       ✅ CORRECT
```

---

## Backward Compatibility Helper

Use this helper function in client code to safely handle both old and new response formats:

```typescript
/**
 * Get field from scan response handling both FLAT and NESTED structures
 * @param response Scan API response
 * @param path Path to field (e.g., "metadata.health_score" or "analysis.ingredients")
 * @param defaultValue Default if not found
 * @returns Field value or default
 */
export function getScanField<T>(
  response: any, 
  path: string, 
  defaultValue?: T
): T | undefined {
  const parts = path.split('.');
  let current = response;
  
  for (const part of parts) {
    if (current?.[part] === undefined) {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current as T;
}

// Usage examples:
const healthScore = getScanField<number>(photoScanResponse, 'metadata.health_score', 0);
const ingredients = getScanField<any[]>(recipeScanResponse, 'analysis.ingredients', []);
const greenwashing = getScanField<number>(labelScanResponse, 'analysis.greenwashing_score', 0);
```

---

## Implementation Checklist

- [ ] Create `scanResponseHelper.ts` with safe accessor utilities
- [ ] Update `CameraScreen.tsx` photo scan parsing (Lines 557-570)
- [ ] Update `CameraScreen.tsx` label scan parsing (Lines 800-810)
- [ ] Implement `scanRecipe()` in `scanService.ts`
- [ ] Add recipe scan handler to `CameraScreen.tsx`
- [ ] Update TypeScript type definitions
- [ ] Test all three scan endpoints (photo, recipe, label)
- [ ] Verify data flows correctly through screens
- [ ] Update documentation with new response structures
- [ ] Prepare rollback plan in case API changes

---

## Testing Checklist

### Photo Scan Tests
- [ ] Capture food photo
- [ ] Verify detected foods array populated
- [ ] Verify health score displays
- [ ] Verify nutrition facts calculate correctly

### Recipe Scan Tests
- [ ] Capture recipe image
- [ ] Verify ingredients extracted
- [ ] Verify instructions parsed
- [ ] Verify servings calculated

### Label Scan Tests
- [ ] Capture nutrition label
- [ ] Verify greenwashing score displays
- [ ] Verify marketing claims extracted
- [ ] Verify sustainability score shows

### Barcode Scan Tests (No changes needed)
- [ ] Barcode scanning still works
- [ ] Product info displays correctly
- [ ] No regression in existing functionality

---

## Support & Questions

**Service Owner:** Scanning Team  
**Technical Support:** scanning-api@wihy.ai  
**Migration Guide:** [Complete API Reference](./Jan_13_2026_Complete_API_Reference.md)  
**Status Page:** https://status.wihy.ai

---

## Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| Jan 13, 2026 | Breaking changes deployed | ✅ Live |
| Jan 20, 2026 | Migration assessment | 🟡 In Progress |
| Feb 13, 2026 | Migration deadline | ⏳ Upcoming |

**Current Date:** January 13, 2026  
**Days Until Deadline:** 31 days
