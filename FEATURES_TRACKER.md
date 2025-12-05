# 🎯 Urban Climate & Weather App - Feature Tracker

**Last Updated:** December 5, 2025  
**Project Status:** In Active Development

---

## 📊 Overview

This document tracks all features for the Urban Climate and Weather Application, organized by:

- **Backend Features** - Server-side, API, database, and data collection
- **Frontend Features** - UI/UX, components, and client-side functionality
- **Full-Stack Features** - Features requiring both backend and frontend implementation

**Legend:**

- ✅ **Completed** - Feature is fully implemented and tested
- 🚧 **In Progress** - Feature is partially implemented or being worked on
- ❌ **Not Started** - Feature is planned but not yet implemented
- 🔄 **Needs Improvement** - Feature exists but requires refinement

---

## 🔧 BACKEND FEATURES

### Data Collection & Aggregation

| Feature                                        | Status | Notes                                    |
| ---------------------------------------------- | ------ | ---------------------------------------- |
| OpenMeteo API Integration                      | ✅     | Historical and real-time data collection |
| IMD (India Meteorological Dept) Integration    | ✅     | Government weather data source           |
| WeatherUnion API Integration                   | ✅     | Commercial weather data                  |
| KSNDMC API Integration                         | ✅     | Karnataka State data                     |
| OpenAQ API Integration                         | ✅     | Air quality data                         |
| Google AQI API Integration                     | ✅     | Air quality index                        |
| UrbanEmission API Integration                  | ✅     | Urban pollution data                     |
| OpenCity API Integration                       | ✅     | City-specific environmental data         |
| NASA FIRMS Integration                         | ❌     | Fire detection and environmental alerts  |
| IQAir API Integration                          | ❌     | Research-grade air quality               |
| AmbeeData API Integration                      | ❌     | Pollen and allergen data                 |
| Satellite Data APIs (NASA POWER, Sentinel Hub) | ❌     | Satellite imagery and data               |

### Data Storage & Management

| Feature                      | Status | Notes                                      |
| ---------------------------- | ------ | ------------------------------------------ |
| MongoDB Database Setup       | ✅     | Using MongoDB Atlas                        |
| City Model                   | ✅     | City metadata and coordinates              |
| RealtimeData Model           | ✅     | Current weather/AQI data                   |
| HistoricalData Model         | ✅     | Time-series historical data                |
| PredictedData Model          | ✅     | 7-day forecast storage                     |
| User Model                   | ✅     | User authentication and profiles           |
| ResearchUpload Model         | ✅     | Community data uploads                     |
| Multi-Source Data Separation | ✅     | Each API stored separately, no averaging   |
| Data Quality Scoring         | 🚧     | Basic validation exists, needs enhancement |
| Source Attribution Tagging   | ✅     | Every record tagged with source API        |
| Time-Series Optimization     | 🔄     | Using MongoDB, TimescaleDB not implemented |
| Data Completeness Tracking   | ❌     | Percentage tracking not implemented        |

### Historical Data Archive

| Feature                       | Status | Notes                                        |
| ----------------------------- | ------ | -------------------------------------------- |
| Hourly Data (Last 30 days)    | ✅     | High granularity data                        |
| Daily Data (Last 10 years)    | 🚧     | Import script supports 2020-2023             |
| Monthly Data (1000+ years)    | ❌     | Long-term climate archives not implemented   |
| Historical Data Import Script | ✅     | `importHistoricalData.js` functional         |
| Data Gap Identification       | ❌     | Gap detection not implemented                |
| Historical Record Tracking    | ❌     | Hottest/coldest day tracking not implemented |
| Decade/Century Comparisons    | ❌     | Long-term trend analysis not implemented     |

### Prediction & Forecasting

| Feature                        | Status | Notes                                               |
| ------------------------------ | ------ | --------------------------------------------------- |
| 7-Day Forecast Generation      | ✅     | Basic prediction engine                             |
| ML-Based Predictions           | 🔄     | Simple algorithm, needs ML enhancement              |
| Multiple Forecast Models       | 🚧     | Only platform prediction, no multi-source forecasts |
| Forecast Accuracy Tracking     | ❌     | Predicted vs. actual comparison not implemented     |
| Hourly Predictions (168 hours) | 🚧     | Daily predictions only, not hourly                  |

### API Endpoints

