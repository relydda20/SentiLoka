import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// All routes require authentication
// router.use(authenticate);

// Get all dashboard analytics (combined endpoint)
router.get('/:userId/analytics', dashboardController.getDashboardAnalytics);

// Get dashboard stats only
router.get('/:userId/stats', dashboardController.getDashboardStats);

// Get sentiment distribution
router.get('/:userId/sentiment-distribution', dashboardController.getSentimentDistribution);

// Get rating distribution
router.get('/:userId/rating-distribution', dashboardController.getRatingDistribution);

// Get sentiment trends
router.get('/:userId/sentiment-trends', dashboardController.getSentimentTrends);

// Get word cloud data
router.get('/:userId/word-cloud', dashboardController.getWordCloudData);

export default router;
