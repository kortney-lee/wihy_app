import { Request, Response } from 'express';
import RSSDatabase from './rss/RSSDatabase';
import RSSFeedParser from './rss/RSSFeedParser';
import RSSPolling from './rss/RSSPolling';
import type { ParsedArticle } from './rss/RSSFeedParser';

interface StoredFeedRecord {
  rss_feeds_id: number;
  feed_title?: string;
  feed_url: string;
  category?: string;
  country_code?: string;
  image_url?: string;
  thumbnail_url?: string;
  latest_articles?: string;
  last_checked?: string;
  updated_at?: string;
  last_status?: number;
  fetch_count?: number;
}

export default class RSSController {
  private readonly database = new RSSDatabase();
  private readonly parser = new RSSFeedParser();
  private readonly polling = new RSSPolling(this.database, this.parser);
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.database.initialize();
    this.polling.start();
    this.initialized = true;
    console.log('✅ RSS services initialized');
  }

  getFeedsForClient = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();

      const feeds = await this.database.getFeeds(req.query as Record<string, unknown>);
      const enhanced = feeds.map(feed => this.enhanceFeedForClient(feed));

      res.json({
        success: true,
        feeds: enhanced,
        count: enhanced.length
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error retrieving feeds';
      console.error('❌ Error fetching RSS feeds:', message);
      res.status(500).json({ success: false, message });
    }
  };

  getArticles = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();

      const feedCount = await this.database.getFeedCount();
      if (feedCount === 0) {
        console.log('🌱 No RSS feeds in database. Seeding curated feeds...');
        await this.database.seedSampleFeeds();
        await this.polling.pollOnce();
      }

      const articles = await this.database.getArticles(req.query as Record<string, unknown>);
      const enhancedArticles = articles.map(article => this.enhanceArticleData(article));

      if (enhancedArticles.length === 0) {
        const stats = await this.database.getFeedStats();
        res.json({
          success: true,
          articles: enhancedArticles,
          count: 0,
          debug: {
            message: 'No articles available yet. Feeds may still be polling.',
            stats: stats.stats,
            recentFeeds: stats.recent
          }
        });
        return;
      }

      res.json({
        success: true,
        articles: enhancedArticles,
        count: enhancedArticles.length
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error retrieving articles';
      console.error('❌ Error fetching RSS articles:', message);
      res.status(500).json({ success: false, message });
    }
  };

  ingestArticles = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      await this.polling.pollOnce();
      res.json({ success: true, message: 'Article ingestion triggered' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error refreshing articles';
      console.error('❌ Error ingesting RSS articles:', message);
      res.status(500).json({ success: false, message });
    }
  };

  seedSampleFeeds = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      const result = await this.database.seedSampleFeeds();
      await this.polling.pollOnce();
      res.json({
        success: true,
        message: 'Curated feeds seeded',
        ...result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error seeding feeds';
      console.error('❌ Error seeding RSS feeds:', message);
      res.status(500).json({ success: false, message });
    }
  };

  triggerPolling = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      await this.polling.pollOnce();
      res.json({ success: true, message: 'Polling started' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error triggering polling';
      console.error('❌ Error triggering RSS polling:', message);
      res.status(500).json({ success: false, message });
    }
  };

  getCategoriesAndCountries = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.ensureInitialized();
      const data = await this.database.getCategoriesAndCountries();
      res.json({ success: true, ...data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error retrieving metadata';
      console.error('❌ Error fetching RSS categories:', message);
      res.status(500).json({ success: false, message });
    }
  };

  private enhanceFeedForClient(feed: StoredFeedRecord): Record<string, unknown> {
    const articleCount = this.safeArticleCount(feed.latest_articles);

    return {
      rss_feeds_id: feed.rss_feeds_id,
      feed_title: feed.feed_title ?? '',
      feed_url: feed.feed_url,
      category: feed.category ?? '',
      country_code: feed.country_code ?? '',
      image_url: feed.image_url ?? '',
      thumbnail_url: feed.thumbnail_url ?? '',
      latest_articles: feed.latest_articles ?? '[]',
      last_checked: feed.last_checked ?? null,
      updated_at: feed.updated_at ?? null,
      last_status: feed.last_status ?? null,
      fetch_count: feed.fetch_count ?? 0,
      article_count: articleCount,
      last_updated: feed.last_checked ?? feed.updated_at,
      status: this.deriveFeedStatus(feed.last_status)
    };
  }

  private safeArticleCount(latestArticles?: string): number {
    if (!latestArticles) {
      return 0;
    }

    try {
      const parsed = JSON.parse(latestArticles) as ParsedArticle[];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch (error) {
      console.warn('⚠️ Failed to parse latest_articles JSON:', error);
      return 0;
    }
  }

  private deriveFeedStatus(status?: number | null): string {
    if (!status) {
      return 'unknown';
    }

    if (status >= 200 && status < 300) {
      return 'healthy';
    }

    if (status >= 300 && status < 500) {
      return 'warning';
    }

    return 'error';
  }

  private enhanceArticleData(article: any): Record<string, unknown> {
    const publishedDate = article.pubDate || article.extracted_at;
    const publishedTimestamp = publishedDate ? new Date(publishedDate).getTime() : null;

    return {
      id: article.guid || `${article.feed_id}_${article.title ?? ''}`,
      title: article.title || 'Untitled',
      description: article.description || '',
      summary: this.createSummary(article.description || ''),
      link: article.link || '',
      content: article.content_encoded || article.description || '',
      thumbnail: article.media_thumb_url || article.feed_image_url || '',
      image_url: article.media_thumb_url || article.media_url || article.feed_image_url || '',
      has_image: Boolean(article.media_thumb_url || article.media_url || article.feed_image_url),
      author: article.author || '',
      published_date: publishedDate || null,
      published_timestamp: publishedTimestamp,
      time_ago: publishedDate ? this.getTimeAgo(publishedDate) : 'Unknown',
      category: article.category || article.article_category || '',
      tags: this.extractTags(article.category || article.article_category),
      source: article.source || article.feed_title || '',
      source_url: article.source_url || article.feed_url || '',
      feed_id: article.feed_id,
      feed_title: article.feed_title || '',
      feed_category: article.category || '',
      feed_country: article.country_code || '',
      feed_image: article.feed_image_url || '',
      feed_thumbnail: article.feed_thumbnail_url || '',
      guid: article.guid || '',
      extracted_at: article.extracted_at,
      last_checked: article.last_checked,
      is_recent: publishedDate ? this.isRecent(publishedDate) : false,
      reading_time: this.estimateReadingTime(article.content_encoded || article.description || ''),
      word_count: this.getWordCount(article.content_encoded || article.description || ''),
      has_content: Boolean(article.content_encoded || article.description),
      has_author: Boolean(article.author),
      is_valid_link: this.isValidUrl(article.link),
      domain: this.extractDomain(article.link),
      content_quality: this.assessContentQuality(article),
      completeness: this.assessCompleteness(article)
    };
  }

  private createSummary(description: string, maxLength = 200): string {
    const clean = (description || '').replace(/<[^>]*>/g, '').trim();
    return clean.length > maxLength ? `${clean.substring(0, maxLength)}...` : clean;
  }

  private getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Less than 1 hour ago';
    }
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    }
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  private extractTags(categoryString?: string): string[] {
    if (!categoryString) {
      return [];
    }
    return categoryString.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 5);
  }

  private isRecent(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  }

  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.getWordCount(content);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private getWordCount(content: string): number {
    if (!content) {
      return 0;
    }
    const matches = String(content).replace(/<[^>]*>/g, ' ').match(/\b\w+\b/g);
    return matches ? matches.length : 0;
  }

  private isValidUrl(url?: string): boolean {
    if (!url) {
      return false;
    }
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private extractDomain(url?: string): string {
    if (!this.isValidUrl(url)) {
      return '';
    }
    try {
      return new URL(url as string).hostname;
    } catch {
      return '';
    }
  }

  private assessContentQuality(article: any): string {
    const hasContent = Boolean(article.content_encoded || article.description);
    const hasMedia = Boolean(article.media_thumb_url || article.media_url || article.feed_image_url);
    const hasAuthor = Boolean(article.author);
    const wordCount = typeof article.word_count === 'number'
      ? article.word_count
      : this.getWordCount(article.content_encoded || article.description || '');

    const score = [hasContent, hasMedia, hasAuthor, wordCount > 200]
      .reduce((acc: number, value: boolean) => acc + (value ? 1 : 0), 0);

    if (score >= 3) {
      return 'high';
    }
    if (score === 2) {
      return 'medium';
    }
    return 'low';
  }

  private assessCompleteness(article: any): string {
    const fields = ['title', 'description', 'link', 'author', 'pubDate'];
    const filled = fields.filter(field => Boolean(article[field]));
    const ratio = filled.length / fields.length;

    if (ratio === 1) {
      return 'complete';
    }
    if (ratio >= 0.6) {
      return 'partial';
    }
    return 'missing';
  }
}
