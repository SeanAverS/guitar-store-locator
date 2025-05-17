import { GoogleMap } from "@react-google-maps/api";

const MapContainer = ({ mapRef, currentLocation, defaultCenter, children }) => {
  return (
    <div data-testid="google-map"> 
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
    </div>
  );
};

export default MapContainer;
