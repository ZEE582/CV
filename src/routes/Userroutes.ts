/**
 * @fileoverview User Routes
 * @description Protected routes for onboarding (questions) and profile management.
 *              All routes require a valid JWT — enforced by the requireAuth middleware.
 *
 * Route summary:
 *   POST /api/user/questions  — save onboarding answers (first-time only flow)
 *   GET  /api/user/profile    — fetch the authenticated user's full profile
 *   PUT  /api/user/profile    — update name, avatar, or onboarding data
 *
 * @module routes/Userroutes
 */

import User from "../models/usermodel.ts";
import express from "express";
import type { Request, Response } from "express";
import requireAuth from "../middleware/requireAuth.ts";
import userEvents from "../events/userevents.ts";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/questions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user/questions:
 *   post:
 *     summary: Submit onboarding questionnaire answers
 *     description: |
 *       Saves the user's onboarding data and marks `hasCompletedQuestions = true`.
 *       This endpoint is designed for first-time flow after account verification,
 *       but can also be used to re-submit / update answers later.
 *
 *       **Authorization:** Bearer JWT required.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - age
 *               - city
 *               - university
 *               - major
 *               - programmingLanguages
 *               - jobTitle
 *               - experienceYears
 *               - jobInterest
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "محمد أحمد"
 *               age:
 *                 type: number
 *                 example: 22
 *               city:
 *                 type: string
 *                 example: "رام الله"
 *               university:
 *                 type: string
 *                 example: "جامعة بيرزيت"
 *               major:
 *                 type: string
 *                 example: "هندسة البرمجيات"
 *               programmingLanguages:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["JavaScript", "Python"]
 *               jobTitle:
 *                 type: string
 *                 example: "طالب جامعي"
 *               experienceYears:
 *                 type: string
 *                 example: "1-2 سنة"
 *               lookingForJob:
 *                 type: boolean
 *                 example: true
 *               jobInterest:
 *                 type: string
 *                 example: "تطوير الويب الكامل (Full Stack)"
 *     responses:
 *       200:
 *         description: Onboarding data saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: One or more required fields are missing
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/questions", requireAuth, async (req: Request, res: Response) => {
  try {
    // id is injected by requireAuth after JWT verification
    const { id } = (req as any).user;

    const {
      fullName,
      age,
      city,
      university,
      major,
      programmingLanguages,
      jobTitle,
      experienceYears,
      lookingForJob,
      jobInterest,
    } = req.body;

    // ── Required field validation ──────────────────────────────────────────────
    // programmingLanguages must be a non-empty array
    if (
      !fullName ||
      !age ||
      !city ||
      !university ||
      !major ||
      !Array.isArray(programmingLanguages) ||
      programmingLanguages.length === 0 ||
      !jobTitle ||
      !experienceYears ||
      !jobInterest
    ) {
      return res.status(400).json({ message: "يرجى تعبئة جميع الحقول" });
    }

    // ── Persist onboarding data ────────────────────────────────────────────────
    const user = await User.findByIdAndUpdate(
      id,
      {
        hasCompletedQuestions: true,
        name: fullName.trim(), // keep top-level name in sync
        onboardingData: {
          fullName: fullName.trim(),
          age: Number(age),
          city,
          university,
          major,
          programmingLanguages,
          jobTitle,
          experienceYears,
          lookingForJob: lookingForJob || false, // optional boolean, default false
          jobInterest,
        },
      },
      { new: true, runValidators: true }
    );

    if (!user)
      return res.status(404).json({ message: "المستخدم غير موجود" });

    userEvents.emit("questionsCompleted", user);

    return res.status(200).json({
      message: "تم حفظ البيانات بنجاح",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        hasCompletedQuestions: user.hasCompletedQuestions,
        score: user.score,
        onboardingData: user.onboardingData,
      },
    });
  } catch (error: any) {
    console.error("Questions error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     description: |
 *       Returns the full profile of the currently logged-in user, derived from
 *       the JWT in the Authorization header.
 *
 *       Sensitive fields (password, OAuth provider IDs, __v) are excluded.
 *
 *       **Authorization:** Bearer JWT required.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;

    // Exclude sensitive / internal fields from the response
    const user = await User.findById(id).select(
      "-password -googleId -githubId -linkedinId -__v"
    );

    if (!user)
      return res.status(404).json({ message: "المستخدم غير موجود" });

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        hasCompletedQuestions: user.hasCompletedQuestions,
        score: user.score,
        onboardingData: user.onboardingData,
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     description: |
 *       Allows partial updates to `name`, `avatar`, and `onboardingData`.
 *       Only the fields provided in the request body will be changed.
 *
 *       **Authorization:** Bearer JWT required.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "محمد أحمد"
 *               avatar:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *               onboardingData:
 *                 $ref: '#/components/schemas/User/properties/onboardingData'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    const { name, avatar, onboardingData } = req.body;

    // Only update fields that were actually sent in the request
    const updatePayload: Record<string, any> = {};
    if (name !== undefined) updatePayload.name = name;
    if (avatar !== undefined) updatePayload.avatar = avatar;
    if (onboardingData !== undefined)
      updatePayload.onboardingData = onboardingData;

    const user = await User.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!user)
      return res.status(404).json({ message: "المستخدم غير موجود" });

    userEvents.emit("profileUpdated", user);

    return res.status(200).json({
      message: "تم تحديث الملف الشخصي بنجاح",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        hasCompletedQuestions: user.hasCompletedQuestions,
        score: user.score,
        onboardingData: user.onboardingData,
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/user/score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user/score:
 *   patch:
 *     summary: Add points to the user's score
 *     description: |
 *       Increments the user's total score by the given `points` value.
 *       Called by the games module after a game ends.
 *
 *       Uses MongoDB `$inc` operator for atomic increment — safe against
 *       race conditions if two games finish at the same time.
 *
 *       **Authorization:** Bearer JWT required.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [points]
 *             properties:
 *               points:
 *                 type: number
 *                 description: Points to add (must be a positive number)
 *                 example: 150
 *     responses:
 *       200:
 *         description: Score updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 score:
 *                   type: number
 *                   description: The user's new total score
 *                   example: 350
 *       400:
 *         description: Missing or invalid points value
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/score", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    const { points } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (points === undefined || points === null)
      return res.status(400).json({ message: "يرجى إرسال قيمة النقاط" });

    const numPoints = Number(points);

    if (isNaN(numPoints) || numPoints <= 0)
      return res
        .status(400)
        .json({ message: "النقاط يجب أن تكون رقم موجب" });

    // ── Atomic increment using $inc ───────────────────────────────────────────
    // $inc is atomic — avoids race conditions if multiple game requests arrive
    // at the same time for the same user
    const user = await User.findByIdAndUpdate(
      id,
      { $inc: { score: numPoints } },
      { new: true } // return the updated document
    );

    if (!user)
      return res.status(404).json({ message: "المستخدم غير موجود" });

    return res.status(200).json({
      message: "تم تحديث النقاط بنجاح",
      score: user.score,
    });
  } catch (error: any) {
    console.error("Score update error:", error.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
});

export default router;