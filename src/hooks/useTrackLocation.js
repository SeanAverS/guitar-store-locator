import { useEffect, useCallback, useState } from "react";

const SIGNIFICANT_DISTANCE = 0.005;

const useTrackLocation = (onLocationChange, defaultLocation) => {
  const [currentLocation, setCurrentLocation] = useState(null);

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
      setCurrentLocation(defaultLocation);
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
          setCurrentLocation(newLocation);
          onLocationChange(position);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        setCurrentLocation(defaultLocation);
      }
    );
  }, [currentLocation, onLocationChange, defaultLocation]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  return currentLocation;
};

export default useTrackLocation;
