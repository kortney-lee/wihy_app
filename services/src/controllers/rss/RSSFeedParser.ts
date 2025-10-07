import Parser from 'rss-parser';

export interface ParsedArticle {
  title: string;
  description: string;
  summary: string;
  link: string;
  author: string;
  pubDate: string;
  guid: string;
  category: string;
  tags: string[];
  source: string;
  source_url: string;
  media_thumb_url: string;
  media_url: string;
  media_type: string;
  media_description: string;
  content_encoded: string;
  comments_url: string;
  language: string;
  rights: string;
  word_count: number;
  reading_time: number;
  extracted_at: string;
  last_modified: string;
  has_media: boolean;
  has_author: boolean;
  has_content: boolean;
  content_length: number;
  feed_format: string;
  raw_item_keys: string[];
}

export interface FeedParseResult {
  success: boolean;
  articles: ParsedArticle[];
  feedTitle?: string;
  feedDescription?: string;
  feedLink?: string;
  feedImage?: string;
  feedThumbnail?: string;
  etag?: string | null;
  lastModified?: string | null;
  status?: number;
  error?: string;
  shouldDeactivate?: boolean;
  feedLanguage?: string;
  feedCopyright?: string;
  feedLastBuildDate?: string;
  feedGenerator?: string;
  totalItems?: number;
  processedItems?: number;
  feedFormat?: string;
}

type ParserItem = Parser.Item & Record<string, unknown>;
type ParserFeed = Parser.Output<Record<string, unknown>>;

export default class RSSFeedParser {
  private readonly parser: Parser<Record<string, unknown>, ParserItem>;

  constructor() {
    this.parser = new Parser({
      timeout: 15000,
      customFields: {
        feed: ['language', 'copyright', 'generator', 'lastBuildDate', 'managingEditor', 'webMaster'],
        item: [
          'author',
          'creator',
          'dc:creator',
          'dc:date',
          'dc:subject',
          'content:encoded',
          'contentencoded',
          'content',
          'media:thumbnail',
          'media:content',
          'enclosure',
          'category',
          'categories',
          'comments',
          'source',
          'itunes:author',
          'itunes:duration',
          'itunes:image'
        ]
      }
    });
  }

