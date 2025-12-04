/**
 * Historical Data Import Script
 * Downloads and imports historical weather data from Open-Meteo Historical API
 * Run manually: node scripts/importHistoricalData.js
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const HistoricalData = require('../models/HistoricalData');
const { CITIES } = require('../config/constants');
const logger = require('../utils/logger');
const { chunkArray } = require('../utils/helpers');

// Configuration
const CONFIG = {
  startYear: 2020,
  endYear: 2023,
  batchSize: 1000, // Records per batch insert
  delayBetweenCities: 2000 // 2 seconds delay between cities to avoid rate limiting
};

/**
 * Main import function
 */
const importHistoricalData = async () => {
  try {
    logger.info('📊 Starting historical data import...');
    logger.info(`   Period: ${CONFIG.startYear}-${CONFIG.endYear}`);
    logger.info(`   Cities: ${CITIES.length}`);
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.success('✓ Connected to MongoDB');

    const stats = {
      totalCities: CITIES.length,
      successfulCities: 0,
      failedCities: 0,
      totalRecords: 0,
      errors: []
    };

    for (const city of CITIES) {
      try {
        logger.info(`\n📍 Processing ${city.name}...`);
        
        const records = await fetchHistoricalData(city);
        
        if (records && records.length > 0) {
          await storeHistoricalData(city.id, city.name, records);
          stats.successfulCities++;
          stats.totalRecords += records.length;
          logger.success(`✓ ${city.name}: ${records.length} records imported`);
        } else {
          stats.failedCities++;
          logger.warn(`⚠ ${city.name}: No data fetched`);
        }

        // Delay between cities
        if (CITIES.indexOf(city) < CITIES.length - 1) {
          await sleep(CONFIG.delayBetweenCities);
        }

      } catch (error) {
        stats.failedCities++;
        stats.errors.push({ city: city.name, error: error.message });
        logger.error(`✖ ${city.name}:`, error.message);
      }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 IMPORT SUMMARY');
    logger.info('='.repeat(60));
    logger.success(`✓ Successful cities: ${stats.successfulCities}/${stats.totalCities}`);
    logger.info(`📝 Total records imported: ${stats.totalRecords.toLocaleString()}`);
    
    if (stats.failedCities > 0) {
      logger.warn(`⚠ Failed cities: ${stats.failedCities}`);
      stats.errors.forEach(err => {
        logger.error(`   - ${err.city}: ${err.error}`);
      });
    }
    
    logger.info('='.repeat(60));

    // Close database connection
    await mongoose.connection.close();
    logger.success('✓ Database connection closed');
    
    process.exit(0);

  } catch (error) {
    logger.error('❌ Import failed:', error.message);
    process.exit(1);
  }
};

/**
 * Fetch historical data from Open-Meteo API
 * @param {Object} city - City object
 * @returns {Array} Historical records
 */
const fetchHistoricalData = async (city) => {
  try {
    const startDate = `${CONFIG.startYear}-01-01`;
    const endDate = `${CONFIG.endYear}-12-31`;

    logger.info(`   Fetching data from ${startDate} to ${endDate}...`);

    const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
      params: {
        latitude: city.lat,
        longitude: city.lng,
        start_date: startDate,
        end_date: endDate,
        daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,pressure_msl_mean',
        timezone: 'auto'
      },
      timeout: 30000 // 30 seconds
    });

    const daily = response.data.daily;
    const records = [];

    for (let i = 0; i < daily.time.length; i++) {
      records.push({
        date: new Date(daily.time[i]),
        avgTemperature: roundTo(daily.temperature_2m_mean[i], 1),
        maxTemperature: roundTo(daily.temperature_2m_max[i], 1),
        minTemperature: roundTo(daily.temperature_2m_min[i], 1),
        avgHumidity: Math.round(daily.relative_humidity_2m_mean[i]),
        precipitation: roundTo(daily.precipitation_sum[i], 1),
        rainfall: roundTo(daily.rain_sum[i], 1),
        snowfall: roundTo(daily.snowfall_sum[i], 1),
        maxWindSpeed: roundTo(daily.wind_speed_10m_max[i], 1),
        avgPressure: roundTo(daily.pressure_msl_mean[i], 1)
      });
    }

    logger.info(`   ✓ Fetched ${records.length} daily records`);
    
    return records;

  } catch (error) {
    logger.error(`   Error fetching data: ${error.message}`);
    throw error;
  }
};

/**
 * Store historical data in database
 * @param {string} cityId - City ID
 * @param {string} cityName - City name
 * @param {Array} records - Historical records
 */
const storeHistoricalData = async (cityId, cityName, records) => {
  try {
    logger.info(`   Storing ${records.length} records...`);

    // Delete existing data for this city and period
    const deleteResult = await HistoricalData.deleteMany({
      cityId: cityId,
      date: {
        $gte: new Date(`${CONFIG.startYear}-01-01`),
        $lte: new Date(`${CONFIG.endYear}-12-31`)
      }
    });

    if (deleteResult.deletedCount > 0) {
      logger.info(`   ✓ Deleted ${deleteResult.deletedCount} existing records`);
    }

    // Prepare documents
    const documents = records.map(record => ({
      cityId: cityId,
      cityName: cityName,
      date: record.date,
      avgTemperature: record.avgTemperature,
      maxTemperature: record.maxTemperature,
      minTemperature: record.minTemperature,
      avgHumidity: record.avgHumidity,
      avgPm25: null, // Not available in historical API
      avgPm10: null,
      avgAqi: null,
      precipitation: record.precipitation,
      rainfall: record.rainfall,
      snowfall: record.snowfall,
      maxWindSpeed: record.maxWindSpeed,
      avgPressure: record.avgPressure,
      dataCompleteness: 100,
      sources: ['OpenMeteo Historical'],
      granularity: 'daily'
    }));

    // Insert in batches
    const batches = chunkArray(documents, CONFIG.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      await HistoricalData.insertMany(batches[i], { ordered: false });
      logger.info(`   ✓ Batch ${i + 1}/${batches.length} inserted (${batches[i].length} records)`);
    }

    logger.success(`   ✓ All records stored successfully`);

  } catch (error) {
    logger.error(`   Error storing data: ${error.message}`);
    throw error;
  }
};

/**
 * Round number to decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
const roundTo = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * Sleep function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Run import if executed directly
if (require.main === module) {
  importHistoricalData();
}

module.exports = {
  importHistoricalData,
  fetchHistoricalData,
  storeHistoricalData
};
