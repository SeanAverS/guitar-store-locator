import { useCallback, useMemo, useState } from "react";
import { debounce } from "lodash";

const useNearbyStores = () => {
  const [stores, setStores] = useState([]);
  const [storesFetched, setIsStoresFetched] = useState(false);

  const fetchFromAPI = useCallback((location, limit = 10) => {
    const url = `http://localhost:5000/api/nearbyStores?lat=${location.lat}&lng=${location.lng}&limit=${limit}`;

    fetch(url)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setStores(data); // guitar stores 
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
            setStores(parsedData); // guitar stores 
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
