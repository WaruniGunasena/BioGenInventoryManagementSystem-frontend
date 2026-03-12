import React from "react";
import ToastProvider from "./context/ToastProvider";

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
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <ToastProvider>
      <Router>
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
          <Route path="/sales-invoices" element={<SalesInvoices />} />
          <Route path="/test-components" element={<ComponentsDemo />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
