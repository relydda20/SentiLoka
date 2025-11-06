import { motion, AnimatePresence } from "framer-motion";
import ReviewSidebarHeader from "./ReviewSidebarHeader";
import ReviewSidebarSentiment from "./ReviewSidebarSentiment.jsx";
import ReviewList from "./ReviewList";

const ReviewSidebar = ({
  isOpen,
  selectedLocation,
  reviewData, // Data from React Query
  loadingReviews, // For initial load
  onClose,
  onLoadReviews,
  onGenerateReply,
  getSentimentIcon,
  loadingSentiment, // For initial analysis
  onAnalyzeSentiment,
  // *** NEW PROPS ***
  reviewFilters,
  reviewPage,
  onFilterOrPageChange,
  isFetchingReviews, // General loading for filters/pagination
  onRescrape,
  onReanalyze,
  isRescraping,
  isReanalyzing,
}) => {
  if (!isOpen || !selectedLocation) return null;

  // Use reviewData from React Query if available, otherwise fall back to selectedLocation
  const reviews = reviewData?.reviews || selectedLocation.reviews || [];
  const pagination = reviewData?.pagination || selectedLocation.pagination || null;
  const sentiment = reviewData?.sentiment || selectedLocation.sentiment || null;
  const reviewsCount = reviewData?.reviewsCount || selectedLocation.reviewsCount || 0;

  // hasReviews is TRUE if the location has reviews in the database (even if current filter shows 0)
  // Use reviewsCount (total in DB) instead of current filtered results
  // This ensures filter UI stays visible even when filters return 0 results
  const hasReviews = (reviewsCount > 0) ||
                     reviews.length > 0 ||
                     (pagination && pagination.totalReviews > 0);

  // Debug log
  console.log("📊 ReviewSidebar state:", {
    locationId: selectedLocation.id,
    reviewsCount,
    hasReviews,
    reviewsLength: reviews.length,
    reviewIds: reviews.map(r => r.reviewId || r.id).slice(0, 3), // First 3 review IDs
    reviewAuthors: reviews.map(r => r.author).slice(0, 3), // First 3 authors
    pagination,
    usingReactQuery: !!reviewData,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="top-0 right-0 z-50 fixed bg-white shadow-2xl w-full sm:w-96 h-full"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <ReviewSidebarHeader
            selectedLocation={selectedLocation}
            hasReviews={hasReviews} // Use this to show/hide "Load Reviews"
            loadingReviews={loadingReviews}
            onClose={onClose}
            onLoadReviews={() => onLoadReviews(selectedLocation.id)}
            onRescrape={onRescrape}
            onReanalyze={onReanalyze}
            isRescraping={isRescraping}
            isReanalyzing={isReanalyzing}
          />

          {/* Sentiment Summary */}
          <ReviewSidebarSentiment
            sentiment={sentiment}
            reviewsCount={reviewsCount}
            getSentimentIcon={getSentimentIcon}
            hasReviews={hasReviews}
            loadingSentiment={loadingSentiment}
            onAnalyzeSentiment={() => onAnalyzeSentiment(selectedLocation.id)}
          />

          {/* Reviews List */}
          <ReviewList
            reviews={reviews} // Pass paginated reviews
            pagination={pagination} // Pass pagination info
            hasReviews={hasReviews} // *** THIS IS THE FIX: Pass hasReviews ***
            loadingReviews={loadingReviews} // For initial load skeleton
            isFetchingReviews={isFetchingReviews} // For filter/page loading
            onGenerateReply={onGenerateReply}
            // Pass filter state and handlers
            reviewFilters={reviewFilters}
            reviewPage={reviewPage}
            onFilterOrPageChange={onFilterOrPageChange}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewSidebar;
