/**
 * Location Review Service
 * Unified service layer - Re-exports modularized services for backward compatibility
 * This file maintains the old API while delegating to the new modularized services
 */

// Re-export all location services
export {
  fetchBusinessLocations,
  registerBusinessLocation,
  getLocationScrapeStatus,
  deleteLocation,
} from "./locationService";

// Re-export all review services
export {
  fetchExistingReviews,
  loadBusinessReviews,
} from "./reviewService";

// Re-export all scraper services
export {
  triggerLocationScrape,
  subscribeScrapeProgress,
} from "./scraperService";

// Re-export all sentiment services
export {
  analyzeLocationSentiment,
} from "./sentimentService";

// Re-export formatters
export { formatReviewDate } from "../utils/formatters";
