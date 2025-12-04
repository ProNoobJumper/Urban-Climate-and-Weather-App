const mongoose = require('mongoose');

const historicalDataSchema = new mongoose.Schema({
  cityId: {
    type: String,
    required: true,
    index: true
  },
  cityName: String,
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Daily Aggregates
  avgTemperature: Number,
  maxTemperature: Number,
  minTemperature: Number,
  avgHumidity: Number,
  totalRainfall: Number,
  avgWindSpeed: Number,
  
  // Air Quality Averages
  avgAqi: Number,
  avgPm25: Number,
  avgPm10: Number,
  avgNo2: Number,
  avgO3: Number,
  avgSo2: Number,
  avgCo: Number,
  
  // Data Completeness
  dataCompleteness: Number,  // percentage of expected data received
  
  // Source info
  sources: [String],
  
  // Records (is this a record day?)
  isHottestDay: Boolean,
  isColdestDay: Boolean,
  isWettestDay: Boolean,
  isDriestDay: Boolean,
  isHighestAqiDay: Boolean,
  
  granularity: {
    type: String,
    enum: ['hourly', 'daily', 'monthly', 'yearly'],
    default: 'daily'
  }
}, { timestamps: true });

historicalDataSchema.index({ cityId: 1, date: -1 });

module.exports = mongoose.model('HistoricalData', historicalDataSchema);