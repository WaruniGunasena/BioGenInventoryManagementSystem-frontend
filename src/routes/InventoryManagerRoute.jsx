import { Navigate, useLocation } from "react-router-dom";
import { isInventoryManager } from "../auth/roleService";

const InventoryManagerRoute = ({ children }) => {
  const location = useLocation();

  if (!isInventoryManager()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default InventoryManagerRoute;
