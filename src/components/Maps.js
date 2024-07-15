import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const Maps = ({ apiKey }) => {
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
  }, []);

  const fetchFromAPI = useCallback((location) => {
    const url = `http://localhost:3000/api/nearbyStores?lat=${location.lat}&lng=${location.lng}`;
    console.log("Fetching from API with URL:", url);

    fetch(url)
      .then((response) => response.json())
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleLocationUpdate,
        (error) => {
          console.error("Error getting the location", error);
        }
      );
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
