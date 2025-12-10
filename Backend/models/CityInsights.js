const mongoose = require('mongoose');

const cityInsightsSchema = new mongoose.Schema({
  cityId: {
    type: String,
    required: true,
    index: true
  },
  cityName: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format for daily caching
    required: true,
    index: true
  },
  insights: [{
    type: {
      type: String,
      enum: ['trend', 'alert', 'record'],
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: String,
      required: true
    },
    source: {
      type: String,
      default: 'OpenAI'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for efficient daily lookups
cityInsightsSchema.index({ cityName: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CityInsights', cityInsightsSchema);
