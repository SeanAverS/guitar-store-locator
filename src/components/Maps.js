import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const Maps = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [storesFetched, setStoresFetched] = useState(false);

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
    if (!storesFetched) {
      fetchNearbyStores(newLocation);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storesFetched]);

  const fetchNearbyStores = useCallback((location) => {
    console.log("Fetching nearby stores for location:", location);
    const storedData = localStorage.getItem('nearbyStores');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && Array.isArray(parsedData)) {
          setNearbyStores(parsedData);
          setStoresFetched(true);
          console.log("Fetched from local storage:", parsedData);
        } else {
          throw new Error('Stored data is not an array');
        }
      } catch (error) {
        console.error("Error parsing stored data:", error);
        fetchFromAPI(location);
      }
    } else {
      fetchFromAPI(location);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFromAPI = useCallback((location, limit = 10) => {  
    const url = `http://localhost:5000/api/nearbyStores?lat=${location.lat}&lng=${location.lng}&limit=${limit}`;
    console.log("Fetching from API with URL:", url); 
  
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Data fetched from API:", data);
        if (data && Array.isArray(data)) {
          setNearbyStores(data);
          setStoresFetched(true);
          localStorage.setItem('nearbyStores', JSON.stringify(data));
          console.log("Fetched from API and stored:", data);
        } else {
          console.error("Data fetched from API is not an array");
        }
      })
      .catch((error) => {
        console.error("Error fetching data from API:", error);
      });
  }, []);
  
  
  const significantLocationChange = (newLocation, oldLocation) => {
    const distance = Math.sqrt(
      Math.pow(newLocation.lat - oldLocation.lat, 2) +
      Math.pow(newLocation.lng - oldLocation.lng, 2)
    );
    return distance > 0.005; // ~500 meters
  };
  
  useEffect(() => {
    localStorage.removeItem('nearbyStores');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (!currentLocation || significantLocationChange(newLocation, currentLocation)) {
            handleLocationUpdate(position);
          }
        },
        (error) => {
          console.error("Error getting the location", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [handleLocationUpdate, currentLocation]);
  

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
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
        <Marker position={currentLocation} />
      )}
      {nearbyStores.map((store, index) => (
        <Marker
          key={index}
          position={{
            lat: store.geometry.location.lat,
            lng: store.geometry.location.lng,
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default Maps;
