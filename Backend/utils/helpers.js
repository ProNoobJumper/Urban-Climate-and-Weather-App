/**
 * Helper Utility Functions
 * Common utilities for the Urban Climate Backend
 */

/**
 * Generate a URL-safe city ID from city name
 * @param {string} name - City name (e.g., "New Delhi")
 * @returns {string} City ID (e.g., "new_delhi")
 */
const generateCityId = (name) => {
  if (!name || typeof name !== 'string') {
    throw new Error('City name must be a non-empty string');
  }
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

/**
 * Validate geographic coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid coordinates
 */
const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  // Latitude must be between -90 and 90
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  
  // Longitude must be between -180 and 180
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  
  return true;
};

/**
 * Format timestamp to ISO string
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted timestamp
 */
const formatTimestamp = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    return d.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Promise-based delay/sleep function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Safely parse JSON with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed object or fallback
 */
const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return fallback;
  }
};

/**
 * Check if a value is a valid number
 * @param {any} value - Value to check
 * @returns {boolean} True if valid number
 */
const isValidNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
const roundTo = (num, decimals = 2) => {
  if (!isValidNumber(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * Get date range for queries
 * @param {number} days - Number of days to go back
 * @returns {Object} Object with startDate and endDate
 */
const getDateRange = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate,
    endDate
  };
};

/**
 * Normalize city name for comparison
 * @param {string} cityName - City name to normalize
 * @returns {string} Normalized city name
 */
const normalizeCityName = (cityName) => {
  if (!cityName) return '';
  
  return cityName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
};

/**
 * Check if date is valid
 * @param {any} date - Date to validate
 * @returns {boolean} True if valid date
 */
const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Get current timestamp in milliseconds
 * @returns {number} Current timestamp
 */
const getCurrentTimestamp = () => {
  return Date.now();
};

/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
const celsiusToFahrenheit = (celsius) => {
  if (!isValidNumber(celsius)) return null;
  return roundTo((celsius * 9/5) + 32, 1);
};

/**
 * Convert Fahrenheit to Celsius
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
const fahrenheitToCelsius = (fahrenheit) => {
  if (!isValidNumber(fahrenheit)) return null;
  return roundTo((fahrenheit - 32) * 5/9, 1);
};

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

module.exports = {
  generateCityId,
  validateCoordinates,
  formatTimestamp,
  calculateDistance,
  sleep,
  safeJsonParse,
  isValidNumber,
  roundTo,
  getDateRange,
  normalizeCityName,
  isValidDate,
  getCurrentTimestamp,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  chunkArray
};
