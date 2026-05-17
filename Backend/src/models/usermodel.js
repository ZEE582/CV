/**
 * @fileoverview User Mongoose Model
 * @description Main User model combining all user schema sections.
 *
 * @module models/usermodel
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import identitySchema from "./schemas/identitySchema.js";
import authSchema from "./schemas/authSchema.js";
import profileSchema from "./schemas/profileSchema.js";
import onboardingSchema from "./schemas/onboardingSchema.js";
const userSchema = new mongoose.Schema(
  {
    ...identitySchema,
    ...authSchema,
    ...profileSchema,
    ...onboardingSchema,
  },

  {
    timestamps: true,
  }
);
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(process.env.SALT_ROUNDS) || 10
  );
});

const User = mongoose.model("User", userSchema);

export default User;