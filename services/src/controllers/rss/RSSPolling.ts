import RSSDatabase from './RSSDatabase';
import RSSFeedParser, { FeedParseResult } from './RSSFeedParser';

export default class RSSPolling {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    private readonly database: RSSDatabase,
    private readonly parser: RSSFeedParser
  ) {}

  start(intervalMs = 5 * 60 * 1000): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    console.log(`🕒 Starting RSS polling every ${intervalMs / 60000} minutes...`);

    this.pollingInterval = setInterval(() => {
      if (!this.isPolling) {
        void this.pollOnce();
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🛑 RSS polling stopped');
    }
  }

  isActive(): boolean {
    return Boolean(this.pollingInterval);
  }

  async pollOnce(): Promise<void> {
    if (this.isPolling) {
      console.log('🔄 RSS polling already in progress, skipping...');
      return;
    }

    this.isPolling = true;

    try {
      console.log('🕒 Starting RSS polling cycle...');
      const feeds = await this.database.getActiveFeedsForPolling();
      console.log(`📡 Found ${feeds.length} feeds to poll`);

      for (const feed of feeds) {
        await this.pollFeed(feed);
        await this.delay(1000);
      }

      console.log('✅ RSS polling cycle complete');
    } catch (error) {
      console.error('❌ Error during RSS polling cycle:', error);
    } finally {
      this.isPolling = false;
    }
  }

  private async pollFeed(feed: any): Promise<void> {
    console.log(`📰 Polling feed ${feed.rss_feeds_id}: ${feed.feed_url}`);

    try {
      const result: FeedParseResult = await this.parser.fetchAndParseRSSFeed(feed.feed_url, feed.rss_feeds_id);

      if (result.success && result.articles.length > 0) {
        await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
          articles: result.articles,
          feedTitle: result.feedTitle,
          feedDescription: result.feedDescription,
          feedLink: result.feedLink,
          feedImage: result.feedImage,
          feedThumbnail: result.feedThumbnail,
          etag: result.etag,
          lastModified: result.lastModified,
          status: result.status,
          lastChecked: new Date()
        });

        console.log(`✅ Updated feed ${feed.rss_feeds_id} with ${result.articles.length} articles`);
      } else if (result.shouldDeactivate) {
        await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
          status: result.status,
          lastChecked: new Date(),
          shouldDeactivate: true
        });

        console.warn(`🚫 Deactivated feed ${feed.rss_feeds_id}: ${result.error}`);
      } else {
        await this.database.updateFeedWithArticles(feed.rss_feeds_id, {
          status: result.status,
          lastChecked: new Date()
        });

        console.log(`ℹ️ No new articles for feed ${feed.rss_feeds_id}: ${result.error ?? 'No updates'}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to poll feed ${feed.rss_feeds_id}:`, message);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
