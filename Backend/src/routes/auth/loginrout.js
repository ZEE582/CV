/**
 * @fileoverview Signup Route
 * @description Handles local account registration and verification email sending.
 *
 *  @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Verification code sent
 *       401:
 *         description: Invalid credentials
 * @module routes/auth/signup
 */
import express from "express";
import bcrypt from "bcryptjs";
import User from "../../models/usermodel.js";
import { sendVerificationCode } from "../../services/email/emailService.js";
import {
  verificationCodes,
  generateCode,
  normalizeEmail,
} from "./helpersrout.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({
        message: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      });
    }

    if (user.provider !== "local") {
      return res.status(400).json({
        message: "هذا الحساب مسجل باستخدام تسجيل خارجي",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      });
    }

    const code = generateCode();

    verificationCodes.set(email, {
      code,
      userId: String(user._id),
      hasCompletedQuestions: user.hasCompletedQuestions,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendVerificationCode(email, code);

    return res.status(200).json({
      message: "تم إرسال كود التحقق",
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