| Feature                        | Status | Notes                                   |
| ------------------------------ | ------ | --------------------------------------- |
| Health Check Endpoint          | ✅     | `/health`                               |
| User Registration              | ✅     | `/api/auth/register`                    |
| User Login                     | ✅     | `/api/auth/login`                       |
| User Profile Management        | ✅     | `/api/auth/profile`                     |
| Role-Based Access Control      | 🚧     | Roles defined, not fully enforced       |
| Real-Time Data Endpoint        | ✅     | `/api/data/realtime/:cityId`            |
| Historical Data Endpoint       | ✅     | `/api/data/historical/:cityId`          |
| Predictions Endpoint           | ✅     | `/api/data/predictions/:cityId`         |
| City Search Endpoint           | ✅     | `/api/data/search`                      |
| Trend Analysis Endpoint        | ✅     | `/api/analytics/trends`                 |
| Heatmap Data Endpoint          | ✅     | `/api/analytics/heatmap`                |
| Correlation Analysis Endpoint  | ✅     | `/api/analytics/correlation`            |
| Multi-City Comparison Endpoint | ✅     | `/api/analytics/compare`                |
| Research Data Upload           | ✅     | `/api/research/upload`                  |
| Research Data Verification     | ✅     | `/api/research/:id/verify`              |
| Data Export Endpoints          | ❌     | CSV/Excel/JSON export not implemented   |
| Bulk Download Endpoints        | ❌     | Large dataset downloads not implemented |

### Scheduled Jobs & Automation

| Feature                         | Status | Notes                                      |
| ------------------------------- | ------ | ------------------------------------------ |
| Hourly Data Collection Job      | ✅     | Automated collection from all APIs         |
| Daily Prediction Generation Job | ✅     | Midnight prediction updates                |
| Data Quality Validation Job     | ❌     | Automated quality checks not scheduled     |
| Alert Generation Job            | ❌     | Extreme weather/AQI alerts not implemented |
| Database Cleanup Job            | ❌     | Old data archival not implemented          |

### Performance & Optimization

| Feature            | Status | Notes                               |
| ------------------ | ------ | ----------------------------------- |
| Redis Caching      | ✅     | Frequently accessed data cached     |
| API Rate Limiting  | ❌     | Rate limiting not implemented       |
| Query Optimization | 🔄     | Basic indexing, needs improvement   |
| Database Indexing  | 🚧     | Partial indexing on key fields      |
| Load Balancing     | ❌     | Single server deployment            |
| CDN Integration    | ❌     | Static asset delivery not optimized |

### Security & Authentication

| Feature                  | Status | Notes                                 |
| ------------------------ | ------ | ------------------------------------- |
| JWT Authentication       | ✅     | Token-based auth implemented          |
| Password Hashing         | ✅     | bcrypt encryption                     |
| Google OAuth 2.0         | ✅     | One-click sign-in with Google         |
| OAuth Callback Handler   | ✅     | Passport.js integration               |
| User Profile API         | ✅     | GET/PUT /api/auth/profile             |
| Favorites Management API | ✅     | Add/remove/get favorites endpoints    |
| CORS Configuration       | ✅     | Cross-origin requests handled         |
| Input Validation         | ✅     | Request validation middleware         |
| SQL Injection Protection | ✅     | MongoDB prevents SQL injection        |
| XSS Protection           | 🔄     | Basic sanitization, needs enhancement |
| API Key Management       | 🚧     | Environment variables, no rotation    |
| Admin Role Enforcement   | 🚧     | Defined but not fully enforced        |

---

## 🎨 FRONTEND FEATURES

### Core UI Components

| Feature                        | Status | Notes                                 |
| ------------------------------ | ------ | ------------------------------------- |
| Search Header                  | ✅     | City search with autocomplete         |
| Map Widget (Windy Integration) | ✅     | Interactive weather map               |
| Source Matrix Component        | ✅     | Multi-source data comparison          |
| Trend Chart Component          | ✅     | Historical and forecast visualization |
| Insights Panel                 | ✅     | Contextual alerts and insights        |
| Error Toast Component          | ✅     | User-friendly error messages          |
| Loading States                 | ✅     | Skeleton loaders and spinners         |
| Responsive Design              | ✅     | Mobile, tablet, desktop optimized     |

### Map Features

