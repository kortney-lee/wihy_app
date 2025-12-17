# Kickstarter Link Tracking System

## Overview
A complete tracking system to monitor which partners, influencers, and campaigns drive traffic to your Kickstarter page. Generate unique tracking links for each source and see analytics on who clicks them.

## System Architecture

### Tracking Flow
```
1. Admin generates unique link → Kickstarter URL with ref parameter
2. Partner/influencer shares the link
3. User clicks the link → Tracking event captured
4. User redirected to Kickstarter
5. Admin views click data in dashboard
```

### Components

#### Frontend Components
- **LinkTracker.tsx** (`client/src/components/tracking/LinkTracker.tsx`)
  - Core tracking service and utilities
  - `LinkTrackingService.generateTrackingLink()` - Creates Kickstarter URLs with tracking parameters
  - `LinkTrackingService.trackKickstarterClick()` - Records outbound clicks to Kickstarter
  - `LinkGenerator` - UI component for creating links
  - `useTracking` - React hook for tracking functionality

- **TrackingDashboard.tsx** (`client/src/pages/TrackingDashboard.tsx`)
  - Analytics dashboard showing click data
  - Displays: Total clicks, partners/sources, campaigns
  - Shows recent activity and detailed breakdowns
  - Test button for quick system verification

- **AdminLinkGenerator.tsx** (`client/src/pages/AdminLinkGenerator.tsx`)
  - Admin page for generating tracking links
  - Two-column layout with generator + quick guide
  - Example links demonstrating usage patterns
  - Direct navigation to dashboard

#### Backend Implementation
- **server.ts** (Lines 15-110)
  - In-memory tracking storage (array of TrackingEvent objects)
  - **POST** `/api/tracking/capture` - Records tracking events
  - **GET** `/api/tracking/stats` - Returns aggregated analytics
  - **GET** `/api/tracking/referrer/:id` - Gets events for specific source

#### Integration Points
- **AboutPage.tsx** - Kickstarter CTA button with click tracking
- **ButtonComponents.tsx** - CTAButton component supports onClick with href

## Usage Guide

### Generating Tracking Links

1. Navigate to `/tracking-admin`
2. Enter a unique Partner/Source ID (e.g., `partner_acme`, `influencer_jane`)
3. Optionally add a campaign name (e.g., `beta_launch`, `january_2024`)
4. Click "Generate Link"
5. Copy the generated Kickstarter URL
6. Share with the specific partner/source

### Generated Link Format
```
https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices?ref=partner_acme&utm_campaign=beta_launch&utm_source=wihy&utm_medium=referral
```

**Parameters:**
- `ref` - Unique identifier for the traffic source (required)
- `utm_campaign` - Campaign name (optional)
- `utm_source` - Always "wihy"
- `utm_medium` - Always "referral"

### Viewing Analytics

1. Navigate to `/tracking-dashboard`
2. View summary cards:
   - **Kickstarter Clicks** - Total number of clicks tracked
   - **Partners/Sources** - Number of unique sources
   - **Campaigns** - Number of unique campaigns

3. Tables show:
   - **Top Partners & Sources** - Click counts per source
   - **Campaigns** - Click distribution by campaign
   - **Recent Clicks** - Latest tracking events

4. Click "View Details" on any partner to see:
   - All clicks from that source
   - Campaigns they participated in
   - Timestamps of each click

### Testing the System

**Option 1: Empty State Test Button**
1. Go to `/tracking-dashboard`
2. If no data exists, click "Test Tracking System"
3. System creates a test click event
4. Dashboard refreshes to show test data

**Option 2: Generate Real Test Link**
1. Go to `/tracking-admin`
2. Generate link with ID `test_user` and campaign `test`
3. Click the generated Kickstarter link
4. Check dashboard to see the click recorded

**Option 3: About Page Integration**
1. Visit `/about?ref=test_partner&campaign=test_campaign`
2. Click "Join the WIHY Beta" button
3. Click is tracked with the URL parameters
4. View in dashboard under `test_partner`

