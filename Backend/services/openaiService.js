const OpenAI = require('openai');
const logger = require('../utils/logger');

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (!openai) {
  logger.warn('⚠️ OPENAI_API_KEY not configured - AI insights will use fallback messages');
} else {
  logger.info('✅ OpenAI initialized successfully');
}

/**
 * Generate trend insight using OpenAI
 */
const generateTrendInsight = async (cityName, trendData) => {
  if (!openai) {
    throw new Error('OpenAI API key not configured.');
  }

  try {
    const prompt = `Analyze weather trend for ${cityName}, India:
- Temperature: ${trendData.temperatureTrend || 'stable'}, change ${trendData.temperatureChange || 0}°C
- AQI trend: ${trendData.aqiTrend || 'stable'}

Provide brief insight (max 15 words) about practical implications.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.7
    });

    const message = completion.choices[0].message.content.trim();

    return {
      type: 'trend',
      severity: 'info',
      message,
      timestamp: 'AI Analysis',
      source: 'ChatGPT'
    };
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('OpenAI quota exceeded. Upgrade your plan at platform.openai.com');
    } else if (error.response?.status === 401) {
      throw new Error('OpenAI API key invalid. Check your OPENAI_API_KEY in .env');
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
};

/**
 * Generate record insights (2 insights: vs Typical + Historical)
 */
const generateRecordInsight = async (cityName, currentData, historicalData) => {
  if (!openai) {
    throw new Error('OpenAI API key not configured.');
  }

  try {
    const prompt = `For ${cityName}, India:
Current: ${currentData.temperature || 'N/A'}°C, AQI ${currentData.aqi || 'N/A'}
Typical: ${historicalData?.avgTemp || 'N/A'}°C, AQI ${historicalData?.avgAqi || 'N/A'}

Provide 2 insights separated by '|':
1. Comparison with typical (15 words)
2. Historical context (15 words)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 80,
      temperature: 0.7
    });

    const text = completion.choices[0].message.content.trim();
    const [typical, historical] = text.split('|').map(s => s.trim());

    // Return array of 2 insights
    return [
      {
        type: 'record',
        severity: 'info',
        message: typical || 'Analyzing typical patterns',
        timestamp: 'vs Typical',
        source: 'ChatGPT'
      },
      {
        type: 'record',
        severity: 'info',
        message: historical || `Current: ${currentData.temperature}°C, AQI ${currentData.aqi}`,
        timestamp: 'Historical',
        source: 'ChatGPT'
      }
    ];
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('OpenAI quota exceeded. Upgrade your plan at platform.openai.com');
    } else if (error.response?.status === 401) {
      throw new Error('OpenAI API key invalid. Check your OPENAI_API_KEY in .env');
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
};

/**
 * Generate alert insight
 */
const generateAlertInsight = async (cityName, currentData) => {
  if (!openai) {
    throw new Error('OpenAI API key not configured.');
  }

  try {
    const aqi = currentData?.aqi || 0;
    const temp = currentData?.temperature || 0;
    
    const prompt = `Weather alert for ${cityName}:
- Temperature: ${temp}°C
- AQI: ${aqi}

Provide brief alert/advisory (max 12 words). Be actionable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 40,
      temperature: 0.7
    });

    const message = completion.choices[0].message.content.trim();

    // Determine severity
    let severity = 'info';
    if (aqi > 150 || temp > 38) severity = 'critical';
    else if (aqi > 100 || temp > 35) severity = 'warning';

    return {
      type: 'alert',
      severity,
      message,
      timestamp: 'Live',
      source: 'ChatGPT'
    };
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('OpenAI quota exceeded. Upgrade your plan at platform.openai.com');
    } else if (error.response?.status === 401) {
      throw new Error('OpenAI API key invalid. Check your OPENAI_API_KEY in .env');
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
};

/**
 * Generate all insights (1 trend + 2 records + 1 alert = 4 total)
 */
const generateAllInsights = async (cityName, weatherData) => {
  const insights = [];

  try {
    // Trend
    const trendData = {
      temperatureTrend: weatherData.trends?.temperature || 'stable',
      temperatureChange: weatherData.trends?.tempChange || 0,
      aqiTrend: weatherData.trends?.aqi || 'stable'
    };
    insights.push(await generateTrendInsight(cityName, trendData));

    // Records (2 insights)
    const currentData = {
      temperature: weatherData.current?.temperature,
      aqi: weatherData.current?.aqi
    };
    const historicalData = {
      avgTemp: weatherData.historical?.avgTemp,
      avgAqi: weatherData.historical?.avgAqi
    };
    const recordInsights = await generateRecordInsight(cityName, currentData, historicalData);
    insights.push(...recordInsights);

    // Alert
    insights.push(await generateAlertInsight(cityName, weatherData.current));

    return insights;

  } catch (error) {
    logger.error('Error generating insights:', error.message);
    throw error; // Re-throw to controller
  }
};

/**
 * Generate analysis insight
 */
const generateAnalysisInsight = async (data) => {
  return {
    type: 'trend',
    severity: 'info',
    message: 'Analysis functionality coming soon',
    timestamp: 'Analysis',
    source: 'ChatGPT'
  };
};

module.exports = {
  generateTrendInsight,
  generateRecordInsight,
  generateAlertInsight,
  generateAllInsights,
  generateAnalysisInsight
};

