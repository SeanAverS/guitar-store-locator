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

      // clustering styling for nearby stores 
      const customClusterRenderer = ({ count, position }) => {
        const div = document.createElement("div");

        div.style.background = "#007bff";
        div.style.color = "#fff";
        div.style.borderRadius = "50%";
        div.style.padding = "10px";
        div.style.width = "10px";
        div.style.height = "10px";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";

        div.textContent = count;

        return new window.google.maps.marker.AdvancedMarkerElement({
          position,
          content: div,
        });
      };

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
