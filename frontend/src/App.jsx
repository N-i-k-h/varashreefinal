import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PlantCatalog from "./components/PlantCatalog";
import AddPlant from "./components/AddPlant";
import ManagePlants from "./components/ManagePlants";
import CreateOrder from "./components/CreateOrder";
import Reports from "./components/Reports";
import Login from "./components/Login";
import EditPlant from "./components/EditPlant";
import CreateEstimation from "./components/CreateEstimation";
import PurchaseDashboard from "./components/PurchaseDashboard";
import BalanceManagement from "./components/BalanceManagement";
import AdvanceOrders from "./components/AdvanceOrders";
import CreateAdvanceOrder from "./components/CreateAdvanceOrder";

export default function App() {
  const [user, setUser] = useState(null);

  // Sidebar open/close for mobile responsiveness
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (err) {
      console.error("⚠️ Failed to parse user:", err);
      localStorage.removeItem("user");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <BrowserRouter>
      {user ? (
        <div className="d-block d-md-flex" style={{ minHeight: "100vh" }}>

          {/* 🔥 Responsive Sidebar */}
          <Sidebar open={sidebarOpen} toggleSidebar={setSidebarOpen} />

          {/* MAIN CONTENT */}
          <main className="flex-grow-1 bg-light">

            {/* Top Bar */}
            <div className="d-flex justify-content-between align-items-center p-3 bg-white shadow-sm">

              {/* 🔥 Show hamburger on mobile */}
              <button
                className="btn btn-outline-primary d-md-none"
                onClick={() => setSidebarOpen(true)}
              >
                <i className="bi bi-list fs-3"></i>
              </button>

              {/* Brand Name - Centered */}
              <h4 className="m-0 fw-bold flex-grow-1 text-center" style={{ letterSpacing: "1px" }}>
                VARASHREE
              </h4>

              <button
                className="btn btn-outline-danger btn-sm ms-auto"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            <div className="p-3 p-md-4">

              {/* Routes with sidebar toggle passed to Dashboard */}
              <Routes>
                <Route path="/" element={<Dashboard toggleSidebar={setSidebarOpen} />} />
                <Route path="/plants" element={<PlantCatalog />} />
                <Route path="/plants/add" element={<AddPlant />} />
                <Route path="/plants/manage" element={<ManagePlants />} />
                <Route path="/orders/create" element={<CreateOrder />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/plants/edit/:id" element={<EditPlant />} />
                <Route path="/estimations/create" element={<CreateEstimation />} />
                <Route path="/purchases" element={<PurchaseDashboard />} />
                <Route path="/balances" element={<BalanceManagement />} />
                <Route path="/advances" element={<AdvanceOrders />} />
                <Route path="/advances/create" element={<CreateAdvanceOrder />} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>

            </div>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="*" element={<Login setUser={setUser} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
