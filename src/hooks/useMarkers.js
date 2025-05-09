import { useCallback } from "react";
import ReactDOM from 'react-dom'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGuitar } from '@fortawesome/free-solid-svg-icons';

const useMarkers = (mapRef, setActiveMarker) => {
  const loadMarkers = useCallback(
    async (stores, currentLocation) => {
      // nearby stores and user location
      if (!window.google?.maps || !mapRef.current) {
        console.error("Google Maps API is not available.");
        return;
      }

      const { AdvancedMarkerElement, PinElement } =
        await window.google.maps.importLibrary("marker"); 

      // load advanced markers
      if (mapRef.current.markers) {
        mapRef.current.markers?.forEach((marker) => marker.setMap(null));
      }

      mapRef.current.markers = [];

      const storeMarkers = stores.map((store) => {
        const guitarIcon = document.createElement("div");
        ReactDOM.render(
          <FontAwesomeIcon
            icon={faGuitar}
            size="3x"          
            style={{
              color: '#007bff', 
              cursor: 'pointer',
            }}
          />,
          guitarIcon
        );

        const storePin = new PinElement({
          background: "#007bff",
          borderColor: "#007bff",
          glyphColor: "#ffffff", 
          scale: 1,
        });
        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: store.geometry.location,
          title: store.name,
          content: guitarIcon,
        });
        marker.addListener("gmp-click", () => setActiveMarker(store));
        return marker;
      });

      const userPin = new PinElement({
        background: "#87CEEB",
        borderColor: "#87CEEB",
        glyphColor: "white",
        scale: 1.3,
      });

      const userMarker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: currentLocation,
        title: "Your Location",
        content: userPin.element,
      });

      mapRef.current.markers.push(...storeMarkers, userMarker);
    },
    [mapRef, setActiveMarker]
  );

  return { loadMarkers };
};

export default useMarkers;
