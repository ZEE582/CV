const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, title: { type: String, required: true }, description: String,
  problems: [{ problemId: { type: String, ref: 'Problem', required: true }, order: Number, category: String }],
}, { timestamps: true });
module.exports = mongoose.model('StudyPlan', schema);
