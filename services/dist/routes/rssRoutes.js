const express = require('express');
const router = express.Router();

console.log('🔥 rssRoutes.js is being loaded!');

// Try to load the RSS controller and create an instance
let rssController = null;
try {
  console.log('🔍 Attempting to load RSS controller...');
  const RSSController = require('../controllers/rssController'); // This is the class
  rssController = new RSSController(); // Create an instance
  console.log('✅ RSS Controller instance created successfully');
} catch (error) {
  console.error('❌ Failed to load RSS Controller:', error.message);
  console.log('📰 Continuing with fallback routes...');
}

// Simple health check route that doesn't depend on RSS controller
router.get('/debug/health', (req, res) => {
  console.log('🔍 Health check called from rssRoutes.js');
  res.json({
    success: true,
    message: 'RSS routes loaded successfully from rssRoutes.js',
    timestamp: new Date().toISOString(),
    rss_controller_available: !!rssController,
    file_path: __filename,
    working_directory: process.cwd()
  });
});

// Database test route (doesn't depend on RSS controller)
router.get('/debug/database', async (req, res) => {
  try {
    console.log('🔍 Testing database connection from rssRoutes...');
    
    const { getPool } = require('../config/database');
    const pool = getPool();
    
    // FIXED: Use bracketed alias to avoid SQL keyword collision
    const testQuery = await pool.request().query('SELECT GETUTCDATE() AS [current_time]');
    
    // Check if our tables exist
    const tablesQuery = await pool.request().query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('rss_feeds', 'rss_articles')
    `);
    
    // Check if our stored procedures exist
    const procsQuery = await pool.request().query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_type = 'PROCEDURE' 
      AND routine_name LIKE 'sp_%RSS%'
    `);
    
    res.json({
      success: true,
      database_connection: 'OK',
      current_time: testQuery.recordset[0].current_time,
      tables_found: tablesQuery.recordset.map(t => t.table_name),
      procedures_found: procsQuery.recordset.map(p => p.routine_name),
      suggestion: tablesQuery.recordset.length === 0 ? 'Run database initialization' : 'Database looks good'
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: 'Check database connection string and permissions'
    });
  }
});

// Middleware to check if RSS controller is available
const checkRSSController = (req, res, next) => {
  if (!rssController) {
    return res.status(503).json({
      success: false,
      error: 'RSS Controller not available - service initialization failed',
      suggestion: 'Check server logs for initialization errors'
    });
  }
  next();
};

// RSS Controller dependent routes
router.get('/feeds', checkRSSController, (req, res) => {
    console.log('📰 GET /api/news/feeds called');
    rssController.getFeedsForClient(req, res);
});

router.get('/articles', checkRSSController, (req, res) => {
    console.log('📰 GET /api/news/articles called');
    rssController.getArticles(req, res);
});

router.post('/fetch', checkRSSController, (req, res) => {
    console.log('📰 POST /api/news/fetch called');
    rssController.triggerPolling(req, res);
});

router.post('/seed', checkRSSController, (req, res) => {
    console.log('📰 POST /api/news/seed called');
    rssController.seedSampleFeeds(req, res);
});

router.get('/categories', checkRSSController, (req, res) => {
    console.log('📰 GET /api/news/categories called');
    rssController.getCategoriesAndCountries(req, res);
});

