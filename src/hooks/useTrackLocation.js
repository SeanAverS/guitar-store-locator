import { useEffect, useState } from "react";

const SIGNIFICANT_DISTANCE = 0.005;

/**
 * A hook to get and track the user's location
 * @param {function} handleLocationUpdate This callback function handles a users new location
 * @param {object} defaultCenter - Display this is a users location can't be found
 * @returns {{ currentLocation: object, locationError: string }} The user's location and location errors
 */

const useTrackLocation = (handleLocationUpdate, defaultCenter) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

 useEffect(() => {
   // check if a users new location is far from their last location (prevent re-renders)
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
      setCurrentLocation(defaultCenter); 
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
        setCurrentLocation(defaultCenter);

        // specific location error ui messages
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

  return { currentLocation, locationError };
};

export default useTrackLocation;