const express = require('express');
const RealtimeData = require('../models/RealtimeData');
const HistoricalData = require('../models/HistoricalData');
const PredictedData = require('../models/PredictedData');
const { CITIES } = require('../config/constants');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

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

// GET HISTORICAL RECORDS (10-year climate data with API fallback)
router.get('/historical-records/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const visualCrossing = require('../dataCollectors/visualCrossingCollector');
    
    // Try database first
    const dbRecords = await HistoricalData.find({ 
      cityName: new RegExp(cityName, 'i')
    })
    .sort({ date: -1 })
    .limit(3650); // 10 years of daily data
    
    // If we have good database coverage (at least 1 year), use it
    if (dbRecords.length >= 365) {
      logger.info(`Using database records for ${cityName} (${dbRecords.length} days)`);
      
      // Calculate records from DB data
      const records = calculateRecordsFromDB(dbRecords);
      
      return res.status(200).json({
        success: true,
        source: 'Database',
        records,
        dataPoints: dbRecords.length
      });
    }
    
    // Otherwise, fallback to Visual Crossing API
    logger.info(`Insufficient DB data for ${cityName}, using Visual Crossing API`);
    
    const apiData = await visualCrossing.fetchHistoricalData(cityName);
    
    if (!apiData) {
      return res.status(404).json({
        success: false,
        message: 'No historical data available for this city'
      });
    }
    
    res.status(200).json({
      success: true,
      source: 'Visual Crossing API',
      records: apiData.records,
      dataPoints: apiData.dataPoints
    });
    
  } catch (error) {
    logger.error('Historical records error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to calculate records from database data
function calculateRecordsFromDB(dbRecords) {
  let hottestDay = null;
  let coldestDay = null;
  let wettestDay = null;
  let worstAqiDay = null;
  let maxTemp = -Infinity;
  let minTemp = Infinity;
  let maxPrecip = 0;
  let maxAqi = 0;

  dbRecords.forEach(record => {
    // Hottest
    if (record.temperature > maxTemp) {
      maxTemp = record.temperature;
      hottestDay = {
        temperature: record.temperature,
        date: record.date
      };
    }

    // Coldest
    if (record.temperature < minTemp) {
      minTemp = record.temperature;
      coldestDay = {
        temperature: record.temperature,
        date: record.date
      };
    }

    // Wettest
    if (record.precipitation && record.precipitation > maxPrecip) {
      maxPrecip = record.precipitation;
      wettestDay = {
        precipitation: record.precipitation,
        date: record.date
      };
    }

    // Worst AQI
    if (record.aqi && record.aqi > maxAqi) {
      maxAqi = record.aqi;
      worstAqiDay = {
        aqi: record.aqi,
        date: record.date
      };
    }
  });

  return {
    hottest: hottestDay,
    coldest: coldestDay,
    wettest: wettestDay,
    worstAqi: worstAqiDay
  };
}

module.exports = router;