| Feature                        | Status | Notes                                       |
| ------------------------------ | ------ | ------------------------------------------- |
| Interactive City Selection     | ✅     | Click map to select city                    |
| Temperature Overlay            | ✅     | Windy temperature layer                     |
| Rain/Precipitation Radar       | ✅     | Windy rain layer                            |
| Air Quality Visualization      | ✅     | Windy AQI layer                             |
| Wind Direction/Speed Vectors   | ✅     | Windy wind layer                            |
| Custom City Markers            | ✅     | Markers with temp/AQI data                  |
| Zone Highlighting (News-Style) | ❌     | Color-coded pollution zones not implemented |
| Monitoring Station Display     | ❌     | Station locations not shown on map          |
| Heatmap Overlays               | 🚧     | Basic implementation, needs enhancement     |
| Map Controls Optimization      | 🔄     | Fixed overlap issues, needs polish          |

### Data Visualization

| Feature                                  | Status | Notes                                             |
| ---------------------------------------- | ------ | ------------------------------------------------- |
| Line Charts (Temperature/AQI Trends)     | ✅     | Chart.js implementation                           |
| Multi-Metric Comparison                  | ✅     | Toggle between metrics                            |
| Time Scale Selection (12h, 24h, 7d, 30d) | ✅     | Flexible time ranges                              |
| Source Comparison Toggle                 | ✅     | Compare different API sources                     |
| Forecast vs. Historical Toggle           | ✅     | Switch between modes                              |
| Bar Charts                               | ❌     | Monthly rainfall comparisons not implemented      |
| Heatmaps (Grid View)                     | ❌     | Multi-city heatmap grid not implemented           |
| Scatter Plots                            | ❌     | Correlation visualization not implemented         |
| Box Plots                                | ❌     | Statistical distribution not implemented          |
| Radial/Polar Charts                      | ❌     | Wind direction, seasonal patterns not implemented |

### User Experience

| Feature                    | Status | Notes                                   |
| -------------------------- | ------ | --------------------------------------- |
| Landing Page               | ✅     | Professional dark theme with gradients  |
| Geolocation Auto-Detection | ✅     | Detects user's city on load             |
| Favorites System           | ✅     | Save favorite cities with live weather  |
| City Search Autocomplete   | ✅     | Smart city suggestions                  |
| Dark Mode                  | ✅     | Default dark theme                      |
| Light Mode                 | ❌     | Theme toggle not implemented            |
| Keyboard Navigation        | ❌     | Accessibility shortcuts not implemented |
| Touch Gestures (Mobile)    | 🔄     | Basic support, needs enhancement        |
| Offline Mode               | ❌     | Service worker not implemented          |

### Data Display

| Feature                     | Status | Notes                                 |
| --------------------------- | ------ | ------------------------------------- |
| Current Weather Summary     | ✅     | Temperature, humidity, wind           |
| Air Quality Index (AQI)     | ✅     | PM2.5, PM10, pollutants               |
| Health Advisory             | ✅     | AQI-based recommendations             |
| 7-Day Forecast Preview      | ✅     | Daily summaries                       |
| Multi-Source Data Cards     | ✅     | Government badge for official sources |
| Source Status Indicators    | ✅     | Active, error, unavailable states     |
| Last Updated Timestamp      | ✅     | Data freshness indicator              |
| Historical Context Insights | ✅     | Comparison with typical values        |
| UV Index Display            | ❌     | UV data not shown                     |
| Pollen Count Display        | ❌     | Allergen data not implemented         |
| Sunrise/Sunset Times        | ❌     | Astronomical data not shown           |
| Moon Phase                  | ❌     | Lunar data not implemented            |

### Role-Based Interfaces

| Feature                       | Status | Notes                                 |
| ----------------------------- | ------ | ------------------------------------- |
| User Type Selection (Landing) | ❌     | Role selection not implemented        |
| Regular Citizen Interface     | 🔄     | Current interface is citizen-focused  |
| Researcher/Academic Interface | ❌     | Advanced tools not implemented        |
| Student/Educator Interface    | ❌     | Educational modules not implemented   |
| Policy Maker Interface        | ❌     | Compliance dashboards not implemented |
| Media/Journalist Interface    | ❌     | Embeddable widgets not implemented    |

### Data Export & Download

