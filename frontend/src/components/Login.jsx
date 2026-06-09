import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", { email, password });

      console.log("✅ Backend response:", res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
        })
      );
      setUser({
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
      });
      navigate("/");
    } catch (err) {
      console.error("❌ Login request failed:", err);
      const message =
        err?.response?.data?.error || "Invalid email or password";
      setError(message);
    }
  };

  return (
    <div className="row g-0 vh-100 w-100 overflow-hidden m-0 position-relative">

      {/* GLOBAL BACKGROUND VIDEO - Visible on Mobile Only */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover p-0 d-md-none"
        style={{ zIndex: -1 }}
      >
        <source src="/login_bg.mp4" type="video/mp4" />
      </video>

      {/* LEFT SIDE: Welcome Text & specific Desktop Video (60%) */}
      <div className="col-md-7 col-lg-7 p-0 position-relative d-none d-md-flex align-items-center justify-content-center overflow-hidden">

        {/* Desktop-Only Video confined to Left Side */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
          style={{ zIndex: 0 }}
        >
          <source src="/login_bg.mp4" type="video/mp4" />
        </video>

        {/* Text Overlay */}
        <div className="px-5 text-white position-relative" style={{ zIndex: 1 }}>
          <div className="fw-bold display-4 mb-3" style={{ color: "white", textShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
            Welcome back to
          </div>
          <div className="fw-light display-5" style={{ color: "white", textShadow: "0 4px 15px rgba(0,0,0,0.8)" }}>
            Varashree Nursery<br />and Farming
          </div>
          <p className="mt-4 lead" style={{ color: "white", maxWidth: "500px", opacity: 0.9, textShadow: "0 2px 5px rgba(0,0,0,0.8)" }}>
            Access your dashboard to manage orders, track inventory, and grow your business efficiently.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form (40%) */}
      <div className="col-12 col-md-5 col-lg-5 d-flex flex-column align-items-center justify-content-center p-4 p-md-5 position-relative" style={{ zIndex: 10 }}>

        {/* Desktop-Only White Background Layer (Restored) */}
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-white d-none d-md-block" style={{ zIndex: -1 }}></div>

        {/* Responsive Styles for Desktop White Theme vs Mobile Glass Theme */}
        <style>
          {`
            @media (min-width: 768px) {
              .responsive-card {
                background: white !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
              }
              .responsive-title {
                color: #212529 !important;
                text-shadow: none !important;
              }
              .responsive-input {
                background: #f8f9fa !important;
                color: #333 !important;
              }
            }
          `}
        </style>

        {/* Mobile-Only Header */}
        <div className="d-block d-md-none text-center mb-4">
          <h1 className="fw-bold display-4" style={{ color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
            VARASHREE
          </h1>
        </div>

        {/* Login Card - Glass on Mobile, White on Desktop */}
        <div className="w-100 p-4 responsive-card"
          style={{
            maxWidth: "420px",
            background: "rgba(255, 255, 255, 0.1)", // Default (Mobile) Glass
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            border: "2px solid #2e8b57"
          }}>

          <div className="text-center mb-5">
            <h3 className="fw-bold text-white responsive-title" style={{ letterSpacing: "1px", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>USER LOGIN</h3>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email Input */}
            <div className="mb-4 position-relative">
              <input
                type="email"
                className="form-control responsive-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  background: "rgba(255, 255, 255, 0.5)", // Default (Mobile) Glass
                  border: "2px solid #2e8b57",
                  borderRadius: "50px",
                  padding: "15px 20px",
                  paddingLeft: "50px",
                  color: "#333",
                  fontWeight: "500",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              />
              <span className="position-absolute" style={{ left: "20px", top: "50%", transform: "translateY(-50%)", color: "#2e8b57" }}>
                <i className="bi bi-person fs-5"></i>
              </span>
            </div>

            {/* Password Input */}
            <div className="mb-4 position-relative">
              <input
                type="password"
                className="form-control responsive-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  background: "rgba(255, 255, 255, 0.5)", // Default (Mobile) Glass
                  border: "2px solid #2e8b57",
                  borderRadius: "50px",
                  padding: "15px 20px",
                  paddingLeft: "50px",
                  color: "#333",
                  fontWeight: "500",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              />
              <span className="position-absolute" style={{ left: "20px", top: "50%", transform: "translateY(-50%)", color: "#2e8b57" }}>
                <i className="bi bi-lock fs-5"></i>
              </span>
            </div>

            {error && (
              <div className="alert alert-danger py-2 mb-4 rounded-pill text-center small border-0 bg-danger-subtle text-danger">
                {error}
              </div>
            )}

            <button
              className="btn w-100 fw-bold shadow-sm"
              style={{
                background: "#2e8b57", // Sea Green
                border: "none",
                borderRadius: "50px",
                padding: "14px",
                color: "white",
                fontSize: "16px",
                letterSpacing: "1px",
                boxShadow: "0 4px 15px rgba(46, 139, 87, 0.4)"
              }}
            >
              LOGIN
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}
