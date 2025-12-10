const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  state: String,
  country: {
    type: String,
    default: 'India'
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  timezone: String,
  population: Number,
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for case-insensitive name searches
citySchema.index({ name: 1 });

module.exports = mongoose.model('City', citySchema);
