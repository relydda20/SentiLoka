import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// Get all dashboard analytics (combined endpoint)
router.get('/:userId/analytics', authenticate, dashboardController.getDashboardAnalytics);

// Get dashboard stats only
router.get('/:userId/stats', authenticate, dashboardController.getDashboardStats);

// Get sentiment distribution
router.get('/:userId/sentiment-distribution', authenticate, dashboardController.getSentimentDistribution);

// Get rating distribution
router.get('/:userId/rating-distribution', authenticate, dashboardController.getRatingDistribution);

// Get sentiment trends
router.get('/:userId/sentiment-trends', authenticate, dashboardController.getSentimentTrends);

// Get word cloud data
router.get('/:userId/word-cloud', authenticate, dashboardController.getWordCloudData);

export default router;
