import React from "react";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./components/Dashboard/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Category from "./pages/Category/Category";
import GRN from "./pages/GRN/GRN";
import SalesReps from "./pages/SalesReps";
import Customers from "./pages/Customers";
import ComponentsDemo from "./pages/ComponentsDemo";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/product" element={<Products />} />
        <Route path="/supplier" element={<Suppliers />} />
        <Route path="/category" element={<Category />} />
        <Route path="/grn-window" element={<GRN />} />
        <Route path="/salesreps" element={<SalesReps />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/test-components" element={<ComponentsDemo />} />
      </Routes>
    </Router>
  );
}

export default App;