| Feature                  | Status | Notes                                       |
| ------------------------ | ------ | ------------------------------------------- |
| CSV Export               | ❌     | Data download not implemented               |
| Excel Export             | ❌     | .xlsx format not supported                  |
| JSON Export              | ❌     | API-like format export not implemented      |
| PDF Reports              | ❌     | Formatted reports not implemented           |
| Graph Export (PNG/SVG)   | ❌     | Chart download not implemented              |
| Citation Generator       | ❌     | Research citation tool not implemented      |
| Export Builder Interface | ❌     | Custom export configuration not implemented |

### Performance

| Feature                | Status | Notes                               |
| ---------------------- | ------ | ----------------------------------- |
| Page Load Time < 3s    | ✅     | Fast initial load                   |
| Chart Rendering < 1s   | ✅     | Smooth visualization                |
| Lazy Loading           | 🚧     | Partial implementation              |
| Code Splitting         | ❌     | Bundle optimization not implemented |
| Image Optimization     | ❌     | Asset compression not implemented   |
| Service Worker Caching | ❌     | PWA features not implemented        |

---

## 🔗 FULL-STACK FEATURES (Backend + Frontend)

### Multi-Source Data Integration

| Feature                             | Status | Notes                                       |
| ----------------------------------- | ------ | ------------------------------------------- |
| Backend Aggregates 8 APIs           | ✅     | All collectors functional                   |
| Frontend Displays Multi-Source Data | ✅     | Source Matrix shows all sources             |
| No Data Averaging (Transparency)    | ✅     | Each source stored/displayed separately     |
| Source Selection by User            | 🚧     | Display only, user can't filter sources yet |
| Side-by-Side Source Comparison      | ✅     | Source Matrix component                     |
| Data Quality Indicators             | 🔄     | Basic status, needs quality scores          |

### Real-Time & Historical Data Flow

| Feature                   | Status | Notes                                  |
| ------------------------- | ------ | -------------------------------------- |
| Hourly Backend Collection | ✅     | Automated job running                  |
| Frontend Auto-Refresh     | ❌     | Manual search required, no auto-update |
| Historical Data Retrieval | ✅     | Backend serves, frontend displays      |
| Time-Range Selection      | ✅     | 12h, 24h, 7d, 30d options              |
| Data Caching (Backend)    | ✅     | Redis caching implemented              |
| Client-Side Caching       | ❌     | Browser caching not optimized          |

### Forecasting System

| Feature                             | Status | Notes                                                  |
| ----------------------------------- | ------ | ------------------------------------------------------ |
| Backend Generates 7-Day Predictions | ✅     | Daily job functional                                   |
| Frontend Displays Forecasts         | ✅     | Trend chart shows predictions                          |
| Multiple Forecast Sources           | ❌     | Only platform prediction, no IMD/OpenWeather forecasts |
| Forecast Accuracy Display           | ❌     | Predicted vs. actual not shown                         |

### Analytics & Insights

| Feature                              | Status | Notes                                                                                                  |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------ |
| Trend Analysis (Backend)             | ✅     | `/api/analytics/trends`                                                                                |
| Trend Visualization (Frontend)       | ✅     | Line charts                                                                                            |
| Correlation Analysis (Backend)       | ✅     | `/api/analytics/correlation`                                                                           |
| Correlation Visualization (Frontend) | 🚧     | Scatter plots implemented, tooltip bug                                                                 |
| Multi-City Comparison (Backend)      | ✅     | `/api/analytics/compare`                                                                               |
| Multi-City Comparison (Frontend)     | ✅     | ComparisonCards with side-by-side cards, diff display, table, expanded metrics (AQI, PM2.5, PM10, NO2) |
| Heatmap Data (Backend)               | ✅     | `/api/analytics/heatmap`                                                                               |
| Heatmap Visualization (Frontend)     | ❌     | Grid heatmap not implemented                                                                           |
| Historical Records (Backend)         | ❌     | Hottest/coldest tracking not implemented                                                               |
| Historical Records (Frontend)        | ❌     | Record display not implemented                                                                         |
| Anomaly Detection (Backend)          | ❌     | Spike detection not implemented                                                                        |
| Anomaly Alerts (Frontend)            | ❌     | Alert banners not implemented                                                                          |

### User Authentication & Profiles

