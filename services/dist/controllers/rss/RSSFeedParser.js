const axios = require('axios');
const Parser = require('rss-parser');

class RSSFeedParser {
  constructor() {
    this.parser = new Parser({
      timeout: 15000,
      customFields: {
        feed: ['language', 'copyright', 'generator', 'lastBuildDate', 'managingEditor', 'webMaster'],
        item: [
          'author', 'creator', 'dc:creator', 'dc:date', 'dc:subject',
          'content:encoded', 'contentencoded', 'content',
          'media:thumbnail', 'media:content', 'enclosure',
          'category', 'categories', 'comments', 'source',
          'itunes:author', 'itunes:duration', 'itunes:image'
        ]
      }
    });
  }

  async fetchAndParseRSSFeed(feedUrl, feedId = null) {
    try {
      console.log(`📰 Fetching RSS feed: ${feedUrl}`);
      
      // Use rss-parser directly - it handles encoding issues automatically
      const feed = await this.parser.parseURL(feedUrl);
      
      console.log(`📰 Feed parsed successfully:`);
      console.log(`📰 Feed Title: ${feed.title}`);
      console.log(`📰 Found ${feed.items.length} items`);

      // Process articles (limit to 25 for performance)
      const articles = feed.items.slice(0, 25).map((item, index) => {
        console.log(`🔍 Processing item ${index + 1}: "${item.title?.substring(0, 50)}..."`);

        // Enhanced media extraction with detailed logging
        const mediaInfo = this.extractMediaContent(item);
        console.log(`📸 Media extraction result for item ${index + 1}:`, {
          hasThumbnail: !!mediaInfo.thumbnail,
          hasMainImage: !!mediaInfo.mainImage,
          thumbnailPreview: mediaInfo.thumbnail ? mediaInfo.thumbnail.substring(0, 80) + '...' : 'NONE',
          mainImagePreview: mediaInfo.mainImage ? mediaInfo.mainImage.substring(0, 80) + '...' : 'NONE'
        });
        
        // Enhanced categories extraction  
        const categories = this.extractCategories(item);
        
        // Clean and process content
        const cleanTitle = this.cleanText(item.title || '');
        const cleanDescription = this.extractTextFromHTML(item.contentSnippet || item.content || '');
        const fullContent = this.extractTextFromHTML(item['content:encoded'] || item.content || '');
        
        const article = {
          // Core content
          title: cleanTitle,
          description: cleanDescription,
          summary: this.createSummary(cleanDescription),
          link: this.cleanText(item.link || item.guid || ''),
          
          // Author information
          author: this.cleanText(
            item.author || 
            item.creator || 
            item['dc:creator'] || 
            item['itunes:author'] || 
            ''
          ),
          
          // Date information - use isoDate which is parsed by rss-parser
          pubDate: item.isoDate || item.pubDate || '',
          
          // Unique identifier
          guid: this.cleanText(item.guid || item.id || item.link || ''),
          
          // Categories and tags
          category: categories.join(', '),
          tags: categories,
          
          // Source information
          source: this.cleanText(feed.title || ''),
          source_url: this.cleanText(feed.link || feedUrl),
          
          // Media content - WITH DETAILED LOGGING
          media_thumb_url: mediaInfo.thumbnail || '',
          media_url: mediaInfo.mainImage || '',
          media_type: mediaInfo.type || 'image',
          media_description: mediaInfo.description || '',
          
          // Enhanced content
          content_encoded: this.cleanText(fullContent),
          
          // Additional fields
          comments_url: this.cleanText(item.comments || ''),
          
          // Technical metadata
          language: this.cleanText(feed.language || ''),
          rights: this.cleanText(feed.copyright || ''),
          
          // Content metrics
          word_count: this.getWordCount(cleanDescription + ' ' + fullContent),
          reading_time: this.estimateReadingTime(cleanDescription + ' ' + fullContent),
          
          // Timestamps
          extracted_at: new Date().toISOString(),
          last_modified: this.cleanText(item.lastModified || ''),
          
          // Quality indicators
          has_media: !!(mediaInfo.thumbnail || mediaInfo.mainImage),
          has_author: !!(item.author || item.creator || item['dc:creator'] || item['itunes:author']),
          has_content: !!(fullContent),
          content_length: (cleanDescription + ' ' + fullContent).length,
          
          // Debug info
          feed_format: 'RSS', // rss-parser normalizes everything to RSS format
          raw_item_keys: Object.keys(item)
        };

        console.log(`✅ Article ${index + 1} processed:`, {
          title: article.title.substring(0, 50) + '...',
          hasMediaUrls: !!(article.media_thumb_url || article.media_url),
          mediaThumbUrl: article.media_thumb_url ? 'YES (' + article.media_thumb_url.substring(0, 50) + '...)' : 'NO',
          mediaUrl: article.media_url ? 'YES (' + article.media_url.substring(0, 50) + '...)' : 'NO',
          hasAuthor: article.has_author,
          hasContent: article.has_content
        });
        
        return article;
      }).filter(article => {
        const hasRequired = article.title && article.link;
        if (!hasRequired) {
          console.log(`❌ Filtered out article: title="${article.title}" link="${article.link}"`);
        }
        return hasRequired;
      });

      // Extract comprehensive feed metadata
      const feedTitle = this.cleanText(feed.title || '');
      const feedDescription = this.cleanText(feed.description || '');
      const feedLink = this.cleanText(feed.link || '');
      const feedImages = this.extractFeedImage(feed); // CHANGED: Now returns object
      
      console.log(`✅ Successfully processed ${articles.length} valid articles from ${feedUrl}`);
      console.log(`📰 Feed: "${feedTitle}" - ${feedDescription.substring(0, 100)}...`);
      console.log(`📸 Feed images: main=${feedImages.main ? 'YES' : 'NO'}, thumbnail=${feedImages.thumbnail ? 'YES' : 'NO'}`);

      return {
        success: true,
        feedTitle: feedTitle,
        feedDescription: feedDescription,
        feedLink: feedLink,
        feedImage: feedImages.main,      // CHANGED
        feedThumbnail: feedImages.thumbnail, // ADDED
        articles: articles,
        etag: null,
        lastModified: null,
        status: 200,
        
        // Additional feed metadata
        feedLanguage: this.cleanText(feed.language || ''),
        feedCopyright: this.cleanText(feed.copyright || ''),
        feedLastBuildDate: this.cleanText(feed.lastBuildDate || ''),
        feedGenerator: this.cleanText(feed.generator || ''),
        totalItems: feed.items.length,
        processedItems: articles.length,
        feedFormat: 'RSS'
      };

    } catch (error) {
      console.error(`❌ Error fetching/parsing RSS feed ${feedUrl}:`, error.message);
      
      // Try to determine status code from error
      let statusCode = 500;
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        statusCode = 404;
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        statusCode = 403;
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        statusCode = 408;
      }
      
      return {
        success: false,
        error: error.message,
        articles: [],
        status: statusCode,
        shouldDeactivate: this.shouldDeactivateFeed(statusCode, error.message)
      };
    }
  }

  // Replace the extractMediaContent method with this fixed version:
  extractMediaContent(item) {
    const media = {
      thumbnail: '',
      mainImage: '',
      type: '',
      description: ''
    };

    console.log(`🔍 Extracting media from item keys:`, Object.keys(item));

    // Check for media:thumbnail - FIXED parsing
    if (item['media:thumbnail']) {
      console.log(`📸 Found media:thumbnail:`, item['media:thumbnail']);
      if (Array.isArray(item['media:thumbnail'])) {
        const thumb = item['media:thumbnail'][0];
        media.thumbnail = thumb?.$ || thumb?.url || thumb || '';
      } else if (typeof item['media:thumbnail'] === 'object') {
        media.thumbnail = item['media:thumbnail'].$ || item['media:thumbnail'].url || '';
      } else {
        media.thumbnail = item['media:thumbnail'];
      }
    }

    // Check for media:content - FIXED parsing
    if (item['media:content']) {
      console.log(`📸 Found media:content:`, item['media:content']);
      if (Array.isArray(item['media:content'])) {
        const mediaContent = item['media:content'][0];
        media.mainImage = mediaContent?.$ || mediaContent?.url || mediaContent || '';
        media.type = mediaContent?.type || 'image';
      } else if (typeof item['media:content'] === 'object') {
        media.mainImage = item['media:content'].$ || item['media:content'].url || '';
        media.type = item['media:content'].type || 'image';
      } else {
        media.mainImage = item['media:content'];
      }
    }

    // Check for enclosure (RSS standard)
    if (item.enclosure && item.enclosure.url) {
      console.log(`📸 Found enclosure:`, item.enclosure);
      if (!media.mainImage) {
        media.mainImage = item.enclosure.url;
        media.type = item.enclosure.type || 'image';
      }
      if (!media.thumbnail) {
        media.thumbnail = item.enclosure.url;
      }
    }

    // Check iTunes image
    if (item['itunes:image']) {
      console.log(`📸 Found iTunes image:`, item['itunes:image']);
      const itunesImage = item['itunes:image'].href || item['itunes:image'].url || item['itunes:image'];
      if (itunesImage && !media.mainImage) {
        media.mainImage = itunesImage;
        media.thumbnail = itunesImage;
      }
    }

    // Extract from HTML content if no media found
    if (!media.thumbnail && !media.mainImage) {
      const htmlContent = item.content || item['content:encoded'] || item.contentSnippet || item.description || '';
      const imageFromHtml = this.extractImageFromContent(htmlContent);
      if (imageFromHtml) {
        console.log(`📸 Found image in HTML content:`, imageFromHtml);
        media.thumbnail = imageFromHtml;
        media.mainImage = imageFromHtml;
        media.type = 'image';
      }
    }

    // Clean URLs
    media.thumbnail = this.cleanAndValidateUrl(media.thumbnail);
    media.mainImage = this.cleanAndValidateUrl(media.mainImage);

    console.log(`📸 Final media result:`, {
      thumbnail: media.thumbnail ? 'YES' : 'NO',
      mainImage: media.mainImage ? 'YES' : 'NO',
      thumbnailUrl: media.thumbnail.substring(0, 50) + '...',
      mainImageUrl: media.mainImage.substring(0, 50) + '...'
    });

    return media;
  }

  cleanAndValidateUrl(url) {
    if (!url || typeof url !== 'string') return '';
    
    // Remove any extra quotes or whitespace
    url = url.trim().replace(/^["']|["']$/g, '');
    
    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }
    
    // Skip relative URLs
    if (url.startsWith('/') && !url.startsWith('//')) {
      return '';
    }
    
    // Validate it's a proper URL
    try {
      new URL(url);
      return url;
    } catch (e) {
      console.log(`❌ Invalid URL: ${url}`);
      return '';
    }
  }

  extractFeedImage(feed) {
    let imageUrl = '';
    let thumbnailUrl = '';
    
    // RSS 2.0 image
    if (feed.image) {
      if (typeof feed.image === 'object') {
        imageUrl = feed.image.url || feed.image.href || '';
        thumbnailUrl = feed.image.url || feed.image.href || '';
      } else {
        imageUrl = feed.image;
        thumbnailUrl = feed.image;
      }
    }
    
    // iTunes artwork
    if (!imageUrl && feed['itunes:image']) {
      if (typeof feed['itunes:image'] === 'object') {
        imageUrl = feed['itunes:image'].href || feed['itunes:image'].url || '';
      } else {
        imageUrl = feed['itunes:image'];
      }
      thumbnailUrl = imageUrl;
    }
    
    // Look for image in feed description
    if (!imageUrl && feed.description) {
      const imageFromDesc = this.extractImageFromContent(feed.description);
      if (imageFromDesc) {
        imageUrl = imageFromDesc;
        thumbnailUrl = imageFromDesc;
      }
    }
    
    // Return both main image and thumbnail as an object
    return {
      main: this.cleanText(imageUrl),
      thumbnail: this.cleanText(thumbnailUrl)
    };
  }

  extractCategories(item) {
    const categories = [];
    
    // RSS categories
    if (item.categories && Array.isArray(item.categories)) {
      categories.push(...item.categories.map(cat => this.cleanText(cat)));
    } else if (item.category) {
      categories.push(this.cleanText(item.category));
    }
    
    // Dublin Core subject
    if (item['dc:subject']) {
      if (Array.isArray(item['dc:subject'])) {
        categories.push(...item['dc:subject'].map(cat => this.cleanText(cat)));
      } else {
        categories.push(this.cleanText(item['dc:subject']));
      }
    }
    
    // Extract hashtags from title and description
    const titleTags = this.extractHashtags(item.title || '');
    const descTags = this.extractHashtags(item.contentSnippet || '');
    
    categories.push(...titleTags, ...descTags);
    
    return [...new Set(categories.filter(cat => cat && cat.length > 0))];
  }

  createSummary(description, maxLength = 200) {
    if (!description) return '';
    const cleaned = description.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...'
      : cleaned;
  }

  getWordCount(content) {
    if (!content) return 0;
    const cleaned = content.replace(/<[^>]*>/g, '').trim();
    return cleaned.split(/\s+/).filter(word => word.length > 0).length;
  }

  estimateReadingTime(content) {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const wordCount = this.getWordCount(content);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  extractTextFromHTML(htmlContent) {
    if (!htmlContent) return '';
    
    let content = htmlContent.toString();
    
    // Remove CDATA wrapper
    content = content.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
    
    // Extract text from <a> tags
    content = content.replace(/<a[^>]*>([^<]+)<\/a>/gi, '$1');
    
    // Remove HTML tags
    content = content.replace(/<[^>]*>/g, ' ');
    
    // Clean up HTML entities
    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');
    
    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    return content;
  }

  // Replace the extractImageFromContent method:
  extractImageFromContent(htmlContent) {
    if (!htmlContent) return '';
    
    // Multiple regex patterns to catch different img tag formats
    const imgPatterns = [
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]+src=([^\s>]+)[^>]*>/gi,
      /<image[^>]+url=["']([^"']+)["'][^>]*>/gi
    ];
    
    for (const pattern of imgPatterns) {
      const matches = [...htmlContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        for (const match of matches) {
          let imageUrl = match[1];
          
          // Clean the URL
          imageUrl = imageUrl.trim().replace(/^["']|["']$/g, '');
          
          // Skip obviously bad URLs
          if (imageUrl.includes('spacer.gif') || 
              imageUrl.includes('pixel.gif') || 
              imageUrl.includes('blank.gif') ||
              imageUrl.includes('1x1') ||
              imageUrl.length < 10) {
            continue;
          }
          
          // Handle protocol-relative URLs
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }
          
          // Skip relative URLs
          if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
            continue;
          }
          
          // Validate and return first good URL
          try {
            new URL(imageUrl);
            console.log(`🎯 Found valid image in HTML: ${imageUrl}`);
            return imageUrl;
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    return '';
  }

  extractHashtags(text) {
    if (!text) return [];
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  cleanText(text) {
    if (!text) return '';
    return text.toString()
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  shouldDeactivateFeed(statusCode, errorMessage) {
    const permanentClientErrors = [404, 410, 403, 451];
    
    if (permanentClientErrors.includes(statusCode)) {
      return true;
    }
    
    if (errorMessage) {
      const permanentErrorMessages = [
        /feed.*(not found|does not exist|removed|deleted)/i,
        /page.*(not found|does not exist|removed|deleted)/i,
        /domain.*(expired|suspended|terminated|parked)/i,
        /site.*(closed|shutdown|discontinued|offline)/i,
        /permanently.*(moved|unavailable|removed|disabled)/i
      ];
      
      const errorText = errorMessage.toLowerCase();
      if (permanentErrorMessages.some(pattern => pattern.test(errorText))) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = RSSFeedParser;