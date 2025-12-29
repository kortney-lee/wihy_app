# WiHy API v4.0.0 Enhanced Analysis Update

## [OK] **What Was Added**

###  **Enhanced Analysis Support**
The WiHy API now supports the `analyse` parameter for OpenAI-powered enhanced analysis as documented in the API specification.

### [CYCLE] **Updated Interfaces**

#### **HealthQuestionRequest** (updated)
```typescript
export interface HealthQuestionRequest {
  query: string;
  analyse?: boolean; // [NEW] Optional OpenAI enhanced analysis
  user_context?: {
    age?: number;
    health_goals?: string[];
    dietary_restrictions?: string[];
    current_medications?: string[];
    activity_level?: 'low' | 'moderate' | 'high' | 'very_high';
    health_concerns?: string[];
  };
}
```

#### **HealthQuestionResponse** (enhanced)
```typescript
export interface HealthQuestionResponse {
  success: boolean;
  data: { /* existing data structure */ };
  analysis?: { // [NEW] Enhanced analysis structure
    summary: string;
    recommendations: string[];
    confidence_score: number;
    charts?: { /* chart data */ };
    metadata?: { /* metadata */ };
    openai_analysis?: { // [NEW] OpenAI analysis section
      summary: string;
      details: string;
      sources: string[];
      related_topics: string[];
      recommendations: string[];
      medical_disclaimer: string;
    };
  };
  timestamp: string;
  processing_time?: number;
}
```

### [ROCKET] **New Methods**

#### **1. askWithAnalysis() - Flexible Analysis Control**
```typescript
// Basic question (analyse = false)
const basicResponse = await wihyAPI.askWithAnalysis(
  "What are the health benefits of blueberries?",
  { age: 30, health_concerns: ['energy'] },
  false
);

// Enhanced question (analyse = true)
const enhancedResponse = await wihyAPI.askWithAnalysis(
  "What are the health benefits of blueberries?",
  { age: 30, health_concerns: ['energy'] },
  true
);
```

#### **2. askWithEnhancedAnalysis() - Always Enhanced**
```typescript
// Always uses analyse = true for comprehensive scientific analysis
const response = await wihyAPI.askWithEnhancedAnalysis(
  "Is quinoa healthy for weight loss?",
  { age: 32, health_goals: ['weight_loss'] }
);
```

### [CYCLE] **Updated Legacy Methods**

#### **askEnhancedHealthQuestion() - Now supports analyse parameter**
```typescript
// Default enhanced (analyse = true)
const response1 = await wihyAPI.askEnhancedHealthQuestion({
  query: "Is coffee healthy?"
});

// Explicit enhanced analysis
const response2 = await wihyAPI.askEnhancedHealthQuestion({
  query: "Is coffee healthy?",
  analyse: true
});

// Basic analysis only
const response3 = await wihyAPI.askEnhancedHealthQuestion({
  query: "Is coffee healthy?",
  analyse: false
});
```

### [CHART] **Enhanced Response Handling**

#### **Improved Format Output**
The `formatResponse()` method now handles OpenAI analysis:
```typescript
const formatted = wihyAPI.formatResponse(response);
// Now includes:
// - Enhanced Scientific Analysis section
// - Research Sources
// - Related Topics  
// - Evidence-Based Recommendations
// - Medical Disclaimers
```

#### **Enhanced Extraction Methods**
```typescript
// Gets recommendations from both standard and OpenAI analysis
const recommendations = wihyAPI.extractRecommendations(response);

// Gets citations including OpenAI sources
const citations = wihyAPI.extractCitations(response);

// Gets benefits from health insights
const benefits = wihyAPI.extractBenefits(response);
```

## [TARGET] **Usage Examples**

### **Basic Health Question**
```typescript
const basicResponse = await wihyAPI.askHealthQuestion({
  query: "What foods help with energy?",
  analyse: false,
  user_context: {
    age: 28,
    health_goals: ['energy', 'focus'],
    activity_level: 'moderate'
  }
});
```

### **Enhanced Analysis with OpenAI**
```typescript
const enhancedResponse = await wihyAPI.askHealthQuestion({
  query: "What foods help with energy?",
  analyse: true, //  Enables OpenAI analysis
  user_context: {
    age: 28,
    health_goals: ['energy', 'focus'],
    activity_level: 'moderate'
  }
});

// Access enhanced insights
if (enhancedResponse.analysis?.openai_analysis) {
  const openAI = enhancedResponse.analysis.openai_analysis;
  console.log('Scientific Details:', openAI.details);
  console.log('Research Sources:', openAI.sources);
  console.log('Related Topics:', openAI.related_topics);
  console.log('Evidence-Based Recommendations:', openAI.recommendations);
}
```

### **Legacy Compatibility**
```typescript
// All existing code continues to work
const response = await wihyAPI.searchHealth("What is healthy breakfast?");
const recommendations = wihyAPI.extractRecommendations(response);
const formatted = wihyAPI.formatWihyResponse(response);
```

##  **Analysis Levels**

### **Standard Analysis** (`analyse: false` or omitted)
- [OK] Fast WIHY model responses
- [OK] Health insights and recommendations  
- [OK] Charts and visualizations
- [OK] Quick results

### **Enhanced Analysis** (`analyse: true`)
- [OK] Everything from Standard Analysis
- [OK] Scientific research backing
- [OK] Medical journal citations
- [OK] Detailed explanations
- [OK] Related health topics
- [OK] Evidence-based recommendations
- [OK] Medical disclaimers

## [PARTY] **Benefits**

1. ** Comprehensive Analysis**: Get both fast WIHY insights + deep scientific explanations
2. **[BOOKS] Research Backing**: Access to medical journal citations and studies
3. **[LINK] Topic Expansion**: Discover related health concepts
4. **️ Medical Context**: Proper disclaimers and educational framing
5. **[ROCKET] Flexible Usage**: Choose analysis depth based on your needs
6. **[CYCLE] Full Compatibility**: All existing code continues to work

## [ROCKET] **Ready to Use!**

The enhanced WiHy API v4.0.0 is now ready with full support for the `analyse` parameter. Choose your analysis level and get the health intelligence you need! [TARGET]