/**
 * @param {Object} trendData - Historical trend data
 * @returns {Promise<Object>} Generated trend insight
 */
const generateTrendInsight = async (cityName, trendData) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not configured, using fallback insight');
      return generateFallbackTrendInsight(cityName, trendData);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze this weather trend data for ${cityName}, India and provide a brief, insightful observation (max 2 sentences):

Temperature trend: ${trendData.temperatureTrend || 'stable'}
Temperature change: ${trendData.temperatureChange || 0}°C over ${trendData.period || '7 days'}
Humidity average: ${trendData.avgHumidity || 'N/A'}%
AQI trend: ${trendData.aqiTrend || 'stable'}
Current AQI: ${trendData.currentAqi || 'N/A'}

Focus on practical implications for residents. Be concise and informative.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info(`Generated Gemini trend insight for ${cityName}`);

    return {
      type: 'trend',
      severity: 'info',
      message: text.trim(),
      timestamp: 'AI Analysis',
      source: 'Gemini AI'
    };

  } catch (error) {
    logger.error('Gemini trend insight error:', error.message);
    return generateFallbackTrendInsight(cityName, trendData);
  }
};

/**
 * Generate record/historical insight using Gemini AI
 * @param {string} cityName - Name of the city
 * @param {Object} currentData - Current weather data
 * @param {Object} historicalData - Historical comparison data
 * @returns {Promise<Object>} Generated record insight
 */
