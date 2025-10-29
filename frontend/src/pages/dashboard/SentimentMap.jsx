import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  InfoWindow,
} from "@react-google-maps/api";
import {
  X,
  MapPin,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { mockBusinessLocations, mockApiClient } from "./mockBusinessLocations";
import OverlappingMarkerSpiderfier from "./OverlappingMarkerSpiderfier";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: -6.2088,
  lng: 106.8456,
};

const SentimentMapViewDemo = () => {
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

  const omsRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Load mock data on mount
  useEffect(() => {
    fetchBusinessLocations();
  }, []);

  // Register markers with Spiderfy when locations or marker refs change
  useEffect(() => {
    if (omsRef.current && Object.keys(markerRefs).length > 0) {
      // Clear existing markers from OMS
      omsRef.current.clearMarkers();

      // Add all markers to OMS
      Object.values(markerRefs).forEach((marker) => {
        if (marker) {
          omsRef.current.addMarker(marker);
        }
      });
    }
  }, [locations, markerRefs]);

  const fetchBusinessLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mockApiClient.get("/api/businesses");
      if (response.data.success) {
        setLocations(response.data.data.businesses);
      }
    } catch (error) {
      setError("Failed to load business locations");
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const onMapLoad = useCallback((map) => {
    setMap(map);

    // Initialize OverlappingMarkerSpiderfier
    const oms = new OverlappingMarkerSpiderfier(map, {
      markersWontMove: true,
      markersWontHide: true,
      keepSpiderfied: false,
      nearbyDistance: 40, // Increased for better detection
      circleFootSeparation: 35, // Spacing between spiderfied markers
    });

    // Listen for click events on spiderfied markers
    oms.addListener("click", (marker) => {
      const locationId = marker._locationId;
      const location = locations.find((loc) => loc.id === locationId);
      if (location) {
        handleMarkerClick(location);
      }
    });

    // Listen for spiderfy event
    oms.addListener("spiderfy", (markers) => {
      console.log("Spiderfied", markers.length, "markers");
    });

    // Listen for unspiderfy event
    oms.addListener("unspiderfy", () => {
      console.log("Unspiderfied");
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

    if (location.cacheStatus?.needsRefresh) {
      await refreshLocationReviews(location.id);
    }
  };

  const refreshLocationReviews = async (locationId) => {
    setLoadingReviews(true);
    try {
      const response = await mockApiClient.post(
        `/api/businesses/${locationId}/refresh`,
      );
      if (response.data.success) {
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationId ? response.data.data.business : loc,
          ),
        );

        if (selectedLocation?.id === locationId) {
          setSelectedLocation(response.data.data.business);
        }
      }
    } catch (error) {
      console.error("Error refreshing reviews:", error);
      setError("Failed to refresh reviews");
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddLocationToAnalysis = async () => {
    if (!selectedPlace) return;

    setLoading(true);
    setError(null);

    try {
      const response = await mockApiClient.post("/api/businesses/register", {
        businessName: selectedPlace.name,
        placeId: selectedPlace.placeId,
        address: selectedPlace.address,
        coordinates: selectedPlace.coordinates,
        googleMapsUrl: selectedPlace.url,
        phoneNumber: selectedPlace.phoneNumber,
        category: selectedPlace.types?.[0] || "establishment",
      });

      if (response.data.success) {
        await fetchBusinessLocations();
        setSelectedPlace(null);

        // Show success notification
        setError(null);
        setTimeout(() => {
          alert(
            "✅ Location added successfully! Reviews are being fetched and analyzed.",
          );
        }, 100);
      }
    } catch (error) {
      console.error("Error adding location:", error);
      setError(
        error.response?.data?.error?.message || "Failed to add location",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMoreReviews = () => {
    setReviewsPage((prev) => prev + 1);
  };

  const getMarkerColor = (sentiment) => {
    if (!sentiment) return "#9ca3af";

    const positivePercentage = sentiment.positivePercentage || 0;
    const negativePercentage = sentiment.negativePercentage || 0;

    if (positivePercentage > 60) return "#22c55e";
    if (negativePercentage > 40) return "#ef4444";
    return "#eab308";
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

  const getSentimentLabel = (sentiment) => {
    if (!sentiment) return "No Data";

    const positivePercentage = sentiment.positivePercentage || 0;
    const negativePercentage = sentiment.negativePercentage || 0;

    if (positivePercentage > 60) return "Positive";
    if (negativePercentage > 40) return "Negative";
    return "Neutral";
  };

  if (loadError) {
    return (
      <div className="flex justify-center items-center bg-gray-50 h-screen">
        <div className="bg-white shadow-lg p-8 rounded-lg max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 w-16 h-16 text-red-500" />
          <h2 className="mb-2 font-bold text-gray-900 text-xl">
            Error Loading Google Maps
          </h2>
          <p className="mb-4 text-gray-600">
            Please check your API key configuration.
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm text-left">
            <p className="font-mono text-gray-700 text-xs">
              VITE_GOOGLE_MAPS_API_KEY=
              {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "✓ Set" : "✗ Missing"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center bg-gray-50 h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading Google Maps...</p>
          <p className="mt-2 text-gray-400 text-sm">Using mock data for demo</p>
        </div>
      </div>
    );
  }

  const displayedReviews =
    selectedLocation?.reviews?.slice(0, reviewsPage * 5) || [];
  const totalReviews = selectedLocation?.reviews?.length || 0;

  return (
    <div className="relative w-full h-screen">
      {/* Demo Banner */}
      <div className="top-4 left-4 z-50 absolute bg-yellow-50 shadow-lg px-4 py-2 border border-yellow-200 rounded-lg">
        <p className="font-medium text-yellow-800 text-sm">
          🎭 Demo Mode - Using Mock Data
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="top-20 left-1/2 z-50 absolute max-w-md -translate-x-1/2 transform">
          <div className="flex items-start gap-3 bg-red-50 shadow-lg p-4 border border-red-200 rounded-lg">
            <AlertCircle className="flex-shrink-0 mt-0.5 w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="top-4 left-1/2 z-10 absolute px-4 w-full max-w-xl -translate-x-1/2 transform">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="flex items-center gap-2 p-2">
            <Search className="flex-shrink-0 ml-2 w-5 h-5 text-gray-400" />
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ["establishment"],
                componentRestrictions: { country: "id" },
              }}
            >
              <input
                type="text"
                placeholder="Search for a business location..."
                className="flex-1 px-2 py-2 outline-none text-sm"
              />
            </Autocomplete>
          </div>

          {selectedPlace && (
            <div className="space-y-3 p-4 border-t">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {selectedPlace.name}
                  </h3>
                  <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                    {selectedPlace.address}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {selectedPlace.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="fill-yellow-400 w-4 h-4 text-yellow-400" />
                        <span className="font-medium text-sm">
                          {selectedPlace.rating}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({selectedPlace.userRatingsTotal})
                        </span>
                      </div>
                    )}

                    {selectedPlace.url && (
                      <a
                        href={selectedPlace.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View on Google Maps
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlace(null)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleAddLocationToAnalysis}
                disabled={loading}
                className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-4 py-2.5 rounded-lg w-full font-medium text-white transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Sentiment Analysis
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={11}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {locations.map((location) => (
          <React.Fragment key={location.id}>
            <Marker
              position={location.coordinates}
              onLoad={(marker) => {
                marker._locationId = location.id;
                setMarkerRefs((prev) => ({ ...prev, [location.id]: marker }));
              }}
              onMouseOver={() => setHoveredMarker(location.id)}
              onMouseOut={() => setHoveredMarker(null)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: getMarkerColor(location.sentiment),
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: hoveredMarker === location.id ? 12 : 10,
              }}
            />

            {hoveredMarker === location.id && (
              <InfoWindow
                position={location.coordinates}
                options={{ pixelOffset: new window.google.maps.Size(0, -15) }}
              >
                <div className="p-2 max-w-xs">
                  <p className="mb-1 font-semibold text-gray-900 text-sm">
                    {location.businessName}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Star className="fill-yellow-400 w-3 h-3 text-yellow-400" />
                    <span>{location.averageRating}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      {location.reviewsCount} reviews
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        ))}

        {selectedPlace &&
          !locations.find((loc) => loc.placeId === selectedPlace.placeId) && (
            <Marker
              position={selectedPlace.coordinates}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#3b82f6",
                fillOpacity: 0.8,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                scale: 14,
              }}
              animation={window.google.maps.Animation.BOUNCE}
            />
          )}
      </GoogleMap>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-20 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedLocation && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="flex-shrink-0 w-5 h-5" />
                    <h2 className="font-bold text-xl truncate">
                      {selectedLocation.businessName}
                    </h2>
                  </div>
                  <p className="text-blue-100 text-sm line-clamp-2">
                    {selectedLocation.address}
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex-shrink-0 text-white hover:text-blue-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedLocation.averageRating && (
                <div className="flex items-center gap-2 mt-4">
                  <Star className="fill-yellow-300 w-5 h-5 text-yellow-300" />
                  <span className="font-bold text-2xl">
                    {selectedLocation.averageRating.toFixed(1)}
                  </span>
                  <span className="text-blue-100">
                    ({selectedLocation.reviewsCount} reviews)
                  </span>
                </div>
              )}

              <button
                onClick={() => refreshLocationReviews(selectedLocation.id)}
                disabled={loadingReviews}
                className="flex items-center gap-2 disabled:opacity-50 mt-3 text-blue-100 hover:text-white text-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingReviews ? "animate-spin" : ""}`}
                />
                {loadingReviews ? "Refreshing..." : "Refresh Reviews"}
              </button>
            </div>

            {/* Sentiment Summary */}
            <div className="flex-shrink-0 bg-gray-50 p-6 border-b">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">
                  Overall Sentiment
                </h3>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(selectedLocation.sentiment)}
                  <span className="font-medium text-sm">
                    {getSentimentLabel(selectedLocation.sentiment)}
                  </span>
                </div>
              </div>

              {selectedLocation.sentiment && (
                <div className="space-y-2">
                  <SentimentBar
                    label="Positive"
                    count={selectedLocation.sentiment.positive}
                    percentage={selectedLocation.sentiment.positivePercentage}
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
                    color="gray"
                  />
                  <SentimentBar
                    label="Negative"
                    count={selectedLocation.sentiment.negative}
                    percentage={selectedLocation.sentiment.negativePercentage}
                    color="red"
                  />
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                  <MessageSquare className="w-5 h-5" />
                  Recent Reviews
                </h3>
                <span className="text-gray-500 text-sm">
                  {displayedReviews.length} of {totalReviews}
                </span>
              </div>

              {loadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonReviewCard key={i} />
                  ))}
                </div>
              ) : displayedReviews.length > 0 ? (
                <div className="space-y-4">
                  {displayedReviews.map((review, index) => (
                    <ReviewCard
                      key={review.reviewId || index}
                      review={review}
                    />
                  ))}

                  {displayedReviews.length < totalReviews && (
                    <button
                      onClick={loadMoreReviews}
                      className="flex justify-center items-center gap-2 py-3 border-2 border-gray-300 hover:border-blue-500 border-dashed rounded-lg w-full font-medium text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Load More Reviews
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto mb-3 w-12 h-12 text-gray-300" />
                  <p className="text-gray-500">No reviews available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="sm:hidden z-10 fixed inset-0 bg-black bg-opacity-25"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Legend */}
      <div className="bottom-6 left-6 z-10 absolute bg-white shadow-lg p-4 rounded-lg">
        <h4 className="mb-3 font-semibold text-gray-900 text-sm">
          Sentiment Legend
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-green-500 rounded-full w-3 h-3"></div>
            <span className="text-gray-700 text-xs">Positive (&gt;60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-yellow-500 rounded-full w-3 h-3"></div>
            <span className="text-gray-700 text-xs">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-500 rounded-full w-3 h-3"></div>
            <span className="text-gray-700 text-xs">Negative (&gt;40%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sentiment Bar Component
const SentimentBar = ({ label, count, percentage, color }) => {
  const colorClasses = {
    green: "bg-green-500",
    gray: "bg-gray-400",
    red: "bg-red-500",
  };

  const textColorClasses = {
    green: "text-green-600",
    gray: "text-gray-600",
    red: "text-red-600",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${textColorClasses[color]}`}>
          {count} ({percentage?.toFixed(1) || 0}%)
        </span>
      </div>
      <div className="bg-gray-200 rounded-full w-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage || 0, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

// Review Card Component
const ReviewCard = ({ review }) => {
  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white hover:shadow-md p-4 border rounded-lg transition-all">
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{review.author}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-500 text-xs">
              {formatDate(review.time)}
            </span>
          </div>
        </div>
        {review.sentiment && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${getSentimentColor(
              review.sentiment,
            )}`}
          >
            {review.sentiment}
          </span>
        )}
      </div>

      {review.text && (
        <p className="mt-3 text-gray-700 text-sm leading-relaxed">
          {review.text}
        </p>
      )}

      {review.sentimentScore !== undefined && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-gray-500 text-xs">
            Sentiment Score:{" "}
            <span className="font-medium">
              {review.sentimentScore.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton Loading Component
const SkeletonReviewCard = () => (
  <div className="bg-white p-4 border rounded-lg animate-pulse">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="bg-gray-200 mb-2 rounded w-1/3 h-4"></div>
        <div className="bg-gray-200 rounded w-1/2 h-3"></div>
      </div>
      <div className="bg-gray-200 rounded-full w-16 h-6"></div>
    </div>
    <div className="space-y-2 mt-3">
      <div className="bg-gray-200 rounded w-full h-3"></div>
      <div className="bg-gray-200 rounded w-5/6 h-3"></div>
    </div>
  </div>
);

export default SentimentMapViewDemo;
