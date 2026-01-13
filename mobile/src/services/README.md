# API Services Documentation

## Overview
This directory contains all API service integrations for the WiHY mobile app.

## Services

### 1. Scan Service (`scanService.ts`)
Handles barcode and image scanning.

**Usage:**
```typescript
import { scanService } from '../services';

// Scan a barcode
const result = await scanService.scanBarcode('012345678901');
if (result.success) {
  console.log('Product:', result.product);
  console.log('Nutrition:', result.nutrition);
  console.log('Session ID:', result.scan_metadata?.session_id);
}

// Scan an image
const imageResult = await scanService.scanImage(imageUri);
if (imageResult.success) {
  console.log('Analysis:', imageResult.analysis);
}
```

### 2. Chat Service (`chatService.ts`)
Handles conversational AI interactions.

**Usage:**
```typescript
import { chatService } from '../services';

// Ask a question
const response = await chatService.ask('Is this healthy?');
console.log('Answer:', response.response);

// Ask with context (maintains conversation)
const contextResponse = await chatService.ask(
  'Tell me more about the sugar content',
  {
    product_name: 'Organic Almond Milk',
    session_id: 'barcode_012345678901_1735401234567',
  }
);

// Ask follow-up question
const followUp = await chatService.askFollowUp(
  'What about for weight loss?',
  sessionId
);
```

### 3. FDA Service (`fdaService.ts`)
Analyzes ingredients using FDA database with AI fallback.

**Usage:**
```typescript
import { fdaService } from '../services';

// Analyze an ingredient
const analysis = await fdaService.analyzeIngredient('Sugar');
console.log('Safety Score:', analysis.safety_score);
console.log('Risk Level:', analysis.risk_level);
console.log('Recommendations:', analysis.recommendations);
```

## Configuration

**Base URL:** `https://services.wihy.ai`

**Endpoints:**
- `/api/scan` - Barcode and image scanning
- `/api/ask` - Chat/conversational AI
- `/api/openfda/ingredient/{name}` - FDA ingredient lookup

**Edit config in:** `config.ts`

## Types

All TypeScript types are defined in `types.ts`:
- `BarcodeScanResult`
- `ImageScanResult`
- `ChatResponse`
- `IngredientAnalysis`
- `ProductInfo`
- `NutritionData`

## Error Handling

All services return structured responses with `success` boolean:

```typescript
const result = await scanService.scanBarcode(barcode);
if (!result.success) {
  Alert.alert('Error', result.error || 'Something went wrong');
  return;
}

// Process successful result
processProduct(result.product);
```

## Example: Complete Scan Flow

```typescript
import { scanService, chatService } from '../services';

// 1. Scan barcode
const scanResult = await scanService.scanBarcode('012345678901');

if (scanResult.success) {
  const sessionId = scanResult.scan_metadata?.session_id;
  
  // 2. Navigate to nutrition facts
  navigation.navigate('NutritionFacts', {
    product: scanResult.product,
    nutrition: scanResult.nutrition,
    sessionId,
  });
  
  // 3. Pre-load chat response
  if (scanResult.scan_metadata?.ask_wihy) {
    const chatResponse = await chatService.ask(
      scanResult.scan_metadata.ask_wihy,
      { session_id: sessionId }
    );
    // Cache for instant display
  }
}
```
