/**
 * @fileoverview Questions Routes
 * @description Handles onboarding questionnaire submission.
 *
 * @module routes/user/questions
 */
import express from "express";
import User from "../../models/usermodel.js";
import requireAuth from "../../middleware/authentication.js";
import userEvents from "../../events/userEvents.js";
const router = express.Router();
router.post("/questions",requireAuth,async (req, res) => {
    try {
      const { id } = req.user;
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
      if (!fullName ||!age ||!city ||!university ||!major ||
        !Array.isArray(programmingLanguages) ||
        programmingLanguages.length === 0 ||
        !jobTitle ||!experienceYears || !jobInterest) {
        return res.status(400).json({message: "يرجى تعبئة جميع الحقول", });
      }
      const user = await User.findByIdAndUpdate(id,
        {hasCompletedQuestions: true,
          name: fullName.trim(),
          onboardingData: {
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
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
      userEvents.emit("questionsCompleted",user);
      return res.status(200).json({message: "تم حفظ البيانات",user,});
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "حدث خطأ في السيرفر",
      });
    }
  }
);

export default router;