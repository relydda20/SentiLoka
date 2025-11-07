/**
 * useReviewManagement Hook
 * Manages review fetching, filtering, and pagination using React Query
 */
import { useState, useCallback, useEffect } from "react";
import {
  useExistingReviewsQuery,
  useLoadReviewsMutation,
  useAnalyzeSentimentMutation,
  useRescrapeMutation,
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
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [checkedForExistingReviews, setCheckedForExistingReviews] = useState(false);

  // Reset page, filters, and loaded state when location changes
  useEffect(() => {
    setReviewPage(1);
    setReviewFilters(DEFAULT_FILTERS);
    setHasLoadedReviews(false); // Start with false
    setCheckedForExistingReviews(false); // Need to check if location has reviews
  }, [selectedLocationId]);

  // Check if location already has reviews on mount
  useEffect(() => {
    const checkExistingReviews = async () => {
      if (!selectedLocationId || checkedForExistingReviews) return;

      try {
        // Import the service
        const { getLocationScrapeStatus } = await import('../services/locationService');
        const location = await getLocationScrapeStatus(selectedLocationId);

        // If location has been scraped and has a lastScraped date, enable auto-fetch
        if (location.scrapeConfig?.lastScraped) {
          console.log('✅ Location already has reviews, enabling auto-fetch');
          setHasLoadedReviews(true);
        } else {
          console.log('📭 Location has no reviews yet, waiting for user to click Load Reviews');
        }
      } catch (error) {
        console.error('Error checking for existing reviews:', error);
      } finally {
        setCheckedForExistingReviews(true);
      }
    };

    checkExistingReviews();
  }, [selectedLocationId, checkedForExistingReviews]);

  // Query for existing reviews (NO AUTO-FETCH on sidebar open)
  // Only fetches after user explicitly loads reviews
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
    !!selectedLocationId && hasLoadedReviews // Only fetch if location selected AND reviews have been loaded
  );

  // Mutation for loading reviews (with scraping)
  const loadReviewsMutation = useLoadReviewsMutation();

  // Mutation for analyzing sentiment
  const analyzeSentimentMutation = useAnalyzeSentimentMutation();

  // Mutation for rescraping
  const rescrapeMutation = useRescrapeMutation();

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

        // Enable automatic fetching now that reviews have been loaded
        setHasLoadedReviews(true);

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
    isRescraping: rescrapeMutation.isPending,

    // Mutations
    rescrapeMutation,

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
