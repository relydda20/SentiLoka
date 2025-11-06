/**
 * useSentimentMap Hook
 * Main state management hook for SentimentMap component
 */
import { useState } from "react";
import { registerBusinessLocation } from "../services/locationService";

export const useSentimentMap = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Handle marker click (simplified for React Query)
  const createMarkerClickHandler = (
    locations,
    map,
    setSelectedLocationFn,
    setSidebarOpenFn,
  ) => {
    return async (location) => {
      const latestLocation =
        locations.find((loc) => loc.id === location.id) || location;

      console.log(`📍 Opening location: ${latestLocation.businessName}`);
      console.log(`   Reviews count in DB:`, latestLocation.reviewsCount || 0);
      console.log(`   Scrape status:`, latestLocation.scrapeStatus);

      setSelectedLocationFn(latestLocation);
      setSidebarOpenFn(true);

      if (map) {
        map.panTo(location.coordinates);
        map.setZoom(16);
      }

      // React Query will automatically fetch reviews when location changes
      console.log("✅ React Query will handle review fetching");
    };
  };

  // Handle add location
  const createAddLocationHandler = (
    selectedPlace,
    setSelectedPlace,
    setLocations,
    setLoading,
    setError,
  ) => {
    return async () => {
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
  };

  // Modal handlers
  const handleGenerateReply = (review) => {
    console.log("=== Opening Reply Modal ===");
    console.log("Review:", review);
    setSelectedReview(review);
    setIsReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    setIsReplyModalOpen(false);
    setSelectedReview(null);
  };

  return {
    selectedLocation,
    setSelectedLocation,
    sidebarOpen,
    setSidebarOpen,
    error,
    setError,
    isReplyModalOpen,
    selectedReview,
    isChatbotOpen,
    setIsChatbotOpen,
    handleGenerateReply,
    handleCloseReplyModal,
    createMarkerClickHandler,
    createAddLocationHandler,
  };
};
