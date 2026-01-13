# WIHY ML API Integration - Chat/Ask Endpoint

## ✅ Updated Configuration

The chat service now uses the correct ML API endpoint:

**Old (Incorrect)**:
- Base URL: `https://services.wihy.ai`
- Endpoint: `/api/ask`

**New (Correct)**:
- Base URL: `https://ml.wihy.ai`
- Endpoint: `/ask`

---

## 📡 Endpoint Details

**POST** `https://ml.wihy.ai/ask`

This is the primary AI chat endpoint that handles:
- Food questions with nutrition scores
- Ingredient health impact analysis
- Health & wellness queries
- Barcode product analysis
- Context-aware conversations

---

## 🔧 Request Format

### Basic Request
```typescript
import { chatService } from '../services';

const response = await chatService.ask('Is oatmeal healthy?', {
  session_id: 'user_12345',
});
```

### With Product Context (Barcode Scan)
```typescript
const response = await chatService.ask('Is this healthy?', {
  session_id: 'user_12345',
  productData: {
    name: 'Quaker Oats',
    barcode: '030000010105',
    nutrition: {
      calories: 150,
      protein_g: 5,
      // ... more nutrition data
    },
  },
});
```

### Request Body Structure
```json
{
  "query": "Is oatmeal healthy?",
  "session_id": "user_12345",
  "user_context": {
    "productData": {
      "name": "Quaker Oats",
      "barcode": "030000010105",
      "nutrition": {...}
    }
  }
}
```

---

## 📊 Response Format

### ChatResponse Type
```typescript
interface ChatResponse {
  success: boolean;
  response: string;           // AI-generated answer
  session_id?: string;        // Session for context continuity
  timestamp: string;
  type?: 'food' | 'ingredient' | 'health' | 'general';
  confidence?: number;        // 0-1 confidence score
  source?: 'wihy_model_service' | 'openai_enhancer' | 'research_orchestrator';
  chart_data?: any;          // Optional visualization data
  error?: string;
}
```

### Response Examples

#### Food Query
```json
{
  "success": true,
  "response": "Oatmeal scores 85/100. It's whole grain, high fiber...",
  "type": "food",
  "confidence": 0.92,
  "source": "wihy_model_service",
  "session_id": "user_12345",
  "chart_data": {...}
}
```

#### Ingredient Query
```json
{
  "success": true,
  "response": "Red 40 is a synthetic food dye. Health concerns include...",
  "type": "ingredient",
  "confidence": 0.88,
  "source": "wihy_model_service",
  "session_id": "user_12345"
}
```

---

## 🎯 Usage Patterns

### 1. Simple Health Question
```typescript
const response = await chatService.ask('What are the benefits of spinach?', {
  session_id: user?.email || 'anonymous',
});

console.log('Answer:', response.response);
console.log('Confidence:', response.confidence);
console.log('Type:', response.type); // 'food'
```

### 2. Product Analysis (After Barcode Scan)
```typescript
// After scanning barcode
const scanResult = await scanService.scanBarcode(barcode);

// Ask about the product
const analysis = await chatService.ask('Is this product healthy?', {
  session_id: user?.email,
  productData: {
    name: scanResult.analysis.metadata.product_name,
    barcode: scanResult.analysis.metadata.barcode,
    nutrition: scanResult.analysis.metadata.nutrition_facts,
    ingredients: scanResult.analysis.metadata.ingredients_text,
  },
});
```

### 3. Follow-up Questions
```typescript
// First question
const response1 = await chatService.ask('Tell me about quinoa', {
  session_id: 'user_12345',
});

// Follow-up (uses context from previous question)
const response2 = await chatService.ask('What about organic quinoa?', {
  session_id: 'user_12345', // Same session_id
});
```

### 4. With Confidence Checking
```typescript
const response = await chatService.ask(query, { session_id });

if (response.confidence && response.confidence > 0.8) {
  // High confidence - show answer directly
  displayAnswer(response.response);
} else if (response.confidence && response.confidence > 0.5) {
  // Medium confidence - show with caveat
  displayAnswerWithWarning(response.response);
} else {
  // Low confidence - ask for clarification
  askForClarification();
}
```

### 5. Source-based Handling
```typescript
const response = await chatService.ask(query, { session_id });

switch (response.source) {
  case 'wihy_model_service':
    // Fine-tuned nutrition model
    console.log('Using specialized nutrition AI');
    break;
  case 'openai_enhancer':
    // GPT-enhanced response
    console.log('Using enhanced AI');
    break;
  case 'research_orchestrator':
    // Deep research mode
    console.log('Using research AI');
    break;
}
```

---

## 🔍 Response Types

