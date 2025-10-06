const { getPool, sql } = require('../config/database');
const RSSFeedParser = require('./rss/RSSFeedParser');
const RSSDatabase = require('./rss/RSSDatabase');
const RSSPolling = require('./rss/RSSPolling');

console.log('📰 RSS Controller loading...');

class RSSController {
  constructor() {
    this.isInitialized = false;
    this.database = new RSSDatabase();
    this.parser = new RSSFeedParser();
    this.polling = new RSSPolling(this.database, this.parser);
    console.log('📰 RSS Controller created');
  }

  async ensureInitialized() {
    if (this.isInitialized) return;
    try {
      console.log('📰 Initializing RSS database components...');
      await this.database.initialize();
      this.isInitialized = true;
      
      // Start automatic polling
      this.polling.start();
      
      console.log('✅ RSS Controller initialized successfully');
    } catch (error) {
      console.error('❌ RSS Controller initialization failed:', error);
      throw error;
    }
  }

  // API Endpoints
  async getFeedsForClient(req, res) {
    try {
      await this.ensureInitialized();
      const feeds = await this.database.getFeeds(req.query);
      
      // Enhance feeds with additional metadata
      const enhancedFeeds = feeds.map(feed => ({
        ...feed,
        article_count: this.getArticleCount(feed.latest_articles),
        last_updated: feed.last_checked || feed.updated_at,
        status: this.getFeedStatus(feed)
      }));
      
      res.json({ 
        success: true, 
        feeds: enhancedFeeds, 
        count: enhancedFeeds.length
      });
    } catch (error) {
      console.error('❌ Error getting feeds:', error);
      res.status(500).json({ success: false, message: 'Failed to get RSS feeds', error: error.message });
    }
  }

  async getArticles(req, res) {
    try {
      await this.ensureInitialized();
      
      console.log('🔍 Getting articles with params:', req.query);
      
      // Check if we have any feeds first
      const feedCount = await this.database.getFeedCount();
      console.log(`📊 Total feeds in database: ${feedCount}`);
      
      if (feedCount === 0) {
        console.log('🌱 No feeds found, auto-seeding...');
        await this.database.seedSampleFeeds();
        
        // Trigger immediate polling after seeding
        console.log('🔄 Triggering immediate polling after seeding...');
        this.polling.pollOnce();
      }
      
      const articles = await this.database.getArticles(req.query);
      console.log(`📰 Retrieved ${articles.length} articles`);
      
      // Enhance articles with additional computed fields
      const enhancedArticles = articles.map(article => this.enhanceArticleData(article));
      
      // If no articles, provide debug info
      if (enhancedArticles.length === 0) {
        const stats = await this.database.getFeedStats();
        console.log('📊 Feed stats:', stats);
        
        res.json({ 
          success: true, 
          articles: enhancedArticles, 
          count: enhancedArticles.length,
          debug: {
            total_feeds: feedCount,
            feed_stats: stats.stats,
            recent_feeds: stats.recent,
            message: 'No articles found. Feeds may need time to be polled or there may be parsing issues.'
          }
        });
      } else {
        res.json({ 
          success: true, 
          articles: enhancedArticles, 
          count: enhancedArticles.length
        });
      }
    } catch (error) {
      console.error('❌ Error getting articles:', error);
      res.status(500).json({ success: false, message: 'Failed to get RSS articles', error: error.message });
    }
  }

  // NEW: Get available categories and countries for client filtering
  async getCategoriesAndCountries(req, res) {
    try {
      await this.ensureInitialized();
      const data = await this.database.getCategoriesAndCountries();
      res.json({ 
        success: true, 
        categories: data.categories,
        countries: data.countries
      });
    } catch (error) {
      console.error('❌ Error getting categories and countries:', error);
      res.status(500).json({ success: false, message: 'Failed to get categories and countries', error: error.message });
    }
  }

