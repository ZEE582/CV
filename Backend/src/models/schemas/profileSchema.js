/**
 * @fileoverview User Profile Schema
 * @description Contains public profile fields.
 *
 * @module models/schemas/profileSchema
 */
const profileSchema = {
  name: {
    type: String,
    trim: true,
    default: "",
  },

  avatar: {
    type: String,
    default: "",
  },

  score: {
    type: Number,
    default: 0,
    min: [0, "النقاط لا يمكن أن تكون سالبة"],
  },
};

export default profileSchema;