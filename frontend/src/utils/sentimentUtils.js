/**
 * Sentiment Utilities
 * Helper functions for sentiment analysis
 */

export const getMarkerColor = (sentiment) => {
  if (!sentiment) return "#9ca3af"; // gray

  const positivePercentage = sentiment.positivePercentage || 0;
  const negativePercentage = sentiment.negativePercentage || 0;

  if (positivePercentage > 60) return "#22c55e"; // green
  if (negativePercentage > 40) return "#ef4444"; // red
  return "#eab308"; // yellow
};

export const getSentimentLabel = (sentiment) => {
  if (!sentiment) return "No Data";

  const positivePercentage = sentiment.positivePercentage || 0;
  const negativePercentage = sentiment.negativePercentage || 0;

  if (positivePercentage > 60) return "Positive";
  if (negativePercentage > 40) return "Negative";
  return "Neutral";
};

export const getSentimentBadgeColor = (sentiment) => {
  if (!sentiment) return "bg-gray-100 text-gray-800";

  switch (sentiment.toLowerCase()) {
    case "positive":
      return "bg-green-100 text-green-800";
    case "negative":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const calculateAnalytics = (locations) => {
  const totalLocations = locations.length;
  const totalReviews = locations.reduce(
    (sum, loc) => sum + (loc.reviewsCount || 0),
    0,
  );
  const analyzedReviews = locations.reduce(
    (sum, loc) => sum + (loc.reviews?.length || 0),
    0,
  );
  const avgRating =
    locations.length > 0
      ? (
          locations.reduce((sum, loc) => sum + (loc.averageRating || 0), 0) /
          locations.length
        ).toFixed(1)
      : "0.0";

  const sentimentCounts = locations.reduce(
    (acc, loc) => {
      if (loc.sentiment) {
        acc.positive += loc.sentiment.positive || 0;
        acc.neutral += loc.sentiment.neutral || 0;
        acc.negative += loc.sentiment.negative || 0;
      }
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 },
  );

  return {
    totalLocations,
    totalReviews,
    analyzedReviews,
    avgRating,
    sentimentCounts,
  };
};
