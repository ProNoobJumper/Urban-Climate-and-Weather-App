/**
 * Prediction Engine Service
 * Generates predictions, evaluates forecast accuracy, and selects best forecasts
 */

const HistoricalData = require('../models/HistoricalData');
const PredictedData = require('../models/PredictedData');
const logger = require('../utils/logger');
const { roundTo } = require('../utils/helpers');

/**
 * Generate simple prediction using moving average
 * @param {Array} historicalData - Array of historical data points
 * @param {number} daysAhead - Number of days to predict
 * @returns {Array} Predicted values
 */
const generateSimplePrediction = (historicalData, daysAhead = 7) => {
  try {
    if (!historicalData || historicalData.length < 7) {
      logger.warn('Insufficient historical data for prediction');
      return [];
    }

    // Sort by date
    const sorted = historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Use last 30 days for trend calculation
    const recentData = sorted.slice(-30);
    
    const predictions = [];
    
    for (let i = 1; i <= daysAhead; i++) {
      const predictionDate = new Date();
      predictionDate.setDate(predictionDate.getDate() + i);
      predictionDate.setHours(0, 0, 0, 0);

      // Calculate weighted moving average (recent data has more weight)
      const tempPrediction = _weightedMovingAverage(
        recentData.map(d => d.avgTemperature).filter(t => t != null),
        i
      );

      const humidityPrediction = _weightedMovingAverage(
        recentData.map(d => d.avgHumidity).filter(h => h != null),
        i
      );

      const pm25Prediction = _weightedMovingAverage(
        recentData.map(d => d.avgPm25).filter(p => p != null),
        i
      );

      predictions.push({
        date: predictionDate,
        temperature: roundTo(tempPrediction, 1),
        humidity: roundTo(humidityPrediction, 0),
        pm25: roundTo(pm25Prediction, 1),
        aqi: _calculateAQI(pm25Prediction),
        confidence: roundTo(Math.max(0.5, 1 - (i * 0.05)), 2) // Decreases with days ahead
      });
    }

    logger.debug(`Generated ${predictions.length} predictions`);
    
    return predictions;

  } catch (error) {
    logger.error('Error generating predictions:', error.message);
    return [];
  }
};

/**
 * Evaluate forecast accuracy using RMSE and MAE
 * @param {Array} predicted - Predicted values
 * @param {Array} actual - Actual values
 * @returns {Object} Accuracy metrics
 */
const evaluateForecastAccuracy = (predicted, actual) => {
  try {
    if (!predicted || !actual || predicted.length !== actual.length) {
      logger.warn('Invalid data for accuracy evaluation');
      return null;
    }

    if (predicted.length === 0) {
      return null;
    }

    // Calculate errors
    const errors = predicted.map((pred, i) => {
      return {
        predicted: pred,
        actual: actual[i],
        error: pred - actual[i],
        absError: Math.abs(pred - actual[i]),
        squaredError: Math.pow(pred - actual[i], 2)
      };
    });

    // Calculate metrics
    const mae = _average(errors.map(e => e.absError)); // Mean Absolute Error
    const rmse = Math.sqrt(_average(errors.map(e => e.squaredError))); // Root Mean Squared Error
    const mape = _average(errors.map(e => Math.abs(e.error / e.actual) * 100)); // Mean Absolute Percentage Error

    // Calculate R-squared
    const actualMean = _average(actual);
    const totalSS = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSS = errors.reduce((sum, e) => sum + e.squaredError, 0);
    const rSquared = 1 - (residualSS / totalSS);

    const metrics = {
      mae: roundTo(mae, 2),
      rmse: roundTo(rmse, 2),
      mape: roundTo(mape, 2),
      rSquared: roundTo(rSquared, 3),
      sampleSize: predicted.length,
      accuracy: roundTo(Math.max(0, 100 - mape), 1) // Percentage accuracy
    };

    logger.debug(`Forecast accuracy: MAE=${metrics.mae}, RMSE=${metrics.rmse}, R²=${metrics.rSquared}`);
    
    return metrics;

  } catch (error) {
    logger.error('Error evaluating forecast accuracy:', error.message);
    return null;
  }
};

