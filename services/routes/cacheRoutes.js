const express = require('express');
const ResultsCacheService = require('../src/services/resultsCacheService');

const router = express.Router();
const cacheService = new ResultsCacheService();

// POST /api/cache/save - Save search results
router.post('/save', async (req, res) => {
  try {
    const { query, results, source } = req.body;
    
    if (!query || !results || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields: query, results, source' 
      });
    }

    const result = await cacheService.saveResults(query, results, source);
    
    res.json({
      success: true,
      id: result.id,
      message: 'Results cached successfully'
    });
    
  } catch (error) {
    console.error('Cache save error:', error);
    res.status(500).json({ 
      error: 'Failed to save results to cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/cache/get - Retrieve cached results
router.get('/get', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Missing query parameter: q' 
      });
    }

    const cachedResult = await cacheService.getResults(q);
    
    if (cachedResult) {
      res.json(cachedResult);
    } else {
      res.status(404).json({ 
        error: 'No cached results found for this query' 
      });
    }
    
  } catch (error) {
    console.error('Cache retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve cached results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/cache/similar - Find similar cached results
router.get('/similar', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Missing query parameter: q' 
      });
    }

    const similarResults = await cacheService.findSimilarResults(q);
    
    res.json(similarResults);
    
  } catch (error) {
    console.error('Similar results error:', error);
    res.status(500).json({ 
      error: 'Failed to find similar results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/cache/delete/:id - Delete specific cache entry
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    
    if (isNaN(numId)) {
      return res.status(400).json({
        error: 'Invalid ID parameter'
      });
    }
    
    await cacheService.deleteResult(numId);
    
    res.json({
      success: true,
      message: 'Cache entry deleted successfully'
    });
    
  } catch (error) {
    console.error('Cache deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete cache entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/cache/cleanup - Clean up expired entries
router.post('/cleanup', async (req, res) => {
  try {
    const result = await cacheService.cleanupExpired();
    
    res.json({
      success: true,
      deleted: result.deleted,
      message: `Cleaned up ${result.deleted} expired entries`
    });
    
  } catch (error) {
    console.error('Cache cleanup error:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup expired cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/cache/stats - Get cache statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

module.exports = router;