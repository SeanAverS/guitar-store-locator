import { useCallback } from "react";

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
          content: storePin.element,
        });
        marker.addListener("gmp-click", () => setActiveMarker(store));
        return marker;
      });

      const pinBackground = new PinElement({
        background: "#87CEEB",
        borderColor: "#87CEEB",
        glyphColor: "white",
        scale: 1.3,
      });

      const userMarker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: currentLocation,
        title: "Your Location",
        content: pinBackground.element,
      });

      mapRef.current.markers.push(...storeMarkers, userMarker);
    },
    [mapRef, setActiveMarker]
  );

  return { loadMarkers };
};

export default useMarkers;
