import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import "../index.css";
import { debounce } from "lodash";

const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco fallback
const googleMapsLibraries = ["places", "marker"];

const Maps = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: googleMapsLibraries,
    mapId: process.env.REACT_APP_MAP_ID,
  });

  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [storesFetched, setStoresFetched] = useState(false);
  const [activeMarker, setActiveMarker] = useState(null);

  const fetchNearbyStores = useCallback((location) => {
    const storedData = localStorage.getItem("nearbyStores");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && Array.isArray(parsedData)) {
          setNearbyStores(parsedData);
          setStoresFetched(true);
          console.log("Fetched from local storage:", parsedData);
        } else {
          throw new Error("Stored data is not an array");
        }
      } catch (error) {
        console.error("Error parsing stored data:", error);
        fetchFromAPI(location);
      }
    } else {
      fetchFromAPI(location);
    }
  }, []);

  const debouncedFetchNearbyStores = useMemo(
    () =>
      debounce((location) => {
        fetchNearbyStores(location);
      }, 1000),
    []
  );

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
          localStorage.setItem("nearbyStores", JSON.stringify(data));
        } else {
          console.error("Data fetched from API is not an array");
        }
      })
      .catch((error) => {
        console.error("Error fetching data from API:", error);
      });
  }, []);

  const handleLocationUpdate = useCallback(
    (position) => {
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
    },
    [storesFetched, debouncedFetchNearbyStores, fetchNearbyStores]
  );

  const initializeMap = (map) => {
    mapRef.current = map;
    mapRef.current.markers = [];
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
        if (
          !currentLocation ||
          significantLocationChange(newLocation, currentLocation)
        ) {
          handleLocationUpdate(position);
        }
      },
      (error) => {
        console.error("Error getting the location", error);
        setCurrentLocation(defaultCenter);
      }
    );
  }, [currentLocation, handleLocationUpdate]);

  const loadStoreMarkers = useCallback(async () => {
    if (!window.google?.maps || !mapRef.current) {
        console.error("Google Maps API is not available.");
        return;
    }

    try {
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

        if (!AdvancedMarkerElement) {
            console.error("Failed to load AdvancedMarkerElement.");
            return;
        }

        if (mapRef.current.markers) {
            mapRef.current.markers.forEach((marker) => marker.setMap(null));
        }

        mapRef.current.markers = [];

        const markers = nearbyStores.map((store) => {
            const marker = new AdvancedMarkerElement({
                map: mapRef.current,
                position: {
                    lat: store.geometry.location.lat,
                    lng: store.geometry.location.lng,
                },
                title: store.name,
            });

            marker.addListener("gmp-click", () => setActiveMarker(store));
            return marker;
        });

        const userMarker = new AdvancedMarkerElement({
            position: currentLocation,
            map: mapRef.current,
            title: "Your Location",
            content: (() => {
                const img = document.createElement("img");
                img.src = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                img.style.width = "24px";
                return img;
            })(),
        });

        mapRef.current.markers.push(...markers, userMarker);
    } catch (error) {
        console.error("Error loading markers:", error);
    }
}, [nearbyStores, currentLocation]);

  useEffect(() => {
    localStorage.removeItem("nearbyStores");
    getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    if (isLoaded && mapRef.current && currentLocation) {
      if (mapRef.current.userMarker) {
        mapRef.current.userMarker.setMap(null);
      }
    }
  }, [isLoaded, currentLocation])

  const handleMouseOut = () => {
    setActiveMarker(null);
  };

  const handleButtonClick = (store) => {
    const businessDetailsUrl = `https://www.google.com/maps/search/?api=1&query=${store.name}&query_place_id=${store.place_id}`;
    window.open(businessDetailsUrl, "_blank");
  };

  const handleDirectionsClick = () => {
    if (currentLocation && activeMarker) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(
        activeMarker.name
      )}&destination_place_id=${activeMarker.place_id}`;
      window.open(directionsUrl, "_blank");
    } else {
      console.error("Current location or active marker is not available.");
    }
  };

  useEffect(() => {
    if (isLoaded && mapRef.current && nearbyStores.length > 0) {
      loadStoreMarkers();
    }
  }, [isLoaded, nearbyStores, loadStoreMarkers]);
  

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.panTo(currentLocation);
    }
  }, [currentLocation]);

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
    </GoogleMap>
  );
};

export default Maps;
