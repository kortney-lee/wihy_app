class ApiDocsController {
  constructor() {
    this.apiSpec = {
      openapi: "3.0.0",
      info: {
        title: "vHealth RSS News API",
        version: "1.0.0",
        description: "Complete RSS feed aggregation and article management API for the vHealth platform. Includes content management, debugging tools, and administrative endpoints.",
        contact: {
          name: "vHealth Development Team",
          email: "dev@vhealth.com"
        },
        license: {
          name: "MIT"
        }
      },
      servers: [
        {
          url: "http://localhost:5000/api/news", // Keep this as the API base URL
          description: "Development server"
        }
      ],
      tags: [
        {
          name: "Articles",
          description: "RSS article retrieval and management"
        },
        {
          name: "Feeds",
          description: "RSS feed configuration and management"
        },
        {
          name: "Feed Management",
          description: "Operations for fetching and seeding feed data"
        },
        {
          name: "Metadata",
          description: "Categories, countries, and classification data"
        },
        {
          name: "Debug",
          description: "Debugging and diagnostic endpoints"
        },
        {
          name: "Testing",
          description: "Testing and analysis tools"
        }
      ],
      paths: {
        "/": {
          get: {
            tags: ["Debug"],
            summary: "API Root Health Check",
            description: "Basic health check to verify the RSS API is running",
            responses: {
              "200": {
                description: "API is healthy",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "RSS API is running" },
                        timestamp: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/articles": {
          get: {
            tags: ["Articles"],
            summary: "Get RSS Articles",
            description: "Retrieve aggregated articles from RSS feeds with comprehensive filtering and pagination options",
            parameters: [
              {
                name: "limit",
                in: "query",
                description: "Number of articles to return",
                required: false,
                schema: {
                  type: "integer",
                  default: 50,
                  minimum: 1,
                  maximum: 500
                },
                example: 10
              },
              {
                name: "category",
                in: "query",
                description: "Filter by article category",
                required: false,
                schema: {
                  type: "string",
                  enum: ["tech", "business", "science", "health", "sports", "entertainment", "politics", "world"]
                },
                example: "tech"
              },
              {
                name: "country",
                in: "query",
                description: "Filter by country code",
                required: false,
                schema: {
                  type: "string",
                  enum: ["US", "IN", "UK", "CA", "AU", "DE", "FR", "JP"]
                },
                example: "US"
              },
              {
                name: "feed_id",
                in: "query",
                description: "Filter by specific feed ID",
                required: false,
                schema: {
                  type: "integer"
                },
                example: 1
              },
              {
                name: "feed_priority",
                in: "query", 
                description: "Filter by feed priority (1-10 = top priority, 0 = extra feeds)",
                required: false,
                schema: {
                  type: "integer",
                  minimum: 0,
                  maximum: 10
                },
                example: 8
              },
              {
                name: "flat",
                in: "query",
                description: "Return flat article structure (true) or nested by feed (false)",
                required: false,
                schema: {
                  type: "string",
                  enum: ["true", "false"],
                  default: "true"
                },
                example: "true"
              }
            ],
            responses: {
              "200": {
                description: "Articles retrieved successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        articles: {
                          type: "array",
                          items: { "$ref": "#/components/schemas/Article" }
                        },
                        count: { type: "integer", example: 50 },
                        filters_applied: {
                          type: "object",
                          properties: {
                            category: { type: "string" },
                            country: { type: "string" },
                            feed_id: { type: "integer" },
                            limit: { type: "integer" }
                          }
                        }
                      }
                    }
                  }
                }
              },
              "500": {
                description: "Server error",
                content: {
                  "application/json": {
                    schema: { "$ref": "#/components/schemas/Error" }
                  }
                }
              }
            }
          }
        },
        "/feeds": {
          get: {
            tags: ["Feeds"],
            summary: "Get RSS Feeds",
            description: "Retrieve list of configured RSS feeds with metadata and status information",
            parameters: [
              {
                name: "limit",
                in: "query",
                description: "Number of feeds to return",
                required: false,
                schema: { type: "integer", default: 100 },
                example: 20
              },
              {
                name: "category",
                in: "query",
                description: "Filter feeds by category",
                required: false,
                schema: { type: "string" },
                example: "tech"
              },
              {
                name: "country_code",
                in: "query",
                description: "Filter feeds by country code",
                required: false,
                schema: { type: "string" },
                example: "US"
              },
              {
                name: "only_active",
                in: "query",
                description: "Only return active feeds",
                required: false,
                schema: { type: "string", enum: ["true", "false"], default: "true" },
                example: "true"
              }
            ],
            responses: {
              "200": {
                description: "Feeds retrieved successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        feeds: {
                          type: "array",
                          items: { "$ref": "#/components/schemas/Feed" }
                        },
                        count: { type: "integer", example: 15 }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/fetch": {
          post: {
            tags: ["Feed Management"],
            summary: "Trigger RSS Polling",
            description: "Manually trigger RSS feed polling to fetch latest articles from configured feeds",
            parameters: [
              {
                name: "force",
                in: "query",
                description: "Force refresh even if recently checked",
                required: false,
                schema: { type: "string", enum: ["true", "false"], default: "false" },
                example: "false"
              },
              {
                name: "feed_id",
                in: "query",
                description: "Poll specific feed only (optional)",
                required: false,
                schema: { type: "integer" },
                example: 1
              },
              {
                name: "feed_priority",
                in: "query",
                description: "Poll feeds by priority level (1-10 = top priority, 0 = extra)",
                required: false,
                schema: { 
                  type: "integer",
                  minimum: 0,
                  maximum: 10
                },
                example: 8
              }
            ],
            responses: {
              "200": {
                description: "Polling completed successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "RSS polling completed" },
                        results: {
                          type: "object",
                          properties: {
                            total: { type: "integer", example: 5, description: "Total feeds processed" },
                            successful: { type: "integer", example: 4, description: "Successfully fetched feeds" },
                            failed: { type: "integer", example: 1, description: "Failed feeds" },
                            articles_fetched: { type: "integer", example: 87, description: "Total new articles" },
                            duration: { type: "string", example: "45.2s", description: "Processing time" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/seed": {
          post: {
            tags: ["Feed Management"],
            summary: "Seed Sample Feeds",
            description: "Add sample RSS feeds to the database for testing and initial setup",
            responses: {
              "200": {
                description: "Sample feeds added successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "Sample RSS feeds seeded successfully" },
                        feeds_added: { type: "integer", example: 15 },
                        categories: { 
                          type: "array", 
                          items: { type: "string" },
                          example: ["tech", "business", "science", "health"]
                        },
                        countries: { 
                          type: "array", 
                          items: { type: "string" },
                          example: ["US", "IN", "UK", "CA"]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/categories": {
          get: {
            tags: ["Metadata"],
            summary: "Get Categories and Countries",
            description: "Retrieve available categories and countries with feed counts and statistics",
            responses: {
              "200": {
                description: "Categories and countries retrieved",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        categories: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              category: { type: "string", example: "tech" },
                              feed_count: { type: "integer", example: 8 },
                              active_feed_count: { type: "integer", example: 7 }
                            }
                          }
                        },
                        countries: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              country_code: { type: "string", example: "US" },
                              feed_count: { type: "integer", example: 10 },
                              active_feed_count: { type: "integer", example: 9 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/health": {
          get: {
            tags: ["Debug"],
            summary: "RSS System Health Check",
            description: "Comprehensive health check with component status and system information",
            responses: {
              "200": {
                description: "Health check completed",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "RSS routes loaded successfully" },
                        timestamp: { type: "string", format: "date-time" },
                        rss_controller_available: { type: "boolean", example: true },
                        working_directory: { type: "string", example: "c:\\vHealth\\vhealth\\services" },
                        environment: { type: "string", example: "development" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/database": {
          get: {
            tags: ["Debug"],
            summary: "Database Connection Status",
            description: "Check database connection and verify table/procedure status",
            responses: {
              "200": {
                description: "Database status retrieved",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        database_connection: { type: "string", example: "OK" },
                        current_time: { type: "string", format: "date-time" },
                        tables_found: { 
                          type: "array", 
                          items: { type: "string" },
                          example: ["rss_feeds"]
                        },
                        procedures_found: { 
                          type: "array", 
                          items: { type: "string" },
                          example: ["sp_GetRSSFeeds", "sp_GetFlatArticles"]
                        },
                        suggestion: { type: "string", example: "Database looks good" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/check-table": {
          get: {
            tags: ["Debug"],
            summary: "RSS Table Structure Verification",
            description: "Verify RSS feeds table exists and check its structure and data summary",
            responses: {
              "200": {
                description: "Table structure verified",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        table_exists: { type: "boolean", example: true },
                        column_count: { type: "integer", example: 18 },
                        key_columns_present: {
                          type: "object",
                          properties: {
                            rss_feeds_id: { type: "boolean", example: true },
                            feed_url: { type: "boolean", example: true },
                            latest_articles: { type: "boolean", example: true },
                            image_url: { type: "boolean", example: true }
                          }
                        },
                        data_summary: {
                          type: "object",
                          properties: {
                            total_feeds: { type: "integer", example: 15 },
                            active_feeds: { type: "integer", example: 14 },
                            feeds_with_articles: { type: "integer", example: 12 },
                            last_checked: { type: "string", format: "date-time" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/force-init-database": {
          post: {
            tags: ["Debug"],
            summary: "Force Database Initialization",
            description: "Force initialization of database tables and stored procedures (admin only)",
            responses: {
              "200": {
                description: "Database initialized successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "Database initialization completed" },
                        tables_created: { 
                          type: "array", 
                          items: { type: "string" },
                          example: ["rss_feeds"]
                        },
                        procedures_created: { 
                          type: "array", 
                          items: { type: "string" },
                          example: ["sp_GetRSSFeeds", "sp_GetFlatArticles", "sp_UpdateFeedArticles"]
                        },
                        next_steps: {
                          type: "array",
                          items: { type: "string" },
                          example: [
                            "POST /api/news/seed - Add sample feeds",
                            "POST /api/news/fetch - Fetch articles"
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/test-json-structure": {
          get: {
            tags: ["Testing"],
            summary: "JSON Structure Analysis",
            description: "Analyze the JSON structure of stored articles and image data for debugging",
            responses: {
              "200": {
                description: "JSON structure analyzed",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        summary: {
                          type: "object",
                          properties: {
                            total_feeds_with_articles: { type: "integer", example: 5 },
                            total_articles: { type: "integer", example: 100 },
                            total_articles_with_images: { type: "integer", example: 45 },
                            feeds_with_feed_images: { type: "integer", example: 3 }
                          }
                        },
                        feed_analysis: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              feed_id: { type: "integer" },
                              feed_title: { type: "string" },
                              article_analysis: {
                                type: "object",
                                properties: {
                                  total_articles: { type: "integer" },
                                  articles_with_images: { type: "integer" }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/test-controller": {
          get: {
            tags: ["Testing"],
            summary: "RSS Controller Test",
            description: "Test RSS controller initialization and component loading",
            responses: {
              "200": {
                description: "Controller test completed",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        results: {
                          type: "object",
                          properties: {
                            step1_database: { type: "boolean" },
                            step2_rss_database_class: { type: "boolean" },
                            step3_rss_parser_class: { type: "boolean" },
                            step4_rss_controller_class: { type: "boolean" },
                            step5_controller_creation: { type: "boolean" },
                            step6_controller_initialization: { type: "boolean" },
                            errors: { type: "array", items: { type: "string" } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/test-images/{feedId}": {
          get: {
            tags: ["Testing"],
            summary: "Test Image Extraction",
            description: "Test image extraction for a specific RSS feed",
            parameters: [
              {
                name: "feedId",
                in: "path",
                required: true,
                description: "Feed ID to test image extraction",
                schema: { type: "integer" },
                example: 1
              }
            ],
            responses: {
              "200": {
                description: "Image extraction test completed",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        feed_id: { type: "integer", example: 276 },
                        feed_url: { type: "string", example: "https://www.technologyreview.com/feed/" },
                        image_analysis: {
                          type: "object",
                          properties: {
                            feed_info: {
                              type: "object",
                              properties: {
                                feedTitle: { type: "string" },
                                feedImage: { type: "string" },
                                has_feed_images: { type: "boolean" }
                              }
                            },
                            summary: {
                              type: "object",
                              properties: {
                                total_articles: { type: "integer" },
                                articles_with_images: { type: "integer" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/test-single-feed/{feedId}": {
          get: {
            tags: ["Testing"],
            summary: "Test Single Feed Parsing",
            description: "Test parsing a single RSS feed with detailed logging and analysis",
            parameters: [
              {
                name: "feedId",
                in: "path",
                required: true,
                description: "Feed ID to test parsing",
                schema: { type: "integer" },
                example: 1
              }
            ],
            responses: {
              "200": {
                description: "Feed parsing test completed",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        feed_info: {
                          type: "object",
                          properties: {
                            feed_id: { type: "integer" },
                            feed_url: { type: "string" },
                            parsed_title: { type: "string" }
                          }
                        },
                        parse_results: {
                          type: "object",
                          properties: {
                            total_articles: { type: "integer" },
                            articles_with_images: { type: "integer" },
                            feed_image: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/debug/livemint-raw": {
          get: {
            tags: ["Testing"],
            summary: "LiveMint Feed Analysis",
            description: "Analyze the structure of LiveMint RSS feed for debugging",
            responses: {
              "200": {
                description: "Feed analysis completed",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        feed_url: { type: "string", example: "https://www.livemint.com/rss/science" },
                        analysis: {
                          type: "object",
                          properties: {
                            feed_title: { type: "string" },
                            total_items: { type: "integer" },
                            feed_format: { type: "string" },
                            sample_item: {
                              type: "object",
                              properties: {
                                title: { type: "string" },
                                link: { type: "string" },
                                available_fields: { type: "array", items: { type: "string" } }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Article: {
            type: "object",
            description: "RSS Article with enhanced metadata",
            properties: {
              id: { type: "string", description: "Unique article identifier" },
              title: { type: "string", example: "AI toys are all the rage in China—and now they're coming for the rest of the world" },
              description: { type: "string", example: "Companies are racing to bring AI-powered toys to market..." },
              link: { type: "string", format: "uri", example: "https://www.technologyreview.com/2025/10/07/ai-toys/" },
              author: { type: "string", example: "Jane Smith" },
              published_date: { type: "string", format: "date-time", example: "2025-10-07T17:00:00.000Z" },
              thumbnail: { type: "string", format: "uri", example: "https://example.com/thumbnail.jpg" },
              image_url: { type: "string", format: "uri", example: "https://example.com/main-image.jpg" },
              has_image: { type: "boolean", example: true, description: "Whether article has associated images" },
              has_author: { type: "boolean", example: true, description: "Whether article has author information" },
              category: { type: "string", example: "tech", description: "Article category/topic" },
              source: { type: "string", example: "MIT Technology Review", description: "Source publication name" },
              feed_id: { type: "integer", example: 1, description: "ID of the RSS feed" },
              feed_priority: { type: "integer", example: 8, description: "Feed priority level (1-10 top priority, 0 extra)" },
              reading_time: { type: "integer", example: 4, description: "Estimated reading time in minutes" },
              word_count: { type: "integer", example: 850, description: "Article word count" },
              time_ago: { type: "string", example: "2 hours ago", description: "Human-readable time since publication" },
              is_recent: { type: "boolean", example: true, description: "Published within last 24 hours" },
              content_quality: { type: "string", enum: ["high", "medium", "low"], example: "high", description: "Assessed content quality" },
              completeness: { type: "string", enum: ["complete", "partial", "minimal"], example: "complete", description: "Data completeness assessment" },
              domain: { type: "string", example: "technologyreview.com", description: "Source domain" },
              extracted_at: { type: "string", format: "date-time", description: "When article was extracted" }
            },
            required: ["id", "title", "link", "feed_id"]
          },
          Feed: {
            type: "object",
            description: "RSS Feed configuration and metadata",
            properties: {
              rss_feeds_id: { type: "integer", example: 1, description: "Unique feed identifier" },
              feed_title: { type: "string", example: "MIT Technology Review", description: "Human-readable feed name" },
              feed_url: { type: "string", format: "uri", example: "https://www.technologyreview.com/feed/", description: "RSS feed URL" },
              feed_description: { type: "string", example: "The latest technology news and analysis", description: "Feed description" },
              category: { type: "string", example: "tech", description: "Feed category classification" },
              country_code: { type: "string", example: "US", description: "Associated country code" },
              feed_priority: { type: "integer", example: 8, description: "Feed priority level (1-10 = top priority, 0 = extra feeds)" },
              image_url: { type: "string", format: "uri", example: "https://example.com/feed-logo.png", description: "Feed logo/image URL" },
              thumbnail_url: { type: "string", format: "uri", example: "https://example.com/feed-thumb.png", description: "Feed thumbnail URL" },
              is_active: { type: "boolean", example: true, description: "Whether feed is currently active" },
              last_checked: { type: "string", format: "date-time", description: "Last time feed was polled" },
              fetch_count: { type: "integer", example: 25, description: "Number of times feed has been fetched" },
              article_count: { type: "integer", example: 20, description: "Number of articles currently stored" },
              last_status: { type: "integer", example: 200, description: "Last HTTP status code from feed" },
              status: { type: "string", enum: ["healthy", "warning", "error", "unknown"], example: "healthy", description: "Overall feed health status" },
              created_at: { type: "string", format: "date-time", description: "When feed was added" },
              updated_at: { type: "string", format: "date-time", description: "Last modification time" }
            },
            required: ["rss_feeds_id", "feed_url", "feed_priority"]
          },
          Error: {
            type: "object",
            description: "Standard error response",
            properties: {
              success: { type: "boolean", example: false, description: "Indicates operation failure" },
              message: { type: "string", example: "An error occurred", description: "Human-readable error message" },
              error: { type: "string", example: "Detailed error information", description: "Technical error details" },
              timestamp: { type: "string", format: "date-time", description: "When error occurred" },
              endpoint: { type: "string", example: "/api/news/articles", description: "Endpoint where error occurred" }
            },
            required: ["success", "message"]
          }
        }
      }
    };
  }

  generateSwaggerUI() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>vHealth RSS API - Interactive Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@4.15.5/favicon-32x32.png" sizes="32x32" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #2c3e50;
            border-bottom: 1px solid #34495e;
        }
        .swagger-ui .topbar .download-url-wrapper {
            display: none;
        }
        .swagger-ui .topbar .link {
            color: #fff;
            font-family: sans-serif;
            font-weight: bold;
        }
        .swagger-ui .info {
            margin: 50px 0;
        }
        .swagger-ui .info .title {
            color: #2c3e50;
            font-size: 36px;
        }
        .swagger-ui .info .description {
            color: #666;
            margin: 20px 0;
        }
        .swagger-ui .scheme-container {
            background: #fff;
            box-shadow: 0 1px 2px 0 rgba(0,0,0,.15);
            padding: 20px;
            margin: 20px 0;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary {
            border-color: #61affe;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary {
            border-color: #49cc90;
        }
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 0;
        }
        .custom-header h1 {
            margin: 0;
            font-size: 28px;
        }
        .custom-header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .quick-links {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .quick-links h4 {
            margin: 0 0 10px 0;
            color: #495057;
        }
        .quick-links a {
            display: inline-block;
            margin: 3px 6px;
            padding: 6px 12px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 12px;
        }
        .quick-links a:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>📰 vHealth RSS News API</h1>
        <p>Complete RSS feed aggregation and article management API</p>
    </div>
    
    <div id="swagger-ui"></div>
    
    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        <div class="quick-links">
            <h4>🚀 Quick Test Links</h4>
            <a href="/api/news/debug/health" target="_blank">Health Check</a>
            <a href="/api/news/debug/database" target="_blank">Database Status</a>
            <a href="/api/news/articles?limit=5" target="_blank">Sample Articles</a>
            <a href="/api/news/feeds" target="_blank">RSS Feeds</a>
            <a href="/api/news/categories" target="_blank">Categories</a>
            <a href="/api/news/debug/test-json-structure" target="_blank">JSON Structure</a>
        </div>
        
        <div class="quick-links">
            <h4>📚 Documentation Formats</h4>
            <a href="/api/service/docs/openapi.json" target="_blank">OpenAPI JSON</a>
            <a href="/api/service/docs/endpoints" target="_blank">Endpoint List</a>
            <a href="/api/service/docs/redoc" target="_blank">ReDoc Format</a>
        </div>
    </div>
    
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/service/docs/openapi.json', // Changed from /api/news/docs/openapi.json
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {
                    console.log("📚 vHealth RSS API Documentation loaded successfully");
                },
                requestInterceptor: function(request) {
                    console.log('🔍 API Request:', request.method, request.url);
                    return request;
                },
                responseInterceptor: function(response) {
                    if (response.status === 200) {
                        console.log('✅ API Response:', response.url, response.status);
                    } else {
                        console.log('⚠️ API Response:', response.url, response.status);
                    }
                    return response;
                }
            });
        };
    </script>
</body>
</html>
    `;
  }

  getOpenAPISpec() {
    return this.apiSpec;
  }
}

module.exports = ApiDocsController;