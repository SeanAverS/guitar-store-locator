import { useCallback } from "react";
import { createRoot } from "react-dom/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonRunning, faGuitar } from "@fortawesome/free-solid-svg-icons";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const useMarkers = (mapRef, setActiveMarker) => {
  const loadMarkers = useCallback(
    async (stores, currentLocation) => {
      if (!window.google?.maps || !mapRef.current) {
        console.error("Google Maps API is not available.");
        return;
      }

      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

      // Clear previous markers
      if (mapRef.current.markers) {
        mapRef.current.markers.forEach((marker) => marker.setMap(null));
      }

      mapRef.current.markers = [];

      // Create marker elements
      const storeMarkers = stores.map((store) => {
        const guitarIcon = document.createElement("div");
        createRoot(guitarIcon).render(
          <FontAwesomeIcon
            icon={faGuitar}
            size="3x"
            style={{
              color: "#007bff",
              cursor: "pointer",
            }}
          />
        );

        const marker = new AdvancedMarkerElement({
          position: store.geometry.location,
          title: store.name,
          content: guitarIcon,
        });

        marker.addListener("gmp-click", () => setActiveMarker(store));
        return marker;
      });

      // Cluster store markers
      const clusterer = new MarkerClusterer({
        markers: storeMarkers,
        map: mapRef.current,
      });

      // User location marker
      const userIcon = document.createElement("div");
      createRoot(userIcon).render(
        <FontAwesomeIcon
          icon={faPersonRunning}
          size="3x"
          style={{ color: "black", cursor: "default" }}
        />
      );

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
