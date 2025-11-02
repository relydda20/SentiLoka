/* Fetched content from:
 * - relydda20/sentiloka/SentiLoka-feature-sentiment-map-design/frontend/src/utils/sentimentUtils.js
 */
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
  // Use a fallback for neutral if total reviews exist
  if (
    sentiment.totalReviews > 0 ||
    positivePercentage > 0 ||
    negativePercentage > 0
  ) {
    return "#eab308"; // yellow
  }
  return "#9ca3af"; // gray if no data
};

export const getSentimentLabel = (sentiment) => {
  if (!sentiment) return "No Data";

  const positivePercentage = sentiment.positivePercentage || 0;
  const negativePercentage = sentiment.negativePercentage || 0;

  if (positivePercentage > 60) return "Positive";
  if (negativePercentage > 40) return "Negative";
  // Check if any reviews exist to classify as neutral
  if (
    sentiment.totalReviews > 0 ||
    positivePercentage > 0 ||
    negativePercentage > 0
  ) {
    return "Neutral";
  }
  return "No Data";
};

/**
 * *** MODIFIED: Handles both complex objects and simple strings ***
 * This is used by LocationsPanel and ReviewCard
 */
export const getSentimentBadgeColor = (sentiment) => {
  let sentimentLabel = "No Data";

  if (typeof sentiment === "string") {
    // Handles simple strings like "Positive", "Negative", null
    sentimentLabel = sentiment || "No Data";
  } else if (sentiment && sentiment.positivePercentage !== undefined) {
    // Handles the complex object from mockBusinessLocations
    // We re-use the logic from getSentimentLabel
    sentimentLabel = getSentimentLabel(sentiment);
  }

  const sentimentStr = sentimentLabel.toLowerCase();

  switch (sentimentStr) {
    case "positive":
      return {
        label: "Positive",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      };
    case "negative":
      return {
        label: "Negative",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
      };
    case "neutral":
      return {
        label: "Neutral",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
      };
    default:
      return {
        label: "No Data",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
      };
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
