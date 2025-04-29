import { useEffect, useCallback, useState } from "react";

const SIGNIFICANT_DISTANCE = 0.005;

const useTrackLocation = (handleLocationUpdate, defaultCenter) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  // compare a users current location with their previous one
  const significantLocationChange = (newLocation, oldLocation) => {
    const deltaLat = newLocation.lat - oldLocation.lat;
    const deltaLng = newLocation.lng - oldLocation.lng;
    return (
      deltaLat * deltaLat + deltaLng * deltaLng >
      SIGNIFICANT_DISTANCE * SIGNIFICANT_DISTANCE
    );
  };

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported.");
      setCurrentLocation(defaultCenter); // Map.js SF Fallback
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (
          !currentLocation ||
          significantLocationChange(newLocation, currentLocation)
        ) {
          setCurrentLocation(newLocation); // using geolocation 
          handleLocationUpdate(position); // in Maps.js 
        }
      },
      (error) => {
        console.error("Error getting location", error);
        setCurrentLocation(defaultCenter); // Maps.js SF Fallback 
      }
    );
  }, [currentLocation, handleLocationUpdate, defaultCenter]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  return currentLocation;
};

export default useTrackLocation;
