const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["coding", "quiz"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", null],
      default: null,
    },

    tags: [
      {
        type: String,
      },
    ],

    source: {
      type: String,
    },

    url: {
      type: String,
    },

    category: {
      type: String,
    },

    questionText: {
      type: String,
    },

    options: [
      {
        type: String,
      },
    ],

    correctAnswer: {
      type: String,
    },

    explanation: {
      type: String,
    },

    topic: {
      type: String,
    },

    totalSubmissions: {
      type: Number,
      default: 0,
    },

    acceptanceRate: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Problem",
  problemSchema
);