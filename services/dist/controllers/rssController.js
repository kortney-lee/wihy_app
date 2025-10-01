const { getPool, sql } = require('../config/database');
const axios = require('axios');
const xml2js = require('xml2js');

console.log('📰 RSS Controller loading...');

class RSSController {
  constructor() {
    this.isInitialized = false;
    this.pollingInterval = null;
    console.log('📰 RSS Controller created');
  }

  async ensureInitialized() {
    if (this.isInitialized) return;
    try {
      console.log('📰 Initializing RSS database components...');
      await this.createRSSTables();
      await this.createRSSStoredProcedures();
      this.isInitialized = true;
      
      // Start automatic polling every 5 minutes
      this.startPolling();
      
      console.log('✅ RSS Controller initialized successfully');
    } catch (error) {
      console.error('❌ RSS Controller initialization failed:', error);
      throw error;
    }
  }

  async createRSSTables() {
    const pool = getPool();

    // ---- dbo.rss_feeds (Updated to match your schema) ----
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.rss_feeds') AND type='U')
      BEGIN
        CREATE TABLE dbo.rss_feeds (
          rss_feeds_id    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          country_code    NVARCHAR(10)   NULL,
          category        NVARCHAR(100)  NULL,
          feed_url        NVARCHAR(1000) NOT NULL,
          feed_title      NVARCHAR(500)  NULL,
          feed_description NVARCHAR(MAX) NULL,
          feed_link       NVARCHAR(1000) NULL,
          etag            NVARCHAR(500)  NULL,
          last_modified   NVARCHAR(500)  NULL,
          last_status     INT            NULL,
          last_checked    DATETIME       NULL,
          is_active       BIT NOT NULL CONSTRAINT DF_dbo_rss_feeds_is_active DEFAULT(1),
          created_at      DATETIME NOT NULL CONSTRAINT DF_dbo_rss_feeds_created_at DEFAULT(GETDATE()),
          last_updated    DATETIME       NULL,
          feed_url_hash   AS CONVERT(VARBINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM(feed_url))))) PERSISTED,
          updated_at      DATETIME NOT NULL CONSTRAINT DF_dbo_rss_feeds_updated_at DEFAULT(GETDATE()),
          last_fetched    DATETIME       NULL,
          fetch_count     INT NOT NULL CONSTRAINT DF_dbo_rss_feeds_fetch_count DEFAULT(0)
        );
        CREATE UNIQUE INDEX UX_dbo_rss_feeds_urlhash ON dbo.rss_feeds(feed_url_hash);
        CREATE INDEX IX_dbo_rss_feeds_category ON dbo.rss_feeds(category);
        CREATE INDEX IX_dbo_rss_feeds_country  ON dbo.rss_feeds(country_code);
        CREATE INDEX IX_dbo_rss_feeds_active   ON dbo.rss_feeds(is_active);
        CREATE INDEX IX_dbo_rss_feeds_last_checked ON dbo.rss_feeds(last_checked);
        PRINT 'RSS feeds table created (dbo.rss_feeds)';
      END
      ELSE
      BEGIN
        -- Add missing columns if they don't exist
        IF COL_LENGTH('dbo.rss_feeds','feed_description') IS NULL
          ALTER TABLE dbo.rss_feeds ADD feed_description NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.rss_feeds','feed_link') IS NULL
          ALTER TABLE dbo.rss_feeds ADD feed_link NVARCHAR(1000) NULL;
        IF COL_LENGTH('dbo.rss_feeds','etag') IS NULL
          ALTER TABLE dbo.rss_feeds ADD etag NVARCHAR(500) NULL;
        IF COL_LENGTH('dbo.rss_feeds','last_modified') IS NULL
          ALTER TABLE dbo.rss_feeds ADD last_modified NVARCHAR(500) NULL;
        IF COL_LENGTH('dbo.rss_feeds','last_status') IS NULL
          ALTER TABLE dbo.rss_feeds ADD last_status INT NULL;
        IF COL_LENGTH('dbo.rss_feeds','last_checked') IS NULL
          ALTER TABLE dbo.rss_feeds ADD last_checked DATETIME NULL;
        IF COL_LENGTH('dbo.rss_feeds','last_updated') IS NULL
          ALTER TABLE dbo.rss_feeds ADD last_updated DATETIME NULL;
        IF COL_LENGTH('dbo.rss_feeds','feed_url_hash') IS NULL
          ALTER TABLE dbo.rss_feeds ADD feed_url_hash AS CONVERT(VARBINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM(feed_url))))) PERSISTED;
        
        -- Add indexes if they don't exist
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_dbo_rss_feeds_urlhash' AND object_id=OBJECT_ID('dbo.rss_feeds'))
          CREATE UNIQUE INDEX UX_dbo_rss_feeds_urlhash ON dbo.rss_feeds(feed_url_hash);
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_dbo_rss_feeds_last_checked' AND object_id=OBJECT_ID('dbo.rss_feeds'))
          CREATE INDEX IX_dbo_rss_feeds_last_checked ON dbo.rss_feeds(last_checked);
          
        PRINT 'RSS feeds table already exists (dbo.rss_feeds)';
      END
    `);

    // ---- dbo.rss_articles (Keep existing) ----
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.rss_articles') AND type='U')
      BEGIN
        CREATE TABLE dbo.rss_articles (
          id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          rss_feeds_id  INT NOT NULL,
          title         NVARCHAR(500) NOT NULL,
          description   NVARCHAR(MAX) NULL,
          link          NVARCHAR(1000) NOT NULL,
          author        NVARCHAR(200)  NULL,
          pub_date_raw  NVARCHAR(100)  NULL,
          pub_date      DATETIME       NULL,
          guid          NVARCHAR(500)  NULL,
          created_at    DATETIME NOT NULL CONSTRAINT DF_dbo_rss_articles_created_at DEFAULT(GETDATE()),
          updated_at    DATETIME NOT NULL CONSTRAINT DF_dbo_rss_articles_updated_at DEFAULT(GETDATE()),
          CONSTRAINT FK_dbo_rss_articles_feeds
            FOREIGN KEY (rss_feeds_id) REFERENCES dbo.rss_feeds(rss_feeds_id) ON DELETE CASCADE
        );
        CREATE INDEX IX_dbo_rss_articles_feed    ON dbo.rss_articles(rss_feeds_id);
        CREATE INDEX IX_dbo_rss_articles_pubdate ON dbo.rss_articles(pub_date DESC);
        CREATE INDEX IX_dbo_rss_articles_created ON dbo.rss_articles(created_at DESC);
        CREATE UNIQUE INDEX UX_dbo_rss_articles_guid ON dbo.rss_articles(guid) WHERE guid IS NOT NULL;
        PRINT 'RSS articles table created (dbo.rss_articles)';
      END
      ELSE
      BEGIN
        PRINT 'RSS articles table already exists (dbo.rss_articles)';
      END
    `);
  }

  async createRSSStoredProcedures() {
    const pool = getPool();

    // -------- sp_GetRSSArticles (Updated for new schema) --------
    const getArticlesExists = await pool.request().query(`
      SELECT COUNT(*) as proc_count FROM sys.objects 
      WHERE object_id = OBJECT_ID('dbo.sp_GetRSSArticles') AND type='P'
    `);

    if (getArticlesExists.recordset[0].proc_count === 0) {
      console.log('📰 Creating sp_GetRSSArticles...');
      await pool.request().query(`
        CREATE PROCEDURE dbo.sp_GetRSSArticles
          @limit        INT           = 50,
          @category     NVARCHAR(100) = NULL,
          @country_code NVARCHAR(10)  = NULL,
          @rss_feeds_id INT           = NULL
        AS
        BEGIN
          SET NOCOUNT ON;
          DECLARE @lim INT = CASE WHEN @limit IS NULL OR @limit <= 0 THEN 2147483647 ELSE @limit END;

          SELECT TOP (@lim)
              a.id,
              a.rss_feeds_id,
              a.title,
              a.description,
              a.link,
              ISNULL(a.pub_date, TRY_CONVERT(datetime, a.pub_date_raw)) AS pub_date,
              a.author,
              a.guid,
              a.created_at,
              f.rss_feeds_id AS feed_id,
              f.feed_title,
              f.feed_url,
              f.feed_description,
              f.feed_link,
              f.category,
              f.country_code,
              f.last_checked,
              f.last_status
          FROM dbo.rss_articles AS a
          INNER JOIN dbo.rss_feeds  AS f
                  ON a.rss_feeds_id = f.rss_feeds_id
          WHERE f.is_active = 1
            AND (@category     IS NULL OR f.category     = @category)
            AND (@country_code IS NULL OR f.country_code = @country_code)
            AND (@rss_feeds_id IS NULL OR f.rss_feeds_id = @rss_feeds_id)
          ORDER BY ISNULL(a.pub_date, a.created_at) DESC, a.created_at DESC;
        END
      `);
      console.log('✅ sp_GetRSSArticles created');
    } else {
      console.log('✅ sp_GetRSSArticles already exists');
    }

    // -------- sp_IngestRSSArticles_JSON (Keep existing) --------
    const ingestExists = await pool.request().query(`
      SELECT COUNT(*) as proc_count FROM sys.objects 
      WHERE object_id = OBJECT_ID('dbo.sp_IngestRSSArticles_JSON') AND type='P'
    `);

    if (ingestExists.recordset[0].proc_count === 0) {
      console.log('📰 Creating sp_IngestRSSArticles_JSON...');
      await pool.request().query(`
        CREATE PROCEDURE dbo.sp_IngestRSSArticles_JSON
          @rss_feeds_id INT,
          @items        NVARCHAR(MAX),  -- JSON array [{title,description,link,author,pubDate,guid}]
          @touch_feed   BIT = 1
        AS
        BEGIN
          SET NOCOUNT ON;

          ;WITH j AS (
            SELECT
              JSON_VALUE(a.value,'$.title')       AS title,
              JSON_VALUE(a.value,'$.description') AS description,
              JSON_VALUE(a.value,'$.link')        AS link,
              JSON_VALUE(a.value,'$.author')      AS author,
              JSON_VALUE(a.value,'$.pubDate')     AS pub_date_raw,
              JSON_VALUE(a.value,'$.guid')        AS guid
            FROM OPENJSON(@items) AS a
          )
          INSERT INTO dbo.rss_articles
            (rss_feeds_id, title, description, link, author, pub_date_raw, pub_date, guid)
          SELECT
            @rss_feeds_id,
            LEFT(ISNULL(j.title,''),500),
            j.description,
            LEFT(ISNULL(j.link,''),1000),
            LEFT(ISNULL(j.author,''),200),
            j.pub_date_raw,
            TRY_CONVERT(datetime, j.pub_date_raw),
            LEFT(ISNULL(j.guid,''),500)
          FROM j
          WHERE
            (NULLIF(LTRIM(RTRIM(j.link)),'') IS NOT NULL OR NULLIF(LTRIM(RTRIM(j.guid)),'') IS NOT NULL)
            AND NOT EXISTS (
              SELECT 1 FROM dbo.rss_articles x
              WHERE x.rss_feeds_id = @rss_feeds_id
                AND (
                     (NULLIF(LTRIM(RTRIM(j.link)),'') IS NOT NULL AND x.link = j.link)
                  OR (NULLIF(LTRIM(RTRIM(j.guid)),'') IS NOT NULL AND x.guid = j.guid)
                )
            );

          IF (@touch_feed = 1)
          BEGIN
            UPDATE dbo.rss_feeds
              SET last_fetched = GETUTCDATE(),
                  fetch_count  = ISNULL(fetch_count,0) + 1,
                  updated_at   = GETUTCDATE(),
                  last_checked = GETUTCDATE(),
                  last_status  = 200
            WHERE rss_feeds_id = @rss_feeds_id;
          END
        END
      `);
      console.log('✅ sp_IngestRSSArticles_JSON created');
    } else {
      console.log('✅ sp_IngestRSSArticles_JSON already exists');
    }

    console.log('✅ RSS stored procedures verified/created');
  }

  // ENHANCED: RSS XML Parsing with better metadata
  async fetchAndParseRSSFeed(feedUrl, feedId = null) {
    try {
      console.log(`📰 Fetching RSS feed: ${feedUrl}`);
      
      const response = await axios.get(feedUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'vHealth RSS Reader 1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.data) {
        throw new Error('No data received from RSS feed');
      }

      // Extract response headers for caching
      const etag = response.headers.etag || null;
      const lastModified = response.headers['last-modified'] || null;
      const status = response.status;

      console.log(`📰 Parsing XML content (${response.data.length} chars)`);
      
      const parser = new xml2js.Parser({
        explicitArray: false,
        trim: true,
        normalize: true,
        normalizeTags: true
      });

      const result = await parser.parseStringPromise(response.data);
      
      if (!result.rss || !result.rss.channel) {
        throw new Error('Invalid RSS format - missing rss/channel structure');
      }

      const channel = result.rss.channel;
      const items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);

      console.log(`📰 Found ${items.length} articles in RSS feed`);

      const articles = items.map(item => ({
        title: this.cleanText(item.title || ''),
        description: this.cleanText(item.description || item.summary || ''),
        link: this.cleanText(item.link || item.guid || ''),
        author: this.cleanText(item.author || item['dc:creator'] || item.creator || ''),
        pubDate: this.cleanText(item.pubdate || item.pubDate || item.published || ''),
        guid: this.cleanText(item.guid || item.id || item.link || '')
      })).filter(article => article.title && (article.link || article.guid));

      // Update feed metadata if feedId provided
      if (feedId) {
        await this.updateFeedMetadata(feedId, {
          feed_title: this.cleanText(channel.title || ''),
          feed_description: this.cleanText(channel.description || ''),
          feed_link: this.cleanText(channel.link || ''),
          etag: etag,
          last_modified: lastModified,
          last_status: status,
          last_checked: new Date(),
          last_updated: new Date()
        });
      }

      return {
        success: true,
        feedTitle: this.cleanText(channel.title || ''),
        feedDescription: this.cleanText(channel.description || ''),
        feedLink: this.cleanText(channel.link || ''),
        articles: articles,
        etag: etag,
        lastModified: lastModified,
        status: status
      };

    } catch (error) {
      console.error(`❌ Error fetching/parsing RSS feed ${feedUrl}:`, error.message);
      
      // Update feed with error status
      if (feedId) {
        await this.updateFeedMetadata(feedId, {
          last_status: error.response?.status || 500,
          last_checked: new Date()
        });
      }
      
      return {
        success: false,
        error: error.message,
        articles: [],
        status: error.response?.status || 500
      };
    }
  }

  async updateFeedMetadata(feedId, metadata) {
    try {
      const pool = getPool();
      
      const updateFields = [];
      const request = pool.request().input('rss_feeds_id', sql.Int, feedId);
      
      if (metadata.feed_title) {
        updateFields.push('feed_title = @feed_title');
        request.input('feed_title', sql.NVarChar, metadata.feed_title);
      }
      if (metadata.feed_description) {
        updateFields.push('feed_description = @feed_description');
        request.input('feed_description', sql.NVarChar, metadata.feed_description);
      }
      if (metadata.feed_link) {
        updateFields.push('feed_link = @feed_link');
        request.input('feed_link', sql.NVarChar, metadata.feed_link);
      }
      if (metadata.etag) {
        updateFields.push('etag = @etag');
        request.input('etag', sql.NVarChar, metadata.etag);
      }
      if (metadata.last_modified) {
        updateFields.push('last_modified = @last_modified');
        request.input('last_modified', sql.NVarChar, metadata.last_modified);
      }
      if (metadata.last_status) {
        updateFields.push('last_status = @last_status');
        request.input('last_status', sql.Int, metadata.last_status);
      }
      if (metadata.last_checked) {
        updateFields.push('last_checked = @last_checked');
        request.input('last_checked', sql.DateTime, metadata.last_checked);
      }
      if (metadata.last_updated) {
        updateFields.push('last_updated = @last_updated');
        request.input('last_updated', sql.DateTime, metadata.last_updated);
      }
      
      updateFields.push('updated_at = GETDATE()');
      
      const query = `UPDATE dbo.rss_feeds SET ${updateFields.join(', ')} WHERE rss_feeds_id = @rss_feeds_id`;
      
      await request.query(query);
      
    } catch (error) {
      console.error('❌ Error updating feed metadata:', error);
    }
  }

  cleanText(text) {
    if (!text) return '';
    return text.toString()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // NEW: Automatic polling every 5 minutes
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    console.log('🕒 Starting RSS polling every 5 minutes...');
    
    // Poll every 5 minutes (300,000 ms)
    this.pollingInterval = setInterval(async () => {
      try {
        console.log('🕒 Automatic RSS polling started...');
        await this.pollAllFeeds();
      } catch (error) {
        console.error('❌ Error in automatic polling:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Also run immediately on startup
    setTimeout(async () => {
      try {
        console.log('🚀 Initial RSS polling on startup...');
        await this.pollAllFeeds();
      } catch (error) {
        console.error('❌ Error in initial polling:', error);
      }
    }, 10000); // Wait 10 seconds after startup
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🛑 RSS polling stopped');
    }
  }

  async pollAllFeeds() {
    try {
      const pool = getPool();
      
      // Get feeds that need checking (active feeds, prioritize older last_checked)
      const feedsResult = await pool.request()
        .query(`
          SELECT rss_feeds_id, feed_url, feed_title, etag, last_modified, last_checked
          FROM dbo.rss_feeds 
          WHERE is_active = 1
          ORDER BY ISNULL(last_checked, '1900-01-01') ASC
        `);

      const feeds = feedsResult.recordset;
      let totalArticlesAdded = 0;
      
      console.log(`🕒 Polling ${feeds.length} active RSS feeds...`);

      for (const feed of feeds) {
        try {
          const rssResult = await this.fetchAndParseRSSFeed(feed.feed_url, feed.rss_feeds_id);
          
          if (rssResult.success && rssResult.articles.length > 0) {
            // Ingest new articles
            await pool.request()
              .input('rss_feeds_id', sql.Int, feed.rss_feeds_id)
              .input('items', sql.NVarChar(sql.MAX), JSON.stringify(rssResult.articles))
              .input('touch_feed', sql.Bit, true)
              .execute('dbo.sp_IngestRSSArticles_JSON');

            totalArticlesAdded += rssResult.articles.length;
            console.log(`✅ Polled ${feed.feed_title}: ${rssResult.articles.length} new articles`);
          } else {
            console.log(`📰 Polled ${feed.feed_title}: No new articles`);
          }

        } catch (feedError) {
          console.error(`❌ Error polling feed ${feed.feed_title}:`, feedError.message);
        }
        
        // Small delay between feeds to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (totalArticlesAdded > 0) {
        console.log(`🎉 Polling complete: ${totalArticlesAdded} new articles added`);
      } else {
        console.log(`📰 Polling complete: No new articles found`);
      }

    } catch (error) {
      console.error('❌ Error in pollAllFeeds:', error);
    }
  }

  // ---------------- Controller methods (Updated) ----------------

  async getFeedsForClient(req, res) {
    try {
      await this.ensureInitialized();

      const pool = getPool();
      const limit = Number.parseInt(req.query.limit, 10) || 100;
      const onlyActive = req.query.only_active !== 'false';

      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .input('onlyActive', sql.Bit, onlyActive)
        .query(`
          SELECT TOP (@limit)
            rss_feeds_id, country_code, category, feed_url, feed_title, 
            feed_description, feed_link, etag, last_modified, last_status,
            last_checked, is_active, created_at, last_updated, updated_at,
            last_fetched, fetch_count
          FROM dbo.rss_feeds
          WHERE (@onlyActive = 0 OR is_active = 1)
          ORDER BY last_checked DESC, created_at DESC;
        `);

      res.json({ success: true, feeds: result.recordset, count: result.recordset.length });
    } catch (error) {
      console.error('❌ Error getting feeds:', error);
      res.status(500).json({ success: false, message: 'Failed to get RSS feeds', error: error.message });
    }
  }

  async getArticles(req, res) {
    try {
      await this.ensureInitialized();

      const pool = getPool();
      const limit     = Number.parseInt(req.query.limit, 10) || 50;
      const category  = req.query.category || null;
      const country   = req.query.country  || null;
      const feedId    = req.query.feed_id ? Number.parseInt(req.query.feed_id, 10) : null;

      const result = await pool.request()
        .input('limit',        sql.Int,      limit)
        .input('category',     sql.NVarChar, category)
        .input('country_code', sql.NVarChar, country)
        .input('rss_feeds_id', sql.Int,      feedId)
        .execute('dbo.sp_GetRSSArticles');

      res.json({ success: true, articles: result.recordset, count: result.recordset.length });
    } catch (error) {
      console.error('❌ Error getting articles:', error);
      res.status(500).json({ success: false, message: 'Failed to get RSS articles', error: error.message });
    }
  }

  async seedSampleFeeds(req, res) {
    try {
      await this.ensureInitialized();

      const sampleFeeds = [
        { feed_url: 'https://www.nih.gov/news-events/news-releases/rss.xml', category: 'medical', country_code: 'US' },
        { feed_url: 'https://www.cdc.gov/rss/health.xml', category: 'health', country_code: 'US' },
        { feed_url: 'https://feeds.npr.org/1002/rss.xml', category: 'health', country_code: 'US' },
        { feed_url: 'https://rss.cnn.com/rss/cnn_health.rss', category: 'health', country_code: 'US' },
        { feed_url: 'https://www.cbsnews.com/latest/rss/health', category: 'health', country_code: 'US' }
      ];

      const pool = getPool();
      let feedsAdded = 0;
      let articlesAdded = 0;

      for (const feed of sampleFeeds) {
        try {
          // Insert feed (let RSS parsing fill in the details)
          const feedResult = await pool.request()
            .input('feed_url', sql.NVarChar, feed.feed_url)
            .input('category', sql.NVarChar, feed.category)
            .input('country_code', sql.NVarChar, feed.country_code)
            .query(`
              DECLARE @id INT;
              SELECT @id = rss_feeds_id FROM dbo.rss_feeds WHERE feed_url = @feed_url;

              IF @id IS NULL
              BEGIN
                INSERT INTO dbo.rss_feeds (feed_url, category, country_code)
                OUTPUT inserted.rss_feeds_id
                VALUES (@feed_url, @category, @country_code);
              END
              ELSE
              BEGIN
                SELECT @id AS rss_feeds_id;
              END
            `);

          const feedId = feedResult.recordset?.[0]?.rss_feeds_id;
          if (feedId) {
            feedsAdded++;

            // Fetch and parse RSS content
            console.log(`📰 Processing RSS feed: ${feed.feed_url}`);
            const rssResult = await this.fetchAndParseRSSFeed(feed.feed_url, feedId);

            if (rssResult.success && rssResult.articles.length > 0) {
              // Ingest articles
              await pool.request()
                .input('rss_feeds_id', sql.Int, feedId)
                .input('items', sql.NVarChar(sql.MAX), JSON.stringify(rssResult.articles))
                .input('touch_feed', sql.Bit, true)
                .execute('dbo.sp_IngestRSSArticles_JSON');

              articlesAdded += rssResult.articles.length;
              console.log(`✅ Added ${rssResult.articles.length} articles from ${rssResult.feedTitle}`);
            }
          }

        } catch (feedError) {
          console.error(`❌ Error processing feed ${feed.feed_url}:`, feedError.message);
        }
      }

      res.json({ 
        success: true, 
        message: 'Sample feeds seeded and will be polled every 5 minutes', 
        feeds_added: feedsAdded,
        articles_added: articlesAdded
      });

    } catch (error) {
      console.error('❌ Error seeding sample feeds:', error);
      res.status(500).json({ success: false, message: 'Failed to seed sample feeds', error: error.message });
    }
  }

  async fetchAllFeeds(req, res) {
    try {
      await this.ensureInitialized();
      await this.pollAllFeeds();
      
      res.json({
        success: true,
        message: 'Manual RSS fetch completed. Check articles for updates.'
      });

    } catch (error) {
      console.error('❌ Error fetching all feeds:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch all feeds', error: error.message });
    }
  }

  async ingestArticles(req, res) {
    try {
      await this.ensureInitialized();

      const { rss_feeds_id, items, touch_feed = true } = req.body || {};
      if (!rss_feeds_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'rss_feeds_id and non-empty items[] are required' });
      }

      const pool = getPool();
      const result = await pool.request()
        .input('rss_feeds_id', sql.Int, rss_feeds_id)
        .input('items', sql.NVarChar(sql.MAX), JSON.stringify(items))
        .input('touch_feed', sql.Bit, !!touch_feed)
        .execute('dbo.sp_IngestRSSArticles_JSON');

      res.json({ success: true, message: 'Ingested', meta: result.recordset?.[0] || null });
    } catch (error) {
      console.error('❌ Error in RSS ingestion:', error);
      res.status(500).json({ success: false, message: 'RSS ingestion failed', error: error.message });
    }
  }
}

module.exports = new RSSController();