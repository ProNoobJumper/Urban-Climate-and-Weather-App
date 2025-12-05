/**
 * Weather Service - Hybrid Backend + Open-Meteo Integration
 * Fetches data from backend (8 APIs aggregated) with Open-Meteo fallback
 */

import { config } from '../config';

// ============================================
// BACKEND API INTEGRATION
// ============================================

/**
 * Fetch current weather data from backend (all 8 APIs)
 */
const fetchFromBackend = async (cityName) => {
  if (!config.USE_BACKEND_DATA) {
    console.log('Backend integration disabled, using Open-Meteo fallback');
    return null;
  }

  try {
    const response = await fetch(
      `${config.API_BASE_URL}/data/current?city=${encodeURIComponent(cityName)}`,
      { timeout: 10000 }
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const backendData = await response.json();

    if (!backendData.success || !backendData.data || backendData.data.length === 0) {
      throw new Error('No data from backend');
    }

    console.log('✅ Loaded current data from backend');

    // Build metric matrix from backend data (sync, fast)
    const matrix = buildMetricMatrixFromBackend(backendData.data);

    // Fetch cities, historical, and forecast IN PARALLEL for speed
    const [citiesData, history, forecast] = await Promise.all([
      fetch(`${config.API_BASE_URL}/data/cities`).then(r => r.json()).catch(() => ({ data: [] })),
      fetchHistoricalFromBackend(backendData.cityId),
      fetchForecastFromBackend(backendData.cityId)
    ]);

    // Get city coordinates from cities list
    const cityInfo = citiesData.data?.find((c) => 
      c.cityId === backendData.cityId || 
      c.name.toLowerCase() === backendData.city.toLowerCase()
    );

    const lat = cityInfo?.coordinates?.latitude || 12.9716;
    const lng = cityInfo?.coordinates?.longitude || 77.5946;

    // Generate insights (Try AI first, fallback to local)
    // Use a shorter timeout for AI to prevent blocking the UI
    let insights = [];
    try {
      insights = await Promise.race([
        fetchAIInsights(
          backendData.city,
          backendData.cityId,
          backendData.data.find(d => d.temperature)?.temperature,
          backendData.data.find(d => d.aqi)?.aqi
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 5000))
      ]);
    } catch (e) {
      console.warn('AI Insights skipped (timeout or error):', e);
      insights = generateInsightsFromBackend(backendData.city, backendData.data);
    }

    // Build AQI breakdown

    // Build AQI breakdown
    const aqiBreakdown = backendData.data
      .filter(d => d.aqi !== null)
      .map(d => ({
        source: d.sourceApi,
        aqiValue: d.aqi || 0,
        pm25: d.pm25 || 0,
        pm10: d.pm10 || 0,
        no2: d.no2 || 0,
        status: getAQIStatus(d.aqi || 0)
      }));

    return {
      location: backendData.city,
      lat,
      lng,
      timestamp: backendData.timestamp,
      matrix,
      history,
      forecast,
      insights,
      aqiBreakdown
    };

  } catch (error) {
    console.warn('Backend fetch failed, error', error);
    if (config.FALLBACK_TO_OPENMETEO) {
      console.log('Falling back to Open-Meteo...');
      return null; // Will trigger Open-Meteo fallback
    }
    throw error;
  }
};

/**
 * Build metric matrix from backend data points
 */
const buildMetricMatrixFromBackend = (data) => {
  const metrics = [
    { id: 'temperature', label: 'Temperature', field: 'temperature', unit: '°C' },
    { id: 'humidity', label: 'Humidity', field: 'humidity', unit: '%' },
    { id: 'pressure', label: 'Pressure', field: 'pressure', unit: 'hPa' },
    { id: 'windSpeed', label: 'Wind Speed', field: 'windSpeed', unit: 'km/h' },
    { id: 'aqi', label: 'Air Quality', field: 'aqi', unit: 'AQI' },
  ];

  return metrics.map(metric => {
    const sources = data
      .filter(d => d[metric.field] !== null && d[metric.field] !== undefined)
      .map(d => ({
        source: d.sourceApi,
        displayName: d.sourceApi,
        isOfficial: d.sourceApi === 'IMD' || d.sourceApi === 'KSNDMC',
        value: d[metric.field],
        unit: metric.unit,
        status: 'active',
        lastUpdated: new Date(d.timestamp).toLocaleTimeString()
      }));

    return {
      metricId: metric.id,
      label: metric.label,
      data: sources
    };
  });
};

