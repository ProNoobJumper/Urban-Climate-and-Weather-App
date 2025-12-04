const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Analytics routes (all public)
router.get('/trends', analyticsController.getTrends);
router.get('/heatmap', analyticsController.getHeatmap);
router.get('/correlation', analyticsController.getCorrelation);
router.get('/compare', analyticsController.compareСities);

module.exports = router;