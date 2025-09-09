import { useEffect, useState } from "react";
import { getLocationErrorMessage } from "../utils/locationErrorMessages.js";

const SIGNIFICANT_DISTANCE = 0.005;

/**
 * A hook to get and track the user's location
 * @param {function} handleLocationUpdate This handles a users new location
 * @returns {{ currentLocation: object, locationError: string }} The user's location and location errors
 */

const useTrackLocation = (handleLocationUpdate) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

 useEffect(() => {
   // compare a users new and old location (prevent re-renders)
  const significantLocationChange = (newLocation, oldLocation) => {
    const deltaLat = newLocation.lat - oldLocation.lat;
    const deltaLng = newLocation.lng - oldLocation.lng;
    return (
      deltaLat * deltaLat + deltaLng * deltaLng >
      SIGNIFICANT_DISTANCE * SIGNIFICANT_DISTANCE
    );
  };

  // check geolocation status
    if (!navigator.geolocation) {
      console.error("Geolocation not supported.");
      setLocationError(
        "Geolocation is not supported by your browser. Please try a different browser or enable location services."
      );
      return;
    }

    // get the user's location 
    navigator.geolocation.getCurrentPosition(
      (userPosition) => {
        const newLocation = {
          lat: userPosition.coords.latitude,
          lng: userPosition.coords.longitude,
        };
        if (
          !currentLocation ||
          significantLocationChange(newLocation, currentLocation)
        ) {
          setCurrentLocation(newLocation);
          handleLocationUpdate(userPosition);
          setLocationError(null);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        setLocationError(getLocationErrorMessage(error.code));
      }
    );
  }, [currentLocation, handleLocationUpdate]);

  return { currentLocation, locationError };
};

export default useTrackLocation;