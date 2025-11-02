import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, ChevronDown } from "lucide-react";
import ReviewCard from "./ReviewCard";

const ReviewList = ({
  hasReviews,
  displayedReviews,
  totalReviews,
  loadingReviews,
  onGenerateReply,
  onLoadMoreReviews,
}) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {!hasReviews ? (
        <div className="py-12 text-center">
          <MessageSquare className="mx-auto mb-3 w-12 h-12 text-[#CED7B0]" />
          <p className="mb-2 text-[#42676B]">No reviews loaded yet</p>
          <p className="text-[#42676B] text-sm">
            Click "Load Reviews" to fetch and analyze reviews
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2 font-semibold text-[#2F4B4E]">
              <MessageSquare className="w-5 h-5" />
              Recent Reviews
            </h3>
            <span className="text-[#42676B] text-sm">
              {displayedReviews.length} of {totalReviews}
            </span>
          </div>

          {loadingReviews ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonReviewCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedReviews.map((review, index) => (
                <ReviewCard
                  key={review.reviewId || index}
                  review={review}
                  onGenerateReply={onGenerateReply}
                />
              ))}

              {displayedReviews.length < totalReviews && (
                <motion.button
                  onClick={onLoadMoreReviews}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex justify-center items-center gap-2 hover:bg-[#FAF6E9] py-3 border-[#CED7B0] border-2 hover:border-[#2F4B4E] border-dashed rounded-lg w-full font-medium text-[#42676B] hover:text-[#2F4B4E] transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More Reviews
                </motion.button>
              )}
            </div>
          )}
        </>
      )}
    </div>
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
