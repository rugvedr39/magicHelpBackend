const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbURI = process.env.MONGODB_URI;
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };


const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(dbURI,clientOptions);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;