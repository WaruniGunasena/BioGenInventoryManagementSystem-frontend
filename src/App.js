import React from "react";
import ToastProvider from "./context/ToastProvider";
import { PermissionsProvider } from "./context/PermissionsContext";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./components/Dashboard/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Category from "./pages/Category/Category";
import GRN from "./pages/GRN/GRN";
import SalesReps from "./pages/SalesReps";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees/Employees";
import Stock from "./pages/Stock/Stock";
import Invoices from "./pages/Invoices/Invoices";
import SalesOrder from "./pages/SalesOrder/SalesOrder";
import ComponentsDemo from "./pages/ComponentsDemo";
import SalesInvoices from "./pages/SalesOrder/SalesInvoices";
import Settings from "./pages/Settings/Settings";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AdminStatusProvider, useAdminStatus } from "./context/AdminStatusContext";
import SalesRepOrder from "./pages/SalesOrder/SalesRepOrder";
import EditSalesRepOrder from "./pages/SalesOrder/EditSalesRepOrder";
import CashFlow from "./pages/CashFlow/CashFlow";
import EditSalesOrder from "./pages/SalesOrder/EditSalesOrder";
import Reports from "./pages/Reports/Reports";

/**
 * FirstRunGuard — must live inside <Router> to use useLocation / useNavigate.
 * If no admin exists yet, redirect every route except /register to /register.
 * Returns null while the check is loading (prevents flicker).
 */
const FirstRunGuard = ({ children }) => {
  const { adminExists, loading } = useAdminStatus();
  const { pathname } = useLocation();

  if (loading) return null; // wait silently

  if (adminExists === false && pathname !== "/register") {
    return <Navigate to="/register" replace />;
  }

  return children;
};

function App() {
  return (
    <ToastProvider>
      <PermissionsProvider>
        <AdminStatusProvider>
          <Router>
            <FirstRunGuard>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/product" element={<Products />} />
                <Route path="/supplier" element={<Suppliers />} />
                <Route path="/category" element={<Category />} />
                <Route path="/grn-window" element={<GRN />} />
                <Route path="/salesreps" element={<SalesReps />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/sales-order" element={<SalesOrder />} />
                <Route path="/sales-invoice" element={<SalesRepOrder />} />
                <Route path="/sales-invoices" element={<SalesInvoices />} />
                <Route path="/sales-invoices/edit" element={<EditSalesRepOrder />} />
                <Route path="/sales-invoices/edit-so" element={<EditSalesOrder />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/test-components" element={<ComponentsDemo />} />
                <Route path="/cash-flow" element={<CashFlow />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </FirstRunGuard>
          </Router>
        </AdminStatusProvider>
      </PermissionsProvider>
    </ToastProvider>
  );
}

export default App;
