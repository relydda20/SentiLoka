import React from "react";
import { motion } from "framer-motion";
import { X, MapPin, Star, RefreshCw, Loader2 } from "lucide-react";

const ReviewSidebarHeader = ({
  selectedLocation,
  hasReviews,
  loadingReviews,
  onClose,
  onLoadReviews,
}) => {
  // Determine button state and message
  const getLoadingMessage = () => {
    const status = selectedLocation.scrapeStatus;
    
    if (status === 'pending' || status === 'scraping') {
      return 'Scraping Reviews...';
    }
    return 'Loading Reviews...';
  };

  const isScrapingInProgress = selectedLocation.scrapeStatus === 'pending' || 
                                 selectedLocation.scrapeStatus === 'scraping';
  
  const isLoading = loadingReviews || isScrapingInProgress;

  return (
    <div className="bg-gradient-to-r from-[#2F4B4E] to-[#42676B] p-6 text-white shrink-0">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 shrink-0" />
            <h2 className="font-bold text-xl truncate">
              {selectedLocation.businessName}
            </h2>
          </div>
          <p className="text-[#E1E6C3] text-sm line-clamp-2">
            {selectedLocation.address}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-[#E1E6C3] transition-colors shrink-0"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        {selectedLocation.averageRating ? (
          <div className="flex items-center gap-2">
            <Star className="fill-[#CED7B0] w-5 h-5 text-[#CED7B0]" />
            <span className="font-bold text-2xl">
              {selectedLocation.averageRating.toFixed(1)}
            </span>
          </div>
        ) : (
          <p className="text-[#E1E6C3] text-sm">No rating data</p>
        )}
      </div>

      {!hasReviews && (
        <motion.button
          onClick={() => onLoadReviews(selectedLocation.id)}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          className="flex justify-center items-center gap-2 bg-white hover:bg-[#FAF6E9] disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-4 px-4 py-2.5 rounded-lg w-full font-medium text-[#2F4B4E] transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {getLoadingMessage()}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Load Reviews
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default ReviewSidebarHeader;
