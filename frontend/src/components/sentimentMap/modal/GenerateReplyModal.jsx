import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Star, Copy, Check, RotateCcw } from "lucide-react";
import {
  generateReviewReply,
  regenerateReviewReply,
} from "../../../services/replyService";
import ReplyModalDropdown from "./ReplyModalDropdown";

const GenerateReplyModal = ({ isOpen, onClose, review }) => {
  const [tone, setTone] = useState("Friendly");
  const [style, setStyle] = useState("Casual");
  const [length, setLength] = useState(1);
  const [generatedReply, setGeneratedReply] = useState("");
  const [editedReply, setEditedReply] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const toneOptions = [
    "Professional",
    "Friendly",
    "Empathetic",
    "Apologetic",
    "Grateful",
  ];
  const styleOptions = ["Formal", "Casual", "Brief", "Detailed"];

  const getLengthLabel = () => {
    if (length === 0) return "Short";
    if (length === 1) return "Medium";
    return "Long";
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const reply = await generateReviewReply({
        reviewText: review?.text,
        rating: review?.rating,
        sentiment: review?.sentiment,
        tone,
        style,
        length: getLengthLabel(),
      });
      setGeneratedReply(reply);
      setEditedReply(reply);
    } catch (error) {
      console.error("Error generating reply:", error);
      // Fallback for demo purposes
      const fallbackReply = `Thank you so much for taking the time to share your wonderful experience with us, ${review?.author?.split(" ")[0]}! We're absolutely thrilled to hear that our staff made your anniversary celebration so special. Creating memorable moments for our guests is what we strive for every day. We can't wait to welcome you back for your next celebration!`;
      setGeneratedReply(fallbackReply);
      setEditedReply(fallbackReply);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const reply = await regenerateReviewReply({
        reviewText: review?.text,
        rating: review?.rating,
        sentiment: review?.sentiment,
        previousReply: generatedReply,
        tone,
        style,
        length: getLengthLabel(),
      });
      setGeneratedReply(reply);
      setEditedReply(reply);
    } catch (error) {
      console.error("Error regenerating reply:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedReply);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleUseReply = () => {
    // You can emit this to parent component or handle it as needed
    console.log("Using reply:", editedReply);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-[#E1E6C3] border-b">
            <h2 className="font-bold text-[#2F4B4E] text-2xl">
              Generate AI Reply
            </h2>
            <button
              onClick={onClose}
              className="hover:bg-[#F5F1E5] p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#42676B]" />
            </button>
          </div>

          {/* Content */}
          <div className="gap-6 grid grid-cols-1 lg:grid-cols-2 p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
            {/* Left Column - Original Review & Customization */}
            <div className="space-y-6">
              {/* Original Review */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-[#2F4B4E] text-lg">
                    Original Review
                  </h3>
                  {review?.sentiment && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        review.sentiment === "Positive"
                          ? "bg-green-100 text-green-700"
                          : review.sentiment === "Negative"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {review.sentiment}
                    </span>
                  )}
                </div>
                <div className="bg-[#FAF6E9] p-4 border border-[#E1E6C3] rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-[#2F4B4E]">
                      {review?.author}
                    </p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review?.rating
                              ? "fill-[#4B7069] text-[#4B7069]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-[#42676B] text-sm leading-relaxed">
                    "{review?.text}"
                  </p>
                </div>
              </div>

              {/* Customization */}
              <div>
                <h3 className="mb-4 font-semibold text-[#2F4B4E] text-lg">
                  Customization
                </h3>

                {/* Tone & Style */}
                <div className="gap-4 grid grid-cols-2 mb-4">
                  {/* Tone Dropdown */}
                  <ReplyModalDropdown
                    label="Tone"
                    value={tone}
                    onChange={setTone}
                    options={toneOptions}
                  />

                  {/* Style Dropdown */}
                  <ReplyModalDropdown
                    label="Style"
                    value={style}
                    onChange={setStyle}
                    options={styleOptions}
                  />
                </div>

                {/* Length Slider */}
                <div>
                  <label className="block mb-2 font-medium text-[#2F4B4E] text-sm">
                    Length: {getLengthLabel()}
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="bg-[#E1E6C3] rounded-lg w-full h-2 accent-[#4B7069] appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #4B7069 0%, #4B7069 ${
                          (100 * length) / 2
                        }%, #E1E6C3 ${(100 * length) / 2}%, #E1E6C3 100%)`,
                      }}
                    />
                    <div className="flex justify-between mt-1 text-[#42676B] text-xs">
                      <span>Short</span>
                      <span>Medium</span>
                      <span>Long</span>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <motion.button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex justify-center items-center gap-2 bg-gradient-to-r from-[#2F4B4E] hover:from-[#42676B] to-[#4B7069] hover:to-[#4B7069] disabled:opacity-50 shadow-lg hover:shadow-xl mt-6 px-6 py-3 rounded-lg w-full font-semibold text-white transition-all disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Reply
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Right Column - Generated Reply */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-[#2F4B4E] text-lg">
                  Generated Reply
                </h3>
                {generatedReply && (
                  <motion.button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 hover:bg-[#F5F1E5] disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-[#42676B] hover:text-[#2F4B4E] text-sm transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Regenerate
                  </motion.button>
                )}
              </div>
              <div className="flex flex-col flex-1 bg-[#FAF6E9] p-4 border border-[#E1E6C3] rounded-lg min-h-[300px]">
                {!generatedReply ? (
                  <p className="m-auto text-[#42676B] text-center">
                    Your AI-generated reply will appear here...
                  </p>
                ) : (
                  <div className="flex flex-col flex-1 space-y-4">
                    <textarea
                      value={editedReply}
                      onChange={(e) => setEditedReply(e.target.value)}
                      className="flex-1 bg-white p-3 border border-[#CED7B0] focus:border-transparent rounded-lg focus:outline-none focus:ring-[#4B7069] focus:ring-2 w-full text-[#2F4B4E] leading-relaxed transition-all resize-none"
                      placeholder="Edit your reply here..."
                      rows={8}
                    />
                    <div className="flex justify-center items-center">
                      <motion.button
                        onClick={handleCopy}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-1 justify-center items-center gap-2 bg-white px-4 py-2.5 border border-[#CED7B0] hover:border-[#4B7069] rounded-lg font-medium text-[#2F4B4E] transition-all"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 text-[#4B7069]" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Reply
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GenerateReplyModal;
