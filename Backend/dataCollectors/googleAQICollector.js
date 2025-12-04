/**
 * OpenMeteo AQI Collector (Formerly Google AQI)
 * Replaces Google Air Quality API with Open-Meteo to avoid API keys
 * Fetches comprehensive air quality data
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { validateCoordinates, roundTo } = require('../utils/helpers');

class GoogleAQICollector {
  constructor() {
    this.name = 'OpenMeteo-AQI'; // Renamed source
    // Use URL from .env or fallback to default
    this.baseUrl = process.env.OPEN_METEO_AQI_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality';
    this.timeout = 10000;
  }

  /**
   * Fetch weather data (Not used for this collector)
   */
  async fetchWeatherData(lat, lng, cityName) {
    logger.debug(`${this.name}: Weather data not collected by this specialized collector`);
    return null;
  }

  /**
   * Fetch air quality data from Open-Meteo
   */
  async fetchAirQualityData(lat, lng, cityName) {
    try {
      if (!validateCoordinates(lat, lng)) {
        logger.warn(`${this.name}: Invalid coordinates for ${cityName}`);
        return null;
      }

      // Fetch European AQI and detailed pollutants
      const response = await axios.get(this.baseUrl, {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index',
          timezone: 'auto'
        },
        timeout: this.timeout
      });

      const current = response.data.current;

      return {
        sourceApi: this.name,
        aqi: current.us_aqi, // Standardizing on US AQI
        pm25: roundTo(current.pm2_5, 1),
        pm10: roundTo(current.pm10, 1),
        no2: roundTo(current.nitrogen_dioxide, 1),
        o3: roundTo(current.ozone, 1),
        so2: roundTo(current.sulphur_dioxide, 1),
        co: roundTo(current.carbon_monoxide, 0),
        uvIndex: roundTo(current.uv_index, 1),
        
        // Extra metadata
        europeanAqi: current.european_aqi,
        dominantPollutant: this._determineDominant(current),
        aqiCategory: this._getAQICategory(current.us_aqi),
        
        timestamp: new Date().toISOString(),
        qualityScore: 0.90
      };

    } catch (error) {
      logger.error(`${this.name} Error for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Determine dominant pollutant (simplified logic)
   */
  _determineDominant(data) {
    const pollutants = {
      'PM2.5': data.pm2_5,
      'PM10': data.pm10,
      'NO2': data.nitrogen_dioxide,
      'O3': data.ozone
    };
    
    return Object.keys(pollutants).reduce((a, b) => pollutants[a] > pollutants[b] ? a : b);
  }

  /**
   * Get AQI category description
   */
  _getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }
}

module.exports = GoogleAQICollector;
