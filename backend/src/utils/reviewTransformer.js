import crypto from 'crypto';

/**
 * Generate a unique Google Review ID using hash
 * @param {Object} reviewData - Review data from scraper
 * @param {string} placeUrl - Google Maps place URL
 * @returns {string} - Generated review ID
 */
const generateGoogleReviewId = (reviewData, placeUrl) => {
  const {
    reviewer_name = '',
    review_date = '',
    rating = 0,
    review_text = '',
  } = reviewData;

  // Create a unique string combining multiple fields
  const uniqueString = `${placeUrl}|${reviewer_name}|${review_date}|${rating}|${review_text.substring(0, 50)}`;

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');

  // Return first 16 characters as the review ID
  return `gmr_${hash.substring(0, 24)}`;
};

/**
 * Parse review date string to Date object
 * @param {string} dateString - Date string from scraper
 * @returns {Date} - Parsed date
 */
const parseReviewDate = (dateString) => {
  if (!dateString) {
    return new Date();
  }

  // Handle various date formats from Google Maps
  // Examples: "2 months ago", "3 weeks ago", "1 year ago", "5 days ago"
  const now = new Date();

  // Try to parse relative dates
  const relativeMatch = dateString.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();

    const date = new Date(now);

    switch (unit) {
      case 'second':
        date.setSeconds(date.getSeconds() - value);
        break;
      case 'minute':
        date.setMinutes(date.getMinutes() - value);
        break;
      case 'hour':
        date.setHours(date.getHours() - value);
        break;
      case 'day':
        date.setDate(date.getDate() - value);
        break;
      case 'week':
        date.setDate(date.getDate() - value * 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - value);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - value);
        break;
    }

    return date;
  }

  // Try to parse ISO date
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Fallback to current date
  return now;
};

/**
 * Transform a single review from scraper format to unified format
 * @param {Object} rawReview - Raw review data from scraper
 * @param {string} placeUrl - Google Maps place URL
 * @returns {Object} - Transformed review
 */
const transformReview = (rawReview, placeUrl) => {
  const {
    reviewer_name,
    rating,
    review_text,
    review_date,
    place_name,
    place_url,
    data_review_id,
    reviewer_profile_image,
    reviewer_reviews_count,
    review_likes,
  } = rawReview;

  // Use data-review-id if available, otherwise generate hash-based ID
  const googleReviewId = data_review_id || generateGoogleReviewId(rawReview, placeUrl);

  // Parse review date
  const publishedAt = parseReviewDate(review_date);

  // Transform to unified format
  return {
    googleReviewId,
    author: {
      name: reviewer_name || 'Anonymous',
      profileImage: reviewer_profile_image || null,
      reviewsCount: reviewer_reviews_count || 0,
    },
    rating: parseInt(rating) || 0,
    text: review_text || '',
    publishedAt,
    sourceUrl: place_url || placeUrl,
    likes: parseInt(review_likes) || 0,
    metadata: {
      placeName: place_name || null,
      scrapedAt: new Date(),
    },
  };
};

/**
 * Transform array of reviews from scraper output to unified format
 * @param {Array} rawReviews - Array of raw review data from scraper
 * @param {string} placeUrl - Google Maps place URL
 * @returns {Array} - Array of transformed reviews
 */
export const transformReviews = (rawReviews, placeUrl) => {
  if (!Array.isArray(rawReviews)) {
    console.error('transformReviews: rawReviews is not an array');
    return [];
  }

  const transformed = rawReviews.map((review) => {
    try {
      return transformReview(review, placeUrl);
    } catch (error) {
      console.error('Error transforming review:', error);
      console.error('Problematic review data:', review);
      return null;
    }
  });

  // Filter out any null values from failed transformations
  return transformed.filter((review) => review !== null);
};

/**
 * Validate transformed review data
 * @param {Object} review - Transformed review
 * @returns {boolean} - Whether the review is valid
 */
export const validateTransformedReview = (review) => {
  const required = ['googleReviewId', 'author', 'rating', 'text', 'publishedAt'];

  for (const field of required) {
    if (!review[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // Validate rating range
  if (review.rating < 1 || review.rating > 5) {
    console.error(`Invalid rating: ${review.rating}`);
    return false;
  }

  // Validate author name
  if (!review.author.name) {
    console.error('Missing author name');
    return false;
  }

  // Validate publishedAt is a valid date
  if (!(review.publishedAt instanceof Date) || isNaN(review.publishedAt.getTime())) {
    console.error(`Invalid publishedAt date: ${review.publishedAt}`);
    return false;
  }

  return true;
};

/**
 * Get statistics about transformed reviews
 * @param {Array} reviews - Array of transformed reviews
 * @returns {Object} - Statistics
 */
export const getReviewStats = (reviews) => {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      withText: 0,
      withoutText: 0,
    };
  }

  const stats = {
    total: reviews.length,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    withText: 0,
    withoutText: 0,
    totalLikes: 0,
  };

  let totalRating = 0;

  reviews.forEach((review) => {
    // Rating stats
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      stats.ratingDistribution[rating]++;
      totalRating += review.rating;
    }

    // Text stats
    if (review.text && review.text.trim().length > 0) {
      stats.withText++;
    } else {
      stats.withoutText++;
    }

    // Likes stats
    stats.totalLikes += review.likes || 0;
  });

  stats.averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  return stats;
};

/**
 * Filter reviews by criteria
 * @param {Array} reviews - Array of transformed reviews
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered reviews
 */
export const filterReviews = (reviews, filters = {}) => {
  let filtered = [...reviews];

  // Filter by minimum rating
  if (filters.minRating) {
    filtered = filtered.filter((review) => review.rating >= filters.minRating);
  }

  // Filter by maximum rating
  if (filters.maxRating) {
    filtered = filtered.filter((review) => review.rating <= filters.maxRating);
  }

  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter((review) => review.publishedAt >= startDate);
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filtered = filtered.filter((review) => review.publishedAt <= endDate);
  }

  // Filter by text content (case-insensitive search)
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    filtered = filtered.filter((review) =>
      review.text.toLowerCase().includes(searchLower)
    );
  }

  // Filter reviews with text only
  if (filters.withTextOnly) {
    filtered = filtered.filter((review) => review.text && review.text.trim().length > 0);
  }

  // Filter by minimum likes
  if (filters.minLikes) {
    filtered = filtered.filter((review) => (review.likes || 0) >= filters.minLikes);
  }

  return filtered;
};

/**
 * Sort reviews by various criteria
 * @param {Array} reviews - Array of transformed reviews
 * @param {string} sortBy - Sort criteria (date, rating, likes)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} - Sorted reviews
 */
export const sortReviews = (reviews, sortBy = 'date', order = 'desc') => {
  const sorted = [...reviews];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = a.publishedAt.getTime() - b.publishedAt.getTime();
        break;
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'likes':
        comparison = (a.likes || 0) - (b.likes || 0);
        break;
      default:
        comparison = a.publishedAt.getTime() - b.publishedAt.getTime();
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export default {
  transformReviews,
  validateTransformedReview,
  getReviewStats,
  filterReviews,
  sortReviews,
};
