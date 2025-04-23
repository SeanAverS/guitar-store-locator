import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import "../index.css";
import { debounce } from "lodash";

const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco fallback
const SIGNIFICANT_DISTANCE = 0.005; // ~500 meters
const googleMapsLibraries = ["places", "marker"];

const Maps = () => {
  const loaderOptions = useMemo(
    () => ({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: googleMapsLibraries,
      mapId: process.env.REACT_APP_MAP_ID,
    }),
    []
  );

  const { isLoaded, loadError } = useJsApiLoader(loaderOptions);

  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [storesFetched, setIsStoresFetched] = useState(false);
  const [activeMarker, setActiveMarker] = useState(null);

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
        if (Array.isArray(data)) {
          setStores(data);
          setIsStoresFetched(true);
          localStorage.setItem("nearbyStores", JSON.stringify(data));
        } else {
          console.error("Data fetched from API is not an array");
        }
      })
      .catch((error) => {
        console.error("Error fetching data from API:", error);
      });
  }, []);

  const fetchNearbyStores = useCallback(
    (location) => {
      const storedData = localStorage.getItem("nearbyStores");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData)) {
            setStores(parsedData);
            setIsStoresFetched(true);
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
    },
    [fetchFromAPI]
  );

  const debouncedFetchNearbyStores = useMemo(
    () =>
      debounce((location) => {
        fetchNearbyStores(location);
      }, 1000),
    [fetchNearbyStores]
  );

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

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    mapRef.current.markers = [];
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const significantLocationChange = (newLocation, oldLocation) => {
    const deltaLat = newLocation.lat - oldLocation.lat;
    const deltaLng = newLocation.lng - oldLocation.lng;
    return deltaLat * deltaLat + deltaLng * deltaLng > SIGNIFICANT_DISTANCE * SIGNIFICANT_DISTANCE;
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

  const generateDirectionsUrl = useCallback(() => {
    if (!activeMarker || !currentLocation) return "#";
    const origin = `${currentLocation.lat},${currentLocation.lng}`;
    const { lat, lng } = activeMarker.geometry.location;
  
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&destination_place_id=${
      activeMarker.place_id
    }&destination_name=${encodeURIComponent(activeMarker.name)}&travelmode=driving`;
  }, [activeMarker, currentLocation]);
  

  const loadStoreMarkers = useCallback(async () => {
    if (!window.google?.maps || !mapRef.current) {
      console.error("Google Maps API is not available.");
      return;
    }

    try {
      const { AdvancedMarkerElement, PinElement } =
        await window.google.maps.importLibrary("marker");

      // load advanced markers 
      mapRef.current.markers.forEach((marker) => marker.setMap(null));
      mapRef.current.markers = [];

      const markers = stores.map((store) => {
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

      const pinBackground = new PinElement({
        background: "#87CEEB",
        borderColor: "#87CEEB",
        glyphColor: "white",
        scale: 1.3,
      });

      const userMarker = new AdvancedMarkerElement({
        position: currentLocation,
        map: mapRef.current,
        title: "Your Location",
        content: pinBackground.element,
      });

      mapRef.current.markers.push(...markers, userMarker);
    } catch (error) {
      console.error("Error loading markers:", error);
    }
  }, [stores, currentLocation]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    if (currentLocation) debouncedFetchNearbyStores(currentLocation);
  }, [currentLocation, debouncedFetchNearbyStores]);

  useEffect(() => {
    if (isLoaded && mapRef.current && stores.length > 0) {
      loadStoreMarkers();
    }
  }, [isLoaded, stores, loadStoreMarkers]);

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
      onLoad={handleMapLoad}
      onUnmount={handleMapUnmount}
      options={{ mapId: process.env.REACT_APP_MAP_ID, mapTypeId: "roadmap" }}
    >
      {activeMarker && (
        <div className="info-window">
          <h3>{activeMarker.name}</h3>
          <p>{activeMarker.vicinity || "No address available"}</p>
          <a
            href={generateDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Directions
          </a>
        </div>
      )}
    </GoogleMap>
  );
};

export default Maps;
