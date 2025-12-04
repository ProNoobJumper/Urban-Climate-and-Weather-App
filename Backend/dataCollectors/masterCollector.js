/**
 * Master Collector
 * Orchestrates all 8 data collectors and aggregates results
 * Calls all APIs in parallel and stores each source separately
 */

const OpenMeteoCollector = require('./openMeteoCollector');
const IMDCollector = require('./imdCollector');
const WeatherUnionCollector = require('./weatherUnionCollector');
const KSNDMCCollector = require('./ksndmcCollector');
const OpenAQCollector = require('./openAQCollector');
const GoogleAQICollector = require('./googleAQICollector');
const UrbanEmissionCollector = require('./urbanEmissionCollector');
const OpenCityCollector = require('./openCityCollector');

const RealtimeData = require('../models/RealtimeData');
const logger = require('../utils/logger');
const { CITIES } = require('../config/constants');

class MasterCollector {
  constructor() {
    // Initialize all collectors
    this.collectors = {
      openMeteo: new OpenMeteoCollector(),
      imd: new IMDCollector(),
      weatherUnion: new WeatherUnionCollector(),
      ksndmc: new KSNDMCCollector(),
      openAQ: new OpenAQCollector(),
      googleAQI: new GoogleAQICollector(),
      urbanEmission: new UrbanEmissionCollector(),
      openCity: new OpenCityCollector()
    };

    logger.info('MasterCollector initialized with 8 data sources');
  }

  /**
   * Collect data from all sources for all cities
   * @returns {Promise<Object>} Collection results
   */
  async collectAllData() {
    logger.info('🔄 Starting data collection from all sources...');
    
    const results = {
      totalCities: CITIES.length,
      successfulCities: 0,
      failedCities: 0,
      totalRecords: 0,
      errors: []
    };

    for (const city of CITIES) {
      try {
        const cityResults = await this.collectCityData(city);
        
        if (cityResults.recordsStored > 0) {
          results.successfulCities++;
          results.totalRecords += cityResults.recordsStored;
          logger.success(`✓ ${city.name}: ${cityResults.recordsStored} records from ${cityResults.sources.join(', ')}`);
        } else {
          results.failedCities++;
          logger.warn(`⚠ ${city.name}: No data collected`);
        }

      } catch (error) {
        results.failedCities++;
        results.errors.push({ city: city.name, error: error.message });
        logger.error(`✖ ${city.name}:`, error.message);
      }
    }

    logger.info(`✅ Collection complete: ${results.successfulCities}/${results.totalCities} cities, ${results.totalRecords} total records`);
    
    return results;
  }

  /**
   * Collect data from all sources for a single city
   * @param {Object} city - City object with id, name, lat, lng
   * @returns {Promise<Object>} Collection results for city
   */
  async collectCityData(city) {
    const { id, name, lat, lng } = city;
    
    logger.debug(`Collecting data for ${name}...`);

    // Call all collectors in parallel using Promise.allSettled
    const collectionPromises = [
      this._collectFromSource('openMeteo', lat, lng, name),
      this._collectFromSource('imd', lat, lng, name),
      this._collectFromSource('weatherUnion', lat, lng, name),
      this._collectFromSource('ksndmc', lat, lng, name),
      this._collectFromSource('openAQ', lat, lng, name),
      this._collectFromSource('googleAQI', lat, lng, name),
      this._collectFromSource('urbanEmission', lat, lng, name),
      this._collectFromSource('openCity', lat, lng, name)
    ];

    const results = await Promise.allSettled(collectionPromises);

    // Process results and store in database
    const storedRecords = await this._storeResults(id, name, results);

    return {
      cityId: id,
      cityName: name,
      recordsStored: storedRecords.length,
      sources: storedRecords.map(r => r.sourceApi)
    };
  }

  /**
   * Collect data from a single source
   * @param {string} collectorName - Name of collector
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} cityName - City name
   * @returns {Promise<Object>} Collected data
   */
  async _collectFromSource(collectorName, lat, lng, cityName) {
    const collector = this.collectors[collectorName];
    
    try {
      // Try to fetch both weather and air quality data
      const weatherPromise = collector.fetchWeatherData(lat, lng, cityName);
      const aqPromise = collector.fetchAirQualityData(lat, lng, cityName);

      const [weatherData, aqData] = await Promise.all([weatherPromise, aqPromise]);

      // Merge data if both available
      if (weatherData && aqData) {
        return {
          ...weatherData,
          ...aqData,
          sourceApi: collector.name
        };
      } else if (weatherData) {
        return weatherData;
      } else if (aqData) {
        return aqData;
      }

      return null;

    } catch (error) {
      logger.debug(`${collector.name} collection failed for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Store collection results in database
   * @param {string} cityId - City ID
   * @param {string} cityName - City name
   * @param {Array} results - Promise.allSettled results
   * @returns {Promise<Array>} Stored records
   */
  async _storeResults(cityId, cityName, results) {
    const storedRecords = [];
    const timestamp = new Date();

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        
        try {
          // Create a new document for each API source
          const record = await RealtimeData.create({
            cityId: cityId,
            cityName: cityName,
            timestamp: timestamp,
            
            // Weather data
            temperature: data.temperature ? {
              current: data.temperature,
              feelsLike: data.feelsLike,
              min: data.min,
              max: data.max
            } : undefined,
            
            humidity: data.humidity,
            pressure: data.pressure,
            windSpeed: data.windSpeed,
            windDirection: data.windDirection,
            windGusts: data.windGusts,
            visibility: data.visibility,
            cloudCover: data.cloudCover,
            
            // Precipitation
            rainfall: data.rainfall,
            snowfall: data.snowfall,
            precipitation: data.precipitation,
            
            // Air Quality
            aqi: data.aqi,
            pm25: data.pm25,
            pm10: data.pm10,
            no2: data.no2,
            o3: data.o3,
            so2: data.so2,
            co: data.co,
            uvIndex: data.uvIndex,
            
            // Data source tracking
            dataSources: {
              temperature: data.sourceApi,
              aqi: data.sourceApi,
              airQuality: data.sourceApi
            },
            
            // Quality metrics
            dataQualityScore: data.qualityScore ? data.qualityScore * 100 : 85,
            
            lastUpdated: timestamp
          });

          storedRecords.push({
            sourceApi: data.sourceApi,
            recordId: record._id
          });

        } catch (error) {
          logger.error(`Failed to store ${data.sourceApi} data for ${cityName}:`, error.message);
        }
      }
    }

    return storedRecords;
  }

  /**
   * Get collection statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      const stats = await RealtimeData.aggregate([
        {
          $group: {
            _id: '$dataSources.temperature',
            count: { $sum: 1 },
            avgQuality: { $avg: '$dataQualityScore' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return {
        totalRecords: await RealtimeData.countDocuments(),
        bySource: stats,
        lastUpdate: await RealtimeData.findOne().sort({ timestamp: -1 }).select('timestamp')
      };

    } catch (error) {
      logger.error('Failed to get statistics:', error.message);
      return null;
    }
  }
}

module.exports = MasterCollector;