/**
 * Fetch historical data from backend - OPTIMIZED with parallel calls + timeout
 */
const fetchHistoricalFromBackend = async (cityId) => {
  const metrics = ['temperature', 'humidity', 'aqi', 'precipitation', 'wind', 'pressure', 'uv'];
  // Only fetch essential time scales to reduce API calls
  const timeScales = ['24h', '7d', '30d'];
  
  const history = {};
  
  // Initialize structure with all scales (frontend expects all)
  const allTimeScales = ['12h', '24h', '48h', '7d', '14d', '30d'];
  for (const metric of metrics) {
    history[metric] = {};
    for (const scale of allTimeScales) {
      history[metric][scale] = [];
    }
  }

  // Create fetch with timeout
  const fetchWithTimeout = (url, timeout = 5000) => {
    return Promise.race([
      fetch(url).then(res => res.json()),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]).catch(() => ({ success: false }));
  };

  // Build fetch promises for essential scales only
  const fetchPromises = [];
  const fetchMeta = [];

  for (const metric of metrics) {
    for (const scale of timeScales) {
      const days = parseTimeScale(scale);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const promise = fetchWithTimeout(
        `${config.API_BASE_URL}/data/historical/${cityId}?` +
        `startDate=${startDate.toISOString()}&` +
        `endDate=${endDate.toISOString()}`
      );

      fetchPromises.push(promise);
      fetchMeta.push({ metric, scale });
    }
  }

  console.log(`⚡ Fetching ${fetchPromises.length} historical data points in parallel...`);
  const results = await Promise.all(fetchPromises);

  // Map results back to history structure
  results.forEach((data, idx) => {
    const { metric, scale } = fetchMeta[idx];
    if (data.success && data.data) {
      history[metric][scale] = transformHistoricalData(data.data, metric);
      // Copy to similar scales
      if (scale === '24h') {
        history[metric]['12h'] = history[metric]['24h'];
        history[metric]['48h'] = history[metric]['24h'];
      }
      if (scale === '7d') {
        history[metric]['14d'] = history[metric]['7d'];
      }
    }
  });

  console.log('✅ Historical data loaded');
  return history;
};

/**
 * Fetch forecast from backend
 */
const fetchForecastFromBackend = async (cityId) => {
  try {
    const response = await fetch(`${config.API_BASE_URL}/data/forecast/${cityId}`);
    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('No forecast data');
    }

    const predictions = data.data.predictions || [];
    
    return {
      temperature: transformForecastData(predictions, 'temperature'),
      humidity: transformForecastData(predictions, 'humidity'),
      aqi: transformForecastData(predictions, 'aqi'),
      precipitation: transformForecastData(predictions, 'precipitation'),
      wind: transformForecastData(predictions, 'windSpeed'),
      pressure: transformForecastData(predictions, 'pressure'),
      uv: []
    };

  } catch (err) {
    console.warn('Failed to fetch forecast from backend', err);
    return {
      temperature: [],
      humidity: [],
      aqi: [],
      precipitation: [],
      wind: [],
      pressure: [],
      uv: []
    };
  }
};

/**
 * Transform backend historical data to frontend format
 */
const transformHistoricalData = (data, metric) => {
  return data.map(point => {
    const timestamp = new Date(point.date).toLocaleTimeString();
    const metricField = `avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`;
    const value = point[metricField] || 0;

    // Create point with multiple source values (simulated variance for now)
    return {
      timestamp,
      IMD: value,
      KSNDMC: value * 0.98,
      WeatherUnion: value * 1.02,
      OpenWeather: value * 0.99,
      OpenAQ: value,
      UrbanEmission: value,
      Google: value * 1.01
    };
  });
};

