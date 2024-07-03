// src/components/UserLocation.js

import React, { useEffect, useState, useCallback } from "react";

const UserLocation = ({ onLocationUpdate }) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  const handleLocationUpdate = useCallback((position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    console.log("Current location:", newLocation);
    setCurrentLocation(newLocation);
    onLocationUpdate(newLocation);
  }, [onLocationUpdate]);

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

  return null; // Since this component handles side effects, it doesn't need to render anything
};

export default UserLocation;
