/**
 * Open-Meteo Weather and Air Quality Collector
 * Free API, no authentication required
 * Provides current weather and air quality data
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { validateCoordinates, roundTo } = require('../utils/helpers');

class OpenMeteoCollector {
  constructor() {
    this.name = 'OpenMeteo';
    this.baseUrl = 'https://api.open-meteo.com/v1';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Fetch current weather data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name for logging
   * @returns {Object|null} Weather data or null on error
   */
  async fetchWeatherData(lat, lng, cityName) {
    try {
      if (!validateCoordinates(lat, lng)) {
        logger.warn(`${this.name}: Invalid coordinates for ${cityName}`);
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
          timezone: 'auto'
        },
        timeout: this.timeout
      });

      const current = response.data.current;

      return {
        sourceApi: this.name,
        temperature: roundTo(current.temperature_2m, 1),
        feelsLike: roundTo(current.apparent_temperature, 1),
        humidity: roundTo(current.relative_humidity_2m, 0),
        pressure: roundTo(current.pressure_msl, 1),
        windSpeed: roundTo(current.wind_speed_10m, 1),
        windDirection: this._getWindDirection(current.wind_direction_10m),
        windGusts: roundTo(current.wind_gusts_10m, 1),
        cloudCover: roundTo(current.cloud_cover, 0),
        rainfall: roundTo(current.rain || 0, 1),
        snowfall: roundTo(current.snowfall || 0, 1),
        precipitation: roundTo(current.precipitation || 0, 1),
        weatherCode: current.weather_code,
        timestamp: new Date().toISOString(),
        qualityScore: 0.95
      };

    } catch (error) {
      logger.error(`${this.name} Weather Error for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch air quality data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name for logging
   * @returns {Object|null} Air quality data or null on error
   */
  async fetchAirQualityData(lat, lng, cityName) {
    try {
      if (!validateCoordinates(lat, lng)) {
        logger.warn(`${this.name}: Invalid coordinates for ${cityName}`);
        return null;
      }

      const response = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index,european_aqi,us_aqi',
          timezone: 'auto'
        },
        timeout: this.timeout
      });

      const current = response.data.current;

      // Calculate AQI from PM2.5 (US EPA standard)
      const aqi = this._calculateAQI(current.pm2_5);

      return {
        sourceApi: this.name,
        aqi: aqi,
        pm25: roundTo(current.pm2_5, 1),
        pm10: roundTo(current.pm10, 1),
        no2: roundTo(current.nitrogen_dioxide, 1),
        o3: roundTo(current.ozone, 1),
        so2: roundTo(current.sulphur_dioxide, 1),
        co: roundTo(current.carbon_monoxide, 0),
        uvIndex: roundTo(current.uv_index, 1),
        europeanAqi: current.european_aqi,
        usAqi: current.us_aqi,
        timestamp: new Date().toISOString(),
        qualityScore: 0.90
      };

    } catch (error) {
      logger.error(`${this.name} AQI Error for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch both weather and air quality data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {Object|null} Combined data or null on error
   */
  async fetchAllData(lat, lng, cityName) {
    try {
      const [weatherData, aqData] = await Promise.all([
        this.fetchWeatherData(lat, lng, cityName),
        this.fetchAirQualityData(lat, lng, cityName)
      ]);

      if (!weatherData && !aqData) {
        return null;
      }

      return {
        sourceApi: this.name,
        ...weatherData,
        ...aqData,
        timestamp: new Date().toISOString(),
        qualityScore: 0.95
      };

    } catch (error) {
      logger.error(`${this.name} Error for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate AQI from PM2.5 using US EPA standard
   * @param {number} pm25 - PM2.5 concentration
   * @returns {number} AQI value
   */
  _calculateAQI(pm25) {
    if (!pm25 || pm25 < 0) return 0;

    // US EPA AQI breakpoints for PM2.5
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

    return 500; // Hazardous
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

module.exports = OpenMeteoCollector;
