# 🌱 EcoSense India

**EcoSense India** is a full-stack environmental intelligence platform that aggregates real-time weather, air quality, satellite, and pollution data from multiple government and commercial sources across India.

The platform allows users to explore, analyze, compare, and visualize environmental conditions using a unified interactive dashboard.

---

## 🚀 Features

### ✅ Core Capabilities

- 🔍 City search with live weather and AQI
- 📊 Interactive trend charts (12h, 24h, 7d, 30d)
- 🔗 Cross-source comparison (IMD, KSNDMC, OpenAQ, WeatherUnion, etc.)
- 🗺️ Interactive GIS maps (temperature, rainfall, AQI overlays)
- ⭐ Favorite cities with live updates
- 🔐 Google OAuth + JWT authentication
- 📅 7-day forecasts
- 🕰️ Historical data viewer with 1-year records
- 📑 Data source matrix comparison
- 🌍 Wind visualization & map overlays
- 🤖 AI-powered insights (ChatGPT integration)
- 📈 Extreme weather records (hottest, coldest, wettest days)
- 📆 Interactive date explorer for historical weather

---

## 🗂️ Project Structure

```text
ecosense-india/
├── Backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   └── config/
├── Frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
├── .env.example
├── README.md
└── FEATURES_TRACKER.md
```

---

## ⚙️ Local Setup Guide

### 1️⃣ Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Google Cloud account
- API keys for all integrated services (mandatory)

---

## 🖥️ Backend Setup

```bash
cd Backend
npm install
```

Create `.env` file:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecosense

# Server
PORT=3000
NODE_ENV=development
BACKEND_URL=http://localhost:3000

# Auth
JWT_SECRET=change_this_secret
JWT_EXPIRE=24h

# ================================
# MANDATORY API PROVIDERS
# ================================

# WeatherUnion
WEATHER_UNION_API_KEY=your_key_here

# IMD Data Source
IMD_API_KEY=your_key_here

# KSNDMC Data Source
KSNDMC_API_KEY=your_key_here

# OpenAQ
OPENAQ_API_KEY=your_key_here

# Google AQI
GOOGLE_AQI_API_KEY=your_key_here

# Tomorrow.io
TOMORROW_API_KEY=your_key_here

# OpenMeteo
OPEN_METEO_API_URL=https://api.open-meteo.com/v1

# NASA FIRMS
NASA_FIRMS_API_KEY=your_key_here

# UrbanEmission
URBAN_EMISSION_API_KEY=your_key_here

# Map Provider
MAPBOX_TOKEN=your_mapbox_key

# ================================
# AI & Historical Data
# ================================

# OpenAI (ChatGPT Insights)
OPENAI_API_KEY=your_openai_key_here

# Visual Crossing (Historical Weather)
VISUAL_CROSSING_API_KEY=your_visual_crossing_key_here

# ================================
# Authentication
# ================================

GOOGLE_CLIENT_ID=your_google_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# ================================
# Frontend Control
# ================================

FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

Start backend:

```bash
npm run dev
```

---

## 🌐 Frontend Setup

```bash
cd Frontend
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=your_mapbox_key
VITE_TOMORROW_API_KEY=your_key_here
VITE_ENABLE_BACKEND=true
```

⚠️ **Note:** Variable name is `VITE_API_BASE_URL` (not `VITE_API_URL`)

Start frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🔑 API / Services Configuration (ALL REQUIRED)

