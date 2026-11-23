/**
 * @fileoverview Google Passport Strategy
 * @description Configures Google OAuth 2.0 authentication using Passport.js.
 *
 *              Flow:
 *              1. User clicks Sign in with Google
 *              2. Google returns the user's profile
 *              3. The system extracts the user's email
 *              4. If the user exists, it logs them in
 *              5. If the user does not exist, it creates a new Google account
 *
 * @module config/passport/googlePassport
 */
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { findOrCreateGoogleUser, GoogleAccountError } = require('../../services/googleAccounts');
passport.use(
  new GoogleStrategy(
    {
      state: true,
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);
        return done(null, user);
      } catch (error) {
        if (error instanceof GoogleAccountError) return done(null, false);
        return done(error, false);
      }
    }
  )
);
