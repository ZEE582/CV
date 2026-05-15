const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const Routes = require('./Routes.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/company',Routes);

app.listen(PORT, () => {
  try{
    console.log(`Server is running : http://localhost:${PORT}`);
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
  }
});