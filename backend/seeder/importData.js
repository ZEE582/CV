const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Problem = require('../models/Problem');

const codingProblems = require(path.resolve(__dirname, '../../data/problems_youseef.json'));
const quizQuestions  = require(path.resolve(__dirname, '../../data/tech_questions.json'));

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // ── 1. Coding Problems
    const codingFormatted = codingProblems.problems.map(p => ({
      _id: p.id,
      type: 'coding',
      title: p.title,
      difficulty: p.difficulty || null,
      tags: p.tags || [],
      source: p.source,
      url: p.url,
      category: p.type,
    }));

    // ── 2. Quiz Questions
    const diffMap = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

    const quizFormatted = quizQuestions.questions.map(q => ({
      _id: `${q.source}_${q.id}`,
      type: 'quiz',
      title: q.question.length > 100
        ? q.question.substring(0, 97) + '...'
        : q.question,
      difficulty: diffMap[q.difficulty] || 'Medium',
      tags: [q.category, q.topic].filter(Boolean),
      source: q.source,
      questionText: q.question,
      options: q.options || [],
      correctAnswer: q.correct_answer,
      explanation: q.note || null,
      topic: q.topic,
    }));

    const allProblems = [...codingFormatted, ...quizFormatted];

    // ── upsert — بيحدّث اللي موجود وبيضيف الجديد بدون duplicate errors
    const ops = allProblems.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: p },
        upsert: true,
      }
    }));

    const result = await Problem.bulkWrite(ops, { ordered: false });

    console.log(`✅ تم إدخال/تحديث ${result.upsertedCount + result.modifiedCount} سؤال/مسألة`);
    console.log(`   Inserted: ${result.upsertedCount} | Updated: ${result.modifiedCount}`);
    console.log('\n🎉 اكتمل الإدخال بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
};

importData();