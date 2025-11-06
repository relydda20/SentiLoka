import { motion } from "framer-motion";
import { X, MapPin, Star, RefreshCw, Loader2, Clock, RotateCcw, BrainCircuit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ReviewSidebarHeader = ({
  selectedLocation,
  hasReviews,
  loadingReviews,
  onClose,
  onLoadReviews,
  onRescrape,
  onReanalyze,
  isRescraping,
  isReanalyzing,
}) => {
  // Determine button state and message
  const getLoadingMessage = () => {
    const status = selectedLocation.scrapeStatus;
    const progress = selectedLocation.scrapeProgress;

    if (status === 'scraping' && progress) {
      return progress.message || 'Scraping Reviews...';
    }
    if (status === 'pending') {
      return 'Initializing scraper...';
    }
    return 'Loading Reviews...';
  };

  const isScrapingInProgress = selectedLocation.scrapeStatus === 'pending' ||
                                 selectedLocation.scrapeStatus === 'scraping';

  const isLoading = loadingReviews || isScrapingInProgress;

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `~${mins}m ${secs}s remaining`;
    }
    return `~${secs}s remaining`;
  };

  return (
    <div className="bg-gradient-to-r from-[#2F4B4E] to-[#42676B] p-6 text-white shrink-0">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Star Rating */}
            {selectedLocation.averageRating ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <Star className="fill-[#CED7B0] w-5 h-5 text-[#CED7B0]" />
                <span className="font-bold text-lg">
                  {selectedLocation.averageRating.toFixed(1)}
                </span>
              </div>
            ) : null}

            {/* Location Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="w-5 h-5 shrink-0" />
              <h2 className="font-bold text-xl truncate">
                {selectedLocation.businessName}
              </h2>
            </div>
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

      {/* Timestamps - Show if reviews exist or have been analyzed */}
      {(hasReviews || selectedLocation.lastScraped || selectedLocation.lastAnalyzedAt) && (
        <div className="mt-3 space-y-1 text-xs text-white/80">
          {selectedLocation.lastScraped && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Last scraped: {formatDistanceToNow(new Date(selectedLocation.lastScraped), { addSuffix: true })}
              </span>
            </div>
          )}
          {selectedLocation.lastAnalyzedAt && (
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>
                Last analyzed: {formatDistanceToNow(new Date(selectedLocation.lastAnalyzedAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons for locations with reviews */}
      {hasReviews && !isScrapingInProgress && (
        <div className="mt-4 flex gap-2">
          {/* Rescrape button - always show when reviews exist */}
          <motion.button
            onClick={onRescrape}
            disabled={isRescraping}
            whileHover={!isRescraping ? { scale: 1.02 } : {}}
            whileTap={!isRescraping ? { scale: 0.98 } : {}}
            className="flex-1 flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {isRescraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rescraping...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Rescrape
              </>
            )}
          </motion.button>

          {/* Reanalyze button - only show if location has been analyzed before */}
          {selectedLocation.lastAnalyzedAt && (
            <motion.button
              onClick={onReanalyze}
              disabled={isReanalyzing}
              whileHover={!isReanalyzing ? { scale: 1.02 } : {}}
              whileTap={!isReanalyzing ? { scale: 0.98 } : {}}
              className="flex-1 flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            >
              {isReanalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reanalyzing...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  Reanalyze
                </>
              )}
            </motion.button>
          )}
        </div>
      )}

      {!hasReviews && (
        <div className="mt-4 space-y-2">
          <motion.button
            onClick={() => onLoadReviews(selectedLocation.id)}
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            className="flex justify-center items-center gap-2 bg-white hover:bg-[#FAF6E9] disabled:opacity-50 disabled:cursor-not-allowed shadow-md px-4 py-2.5 rounded-lg w-full font-medium text-[#2F4B4E] transition-colors"
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

          {/* Progress Bar and Details */}
          {isScrapingInProgress && selectedLocation.scrapeProgress && (
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg space-y-2">
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-[#CED7B0] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedLocation.scrapeProgress.percentage || 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Progress Info */}
              <div className="flex justify-between items-center text-xs text-white/90">
                <span>
                  {selectedLocation.scrapeProgress.current || 0} reviews scraped
                </span>
                <span className="font-semibold">
                  {selectedLocation.scrapeProgress.percentage || 0}%
                </span>
              </div>

              {/* Time Estimation */}
              {selectedLocation.scrapeProgress.estimatedTimeRemaining > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-white/80">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {formatTimeRemaining(selectedLocation.scrapeProgress.estimatedTimeRemaining)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSidebarHeader;
