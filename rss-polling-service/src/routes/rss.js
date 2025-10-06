import express from 'express';
import RSSController from '../controllers/rssController';

const router = express.Router();
const rssController = new RSSController();

// Automatically initialize and start polling when the service starts
rssController.ensureInitialized();

// Define routes for interacting with RSS feeds
router.get('/feeds', rssController.getFeedsForClient.bind(rssController));
router.get('/articles', rssController.getArticles.bind(rssController));
router.post('/seed', rssController.seedSampleFeeds.bind(rssController));
router.get('/status', rssController.getStatus.bind(rssController));

export default router;