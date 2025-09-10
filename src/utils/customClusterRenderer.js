/**
 * Renders a custom marker cluster for the Google Maps Marker Clustering library
 * This is used to fix overlapping store markers when zooming in or out.
 * @param {object} { count, position } - cluster properties.
 * @returns {google.maps.marker.AdvancedMarkerElement} A custom marker.
 */
export const customClusterRenderer = ({ count, position }) => {
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