| Feature                   | Status | Notes                                                 |
| ------------------------- | ------ | ----------------------------------------------------- |
| User Registration Flow    | ✅     | Email/password with validation                        |
| Google OAuth Registration | ✅     | One-click sign-up with Google                         |
| User Login Flow           | ✅     | JWT authentication                                    |
| Google OAuth Login        | ✅     | Seamless Google sign-in                               |
| Profile Management        | ✅     | View and edit user profile                            |
| Login Modal UI            | ✅     | Dark theme with glassmorphism                         |
| Register Modal UI         | ✅     | Password strength indicator                           |
| Profile Dashboard UI      | ✅     | User info and favorites with live weather             |
| Landing Page UI           | ✅     | Professional multi-section design                     |
| OAuth Callback Handler    | ✅     | Processes Google redirect and stores token            |
| Role-Based Features       | 🚧     | Backend roles defined, frontend not differentiated    |
| Favorites Sync            | ✅     | Favorites stored in MongoDB and synced across devices |
| Password Reset            | ❌     | Forgot password flow not implemented                  |
| Email Verification        | ❌     | Email confirmation not implemented                    |
| Social Login (Facebook/X) | ❌     | Only Google OAuth implemented                         |

### Research Data Upload

| Feature                      | Status | Notes                                 |
| ---------------------------- | ------ | ------------------------------------- |
| Upload Endpoint (Backend)    | ✅     | `/api/research/upload`                |
| Upload UI (Frontend)         | ❌     | File upload interface not implemented |
| Data Validation (Backend)    | ✅     | Schema validation                     |
| Admin Verification (Backend) | ✅     | Verification endpoint exists          |
| Admin Panel (Frontend)       | ❌     | Verification UI not implemented       |
| Public Dataset Display       | ❌     | Verified uploads not shown in UI      |

### Map Integration

| Feature                        | Status | Notes                         |
| ------------------------------ | ------ | ----------------------------- |
| City Coordinates (Backend)     | ✅     | City model has lat/lon        |
| Interactive Map (Frontend)     | ✅     | Windy.com integration         |
| Map Click → Data Fetch         | ✅     | Click city to load data       |
| Real-Time Map Overlays         | ✅     | Temperature, rain, AQI layers |
| Custom Markers with Data       | ✅     | Shows temp/AQI on markers     |
| Monitoring Stations (Backend)  | ❌     | Station data not collected    |
| Monitoring Stations (Frontend) | ❌     | Stations not displayed on map |

### Search & Discovery

| Feature                | Status | Notes                                        |
| ---------------------- | ------ | -------------------------------------------- |
| City Search (Backend)  | ✅     | `/api/data/search` autocomplete              |
| City Search (Frontend) | ✅     | SearchHeader component                       |
| Coordinate Search      | ❌     | Lat/lon lookup not implemented               |
| Nearby Cities Search   | ❌     | Radius-based search not implemented          |
| Date Search            | ❌     | "Show data for Dec 25, 2020" not implemented |
| Record Search          | ❌     | "Hottest day in Delhi" not implemented       |

### Data Export System

| Feature                                  | Status | Notes                            |
| ---------------------------------------- | ------ | -------------------------------- |
| Export Endpoints (Backend)               | ❌     | Download APIs not implemented    |
| Export UI (Frontend)                     | ❌     | Download buttons not implemented |
| Format Selection (CSV, Excel, JSON, PDF) | ❌     | Not implemented                  |
| Date Range Selection                     | ❌     | Not implemented                  |
| Metric Selection                         | ❌     | Not implemented                  |
| Source Selection                         | ❌     | Not implemented                  |

### Alerts & Notifications

| Feature                    | Status | Notes                                      |
| -------------------------- | ------ | ------------------------------------------ |
| Alert Generation (Backend) | ❌     | Extreme weather/AQI alerts not implemented |
| Alert Display (Frontend)   | ❌     | Alert banners not implemented              |
| Email Notifications        | ❌     | Not implemented                            |
| SMS Notifications          | ❌     | Not implemented                            |
| Push Notifications         | ❌     | Not implemented                            |
| Custom Alert Thresholds    | ❌     | User-defined alerts not implemented        |

---

## 📈 FEATURE COMPLETION SUMMARY

### Backend

- **Completed:** 40 features ✅
- **In Progress:** 12 features 🚧
- **Needs Improvement:** 5 features 🔄
- **Not Started:** 28 features ❌
- **Total:** 85 backend features
- **Completion Rate:** ~47%

### Frontend

