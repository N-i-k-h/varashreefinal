import React, { useEffect, useState } from "react";
import API from "../api";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./Dashboard.css"; // Import Custom Styles

const getStatValueStyle = (value) => {
  const len = String(value).length;
  if (len > 15) return { fontSize: "1.35rem" };
  if (len > 11) return { fontSize: "1.65rem" };
  if (len > 8) return { fontSize: "1.95rem" };
  return {};
};

export default function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plantsRes, ordersRes] = await Promise.all([
          API.get("/plants"),
          API.get("/orders"),
        ]);
        setPlants(plantsRes.data);
        setOrders(ordersRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate revenue: Only add if balance is 0 (fully paid)
  // Or stick to total grand total logic depending on business rule.
  // Assuming revenue = all orders value for now or filtered by payment status if available.
  const totalRevenue = orders.reduce((s, o) => {
    // If balanceAmount is missing, assume 0 (for old orders)
    const balance = o.balanceAmount !== undefined ? o.balanceAmount : 0;
    // Revenue logic: Only fully paid? Or all sales? Let's assume all Sales for Dashboard display
    return s + (o.grandTotal || 0);
  }, 0);

  const totalStock = plants.reduce((s, p) => s + (p.stock || 0), 0);
  const lowStockPlants = plants.filter((p) => p.stock <= 5);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-border text-success" style={{ width: "3rem", height: "3rem" }} />
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-sm-4 mt-4 dashboard-container">

      {/* HEADER */}
      <h2 className="dashboard-header">
        <i className="bi bi-speedometer2 me-2"></i> Dashboard Overview
      </h2>

      {/* ===================== STATS ===================== */}
      <div className="row g-4 mb-5">

        {/* TOTAL PLANTS */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card card-gradient-teal h-100" style={{ animation: "slideInUp 0.3s ease-out" }}>
            <div className="card-body">
              <div className="d-flex flex-column">
                <small className="text-white text-uppercase fw-bold mb-1">Total Plants</small>
                <h2 className="fw-bold mb-0 text-white stat-card-value" style={getStatValueStyle(plants.length)}>{plants.length}</h2>
              </div>
              <i className="bi bi-flower1 stat-icon-bg"></i>
            </div>
          </div>
        </div>

        {/* TOTAL STOCK */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card card-gradient-purple h-100" style={{ animation: "slideInUp 0.4s ease-out" }}>
            <div className="card-body">
              <div className="d-flex flex-column">
                <small className="text-white text-uppercase fw-bold mb-1">Total Stock</small>
                <h2 className="fw-bold mb-0 text-white stat-card-value" style={getStatValueStyle(totalStock)}>{totalStock}</h2>
              </div>
              <i className="bi bi-boxes stat-icon-bg"></i>
            </div>
          </div>
        </div>

        {/* TOTAL ORDERS */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card card-gradient-orange h-100" style={{ animation: "slideInUp 0.5s ease-out" }}>
            <div className="card-body">
              <div className="d-flex flex-column">
                <small className="text-white text-uppercase fw-bold mb-1">Total Orders</small>
                <h2 className="fw-bold mb-0 text-white stat-card-value" style={getStatValueStyle(orders.length)}>{orders.length}</h2>
              </div>
              <i className="bi bi-cart-check stat-icon-bg"></i>
            </div>
          </div>
        </div>

        {/* TOTAL REVENUE */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card card-gradient-green h-100" style={{ animation: "slideInUp 0.6s ease-out" }}>
            <div className="card-body">
              <div className="d-flex flex-column">
                <small className="text-white text-uppercase fw-bold mb-1">Total Revenue</small>
                <h2 className="fw-bold mb-0 text-white stat-card-value" style={getStatValueStyle(`₹${totalRevenue.toLocaleString('en-IN')}`)}>₹{totalRevenue.toLocaleString('en-IN')}</h2>
              </div>
              <i className="bi bi-currency-rupee stat-icon-bg"></i>
            </div>
          </div>
        </div>

      </div>

      {/* ===================== PANELS ===================== */}
      <div className="row g-4">

        {/* LOW STOCK ALERT */}
        <div className="col-12 col-lg-6">
          <div className="panel-card panel-danger bg-white h-100">
            <div className="panel-header text-danger">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <span>Low Stock Alerts</span>
            </div>
            <ul className="list-group list-group-flush list-custom">
              {lowStockPlants.length > 0 ? (
                lowStockPlants.map((p) => (
                  <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="fw-medium">{p.plantName}</span>
                    <span className="badge bg-danger rounded-pill px-3">{p.stock} left</span>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-center text-muted py-4">
                  <i className="bi bi-check-circle text-success fs-3 d-block mb-2"></i>
                  All stocks are healthy!
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="col-12 col-lg-6">
          <div className="panel-card panel-success bg-white h-100">
            <div className="panel-header text-success">
              <i className="bi bi-clock-history me-2 fs-5"></i>
              <span>Recent Orders</span>
            </div>
            <ul className="list-group list-group-flush list-custom">
              {orders.length > 0 ? (
                orders.slice(0, 5).map((o) => (
                  <li key={o.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark">{o.customerName || "Walk-in Customer"}</div>
                      <div className="text-muted small">ID: {o.orderNo}</div>
                    </div>
                    <span className="fw-bold text-success">
                      ₹{o.grandTotal?.toLocaleString('en-IN')}
                    </span>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-center text-muted py-4">
                  No orders yet.
                </li>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
