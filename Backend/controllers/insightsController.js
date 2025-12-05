/**
 * Insights Controller
 * Handles AI-powered insights generation using Gemini API
 */

const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

/**
 * Get all insights for a city
 * @route GET /api/insights/:cityName
 */
const getInsights = async (req, res) => {
  try {
    const { cityName } = req.params;
    
    if (!cityName) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    // Build weather data object from query params or use defaults
    const weatherData = {
      current: {
        temperature: parseFloat(req.query.temp) || null,
        humidity: parseFloat(req.query.humidity) || null,
        aqi: parseFloat(req.query.aqi) || null
      },
      trends: {
        temperature: req.query.tempTrend || 'stable',
        tempChange: parseFloat(req.query.tempChange) || 0,
        aqi: req.query.aqiTrend || 'stable',
        period: req.query.period || '7 days'
      },
      historical: {
        avgTemp: parseFloat(req.query.histAvgTemp) || null,
        avgAqi: parseFloat(req.query.histAvgAqi) || null,
        recordHigh: parseFloat(req.query.recordHigh) || null,
        recordLow: parseFloat(req.query.recordLow) || null
      }
    };

    const insights = await geminiService.generateAllInsights(cityName, weatherData);

    logger.info(`Generated ${insights.length} insights for ${cityName}`);

    res.status(200).json({
      success: true,
      city: cityName,
      insights: insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get insights error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate chart/graph analysis
 * @route POST /api/insights/analyze
 */
const analyzeChart = async (req, res) => {
  try {
    const { cityName, chartType, chartData } = req.body;
    
    if (!cityName || !chartType) {
      return res.status(400).json({
        success: false,
        message: 'City name and chart type are required'
      });
    }

    const analysis = await geminiService.generateAnalysisInsight(
      cityName,
      chartType,
      chartData || {}
    );

    logger.info(`Generated analysis for ${cityName} ${chartType} chart`);

    res.status(200).json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Analyze chart error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate trend insight
 * @route POST /api/insights/trend
 */
const getTrendInsight = async (req, res) => {
  try {
    const { cityName, trendData } = req.body;
    
    if (!cityName) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    const insight = await geminiService.generateTrendInsight(cityName, trendData || {});

    res.status(200).json({
      success: true,
      insight: insight,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get trend insight error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getInsights,
  analyzeChart,
  getTrendInsight
};
