const mongoose = require('mongoose');

const researchUploadSchema = new mongoose.Schema({
  researcherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  cityId: {
    type: String,
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  
  description: String,
  
  dataType: {
    type: String,
    enum: ['weather_station', 'pollution_monitoring', 'soil_data', 'vegetation', 'other'],
    required: true
  },
  
  filePath: {
    type: String,
    required: true
  },
  
  fileName: String,
  fileSize: Number,
  
  metadata: {
    measurementLocation: String,
    equipment: String,
    methodology: String,
    startDate: Date,
    endDate: Date,
    granularity: String  // hourly, daily, monthly
  },
  
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  
  verifiedBy: mongoose.Schema.Types.ObjectId,
  verificationComment: String,
  
  isPublic: {
    type: Boolean,
    default: false
  },
  
  doi: String,  // Digital Object Identifier for research
  citations: Number,
  downloads: Number,
  
  uploadedAt: {
    type: Date,
    default: Date.now
  }
  
}, { timestamps: true });

module.exports = mongoose.model('ResearchUpload', researchUploadSchema);