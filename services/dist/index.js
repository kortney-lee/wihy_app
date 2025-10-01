"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
const database_1 = require("./config/database");
// Load environment
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const PORT = process.env.PORT || 5000;
// Initialize database when the application starts
async function initialize() {
    try {
        console.log('Starting VHealth Services...');
        console.log('Environment check:');
        console.log(`- DB_SERVER: ${process.env.DB_SERVER}`);
        console.log(`- DB_NAME: ${process.env.DB_NAME}`);
        console.log(`- DB_USER: ${process.env.DB_USER}`);
        console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? 'SET' : 'NOT SET'}`);
        // Initialize database first (but don't fail if it doesn't work)
        console.log('🔌 Connecting to database...');
        let pool = null;
        try {
            pool = await (0, database_1.initializeDatabase)();
            if (pool) {
                console.log('✅ Database connection established and tables created');
            }
        }
        catch (dbError) {
            console.log('⚠️  Database connection failed:', dbError.message);
            console.log('   Continuing without database (using fallback data)...');
            pool = null;
        }
        // Mount nutrition routes
        console.log('📊 About to mount nutrition routes at /api');
        app.use('/api', nutritionRoutes_1.default);
        console.log('✅ Nutrition routes mounted successfully');
        // Create RSS routes
        console.log('📰 Creating RSS routes...');
        let rssController = null;
        try {
            rssController = require('./controllers/rssController');
            console.log('✅ RSS Controller loaded successfully');
        }
        catch (error) {
            console.log('⚠️  RSS Controller not available:', error.message);
            rssController = null;
        }
        if (rssController) {
            // GET - Retrieve articles from database
            app.get('/api/news/feeds', (req, res) => {
                console.log('📰 GET /api/news/feeds called');
                rssController.getFeedsForClient(req, res);
            });
            
            // GET - Retrieve articles from database
            app.get('/api/news/articles', (req, res) => {
                console.log('📰 GET /api/news/articles called');
                rssController.getArticles(req, res);
            });
            
            // ADD THIS NEW ROUTE - GET for fetching fresh RSS data
            app.get('/api/news/fetch', (req, res) => {
                console.log('📰 GET /api/news/fetch called - fetching fresh RSS data');
                rssController.fetchAllFeeds(req, res);
            });
            
            // POST - Fetch fresh data from RSS feeds and update database
            app.post('/api/news/fetch', (req, res) => {
                console.log('📰 POST /api/news/fetch called - fetching fresh RSS data');
                rssController.fetchAllFeeds(req, res);
            });
            
            // POST - Manual article ingestion
            app.post('/api/news/articles/ingest', (req, res) => {
                console.log('📰 POST /api/news/articles/ingest called');
                rssController.ingestArticles(req, res);
            });
            
            // POST - Seed initial data (setup only)
            app.post('/api/news/seed', (req, res) => {
                console.log('📰 POST /api/news/seed called');
                rssController.seedSampleFeeds(req, res);
            });
            
            // Legacy endpoint
            app.get('/api/news/rss', (req, res) => {
                console.log('📰 GET /api/news/rss called (legacy)');
                rssController.getArticles(req, res);
            });
            
            console.log('✅ RSS routes created successfully');
        }
        else {
            console.log('📰 Creating fallback RSS routes...');
            // Fallback RSS routes with sample data
            app.get('/api/news/feeds', (req, res) => {
                res.json({
                    success: true,
                    feeds: [],
                    message: 'RSS controller not available'
                });
            });
            app.get('/api/news/articles', (req, res) => {
                const sampleArticles = [
                    {
                        id: 1,
                        title: "Mediterranean Diet Study Shows Heart Benefits",
                        description: "Recent research demonstrates significant cardiovascular improvements with Mediterranean diet adherence.",
                        link: "https://www.nih.gov/news-events/mediterranean-diet-2024",
                        created_at: new Date().toISOString(),
                        pub_date: new Date().toISOString(),
                        author: "NIH Research Team",
                        feed: { title: "NIH Health News", category: "nutrition" }
                    },
                    {
                        id: 2,
                        title: "Exercise and Mental Health Connection Explored",
                        description: "New research demonstrates strong links between regular exercise and improved mental wellbeing.",
                        link: "https://www.cdc.gov/mental-health-exercise-2024",
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                        pub_date: new Date(Date.now() - 86400000).toISOString(),
                        author: "CDC Health Team",
                        feed: { title: "CDC Health Updates", category: "mental-health" }
                    },
                    {
                        id: 3,
                        title: "Sleep Quality Critical for Immune Function",
                        description: "Studies demonstrate that quality sleep is crucial for maintaining a strong immune system.",
                        link: "https://www.nih.gov/sleep-immune-system-2024",
                        created_at: new Date(Date.now() - 172800000).toISOString(),
                        pub_date: new Date(Date.now() - 172800000).toISOString(),
                        author: "Sleep Research Institute",
                        feed: { title: "Sleep Health News", category: "health" }
                    }
                ];
                res.json({
                    success: true,
                    articles: sampleArticles,
                    count: sampleArticles.length,
                    message: 'Sample health news data (RSS controller not available)'
                });
            });
            
            app.post('/api/news/fetch', (req, res) => {
                res.json({
                    success: false,
                    message: 'RSS controller not available - cannot fetch fresh data'
                });
            });
            
            app.post('/api/news/seed', (req, res) => {
                res.json({
                    success: false,
                    message: 'RSS controller not available - cannot seed data. Check database connection.'
                });
            });
            console.log('✅ RSS fallback routes created with sample data');
        }
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log('');
            console.log('📡 Available routes:');
            console.log(`   GET  http://localhost:${PORT}/api/health`);
            console.log(`   POST http://localhost:${PORT}/api/analyze-image`);
            console.log('');
            console.log('📰 RSS Routes:');
            console.log(`   GET  http://localhost:${PORT}/api/news/feeds (get feeds from DB)`);
            console.log(`   GET  http://localhost:${PORT}/api/news/articles (get articles from DB)`);
            console.log(`   POST http://localhost:${PORT}/api/news/fetch (fetch fresh RSS data)`);
            console.log(`   POST http://localhost:${PORT}/api/news/seed (initial setup)`);
            console.log('');
            console.log('🧪 Test commands:');
            console.log(`   curl "http://localhost:${PORT}/api/health"`);
            console.log(`   curl "http://localhost:${PORT}/api/news/articles"`);
            console.log(`   curl -X POST "http://localhost:${PORT}/api/news/seed"`);
            console.log(`   curl -X POST "http://localhost:${PORT}/api/news/fetch"`);
            console.log('');
        });
        console.log('✅ VHealth Services started successfully');
    }
    catch (error) {
        console.error('💥 Failed to initialize VHealth Services:', error);
        process.exit(1);
    }
}
// Run initialization
initialize();
