import { useCallback, useMemo, useState } from "react";
import { debounce } from "../utils/debounce.js";

// render backend 
const isDev = window.location.hostname === "localhost";
const BASE_URL = isDev
  ? "http://localhost:5000"
  : "https://guitar-store-locator.onrender.com";

const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

const useNearbyStores = () => {
  const [stores, setStores] = useState([]);
  const [storesFetched, setIsStoresFetched] = useState(false);

  // get nearby stores
  const fetchFromAPI = useCallback((location, limit = 10) => {
    const storeUrl = `${BASE_URL}/api/nearbyStores?lat=${location.lat}&lng=${location.lng}&limit=${limit}`;

    // check existing stores
    fetch(storeUrl)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Data fetched from API is not an array");
        }

        // fetch successful data
        setStores(data);
        setIsStoresFetched(true);

        const cacheObject = {
          timestamp: Date.now(),
          data,
        };
        localStorage.setItem("nearbyStores", JSON.stringify(cacheObject));
      })
      .catch((error) => {
        console.error("Error fetching data from API:", error);
      });
  }, []);

  // authenticate successful data
  const fetchNearbyStores = useCallback(
    (location) => {
      const storedData = localStorage.getItem("nearbyStores");
      if (!storedData) {
        fetchFromAPI(location);
        return;
      }

      try {
        const cacheObject = JSON.parse(storedData);
        if (
          !cacheObject ||
          !Array.isArray(cacheObject.data) ||
          typeof cacheObject.timestamp !== "number"
        ) {
          throw new Error("Invalid cache format");
        }

        const isExpired = Date.now() - cacheObject.timestamp > CACHE_EXPIRATION;
        if (isExpired) {
          fetchFromAPI(location); 
          return;
        }

        // Use cached data
        setStores(cacheObject.data);
        setIsStoresFetched(true);
      } catch (error) {
        console.error("Error parsing stored data or cache expired:", error);
        fetchFromAPI(location);
      }
    },
    [fetchFromAPI]
  );

  // prevent unnecessary constant api calls
 const debouncedFetchNearbyStores = useMemo(
  () => debounce(fetchNearbyStores, 1000),
  [fetchNearbyStores] 
);

  return {
    stores,
    storesFetched,
    fetchNearbyStores,
    debouncedFetchNearbyStores,
  };
};

export default useNearbyStores;
