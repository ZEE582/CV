/**
 * @fileoverview Authentication Routes
 * @description Handles local authentication: signup, login, email verification, and code resend.
 *              All local login flows require a 2-step process:
 *              1. Submit credentials → receive verification code via email
 *              2. Submit code → receive JWT token
 * @module routes/authroutes
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import express from "express";
import type { Request, Response } from "express";
import User from "../models/usermodel.ts";
import { sendVerificationCode } from "../services/emailService.ts";
import userEvents from "../events/userevents.ts";

const router = express.Router();

/**
 * In-memory store for pending email verification codes.
 * Key: lowercase email address
 * Value: { code, userId, hasCompletedQuestions, expiresAt }
 *
 * NOTE: This is intentionally in-memory for simplicity.
 * In production, replace with Redis or a DB-backed store to support
 * horizontal scaling and survive server restarts.
 */
export const verificationCodes = new Map<
  string,
  {
    code: string;
    userId: string;
    hasCompletedQuestions: boolean;
    expiresAt: number;
  }
>();

/**
 * Generates a random 5-digit numeric verification code.
 * @returns {string} A zero-padded 5-digit string, e.g. "04821"
 */
export function generateCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Normalizes and validates an email string.
 * @param {string} email - Raw email input from the client
 * @returns {string} Trimmed, lowercase email
 * @throws Will return null if input is not a non-empty string
 */
