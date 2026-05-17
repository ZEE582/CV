require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ttwar';

async function connectDB() {
  await mongoose.connect(URI);
  console.log('✅ MongoDB →', mongoose.connection.name);
}

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));

module.exports = { connectDB };
