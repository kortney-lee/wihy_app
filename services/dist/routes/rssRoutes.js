const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

console.log('🔥 rssRoutes.js is being loaded!');

// Create controller synchronously without initialization
let rssController = null;
let controllerError = null;

try {
  console.log('📰 Creating RSS Controller...');
  const RSSController = require('../controllers/rssController');
  rssController = new RSSController();
  console.log('✅ RSS Controller created for routes (not yet initialized)');
} catch (error) {
  console.error('❌ Failed to create RSS Controller for routes:', error);
  controllerError = error;
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
}

// Middleware to check if RSS controller is available AND initialized
const checkRSSController = (req, res, next) => {
  if (controllerError) {
    return res.status(503).json({
      success: false,
      error: 'RSS Controller creation failed',
      details: controllerError.message
    });
  }
  
  if (!rssController) {
    return res.status(503).json({
      success: false,
      error: 'RSS Controller not available',
      suggestion: 'Check server logs for initialization errors'
    });
  }
  
  if (!rssController.isInitialized) {
    return res.status(503).json({
      success: false,
      error: 'RSS Controller not initialized yet',
      suggestion: 'Service is starting up, please wait a moment and try again'
    });
  }
  
  next();
};

// Health check that works even without initialization
router.get('/debug/health', async (req, res) => {
  if (controllerError) {
    return res.json({
      success: false,
      error: 'RSS Controller creation failed',
      details: controllerError.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (!rssController) {
    return res.json({
      success: false,
      error: 'RSS Controller not available',
      suggestion: 'Check server logs for initialization errors'
    });
  }
  
  // If controller exists, use its health check
  return rssController.healthCheck(req, res);
});

// All other routes require initialized controller
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

// Add this new debug route to test image extraction from your database
router.get('/debug/test-database-images', async (req, res) => {
  try {
    console.log('🔍 Testing image extraction from database...');
    
    const pool = getPool();
    
    // Get a sample of articles with their image fields
    const query = `
      SELECT TOP 10
        title,
        media_thumb_url,
        media_url,
        feed_image_url,
        feed_thumbnail_url,
        has_media,
        media_type,
        media_description
      FROM rss_articles 
      ORDER BY extracted_at DESC
    `;
    
    const result = await pool.request().query(query);
    
    const imageAnalysis = result.recordset.map((article, index) => ({
      index: index + 1,
      title: article.title ? article.title.substring(0, 50) + '...' : 'No title',
      image_fields: {
        media_thumb_url: article.media_thumb_url || 'NULL',
        media_url: article.media_url || 'NULL',
        feed_image_url: article.feed_image_url || 'NULL',
        feed_thumbnail_url: article.feed_thumbnail_url || 'NULL',
        has_media: article.has_media,
        media_type: article.media_type || 'NULL'
      },
      has_any_image: !!(
        article.media_thumb_url || 
        article.media_url || 
        article.feed_image_url || 
        article.feed_thumbnail_url
      )
    }));
    
    const summary = {
      total_articles: result.recordset.length,
      articles_with_media_flag: result.recordset.filter(a => a.has_media === true || a.has_media === 'true' || a.has_media === 1).length,
      articles_with_media_thumb: result.recordset.filter(a => a.media_thumb_url && a.media_thumb_url !== 'null').length,
      articles_with_media_url: result.recordset.filter(a => a.media_url && a.media_url !== 'null').length,
      articles_with_feed_image: result.recordset.filter(a => a.feed_image_url && a.feed_image_url !== 'null').length,
      articles_with_feed_thumb: result.recordset.filter(a => a.feed_thumbnail_url && a.feed_thumbnail_url !== 'null').length,
      articles_with_any_image: result.recordset.filter(a => 
        (a.media_thumb_url && a.media_thumb_url !== 'null') ||
        (a.media_url && a.media_url !== 'null') ||
        (a.feed_image_url && a.feed_image_url !== 'null') ||
        (a.feed_thumbnail_url && a.feed_thumbnail_url !== 'null')
      ).length
    };
    
    res.json({
      success: true,
      summary,
      sample_articles: imageAnalysis,
      recommendation: summary.articles_with_any_image === 0 
        ? 'No images found in database. Check RSS parsing and image extraction.'
        : `Found ${summary.articles_with_any_image}/${summary.total_articles} articles with images.`
    });
    
  } catch (error) {
    console.error('❌ Database image test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this route after your existing debug routes

router.post('/debug/force-init-database', async (req, res) => {
  try {
    console.log('🔧 Force initializing RSS database...');
    
    // Force initialize the RSSDatabase
    const RSSDatabase = require('../controllers/rss/RSSDatabase');
    const rssDb = new RSSDatabase();
    
    console.log('📋 Creating tables...');
    await rssDb.createTables();
    
    console.log('📋 Creating stored procedures...');
    await rssDb.createStoredProcedures();
    
    // Verify tables exist
    const pool = getPool();
    
    const tablesQuery = await pool.request().query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'rss_feeds'
    `);
    
    // Verify procedures exist
    const procsQuery = await pool.request().query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_type = 'PROCEDURE' 
      AND routine_name LIKE 'sp_%RSS%'
    `);
    
    res.json({
      success: true,
      message: 'Database initialization completed',
      tables_created: tablesQuery.recordset.map(t => t.table_name),
      procedures_created: procsQuery.recordset.map(p => p.routine_name),
      next_steps: [
        'POST /api/news/seed - Add sample feeds',
        'POST /api/news/fetch - Fetch articles',
        'GET /api/news/articles - Test article retrieval'
      ]
    });
    
  } catch (error) {
    console.error('❌ Force database init error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Add the missing test route for JSON structure
router.get('/debug/test-json-structure', async (req, res) => {
  try {
    console.log('🔍 Testing new JSON article structure...');
    
    const pool = getPool();
    
    // Get feeds with their JSON articles
    const query = `
      SELECT TOP 5
        rss_feeds_id,
        feed_title,
        image_url,
        thumbnail_url,
        latest_articles,
        last_checked,
        fetch_count
      FROM rss_feeds 
      WHERE latest_articles IS NOT NULL
        AND ISJSON(latest_articles) = 1
      ORDER BY last_checked DESC
    `;
    
    const result = await pool.request().query(query);
    
    if (result.recordset.length === 0) {
      return res.json({
        success: false,
        message: 'No feeds with articles found in database',
        total_feeds_checked: 0,
        recommendation: 'Run POST /api/news/seed then POST /api/news/fetch to populate data'
      });
    }
    
    const analysis = result.recordset.map((feed, index) => {
      let articles = [];
      let articleCount = 0;
      let articlesWithImages = 0;
      let sampleArticle = null;
      
      try {
        articles = JSON.parse(feed.latest_articles || '[]');
        articleCount = articles.length;
        articlesWithImages = articles.filter(a => 
          a.media_thumb_url || 
          a.media_thumb_small_url || 
          a.enclosure_url ||
          a.media_url
        ).length;
        
        sampleArticle = articles[0] ? {
          title: articles[0].title?.substring(0, 50) + '...',
          media_thumb_url: articles[0].media_thumb_url || 'NULL',
          media_thumb_small_url: articles[0].media_thumb_small_url || 'NULL', 
          media_url: articles[0].media_url || 'NULL',
          enclosure_url: articles[0].enclosure_url || 'NULL',
          enclosure_type: articles[0].enclosure_type || 'NULL',
          has_media: articles[0].has_media || false
        } : null;
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
      }
      
      return {
        feed_id: feed.rss_feeds_id,
        feed_title: feed.feed_title,
        feed_images: {
          image_url: feed.image_url || 'NULL',
          thumbnail_url: feed.thumbnail_url || 'NULL'
        },
        article_analysis: {
          total_articles: articleCount,
          articles_with_images: articlesWithImages,
          sample_article: sampleArticle
        },
        last_checked: feed.last_checked,
        fetch_count: feed.fetch_count
      };
    });
    
    const summary = {
      total_feeds_with_articles: result.recordset.length,
      total_articles: analysis.reduce((sum, feed) => sum + feed.article_analysis.total_articles, 0),
      total_articles_with_images: analysis.reduce((sum, feed) => sum + feed.article_analysis.articles_with_images, 0),
      feeds_with_feed_images: analysis.filter(f => f.feed_images.image_url !== 'NULL' || f.feed_images.thumbnail_url !== 'NULL').length
    };
    
    res.json({
      success: true,
      message: 'JSON structure analysis complete',
      summary,
      feed_analysis: analysis,
      recommendation: summary.total_articles_with_images === 0 
        ? 'No article-level images found. Check RSS parsing for media extraction.'
        : `Found ${summary.total_articles_with_images} articles with images out of ${summary.total_articles} total.`
    });
    
  } catch (error) {
    console.error('❌ JSON structure test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this simple table test route

router.get('/debug/check-table', async (req, res) => {
  try {
    console.log('🔍 Checking RSS feeds table...');
    
    const pool = getPool();
    
    // Check if table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as table_count 
      FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'dbo.rss_feeds') AND type='U'
    `);
    
    const tableExists = tableCheck.recordset[0].table_count > 0;
    
    if (!tableExists) {
      return res.json({
        success: false,
        message: 'Table does not exist',
        table_exists: false,
        next_step: 'Call POST /api/news/debug/force-init-database to create table'
      });
    }
    
    // Table exists - get structure and data info
    const structureQuery = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'rss_feeds'
      ORDER BY ORDINAL_POSITION
    `);
    
    const dataQuery = await pool.request().query(`
      SELECT 
        COUNT(*) as total_feeds,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_feeds,
        SUM(CASE WHEN latest_articles IS NOT NULL THEN 1 ELSE 0 END) as feeds_with_articles,
        MAX(last_checked) as last_checked
      FROM dbo.rss_feeds
    `);
    
    res.json({
      success: true,
      message: 'Table exists and accessible',
      table_exists: true,
      column_count: structureQuery.recordset.length,
      key_columns_present: {
        rss_feeds_id: structureQuery.recordset.some(c => c.COLUMN_NAME === 'rss_feeds_id'),
        feed_url: structureQuery.recordset.some(c => c.COLUMN_NAME === 'feed_url'),
        latest_articles: structureQuery.recordset.some(c => c.COLUMN_NAME === 'latest_articles'),
        image_url: structureQuery.recordset.some(c => c.COLUMN_NAME === 'image_url'),
        thumbnail_url: structureQuery.recordset.some(c => c.COLUMN_NAME === 'thumbnail_url')
      },
      data_summary: dataQuery.recordset[0],
      next_steps: dataQuery.recordset[0].total_feeds === 0 
        ? ['POST /api/news/seed - Add sample feeds', 'POST /api/news/fetch - Fetch articles']
        : ['POST /api/news/fetch - Refresh articles', 'GET /api/news/articles - View articles']
    });
    
  } catch (error) {
    console.error('❌ Table check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error checking table'
    });
  }
});

// Documentation routes are now handled by separate docsRoutes.js
// Access at: GET /api/news/docs for HTML, GET /api/news/docs/json for JSON

// Add this debug endpoint to your RSS routes to inspect the raw feed structure
// filepath: c:\vHealth\vhealth\services\dist\routes\rssRoutes.js

// Add this new debug endpoint:
router.get('/debug/raw-feed/:feedId', async (req, res) => {
    try {
        const feedId = parseInt(req.params.feedId);
        
        // Get feed URL from database using getPool instead of database.getConnection()
        const pool = getPool();
        const feedResult = await pool.request()
            .input('feedId', feedId)
            .query('SELECT feed_url, feed_title FROM rss_feeds WHERE rss_feeds_id = @feedId');
            
        if (feedResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Feed not found' });
        }
        
        const { feed_url, feed_title } = feedResult.recordset[0];
        
        // Fetch and parse raw RSS
        const Parser = require('rss-parser');
        const parser = new Parser({
            customFields: {
                item: [
                    ['media:content', 'media:content'],
                    ['media:thumbnail', 'media:thumbnail'],
                    ['enclosure', 'enclosure'],
                    ['content:encoded', 'content:encoded'],
                    ['description', 'description'],
                    ['content', 'content']
                ]
            }
        });
        
        const feed = await parser.parseURL(feed_url);
        
        // Return raw structure for first few items
        const sampleItems = feed.items.slice(0, 3).map(item => ({
            title: item.title?.substring(0, 50) + '...',
            availableFields: Object.keys(item),
            mediaContent: item['media:content'],
            mediaThumbnail: item['media:thumbnail'],
            enclosure: item.enclosure,
            contentEncoded: item['content:encoded']?.substring(0, 200) + '...',
            description: item.description?.substring(0, 200) + '...'
        }));
        
        res.json({
            success: true,
            feedUrl: feed_url,
            feedTitle: feed.title,
            totalItems: feed.items.length,
            sampleItems,
            feedFields: Object.keys(feed),
            itemFields: feed.items.length > 0 ? Object.keys(feed.items[0]) : []
        });
        
    } catch (error) {
        console.error('❌ Raw feed analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced parser test route
router.get('/debug/test-enhanced-parser/:feedId', async (req, res) => {
    try {
        const feedId = parseInt(req.params.feedId);
        
        // Get feed URL using getPool
        const pool = getPool();
        const feedResult = await pool.request()
            .input('feedId', feedId)
            .query('SELECT feed_url, feed_title FROM rss_feeds WHERE rss_feeds_id = @feedId');
            
        if (feedResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Feed not found' });
        }
        
        const { feed_url, feed_title } = feedResult.recordset[0];
        
        // Test enhanced parsing
        const EnhancedRssParser = require('../utils/enhancedRssParser');
        const parser = new EnhancedRssParser();
        const feed = await parser.parseURL(feed_url);
        
        // Analyze first 3 articles
        const analysis = feed.items.slice(0, 3).map((item, index) => ({
            index: index + 1,
            title: item.title?.substring(0, 60) + '...',
            images_found: item.extractedImages?.length || 0,
            has_media: item.hasMedia,
            primary_image: item.primaryImage?.url || 'None',
            thumbnail_image: item.thumbnailImage?.url || 'None',
            image_sources: item.extractedImages?.map(img => img.source) || [],
            all_images: item.extractedImages?.map(img => ({
                url: img.url.substring(0, 80) + '...',
                source: img.source,
                type: img.type
            })) || []
        }));
        
        res.json({
            success: true,
            feed_id: feedId,
            feed_title,
            feed_url,
            enhanced_analysis: {
                total_articles: feed.items.length,
                articles_analyzed: analysis.length,
                articles: analysis
            }
        });
        
    } catch (error) {
        console.error('❌ Enhanced parser test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this route to debug controller creation:

router.get('/debug/controller-status', async (req, res) => {
  try {
    console.log('🔍 Checking RSS Controller status...');
    
    // Check if controller exists
    if (!rssController) {
      return res.json({
        success: false,
        error: 'RSS Controller not created',
        suggestion: 'Check rssController creation in routes file'
      });
    }
    
    // Check controller health
    if (typeof rssController.healthCheck === 'function') {
      return rssController.healthCheck(req, res);
    } else {
      return res.json({
        success: false,
        error: 'RSS Controller missing healthCheck method',
        controller_type: typeof rssController,
        available_methods: Object.getOwnPropertyNames(Object.getPrototypeOf(rssController))
      });
    }
    
  } catch (error) {
    console.error('❌ Controller status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Add this route after your existing routes:

router.get('/debug/polling-status', checkRSSController, (req, res) => {
    console.log('📰 GET /api/news/debug/polling-status called');
    rssController.getPollingStatus(req, res);
});

console.log('📰 RSS routes configured successfully');
module.exports = {
  router,
  rssController
};