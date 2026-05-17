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
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../../models/usermodel.js";
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false);
        let user = await User.findOne({
          email: email.toLowerCase(),
        });
        if (!user) {
          user = await User.create({
            email: email.toLowerCase(),
            name: profile.displayName,
            googleId: profile.id,
            provider: "google",
            avatar: profile.photos?.[0]?.value || "",
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);