router.get('/debug/test-controller', checkRSSController, async (req, res) => {
  try {
    console.log('🧪 Testing RSS controller creation step by step...');
    
    const results = {
      step1_database: false,
      step2_rss_database_class: false,
      step3_rss_parser_class: false,
      step4_rss_controller_class: false,
      step5_controller_creation: true, // We already have an instance
      step6_controller_initialization: false,
      errors: []
    };
    
    // Step 1: Test database connection
    try {
      const { getPool } = require('../config/database');
      const pool = getPool();
      await pool.request().query('SELECT 1');
      results.step1_database = true;
      console.log('✅ Step 1: Database connection OK');
    } catch (error) {
      results.errors.push(`Step 1 Database: ${error.message}`);
      console.error('❌ Step 1: Database failed:', error.message);
    }
    
    // Step 2: Test RSSDatabase class loading
    try {
      const RSSDatabase = require('../controllers/rss/RSSDatabase');
      results.step2_rss_database_class = true;
      console.log('✅ Step 2: RSSDatabase class loaded');
    } catch (error) {
      results.errors.push(`Step 2 RSSDatabase: ${error.message}`);
      console.error('❌ Step 2: RSSDatabase failed:', error.message);
    }
    
    // Step 3: Test RSSFeedParser class loading
    try {
      const RSSFeedParser = require('../controllers/rss/RSSFeedParser');
      results.step3_rss_parser_class = true;
      console.log('✅ Step 3: RSSFeedParser class loaded');
    } catch (error) {
      results.errors.push(`Step 3 RSSFeedParser: ${error.message}`);
      console.error('❌ Step 3: RSSFeedParser failed:', error.message);
    }
    
    // Step 4: Test RSS Controller class loading
    try {
      const RSSController = require('../controllers/rssController');
      results.step4_rss_controller_class = true;
      console.log('✅ Step 4: RSSController class loaded');
      
      // Step 6: Test controller initialization
      try {
        await rssController.ensureInitialized();
        results.step6_controller_initialization = true;
        console.log('✅ Step 6: RSSController initialized successfully');
      } catch (error) {
        results.errors.push(`Step 6 Initialization: ${error.message}`);
        console.error('❌ Step 6: Controller initialization failed:', error.message);
      }
      
    } catch (error) {
      results.errors.push(`Step 4 Controller Class: ${error.message}`);
      console.error('❌ Step 4: RSSController class failed:', error.message);
    }
    
    res.json({
      success: results.step6_controller_initialization,
      message: 'RSS Controller creation test completed',
      results: results,
      next_steps: results.step6_controller_initialization 
        ? 'Controller works! Can test LiveMint feed now.' 
        : 'Fix the failing step and try again.'
    });
    
  } catch (error) {
    console.error('❌ Debug controller test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

// LiveMint test route
router.get('/debug/test-livemint', checkRSSController, async (req, res) => {
  try {
    console.log('🧪 Testing LiveMint RSS feed...');
    
    // Try to initialize first
    try {
      await rssController.ensureInitialized();
    } catch (initError) {
      return res.status(503).json({
        success: false,
        error: 'RSS Controller initialization failed',
        details: initError.message
      });
    }
    
    const testUrl = 'https://www.livemint.com/rss/science';
    
    // Test the RSS parser directly
    const parseResult = await rssController.parser.fetchAndParseRSSFeed(testUrl);
    
    if (parseResult.success) {
      res.json({
        success: true,
        feed_url: testUrl,
        feed_title: parseResult.feedTitle,
        feed_description: parseResult.feedDescription,
        articles_found: parseResult.articles.length,
        sample_articles: parseResult.articles.slice(0, 3).map(a => ({
          title: a.title,
          link: a.link,
          author: a.author,
          pubDate: a.pubDate,
          description: a.description?.substring(0, 150) + '...'
        })),
        debug_info: {
          feed_format: parseResult.feedFormat,
          total_items: parseResult.totalItems,
          processed_items: parseResult.processedItems
        }
      });
    } else {
      res.json({
        success: false,
        feed_url: testUrl,
        error: parseResult.error,
        status: parseResult.status
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing LiveMint feed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Raw LiveMint feed structure test
router.get('/debug/livemint-raw', async (req, res) => {
  try {
    console.log('🧪 Testing LiveMint feed structure...');
    
    const Parser = require('rss-parser');
    const parser = new Parser();
    
    const testUrl = 'https://www.livemint.com/rss/science';
    
    // Parse the feed directly with rss-parser
    const feed = await parser.parseURL(testUrl);
    
    console.log('📡 Feed parsed successfully');
    console.log('📡 Feed title:', feed.title);
    console.log('📡 Items found:', feed.items.length);
    
    // Sample first item
    const firstItem = feed.items[0];
    
    res.json({
      success: true,
      feed_url: testUrl,
      analysis: {
        feed_title: feed.title,
        feed_description: feed.description,
        feed_link: feed.link,
        total_items: feed.items.length,
        feed_format: feed.feedUrl ? 'RSS' : 'Atom',
        sample_item: firstItem ? {
          title: firstItem.title,
          link: firstItem.link,
          author: firstItem.author || firstItem.creator,
          pubDate: firstItem.pubDate,
          description: firstItem.contentSnippet?.substring(0, 200) + '...',
          available_fields: Object.keys(firstItem)
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Error analyzing LiveMint feed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Add this to your rssRoutes.js for debugging
router.get('/debug/test-images/:feedId', async (req, res) => {
  try {
    const { feedId } = req.params;
    
    // Get feed details from database
    const rssDB = new (require('../controllers/rss/RSSDatabase'))();
    const feeds = await rssDB.getFeeds({ limit: 1000 });
    const feed = feeds.find(f => f.rss_feeds_id == feedId);
    
    if (!feed) {
      return res.status(404).json({
        success: false,
        error: `Feed ${feedId} not found`
      });
    }
    
    console.log(`🔍 Testing image extraction for feed ${feedId}: ${feed.feed_url}`);
    
    // Parse the feed with detailed logging
    const RSSFeedParser = require('../controllers/rss/RSSFeedParser');
    const parser = new RSSFeedParser();
    const result = await parser.fetchAndParseRSSFeed(feed.feed_url, feedId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    // Extract image information
    const imageAnalysis = {
      feed_info: {
        feedTitle: result.feedTitle,
        feedImage: result.feedImage,
        feedThumbnail: result.feedThumbnail,
        has_feed_images: !!(result.feedImage || result.feedThumbnail)
      },
      article_images: result.articles.slice(0, 5).map((article, index) => ({
        index: index + 1,
        title: article.title.substring(0, 50) + '...',
        media_thumb_url: article.media_thumb_url,
        media_url: article.media_url,
        has_media: article.has_media,
        media_type: article.media_type
      })),
      summary: {
        total_articles: result.articles.length,
        articles_with_images: result.articles.filter(a => a.has_media).length,
        feed_has_image: !!(result.feedImage || result.feedThumbnail),
        sample_image_urls: result.articles
          .filter(a => a.media_thumb_url || a.media_url)
          .slice(0, 3)
          .map(a => a.media_thumb_url || a.media_url)
      }
    };
    
    res.json({
      success: true,
      feed_id: feedId,
      feed_url: feed.feed_url,
      image_analysis: imageAnalysis
    });
    
  } catch (error) {
    console.error('❌ Error testing images:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this test route to your rssRoutes.js
router.get('/debug/test-media-extraction/:feedId', async (req, res) => {
  try {
    const { feedId } = req.params;
    
    const rssDB = new (require('../controllers/rss/RSSDatabase'))();
    const feeds = await rssDB.getFeeds({ limit: 1000 });
    const feed = feeds.find(f => f.rss_feeds_id == feedId);
    
    if (!feed) {
      return res.status(404).json({ error: `Feed ${feedId} not found` });
    }
    
    const RSSFeedParser = require('../controllers/rss/RSSFeedParser');
    const parser = new RSSFeedParser();
    
    // Parse just the first few items for testing
    const result = await parser.fetchAndParseRSSFeed(feed.feed_url, feedId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    const mediaAnalysis = result.articles.slice(0, 3).map((article, index) => ({
      article_index: index + 1,
      title: article.title.substring(0, 60) + '...',
      media_analysis: {
        has_media_flag: article.has_media,
        media_thumb_url: article.media_thumb_url || 'NULL',
        media_url: article.media_url || 'NULL',
        media_type: article.media_type || 'NULL',
        is_valid_thumbnail: article.media_thumb_url ? 'YES' : 'NO',
        is_valid_main_image: article.media_url ? 'YES' : 'NO'
      }
    }));
    
    res.json({
      success: true,
      feed_id: feedId,
      feed_url: feed.feed_url,
      total_articles: result.articles.length,
      articles_with_media: result.articles.filter(a => a.has_media).length,
      sample_media_analysis: mediaAnalysis,
      feed_level_images: {
        feed_image: result.feedImage || 'NULL',
        feed_thumbnail: result.feedThumbnail || 'NULL'
      }
    });
    
  } catch (error) {
    console.error('Media extraction test error:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('📰 RSS routes configured successfully');
module.exports = router;