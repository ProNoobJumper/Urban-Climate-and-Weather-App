/**
 * Data Processor Service
 * Handles data aggregation, AQI calculation, anomaly detection, and missing data interpolation
 */

const RealtimeData = require('../models/RealtimeData');
const HistoricalData = require('../models/HistoricalData');
const logger = require('../utils/logger');
const { roundTo, getDateRange } = require('../utils/helpers');

/**
 * Aggregate hourly data to daily summaries
 * @param {string} cityId - City ID
 * @param {Date} date - Date to aggregate
 * @returns {Promise<Object|null>} Aggregated daily data
 */
const aggregateDailyData = async (cityId, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all hourly data for the day
    const hourlyData = await RealtimeData.find({
      cityId: cityId,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    if (hourlyData.length === 0) {
      logger.warn(`No data found for ${cityId} on ${date.toISOString().split('T')[0]}`);
      return null;
    }

    // Calculate aggregates
    const temps = hourlyData.map(d => d.temperature?.current).filter(t => t != null);
    const humidities = hourlyData.map(d => d.humidity).filter(h => h != null);
    const pm25Values = hourlyData.map(d => d.pm25).filter(p => p != null);
    const pm10Values = hourlyData.map(d => d.pm10).filter(p => p != null);
    const aqiValues = hourlyData.map(d => d.aqi).filter(a => a != null);

    const aggregated = {
      cityId: cityId,
      date: startOfDay,
      
      // Temperature aggregates
      avgTemperature: temps.length > 0 ? roundTo(_average(temps), 1) : null,
      maxTemperature: temps.length > 0 ? roundTo(Math.max(...temps), 1) : null,
      minTemperature: temps.length > 0 ? roundTo(Math.min(...temps), 1) : null,
      
      // Humidity
      avgHumidity: humidities.length > 0 ? roundTo(_average(humidities), 0) : null,
      
      // Air Quality
      avgPm25: pm25Values.length > 0 ? roundTo(_average(pm25Values), 1) : null,
      avgPm10: pm10Values.length > 0 ? roundTo(_average(pm10Values), 1) : null,
      avgAqi: aqiValues.length > 0 ? roundTo(_average(aqiValues), 0) : null,
      
      // Data completeness (percentage of hours with data)
      dataCompleteness: roundTo((hourlyData.length / 24) * 100, 0),
      
      // Record count
      recordCount: hourlyData.length
    };

    logger.debug(`Aggregated ${hourlyData.length} records for ${cityId} on ${date.toISOString().split('T')[0]}`);
    
    return aggregated;

  } catch (error) {
    logger.error(`Error aggregating daily data for ${cityId}:`, error.message);
    return null;
  }
};

/**
 * Calculate AQI from PM2.5 using US EPA standard
 * @param {number} pm25 - PM2.5 concentration (µg/m³)
 * @returns {number} AQI value (0-500)
 */
const calculateAQI = (pm25) => {
  if (!pm25 || pm25 < 0) return 0;

  // US EPA AQI breakpoints for PM2.5 (24-hour average)
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },      // Good
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },   // Moderate
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },  // Unhealthy for Sensitive Groups
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 }, // Unhealthy
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },// Very Unhealthy
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 } // Hazardous
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }

  return 500; // Hazardous (beyond scale)
};

/**
 * Get AQI category and color
 * @param {number} aqi - AQI value
 * @returns {Object} Category info
 */
const getAQICategory = (aqi) => {
  if (aqi <= 50) return { level: 'Good', color: '#00e400', concern: 'None' };
  if (aqi <= 100) return { level: 'Moderate', color: '#ffff00', concern: 'Sensitive groups' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: '#ff7e00', concern: 'Sensitive groups' };
  if (aqi <= 200) return { level: 'Unhealthy', color: '#ff0000', concern: 'Everyone' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: '#8f3f97', concern: 'Everyone' };
  return { level: 'Hazardous', color: '#7e0023', concern: 'Everyone' };
};

