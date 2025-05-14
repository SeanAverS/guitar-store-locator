import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGuitar } from "@fortawesome/free-solid-svg-icons";

const GuitarIcon = () => (
  <FontAwesomeIcon
    icon={faGuitar}
    size="3x"
    style={{
      color: "#007bff",
      cursor: "pointer",
    }}
  />
);

export default GuitarIcon;
