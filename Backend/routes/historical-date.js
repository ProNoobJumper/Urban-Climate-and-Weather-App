const express = require('express');
const router = express.Router();
const visualCrossingCollector = require('../dataCollectors/visualCrossingCollector');
const HistoricalData = require('../models/HistoricalData');
const City = require('../models/City');
const logger = require('../utils/logger');

/**
 * GET /api/historical-date/:cityName/:date
 * Fetch weather data for a specific date
 */
router.get('/:cityName/:date', async (req, res) => {
  try {
    const { cityName, date } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    logger.info(`Fetching historical data for ${cityName} on ${date}`);

    // Try database first
    const city = await City.findOne({ name: new RegExp(`^${cityName}$`, 'i') });
    
    if (city) {
      const dbData = await HistoricalData.findOne({
        cityId: city._id,
        date: new Date(date)
      });

      if (dbData) {
        logger.info(`Found ${date} data for ${cityName} in database`);
        return res.json({
          success: true,
          source: 'Database',
          date: dbData.date,
          data: {
            temperature: dbData.temperature,
            precipitation: dbData.precipitation,
            humidity: dbData.humidity,
            conditions: dbData.conditions || 'N/A'
          }
        });
      }
    }

    // Fall back to Visual Crossing API
    logger.info(`Fetching ${date} from Visual Crossing for ${cityName}`);
    const apiData = await visualCrossingCollector.fetchHistoricalDate(cityName, date);

    if (!apiData) {
      return res.status(404).json({
        success: false,
        error: 'No data available for this date from Visual Crossing API'
      });
    }

    res.json({
      success: true,
      source: 'Visual Crossing API',
      date: apiData.date,
      data: apiData.data
    });

  } catch (error) {
    logger.error('Error fetching historical date:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
