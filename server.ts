import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import from the services directory (where your actual routes are)
import nutritionRoutes from './services/src/routes/nutritionRoutes';
import openFoodFactsRoutes from './services/src/routes/openFoodFactsRoutes';
// Tracking routes will be added inline for now

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory tracking storage
interface TrackingEvent {
  id: string;
  referrer: string;
  campaign: string;
  timestamp: string;
  landingPage: string;
  userAgent?: string;
  ip?: string;
  originalSource?: string;  // The very first source (e.g., Facebook)
  destinationUrl?: string;  // Where they clicked to (e.g., Kickstarter)
  eventType?: 'inbound' | 'outbound'; // Track direction of traffic
}

const trackingEvents: TrackingEvent[] = [];

// Tracking API Routes
app.post('/api/tracking/capture', (req, res) => {
  try {
    const { referrer, campaign, timestamp, landingPage, originalSource, destinationUrl, eventType } = req.body;
    
    if (!referrer) {
      return res.status(400).json({ error: 'Referrer is required' });
    }

    const event: TrackingEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      referrer,
      campaign: campaign || 'direct',
      timestamp: timestamp || new Date().toISOString(),
      landingPage: landingPage || '/',
      userAgent: req.headers['user-agent'],
      ip: req.ip || (req.headers['x-forwarded-for'] as string),
      originalSource,  // Preserve the original source (e.g., Facebook)
      destinationUrl,  // Track where they clicked to
      eventType: eventType || 'inbound'
    };

    trackingEvents.push(event);
    console.log('Tracking event captured:', event);

    res.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Tracking capture error:', error);
    res.status(500).json({ error: 'Failed to capture tracking event' });
  }
});

app.get('/api/tracking/stats', (req, res) => {
  try {
    const stats = {
      totalEvents: trackingEvents.length,
      byReferrer: {} as Record<string, number>,
      byCampaign: {} as Record<string, number>,
      byLandingPage: {} as Record<string, number>,
      recent: trackingEvents
        .slice(-10)
        .reverse()
        .map(e => ({
          referrer: e.referrer,
          campaign: e.campaign,
          timestamp: e.timestamp,
          landingPage: e.landingPage
        }))
    };

    trackingEvents.forEach(event => {
      stats.byReferrer[event.referrer] = (stats.byReferrer[event.referrer] || 0) + 1;
      stats.byCampaign[event.campaign] = (stats.byCampaign[event.campaign] || 0) + 1;
      stats.byLandingPage[event.landingPage] = (stats.byLandingPage[event.landingPage] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Tracking stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve tracking stats' });
  }
});

app.get('/api/tracking/referrer/:id', (req, res) => {
  try {
    const { id } = req.params;
    const events = trackingEvents.filter(e => e.referrer === id);
    
    res.json({
      referrer: id,
      totalVisits: events.length,
      events: events.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    });
  } catch (error) {
    console.error('Referrer tracking error:', error);
    res.status(500).json({ error: 'Failed to retrieve referrer data' });
  }
});

// Engagement Dashboard API - Public endpoint for partners/marketers to see their stats
app.get('/api/tracking/engagement/:trackingId', (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // Get all events for this tracking ID (both as referrer and originalSource)
    const inboundEvents = trackingEvents.filter(e => 
      e.referrer === trackingId && e.eventType === 'inbound'
    );
    const outboundEvents = trackingEvents.filter(e => 
      e.originalSource === trackingId && e.eventType === 'outbound'
    );
    
    const totalClicks = inboundEvents.length;
    const totalConversions = outboundEvents.length;
    const conversionRate = totalClicks > 0 
      ? Math.round((totalConversions / totalClicks) * 100) 
      : 0;

    // Top campaigns
    const campaignMap: Record<string, number> = {};
    [...inboundEvents, ...outboundEvents].forEach(e => {
      campaignMap[e.campaign] = (campaignMap[e.campaign] || 0) + 1;
    });
    const topCampaigns = Object.entries(campaignMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([campaign, clicks]) => ({ campaign, clicks }));

    // Destinations
    const destinationMap: Record<string, number> = {};
    outboundEvents.forEach(e => {
      let destName = 'Other';
      if (e.destinationUrl) {
        if (e.destinationUrl.includes('kickstarter')) destName = 'Kickstarter';
        else if (e.destinationUrl.includes('instagram')) destName = 'Instagram';
        else if (e.destinationUrl.includes('facebook')) destName = 'Facebook';
        else if (e.destinationUrl.includes('twitter')) destName = 'Twitter';
        else destName = e.destinationUrl.split('/')[2] || 'External';
      }
      destinationMap[destName] = (destinationMap[destName] || 0) + 1;
    });
    const destinations = Object.entries(destinationMap)
      .sort(([, a], [, b]) => b - a)
      .map(([name, clicks]) => ({ name, clicks }));

    // Recent activity
    const allEvents = [...inboundEvents, ...outboundEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map(e => ({
        timestamp: e.timestamp,
        campaign: e.campaign,
        destination: e.eventType === 'outbound' 
          ? (e.destinationUrl?.includes('kickstarter') ? 'Kickstarter' : e.destinationUrl?.split('/')[2] || 'External')
          : e.landingPage,
        eventType: e.eventType
      }));

    res.json({
      trackingId,
      totalClicks,
      totalConversions,
      conversionRate,
      topCampaigns,
      destinations,
      recentActivity: allEvents,
      clicksByDay: [] // TODO: Implement day-by-day breakdown if needed
    });
  } catch (error) {
    console.error('Engagement dashboard error:', error);
    res.status(500).json({ error: 'Failed to load engagement stats' });
  }
});

// API Routes
app.use('/api', nutritionRoutes);
app.use('/api/openfoodfacts', openFoodFactsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['OpenFoodFacts API', 'Nutrition API'],
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'vHealth API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      nutrition: '/api/*',
      openfoodfacts: '/api/openfoodfacts/*'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedPath: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`[ROCKET] vHealth server running on port ${PORT}`);
  console.log(`[MOBILE] Health API available at http://localhost:${PORT}/api/health`);
  console.log(` OpenFoodFacts API available at http://localhost:${PORT}/api/openfoodfacts`);
  console.log(` Nutrition API available at http://localhost:${PORT}/api`);
  console.log(`[CHART] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;