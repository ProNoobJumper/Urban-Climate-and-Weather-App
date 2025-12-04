# Urban Climate Backend - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Configure Environment

Create/update `.env` file:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/climate-db
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# Optional API Keys (system works without them)
WEATHER_UNION_API_KEY=your_key_here
GOOGLE_AQI_API_KEY=your_key_here

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. Import Historical Data (Optional but Recommended)

```bash
# This will import 2020-2023 data for all cities (~11,000 records)
# Takes about 5-10 minutes
node scripts/importHistoricalData.js
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

---

## 📊 Data Collection

### Automatic Collection

The server automatically:

- Fetches real-time data from all 8 APIs **every hour**
- Generates predictions **daily at midnight**

### Manual Collection

```bash
# Trigger immediate data collection
curl -X POST http://localhost:5000/api/data/collect

# Generate predictions now
curl -X POST http://localhost:5000/api/data/predict
```

---

## 🧪 Testing the Backend

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "Backend Running ✅",
  "timestamp": "2025-12-03T05:46:54.000Z",
  "uptime": 42.5
}
```

### 2. Test Authentication

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "fullName": "Test User",
    "userType": "researcher"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 3. Test Data Endpoints

```bash
# Get real-time data for Bangalore
curl http://localhost:5000/api/data/realtime/bangalore

# Get historical trends
curl "http://localhost:5000/api/analytics/trends?cityId=bangalore&days=30&metric=temperature"

# Get heatmap
curl "http://localhost:5000/api/analytics/heatmap?metric=aqi"

# Get correlation
curl "http://localhost:5000/api/analytics/correlation?cityId=bangalore&metric1=temperature&metric2=aqi&days=30"
```

---

## 📁 Project Structure

```
Backend/
├── config/                 # Configuration files
│   ├── database.js        # MongoDB connection
│   └── constants.js       # Cities and constants
├── dataCollectors/        # 8 API collectors
│   ├── openMeteoCollector.js
│   ├── imdCollector.js
│   ├── weatherUnionCollector.js
│   ├── ksndmcCollector.js
│   ├── openAQCollector.js
│   ├── googleAQICollector.js
│   ├── urbanEmissionCollector.js
│   ├── openCityCollector.js
│   └── masterCollector.js
├── models/                # MongoDB schemas
│   ├── User.js
│   ├── City.js
│   ├── RealtimeData.js
│   ├── HistoricalData.js
│   ├── PredictedData.js
│   └── ResearchUpload.js
├── controllers/           # Route controllers
│   ├── authController.js
│   ├── dataController.js
│   ├── researchController.js
│   └── analyticsController.js
├── routes/               # API routes
│   ├── auth.js
│   ├── data.js
│   ├── research.js
│   └── analytics.js
├── services/             # Business logic
│   ├── apiAggregation.js
│   ├── dataProcessor.js
│   ├── predictionEngine.js
│   └── cacheManager.js
├── middleware/           # Express middleware
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── jobs/                 # Scheduled jobs
│   ├── fetchDataJob.js
│   └── predictionJob.js
├── utils/                # Utilities
│   ├── logger.js
│   └── helpers.js
├── scripts/              # Maintenance scripts
│   └── importHistoricalData.js
└── server.js             # Entry point
```

---

## 🔍 Monitoring Data Collection

### Check Logs

The logger provides color-coded output:

- 🔵 **INFO** - General information
- 🟢 **SUCCESS** - Successful operations
- 🟡 **WARN** - Warnings (e.g., API unavailable)
- 🔴 **ERROR** - Errors
- 🟣 **DEBUG** - Debug information (only in development)

### Database Verification

```javascript
// Connect to MongoDB and check data

// Count real-time records by source
db.realtimedata.aggregate([
  {
    $group: {
      _id: "$dataSources.temperature",
      count: { $sum: 1 },
    },
  },
  { $sort: { count: -1 } },
]);

// Check latest data for each city
db.realtimedata.aggregate([
  { $sort: { timestamp: -1 } },
  {
    $group: {
      _id: "$cityId",
      latestTimestamp: { $first: "$timestamp" },
      source: { $first: "$dataSources.temperature" },
      temperature: { $first: "$temperature.current" },
      aqi: { $first: "$aqi" },
    },
  },
]);

// Historical data coverage
db.historicaldata.aggregate([
  {
    $group: {
      _id: "$cityId",
      count: { $sum: 1 },
      minDate: { $min: "$date" },
      maxDate: { $max: "$date" },
    },
  },
]);

// Predictions
db.predicteddata
  .find({
    predictionDate: { $gte: new Date() },
  })
  .sort({ predictionDate: 1 })
  .limit(10);
```

---

## 🐛 Troubleshooting

### Issue: No data being collected

**Solution:**

1. Check if scheduled jobs are running (look for logs)
2. Manually trigger collection: `curl -X POST http://localhost:5000/api/data/collect`
3. Check individual collectors in logs for errors

### Issue: Some APIs returning null

**Solution:**

- This is normal! Not all APIs work for all cities
- The system is designed to work with partial data
- Check if API keys are configured (for WeatherUnion, Google AQI)

### Issue: Historical import fails

**Solution:**

1. Check internet connection
2. Verify MongoDB connection
3. Run with smaller date range if needed
4. Check Open-Meteo API status

### Issue: Predictions are missing

**Solution:**

1. Ensure historical data exists (run import script)
2. Check prediction job logs
3. Manually trigger: `node -e "require('./jobs/predictionJob').generateDailyPredictions()"`

---

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update profile (requires auth)
- `GET /api/auth/roles` - Get available roles

### Data Endpoints

- `GET /api/data/realtime/:cityId` - Latest real-time data
- `GET /api/data/historical/:cityId` - Historical data
- `GET /api/data/predictions/:cityId` - Predictions

### Analytics Endpoints

- `GET /api/analytics/trends?cityId=X&days=30&metric=temperature`
- `GET /api/analytics/heatmap?metric=aqi&date=2025-12-03`
- `GET /api/analytics/correlation?cityId=X&metric1=temp&metric2=aqi`
- `GET /api/analytics/compare?cityIds=bangalore,mumbai&metric=aqi`

### Research Endpoints

- `POST /api/research/upload` - Upload research data (requires auth)
- `GET /api/research/verified` - Get verified research
- `GET /api/research/my/uploads` - Get my uploads (requires auth)
- `GET /api/research/:id` - Get upload details
- `GET /api/research/:id/download` - Download file
- `PUT /api/research/:id/verify` - Verify upload (admin only)

---

## 🎯 Next Steps

1. **Frontend Integration**: Connect your React/Vue frontend to these APIs
2. **Add More Cities**: Update `config/constants.js` to add more cities
3. **Custom Alerts**: Implement alert system for high AQI levels
4. **Data Export**: Add CSV/Excel export functionality
5. **Visualization**: Create charts and graphs using the analytics endpoints

---

## 📞 Support

For issues or questions:

1. Check the walkthrough documentation
2. Review the implementation plan
3. Check server logs for detailed error messages
4. Verify environment variables are set correctly

**Happy Coding! 🚀**
