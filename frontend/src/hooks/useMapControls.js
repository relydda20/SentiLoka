/**
 * useMapControls Hook
 * Manages Google Maps controls and interactions
 */
import { useState, useCallback, useRef, useEffect } from "react";
import OverlappingMarkerSpiderfier from "../utils/OverlappingMarkerSpiderfier";

const POI_HIDE_STYLES = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

const OMS_CONFIG = {
  markersWontMove: true,
  markersWontHide: true,
  keepSpiderfied: false,
  nearbyDistance: 40,
  circleFootSeparation: 35,
};

export const useMapControls = (locations, onSpiderfiedMarkerClick) => {
  const [map, setMap] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [poiVisible, setPoiVisible] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [markerRefs, setMarkerRefs] = useState({});
  const omsRef = useRef(null);

  // Initialize map
  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    mapInstance.setOptions({
      styles: POI_HIDE_STYLES,
    });
    const oms = new OverlappingMarkerSpiderfier(mapInstance, OMS_CONFIG);
    mapInstance.addListener("click", () => oms.unspiderfy());
    omsRef.current = oms;
  }, []);

  // Toggle POI visibility
  const togglePOI = useCallback(() => {
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
  }, [map, poiVisible]);

  // Autocomplete handlers
  const onAutocompleteLoad = useCallback((autocomplete) => {
    setSearchBox(autocomplete);
  }, []);

  const onPlaceChanged = useCallback(() => {
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
  }, [searchBox, map]);

  // Marker load handler
  const handleMarkerLoad = useCallback((marker, locationId) => {
    setMarkerRefs((prev) => ({ ...prev, [locationId]: marker }));
  }, []);

  // Register markers with Spiderfy
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
        if (location && onSpiderfiedMarkerClick) {
          onSpiderfiedMarkerClick(location);
        }
      });

      omsRef.current.addListener("spiderfy", (markers) => {
        console.log("Spiderfied", markers.length, "markers");
      });

      omsRef.current.addListener("unspiderfy", () => {
        console.log("Unspiderfied");
      });
    }
  }, [locations, onSpiderfiedMarkerClick]);

  return {
    map,
    onMapLoad,
    searchBox,
    selectedPlace,
    setSelectedPlace,
    poiVisible,
    togglePOI,
    hoveredMarker,
    setHoveredMarker,
    markerRefs,
    handleMarkerLoad,
    onAutocompleteLoad,
    onPlaceChanged,
    omsRef,
  };
};
