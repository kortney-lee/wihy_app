const { getPool, sql } = require('../config/database');
const RSSFeedParser = require('./rss/RSSFeedParser');
const RSSDatabase = require('./rss/RSSDatabase');
const RSSPolling = require('./rss/RSSPolling');

console.log('📰 RSS Controller loading...');

class RSSController {
  constructor() {
    this.isInitialized = false;
    this.initializationError = null;
    this.database = null;
    this.parser = null;
    this.polling = null;
    
    try {
      console.log('📰 RSS Controller - Creating components...');
      
      // Create components synchronously - don't initialize yet
      this.database = new RSSDatabase();
      this.parser = new RSSFeedParser();
      this.polling = new RSSPolling(this.database, this.parser);
      
      console.log('✅ RSS Controller components created successfully');
      
    } catch (error) {
      console.error('❌ RSS Controller component creation failed:', error);
      this.initializationError = error;
    }
  }

  // Separate async initialization method
  async initialize() {
    if (this.isInitialized) {
      console.log('📰 RSS Controller already initialized');
      return;
    }
    
    if (this.initializationError) {
      throw this.initializationError;
    }
    
    try {
      console.log('📰 Initializing RSS database components...');
      
      if (!this.database) {
        throw new Error('RSSDatabase not available');
      }
      
      // Initialize database (create tables/procedures if needed)
      console.log('📰 Calling database.initialize()...');
      await this.database.initialize();
      console.log('✅ Database initialization complete');
      
      this.isInitialized = true;
      
      // Start automatic polling
      if (this.polling) {
        console.log('📰 Starting RSS polling...');
        this.polling.start();
        console.log('✅ RSS polling started successfully');
      } else {
        console.warn('⚠️ RSS polling not available - polling object is null');
      }
      
      console.log('✅ RSS Controller initialized successfully');
      
    } catch (error) {
      console.error('❌ RSS Controller initialization failed:', error);
      this.initializationError = error;
      throw error;
    }
  }

  // Remove the old ensureInitialized method and replace with this check
  checkInitialized() {
    if (!this.isInitialized) {
      throw new Error('RSS Controller not initialized - call initialize() first');
    }
    if (this.initializationError) {
      throw this.initializationError;
    }
  }

  // Health check method
  async healthCheck(req, res) {
    try {
      const status = {
        controller_created: !!this,
        database_available: !!this.database,
        parser_available: !!this.parser,
        polling_available: !!this.polling,
        is_initialized: this.isInitialized,
        initialization_error: this.initializationError ? this.initializationError.message : null,
        timestamp: new Date().toISOString()
      };

      // Try to test database connection if available
      if (this.database && this.isInitialized) {
        try {
          const pool = getPool();
          await pool.request().query('SELECT 1');
          status.database_connection = 'OK';
        } catch (error) {
          status.database_connection = `Error: ${error.message}`;
        }
      }

      res.json({
        success: this.isInitialized && !this.initializationError,
        message: this.initializationError ? 'RSS Controller has initialization errors' : 'RSS Controller is healthy',
        status
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Health check failed'
      });
    }
  }

