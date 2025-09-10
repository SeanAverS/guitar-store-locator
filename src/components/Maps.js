import { useState, useCallback, useRef, useEffect, useMemo, lazy } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import "../index.css";
import useTrackLocation from "../hooks/useTrackLocation.js";
import useNearbyStores from "../hooks/useNearbyStores.js";
import useMarkers from "../hooks/useMarkers.js";
import StoreErrorMessages from "./StoreErrorMessages.js";

/**
 * The main component for the Guitar Store Locator application.
 * This component: 
 * loads the google map
 * tracks the users location
 * gets nearby stores and displays them on the map
 * integrates multiple hooks to handle all the necessary logic.
 */

const MapContainer = lazy(() => import("../components/MapContainer.js"));
const InfoWindowCard = lazy(() => import("../components/InfoWindowCard.js"));

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
    error: storesError,
  } = useNearbyStores();

  // get nearby stores based on user's location
  const handleLocationUpdate = useCallback(
    (userPosition) => {
      const newLocation = {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
      };
      debouncedFetchNearbyStores(newLocation);
    },
    [debouncedFetchNearbyStores]
  );
  const { currentLocation, locationError } = useTrackLocation(
    handleLocationUpdate
  );

  // get nearby stores when user location changes
  useEffect(() => {
    if (isLoaded && currentLocation && !storesFetched && !storesError) {
      fetchNearbyStores(currentLocation);
    }
  }, [
    isLoaded,
    currentLocation,
    storesFetched,
    fetchNearbyStores,
    storesError,
  ]);

  // show stores on map based on user location
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
    if (
      !activeMarker ||
      !currentLocation ||
      !activeMarker.geometry ||
      !activeMarker.geometry.location
    )
      return "#";
    const origin = `${currentLocation.lat},${currentLocation.lng}`;
    const { lat, lng } = activeMarker.geometry.location;

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&destination_place_id=${
      activeMarker.place_id
    }&destination_name=${encodeURIComponent(
      activeMarker.name
    )}&travelmode=driving`;
  }, [activeMarker, currentLocation]);

  // map loading errors
  if (loadError) return null;
  if (!isLoaded) return null;

  return (
    <>
       <StoreErrorMessages
      storesFetched={storesFetched}
      stores={stores}
      locationError={locationError}
      storesError={storesError}
    />
      <MapContainer
        mapRef={mapRef}
        currentLocation={currentLocation}
      >
        {activeMarker && (
          <InfoWindowCard
            marker={activeMarker}
            directionsUrl={generateDirectionsUrl()}
            onClose={() => setActiveMarker(null)}
          />
        )}
      </MapContainer>
    </>
  );
};

export default Maps;
