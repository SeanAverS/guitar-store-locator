import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import "../index.css";
import { debounce } from "lodash"; 


const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco fallback
const googleMapsLibraries = ["marker"];

const Maps = () => {
  const [mapInstance, setMapInstance] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [storesFetched, setStoresFetched] = useState(false);
  const [activeMarker, setActiveMarker] = useState(null);

  const debouncedFetchNearbyStores = useMemo(() =>
    debounce((location) => {
      fetchNearbyStores(location);
    }, 1000), []);  
  
  const handleLocationUpdate = useCallback((position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    setCurrentLocation(newLocation);
    if (!storesFetched) {
      fetchNearbyStores(newLocation);
    } else {
      debouncedFetchNearbyStores(newLocation);  
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storesFetched]);

  const fetchNearbyStores = useCallback((location) => {
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

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          setNearbyStores(data);
          setStoresFetched(true);
          localStorage.setItem('nearbyStores', JSON.stringify(data));
        } else {
          console.error("Data fetched from API is not an array");
        }
      })
      .catch((error) => {
        console.error("Error fetching data from API:", error);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMap = (map) => {
    setMapInstance(map);
  };

  const significantLocationChange = (newLocation, oldLocation) => {
    const distance = Math.sqrt(
      Math.pow(newLocation.lat - oldLocation.lat, 2) +
      Math.pow(newLocation.lng - oldLocation.lng, 2)
    );
    return distance > 0.005; // ~500 meters
  };

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported.");
      setCurrentLocation(defaultCenter);
      return;
    }
  
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
        setCurrentLocation(defaultCenter);
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, handleLocationUpdate]);
  

  useEffect(() => {
    localStorage.removeItem('nearbyStores');
    getUserLocation();
  }, [getUserLocation]);
  

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: googleMapsLibraries,  
    version: "beta",
  });
  const handleMouseOut = () => {
    setActiveMarker(null);
  };

  const handleButtonClick = (store) => {
    const businessDetailsUrl = `https://www.google.com/maps/search/?api=1&query=${store.name}&query_place_id=${store.place_id}`;
    window.open(businessDetailsUrl, '_blank');
  };

  const handleDirectionsClick = () => {
    if (currentLocation && activeMarker) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(activeMarker.name)}&destination_place_id=${activeMarker.place_id}`;
      window.open(directionsUrl, '_blank');
    } else {
      console.error("Current location or active marker is not available.");
    }
  };

  useEffect(() => {
    if (mapInstance && nearbyStores.length > 0) {
      nearbyStores.forEach((store) => {
        const contentDiv = document.createElement("div");
        contentDiv.className = "custom-marker";
        contentDiv.textContent = store.name;
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: store.geometry.location.lat, lng: store.geometry.location.lng },
          map: mapInstance,
          content: contentDiv,
        });
        marker.addEventListener("gmp-click", () => {
          setActiveMarker(store);
        });
      });
    }
  }, [mapInstance, nearbyStores]);
  

  useEffect(() => {
    if (currentLocation && mapInstance) {
      mapInstance.panTo(currentLocation);
    }
  }, [currentLocation, mapInstance]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <GoogleMap
      mapContainerClassName="map-container"
      center={currentLocation || { lat: 0, lng: 0 }}
      zoom={12}
      onLoad={initializeMap}
      mapId={process.env.REACT_APP_MAP_ID}
    >
      {currentLocation && (
        <Marker
          position={currentLocation}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
          }}
        />
      )}

      {nearbyStores.map((store, index) => (
        <Marker
          key={index}
          position={{ lat: store.geometry.location.lat, lng: store.geometry.location.lng }}
          icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
          onClick={() => setActiveMarker(store)}
        >
          {activeMarker === store && (
            <InfoWindow
              position={{
                lat: store.geometry.location.lat,
                lng: store.geometry.location.lng,
              }}
              onCloseClick={handleMouseOut}
            >
              <div className="info-window">
                <h4>{store.name}</h4>
                <p>{store.vicinity}</p>
                <div className="info-window-buttons">
                  <button onClick={() => handleButtonClick(store)}>Business Page</button>
                  <button onClick={handleDirectionsClick}>Directions</button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
};

export default Maps;
