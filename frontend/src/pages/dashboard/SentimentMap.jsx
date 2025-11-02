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
import OverlappingMarkerSpiderfier from "./OverlappingMarkerSpiderfier";

// Panel Components
import LocationsPanel from "../../components/sentimentMap/LocationsPanel";
import SearchLocation from "../../components/sentimentMap/SearchLocation";
import MapLegend from "../../components/sentimentMap/MapLegend";
import AnalyticsPanel from "../../components/sentimentMap/AnalyticsPanel";

// Sidebar Components
import ReviewSidebar from "../../components/sentimentMap/sidebar/ReviewSidebar.jsx";

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
        <ReviewSidebar
          isOpen={sidebarOpen}
          selectedLocation={selectedLocation}
          loadingReviews={loadingReviews}
          reviewsPage={reviewsPage}
          onClose={() => setSidebarOpen(false)}
          onLoadReviews={handleLoadReviews}
          onGenerateReply={handleGenerateReply}
          onLoadMoreReviews={loadMoreReviews}
          getSentimentIcon={getSentimentIcon}
        />
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

export default SentimentMapViewEnhanced;
