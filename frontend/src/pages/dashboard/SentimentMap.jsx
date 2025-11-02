import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import OverlappingMarkerSpiderfier from "./OverlappingMarkerSpiderfier";

// Panel Components
import LocationsPanel from "../../components/sentimentMap/LocationsPanel";
import SearchLocation from "../../components/sentimentMap/SearchLocation";
import MapLegend from "../../components/sentimentMap/MapLegend";
import AnalyticsPanel from "../../components/sentimentMap/AnalyticsPanel";

//Sidebar Components
import SentimentBar from "../../components/sentimentMap/sidebar/SentimentBar";
import ReviewCard from "../../components/sentimentMap/sidebar/ReviewCard";

// Marker Components
import LocationMarker from "../../components/sentimentMap/marker/LocationMarker";
import SelectedMarker from "../../components/sentimentMap/marker/SelectedMarker";

// Services
import {
  fetchBusinessLocations,
  registerBusinessLocation,
  loadBusinessReviews,
  generateReviewReply,
} from "../../services/locationReviewService";

// Utils
import { getMarkerColor, getSentimentLabel } from "../../utils/sentimentUtils";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: -6.2088,
  lng: 106.8456,
};

const SentimentMapViewEnhanced = () => {
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchBox, setSearchBox] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [markerRefs, setMarkerRefs] = useState({});
  const [poiVisible, setPoiVisible] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);

  const omsRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Load mock data on mount
  useEffect(() => {
    fetchBusinessLocationsData();
    // Simulate connected locations
    setSavedLocations([
      {
        id: "conn-1",
        name: "My Restaurant Jakarta",
        address: "Jl. Sudirman No. 123, Jakarta",
        coordinates: { lat: -6.2088, lng: 106.8456 },
        status: "active",
      },
      {
        id: "conn-2",
        name: "Coffee Shop Menteng",
        address: "Jl. Menteng Raya No. 45, Jakarta",
        coordinates: { lat: -6.1944, lng: 106.8294 },
        status: "active",
      },
    ]);
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

    // Set initial POI visibility to off
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

    map.addListener("click", () => {
      oms.unspiderfy();
    });

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

  const handleMarkerClick = async (location) => {
    setSelectedLocation(location);
    setSidebarOpen(true);
    setReviewsPage(1);
  };

  const handleSpiderfiedMarkerClick = async (location) => {
    setSelectedLocation(location);
    setSidebarOpen(true);
    setReviewsPage(1);
  };

  const handleLoadReviews = async (locationId) => {
    setLoadingReviews(true);
    setError(null);

    console.log("=== Load Reviews Request ===");
    console.log("Location ID:", locationId);
    console.log("Action: Start scraping reviews from Google");
    console.log("==========================");

    try {
      const data = await loadBusinessReviews(locationId);

      // Update location with scraped reviews
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId ? { ...loc, ...data.business } : loc,
        ),
      );

      if (selectedLocation?.id === locationId) {
        setSelectedLocation((prev) => ({ ...prev, ...data.business }));
      }

      alert("✅ Reviews loaded and analyzed successfully!");
    } catch (error) {
      console.error("Error loading reviews:", error);
      setError("Failed to load reviews");
    } finally {
      setLoadingReviews(false);
    }
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

    console.log("=== Business Location Data ===");
    console.log("Google Maps URL:", businessData.googleMapsUrl);
    console.log("Full Payload:", JSON.stringify(businessData, null, 2));
    console.log("============================");

    try {
      const data = await registerBusinessLocation(businessData);
      await fetchBusinessLocationsData();
      setSelectedPlace(null);
      setError(null);
      setTimeout(() => {
        alert(
          "✅ Location added successfully! Use 'Load Reviews' to fetch and analyze reviews.",
        );
      }, 100);
    } catch (error) {
      console.error("Error adding location:", error);
      setError("Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = (location) => {
    if (map) {
      map.panTo(location.coordinates);
      map.setZoom(16);
    }
  };

  const handleGenerateReply = async (review) => {
    console.log("=== Generate Reply ===");
    console.log("Review:", review);
    console.log("====================");

    try {
      const data = await generateReviewReply(
        selectedLocation.id,
        review.reviewId,
        review,
      );
      alert(`✨ Generated reply: ${data.reply}`);
    } catch (error) {
      console.error("Error generating reply:", error);
      alert("Failed to generate reply");
    }
  };

  const loadMoreReviews = () => {
    setReviewsPage((prev) => prev + 1);
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

  // Calculate overall analytics
  const calculateAnalytics = () => {
    const totalLocations = locations.length;
    const totalReviews = locations.reduce(
      (sum, loc) => sum + (loc.reviewsCount || 0),
      0,
    );
    const analyzedReviews = locations.reduce(
      (sum, loc) => sum + (loc.reviews?.length || 0),
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

  const displayedReviews =
    selectedLocation?.reviews?.slice(0, reviewsPage * 5) || [];
  const totalReviews = selectedLocation?.reviews?.length || 0;
  const hasReviews =
    selectedLocation?.reviews && selectedLocation.reviews.length > 0;

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
          locations={savedLocations}
          onLocationClick={handleLocationClick}
          title="Saved Locations"
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
            getMarkerColor={getMarkerColor}
          />
        ))}

        {/* Selected Place Marker */}
        {selectedPlace &&
          !locations.find((loc) => loc.placeId === selectedPlace.placeId) && (
            <SelectedMarker position={selectedPlace.coordinates} />
          )}
      </GoogleMap>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="top-0 right-0 z-50 fixed bg-white shadow-2xl w-full sm:w-96 h-full"
          >
            {selectedLocation && (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-linear-to-r from-[#2F4B4E] to-[#42676B] p-6 text-white shrink-0">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 shrink-0" />
                        <h2 className="font-bold text-xl truncate">
                          {selectedLocation.businessName}
                        </h2>
                      </div>
                      <p className="text-[#E1E6C3] text-sm line-clamp-2">
                        {selectedLocation.address}
                      </p>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="text-white hover:text-[#E1E6C3] transition-colors shrink-0"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    {selectedLocation.averageRating ? (
                      <div className="flex items-center gap-2">
                        <Star className="fill-[#CED7B0] w-5 h-5 text-[#CED7B0]" />
                        <span className="font-bold text-2xl">
                          {selectedLocation.averageRating.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[#E1E6C3] text-sm">No rating data</p>
                    )}
                  </div>

                  {!hasReviews && (
                    <motion.button
                      onClick={() => handleLoadReviews(selectedLocation.id)}
                      disabled={loadingReviews}
                      whileHover={!loadingReviews ? { scale: 1.02 } : {}}
                      whileTap={!loadingReviews ? { scale: 0.98 } : {}}
                      className="flex justify-center items-center gap-2 bg-white hover:bg-[#FAF6E9] disabled:opacity-50 shadow-md mt-4 px-4 py-2.5 rounded-lg w-full font-medium text-[#2F4B4E] transition-colors"
                    >
                      {loadingReviews ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading Reviews...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Load Reviews
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Sentiment Summary - Only show if reviews exist */}
                {hasReviews && selectedLocation.sentiment && (
                  <div className="bg-[#FAF6E9] p-6 border-[#CED7B0] border-b shrink-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-[#2F4B4E]">
                        Overall Sentiment
                      </h3>
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(selectedLocation.sentiment)}
                        <span className="font-medium text-sm">
                          {getSentimentLabel(selectedLocation.sentiment)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <SentimentBar
                        label="Positive"
                        count={selectedLocation.sentiment.positive}
                        percentage={
                          selectedLocation.sentiment.positivePercentage
                        }
                        color="green"
                      />
                      <SentimentBar
                        label="Neutral"
                        count={selectedLocation.sentiment.neutral}
                        percentage={
                          (selectedLocation.sentiment.neutral /
                            selectedLocation.reviewsCount) *
                            100 || 0
                        }
                        color="yellow"
                      />
                      <SentimentBar
                        label="Negative"
                        count={selectedLocation.sentiment.negative}
                        percentage={
                          selectedLocation.sentiment.negativePercentage
                        }
                        color="red"
                      />
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {!hasReviews ? (
                    <div className="py-12 text-center">
                      <MessageSquare className="mx-auto mb-3 w-12 h-12 text-[#CED7B0]" />
                      <p className="mb-2 text-[#42676B]">
                        No reviews loaded yet
                      </p>
                      <p className="text-[#42676B] text-sm">
                        Click "Load Reviews" to fetch and analyze reviews
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="flex items-center gap-2 font-semibold text-[#2F4B4E]">
                          <MessageSquare className="w-5 h-5" />
                          Recent Reviews
                        </h3>
                        <span className="text-[#42676B] text-sm">
                          {displayedReviews.length} of {totalReviews}
                        </span>
                      </div>

                      {loadingReviews ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <SkeletonReviewCard key={i} />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {displayedReviews.map((review, index) => (
                            <ReviewCard
                              key={review.reviewId || index}
                              review={review}
                              onGenerateReply={handleGenerateReply}
                            />
                          ))}

                          {displayedReviews.length < totalReviews && (
                            <motion.button
                              onClick={loadMoreReviews}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex justify-center items-center gap-2 hover:bg-[#FAF6E9] py-3 border-[#CED7B0] border-2 hover:border-[#2F4B4E] border-dashed rounded-lg w-full font-medium text-[#42676B] hover:text-[#2F4B4E] transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                              Load More Reviews
                            </motion.button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay when sidebar is open */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-40 fixed inset-0 bg-[#2F4B4E]/20 backdrop-blur-sm"
            onClick={() => {
              setSidebarOpen(false);
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

      {/* Legend - Bottom Right */}
      <div className="right-6 bottom-6 z-10 absolute">
        <MapLegend />
      </div>
    </div>
  );
};

// Skeleton Loading Component
const SkeletonReviewCard = () => (
  <div className="bg-white p-4 border border-[#E1E6C3] rounded-lg animate-pulse">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="bg-[#E1E6C3] mb-2 rounded w-1/3 h-4"></div>
        <div className="bg-[#E1E6C3] rounded w-1/2 h-3"></div>
      </div>
      <div className="bg-[#E1E6C3] rounded-full w-16 h-6"></div>
    </div>
    <div className="space-y-2 mt-3">
      <div className="bg-[#E1E6C3] rounded w-full h-3"></div>
      <div className="bg-[#E1E6C3] rounded w-5/6 h-3"></div>
    </div>
  </div>
);

export default SentimentMapViewEnhanced;