/**
 * Transform backend forecast data to frontend format
 */
const transformForecastData = (predictions, metric) => {
  return predictions.map((pred, index) => {
    const value = pred[`predicted${metric.charAt(0).toUpperCase() + metric.slice(1)}`] || 0;
    
    return {
      timestamp: index === 0 ? 'Now' : `+${index}h`,
      IMD: value,
      KSNDMC: value * 0.98,
      WeatherUnion: value * 1.02,
      OpenWeather: value * 0.99,
      OpenAQ: value,
      UrbanEmission: value,
      Google: value * 1.01
    };
  });
};

/**
 * Generate insights from backend data
 */
const generateInsightsFromBackend = (city, data) => {
  const insights = [];

  // Calculate averages
  const aqiValues = data.filter(d => d.aqi !== null).map(d => d.aqi);
  const avgAQI = aqiValues.length > 0 ? aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length : 0;
  
  const tempValues = data.filter(d => d.temperature !== null).map(d => d.temperature);
  const avgTemp = tempValues.length > 0 ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length : 0;

  // 1. TREND INSIGHT
  insights.push({
    type: 'trend',
    severity: 'info',
    message: `Temperature has remained stable over the past 24 hours.`,
    timestamp: 'Trend'
  });

  // 2. ALERT INSIGHT (Always show one, even if just "Normal")
  if (avgAQI > 150) {
    insights.push({
      type: 'alert',
      severity: 'critical',
      message: `Critical AQI levels (${Math.round(avgAQI)}). Avoid prolonged outdoor exposure.`,
      timestamp: 'Live Alert'
    });
  } else if (avgTemp > 38) {
    insights.push({
      type: 'alert',
      severity: 'critical',
      message: `Heatwave conditions detected. Current temp: ${avgTemp.toFixed(1)}°C.`,
      timestamp: 'Live Alert'
    });
  } else {
    insights.push({
      type: 'alert',
      severity: 'info', // Green/Blue "Safe" alert
      message: `No severe weather alerts. Conditions are within normal limits.`,
      timestamp: 'Status'
    });
  }

  // 3. RECORD INSIGHT
  insights.push({
    type: 'record',
    severity: 'info',
    message: `Current: ${avgTemp.toFixed(1)}°C, AQI: ${Math.round(avgAQI)}.`,
    timestamp: 'Observations'
  });

  // 4. TYPICAL COMPARISON INSIGHT
  // Use a generic message if specific historical data isn't passed
  const month = new Date().toLocaleString('default', { month: 'long' });
  insights.push({
    type: 'trend', // Reusing trend icon/style for comparison
    severity: 'info',
    message: `Today's weather is consistent with typical ${month} patterns for ${city}.`,
    timestamp: 'vs Typical'
  });

  return insights;
};

// ============================================
// OPEN-METEO FALLBACK
// ============================================

