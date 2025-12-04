const mongoose = require('mongoose');

const predictedDataSchema = new mongoose.Schema({
  cityId: {
    type: String,
    required: true,
    index: true
  },
  cityName: String,
  forecastDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Hourly or Daily predictions
  predictions: [{
    hour: Number,           // 0-23 for hourly
    predictedTemperature: Number,
    predictedHumidity: Number,
    predictedAqi: Number,
    predictedPm25: Number,
    precipitationChance: Number,
    confidenceScore: Number  // 0-1
  }],
  
  // Daily summary
  dayHighTemp: Number,
  dayLowTemp: Number,
  dayAvgAqi: Number,
  
  // Forecast source
  model: String,  // "ML_Model_v1", "OpenWeatherMap", etc.
  accuracy: Number,  // % accuracy on past predictions
  generatedAt: Date,
  validTill: Date
  
}, { timestamps: true });

predictedDataSchema.index({ cityId: 1, forecastDate: -1 });

module.exports = mongoose.model('PredictedData', predictedDataSchema);