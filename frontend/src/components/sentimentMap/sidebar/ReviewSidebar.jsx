import React from "react";
import { motion } from "framer-motion";
import ReviewSidebarHeader from "./ReviewSidebarHeader";
import ReviewSidebarSentiment from "./ReviewSidebarSentiment.jsx";
import ReviewList from "./ReviewList";

const ReviewSidebar = ({
  isOpen,
  selectedLocation,
  loadingReviews,
  reviewsPage,
  onClose,
  onLoadReviews,
  onGenerateReply,
  onLoadMoreReviews,
  getSentimentIcon,
}) => {
  if (!isOpen || !selectedLocation) return null;

  const displayedReviews =
    selectedLocation?.reviews?.slice(0, reviewsPage * 5) || [];
  const totalReviews = selectedLocation?.reviews?.length || 0;
  const hasReviews =
    selectedLocation?.reviews && selectedLocation.reviews.length > 0;

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
          hasReviews={hasReviews}
          loadingReviews={loadingReviews}
          onClose={onClose}
          onLoadReviews={onLoadReviews}
        />

        {/* Sentiment Summary */}
        {hasReviews && selectedLocation.sentiment && (
          <ReviewSidebarSentiment
            sentiment={selectedLocation.sentiment}
            reviewsCount={selectedLocation.reviewsCount}
            getSentimentIcon={getSentimentIcon}
          />
        )}

        {/* Reviews List */}
        <ReviewList
          hasReviews={hasReviews}
          displayedReviews={displayedReviews}
          totalReviews={totalReviews}
          loadingReviews={loadingReviews}
          onGenerateReply={onGenerateReply}
          onLoadMoreReviews={onLoadMoreReviews}
        />
      </div>
    </motion.div>
  );
};

export default ReviewSidebar;
