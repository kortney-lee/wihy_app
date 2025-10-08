class RSSPolling {
  constructor(database, parser) {
    this.database = database;
    this.parser = parser;
    this.pollingInterval = null;
    this.isPolling = false;
    this.lastRun = null;
    this.totalRuns = 0;
  }

  start() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    console.log('🕒 Starting RSS polling every 5 minutes...');
    
    this.pollingInterval = setInterval(async () => {
      if (!this.isPolling) {
        this.pollOnce();
      }
    }, 5 * 60 * 1000);
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🛑 RSS polling stopped');
    }
  }

  isActive() {
    return !!this.pollingInterval;
  }

  get isRunning() {
    return this.isActive();
  }

  // ADD THIS METHOD - for immediate manual polling
  async pollAllFeeds(options = {}) {
    const { force = false, specificFeedId = null } = options;
    
    console.log('📰 Manual polling triggered', { force, specificFeedId });
    
    const startTime = Date.now();
    let successful = 0;
    let failed = 0;
    let articlesFetched = 0;
    
    try {
      // Get feeds to poll
      let feeds;
      if (specificFeedId) {
        feeds = await this.database.getFeeds({ feedId: specificFeedId });
        if (feeds.length === 0) {
          throw new Error(`Feed with ID ${specificFeedId} not found`);
        }
      } else {
        feeds = await this.database.getActiveFeedsForPolling();
      }
      
      console.log(`📰 Manual polling ${feeds.length} feeds...`);
      
      for (const feed of feeds) {
        try {
          console.log(`📰 Polling: ${feed.feed_title} (${feed.category || 'uncategorized'})`);
          
          const rssResult = await this.parser.fetchAndParseRSSFeed(feed.feed_url, feed.rss_feeds_id);
          
          if (rssResult.success) {
            await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
              articles: rssResult.articles,
              feed_title: rssResult.feedTitle,
              feed_description: rssResult.feedDescription,
              feed_link: rssResult.feedLink,
              etag: rssResult.etag,
              last_modified: rssResult.lastModified,
              last_status: 200,
              last_checked: new Date()
            });
            
            successful++;
            articlesFetched += rssResult.articles.length;
            console.log(`✅ Manual poll success ${feed.feed_title}: ${rssResult.articles.length} articles`);
            
          } else {
            failed++;
            console.error(`❌ Manual poll failed ${feed.feed_title}: ${rssResult.error}`);
          }
          
        } catch (feedError) {
          failed++;
          console.error(`❌ Error in manual polling of ${feed.feed_title}:`, feedError.message);
        }
        
        // Small delay between feeds
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const duration = Date.now() - startTime;
      this.lastRun = new Date();
      this.totalRuns++;
      
      const results = {
        total: feeds.length,
        successful,
        failed,
        articlesFetched,
        duration: `${duration}ms`
      };
      
      console.log(`🎉 Manual polling complete:`, results);
      return results;
      
    } catch (error) {
      console.error('❌ Error in manual polling:', error);
      throw error;
    }
  }

  // ADD THIS METHOD - poll a single feed immediately
  async pollFeed(feedData) {
    const startTime = Date.now();
    console.log(`🔄 [${new Date().toISOString()}] Manual polling single feed ${feedData.rss_feeds_id}: ${feedData.feed_url}`);
    
    try {
      const rssResult = await this.parser.fetchAndParseRSSFeed(feedData.feed_url, feedData.rss_feeds_id);
      
      if (rssResult.success) {
        await this.database.updateFeedWithArticles(feedData.rss_feeds_id, {
          articles: rssResult.articles,
          feed_title: rssResult.feedTitle,
          feed_description: rssResult.feedDescription,
          feed_link: rssResult.feedLink,
          etag: rssResult.etag,
          last_modified: rssResult.lastModified,
          last_status: 200,
          last_checked: new Date()
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ Single feed poll success: ${rssResult.articles.length} articles in ${duration}ms`);
        
        return {
          success: true,
          articlesProcessed: rssResult.articles.length,
          duration,
          feedTitle: rssResult.feedTitle
        };
        
      } else {
        const duration = Date.now() - startTime;
        console.error(`❌ Single feed poll failed: ${rssResult.error}`);
        
        return {
          success: false,
          error: rssResult.error,
          duration,
          feedTitle: feedData.feed_title
        };
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error polling single feed:`, error);
      
      return {
        success: false,
        error: error.message,
        duration,
        feedTitle: feedData.feed_title
      };
    }
  }

  async pollOnce() {
    if (this.isPolling) {
      console.log('🔄 RSS polling already in progress, skipping...');
      return;
    }

    this.isPolling = true;

    try {
      console.log('🕒 Starting automatic RSS polling...');
      
      const feeds = await this.database.getActiveFeedsForPolling();
      let totalFeedsUpdated = 0;
      let totalFeedsDeactivated = 0;
      
      console.log(`🕒 Automatic polling ${feeds.length} active RSS feeds...`);

      for (const feed of feeds) {
        try {
          console.log(`📰 Auto-polling: ${feed.feed_title} (${feed.category})`);
          const rssResult = await this.parser.fetchAndParseRSSFeed(feed.feed_url, feed.rss_feeds_id);
          
          if (rssResult.success && rssResult.articles.length > 0) {
            await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
              articles: rssResult.articles,
              feed_title: rssResult.feedTitle,
              feed_description: rssResult.feedDescription,
              feed_link: rssResult.feedLink,
              etag: rssResult.etag,
              last_modified: rssResult.lastModified,
              last_status: rssResult.status,
              last_checked: new Date()
            });
            
            totalFeedsUpdated++;
            console.log(`✅ Auto-updated ${feed.feed_title}: ${rssResult.articles.length} articles`);
          } else if (rssResult.shouldDeactivate) {
            await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
              last_status: rssResult.status,
              last_checked: new Date(),
              shouldDeactivate: true
            });
            
            totalFeedsDeactivated++;
            console.log(`🚫 Auto-deactivated ${feed.feed_title}: ${rssResult.error}`);
          } else {
            // Update status but keep active
            await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
              last_status: rssResult.status,
              last_checked: new Date()
            });
            
            console.log(`📰 Auto-polled ${feed.feed_title}: ${rssResult.error || 'No new articles'}`);
          }

        } catch (feedError) {
          console.error(`❌ Error in auto-polling feed ${feed.feed_title}:`, feedError.message);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.lastRun = new Date();
      this.totalRuns++;

      if (totalFeedsUpdated > 0 || totalFeedsDeactivated > 0) {
        console.log(`🎉 Auto-polling complete: ${totalFeedsUpdated} updated, ${totalFeedsDeactivated} deactivated`);
      } else {
        console.log(`📰 Auto-polling complete: No feeds updated`);
      }

    } catch (error) {
      console.error('❌ Error in automatic RSS polling:', error);
    } finally {
      this.isPolling = false;
    }
  }
}

module.exports = RSSPolling;