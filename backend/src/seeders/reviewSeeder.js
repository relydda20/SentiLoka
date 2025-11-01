import Review from '../models/Review.model.js';
import Location from '../models/Location.model.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const reviewsData = JSON.parse(
  readFileSync(join(__dirname, 'data', 'reviews.json'), 'utf-8')
);

/**
 * Generate slug from review text
 */
const generateSlug = (text, index) => {
  // Take first 50 chars of review text, clean it, and add index for uniqueness
  const cleanText = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  return `${cleanText}-${index}`;
};

/**
 * Seed reviews into the database
 * @param {Array} locations - Array of created locations to assign reviews to
 */
export const seedReviews = async (locations) => {
  try {
    console.log('🌱 Seeding reviews...');

    if (!locations || locations.length === 0) {
      throw new Error('No locations available. Seed locations first.');
    }

    // Assign reviews to locations in round-robin fashion
    const reviewsWithLocations = reviewsData.map((review, index) => {
      const location = locations[index % locations.length];
      const slug = generateSlug(review.text, index);

      // Helper to safely parse date or return null
      const safeDate = (val) => {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };

      return {
        ...review,
        locationId: location._id,
        slug,
        publishedAt: safeDate(review.publishedAt),
        scrapedAt: safeDate(review.scrapedAt),
        analyzedAt: safeDate(review.analyzedAt)
      };
    });

    const reviews = await Review.insertMany(reviewsWithLocations);
    console.log(`✅ ${reviews.length} reviews seeded`);

    // Update location sentiment statistics
    await updateLocationSentiments(locations);

    return reviews;
  } catch (error) {
    console.error('❌ Error seeding reviews:', error.message);
    throw error;
  }
};

/**
 * Update overall sentiment for each location based on its reviews
 */
const updateLocationSentiments = async (locations) => {
  try {
    for (const location of locations) {
      const reviews = await Review.find({ locationId: location._id });
      
      if (reviews.length === 0) continue;

      const positive = reviews.filter(r => r.sentiment === 'positive').length;
      const neutral = reviews.filter(r => r.sentiment === 'neutral').length;
      const negative = reviews.filter(r => r.sentiment === 'negative').length;
      const total = reviews.length;

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / total;

      await Location.findByIdAndUpdate(location._id, {
        'overallSentiment.positive': parseFloat(((positive / total) * 100).toFixed(2)),
        'overallSentiment.neutral': parseFloat(((neutral / total) * 100).toFixed(2)),
        'overallSentiment.negative': parseFloat(((negative / total) * 100).toFixed(2)),
        'overallSentiment.averageRating': parseFloat(averageRating.toFixed(2)),
        'overallSentiment.totalReviews': total
      });
    }

    console.log('✅ Location sentiments updated');
  } catch (error) {
    console.error('❌ Error updating location sentiments:', error.message);
    throw error;
  }
};

/**
 * Clear all reviews from the database
 */
export const clearReviews = async () => {
  try {
    await Review.deleteMany({});
    console.log('✅ Reviews cleared');
  } catch (error) {
    console.error('❌ Error clearing reviews:', error.message);
    throw error;
  }
};
