/**
 * @fileoverview OAuth Helpers
 * @description Shared helper functions used across OAuth routes.
 *
 * @module routes/oauth/helpers
 */
import { sendVerificationCode } from "../../services/email/emailService.js";
import {
  verificationCodes,
  generateCode,
} from "../auth/helpersrout.js";
export async function issueAndSendCode(
  email,
  userId,
  hasCompletedQuestions
) {
  const code = generateCode();
  verificationCodes.set(email, {
    code,
    userId,
    hasCompletedQuestions,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  await sendVerificationCode(email, code);
}