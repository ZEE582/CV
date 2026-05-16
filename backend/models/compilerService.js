const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
  // معرف الخطة (مثل: 'neetcode_150', 'blind_75', 'frontend_roadmap')
  _id: { type: String, required: true },
  
  // الاسم المعروض
  name: { type: String, required: true },
  
  // الوصف
  description: { type: String, required: true },
  
  // رابط مختصر للـ URL (slug)
  slug: { type: String, required: true, unique: true },
  
  // قائمة المسائل في الخطة
  problems: [{
    problemId: { type: String, ref: 'Problem', required: true },
    order: { type: Number, required: true },        // ترتيب المسألة
    category: { type: String }                      // التصنيف داخل الخطة
  }],
  
  // عدد المسائل الكلي (سيتم حسابه تلقائيًا)
  totalProblems: { type: Number, default: 0 },
  
  // هل الخطة مدفوعة؟
  isPremium: { type: Boolean, default: false },
  
  // صورة الغلاف
  coverImage: { type: String },
  
  // مستوى الصعوبة
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  
  // الوقت المقدر (بالساعات)
  estimatedHours: { type: Number }
  
}, { timestamps: true });

// قبل الحفظ، احسب totalProblems تلقائيًا
studyPlanSchema.pre('save', function(next) {
  this.totalProblems = this.problems.length;
  next();
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);