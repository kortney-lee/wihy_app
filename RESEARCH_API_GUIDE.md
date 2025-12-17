# WIHY Research API Guide

## Overview
This document provides comprehensive documentation for the WIHY Research API endpoints used in the Research Dashboard and Panel components.

**Base URL:** `https://services.wihy.ai` (configurable via `REACT_APP_RESEARCH_API_BASE_URL`)

---

## API Endpoints

### 1. Search Research Articles

**Endpoint:** `GET /api/research/search`

**Description:** Search for research articles by keyword with optional filters.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | Yes | Search term (topic, ingredient, health claim) |
| `limit` | number | No | Number of results to return (default: 20) |
| `year_from` | number | No | Filter articles published from this year |
| `study_type` | string | No | Filter by study type (see Study Types below) |
| `evidence_level` | string | No | Filter by evidence quality (high, moderate, low, very_low) |

**Study Types:**
- `randomized_controlled_trial`
- `meta_analysis`
- `systematic_review`
- `observational_study`
- `case_control`
- `cohort_study`
- `cross_sectional`
- `case_report`
- `review`

**Example Request:**
```javascript
const keyword = 'intermittent fasting';
const limit = 20;
const qs = new URLSearchParams({ keyword, limit });
const response = await fetch(`https://services.wihy.ai/api/research/search?${qs}`);
const data = await response.json();
```

**Response Type:**
```typescript
{
  success: boolean;
  keyword: string;
  articles: [
    {
      id: string;
      pmcid: string;           // PubMed Central ID
      title: string;
      authors?: string;
      authorCount?: number;
      journal?: string;
      publishedDate?: string;
      publicationYear?: number;
      abstract?: string;
      studyType?: string;
      researchArea?: string;
      evidenceLevel?: string;
      relevanceScore?: number;
      rank?: number;
      fullTextAvailable?: boolean;
      links?: {
        pmcWebsite?: string;
        pubmedLink?: string;
        pdfDownload?: string | null;
        doi?: string;
      };
    }
  ];
}
```

---

### 2. Get Full Article Content

**Endpoint:** `GET /api/research/pmc/:pmcId/content`

**Description:** Retrieve the full text content of a specific research article by PubMed Central ID.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pmcId` | string | Yes | PubMed Central article ID (e.g., "PMC12345678") |

**Example Request:**
```javascript
const pmcId = 'PMC12345678';
const response = await fetch(`https://services.wihy.ai/api/research/pmc/${pmcId}/content`);
const data = await response.json();
```

**Response Type:**
```typescript
{
  success: boolean;
  pmcId: string;
  content?: {
    title?: string;
    authors?: [
      {
        name: string;
        affiliation?: string;
      }
    ];
    journal?: string;
    publicationYear?: number;
    abstract?: string;
    bodyParagraphs?: string[];   // Full text broken into paragraphs
    keywords?: string[];
  };
  links?: {
    pmcWebsite?: string;
    pdfDownload?: string;
  };
}
```

---

### 3. Verify Health Claim

**Endpoint:** `POST /api/research/verify`

**Description:** Evaluate a health claim against scientific evidence and provide an evidence-based assessment.

**Request Body:**
```typescript
{
  claim: string;  // The health claim to evaluate
}
```

**Example Request:**
```javascript
const claimText = 'Green tea prevents cancer';
const response = await fetch('https://services.wihy.ai/api/research/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ claim: claimText })
});
const data = await response.json();
```

**Response Type:**
```typescript
{
  success: boolean;
  claim: string;
  claim_specificity?: string;
  verification_result?: {
    overall_verdict?: string;      // Summary verdict on the claim
    evidence_strength?: string;    // Strength of supporting evidence
    confidence_level?: number;     // 0-1 confidence score
    recommendation?: string;       // Practical recommendation
  };
  claim_accuracy_rating?: {
    original_claim?: string;
    accurate_statement?: string;   // More accurate version of claim
    certainty_level?: string;      // How certain we can be
  };
}
```

---

## Usage Examples

### Complete Search Flow

```typescript
import React, { useState } from 'react';

const RESEARCH_API_BASE = 'https://services.wihy.ai';

