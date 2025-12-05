/**
 * Seed script to populate CityInsights collection with realistic climate-based insights
 * Run with: node Backend/scripts/seedInsights.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CityInsights = require('../models/CityInsights');
const { CITIES } = require('../config/constants');

// Climate patterns for Indian cities by month
const CLIMATE_PATTERNS = {
  // Winter months (Dec-Feb)
  12: { season: 'Winter', tempRange: 'cool', aqiTrend: 'high', rainfall: 'minimal' },
  1: { season: 'Winter', tempRange: 'cool', aqiTrend: 'high', rainfall: 'minimal' },
  2: { season: 'Late Winter', tempRange: 'mild', aqiTrend: 'moderate', rainfall: 'low' },
  // Summer months (Mar-May)
  3: { season: 'Early Summer', tempRange: 'warm', aqiTrend: 'moderate', rainfall: 'low' },
  4: { season: 'Summer', tempRange: 'hot', aqiTrend: 'moderate', rainfall: 'low' },
  5: { season: 'Peak Summer', tempRange: 'very hot', aqiTrend: 'moderate', rainfall: 'pre-monsoon' },
  // Monsoon months (Jun-Sep)
  6: { season: 'Monsoon', tempRange: 'moderate', aqiTrend: 'good', rainfall: 'heavy' },
  7: { season: 'Peak Monsoon', tempRange: 'moderate', aqiTrend: 'good', rainfall: 'very heavy' },
  8: { season: 'Monsoon', tempRange: 'moderate', aqiTrend: 'good', rainfall: 'heavy' },
  9: { season: 'Late Monsoon', tempRange: 'moderate', aqiTrend: 'good', rainfall: 'moderate' },
  // Post-monsoon (Oct-Nov)
  10: { season: 'Post-Monsoon', tempRange: 'pleasant', aqiTrend: 'moderate', rainfall: 'low' },
  11: { season: 'Early Winter', tempRange: 'cool', aqiTrend: 'rising', rainfall: 'minimal' }
};

const generateInsightsForCity = (city, month) => {
  const pattern = CLIMATE_PATTERNS[month];
  const monthName = new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
  
  const insights = [];
  
  // 1. TREND INSIGHT
  const trendMessages = {
    'Winter': `${monthName} temperatures in ${city.name} remain stable with cool mornings and pleasant afternoons.`,
    'Summer': `${monthName} brings rising temperatures to ${city.name} with typical summer heat patterns.`,
    'Monsoon': `${monthName} monsoon activity in ${city.name} shows consistent rainfall patterns this season.`,
    'Post-Monsoon': `${monthName} weather in ${city.name} transitions to pleasant conditions with clear skies.`
  };
  
  insights.push({
    insightType: 'trend',
    severity: 'info',
    message: trendMessages[pattern.season] || `Weather patterns in ${city.name} are typical for ${monthName}.`,
    timestamp: 'Trend',
    source: 'Climate Data'
  });
  
  // 2. ALERT INSIGHT (varies by season and AQI trend)
  let alertMessage = `No severe weather alerts. Conditions are within normal limits for ${monthName}.`;
  let alertSeverity = 'info';
  
  if (pattern.aqiTrend === 'high' && (month === 12 || month === 1)) {
    alertMessage = `Winter AQI levels elevated in ${city.name}. Sensitive groups should limit outdoor exposure.`;
    alertSeverity = 'warning';
  } else if (pattern.tempRange === 'very hot') {
    alertMessage = `High temperatures expected in ${monthName}. Stay hydrated and avoid midday sun.`;
    alertSeverity = 'warning';
  } else if (pattern.rainfall === 'very heavy') {
    alertMessage = `Heavy monsoon rainfall expected. Monitor local weather updates for ${city.name}.`;
    alertSeverity = 'warning';
  }
  
  insights.push({
    insightType: 'alert',
    severity: alertSeverity,
    message: alertMessage,
    timestamp: 'Status',
    source: 'Climate Data'
  });
  
  // 3. RECORD INSIGHT
  const recordMessages = {
    'cool': `Typical ${monthName} conditions with temperatures ranging 15-25°C.`,
    'mild': `Pleasant ${monthName} weather with moderate temperatures around 20-28°C.`,
    'warm': `Warm ${monthName} conditions with temperatures reaching 28-35°C.`,
    'hot': `Hot ${monthName} weather with daytime highs around 35-40°C.`,
    'very hot': `Peak summer heat in ${monthName} with temperatures often exceeding 40°C.`,
    'moderate': `Moderate ${monthName} temperatures around 25-30°C with high humidity.`,
    'pleasant': `Pleasant ${monthName} weather with comfortable temperatures 20-28°C.`
  };
  
  insights.push({
    insightType: 'record',
    severity: 'info',
    message: recordMessages[pattern.tempRange] || `Current conditions are typical for ${monthName} in ${city.name}.`,
    timestamp: 'Observations',
    source: 'Climate Data'
  });
  
  // 4. TYPICAL COMPARISON INSIGHT
  const typicalMessages = {
    'Winter': `Today's weather aligns with typical ${monthName} patterns: cool mornings, mild afternoons.`,
    'Summer': `Current conditions match typical ${monthName} summer weather for ${city.name}.`,
    'Monsoon': `Weather is consistent with ${monthName} monsoon expectations for this region.`,
    'Post-Monsoon': `Conditions reflect typical post-monsoon ${monthName} weather patterns.`
  };
  
  insights.push({
    insightType: 'trend',
    severity: 'info',
    message: typicalMessages[pattern.season] || `Today's weather is consistent with typical ${monthName} patterns for ${city.name}.`,
    timestamp: 'vs Typical',
    source: 'Climate Data'
  });
  
  return insights;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting CityInsights seed process...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Clear existing insights
    const deleteResult = await CityInsights.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing insights\n`);
    
    let totalInserted = 0;
    
    // Generate insights for each city and month
    for (const city of CITIES) {
      console.log(`📍 Processing ${city.name}...`);
      
      for (let month = 1; month <= 12; month++) {
        const insights = generateInsightsForCity(city, month);
        
        const cityInsight = new CityInsights({
          cityId: city.id,
          cityName: city.name,
          month: month,
          insights: insights
        });
        
        await cityInsight.save();
        totalInserted++;
      }
      
      console.log(`   ✓ Generated 12 months of insights for ${city.name}`);
    }
    
    console.log(`\n✅ Seed complete! Inserted ${totalInserted} insight sets (${CITIES.length} cities × 12 months)`);
    console.log(`📊 Total insights generated: ${totalInserted * 4}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
