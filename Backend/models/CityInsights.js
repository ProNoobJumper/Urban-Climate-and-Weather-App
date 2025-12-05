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
  month: {
    type: Number, // 1-12
    required: true,
    min: 1,
    max: 12
  },
  insights: [{
    insightType: {
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
      default: 'Database'
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

// Compound index for efficient lookups
cityInsightsSchema.index({ cityId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('CityInsights', cityInsightsSchema);
