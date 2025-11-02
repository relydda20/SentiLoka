import { motion } from "framer-motion";
import { Star, Sparkles } from "lucide-react";
import { springTransition } from "../../../utils/motionConfig";

import { getSentimentBadgeColor } from "../../../utils/sentimentUtils";

const ReviewCard = ({ review, onGenerateReply }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: "0 10px 25px rgba(47, 75, 78, 0.1)", y: -2 }}
      className="bg-white p-4 border border-[#E1E6C3] hover:border-[#CED7B0] rounded-lg transition-all"
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#2F4B4E] truncate">{review.author}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? "fill-[#4B7069] text-[#4B7069]"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-[#42676B] text-xs">
              {formatDate(review.time)}
            </span>
          </div>
        </div>
        {review.sentiment && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${getSentimentBadgeColor(
              review.sentiment,
            )}`}
          >
            {review.sentiment}
          </span>
        )}
      </div>

      {review.text && (
        <p className="mt-3 text-[#2F4B4E] text-sm leading-relaxed">
          {review.text}
        </p>
      )}

      <div className="flex justify-end items-center mt-3 pt-3 border-[#E1E6C3] border-t">
        <motion.button
          onClick={() => onGenerateReply(review)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={springTransition}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#2F4B4E] hover:from-[#42676B] to-[#42676B] hover:to-[#4B7069] shadow-sm hover:shadow-md px-3 py-1.5 rounded-lg font-medium text-white text-xs transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate Reply
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ReviewCard;
