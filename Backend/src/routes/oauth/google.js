/**
 * @fileoverview Google OAuth Routes
 * @description Handles Google OAuth authentication flow.
 *@swagger
 * /api/oauth/google:
 *   get:
 *     tags:
 *       - OAuth
 *     summary: Start Google OAuth login
 *     responses:
 *       302:
 *         description: Redirect to Google
 * @module routes/oauth/google
 */

import express from "express";
import passport from "../../config/passport/index.js";
import { issueAndSendCode } from "./helpers.js";
const router = express.Router();
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);
/**
 * @swagger
 * /api/oauth/google/callback:
 *   get:
 *     tags:
 *       - OAuth
 *     summary: Google OAuth callback
 *     responses:
 *       302:
 *         description: Redirect after authentication
 */
router.get(
  "/google/callback",

  passport.authenticate("google", {
    session: false,
    failureRedirect: "/",
  }),
  async (req, res) => {
    try {
      await issueAndSendCode(
        req.user.email,
        String(req.user._id),
        req.user.hasCompletedQuestions
      );
      res.redirect(
        `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(req.user.email)}`
      );
    } catch (error) {
      console.error(error);
      res.redirect(
        `${process.env.CLIENT_URL}/login?error=email`
      );
    }
  }
);
export default router;