const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const connectDB = async () => {
  try {
    // Validate the presence of MONGODB_URL in the environment
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URL);
    console.log('DB connected');
  } catch (error) {
    console.error('DB connection error:', error.message);
    process.exit(1); // Exit process with failure code
  }
};

module.exports = connectDB;