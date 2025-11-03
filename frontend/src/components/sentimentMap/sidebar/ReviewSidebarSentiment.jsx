import SentimentBar from "./SentimentBar";
import { getSentimentLabel } from "../../../utils/sentimentUtils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronDown } from "lucide-react"; // Import ChevronDown
import { useState } from "react"; // Import useState

const ReviewSidebarSentiment = ({
  sentiment,
  reviewsCount,
  getSentimentIcon,
  hasReviews, // bool: are reviews loaded?
  loadingSentiment, // bool: are we currently analyzing?
  onAnalyzeSentiment, // func: to trigger analysis
}) => {
  // NEW: State for collapsibility
  const [isExpanded, setIsExpanded] = useState(true);

  // Determine overall label for header
  const headerLabel = sentiment ? getSentimentLabel(sentiment) : null;

  return (
    <div className="bg-[#FAF6E9] p-6 border-[#CED7B0] border-b shrink-0">
      {/* --- MODIFIED: Clickable Header --- */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex justify-between items-center mb-3 w-full"
      >
        <h3 className="font-semibold text-[#2F4B4E]">Overall Sentiment</h3>
        <div className="flex items-center gap-2">
          {sentiment && (
            <>
              {getSentimentIcon(sentiment)}
              <span className="font-medium text-sm">{headerLabel}</span>
            </>
          )}
          <ChevronDown
            className={`w-5 h-5 text-[#42676B] transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* --- NEW: Collapsible Section --- */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* --- Content (conditionally rendered) --- */}
            {sentiment && (
              <div className="space-y-2 pt-1">
                <SentimentBar
                  label="Positive"
                  count={sentiment.positive}
                  percentage={sentiment.positivePercentage}
                  color="green"
                />
                <SentimentBar
                  label="Neutral"
                  count={sentiment.neutral}
                  percentage={
                    ((sentiment.neutral || 0) / (reviewsCount || 1)) * 100
                  }
                  color="yellow"
                />
                <SentimentBar
                  label="Negative"
                  count={sentiment.negative}
                  percentage={sentiment.negativePercentage}
                  color="red"
                />
              </div>
            )}

            {!sentiment && hasReviews && (
              <div className="pt-1">
                <p className="mb-4 text-[#42676B] text-sm text-center">
                  {reviewsCount} reviews loaded. Click below to analyze
                  sentiment.
                </p>
                <motion.button
                  onClick={onAnalyzeSentiment}
                  disabled={loadingSentiment}
                  whileHover={!loadingSentiment ? { scale: 1.02 } : {}}
                  whileTap={!loadingSentiment ? { scale: 0.98 } : {}}
                  className="flex justify-center items-center gap-2 bg-gradient-to-r from-[#4B7069] hover:from-[#42676B] to-[#42676B] hover:to-[#2F4B4E] disabled:opacity-50 shadow-md mt-2 px-4 py-2.5 rounded-lg w-full font-medium text-white transition-colors"
                >
                  {loadingSentiment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Review Sentiment
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {!sentiment && !hasReviews && (
              <p className="pt-1 text-[#42676B] text-sm text-center">
                Load reviews to see sentiment analysis.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewSidebarSentiment;
