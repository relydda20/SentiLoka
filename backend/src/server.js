// src/server.js
import 'dotenv/config';
import app from './app.js';
import { connectDB, setupConnectionHandlers } from './config/db.js';

const PORT = process.env.PORT || 8080;

// Setup MongoDB connection handlers
setupConnectionHandlers();

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    // Start server after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