## Use Cases

### Partner Tracking
Generate unique links for each business partner to see which partnerships are most effective:
```
Partner A: ?ref=partner_acme&utm_campaign=partnership
Partner B: ?ref=partner_globalfit&utm_campaign=partnership
```

### Influencer Campaigns
Track individual influencers or social media campaigns:
```
Jane (Instagram): ?ref=influencer_jane&utm_campaign=instagram_jan
John (YouTube): ?ref=influencer_john&utm_campaign=youtube_review
```

### Email Campaigns
Monitor different email newsletter sends:
```
January Newsletter: ?ref=email_newsletter&utm_campaign=january_2024
Beta Announcement: ?ref=email_beta&utm_campaign=beta_launch
```

### Geographic or Channel Testing
Test different marketing channels or locations:
```
Facebook Ads: ?ref=facebook_ads&utm_campaign=beta_q1
Google Ads: ?ref=google_ads&utm_campaign=beta_q1
SF Launch Event: ?ref=event_sf&utm_campaign=launch_events
```

## Data Structure

### TrackingEvent Interface
```typescript
interface TrackingEvent {
  id: string;              // Unique event ID
  referrer: string;        // Partner/source identifier (from ref parameter)
  campaign: string;        // Campaign name
  timestamp: string;       // ISO timestamp
  landingPage?: string;    // Destination (for compatibility)
  destination?: string;    // 'kickstarter' for outbound clicks
  action?: string;         // 'outbound_click' for Kickstarter clicks
  userAgent?: string;      // Browser info
  ip?: string;            // IP address
}
```

### Storage
- **Production**: In-memory array (clears on server restart)
- **Future Enhancement**: Add database persistence (MongoDB, PostgreSQL, etc.)
- **Client Storage**: localStorage for backup (`wihy_kickstarter_clicks`)

## Technical Details

### Click Tracking Flow
1. User clicks Kickstarter CTA on About page
2. `handleKickstarterClick()` extracts tracking params from URL
3. `LinkTrackingService.trackKickstarterClick()` is called with:
   - `userId`: From `?ref=` parameter or defaults to `'direct_website'`
   - `campaign`: From `?campaign=` or `?utm_campaign=` or defaults to `'about_page'`
4. Tracking data sent to `/api/tracking/capture`
5. Event stored in server memory
6. Link opens in new tab to Kickstarter

### API Endpoints

**POST /api/tracking/capture**
```json
Request:
{
  "referrer": "partner_acme",
  "campaign": "beta_launch",
  "timestamp": "2024-01-15T10:30:00Z",
  "destination": "kickstarter",
  "action": "outbound_click"
}

Response:
{
  "success": true,
  "eventId": "1705318200000-abc123"
}
```

**GET /api/tracking/stats**
```json
Response:
{
  "totalEvents": 47,
  "byReferrer": {
    "partner_acme": 15,
    "influencer_jane": 12,
    "email_newsletter": 20
  },
  "byCampaign": {
    "beta_launch": 27,
    "january_2024": 20
  },
  "byLandingPage": {
    "kickstarter": 47
  },
  "recent": [
    {
      "referrer": "partner_acme",
      "campaign": "beta_launch",
      "timestamp": "2024-01-15T10:30:00Z",
      "landingPage": "kickstarter"
    }
  ]
}
```

**GET /api/tracking/referrer/:id**
```json
Response:
{
  "referrer": "partner_acme",
  "totalVisits": 15,
  "events": [
    {
      "id": "1705318200000-abc123",
      "referrer": "partner_acme",
      "campaign": "beta_launch",
      "timestamp": "2024-01-15T10:30:00Z",
      "landingPage": "kickstarter"
    }
  ]
}
```

## Routes

