/**
 * Cache Manager Service
 * In-memory caching without Redis dependency
 * Provides TTL-based caching with pattern-based invalidation
 */

const logger = require('../utils/logger');

// In-memory cache store
const cache = new Map();

// Cache metadata (stores expiry times)
const metadata = new Map();

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if not found/expired
 */
const getCachedData = (key) => {
  try {
    if (!cache.has(key)) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    const meta = metadata.get(key);
    
    // Check if expired
    if (meta && meta.expiresAt && Date.now() > meta.expiresAt) {
      logger.debug(`Cache expired: ${key}`);
      cache.delete(key);
      metadata.delete(key);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    
    // Update access time
    if (meta) {
      meta.lastAccessed = Date.now();
      meta.hits = (meta.hits || 0) + 1;
    }

    return cache.get(key);

  } catch (error) {
    logger.error(`Error getting cached data for ${key}:`, error.message);
    return null;
  }
};

/**
 * Set cached data with optional TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {boolean} Success status
 */
const setCachedData = (key, value, ttl = 3600) => {
  try {
    const now = Date.now();
    const expiresAt = ttl > 0 ? now + (ttl * 1000) : null;

    cache.set(key, value);
    metadata.set(key, {
      createdAt: now,
      expiresAt: expiresAt,
      lastAccessed: now,
      hits: 0,
      size: _estimateSize(value)
    });

    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    
    return true;

  } catch (error) {
    logger.error(`Error setting cached data for ${key}:`, error.message);
    return false;
  }
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match (supports wildcards with *)
 * @returns {number} Number of keys invalidated
 */
const invalidateCache = (pattern) => {
  try {
    let count = 0;
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
        metadata.delete(key);
        count++;
      }
    }

    logger.info(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
    
    return count;

  } catch (error) {
    logger.error(`Error invalidating cache with pattern ${pattern}:`, error.message);
    return 0;
  }
};

/**
 * Clear all cache
 * @returns {boolean} Success status
 */
const clearCache = () => {
  try {
    const size = cache.size;
    cache.clear();
    metadata.clear();
    
    logger.info(`Cleared all cache (${size} entries)`);
    
    return true;

  } catch (error) {
    logger.error('Error clearing cache:', error.message);
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
const getCacheStats = () => {
  try {
    let totalSize = 0;
    let totalHits = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [key, meta] of metadata.entries()) {
      totalSize += meta.size || 0;
      totalHits += meta.hits || 0;
      
      if (meta.expiresAt && now > meta.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalKeys: cache.size,
      totalSize: totalSize,
      totalHits: totalHits,
      expiredKeys: expiredCount,
      hitRate: cache.size > 0 ? (totalHits / cache.size).toFixed(2) : 0
    };

  } catch (error) {
    logger.error('Error getting cache stats:', error.message);
    return null;
  }
};

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {boolean} True if exists and not expired
 */
const hasKey = (key) => {
  const value = getCachedData(key);
  return value !== null;
};

/**
 * Delete specific cache key
 * @param {string} key - Cache key
 * @returns {boolean} True if deleted
 */
const deleteKey = (key) => {
  try {
    const deleted = cache.delete(key);
    metadata.delete(key);
    
    if (deleted) {
      logger.debug(`Cache deleted: ${key}`);
    }
    
    return deleted;

  } catch (error) {
    logger.error(`Error deleting cache key ${key}:`, error.message);
    return false;
  }
};

/**
 * Get all cache keys
 * @returns {Array} Array of cache keys
 */
const getAllKeys = () => {
  return Array.from(cache.keys());
};

/**
 * Clean up expired entries
 * @returns {number} Number of entries cleaned
 */
const cleanupExpired = () => {
  try {
    let count = 0;
    const now = Date.now();

    for (const [key, meta] of metadata.entries()) {
      if (meta.expiresAt && now > meta.expiresAt) {
        cache.delete(key);
        metadata.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.info(`Cleaned up ${count} expired cache entries`);
    }
    
    return count;

  } catch (error) {
    logger.error('Error cleaning up expired cache:', error.message);
    return 0;
  }
};

/**
 * Set cache with automatic cleanup
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {boolean} Success status
 */
const setWithCleanup = (key, value, ttl = 3600) => {
  // Clean up expired entries before setting new one
  cleanupExpired();
  return setCachedData(key, value, ttl);
};

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Estimate size of cached value in bytes
 * @private
 */
const _estimateSize = (value) => {
  try {
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  } catch {
    // Fallback estimation
    return 1000; // 1KB default
  }
};

// Auto cleanup every 5 minutes
setInterval(() => {
  cleanupExpired();
}, 5 * 60 * 1000);

module.exports = {
  getCachedData,
  setCachedData,
  invalidateCache,
  clearCache,
  getCacheStats,
  hasKey,
  deleteKey,
  getAllKeys,
  cleanupExpired,
  setWithCleanup
};
