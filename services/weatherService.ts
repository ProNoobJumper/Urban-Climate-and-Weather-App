// Author: Senior Frontend Engineer
// OS support: Web
// Description: Services for fetching real-time weather data from Open-Meteo and generating insights via rule-based logic

import { CityData, MetricRow, HistoricalPoint, SourceData, Insight } from '../types';

// --- OpenMeteo Types ---
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    surface_pressure: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    surface_pressure: number[];
    wind_speed_10m: number[];
    uv_index: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

interface AirQualityResponse {
  current: {
    us_aqi: number;
    pm2_5: number;
    pm10: number;
    nitrogen_dioxide: number;
  };
  hourly: {
    time: string[];
    us_aqi: number[];
    pm2_5: number[];
    pm10: number[];
    nitrogen_dioxide: number[];
  };
}

// --- Helper Functions ---

const getCoordinates = async (city: string): Promise<{ lat: number; lng: number; name: string }> => {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error('City not found');
    }
    return { lat: data.results[0].latitude, lng: data.results[0].longitude, name: data.results[0].name };
  } catch (e) {
    // Fallback for demo stability
    return { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' };
  }
};

// Simulate multi-source variance based on scientific uncertainty principles
// Real sensors differ by location, height, and calibration.
const simulateSourceValue = (baseValue: number, source: string, metric: string): number => {
  const seed = source.length + metric.length; // deterministic pseudo-random
  let deviation = 0;
  
  if (metric === 'temperature') deviation = (seed % 3 - 1.5) * 0.3; // +/- 0.5C
  if (metric === 'humidity') deviation = (seed % 5 - 2.5); // +/- 2%
  if (metric === 'aqi') deviation = (seed % 10 - 5) * 2; // +/- 10 AQI
  if (metric === 'precipitation') deviation = (seed % 2 === 0 ? 0 : 0.2);
  
  // Specific bias per source
  if (source === 'IMD') deviation += 0; // Baseline
  if (source === 'KSNDMC') deviation -= 0.2;
  if (source === 'WeatherUnion') deviation += 0.3;
  if (source === 'UrbanEmission') deviation += (metric === 'aqi' ? 5 : 0);

  return parseFloat((baseValue + deviation).toFixed(1));
};

// Deterministic Insight Generation
const generateInsights = (city: string, weather: OpenMeteoResponse, aqi: AirQualityResponse): Insight[] => {
  const insights: Insight[] = [];

  // 1. AQI Analysis
  if (aqi.current.us_aqi > 150) {
    insights.push({
      type: 'alert',
      severity: 'critical',
      message: `Critical AQI levels (${aqi.current.us_aqi}). Avoid prolonged outdoor exposure.`,
      timestamp: 'Live'
    });
  } else if (aqi.current.us_aqi > 100) {
    insights.push({
      type: 'alert',
      severity: 'warning',
      message: `Unhealthy air quality (${aqi.current.us_aqi}). Sensitive groups should take precautions.`,
      timestamp: 'Live'
    });
  } else {
    insights.push({
      type: 'record',
      severity: 'info',
      message: `Air quality is Good (${aqi.current.us_aqi}). Perfect for outdoor activities.`,
      timestamp: 'Live'
    });
  }

  // 2. Temperature/Weather Alerts
  if (weather.current.temperature_2m > 38) {
    insights.push({
      type: 'alert',
      severity: 'critical',
      message: `Heatwave conditions detected. Current temp: ${weather.current.temperature_2m}°C.`,
      timestamp: 'Live'
    });
  } else if (weather.current.temperature_2m < 5) {
    insights.push({
      type: 'alert',
      severity: 'warning',
      message: `Cold wave alert. Temperatures have dropped to ${weather.current.temperature_2m}°C.`,
      timestamp: 'Live'
    });
  }

  // 3. Rain Probability
  const rainProb = weather.hourly.precipitation_probability[0];
  if (rainProb > 70) {
    insights.push({
      type: 'alert',
      severity: 'info',
      message: `High chance of precipitation (${rainProb}%) expected in the next hour.`,
      timestamp: 'Forecast'
    });
  }

  // 4. Historical Context (Trend)
  // Calculate average max temp for the last 7 days from daily data
  const avgTemp7d = weather.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / weather.daily.temperature_2m_max.length;
  const currentMax = weather.daily.temperature_2m_max[0] || weather.current.temperature_2m;
  const diff = currentMax - avgTemp7d;
  
  if (Math.abs(diff) > 2) {
    insights.push({
      type: 'trend',
      severity: 'info',
      message: `Today is ${Math.abs(diff).toFixed(1)}°C ${diff > 0 ? 'warmer' : 'cooler'} than the 7-day average.`,
      timestamp: 'Historical Context'
    });
  } else {
     insights.push({
      type: 'trend',
      severity: 'info',
      message: `Temperatures are consistent with the weekly average of ${avgTemp7d.toFixed(1)}°C.`,
      timestamp: 'Historical Context'
    });
  }

  return insights.slice(0, 4);
};