  // Update all your API methods to use checkInitialized()
  async getFeedsForClient(req, res) {
    try {
      this.checkInitialized();
      
      const { limit, category, country_code, only_active } = req.query;
      
      const feeds = await this.database.getFeeds({
        limit: parseInt(limit) || 100,
        category: category || null,
        countryCode: country_code || null,
        onlyActive: only_active !== 'false'
      });

      res.json({
        success: true,
        feeds: feeds,
        count: feeds.length
      });

    } catch (error) {
      console.error('❌ Error getting feeds:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getArticles(req, res) {
    try {
      this.checkInitialized();
      
      const { limit, category, country, feed_id, flat } = req.query;
      
      const articles = await this.database.getArticles({
        limit: parseInt(limit) || 50,
        category: category || null,
        country: country || null,
        feedId: feed_id ? parseInt(feed_id) : null,
        flat: flat !== 'false'
      });

      // Enhance articles with additional metadata
      const enhancedArticles = articles.map(article => this.enhanceArticleData(article));

      res.json({
        success: true,
        articles: enhancedArticles,
        count: enhancedArticles.length,
        filters_applied: {
          category: category || null,
          country: country || null,
          feed_id: feed_id || null,
          limit: parseInt(limit) || 50
        }
      });

    } catch (error) {
      console.error('❌ Error getting articles:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getCategoriesAndCountries(req, res) {
    try {
      this.checkInitialized();
      
      const categoriesAndCountries = await this.database.getCategoriesAndCountries();
      
      res.json({
        success: true,
        categories: categoriesAndCountries.categories,
        countries: categoriesAndCountries.countries
      });

    } catch (error) {
      console.error('❌ Error getting categories and countries:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async seedSampleFeeds(req, res) {
    try {
      this.checkInitialized();
      
      const result = await this.database.seedSampleFeeds();
      
      res.json({
        success: true,
        message: 'Sample RSS feeds seeded successfully',
        feeds_added: result.feedsAdded,
        categories: result.categories,
        countries: result.countries
      });

    } catch (error) {
      console.error('❌ Error seeding sample feeds:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async triggerPolling(req, res) {
    try {
      this.checkInitialized();
      
      const { force, feed_id } = req.query;
      
      console.log('📰 Manual RSS polling triggered');
      
      const results = await this.polling.pollAllFeeds({
        force: force === 'true',
        specificFeedId: feed_id ? parseInt(feed_id) : null
      });

      res.json({
        success: true,
        message: 'RSS polling completed',
        results: {
          total: results.total,
          successful: results.successful,
          failed: results.failed,
          articles_fetched: results.articlesFetched,
          duration: results.duration
        }
      });

    } catch (error) {
      console.error('❌ Error triggering polling:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Add this method to check polling status:
  async getPollingStatus(req, res) {
    try {
      const status = {
        controller_initialized: this.isInitialized,
        polling_available: !!this.polling,
        polling_active: this.polling ? this.polling.isRunning : false,
        database_available: !!this.database,
        parser_available: !!this.parser,
        timestamp: new Date().toISOString()
      };

      // Get polling details if available
      if (this.polling) {
        status.polling_details = {
          interval: this.polling.pollingInterval || 'unknown',
          last_run: this.polling.lastRun || 'never',
          total_runs: this.polling.totalRuns || 0
        };
      }

      res.json({
        success: true,
        message: 'Polling status retrieved',
        status
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  enhanceArticleData(article) {
    try {
      // Calculate time ago
      const now = new Date();
      const pubDate = new Date(article.published_date || article.pubDate);
      const timeDiff = now - pubDate;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeAgo = '';
      if (days > 0) {
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
        timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = 'Just now';
      }

      // Calculate reading time (average 200 words per minute)
      const wordCount = article.word_count || this.estimateWordCount(article.description || '');
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      // Determine content quality
      let contentQuality = 'low';
      if (article.has_author && article.has_content && wordCount > 100) {
        contentQuality = 'high';
      } else if (article.has_content && wordCount > 50) {
        contentQuality = 'medium';
      }

      // Determine completeness
      let completeness = 'minimal';
      if (article.has_author && article.has_media && article.description && wordCount > 100) {
        completeness = 'complete';
      } else if (article.description && wordCount > 50) {
        completeness = 'partial';
      }

      // Extract domain from link
      let domain = '';
      try {
        if (article.link) {
          const url = new URL(article.link);
          domain = url.hostname.replace('www.', '');
        }
      } catch (error) {
        domain = 'unknown';
      }

      return {
        ...article,
        time_ago: timeAgo,
        reading_time: readingTime,
        word_count: wordCount,
        is_recent: timeDiff < (24 * 60 * 60 * 1000), // Within 24 hours
        content_quality: contentQuality,
        completeness: completeness,
        domain: domain,
        extracted_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error enhancing article data:', error);
      return article; // Return original article if enhancement fails
    }
  }

  estimateWordCount(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}

module.exports = RSSController;