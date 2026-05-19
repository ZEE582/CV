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
import express from "express";
import { issueAndSendCode } from "./helpers.js";
import {
  buildLinkedInAuthUrl,
  getLinkedInAccessToken,
  getLinkedInProfile,
  findOrCreateLinkedInUser,
} from "../../services/linkedinServices.js";
const router = express.Router();
router.get("/linkedin", (_req, res) => {
  res.redirect(buildLinkedInAuthUrl());
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
    const { code } = req.query;
    if (!code) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=linkedin`
      );
    }
    const accessToken = await getLinkedInAccessToken(code);
    const profile = await getLinkedInProfile(accessToken);
    const user = await findOrCreateLinkedInUser(profile);
    await issueAndSendCode(
      user.email,
      String(user._id),
      user.hasCompletedQuestions
    );
    return res.redirect(
      `${process.env.CLIENT_URL}/verify-email?email=${encodeURIComponent(user.email)}`
    );
  } catch (error) {
    console.error("LinkedIn callback error:", error.message);

    return res.redirect(
      `${process.env.CLIENT_URL}/login?error=linkedin`
    );
  }
});
export default router;