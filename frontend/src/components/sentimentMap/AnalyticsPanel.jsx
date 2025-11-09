import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import {
  BarChart3,
  MapPin,
  Star,
  MessageSquare,
  GripVertical,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { littlePieChartConfig } from "../../config/chartConfig";
import { springTransition } from "../../utils/motionConfig";

const AnalyticsPanel = ({
  analytics,
  poiVisible,
  onTogglePOI,
  className = "",
  containerRef,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragEndTimeout = useRef(null);

  // helper function to reset drag safely after a small delay
  const handleDragEnd = () => {
    // keep isDragging true for a short time to suppress clicks
    clearTimeout(dragEndTimeout.current);
    setIsDragging(true);
    dragEndTimeout.current = setTimeout(() => {
      setIsDragging(false);
    }, 150);
  };

  // Prepare chart data
  const pieChartSeries = analytics.sentimentCounts
    ? [
        analytics.sentimentCounts.positive,
        analytics.sentimentCounts.neutral,
        analytics.sentimentCounts.negative,
      ]
    : [0, 0, 0];

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
      className={`bg-white shadow-xl rounded-xl w-80 overflow-hidden cursor-move ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2F4B4E] to-[#42676B] p-4">
        <div className="flex items-center gap-2 mb-3">
          <GripVertical className="opacity-70 w-4 h-4 text-[#FAF6E9] cursor-grab active:cursor-grabbing" />
          <BarChart3 className="w-5 h-5 text-[#FAF6E9]" />
          <h4 className="flex-1 font-semibold text-[#FAF6E9]">
            Overview Analytics
          </h4>
          <button
            onClick={(e) => {
              if (isDragging) {
                e.preventDefault();
                return; // ⛔ ignore click right after drag
              }
              setIsExpanded(!isExpanded);
            }}
            className="hover:bg-white/10 p-1 rounded text-[#FAF6E9] hover:text-[#CED7B0] transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* POI Toggle */}
        <button
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return; // ⛔ ignore click right after drag
            }
            onTogglePOI?.();
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full font-medium transition-all ${
            poiVisible
              ? "bg-[#FAF6E9] text-[#2F4B4E] hover:bg-[#E1E6C3]"
              : "bg-white/20 text-[#FAF6E9] hover:bg-white/30"
          }`}
        >
          {poiVisible ? (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm">Hide POI</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="text-sm">Show POI</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="space-y-4 p-4">
              {/* Stats Grid */}
              <div className="gap-3 grid grid-cols-2">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={springTransition}
                  className="bg-gradient-to-br from-[#CED7B0] to-[#E1E6C3] shadow-sm p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[#2F4B4E]" />
                    <span className="font-medium text-[#2F4B4E] text-xs">
                      Locations
                    </span>
                  </div>
                  <p className="font-bold text-[#2F4B4E] text-2xl">
                    {analytics.totalLocations}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={springTransition}
                  className="bg-gradient-to-br from-[#4B7069] to-[#42676B] shadow-sm p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-[#FAF6E9]" />
                    <span className="font-medium text-[#FAF6E9] text-xs">
                      Avg Rating
                    </span>
                  </div>
                  <p className="font-bold text-[#FAF6E9] text-2xl">
                    {analytics.avgRating}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={springTransition}
                  className="col-span-2 bg-gradient-to-br from-[#E1E6C3] to-[#FAF6E9] shadow-sm p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-[#2F4B4E]" />
                    <span className="font-medium text-[#2F4B4E] text-xs">
                      Analyzed Reviews
                    </span>
                  </div>
                  <p className="font-bold text-[#2F4B4E] text-2xl">
                    {analytics.analyzedReviews}
                  </p>
                </motion.div>
              </div>

              {/* Sentiment Distribution */}
              <div className="pt-3 border-[#CED7B0] border-t">
                <h5 className="mb-2 font-semibold text-[#2F4B4E] text-sm">
                  Sentiment Distribution
                </h5>
                <div className="flex justify-center">
                  <ReactApexChart
                    options={littlePieChartConfig}
                    series={pieChartSeries}
                    type="donut"
                    height={120}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnalyticsPanel;
