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
