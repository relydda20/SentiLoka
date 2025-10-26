import { useState } from "react";

const SentimentMap = () => {
  const [text, setText] = useState("");
  const [sentiment, setSentiment] = useState(null);

  const analyzeSentiment = () => {
    // Replace with your actual sentiment analysis API call
    const mockSentiment = {
      score: Math.random() * 2 - 1, // -1 to 1
      label: "",
      confidence: Math.random(),
    };

    if (mockSentiment.score > 0.3) {
      mockSentiment.label = "Positive";
    } else if (mockSentiment.score < -0.3) {
      mockSentiment.label = "Negative";
    } else {
      mockSentiment.label = "Neutral";
    }

    setSentiment(mockSentiment);
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return "text-green-600 bg-green-50";
    if (score < -0.3) return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
  };

  return (
    <div>
      <h1 className="mb-2 font-bold text-gray-900 text-3xl">Sentiment Map</h1>
      <p className="mb-8 text-gray-600">
        Analyze the sentiment of your text content
      </p>

      <div className="bg-white shadow-md p-6 rounded-lg">
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700 text-sm">
            Enter text to analyze
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="px-4 py-3 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 w-full resize-none"
            rows="6"
            placeholder="Type or paste your text here..."
          />
        </div>

        <button
          onClick={analyzeSentiment}
          disabled={!text.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 px-6 py-2 rounded-lg text-white transition disabled:cursor-not-allowed"
        >
          Analyze Sentiment
        </button>

        {sentiment && (
          <div className="mt-6 p-6 border border-gray-200 rounded-lg">
            <h3 className="mb-4 font-semibold text-lg">Analysis Results</h3>

            <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
              <div
                className={`p-4 rounded-lg ${getSentimentColor(sentiment.score)}`}
              >
                <p className="mb-1 font-medium text-sm">Sentiment</p>
                <p className="font-bold text-2xl">{sentiment.label}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-1 font-medium text-gray-600 text-sm">Score</p>
                <p className="font-bold text-gray-900 text-2xl">
                  {sentiment.score.toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-1 font-medium text-gray-600 text-sm">
                  Confidence
                </p>
                <p className="font-bold text-gray-900 text-2xl">
                  {(sentiment.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Sentiment Scale */}
            <div className="mt-6">
              <p className="mb-2 font-medium text-gray-700 text-sm">
                Sentiment Scale
              </p>
              <div className="relative bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full h-4">
                <div
                  className="top-0 absolute bg-white border-2 border-gray-800 rounded-full w-4 h-4 -translate-x-1/2 transform"
                  style={{ left: `${((sentiment.score + 1) / 2) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-gray-500 text-xs">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentimentMap;
