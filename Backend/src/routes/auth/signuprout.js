/**
 * @fileoverview Signup Route
 * @description Handles local account registration and verification email sending.
 *
 * @module routes/auth/signup
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Create new account
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid email
 *       409:
 *         description: Email already exists
 
 */
import express from "express";
import User from "../../models/usermodel.js";
import { sendVerificationCode } from "../../services/email/emailService.js";
import userEvents from "../../events/userEvents.js";
import { verificationCodes,generateCode,normalizeEmail,} from "./helpersrout.js";
const router = express.Router();
router.post("/signup", async (req, res) => {
  try {
    const { password, role } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({
        message: "يرجى إدخال بريد إلكتروني صحيح",
      });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        message: "هذا البريد الإلكتروني مستخدم مسبقاً",
      });
    }
    const user = await User.create({
      email,
      password,
      role: role || "user",
    });
    userEvents.emit("userRegistered", user);
    const code = generateCode();
    verificationCodes.set(email, {
      code,
      userId: String(user._id),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    await sendVerificationCode(email, code);
    return res.status(201).json({
      message: "تم إنشاء الحساب",
      requiresVerification: true,
      email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
});
export default router;