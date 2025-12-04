/**
 * Prediction Job
 * Generates daily predictions using real forecast data from APIs
 * Runs daily at midnight
 */

const axios = require('axios');
const PredictedData = require('../models/PredictedData');
const HistoricalData = require('../models/HistoricalData');
const { CITIES } = require('../config/constants');
const logger = require('../utils/logger');
const { generateSimplePrediction } = require('../services/predictionEngine');

/**
 * Generate daily predictions for all cities
 */
const generateDailyPredictions = async () => {
  try {
    logger.info('🔮 Starting daily prediction generation...');
    
    const results = {
      totalCities: CITIES.length,
      successfulCities: 0,
      failedCities: 0,
      totalPredictions: 0
    };

    for (const city of CITIES) {
      try {
        // Fetch 7-day forecast from Open-Meteo
        const forecast = await fetchOpenMeteoForecast(city.lat, city.lng, city.name);
        
        if (forecast && forecast.length > 0) {
          // Store predictions
          await storePredictions(city.id, city.name, forecast, 'OpenMeteo');
          results.successfulCities++;
          results.totalPredictions += forecast.length;
          logger.success(`✓ ${city.name}: ${forecast.length} predictions stored`);
        } else {
          // Fallback: Generate predictions from historical data
          const historicalPredictions = await generateFromHistorical(city.id, city.name);
          
          if (historicalPredictions && historicalPredictions.length > 0) {
            await storePredictions(city.id, city.name, historicalPredictions, 'Historical');
            results.successfulCities++;
            results.totalPredictions += historicalPredictions.length;
            logger.warn(`⚠ ${city.name}: Using historical predictions (${historicalPredictions.length})`);
          } else {
            results.failedCities++;
            logger.error(`✖ ${city.name}: No predictions generated`);
          }
        }

      } catch (error) {
        results.failedCities++;
        logger.error(`✖ ${city.name}:`, error.message);
      }
    }

    logger.info(`✅ Prediction generation complete: ${results.successfulCities}/${results.totalCities} cities, ${results.totalPredictions} predictions`);
    
    return results;

  } catch (error) {
    logger.error('❌ Prediction generation failed:', error.message);
    throw error;
  }
};

/**
 * Fetch 7-day forecast from Open-Meteo API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} cityName - City name
 * @returns {Array} Forecast data
 */
const fetchOpenMeteoForecast = async (lat, lng, cityName) => {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lng,
        daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean',
        timezone: 'auto',
        forecast_days: 7
      },
      timeout: 10000
    });

    const daily = response.data.daily;
    const forecasts = [];

    for (let i = 0; i < daily.time.length; i++) {
      forecasts.push({
        date: new Date(daily.time[i]),
        temperature: {
          max: Math.round(daily.temperature_2m_max[i] * 10) / 10,
          min: Math.round(daily.temperature_2m_min[i] * 10) / 10,
          avg: Math.round(daily.temperature_2m_mean[i] * 10) / 10
        },
        humidity: Math.round(daily.relative_humidity_2m_mean[i]),
        precipitation: Math.round(daily.precipitation_sum[i] * 10) / 10,
        rainfall: Math.round(daily.rain_sum[i] * 10) / 10,
        precipitationProbability: daily.precipitation_probability_max[i],
        windSpeed: Math.round(daily.wind_speed_10m_max[i] * 10) / 10,
        confidence: 0.85 - (i * 0.05) // Decreases with days ahead
      });
    }

    logger.debug(`Fetched ${forecasts.length}-day forecast for ${cityName} from OpenMeteo`);
    
    return forecasts;

  } catch (error) {
    logger.error(`OpenMeteo forecast error for ${cityName}:`, error.message);
    return null;
  }
};

/**
 * Generate predictions from historical data
 * @param {string} cityId - City ID
 * @param {string} cityName - City name
 * @returns {Array} Predictions
 */
const generateFromHistorical = async (cityId, cityName) => {
  try {
    // Fetch last 30 days of historical data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const historicalData = await HistoricalData.find({
      cityId: cityId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .lean();

    if (historicalData.length < 7) {
      logger.warn(`Insufficient historical data for ${cityName}`);
      return null;
    }

    // Generate predictions using prediction engine
    const predictions = generateSimplePrediction(historicalData, 7);

    logger.debug(`Generated ${predictions.length} predictions from historical data for ${cityName}`);
    
    return predictions.map(p => ({
      date: p.date,
      temperature: {
        avg: p.temperature,
        max: p.temperature + 3,
        min: p.temperature - 3
      },
      humidity: p.humidity,
      pm25: p.pm25,
      aqi: p.aqi,
      confidence: p.confidence
    }));

  } catch (error) {
    logger.error(`Historical prediction error for ${cityName}:`, error.message);
    return null;
  }
};

/**
 * Store predictions in database
 * @param {string} cityId - City ID
 * @param {string} cityName - City name
 * @param {Array} forecasts - Forecast data
 * @param {string} source - Data source
 */
const storePredictions = async (cityId, cityName, forecasts, source) => {
  try {
    const predictions = forecasts.map(forecast => ({
      cityId: cityId,
      cityName: cityName,
      predictionDate: forecast.date,
      generatedAt: new Date(),
      
      temperature: {
        predicted: forecast.temperature.avg,
        min: forecast.temperature.min,
        max: forecast.temperature.max
      },
      
      humidity: forecast.humidity,
      precipitation: forecast.precipitation || 0,
      rainfall: forecast.rainfall || 0,
      windSpeed: forecast.windSpeed || null,
      
      pm25: forecast.pm25 || null,
      aqi: forecast.aqi || null,
      
      source_api: source,
      confidence: forecast.confidence || 0.75,
      
      metadata: {
        precipitationProbability: forecast.precipitationProbability || null,
        generationMethod: source === 'OpenMeteo' ? 'api_forecast' : 'historical_prediction'
      }
    }));

    // Delete old predictions for this city
    await PredictedData.deleteMany({
      cityId: cityId,
      predictionDate: { $gte: new Date() }
    });

    // Insert new predictions
    await PredictedData.insertMany(predictions);

    logger.debug(`Stored ${predictions.length} predictions for ${cityName}`);

  } catch (error) {
    logger.error(`Error storing predictions for ${cityName}:`, error.message);
    throw error;
  }
};

module.exports = {
  generateDailyPredictions,
  fetchOpenMeteoForecast,
  generateFromHistorical
};