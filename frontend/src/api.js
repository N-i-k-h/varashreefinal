import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// FIXED INTERCEPTOR 🔥
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // ❌ Do NOT add Authorization for login/register
  if (
    config.url.includes("/auth/login") ||
    config.url.includes("/auth/register")
  ) {
    return config;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
