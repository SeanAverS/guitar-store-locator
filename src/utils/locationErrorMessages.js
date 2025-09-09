/**
 * Returns a specific message based on the Geolocation API's error code.
 * @param {number} errorCode - The error code provided by the Geolocation API.
 * @returns {string} A user-friendly error message.
 * // GeolocationPositionErrors commented out to not rely on window object
 */
export const getLocationErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 1: // GeolocationPositionError.PERMISSION_DENIED
      return "Location access denied. Please enable your location in the browser.";
    case 2: // GeolocationPositionError.POSITION_UNAVAILABLE
      return "Your location information is unavailable. Please check device settings.";
    case 3: // GeolocationPositionError.TIMEOUT
      return "Timed out while trying to retrieve your location. Please try again.";
    default:
      return "An unknown error occurred while trying to get your location.";
  }
};