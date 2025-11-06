import Review from "../models/Review.model.js";
import Location from "../models/Location.model.js";
import {
  generateReply,
  regenerateReply,
} from "../services/replyGenerator.service.js";

const reviewController = {
  // Get reviews for a specific location with pagination (RAW reviews before sentiment analysis)
  getLocationReviews: async (req, res) => {
    try {
      const { locationId } = req.params;

      // Parse query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || "publishedAt";
      const sortOrder = req.query.sortOrder || "desc";
      const rating = req.query.rating ? parseInt(req.query.rating) : null;
      const searchTerm = req.query.search ? req.query.search.trim() : null;

      const skip = (page - 1) * limit;

      // Verify location exists
      const location = await Location.findById(locationId);
      if (!location) {
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      // Build query filter
      const query = { locationId };

      // Add rating filter if specified
      if (rating && rating >= 1 && rating <= 5) {
        query.rating = rating;
      }

      // Add search filter if specified (search in review text and author name)
      if (searchTerm) {
        query.$or = [
          { text: { $regex: searchTerm, $options: "i" } },
          { "author.name": { $regex: searchTerm, $options: "i" } },
        ];
      }

      // Build sort object with secondary sort by _id for consistency
      const sort = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
        _id: -1, // Secondary sort for consistent pagination
      };

      // Debug: Log the query being executed
      console.log("🔍 MongoDB Query:", JSON.stringify(query));
      console.log("📊 Sort:", JSON.stringify(sort));

      // Get total count with filters
      const totalItems = await Review.countDocuments(query);
      console.log(`✅ Found ${totalItems} reviews matching filters`);

      if (totalItems === 0) {
        return res.status(404).json({
          success: false,
          message:
            searchTerm || rating
              ? "No reviews found matching your filters."
              : "No reviews found for this location. Please scrape reviews first.",
        });
      }

      // Get paginated reviews
      const reviews = await Review.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-__v")
        .lean();

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.status(200).json({
        success: true,
        message: `Found ${reviews.length} reviews (page ${page}/${totalPages})`,
        data: {
          reviews: reviews.map((review) => ({
            _id: review._id,
            reviewId: review.googleReviewId,
            author: review.author?.name || "Anonymous",
            rating: review.rating,
            text: review.text || "",
            publishedAt: review.publishedAt,
            likes: review.likes || 0,
            sourceUrl: review.sourceUrl,
            // These will be null for raw reviews (before sentiment analysis)
            sentiment: null,
            sentimentScore: null,
            summary: null,
            sentimentKeywords: [],
            contextualTopics: [],
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            limit,
            hasNext,
            hasPrev,
          },
        },
      });
    } catch (error) {
      console.error("Error in getLocationReviews:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get location reviews",
        error: error.message,
      });
    }
  },

  // Get all reviews
  getAllReviews: async (req, res) => {
    try {
      const reviews = await Review.find()
        .populate("locationId", "name address")
        .select("-__v")
        .sort({ publishedAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get review by ID
  getReviewById: async (req, res) => {
    try {
      const { reviewId } = req.params;

      const review = await Review.findById(reviewId)
        .populate("locationId", "name address")
        .select("-__v");

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get reviews by sentiment
  getReviewsBySentiment: async (req, res) => {
    try {
      const { locationId, sentiment } = req.params;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      // Validate sentiment value
      if (!["positive", "neutral", "negative"].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sentiment. Must be: positive, neutral, or negative",
        });
      }

      const reviews = await Review.find({ locationId, sentiment })
        .select("-__v")
        .sort({ publishedAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length,
        sentiment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get recent reviews
  getRecentReviews: async (req, res) => {
    try {
      const { locationId } = req.params;
      const { days = 30 } = req.query;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));

      const reviews = await Review.find({
        locationId,
        publishedAt: { $gte: dateThreshold },
      })
        .select("-__v")
        .sort({ publishedAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length,
        days: parseInt(days),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Add new review
  addReview: async (req, res) => {
    try {
      const { locationId } = req.params;
      const {
        googleReviewId,
        author,
        rating,
        text,
        publishedAt,
        sourceUrl,
        likes,
        sentiment,
        sentimentScore,
        sentimentBreakdown,
        keywords,
        topics,
        analyzedAt,
      } = req.body;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({ googleReviewId });
      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: "Review with this Google Review ID already exists",
        });
      }

      const newReview = new Review({
        locationId,
        googleReviewId,
        author,
        rating,
        text,
        publishedAt,
        sourceUrl: sourceUrl || "",
        likes: likes || 0,
        sentiment,
        sentimentScore,
        sentimentBreakdown: sentimentBreakdown || {},
        keywords: keywords || { positive: [], negative: [] },
        topics: topics || [],
        analyzedAt: analyzedAt || new Date(),
      });

      await newReview.save();

      res.status(201).json({
        success: true,
        message: "Review added successfully",
        data: newReview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Edit review
  editReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const updateData = req.body;

      // Fields that cannot be updated
      const restrictedFields = ["locationId", "googleReviewId", "scrapedAt"];
      restrictedFields.forEach((field) => delete updateData[field]);

      const review = await Review.findByIdAndUpdate(reviewId, updateData, {
        new: true,
        runValidators: true,
      }).select("-__v");

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Delete review
  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByIdAndDelete(reviewId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        data: review,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get sentiment statistics for a location
  getSentimentStats: async (req, res) => {
    try {
      const { locationId } = req.params;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      const stats = await Review.aggregate([
        { $match: { locationId: locationId } },
        {
          $group: {
            _id: "$sentiment",
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
            avgScore: { $avg: "$sentimentScore" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.status(200).json({
        success: true,
        data: stats,
        locationId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Generate AI-powered reply for a review
  generateAIReply: async (req, res) => {
    try {
      const { reviewText, rating, sentiment, tone, style, length } = req.body;

      // Validate required fields
      if (!reviewText || rating === undefined || !sentiment) {
        return res.status(400).json({
          success: false,
          message: "reviewText, rating, and sentiment are required fields",
        });
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }

      // Validate sentiment value
      if (!["positive", "neutral", "negative"].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          message: "Sentiment must be: positive, neutral, or negative",
        });
      }

      // Generate the reply
      const reply = await generateReply({
        reviewText,
        rating,
        sentiment,
        tone: tone || "Professional",
        style: style || "Formal",
        length: length || "Medium",
      });

      res.status(200).json({
        success: true,
        reply: reply,
        parameters: {
          tone: tone || "Professional",
          style: style || "Formal",
          length: length || "Medium",
        },
      });
    } catch (error) {
      console.error("Error in generateAIReply:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate AI reply",
      });
    }
  },

  // Regenerate AI-powered reply for a review
  regenerateAIReply: async (req, res) => {
    try {
      const {
        reviewText,
        rating,
        sentiment,
        previousReply,
        tone,
        style,
        length,
      } = req.body;

      // Validate required fields
      if (!reviewText || rating === undefined || !sentiment) {
        return res.status(400).json({
          success: false,
          message: "reviewText, rating, and sentiment are required fields",
        });
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }

      // Validate sentiment value
      if (!["positive", "neutral", "negative"].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          message: "Sentiment must be: positive, neutral, or negative",
        });
      }

      // Regenerate the reply
      const reply = await regenerateReply({
        reviewText,
        rating,
        sentiment,
        previousReply: previousReply || null,
        tone: tone || "Professional",
        style: style || "Formal",
        length: length || "Medium",
      });

      res.status(200).json({
        success: true,
        reply: reply,
        parameters: {
          tone: tone || "Professional",
          style: style || "Formal",
          length: length || "Medium",
        },
      });
    } catch (error) {
      console.error("Error in regenerateAIReply:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to regenerate AI reply",
      });
    }
  },
};

export default reviewController;
