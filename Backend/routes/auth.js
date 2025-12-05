const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/roles', authController.getRoles);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173',
    session: false 
  }),
  authController.googleCallback
);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

// Favorites routes
router.post('/favorites/:cityId', auth, authController.addFavorite);
router.delete('/favorites/:cityId', auth, authController.removeFavorite);
router.get('/favorites', auth, authController.getFavorites);

module.exports = router;