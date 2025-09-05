import { useCallback } from "react";
import { createRoot } from "react-dom/client";
import GuitarIcon from "../icons/GuitarIcon.js";
import UserIcon from "../icons/UserIcon.js";
import { customClusterRenderer } from "../utils/customClusterRenderer.js";
import { startTransition } from "react";

const loadClusterer = () =>
  import("@googlemaps/markerclusterer").then((mod) => mod.MarkerClusterer);

const useMarkers = (mapRef, setActiveMarker) => {
  const loadMarkers = useCallback(
    async (stores, currentLocation) => {
      if (!window.google?.maps || !mapRef.current) {
        console.error("Google Maps API is not available.");
        return;
      }

      // Clear markers from previous renders
      if (mapRef.current.markers) {
        mapRef.current.markers.forEach((marker) => marker.setMap(null));
      }

      mapRef.current.markers = [];

      if (!stores || stores.length === 0) return;

      // Create markers for nearby stores
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary(
        "marker"
      );

      const storeMarkers = stores.map((store) => {
        const guitarIcon = document.createElement("div");
        createRoot(guitarIcon).render(<GuitarIcon />);

        // marker placement based on google or MongoDB data
        const position =
          store.source === "google"
            ? store.geometry.location
            : {
                lat: store.location.coordinates[1],
                lng: store.location.coordinates[0],
              }; // MongoDB

        // rewrite into if else ternary sucks

        const marker = new AdvancedMarkerElement({
          position: position,
          title: store.name,
          content: guitarIcon,
        });

        marker.addListener("gmp-click", () => {
          startTransition(() => {
            setActiveMarker(store);
          });
        });
        return marker;
      });

      // Cluster nearby stores
      const MarkerClusterer = await loadClusterer();

      mapRef.current.clusterer = new MarkerClusterer({
        markers: storeMarkers,
        map: mapRef.current,
        renderer: {
          render: customClusterRenderer,
        },
      });

      // User location marker
      const userIcon = document.createElement("div");
      createRoot(userIcon).render(<UserIcon />);

      const userMarker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: currentLocation,
        content: userIcon,
      });

      mapRef.current.markers.push(...storeMarkers, userMarker);
    },
    [mapRef, setActiveMarker]
  );

  return { loadMarkers };
};

export default useMarkers;
