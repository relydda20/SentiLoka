import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Panel Components
import LocationsPanel from "../../components/sentimentMap/LocationsPanel";
import SearchLocation from "../../components/sentimentMap/SearchLocation";
import MapLegend from "../../components/sentimentMap/MapLegend";
import AnalyticsPanel from "../../components/sentimentMap/AnalyticsPanel";
import ChatbotFab from "../../components/sentimentMap/chatbot/ChatbotFab";

// Sidebar Components
import ReviewSidebar from "../../components/sentimentMap/sidebar/ReviewSidebar.jsx";
import ChatbotSidebar from "../../components/sentimentMap/chatbot/ChatbotSidebar";

// Modal Components
import GenerateReplyModal from "../../components/sentimentMap/modal/GenerateReplyModal.jsx";

// Marker Components
import LocationMarker from "../../components/sentimentMap/marker/LocationMarker";
import SelectedMarker from "../../components/sentimentMap/marker/SelectedMarker";

// Utils
import { getMarkerColor } from "../../utils/sentimentUtils";

// Custom Hooks
import { useLocationData } from "../../hooks/useLocationData";
import { useMapControls } from "../../hooks/useMapControls";
import { useReviewManagement } from "../../hooks/useReviewManagement";
import { useSentimentMap } from "../../hooks/useSentimentMap";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: -6.2088,
  lng: 106.8456,
};

