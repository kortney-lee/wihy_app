const { getPool, sql } = require('../../config/database');

class RSSDatabase {
  constructor() {
    // Remove the targetCategories restriction - allow all categories
    this.targetCategories = null;
  }

  async initialize() {
    await this.createTables();
    await this.createStoredProcedures();
  }

  async createTables() {
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
        
        PRINT 'RSS feeds table created';
      END
      ELSE
      BEGIN
        -- Add missing columns if needed
        ${this.getAlterTableStatements()}
        PRINT 'RSS feeds table updated';
      END
    `);


    console.log('✅ RSS feeds table initialization complete');
  }

  getAlterTableStatements() {
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

  async createStoredProcedures() {
    const pool = getPool();

    try {
      // First, drop ALL existing procedures including any problematic ones
      console.log('🔧 Dropping ALL existing RSS stored procedures...');
      
      const proceduresToDrop = [
        'sp_GetRSSFeeds',
        'sp_GetFlatArticles', 
        'sp_UpdateFeedArticles',
        'sp_GetCategoriesAndCountries',
        'sp_off_parse_batch_to_text' // This problematic procedure
      ];

      for (const procName of proceduresToDrop) {
        await pool.request().query(`
          IF OBJECT_ID('dbo.${procName}', 'P') IS NOT NULL
          BEGIN
            DROP PROCEDURE dbo.${procName};
            PRINT 'Dropped ${procName}';
          END
        `);
      }

      // Now create the procedures fresh with FIXED SQL
      console.log('🔧 Creating fresh RSS stored procedures...');

      // FIXED sp_GetRSSFeeds - removed problematic dynamic SQL
      await pool.request().query(`
        CREATE PROCEDURE dbo.sp_GetRSSFeeds
          @limit        INT           = 100,
          @category     NVARCHAR(100) = NULL,
          @country_code NVARCHAR(10)  = NULL,
          @only_active  BIT           = 1
        AS
        BEGIN
          SET NOCOUNT ON;
          
          BEGIN TRY
            -- Validate and fix @limit parameter
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
          END TRY
          BEGIN CATCH
            PRINT 'Error in sp_GetRSSFeeds: ' + ERROR_MESSAGE();
            -- Return empty result set on error
            SELECT 
              CAST(NULL AS INT) as rss_feeds_id, 
              CAST(NULL AS NVARCHAR(10)) as country_code,
              CAST(NULL AS NVARCHAR(100)) as category,
              CAST(NULL AS NVARCHAR(1000)) as feed_url,
              CAST(NULL AS NVARCHAR(500)) as feed_title,
              CAST(NULL AS NVARCHAR(MAX)) as feed_description,
              CAST(NULL AS NVARCHAR(1000)) as feed_link,
              CAST(NULL AS NVARCHAR(1000)) as image_url,
              CAST(NULL AS NVARCHAR(1000)) as thumbnail_url,
              CAST(NULL AS NVARCHAR(500)) as etag,
              CAST(NULL AS NVARCHAR(500)) as last_modified,
              CAST(NULL AS INT) as last_status,
              CAST(NULL AS DATETIME) as last_checked,
              CAST(NULL AS BIT) as is_active,
              CAST(NULL AS DATETIME) as created_at,
              CAST(NULL AS DATETIME) as updated_at,
              CAST(NULL AS DATETIME) as last_fetched,
              CAST(NULL AS INT) as fetch_count,
              CAST(NULL AS NVARCHAR(MAX)) as latest_articles
            WHERE 1 = 0; -- Return empty structure
          END CATCH
        END
      `);

      // FIXED sp_GetFlatArticles - removed problematic dynamic SQL
      await pool.request().query(`
        CREATE PROCEDURE dbo.sp_GetFlatArticles
          @limit        INT           = 50,
          @category     NVARCHAR(100) = NULL,
          @country_code NVARCHAR(10)  = NULL,
          @rss_feeds_id INT           = NULL
        AS
        BEGIN
          SET NOCOUNT ON;
          
          BEGIN TRY
            -- Validate and fix @limit parameter
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
          END TRY
          BEGIN CATCH
            PRINT 'Error in sp_GetFlatArticles: ' + ERROR_MESSAGE();
            -- Return empty result set with proper structure
            SELECT 
              CAST(NULL AS INT) as feed_id,
              CAST(NULL AS NVARCHAR(500)) as feed_title,
              CAST(NULL AS NVARCHAR(1000)) as feed_url,
              CAST(NULL AS NVARCHAR(100)) as category,
              CAST(NULL AS NVARCHAR(10)) as country_code,
              CAST(NULL AS NVARCHAR(1000)) as feed_image_url,
              CAST(NULL AS NVARCHAR(1000)) as feed_thumbnail_url,
              CAST(NULL AS NVARCHAR(MAX)) as title,
              CAST(NULL AS NVARCHAR(MAX)) as description,
              CAST(NULL AS NVARCHAR(MAX)) as summary,
              CAST(NULL AS NVARCHAR(1000)) as link,
              CAST(NULL AS NVARCHAR(500)) as author,
              CAST(NULL AS NVARCHAR(500)) as pubDate,
              CAST(NULL AS NVARCHAR(500)) as guid,
              CAST(NULL AS NVARCHAR(100)) as article_category,
              CAST(NULL AS NVARCHAR(MAX)) as tags,
              CAST(NULL AS NVARCHAR(500)) as source,
              CAST(NULL AS NVARCHAR(1000)) as source_url,
              CAST(NULL AS NVARCHAR(1000)) as media_thumb_url,
              CAST(NULL AS NVARCHAR(1000)) as media_url,
              CAST(NULL AS NVARCHAR(MAX)) as content_encoded,
              CAST(NULL AS NVARCHAR(100)) as extracted_at,
              CAST(NULL AS NVARCHAR(10)) as word_count,
              CAST(NULL AS NVARCHAR(10)) as reading_time,
              CAST(NULL AS NVARCHAR(10)) as has_media,
              CAST(NULL AS NVARCHAR(10)) as has_author,
              CAST(NULL AS NVARCHAR(10)) as content_length,
              CAST(NULL AS DATETIME) as last_checked,
              CAST(NULL AS DATETIME) as updated_at
            WHERE 1 = 0;
          END CATCH
        END
      `);

      // FIXED sp_UpdateFeedArticles
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

          BEGIN TRY
            -- Validate required parameters
            IF @rss_feeds_id IS NULL OR @rss_feeds_id <= 0
            BEGIN
              SELECT 0 as rows_affected, 'Invalid rss_feeds_id parameter' as error_message;
              RETURN;
            END

            -- Check if feed exists
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
          END TRY
          BEGIN CATCH
            SELECT 0 as rows_affected, ERROR_MESSAGE() as error_message;
          END CATCH
        END
      `);