### 1. Food (`type: 'food'`)
- Includes health scores (0-100)
- Nutrition analysis
- Benefits and concerns
- May include chart_data for visualizations

**Example Question**: "Is salmon healthy?"

### 2. Ingredient (`type: 'ingredient'`)
- No health scores
- Explains what the ingredient is
- Health impact and concerns
- Common uses

**Example Question**: "What is Red 40?"

### 3. Health (`type: 'health'`)
- Evidence-based health answers
- No product scores
- General wellness information

**Example Question**: "What are the benefits of exercise?"

### 4. General (`type: 'general'`)
- Non-health related questions
- General conversation
- Fallback type

**Example Question**: "What's the weather?"

---

## 💡 Best Practices

### 1. Always Use session_id
```typescript
// ✅ Good - enables context and follow-ups
await chatService.ask(query, { session_id: user?.email });

// ❌ Bad - no context continuity
await chatService.ask(query);
```

### 2. Send Product Data for Scans
```typescript
// ✅ Good - AI can analyze specific product
await chatService.ask('Is this healthy?', {
  session_id,
  productData: {
    name: product.name,
    barcode: product.barcode,
    nutrition: product.nutrition_facts,
    ingredients: product.ingredients_text,
  },
});

// ❌ Bad - generic answer without product context
await chatService.ask('Is this healthy?', { session_id });
```

### 3. Check Confidence Scores
```typescript
if (response.confidence && response.confidence < 0.5) {
  // Low confidence - may need user to clarify question
  Alert.alert(
    'Need More Info',
    'Could you be more specific about what you\'re asking?'
  );
}
```

### 4. Handle Different Response Types
```typescript
if (response.type === 'food' && response.chart_data) {
  // Show nutrition charts
  displayNutritionChart(response.chart_data);
} else if (response.type === 'ingredient') {
  // Show ingredient safety info (no score)
  displayIngredientInfo(response.response);
}
```

---

## 🚨 Error Handling

### Network Errors
```typescript
try {
  const response = await chatService.ask(query, { session_id });
} catch (error) {
  if (error.message.includes('Network')) {
    Alert.alert('No Internet', 'Please check your connection');
  } else {
    Alert.alert('Error', 'Failed to get response');
  }
}
```

### Empty Responses
```typescript
const response = await chatService.ask(query, { session_id });

if (!response.response || response.response.trim() === '') {
  // Model filtered response (potentially problematic query)
  Alert.alert(
    'Try Again',
    'Please rephrase your question'
  );
}
```

---

## 📈 Rate Limits

### Free Tier
- 100 requests/day
- Check headers for remaining quota

### Pro Tier
- 10,000 requests/day

### Implementation
```typescript
import { globalRateLimiter } from '../utils';

// Check before asking
if (!globalRateLimiter.canMakeRequest()) {
  Alert.alert('Rate Limit', 'Too many questions. Please wait.');
  return;
}

const response = await chatService.ask(query, { session_id });
```

---

## 🔗 Related Services

### Chat History
```typescript
// Get chat history
GET https://ml.wihy.ai/chat/session/{session_id}/messages

// Start new session
POST https://ml.wihy.ai/chat/session
{
  "user_id": "user_12345"
}

// Get session summary
GET https://ml.wihy.ai/chat/session/{session_id}/summary
```

---

## 📊 Console Logging

All requests are logged automatically:

```
=== CHAT/ASK API CALL ===
Endpoint: https://ml.wihy.ai/ask
Query: Is oatmeal healthy?
Context: {
  "session_id": "user_12345",
  "productData": {...}
}
Request Body: {...}
Response Status: 200 (1234ms)
Response Data: {
  "response": "Oatmeal scores 85/100...",
  "type": "food",
  "confidence": 0.92,
  "source": "wihy_model_service"
}
=== CHAT/ASK SUCCESS ===
```

---

## ✅ Migration Checklist

- [x] Update API base URL to `ml.wihy.ai`
- [x] Change endpoint from `/api/ask` to `/ask`
- [x] Update request format (session_id, user_context)
- [x] Update response type (add type, confidence, source, chart_data)
- [x] Add console logging
- [x] Update documentation

---

## 🎉 Ready to Use

The chat service is now correctly configured to use the ML API endpoint at `https://ml.wihy.ai/ask`.

**Usage**:
```typescript
import { chatService } from '../services';

const response = await chatService.ask('Is oatmeal healthy?', {
  session_id: user?.email,
  productData: {
    name: 'Quaker Oats',
    barcode: '030000010105',
  },
});

console.log('Answer:', response.response);
console.log('Type:', response.type);
console.log('Confidence:', response.confidence);
```

---

**Last Updated**: December 30, 2025  
**ML API URL**: https://ml.wihy.ai  
**Status**: ✅ Production Ready
