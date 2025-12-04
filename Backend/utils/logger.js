/**
 * Simple Console Logger with ANSI Colors
 * Provides color-coded logging without external dependencies
 */

// ANSI Color Codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

/**
 * Format timestamp for logs
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * Logger object with different log levels
 */
const logger = {
  /**
   * Info level logging (blue)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset}`,
      `${colors.blue}ℹ INFO:${colors.reset}`,
      ...args
    );
  },

  /**
   * Success level logging (green)
   * @param {...any} args - Arguments to log
   */
  success: (...args) => {
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset}`,
      `${colors.green}✓ SUCCESS:${colors.reset}`,
      ...args
    );
  },

  /**
   * Warning level logging (yellow)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    console.warn(
      `${colors.dim}[${getTimestamp()}]${colors.reset}`,
      `${colors.yellow}⚠ WARN:${colors.reset}`,
      ...args
    );
  },

  /**
   * Error level logging (red)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(
      `${colors.dim}[${getTimestamp()}]${colors.reset}`,
      `${colors.red}✖ ERROR:${colors.reset}`,
      ...args
    );
  },

  /**
   * Debug level logging (magenta)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.dim}[${getTimestamp()}]${colors.reset}`,
        `${colors.magenta}⚙ DEBUG:${colors.reset}`,
        ...args
      );
    }
  },

  /**
   * API call logging (cyan)
   * @param {string} method - HTTP method
   * @param {string} url - API URL
   * @param {number} status - Response status
   */
  api: (method, url, status) => {
    const statusColor = status >= 200 && status < 300 ? colors.green : colors.red;
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset}`,
      `${colors.cyan}→ API:${colors.reset}`,
      `${colors.bright}${method}${colors.reset}`,
      url,
      `${statusColor}${status}${colors.reset}`
    );
  },

  /**
   * Database operation logging
   * @param {string} operation - DB operation type
   * @param {string} collection - Collection name
   * @param {any} details - Additional details
   */
  db: (operation, collection, details = '') => {
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset}`,
      `${colors.magenta}⚡ DB:${colors.reset}`,
      `${colors.bright}${operation}${colors.reset}`,
      collection,
      details
    );
  }
};

module.exports = logger;
