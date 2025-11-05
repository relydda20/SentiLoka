/**
 * useReviewsQuery Hook
 * React Query hooks for managing review data fetching and caching
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import {
  fetchExistingReviews,
  loadBusinessReviews,
} from '../services/reviewService';
import { analyzeLocationSentiment } from '../services/locationReviewService';

/**
 * Hook to fetch existing reviews (no scraping)
 * Used for: pagination, filtering, marker clicks
 */
export const useExistingReviewsQuery = (locationId, options = {}, enabled = true) => {
  const {
    page = 1,
    limit = 5,
    sentiment = 'all',
    rating = 0,
    searchTerm = '',
    sortBy = 'date',
    sortOrder = 'desc',
  } = options;

  return useQuery({
    queryKey: queryKeys.reviews.paginated(locationId, page, {
      sentiment,
      rating,
      searchTerm,
      sortBy,
      sortOrder,
    }),
    queryFn: async () => {
      console.log('🔍 [React Query] Fetching existing reviews:', {
        locationId,
        page,
        sentiment,
        rating,
        searchTerm,
      });

      const result = await fetchExistingReviews(locationId, {
        page,
        limit,
        sentiment,
        rating,
        searchTerm,
        sortBy,
        sortOrder,
      });

      console.log('✅ [React Query] Reviews fetched successfully:', result);
      return result.business;
    },
    enabled: enabled && !!locationId,
    // NO CACHING - Always fetch fresh data for pagination/filters
    staleTime: 0, // Data is always considered stale
    gcTime: 0, // Don't keep old data in cache
    // Don't use placeholderData - we want full page replacement, not "load more" behavior
  });
};

/**
 * Hook to load reviews (with scraping if needed)
 * Used for: initial load, force refresh
 */
export const useLoadReviewsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, options }) => {
      console.log('🔄 [React Query] Loading reviews (with scraping if needed):', locationId);
      const result = await loadBusinessReviews(locationId, options);
      return result.business;
    },
    onSuccess: (data, variables) => {
      console.log('✅ [React Query] Reviews loaded successfully:', data);

      // Invalidate and refetch all review queries for this location
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byLocation(variables.locationId),
      });

      // Update the location cache
      queryClient.setQueryData(
        queryKeys.locations.detail(variables.locationId),
        (oldData) => ({
          ...oldData,
          ...data,
        })
      );
    },
    onError: (error) => {
      console.error('❌ [React Query] Error loading reviews:', error);
    },
  });
};

/**
 * Hook to analyze sentiment for a location
 */
export const useAnalyzeSentimentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationId) => {
      console.log('🧠 [React Query] Analyzing sentiment for location:', locationId);
      const result = await analyzeLocationSentiment(locationId);
      return result.business;
    },
    onSuccess: (data, locationId) => {
      console.log('✅ [React Query] Sentiment analyzed successfully:', data);

      // Invalidate all review queries for this location
      // This will refetch them with sentiment data
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byLocation(locationId),
      });

      // Invalidate sentiment queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.sentiment.byLocation(locationId),
      });

      // Update location cache
      queryClient.setQueryData(
        queryKeys.locations.detail(locationId),
        (oldData) => ({
          ...oldData,
          ...data,
        })
      );
    },
    onError: (error) => {
      console.error('❌ [React Query] Error analyzing sentiment:', error);
    },
  });
};

/**
 * Hook to get overall sentiment for a location
 */
export const useSentimentQuery = (locationId, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.sentiment.overall(locationId),
    queryFn: async () => {
      // This will be called from the review service
      // For now, we can extract it from the reviews query
      return null;
    },
    enabled: enabled && !!locationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Helper hook to prefetch next page
 * NOTE: Prefetching disabled since we're not caching pagination data
 * Kept for potential future use if caching strategy changes
 */
export const usePrefetchNextPage = () => {
  // No-op - prefetching disabled for fresh data strategy
  const prefetchNextPage = () => {
    // Do nothing
  };

  return { prefetchNextPage };
};
