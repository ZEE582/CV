/**
 * @fileoverview GitHub OAuth Routes
 * @description Handles GitHub OAuth authentication flow.
 * @swagger
 * /api/oauth/github:
 *   get:
 *     tags:
 *       - OAuth
 *     summary: Start GitHub OAuth login
 *     responses:
 *       302:
 *         description: Redirect to GitHub
 * @module routes/oauth/github
 */
import express from "express";
import passport from "../../config/passport/index.js";
import { issueAndSendCode } from "./helpers.js";
const router = express.Router();
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);
/**
 * @swagger
 * /api/oauth/github/callback:
 *   get:
 *     tags:
 *       - OAuth
 *     summary: GitHub OAuth callback
 *     responses:
 *       302:
 *         description: Redirect after authentication
 */
router.get(
  "/github/callback",
  passport.authenticate("github", {
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