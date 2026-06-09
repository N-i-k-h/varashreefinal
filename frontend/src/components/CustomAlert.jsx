import React, { useEffect } from "react";
import "./CustomAlert.css";

export default function CustomAlert({ message, type, onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    if (type === "success") return "bi-check-circle-fill";
    if (type === "danger" || type === "error") return "bi-exclamation-triangle-fill";
    return "bi-info-circle-fill";
  };

  const alertClass = type === "success" ? "custom-alert-success" : "custom-alert-danger";

  return (
    <div className={`custom-alert-container ${alertClass}`}>
      <div className="custom-alert-content">
        <i className={`bi ${getIcon()} custom-alert-icon`}></i>
        <span className="custom-alert-message">{message}</span>
      </div>
      <button type="button" className="custom-alert-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
