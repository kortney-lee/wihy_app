# WIHY API Integration

Pure implementation of WIHY health intelligence API following the official API guide.

**Base URL:** `https://ml.wihy.ai`

## Quick Start

### 1. Simple Question
```typescript
import { wihyAPI } from './services/wihyClientPure';

const response = await wihyAPI.ask("Is coffee healthy?");
console.log(response.response);
```

### 2. React Chat Component
```tsx
import { WIHYChat } from './components/WIHYChat';

function App() {
  return (
    <WIHYChat 
      showQuickQuestions={true}
      onResponse={(response) => console.log(response)}
    />
  );
}
```

### 3. "Analyze with WIHY" Button
```typescript
import { wihy } from './utils/analyzeWithWihy';

// Add to any element
wihy.addButton(document.getElementById('content'), "Content to analyze");

// Auto-setup all buttons on page load
wihy.autoSetup();
```

## API Features

### Core Endpoints
- **`POST /ask`** - Main health questions endpoint (automatically routes to best service)
- **`GET /api/research/articles`** - Bulk research article data for visualizations

### Response Format
```json
{
  "response": "Detailed AI answer...",
  "source": "openai_enhancer|azure_enhancer|nova_enhancer|fallback",
  "confidence": 0.85,
  "type": "health_question|research_query|general",
  "chart_data": {
    "chart_metadata": {
      "research_quality_score": 85,
      "evidence_grade": "B+",
      "study_count": 42
    }
  }
}
```

## Components

### WIHYClient
Main API client class:
```typescript
const client = new WIHYClient();
const response = await client.ask("Is quinoa healthy?", true);
```

### useWIHYChat Hook
React hook for chat functionality:
```typescript
const { messages, loading, sendMessage } = useWIHYChat();
```

### WIHYChat Component
Full chat interface with quick questions and conversation history.

### WIHYQuestion Component
Single question button component for specific use cases.

## Files Structure

```
src/
├── services/
│   └── wihyClientPure.ts      # Main WIHY API client
├── hooks/
│   └── useWIHYChat.ts         # React hook for chat functionality
├── components/
│   ├── WIHYChat.tsx           # Full chat component
│   └── WIHYExamplePage.tsx    # Example implementations
├── utils/
│   └── analyzeWithWihy.ts     # "Analyze with WIHY" utilities
└── types/
    └── wihyApi.ts             # TypeScript type definitions
```

## Examples

### Basic Health Question
```typescript
import { wihyAPI } from './services/wihyClientPure';

async function askHealthQuestion() {
  const response = await wihyAPI.ask("Benefits of omega-3 supplements?");
  console.log(response.response);
  console.log(`Confidence: ${response.confidence * 100}%`);
}
```

### Content Analysis
```typescript
const articleContent = "Mediterranean diet reduces heart disease risk...";
const analysis = await wihyAPI.analyze(articleContent);
console.log(analysis.response);
```

### Research Articles
```typescript
// Research questions (routed via /ask)
const research = await wihyAPI.research("What is the evidence for Mediterranean diet?");
console.log(research.response);
console.log(research.citations); // If available

// Get bulk research data for visualizations
const researchData = await wihyAPI.getResearchData("Mediterranean diet");
researchData.articles.forEach(article => {
  console.log(article.title);
  console.log(article.summary);
  console.log(`Quality: ${article.quality_score}`);
});
```

### Chat with Context
```typescript
const chatResponse = await wihyAPI.chat(
  "Tell me more about protein requirements", 
  "conversation_123"
);
```

## Rate Limits

- **60 requests per minute per IP** for health questions
- Built-in error handling and retry logic
- Automatic conversation context management

## Integration Examples

### HTML + JavaScript
```html
<div data-wihy-analyze="Your health content here">
  <!-- Button will be automatically added -->
</div>

<script>
import { wihy } from './utils/analyzeWithWihy';
wihy.autoSetup();
</script>
```

### React
```tsx
<WIHYChat 
  placeholder="Ask about your health..."
  showQuickQuestions={true}
  onResponse={(response) => {
    // Handle response
    console.log(response);
  }}
/>
```

### Vanilla JavaScript
```javascript
import { WIHYClient } from './services/wihyClientPure';

const client = new WIHYClient();
const response = await client.ask("Is quinoa healthy?");
alert(response.response);
```

## Error Handling

All API calls include built-in error handling:
```typescript
try {
  const response = await wihyAPI.ask("Your question");
  // Handle success
} catch (error) {
  // Handle error
  console.error('WIHY API Error:', error);
}
```

## Chart Data Integration

When `include_charts: true`, responses may include research metadata:
```typescript
if (response.chart_data?.chart_metadata) {
  console.log(`Quality Score: ${response.chart_data.chart_metadata.research_quality_score}/100`);
  console.log(`Evidence Grade: ${response.chart_data.chart_metadata.evidence_grade}`);
  console.log(`Studies: ${response.chart_data.chart_metadata.study_count}`);
}
```

This integration follows the WIHY API Pure Implementation Guide and provides a clean, typed interface for all WIHY functionality.