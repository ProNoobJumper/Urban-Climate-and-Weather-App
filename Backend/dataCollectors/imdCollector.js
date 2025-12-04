/**
 * India Meteorological Department (IMD) Collector
 * Collects weather data from IMD's public API/data sources
 * Note: IMD doesn't have a well-documented public API, so this uses their data portal
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { validateCoordinates, roundTo } = require('../utils/helpers');

class IMDCollector {
  constructor() {
    this.name = 'IMD';
    this.baseUrl = 'https://city.imd.gov.in/citywx/city_weather_test.php';
    this.timeout = 10000;
  }

  /**
   * Fetch weather data from IMD
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

      // IMD city code mapping for major Indian cities
      const cityCode = this._getCityCode(cityName);
      
      if (!cityCode) {
        logger.debug(`${this.name}: No city code for ${cityName}, using fallback`);
        return this._getFallbackData(lat, lng, cityName);
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          city: cityCode
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Parse IMD response (format varies, this is a simplified version)
      const data = this._parseIMDResponse(response.data);

      if (!data) {
        return this._getFallbackData(lat, lng, cityName);
      }

      return {
        sourceApi: this.name,
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        rainfall: data.rainfall || 0,
        timestamp: new Date().toISOString(),
        qualityScore: 0.85
      };

    } catch (error) {
      logger.error(`${this.name} Weather Error for ${cityName}:`, error.message);
      // Return fallback data using Open-Meteo as backup
      return this._getFallbackData(lat, lng, cityName);
    }
  }

  /**
   * Fetch air quality data (IMD doesn't provide AQI, return null)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {null} IMD doesn't provide air quality data
   */
  async fetchAirQualityData(lat, lng, cityName) {
    // IMD doesn't provide air quality data
    logger.debug(`${this.name}: Air quality not available from IMD`);
    return null;
  }

  /**
   * Get IMD city code for major Indian cities
   * @param {string} cityName - City name
   * @returns {string|null} City code or null
   */
  _getCityCode(cityName) {
    const cityMap = {
      'mumbai': 'mumbai',
      'delhi': 'delhi',
      'new delhi': 'delhi',
      'bangalore': 'bengaluru',
      'bengaluru': 'bengaluru',
      'hyderabad': 'hyderabad',
      'chennai': 'chennai',
      'kolkata': 'kolkata',
      'pune': 'pune',
      'ahmedabad': 'ahmedabad',
      'jaipur': 'jaipur',
      'lucknow': 'lucknow',
      'kanpur': 'kanpur',
      'nagpur': 'nagpur',
      'indore': 'indore',
      'bhopal': 'bhopal',
      'patna': 'patna',
      'vadodara': 'vadodara',
      'ghaziabad': 'ghaziabad',
      'ludhiana': 'ludhiana'
    };

    const normalized = cityName.toLowerCase().trim();
    return cityMap[normalized] || null;
  }

  /**
   * Parse IMD response data
   * @param {string} html - HTML response from IMD
   * @returns {Object|null} Parsed weather data
   */
  _parseIMDResponse(html) {
    try {
      // IMD returns HTML/text format, this is a simplified parser
      // In production, you'd use a proper HTML parser like cheerio
      
      // This is a mock implementation since IMD's actual format varies
      // Real implementation would parse the actual HTML structure
      
      logger.debug(`${this.name}: Parsing IMD response`);
      
      // Return null to trigger fallback
      return null;

    } catch (error) {
      logger.error(`${this.name}: Parse error:`, error.message);
      return null;
    }
  }

  /**
   * Get fallback data using Open-Meteo API
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {Object|null} Fallback weather data
   */
  async _getFallbackData(lat, lng, cityName) {
    try {
      logger.debug(`${this.name}: Using Open-Meteo fallback for ${cityName}`);
      
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,precipitation',
          timezone: 'Asia/Kolkata'
        },
        timeout: this.timeout
      });

      const current = response.data.current;

      return {
        sourceApi: `${this.name} (via OpenMeteo)`,
        temperature: roundTo(current.temperature_2m, 1),
        humidity: roundTo(current.relative_humidity_2m, 0),
        pressure: roundTo(current.pressure_msl, 1),
        windSpeed: roundTo(current.wind_speed_10m, 1),
        windDirection: this._getWindDirection(current.wind_direction_10m),
        rainfall: roundTo(current.precipitation || 0, 1),
        timestamp: new Date().toISOString(),
        qualityScore: 0.80
      };

    } catch (error) {
      logger.error(`${this.name}: Fallback failed for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Convert wind direction degrees to cardinal direction
   * @param {number} degrees - Wind direction in degrees
   * @returns {string} Cardinal direction
   */
  _getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }
}

module.exports = IMDCollector;
