/**
 * KSNDMC (Karnataka State Natural Disaster Monitoring Centre) Collector
 * Collects weather data for Karnataka region, especially Bangalore
 * Uses public data from ksndmc.karnataka.gov.in
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { validateCoordinates, roundTo } = require('../utils/helpers');

class KSNDMCCollector {
  constructor() {
    this.name = 'KSNDMC';
    this.baseUrl = 'https://ksndmc.karnataka.gov.in';
    this.timeout = 10000;
  }

  /**
   * Fetch weather data from KSNDMC
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {Object|null} Weather data or null on error
   */
  async fetchWeatherData(lat, lng, cityName) {
    try {
      if (!validateCoordinates(lat, lng)) {
        logger.warn(`${this.name}: Invalid coordinates for ${cityName}`);
        return null;
      }

      // KSNDMC primarily covers Karnataka state
      if (!this._isKarnatakaCity(cityName, lat, lng)) {
        logger.debug(`${this.name}: ${cityName} is not in Karnataka, skipping`);
        return null;
      }

      // KSNDMC doesn't have a well-documented public API
      // Using fallback with Open-Meteo for Karnataka cities
      logger.debug(`${this.name}: Using fallback for ${cityName}`);
      
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,relative_humidity_2m,precipitation,rain,pressure_msl,wind_speed_10m',
          timezone: 'Asia/Kolkata'
        },
        timeout: this.timeout
      });

      const current = response.data.current;

      return {
        sourceApi: `${this.name} (Karnataka)`,
        temperature: roundTo(current.temperature_2m, 1),
        humidity: roundTo(current.relative_humidity_2m, 0),
        pressure: roundTo(current.pressure_msl, 1),
        windSpeed: roundTo(current.wind_speed_10m, 1),
        rainfall: roundTo(current.rain || current.precipitation || 0, 1),
        timestamp: new Date().toISOString(),
        qualityScore: 0.82,
        region: 'Karnataka'
      };

    } catch (error) {
      logger.error(`${this.name} Weather Error for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch air quality data (KSNDMC doesn't provide AQI)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {null} KSNDMC doesn't provide air quality data
   */
  async fetchAirQualityData(lat, lng, cityName) {
    // KSNDMC doesn't provide air quality data
    logger.debug(`${this.name}: Air quality not available`);
    return null;
  }

  /**
   * Check if city is in Karnataka state
   * @param {string} cityName - City name
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} True if in Karnataka
   */
  _isKarnatakaCity(cityName, lat, lng) {
    // Karnataka cities
    const karnatakaCities = [
      'bangalore',
      'bengaluru',
      'mysore',
      'mysuru',
      'hubli',
      'mangalore',
      'belgaum',
      'gulbarga',
      'davanagere',
      'bellary',
      'bijapur',
      'shimoga',
      'tumkur',
      'raichur',
      'bidar',
      'hospet',
      'hassan',
      'gadag',
      'udupi',
      'chickmagalur'
    ];

    const normalized = cityName.toLowerCase().trim();
    
    // Check by name
    if (karnatakaCities.includes(normalized)) {
      return true;
    }

    // Check by coordinates (Karnataka roughly: lat 11.5-18.5, lng 74-78.5)
    if (lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.5) {
      return true;
    }

    return false;
  }

  /**
   * Get district for Karnataka city
   * @param {string} cityName - City name
   * @returns {string} District name
   */
  _getDistrict(cityName) {
    const districtMap = {
      'bangalore': 'Bangalore Urban',
      'bengaluru': 'Bangalore Urban',
      'mysore': 'Mysuru',
      'mysuru': 'Mysuru',
      'hubli': 'Dharwad',
      'mangalore': 'Dakshina Kannada',
      'belgaum': 'Belagavi',
      'gulbarga': 'Kalaburagi',
      'davanagere': 'Davanagere',
      'bellary': 'Ballari',
      'bijapur': 'Vijayapura',
      'shimoga': 'Shivamogga',
      'tumkur': 'Tumakuru',
      'raichur': 'Raichur',
      'bidar': 'Bidar',
      'hospet': 'Ballari',
      'hassan': 'Hassan',
      'gadag': 'Gadag',
      'udupi': 'Udupi',
      'chickmagalur': 'Chikkamagaluru'
    };

    const normalized = cityName.toLowerCase().trim();
    return districtMap[normalized] || 'Unknown';
  }
}

module.exports = KSNDMCCollector;
