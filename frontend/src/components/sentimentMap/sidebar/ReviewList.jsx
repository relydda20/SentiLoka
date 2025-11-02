import React from "react";
import {
  MessageSquare,
  Search,
  Star,
  Smile,
  Frown,
  Meh,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import ReviewCard from "./ReviewCard";

const ReviewList = ({
  reviews = [],
  pagination = null,
  hasReviews, // This prop means "reviews exist for this location"
  loadingReviews, // For initial skeleton
  isFetchingReviews, // For subsequent fetches
  onGenerateReply,
  reviewFilters,
  onFilterOrPageChange,
}) => {
  // Handlers to update state in parent
  const handleSearchChange = (e) => {
    onFilterOrPageChange({ searchTerm: e.target.value, page: 1 });
  };

  const handleSentimentChange = (sentiment) => {
    onFilterOrPageChange({ sentiment: sentiment, page: 1 });
  };

  const handleRatingChange = (rating) => {
    const newRating = reviewFilters.rating === rating ? 0 : rating; // Toggle
    onFilterOrPageChange({ rating: newRating, page: 1 });
  };

  const handlePageChange = (newPage) => {
    onFilterOrPageChange({ page: newPage });
  };

  const handleClearFilters = () => {
    onFilterOrPageChange({
      searchTerm: "",
      sentiment: "all",
      rating: 0,
      page: 1,
    });
  };

  const hasActiveFilters =
    reviewFilters.searchTerm !== "" ||
    reviewFilters.sentiment !== "all" ||
    reviewFilters.rating !== 0;

  return (
    <div className="flex flex-col flex-1 p-6 overflow-y-auto">
      {/* Case 1: Initial load skeleton */}
      {loadingReviews && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonReviewCard key={i} />
          ))}
        </div>
      )}

      {/* Case 2: No reviews loaded yet (e.g., new location) */}
      {!hasReviews && !loadingReviews && (
        <div className="m-auto py-12 text-center">
          <MessageSquare className="mx-auto mb-3 w-12 h-12 text-[#CED7B0]" />
          <p className="mb-2 text-[#42676B]">No reviews loaded yet</p>
          <p className="text-[#42676B] text-sm">
            Click "Load Reviews" to fetch and analyze reviews
          </p>
        </div>
      )}

      {/* Case 3: Reviews UI (shown if hasReviews is true and not initial load) */}
      {hasReviews && !loadingReviews && (
        <>
          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search reviews by text or author..."
              value={reviewFilters.searchTerm}
              onChange={handleSearchChange}
              className="bg-[#FAF6E9] py-2 pr-4 pl-10 border border-[#CED7B0] focus:border-[#4B7069] rounded-lg focus:outline-none focus:ring-[#4B7069] focus:ring-1 w-full text-sm"
            />
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-[#42676B] -translate-y-1/2" />
          </div>

          {/* Filter Section */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Sentiment Filter */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-[#2F4B4E] text-sm">
                Sentiment
              </span>
              <div className="flex gap-1">
                <SentimentButton
                  sentiment="all"
                  active={reviewFilters.sentiment}
                  onClick={handleSentimentChange}
                />
                <SentimentButton
                  sentiment="Positive"
                  active={reviewFilters.sentiment}
                  onClick={handleSentimentChange}
                />
                <SentimentButton
                  sentiment="Neutral"
                  active={reviewFilters.sentiment}
                  onClick={handleSentimentChange}
                />
                <SentimentButton
                  sentiment="Negative"
                  active={reviewFilters.sentiment}
                  onClick={handleSentimentChange}
                />
              </div>
            </div>
            {/* Rating Filter */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-[#2F4B4E] text-sm">Rating</span>
              <div className="flex gap-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingButton
                    key={star}
                    rating={star}
                    active={reviewFilters.rating}
                    onClick={handleRatingChange}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex justify-center items-center gap-1.5 mb-4 text-[#42676B] hover:text-red-600 text-xs transition-colors"
            >
              <X className="w-3 h-3" /> Clear All Filters
            </button>
          )}

          {/* Loading overlay for filtering */}
          <div className="relative flex-1">
            {isFetchingReviews && (
              <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/70">
                <Loader2 className="w-6 h-6 text-[#2F4B4E] animate-spin" />
              </div>
            )}

            {/* Review List */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <ReviewCard
                    key={review.reviewId || index}
                    review={review}
                    onGenerateReply={onGenerateReply}
                  />
                ))
              ) : (
                // This is the "No Reviews Found" message for filters
                <div className="py-12 text-center">
                  <Search className="mx-auto mb-3 w-12 h-12 text-[#CED7B0]" />
                  <p className="mb-2 text-[#42676B]">No Reviews Found</p>
                  <p className="text-[#42676B] text-sm">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-[#E1E6C3] border-t">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || isFetchingReviews}
                className="flex items-center gap-1 bg-white hover:bg-[#FAF6E9] disabled:opacity-50 px-3 py-1.5 border border-[#CED7B0] rounded-md font-medium text-[#42676B] text-sm transition-colors disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <span className="text-[#42676B] text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={
                  pagination.currentPage === pagination.totalPages ||
                  isFetchingReviews
                }
                className="flex items-center gap-1 bg-white hover:bg-[#FAF6E9] disabled:opacity-50 px-3 py-1.5 border border-[#CED7B0] rounded-md font-medium text-[#42676B] text-sm transition-colors disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --- Filter Button Sub-components ---

const SentimentButton = ({ sentiment, active, onClick }) => {
  const isActive = active.toLowerCase() === sentiment.toLowerCase();
  const sentimentMap = {
    all: {
      icon: null,
      label: "All",
      active: "bg-[#4B7069] text-white",
      inactive: "bg-white hover:bg-gray-50 text-[#42676B]",
    },
    Positive: {
      icon: <Smile className="w-4 h-4" />,
      label: "",
      active: "bg-green-600 text-white",
      inactive: "bg-green-100 hover:bg-green-200 text-green-700",
    },
    Neutral: {
      icon: <Meh className="w-4 h-4" />,
      label: "",
      active: "bg-yellow-500 text-white",
      inactive: "bg-yellow-100 hover:bg-yellow-200 text-yellow-700",
    },
    Negative: {
      icon: <Frown className="w-4 h-4" />,
      label: "",
      active: "bg-red-600 text-white",
      inactive: "bg-red-100 hover:bg-red-200 text-red-700",
    },
  };
  const config = sentimentMap[sentiment];
  return (
    <button
      onClick={() => onClick(sentiment)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? config.active : config.inactive
      } ${
        sentiment === "all" ? "w-16" : "w-10"
      } flex justify-center items-center`}
    >
      {config.icon}
      {config.label}
    </button>
  );
};

const RatingButton = ({ rating, active, onClick }) => {
  const isActive = active === rating;
  return (
    <button
      onClick={() => onClick(rating)}
      className={`flex items-center justify-center gap-0.5 w-10 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-[#4B7069] text-white"
          : "bg-white hover:bg-gray-50 text-[#42676B]"
      }`}
    >
      {rating}
      <Star
        className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-yellow-500"}`}
      />
    </button>
  );
};

// Skeleton Loading Component
const SkeletonReviewCard = () => (
  <div className="bg-white p-4 border border-[#E1E6C3] rounded-lg animate-pulse">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="bg-[#E1E6C3] mb-2 rounded w-1/3 h-4"></div>
        <div className="bg-[#E1E6C3] rounded w-1/2 h-3"></div>
      </div>
      <div className="bg-[#E1E6C3] rounded-full w-16 h-6"></div>
    </div>
    <div className="space-y-2 mt-3">
      <div className="bg-[#E1E6C3] rounded w-full h-3"></div>
      <div className="bg-[#E1E6C3] rounded w-5/6 h-3"></div>
    </div>
  </div>
);

export default ReviewList;
