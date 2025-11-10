/**
 * useLocationData Hook
 * Manages location data fetching and state
 */
import { useState, useEffect } from "react";
import { fetchBusinessLocations } from "../services/locationService";

export const useLocationData = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBusinessLocationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessLocations();
      setLocations(data.businesses);
      return data.businesses; // Return the fetched data
    } catch (error) {
      setError("Failed to load business locations");
      console.error("Error fetching businesses:", error);
      return []; // Return empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessLocationsData();
  }, []);

  return {
    locations,
    setLocations,
    loading,
    setLoading,
    error,
    setError,
    refetchLocations: fetchBusinessLocationsData,
  };
};
