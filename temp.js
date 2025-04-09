import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { debounce } from "lodash";

const containerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: 37.7749, lng: -122.4194 };
const googleMapsLibraries = ["places", "marker"];

const Maps = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: googleMapsLibraries,
    mapId: process.env.REACT_APP_MAP_ID,
  });

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    mapRef.current.markers = [];
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const debouncedFetchNearbyStores = useMemo(() =>
    debounce(async (lat, lng) => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/nearbyStores?lat=${lat}&lng=${lng}&limit=10`
        );
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        setNearbyStores(data);
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    }, 1000),
    []
  );

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported.");
      setCurrentLocation(defaultCenter);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setCurrentLocation({ lat: coords.latitude, lng: coords.longitude }),
      (error) => {
        console.error("Error getting location:", error);
        setCurrentLocation(defaultCenter);
      }
    );
  }, []);

  const loadStoreMarkers = useCallback(async () => {
    if (!window.google?.maps) {
      console.error("Google Maps API is not available.");
      return;
    }

    try {
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

      if (!AdvancedMarkerElement) {
        console.error("Failed to load AdvancedMarkerElement.");
        return;
      }

      const markers = nearbyStores.map((store) => {
        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: {
            lat: store.geometry.location.lat,
            lng: store.geometry.location.lng,
          },
          title: store.name,
        });

        marker.addListener("gmp-click", () => setActiveMarker(store));
        return marker;
      });

      mapRef.current.markers.push(...markers);
    } catch (error) {
      console.error("Error loading markers:", error);
    }
  }, [nearbyStores]);

  const generateDirectionsUrl = () => {
    if (!activeMarker || !currentLocation) return "#";
    const origin = `${currentLocation.lat},${currentLocation.lng}`;
    const { lat, lng } = activeMarker.geometry.location;

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&destination_place_id=${activeMarker.place_id}&destination_name=${encodeURIComponent(activeMarker.name)}&travelmode=driving`;
  };

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    if (currentLocation) debouncedFetchNearbyStores(currentLocation.lat, currentLocation.lng);
  }, [currentLocation, debouncedFetchNearbyStores]);

  useEffect(() => {
    if (isLoaded && mapRef.current && nearbyStores.length) {
      loadStoreMarkers();
    }
  }, [isLoaded, nearbyStores, loadStoreMarkers]);

  if (loadError) return <div>Error loading maps</div>;

  return isLoaded ? (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || defaultCenter}
        zoom={10}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        options={{ mapId: process.env.REACT_APP_MAP_ID, mapTypeId: "roadmap" }}
      />

      {activeMarker && (
        <div className="info-box">
          <h3>{activeMarker.name}</h3>
          <p>{activeMarker.vicinity || "No address available"}</p>
          <a href={generateDirectionsUrl()} target="_blank" rel="noopener noreferrer">
            Directions
          </a>
        </div>
      )}
    </div>
  ) : null;
};

export default Maps;