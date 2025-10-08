const Parser = require('rss-parser');

class RSSFeedParser {
    constructor() {
        // Remove the enhancedParser and use the enhanced logic directly
        this.parser = new Parser({
            customFields: {
                feed: ['image', 'lastBuildDate', 'managingEditor'],
                item: [
                    ['media:content', 'mediaContent', { keepArray: true }],
                    ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
                    ['content:encoded', 'contentEncoded'],
                    ['dc:creator', 'creator'],
                    ['enclosure', 'enclosure'],
                    ['image', 'image'],
                    ['thumbnail', 'thumbnail']
                ]
            }
        });

        console.log('📡 [RSSFeedParser] Enhanced RSS parser initialized');
    }

    async fetchAndParseRSSFeed(feedUrl, feedId = null) {
        try {
            console.log(`📡 [RSSFeedParser] Fetching RSS feed: ${feedUrl}`);
            
            // Use built-in parser with enhanced processing
            const feed = await this.parser.parseURL(feedUrl);
            
            console.log(`📡 [RSSFeedParser] Successfully parsed: ${feed.title}`);
            console.log(`📡 [RSSFeedParser] Found ${feed.items.length} articles`);

            // Process articles with enhanced image data
            const articles = [];
            
            for (let i = 0; i < feed.items.length; i++) {
                const item = feed.items[i];
                const article = this.processEnhancedArticle(item, feedId, feed.title);
                articles.push(article);
                
                // Log image extraction results
                console.log(`📸 [RSSFeedParser] Article ${i + 1}: "${article.title.substring(0, 50)}..."`);
                console.log(`📸 [RSSFeedParser] Images found: ${article.images_found || 0}`);
                console.log(`📸 [RSSFeedParser] Has media: ${article.has_media}`);
                console.log(`📸 [RSSFeedParser] Media URL: ${article.media_url || 'NONE'}`);
                console.log(`📸 [RSSFeedParser] Thumb URL: ${article.media_thumb_url || 'NONE'}`);
            }

            // Extract feed-level images
            const feedImages = this.extractFeedImages(feed);
            
            console.log(`📸 [RSSFeedParser] Feed images: main=${feedImages.feedImage ? 'YES' : 'NO'}, thumbnail=${feedImages.feedThumbnail ? 'YES' : 'NO'}`);

            return {
                success: true,
                feedTitle: feed.title || '',
                feedDescription: feed.description || '',
                feedImage: feedImages.feedImage,
                feedThumbnail: feedImages.feedThumbnail,
                feedLink: feed.link || '',
                lastBuildDate: feed.lastBuildDate || '',
                articles: articles,
                totalArticles: articles.length
            };

        } catch (error) {
            console.error(`❌ [RSSFeedParser] Error parsing ${feedUrl}:`, error);
            return {
                success: false,
                error: error.message,
                feedUrl: feedUrl,
                articles: []
            };
        }
    }

    processEnhancedArticle(item, feedId, feedTitle) {
        // Extract images using built-in methods (no external enhancedParser needed)
        const images = this.extractImages(item);
        const primaryImage = images[0] || null;
        const thumbnailImage = this.findThumbnail(images) || primaryImage;
        
        // Create the article object with proper image fields
        const article = {
            title: item.title || '',
            description: this.cleanDescription(item.description || item.contentEncoded || ''),
            content: item.contentEncoded || item.description || '',
            link: item.link || '',
            guid: item.guid || item.link || '',
            author: item.author || item.creator || '',
            pubDate: this.parseDate(item.pubDate || item.isoDate),
            
            // Enhanced image data
            media_url: primaryImage?.url || '',
            media_thumb_url: thumbnailImage?.url || primaryImage?.url || '',
            media_type: primaryImage?.type || 'image',
            has_media: images.length > 0,
            
            // Additional metadata for debugging
            images_found: images.length,
            image_sources: images.map(img => img.source).join(', '),
            all_image_urls: images.map(img => img.url),
            
            // Feed reference
            feed_id: feedId,
            feed_title: feedTitle || '',
            
            // Timestamps
            extracted_at: new Date().toISOString(),
            
            // Content analysis
            word_count: this.getWordCount(item.contentEncoded || item.description || ''),
            has_content: !!(item.contentEncoded || item.description),
            has_author: !!(item.author || item.creator)
        };

        return article;
    }

