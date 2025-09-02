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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // get nearby stores from google
  const fetchGoogleStoresFromAPI = useCallback(async (location, limit = 10) => {
    const storeUrl = `${BASE_URL}/api/nearbyStores?lat=${location.lat}&lng=${location.lng}&limit=${limit}`;

    try {
      const response = await fetch(storeUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error("Data fetched from API is not an array");
        return [];
      }

      const googleResults = data.map((store) => ({
        ...store,
        source: "google",
      }));

      const cacheObject = {
        timestamp: Date.now(),
        data: googleResults,
      };
      localStorage.setItem("nearbyStores", JSON.stringify(cacheObject));
      return googleResults;
    } catch (error) {
      console.error("Error fetching data from Google API:", error);
      setError(error.message);
      return [];
    }
  }, []);

  // get nearby stores from MongoDB
  const fetchMongoStoresFromAPI = useCallback(
    async (location, maxDistance = 5000) => {
      const mongoStoreUrl = `${BASE_URL}/api/stores/nearby?lat=${location.lat}&lng=${location.lng}&maxDistance=${maxDistance}`;

      try {
        const response = await fetch(mongoStoreUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          console.error("Data fetched from MongoDB API is not an array");
          return [];
        }
        // data source
        return data.map((store) => ({ ...store, source: "mongodb" }));
      } catch (error) {
        console.error("Error fetching data from MongoDB:", error);
        setError(error.message);
        return [];
      }
    },
    []
  );

  // get nearby stores from Google and MongoDB
  const fetchNearbyStores = useCallback(
    async (location) => {
      setLoading(true);
      setError(null);

      let googleResults = [];
      const storedData = localStorage.getItem("nearbyStores");
      if (!storedData) {
        googleResults = await fetchGoogleStoresFromAPI(location);
      } else {
        try {
          const cacheObject = JSON.parse(storedData);
          if (
            !cacheObject ||
            !Array.isArray(cacheObject.data) ||
            typeof cacheObject.timestamp !== "number"
          ) {
            throw new Error("Invalid cache format");
          }

          const isExpired =
            Date.now() - cacheObject.timestamp > CACHE_EXPIRATION;
          if (isExpired) {
            googleResults = await fetchGoogleStoresFromAPI(location);
          } else {
            googleResults = cacheObject.data;
          }
        } catch (error) {
          console.error(
            "Error parsing stored Google data or cache expired:",
            error
          );
          googleResults = await fetchGoogleStoresFromAPI(location);
        }
      }

      const mongoResults = await fetchMongoStoresFromAPI(location);

      const uniqueStores = new Map();

      // Add MongoDB stores first (prevent google overlap)
      mongoResults.forEach((store) => {
        uniqueStores.set(store.placeId, store);
      });

      // Add Google stores if place_id not in uniqueStores
      googleResults.forEach((store) => {
        if (!uniqueStores.has(store.place_id)) {
          uniqueStores.set(store.place_id, store);
        }
      });

      setStores(Array.from(uniqueStores.values()));
      setIsStoresFetched(true);
      setLoading(false); // End combined loading
    },
    [fetchGoogleStoresFromAPI, fetchMongoStoresFromAPI]
  );

  const debouncedFetchNearbyStores = useMemo(
    () => debounce(fetchNearbyStores, 1000),
    [fetchNearbyStores]
  );

  return {
    stores,
    storesFetched,
    fetchNearbyStores,
    debouncedFetchNearbyStores,
    loading,
    error,
  };
};

export default useNearbyStores;
