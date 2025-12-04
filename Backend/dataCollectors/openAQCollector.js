/**
 * OpenAQ Air Quality Collector
 * Free, open-source air quality data from global monitoring stations
 * No API key required
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { validateCoordinates, roundTo, calculateDistance } = require('../utils/helpers');

class OpenAQCollector {
  constructor() {
    this.name = 'OpenAQ';
    this.baseUrl = 'https://api.openaq.org/v2';
    this.timeout = 10000;
  }

  /**
   * Fetch weather data (OpenAQ doesn't provide weather data)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {null} OpenAQ doesn't provide weather data
   */
  async fetchWeatherData(lat, lng, cityName) {
    // OpenAQ only provides air quality data
    logger.debug(`${this.name}: Weather data not available`);
    return null;
  }

  /**
   * Fetch air quality data from OpenAQ
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {Object|null} Air quality data or null on error
   */
  async fetchAirQualityData(lat, lng, cityName) {
    try {
      if (!validateCoordinates(lat, lng)) {
        logger.warn(`${this.name}: Invalid coordinates for ${cityName}`);
        return null;
      }

      // Find nearest measurements within 25km radius
      const response = await axios.get(`${this.baseUrl}/latest`, {
        params: {
          coordinates: `${lat},${lng}`,
          radius: 25000, // 25km in meters
          limit: 100,
          order_by: 'distance'
        },
        timeout: this.timeout
      });

      if (!response.data.results || response.data.results.length === 0) {
        logger.debug(`${this.name}: No data found for ${cityName}`);
        return null;
      }

      // Aggregate measurements from nearby stations
      const measurements = this._aggregateMeasurements(response.data.results);

      if (!measurements) {
        return null;
      }

      // Calculate AQI from PM2.5
      const aqi = measurements.pm25 ? this._calculateAQI(measurements.pm25) : null;

      return {
        sourceApi: this.name,
        aqi: aqi,
        pm25: measurements.pm25,
        pm10: measurements.pm10,
        no2: measurements.no2,
        o3: measurements.o3,
        so2: measurements.so2,
        co: measurements.co,
        stationCount: measurements.stationCount,
        nearestStation: measurements.nearestStation,
        timestamp: new Date().toISOString(),
        qualityScore: 0.88
      };

    } catch (error) {
      logger.error(`${this.name} AQI Error for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Aggregate measurements from multiple stations
   * @param {Array} results - Array of measurement results
   * @returns {Object|null} Aggregated measurements
   */
  _aggregateMeasurements(results) {
    try {
      const measurements = {
        pm25: [],
        pm10: [],
        no2: [],
        o3: [],
        so2: [],
        co: []
      };

      let nearestStation = null;
      let minDistance = Infinity;

      // Collect all measurements
      for (const result of results) {
        for (const measurement of result.measurements || []) {
          const param = measurement.parameter;
          const value = measurement.value;

          if (measurements.hasOwnProperty(param) && value !== null && value !== undefined) {
            measurements[param].push(value);
          }
        }

        // Track nearest station
        if (result.distance < minDistance) {
          minDistance = result.distance;
          nearestStation = result.location;
        }
      }

      // Calculate averages
      const aggregated = {
        pm25: this._average(measurements.pm25),
        pm10: this._average(measurements.pm10),
        no2: this._average(measurements.no2),
        o3: this._average(measurements.o3),
        so2: this._average(measurements.so2),
        co: this._average(measurements.co),
        stationCount: results.length,
        nearestStation: nearestStation,
        nearestDistance: roundTo(minDistance / 1000, 2) // Convert to km
      };

      // Return null if no valid measurements
      if (!aggregated.pm25 && !aggregated.pm10 && !aggregated.no2) {
        return null;
      }

      return aggregated;

    } catch (error) {
      logger.error(`${this.name}: Aggregation error:`, error.message);
      return null;
    }
  }

  /**
   * Calculate average of array, ignoring null/undefined
   * @param {Array} values - Array of values
   * @returns {number|null} Average or null
   */
  _average(values) {
    if (!values || values.length === 0) return null;
    
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (validValues.length === 0) return null;
    
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    return roundTo(sum / validValues.length, 1);
  }

  /**
   * Calculate AQI from PM2.5 using US EPA standard
   * @param {number} pm25 - PM2.5 concentration
   * @returns {number} AQI value
   */
  _calculateAQI(pm25) {
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
  }
}

module.exports = OpenAQCollector;
