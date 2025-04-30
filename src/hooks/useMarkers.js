import { useCallback } from "react";

const useMarkers = (mapRef, setActiveMarker) => {
  const loadStoreMarkers = useCallback(
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
        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: store.geometry.location,
          title: store.name,
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

  return { loadStoreMarkers };
};

export default useMarkers;
