/**
 * @fileoverview Passport.js OAuth Strategies
 * @description Configures authentication strategies for Google, GitHub, and LinkedIn.
 *
 *              Each strategy follows the same pattern:
 *              1. Receive the provider's profile after the OAuth dance completes
 *              2. Look up the user in MongoDB by email
 *              3. If not found, create a new account (first-time OAuth sign-in)
 *              4. Pass the user document to Passport via `done(null, user)`
 *
 *              This file is imported in server.ts for its side-effects only
 *              (registering the strategies on the global passport instance).
 *
 * @module config/passport
 */

import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import User from "../models/usermodel.ts";

// ─── Google Strategy ──────────────────────────────────────────────────────────

/**
 * Google OAuth 2.0 strategy.
 * Scopes requested: profile + email (configured in Oauthroutes.ts).
 *
 * Use case: user clicks "Sign in with Google" → Google returns profile →
 * we find or create the user → Passport attaches user to req.user.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        // Google profiles without an email are rejected (shouldn't happen with email scope)
        if (!email) return done(null, false);

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          // First Google sign-in: create a new account
          // isVerified is left as false — the OAuth callback will email a code
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

// ─── GitHub Strategy ──────────────────────────────────────────────────────────

/**
 * GitHub OAuth 2.0 strategy.
 * Scope: user:email — needed to read the user's verified email addresses.
 *
 * GitHub users can hide their email publicly. Without the `user:email` scope,
 * the profile might only contain a noreply proxy address — we reject those.
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      callbackURL: process.env.GITHUB_CALLBACK_URL as string,
      scope: ["user:email"],
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const emails: { value: string; primary?: boolean }[] = profile.emails || [];

        // Prefer the primary verified email over any other
        const primaryEmail =
          emails.find((e) => e.primary)?.value || emails[0]?.value;

        // Reject noreply proxy emails — they can't receive our verification code
        if (!primaryEmail || primaryEmail.includes("noreply.github.com")) {
          console.error("GitHub: no real email found for user", profile.username);
          return done(null, false);
        }

        const email = primaryEmail.toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            email,
            name: profile.displayName || profile.username,
            githubId: String(profile.id),
            provider: "github",
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

// ─── LinkedIn Strategy ────────────────────────────────────────────────────────

/**
 * LinkedIn OAuth 2.0 strategy (via passport-linkedin-oauth2).
 *
 * NOTE: LinkedIn's newer OpenID Connect API (/v2/userinfo) is handled manually
 * in Oauthroutes.ts. This strategy is kept as a fallback / alternative but
 * the primary LinkedIn flow in this app uses the manual route.
 *
 * Scopes: openid, profile, email — required for the OpenID Connect endpoint.
 */
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL as string,
      scope: ["openid", "profile", "email"],
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        // LinkedIn may return email in different places depending on the API version
        const email = profile.emails?.[0]?.value || profile._json?.email;
        if (!email) return done(null, false);

        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          user = await User.create({
            email: email.toLowerCase(),
            name: profile.displayName || profile._json?.name || "",
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

export default passport;