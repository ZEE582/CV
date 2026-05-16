const Problem = require('../models/Problem');


const getProblems = async (req, res) => {
  try {
    const { page = 1, limit = 20, difficulty, source, search } = req.query;
    
    let query = {};
    
    if (difficulty) query.difficulty = difficulty;
    if (source) query.source = source;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const problems = await Problem.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ source: 1, title: 1 });
    
    const total = await Problem.countDocuments(query);
    
    res.json({
      success: true,
      count: problems.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: problems
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    
    res.json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const getRandomProblems = async (req, res) => {
  try {
    const { count = 5, difficulty } = req.query;
    let query = {};
    if (difficulty) query.difficulty = difficulty;
    
    const problems = await Problem.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) } }
    ]);
    
    res.json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProblems,
  getProblemById,
  getRandomProblems
};