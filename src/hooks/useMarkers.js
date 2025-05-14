import { useCallback } from "react";
import { createRoot } from "react-dom/client";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import GuitarIcon from "../icons/GuitarIcon.js";
import UserIcon from "../icons/UserIcon.js";
import { customClusterRenderer } from "../utils/customClusterRenderer.js";

const useMarkers = (mapRef, setActiveMarker) => {
  const loadMarkers = useCallback(
    async (stores, currentLocation) => {
      if (!window.google?.maps || !mapRef.current) {
        console.error("Google Maps API is not available.");
        return;
      }

      // prevent multiple clusters from rendering 
      if (mapRef.current.clusterer) {
        mapRef.current.clusterer.clearMarkers();
      }

      const { AdvancedMarkerElement } = await window.google.maps.importLibrary(
        "marker"
      );

      // Clear previous markers
      if (mapRef.current.markers) {
        mapRef.current.markers.forEach((marker) => marker.setMap(null));
      }

      mapRef.current.markers = [];

      // Early return for no nearby stores 
       if (!stores || stores.length === 0) return;

      // Create markers for nearby stores 
      const storeMarkers = stores.map((store) => {
        const guitarIcon = document.createElement("div");
        createRoot(guitarIcon).render(<GuitarIcon/>);

        const marker = new AdvancedMarkerElement({
          position: store.geometry.location,
          title: store.name,
          content: guitarIcon,
        });

        marker.addListener("gmp-click", () => setActiveMarker(store));
        return marker;
      });

      // Cluster nearby stores 
      mapRef.current.clusterer = new MarkerClusterer({
        markers: storeMarkers,
        map: mapRef.current,
        renderer: {
          render: customClusterRenderer,
        },
      });

      // User location marker
      const userIcon = document.createElement("div");
      createRoot(userIcon).render(<UserIcon/>);

      const userMarker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: currentLocation,
        title: "Your Location",
        content: userIcon,
      });

      mapRef.current.markers.push(...storeMarkers, userMarker);
    },
    [mapRef, setActiveMarker]
  );

  return { loadMarkers };
};

export default useMarkers;
