import React from "react";
import { Paperclip } from "lucide-react";

/**
 * LocationSelectorButton Component
 * Paperclip button that opens location selector dropdown
 * Shows badge with count when locations are selected
 */
const LocationSelectorButton = ({ selectedCount, onToggle, isOpen, disabled }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative p-2 rounded-lg transition-colors shrink-0
        ${isOpen 
          ? "bg-[#42676B] text-white" 
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      title="Attach locations to analyze"
    >
      <Paperclip className="w-5 h-5" />
      
      {/* Badge showing selected count */}
      {selectedCount > 0 && (
        <span className="top-0 right-0 absolute flex justify-center items-center bg-[#E1E6C3] shadow-md rounded-full w-5 h-5 font-semibold text-[#2F4B4E] text-xs transform translate-x-1 -translate-y-1">
          {selectedCount}
        </span>
      )}
    </button>
  );
};

export default LocationSelectorButton;
