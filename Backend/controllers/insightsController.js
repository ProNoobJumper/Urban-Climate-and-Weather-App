/**
 * Insights Controller
 * Handles AI-powered insights generation using OpenAI API
 * With MongoDB caching for daily insights
 */

const openaiService = require('../services/openaiService');
const logger = require('../utils/logger');
const CityInsights = require('../models/CityInsights');

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

    // Check MongoDB for cached insights (daily cache)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const cachedInsights = await CityInsights.findOne({
      cityName: cityName,
      date: today
    });

    if (cachedInsights && cachedInsights.insights.length > 0) {
      logger.info(`✅ Using cached insights from DB for ${cityName} (${cachedInsights.insights.length} insights)`);
      return res.status(200).json({
        success: true,
        city: cityName,
        insights: cachedInsights.insights,
        timestamp: new Date().toISOString(),
        cached: true,
        source: 'MongoDB'
      });
    }

    // No cache found - generate fresh insights via OpenAI
    logger.info(`🔄 Generating fresh insights for ${cityName} (not in cache)`);

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

    // Generate new insights using OpenAI
    const insights = await openaiService.generateAllInsights(cityName, weatherData);

    // Filter out fallback/system insights - only show AI-generated ones
    const aiInsights = insights.filter(insight => 
      insight.source !== 'System' && insight.source !== 'Database'
    );

    // Add source to each insight (for frontend badges)
    const finalInsights = (aiInsights.length > 0 ? aiInsights : insights).map(insight => ({
      ...insight,
      source: insight.source || 'ChatGPT'  // Ensure each insight has source field
    }));

    // Save to MongoDB for future requests (upsert)
    try {
      await CityInsights.findOneAndUpdate(
        { cityName: cityName, date: today },
        {
          cityName: cityName,
          cityId: cityName.toLowerCase().replace(/\s+/g, '-'),
          date: today,
          insights: finalInsights,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      logger.info(`💾 Saved ${finalInsights.length} insights to DB for ${cityName}`);
    } catch (dbError) {
      logger.error(`Failed to save insights to DB: ${dbError.message}`);
      // Continue anyway - don't fail the request if DB save fails
    }

    logger.info(`Generated ${insights.length} insights for ${cityName} (${aiInsights.length} AI-generated)`);

    res.status(200).json({
      success: true,
      city: cityName,
      insights: finalInsights,
      timestamp: new Date().toISOString(),
      cached: false,
      source: 'OpenAI'
    });

  } catch (error) {
    logger.error(`Failed to generate insights for ${cityName}:`, error.message);
    
    // Return error state to frontend instead of fallback insights
    return res.status(503).json({
      success: false,
      error: error.message || 'OpenAI API unavailable',
      city: cityName,
      timestamp: new Date().toISOString()
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

    const analysis = await openaiService.generateAnalysisInsight(
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

    const insight = await openaiService.generateTrendInsight(cityName, trendData || {});

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
