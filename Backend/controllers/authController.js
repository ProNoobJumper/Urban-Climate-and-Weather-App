/**
 * Authentication Controller
 * Handles user registration, login, profile management, and role retrieval
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, fullName, userType, organization } = req.body;
    
    // Validate inputs
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and full name are required' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      fullName,
      userType: userType || 'public',
      organization
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    logger.info(`New user registered: ${email} (${user.userType})`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType
      }
    });
    
  } catch (error) {
    logger.error('Registration error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password required' 
      });
    }
    
    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    logger.info(`User logged in: ${email}`);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType
      }
    });
    
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Protected
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        organization: user.organization,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    logger.error('Get profile error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get available user roles
 * @route GET /api/auth/roles
 */
const getRoles = (req, res) => {
  try {
    const roles = [
      { 
        value: 'public', 
        label: 'Citizen/Public', 
        permissions: ['view_current', 'view_forecast'],
        description: 'General public access to current weather and forecasts'
      },
      { 
        value: 'researcher', 
        label: 'Researcher', 
        permissions: ['view_all', 'download', 'upload_data', 'export'],
        description: 'Full access including data upload and export'
      },
      { 
        value: 'student', 
        label: 'Student/Educator', 
        permissions: ['view_current', 'view_forecast', 'download_limited'],
        description: 'Educational access with limited download capabilities'
      },
      { 
        value: 'journalist', 
        label: 'Media/Journalist', 
        permissions: ['view_all', 'download', 'export_visuals'],
        description: 'Media access with visualization export'
      },
      { 
        value: 'admin', 
        label: 'Administrator', 
        permissions: ['all'],
        description: 'Full system administration access'
      }
    ];
    
    res.status(200).json({
      success: true,
      roles: roles
    });
    
  } catch (error) {
    logger.error('Get roles error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Protected
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, organization } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (fullName) user.fullName = fullName;
    if (organization !== undefined) user.organization = organization;
    
    await user.save();
    
    logger.info(`Profile updated: ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        organization: user.organization
      }
    });
    
  } catch (error) {
    logger.error('Update profile error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Add city to favorites
 * @route POST /api/auth/favorites/:cityId
 * @access Protected
 */
const addFavorite = async (req, res) => {
  try {
    const { cityId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already favorited
    if (user.favorites && user.favorites.includes(cityId)) {
      return res.status(400).json({
        success: false,
        message: 'City already in favorites'
      });
    }

    if (!user.favorites) user.favorites = [];
    user.favorites.push(cityId);
    await user.save();

    logger.info(`Favorite added: ${cityId} by ${user.email}`);

    res.json({
      success: true,
      message: 'Added to favorites',
      favorites: user.favorites
    });
  } catch (error) {
    logger.error('Add favorite error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remove city from favorites
 * @route DELETE /api/auth/favorites/:cityId
 * @access Protected
 */
const removeFavorite = async (req, res) => {
  try {
    const { cityId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.favorites) {
      user.favorites = user.favorites.filter(fav => fav !== cityId);
      await user.save();
    }

    logger.info(`Favorite removed: ${cityId} by ${user.email}`);

    res.json({
      success: true,
      message: 'Removed from favorites',
      favorites: user.favorites || []
    });
  } catch (error) {
    logger.error('Remove favorite error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's favorite cities with current weather
 * @route GET /api/auth/favorites
 * @access Protected
 */
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const RealtimeData = require('../models/RealtimeData');

    // Get current weather for each favorite city
    const favoritesWithWeather = await Promise.all(
      (user.favorites || []).map(async (cityId) => {
        const weatherData = await RealtimeData.findOne({ cityId })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          cityId,
          weather: weatherData || null
        };
      })
    );

    res.json({
      success: true,
      favorites: favoritesWithWeather
    });
  } catch (error) {
    logger.error('Get favorites error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Google OAuth callback
 * @route GET /api/auth/google/callback
 */
const googleCallback = (req, res) => {
  try {
    // Generate JWT token
    const token = jwt.sign(
      { userId: req.user._id, userType: req.user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`Google OAuth successful for: ${req.user.email}`);

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
      favorites: req.user.favorites
    }))}`);
  } catch (error) {
    logger.error('Google callback error:', error.message);
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/callback?error=authentication_failed`);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getRoles,
  updateProfile,
  addFavorite,
  removeFavorite,
  getFavorites,
  googleCallback
};
