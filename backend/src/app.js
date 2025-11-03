// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent/received
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

// JSON body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Request logger middleware (for debugging)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    console.log('  🍪 Cookies:', Object.keys(req.cookies));
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import sentimentRoutes from './routes/sentiment.routes.js';
import reviewSentimentRoutes from './routes/reviewSentiment.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';
import scraperRoutes from './routes/scraper.routes.js';
import locationRoutes from './routes/location.routes.js';
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/review-sentiments', reviewSentimentRoutes);
app.use('/api/reviews', reviewSentimentRoutes); // Using reviewSentimentRoutes for /api/reviews
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/locations', locationRoutes);

// Other routes (will be added later)
// import authRoutes from './routes/auth.routes.js';
// import businessRoutes from './routes/business.routes.js';
// app.use('/api/auth', authRoutes);
import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import reviewRoutes from './routes/review.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
// import businessRoutes from './routes/business.routes.js';
// import aiRoutes from './routes/ai.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/ai', aiRoutes);
// app.use('/api/businesses', businessRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;