import { useCallback, useMemo, useState } from "react";
import { debounce } from "lodash";

const useNearbyStores = () => {
  const [stores, setStores] = useState([]);
  const [storesFetched, setIsStoresFetched] = useState(false);

  const fetchFromAPI = useCallback((location, limit = 10) => {
    const storeUrl = `http://localhost:5000/api/nearbyStores?lat=${location.lat}&lng=${location.lng}&limit=${limit}`;

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

        setStores(data);
        setIsStoresFetched(true);
        localStorage.setItem("nearbyStores", JSON.stringify(data));
      })
      .catch((error) => {
        console.error("Error fetching data from API:", error);
      });
  }, []);

 const fetchNearbyStores = useCallback(
  (location) => {
    const storedData = localStorage.getItem("nearbyStores");
    if (!storedData) {
      fetchFromAPI(location);
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      if (!Array.isArray(parsedData)) {
        throw new Error("Stored data is not an array");
      }

      setStores(parsedData); // guitar stores 
      setIsStoresFetched(true);
    } catch (error) {
      console.error("Error parsing stored data:", error);
      fetchFromAPI(location);
    }
  },
  [fetchFromAPI]
);

  const debouncedFetchNearbyStores = useMemo(
    () => // prevent constant api calls 
      debounce((location) => {
        fetchNearbyStores(location);
      }, 1000),
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
