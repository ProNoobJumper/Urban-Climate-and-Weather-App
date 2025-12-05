// Configuration for map and API keys
export const config = {
  // Backend API configuration
  USE_BACKEND_DATA: true, // Set to true to use backend APIs, false for Open-Meteo only
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  FALLBACK_TO_OPENMETEO: true, // Fallback to Open-Meteo if backend fails
  
  // Mapbox configuration
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE',
  
  // Tomorrow.io configuration  
  TOMORROW_API_KEY: import.meta.env.VITE_TOMORROW_API_KEY || 'YOUR_TOMORROW_API_KEY_HERE',
  
  // Windy configuration (legacy - can be removed after migration)
  WINDY_API_KEY: import.meta.env.VITE_WINDY_API_KEY || '',
  
  // Map initial settings
  INDIA_CENTER: [78.9629, 20.5937], // [longitude, latitude]
  INDIA_ZOOM: 5,
  CITY_ZOOM: 11,
  
  // Animation settings
  ANIMATION_SPEED: 0.8,
  ANIMATION_CURVE: 1.5,
  ANIMATION_PITCH: 45,
};
