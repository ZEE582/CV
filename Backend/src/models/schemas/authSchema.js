/**
 * @fileoverview User Authentication Schema
 * @description Contains authentication and authorization fields.
 *
 * @module models/schemas/authSchema
 */
const authSchema = {
  isVerified: {
    type: Boolean,
    default: false,
  },
  hasCompletedQuestions: {
    type: Boolean,
    default: false,
  },
  role: {type: String,
    enum: {
      values: ["user", "admin"],
      message: "الدور يجب أن يكون user أو admin",
    },
    default: "user",
  },
  provider: {
    type: String,
    enum: ["local", "google", "github", "linkedin"],
    default: "local",
  },
  googleId: {
    type: String,
    default: null,
  },
  githubId: {
    type: String,
    default: null,
  },
  linkedinId: {
    type: String,
    default: null,
  },
};

export default authSchema;