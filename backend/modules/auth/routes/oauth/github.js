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
const express = require("express");
const passport = require("../../config/passport/index.js");
const { issueAndSendCode } = require("./helpers.js");
const router = express.Router();
router.use('/github', (_req, res, next) => { if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) return res.status(503).json({ message: 'مزود تسجيل الدخول غير مهيأ' }); next(); });
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
    failureRedirect: (process.env.CLIENT_URL || "http://localhost:5173") + "/login?error=oauth",
  }),
  async (req, res) => {
    try {
      await issueAndSendCode(req.user, res);
      res.redirect(
        `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(req.user.email)}`
      );
    } catch {
      req.observeFailure?.('oauth_email_delivery');
      res.redirect(
        `${process.env.CLIENT_URL}/login?error=email`
      );
    }
  }
);
module.exports = router;
