/**
 * API Aggregation Service
 * Orchestrates data collection from multiple API sources using MasterCollector
 */

const MasterCollector = require('../dataCollectors/masterCollector');
const RealtimeData = require('../models/RealtimeData');
const { CITIES } = require('../config/constants');
const logger = require('../utils/logger');
const { getCachedData, setCachedData } = require('./cacheManager');

// Initialize master collector
const masterCollector = new MasterCollector();

/**
 * Aggregate real-time data from all sources
 * @returns {Promise<Object>} Aggregation results
 */
const aggregateRealTimeData = async () => {
  try {
    logger.info('🔄 Starting real-time data aggregation from all sources...');
    
    const startTime = Date.now();
    
    // Collect data from all 8 sources
    const results = await masterCollector.collectAllData();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.success(`✅ Real-time data aggregation complete in ${duration}s`);
    logger.info(`   Cities: ${results.successfulCities}/${results.totalCities}`);
    logger.info(`   Records: ${results.totalRecords}`);
    
    if (results.errors.length > 0) {
      logger.warn(`   Errors: ${results.errors.length}`);
      results.errors.forEach(err => {
        logger.debug(`   - ${err.city}: ${err.error}`);
      });
    }
    
    return results;

  } catch (error) {
    logger.error('❌ Real-time data aggregation failed:', error.message);
    throw error;
  }
};

/**
 * Get latest data for a specific city from all sources
 * @param {string} cityId - City ID
 * @returns {Promise<Array>} Array of latest data from each source
 */
const getLatestCityData = async (cityId) => {
  try {
    // Check cache first
    const cacheKey = `latest:${cityId}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      logger.debug(`Returning cached data for ${cityId}`);
      return cached;
    }

    // Fetch latest data from each source
    const latestData = await RealtimeData.find({ cityId: cityId })
      .sort({ timestamp: -1 })
      .limit(10) // Get latest from each source
      .lean();

    // Group by source
    const groupedBySource = {};
    
    latestData.forEach(record => {
      const source = record.dataSources?.temperature || 'Unknown';
      
      if (!groupedBySource[source] || new Date(record.timestamp) > new Date(groupedBySource[source].timestamp)) {
        groupedBySource[source] = record;
      }
    });

    const result = Object.values(groupedBySource);

    // Cache for 5 minutes
    setCachedData(cacheKey, result, 300);

    return result;

  } catch (error) {
    logger.error(`Error getting latest data for ${cityId}:`, error.message);
    return [];
  }
};

/**
 * Get merged/consensus data for a city
 * @param {string} cityId - City ID
 * @returns {Promise<Object|null>} Merged data
 */
const getMergedCityData = async (cityId) => {
  try {
    const latestData = await getLatestCityData(cityId);
    
    if (latestData.length === 0) {
      return null;
    }

    // Calculate consensus values (average from all sources)
    const temperatures = latestData
      .map(d => d.temperature?.current)
      .filter(t => t != null);
    
    const humidities = latestData
      .map(d => d.humidity)
      .filter(h => h != null);
    
    const pm25Values = latestData
      .map(d => d.pm25)
      .filter(p => p != null);
    
    const aqiValues = latestData
      .map(d => d.aqi)
      .filter(a => a != null);

    const merged = {
      cityId: cityId,
      cityName: latestData[0].cityName,
      timestamp: new Date(),
      
      temperature: {
        current: _average(temperatures),
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        sources: temperatures.length
      },
      
      humidity: _average(humidities),
      pm25: _average(pm25Values),
      aqi: Math.round(_average(aqiValues)),
      
      dataQuality: {
        sources: latestData.length,
        completeness: (latestData.length / 8) * 100, // Out of 8 possible sources
        lastUpdate: latestData[0].timestamp
      },
      
      sources: latestData.map(d => ({
        name: d.dataSources?.temperature || 'Unknown',
        timestamp: d.timestamp,
        quality: d.dataQualityScore
      }))
    };

    return merged;

  } catch (error) {
    logger.error(`Error merging data for ${cityId}:`, error.message);
    return null;
  }
};

/**
 * Get data source statistics
 * @returns {Promise<Object>} Statistics by source
 */
const getSourceStatistics = async () => {
  try {
    const stats = await masterCollector.getStatistics();
    return stats;

  } catch (error) {
    logger.error('Error getting source statistics:', error.message);
    return null;
  }
};

/**
 * Calculate AQI from PM2.5 using US EPA standard
 * @param {number} pm25 - PM2.5 concentration
 * @returns {number} AQI value
 */
const calculateAQI = (pm25) => {
  if (!pm25 || pm25 < 0) return 0;

  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }

  return 500;
};

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Calculate average of array
 * @private
 */
const _average = (values) => {
  if (!values || values.length === 0) return null;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10;
};

module.exports = {
  aggregateRealTimeData,
  getLatestCityData,
  getMergedCityData,
  getSourceStatistics,
  calculateAQI
};