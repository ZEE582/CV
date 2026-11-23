const mongoose = require('mongoose');
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGO_URI in backend/.env before starting.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
}
module.exports = connectDB;