const generateRecordInsight = async (cityName, currentData, historicalData) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY is missing or empty');
      return [generateFallbackRecordInsight(cityName, currentData)];
    } else {
      logger.info('GEMINI_API_KEY is present, attempting generation...');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    const prompt = `Analyze weather for ${cityName}, India (${currentMonth}).
Data:
- Current: ${currentData.temperature || 'N/A'}°C, AQI ${currentData.aqi || 'N/A'}
- Typical for ${currentMonth}: ${historicalData?.avgTemp ? `Avg Temp ${historicalData.avgTemp}°C, Avg AQI ${historicalData.avgAqi}` : 'Not provided (Use your general climate knowledge)'}
- All-time Records: ${historicalData?.recordHigh ? `High ${historicalData.recordHigh}°C, Low ${historicalData.recordLow}°C` : 'Not provided'}

Provide 2 distinct insights separated by a pipe character "|":
1. Compare today vs typical ${currentMonth} weather. If data is missing, use your knowledge of ${cityName}'s climate (e.g., "Today is warmer than usual for December").
2. Compare today vs records. If record data is missing, mention if this seems extreme or simply state "No historical records available".

Keep each insight under 15 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const [typicalText, recordText] = text.split('|').map(t => t.trim());

    const insights = [];
    
    if (typicalText) {
      insights.push({
        type: 'trend', // Using trend icon for comparison
        severity: 'info',
        message: typicalText,
        timestamp: 'vs Typical',
        source: 'Gemini AI'
      });
    }

    if (recordText) {
      insights.push({
        type: 'record',
        severity: 'info',
        message: recordText,
        timestamp: 'Historical',
        source: 'Gemini AI'
      });
    }

    return insights;

  } catch (error) {
    logger.error('Gemini API failed, trying DB fallback:', error.message);
    
    // Try to get insights from database
    try {
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const dbInsights = await CityInsights.findOne({ 
        cityName: cityName, 
        month: currentMonth 
      });
      
      if (dbInsights && dbInsights.insights && dbInsights.insights.length >= 4) {
        logger.info(`Using DB insights for ${cityName}`);
        // Map insightType to type for frontend compatibility
        return dbInsights.insights.slice(0, 4).map(insight => ({
          type: insight.insightType,
          severity: insight.severity,
          message: insight.message,
          timestamp: insight.timestamp,
          source: insight.source || 'Database'
        }));
      }
    } catch (dbError) {
      logger.error('DB fallback failed:', dbError.message);
    }
    
    // Final fallback to generated insights
    logger.warn('Using generated fallback insights');
    return [generateFallbackRecordInsight(cityName, currentData)];
  }
};

/**
 * Generate analysis insight for graphs/charts using Gemini AI
 * @param {string} cityName - Name of the city
 * @param {string} chartType - Type of chart being analyzed
 * @param {Object} chartData - Data being displayed in the chart
 * @returns {Promise<Object>} Generated analysis insight
 */
const generateAnalysisInsight = async (cityName, chartType, chartData) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not configured, using fallback insight');
      return generateFallbackAnalysisInsight(chartType);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Provide a brief analysis interpretation (max 2 sentences) for a ${chartType} chart showing:

City: ${cityName}, India
Metric: ${chartData.metric || 'weather data'}
Time range: ${chartData.timeRange || 'recent'}
Data sources: ${chartData.sources?.join(', ') || 'multiple sources'}
Notable pattern: ${chartData.pattern || 'standard variation'}

Explain what the visualization reveals in practical terms.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info(`Generated Gemini analysis insight for ${cityName} ${chartType}`);

    return {
      text: text.trim(),
      source: 'Gemini AI'
    };

  } catch (error) {
    logger.error('Gemini analysis insight error:', error.message);
    return generateFallbackAnalysisInsight(chartType);
  }
};

/**
 * Generate comprehensive insights for a city
 * @param {string} cityName - Name of the city
 * @param {Object} weatherData - All available weather data
 * @returns {Promise<Array>} Array of insights
 */
const generateAllInsights = async (cityName, weatherData) => {
  const insights = [];

  try {
    // Generate trend insight
    const trendData = {
      temperatureTrend: weatherData.trends?.temperature || 'stable',
      temperatureChange: weatherData.trends?.tempChange || 0,
      period: weatherData.trends?.period || '7 days',
      avgHumidity: weatherData.current?.humidity,
      aqiTrend: weatherData.trends?.aqi || 'stable',
      currentAqi: weatherData.current?.aqi
    };
    const trendInsight = await generateTrendInsight(cityName, trendData);
    insights.push(trendInsight);

    // Generate record insight
    const currentData = {
      temperature: weatherData.current?.temperature,
      aqi: weatherData.current?.aqi,
      humidity: weatherData.current?.humidity
    };
    const historicalData = {
      avgTemp: weatherData.historical?.avgTemp,
      avgAqi: weatherData.historical?.avgAqi
    };
    // Generate record/comparison insights
    const recordInsights = await generateRecordInsight(cityName, currentData, historicalData);
    insights.push(...recordInsights);

    // Add alert if needed
    if (weatherData.current?.aqi > 150) {
      insights.push({
        type: 'alert',
        severity: 'critical',
        message: `Air quality is unhealthy (AQI: ${weatherData.current.aqi}). Limit outdoor activities.`,
        timestamp: 'Live'
      });
    } else if (weatherData.current?.aqi > 100) {
      insights.push({
        type: 'alert',
        severity: 'warning',
        message: `Air quality is moderate (AQI: ${weatherData.current.aqi}). Sensitive groups should take precautions.`,
        timestamp: 'Live'
      });
    }

    return insights;

  } catch (error) {
    logger.error('Error generating insights:', error.message);
    return generateFallbackInsights(cityName, weatherData);
  }
};

// ========== FALLBACK FUNCTIONS ==========

const generateFallbackTrendInsight = (cityName, trendData) => {
  const trend = trendData.temperatureTrend || 'stable';
  const change = trendData.temperatureChange || 0;
  
  let message = `Temperature in ${cityName} has remained ${trend} over the past week.`;
  if (Math.abs(change) > 2) {
    message = `Temperature in ${cityName} has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}°C over the past week.`;
  }
  
  return {
    type: 'trend',
    severity: 'info',
    message,
    timestamp: 'System'
  };
};

const generateFallbackRecordInsight = (cityName, currentData) => {
  const temp = currentData.temperature || 'N/A';
  const aqi = currentData.aqi || 'N/A';
  
  return [
    {
      type: 'trend',
      severity: 'info',
      message: `Typical weather for this time of year is being calculated.`,
      timestamp: 'vs Typical',
      source: 'System'
    },
    {
      type: 'record',
      severity: 'info',
      message: `Current conditions: ${temp}°C, AQI ${aqi}.`,
      timestamp: 'Historical',
      source: 'System'
    }
  ];
};

const generateFallbackAnalysisInsight = (chartType) => {
  const messages = {
    'scatter': 'Points clustered along a diagonal indicate strong correlation. Scattered points suggest weak or no relationship.',
    'line': 'Trend lines show how the metric has changed over time. Divergence between sources may indicate measurement differences.',
    'comparison': 'Solid lines represent the main city, dashed lines show the comparison city. Notice similarities and differences in patterns.'
  };
  
  return {
    text: messages[chartType] || 'This visualization shows the relationship between selected metrics over time.',
    source: 'System'
  };
};

const generateFallbackInsights = (cityName, weatherData) => {
  const insights = [];
  
  insights.push(generateFallbackTrendInsight(cityName, weatherData.trends || {}));
  insights.push(...generateFallbackRecordInsight(cityName, weatherData.current || {}));
  
  if (weatherData.current?.aqi > 100) {
    insights.push({
      type: 'alert',
      severity: 'warning',
      message: `Air quality in ${cityName} requires attention.`,
      timestamp: 'Live'
    });
  }
  
  return insights;
};

module.exports = {
  generateTrendInsight,
  generateRecordInsight,
  generateAnalysisInsight,
  generateAllInsights
};
