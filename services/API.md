# vHealth Services API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, no authentication is required for API endpoints. For production use, consider implementing API keys or OAuth.

## Response Format
All API responses follow a consistent JSON format:

**Success Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional detailed error information"
}
```

## Endpoints

### Health & Status

#### GET /api/health
Health check endpoint to verify service status.

**Response:**
```json
{
  "status": "OK",
  "message": "vHealth API is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/test
Comprehensive system test endpoint.

**Response:**
```json
{
  "message": "vHealth API is working!",
  "database": "connected|disconnected",
  "rss_controller": "available|unavailable",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Nutrition Analysis

#### POST /api/analyze
Analyze nutrition information for a food query.

**Request Body:**
```json
{
  "query": "apple"
}
```

**Response:**
```json
{
  "food": "apple",
  "nutrition": {
    "calories": 95,
    "protein": 8,
    "carbs": 25,
    "fat": 3
  },
  "healthScore": 85,
  "analysis": "Nutritional analysis for apple"
}
```

#### GET /api/nutrition/:query
Get nutrition information for a specific food item.

**Parameters:**
- `query` (string): Food item to analyze

**Example:**
```
GET /api/nutrition/banana
```

**Response:**
```json
{
  "success": true,
  "item": "banana",
  "calories_per_serving": 250,
  "macros": {
    "protein": "10g",
    "carbs": "30g",
    "fat": "12g"
  },
  "processed_level": "medium",
  "verdict": "Generally healthy option with moderate processing.",
  "snap_eligible": true
}
```

### RSS & News Management

#### GET /api/news/feeds
Get list of available RSS feeds.

**Response:**
```json
{
  "success": true,
  "feeds": [
    {
      "id": 1,
      "title": "Health News Daily",
      "url": "https://example.com/feed.xml",
      "category": "health"
    }
  ]
}
```

#### GET /api/news/articles
Get health news articles.

**Query Parameters:**
- `limit` (number, optional): Number of articles to return (default: 10)
- `category` (string, optional): Filter by category

**Response:**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "title": "Mediterranean Diet Benefits",
      "description": "Recent studies show...",
      "link": "https://example.com/article",
      "created_at": "2024-01-01T12:00:00.000Z",
      "feed": {
        "title": "Health News",
        "category": "nutrition"
      }
    }
  ],
  "count": 1
}
```

#### POST /api/news/articles/ingest
Manually trigger article ingestion from RSS feeds.

**Response:**
```json
{
  "success": true,
  "message": "Articles ingested successfully",
  "count": 15
}
```

#### POST /api/news/seed
Seed sample RSS feeds for testing.

**Response:**
```json
{
  "success": true,
  "message": "Sample feeds seeded successfully"
}
```

### Caching System

#### POST /api/cache/save
Save search results to cache for faster retrieval.

**Request Body:**
```json
{
  "query": "nutrition apple",
  "results": {
    "calories": 95,
    "protein": 0.5
  },
  "source": "nutrition-api"
}
```

**Response:**
```json
{
  "success": true,
  "id": 123,
  "message": "Results cached successfully"
}
```

#### GET /api/cache/get
Retrieve cached results by query.

**Query Parameters:**
- `q` (string, required): Search query

**Example:**
```
GET /api/cache/get?q=nutrition apple
```

**Response:**
```json
{
  "id": 123,
  "query": "nutrition apple",
  "results": {
    "calories": 95,
    "protein": 0.5
  },
  "source": "nutrition-api",
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/cache/similar
Find similar cached results.

**Query Parameters:**
- `q` (string, required): Search query

**Response:**
```json
{
  "success": true,
  "similar": [
    {
      "id": 124,
      "query": "apple nutrition facts",
      "similarity": 0.85,
      "results": {...}
    }
  ]
}
```

#### DELETE /api/cache/delete/:id
Delete a specific cache entry.

**Parameters:**
- `id` (number): Cache entry ID

**Response:**
```json
{
  "success": true,
  "message": "Cache entry deleted successfully"
}
```

#### POST /api/cache/cleanup
Clean up expired cache entries.

**Response:**
```json
{
  "success": true,
  "deleted": 25,
  "message": "Cleaned up 25 expired entries"
}
```

#### GET /api/cache/stats
Get cache statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_entries": 150,
    "expired_entries": 10,
    "cache_hit_rate": 0.75,
    "storage_used": "2.5MB"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid parameters |
| 404  | Not Found - Resource not found |
| 500  | Internal Server Error |

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider implementing rate limiting based on your requirements.

## CORS

CORS is enabled for all origins in development. For production, configure specific allowed origins in the environment variables.

## Examples

### cURL Examples

**Health Check:**
```bash
curl "http://localhost:5000/api/health"
```

**Nutrition Analysis:**
```bash
curl -X POST "http://localhost:5000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"query": "apple"}'
```

**Get News Articles:**
```bash
curl "http://localhost:5000/api/news/articles?limit=5"
```

**Cache Search Results:**
```bash
curl -X POST "http://localhost:5000/api/cache/save" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "results": {"data": "sample"},
    "source": "test"
  }'
```

### JavaScript/Node.js Examples

**Health Check:**
```javascript
const response = await fetch('http://localhost:5000/api/health');
const data = await response.json();
console.log(data);
```

**Nutrition Analysis:**
```javascript
const response = await fetch('http://localhost:5000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'apple' })
});
const data = await response.json();
console.log(data);
```

### Python Examples

**Using requests library:**
```python
import requests

# Health check
response = requests.get('http://localhost:5000/api/health')
print(response.json())

# Nutrition analysis
response = requests.post('http://localhost:5000/api/analyze', 
                        json={'query': 'apple'})
print(response.json())
```

## Development Notes

- All endpoints support JSON request/response format
- Timestamps are in ISO 8601 format
- Numeric IDs are integers
- String fields support UTF-8 encoding
- Maximum request body size: 10MB

## Changelog

### v1.0.0
- Initial API release
- Health and nutrition endpoints
- RSS feed management
- Caching system
- Basic error handling