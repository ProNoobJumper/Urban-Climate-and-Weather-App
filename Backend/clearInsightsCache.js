/**
 * Clear Insights Cache
 * Deletes all cached insights from MongoDB
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CityInsights = require('./models/CityInsights');

async function clearCache() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all cached insights
    const result = await CityInsights.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} cached insight documents`);

    // Close connection
    await mongoose.disconnect();
    console.log('✅ Cache cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    process.exit(1);
  }
}

clearCache();
