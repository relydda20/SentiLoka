/**
 * useReviewManagement Hook
 * Manages review fetching, filtering, and pagination using React Query
 */
import { useState, useCallback, useEffect } from "react";
import {
  useExistingReviewsQuery,
  useLoadReviewsMutation,
  useAnalyzeSentimentMutation,
  usePrefetchNextPage,
} from "./useReviewsQuery";

const DEFAULT_FILTERS = {
  searchTerm: "",
  sentiment: "all",
  rating: 0,
};

export const useReviewManagement = (selectedLocationId) => {
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewFilters, setReviewFilters] = useState(DEFAULT_FILTERS);

  // Reset page and filters when location changes
  useEffect(() => {
    setReviewPage(1);
    setReviewFilters(DEFAULT_FILTERS);
  }, [selectedLocationId]);

  // Query for existing reviews (auto-fetches and caches)
  const {
    data: reviewData,
    isLoading: isFetchingReviews,
    isError: reviewsError,
    error: reviewsErrorMessage,
  } = useExistingReviewsQuery(
    selectedLocationId,
    {
      page: reviewPage,
      ...reviewFilters,
    },
    !!selectedLocationId // Only fetch when location is selected
  );

  // Mutation for loading reviews (with scraping)
  const loadReviewsMutation = useLoadReviewsMutation();

  // Mutation for analyzing sentiment
  const analyzeSentimentMutation = useAnalyzeSentimentMutation();

  // Note: Prefetching disabled - we always fetch fresh data for pagination
  const { prefetchNextPage } = usePrefetchNextPage();

  // Handle initial load of reviews (with scraping if needed)
  const handleInitialLoadReviews = useCallback(
    async (locationId, onScrapeProgress) => {
      console.log("=== Load Reviews Request ===");
      try {
        const options = {
          page: 1,
          ...DEFAULT_FILTERS,
          onScrapeProgress,
        };

        const result = await loadReviewsMutation.mutateAsync({
          locationId,
          options,
        });

        console.log("✅ Reviews loaded successfully:", result);
        return result;
      } catch (error) {
        console.error("Error loading reviews:", error);
        throw error;
      }
    },
    [loadReviewsMutation]
  );

  // Handle sentiment analysis
  const handleInitialAnalyzeSentiment = useCallback(
    async (locationId) => {
      console.log("=== Analyze Sentiment Request ===");
      try {
        const result = await analyzeSentimentMutation.mutateAsync(locationId);

        const message = `✅ Sentiment analyzed successfully!\n${
          result.analysis?.newlyAnalyzed || 0
        } reviews newly analyzed.`;

        console.log(message);
        return {
          updatedBusiness: result,
          message,
        };
      } catch (error) {
        console.error("Error analyzing sentiment:", error);
        throw error;
      }
    },
    [analyzeSentimentMutation]
  );

  // Handle filter and page changes
  const handleFilterOrPageChange = useCallback(
    (newOptions) => {
      const newPage =
        newOptions.page !== undefined ? newOptions.page : reviewPage;
      const newFilters = {
        searchTerm:
          newOptions.searchTerm !== undefined
            ? newOptions.searchTerm
            : reviewFilters.searchTerm,
        sentiment:
          newOptions.sentiment !== undefined
            ? newOptions.sentiment
            : reviewFilters.sentiment,
        rating:
          newOptions.rating !== undefined
            ? newOptions.rating
            : reviewFilters.rating,
      };

      console.log("🔄 Filter/Page change:", { newPage, newFilters });

      setReviewPage(newPage);
      setReviewFilters(newFilters);

      // React Query will automatically refetch with new parameters
    },
    [reviewPage, reviewFilters]
  );

  return {
    // State
    reviewPage,
    setReviewPage,
    reviewFilters,
    setReviewFilters,

    // Review data from React Query
    reviewData, // Contains: reviews, pagination, sentiment, etc.
    isFetchingReviews,
    reviewsError,
    reviewsErrorMessage,

    // Loading states from mutations
    loadingReviews: loadReviewsMutation.isPending,
    loadingSentiment: analyzeSentimentMutation.isPending,

    // Handlers
    handleInitialLoadReviews,
    handleInitialAnalyzeSentiment,
    handleFilterOrPageChange,

    // Reset function
    resetFilters: () => {
      setReviewPage(1);
      setReviewFilters(DEFAULT_FILTERS);
    },
  };
};
