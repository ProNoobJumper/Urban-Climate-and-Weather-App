/**
 * Analytics Controller
 * Handles data analytics, trends, heatmaps, and correlations
 */

const RealtimeData = require('../models/RealtimeData');
const HistoricalData = require('../models/HistoricalData');
const logger = require('../utils/logger');
const { getDateRange } = require('../utils/helpers');
const { getCachedData, setCachedData } = require('../services/cacheManager');

/**
 * Get historical trends for a city
 * @route GET /api/analytics/trends
 */
const getTrends = async (req, res) => {
  try {
    const { cityId, days = 30, metric = 'temperature' } = req.query;
    
    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: 'City ID is required'
      });
    }
    
    // Check cache
    const cacheKey = `trends:${cityId}:${days}:${metric}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    const { startDate, endDate } = getDateRange(parseInt(days));
    
    // Fetch historical data
    const data = await HistoricalData.find({
      cityId: cityId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .lean();
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for specified period'
      });
    }
    
    // Extract trend data based on metric
    const trendData = data.map(d => ({
      date: d.date,
      value: _getMetricValue(d, metric),
      cityId: d.cityId,
      cityName: d.cityName
    }));
    
    // Calculate statistics
    const values = trendData.map(d => d.value).filter(v => v != null);
    const stats = {
      average: _average(values),
      min: Math.min(...values),
      max: Math.max(...values),
      trend: _calculateTrend(values),
      dataPoints: values.length
    };
    
    const result = {
      cityId: cityId,
      metric: metric,
      period: { startDate, endDate, days: parseInt(days) },
      data: trendData,
      statistics: stats
    };
    
    // Cache for 1 hour
    setCachedData(cacheKey, result, 3600);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Get trends error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get heatmap data for multiple cities
 * @route GET /api/analytics/heatmap
 */
const getHeatmap = async (req, res) => {
  try {
    const { metric = 'aqi', date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    // Check cache
    const cacheKey = `heatmap:${metric}:${targetDate.toISOString().split('T')[0]}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    // Fetch latest data for all cities
    const data = await RealtimeData.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
            $lte: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: '$cityId',
          cityName: { $first: '$cityName' },
          avgValue: { $avg: `$${metric}` },
          maxValue: { $max: `$${metric}` },
          minValue: { $min: `$${metric}` },
          dataPoints: { $sum: 1 }
        }
      },
      {
        $sort: { avgValue: -1 }
      }
    ]);
    
    const heatmapData = data.map(d => ({
      cityId: d._id,
      cityName: d.cityName,
      value: Math.round(d.avgValue * 10) / 10,
      max: Math.round(d.maxValue * 10) / 10,
      min: Math.round(d.minValue * 10) / 10,
      category: _getCategoryForMetric(metric, d.avgValue),
      dataPoints: d.dataPoints
    }));
    
    const result = {
      metric: metric,
      date: targetDate,
      cities: heatmapData,
      summary: {
        totalCities: heatmapData.length,
        avgValue: _average(heatmapData.map(d => d.value)),
        highestCity: heatmapData[0],
        lowestCity: heatmapData[heatmapData.length - 1]
      }
    };
    
    // Cache for 30 minutes
    setCachedData(cacheKey, result, 1800);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Get heatmap error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get correlation analysis between metrics
 * @route GET /api/analytics/correlation
 */
