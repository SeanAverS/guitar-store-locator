import { GoogleMap } from "@react-google-maps/api";

const MapContainer = ({ mapRef, currentLocation, defaultCenter, children }) => (
  <GoogleMap
    mapContainerClassName="map-container"
    center={currentLocation || defaultCenter}
    zoom={12}
    onLoad={(map) => {
      mapRef.current = map;
      mapRef.current.markers = [];
    }}
    onUnmount={() => (mapRef.current = null)}
    options={{
      mapId: process.env.REACT_APP_MAP_ID,
      mapTypeId: "roadmap",
    }}
  >
    {children}
  </GoogleMap>
);

export default MapContainer;
