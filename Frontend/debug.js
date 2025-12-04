// Debug utility to check API key configuration
// Temporary file - can be deleted after debugging

import { config } from './config';

console.log('=== API Key Debug Info ===');
console.log('Mapbox Token:', config.MAPBOX_TOKEN ? `${config.MAPBOX_TOKEN.substring(0, 10)}...` : 'MISSING');
console.log('Tomorrow.io Key:', config.TOMORROW_API_KEY ? `${config.TOMORROW_API_KEY.substring(0, 10)}...` : 'MISSING');
console.log('Environment Variables:');
console.log('  VITE_MAPBOX_TOKEN:', import.meta.env.VITE_MAPBOX_TOKEN ? 'SET' : 'NOT SET');
console.log('  VITE_TOMORROW_API_KEY:', import.meta.env.VITE_TOMORROW_API_KEY ? 'SET' : 'NOT SET');
console.log('==========================');

export const debugConfig = () => {
  return {
    mapboxTokenPresent: !!config.MAPBOX_TOKEN && config.MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN_HERE',
    tomorrowKeyPresent: !!config.TOMORROW_API_KEY && config.TOMORROW_API_KEY !== 'YOUR_TOMORROW_API_KEY_HERE',
    mapboxTokenLength: config.MAPBOX_TOKEN?.length || 0,
    tomorrowKeyLength: config.TOMORROW_API_KEY?.length || 0,
  };
};
