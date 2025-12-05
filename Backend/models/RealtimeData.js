const mongoose = require('mongoose');

const realtimeDataSchema = new mongoose.Schema({
  cityId: {
    type: String,
    required: true,
    index: true
  },
  cityName: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Weather Data
  temperature: {
    current: Number,
    feelsLike: Number,
    min: Number,
    max: Number
  },
  
  humidity: Number,
  pressure: Number,
  windSpeed: Number,
  windDirection: String,
  visibility: Number,
  dewPoint: Number,
  uvIndex: Number,
  cloudCover: Number,
  
  // Precipitation
  rainfall: Number,
  snowfall: Number,
  precipitationProbability: Number,
  
  // Air Quality
  aqi: Number,
  pm25: Number,
  pm10: Number,
  no2: Number,
  o3: Number,
  so2: Number,
  co: Number,
  
  // Data Sources (track which API provided which metric)
  dataSources: {
    temperature: String,      // e.g., "OpenWeatherMap"
    aqi: String,
    airQuality: String
  },
  
  // Quality Metrics
  dataQualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 85
  },
  
  
  alerts: [{
    type: { type: String },
    level: { type: String },
    message: { type: String }
  }],
  
  lastUpdated: Date
}, { timestamps: true });

// Index for efficient querying
realtimeDataSchema.index({ cityId: 1, timestamp: -1 });

module.exports = mongoose.model('RealtimeData', realtimeDataSchema);