- **Completed:** 36 features ✅
- **In Progress:** 4 features 🚧
- **Needs Improvement:** 4 features 🔄
- **Not Started:** 31 features ❌
- **Total:** 75 frontend features
- **Completion Rate:** ~48%

### Full-Stack

- **Completed:** 20 features ✅
- **In Progress:** 3 features 🚧
- **Needs Improvement:** 2 features 🔄
- **Not Started:** 18 features ❌
- **Total:** 43 full-stack features
- **Completion Rate:** ~47%

### Overall Project

- **Total Features:** 203
- **Completed:** 96 features (47%)
- **In Progress:** 19 features (9%)
- **Not Started:** 77 features (38%)
- **Needs Improvement:** 11 features (5%)

---

## 🎯 PRIORITY ROADMAP

### High Priority (Next Sprint)

1. ✅ Frontend Authentication UI (Login/Register/Profile complete with Google OAuth)
2. ✅ Multi-City Comparison UI (Enhanced with full metrics & source selection)
3. ❌ Data Export System (CSV/JSON downloads)
4. ❌ Historical Records Tracking (Hottest/Coldest days)
5. ❌ Alert System (Extreme weather/AQI warnings)

### Medium Priority

1. ❌ Role-Based Interface Selection
2. ❌ Additional Chart Types (Bar, Scatter, Box plots)
3. ❌ Forecast Accuracy Tracking
4. ❌ Research Upload UI
5. ❌ Admin Verification Panel

### Low Priority

1. ❌ 1000+ Years Historical Data
2. ❌ Additional API Integrations (NASA FIRMS, IQAir, AmbeeData)
3. ❌ Mobile Apps (iOS/Android)
4. ❌ Multi-Language Support
5. ❌ PWA Features (Offline mode, service workers)

---

## 📝 NOTES

- **Current Focus:** Core functionality is working well. Map interaction and comparison features refined.
- **Documentation:** Comprehensive docs in `/docs` folder including walkthroughs, troubleshooting, and API guides.

---

## 🔧 RECENT SESSION FIXES (December 5, 2025)

### ✅ Fixed Issues

| Issue                        | Component                     | Description                                                                                              |
| ---------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| API Port Mismatch            | `config.js`                   | Fixed `API_BASE_URL` from port 5000 to 3000                                                              |
| Comparison Mode State        | `SearchHeader.jsx`, `App.jsx` | Connected `comparisonMode` prop between parent and child components                                      |
| Map Click in Comparison Mode | `MapWidget.jsx`               | Fixed stale closure issue - map now correctly routes clicks to `onCompareSelect` when in comparison mode |
| Line Chart Dashing           | `TrendChart.jsx`              | Main city now uses **solid lines**, comparison city uses **dashed lines** with lower opacity (0.5)       |
| Independent Source Toggles   | `TrendChart.jsx`              | Toggling a source in one city's sidebar only affects that city's data (not both)                         |
| Comparison Clear - Zoom      | `MapWidget.jsx`               | Map now flies back to main city when comparison is cleared                                               |
| Comparison Clear - Widget    | `MapWidget.jsx`               | Comparison info card is removed when comparison is cleared                                               |
| Compare Map Flow             | `MapWidget.jsx`               | When clicking Compare, map zooms out to India view for 2nd city selection                                |
| Fit Bounds                   | `MapWidget.jsx`               | After selecting 2nd city, map fits bounds to show both city markers                                      |
| Comparison Metrics Expansion | `ComparisonCards.jsx`         | Added Pressure, PM2.5, PM10, NO2 to comparison view (matching single city view)                          |
| Source Selection UI          | `ComparisonCards.jsx`         | Improved dropdown layout, fixed source name display, added visual indicators                             |
| Wind Speed Display Fix       | `weatherService.js`           | Fixed missing Wind Speed in fallback data and standardized metric ID to `windSpeed`                      |
| Metric Data Merging          | `ComparisonCards.jsx`         | Implemented logic to merge weather matrix with AQI breakdown data for complete comparison                |

### ⛔ UNRESOLVED - Too Buggy (Recharts Library Limitation)

| Bug                    | Component        | Description                                                                   | Status        |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------- | ------------- |
| Scatter Tooltip Source | `TrendChart.jsx` | Tooltip shows incorrect source name when multiple sources/cities are selected | ⛔ CANNOT FIX |
| Scatter Tooltip City   | `TrendChart.jsx` | City name may show incorrectly for overlapping scatter points                 | ⛔ CANNOT FIX |

