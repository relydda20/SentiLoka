// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.config.js";
import { configurePassport } from "./config/passport.config.js";

// API routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import sentimentRoutes from "./routes/sentiment.routes.js";
import reviewSentimentRoutes from "./routes/reviewSentiment.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import scraperRoutes from "./routes/scraper.routes.js";
import locationRoutes from "./routes/location.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reviewRoutes from "./routes/review.routes.js";

const app = express();

// Configure Passport strategies
configurePassport();

// CORS configuration (must be before other middleware)
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "https://your-app.vercel.app", // Add after frontend deployment
      /\.vercel\.app$/, // Allow all Vercel preview deployments
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  }),
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Initialize Passport middleware
app.use(passport.initialize());

// Request logger middleware (for debugging)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    console.log("  🍪 Cookies:", Object.keys(req.cookies));
  }
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sentiment", sentimentRoutes);
app.use("/api/review-sentiments", reviewSentimentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/scraper", scraperRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
