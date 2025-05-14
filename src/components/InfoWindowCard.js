const InfoWindowCard = ({ marker, onClose, directionsUrl }) => {
  return (
    <div className="info-window">
      <button className="close-btn" onClick={onClose}>×</button>
      <h3>{marker.name}</h3>
      <p>{marker.vicinity || "No address available"}</p>
      {marker.opening_hours?.open_now !== undefined && (
        <p>
          <strong>Store Status:</strong>{" "}
          {marker.opening_hours.open_now ? "Open" : "Closed"}
        </p>
      )}
      <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
        Directions
      </a>
    </div>
  );
};

export default InfoWindowCard;