/**
 * Detect anomalies in data points using statistical methods
 * @param {Array} dataPoints - Array of data points with value and timestamp
 * @param {number} threshold - Standard deviation threshold (default: 3)
 * @returns {Array} Array of anomalies
 */
const detectAnomalies = (dataPoints, threshold = 3) => {
  try {
    if (!dataPoints || dataPoints.length < 10) {
      logger.warn('Insufficient data points for anomaly detection');
      return [];
    }

    const values = dataPoints.map(dp => dp.value).filter(v => v != null);
    
    if (values.length === 0) return [];

    // Calculate mean and standard deviation
    const mean = _average(values);
    const stdDev = _standardDeviation(values, mean);

    // Detect outliers (values beyond threshold * stdDev from mean)
    const anomalies = [];
    
    dataPoints.forEach((dp, index) => {
      if (dp.value != null) {
        const zScore = Math.abs((dp.value - mean) / stdDev);
        
        if (zScore > threshold) {
          anomalies.push({
            index: index,
            timestamp: dp.timestamp,
            value: dp.value,
            zScore: roundTo(zScore, 2),
            deviation: roundTo(dp.value - mean, 2)
          });
        }
      }
    });

    logger.debug(`Detected ${anomalies.length} anomalies out of ${dataPoints.length} points`);
    
    return anomalies;

  } catch (error) {
    logger.error('Error detecting anomalies:', error.message);
    return [];
  }
};

/**
 * Fill missing data using linear interpolation
 * @param {Array} dataPoints - Array of data points with value and timestamp
 * @returns {Array} Array with interpolated values
 */
const fillMissingData = (dataPoints) => {
  try {
    if (!dataPoints || dataPoints.length === 0) return [];

    const filled = [...dataPoints];
    
    // Find gaps and interpolate
    for (let i = 1; i < filled.length - 1; i++) {
      if (filled[i].value == null) {
        // Find previous and next valid values
        let prevIndex = i - 1;
        let nextIndex = i + 1;

        while (prevIndex >= 0 && filled[prevIndex].value == null) {
          prevIndex--;
        }

        while (nextIndex < filled.length && filled[nextIndex].value == null) {
          nextIndex++;
        }

        // Interpolate if both boundaries exist
        if (prevIndex >= 0 && nextIndex < filled.length) {
          const prevValue = filled[prevIndex].value;
          const nextValue = filled[nextIndex].value;
          const steps = nextIndex - prevIndex;
          const stepSize = (nextValue - prevValue) / steps;
          
          filled[i].value = roundTo(prevValue + stepSize * (i - prevIndex), 2);
          filled[i].interpolated = true;
        }
      }
    }

    const interpolatedCount = filled.filter(dp => dp.interpolated).length;
    logger.debug(`Interpolated ${interpolatedCount} missing values`);
    
    return filled;

  } catch (error) {
    logger.error('Error filling missing data:', error.message);
    return dataPoints;
  }
};

/**
 * Calculate moving average
 * @param {Array} values - Array of values
 * @param {number} window - Window size
 * @returns {Array} Moving averages
 */
const calculateMovingAverage = (values, window = 7) => {
  if (!values || values.length < window) return [];

  const movingAvg = [];
  
  for (let i = window - 1; i < values.length; i++) {
    const windowValues = values.slice(i - window + 1, i + 1);
    const avg = _average(windowValues);
    movingAvg.push(roundTo(avg, 2));
  }

  return movingAvg;
};

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Calculate average of array
 * @private
 */
const _average = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculate standard deviation
 * @private
 */
const _standardDeviation = (values, mean) => {
  if (!values || values.length === 0) return 0;
  
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = _average(squaredDiffs);
  
  return Math.sqrt(variance);
};

module.exports = {
  aggregateDailyData,
  calculateAQI,
  getAQICategory,
  detectAnomalies,
  fillMissingData,
  calculateMovingAverage
};
