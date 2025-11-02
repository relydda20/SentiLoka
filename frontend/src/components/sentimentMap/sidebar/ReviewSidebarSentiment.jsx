import React from "react";
import SentimentBar from "./SentimentBar";
import { getSentimentLabel } from "../../../utils/sentimentUtils";

const ReviewSidebarSentiment = ({
  sentiment,
  reviewsCount,
  getSentimentIcon,
}) => {
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
          percentage={(sentiment.neutral / reviewsCount) * 100 || 0}
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
};

export default ReviewSidebarSentiment;
