/**
 * @fileoverview User Onboarding Schema
 * @description Contains onboarding questionnaire fields.
 *
 * @module models/schemas/onboardingSchema
 */
const onboardingSchema = {
  onboardingData: {
    fullName: {
      type: String,
      default: "",
    },
    age: {
      type: Number,
      default: null,
    },
    city: {
      type: String,
      default: "",
    },
    university: {
      type: String,
      default: "",
    },
    major: {
      type: String,
      default: "",
    },
    programmingLanguages: {
      type: [String],
      default: [],
    },
    jobTitle: {
      type: String,
      default: "",
    },
    experienceYears: {
      type: String,
      default: "",
    },
    lookingForJob: {
      type: Boolean,
      default: false,
    },
    jobInterest: {
      type: String,
      default: "",
    },
  },
};

export default onboardingSchema;