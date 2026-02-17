import { Navigate, useLocation } from "react-router-dom";
import { isAdmin } from "../auth/roleService";

const AdminRoute = ({ children }) => {
  const location = useLocation();

  if (!isAdmin()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default AdminRoute;
