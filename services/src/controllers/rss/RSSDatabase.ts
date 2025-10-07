import { getPool, sql } from '../../config/database';
import type { ParsedArticle } from './RSSFeedParser';

interface FeedParams {
  limit?: string | number;
  category?: string;
  country?: string;
  only_active?: string;
}

interface ArticleParams {
  limit?: string | number;
  category?: string;
  country?: string;
  feed_id?: string | number;
  flat?: string;
}

interface UpdateArticlesPayload {
  articles?: ParsedArticle[];
  feedTitle?: string;
  feedDescription?: string;
  feedLink?: string;
  feedImage?: string;
  feedThumbnail?: string;
  etag?: string | null;
  lastModified?: string | null;
  status?: number;
  lastChecked?: Date;
  shouldDeactivate?: boolean;
}

interface CuratedFeedDefinition {
  url: string;
  category: string;
  title: string;
  country_code: string;
}

const CURATED_FEEDS: CuratedFeedDefinition[] = [
  { url: 'https://academic.oup.com/rss/site_5009/0.xml', category: 'Nutrition & Diet', title: 'American Journal of Clinical Nutrition', country_code: 'US' },
  { url: 'https://www.frontiersin.org/journals/nutrition/rss', category: 'Nutrition & Diet', title: 'Frontiers in Nutrition', country_code: 'GLOBAL' },
  { url: 'https://bmcnutr.biomedcentral.com/articles/rss.xml', category: 'Nutrition & Diet', title: 'BMC Nutrition', country_code: 'GLOBAL' },
  { url: 'https://www.jneb.org/current.rss', category: 'Nutrition & Diet', title: 'Journal of Nutrition Education & Behavior', country_code: 'US' },
  { url: 'https://www.sciencedaily.com/rss/health_medicine/nutrition.xml', category: 'Nutrition & Diet', title: 'ScienceDaily Nutrition News', country_code: 'US' },
  { url: 'https://www.nejm.org/action/showFeed?type=etoc&feed=rss', category: 'Medical Research', title: 'New England Journal of Medicine', country_code: 'US' },
  { url: 'https://jamanetwork.com/rss/site_7/0.xml', category: 'Medical Research', title: 'JAMA', country_code: 'US' },
  { url: 'https://www.thelancet.com/rssfeed/lancet_current.xml', category: 'Medical Research', title: 'The Lancet', country_code: 'UK' },
  { url: 'https://www.nature.com/nm/current_issue/rss', category: 'Medical Research', title: 'Nature Medicine', country_code: 'GLOBAL' },
  { url: 'https://www.nih.gov/news-events/news-releases/feed', category: 'Medical Research', title: 'NIH Research News', country_code: 'US' },
  { url: 'https://ajph.aphapublications.org/action/showFeed?type=etoc&feed=rss', category: 'Public Health', title: 'American Journal of Public Health', country_code: 'US' },
  { url: 'https://www.cdc.gov/mmwr/rss/rss.xml', category: 'Public Health', title: 'CDC MMWR', country_code: 'US' },
  { url: 'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml', category: 'Public Health', title: 'WHO News', country_code: 'GLOBAL' },
  { url: 'https://www.cambridge.org/core/rss/journals/public-health-nutrition', category: 'Public Health', title: 'Public Health Nutrition', country_code: 'GLOBAL' },
  { url: 'https://www.sciencedaily.com/rss/health_medicine/public_health.xml', category: 'Public Health', title: 'ScienceDaily Public Health', country_code: 'US' },
  { url: 'https://clinicaltrials.gov/ct2/results/rss.xml', category: 'Clinical Studies', title: 'ClinicalTrials.gov New Studies', country_code: 'US' },
  { url: 'https://ascopubs.org/action/showFeed?type=etoc&feed=rss&jc=jco', category: 'Clinical Studies', title: 'Journal of Clinical Oncology', country_code: 'US' },
  { url: 'https://www.ahajournals.org/action/showFeed?type=etoc&feed=rss&jc=circulationaha', category: 'Clinical Studies', title: 'Circulation', country_code: 'US' },
  { url: 'https://ajp.psychiatryonline.org/rss/current.xml', category: 'Clinical Studies', title: 'American Journal of Psychiatry Clinical', country_code: 'US' },
  { url: 'https://www.sciencedaily.com/rss/health_medicine/clinical_trials.xml', category: 'Clinical Studies', title: 'ScienceDaily Clinical Trials', country_code: 'US' },
  { url: 'https://www.cdc.gov/pcd/rss/PCDNews.xml', category: 'Disease Prevention', title: 'CDC Preventing Chronic Disease', country_code: 'US' },
  { url: 'https://www.thelancet.com/rssfeed/lancetinfectiousdiseases_current.xml', category: 'Disease Prevention', title: 'Lancet Infectious Diseases', country_code: 'UK' },
  { url: 'https://www.nature.com/mi/current_issue/rss', category: 'Disease Prevention', title: 'Nature Microbiology & Immunology', country_code: 'GLOBAL' },
  { url: 'https://www.sciencedaily.com/rss/health_medicine/diseases_and_conditions.xml', category: 'Disease Prevention', title: 'ScienceDaily Diseases & Conditions', country_code: 'US' },
  { url: 'https://www.nih.gov/news-events/news-releases/feed', category: 'Disease Prevention', title: 'NIH Prevention News', country_code: 'US' },
  { url: 'https://ajp.psychiatryonline.org/rss/current.xml', category: 'Mental Health', title: 'American Journal of Psychiatry', country_code: 'US' },
  { url: 'https://www.frontiersin.org/journals/psychology/rss', category: 'Mental Health', title: 'Frontiers in Psychology', country_code: 'GLOBAL' },
  { url: 'https://www.sciencedaily.com/rss/mind_brain/mental_health.xml', category: 'Mental Health', title: 'ScienceDaily Mental Health', country_code: 'US' },
  { url: 'https://www.thelancet.com/rssfeed/lancetpsychiatry_current.xml', category: 'Mental Health', title: 'The Lancet Psychiatry', country_code: 'UK' },
  { url: 'https://jamanetwork.com/rss/site_44/0.xml', category: 'Mental Health', title: 'JAMA Psychiatry', country_code: 'US' },
  { url: 'https://www.medscape.com/rss/feeds/news.xml', category: 'General Health', title: 'Medscape Medical News', country_code: 'US' },
  { url: 'https://www.nih.gov/news-events/news-releases/feed', category: 'General Health', title: 'NIH News', country_code: 'US' },
  { url: 'https://www.sciencedaily.com/rss/health_medicine.xml', category: 'General Health', title: 'ScienceDaily Health & Medicine', country_code: 'US' },
  { url: 'https://www.bmj.com/rss.xml', category: 'General Health', title: 'British Medical Journal', country_code: 'UK' },
  { url: 'https://www.webmd.com/rss/health.xml', category: 'General Health', title: 'WebMD Health', country_code: 'US' }
];

