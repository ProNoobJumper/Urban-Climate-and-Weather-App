const express = require('express');
const RealtimeData = require('../models/RealtimeData');
const HistoricalData = require('../models/HistoricalData');
const PredictedData = require('../models/PredictedData');
const { CITIES } = require('../config/constants');
const auth = require('../middleware/auth');

const router = express.Router();

// GET ALL CITIES
router.get('/cities', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: CITIES.length,
      data: CITIES
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET CURRENT WEATHER & AQI FOR A CITY
router.get('/current/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    const realtimeData = await RealtimeData.findOne({ cityId })
      .sort({ timestamp: -1 })
      .limit(1);
    
    if (!realtimeData) {
      return res.status(404).json({ 
        success: false, 
        message: 'No data found for this city' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: realtimeData
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET HISTORICAL DATA (Date Range)
router.get('/historical/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { startDate, endDate, metric } = req.query;
    
    // Build query
    let query = { cityId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const historicalData = await HistoricalData.find(query)
      .sort({ date: -1 })
      .limit(1000);
    
    res.status(200).json({
      success: true,
      count: historicalData.length,
      data: historicalData
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET 7-DAY FORECAST
router.get('/forecast/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    const forecast = await PredictedData.findOne({ cityId })
      .sort({ forecastDate: -1 })
      .limit(1);
    
    if (!forecast) {
      return res.status(404).json({ 
        success: false, 
        message: 'No forecast available' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: forecast
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET COMPARISON DATA (Multiple Cities)
router.get('/comparison', async (req, res) => {
  try {
    const { cities, metric, startDate, endDate } = req.query;
    
    if (!cities) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provide cities as comma-separated IDs' 
      });
    }
    
    const cityArray = cities.split(',');
    
    let query = { cityId: { $in: cityArray } };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const comparisonData = await HistoricalData.find(query)
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: comparisonData.length,
      data: comparisonData
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SEARCH CITIES BY NAME
router.get('/search/city/:query', (req, res) => {
  try {
    const { query } = req.params;
    
    const results = CITIES.filter(city =>
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      city.state.toLowerCase().includes(query.toLowerCase())
    );
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET NEARBY CITIES
router.get('/nearby', (req, res) => {
  try {
    const { lat, lng, radius = 100 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude required' 
      });
    }
    
    // Simple distance calculation
    const nearby = CITIES.filter(city => {
      const distance = Math.sqrt(
        Math.pow(city.lat - parseFloat(lat), 2) +
        Math.pow(city.lng - parseFloat(lng), 2)
      );
      return distance * 111 < parseFloat(radius);  // 111 km per degree
    });
    
    res.status(200).json({
      success: true,
      count: nearby.length,
      data: nearby
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;