/**
 * @fileoverview User Mongoose Model
 * @description Defines the schema and model for the User collection.
 *
 *              Key design decisions:
 *              - Passwords are hashed via a pre-save hook (bcrypt), never stored in plain text.
 *              - Email validation uses the `validator` library for RFC-compliant checks.
 *              - OAuth users (Google, GitHub, LinkedIn) do not require a password.
 *              - `isVerified` gates login: all accounts (local + OAuth) must pass
 *                email verification before receiving a JWT.
 *              - `hasCompletedQuestions` drives the post-login redirect:
 *                true → /home, false → /questions.
 *
 * @module models/usermodel
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      unique: true,
      lowercase: true, // always store in lowercase for consistent lookups
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "صيغة البريد الإلكتروني غير صحيحة",
      },
    },

    /**
     * Only required for local (email/password) accounts.
     * OAuth accounts have no password — enforced by the conditional `required`.
     * The value is always a bcrypt hash; see the pre-save hook below.
     */
    password: {
      type: String,
      required: function (this: any) {
        return this.provider === "local";
      },
      minlength: [8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"],
    },

    // ── Account status flags ──────────────────────────────────────────────────

    /**
     * Set to true after the user enters the correct 5-digit email code.
     * Unverified accounts cannot log in or access protected routes.
     */
    isVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Set to true after the user submits the onboarding questionnaire.
     * Controls the post-login redirect: false → /questions, true → /home.
     */
    hasCompletedQuestions: {
      type: Boolean,
      default: false,
    },

    // ── Authorization ─────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["student", "admin"],
        message: "الدور يجب أن يكون student أو admin",
      },
      default: "student",
    },

    // ── OAuth provider info ───────────────────────────────────────────────────

    /**
     * Identifies how the account was created.
     * Used in login to skip password check for non-local accounts.
     */
    provider: {
      type: String,
      enum: ["local", "google", "github", "linkedin"],
      default: "local",
    },

    // Unique IDs from each OAuth provider — null for unused providers
    googleId: { type: String, default: null },
    githubId: { type: String, default: null },
    linkedinId: { type: String, default: null },

    // ── Public profile fields ─────────────────────────────────────────────────
    name: {
      type: String,
      trim: true,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    /**
     * Total score accumulated from games.
     * Updated via PATCH /api/user/score by the games module.
     * Default is 0 — increases as the user plays and wins.
     */
    score: {
      type: Number,
      default: 0,
      min: [0, "النقاط لا يمكن أن تكون سالبة"],
    },

    // ── Onboarding data (collected via /questions) ────────────────────────────
    onboardingData: {
      fullName: { type: String, default: "" },
      age: { type: Number, default: null },
      city: { type: String, default: "" },
      university: { type: String, default: "" },
      major: { type: String, default: "" },
      programmingLanguages: { type: [String], default: [] },
      jobTitle: { type: String, default: "" },
      experienceYears: { type: String, default: "" },
      lookingForJob: { type: Boolean, default: false },
      jobInterest: { type: String, default: "" },
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamps
    timestamps: true,
  }
);

// ─── Pre-save hook: hash password before storing ──────────────────────────────
/**
 * Intercepts every `save()` call. If the password field was not modified
 * (e.g. updating name/avatar), the hook returns early to avoid re-hashing.
 *
 * SALT_ROUNDS defaults to 10 if not set in .env — higher is more secure
 * but slower. 10–12 is recommended for most applications.
 */
userSchema.pre("save", async function (this: any) {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(process.env.SALT_ROUNDS) || 10
  );
});

const User = mongoose.model("User", userSchema);

export default User;