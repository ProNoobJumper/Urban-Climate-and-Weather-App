const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info(`Google OAuth callback for: ${profile.emails[0].value}`);

        // Check if user already exists
        let user = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ]
        });

        if (user) {
          // User exists - update Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = 'google';
            await user.save();
            logger.info(`Linked Google account to existing user: ${user.email}`);
          }
          
          // Update last login
          user.lastLogin = new Date();
          await user.save();
          
          return done(null, user);
        }

        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          fullName: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`,
          authProvider: 'google',
          isActive: true,
          favorites: []
        });

        logger.info(`New user created via Google OAuth: ${newUser.email}`);
        return done(null, newUser);

      } catch (error) {
        logger.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
