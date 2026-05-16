
const express = require('express');
const router = express.Router();
const StudyPlan = require('../models/StudyPlan');
const Problem = require('../models/Problem');

// GET /api/study-plans - جلب جميع خطط الدراسة
router.get('/', async (req, res) => {
  try {
    const plans = await StudyPlan.find();
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/study-plans/:slug - جلب خطة واحدة مع تفاصيل المسائل
router.get('/:slug', async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ slug: req.params.slug });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    // جلب تفاصيل المسائل المرتبطة بالخطة
    const problemIds = plan.problems.map(p => p.problemId);
    const problems = await Problem.find({ _id: { $in: problemIds } });
    
    // دمج ترتيب المسائل مع تفاصيلها
    const problemsWithOrder = plan.problems.map((p, index) => ({
      ...problems.find(prob => prob._id === p.problemId),
      order: p.order,
      category: p.category
    }));
    
    res.json({
      success: true,
      data: {
        ...plan.toObject(),
        problems: problemsWithOrder
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;