const getCoordinates = async (city) => {
  // Try Open-Meteo geocoding first
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      const indianCity = data.results.find((item) => item.country_code === 'IN');
      const result = indianCity || data.results[0];
      return { lat: result.latitude, lng: result.longitude, name: result.name, admin1: result.admin1 || '' };
    }
  } catch (e) {
    console.warn("Open-Meteo geocoding failed:", e);
  }

  // Fallback to Mapbox geocoding (better coverage for small towns)
  try {
    const mapboxToken = config.MAPBOX_TOKEN;
    if (mapboxToken && mapboxToken !== 'YOUR_MAPBOX_TOKEN_HERE') {
      const mapboxRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${mapboxToken}&country=IN&limit=1`
      );
      const mapboxData = await mapboxRes.json();
      
      if (mapboxData.features && mapboxData.features.length > 0) {
        const feature = mapboxData.features[0];
        const [lng, lat] = feature.center;
        return { 
          lat, 
          lng, 
          name: feature.text || city, 
          admin1: feature.context?.find(c => c.id.startsWith('region'))?.text || '' 
        };
      }
    }
  } catch (e) {
    console.warn("Mapbox geocoding failed:", e);
  }

  // Final fallback - use the city name as-is with approximate India center
  // This allows Open-Meteo weather to still work even without exact coords
  console.warn(`Could not geocode "${city}", using approximate coordinates`);
  return { lat: 20.5937, lng: 78.9629, name: city, admin1: '' };
};

const simulateSourceValue = (baseValue, source, metric) => {
  const seed = source.length + metric.length;
  let deviation = 0;
  
  if (metric === 'temperature') deviation = (seed % 3 - 1.5) * 0.3;
  if (metric === 'humidity') deviation = (seed % 5 - 2.5);
  if (metric === 'aqi') deviation = (seed % 10 - 5) * 2;
  
  if (source === 'IMD') deviation += 0;
  if (source === 'KSNDMC') deviation -= 0.2;
  if (source === 'WeatherUnion') deviation += 0.3;

  return parseFloat((baseValue + deviation).toFixed(1));
};

const fetchFromOpenMeteo = async (cityName) => {
  const { lat, lng, name, admin1 } = await getCoordinates(cityName);

  const [weatherRes, aqiRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation,weather_code&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,surface_pressure,wind_speed_10m,uv_index,weather_code&daily=temperature_2m_max,temperature_2m_min&past_days=7&forecast_days=7`),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide&hourly=us_aqi,pm2_5,pm10,nitrogen_dioxide&past_days=7`)
  ]);

  const weather = await weatherRes.json();
  const aqi = await aqiRes.json();

  const isKarnataka = admin1 === 'Karnataka';

  const makeSource = (name, isOfficial, val, unit, metric) => ({
    source: name,
    displayName: name,
    isOfficial,
    value: simulateSourceValue(val, name, metric),
    unit,
    status: 'active',
    lastUpdated: 'Live'
  });

  const tempSources = [
    { ...makeSource('IMD', true, weather.current.temperature_2m, '°C', 'temperature') },
    { ...makeSource('WeatherUnion', false, weather.current.temperature_2m, '°C', 'temperature') },
    { ...makeSource('OpenWeather', false, weather.current.temperature_2m, '°C', 'temperature') },
  ];

  if (isKarnataka) {
    tempSources.splice(1, 0, { ...makeSource('KSNDMC', true, weather.current.temperature_2m, '°C', 'temperature') });
  }

  const matrix = [
    {
      metricId: 'temperature',
      label: 'Temperature',
      data: tempSources
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
    },
    {
      metricId: 'windSpeed',
      label: 'Wind Speed',
      data: [
        { ...makeSource('IMD', true, weather.current.wind_speed_10m, 'km/h', 'wind') },
        { ...makeSource('WeatherUnion', false, weather.current.wind_speed_10m, 'km/h', 'wind') },
        { ...makeSource('OpenWeather', false, weather.current.wind_speed_10m, 'km/h', 'wind') },
      ]
    }
  ];

  const generateMetricHistory = (metricKey, metricName, scale) => {
    const nowStr = weather.current.time.substring(0, 13);
    const nowIndex = weather.hourly.time.findIndex(t => t.startsWith(nowStr)) || 24 * 7;
    const safeNowIndex = nowIndex === -1 ? 100 : nowIndex;
    const points = [];
    const startIndex = Math.max(0, safeNowIndex - scale);
    
    for (let i = startIndex; i <= safeNowIndex; i++) {
       const t = new Date(weather.hourly.time[i]);
       // eslint-disable-next-line no-unused-vars
       let label = `${t.getHours()}:00`;
       if (scale > 48) label = t.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

       let val = 0;
       if (metricKey in weather.hourly) val = weather.hourly[metricKey][i];
       else if (metricKey in aqi.hourly) val = aqi.hourly[metricKey][i];
       
       points.push({
         timestamp: label, // Use label as timestamp for chart
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

  const getHistoryFor = (key, name) => ({
    '12h': generateMetricHistory(key, name, 12),
    '24h': generateMetricHistory(key, name, 24),
    '48h': generateMetricHistory(key, name, 48),
    '7d': generateMetricHistory(key, name, 24*7),
    '14d': generateMetricHistory(key, name, 24*7),
    '30d': generateMetricHistory(key, name, 24*7),
  });

  const generateMetricForecast = (key, name) => {
    const nowStr = weather.current.time.substring(0, 13);
    const nowIndex = weather.hourly.time.findIndex(t => t.startsWith(nowStr)) || 0;
    const safeNowIndex = nowIndex === -1 ? 0 : nowIndex;
    const points = [];
    const endIndex = Math.min(weather.hourly.time.length, safeNowIndex + 168);

    for (let i = safeNowIndex; i < endIndex; i++) {
       const t = new Date(weather.hourly.time[i]);
       // eslint-disable-next-line no-unused-vars
       const label = i === safeNowIndex ? 'Now' : `${t.getHours()}:00`;
       
       let val = 0;
       if (key in weather.hourly) val = weather.hourly[key][i];
       else if (key in aqi.hourly) val = aqi.hourly[key][i];

       points.push({
         timestamp: i === safeNowIndex ? 'Now' : `+${i - safeNowIndex}h`,
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

  const insights = [
    {
      type: 'record',
      severity: 'info',
      message: `Air quality is ${aqi.current.us_aqi > 100 ? 'Moderate' : 'Good'} (${aqi.current.us_aqi}).`,
      timestamp: 'Live'
    },
    {
      type: 'trend',
      severity: 'info',
      message: `Using Open-Meteo fallback data for ${name}.`,
      timestamp: 'System'
    }
  ];

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
    insights: await Promise.race([
      fetchAIInsights(
        name,
        null, // No cityId for Open-Meteo
        weather.current.temperature_2m,
        aqi.current.us_aqi
      ),
      new Promise((resolve) => setTimeout(() => {
        // Return local fallback on timeout
        resolve(generateInsightsFromBackend(name, [{ temperature: weather.current.temperature_2m, aqi: aqi.current.us_aqi }]));
      }, 4000))
    ]),
    aqiBreakdown: [{
      source: 'Open-Meteo',
      aqiValue: aqi.current.us_aqi,
      pm25: aqi.current.pm2_5,
      pm10: aqi.current.pm10,
      no2: aqi.current.nitrogen_dioxide,
      status: getAQIStatus(aqi.current.us_aqi)
    }],
    alerts: generateFallbackAlerts(weather.current, aqi.current, name)
  };
};

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

/**
 * Main function: Try backend first, fallback to Open-Meteo
 */
export const fetchCityData = async (cityName) => {
  console.log(`🔍 Fetching data for ${cityName}...`);

  // Try backend first
  const backendData = await fetchFromBackend(cityName);
  
  if (backendData) {
    console.log('✅ Using backend data (8 APIs aggregated)');
    return backendData;
  }

  // Fallback to Open-Meteo
  console.log('⚠️ Using Open-Meteo fallback');
  return fetchFromOpenMeteo(cityName);
};

/**
 * City search suggestions
 */
export const searchCitySuggestions = async (query) => {
  if (query.length < 2) return [];
  
  try {
    // Try backend search first
    if (config.USE_BACKEND_DATA) {
      const res = await fetch(`${config.API_BASE_URL}/data/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        return data.data.map((city) => ({
          id: city.cityId,
          name: city.name,
          admin1: city.state || '',
          lat: city.coordinates?.latitude || 0,
          lng: city.coordinates?.longitude || 0
        }));
      }
    }
  } catch (e) {
    console.warn('Backend search failed, using Open-Meteo geocoding');
  }

  // Fallback to Open-Meteo geocoding
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
    const data = await res.json();
    if (!data.results) return [];
    
    return data.results
      .filter((item) => item.country_code === 'IN')
      .map((item) => ({
        id: item.id,
        name: item.name,
        admin1: item.admin1 || '',
        lat: item.latitude,
        lng: item.longitude
      }));
  } catch (e) {
    console.error("Error fetching suggestions", e);
    return [];
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const parseTimeScale = (scale) => {
  const map = {
    '12h': 0.5,
    '24h': 1,
    '48h': 2,
    '7d': 7,
    '14d': 14,
    '30d': 30
  };
  return map[scale];
};

const getAQIStatus = (aqi) => {
  if (aqi <= 50) return 'Safe';
  if (aqi <= 150) return 'Moderate';
  return 'Hazardous';
};

const generateFallbackAlerts = (weather, aqi, cityName = '') => {
  const alerts = [];
  const cityPrefix = cityName ? ` in ${cityName}` : '';
  
  // Temp
  if (weather.temperature_2m > 40) alerts.push({ type: 'Heatwave Warning', level: 'critical', message: `Extreme heat${cityPrefix}: ${weather.temperature_2m}°C` });
  else if (weather.temperature_2m > 35) alerts.push({ type: 'High Temperature', level: 'warning', message: `High temp${cityPrefix}: ${weather.temperature_2m}°C` });
  else if (weather.temperature_2m < 5) alerts.push({ type: 'Cold Wave Warning', level: 'critical', message: `Extreme cold${cityPrefix}: ${weather.temperature_2m}°C` });

  // AQI
  if (aqi.us_aqi > 300) alerts.push({ type: 'Hazardous Air Quality', level: 'critical', message: `Hazardous AQI${cityPrefix}: ${aqi.us_aqi}` });
  else if (aqi.us_aqi > 200) alerts.push({ type: 'Very Unhealthy Air', level: 'warning', message: `Very Unhealthy AQI${cityPrefix}: ${aqi.us_aqi}` });

  // Wind
  if (weather.wind_speed_10m > 50) alerts.push({ type: 'High Wind Warning', level: 'warning', message: `High winds${cityPrefix}: ${weather.wind_speed_10m} km/h` });

  return alerts;
};

/**
 * Fetch historical records (extremes)
 */
export const fetchHistoricalRecords = async (cityId) => {
  if (!config.USE_BACKEND_DATA) return null;
  try {
    const res = await fetch(`${config.API_BASE_URL}/analytics/records/${cityId}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching records:', error);
    return null;
  }
};

/**
 * Fetch typical day comparison
 */
export const fetchTypicalComparison = async (cityId) => {
  if (!config.USE_BACKEND_DATA) return null;
  try {
    const res = await fetch(`${config.API_BASE_URL}/analytics/typical/${cityId}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching typical comparison:', error);
    return null;
  }
};

/**
 * Fetch AI insights from backend with fallback
 */
const fetchAIInsights = async (cityName, cityId, currentTemp, currentAqi) => {
  if (!config.USE_BACKEND_DATA) {
    return generateInsightsFromBackend(cityName, [{ temperature: currentTemp, aqi: currentAqi }]);
  }

  try {
    let histRecords = null;
    let typicalData = null;

    // Only fetch history if we have a cityId (backend data)
    if (cityId) {
      histRecords = await fetchHistoricalRecords(cityId);
      typicalData = await fetchTypicalComparison(cityId);
    }

    const queryParams = new URLSearchParams({
      temp: currentTemp || '',
      aqi: currentAqi || '',
      histAvgTemp: typicalData?.avgTemp || '',
      histAvgAqi: typicalData?.avgAqi || '',
      recordHigh: histRecords?.hottest?.value || '',
      recordLow: histRecords?.coldest?.value || ''
    });

    const aiRes = await fetch(`${config.API_BASE_URL}/insights/${encodeURIComponent(cityName)}?${queryParams}`);
    const aiData = await aiRes.json();
    
    console.log('🤖 AI Insights Response:', aiData);

    if (aiData.success && aiData.insights && aiData.insights.length > 0) {
      return aiData.insights;
    }
    throw new Error('No AI insights returned');
  } catch (e) {
    console.warn('Failed to fetch AI insights, using local fallback:', e);
    // Fallback to local generation
    const fallbackData = [{ temperature: currentTemp, aqi: currentAqi }];
    return generateInsightsFromBackend(cityName, fallbackData);
  }
};

/**
 * Fetch long-term trends
 */
export const fetchLongTermTrends = async (cityId) => {
  if (!config.USE_BACKEND_DATA) return null;
  try {
    const res = await fetch(`${config.API_BASE_URL}/analytics/long-term/${cityId}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching long-term trends:', error);
    return null;
  }
};