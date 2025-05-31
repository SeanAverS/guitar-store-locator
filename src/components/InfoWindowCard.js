import React, { useCallback, useState } from 'react';

const isDev = window.location.hostname === "localhost";
const BASE_URL = isDev
  ? "http://localhost:5000"
  : "https://guitar-store-locator.onrender.com";

const InfoWindowCard = ({ marker, onClose, directionsUrl }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // store in mongoDB 
  const handleSaveStore = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const placeId = marker.place_id || marker.placeId;
      const name = marker.name;
      const address = marker.vicinity || marker.address;
      const phone = marker.formatted_phone_number || marker.phone;
      const website = marker.website;

      let latitude, longitude;
      if (marker.source === 'google') {
        latitude = marker.geometry.location.lat;
        longitude = marker.geometry.location.lng;
      } else if (marker.source === 'mongodb') {
        latitude = marker.location.coordinates[1];
        longitude = marker.location.coordinates[0];
      } else {
         if (marker.geometry && marker.geometry.location) {
            latitude = marker.geometry.location.lat;
            longitude = marker.geometry.location.lng;
         } else {
            console.error("Could not determine coordinates for saving.");
            setSaveMessage('Error: Could not determine store location.');
            setIsSaving(false);
            return;
         }
      }

      const postData = {
        placeId,
        name,
        address,
        phone,
        website,
        latitude,
        longitude,
      };

      const response = await fetch(`${BASE_URL}/api/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Store saved successfully:', data);
      setSaveMessage('Store saved successfully!');
    } catch (error) {
      console.error('Error saving store:', error);
      if (error.message.includes('Store with this Place ID already exists')) { 
        setSaveMessage('This store is already saved!');
      } else {
        setSaveMessage(`Failed to save store: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [marker]);

  const showSaveButton = marker.source === 'google';

  return (
    <div className="info-window">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h3>{marker.name}</h3>
      <p>{marker.vicinity || marker.address || "No address available"}</p>
      {marker.opening_hours?.open_now !== undefined && (
        <p>
          <strong>Open?</strong>{" "}
          {marker.opening_hours.open_now ? "Yes" : "No"}
        </p>
      )}
      {marker.phone && <p>Phone: {marker.phone}</p>}
      {marker.website && <p><a href={marker.website} target="_blank" rel="noopener noreferrer">Website</a></p>}

      <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
        Directions
      </a>

      {showSaveButton && (
        <div>
          <button onClick={handleSaveStore} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save to My Stores'}
          </button>
          {saveMessage && <p className="save-message">{saveMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default InfoWindowCard;