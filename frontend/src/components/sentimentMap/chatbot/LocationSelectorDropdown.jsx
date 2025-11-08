import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, MapPin, CheckCircle2, Circle, AlertCircle } from "lucide-react";

/**
 * LocationSelectorDropdown Component
 * Dropdown with search, checkboxes, and location list
 * Allows selecting up to 10 locations for chatbot analysis
 */
const LocationSelectorDropdown = ({
  locations = [],
  selectedIds = [],
  onSelect,
  maxSelections = 10,
  isOpen,
  loading = false,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Filter locations based on search term
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return locations;
    
    const search = searchTerm.toLowerCase();
    return locations.filter((loc) => 
      loc.name?.toLowerCase().includes(search) || 
      loc.address?.toLowerCase().includes(search)
    );
  }, [locations, searchTerm]);

  // Separate ready and not ready locations
  const { readyLocations, notReadyLocations } = useMemo(() => {
    const ready = filteredLocations.filter((loc) => loc.ready);
    const notReady = filteredLocations.filter((loc) => !loc.ready);
    return { readyLocations: ready, notReadyLocations: notReady };
  }, [filteredLocations]);

  // Handle checkbox click
  const handleToggleLocation = (locationId) => {
    // Prevent changes when disabled (e.g., during message sending)
    if (disabled) return;

    if (selectedIds.includes(locationId)) {
      // Deselect
      onSelect(selectedIds.filter((id) => id !== locationId));
    } else {
      // Select (if under max limit)
      if (selectedIds.length < maxSelections) {
        onSelect([...selectedIds, locationId]);
      }
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Don't close here - let parent component handle this
        // This prevents conflicts with the toggle button
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="bottom-full left-0 absolute bg-white shadow-xl mb-2 border border-gray-200 rounded-lg w-[min(400px,calc(100vw-2rem))] max-h-96 overflow-hidden z-50"
    >
      {/* Search Header */}
      <div className="border-gray-200 p-3 border-b">
        <div className="relative">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-10 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4B7069] focus:outline-none w-full text-sm"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="top-1/2 right-3 absolute text-gray-400 hover:text-gray-600 text-sm transform -translate-y-1/2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Selection Counter */}
      <div className="flex justify-between items-center bg-gray-50 px-3 py-2 border-gray-200 border-b text-xs text-gray-600">
        <span>
          {selectedIds.length === 0
            ? "No locations selected"
            : `${selectedIds.length} of ${maxSelections} selected`
          }
        </span>
        {disabled ? (
          <span className="text-blue-600 font-medium">Sending message...</span>
        ) : selectedIds.length >= maxSelections ? (
          <span className="text-amber-600 font-medium">Maximum reached</span>
        ) : null}
      </div>

      {/* Location List */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="mx-auto mb-2 border-gray-300 border-2 border-t-[#42676B] rounded-full w-8 h-8 animate-spin"></div>
            <p className="text-sm">Loading locations...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MapPin className="mx-auto mb-2 w-12 h-12 text-gray-300" />
            <p className="text-sm">
              {searchTerm 
                ? `No locations found for "${searchTerm}"` 
                : "No locations available"
              }
            </p>
          </div>
        ) : (
          <>
            {/* Ready Locations */}
            {readyLocations.length > 0 && (
              <div className="py-2">
                {readyLocations.map((location) => {
                  const isSelected = selectedIds.includes(location.locationId);
                  const isDisabled = disabled || (!isSelected && selectedIds.length >= maxSelections);

                  return (
                    <button
                      type="button"
                      key={location.locationId}
                      onClick={() => !isDisabled && handleToggleLocation(location.locationId)}
                      disabled={isDisabled}
                      className={`
                        w-full px-3 py-2.5 text-left transition-colors flex items-start gap-3
                        ${isSelected
                          ? "bg-[#E1E6C3]/30 hover:bg-[#E1E6C3]/50"
                          : "hover:bg-gray-50"
                        }
                        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {/* Checkbox Icon */}
                      <div className="pt-0.5 shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-[#42676B]" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Location Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {location.name}
                        </h4>
                        <p className="text-gray-500 text-xs truncate">
                          {location.address}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {location.analyzedReviewCount || 0} analyzed
                          </span>
                          {location.reviewCount > 0 && (
                            <span className="text-gray-400">
                              • {location.reviewCount} total
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Not Ready Locations (if any) */}
            {notReadyLocations.length > 0 && (
              <div className="border-gray-200 border-t">
                <div className="bg-amber-50 px-3 py-2 border-gray-200 border-b">
                  <p className="flex items-center gap-2 font-medium text-amber-700 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Not ready for analysis
                  </p>
                </div>
                {notReadyLocations.map((location) => (
                  <div
                    key={location.locationId}
                    className="opacity-60 px-3 py-2.5 cursor-not-allowed"
                    title={location.message || "Location not ready"}
                  >
                    <div className="flex items-start gap-3">
                      <Circle className="pt-0.5 w-5 h-5 text-gray-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-700 text-sm truncate">
                          {location.name}
                        </h4>
                        <p className="text-gray-500 text-xs truncate">
                          {location.message || "No reviews analyzed yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Help Text */}
      {filteredLocations.length > 0 && (
        <div className="bg-gray-50 px-3 py-2 border-gray-200 border-t text-center text-gray-500 text-xs">
          Select locations to provide context for AI analysis
        </div>
      )}
    </div>
  );
};

export default LocationSelectorDropdown;
