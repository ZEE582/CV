/**
 * @fileoverview OAuth Routes (Google, GitHub, LinkedIn)
 * @description Handles third-party OAuth 2.0 authentication flows.
 *
 *              Flow for Google & GitHub (via Passport.js):
 *                1. Client hits /api/auth/{provider}
 *                2. User is redirected to the provider's consent screen
 *                3. Provider redirects back to /api/auth/{provider}/callback
 *                4. Passport resolves the user (create or find)
 *                5. A verification code is emailed to the user
 *                6. Client is redirected to /verify-email on the frontend
 *
 *              Flow for LinkedIn (manual — Passport LinkedIn strategy is
 *              deprecated for the new OpenID Connect API):
 *                Same steps but token exchange + profile fetch are done
 *                manually with axios.
 *
 * @module routes/Oauthroutes
 */

import express from "express";
import passport from "../config/passport.ts";
import axios from "axios";
import User from "../models/usermodel.ts";
import { sendVerificationCode } from "../services/emailService.ts";
import { verificationCodes, generateCode } from "./authroutes.ts";

const router = express.Router();

/**
 * Helper: stores a verification code for a user and sends it by email.
 * Extracted to avoid repeating the same 5-line block in every OAuth callback.
 *
 * @param {string} email - User's email address
 * @param {string} userId - MongoDB ObjectId as string
 * @param {boolean} hasCompletedQuestions - Used by the frontend to decide redirect
 * @returns {Promise<void>}
 */
async function issueAndSendCode(
  email: string,
  userId: string,
  hasCompletedQuestions: boolean
): Promise<void> {
  const code = generateCode();

  verificationCodes.set(email, {
    code,
    userId,
    hasCompletedQuestions,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10-minute TTL
  });

  await sendVerificationCode(email, code);
}

// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     description: |
 *       Redirects the browser to Google's OAuth 2.0 consent screen.
 *       The `prompt=select_account` parameter forces Google to always show
 *       the account picker, even if the user is already signed in.
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to Google consent screen
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // always show account picker
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: |
 *       Passport validates the Google auth code, resolves the user (creates one
 *       if first-time), then emails a verification code and redirects to the
 *       frontend verify-email page.
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema: { type: string }
 *         description: Authorization code from Google (handled by Passport)
 *     responses:
 *       302:
 *         description: Redirect to frontend /verify-email or /login?error=email
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  async (req: any, res) => {
    try {
      await issueAndSendCode(
        req.user.email,
        String(req.user._id),
        req.user.hasCompletedQuestions
      );

      res.redirect(
        `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(req.user.email)}`
      );
    } catch (err: any) {
      console.error("Google OAuth email error:", err.message);
      res.redirect(`${process.env.CLIENT_URL}/login?error=email`);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GitHub OAuth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     description: |
 *       Redirects to GitHub's authorization page.
 *       `user:email` scope is required to read the user's primary email address.
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to GitHub consent screen
 */
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: |
 *       Passport resolves the GitHub user. GitHub accounts without a public
 *       email (or with only a noreply address) are rejected at the strategy
 *       level — see config/passport.ts.
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema: { type: string }
 *         description: Authorization code from GitHub (handled by Passport)
 *     responses:
 *       302:
 *         description: Redirect to frontend /verify-email or /login?error=email
 */
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/" }),
  async (req: any, res) => {
    try {
      await issueAndSendCode(
        req.user.email,
        String(req.user._id),
        req.user.hasCompletedQuestions
      );

      res.redirect(
        `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(req.user.email)}`
      );
    } catch (err: any) {
      console.error("GitHub OAuth email error:", err.message);
      res.redirect(`${process.env.CLIENT_URL}/login?error=email`);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// LinkedIn OAuth (manual — no Passport strategy)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/linkedin:
 *   get:
 *     summary: Initiate LinkedIn OAuth login
 *     description: |
 *       Manually builds the LinkedIn authorization URL and redirects the browser.
 *       We bypass the `passport-linkedin-oauth2` strategy because it does not
 *       support LinkedIn's newer OpenID Connect API (/v2/userinfo).
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to LinkedIn consent screen
 */
router.get("/linkedin", (_req, res) => {
  // Build LinkedIn authorization URL with required OpenID Connect scopes
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID as string,
    redirect_uri: process.env.LINKEDIN_CALLBACK_URL as string,
    scope: "openid profile email",
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

/**
 * @swagger
 * /api/auth/linkedin/callback:
 *   get:
 *     summary: LinkedIn OAuth callback
 *     description: |
 *       Manually exchanges the auth code for an access token, fetches the user
 *       profile from LinkedIn's /v2/userinfo endpoint, then creates (or finds)
 *       the user and emails a verification code.
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema: { type: string }
 *         required: true
 *         description: Authorization code returned by LinkedIn
 *     responses:
 *       302:
 *         description: Redirect to frontend /verify-email or /login?error=linkedin
 */
router.get("/linkedin/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.CLIENT_URL}/login?error=linkedin`);

    // ── Step 1: Exchange authorization code for access token ─────────────────
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL as string,
        client_id: process.env.LINKEDIN_CLIENT_ID as string,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET as string,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    // ── Step 2: Fetch user profile via LinkedIn's OpenID Connect endpoint ─────
    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const profile = profileRes.data;
    const email = profile.email;

    // LinkedIn must return an email — reject if missing
    if (!email) {
      console.error("LinkedIn: no email in profile");
      return res.redirect(`${process.env.CLIENT_URL}/login?error=linkedin`);
    }

    // ── Step 3: Find or create the user ──────────────────────────────────────
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        name: profile.name || profile.given_name || "",
        linkedinId: profile.sub, // LinkedIn's unique user ID in OpenID Connect
        provider: "linkedin",
        avatar: profile.picture || "",
      });
    }

    // ── Step 4: Email the verification code and redirect ─────────────────────
    await issueAndSendCode(
      user.email,
      String(user._id),
      user.hasCompletedQuestions
    );

    res.redirect(
      `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(user.email)}`
    );
  } catch (err: any) {
    console.error("LinkedIn callback error:", err.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=linkedin`);
  }
});

export default router;