import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light bg-success p-3">
      <span className="navbar-brand text-white">🌱 Nursery Dashboard</span>
      <button className="btn btn-outline-light" onClick={logout}>
        Logout
      </button>
    </nav>
  );
}
