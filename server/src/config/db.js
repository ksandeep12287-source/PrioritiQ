const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas instance using Mongoose
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
    return conn;
  } catch (error) {
    console.error(`🔴 MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
