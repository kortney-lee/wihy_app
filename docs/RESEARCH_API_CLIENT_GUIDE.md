# WIHY Research API - Client Integration Guide

## Overview

The Research Screen now correctly integrates with the WIHY Research API (`https://services.wihy.ai/api/research/*`) instead of calling PubMed's API directly. This provides better performance, caching, AI-powered analysis, and health claim verification.

## Updated Service Methods

### 1. Search Research Articles

**Endpoint:** `GET /api/research/search`

```typescript
const results = await researchService.searchArticles({
  query: 'mediterranean diet cardiovascular',
  limit: 20,
  category: 'nutrition', // optional
});
```

**Parameters:**
- `query` (required): Search terms
- `limit` (optional): Number of results (default: 20, max: 50)
- `category` (optional): Filter by category (nutrition, fitness, etc.)

**API Query Parameters:**
- `q`: Search query
- `limit`: Number of results
- `type`: Article type filter
- `year_from`: Minimum publication year
- `year_to`: Maximum publication year
- `study_type`: Filter by methodology (randomized_controlled_trial, meta_analysis, systematic_review, etc.)
- `evidence_level`: Filter by quality (high, moderate, low)

### 2. Get Article Details

**Endpoint:** `GET /api/research/article/:pmcid`

```typescript
const article = await researchService.getArticle('PMC8234567');
```

**Features:**
- Comprehensive article metadata
- Study design and methodology
- Quality assessment (GRADE, Cochrane)
- Citation metrics
- Full-text sections (if available)

### 3. Verify Health Claims

**Endpoint:** `POST /api/research/verify`

```typescript
const verification = await researchService.verifyClaim(
  'Green tea prevents cancer',
  {
    specific_type: 'breast_cancer',
    population: 'postmenopausal_women'
  }
);
```

**Response includes:**
- Overall verdict (supported, partially_supported, not_supported, contradicted)
- Evidence strength (high, moderate, low, very_low)
- Supporting and contradicting studies
- Mechanistic evidence
- Clinical recommendations

### 4. Get Research Trends

**Endpoint:** `GET /api/research/trends`

```typescript
const trends = await researchService.getTrends('3months', 'nutrition');
```

**Parameters:**
- `timeframe`: '1month' | '3months' | '6months' | '1year'
- `category`: Optional filter (nutrition, supplements, lifestyle, medical)

**Response includes:**
- Trending topics with trend scores
- New studies published
- Evidence direction (increasingly_positive, mostly_positive, etc.)
- Emerging research areas
- Research gaps identified

### 5. Check Service Status

**Endpoint:** `GET /api/research/status`

```typescript
const status = await researchService.getStatus();
```

## Authentication

All research API calls require client credentials:

```typescript
headers: {
  'X-Client-ID': API_CONFIG.servicesClientId,
  'X-Client-Secret': API_CONFIG.servicesClientSecret,
}
```

These are automatically added by the `researchService` methods.

## Response Format

### Search Results

```json
{
  "success": true,
  "query": "mediterranean diet cardiovascular",
  "results": [
    {
      "pmcid": "PMC8234567",
      "title": "Mediterranean Diet and Primary Prevention...",
      "authors": ["Martinez-Gonzalez MA", "Gea A", "Ruiz-Canela M"],
      "journal": "New England Journal of Medicine",
      "publication_date": "2024-09-15",
      "study_type": "meta_analysis",
      "evidence_level": "high",
      "key_findings": [...],
      "relevance_score": 0.96
    }
  ],
  "total_found": 1247,
  "evidence_summary": {
    "high_quality_studies": 6,
    "overall_evidence_strength": "strong"
  }
}
```

## Study Types

- `randomized_controlled_trial`: RCTs with control groups
- `meta_analysis`: Statistical synthesis of multiple studies
- `systematic_review`: Comprehensive literature reviews
- `observational_study`: Non-interventional studies
- `cohort_study`: Long-term follow-up studies
- `case_control`: Retrospective comparison studies
- `cross_sectional`: Snapshot studies
- `case_report`: Individual case studies
- `review`: General literature reviews

## Evidence Levels

- **High**: Meta-analyses, large RCTs, systematic reviews
- **Moderate**: Individual RCTs, well-designed observational studies
- **Low**: Case-control studies, cross-sectional studies
- **Very Low**: Case series, expert opinion

## Error Handling

All methods include fallback to mock data on API errors:

```typescript
try {
  const results = await researchService.searchArticles({ query });
  // Use real API results
} catch (error) {
  // Automatically returns mock data for development
  // User sees a helpful error message
}
```

## Caching

Search results are cached locally for 30 minutes to improve performance and reduce API calls:

```typescript
// Cache key: research_cache_{query}
// Expiry: 30 minutes
// Storage: AsyncStorage
```

## Migration from Direct PubMed API

### Before (Direct NCBI PubMed API)
```typescript
// ❌ Old way - calling PubMed directly
const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?...`;
const response = await fetch(searchUrl);
```

### After (WIHY Research API)
```typescript
// ✅ New way - using WIHY Research API
const results = await researchService.searchArticles({ 
  query: 'mediterranean diet',
  limit: 20 
});
```

### Benefits of WIHY Research API

1. **Better Performance**: Cached results, optimized queries
2. **Enhanced Data**: Evidence grading, quality assessment, AI synthesis
3. **Health Claims**: Verify claims against scientific evidence
4. **Unified Format**: Consistent response structure
5. **Client Auth**: Secure access with client credentials
6. **Rate Limits**: Higher limits than public PubMed API
7. **AI Features**: Claim verification, bias detection, evidence mapping

## Future Enhancements

Planned features for the Research API integration:

- [ ] Evidence map visualization
- [ ] Automated meta-analysis
- [ ] Conflict of interest analysis
- [ ] Research quality dashboards
- [ ] Personalized research feeds
- [ ] Citation network graphs
- [ ] Systematic review generation

## References

- Main API Spec: See user-provided Research API documentation
- Client Implementation: `mobile/src/services/researchService.ts`
- Screen Component: `mobile/src/screens/ResearchScreen.tsx`
- Config: `mobile/src/services/config.ts`
