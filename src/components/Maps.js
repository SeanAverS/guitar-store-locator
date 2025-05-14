import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import "../index.css";
import useTrackLocation from "../hooks/useTrackLocation.js";
import useNearbyStores from "../hooks/useNearbyStores.js";
import useMarkers from "../hooks/useMarkers.js";

const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // SF fallback
const googleMapsLibraries = ["places", "marker"];

const Maps = () => {
  const loaderOptions = useMemo(
    () => ({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: googleMapsLibraries,
      mapId: process.env.REACT_APP_MAP_ID,
    }),
    []
  );
  const { isLoaded, loadError } = useJsApiLoader(loaderOptions);
  
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const {
    stores,
    storesFetched,
    fetchNearbyStores,
    debouncedFetchNearbyStores,
  } = useNearbyStores();

  const handleLocationUpdate = useCallback(
    (position) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      if (!storesFetched) {
        fetchNearbyStores(newLocation);
      } else {
        debouncedFetchNearbyStores(newLocation); // prevent constant store fetch calls
      }
    },
    [storesFetched, debouncedFetchNearbyStores, fetchNearbyStores]
  );
  const currentLocation = useTrackLocation(handleLocationUpdate, defaultCenter);

  const { loadMarkers } = useMarkers(mapRef, setActiveMarker);
  useEffect(() => {
    if (isLoaded && mapRef.current && stores.length > 0 && currentLocation) {
      loadMarkers(stores, currentLocation); // useMarkers.js
    }
  }, [isLoaded, stores, currentLocation, loadMarkers]);


  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.panTo(currentLocation);
    }
  }, [currentLocation]);

  const generateDirectionsUrl = useCallback(() => {
    if (!activeMarker || !currentLocation) return "#";
    const origin = `${currentLocation.lat},${currentLocation.lng}`;
    const { lat, lng } = activeMarker.geometry.location;

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&destination_place_id=${
      activeMarker.place_id
    }&destination_name=${encodeURIComponent(
      activeMarker.name
    )}&travelmode=driving`;
  }, [activeMarker, currentLocation]);

  if (loadError) return <div>Error loading map</div>;

  return (
    <GoogleMap
      mapContainerClassName="map-container"
      center={currentLocation || defaultCenter}
      zoom={12}
      onLoad={(map) => {
        mapRef.current = map;
        mapRef.current.markers = [];
      }}
      onUnmount={() => (mapRef.current = null)}
      options={{
        mapId: process.env.REACT_APP_MAP_ID,
        mapTypeId: "roadmap",
      }}
    >
      {activeMarker && (
        <div className="info-window" ref={infoWindowRef}>
          <button className="close-btn" onClick={() => setActiveMarker(null)}>
            ×
          </button>
          <h3>{activeMarker.name}</h3>
          <p>{activeMarker.vicinity || "No address available"}</p>
          {activeMarker.opening_hours?.open_now !== undefined && (
            <p>
              <strong>Open?</strong>{" "}
              {activeMarker.opening_hours.open_now ? "Yes" : "No"}
            </p>
          )}
          <a
            href={generateDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Directions
          </a>
        </div>
      )}
    </GoogleMap>
  );
};

export default Maps;
