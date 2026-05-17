/**
 * @fileoverview Resend Verification Code Route
 * @description Resends a new email verification code.
 *
 * @module routes/auth/resendCode
 */
import express from "express";
import User from "../../models/usermodel.js";
import { sendVerificationCode } from "../../services/email/emailService.js";
import {
  verificationCodes,
  generateCode,
  normalizeEmail,
} from "./helpersrout.js";
const router = express.Router();
router.post("/resend-code", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "المستخدم غير موجود",
      });
    }
    const code = generateCode();
    verificationCodes.set(email, {
      code,
      userId: String(user._id),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    await sendVerificationCode(email, code);
    return res.status(200).json({
      message: "تم إعادة إرسال الكود",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
});
export default router;