const getCorrelation = async (req, res) => {
  try {
    const { cityId, metric1 = 'temperature', metric2 = 'aqi', days = 30 } = req.query;
    
    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: 'City ID is required'
      });
    }
    
    // Check cache
    const cacheKey = `correlation:${cityId}:${metric1}:${metric2}:${days}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    const { startDate, endDate } = getDateRange(parseInt(days));
    
    // Fetch historical data
    const data = await HistoricalData.find({
      cityId: cityId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .lean();
    
    if (data.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient data for correlation analysis (minimum 10 data points required)'
      });
    }
    
    // Extract metric values
    const values1 = data.map(d => _getMetricValue(d, metric1)).filter(v => v != null);
    const values2 = data.map(d => _getMetricValue(d, metric2)).filter(v => v != null);
    
    if (values1.length !== values2.length) {
      return res.status(400).json({
        success: false,
        message: 'Metrics have different data availability'
      });
    }
    
    // Calculate Pearson correlation coefficient
    const correlation = _calculateCorrelation(values1, values2);
    
    // Prepare scatter plot data
    const scatterData = data.map(d => ({
      date: d.date,
      x: _getMetricValue(d, metric1),
      y: _getMetricValue(d, metric2)
    })).filter(d => d.x != null && d.y != null);
    
    const result = {
      cityId: cityId,
      metric1: metric1,
      metric2: metric2,
      period: { startDate, endDate, days: parseInt(days) },
      correlation: {
        coefficient: correlation,
        strength: _getCorrelationStrength(correlation),
        direction: correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'none'
      },
      scatterData: scatterData,
      dataPoints: scatterData.length
    };
    
    // Cache for 1 hour
    setCachedData(cacheKey, result, 3600);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Get correlation error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get comparative analysis across cities
 * @route GET /api/analytics/compare
 */
const compareСities = async (req, res) => {
  try {
    const { cityIds, metric = 'aqi', days = 7 } = req.query;
    
    if (!cityIds) {
      return res.status(400).json({
        success: false,
        message: 'City IDs are required (comma-separated)'
      });
    }
    
    const cityIdArray = cityIds.split(',').map(id => id.trim());
    
    if (cityIdArray.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 cities are required for comparison'
      });
    }
    
    const { startDate, endDate } = getDateRange(parseInt(days));
    
    // Fetch data for all cities
    const comparisons = await Promise.all(
      cityIdArray.map(async (cityId) => {
        const data = await HistoricalData.find({
          cityId: cityId,
          date: { $gte: startDate, $lte: endDate }
        })
        .sort({ date: 1 })
        .lean();
        
        const values = data.map(d => _getMetricValue(d, metric)).filter(v => v != null);
        
        return {
          cityId: cityId,
          cityName: data[0]?.cityName || cityId,
          average: _average(values),
          min: Math.min(...values),
          max: Math.max(...values),
          trend: _calculateTrend(values),
          dataPoints: values.length,
          timeSeries: data.map(d => ({
            date: d.date,
            value: _getMetricValue(d, metric)
          }))
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        metric: metric,
        period: { startDate, endDate, days: parseInt(days) },
        cities: comparisons
      }
    });
    
  } catch (error) {
    logger.error('Compare cities error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Get metric value from data object
 * @private
 */
const _getMetricValue = (data, metric) => {
  const metricMap = {
    'temperature': data.avgTemperature,
    'humidity': data.avgHumidity,
    'aqi': data.avgAqi,
    'pm25': data.avgPm25,
    'pm10': data.avgPm10
  };
  
  return metricMap[metric] || null;
};

/**
 * Calculate average
 * @private
 */
const _average = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10;
};

/**
 * Calculate trend
 * @private
 */
const _calculateTrend = (values) => {
  if (!values || values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const avgFirst = _average(firstHalf);
  const avgSecond = _average(secondHalf);
  
  const change = ((avgSecond - avgFirst) / avgFirst) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
};

/**
 * Calculate Pearson correlation coefficient
 * @private
 */
const _calculateCorrelation = (x, y) => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return Math.round((numerator / denominator) * 1000) / 1000;
};

/**
 * Get correlation strength description
 * @private
 */
const _getCorrelationStrength = (r) => {
  const abs = Math.abs(r);
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'very weak';
};

/**
 * Get category for metric value
 * @private
 */
const _getCategoryForMetric = (metric, value) => {
  if (metric === 'aqi') {
    if (value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive';
    if (value <= 200) return 'Unhealthy';
    if (value <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }
  
  if (metric === 'temperature') {
    if (value < 10) return 'Cold';
    if (value < 20) return 'Cool';
    if (value < 30) return 'Warm';
    return 'Hot';
  }
  
  return 'Normal';
};

module.exports = {
  getTrends,
  getHeatmap,
  getCorrelation,
  compareСities
};
