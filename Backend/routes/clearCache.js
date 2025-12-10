const express = require('express');
const router = express.Router();
const CityInsights = require('../models/CityInsights');
const logger = require('../utils/logger');

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
