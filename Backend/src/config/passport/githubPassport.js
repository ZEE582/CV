/**
 * @fileoverview GitHub Passport Strategy
 * @description Configures GitHub OAuth authentication using Passport.js.
 *
 *              Flow:
 *              1. User clicks Sign in with GitHub
 *              2. GitHub returns the user's profile and email
 *              3. The system checks if the email is real and usable
 *              4. If the user exists, it logs them in
 *              5. If the user does not exist, it creates a new GitHub account
 *
 * @module config/passport/githubPassport
 */
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../../models/usermodel.js";
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const emails = profile.emails || [];
        const primaryEmail =
          emails.find((e) => e.primary)?.value ||
          emails[0]?.value;
        if (
          !primaryEmail ||
          primaryEmail.includes("noreply.github.com")
        ) {
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