    extractImages(item) {
        const images = [];

        // 1. Media RSS namespace (media:content, media:thumbnail)
        if (item.mediaContent) {
            if (Array.isArray(item.mediaContent)) {
                item.mediaContent.forEach(media => {
                    if (media.$ && media.$.url) {
                        images.push({
                            url: media.$.url,
                            type: media.$.type || 'unknown',
                            source: 'media:content'
                        });
                    }
                });
            } else if (item.mediaContent.$ && item.mediaContent.$.url) {
                images.push({
                    url: item.mediaContent.$.url,
                    type: item.mediaContent.$.type || 'unknown',
                    source: 'media:content'
                });
            }
        }

        // 2. Media thumbnail
        if (item.mediaThumbnail) {
            if (Array.isArray(item.mediaThumbnail)) {
                item.mediaThumbnail.forEach(thumb => {
                    if (thumb.$ && thumb.$.url) {
                        images.push({
                            url: thumb.$.url,
                            type: 'thumbnail',
                            source: 'media:thumbnail'
                        });
                    }
                });
            } else if (item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
                images.push({
                    url: item.mediaThumbnail.$.url,
                    type: 'thumbnail',
                    source: 'media:thumbnail'
                });
            }
        }

        // 3. Enclosure (podcast/media attachments)
        if (item.enclosure && item.enclosure.url) {
            const type = item.enclosure.type || '';
            if (type.startsWith('image/')) {
                images.push({
                    url: item.enclosure.url,
                    type: 'enclosure',
                    source: 'enclosure'
                });
            }
        }

        // 4. Extract from HTML content
        const htmlImages = this.extractImagesFromHTML(item.contentEncoded || item.description || item.content || '');
        images.push(...htmlImages);

        // 5. Direct image fields
        if (item.image) {
            images.push({
                url: item.image,
                type: 'direct',
                source: 'image'
            });
        }

        return this.deduplicateImages(images);
    }

    extractImagesFromHTML(htmlContent) {
        if (!htmlContent) return [];
        
        const images = [];
        
        // Match img tags
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let match;
        
        while ((match = imgRegex.exec(htmlContent)) !== null) {
            const imgUrl = match[1];
            
            // Skip small images (likely icons/tracking pixels)
            if (this.isValidImageUrl(imgUrl)) {
                images.push({
                    url: imgUrl,
                    type: 'html',
                    source: 'content'
                });
            }
        }

        return images;
    }

    isValidImageUrl(url) {
        if (!url) return false;
        
        // Skip tracking pixels and small images
        const skipPatterns = [
            /1x1/i,
            /pixel/i,
            /tracking/i,
            /analytics/i,
            /beacon/i,
            /\.gif$/i
        ];
        
        return !skipPatterns.some(pattern => pattern.test(url));
    }

    findThumbnail(images) {
        // Prefer actual thumbnails
        const thumbnail = images.find(img => 
            img.type === 'thumbnail' || 
            img.source === 'media:thumbnail' ||
            img.url.includes('thumb')
        );
        
        return thumbnail;
    }

    deduplicateImages(images) {
        const seen = new Set();
        return images.filter(img => {
            if (seen.has(img.url)) {
                return false;
            }
            seen.add(img.url);
            return true;
        });
    }

    extractFeedImages(feed) {
        let feedImage = '';
        let feedThumbnail = '';

        // Try multiple sources for feed image
        if (feed.image) {
            if (typeof feed.image === 'string') {
                feedImage = feed.image;
            } else if (feed.image.url) {
                feedImage = feed.image.url;
            } else if (feed.image.link) {
                feedImage = feed.image.link;
            }
        }

        // Try iTunes image
        if (!feedImage && feed.itunes && feed.itunes.image) {
            feedImage = feed.itunes.image;
        }

        // Use feed image as thumbnail if no specific thumbnail
        feedThumbnail = feedImage;

        return {
            feedImage,
            feedThumbnail
        };
    }

    cleanDescription(description) {
        if (!description) return '';
        
        // Remove HTML tags but preserve some formatting
        let cleaned = description
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
            .replace(/<style[^>]*>.*?<\/style>/gi, '')   // Remove styles
            .replace(/<[^>]*>/g, ' ')                     // Remove HTML tags
            .replace(/\s+/g, ' ')                         // Normalize whitespace
            .trim();
        
        // Decode HTML entities
        cleaned = cleaned
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&hellip;/g, '...');
        
        return cleaned;
    }

    parseDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? new Date() : date;
        } catch {
            return new Date();
        }
    }

    getWordCount(content) {
        if (!content) return 0;
        const cleaned = this.cleanDescription(content);
        return cleaned.split(/\s+/).filter(word => word.length > 0).length;
    }

    // Keep the old method for backward compatibility
    async parseRSSFeed(feedUrl, feedId = null) {
        return this.fetchAndParseRSSFeed(feedUrl, feedId);
    }
}

module.exports = RSSFeedParser;