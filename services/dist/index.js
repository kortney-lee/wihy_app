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

// ADD REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📡 [${timestamp}] ${req.method} ${req.url}`);
    next();
});

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

        // ADD BASIC HEALTH CHECK ENDPOINT FIRST
        app.get('/api/health', (req, res) => {
            console.log('💓 Health check called');
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                port: PORT,
                message: 'VHealth Services Backend is running',
                database: pool ? 'connected' : 'disconnected'
            });
        });

        app.get('/ping', (req, res) => {
            console.log('🏓 Ping called');
            res.send('pong');
        });

        // Mount nutrition routes
        console.log('📊 About to mount nutrition routes at /api');
        app.use('/api', nutritionRoutes_1.default);
        console.log('✅ Nutrition routes mounted successfully');

        // Create RSS routes
        console.log('📰 Loading RSS routes...');
        try {
            const { router: rssRoutes, rssController } = require('./routes/rssRoutes');
            app.use('/api/news', rssRoutes);
            console.log('✅ RSS routes mounted successfully');
            
            // Initialize RSS Controller AFTER routes are mounted
            if (rssController) {
                console.log('📰 Initializing RSS Controller...');
                
                // Initialize in background, don't block server startup
                rssController.initialize()
                    .then(() => {
                        console.log('✅ RSS Controller initialized successfully');
                    })
                    .catch((error) => {
                        console.error('❌ RSS Controller initialization failed:', error);
                        console.error('📰 RSS routes will respond with initialization errors until fixed');
                    });
            }
            
            console.log('📰 RSS Endpoints:');
            console.log(`   GET  http://localhost:${PORT}/api/news/debug/health`);
            console.log(`   GET  http://localhost:${PORT}/api/news/feeds`);
            console.log(`   GET  http://localhost:${PORT}/api/news/articles`);
            console.log(`   POST http://localhost:${PORT}/api/news/seed`);
            console.log(`   POST http://localhost:${PORT}/api/news/fetch`);
            
        } catch (error) {
            console.error('❌ Failed to load RSS routes:', error);
            
            // Create minimal fallback for health check
            app.get('/api/news/debug/health', (req, res) => {
                res.json({
                    success: false,
                    error: 'RSS routes failed to load',
                    details: error.message,
                    timestamp: new Date().toISOString()
                });
            });
        }

        // ADD DOCUMENTATION ROUTES HERE
        console.log('📚 Loading API documentation routes...');
        try {
            const docsRoutes = require('./routes/docsRoutes');
            app.use('/api/service/docs', docsRoutes); // Changed from /api/news/docs
            console.log('✅ API documentation routes mounted successfully');
            console.log(`📖 Interactive docs available at: http://localhost:${PORT}/api/service/docs`);
            console.log(`📋 OpenAPI spec available at: http://localhost:${PORT}/api/service/docs/openapi.json`);
        } catch (docsError) {
            console.warn('⚠️ Failed to load documentation routes:', docsError.message);
            
            // Minimal fallback
            app.get('/api/service/docs', (req, res) => {
                res.json({
                    success: false,
                    message: 'Interactive documentation not available',
                    available_endpoints: [
                        'GET /api/news/articles - Get RSS articles',
                        'GET /api/news/feeds - Get RSS feeds',
                        'POST /api/news/fetch - Fetch latest articles',
                        'POST /api/news/seed - Add sample feeds',
                        'GET /api/news/debug/health - Health check'
                    ]
                });
            });
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔗 Server accessible at: http://localhost:${PORT}`);
            console.log('');
            console.log('📡 Available routes:');
            console.log(`   GET  http://localhost:${PORT}/api/health`);
            console.log(`   GET  http://localhost:${PORT}/ping`);
            console.log(`   POST http://localhost:${PORT}/api/analyze-image`);
            console.log('');
            console.log('📰 RSS Routes:');
            console.log(`   GET  http://localhost:${PORT}/api/news/feeds (get feeds from DB)`);
            console.log(`   GET  http://localhost:${PORT}/api/news/articles (get articles from DB)`);
            console.log(`   GET  http://localhost:${PORT}/api/news/status (RSS status)`);
            console.log(`   POST http://localhost:${PORT}/api/news/fetch (fetch fresh RSS data)`);
            console.log(`   POST http://localhost:${PORT}/api/news/seed (initial setup)`);
            console.log('');
            console.log('📚 Documentation Routes:');
            console.log(`   GET  http://localhost:${PORT}/api/service/docs (Interactive Swagger UI)`);
            console.log(`   GET  http://localhost:${PORT}/api/service/docs/openapi.json (OpenAPI spec)`);
            console.log(`   GET  http://localhost:${PORT}/api/service/docs/endpoints (Endpoint list)`);
            console.log('');
            console.log('🧪 Test commands:');
            console.log(`   curl "http://localhost:${PORT}/api/health"`);
            console.log(`   curl "http://localhost:${PORT}/api/news/articles"`);
            console.log(`   curl "http://localhost:${PORT}/api/service/docs/endpoints"`);
            console.log(`   curl -X POST "http://localhost:${PORT}/api/news/seed"`);
            console.log(`   curl -X POST "http://localhost:${PORT}/api/news/fetch"`);
            console.log('');
            
            // AUTO-TEST THE SERVER
            console.log('🧪 Testing server endpoints...');
            const http = require('http');
            
            setTimeout(() => {
                http.get(`http://localhost:${PORT}/api/health`, (res) => {
                    console.log(`✅ Health check test: ${res.statusCode}`);
                }).on('error', (err) => {
                    console.error(`❌ Health check test failed: ${err.message}`);
                });
                
                http.get(`http://localhost:${PORT}/api/news/articles`, (res) => {
                    console.log(`✅ News articles test: ${res.statusCode}`);
                }).on('error', (err) => {
                    console.error(`❌ News articles test failed: ${err.message}`);
                });

                // ADD DOCUMENTATION TEST
                http.get(`http://localhost:${PORT}/api/service/docs/endpoints`, (res) => {
                    console.log(`✅ API documentation test: ${res.statusCode}`);
                }).on('error', (err) => {
                    console.error(`❌ API documentation test failed: ${err.message}`);
                });
            }, 1000);
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