function ResearchExample() {
  const [results, setResults] = useState([]);
  const [article, setArticle] = useState(null);

  // 1. Search for articles
  const searchResearch = async (keyword: string) => {
    const qs = new URLSearchParams({ keyword, limit: '20' });
    const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?${qs}`);
    const data = await res.json();
    
    if (data.success) {
      setResults(data.articles);
    }
  };

  // 2. Load full article content
  const loadArticle = async (pmcId: string) => {
    const res = await fetch(`${RESEARCH_API_BASE}/api/research/pmc/${pmcId}/content`);
    const data = await res.json();
    
    if (data.success) {
      setArticle(data);
    }
  };

  // 3. Verify a health claim
  const verifyClaim = async (claim: string) => {
    const res = await fetch(`${RESEARCH_API_BASE}/api/research/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim })
    });
    const data = await res.json();
    
    if (data.success) {
      console.log('Verdict:', data.verification_result?.overall_verdict);
      console.log('Evidence:', data.verification_result?.evidence_strength);
    }
  };

  return (
    <div>
      <button onClick={() => searchResearch('creatine')}>
        Search Creatine
      </button>
      <button onClick={() => verifyClaim('Creatine is safe for daily use')}>
        Verify Claim
      </button>
    </div>
  );
}
```

### Advanced Search with Filters

```typescript
const searchWithFilters = async () => {
  const params = {
    keyword: 'vitamin D',
    limit: 50,
    year_from: 2020,
    study_type: 'meta_analysis',
    evidence_level: 'high'
  };
  
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  });
  
  const response = await fetch(
    `https://services.wihy.ai/api/research/search?${qs}`
  );
  const data = await response.json();
  
  return data.articles;
};
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- **200 OK**: Request succeeded
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Resource (article) not found
- **500 Internal Server Error**: Server error

**Example Error Handling:**
```typescript
try {
  const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?keyword=test`);
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Search failed: ${res.status} ${res.statusText}. ${errorText}`);
  }
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error('Search not successful');
  }
  
  // Process results
  console.log(data.articles);
  
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Best Practices

### 1. Use Environment Variables
```typescript
const RESEARCH_API_BASE = 
  process.env.REACT_APP_RESEARCH_API_BASE_URL || 'https://services.wihy.ai';
```

### 2. Build Query Strings Safely
```typescript
const buildQS = (params: Record<string, any>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v));
    }
  });
  return q.toString();
};
```

### 3. Handle Loading States
```typescript
const [loading, setLoading] = useState(false);

const runSearch = async (keyword: string) => {
  setLoading(true);
  try {
    const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?keyword=${keyword}`);
    const data = await res.json();
    setResults(data.articles);
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 4. Validate Before POST Requests
```typescript
const runClaimVerification = async (claimText: string) => {
  if (!claimText.trim()) {
    console.warn('Claim text is empty');
    return;
  }
  
  const res = await fetch(`${RESEARCH_API_BASE}/api/research/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim: claimText.trim() })
  });
  
  return await res.json();
};
```

---

## Rate Limiting

- No explicit rate limits documented
- Recommended: Implement client-side debouncing for search inputs
- Use reasonable `limit` values (10-50 results)

---

## Integration Notes

### Used in Components:
- `ResearchPanel.tsx` - Main research workspace with 3-pane layout
- `ResearchDashboard.tsx` - Entry point with KPI cards and navigation

### Key Features:
- Real-time search with keyword filtering
- Full-text article retrieval
- Evidence-based claim verification
- Study metadata (type, evidence level, relevance scoring)
- Links to PubMed, PMC, DOI, and PDF downloads

---

## TypeScript Type Definitions

For complete type safety, import these types in your components:

```typescript
type EvidenceLevel = 'high' | 'moderate' | 'low' | 'very_low';

type StudyType =
  | 'randomized_controlled_trial'
  | 'meta_analysis'
  | 'systematic_review'
  | 'observational_study'
  | 'case_control'
  | 'cohort_study'
  | 'cross_sectional'
  | 'case_report'
  | 'review';

type ResearchSearchResult = {
  id: string;
  pmcid: string;
  title: string;
  authors?: string;
  authorCount?: number;
  journal?: string;
  publishedDate?: string;
  publicationYear?: number;
  abstract?: string;
  studyType?: string;
  researchArea?: string;
  evidenceLevel?: string;
  relevanceScore?: number;
  rank?: number;
  fullTextAvailable?: boolean;
  links?: {
    pmcWebsite?: string;
    pubmedLink?: string;
    pdfDownload?: string | null;
    doi?: string;
  };
};
```

---

## Support

For API issues or questions:
- Check console for detailed error messages
- Verify `REACT_APP_RESEARCH_API_BASE_URL` is set correctly
- Ensure CORS is configured for your domain

**Last Updated:** December 17, 2025
