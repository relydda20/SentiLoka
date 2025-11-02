import SentimentBar from "./SentimentBar";
import { getSentimentLabel } from "../../../utils/sentimentUtils";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react"; // Import new icons

const ReviewSidebarSentiment = ({
  sentiment,
  reviewsCount,
  getSentimentIcon,
  hasReviews, // bool: are reviews loaded?
  loadingSentiment, // bool: are we currently analyzing?
  onAnalyzeSentiment, // func: to trigger analysis
}) => {
  // Case 1: Sentiment is analyzed and available
  if (sentiment) {
    return (
      <div className="bg-[#FAF6E9] p-6 border-[#CED7B0] border-b shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-[#2F4B4E]">Overall Sentiment</h3>
          <div className="flex items-center gap-2">
            {getSentimentIcon(sentiment)}
            <span className="font-medium text-sm">
              {getSentimentLabel(sentiment)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <SentimentBar
            label="Positive"
            count={sentiment.positive}
            percentage={sentiment.positivePercentage}
            color="green"
          />
          <SentimentBar
            label="Neutral"
            count={sentiment.neutral}
            percentage={((sentiment.neutral || 0) / (reviewsCount || 1)) * 100}
            color="yellow"
          />
          <SentimentBar
            label="Negative"
            count={sentiment.negative}
            percentage={sentiment.negativePercentage}
            color="red"
          />
        </div>
      </div>
    );
  }

  // Case 2: Reviews are loaded, but sentiment is not analyzed
  if (hasReviews && !sentiment) {
    return (
      <div className="bg-[#FAF6E9] p-6 border-[#CED7B0] border-b shrink-0">
        <h3 className="mb-3 font-semibold text-[#2F4B4E]">Overall Sentiment</h3>
        <p className="mb-4 text-[#42676B] text-sm text-center">
          {reviewsCount} reviews loaded. Click below to analyze sentiment.
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
    );
  }

  // Case 3: No reviews loaded yet
  return (
    <div className="bg-[#FAF6E9] p-6 border-[#CED7B0] border-b shrink-0">
      <h3 className="mb-2 font-semibold text-[#2F4B4E]">Overall Sentiment</h3>
      <p className="text-[#42676B] text-sm text-center">
        Load reviews to see sentiment analysis.
      </p>
    </div>
  );
};

export default ReviewSidebarSentiment;
