import { useCallback } from "react";
import { createRoot } from "react-dom/client";
import GuitarIcon from "../icons/GuitarIcon.js";
import UserIcon from "../icons/UserIcon.js";
import { customClusterRenderer } from "../utils/customClusterRenderer.js";
import { startTransition } from "react";


/**
 * A hook to generate user and store markers on the map
 * @param {object} mapRef - keep track of the current maps state
 * @param {function} setActiveMarker - handle the state and information of the store being currently clicked
 * @returns {{
 * loadMarkers: function
 * }} An object containing the function that displays all markers on the map
 */

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

        // use google or MongoDB data for store location
        let position;

        if (store.source === "google") {
          position = store.geometry.location;
        } else { 
          position = {
            lat: store.location.coordinates[1],
            lng: store.location.coordinates[0],
          };
        }

        const marker = new AdvancedMarkerElement({
          position: position,
          title: store.name,
          content: guitarIcon,
        });

        // prevent repeat renders of store info
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
