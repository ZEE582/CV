/**
 * @fileoverview LinkedIn Passport Strategy
 * @description Configures LinkedIn OAuth authentication using Passport.js.
 *
 *              Flow:
 *              1. User clicks Sign in with LinkedIn
 *              2. LinkedIn returns the user's profile
 *              3. The system extracts the email from the profile
 *              4. If the user exists, it logs them in
 *              5. If the user does not exist, it creates a new LinkedIn account
 *
 * @module config/passport/linkedinPassport
 */
import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import User from "../../models/usermodel.js";
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ["openid", "profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value ||
          profile._json?.email;
        if (!email) return done(null, false);
        let user = await User.findOne({
          email: email.toLowerCase(),
        });
     if (!user) {
          user = await User.create({
            email: email.toLowerCase(),
            name:
              profile.displayName ||
              profile._json?.name ||
              "",
            linkedinId: profile.id,
            provider: "linkedin",
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