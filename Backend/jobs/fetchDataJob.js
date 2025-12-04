const RealtimeData = require('../models/RealtimeData');
const HistoricalData = require('../models/HistoricalData');
const { aggregateRealTimeData, calculateAQI } = require('../services/apiAggregation');
const { CITIES } = require('../config/constants');

// Fetch real-time data every hour
const fetchRealTimeData = async () => {
  try {
    await aggregateRealTimeData();
    console.log('✅ Real-time data fetch completed');
  } catch (error) {
    console.error('❌ Real-time fetch error:', error);
  }
};

// Create daily aggregates from hourly data
const aggregateHistoricalData = async () => {
  try {
    console.log('📊 Aggregating historical data...');
    
    for (const city of CITIES) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get hourly data for today
      const hourlyData = await RealtimeData.find({
        cityId: city.id,
        timestamp: { $gte: today, $lt: tomorrow }
      });
      
      if (hourlyData.length === 0) continue;
      
      // Calculate averages
      const avgTemp = hourlyData.reduce((sum, d) => sum + (d.temperature?.current || 0), 0) / hourlyData.length;
      const maxTemp = Math.max(...hourlyData.map(d => d.temperature?.max || 0));
      const minTemp = Math.min(...hourlyData.map(d => d.temperature?.min || 0));
      const avgHumidity = hourlyData.reduce((sum, d) => sum + (d.humidity || 0), 0) / hourlyData.length;
      const avgPm25 = hourlyData.reduce((sum, d) => sum + (d.pm25 || 0), 0) / hourlyData.length;
      const avgAqi = calculateAQI(avgPm25);
      
      // Save daily aggregate
      await HistoricalData.create({
        cityId: city.id,
        cityName: city.name,
        date: today,
        avgTemperature: Math.round(avgTemp * 10) / 10,
        maxTemperature: Math.round(maxTemp * 10) / 10,
        minTemperature: Math.round(minTemp * 10) / 10,
        avgHumidity: Math.round(avgHumidity),
        avgPm25: Math.round(avgPm25 * 10) / 10,
        avgAqi: Math.round(avgAqi),
        dataCompleteness: Math.round((hourlyData.length / 24) * 100),
        sources: ['OpenWeatherMap', 'OpenAQ'],
        granularity: 'daily'
      });
      
      console.log(`✅ Historical data saved for ${city.name}`);
    }
    
    console.log('✅ Historical data aggregation complete');
  } catch (error) {
    console.error('❌ Historical aggregation error:', error);
  }
};

module.exports = { fetchRealTimeData, aggregateHistoricalData };