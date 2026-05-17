/**
 * @fileoverview Score Routes
 * @description Handles user score updates.
 *
 * @module routes/user/score
 */
import express from "express";
import User from "../../models/usermodel.js";
import requireAuth from "../../middleware/authentication.js";
const router = express.Router();
router.patch("/score",requireAuth,async (req, res) => {
    try {
      const { id } = req.user;
      const { points } = req.body;
      if ( points === undefined || points === null) {
        return res.status(400).json({ message: "يرجى إرسال النقاط",});
      }
      const numPoints = Number(points);
      if (isNaN(numPoints) ||numPoints <= 0) {
        return res.status(400).json({message:"النقاط يجب أن تكون رقم موجب",
        });
      }
      const user =await User.findByIdAndUpdate(id,
          {$inc: { score: numPoints, },},
          {new: true, }
        );
      return res.status(200).json({message:"تم تحديث النقاط بنجاح",score: user.score,});
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "حدث خطأ في السيرفر",
      });
    }
  }
);
export default router;