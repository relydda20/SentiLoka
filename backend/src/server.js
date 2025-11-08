// src/server.js
import 'dotenv/config';
import app from './app.js';
import { connectDB, setupConnectionHandlers } from './config/db.js';
import { initializeJobProcessor } from './services/job.service.js';

const PORT = process.env.PORT || 8080;

// Setup MongoDB connection handlers
setupConnectionHandlers();

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    // Initialize Bull queue processor
    initializeJobProcessor();
    console.log('✓ Scraper queue processor initialized');

    // Start server after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Redis: ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
