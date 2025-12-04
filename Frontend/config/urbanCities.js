// Urban Cities Database for India
// Only these cities have weather data available

export const urbanCitiesDB = [
  { name: 'Mumbai', coordinates: [72.8777, 19.0760], state: 'Maharashtra' },
  { name: 'Delhi', coordinates: [77.1025, 28.7041], state: 'Delhi' },
  { name: 'Bangalore', coordinates: [77.5946, 12.9716], state: 'Karnataka' },
  { name: 'Bengaluru', coordinates: [77.5946, 12.9716], state: 'Karnataka' }, // Alias
  { name: 'Hyderabad', coordinates: [78.4867, 17.3850], state: 'Telangana' },
  { name: 'Chennai', coordinates: [80.2707, 13.0827], state: 'Tamil Nadu' },
  { name: 'Kolkata', coordinates: [88.3639, 22.5726], state: 'West Bengal' },
  { name: 'Pune', coordinates: [73.8567, 18.5204], state: 'Maharashtra' },
  { name: 'Ahmedabad', coordinates: [72.5714, 23.0225], state: 'Gujarat' },
  { name: 'Jaipur', coordinates: [75.7873, 26.9124], state: 'Rajasthan' },
  { name: 'Lucknow', coordinates: [80.9462, 26.8467], state: 'Uttar Pradesh' },
  { name: 'Kanpur', coordinates: [80.3319, 26.4499], state: 'Uttar Pradesh' },
  { name: 'Nagpur', coordinates: [79.0882, 21.1458], state: 'Maharashtra' },
  { name: 'Indore', coordinates: [75.8577, 22.7196], state: 'Madhya Pradesh' },
  { name: 'Thane', coordinates: [72.9781, 19.2183], state: 'Maharashtra' },
  { name: 'Bhopal', coordinates: [77.4126, 23.2599], state: 'Madhya Pradesh' },
  { name: 'Visakhapatnam', coordinates: [83.2185, 17.6868], state: 'Andhra Pradesh' },
  { name: 'Pimpri-Chinchwad', coordinates: [73.8047, 18.6298], state: 'Maharashtra' },
  { name: 'Patna', coordinates: [85.1376, 25.5941], state: 'Bihar' },
  { name: 'Vadodara', coordinates: [73.1812, 22.3072], state: 'Gujarat' },
  { name: 'Ghaziabad', coordinates: [77.4538, 28.6692], state: 'Uttar Pradesh' },
  { name: 'Ludhiana', coordinates: [75.8573, 30.9010], state: 'Punjab' },
  { name: 'Agra', coordinates: [78.0081, 27.1767], state: 'Uttar Pradesh' },
  { name: 'Nashik', coordinates: [73.7898, 19.9975], state: 'Maharashtra' },
  { name: 'Faridabad', coordinates: [77.3178, 28.4089], state: 'Haryana' },
  { name: 'Meerut', coordinates: [77.7064, 28.9845], state: 'Uttar Pradesh' },
  { name: 'Rajkot', coordinates: [70.8022, 22.3039], state: 'Gujarat' },
  { name: 'Kalyan-Dombivali', coordinates: [73.1355, 19.2403], state: 'Maharashtra' },
  { name: 'Vasai-Virar', coordinates: [72.7911, 19.4612], state: 'Maharashtra' },
  { name: 'Varanasi', coordinates: [82.9739, 25.3176], state: 'Uttar Pradesh' },
  { name: 'Srinagar', coordinates: [74.7973, 34.0837], state: 'Jammu and Kashmir' },
  { name: 'Aurangabad', coordinates: [75.3433, 19.8762], state: 'Maharashtra' },
  { name: 'Dhanbad', coordinates: [86.4304, 23.7957], state: 'Jharkhand' },
  { name: 'Amritsar', coordinates: [74.8723, 31.6340], state: 'Punjab' },
  { name: 'Navi Mumbai', coordinates: [73.0297, 19.0330], state: 'Maharashtra' },
  { name: 'Allahabad', coordinates: [81.8463, 25.4358], state: 'Uttar Pradesh' },
  { name: 'Prayagraj', coordinates: [81.8463, 25.4358], state: 'Uttar Pradesh' }, // Alias
  { name: 'Ranchi', coordinates: [85.3096, 23.3441], state: 'Jharkhand' },
  { name: 'Howrah', coordinates: [88.3103, 22.5958], state: 'West Bengal' },
  { name: 'Coimbatore', coordinates: [76.9558, 11.0168], state: 'Tamil Nadu' },
  { name: 'Jabalpur', coordinates: [79.9864, 23.1815], state: 'Madhya Pradesh' },
  { name: 'Gwalior', coordinates: [78.1828, 26.2183], state: 'Madhya Pradesh' },
  { name: 'Vijayawada', coordinates: [80.6480, 16.5062], state: 'Andhra Pradesh' },
  { name: 'Jodhpur', coordinates: [73.0243, 26.2389], state: 'Rajasthan' },
  { name: 'Madurai', coordinates: [78.1198, 9.9252], state: 'Tamil Nadu' },
  { name: 'Raipur', coordinates: [81.6296, 21.2514], state: 'Chhattisgarh' },
  { name: 'Kota', coordinates: [75.8648, 25.2138], state: 'Rajasthan' },
  { name: 'Chandigarh', coordinates: [76.7794, 30.7333], state: 'Chandigarh' },
  { name: 'Guwahati', coordinates: [91.7362, 26.1445], state: 'Assam' },
];

/**
 * Check if a city name is in the urban cities database
 * @param {string} cityName - Name of the city to check
 * @returns {boolean} - True if city is supported
 */
export const isUrbanCity = (cityName) => {
  if (!cityName) return false;
  const normalized = cityName.toLowerCase().trim();
  
  // Exact match first
  const exactMatch = urbanCitiesDB.some(city => 
    city.name.toLowerCase() === normalized
  );
  
  if (exactMatch) return true;
  
  // Partial match - check if any city name contains the search term or vice versa
  return urbanCitiesDB.some(city => {
    const cityLower = city.name.toLowerCase();
    return cityLower.includes(normalized) || normalized.includes(cityLower);
  });
};

/**
 * Get coordinates for a city
 * @param {string} cityName - Name of the city
 * @returns {[number, number] | null} - [longitude, latitude] or null
 */
export const getCityCoordinates = (cityName) => {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().trim();
  const city = urbanCitiesDB.find(c => 
    c.name.toLowerCase() === normalized
  );
  return city?.coordinates || null;
};

/**
 * Get city info by name
 * @param {string} cityName - Name of the city
 * @returns {object | null} - City object or null
 */
export const getCityInfo = (cityName) => {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().trim();
  return urbanCitiesDB.find(c => 
    c.name.toLowerCase() === normalized
  ) || null;
};

/**
 * Get all city names
 * @returns {string[]} - Array of city names
 */
export const getAllCityNames = () => {
  return urbanCitiesDB.map(city => city.name);
};
