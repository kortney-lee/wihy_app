# Link Tracking System - User Guide

## Overview
The WIHY link tracking system allows you to create custom tracking links that identify who shared them and track visits.

## How It Works

### 1. Generate a Tracking Link

You can generate tracking links in two ways:

#### Option A: Using the Link Generator Component
```typescript
import { LinkGenerator } from './components/tracking/LinkTracker';

// In your component
<LinkGenerator onLinkGenerated={(link) => console.log(link)} />
```

#### Option B: Programmatically
```typescript
import { LinkTrackingService } from './components/tracking/LinkTracker';

// Generate a link
const link = LinkTrackingService.generateTrackingLink('john_doe', 'kickstarter');
// Result: https://wihy.ai?ref=john_doe&campaign=kickstarter
```

### 2. Link Structure

Generated links have this format:
```
https://wihy.ai?ref=<user_id>&campaign=<campaign_name>
```

**Parameters:**
- `ref` (required): Identifier for who shared the link (e.g., partner name, user ID, influencer handle)
- `campaign` (optional): Campaign name for organizing links (e.g., "kickstarter", "beta_launch", "social_media")

### 3. Automatic Tracking

When someone visits your site with a tracking link:
1. The `AboutPage` automatically captures the tracking parameters
2. Data is stored locally in the visitor's browser
3. Event is sent to the backend API for analytics
4. You can view who shared the link in the dashboard

### 4. View Tracking Data

#### Access the Dashboard
Navigate to `/tracking-dashboard` to see:
- Total visits
- Top referrers
- Campaign performance
- Recent activity
- Detailed breakdowns

#### API Endpoints

**Get all events:**
```
GET /api/tracking/events
Query params: ?referrer=john_doe&campaign=kickstarter&startDate=2025-01-01
```

**Get stats:**
```
GET /api/tracking/stats
```

**Get specific referrer:**
```
GET /api/tracking/referrer/john_doe
```

## Use Cases

### 1. Partner Tracking
Generate unique links for each partner:
```
Partner A: https://wihy.ai?ref=partner_a&campaign=partnership
Partner B: https://wihy.ai?ref=partner_b&campaign=partnership
```

### 2. Influencer Campaigns
Create links for influencers:
```
https://wihy.ai?ref=influencer_jane&campaign=instagram
https://wihy.ai?ref=youtuber_bob&campaign=youtube
```

### 3. Email Campaigns
Track email campaign effectiveness:
```
Newsletter: https://wihy.ai?ref=newsletter_01&campaign=email
Promo: https://wihy.ai?ref=promo_winter&campaign=email
```

### 4. Social Media
Different links for each platform:
```
Twitter: https://wihy.ai?ref=official&campaign=twitter
LinkedIn: https://wihy.ai?ref=official&campaign=linkedin
Facebook: https://wihy.ai?ref=official&campaign=facebook
```

## Examples

### Example 1: Kickstarter Campaign
```typescript
// Generate link for Kickstarter backers
const kickstarterLink = LinkTrackingService.generateTrackingLink(
  'backer_123',
  'kickstarter'
);

// Share this link with the backer
// When they share it, you'll know it came from backer_123
```

### Example 2: Beta Testers
```typescript
// Generate links for beta testers
const testers = ['alice', 'bob', 'charlie'];
testers.forEach(tester => {
  const link = LinkTrackingService.generateTrackingLink(tester, 'beta');
  console.log(`${tester}: ${link}`);
});
```

### Example 3: Viewing Results
```typescript
// In your dashboard or admin panel
import { useEffect, useState } from 'react';

function MyDashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('/api/tracking/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);
  
  return (
    <div>
      <h1>Total Visits: {stats?.totalEvents}</h1>
      {Object.entries(stats?.byReferrer || {}).map(([ref, count]) => (
        <div key={ref}>{ref}: {count} visits</div>
      ))}
    </div>
  );
}
```

## Integration with Current Site

The tracking is already integrated into `AboutPage.tsx`. When someone visits with a tracking link:

1. URL: `https://wihy.ai?ref=partner_name&campaign=beta`
2. AboutPage captures this automatically
3. Stores in localStorage for attribution
4. Sends to backend for analytics

## Data Storage

Currently using in-memory storage (resets on server restart).

**For production, update `server/routes/tracking.ts` to use a database:**

```typescript
// Replace in-memory array with database
// Example with PostgreSQL:
import { pool } from '../db';

router.post('/capture', async (req, res) => {
  const { referrer, campaign, timestamp, landingPage } = req.body;
  
  await pool.query(
    'INSERT INTO tracking_events (referrer, campaign, timestamp, landing_page) VALUES ($1, $2, $3, $4)',
    [referrer, campaign, timestamp, landingPage]
  );
  
  res.json({ success: true });
});
```

## Best Practices

1. **Use descriptive identifiers**: `kickstarter_backer_42` is better than `kb42`
2. **Consistent naming**: Use lowercase with underscores or hyphens
3. **Group by campaign**: Use campaigns to organize related links
4. **Regular monitoring**: Check the dashboard to see which links perform best
5. **Clean URLs**: Keep ref/campaign values URL-safe (no spaces or special characters)

## Quick Start

1. **Generate a link**:
   - Go to your admin panel or use the LinkGenerator component
   - Enter a user ID (e.g., "john_partner")
   - Optionally enter a campaign (e.g., "kickstarter")
   - Click "Generate Link"
   - Copy and share!

2. **Share the link**:
   - Give it to partners, influencers, or use in campaigns
   - When someone clicks it and visits your site, it's tracked automatically

3. **View results**:
   - Visit `/tracking-dashboard`
   - See who drove the most traffic
   - Analyze which campaigns work best

## Troubleshooting

**Tracking not working?**
- Check browser console for errors
- Verify the URL has `?ref=` parameter
- Make sure the server is running
- Check `/api/tracking/stats` endpoint

**No data in dashboard?**
- Ensure tracking links were actually visited
- Check server logs for API errors
- Verify the tracking route is properly imported in server.ts

## Next Steps

- [ ] Add authentication to dashboard and API endpoints
- [ ] Implement database storage (PostgreSQL/MongoDB)
- [ ] Add conversion tracking (signups, purchases)
- [ ] Create automated reports
- [ ] Add export functionality (CSV, Excel)
- [ ] Implement real-time websocket updates