function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string" || !email.trim()) return null;
  return email.trim().toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user account
 *     description: |
 *       Creates a new local (email/password) user account and sends a 5-digit
 *       verification code to the provided email. The account is not active until
 *       the code is verified via /api/auth/verify-code.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "mySecret123"
 *               role:
 *                 type: string
 *                 enum: [student, admin]
 *                 default: student
 *     responses:
 *       201:
 *         description: Account created, verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 requiresVerification: { type: boolean, example: true }
 *                 email: { type: string }
 *       400:
 *         description: Validation error (missing/invalid fields)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error or email delivery failure
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { password, role } = req.body;
    const email = normalizeEmail(req.body.email);

    // ── Input Validation ──────────────────────────────────────────────────────
    if (!email)
      return res.status(400).json({ message: "يرجى إدخال بريد إلكتروني صحيح" });

    if (typeof password !== "string" || !password.trim())
      return res.status(400).json({ message: "يرجى إدخال كلمة المرور" });

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });

    if (role && !["student", "admin"].includes(role))
      return res.status(400).json({ message: "نوع المستخدم غير صحيح" });

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(409)
        .json({ message: "هذا البريد الإلكتروني مستخدم مسبقاً" });

    // ── Create user (password hashed via mongoose pre-save hook) ──────────────
    const user = await User.create({
      email,
      password,
      role: role || "student",
    });

    userEvents.emit("userRegistered", user);

    // ── Send verification email ───────────────────────────────────────────────
    const code = generateCode();
    verificationCodes.set(email, {
      code,
      userId: String(user._id),
      hasCompletedQuestions: user.hasCompletedQuestions,
      expiresAt: Date.now() + 10 * 60 * 1000, // expires in 10 minutes
    });

    await sendVerificationCode(email, code);

    return res.status(201).json({
      message: "تم إنشاء الحساب، تحقق من بريدك الإلكتروني",
      requiresVerification: true,
      email,
    });
  } catch (error: any) {
    // Mongoose validation errors (e.g. invalid email format from validator)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (e: any) => e.message
      );
      return res.status(400).json({ message: messages.join("، ") });
    }
    // MongoDB duplicate key (race condition safety net)
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "هذا البريد الإلكتروني مستخدم مسبقاً" });

    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     description: |
 *       Authenticates the user's credentials and sends a 5-digit verification
 *       code to their email. The JWT token is only issued after the code is
 *       confirmed via /api/auth/verify-code.
 *
 *       **OAuth accounts** (Google / GitHub / LinkedIn) that attempt to log in
 *       here will also receive a verification code — they are not required to
 *       provide a password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credentials valid, verification code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 requiresVerification: { type: boolean, example: true }
 *                 email: { type: string }
 *       400:
 *         description: Missing fields
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Wrong password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Account exists but email is not verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: No account found for this email
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error or email delivery failure
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email)
      return res
        .status(400)
        .json({ message: "يرجى إدخال البريد الإلكتروني" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "هذا الحساب غير موجود" });

    // Only local accounts need to be verified before login.
    // OAuth accounts are marked verified during the OAuth callback.
    if (!user.isVerified)
      return res.status(403).json({
        message: "هذا الحساب لم يتم التحقق منه، يرجى التسجيل مجدداً",
      });

    // ── Password check (local accounts only) ─────────────────────────────────
    if (user.provider === "local") {
      if (!password)
        return res
          .status(400)
          .json({ message: "يرجى إدخال كلمة المرور" });

      if (!user.password)
        return res
          .status(400)
          .json({ message: "هذا الحساب لا يملك كلمة مرور" });

      const isCorrect = await bcrypt.compare(password, user.password);
      if (!isCorrect)
        return res.status(401).json({ message: "كلمة المرور غير صحيحة" });
    }

    // ── Send 2FA-style verification code ─────────────────────────────────────
    const code = generateCode();
    verificationCodes.set(user.email, {
      code,
      userId: String(user._id),
      hasCompletedQuestions: user.hasCompletedQuestions,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendVerificationCode(user.email, code);

    return res.status(200).json({
      message: "تم إرسال كود التحقق على بريدك الإلكتروني",
      requiresVerification: true,
      email: user.email,
    });
  } catch (error: any) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-code
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Verify the email code and receive a JWT
 *     description: |
 *       Validates the 5-digit code sent to the user's email.
 *       On success:
 *       - Marks the account as verified (isVerified = true)
 *       - Returns a signed JWT valid for 7 days
 *       - Returns the user object (id, email, role, onboardingData, etc.)
 *
 *       The client should check `user.hasCompletedQuestions` to decide
 *       whether to redirect to /questions or /home.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 example: "84721"
 *     responses:
 *       200:
 *         description: Code valid — returns JWT and user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 token:
 *                   type: string
 *                   description: Signed JWT (Bearer)
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing fields, no pending code, or expired/wrong code
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found (data inconsistency)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/verify-code", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !code)
      return res
        .status(400)
        .json({ message: "يرجى إدخال البريد والكود" });

    const entry = verificationCodes.get(email);
    if (!entry)
      return res
        .status(400)
        .json({ message: "لم يتم إرسال كود لهذا البريد" });

    // ── Expiry check ──────────────────────────────────────────────────────────
    if (Date.now() > entry.expiresAt) {
      verificationCodes.delete(email);
      return res
        .status(400)
        .json({ message: "انتهت صلاحية الكود، أعد المحاولة" });
    }

    // ── Code match ────────────────────────────────────────────────────────────
    if (entry.code !== code.trim())
      return res.status(400).json({ message: "الكود غير صحيح" });

    // ── Consume the code (single-use) ─────────────────────────────────────────
    verificationCodes.delete(email);

    // ── Mark user as verified ─────────────────────────────────────────────────
    const user = await User.findByIdAndUpdate(
      entry.userId,
      { isVerified: true },
      { new: true }
    );
    if (!user)
      return res.status(404).json({ message: "المستخدم غير موجود" });

    userEvents.emit("userVerified", user);

    // ── Issue JWT ─────────────────────────────────────────────────────────────
    // Payload contains only id + role — keep it minimal and non-sensitive
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "تم التحقق بنجاح",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        hasCompletedQuestions: user.hasCompletedQuestions,
        onboardingData: user.onboardingData,
      },
    });
  } catch (error: any) {
    console.error("Verify error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-code
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/resend-code:
 *   post:
 *     summary: Resend the email verification code
 *     description: |
 *       Generates a fresh 5-digit code and sends it to the user's email,
 *       replacing any previously issued code. The new code is valid for
 *       10 minutes.
 *
 *       The frontend should enforce a cooldown (e.g. 60 s) to prevent abuse,
 *       in addition to the server-side rate limiter on this route.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: New code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "تم إعادة إرسال الكود" }
 *       400:
 *         description: Missing email
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: No account found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error or email delivery failure
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/resend-code", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email)
      return res
        .status(400)
        .json({ message: "يرجى إدخال البريد الإلكتروني" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "هذا الحساب غير موجود" });

    // Overwrite any existing pending code for this email
    const code = generateCode();
    verificationCodes.set(user.email, {
      code,
      userId: String(user._id),
      hasCompletedQuestions: user.hasCompletedQuestions,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendVerificationCode(user.email, code);

    return res.status(200).json({ message: "تم إعادة إرسال الكود" });
  } catch (error: any) {
    console.error("Resend error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

export default router;