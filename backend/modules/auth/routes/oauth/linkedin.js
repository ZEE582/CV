/**
 * @fileoverview LinkedIn OAuth Routes
 * @description Handles LinkedIn OAuth redirects and callback route.
 * @swagger
 * /api/oauth/linkedin:
 *   get:
 *     tags:
 *       - OAuth
 *     summary: Start LinkedIn OAuth login
 *     responses:
 *       302:
 *         description: Redirect to LinkedIn
 * @module routes/oauth/linkedin
 *
 */
const express = require("express");
const { issueAndSendCode } = require("./helpers.js");
const { buildLinkedInAuthUrl, getLinkedInAccessToken, getLinkedInProfile, findOrCreateLinkedInUser } = require("../../services/linkedinServices.js");
const { randomBytes, timingSafeEqual } = require('node:crypto');
const router = express.Router();
router.use('/linkedin', (_req,res,next) => { if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) return res.status(503).json({ message: 'مزود تسجيل الدخول غير مهيأ' }); next(); });
router.get("/linkedin", (req, res) => {
  const state = randomBytes(32).toString("hex");
  req.session.linkedinState = state;
  res.redirect(buildLinkedInAuthUrl(state));
});
/**
 * @swagger
 * /api/oauth/linkedin/callback:
 *   get:
 *     tags:
 *       - OAuth
 *     summary: LinkedIn OAuth callback
 *     responses:
 *       302:
 *         description: Redirect after authentication
 */
router.get("/linkedin/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const expected = req.session.linkedinState;
    delete req.session.linkedinState;
    if (typeof state !== 'string' || typeof expected !== 'string' || state.length !== expected.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) return res.status(400).json({ message: 'تحدي OAuth غير صالح' });
    if (!code) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=linkedin`
      );
    }
    const accessToken = await getLinkedInAccessToken(code);
    const profile = await getLinkedInProfile(accessToken);
    const user = await findOrCreateLinkedInUser(profile);
    await issueAndSendCode(user, res);
    return res.redirect(
      `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(user.email)}`
    );
  } catch {
    req.observeFailure?.('oauth_callback');

    return res.redirect(
      `${process.env.CLIENT_URL}/login?error=linkedin`
    );
  }
});
module.exports = router;
