import express from 'express';
import RSSController from '../controllers/rssController';

const router = express.Router();
const rssController = new RSSController();

router.get('/feeds', (req, res) => rssController.getFeedsForClient(req, res));
router.get('/articles', (req, res) => rssController.getArticles(req, res));
router.post('/articles/ingest', (req, res) => rssController.ingestArticles(req, res));
router.post('/seed', (req, res) => rssController.seedSampleFeeds(req, res));
router.post('/poll', (req, res) => rssController.triggerPolling(req, res));
router.get('/categories', (req, res) => rssController.getCategoriesAndCountries(req, res));

export default router;
