const express = require('express');
const router = express.Router();
const CityInsights = require('../models/CityInsights');
const logger = require('../utils/logger');

/**
 * View all cached insights
 * @route GET /api/insights/cache
 */
router.get('/cache', async (req, res) => {
  try {
    const cachedInsights = await CityInsights.find({})
      .sort({ updatedAt: -1 })
      .limit(50);
    
    const summary = {
      totalCached: await CityInsights.countDocuments(),
      cities: cachedInsights.map(c => ({
        city: c.cityName,
        date: c.date,
        insightCount: c.insights.length,
        cachedAt: c.updatedAt,
        insights: c.insights
      }))
    };
    
    res.status(200).json({
      success: true,
      ...summary
    });
  } catch (error) {
    logger.error('Error viewing cache:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * View cache for specific city
 * @route GET /api/insights/cache/:cityName
 */
router.get('/cache/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const cached = await CityInsights.findOne({
      cityName: cityName,
      date: today
    });
    
    if (!cached) {
      return res.status(404).json({
        success: false,
        message: `No cached insights found for ${cityName} today`
      });
    }
    
    res.status(200).json({
      success: true,
      city: cached.cityName,
      date: cached.date,
      insightCount: cached.insights.length,
      cachedAt: cached.updatedAt,
      insights: cached.insights
    });
  } catch (error) {
    logger.error('Error viewing cache:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Clear all cached insights
 * @route DELETE /api/insights/cache
 */
router.delete('/cache', async (req, res) => {
  try {
    const result = await CityInsights.deleteMany({});
    logger.info(`🗑️  Cleared ${result.deletedCount} cached insight documents`);
    
    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} cached insights`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    logger.error('Error clearing cache:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
