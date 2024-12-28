import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import "../index.css"

const Maps = () => {
  const [mapInstance, setMapInstance] = useState(null); 
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [storesFetched, setStoresFetched] = useState(false);
  const [activeMarker, setActiveMarker] = useState(null);

  const handleLocationUpdate = useCallback((position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
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
          console.log("Fetched from API and stored:", data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLocationUpdate, currentLocation]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
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
      nearbyStores.forEach(store => {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: store.geometry.location.lat, lng: store.geometry.location.lng },
          map: mapInstance,
          content: `<div class="custom-marker">${store.name}</div>`,
        });

        marker.addListener('click', () => {
          setActiveMarker(store);
        });
      });
    }
  }, [mapInstance, nearbyStores]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }


  return (
    <GoogleMap
      mapContainerClassName="map-container"
      center={currentLocation}
      zoom={12}
      onLoad={initializeMap}
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
