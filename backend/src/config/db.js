// src/config/db.js
import mongoose from 'mongoose';

// MongoDB connection options for Atlas
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  // Validate MongoDB URI exists
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not defined in .env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Setup MongoDB connection event handlers
 */
const setupConnectionHandlers = () => {
  // Handle connection errors
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  // Handle disconnection
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed through app termination');
    process.exit(0);
  });
};

export { connectDB, setupConnectionHandlers };
