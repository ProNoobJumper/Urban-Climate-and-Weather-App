/**
 * WeatherUnion API Collector
 * Hyperlocal weather data for Indian cities
 * Requires API key from weatherunion.com
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { validateCoordinates, roundTo } = require('../utils/helpers');

class WeatherUnionCollector {
  constructor() {
    this.name = 'WeatherUnion';
    this.baseUrl = 'https://www.weatherunion.com/gw/weather/external/v0';
    this.timeout = 10000;
    this.apiKey = process.env.WEATHER_UNION_API_KEY;
  }

  /**
   * Fetch weather data from WeatherUnion
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {Object|null} Weather data or null on error
   */
  async fetchWeatherData(lat, lng, cityName) {
    try {
      if (!this.apiKey) {
        logger.warn(`${this.name}: API key not configured, skipping`);
        return null;
      }

      if (!validateCoordinates(lat, lng)) {
        logger.warn(`${this.name}: Invalid coordinates for ${cityName}`);
        return null;
      }

      // WeatherUnion uses locality IDs, try to get nearest locality
      const localityId = await this._getNearestLocality(lat, lng);
      
      if (!localityId) {
        logger.debug(`${this.name}: No locality found for ${cityName}`);
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/get_locality_weather_data`, {
        params: {
          locality_id: localityId
        },
        headers: {
          'X-Zomato-Api-Key': this.apiKey
        },
        timeout: this.timeout
      });

      const data = response.data.locality_weather_data;

      return {
        sourceApi: this.name,
        temperature: roundTo(data.temperature, 1),
        feelsLike: roundTo(data.feels_like, 1),
        humidity: roundTo(data.humidity, 0),
        windSpeed: roundTo(data.wind_speed, 1),
        windDirection: data.wind_direction,
        rainfall: roundTo(data.rain_intensity || 0, 1),
        rainAccumulation: roundTo(data.rain_accumulation || 0, 1),
        timestamp: new Date().toISOString(),
        qualityScore: 0.92
      };

    } catch (error) {
      if (error.response?.status === 401) {
        logger.error(`${this.name}: Invalid API key`);
      } else if (error.response?.status === 404) {
        logger.debug(`${this.name}: No data for ${cityName}`);
      } else {
        logger.error(`${this.name} Weather Error for ${cityName}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetch air quality data (WeatherUnion doesn't provide AQI)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {null} WeatherUnion doesn't provide air quality data
   */
  async fetchAirQualityData(lat, lng, cityName) {
    // WeatherUnion doesn't provide air quality data
    logger.debug(`${this.name}: Air quality not available`);
    return null;
  }

  /**
   * Get nearest locality ID for coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {string|null} Locality ID or null
   */
  async _getNearestLocality(lat, lng) {
    try {
      // WeatherUnion locality mapping for major cities
      // In production, you'd query their API to find nearest locality
      const localities = this._getLocalityMapping();
      
      // Find closest locality (simplified - in production use proper distance calculation)
      let closestLocality = null;
      let minDistance = Infinity;

      for (const [localityId, coords] of Object.entries(localities)) {
        const distance = Math.sqrt(
          Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestLocality = localityId;
        }
      }

      // Only return if within reasonable distance (0.5 degrees ~ 55km)
      return minDistance < 0.5 ? closestLocality : null;

    } catch (error) {
      logger.error(`${this.name}: Error finding locality:`, error.message);
      return null;
    }
  }

  /**
   * Get locality mapping for major Indian cities
   * @returns {Object} Locality ID to coordinates mapping
   */
  _getLocalityMapping() {
    // Sample locality IDs (these are examples - real IDs would come from WeatherUnion)
    return {
      'ZWL005764': { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
      'ZWL001234': { lat: 28.7041, lng: 77.1025, city: 'Delhi' },
      'ZWL009876': { lat: 12.9716, lng: 77.5946, city: 'Bangalore' },
      'ZWL005432': { lat: 17.3850, lng: 78.4867, city: 'Hyderabad' },
      'ZWL007890': { lat: 13.0827, lng: 80.2707, city: 'Chennai' },
      'ZWL003456': { lat: 22.5726, lng: 88.3639, city: 'Kolkata' },
      'ZWL008765': { lat: 18.5204, lng: 73.8567, city: 'Pune' },
      'ZWL002345': { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad' }
    };
  }
}

module.exports = WeatherUnionCollector;