      // FIXED sp_GetCategoriesAndCountries
      await pool.request().query(`
        CREATE PROCEDURE dbo.sp_GetCategoriesAndCountries
        AS
        BEGIN
          SET NOCOUNT ON;
          
          BEGIN TRY
            -- Get all available categories with counts
            SELECT 
              ISNULL(category, 'Unknown') as category,
              COUNT(*) as feed_count,
              SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_feed_count
            FROM dbo.rss_feeds
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY category;
            
            -- Get all available countries with counts
            SELECT 
              ISNULL(country_code, 'Unknown') as country_code,
              COUNT(*) as feed_count,
              SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_feed_count
            FROM dbo.rss_feeds
            WHERE country_code IS NOT NULL AND country_code != ''
            GROUP BY country_code
            ORDER BY country_code;
          END TRY
          BEGIN CATCH
            PRINT 'Error in sp_GetCategoriesAndCountries: ' + ERROR_MESSAGE();
            -- Return empty results
            SELECT 'Error' as category, 0 as feed_count, 0 as active_feed_count WHERE 1 = 0;
            SELECT 'Error' as country_code, 0 as feed_count, 0 as active_feed_count WHERE 1 = 0;
          END CATCH
        END
      `);

      console.log('✅ All RSS stored procedures created successfully with fixed SQL');

    } catch (error) {
      console.error('❌ Error creating stored procedures:', error);
      throw error;
    }
  }

  async getFeeds(params = {}) {
    const pool = getPool();
    
    // FIXED: Better parameter validation
    let limit = parseInt(params.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      limit = 100;
    }
    if (limit > 1000) {
      limit = 1000;
    }
    
    const onlyActive = params.only_active !== 'false';
    
    console.log(`🔍 Getting feeds with limit: ${limit}, category: ${params.category || 'ALL'}, country: ${params.country || 'ALL'}`);
    
    try {
      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .input('category', sql.NVarChar, params.category || null)
        .input('country_code', sql.NVarChar, params.country || null)
        .input('only_active', sql.Bit, onlyActive)
        .execute('dbo.sp_GetRSSFeeds');

      console.log(`✅ Retrieved ${result.recordset.length} feeds`);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error in getFeeds:', error);
      return []; // Return empty array on error
    }
  }

  async getArticles(params = {}) {
    const pool = getPool();
    
    // FIXED: Ensure limit is always a valid positive integer
    let limit = parseInt(params.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      limit = 50;
    }
    if (limit > 500) {
      limit = 500;
    }
    
    const useFlat = params.flat === 'true';

    console.log(`🔍 Getting articles with limit: ${limit}, useFlat: ${useFlat}, category: ${params.category || 'ALL'}`);

    if (useFlat) {
      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .input('category', sql.NVarChar, params.category || null)
        .input('country_code', sql.NVarChar, params.country || null)
        .input('rss_feeds_id', sql.Int, params.feed_id ? parseInt(params.feed_id, 10) : null)
        .execute('dbo.sp_GetFlatArticles');

      return result.recordset;
    } else {
      // Get feeds and parse JSON articles
      const feeds = await this.getFeeds({ category: params.category, country: params.country });
      const allArticles = [];

      feeds.forEach(feed => {
        if (feed.latest_articles) {
          try {
            const articles = JSON.parse(feed.latest_articles);
            articles.forEach(article => {
              allArticles.push({
                ...article,
                feed_id: feed.rss_feeds_id,
                feed_title: feed.feed_title,
                feed_image_url: feed.image_url,
                feed_thumbnail_url: feed.thumbnail_url,
                category: feed.category,
                country_code: feed.country_code
              });
            });
          } catch (parseError) {
            console.error('Error parsing articles JSON:', parseError);
          }
        }
      });

      allArticles.sort((a, b) => new Date(b.pubDate || b.extracted_at) - new Date(a.pubDate || a.extracted_at));
      return allArticles.slice(0, limit);
    }
  }

  async getCategoriesAndCountries() {
    const pool = getPool();
    const result = await pool.request().execute('dbo.sp_GetCategoriesAndCountries');
    
    return {
      categories: result.recordsets[0] || [],
      countries: result.recordsets[1] || []
    };
  }

  async updateFeedWithArticles(feedId, data) {
    const pool = getPool();
    
    // Validate feed ID
    if (!feedId || isNaN(feedId) || feedId <= 0) {
      console.error(`❌ Invalid feedId: ${feedId}`);
      return { success: false, error: 'Invalid feed ID' };
    }
    
    console.log(`🔄 Updating feed ${feedId} with ${data.articles?.length || 0} articles`);
    
    try {
      // Ensure articles is valid JSON
      let articlesJson = null;
      if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        articlesJson = JSON.stringify(data.articles);
        console.log(`📝 Prepared JSON with ${data.articles.length} articles (${articlesJson.length} characters)`);
      }
      
      // FIXED: Add thumbnail_url parameter and better image handling
      console.log(`🔄 Updating feed ${feedId} with image data:`, {
        feedImage: data.feedImage,
        feedThumbnail: data.feedThumbnail,
        articlesCount: data.articles?.length || 0
      });
      
      const result = await pool.request()
        .input('rss_feeds_id', sql.Int, parseInt(feedId, 10))
        .input('articles', sql.NVarChar(sql.MAX), articlesJson)
        .input('feed_title', sql.NVarChar, data.feedTitle || null)
        .input('feed_description', sql.NVarChar, data.feedDescription || null)
        .input('feed_link', sql.NVarChar, data.feedLink || null)
        .input('image_url', sql.NVarChar, data.feedImage || null)              // CRITICAL
        .input('thumbnail_url', sql.NVarChar, data.feedThumbnail || null)      // CRITICAL
        .input('etag', sql.NVarChar, data.etag || null)
        .input('last_modified', sql.NVarChar, data.lastModified || null)
        .input('last_status', sql.Int, data.status || 200)
        .execute('dbo.sp_UpdateFeedArticles');

      console.log(`📸 Image update result:`, {
        feedId: feedId,
        imageUrl: data.feedImage,
        thumbnailUrl: data.feedThumbnail,
        rowsAffected: result.recordset[0]?.rows_affected
      });

      const updateResult = result.recordset[0];
      if (updateResult && updateResult.rows_affected > 0) {
        console.log(`✅ Successfully updated feed ${feedId} - ${updateResult.rows_affected} rows affected`);
        console.log(`📸 Image URLs saved: main=${data.feedImage ? 'YES' : 'NO'}, thumbnail=${data.feedThumbnail ? 'YES' : 'NO'}`);
        return { success: true, rowsAffected: updateResult.rows_affected };
      } else {
        console.error(`❌ Feed ${feedId} update failed:`, updateResult?.error_message);
        return { success: false, error: updateResult?.error_message || 'No rows affected' };
      }
    } catch (error) {
      console.error(`❌ Database error updating feed ${feedId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async getFeedCount() {
    const pool = getPool();
    const result = await pool.request()
      .query(`SELECT COUNT(*) as feed_count FROM dbo.rss_feeds`);
    return result.recordset[0].feed_count;
  }

  async getFeedStats() {
    const pool = getPool();
    
    // FIXED: Simplified stats query without nested aggregates
    const stats = await pool.request().query(`
      SELECT 
        ISNULL(category, 'Unknown') as category,
        COUNT(*) as total_feeds,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_feeds,
        SUM(CASE WHEN latest_articles IS NOT NULL AND ISJSON(latest_articles) = 1 THEN 1 ELSE 0 END) as feeds_with_articles,
        MAX(last_checked) as last_checked
      FROM dbo.rss_feeds
      GROUP BY category
      ORDER BY category
    `);

    const recent = await pool.request().query(`
      SELECT TOP 10
        rss_feeds_id, feed_title, category, is_active, last_checked, last_status
      FROM dbo.rss_feeds
      ORDER BY created_at DESC
    `);

    return {
      stats: stats.recordset,
      recent: recent.recordset
    };
  }

  async seedSampleFeeds() {
    const sampleFeeds = [
      // Health feeds
      { feed_url: 'https://www.nibib.nih.gov/rss', category: 'health', country_code: 'US' },
      { feed_url: 'https://www.nih.gov/news-events/news-releases/rss.xml', category: 'health', country_code: 'US' },
      { feed_url: 'https://feeds.npr.org/1002/rss.xml', category: 'health', country_code: 'US' },
      
      // Science feeds  
      { feed_url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science', country_code: 'US' },
      { feed_url: 'https://feeds.newscientist.com/science-news', category: 'science', country_code: 'US' },
      
      // Tech feeds
      { feed_url: 'https://feeds.feedburner.com/TechCrunch', category: 'tech', country_code: 'US' },
      { feed_url: 'https://www.wired.com/feed/rss', category: 'tech', country_code: 'US' },
      
      // Political feeds
      { feed_url: 'https://feeds.npr.org/1001/rss.xml', category: 'political', country_code: 'US' },
      { feed_url: 'https://www.politico.com/rss/politico.xml', category: 'political', country_code: 'US' },
      
      // Additional diverse feeds
      { feed_url: 'https://www.espn.com/espn/rss/news', category: 'sports', country_code: 'US' },
      { feed_url: 'https://www.rollingstone.com/music/rss', category: 'entertainment', country_code: 'US' },
      { feed_url: 'https://www.wsj.com/xml/rss/3_7085.xml', category: 'business', country_code: 'US' },
      { feed_url: 'https://www.nationalgeographic.com/news/rss.xml', category: 'nature', country_code: 'US' }
    ];

    const pool = getPool();
    let feedsAdded = 0;

    for (const feed of sampleFeeds) {
      try {
        const result = await pool.request()
          .input('feed_url', sql.NVarChar, feed.feed_url)
          .input('category', sql.NVarChar, feed.category)
          .input('country_code', sql.NVarChar, feed.country_code)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.rss_feeds WHERE feed_url = @feed_url)
            BEGIN
              INSERT INTO dbo.rss_feeds (feed_url, category, country_code)
              VALUES (@feed_url, @category, @country_code);
              SELECT 1 as added;
            END
            ELSE
            BEGIN
              SELECT 0 as added;
            END
          `);

        if (result.recordset[0]?.added) {
          feedsAdded++;
          console.log(`✅ Seeded feed: ${feed.feed_url} (${feed.category})`);
        }
      } catch (error) {
        console.error(`❌ Error seeding feed ${feed.feed_url}:`, error.message);
      }
    }

    return { feeds_added: feedsAdded, articles_added: 0 };
  }

  async getActiveFeedsForPolling() {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT rss_feeds_id, feed_url, feed_title, category, etag, last_modified, last_checked, last_status
      FROM dbo.rss_feeds 
      WHERE is_active = 1
      ORDER BY ISNULL(last_checked, '1900-01-01') ASC
    `);
    return result.recordset;
  }

  async checkFeedStatus(feedId = null) {
    const pool = getPool();
    
    let query = `
      SELECT 
        rss_feeds_id, feed_title, feed_url, category, is_active, 
        last_status, last_checked, last_fetched, fetch_count,
        CASE 
          WHEN latest_articles IS NULL THEN 'No articles stored'
          WHEN latest_articles = '' THEN 'Empty articles field'
          WHEN ISJSON(latest_articles) = 0 THEN 'Invalid JSON in articles'
          ELSE CAST((SELECT COUNT(*) FROM OPENJSON(latest_articles)) AS NVARCHAR(10)) + ' articles stored'
        END as article_status,
        LEN(latest_articles) as json_size_bytes,
        created_at, updated_at
      FROM dbo.rss_feeds
    `;
    
    const request = pool.request();
    
    if (feedId) {
      query += ` WHERE rss_feeds_id = @feed_id`;
      request.input('feed_id', sql.Int, feedId);
    } else {
      query += ` ORDER BY last_checked DESC, created_at DESC`;
    }
    
    const result = await request.query(query);
    return result.recordset;
  }

  async forceRefreshFeed(feedId) {
    const pool = getPool();
    
    // Reset the feed's last_checked to force immediate polling
    await pool.request()
      .input('feed_id', sql.Int, feedId)
      .query(`
        UPDATE dbo.rss_feeds 
        SET 
          last_checked = '1900-01-01',
          last_status = NULL,
          updated_at = GETUTCDATE()
        WHERE rss_feeds_id = @feed_id
      `);
      
    console.log(`🔄 Feed ${feedId} marked for immediate refresh`);
  }
}

module.exports = RSSDatabase;