import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinned, MapPin, ChevronDown, GripVertical } from "lucide-react";
import { springTransition } from "../../utils/motionConfig";
import { getSentimentBadgeColor } from "../../utils/sentimentUtils";

const LocationsPanel = ({
  locations = [],
  onLocationClick,
  defaultExpanded = false,
  title = "Saved Locations",
  className = "",
  containerRef,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isDragging, setIsDragging] = useState(false);
  const dragEndTimeout = useRef(null);

  // keep dragging true slightly longer after release to block accidental clicks
  const handleDragEnd = () => {
    clearTimeout(dragEndTimeout.current);
    setIsDragging(true);
    dragEndTimeout.current = setTimeout(() => setIsDragging(false), 150);
  };

  if (locations.length === 0) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={containerRef}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileHover={!isDragging ? { scale: 1.01 } : {}}
      transition={springTransition}
      className={`bg-white shadow-xl rounded-xl w-96 overflow-hidden cursor-move ${className}`}
      style={{ touchAction: "none", position: "relative" }}
    >
      {/* Header / Toggle */}
      <div className="flex justify-between items-center gap-2 hover:bg-[#FAF6E9]/50 p-3 border-[#CED7B0] border-b w-full transition-colors">
        <div className="flex items-center gap-2">
          <GripVertical className="opacity-70 -m-1 p-1 text-[#42676B] cursor-grab active:cursor-grabbing" />
          <MapPinned className="w-5 h-5 text-[#2F4B4E]" />
          <span className="font-semibold text-[#2F4B4E] text-sm">
            {title} ({locations.length})
          </span>
        </div>

        {/* Collapse toggle - only chevron toggles */}
        <button
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return; // ignore click right after dragging
            }
            setIsExpanded(!isExpanded);
          }}
          className="flex justify-center items-center hover:bg-[#E1E6C3]/50 p-1 rounded transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 text-[#42676B] transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="max-h-64 overflow-y-auto"
          >
            {locations.map((location) => {
              const sentimentBadge = getSentimentBadgeColor(location.sentiment);
              return (
                <motion.button
                  key={location.id}
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      return; // ignore click right after drag
                    }
                    onLocationClick?.(location);
                  }}
                  whileHover={{ backgroundColor: "#E1E6C3" }}
                  className="flex items-start gap-3 p-3 border-[#E1E6C3] border-b last:border-b-0 w-full text-left"
                >
                  <MapPin className="mt-0.5 w-4 h-4 text-[#2F4B4E] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2F4B4E] text-sm truncate">
                      {location.businessName || location.name}
                    </p>
                    <p className="text-[#42676B] text-xs line-clamp-1">
                      {location.address}
                    </p>
                  </div>
                  <span
                    className={`${sentimentBadge.bgColor} ${sentimentBadge.textColor} px-2 py-1 rounded-full font-medium text-xs shrink-0`}
                  >
                    {sentimentBadge.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LocationsPanel;
