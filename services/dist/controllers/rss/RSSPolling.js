class RSSPolling {
  constructor(database, parser) {
    this.database = database;
    this.parser = parser;
    this.pollingInterval = null;
    this.isPolling = false;
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

  async pollOnce() {
    if (this.isPolling) {
      console.log('🔄 RSS polling already in progress, skipping...');
      return;
    }

    this.isPolling = true;

    try {
      console.log('🕒 Starting RSS polling...');
      
      const feeds = await this.database.getActiveFeedsForPolling();
      let totalFeedsUpdated = 0;
      let totalFeedsDeactivated = 0;
      
      console.log(`🕒 Polling ${feeds.length} active RSS feeds...`);

      for (const feed of feeds) {
        try {
          console.log(`📰 Polling: ${feed.feed_title} (${feed.category})`);
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
            console.log(`✅ Updated ${feed.feed_title}: ${rssResult.articles.length} articles`);
          } else if (rssResult.shouldDeactivate) {
            await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
              last_status: rssResult.status,
              last_checked: new Date(),
              shouldDeactivate: true
            });
            
            totalFeedsDeactivated++;
            console.log(`🚫 Deactivated ${feed.feed_title}: ${rssResult.error}`);
          } else {
            // Update status but keep active
            await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
              last_status: rssResult.status,
              last_checked: new Date()
            });
            
            console.log(`📰 Polled ${feed.feed_title}: ${rssResult.error || 'No new articles'}`);
          }

        } catch (feedError) {
          console.error(`❌ Error polling feed ${feed.feed_title}:`, feedError.message);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (totalFeedsUpdated > 0 || totalFeedsDeactivated > 0) {
        console.log(`🎉 Polling complete: ${totalFeedsUpdated} updated, ${totalFeedsDeactivated} deactivated`);
      } else {
        console.log(`📰 Polling complete: No feeds updated`);
      }

    } catch (error) {
      console.error('❌ Error in RSS polling:', error);
    } finally {
      this.isPolling = false;
    }
  }
}

module.exports = RSSPolling;