/**
 * Select best forecast from multiple API sources
 * @param {Array} forecasts - Array of forecast objects with source and predictions
 * @param {Array} actualData - Actual historical data for validation
 * @returns {Object} Best forecast
 */
const selectBestForecast = (forecasts, actualData = null) => {
  try {
    if (!forecasts || forecasts.length === 0) {
      logger.warn('No forecasts to select from');
      return null;
    }

    // If only one forecast, return it
    if (forecasts.length === 1) {
      return forecasts[0];
    }

    // If we have actual data, evaluate accuracy
    if (actualData && actualData.length > 0) {
      const evaluatedForecasts = forecasts.map(forecast => {
        const predicted = forecast.predictions.map(p => p.temperature);
        const actual = actualData.slice(0, predicted.length).map(a => a.avgTemperature);
        
        const accuracy = evaluateForecastAccuracy(predicted, actual);
        
        return {
          ...forecast,
          accuracy: accuracy
        };
      });

      // Sort by RMSE (lower is better)
      evaluatedForecasts.sort((a, b) => {
        if (!a.accuracy) return 1;
        if (!b.accuracy) return -1;
        return a.accuracy.rmse - b.accuracy.rmse;
      });

      logger.info(`Best forecast: ${evaluatedForecasts[0].source} (RMSE: ${evaluatedForecasts[0].accuracy?.rmse})`);
      
      return evaluatedForecasts[0];
    }

    // Without actual data, prioritize by source reliability
    const sourcePriority = {
      'OpenMeteo': 1,
      'IMD': 2,
      'WeatherUnion': 3,
      'GoogleAQI': 4,
      'OpenAQ': 5,
      'KSNDMC': 6,
      'UrbanEmission': 7,
      'OpenCity': 8
    };

    forecasts.sort((a, b) => {
      const priorityA = sourcePriority[a.source] || 99;
      const priorityB = sourcePriority[b.source] || 99;
      return priorityA - priorityB;
    });

    logger.info(`Selected forecast: ${forecasts[0].source} (by priority)`);
    
    return forecasts[0];

  } catch (error) {
    logger.error('Error selecting best forecast:', error.message);
    return forecasts[0] || null;
  }
};

/**
 * Calculate trend direction and strength
 * @param {Array} values - Array of values
 * @returns {Object} Trend info
 */
const calculateTrend = (values) => {
  try {
    if (!values || values.length < 2) {
      return { direction: 'stable', strength: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = values;

    const xMean = _average(xValues);
    const yMean = _average(yValues);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }

    const slope = numerator / denominator;
    
    // Determine direction and strength
    let direction = 'stable';
    if (slope > 0.1) direction = 'increasing';
    else if (slope < -0.1) direction = 'decreasing';

    const strength = Math.min(Math.abs(slope), 1);

    return {
      direction: direction,
      strength: roundTo(strength, 2),
      slope: roundTo(slope, 3)
    };

  } catch (error) {
    logger.error('Error calculating trend:', error.message);
    return { direction: 'stable', strength: 0 };
  }
};

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Calculate weighted moving average
 * @private
 */
const _weightedMovingAverage = (values, daysAhead) => {
  if (!values || values.length === 0) return 0;

  // More recent values get higher weights
  const weights = values.map((_, i) => i + 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const weightedSum = values.reduce((sum, val, i) => sum + (val * weights[i]), 0);
  const wma = weightedSum / totalWeight;

  // Add slight trend adjustment based on days ahead
  const trend = calculateTrend(values);
  const trendAdjustment = trend.slope * daysAhead * 0.5;

  return wma + trendAdjustment;
};

/**
 * Calculate average
 * @private
 */
const _average = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculate AQI from PM2.5
 * @private
 */
const _calculateAQI = (pm25) => {
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
};

module.exports = {
  generateSimplePrediction,
  evaluateForecastAccuracy,
  selectBestForecast,
  calculateTrend
};
