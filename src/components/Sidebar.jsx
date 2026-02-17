import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken } from "../auth/tokenService";
import { isAdmin, isInventoryManager } from "../auth/roleService";
import { logout as logoutService } from "../api/authService";

const Sidebar = () => {
  const navigate = useNavigate();

  const [isAuth, setIsAuth] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [inventoryManager, setInventoryManager] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsAuth(!!token);
    setAdmin(isAdmin());
    setInventoryManager(isInventoryManager());
  }, []);

  const handleLogout = async () => {
    try {
      await logoutService(); // backend logout (optional)
    } catch (e) {
      // ignore backend errors
    } finally {
      navigate("/login");
      window.location.reload(); // reset app state
    }
  };

  if (!isAuth) return null; // hide sidebar when not logged in

  return (
    <div className="sidebar">
      <h1>BioGenHoldings</h1>

      <ul className="nav-links">
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>

        <li>
          <Link to="/sales">Sales</Link>
        </li>

        {(admin || inventoryManager) && (
          <li>
            <Link to="/category">Category</Link>
          </li>
        )}

        {(admin || inventoryManager) && (
          <li>
            <Link to="/product">Product</Link>
          </li>
        )}

        {(admin || inventoryManager) && (
          <li>
            <Link to="/supplier">Supplier</Link>
          </li>
        )}

        <li>
          <Link to="/profile">Profile</Link>
        </li>

        <li>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
