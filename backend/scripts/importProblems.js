const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

const Problem = require("../models/Problem");

mongoose.connect(process.env.MONGO_URI);

const codingProblems = JSON.parse(
  fs.readFileSync("./data/codingProblems.json")
);

const importData = async () => {
  try {
    await Problem.deleteMany();

    const formatted = codingProblems.map((p) => ({
      _id: p.id,
      type: "coding",
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      source: p.source,
      url: p.url,
      category: p.type,
    }));

    await Problem.insertMany(formatted);

    console.log("Problems Imported");
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

importData();