import React from "react";
import { X, MapPin } from "lucide-react";

/**
 * SelectedLocationChips Component
 * Displays selected locations as removable chips
 */
const SelectedLocationChips = ({ selectedLocations = [], onRemove }) => {
  if (selectedLocations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {selectedLocations.map((location) => (
        <div
          key={location.locationId}
          className="flex items-center gap-1.5 bg-[#E1E6C3] hover:bg-[#d5dab5] px-2.5 py-1.5 rounded-full transition-colors group"
        >
          {/* Location Icon */}
          <MapPin className="w-3.5 h-3.5 text-[#42676B] shrink-0" />
          
          {/* Location Name */}
          <span className="font-medium text-[#2F4B4E] text-xs max-w-[180px] truncate">
            {location.name}
          </span>
          
          {/* Remove Button */}
          <button
            onClick={() => onRemove(location.locationId)}
            className="flex justify-center items-center bg-[#2F4B4E]/10 hover:bg-[#2F4B4E]/20 ml-1 rounded-full w-4 h-4 transition-colors"
            title={`Remove ${location.name}`}
          >
            <X className="w-3 h-3 text-[#2F4B4E]" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default SelectedLocationChips;
