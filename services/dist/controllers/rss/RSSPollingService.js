const RSSFeedParser = require('./RSSFeedParser');

class RSSPollingService {
  constructor(rssDatabase) {
    this.rssParser = new RSSFeedParser();
    this.rssDatabase = rssDatabase;
    console.log('🚀 RSSPollingService initialized with enhanced logging');
  }

  async pollFeed(feedData) {
    const startTime = Date.now();
    console.log(`🔄 [${new Date().toISOString()}] Starting poll for feed ${feedData.rss_feeds_id}: ${feedData.feed_url}`);
    console.log(`📊 Feed details:`, {
      id: feedData.rss_feeds_id,
      title: feedData.feed_title || 'Unknown',
      category: feedData.category || 'Unknown',
      lastChecked: feedData.last_checked,
      lastStatus: feedData.last_status,
      isActive: feedData.is_active
    });
    
    try {
      // Parse the RSS feed
      console.log(`📡 Calling RSS parser for feed ${feedData.rss_feeds_id}...`);
      const parseResult = await this.rssParser.fetchAndParseRSSFeed(feedData.feed_url, feedData.rss_feeds_id);
      
      console.log(`📝 Parse result for feed ${feedData.rss_feeds_id}:`, {
        success: parseResult.success,
        articlesCount: parseResult.articles?.length || 0,
        feedTitle: parseResult.feedTitle || 'N/A',
        hasImages: parseResult.feedImage ? 'YES' : 'NO',
        error: parseResult.error || 'None'
      });
      
      if (parseResult.success && parseResult.articles && parseResult.articles.length > 0) {
        console.log(`✅ Parsed ${parseResult.articles.length} articles from feed ${feedData.rss_feeds_id}`);
        
        // Log sample article for debugging
        const sampleArticle = parseResult.articles[0];
        console.log(`📰 Sample article from feed ${feedData.rss_feeds_id}:`, {
          title: sampleArticle.title?.substring(0, 50) + '...',
          hasMediaThumb: !!sampleArticle.media_thumb_url,
          hasMediaUrl: !!sampleArticle.media_url,
          hasAuthor: !!sampleArticle.author,
          link: sampleArticle.link?.substring(0, 50) + '...'
        });
        
        // **CRITICAL**: Save articles to database
        console.log(`💾 Saving ${parseResult.articles.length} articles to database for feed ${feedData.rss_feeds_id}...`);
        const updateData = {
          articles: parseResult.articles,
          feedTitle: parseResult.feedTitle,
          feedDescription: parseResult.feedDescription,
          feedLink: parseResult.feedLink,
          feedImage: parseResult.feedImage,
          feedThumbnail: parseResult.feedThumbnail,
          etag: parseResult.etag,
          lastModified: parseResult.lastModified,
          status: parseResult.status || 200
        };
        
        console.log(`💾 Update data summary:`, {
          articlesCount: updateData.articles.length,
          feedTitle: updateData.feedTitle || 'N/A',
          feedImage: updateData.feedImage ? 'YES' : 'NO',
          feedThumbnail: updateData.feedThumbnail ? 'YES' : 'NO',
          status: updateData.status
        });
        
        const updateResult = await this.rssDatabase.updateFeedWithArticles(feedData.rss_feeds_id, updateData);
        
        console.log(`💾 Database update result for feed ${feedData.rss_feeds_id}:`, {
          success: updateResult.success,
          rowsAffected: updateResult.rowsAffected,
          error: updateResult.error || 'None'
        });
        
        if (updateResult.success) {
          const duration = Date.now() - startTime;
          console.log(`✅ Successfully saved ${parseResult.articles.length} articles to database for feed ${feedData.rss_feeds_id} in ${duration}ms`);
          
          return {
            success: true,
            articlesProcessed: parseResult.articles.length,
            feedTitle: parseResult.feedTitle,
            duration: duration,
            imagesFound: parseResult.articles.filter(a => a.has_media).length
          };
        } else {
          console.error(`❌ Failed to save articles to database for feed ${feedData.rss_feeds_id}:`, updateResult.error);
          return {
            success: false,
            error: `Database update failed: ${updateResult.error}`
          };
        }
        
      } else {
        const duration = Date.now() - startTime;
        console.warn(`⚠️ No articles found for feed ${feedData.rss_feeds_id} in ${duration}ms: ${parseResult.error || 'No articles'}`);
        
        // Still update the feed status even if no articles
        try {
          await this.rssDatabase.updateFeedWithArticles(feedData.rss_feeds_id, {
            articles: [],
            status: parseResult.status || 204
          });
        } catch (statusUpdateError) {
          console.error(`❌ Failed to update feed status for ${feedData.rss_feeds_id}:`, statusUpdateError);
        }
        
        return {
          success: false,
          error: parseResult.error || 'No articles found',
          duration: duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error polling feed ${feedData.rss_feeds_id} after ${duration}ms:`, error);
      console.error(`❌ Error stack:`, error.stack);
      
      // Update feed status to indicate error
      try {
        await this.rssDatabase.updateFeedWithArticles(feedData.rss_feeds_id, {
          articles: [],
          status: 500
        });
      } catch (statusUpdateError) {
        console.error(`❌ Failed to update feed error status for ${feedData.rss_feeds_id}:`, statusUpdateError);
      }
      
      return {
        success: false,
        error: error.message,
        duration: duration
      };
    }
  }

  // Add method to poll all active feeds
  async pollAllActiveFeeds(options = {}) {
    const { 
      maxConcurrent = 3, 
      delayBetween = 2000, 
      maxFeeds = 20 
    } = options;
    
    console.log(`🚀 [${new Date().toISOString()}] Starting polling cycle for all active feeds`);
    console.log(`📋 Polling options:`, { maxConcurrent, delayBetween, maxFeeds });
    
    try {
      // Get active feeds from database
      const feeds = await this.rssDatabase.getFeeds({ 
        limit: maxFeeds, 
        activeOnly: true 
      });
      
      console.log(`📊 Found ${feeds.length} active feeds to poll`);
      
      if (feeds.length === 0) {
        console.log(`⚠️ No active feeds found to poll`);
        return {
          total: 0,
          successful: 0,
          failed: 0,
          results: []
        };
      }
      
      // Process feeds in batches to avoid overwhelming servers
      const results = [];
      let successfulCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < feeds.length; i += maxConcurrent) {
        const batch = feeds.slice(i, i + maxConcurrent);
        const batchNum = Math.floor(i / maxConcurrent) + 1;
        const totalBatches = Math.ceil(feeds.length / maxConcurrent);
        
        console.log(`📦 Processing batch ${batchNum}/${totalBatches}: feeds ${i+1}-${Math.min(i+maxConcurrent, feeds.length)}`);
        console.log(`📦 Batch feeds:`, batch.map(f => `${f.rss_feeds_id}:${f.feed_title?.substring(0, 30) || 'Unknown'}`));
        
        const batchPromises = batch.map(feed => this.pollFeed(feed));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          const feed = batch[index];
          
          if (result.status === 'fulfilled') {
            const pollResult = result.value;
            results.push({
              feedId: feed.rss_feeds_id,
              feedTitle: feed.feed_title,
              ...pollResult
            });
            
            if (pollResult.success) {
              successfulCount++;
              console.log(`✅ Feed ${feed.rss_feeds_id} successful: ${pollResult.articlesProcessed || 0} articles`);
            } else {
              failedCount++;
              console.log(`❌ Feed ${feed.rss_feeds_id} failed: ${pollResult.error}`);
            }
          } else {
            failedCount++;
            console.error(`❌ Feed ${feed.rss_feeds_id} promise rejected:`, result.reason);
            results.push({
              feedId: feed.rss_feeds_id,
              feedTitle: feed.feed_title,
              success: false,
              error: result.reason?.message || 'Promise rejected'
            });
          }
        });
        
        // Delay between batches to be respectful to servers
        if (i + maxConcurrent < feeds.length && delayBetween > 0) {
          console.log(`⏳ Waiting ${delayBetween}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delayBetween));
        }
      }
      
      const summary = {
        total: feeds.length,
        successful: successfulCount,
        failed: failedCount,
        results: results,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🏁 [${new Date().toISOString()}] Polling cycle completed:`, {
        total: summary.total,
        successful: summary.successful,
        failed: summary.failed,
        successRate: `${Math.round((summary.successful / summary.total) * 100)}%`
      });
      
      return summary;
      
    } catch (error) {
      console.error(`❌ Error in pollAllActiveFeeds:`, error);
      throw error;
    }
  }
}

module.exports = RSSPollingService;