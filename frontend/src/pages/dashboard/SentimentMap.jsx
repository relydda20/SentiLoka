import React, { useState, useCallback, useRef, useEffect } from "react";
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
import OverlappingMarkerSpiderfier from "../../utils/OverlappingMarkerSpiderfier";

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

// Services
import {
  fetchBusinessLocations,
  registerBusinessLocation,
  loadBusinessReviews,
  analyzeLocationSentiment,
} from "../../services/locationReviewService";

// Utils
import { getMarkerColor } from "../../utils/sentimentUtils";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: -6.2088,
  lng: 106.8456,
};

const defaultFilters = {
  searchTerm: "",
  sentiment: "all",
  rating: 0,
};

const SentimentMap = () => {
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchBox, setSearchBox] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // *** STATE for filters and pagination ***
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewFilters, setReviewFilters] = useState(defaultFilters);
  const [isFetchingReviews, setIsFetchingReviews] = useState(false); // Combined loading state

  const [loadingReviews, setLoadingReviews] = useState(false); // For initial load
  const [loadingSentiment, setLoadingSentiment] = useState(false); // For initial analysis

  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [markerRefs, setMarkerRefs] = useState({});
  const [poiVisible, setPoiVisible] = useState(false);

  // Modal states
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const omsRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Load mock data on mount
  useEffect(() => {
    fetchBusinessLocationsData();
  }, []);

  // Register markers with Spiderfy when locations or marker refs change
  useEffect(() => {
    if (omsRef.current && Object.keys(markerRefs).length > 0) {
      omsRef.current.clearMarkers();
      Object.values(markerRefs).forEach((marker) => {
        if (marker) {
          omsRef.current.addMarker(marker);
        }
      });
    }
  }, [locations, markerRefs]);

  // Set up OMS event listeners
  useEffect(() => {
    if (omsRef.current && locations.length > 0) {
      omsRef.current.listeners = {
        click: [],
        spiderfy: [],
        unspiderfy: [],
      };

      omsRef.current.addListener("click", (marker) => {
        const locationId = marker._locationId;
        const location = locations.find((loc) => loc.id === locationId);
        if (location) {
          handleSpiderfiedMarkerClick(location);
        }
      });

      omsRef.current.addListener("spiderfy", (markers) => {
        console.log("Spiderfied", markers.length, "markers");
        setSidebarOpen(false);
      });

      omsRef.current.addListener("unspiderfy", () => {
        console.log("Unspiderfied");
      });
    }
  }, [locations]);

  // Toggle POI visibility
  const togglePOI = () => {
    const newPoiVisible = !poiVisible;
    setPoiVisible(newPoiVisible);
    if (map) {
      map.setOptions({
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: newPoiVisible ? "on" : "off" }],
          },
        ],
      });
    }
  };

  const fetchBusinessLocationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessLocations();
      setLocations(data.businesses);
    } catch (error) {
      setError("Failed to load business locations");
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const onMapLoad = useCallback((map) => {
    setMap(map);
    map.setOptions({
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
    const oms = new OverlappingMarkerSpiderfier(map, {
      markersWontMove: true,
      markersWontHide: true,
      keepSpiderfied: false,
      nearbyDistance: 40,
      circleFootSeparation: 35,
    });
    map.addListener("click", () => oms.unspiderfy());
    omsRef.current = oms;
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete) => {
    setSearchBox(autocomplete);
  }, []);

  const onPlaceChanged = () => {
    if (searchBox !== null) {
      const place = searchBox.getPlace();
      if (place.geometry && place.geometry.location) {
        const placeData = {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          url: place.url,
          types: place.types,
          phoneNumber: place.formatted_phone_number,
        };
        setSelectedPlace(placeData);
        if (map) {
          map.panTo(placeData.coordinates);
          map.setZoom(16);
        }
      }
    }
  };

  // *** HELPER to fetch reviews based on current state ***
  const fetchReviewData = async (locationId, options) => {
    setIsFetchingReviews(true);
    setError(null);

    console.log("🔍 fetchReviewData called with options:", options);

    try {
      // Always use loadBusinessReviews to fetch reviews (handles both raw and analyzed)
      const data = await loadBusinessReviews(locationId, options);

      // IMPORTANT: Only update locations array if this is an INITIAL load (no filters/pagination)
      // Filtered/paginated results should ONLY update selectedLocation, not the locations array
      const isInitialLoad = !options.rating && !options.searchTerm && 
                           (!options.sentiment || options.sentiment === 'all') && 
                           (!options.page || options.page === 1);
      
      if (isInitialLoad) {
        // Update the main locations list only for initial unfiltered load
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationId ? { ...loc, ...data.business } : loc,
          ),
        );
      }
      
      // Always update the selectedLocation state with current results (filtered or not)
      // Use callback form to get the latest state value
      setSelectedLocation((prev) => {
        // Only update if this is the currently selected location
        if (prev?.id === locationId) {
          console.log("📝 Updating selectedLocation with reviews:", {
            isFiltered: !isInitialLoad,
            reviewsLength: data.business.reviews?.length,
            pagination: data.business.pagination,
          });
          const updated = { ...prev, ...data.business };
          console.log("📝 Updated selectedLocation reviews count:", updated.reviews?.length);
          return updated;
        }
        return prev; // Return unchanged if different location
      });
    } catch (error) {
      console.error("Error fetching review data:", error);
      setError("Failed to fetch reviews. Please try again.");
    } finally {
      setIsFetchingReviews(false);
    }
  };

  const handleMarkerClick = async (location) => {
    // *** Reset filters on new location click ***
    setReviewFilters(defaultFilters);
    setReviewPage(1);

    // Find the latest location data from locations array (includes previously loaded reviews)
    const latestLocation = locations.find(loc => loc.id === location.id) || location;
    
    console.log(`📍 Opening location: ${latestLocation.businessName}`);
    console.log(`   Reviews in memory:`, latestLocation.reviews?.length || 0);
    console.log(`   Reviews count in DB:`, latestLocation.reviewsCount || 0);
    console.log(`   Scrape status:`, latestLocation.scrapeStatus);
    
    setSelectedLocation(latestLocation);
    setSidebarOpen(true);

    // Pan to the marker when clicked
    if (map) {
      map.panTo(location.coordinates);
      map.setZoom(16);
    }

    // Auto-fetch reviews if location has scraped reviews in DB but they're not loaded in memory
    // This handles page refreshes and ensures reviews are always available
    const hasScrapedReviews = latestLocation.reviewsCount > 0;
    const reviewsNotLoaded = !latestLocation.reviews || latestLocation.reviews.length === 0;
    
    if (hasScrapedReviews && reviewsNotLoaded) {
      console.log('📥 Auto-fetching reviews for location (has', latestLocation.reviewsCount, 'reviews in DB)...');
      await fetchReviewData(latestLocation.id, { page: 1, ...defaultFilters });
    }
  };

  const handleSpiderfiedMarkerClick = async (location) => {
    setReviewFilters(defaultFilters);
    setReviewPage(1);
    
    // Find the latest location data from locations array (includes previously loaded reviews)
    const latestLocation = locations.find(loc => loc.id === location.id) || location;
    setSelectedLocation(latestLocation);
    setSidebarOpen(true);
    
    // Auto-fetch reviews if location has scraped reviews in DB but they're not loaded
    const hasScrapedReviews = latestLocation.reviewsCount > 0;
    const reviewsNotLoaded = !latestLocation.reviews || latestLocation.reviews.length === 0;
    
    if (hasScrapedReviews && reviewsNotLoaded) {
      console.log('📥 Auto-fetching reviews for spiderfied marker...');
      await fetchReviewData(latestLocation.id, { page: 1, ...defaultFilters });
    }
  };

  // *** RENAMED & MODIFIED ***
  const handleInitialLoadReviews = async (locationId) => {
    setLoadingReviews(true); // Specific loader for *initial* load
    setError(null);
    console.log("=== Load Reviews Request ===");
    try {
      const options = { 
        page: 1, 
        ...defaultFilters,
        // Progress callback for scraping updates
        onScrapeProgress: (status) => {
          console.log("📊 Scrape progress:", status.state, status.progress);
          // Update location with scraping status
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === locationId 
                ? { ...loc, scrapeStatus: status.state, scrapeProgress: status.progress }
                : loc
            )
          );
        }
      };
      const data = await loadBusinessReviews(locationId, options);

      console.log("✅ Reviews loaded successfully:", data);

      // Update locations with the full business data including reviews
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId ? { ...loc, ...data.business } : loc,
        ),
      );
      
      // Update selected location with reviews
      if (selectedLocation?.id === locationId) {
        setSelectedLocation((prev) => ({ 
          ...prev, 
          ...data.business,
          reviews: data.business.reviews || [],
          pagination: data.business.pagination,
        }));
      }

      // Show success message if reviews were scraped
      if (data.business.reviews && data.business.reviews.length > 0) {
        console.log(`✅ Successfully loaded ${data.business.reviews.length} reviews`);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
      setError(error.message || "Failed to load reviews");
    } finally {
      setLoadingReviews(false);
    }
  };

  // *** RENAMED & MODIFIED ***
  const handleInitialAnalyzeSentiment = async (locationId) => {
    setLoadingSentiment(true); // Specific loader for *initial* analysis
    setError(null);
    console.log("=== Analyze Sentiment Request ===");
    try {
      // Step 1: Trigger sentiment analysis
      const analysisData = await analyzeLocationSentiment(locationId);
      
      console.log(`✅ Analysis complete: ${analysisData.business.analysis.newlyAnalyzed} new, ${analysisData.business.analysis.alreadyAnalyzed} existing`);
      
      // Step 2: Reload reviews to get the analyzed versions with sentiment data
      const options = { page: 1, ...defaultFilters };
      const reviewData = await loadBusinessReviews(locationId, options);

      // Step 3: Update state with both analysis results and reloaded reviews
      const updatedBusiness = {
        ...analysisData.business,
        ...reviewData.business,
      };

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId ? { ...loc, ...updatedBusiness } : loc,
        ),
      );
      
      if (selectedLocation?.id === locationId) {
        setSelectedLocation((prev) => ({ ...prev, ...updatedBusiness }));
      }
      
      alert(`✅ Sentiment analyzed successfully!\n${analysisData.business.analysis.newlyAnalyzed} reviews newly analyzed.`);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      setError(error.message || "Failed to analyze sentiment");
      alert(`❌ Failed to analyze sentiment: ${error.message}`);
    } finally {
      setLoadingSentiment(false);
    }
  };

  // *** NEW HANDLER for pagination & filtering ***
  const handleFilterOrPageChange = (newOptions) => {
    if (!selectedLocation) return;

    const newPage = newOptions.page !== undefined ? newOptions.page : 1;
    const newFilters = {
      searchTerm:
        newOptions.searchTerm !== undefined
          ? newOptions.searchTerm
          : reviewFilters.searchTerm,
      sentiment:
        newOptions.sentiment !== undefined
          ? newOptions.sentiment
          : reviewFilters.sentiment,
      rating:
        newOptions.rating !== undefined
          ? newOptions.rating
          : reviewFilters.rating,
    };

    setReviewPage(newPage);
    setReviewFilters(newFilters);

    fetchReviewData(selectedLocation.id, { ...newFilters, page: newPage });
  };

  const handleMarkerLoad = (marker, locationId) => {
    setMarkerRefs((prev) => ({ ...prev, [locationId]: marker }));
  };

  const handleAddLocationToAnalysis = async () => {
    if (!selectedPlace) return;
    setLoading(true);
    setError(null);
    const businessData = {
      businessName: selectedPlace.name,
      placeId: selectedPlace.placeId,
      address: selectedPlace.address,
      coordinates: selectedPlace.coordinates,
      googleMapsUrl: selectedPlace.url,
      phoneNumber: selectedPlace.phoneNumber,
      category: selectedPlace.types?.[0] || "establishment",
      rating: selectedPlace.rating,
      totalReviews: selectedPlace.userRatingsTotal,
      businessTypes: selectedPlace.types,
      addedAt: new Date().toISOString(),
    };

    try {
      const data = await registerBusinessLocation(businessData);
      setLocations((prev) => [...prev, data.business]);
      setSelectedPlace(null);
      setError(null);
      setTimeout(() => {
        alert(
          "✅ Location added successfully! Click the new marker to load and analyze reviews.",
        );
      }, 100);
    } catch (error) {
      console.error("Error adding location:", error);
      setError("Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  // Open modal with selected review
  const handleGenerateReply = (review) => {
    console.log("=== Opening Reply Modal ===");
    console.log("Review:", review);
    console.log("========================");

    setSelectedReview(review);
    setIsReplyModalOpen(true);
  };

  // Close modal
  const handleCloseReplyModal = () => {
    setIsReplyModalOpen(false);
    setSelectedReview(null);
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
        loadingReviews={loadingReviews} // For initial load button
        onClose={() => {
          setSidebarOpen(false);
          // Keep selectedLocation so reviews persist when reopened
        }}
        onLoadReviews={handleInitialLoadReviews} // Use initial loader
        onGenerateReply={handleGenerateReply}
        getSentimentIcon={getSentimentIcon}
        loadingSentiment={loadingSentiment} // For initial analyze button
        onAnalyzeSentiment={handleInitialAnalyzeSentiment} // Use initial analyzer
        // *** NEW PROPS for filtering/pagination ***
        reviewFilters={reviewFilters}
        reviewPage={reviewPage}
        onFilterOrPageChange={handleFilterOrPageChange}
        isFetchingReviews={isFetchingReviews} // General loading state
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
