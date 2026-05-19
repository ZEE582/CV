/**
 * @fileoverview Verify Code Route
 * @description Verifies email OTP code and issues JWT token.
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify email code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *               code:
 *                 type: string
 *                 example: 12345
 *     responses:
 *       200:
 *         description: Verification successful
 *       400:
 *         description: Invalid code
 * @module routes/auth/verifyCode
 */
import express from "express";
import jwt from "jsonwebtoken";
import User from "../../models/usermodel.js";
import userEvents from "../../events/userEvents.js";
import {verificationCodes,normalizeEmail,} from "./helpersrout.js";
const router = express.Router();
router.post("/verify-code", async (req, res) => {
  try {
    const { code } = req.body;
    const email = normalizeEmail(req.body.email);
    const entry = verificationCodes.get(email);
    if (!entry) {
      return res.status(400).json({
        message: "الكود غير موجود",
      });
    }
    if (entry.code !== code.trim()) {
      return res.status(400).json({
        message: "الكود غير صحيح",
      });
    }
    verificationCodes.delete(email);
    const user = await User.findByIdAndUpdate(
      entry.userId,{isVerified: true,},
      {new: true,}
    );
    userEvents.emit("userVerified", user);
    const token = jwt.sign(
      { id: user._id,role: user.role,},
      process.env.JWT_SECRET,
      { expiresIn: "7d",}
    );
    return res.status(200).json({
      message: "تم التحقق",token,user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
});
export default router;