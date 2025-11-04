import React, { useRef, useState, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { Search, X } from "lucide-react";
import SelectedLocationPanel from "./SelectedLocationPanel";

const SearchLocation = ({
  onAutocompleteLoad,
  onPlaceChanged,
  selectedPlace,
  onClearSelectedPlace,
  onAddLocation,
  loading,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef(null);

  // Add custom styles for Google Places Autocomplete dropdown
  useEffect(() => {
    const styleId = "pac-container-custom-styles";

    // Check if styles already exist
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .pac-container {
          background-color: #ffffff;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(47, 75, 78, 0.1), 0 4px 6px -2px rgba(47, 75, 78, 0.05);
          border: 1px solid #CED7B0;
          margin-top: 0.5rem;
          font-family: inherit;
          z-index: 100  0;
          max-height: 310px;
          overflow-y: auto;
          
        }
        
        .pac-container:after {
          display: none;
        }
        
        .pac-item {
          padding: 0.75rem 1rem;
          border: none;
          cursor: pointer;
          line-height: 1.5;
          transition: background-color 0.15s ease;
        }
        
        .pac-item:hover {
          background-color: #FAF6E9;
        }
        
        .pac-item-selected,
        .pac-item-selected:hover {
          background-color: #CED7B0;
        }
        
        .pac-icon {
          display: none;
        }
        
        .pac-item-query {
          font-size: 0.875rem;
          font-weight: 500;
          color: #2F4B4E;
          padding-right: 0.25rem;
        }
        
        .pac-matched {
          font-weight: 600;
          color: #42676B;
        }
        
        .pac-logo:after {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Cleanup is optional, you may want to keep styles
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const handleClearSearch = () => {
    setSearchValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className="top-28 left-4 z-10 z-20 absolute w-96">
      <div className="bg-white shadow-xl border border-[#CED7B0] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-3">
          <Search className="w-5 h-5 text-[#42676B] shrink-0" />
          <div className="flex-1 min-w-0">
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ["establishment"],
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for a business location..."
                className="px-2 py-1 border-none outline-none w-full text-[#2F4B4E] placeholder:text-[#42676B]/60 text-sm"
                onChange={handleInputChange}
              />
            </Autocomplete>
          </div>
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="text-[#42676B] hover:text-[#2F4B4E] transition-colors shrink-0"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {selectedPlace && (
          <SelectedLocationPanel
            selectedPlace={selectedPlace}
            onClear={onClearSelectedPlace}
            onAddLocation={onAddLocation}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default SearchLocation;
