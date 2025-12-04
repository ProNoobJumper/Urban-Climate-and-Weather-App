# Urban Climate Frontend - Backend Integration Guide

## 🎯 Overview

Your frontend now integrates with the backend's 8 API data sources while maintaining:

- **Windy.com** for interactive maps
- **Open-Meteo fallback** if backend is unavailable
- **Existing UI components** (no breaking changes)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure Environment

The `.env` file has been created with:

```env
VITE_API_URL=http://localhost:5000/api
VITE_ENABLE_BACKEND=true
VITE_WINDY_API_KEY=YOUR_WINDY_API_KEY_HERE
```

**Get a Windy API Key:**

1. Go to https://api.windy.com/keys
2. Register for a free API key
3. Replace `YOUR_WINDY_API_KEY_HERE` in `.env`

### 3. Start Backend (Required)

```bash
cd ../Backend
npm run dev
```

Backend should be running on `http://localhost:5000`

### 4. Start Frontend

```bash
cd ../Frontend
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## 📊 How It Works

### Data Flow

```
User searches city
    ↓
Frontend weatherService.ts
    ↓
Try Backend First (8 APIs aggregated)
    ├─ Success → Use backend data
    └─ Fail → Fallback to Open-Meteo
    ↓
Display in UI components
```

### Backend Integration

The `weatherService.ts` now:

1. **Tries backend first** (`/api/data/current?city=Mumbai`)
2. **Gets data from 8 sources**:

   - OpenMeteo
   - IMD (India Meteorological Department)
   - WeatherUnion
   - KSNDMC (Karnataka State)
   - OpenAQ
   - Google AQI
   - UrbanEmission
   - OpenCity

3. **Falls back to Open-Meteo** if backend unavailable

### Configuration Modes

**Backend Mode** (`.env`):

```env
VITE_ENABLE_BACKEND=true
```

- Uses backend for all data
- Shows 8 different sources in SourceMatrix
- Real historical data from database
- Real 7-day forecasts

**Fallback Mode**:

```env
VITE_ENABLE_BACKEND=false
```

- Uses Open-Meteo directly
- Simulates multi-source variance
- Works offline (no backend needed)

---

## 🗺️ Map Integration (Windy)

The `MapWidget.tsx` uses **Windy.com** for:

- Temperature overlays
- Rain/precipitation radar
- Air quality visualization
- Interactive weather layers

**No changes needed** - just add your API key to `.env`

---

## 🧪 Testing

### 1. Test Backend Connection

```bash
# Open browser DevTools → Network tab
# Search for a city (e.g., "Mumbai")
# You should see:
GET http://localhost:5000/api/data/current?city=Mumbai
Status: 200 OK
```

### 2. Verify Multi-Source Data

In the **SourceMatrix** component, you should see:

- Multiple sources (IMD, KSNDMC, WeatherUnion, etc.)
- Different values for each source (not identical)
- Government badge on IMD/KSNDMC

### 3. Check Historical Data

- Switch to different time scales (12h, 24h, 7d, 30d)
- Data should come from backend database
- Check console for: `✅ Using backend data (8 APIs aggregated)`

### 4. Test Fallback

```bash
# Stop backend server
# Refresh frontend
# Should see: `⚠️ Using Open-Meteo fallback`
# App should still work
```

---

## 📁 File Changes

### New Files

- `.env` - Environment configuration
- `config.ts` - API URLs and feature flags
- `vite-env.d.ts` - TypeScript environment types

### Modified Files

- `services/weatherService.ts` - **Complete rewrite** with backend integration
- `components/MapWidget.tsx` - Uses `config.WINDY_API_KEY`

### Unchanged Files (No Breaking Changes)

- `App.tsx` - Works as-is
- `components/SearchHeader.tsx` - Works as-is
- `components/SourceMatrix.tsx` - Works as-is
- `components/TrendChart.tsx` - Works as-is
- `components/InsightsPanel.tsx` - Works as-is
- `types.ts` - No changes needed

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to backend"

**Solution:**

1. Check backend is running: `http://localhost:5000/health`
2. Check CORS settings in backend `.env`:
   ```env
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
   ```
