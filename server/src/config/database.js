const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
//الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${process.env.MONGODB_URI}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Check your MongoDB URI in .env file');
    process.exit(1);
  }
};

module.exports = connectDB;
