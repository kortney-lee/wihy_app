import express from 'express';
import rssRoutes from './rss.js';

const router = express.Router();

// Integrate RSS routes
router.use('/rss', rssRoutes);

export default router;