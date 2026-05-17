/**
 * @fileoverview User Identity Schema
 * @description Contains the user's identity-related fields.
 *
 * @module models/schemas/identitySchema
 */
import validator from "validator";
const identitySchema = {
  email: {
    type: String,
    required: [true, "البريد الإلكتروني مطلوب"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "صيغة البريد الإلكتروني غير صحيحة",
    },
  },
  password: {
    type: String,
    required: function () {
      return this.provider === "local";
    },
    minlength: [8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"],
  },
};
export default identitySchema;