| Service         | Purpose               | Requires API Key?     | Where to Add  | Environment Variable Name               | How to Get                             | Status             |
| --------------- | --------------------- | --------------------- | ------------- | --------------------------------------- | -------------------------------------- | ------------------ |
| MongoDB Atlas   | Database              | ✅ Connection String  | Backend .env  | MONGO_URI                               | MongoDB Atlas dashboard                | ✅ Required        |
| Google OAuth    | Authentication        | ✅ Client ID & Secret | Backend .env  | GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google Cloud Console (OAuth 2.0)       | ✅ Required        |
| OpenAI          | AI Insights (ChatGPT) | ✅ API Key            | Backend .env  | OPENAI_API_KEY                          | https://platform.openai.com            | ✅ Required        |
| Visual Crossing | Historical Weather    | ✅ API Key            | Backend .env  | VISUAL_CROSSING_API_KEY                 | https://www.visualcrossing.com         | ✅ Required        |
| OpenAQ          | Air Quality Data      | ❌ No Key             | -             | -                                       | Public API (deprecated)                | ❌ Disabled        |
| Open-Meteo      | Weather Data          | ❌ No Key             | -             | -                                       | Public API                             | ✅ Active          |
| WeatherUnion    | Hyperlocal Weather    | ✅ API Key            | Backend .env  | WEATHERUNION_API_KEY                    | https://weatherunion.com               | ✅ Active          |
| IMD             | Government Weather    | ❌ No Key             | Backend .env  | IMD_API_URL                             | Official IMD Sources                   | ✅ Active          |
| KSNDMC          | Regional Forecasts    | ❌ No Key             | Backend .env  | KSNDMC_API_URL                          | KSNDMC Official Portal                 | ✅ Active          |
| Google AQI      | AQI Enrichment        | ✅ API Key            | Backend .env  | GOOGLE_AQI_API_KEY                      | Google Cloud Console (Air Quality API) | ✅ Active          |
| Tomorrow.io     | Weather Predictions   | ✅ API Key            | Frontend .env | VITE_TOMORROW_API_KEY                   | https://tomorrow.io                    | ✅ Active          |
| UrbanEmission   | City Emission Models  | ❌ No Key             | Backend .env  | URBANEMISSION_API_URL                   | Public Research API                    | ✅ Active          |
| Mapbox          | Mapping Engine        | ✅ Access Token       | Frontend .env | VITE_MAPBOX_TOKEN                       | https://mapbox.com                     | ✅ Required        |
| Windy           | Weather Layers        | ❌ Embedded           | -             | -                                       | Embedded Iframe                        | ✅ Active          |
| NASA FIRMS      | Fire & Heat Detection | ✅ API Key            | Backend .env  | NASA_FIRMS_API_KEY                      | https://firms.modaps.eosdis.nasa.gov   | ❌ Not Implemented |

⚠️ **Application will not function if ANY API is missing or misconfigured.**

---

## 🔌 API Overview

Base URL:

```text
http://localhost:3000/api
```

Authorization:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication Endpoints

| Method | Route          |
| ------ | -------------- |
| POST   | /auth/register |
| POST   | /auth/login    |
| GET    | /auth/google   |
| GET    | /auth/profile  |

---

## 🌦️ Weather Endpoints

| Feature  | Endpoint                    |
| -------- | --------------------------- |
| Search   | `/data/search`              |
| Realtime | `/data/realtime/:cityId`    |
| History  | `/data/historical/:cityId`  |
| Forecast | `/data/predictions/:cityId` |

---

## 📊 Analytics Endpoints

| Feature     | Endpoint                 |
| ----------- | ------------------------ |
| Trends      | `/analytics/trends`      |
| Compare     | `/analytics/compare`     |
| Correlation | `/analytics/correlation` |
| Heatmap     | `/analytics/heatmap`     |

---

## ⭐ Favorites System

| Action | Endpoint                    |
| ------ | --------------------------- |
| Get    | `/auth/profile`             |
| Add    | `/favorites/add`            |
| Remove | `/favorites/remove/:cityId` |

---

## 📁 Research Upload API

| Action | Endpoint            |
| ------ | ------------------- |
| Upload | `/research/upload`  |
| Fetch  | `/research?cityId=` |

---

## ✅ Health Check

```bash
curl http://localhost:3000/api/health
```

---

## 🧰 Tech Stack

### Backend

- Node.js
- Express
- MongoDB
- JWT
- Passport
- Cron Jobs

### Frontend

- React
- Vite
- Leaflet
- Recharts
- Tailwind CSS

---

## 🚨 Troubleshooting

| Issue             | Fix                 |
| ----------------- | ------------------- |
| DB failure        | Fix URI             |
| OAuth error       | Verify redirect     |
| Map fails         | Check Mapbox key    |
| API returns empty | Verify provider key |
| CORS issue        | Update frontend URL |

---

## 📜 License

MIT License

---

Built with ❤️ to make India’s environment transparent.

```

```