  async seedSampleFeeds(req, res) {
    try {
      await this.ensureInitialized();
      const result = await this.database.seedSampleFeeds();
      
      // Trigger immediate polling after manual seeding
      console.log('🔄 Triggering immediate polling after manual seeding...');
      setTimeout(() => this.polling.pollOnce(), 2000);
      
      res.json({ 
        success: true, 
        message: 'Sample feeds seeded for multiple categories', 
        feeds_added: result.feeds_added,
        articles_added: result.articles_added
      });
    } catch (error) {
      console.error('❌ Error seeding sample feeds:', error);
      res.status(500).json({ success: false, message: 'Failed to seed sample feeds', error: error.message });
    }
  }

  async debugCheckFeeds(req, res) {
    try {
      await this.ensureInitialized();
      const stats = await this.database.getFeedStats();
      
      // Get a sample of feeds with their article status
      const pool = getPool();
      const sampleFeeds = await pool.request().query(`
        SELECT TOP 5
          rss_feeds_id, feed_title, category, is_active, last_checked, last_status,
          CASE 
            WHEN latest_articles IS NULL THEN 'No articles'
            WHEN ISJSON(latest_articles) = 0 THEN 'Invalid JSON'
            WHEN latest_articles = '[]' THEN 'Empty array'
            ELSE CAST((SELECT COUNT(*) FROM OPENJSON(latest_articles)) AS NVARCHAR(10)) + ' articles'
          END as article_status,
          LEN(latest_articles) as json_length
        FROM dbo.rss_feeds
        ORDER BY created_at DESC
      `);
      
      res.json({
        success: true,
        message: 'Debug feed check complete',
        feed_stats: stats.stats,
        recent_feeds: stats.recent,
        sample_feeds: sampleFeeds.recordset,
        polling_active: this.polling.isActive()
      });
    } catch (error) {
      console.error('❌ Error in debug check:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to check feeds', 
        error: error.message 
      });
    }
  }

  // NEW: Manual trigger for polling (useful for debugging)
  async triggerPolling(req, res) {
    try {
      await this.ensureInitialized();
      
      console.log('🔄 Manual polling triggered...');
      this.polling.pollOnce();
      
      res.json({
        success: true,
        message: 'Polling triggered manually'
      });
    } catch (error) {
      console.error('❌ Error triggering polling:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to trigger polling', 
        error: error.message 
      });
    }
  }

  // NEW: Manual trigger for article ingestion
  async ingestArticles(req, res) {
    try {
      await this.ensureInitialized();
      
      console.log('🔄 Manual ingestion triggered...');
      
      // This is the same as triggerPolling - manually fetch fresh RSS data
      if (this.polling) {
        this.polling.pollOnce();
        res.json({
          success: true,
          message: 'Article ingestion triggered manually'
        });
      } else {
        // If polling isn't set up yet, initialize it
        const RSSPolling = require('./rss/RSSPolling');
        const RSSFeedParser = require('./rss/RSSFeedParser');
        
        if (!this.parser) {
          this.parser = new RSSFeedParser();
        }
        
        this.polling = new RSSPolling(this.database, this.parser);
        this.polling.pollOnce();
        
        res.json({
          success: true,
          message: 'Polling initialized and article ingestion triggered'
        });
      }
    } catch (error) {
      console.error('❌ Error triggering ingestion:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to trigger article ingestion', 
        error: error.message 
      });
    }
  }

  async autoInitialize() {
    try {
      console.log('🚀 RSS Controller auto-initializing...');
      await this.ensureInitialized();
      
      const feedCount = await this.database.getFeedCount();
      console.log(`📊 Found ${feedCount} existing feeds`);
      
      if (feedCount === 0) {
        console.log('🌱 No feeds found - auto-seeding...');
        await this.database.seedSampleFeeds();
      }
      
      // Initial poll after startup with delay to ensure feeds are seeded
      setTimeout(() => {
        console.log('🔄 Starting initial RSS polling...');
        this.polling.pollOnce();
      }, 5000);
      
      console.log('✅ RSS Controller auto-initialization complete');
    } catch (error) {
      console.error('❌ RSS Controller auto-initialization failed:', error);
      throw error;
    }
  }

  // Helper methods for data enhancement
  enhanceArticleData(article) {
    return {
      // Core article data
      id: article.guid || `${article.feed_id}_${article.title?.substring(0, 50)}`,
      title: article.title || 'Untitled',
      description: article.description || '',
      summary: this.createSummary(article.description),
      link: article.link || '',
      
      // Content and media
      content: article.content_encoded || article.description || '',
      thumbnail: article.media_thumb_url || article.feed_image_url || '',
      image_url: article.media_thumb_url || '',
      has_image: !!(article.media_thumb_url || article.feed_image_url),
      
      // Metadata
      author: article.author || '',
      published_date: article.pubDate || article.extracted_at,
      published_timestamp: this.parseDate(article.pubDate || article.extracted_at),
      time_ago: this.getTimeAgo(article.pubDate || article.extracted_at),
      
      // Categories and source
      category: article.category || article.article_category || '',
      tags: this.extractTags(article.category || article.article_category),
      source: article.source || article.feed_title || '',
      source_url: article.source_url || article.feed_url || '',
      
      // Feed information
      feed_id: article.feed_id,
      feed_title: article.feed_title || '',
      feed_category: article.category || '',
      feed_country: article.country_code || '',
      feed_image: article.feed_image_url || '',
      feed_thumbnail: article.feed_thumbnail_url || '',
      
      // Technical metadata
      guid: article.guid || '',
      extracted_at: article.extracted_at,
      last_checked: article.last_checked,
      
      // Computed fields for client use
      is_recent: this.isRecent(article.pubDate || article.extracted_at),
      reading_time: this.estimateReadingTime(article.content_encoded || article.description),
      word_count: this.getWordCount(article.content_encoded || article.description),
      has_content: !!(article.content_encoded || article.description),
      has_author: !!article.author,
      
      // URL validation
      is_valid_link: this.isValidUrl(article.link),
      domain: this.extractDomain(article.link),
      
      // Content quality indicators
      content_quality: this.assessContentQuality(article),
      completeness: this.assessCompleteness(article)
    };
  }

  createSummary(description, maxLength = 200) {
    if (!description) return '';
    const cleaned = description.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...'
      : cleaned;
  }

  parseDate(dateString) {
    if (!dateString) return null;
    try {
      return new Date(dateString).getTime();
    } catch {
      return null;
    }
  }

  getTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffHours < 1) return 'Less than 1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return 'Unknown';
    }
  }

  extractTags(categoryString) {
    if (!categoryString) return [];
    return categoryString.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Limit to 5 tags
  }

  isRecent(dateString) {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = (now - date) / (1000 * 60 * 60);
      return diffHours <= 24; // Recent if within 24 hours
    } catch {
      return false;
    }
  }

  estimateReadingTime(content) {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const wordCount = this.getWordCount(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  getWordCount(content) {
    if (!content) return 0;
    const cleaned = content.replace(/<[^>]*>/g, '').trim();
    return cleaned.split(/\s+/).length;
  }

  isValidUrl(url) {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  extractDomain(url) {
    if (!url) return '';
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  assessContentQuality(article) {
    let score = 0;
    if (article.title && article.title.length > 10) score += 2;
    if (article.description && article.description.length > 50) score += 2;
    if (article.author) score += 1;
    if (article.media_thumb_url) score += 1;
    if (article.pubDate) score += 1;
    if (article.content_encoded && article.content_encoded.length > 200) score += 3;
    
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  assessCompleteness(article) {
    const requiredFields = ['title', 'description', 'link'];
    const optionalFields = ['author', 'pubDate', 'media_thumb_url', 'content_encoded'];
    
    const hasRequired = requiredFields.every(field => article[field]);
    const optionalCount = optionalFields.filter(field => article[field]).length;
    
    if (hasRequired && optionalCount >= 3) return 'complete';
    if (hasRequired && optionalCount >= 1) return 'partial';
    return 'minimal';
  }

  getArticleCount(latestArticles) {
    if (!latestArticles) return 0;
    try {
      const articles = JSON.parse(latestArticles);
      return Array.isArray(articles) ? articles.length : 0;
    } catch {
      return 0;
    }
  }

  getFeedStatus(feed) {
    if (!feed.is_active) return 'inactive';
    if (!feed.last_checked) return 'never_checked';
    if (feed.last_status >= 400) return 'error';
    if (feed.last_status === 200) return 'active';
    return 'unknown';
  }

  // NEW: Get system status including feed and polling status
  async getStatus(req, res) {
    try {
      await this.ensureInitialized();
      
      const feedCount = await this.database.getFeedCount();
      const stats = await this.database.getFeedStats();
      
      res.json({
        success: true,
        status: 'active',
        feed_count: feedCount,
        polling_active: this.polling ? this.polling.isActive() : false,
        last_check: new Date().toISOString(),
        stats: stats
      });
    } catch (error) {
      console.error('❌ Error getting status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get RSS status', 
        error: error.message 
      });
    }
  }

  // NEW: Fetch all feeds and trigger polling
  async fetchAllFeeds(req, res) {
    try {
      await this.ensureInitialized();
      
      console.log('🔄 Fetching all RSS feeds...');
      
      // This is the same as triggerPolling - fetch fresh data from all feeds
      if (this.polling) {
        this.polling.pollOnce();
        
        res.json({
          success: true,
          message: 'RSS feed polling triggered for all feeds',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'RSS polling system not initialized'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching all feeds:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch RSS feeds', 
        error: error.message 
      });
    }
  }

  // NEW: Test a single feed URL by fetching and parsing
  async testSingleFeed(req, res) {
    try {
      await this.ensureInitialized();
      
      const testFeedUrl = req.query.url || 'https://www.nibib.nih.gov/rss';
      
      console.log(`🧪 Testing single feed: ${testFeedUrl}`);
      
      const result = await this.parser.fetchAndParseRSSFeed(testFeedUrl);
      
      res.json({
        success: result.success,
        feed_url: testFeedUrl,
        feed_title: result.feedTitle || '',
        articles_found: result.articles ? result.articles.length : 0,
        articles: result.articles || [],
        error: result.error || null,
        status: result.status || 0
      });
    } catch (error) {
      console.error('❌ Error testing single feed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test RSS feed', 
        error: error.message 
      });
    }
  }

  // NEW: Debugging endpoint to refresh feeds
  async debugRefreshFeeds(req, res) {
    try {
      await this.ensureInitialized();
      
      console.log('🧪 Debug refresh - getting all feeds and forcing refresh...');
      
      // Get all feeds and reset their last_checked to force immediate polling
      const feeds = await this.database.getActiveFeedsForPolling();
      
      console.log(`🔄 Found ${feeds.length} feeds to refresh`);
      
      // Reset last_checked for all feeds to force immediate polling
      const pool = getPool();
      await pool.request().query(`
        UPDATE dbo.rss_feeds 
        SET last_checked = '1900-01-01', updated_at = GETUTCDATE()
        WHERE is_active = 1
      `);
      
      // Trigger polling
      if (this.polling) {
        this.polling.pollOnce();
      }
      
      res.json({
        success: true,
        message: `Debug refresh completed - reset ${feeds.length} feeds for immediate polling`,
        feeds_reset: feeds.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in debug refresh:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to debug refresh feeds', 
        error: error.message 
      });
    }
  }

  // NEW: Debug test for controller initialization
  async testControllerInitialization(req, res) {
    try {
      console.log('🧪 Testing RSS controller creation step by step...');
      
      const results = {
        step1_database: false,
        step2_rss_database_class: false,
        step3_rss_parser_class: false,
        step4_rss_controller_class: false,
        step5_controller_creation: false,
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
        
        // Step 5: Test controller creation
        try {
          const controller = new RSSController();
          results.step5_controller_creation = true;
          console.log('✅ Step 5: RSSController instance created');
          
          // Step 6: Test controller initialization
          try {
            await controller.ensureInitialized();
            results.step6_controller_initialization = true;
            console.log('✅ Step 6: RSSController initialized successfully');
          } catch (error) {
            results.errors.push(`Step 6 Initialization: ${error.message}`);
            console.error('❌ Step 6: Controller initialization failed:', error.message);
          }
          
        } catch (error) {
          results.errors.push(`Step 5 Creation: ${error.message}`);
          console.error('❌ Step 5: Controller creation failed:', error.message);
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
  }
}

module.exports = RSSController; // Export the class, not an instance