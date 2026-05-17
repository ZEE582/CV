/**
 * @fileoverview Profile Routes
 * @description Handles profile fetching and updating.
 *
 * @module routes/user/profile
 */
import express from "express";
import User from "../../models/usermodel.js";
import requireAuth from "../../middleware/authentication.js";
import userEvents from "../../events/userEvents.js";
const router = express.Router();
router.get("/profile",requireAuth,async (req, res) => {
    try {
      const { id } = req.user;
      const user = await User.findById(id)
        .select(
          "-password -googleId -githubId -linkedinId -__v"
        );

      if (!user) {
        return res.status(404).json({
          message: "المستخدم غير موجود",
        });
      }
      return res.status(200).json({
        user,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "حدث خطأ في السيرفر",
      });
    }
  }
);
router.put("/profile",requireAuth,async (req, res) => {
    try {
      const { id } = req.user;
      const { name,avatar,onboardingData,} = req.body;
      const updatePayload = {};
      if (name !== undefined) {
        updatePayload.name = name;
      }
      if (avatar !== undefined) {
        updatePayload.avatar = avatar;
      }
      if (onboardingData !== undefined) {
        updatePayload.onboardingData =onboardingData;
      }
      const user =await User.findByIdAndUpdate(
          id,updatePayload,
          {
            new: true,runValidators: true,
          }
        );
      userEvents.emit("profileUpdated", user);
      return res.status(200).json({ message: "تم تحديث الملف الشخصي",user,});
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "حدث خطأ في السيرفر",
      });
    }
  }
);
export default router;