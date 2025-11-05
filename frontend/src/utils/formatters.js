/**
 * Formatter Utilities
 * Helper functions for formatting data
 */

/**
 * Format review date to human-readable format
 */
export const formatReviewDate = (date) => {
  if (!date) return "Unknown date";

  const reviewDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - reviewDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};
