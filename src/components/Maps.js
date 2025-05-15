import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import "../index.css";
import useTrackLocation from "../hooks/useTrackLocation.js";
import useNearbyStores from "../hooks/useNearbyStores.js";
import useMarkers from "../hooks/useMarkers.js";
import MapContainer from "../components/MapContainer.js";
import InfoWindowCard from "../components/InfoWindowCard.js";

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
  const [activeMarker, setActiveMarker] = useState(null);

  const {
    stores,
    storesFetched,
    fetchNearbyStores,
    debouncedFetchNearbyStores,
  } = useNearbyStores();

  // get nearby stores based on user's location
  const handleLocationUpdate = useCallback(
    (position) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      if (!storesFetched) {
        fetchNearbyStores(newLocation);
      } else {
        debouncedFetchNearbyStores(newLocation); // prevent constant fetch calls
      }
    },
    [storesFetched, debouncedFetchNearbyStores, fetchNearbyStores]
  );
  const currentLocation = useTrackLocation(handleLocationUpdate, defaultCenter);

  // show stores based on user location
  const { loadMarkers } = useMarkers(mapRef, setActiveMarker);
  useEffect(() => {
    if (isLoaded && mapRef.current && stores.length > 0 && currentLocation) {
      loadMarkers(stores, currentLocation);
    }
  }, [isLoaded, stores, currentLocation, loadMarkers]);

  // pan to user whenever their location changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.panTo(currentLocation);
    }
  }, [currentLocation]);

  // google maps directions
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

  // map loading errors
  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    // Map container styling
    <MapContainer
      mapRef={mapRef}
      currentLocation={currentLocation}
      defaultCenter={defaultCenter}
    >
      {/* Clicked store information styling */}
      {activeMarker && (
        <InfoWindowCard
          marker={activeMarker}
          onClose={() => setActiveMarker(null)}
          directionsUrl={generateDirectionsUrl()}
        />
      )}
    </MapContainer>
  );
};

export default Maps;