3. Verify `VITE_API_URL` in frontend `.env`

### Issue: "Windy map not loading"

**Solution:**

1. Get API key from https://api.windy.com/keys
2. Add to `.env`: `VITE_WINDY_API_KEY=your_key_here`
3. Restart frontend: `npm run dev`

### Issue: "No data showing"

**Solution:**

1. Open browser console (F12)
2. Look for errors
3. Check if backend has data:
   ```bash
   curl http://localhost:5000/api/data/current?city=Mumbai
   ```

### Issue: "Only showing Open-Meteo data"

**Solution:**

1. Check `.env`: `VITE_ENABLE_BACKEND=true`
2. Restart frontend after changing `.env`
3. Check backend is collecting data:
   ```bash
   # Manually trigger collection
   curl -X POST http://localhost:5000/api/data/collect
   ```

---

## 🎨 UI Features

### SourceMatrix Component

Shows data from all 8 APIs:

- **Official sources** (IMD, KSNDMC) have government badge
- **Each source** shows different value (real variance)
- **Status indicators** (active, error, unavailable)
- **Last updated** timestamp

### TrendChart Component

- **Historical mode**: Shows past data from backend database
- **Forecast mode**: Shows 7-day predictions from backend
- **Multiple time scales**: 12h, 24h, 48h, 7d, 14d, 30d
- **Source comparison**: Toggle different API sources

### MapWidget Component

- **Windy integration**: Interactive weather maps
- **Layer switching**: Temperature, Rain, Air Quality
- **Real-time overlays**: Wind, clouds, precipitation
- **Custom markers**: City-specific data points

---

## 🔄 Data Refresh

### Automatic (Backend)

- Real-time data: **Every hour**
- Predictions: **Daily at midnight**

### Manual Trigger

```bash
# Trigger data collection
curl -X POST http://localhost:5000/api/data/collect

# Generate predictions
curl -X POST http://localhost:5000/api/data/predict
```

### Frontend Refresh

- **On city search**: Fetches latest data
- **No auto-refresh**: User must search again
- **Add auto-refresh** (optional):
  ```typescript
  // In App.tsx
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(city);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [city]);
  ```

---

## 📊 API Endpoints Used

### Data Endpoints

```
GET /api/data/current?city=Mumbai
GET /api/data/cities
GET /api/data/historical/:cityId?startDate=X&endDate=Y
GET /api/data/forecast/:cityId
GET /api/data/search?q=mumb
```

### Response Format

```json
{
  "success": true,
  "city": "Mumbai",
  "cityId": "mumbai",
  "data": [
    {
      "sourceApi": "OpenMeteo",
      "temperature": 28.5,
      "humidity": 65,
      "aqi": 156,
      "pm25": 89.3,
      "timestamp": "2025-12-03T12:00:00Z"
    },
    {
      "sourceApi": "IMD",
      "temperature": 28.2,
      "humidity": 67,
      "timestamp": "2025-12-03T12:00:00Z"
    }
    // ... 6 more sources
  ]
}
```

---

## 🚀 Next Steps

1. **Get Windy API Key** - Required for maps
2. **Start Backend** - Required for 8-source data
3. **Test Integration** - Verify data flow
4. **Customize UI** - Adjust components as needed
5. **Add Authentication** (optional) - For user features

---

## 📞 Support

**Backend Issues:**

- Check `Backend/README.md`
- Verify MongoDB connection
- Check backend logs

**Frontend Issues:**

- Check browser console (F12)
- Verify `.env` configuration
- Check network tab for API calls

**Integration Issues:**

- Ensure backend is running first
- Check CORS settings
- Verify API URLs match

---

**Happy Coding! 🎉**
