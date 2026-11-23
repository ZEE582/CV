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

const express = require("express");
const passport = require("../../config/passport/index.js");
const { issueAndSendCode } = require("./helpers.js");
const { oauthReturnPath, oauthPage } = require('../../services/oauthNavigation');
const router = express.Router();
router.use('/google', (_req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return res.status(503).json({ message: 'تسجيل الدخول بواسطة Google غير متاح حاليًا' });
  next();
});
router.get(
  "/google",
  (req, _res, next) => { delete req.session.googleReturnTo; const from = oauthReturnPath(req.query.from); if (from) req.session.googleReturnTo = from; next(); },
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
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (error, user) => {
    const from = oauthReturnPath(req.session.googleReturnTo);
    delete req.session.googleReturnTo;
    if (error || !user) {
      req.observeFailure?.('oauth_callback');
      return res.redirect(oauthPage('/login', { error: 'google', from }));
    }
    try {
      await issueAndSendCode(user, res);
      return res.redirect(oauthPage('/verify-email', { email: user.email, from }));
    } catch {
      req.observeFailure?.('oauth_email_delivery');
      return res.redirect(oauthPage('/login', { error: 'email', from }));
    }
  })(req, res, next);
});
module.exports = router;
