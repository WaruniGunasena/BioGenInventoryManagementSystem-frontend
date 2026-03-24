import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getToken } from "../auth/tokenService";
import { isAdmin, isInventoryManager, isSalesRep } from "../auth/roleService";
import { logout as logoutService } from "../api/authService";
import { getPendingOrderCount } from "../api/salesOrderService";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CheckSquare,
  Box,
  UserCheck,
  User,
  UserRound,
  Layers,
  LifeBuoy,
  Settings,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  FileText,
  TrendingUp
} from "lucide-react";
import "./Sidebar.css";
import { getUserName, getUserRole } from "./common/Utils/userUtils/userUtils";

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuth, setIsAuth] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [inventoryManager, setInventoryManager] = useState(false);
  const [salesRep, setSalesRep] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loggedInUserRole, setLoggedInUserRole] = useState('');
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  const fetchUserInfo = async () => {
    const name = await getUserName();
    const role = await getUserRole();
    setLoggedInUser(name);
    setLoggedInUserRole(role);
  };

  const fetchPendingCount = async () => {
    try {
      const res = await getPendingOrderCount();
      setPendingOrderCount(res.data || 0);
    } catch (e) {
      console.error("Failed to fetch pending order count", e);
    }
  };

  useEffect(() => {
    const token = getToken();
    setIsAuth(!!token);
    
    const isAdminUser = isAdmin();
    const isInvManager = isInventoryManager();
    const isSalesUser = isSalesRep();
    
    setAdmin(isAdminUser);
    setInventoryManager(isInvManager);
    setSalesRep(isSalesUser);
    
    fetchUserInfo();

    if (token && (isAdminUser || isInvManager)) {
      fetchPendingCount();

      const handleInvoiceUpdate = () => fetchPendingCount();
      window.addEventListener("invoiceStatusChanged", handleInvoiceUpdate);
      return () => window.removeEventListener("invoiceStatusChanged", handleInvoiceUpdate);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logoutService();
    } catch (e) {
      // ignore
    } finally {
      navigate("/login");
      window.location.reload();
    }
  };

  if (!isAuth) return null;

  const isActive = (path) => location.pathname === path;

  const mobileOverlay = isMobileOpen ? (
    <div className="sidebar-overlay active" onClick={toggleMobileSidebar}></div>
  ) : null;

  return (
    <>
      <button className="mobile-toggle" onClick={toggleMobileSidebar}>
        <Menu size={24} />
      </button>

      {mobileOverlay}

      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h1>BioGenHoldings</h1>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <div className="sidebar-search">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input type="text" placeholder="Search" className="search-input" />
          </div>
        </div>

        <ul className="nav-links">
          <li className="nav-item">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <LayoutDashboard size={20} className="nav-icon" />
              <span className="link-text">Overview</span>
            </Link>
          </li>

          {(admin || inventoryManager || salesRep) && (
            <li className="nav-item">
              <Link to="/product" className={`nav-link ${isActive('/product') ? 'active' : ''}`}>
                <ShoppingCart size={20} className="nav-icon" />
                <span className="link-text">Products</span>
              </Link>
            </li>
          )}

          {(admin || inventoryManager) && (
            <li className="nav-item">
              <Link to="/supplier" className={`nav-link ${isActive('/supplier') ? 'active' : ''}`}>
                <Users size={20} className="nav-icon" />
                <span className="link-text">Suppliers</span>
              </Link>
            </li>
          )}

          {(admin || inventoryManager || salesRep) && (
            <li className="nav-item">
              <Link to="/category" className={`nav-link ${isActive('/category') ? 'active' : ''}`}>
                <CheckSquare size={20} className="nav-icon" />
                <span className="link-text">Category</span>
              </Link>
            </li>
          )}

          {(admin || inventoryManager) && (
            <li className="nav-item">
              <Link to="/grn-window" className={`nav-link ${isActive('/grn-window') ? 'active' : ''}`}>
                <Box size={20} className="nav-icon" />
                <span className="link-text">GRN Window</span>
              </Link>
            </li>
          )}

          {(admin || inventoryManager || salesRep) && (
            <li className="nav-item">
              <Link to="/stock" className={`nav-link ${isActive('/stock') ? 'active' : ''}`}>
                <Layers size={20} className="nav-icon" />
                <span className="link-text">Stock</span>
              </Link>
            </li>
          )}

          {/* {(admin || inventoryManager) && (
            <li className="nav-item">
              <Link to="/invoices" className={`nav-link ${isActive('/invoices') ? 'active' : ''}`}>
                <FileText size={20} className="nav-icon" />
                <span className="link-text">Invoices</span>
              </Link>
            </li>
          )} */}

          {/* <li className="nav-item">
            <Link to="/salesreps" className={`nav-link ${isActive('/salesreps') ? 'active' : ''}`}>
              <UserCheck size={20} className="nav-icon" />
              <span className="link-text">SalesReps</span>
            </Link>
          </li> */}

          {(admin || inventoryManager) && (
            <li className="nav-item">
              <Link to="/sales-order" className={`nav-link ${isActive('/sales-order') ? 'active' : ''}`}>
                <ShoppingCart size={20} className="nav-icon" />
                <span className="link-text">Sales Invoice</span>
              </Link>
            </li>
          )}

          {salesRep && (
            <li className="nav-item">
              <Link to="/sales-invoice" className={`nav-link ${isActive('/sales-invoice') ? 'active' : ''}`}>
                <UserCheck size={20} className="nav-icon" />
                <span className="link-text">Sales Order</span>
              </Link>
            </li>
          )}

          {(admin || inventoryManager || salesRep) && (
            <li className="nav-item">
              <Link to="/sales-invoices" className={`nav-link ${isActive('/sales-invoices') ? 'active' : ''}`}>
                <FileText size={20} className="nav-icon" />
                <span className="link-text">Invoices List</span>
                {(admin || inventoryManager) && pendingOrderCount > 0 && (
                  <span className="notification-bubble">{pendingOrderCount}</span>
                )}
              </Link>
            </li>
          )}

          {(admin || salesRep) && (<li className="nav-item">
            <Link to="/customers" className={`nav-link ${isActive('/customers') ? 'active' : ''}`}>
              <User size={20} className="nav-icon" />
              <span className="link-text">Customers</span>
            </Link>
          </li>)}

          {admin && (
            <li className="nav-item">
              <Link to="/employees" className={`nav-link ${isActive('/employees') ? 'active' : ''}`}>
                <UserRound size={20} className="nav-icon" />
                <span className="link-text">Employees</span>
              </Link>
            </li>
          )}

          {admin && <li className="nav-item">
            <Link to="/roles" className={`nav-link ${isActive('/roles') ? 'active' : ''}`}>
              <Layers size={20} className="nav-icon" />
              <span className="link-text">Roles</span>
            </Link>
          </li>}

          {admin && <li className="nav-item">
            <Link to="/cash-flow" className={`nav-link ${isActive('/cash-flow') ? 'active' : ''}`}>
              <TrendingUp size={20} className="nav-icon" />
              <span className="link-text">Cash Flow</span>
            </Link>
          </li>}

          <div style={{ flex: 1 }}></div>

          <li className="nav-item">
            <Link to="/support" className={`nav-link ${isActive('/support') ? 'active' : ''}`}>
              <LifeBuoy size={20} className="nav-icon" />
              <span className="link-text">Support</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
              <Settings size={20} className="nav-icon" />
              <span className="link-text">Settings</span>
            </Link>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-info">
            <img src={`https://ui-avatars.com/api/?name=${loggedInUser}&background=random`} alt="User" className="avatar" />
            <div className="user-details">
              <span className="user-name">{loggedInUser}</span>
              <span className="user-role">{loggedInUserRole}</span>
            </div>
          </div>
          <LogOut size={20} className="logout-icon" onClick={handleLogout} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
