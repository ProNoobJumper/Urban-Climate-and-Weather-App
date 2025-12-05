const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const schedule = require('node-schedule');

// Import routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const researchRoutes = require('./routes/research');
const analyticsRoutes = require('./routes/analytics');
const insightsRoutes = require('./routes/insights');

// Import jobs
const { fetchRealTimeData, aggregateHistoricalData } = require('./jobs/fetchDataJob');
const { generateDailyPredictions } = require('./jobs/predictionJob');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Passport
require('./config/passport');

const app = express();

// MIDDLEWARE
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/insights', insightsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Backend Running ✅',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// ERROR HANDLING
app.use(errorHandler);

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB Connected');
  
  // START SCHEDULED JOBS
  
  // Every hour: Fetch real-time data
  schedule.scheduleJob('0 * * * *', async () => {
    console.log('🔄 Running real-time data fetch...');
    await fetchRealTimeData();
  });
  
  // Every day at midnight: Generate predictions
  schedule.scheduleJob('0 0 * * *', async () => {
    console.log('🔮 Generating daily predictions...');
    await generateDailyPredictions();
  });
  
  // On startup: Fetch data immediately
  fetchRealTimeData().catch(err => console.error('Initial fetch error:', err));
  
}).catch(err => console.error('❌ MongoDB Connection Error:', err));

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;