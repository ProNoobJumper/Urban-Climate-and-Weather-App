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

module.exports = {
  register,
  login,
  getProfile,
  getRoles,
  updateProfile
};
