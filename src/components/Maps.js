import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const Maps = ({ apiKey }) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  const mapContainerStyle = {
    width: "100%",
    height: "500px",
  };

  const handleLocationUpdate = useCallback((position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    console.log("Current location:", newLocation);
    setCurrentLocation(newLocation);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (error) => {
          console.error("Error getting the location", error);
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [handleLocationUpdate]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={currentLocation} 
      zoom={12}
    >
      {currentLocation && (
        <Marker
          position={currentLocation}
        />
      )}
    </GoogleMap>
  );
};

export default Maps;