const SentimentMap = () => {
  // Location data hook
  const { locations, setLocations, loading, setLoading, error, setError, refetchLocations } =
    useLocationData();

  // Main state management hook
  const {
    selectedLocation,
    setSelectedLocation,
    sidebarOpen,
    setSidebarOpen,
    isReplyModalOpen,
    selectedReview,
    isChatbotOpen,
    setIsChatbotOpen,
    handleGenerateReply,
    handleCloseReplyModal,
    createMarkerClickHandler,
    createAddLocationHandler,
  } = useSentimentMap();

  // Review management hook (now powered by React Query)
  const {
    reviewPage,
    reviewFilters,
    reviewData,
    isFetchingReviews,
    loadingReviews,
    loadingSentiment,
    isRescraping,
    rescrapeMutation,
    handleInitialLoadReviews,
    handleInitialAnalyzeSentiment,
    handleFilterOrPageChange,
  } = useReviewManagement(selectedLocation?.id);

  // Spiderfied marker click handler
  const handleSpiderfiedMarkerClick = async (location) => {
    const latestLocation =
      locations.find((loc) => loc.id === location.id) || location;
    setSelectedLocation(latestLocation);
    setSidebarOpen(true);

    // React Query will automatically fetch reviews when selectedLocation changes
    // The useReviewManagement hook listens to selectedLocation?.id
  };

  // Map controls hook - MUST be called before using map in useEffect
  const {
    map,
    onMapLoad,
    selectedPlace,
    setSelectedPlace,
    poiVisible,
    togglePOI,
    hoveredMarker,
    setHoveredMarker,
    handleMarkerLoad,
    onAutocompleteLoad,
    onPlaceChanged,
    omsRef,
  } = useMapControls(locations, handleSpiderfiedMarkerClick);

  // Auto-open location from Profile page navigation
  // IMPORTANT: This must come AFTER useMapControls so 'map' is defined
  useEffect(() => {
    const selectedLocationId = sessionStorage.getItem('selectedLocationId');

    // Make sure map is loaded and initialized before trying to access it
    if (selectedLocationId && locations.length > 0 && map && typeof map.panTo === 'function') {
      // Find the location in the loaded locations
      const location = locations.find(loc => loc.id === selectedLocationId);

      if (location && location.coordinates) {
        // Set the selected location and open sidebar
        setSelectedLocation(location);
        setSidebarOpen(true);

        // Use a small delay to ensure map is fully ready
        setTimeout(() => {
          try {
            // Pan and zoom to the location
            if (map && typeof map.panTo === 'function') {
              map.panTo(location.coordinates);
              map.setZoom(16);
            }
          } catch (error) {
            console.error('Error panning to location:', error);
          }
        }, 100);

        // Clear the session storage
        sessionStorage.removeItem('selectedLocationId');
      }
    }
  }, [locations, map, setSelectedLocation, setSidebarOpen]);

  // Create handlers with dependencies
  const handleMarkerClick = createMarkerClickHandler(
    locations,
    map,
    setSelectedLocation,
    setSidebarOpen,
  );

  const handleAddLocationToAnalysis = createAddLocationHandler(
    selectedPlace,
    setSelectedPlace,
    setLocations,
    setLoading,
    setError,
    refetchLocations, // Pass refetch function to reload all locations after adding
  );

  const handleLoadReviews = async (locationId) => {
    try {
      const onScrapeProgress = (status) => {
        console.log("📊 Scrape progress:", status.state, status.progress);

        // Update both locations array and selectedLocation
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationId
              ? {
                  ...loc,
                  scrapeStatus: status.state,
                  scrapeProgress: status.progress || {
                    percentage: 0,
                    current: 0,
                    total: 0,
                    estimatedTimeRemaining: null,
                    message: null,
                  },
                }
              : loc,
          ),
        );

        // Also update selectedLocation if it's the one being scraped
        setSelectedLocation((prev) => {
          if (prev && prev.id === locationId) {
            return {
              ...prev,
              scrapeStatus: status.state,
              scrapeProgress: status.progress || {
                percentage: 0,
                current: 0,
                total: 0,
                estimatedTimeRemaining: null,
                message: null,
              },
            };
          }
          return prev;
        });
      };

      const updatedBusiness = await handleInitialLoadReviews(locationId, onScrapeProgress);

      // Update locations cache
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId ? { ...loc, ...updatedBusiness } : loc,
        ),
      );
    } catch (error) {
      setError(error.message || "Failed to load reviews");
    }
  };

  const handleAnalyzeSentiment = async (locationId) => {
    try {
      const { updatedBusiness, message } = await handleInitialAnalyzeSentiment(locationId);

      // Update locations cache
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId ? { ...loc, ...updatedBusiness } : loc,
        ),
      );

      alert(message);
    } catch (error) {
      setError(error.message || "Failed to analyze sentiment");
      alert(`❌ Failed to analyze sentiment: ${error.message}`);
    }
  };

  // State for reanalyze operation
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const handleRescrape = async () => {
    if (!selectedLocation?.id) return;

    const locationId = selectedLocation.id;

    try {
      // Progress callback to update UI while scraping
      const onScrapeProgress = (status) => {
        console.log("📊 Rescrape progress:", status.state, status.progress);

        // Update both locations array and selectedLocation with progress
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationId
              ? {
                  ...loc,
                  scrapeStatus: status.state,
                  scrapeProgress: status.progress || {
                    percentage: 0,
                    current: 0,
                    total: 0,
                    estimatedTimeRemaining: null,
                    message: null,
                  },
                }
              : loc,
          ),
        );

        setSelectedLocation((prev) => {
          if (prev && prev.id === locationId) {
            return {
              ...prev,
              scrapeStatus: status.state,
              scrapeProgress: status.progress || {
                percentage: 0,
                current: 0,
                total: 0,
                estimatedTimeRemaining: null,
                message: null,
              },
            };
          }
          return prev;
        });
      };

      // Use the rescrape mutation from React Query
      // This will keep old reviews visible during scraping
      // and automatically refetch new data when complete
      await rescrapeMutation.mutateAsync({
        locationId,
        onProgress: onScrapeProgress,
      });

      console.log("✅ Rescraping completed!");
      alert("✅ Rescraping completed! New data is now available.");
    } catch (error) {
      console.error("❌ Error during rescrape:", error);
      alert(`❌ Failed to rescrape: ${error.message}`);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedLocation?.id) return;

    const locationId = selectedLocation.id;
    setIsReanalyzing(true);

    try {
      // Import service
      const { reanalyzeSentiment } = await import("../../services/reviewService");

      const result = await reanalyzeSentiment(locationId);
      console.log("✅ Sentiment reanalysis completed:", result);

      // Refresh the location data
      const { getLocationScrapeStatus } = await import("../../services/locationService");
      const updatedLocation = await getLocationScrapeStatus(locationId);

      // Update locations cache
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId ? { ...loc, ...updatedLocation } : loc,
        ),
      );

      // Update selected location
      setSelectedLocation((prev) =>
        prev?.id === locationId ? { ...prev, ...updatedLocation } : prev
      );

      setIsReanalyzing(false);
      alert("✅ Sentiment reanalysis completed!");
    } catch (error) {
      console.error("❌ Error reanalyzing sentiment:", error);
      setIsReanalyzing(false);
      alert(`❌ Failed to reanalyze sentiment: ${error.message}`);
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return <Minus className="w-4 h-4" />;
    const positivePercentage = sentiment.positivePercentage || 0;
    const negativePercentage = sentiment.negativePercentage || 0;
    if (positivePercentage > 60)
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (negativePercentage > 40)
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const calculateAnalytics = () => {
    const totalLocations = locations.length;
    const totalReviews = locations.reduce(
      (sum, loc) => sum + (loc.reviewsCount || 0),
      0,
    );
    // This now reflects the *total* count from the objects, not just paginated length
    const analyzedReviews = locations.reduce(
      (sum, loc) => sum + (loc.sentiment?.totalReviews || 0),
      0,
    );
    const avgRating =
      locations.length > 0
        ? (
            locations.reduce((sum, loc) => sum + (loc.averageRating || 0), 0) /
            locations.length
          ).toFixed(1)
        : "0.0";
    const sentimentCounts = locations.reduce(
      (acc, loc) => {
        if (loc.sentiment) {
          acc.positive += loc.sentiment.positive || 0;
          acc.neutral += loc.sentiment.neutral || 0;
          acc.negative += loc.sentiment.negative || 0;
        }
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 },
    );
    return {
      totalLocations,
      totalReviews,
      analyzedReviews,
      avgRating,
      sentimentCounts,
    };
  };

  const analytics = calculateAnalytics();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) {
    return (
      <div className="flex justify-center items-center bg-[#FAF6E9] h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white shadow-xl p-8 rounded-xl max-w-md text-center"
        >
          <AlertCircle className="mx-auto mb-4 w-16 h-16 text-red-500" />
          <h2 className="mb-2 font-bold text-[#2F4B4E] text-xl">
            Error Loading Google Maps
          </h2>
          <p className="text-[#42676B]">
            Please check your API key configuration.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center bg-[#FAF6E9] h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 w-12 h-12 text-[#2F4B4E] animate-spin" />
          <p className="text-[#42676B]">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  // Rendered component
  return (
    <div className="relative w-full h-screen">
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="top-28 left-4 z-50 absolute max-w-md"
          >
            <div className="flex items-start gap-3 bg-red-50 shadow-lg p-4 border border-red-200 rounded-xl">
              <AlertCircle className="mt-0.5 w-5 h-5 text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Search Bar - Top Left */}
      <SearchLocation
        onAutocompleteLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
        selectedPlace={selectedPlace}
        onClearSelectedPlace={() => setSelectedPlace(null)}
        onAddLocation={handleAddLocationToAnalysis}
        loading={loading}
      />
      {/* Connected Locations Panel */}
      <div className="top-56 left-4 z-10 absolute">
        <LocationsPanel
          locations={locations}
          onLocationClick={handleMarkerClick}
          title="Analysis Locations"
        />
      </div>
      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={11}
        onLoad={onMapLoad}
        options={{
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          disableDefaultUI: true,
          panControl: false,
          gestureHandling: "greedy",
        }}
      >
        {/* Location Markers */}
        {locations.map((location) => (
          <LocationMarker
            key={location.id}
            location={location}
            isHovered={hoveredMarker === location.id}
            onMouseOver={() => setHoveredMarker(location.id)}
            onMouseOut={() => setHoveredMarker(null)}
            onLoad={handleMarkerLoad}
            getMarkerColor={getMarkerColor} // *** THIS IS THE FIX ***
          />
        ))}

        {/* Selected Place Marker */}
        {selectedPlace &&
          !locations.find((loc) => loc.placeId === selectedPlace.placeId) && (
            <SelectedMarker position={selectedPlace.coordinates} />
          )}
      </GoogleMap>
      {/* Sidebar */}
      <ReviewSidebar
        isOpen={sidebarOpen}
        selectedLocation={selectedLocation}
        reviewData={reviewData}
        loadingReviews={loadingReviews}
        onClose={() => {
          setSidebarOpen(false);
        }}
        onLoadReviews={handleLoadReviews}
        onGenerateReply={handleGenerateReply}
        getSentimentIcon={getSentimentIcon}
        loadingSentiment={loadingSentiment}
        onAnalyzeSentiment={handleAnalyzeSentiment}
        reviewFilters={reviewFilters}
        reviewPage={reviewPage}
        onFilterOrPageChange={handleFilterOrPageChange}
        onRescrape={handleRescrape}
        onReanalyze={handleReanalyze}
        isRescraping={isRescraping}
        isReanalyzing={isReanalyzing}
        isFetchingReviews={isFetchingReviews}
      />
      {/* Chatbot Sidebar */}
      <ChatbotSidebar
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
      {/* Reply Generator Modal */}
      <GenerateReplyModal
        isOpen={isReplyModalOpen}
        onClose={handleCloseReplyModal}
        review={selectedReview}
      />
      {/* Overlay when sidebar is open */}
      <AnimatePresence>
        {(sidebarOpen || isChatbotOpen) && ( // <-- Check for either state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-40 fixed inset-0 bg-[#2F4B4E]/20 backdrop-blur-sm"
            onClick={() => {
              setSidebarOpen(false);
              setIsChatbotOpen(false); // <-- Add this to close the chatbot
              if (omsRef.current) {
                omsRef.current.unspiderfy();
              }
            }}
          />
        )}
      </AnimatePresence>
      {/* Analytics Panel - Bottom Left */}
      <div className="bottom-6 left-6 z-10 absolute">
        <AnalyticsPanel
          analytics={analytics}
          poiVisible={poiVisible}
          onTogglePOI={togglePOI}
        />
      </div>
      {/* Senti AI Chatbot - Bottom Right Above legend */}
      <ChatbotFab onClick={() => setIsChatbotOpen(true)} />{" "}
      {/* Legend - Bottom Right */}
      <MapLegend className="right-6 bottom-6 z-9 absolute bg-white/10 backdrop-blur-xs p-4 rounded-lg" />
    </div>
  );
};

export default SentimentMap;
