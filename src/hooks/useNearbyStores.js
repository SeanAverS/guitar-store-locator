import { useCallback, useMemo, useState } from "react";
import { debounce } from "../utils/debounce.js";
import { fetchData } from "../utils/fetchStoreData.js";

/**
 * A hook to get stores near the users location
 * It provides a loading state for store fetching and error information
 * 
 * @returns {{
 * stores: Array,
 * storesFetched: boolean,
 * fetchNearbyStores: function,
 * debouncedFetchNearbyStores: function,
 * loading: boolean,
 * error: string
 * }} contains the states and functions to handle nearby stores
 */

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
      const data = await fetchData(storeUrl);

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
        const data = await fetchData(mongoStoreUrl);
        
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

  // get already cached stores or call them from API
  const getGoogleStoresFromCacheOrAPI = useCallback(
    async (location) => {
      const storedData = localStorage.getItem("nearbyStores");
      if (!storedData) {
        return await fetchGoogleStoresFromAPI(location);
      }

      // get non-expired stores from cache
      try {
        const cacheObject = JSON.parse(storedData);
        if (
          !cacheObject ||
          !Array.isArray(cacheObject.data) ||
          typeof cacheObject.timestamp !== "number"
        ) {
          throw new Error("Invalid cache format");
        }

        const isCacheExpired =
          Date.now() - cacheObject.timestamp > CACHE_EXPIRATION;
        if (isCacheExpired) {
          return await fetchGoogleStoresFromAPI(location);
        }

        return cacheObject.data;
      } catch (error) {
        console.error("Cache validation failed, fetching new data:", error);
        return await fetchGoogleStoresFromAPI(location);
      }
    },
    [fetchGoogleStoresFromAPI]
  );

  // get nearby stores from Google and MongoDB
  const fetchNearbyStores = useCallback(
    async (location) => {
      setLoading(true);
      setError(null);
      
      const googleResults = await getGoogleStoresFromCacheOrAPI(location);
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
      setLoading(false);
    },
    [fetchMongoStoresFromAPI, getGoogleStoresFromCacheOrAPI]
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
