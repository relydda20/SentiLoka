/**
 * React Query Configuration
 * Centralized configuration for TanStack Query
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is stale immediately (always fetch fresh)
      staleTime: 0,
      // Keep data in cache briefly for back navigation
      gcTime: 2 * 60 * 1000, // 2 minutes
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus (avoid unnecessary requests)
      refetchOnWindowFocus: false,
      // Refetch on reconnect (good for mobile/unstable connections)
      refetchOnReconnect: true,
      // Always refetch on mount to get fresh data
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

/**
 * Query Keys Factory
 * Centralized query key management to prevent typos and ensure consistency
 */
export const queryKeys = {
  // Location-related queries
  locations: {
    all: ['locations'],
    detail: (locationId) => ['locations', locationId],
    reviews: (locationId, filters) => [
      'locations',
      locationId,
      'reviews',
      filters,
    ],
    sentiment: (locationId) => ['locations', locationId, 'sentiment'],
    scrapeStatus: (locationId) => ['locations', locationId, 'scrapeStatus'],
  },

  // Review-related queries
  reviews: {
    all: ['reviews'],
    byLocation: (locationId) => ['reviews', 'location', locationId],
    detail: (reviewId) => ['reviews', reviewId],
    paginated: (locationId, page, filters) => [
      'reviews',
      'location',
      locationId,
      'paginated',
      page,
      filters,
    ],
  },

  // Sentiment analysis queries
  sentiment: {
    all: ['sentiment'],
    byLocation: (locationId) => ['sentiment', 'location', locationId],
    overall: (locationId) => ['sentiment', 'overall', locationId],
  },
};
