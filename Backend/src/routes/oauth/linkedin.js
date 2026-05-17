/**
 * @fileoverview LinkedIn OAuth Routes
 * @description Handles LinkedIn OAuth redirects and callback route.
 *
 * @module routes/oauth/linkedin
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