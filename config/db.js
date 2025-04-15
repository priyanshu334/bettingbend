// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in the environment variables");
    }

    const conn = await mongoose.connect(mongoURI, {
  
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;