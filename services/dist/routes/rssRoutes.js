const express = require('express');
const router = express.Router();
const rssController = require('../controllers/rssController');

console.log('📰 RSS routes file loading...');

// RSS Routes
router.get('/feeds', (req, res) => {
    console.log('📰 GET /feeds called');
    rssController.getFeedsForClient(req, res);
});

router.post('/articles/ingest', (req, res) => {
    console.log('📰 POST /articles/ingest called');
    rssController.ingestArticles(req, res);
});

router.get('/articles', (req, res) => {
    console.log('📰 GET /articles called');
    rssController.getArticles(req, res);
});

// Legacy RSS endpoint - redirect to new articles endpoint
router.get('/rss', (req, res) => {
    console.log('📰 GET /rss called (legacy endpoint)');
    console.log('📰 URL param:', req.query.url);
    
    // Instead of fetching external RSS, return articles from database
    rssController.getArticles(req, res);
});

// Add seed route for testing
router.post('/seed', (req, res) => {
    console.log('📰 POST /seed called');
    rssController.seedSampleFeeds(req, res);
});

console.log('📰 RSS routes configured successfully');
module.exports = router;