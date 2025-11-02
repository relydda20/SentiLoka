import React from "react";
import { motion } from "framer-motion";
import ReviewSidebarHeader from "./ReviewSidebarHeader";
import ReviewSidebarSentiment from "./ReviewSidebarSentiment.jsx";
import ReviewList from "./ReviewList";

const ReviewSidebar = ({
  isOpen,
  selectedLocation,
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
}) => {
  if (!isOpen || !selectedLocation) return null;

  // Reviews and pagination info are now directly on selectedLocation
  const { reviews = [], pagination = null } = selectedLocation;

  // This prop is TRUE if the location has reviews in the DB (even if not loaded yet)
  const hasReviews = (selectedLocation.reviewsCount || 0) > 0;

  return (
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
        />

        {/* Sentiment Summary */}
        <ReviewSidebarSentiment
          sentiment={selectedLocation.sentiment}
          reviewsCount={selectedLocation.reviewsCount}
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
  );
};

export default ReviewSidebar;