- `/tracking-admin` - Link generator admin page
- `/tracking-dashboard` - Analytics dashboard
- `/api/tracking/capture` - POST endpoint for recording events
- `/api/tracking/stats` - GET endpoint for aggregated stats
- `/api/tracking/referrer/:id` - GET endpoint for source-specific data

## Future Enhancements

### Immediate Priorities
1. ✅ Basic tracking system (COMPLETE)
2. ✅ Dashboard with analytics (COMPLETE)
3. ✅ Link generator UI (COMPLETE)
4. ✅ AboutPage integration (COMPLETE)

### Future Features
1. **Database Persistence**
   - Switch from in-memory to MongoDB/PostgreSQL
   - Prevent data loss on server restart
   - Enable historical analysis

2. **Advanced Analytics**
   - Click-through rate calculations
   - Time-based analysis (hourly, daily, weekly)
   - Geographic data from IP addresses
   - Device/browser breakdowns
   - Conversion tracking (if Kickstarter provides webhook)

3. **Bulk Operations**
   - CSV export of tracking data
   - Bulk link generation
   - Import partner lists

4. **Real-time Features**
   - Live dashboard updates (WebSocket)
   - Real-time notifications for new clicks
   - Active campaign monitoring

5. **Security & Access Control**
   - Admin authentication
   - API key for programmatic access
   - Rate limiting on tracking endpoints
   - GDPR compliance features

6. **Integration Options**
   - Google Analytics integration
   - Zapier webhooks
   - Slack notifications
   - Email reports

## Troubleshooting

### No Data Showing in Dashboard
1. Verify server is running: Check `/api/health`
2. Test tracking endpoint: Click "Test Tracking System" button
3. Check browser console for API errors
4. Verify API routes are registered in server.ts

### Links Not Tracking Clicks
1. Check if onClick handler is firing (console.log in handleKickstarterClick)
2. Verify network request to `/api/tracking/capture` in Network tab
3. Ensure CTAButton passes onClick to anchor element
4. Check server logs for tracking capture confirmations

### Generated Links Incorrect
1. Verify KICKSTARTER_URL constant in LinkTracker.tsx
2. Check URLSearchParams construction
3. Test link generation with console.log output

### Data Lost After Server Restart
- Expected behavior with in-memory storage
- Implement database persistence for production

## Files Modified

### Created
- `client/src/components/tracking/LinkTracker.tsx` - Core tracking service
- `client/src/pages/TrackingDashboard.tsx` - Analytics dashboard
- `client/src/pages/AdminLinkGenerator.tsx` - Link generator UI
- `KICKSTARTER_TRACKING_SYSTEM.md` - This documentation

### Modified
- `client/src/App.tsx` - Added routes for dashboard and admin pages
- `client/src/pages/AboutPage.tsx` - Added Kickstarter click tracking
- `client/src/components/shared/ButtonComponents.tsx` - Added onClick support to CTAButton
- `server.ts` - Added inline tracking API routes (lines 15-110)

### To Delete (Redundant)
- `server/routes/tracking.ts` - Duplicate routes with import errors

## Security Considerations

### Current Implementation
- No authentication (admin pages publicly accessible)
- In-memory storage (data not persisted)
- No rate limiting
- Basic input validation

### Production Recommendations
1. Add authentication to admin routes
2. Implement rate limiting on tracking endpoints
3. Add CORS restrictions
4. Sanitize and validate all inputs
5. Use HTTPS in production
6. Add API key authentication for programmatic access
7. Implement data retention policies
8. Add GDPR compliance features (data export, deletion)

## Maintenance Notes

### Data Cleanup
Since data is in-memory, it clears on server restart. For production:
- Implement database with TTL/expiration
- Regular cleanup of old events
- Archive historical data

### Monitoring
- Track API endpoint performance
- Monitor storage size
- Alert on tracking failures
- Log suspicious activity

### Backup
- Export tracking data regularly
- Store backups securely
- Test restoration procedures

---

**Status**: ✅ System Complete and Ready for Testing
**Last Updated**: January 2024
**Version**: 1.0
