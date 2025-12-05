const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const analyticsController = require('../controllers/analyticsController');

// Get all insights for a city
router.get('/:cityName', insightsController.getInsights);

// Analyze chart data
router.post('/analyze', insightsController.analyzeChart);

// Get specific trend insight
router.post('/trend', insightsController.getTrendInsight);

// Analytics Routes
router.get('/analytics/compare', analyticsController.compareСities);
router.get('/analytics/records/:cityId', analyticsController.getHistoricalRecords);
router.get('/analytics/typical/:cityId', analyticsController.getTypicalDayComparison);
router.get('/analytics/long-term/:cityId', analyticsController.getLongTermTrends);

module.exports = router;
