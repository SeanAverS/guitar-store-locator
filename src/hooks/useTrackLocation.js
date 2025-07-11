import { useEffect, useCallback, useState } from "react";

const SIGNIFICANT_DISTANCE = 0.005;

const useTrackLocation = (handleLocationUpdate, defaultCenter) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

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
      setCurrentLocation(defaultCenter); // Maps.js SF Fallback
      setLocationError(
        "Geolocation is not supported by your browser. Please try a different browser or enable location services."
      );
      return;
    }

    // authenticate user's location used in Maps.js
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
          handleLocationUpdate(position);
          setLocationError(null);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        setCurrentLocation(defaultCenter); // Maps.js SF Fallback
        // Specific location error messages for user
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location access denied. Please enable your location in the browser."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Your location information is unavailable. Please check device settings."
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "Timed out while trying to retrieve your location. Please try again."
            );
            break;
          default:
            setLocationError(
              "An unknown error occurred while trying to get your location."
            );
            break;
        }
      }
    );
  }, [currentLocation, handleLocationUpdate, defaultCenter]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  return { currentLocation, locationError };
};

export default useTrackLocation;