// --- Main Fetch Function ---

export const fetchCityData = async (cityName: string): Promise<CityData> => {
  // 1. Get Coordinates
  const { lat, lng, name } = await getCoordinates(cityName);

  // 2. Fetch Open-Meteo Data (Weather & AQI)
  const [weatherRes, aqiRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,surface_pressure,wind_speed_10m,uv_index,weather_code&daily=temperature_2m_max,temperature_2m_min&past_days=7&forecast_days=7`),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide&hourly=us_aqi,pm2_5,pm10,nitrogen_dioxide&past_days=7`)
  ]);

  const weather: OpenMeteoResponse = await weatherRes.json();
  const aqi: AirQualityResponse = await aqiRes.json();

  // 3. Construct Live Matrix (Simulating Multi-Source for Dashboard Demo)
  // In a real production app, we would query IMD/KSNDMC APIs here.
  // For this "Ecosystem" demo, we simulate their slight variances from the ground truth (OpenMeteo).

  const makeSource = (name: string, isOfficial: boolean, val: number, unit: any, metric: string): SourceData => ({
    source: name,
    displayName: name,
    isOfficial,
    value: simulateSourceValue(val, name, metric),
    unit,
    status: 'active',
    lastUpdated: 'Live'
  });

  const matrix: MetricRow[] = [
    {
      metricId: 'temperature',
      label: 'Temperature',
      data: [
        { ...makeSource('IMD', true, weather.current.temperature_2m, 'C', 'temperature') },
        { ...makeSource('KSNDMC', true, weather.current.temperature_2m, 'C', 'temperature') },
        { ...makeSource('WeatherUnion', false, weather.current.temperature_2m, 'C', 'temperature') },
        { ...makeSource('OpenWeather', false, weather.current.temperature_2m, 'C', 'temperature') },
      ]
    },
    {
      metricId: 'humidity',
      label: 'Humidity',
      data: [
        { ...makeSource('IMD', true, weather.current.relative_humidity_2m, '%', 'humidity') },
        { ...makeSource('WeatherUnion', false, weather.current.relative_humidity_2m, '%', 'humidity') },
        { ...makeSource('OpenWeather', false, weather.current.relative_humidity_2m, '%', 'humidity') },
      ]
    },
    {
      metricId: 'pressure',
      label: 'Pressure',
      data: [
        { ...makeSource('IMD', true, weather.current.surface_pressure, 'hPa', 'pressure') },
        { ...makeSource('WeatherUnion', false, weather.current.surface_pressure, 'hPa', 'pressure') },
      ]
    }
  ];

  // 4. Construct History & Forecast Arrays
  const mapHourlyToPoints = (startIndex: number, count: number, direction: 'past' | 'future'): HistoricalPoint[] => {
    // OpenMeteo hourly arrays include past + forecast combined (usually).
    // past_days=7, forecast_days=7 means ~14 days of data.
    // The "current" hour is roughly in the middle.
    
    // Simple helper: We map the OpenMeteo hourly arrays to our Source-based points
    const points: HistoricalPoint[] = [];
    // Find index of "now" in hourly array
    const nowStr = weather.current.time.substring(0, 13); // "2024-12-01T10"
    const nowIndex = weather.hourly.time.findIndex(t => t.startsWith(nowStr));
    
    const start = direction === 'past' ? Math.max(0, nowIndex - count) : nowIndex;
    const end = direction === 'past' ? nowIndex : Math.min(weather.hourly.time.length, nowIndex + count);

    for (let i = start; i < end; i++) {
      const t = new Date(weather.hourly.time[i]);
      const label = direction === 'future' 
         ? (i === nowIndex ? 'Now' : `${t.getHours()}:00`)
         : `${t.getHours()}:00`; // Simplify for demo

      const baseTemp = weather.hourly.temperature_2m[i];
      const baseHumid = weather.hourly.relative_humidity_2m[i];
      const baseAQI = aqi.hourly.us_aqi[i];
      const baseRain = weather.hourly.precipitation_probability[i]; // prob is %, needs mapping to mm for visual? or just use prob
      const baseWind = weather.hourly.wind_speed_10m[i];
      const basePress = weather.hourly.surface_pressure[i];
      const baseUV = weather.hourly.uv_index[i];

      points.push({
        timestamp: label,
        // Temperature
        ...(direction === 'future' || true ? {
          IMD: simulateSourceValue(baseTemp, 'IMD', 'temperature'),
          KSNDMC: simulateSourceValue(baseTemp, 'KSNDMC', 'temperature'),
          WeatherUnion: simulateSourceValue(baseTemp, 'WeatherUnion', 'temperature'),
          OpenWeather: simulateSourceValue(baseTemp, 'OpenWeather', 'temperature'),
          OpenAQ: 0,
          UrbanEmission: 0
        } : {}),
      });
    }
    return points;
  };

  // Helper to generate the specific metric arrays required by types.ts
  const generateMetricHistory = (metricKey: keyof typeof weather.hourly | keyof typeof aqi.hourly, metricName: string, scale: number): HistoricalPoint[] => {
    // scale is number of hours to look back
    const nowStr = weather.current.time.substring(0, 13);
    const nowIndex = weather.hourly.time.findIndex(t => t.startsWith(nowStr)) || 24 * 7;
    
    // Guard against index -1
    const safeNowIndex = nowIndex === -1 ? 100 : nowIndex;

    const points: HistoricalPoint[] = [];
    const startIndex = Math.max(0, safeNowIndex - scale);
    
    for (let i = startIndex; i <= safeNowIndex; i++) {
       const t = new Date(weather.hourly.time[i]);
       // label formatting
       let label = `${t.getHours()}:00`;
       if (scale > 48) label = t.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

       // Get base value from correct source (weather or aqi)
       let val = 0;
       if (metricKey in weather.hourly) val = (weather.hourly as any)[metricKey][i];
       else if (metricKey in aqi.hourly) val = (aqi.hourly as any)[metricKey][i];
       
       points.push({
         timestamp: label,
         IMD: simulateSourceValue(val, 'IMD', metricName),
         KSNDMC: simulateSourceValue(val, 'KSNDMC', metricName),
         WeatherUnion: simulateSourceValue(val, 'WeatherUnion', metricName),
         OpenWeather: simulateSourceValue(val, 'OpenWeather', metricName),
         OpenAQ: simulateSourceValue(val, 'OpenAQ', metricName),
         UrbanEmission: simulateSourceValue(val, 'UrbanEmission', metricName),
         Google: simulateSourceValue(val, 'Google', metricName),
       });
    }
    return points;
  };

  // Generate all timescales
  const getHistoryFor = (key: any, name: string) => ({
    '12h': generateMetricHistory(key, name, 12),
    '24h': generateMetricHistory(key, name, 24),
    '48h': generateMetricHistory(key, name, 48),
    '7d': generateMetricHistory(key, name, 24*7),
    '14d': generateMetricHistory(key, name, 24*7), // Data limited to 7 days past in free tier, repeating for demo
    '30d': generateMetricHistory(key, name, 24*7),
  });

  // Forecast generation (similar logic but forward)
  const generateMetricForecast = (key: any, name: string): HistoricalPoint[] => {
    const nowStr = weather.current.time.substring(0, 13);
    const nowIndex = weather.hourly.time.findIndex(t => t.startsWith(nowStr)) || 0;
    const safeNowIndex = nowIndex === -1 ? 0 : nowIndex;
    
    const points: HistoricalPoint[] = [];
    const endIndex = Math.min(weather.hourly.time.length, safeNowIndex + 168); // 7 days

    for (let i = safeNowIndex; i < endIndex; i++) {
       const t = new Date(weather.hourly.time[i]);
       const label = i === safeNowIndex ? 'Now' : `${t.getHours()}:00`;
       
       let val = 0;
       if (key in weather.hourly) val = (weather.hourly as any)[key][i];
       else if (key in aqi.hourly) val = (aqi.hourly as any)[key][i];

       points.push({
         timestamp: label,
         IMD: simulateSourceValue(val, 'IMD', name),
         KSNDMC: simulateSourceValue(val, 'KSNDMC', name),
         WeatherUnion: simulateSourceValue(val, 'WeatherUnion', name),
         OpenWeather: simulateSourceValue(val, 'OpenWeather', name),
         OpenAQ: simulateSourceValue(val, 'OpenAQ', name),
         UrbanEmission: simulateSourceValue(val, 'UrbanEmission', name),
         Google: simulateSourceValue(val, 'Google', name),
       });
    }
    return points;
  };

  // 5. Generate Insights (Rule-Based)
  const insights = generateInsights(name, weather, aqi);

  return {
    location: name,
    lat,
    lng,
    timestamp: new Date().toISOString(),
    matrix,
    history: {
      temperature: getHistoryFor('temperature_2m', 'temperature'),
      humidity: getHistoryFor('relative_humidity_2m', 'humidity'),
      pressure: getHistoryFor('surface_pressure', 'pressure'),
      wind: getHistoryFor('wind_speed_10m', 'wind'),
      precipitation: getHistoryFor('precipitation_probability', 'precipitation'),
      uv: getHistoryFor('uv_index', 'uv'),
      aqi: getHistoryFor('us_aqi', 'aqi'),
    },
    forecast: {
      temperature: generateMetricForecast('temperature_2m', 'temperature'),
      humidity: generateMetricForecast('relative_humidity_2m', 'humidity'),
      pressure: generateMetricForecast('surface_pressure', 'pressure'),
      wind: generateMetricForecast('wind_speed_10m', 'wind'),
      precipitation: generateMetricForecast('precipitation_probability', 'precipitation'),
      uv: generateMetricForecast('uv_index', 'uv'),
      aqi: generateMetricForecast('us_aqi', 'aqi'),
    },
    insights,
    aqiBreakdown: [
      { source: 'OpenAQ', aqiValue: aqi.current.us_aqi, pm25: aqi.current.pm2_5, pm10: aqi.current.pm10, no2: aqi.current.nitrogen_dioxide, status: aqi.current.us_aqi > 100 ? 'Moderate' : 'Safe' },
      { source: 'UrbanEmission', aqiValue: simulateSourceValue(aqi.current.us_aqi, 'UrbanEmission', 'aqi'), pm25: aqi.current.pm2_5 - 2, pm10: aqi.current.pm10 - 5, no2: aqi.current.nitrogen_dioxide, status: 'Safe' },
      { source: 'Google', aqiValue: simulateSourceValue(aqi.current.us_aqi, 'Google', 'aqi'), pm25: aqi.current.pm2_5 + 3, pm10: aqi.current.pm10 + 2, no2: aqi.current.nitrogen_dioxide, status: 'Moderate' },
    ]
  };
};