> **Root Cause:** The `recharts` library has fundamental issues with how it handles tooltip payloads for multiple `<Scatter>` components. When multiple scatter series exist, recharts doesn't reliably pass the correct data point to the tooltip. Multiple approaches tried (custom shapes, refs, parsing entry.name, iterating payload) all failed.
>
> **Recommendation:** To fix this properly, would need to:
>
> 1. Replace `recharts` with `visx` or raw `d3` for scatter charts
> 2. Or implement custom mouse tracking/hit detection instead of relying on recharts tooltip
> 3. Or disable multi-source/multi-city scatter view and only allow single-source comparison

### 🔄 Needs Improvement

| Feature                | Component        | Current State         | Improvement Needed                      |
| ---------------------- | ---------------- | --------------------- | --------------------------------------- |
| Per-City Source Memory | `TrendChart.jsx` | Resets on city change | Remember source preferences per session |

### ❌ Pending Implementation

| Feature                         | Description                                             | Component        |
| ------------------------------- | ------------------------------------------------------- | ---------------- |
| Scatter Correlation Labels      | Show correlation coefficient (r-value) on scatter chart | `TrendChart.jsx` |
| Export Scatter Data             | Allow exporting correlation analysis data               | `TrendChart.jsx` |
| Scatter Legend                  | Better legend for multi-city scatter points             | `TrendChart.jsx` |
| Map City Search in Compare Mode | Add searchable input on map when in compare mode        | `MapWidget.jsx`  |

---

## ⚠️ PROJECT CONSTRAINTS & LIMITATIONS

### Time Constraints & Technical Complexity

Due to **project timeline limitations** and **technical complexity**, the following categories of features could not be completed:

#### 🚧 In Progress Features (19 features)

These features were started but not fully implemented due to time constraints:

- Multi-source forecast models
- Role-based access control enforcement
- Advanced ML-based predictions
- Comprehensive database indexing
- Enhanced heatmap visualizations
- Research upload UI and admin verification panel

#### ❌ Not Started Features (77 features)

These features were planned but not implemented due to:

- **Time constraints**: Limited development timeline prevented implementation
- **Technical complexity**: Features requiring extensive research, third-party integrations, or advanced algorithms
- **Resource limitations**: Features requiring additional APIs, infrastructure, or specialized expertise

Key unimplemented features include:

- Additional API integrations (NASA FIRMS, IQAir, AmbeeData, Satellite Data)
- Long-term historical data (1000+ years)
- Advanced visualizations (bar charts, heatmaps, scatter plots, box plots, radial charts)
- Data export system (CSV, Excel, JSON, PDF)
- Alert and notification system
- Role-based interfaces for different user types
- PWA features and offline mode
- Email verification and password reset
- Multi-language support

#### 🔄 Needs Improvement Features (11 features)

These features exist but require refinement due to time constraints:

- ML-based prediction algorithms (currently using simple statistical models)
- Data quality scoring system
- XSS protection enhancements
- Query optimization
- Touch gesture support
- Client-side caching
- Map controls optimization

### Development Priorities

Given the constraints, the development team focused on:

1. ✅ **Core functionality**: Real-time and historical data collection from 8 APIs
2. ✅ **Essential UI/UX**: Interactive map, multi-source comparison, trend visualization
3. ✅ **User authentication**: Email/password and Google OAuth integration
4. ✅ **Data transparency**: Multi-source display without averaging
5. ✅ **Performance**: Redis caching and optimized queries

### Future Recommendations

To complete the remaining features, the following would be required:

- Extended development timeline (3-6 months)
- Additional team members with specialized skills (ML, data visualization, DevOps)
- Budget for premium API subscriptions
- Infrastructure upgrades for advanced features (TimescaleDB, CDN, load balancing)

---

## 🎯 NEXT PRIORITY FIXES

1. **Scatter Tooltip Bug** - The tooltip in correlation analysis scatter chart shows wrong source/city when multiple are selected
2. **Overlapping Points** - When two cities have similar values, hovering shows wrong data
3. **Source State Persistence** - Source toggles reset when switching cities

---

**Document Maintained By:** Development Team  
**Review Frequency:** Weekly  
**Last Review:** December 5, 2025
