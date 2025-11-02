import { motion } from "framer-motion";
import { X, Star, ExternalLink, Plus, Loader2 } from "lucide-react";
import { springTransition } from "../../utils/motionConfig";

const SelectedLocationPanel = ({
  selectedPlace,
  onClear,
  onAddLocation,
  loading,
}) => {
  return (
    <div className="space-y-3 bg-[#FAF6E9] p-4 border-[#CED7B0] border-t">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#2F4B4E] truncate">
            {selectedPlace.name}
          </h3>
          <p className="mt-1 text-[#42676B] text-sm line-clamp-2">
            {selectedPlace.address}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {selectedPlace.rating && (
              <div className="flex items-center gap-1">
                <Star className="fill-[#4B7069] w-4 h-4 text-[#4B7069]" />
                <span className="font-medium text-[#2F4B4E] text-sm">
                  {selectedPlace.rating}
                </span>
                <span className="text-[#42676B] text-sm">
                  ({selectedPlace.userRatingsTotal})
                </span>
              </div>
            )}

            {selectedPlace.url && (
              <a
                href={selectedPlace.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#2F4B4E] hover:text-[#42676B] text-sm transition-colors"
              >
                View on Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <button
          onClick={onClear}
          className="text-[#42676B] hover:text-[#2F4B4E] transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <motion.button
        onClick={onAddLocation}
        disabled={loading}
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
        transition={springTransition}
        className="flex justify-center items-center gap-2 bg-gradient-to-r from-[#2F4B4E] hover:from-[#42676B] disabled:from-gray-400 to-[#42676B] hover:to-[#4B7069] disabled:to-gray-400 shadow-md hover:shadow-lg px-4 py-2.5 rounded-lg w-full font-medium text-white transition-all disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add to Sentiment Analysis
          </>
        )}
      </motion.button>
    </div>
  );
};

export default SelectedLocationPanel;