  async fetchAndParseRSSFeed(feedUrl: string, _feedId?: number): Promise<FeedParseResult> {
    try {
      console.log(`📰 Fetching RSS feed: ${feedUrl}`);

      const feed = await this.parser.parseURL(feedUrl) as ParserFeed;
      const feedRecord = feed as unknown as Record<string, unknown>;

      console.log(`📰 Feed parsed successfully: ${feed.title ?? 'Untitled'} (${feed.items.length} items)`);

      const articles = (feed.items || []).slice(0, 25)
        .map((item, index) => this.transformItem(item as ParserItem, feed, index))
        .filter((article): article is ParsedArticle => Boolean(article && article.title && article.link));

      const feedImages = this.extractFeedImage(feed);

      return {
        success: true,
        feedTitle: this.cleanText(feed.title ?? ''),
        feedDescription: this.cleanText(feed.description ?? ''),
        feedLink: this.cleanText(feed.link ?? feedUrl),
        feedImage: feedImages.main,
        feedThumbnail: feedImages.thumbnail,
        articles,
        etag: null,
        lastModified: null,
        status: 200,
        feedLanguage: this.cleanText((feedRecord.language as string) ?? ''),
        feedCopyright: this.cleanText((feedRecord.copyright as string) ?? ''),
        feedLastBuildDate: this.cleanText((feedRecord.lastBuildDate as string) ?? ''),
        feedGenerator: this.cleanText((feedRecord.generator as string) ?? ''),
        totalItems: feed.items.length,
        processedItems: articles.length,
        feedFormat: 'RSS'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error parsing feed';
      console.error(`❌ Error fetching/parsing RSS feed ${feedUrl}:`, message);

      const status = this.deriveStatusCode(message);

      return {
        success: false,
        error: message,
        articles: [],
        status,
        shouldDeactivate: this.shouldDeactivateFeed(status, message)
      };
    }
  }

  private transformItem(item: ParserItem, feed: ParserFeed, index: number): ParsedArticle | null {
    console.log(`🔍 Processing feed item ${index + 1}: ${item.title ?? 'Untitled'}`);

    const mediaInfo = this.extractMediaContent(item);
    const categories = this.extractCategories(item);

    const cleanTitle = this.cleanText((item.title as string) ?? '');
    const cleanDescription = this.extractTextFromHTML(
      (item.contentSnippet as string) || (item.content as string) || ''
    );
    const fullContent = this.extractTextFromHTML(
      (item['content:encoded'] as string) || (item.content as string) || ''
    );

    const link = this.cleanText((item.link as string) ?? (item.guid as string) ?? '');

    if (!cleanTitle || !link) {
      console.log(`❌ Skipping feed item ${index + 1} due to missing title/link`);
      return null;
    }

    const contentForMetrics = `${cleanDescription} ${fullContent}`.trim();

    const article: ParsedArticle = {
      title: cleanTitle,
      description: cleanDescription,
      summary: this.createSummary(cleanDescription),
      link,
      author: this.cleanText(
        (item.author as string) ||
        (item.creator as string) ||
        (item['dc:creator'] as string) ||
        (item['itunes:author'] as string) ||
        ''
      ),
      pubDate: (item.isoDate as string) || (item.pubDate as string) || '',
      guid: this.cleanText((item.guid as string) || (item.id as string) || (item.link as string) || ''),
      category: categories.join(', '),
      tags: categories,
      source: this.cleanText(feed.title ?? ''),
      source_url: this.cleanText(feed.link ?? ''),
      media_thumb_url: mediaInfo.thumbnail,
      media_url: mediaInfo.mainImage,
      media_type: mediaInfo.type || 'image',
      media_description: mediaInfo.description,
      content_encoded: this.cleanText(fullContent),
      comments_url: this.cleanText((item.comments as string) ?? ''),
      language: this.cleanText(((feed as unknown as Record<string, unknown>).language as string) ?? ''),
      rights: this.cleanText(((feed as unknown as Record<string, unknown>).copyright as string) ?? ''),
      word_count: this.getWordCount(contentForMetrics),
      reading_time: this.estimateReadingTime(contentForMetrics),
      extracted_at: new Date().toISOString(),
      last_modified: this.cleanText((item.lastModified as string) ?? ''),
      has_media: Boolean(mediaInfo.thumbnail || mediaInfo.mainImage),
      has_author: Boolean(
        (item.author as string) ||
        (item.creator as string) ||
        (item['dc:creator'] as string) ||
        (item['itunes:author'] as string)
      ),
      has_content: Boolean(fullContent),
      content_length: contentForMetrics.length,
      feed_format: 'RSS',
      raw_item_keys: Object.keys(item)
    };

    console.log(`✅ Article processed: ${article.title.substring(0, 60)}...`);

    return article;
  }

  private extractMediaContent(item: ParserItem): {
    thumbnail: string;
    mainImage: string;
    type: string;
    description: string;
  } {
    const media = {
      thumbnail: '',
      mainImage: '',
      type: '',
      description: ''
    };

    const applyMediaRecord = (
      record: Record<string, unknown> | undefined,
      { preferThumbnail = false }: { preferThumbnail?: boolean } = {}
    ): void => {
      if (!record) {
        return;
      }

      const url = this.extractMediaUrl(record);
      const type = this.extractMediaType(record);
      const description = this.extractMediaDescription(record);

      if (url) {
        if (preferThumbnail) {
          if (!media.thumbnail) {
            media.thumbnail = url;
          }
        } else if (!media.mainImage) {
          media.mainImage = url;
        }
      }

      if (type && !media.type) {
        media.type = type;
      }

      if (description && !media.description) {
        media.description = description;
      }
    };

    const processMediaSource = (
      source: unknown,
      options?: { preferThumbnail?: boolean }
    ): void => {
      if (!source) {
        return;
      }

      if (Array.isArray(source)) {
        for (const entry of source) {
          processMediaSource(entry, options);
        }
        return;
      }

      if (typeof source === 'object') {
        applyMediaRecord(source as Record<string, unknown>, options);

        const nestedGroup = (source as Record<string, unknown>)['media:content'];
        const nestedThumbnail = (source as Record<string, unknown>)['media:thumbnail'];
        if (nestedGroup) {
          processMediaSource(nestedGroup, options);
        }
        if (nestedThumbnail) {
          processMediaSource(nestedThumbnail, { preferThumbnail: true, ...(options ?? {}) });
        }
      }
    };

    processMediaSource(item.enclosure);
    processMediaSource(item['media:content']);
    processMediaSource(item['media:group']);
    processMediaSource(item['media:thumbnail'], { preferThumbnail: true });

    const itunesImage = this.extractItunesImage(item);
    if (itunesImage) {
      if (!media.thumbnail) {
        media.thumbnail = itunesImage;
      }
      if (!media.mainImage) {
        media.mainImage = itunesImage;
      }
    }

    if (!media.thumbnail && media.mainImage) {
      media.thumbnail = media.mainImage;
    }

    return {
      thumbnail: media.thumbnail || '',
      mainImage: media.mainImage || '',
      type: media.type || 'image',
      description: media.description || ''
    };
  }

  private extractMediaUrl(record: Record<string, unknown>): string | null {
    const candidateKeys = ['url', 'href', 'link'];
    for (const key of candidateKeys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    if (typeof record._ === 'string' && record._.trim()) {
      return record._.trim();
    }

    if (record.$ && typeof record.$ === 'object') {
      for (const key of candidateKeys) {
        const nestedValue = (record.$ as Record<string, unknown>)[key];
        if (typeof nestedValue === 'string' && nestedValue.trim()) {
          return nestedValue.trim();
        }
      }
    }

    return null;
  }

  private extractMediaType(record: Record<string, unknown>): string | null {
    const candidateKeys = ['type', 'medium'];
    for (const key of candidateKeys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    if (record.$ && typeof record.$ === 'object') {
      for (const key of candidateKeys) {
        const nestedValue = (record.$ as Record<string, unknown>)[key];
        if (typeof nestedValue === 'string' && nestedValue.trim()) {
          return nestedValue.trim();
        }
      }
    }

    return null;
  }

  private extractMediaDescription(record: Record<string, unknown>): string | null {
    const candidateKeys = ['description', 'title'];
    for (const key of candidateKeys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return this.cleanText(value);
      }
    }

    if (record.$ && typeof record.$ === 'object') {
      for (const key of candidateKeys) {
        const nestedValue = (record.$ as Record<string, unknown>)[key];
        if (typeof nestedValue === 'string' && nestedValue.trim()) {
          return this.cleanText(nestedValue);
        }
      }
    }

    return null;
  }

  private extractItunesImage(item: ParserItem): string | null {
    const itunesImage = item['itunes:image'];
    if (!itunesImage) {
      return null;
    }

    if (typeof itunesImage === 'string' && itunesImage.trim()) {
      return itunesImage.trim();
    }

    if (Array.isArray(itunesImage)) {
      for (const entry of itunesImage) {
        const fromEntry = this.extractItunesImage(entry as ParserItem);
        if (fromEntry) {
          return fromEntry;
        }
      }
    }

    if (typeof itunesImage === 'object') {
      const record = itunesImage as Record<string, unknown>;
      const href = record.href as string | undefined;
      if (href && href.trim()) {
        return href.trim();
      }

      const url = record.url as string | undefined;
      if (url && url.trim()) {
        return url.trim();
      }

      if (record.$ && typeof record.$ === 'object') {
        const nestedHref = (record.$ as Record<string, unknown>).href;
        if (typeof nestedHref === 'string' && nestedHref.trim()) {
          return nestedHref.trim();
        }
      }
    }

    return null;
  }

  private extractCategories(item: ParserItem): string[] {
    const categories = new Set<string>();

    if (Array.isArray(item.categories)) {
      for (const value of item.categories) {
        if (typeof value === 'string') {
          categories.add(this.cleanText(value));
        }
      }
    }

    if (typeof item.category === 'string') {
      item.category.split(',').forEach(category => {
        if (category) {
          categories.add(this.cleanText(category));
        }
      });
    }

    if (typeof item['dc:subject'] === 'string') {
      categories.add(this.cleanText(item['dc:subject'] as string));
    }

    return Array.from(categories).filter(Boolean);
  }

  private extractFeedImage(feed: ParserFeed): { main: string; thumbnail: string } {
    const image = (feed as ParserFeed).image as Record<string, unknown> | undefined;
    if (image && typeof image.url === 'string') {
      return { main: image.url, thumbnail: image.url };
    }

    const itunes = (feed as ParserFeed)['itunes'] as Record<string, unknown> | undefined;
    if (itunes && typeof itunes.image === 'string') {
      return { main: itunes.image, thumbnail: itunes.image };
    }

    return { main: '', thumbnail: '' };
  }

  private extractTextFromHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanText(value: string): string {
    return (value || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createSummary(text: string, maxLength = 200): string {
    if (!text) {
      return '';
    }
    const clean = this.cleanText(text);
    return clean.length > maxLength ? `${clean.substring(0, maxLength)}...` : clean;
  }

  private getWordCount(content: string): number {
    if (!content) {
      return 0;
    }
    const matches = content.match(/\b\w+\b/g);
    return matches ? matches.length : 0;
  }

  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.getWordCount(content);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private extractAttribute(source: Record<string, unknown>, key: string): string | undefined {
    const nested = source['$'];
    if (nested && typeof nested === 'object' && key in (nested as Record<string, unknown>)) {
      const value = (nested as Record<string, unknown>)[key];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  }

  private deriveStatusCode(message: string): number {
    if (/404|not found/i.test(message)) {
      return 404;
    }
    if (/403|forbidden/i.test(message)) {
      return 403;
    }
    if (/401|unauthorized/i.test(message)) {
      return 401;
    }
    if (/timeout|etimedout/i.test(message)) {
      return 408;
    }
    return 500;
  }

  private shouldDeactivateFeed(status: number, message: string): boolean {
    if (status === 404 || status === 401 || status === 403) {
      return true;
    }
    if (/invalid url|unsupported/i.test(message)) {
      return true;
    }
    return false;
  }
}
