import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonRunning } from "@fortawesome/free-solid-svg-icons";

const UserIcon = () => (
  <FontAwesomeIcon
    icon={faPersonRunning}
    size="3x"
    style={{ color: "black", cursor: "default" }}
  />
);

export default UserIcon;
