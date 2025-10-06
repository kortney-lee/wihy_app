const { getPool, sql } = require('../config/database');
const axios = require('axios');
const xml2js = require('xml2js');

class RSSController {
  constructor() {
    this.isInitialized = false;
    this.pollingInterval = null;
  }

  async ensureInitialized() {
    if (this.isInitialized) return;
    try {
      await this.createRSSTables();
      await this.createRSSStoredProcedures();
      this.isInitialized = true;
      
      // Start automatic polling every 5 minutes
      this.startPolling();
    } catch (error) {
      console.error('RSS Controller initialization failed:', error);
      throw error;
    }
  }

  async createRSSTables() {
    const pool = getPool();
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
          image_url       NVARCHAR(1000) NULL,
          thumbnail_url   NVARCHAR(1000) NULL,
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
          fetch_count     INT NOT NULL CONSTRAINT DF_dbo_rss_feeds_fetch_count DEFAULT(0),
          latest_articles NVARCHAR(MAX) NULL
        );
        CREATE UNIQUE INDEX UX_dbo_rss_feeds_urlhash ON dbo.rss_feeds(feed_url_hash);
        CREATE INDEX IX_dbo_rss_feeds_category ON dbo.rss_feeds(category);
        CREATE INDEX IX_dbo_rss_feeds_country  ON dbo.rss_feeds(country_code);
        CREATE INDEX IX_dbo_rss_feeds_active   ON dbo.rss_feeds(is_active);
        CREATE INDEX IX_dbo_rss_feeds_last_checked ON dbo.rss_feeds(last_checked);
      END
    `);
  }

  async createRSSStoredProcedures() {
    const pool = getPool();
    await pool.request().query(`
      IF OBJECT_ID('dbo.sp_GetRSSArticles', 'P') IS NOT NULL
        DROP PROCEDURE dbo.sp_GetRSSArticles;
    `);

    await pool.request().query(`
      CREATE PROCEDURE dbo.sp_GetRSSArticles
        @limit        INT           = 50,
        @category     NVARCHAR(100) = NULL,
        @country_code NVARCHAR(10)  = NULL,
        @rss_feeds_id INT           = NULL
      AS
      BEGIN
        SET NOCOUNT ON;
        SELECT 
          f.rss_feeds_id,
          f.feed_title,
          f.feed_url,
          f.feed_description,
          f.feed_link,
          f.image_url AS feed_image_url,
          f.thumbnail_url AS feed_thumbnail_url,
          f.category,
          f.country_code,
          f.last_checked,
          f.last_status,
          f.latest_articles,
          f.fetch_count,
          f.created_at,
          f.updated_at
        FROM dbo.rss_feeds f
        WHERE f.is_active = 1
          AND (@category     IS NULL OR f.category     = @category)
          AND (@country_code IS NULL OR f.country_code = @country_code)
          AND (@rss_feeds_id IS NULL OR f.rss_feeds_id = @rss_feeds_id)
          AND f.latest_articles IS NOT NULL
        ORDER BY f.last_checked DESC, f.created_at DESC;
      END
    `);
  }

  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollAllFeeds();
      } catch (error) {
        console.error('Error in automatic polling:', error);
      }
    }, 5 * 60 * 1000);
    
    setTimeout(async () => {
      try {
        await this.pollAllFeeds();
      } catch (error) {
        console.error('Error in initial polling:', error);
      }
    }, 10000);
  }

  async pollAllFeeds() {
    const pool = getPool();
    const feedsResult = await pool.request()
      .query(`
        SELECT rss_feeds_id, feed_url
        FROM dbo.rss_feeds 
        WHERE is_active = 1
      `);

    const feeds = feedsResult.recordset;

    for (const feed of feeds) {
      await this.fetchAndParseRSSFeed(feed.feed_url, feed.rss_feeds_id);
    }
  }

  async fetchAndParseRSSFeed(feedUrl, feedId = null) {
    try {
      const response = await axios.get(feedUrl);
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      // Process the result and update the feed
    } catch (error) {
      console.error(`Error fetching/parsing RSS feed ${feedUrl}:`, error);
    }
  }
}

module.exports = new RSSController();