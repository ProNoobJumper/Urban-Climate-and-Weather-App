const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Visual Crossing Weather API Collector
 * Fetches historical weather data (10 years) for climate analysis
 */

const API_KEY = process.env.VISUAL_CROSSING_API_KEY;
const BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

/**
 * Fetch 10 years of historical data for a city
 * @param {string} cityName - Name of the city
 * @returns {Promise<Object>} Historical records and trends
 */
const fetchHistoricalData = async (cityName) => {
  if (!API_KEY) {
    logger.warn('VISUAL_CROSSING_API_KEY not configured');
    return null;
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1); // 5 years ago (less quota usage)

    const startStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const endStr = endDate.toISOString().split('T')[0];

    const url = `${BASE_URL}/${cityName},India/${startStr}/${endStr}`;
    
    logger.info(`Fetching 1-year historical data for ${cityName} from Visual Crossing...`);

    const response = await axios.get(url, {
      params: {
        key: API_KEY,
        unitGroup: 'metric',
        include: 'days',
        elements: 'datetime,tempmax,tempmin,temp,precip,humidity'
      },
      timeout: 30000 // 30 second timeout
    });

    const days = response.data.days || [];
    
    if (days.length === 0) {
      logger.warn(`No historical data returned for ${cityName}`);
      return null;
    }

    // Calculate records
    const records = calculateRecords(days);
    
    logger.info(`✅ Retrieved ${days.length} days of historical data for ${cityName}`);
    
    return {
      records,
      dataPoints: days.length,
      source: 'Visual Crossing API',
      fetchedAt: new Date().toISOString()
    };

  } catch (error) {
    if (error.response?.status === 429) {
      logger.error('Visual Crossing API rate limit exceeded');
    } else if (error.response?.status === 401 || error.response?.status === 400) {
      logger.error('Visual Crossing API authentication error:', error.response?.data || error.message);
    } else if (error.response) {
      logger.error('Visual Crossing API error:', error.response.status, error.response.data);
    } else {
      logger.error('Visual Crossing API error:', error.message);
    }
    return null;
  }
};

/**
 * Calculate hottest, coldest, wettest records from historical data
 */
const calculateRecords = (days) => {
  let hottestDay = null;
  let coldestDay = null;
  let wettestDay = null;
  let maxTemp = -Infinity;
  let minTemp = Infinity;
  let maxPrecip = 0;

  days.forEach(day => {
    // Hottest
    if (day.tempmax > maxTemp) {
      maxTemp = day.tempmax;
      hottestDay = {
        temperature: day.tempmax,
        date: day.datetime
      };
    }

    // Coldest
    if (day.tempmin < minTemp) {
      minTemp = day.tempmin;
      coldestDay = {
        temperature: day.tempmin,
        date: day.datetime
      };
    }

    // Wettest
    if (day.precip > maxPrecip) {
      maxPrecip = day.precip;
      wettestDay = {
        precipitation: day.precip,
        date: day.datetime
      };
    }
  });

  return {
    hottest: hottestDay,
    coldest: coldestDay,
    wettest: wettestDay,
    worstAqi: null  // Visual Crossing API doesn't provide AQI data
  };
};

/**
 * Fetch weather data for a specific date
 * @param {string} cityName - Name of the city
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Weather data for that date
 */
const fetchHistoricalDate = async (cityName, date) => {
  if (!API_KEY) {
    logger.warn('VISUAL_CROSSING_API_KEY not configured');
    return null;
  }

  try {
    const url = `${BASE_URL}/${cityName},India/${date}/${date}`;
    
    logger.info(`Fetching data for ${cityName} on ${date} from Visual Crossing...`);

    const response = await axios.get(url, {
      params: {
        key: API_KEY,
        unitGroup: 'metric',
        include: 'days',
        elements: 'datetime,tempmax,tempmin,temp,precip,humidity,conditions'
      },
      timeout: 15000
    });

    const day = response.data.days?.[0];
    
    if (!day) {
      logger.warn(`No data returned for ${cityName} on ${date}`);
      return null;
    }

    logger.info(`✅ Retrieved data for ${cityName} on ${date}`);
    
    return {
      date: day.datetime,
      data: {
        temperature: day.temp || day.tempmax || null,
        precipitation: day.precip || 0,
        humidity: day.humidity || null,
        conditions: day.conditions || 'N/A'
      }
    };

  } catch (error) {
    if (error.response?.status === 429) {
      logger.error('Visual Crossing API rate limit exceeded');
    } else if (error.response?.status === 401 || error.response?.status === 400) {
      logger.error('Visual Crossing API authentication error:', error.response?.data || error.message);
    } else if (error.response) {
      logger.error('Visual Crossing API error:', error.response.status, error.response.data);
    } else {
      logger.error('Visual Crossing API error:', error.message);
    }
    return null;
  }
};

module.exports = {
  fetchHistoricalData,
  fetchHistoricalDate
};