export default class RSSDatabase {
  private readonly targetCategories: string[] | null = null;

  async initialize(): Promise<void> {
    await this.createTables();
    await this.createStoredProcedures();
  }

  private async createTables(): Promise<void> {
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
          updated_at      DATETIME NOT NULL CONSTRAINT DF_dbo_rss_feeds_updated_at DEFAULT(GETDATE()),
          last_fetched    DATETIME       NULL,
          fetch_count     INT NOT NULL CONSTRAINT DF_dbo_rss_feeds_fetch_count DEFAULT(0),
          latest_articles NVARCHAR(MAX) NULL,
          feed_url_hash   AS CONVERT(VARBINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM(feed_url))))) PERSISTED
        );

        CREATE UNIQUE INDEX UX_dbo_rss_feeds_urlhash ON dbo.rss_feeds(feed_url_hash);
        CREATE INDEX IX_dbo_rss_feeds_category ON dbo.rss_feeds(category);
        CREATE INDEX IX_dbo_rss_feeds_country ON dbo.rss_feeds(country_code);
        CREATE INDEX IX_dbo_rss_feeds_active ON dbo.rss_feeds(is_active);
        CREATE INDEX IX_dbo_rss_feeds_last_checked ON dbo.rss_feeds(last_checked);
      END
      ELSE
      BEGIN
        ${this.getAlterTableStatements()}
      END
    `);

    console.log('✅ RSS feeds table initialization complete');
  }

  private getAlterTableStatements(): string {
    return `
      IF COL_LENGTH('dbo.rss_feeds','feed_description') IS NULL
        ALTER TABLE dbo.rss_feeds ADD feed_description NVARCHAR(MAX) NULL;
      IF COL_LENGTH('dbo.rss_feeds','feed_link') IS NULL
        ALTER TABLE dbo.rss_feeds ADD feed_link NVARCHAR(1000) NULL;
      IF COL_LENGTH('dbo.rss_feeds','image_url') IS NULL
        ALTER TABLE dbo.rss_feeds ADD image_url NVARCHAR(1000) NULL;
      IF COL_LENGTH('dbo.rss_feeds','thumbnail_url') IS NULL
        ALTER TABLE dbo.rss_feeds ADD thumbnail_url NVARCHAR(1000) NULL;
      IF COL_LENGTH('dbo.rss_feeds','etag') IS NULL
        ALTER TABLE dbo.rss_feeds ADD etag NVARCHAR(500) NULL;
      IF COL_LENGTH('dbo.rss_feeds','last_modified') IS NULL
        ALTER TABLE dbo.rss_feeds ADD last_modified NVARCHAR(500) NULL;
      IF COL_LENGTH('dbo.rss_feeds','last_status') IS NULL
        ALTER TABLE dbo.rss_feeds ADD last_status INT NULL;
      IF COL_LENGTH('dbo.rss_feeds','last_checked') IS NULL
        ALTER TABLE dbo.rss_feeds ADD last_checked DATETIME NULL;
      IF COL_LENGTH('dbo.rss_feeds','latest_articles') IS NULL
        ALTER TABLE dbo.rss_feeds ADD latest_articles NVARCHAR(MAX) NULL;
    `;
  }

  private async createStoredProcedures(): Promise<void> {
    const pool = getPool();

    const proceduresToDrop = [
      'sp_GetRSSFeeds',
      'sp_GetFlatArticles',
      'sp_UpdateFeedArticles',
      'sp_GetCategoriesAndCountries'
    ];

    for (const name of proceduresToDrop) {
      await pool.request().query(`
        IF OBJECT_ID('dbo.${name}', 'P') IS NOT NULL
        BEGIN
          DROP PROCEDURE dbo.${name};
        END
      `);
    }

    await pool.request().query(`
      CREATE PROCEDURE dbo.sp_GetRSSFeeds
        @limit        INT           = 100,
        @category     NVARCHAR(100) = NULL,
        @country_code NVARCHAR(10)  = NULL,
        @only_active  BIT           = 1
      AS
      BEGIN
        SET NOCOUNT ON;

        IF @limit IS NULL OR @limit <= 0 OR @limit > 10000
          SET @limit = 100;

        SELECT TOP (@limit)
          rss_feeds_id, country_code, category, feed_url, feed_title,
          feed_description, feed_link, image_url, thumbnail_url, etag, last_modified, last_status,
          last_checked, is_active, created_at, updated_at, last_fetched, fetch_count, latest_articles
        FROM dbo.rss_feeds
        WHERE (@only_active = 0 OR is_active = 1)
          AND (@category IS NULL OR category = @category)
          AND (@country_code IS NULL OR country_code = @country_code)
        ORDER BY last_checked DESC, created_at DESC;
      END
    `);

    await pool.request().query(`
      CREATE PROCEDURE dbo.sp_GetFlatArticles
        @limit        INT           = 50,
        @category     NVARCHAR(100) = NULL,
        @country_code NVARCHAR(10)  = NULL,
        @rss_feeds_id INT           = NULL
      AS
      BEGIN
        SET NOCOUNT ON;

        IF @limit IS NULL OR @limit <= 0 OR @limit > 5000
          SET @limit = 50;

        SELECT TOP (@limit)
          f.rss_feeds_id as feed_id,
          f.feed_title,
          f.feed_url,
          f.category,
          f.country_code,
          f.image_url as feed_image_url,
          f.thumbnail_url as feed_thumbnail_url,
          JSON_VALUE(articles.value, '$.title') as title,
          JSON_VALUE(articles.value, '$.description') as description,
          JSON_VALUE(articles.value, '$.summary') as summary,
          JSON_VALUE(articles.value, '$.link') as link,
          JSON_VALUE(articles.value, '$.author') as author,
          JSON_VALUE(articles.value, '$.pubDate') as pubDate,
          JSON_VALUE(articles.value, '$.guid') as guid,
          JSON_VALUE(articles.value, '$.category') as article_category,
          JSON_VALUE(articles.value, '$.tags') as tags,
          JSON_VALUE(articles.value, '$.source') as source,
          JSON_VALUE(articles.value, '$.source_url') as source_url,
          JSON_VALUE(articles.value, '$.media_thumb_url') as media_thumb_url,
          JSON_VALUE(articles.value, '$.media_url') as media_url,
          JSON_VALUE(articles.value, '$.content_encoded') as content_encoded,
          JSON_VALUE(articles.value, '$.extracted_at') as extracted_at,
          JSON_VALUE(articles.value, '$.word_count') as word_count,
          JSON_VALUE(articles.value, '$.reading_time') as reading_time,
          JSON_VALUE(articles.value, '$.has_media') as has_media,
          JSON_VALUE(articles.value, '$.has_author') as has_author,
          JSON_VALUE(articles.value, '$.content_length') as content_length,
          f.last_checked,
          f.updated_at
        FROM dbo.rss_feeds f
        CROSS APPLY OPENJSON(f.latest_articles) as articles
        WHERE f.is_active = 1
          AND (@category IS NULL OR f.category = @category)
          AND (@country_code IS NULL OR f.country_code = @country_code)
          AND (@rss_feeds_id IS NULL OR f.rss_feeds_id = @rss_feeds_id)
          AND f.latest_articles IS NOT NULL
          AND ISJSON(f.latest_articles) = 1
          AND JSON_VALUE(articles.value, '$.title') IS NOT NULL
        ORDER BY
          TRY_CAST(JSON_VALUE(articles.value, '$.extracted_at') as DATETIME) DESC,
          f.last_checked DESC;
      END
    `);

    await pool.request().query(`
      CREATE PROCEDURE dbo.sp_UpdateFeedArticles
        @rss_feeds_id INT,
        @articles     NVARCHAR(MAX),
        @feed_title   NVARCHAR(500)  = NULL,
        @feed_description NVARCHAR(MAX) = NULL,
        @feed_link    NVARCHAR(1000) = NULL,
        @image_url    NVARCHAR(1000) = NULL,
        @thumbnail_url NVARCHAR(1000) = NULL,
        @etag         NVARCHAR(500)  = NULL,
        @last_modified NVARCHAR(500) = NULL,
        @last_status  INT = 200
      AS
      BEGIN
        SET NOCOUNT ON;

        IF @rss_feeds_id IS NULL OR @rss_feeds_id <= 0
        BEGIN
          SELECT 0 as rows_affected, 'Invalid rss_feeds_id parameter' as error_message;
          RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM dbo.rss_feeds WHERE rss_feeds_id = @rss_feeds_id)
        BEGIN
          SELECT 0 as rows_affected, 'Feed not found' as error_message;
          RETURN;
        END

        IF @articles IS NOT NULL AND @articles != '' AND ISJSON(@articles) = 0
        BEGIN
          SELECT 0 as rows_affected, 'Invalid JSON format for articles parameter' as error_message;
          RETURN;
        END

        UPDATE dbo.rss_feeds
        SET
          latest_articles = @articles,
          feed_title = ISNULL(@feed_title, feed_title),
          feed_description = ISNULL(@feed_description, feed_description),
          feed_link = ISNULL(@feed_link, feed_link),
          image_url = ISNULL(@image_url, image_url),
          thumbnail_url = ISNULL(@thumbnail_url, thumbnail_url),
          etag = @etag,
          last_modified = @last_modified,
          last_status = @last_status,
          last_fetched = GETUTCDATE(),
          fetch_count = ISNULL(fetch_count,0) + 1,
          updated_at = GETUTCDATE(),
          last_checked = GETUTCDATE()
        WHERE rss_feeds_id = @rss_feeds_id;

        SELECT @@ROWCOUNT as rows_affected, NULL as error_message;
      END
    `);

    await pool.request().query(`
      CREATE PROCEDURE dbo.sp_GetCategoriesAndCountries
      AS
      BEGIN
        SET NOCOUNT ON;

        SELECT
          ISNULL(category, 'Unknown') as category,
          COUNT(*) as feed_count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_feed_count
        FROM dbo.rss_feeds
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY category;

        SELECT
          ISNULL(country_code, 'Unknown') as country_code,
          COUNT(*) as feed_count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_feed_count
        FROM dbo.rss_feeds
        WHERE country_code IS NOT NULL AND country_code != ''
        GROUP BY country_code
        ORDER BY country_code;
      END
    `);

    console.log('✅ RSS stored procedures created or refreshed');
  }

  async getFeeds(params: FeedParams = {}): Promise<any[]> {
    const pool = getPool();

    let limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : Number(params.limit ?? 0);
    if (!Number.isFinite(limit) || limit <= 0) {
      limit = 100;
    }
    if (limit > 1000) {
      limit = 1000;
    }

    const onlyActive = params.only_active !== 'false';

    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .input('category', sql.NVarChar, params.category || null)
      .input('country_code', sql.NVarChar, params.country || null)
      .input('only_active', sql.Bit, onlyActive)
      .execute('dbo.sp_GetRSSFeeds');

    return result.recordset;
  }

  async getArticles(params: ArticleParams = {}): Promise<any[]> {
    const pool = getPool();

    let limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : Number(params.limit ?? 0);
    if (!Number.isFinite(limit) || limit <= 0) {
      limit = 50;
    }
    if (limit > 500) {
      limit = 500;
    }

    if (params.flat === 'true') {
      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .input('category', sql.NVarChar, params.category || null)
        .input('country_code', sql.NVarChar, params.country || null)
        .input('rss_feeds_id', sql.Int, params.feed_id ? parseInt(String(params.feed_id), 10) : null)
        .execute('dbo.sp_GetFlatArticles');

      return result.recordset;
    }

    const feeds = await this.getFeeds({ category: params.category, country: params.country });
    const articles: any[] = [];

    for (const feed of feeds) {
      if (!feed.latest_articles) {
        continue;
      }

      try {
        const feedArticles = JSON.parse(feed.latest_articles) as ParsedArticle[];
        for (const article of feedArticles) {
          articles.push({
            ...article,
            feed_id: feed.rss_feeds_id,
            feed_title: feed.feed_title,
            feed_url: feed.feed_url,
            feed_image_url: feed.image_url,
            feed_thumbnail_url: feed.thumbnail_url,
            category: feed.category,
            country_code: feed.country_code
          });
        }
      } catch (error) {
        console.error('❌ Failed to parse stored articles JSON:', error);
      }
    }

    articles.sort((a, b) => new Date(b.pubDate || b.extracted_at).getTime() - new Date(a.pubDate || a.extracted_at).getTime());

    return articles.slice(0, limit);
  }

  async getCategoriesAndCountries(): Promise<{ categories: any[]; countries: any[] }> {
    const pool = getPool();
    const result = await pool.request().execute('dbo.sp_GetCategoriesAndCountries');

    return {
      categories: result.recordsets[0] || [],
      countries: result.recordsets[1] || []
    };
  }

  async updateFeedWithArticles(feedId: number, data: UpdateArticlesPayload): Promise<{ success: boolean; error?: string }> {
    const pool = getPool();

    if (!feedId || Number.isNaN(feedId) || feedId <= 0) {
      return { success: false, error: 'Invalid feed ID' };
    }

    let articlesJson: string | null = null;
    if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
      articlesJson = JSON.stringify(data.articles);
    }

    const result = await pool.request()
      .input('rss_feeds_id', sql.Int, feedId)
      .input('articles', sql.NVarChar(sql.MAX), articlesJson)
      .input('feed_title', sql.NVarChar, data.feedTitle || null)
      .input('feed_description', sql.NVarChar, data.feedDescription || null)
      .input('feed_link', sql.NVarChar, data.feedLink || null)
      .input('image_url', sql.NVarChar, data.feedImage || null)
      .input('thumbnail_url', sql.NVarChar, data.feedThumbnail || null)
      .input('etag', sql.NVarChar, data.etag || null)
      .input('last_modified', sql.NVarChar, data.lastModified || null)
      .input('last_status', sql.Int, data.status ?? 200)
      .execute('dbo.sp_UpdateFeedArticles');

    if (data.shouldDeactivate) {
      await pool.request()
        .input('feed_id', sql.Int, feedId)
        .query(`
          UPDATE dbo.rss_feeds
          SET is_active = 0,
              updated_at = GETUTCDATE(),
              last_checked = GETUTCDATE(),
              last_status = @last_status
          WHERE rss_feeds_id = @feed_id
        `);
    } else if (data.lastChecked) {
      await pool.request()
        .input('feed_id', sql.Int, feedId)
        .input('last_checked', sql.DateTime, data.lastChecked)
        .query(`
          UPDATE dbo.rss_feeds
          SET last_checked = @last_checked,
              updated_at = GETUTCDATE()
          WHERE rss_feeds_id = @feed_id
        `);
    }

    const updateResult = result.recordset?.[0];
    if (updateResult?.error_message) {
      return { success: false, error: updateResult.error_message };
    }

    return { success: true };
  }

  async seedSampleFeeds(): Promise<{ feeds_added: number; existing_feeds: number }> {
    const pool = getPool();

    let feedsAdded = 0;
    let existingFeeds = 0;

    for (const feed of CURATED_FEEDS) {
      try {
        const result = await pool.request()
          .input('feed_url', sql.NVarChar, feed.url)
          .query(`
            SELECT rss_feeds_id FROM dbo.rss_feeds WHERE feed_url = @feed_url;
          `);

        if (result.recordset.length > 0) {
          existingFeeds += 1;
          continue;
        }

        await pool.request()
          .input('feed_url', sql.NVarChar, feed.url)
          .input('category', sql.NVarChar, feed.category)
          .input('country_code', sql.NVarChar, feed.country_code)
          .input('feed_title', sql.NVarChar, feed.title)
          .query(`
            INSERT INTO dbo.rss_feeds (feed_url, category, country_code, feed_title)
            VALUES (@feed_url, @category, @country_code, @feed_title);
          `);

        feedsAdded += 1;
        console.log(`✅ Seeded feed ${feed.title} (${feed.url})`);
      } catch (error) {
        console.error(`❌ Failed to seed feed ${feed.url}:`, error);
      }
    }

    return { feeds_added: feedsAdded, existing_feeds: existingFeeds };
  }

  async getActiveFeedsForPolling(): Promise<any[]> {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT rss_feeds_id, feed_url, feed_title, category, etag, last_modified, last_checked, last_status
      FROM dbo.rss_feeds
      WHERE is_active = 1
      ORDER BY ISNULL(last_checked, '1900-01-01') ASC
    `);
    return result.recordset;
  }

  async getFeedCount(): Promise<number> {
    const pool = getPool();
    const result = await pool.request().query(`SELECT COUNT(*) as feed_count FROM dbo.rss_feeds`);
    return result.recordset?.[0]?.feed_count ?? 0;
  }

  async getFeedStats(): Promise<{ stats: any[]; recent: any[] }> {
    const pool = getPool();
    const stats = await pool.request().query(`
      SELECT
        category,
        COUNT(*) as total_feeds,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_feeds,
        SUM(CASE WHEN latest_articles IS NOT NULL AND latest_articles != '' THEN 1 ELSE 0 END) as feeds_with_articles
      FROM dbo.rss_feeds
      GROUP BY category
      ORDER BY category;
    `);

    const recent = await pool.request().query(`
      SELECT TOP 10
        rss_feeds_id, feed_title, category, last_checked, last_status, fetch_count
      FROM dbo.rss_feeds
      ORDER BY last_checked DESC, updated_at DESC;
    `);

    return { stats: stats.recordset, recent: recent.recordset };
  }
}
